const express = require("express");
const router = express.Router();
const db = require("../db");
const { getIO } = require("../socket");

// GET all car retrieval requests JOINED with parked cars for extra info
router.get("/api/retrieve", (req, res) => {
  db.query(
    `SELECT
      req.*,
      pc.basement_number,
      pc.lot_number,
      pc.valet,
      pc.time_taken
    FROM car_retrieval_requests req
    LEFT JOIN parked_cars pc
      ON req.car_number = pc.vehicle_number
    ORDER BY req.request_time DESC`,
    (err, results) => {
      if (err) {
        console.error("Error fetching data:", err);
        return res.status(500).json({ error: "Internal Server Error" });
      }
      res.json(results);
    }
  );
});

// POST a new car retrieval request
router.post("/api/retrieve", (req, res) => {
  let { name, phone_number, car_number, serial_number } = req.body;

  name = name && name.trim() ? name : null;
  phone_number = phone_number && phone_number.trim() ? phone_number : null;

  db.query(
    `INSERT INTO car_retrieval_requests 
      (name, phone_number, car_number, serial_number, request_time, status)
     VALUES (?, ?, ?, ?, NOW(), 'pending')`,
    [name, phone_number, car_number, serial_number],
    (err, result) => {
      if (err) {
        console.error("Error inserting data:", err);
        return res.status(500).send("Server error");
      }
      // Get the new request to emit via socket
      db.query(
        "SELECT * FROM car_retrieval_requests WHERE id = ?",
        [result.insertId],
        (err2, rows) => {
          if (!err2 && rows && rows[0]) {
            const io = getIO();
            io.emit("new_request", rows[0]);
            res.status(201).json(rows[0]);
          } else {
            res.status(201).json({});
          }
        }
      );
    }
  );
});

// PUT route to update status
router.put("/api/retrieve/:id/status", (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  db.query(
    "UPDATE car_retrieval_requests SET status = ? WHERE id = ?",
    [status, id],
    (err, result) => {
      if (err) {
        console.error("Error updating status:", err);
        return res.status(500).json({ error: "Internal Server Error" });
      }
      if (result.affectedRows === 0) {
        return res.status(404).json({ error: "Request not found" });
      }
      // Fetch the updated row
      db.query(
        "SELECT * FROM car_retrieval_requests WHERE id = ?",
        [id],
        (err2, rows) => {
          if (err2 || !rows || !rows[0]) {
            return res.json({ message: "Status updated" });
          }
          res.json(rows[0]);
        }
      );
    }
  );
});

module.exports = router;
