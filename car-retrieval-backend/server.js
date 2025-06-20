// // server.js
// const express = require('express');
// const http = require('http');
// const cors = require('cors');
// const app = express();
// const server = http.createServer(app);
// const PORT = 5000;

// const socket = require('./socket');
// const io = socket.init(server);

// io.on('connection', (socket) => {
//   console.log('🔌 New client connected');
// });

// app.use(cors());
// app.use(express.json());

// // PostgreSQL Setup
// const { Pool } = require('pg');
// const cron = require('node-cron');
// const multer = require('multer');
// const path = require('path');
// const fs = require('fs');

// const db = new Pool({
//   user: 'postgres',
//   host: 'localhost',
//   database: 'car_retrieval',
//   password: 'root',
//   port: 5432,
// });

// // File Upload Config
// const uploadDir = path.join(__dirname, 'uploads');
// if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

// const storage = multer.diskStorage({
//   destination: (req, file, cb) => cb(null, uploadDir),
//   filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`)
// });

// const upload = multer({
//   storage,
//   fileFilter: (req, file, cb) => {
//     const allowedFields = ['dlFront', 'dlBack'];
//     if (!allowedFields.includes(file.fieldname)) {
//       return cb(new Error('Unexpected field'));
//     }
//     cb(null, true);
//   }
// });

// // ✅ Submit Valet
// app.post('/api/valets', upload.fields([
//   { name: 'dlFront', maxCount: 1 },
//   { name: 'dlBack', maxCount: 1 }
// ]), async (req, res) => {
//   try {
//     const { name, dob, aadhaar, dlNumber, phone } = req.body;
//     const dlFront = req.files?.dlFront?.[0]?.filename || null;
//     const dlBack = req.files?.dlBack?.[0]?.filename || null;

//     const result = await db.query(
//       `INSERT INTO valets (name, dob, aadhaar, dl_number, phone, dl_front, dl_back)
//        VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
//       [name.toUpperCase(), dob, aadhaar, dlNumber.toUpperCase(), phone, dlFront, dlBack]
//     );

//     res.status(201).json(result.rows[0]);
//   } catch (err) {
//     console.error('❌ Valet insert error:', err);
//     res.status(500).json({ error: 'Server error inserting valet' });
//   }
// });

// // ✅ Get All Valets
// app.get('/api/valets', async (req, res) => {
//   try {
//     const result = await db.query('SELECT * FROM valets ORDER BY created_at DESC');
//     res.json(result.rows);
//   } catch (err) {
//     console.error('❌ Fetch error:', err);
//     res.status(500).json({ error: 'Server error fetching valets' });
//   }
// });

// // Cleanup completed bookings
// app.get('/api/car-retrievals', async (req, res) => {
//   try {
//     const result = await db.query(`
//       SELECT *
//       FROM car_retrieval_requests
//       WHERE NOT (status = 'completed' AND request_time < NOW() - INTERVAL '1 month')
//       ORDER BY request_time DESC
//     `);
//     res.json(result.rows);
//   } catch (err) {
//     console.error('❌ Error fetching car retrievals:', err);
//     res.status(500).json({ error: 'Failed to fetch car retrievals' });
//   }
// });

// // POST: Add a Parked Car
// app.post('/api/parked-cars', async (req, res) => {
//   const { serialNumber, vehicleNumber, basementNumber, lotNumber, timeTaken, valet } = req.body;

//   if (!vehicleNumber || !basementNumber || !lotNumber || !timeTaken || !valet) {
//     return res.status(400).json({ error: 'All required fields must be filled.' });
//   }

//   try {
//     const result = await db.query(
//       `INSERT INTO parked_cars (serial_number, vehicle_number, basement_number, lot_number, time_taken, valet)
//        VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
//       [
//         serialNumber?.toUpperCase() || null,
//         vehicleNumber.toUpperCase(),
//         basementNumber.toUpperCase(),
//         lotNumber.toUpperCase(),
//         parseInt(timeTaken),
//         valet.toUpperCase(),
//       ]
//     );
//     res.status(201).json({ message: 'Parked car recorded successfully', data: result.rows[0] });
//   } catch (err) {
//     console.error('❌ Parked car insert error:', err);
//     res.status(500).json({ error: 'Failed to record parked car' });
//   }
// });

// // GET: Fetch All Parked Cars
// app.get('/api/parked-cars', async (req, res) => {
//   try {
//     const result = await db.query('SELECT * FROM parked_cars ORDER BY created_at DESC');
//     res.json(result.rows);
//   } catch (err) {
//     console.error('❌ Error fetching parked cars:', err);
//     res.status(500).json({ error: 'Failed to fetch parked cars' });
//   }
// });

// app.use(require('./routes/retrieve'));
// app.use('/uploads', express.static(path.join(__dirname, 'uploads')));    //server dl images

// server.listen(PORT, () => {
//   console.log(`🚀 Server running at http://localhost:${PORT}`);
// });

/* */

require("dotenv").config();
const express = require("express");
const http = require("http");
const cors = require("cors");
const app = express();
const server = http.createServer(app);
const PORT = 3030;

const socket = require("./socket");
const io = socket.init(server);

io.on("connection", (socket) => {
  console.log("🔌 New client connected");
});

app.use(cors());
app.use(express.json());

// Database connection using db.js
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

// --- Parked Cars Endpoints ---

// POST: Add a Parked Car
app.post("/api/parked-cars", async (req, res) => {
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

  try {
    const result = await db.query(
      `INSERT INTO parked_cars (serial_number, vehicle_number, basement_number, lot_number, time_taken, valet)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [
        serialNumber?.toUpperCase() || null,
        vehicleNumber.toUpperCase(),
        basementNumber.toUpperCase(),
        lotNumber.toUpperCase(),
        parseInt(timeTaken), // ensure integer
        valet.toUpperCase(),
      ]
    );
    res.status(201).json({
      message: "Parked car recorded successfully",
      data: result.rows[0],
    });
  } catch (err) {
    console.error("❌ Parked car insert error:", err);
    res.status(500).json({ error: "Failed to record parked car" });
  }
});

// GET: Fetch All Parked Cars
app.get("/api/parked-cars", async (req, res) => {
  try {
    const result = await db.query(
      "SELECT * FROM parked_cars ORDER BY parked_at DESC"
    );
    res.json(result.rows);
  } catch (err) {
    console.error("❌ Error fetching parked cars:", err);
    res.status(500).json({ error: "Failed to fetch parked cars" });
  }
});

// --- Valets Endpoints (file upload) ---
app.post(
  "/api/valets",
  upload.fields([{ name: "dlFront" }, { name: "dlBack" }]),
  async (req, res) => {
    try {
      const { name, dob, aadhaar, dlNumber, phone, isTemporary, expiresAt } =
        req.body;
      const dlFront = req.files.dlFront?.[0]?.filename;
      const dlBack = req.files.dlBack?.[0]?.filename;

      if (!dlFront || !dlBack) {
        return res.status(400).json({ error: "DL images are required" });
      }

      const result = await db.query(
        `INSERT INTO valets (name, dob, aadhaar, dl_number, phone, dl_front, dl_back, is_temporary, expires_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
        [
          name.toUpperCase(),
          dob,
          aadhaar,
          dlNumber.toUpperCase(),
          phone,
          dlFront,
          dlBack,
          isTemporary === "true",
          isTemporary === "true" ? expiresAt : null,
        ]
      );
      res.status(201).json({ valet: result.rows[0] });
    } catch (err) {
      console.error("Error registering valet:", err);
      res.status(500).json({ error: "Internal Server Error" });
    }
  }
);

app.get("/api/valets", async (req, res) => {
  try {
    const result = await db.query(`
      SELECT * FROM valets
      WHERE is_temporary = false OR (is_temporary = true AND expires_at > NOW())
      ORDER BY name
    `);
    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching valets:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// --- Car Retrieval Endpoints ---
app.use(require("./routes/retrieve"));

// Serve uploaded files
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.get("/", (req, res) => {
  res.send("Valets Backend is Running....");
});

server.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
