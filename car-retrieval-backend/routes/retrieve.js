// const express = require("express");
// const router = express.Router();
// const pool = require("../db");
// const { getIO } = require("../socket"); // Ensure socket.js exports getIO()

// // ✅ GET all car retrieval requests JOINED with parked cars for extra info
// router.get("/api/retrieve", async (req, res) => {
//   try {
//     // Join car_retrieval_requests with parked_cars on car_number/vehicle_number
//     const result = await pool.query(`
//       SELECT
//         req.*,
//         pc.basement_number,
//         pc.lot_number,
//         pc.valet,
//         pc.time_taken
//       FROM car_retrieval_requests req
//       LEFT JOIN parked_cars pc
//         ON req.car_number = pc.vehicle_number
//       ORDER BY req.request_time DESC
//     `);

//     res.json(result.rows);
//   } catch (err) {
//     console.error("Error fetching data:", err);
//     res.status(500).json({ error: "Internal Server Error" });
//   }
// });

// // ✅ POST a new car retrieval request (with backendData included)

// router.post("/api/retrieve", async (req, res) => {
//   let { name, phone_number, car_number, serial_number } = req.body;

//   // Convert empty strings to null for optional fields
//   name = name && name.trim() ? name : null;
//   phone_number = phone_number && phone_number.trim() ? phone_number : null;

//   try {
//     const newRequest = await pool.query(
//       `INSERT INTO car_retrieval_requests 
//         (name, phone_number, car_number, serial_number, request_time, status)
//        VALUES 
//         ($1, $2, $3, $4, NOW(), 'pending')
//        RETURNING *`,
//       [name, phone_number, car_number, serial_number]
//     );

//     const io = getIO();
//     io.emit("new_request", newRequest.rows[0]); // Emit to connected clients

//     res.status(201).json(newRequest.rows[0]);
//   } catch (err) {
//     console.error("Error inserting data:", err);
//     res.status(500).send("Server error");
//   }
// });

// // ✅ PUT route to update status
// router.put("/api/retrieve/:id/status", async (req, res) => {
//   const { id } = req.params;
//   const { status } = req.body;

//   try {
//     const result = await pool.query(
//       "UPDATE car_retrieval_requests SET status = $1 WHERE id = $2 RETURNING *",
//       [status, id]
//     );

//     if (result.rows.length === 0) {
//       return res.status(404).json({ error: "Request not found" });
//     }

//     res.json(result.rows[0]);
//   } catch (err) {
//     console.error("Error updating status:", err);
//     res.status(500).json({ error: "Internal Server Error" });
//   }
// });

// module.exports = router;



const express = require("express");
const router = express.Router();
const db = require("../db");
const { getIO } = require("../socket"); // Ensure socket.js exports getIO()

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