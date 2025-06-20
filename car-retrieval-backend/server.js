// server.js

const dotenv = require("dotenv");
const express = require("express");
const http = require("http");
const cors = require("cors");
const app = express();
const server = http.createServer(app);
const PORT = 3030;

dotenv.config();
const socket = require("./socket");
const io = socket.init(server);

app.use(cors());
app.use(express.json());

// Database connection using db.js (MySQL)
const db = require("./db");

// File upload setup (for valets)
const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Ensure uploads folder exists
const uploadDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
});

const upload = multer({ storage });

// POST: Add a Parked Car
app.post("/api/parked-cars", (req, res) => {
  const {
    serialNumber,
    vehicleNumber,
    basementNumber,
    lotNumber,
    timeTaken,
    valet,
  } = req.body;

  if (!vehicleNumber || !basementNumber || !lotNumber || !timeTaken || !valet) {
    return res
      .status(400)
      .json({ error: "All required fields must be filled." });
  }

  db.query(
    `INSERT INTO parked_cars (serial_number, vehicle_number, basement_number, lot_number, time_taken, valet)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      serialNumber ? serialNumber.toUpperCase() : null,
      vehicleNumber.toUpperCase(),
      basementNumber.toUpperCase(),
      lotNumber.toUpperCase(),
      parseInt(timeTaken, 10),
      valet.toUpperCase(),
    ],
    (err, result) => {
      if (err) {
        console.error("❌ Parked car insert error:", err);
        return res.status(500).json({ error: "Failed to record parked car" });
      }
      res.status(201).json({
        message: "Parked car recorded successfully",
        data: { id: result.insertId },
      });
    }
  );
});

// GET: Fetch All Parked Cars
app.get("/api/parked-cars", (req, res) => {
  db.query(
    "SELECT * FROM parked_cars ORDER BY parked_at DESC",
    (err, results) => {
      if (err) {
        console.error("❌ Error fetching parked cars:", err);
        return res.status(500).json({ error: "Failed to fetch parked cars" });
      }
      res.json(results);
    }
  );
});

// --- Valets Endpoints (file upload) ---
app.post(
  "/api/valets",
  upload.fields([{ name: "dlFront" }, { name: "dlBack" }]),
  (req, res) => {
    const { name, dob, aadhaar, dlNumber, phone, isTemporary, expiresAt } =
      req.body;
    const dlFront = req.files.dlFront?.[0]?.filename;
    const dlBack = req.files.dlBack?.[0]?.filename;

    if (!dlFront || !dlBack) {
      return res.status(400).json({ error: "DL images are required" });
    }

    db.query(
      `INSERT INTO valets (name, dob, aadhaar, dl_number, phone, dl_front, dl_back, is_temporary, expires_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        name.toUpperCase(),
        dob,
        aadhaar,
        dlNumber.toUpperCase(),
        phone,
        dlFront,
        dlBack,
        isTemporary === "true" ? 1 : 0,
        isTemporary === "true" ? expiresAt : null,
      ],
      (err, result) => {
        if (err) {
          console.error("Error registering valet:", err);
          return res.status(500).json({ error: "Internal Server Error" });
        }
        // Fetch the newly inserted valet and return (optional)
        db.query(
          "SELECT * FROM valets WHERE id = ?",
          [result.insertId],
          (err2, rows) => {
            if (err2) {
              return res.status(201).json({
                message: "Valet registered, but could not retrieve valet data.",
              });
            }
            res.status(201).json({ valet: rows[0] });
          }
        );
      }
    );
  }
);

// GET: Fetch all active valets (ignore expired temporary valets)
app.get("/api/valets", (req, res) => {
  db.query(
    `SELECT * FROM valets
     WHERE is_temporary = 0 OR (is_temporary = 1 AND expires_at > NOW())
     ORDER BY name`,
    (err, results) => {
      if (err) {
        console.error("Error fetching valets:", err);
        return res.status(500).json({ error: "Internal Server Error" });
      }
      res.json(results);
    }
  );
});

// --- Car Retrieval Endpoints ---
const retrieveRouter = express.Router();

// GET all car retrieval requests JOINED with parked cars for extra info
retrieveRouter.get("/api/retrieve", (req, res) => {
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
retrieveRouter.post("/api/retrieve", (req, res) => {
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
            const io = socket.getIO();
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
retrieveRouter.put("/api/retrieve/:id/status", (req, res) => {
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

app.use(retrieveRouter);

// Serve uploaded files
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.get("/", (req, res) => {
  res.send("Valets Backend is Running....");
});

server.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
