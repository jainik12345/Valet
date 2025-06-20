// // // server.js
// // const express = require('express');
// // const http = require('http');
// // const cors = require('cors');
// // const app = express();
// // const server = http.createServer(app);
// // const PORT = 5000;

// // const socket = require('./socket');
// // const io = socket.init(server);

// // io.on('connection', (socket) => {
// //   console.log('🔌 New client connected');
// // });

// // app.use(cors());
// // app.use(express.json());

// // // PostgreSQL Setup
// // const { Pool } = require('pg');
// // const cron = require('node-cron');
// // const multer = require('multer');
// // const path = require('path');
// // const fs = require('fs');

// // const db = new Pool({
// //   user: 'postgres',
// //   host: 'localhost',
// //   database: 'car_retrieval',
// //   password: 'root',
// //   port: 5432,
// // });

// // // File Upload Config
// // const uploadDir = path.join(__dirname, 'uploads');
// // if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

// // const storage = multer.diskStorage({
// //   destination: (req, file, cb) => cb(null, uploadDir),
// //   filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`)
// // });

// // const upload = multer({
// //   storage,
// //   fileFilter: (req, file, cb) => {
// //     const allowedFields = ['dlFront', 'dlBack'];
// //     if (!allowedFields.includes(file.fieldname)) {
// //       return cb(new Error('Unexpected field'));
// //     }
// //     cb(null, true);
// //   }
// // });

// // // ✅ Submit Valet
// // app.post('/api/valets', upload.fields([
// //   { name: 'dlFront', maxCount: 1 },
// //   { name: 'dlBack', maxCount: 1 }
// // ]), async (req, res) => {
// //   try {
// //     const { name, dob, aadhaar, dlNumber, phone } = req.body;
// //     const dlFront = req.files?.dlFront?.[0]?.filename || null;
// //     const dlBack = req.files?.dlBack?.[0]?.filename || null;

// //     const result = await db.query(
// //       `INSERT INTO valets (name, dob, aadhaar, dl_number, phone, dl_front, dl_back)
// //        VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
// //       [name.toUpperCase(), dob, aadhaar, dlNumber.toUpperCase(), phone, dlFront, dlBack]
// //     );

// //     res.status(201).json(result.rows[0]);
// //   } catch (err) {
// //     console.error('❌ Valet insert error:', err);
// //     res.status(500).json({ error: 'Server error inserting valet' });
// //   }
// // });

// // // ✅ Get All Valets
// // app.get('/api/valets', async (req, res) => {
// //   try {
// //     const result = await db.query('SELECT * FROM valets ORDER BY created_at DESC');
// //     res.json(result.rows);
// //   } catch (err) {
// //     console.error('❌ Fetch error:', err);
// //     res.status(500).json({ error: 'Server error fetching valets' });
// //   }
// // });

// // // Cleanup completed bookings
// // app.get('/api/car-retrievals', async (req, res) => {
// //   try {
// //     const result = await db.query(`
// //       SELECT *
// //       FROM car_retrieval_requests
// //       WHERE NOT (status = 'completed' AND request_time < NOW() - INTERVAL '1 month')
// //       ORDER BY request_time DESC
// //     `);
// //     res.json(result.rows);
// //   } catch (err) {
// //     console.error('❌ Error fetching car retrievals:', err);
// //     res.status(500).json({ error: 'Failed to fetch car retrievals' });
// //   }
// // });

// // // POST: Add a Parked Car
// // app.post('/api/parked-cars', async (req, res) => {
// //   const { serialNumber, vehicleNumber, basementNumber, lotNumber, timeTaken, valet } = req.body;

// //   if (!vehicleNumber || !basementNumber || !lotNumber || !timeTaken || !valet) {
// //     return res.status(400).json({ error: 'All required fields must be filled.' });
// //   }

// //   try {
// //     const result = await db.query(
// //       `INSERT INTO parked_cars (serial_number, vehicle_number, basement_number, lot_number, time_taken, valet)
// //        VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
// //       [
// //         serialNumber?.toUpperCase() || null,
// //         vehicleNumber.toUpperCase(),
// //         basementNumber.toUpperCase(),
// //         lotNumber.toUpperCase(),
// //         parseInt(timeTaken),
// //         valet.toUpperCase(),
// //       ]
// //     );
// //     res.status(201).json({ message: 'Parked car recorded successfully', data: result.rows[0] });
// //   } catch (err) {
// //     console.error('❌ Parked car insert error:', err);
// //     res.status(500).json({ error: 'Failed to record parked car' });
// //   }
// // });

// // // GET: Fetch All Parked Cars
// // app.get('/api/parked-cars', async (req, res) => {
// //   try {
// //     const result = await db.query('SELECT * FROM parked_cars ORDER BY created_at DESC');
// //     res.json(result.rows);
// //   } catch (err) {
// //     console.error('❌ Error fetching parked cars:', err);
// //     res.status(500).json({ error: 'Failed to fetch parked cars' });
// //   }
// // });

// // app.use(require('./routes/retrieve'));
// // app.use('/uploads', express.static(path.join(__dirname, 'uploads')));    //server dl images

// // server.listen(PORT, () => {
// //   console.log(`🚀 Server running at http://localhost:${PORT}`);
// // });

// /* */

// const dotenv = require("dotenv");
// const express = require("express");
// const http = require("http");
// const cors = require("cors");
// const app = express();
// const server = http.createServer(app);
// const PORT = 3030;
// // require("dotenv").config();
// dotenv.config();
// const socket = require("./socket");
// const io = socket.init(server);

// io.on("connection", (socket) => {
//   console.log("🔌 New client connected");
// });

// app.use(cors());
// app.use(express.json());

// // Database connection using db.js
// const db = require("./db");

// // File upload setup (for valets)
// const multer = require("multer");
// const path = require("path");
// const fs = require("fs");

// // Ensure uploads folder exists
// const uploadDir = path.join(__dirname, "uploads");
// if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

// const storage = multer.diskStorage({
//   destination: (req, file, cb) => cb(null, uploadDir),
//   filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
// });

// const upload = multer({ storage });

// // --- Parked Cars Endpoints ---

// // POST: Add a Parked Car
// app.post("/api/parked-cars", async (req, res) => {
//   const {
//     serialNumber,
//     vehicleNumber,
//     basementNumber,
//     lotNumber,
//     timeTaken,
//     valet,
//   } = req.body;

//   if (!vehicleNumber || !basementNumber || !lotNumber || !timeTaken || !valet) {
//     return res
//       .status(400)
//       .json({ error: "All required fields must be filled." });
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
//         parseInt(timeTaken), // ensure integer
//         valet.toUpperCase(),
//       ]
//     );
//     res.status(201).json({
//       message: "Parked car recorded successfully",
//       data: result.rows[0],
//     });
//   } catch (err) {
//     console.error("❌ Parked car insert error:", err);
//     res.status(500).json({ error: "Failed to record parked car" });
//   }
// });

// // GET: Fetch All Parked Cars
// app.get("/api/parked-cars", async (req, res) => {
//   try {
//     const result = await db.query(
//       "SELECT * FROM parked_cars ORDER BY parked_at DESC"
//     );
//     res.json(result.rows);
//   } catch (err) {
//     console.error("❌ Error fetching parked cars:", err);
//     res.status(500).json({ error: "Failed to fetch parked cars" });
//   }
// });

// // --- Valets Endpoints (file upload) ---
// app.post(
//   "/api/valets",
//   upload.fields([{ name: "dlFront" }, { name: "dlBack" }]),
//   async (req, res) => {
//     try {
//       const { name, dob, aadhaar, dlNumber, phone, isTemporary, expiresAt } =
//         req.body;
//       const dlFront = req.files.dlFront?.[0]?.filename;
//       const dlBack = req.files.dlBack?.[0]?.filename;

//       if (!dlFront || !dlBack) {
//         return res.status(400).json({ error: "DL images are required" });
//       }

//       const result = await db.query(
//         `INSERT INTO valets (name, dob, aadhaar, dl_number, phone, dl_front, dl_back, is_temporary, expires_at)
//        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
//        RETURNING *`,
//         [
//           name.toUpperCase(),
//           dob,
//           aadhaar,
//           dlNumber.toUpperCase(),
//           phone,
//           dlFront,
//           dlBack,
//           isTemporary === "true",
//           isTemporary === "true" ? expiresAt : null,
//         ]
//       );
//       res.status(201).json({ valet: result.rows[0] });
//     } catch (err) {
//       console.error("Error registering valet:", err);
//       res.status(500).json({ error: "Internal Server Error" });
//     }
//   }
// );

// app.get("/api/valets", async (req, res) => {
//   try {
//     const result = await db.query(`
//       SELECT * FROM valets
//       WHERE is_temporary = false OR (is_temporary = true AND expires_at > NOW())
//       ORDER BY name
//     `);
//     res.json(result.rows);
//   } catch (err) {
//     console.error("Error fetching valets:", err);
//     res.status(500).json({ error: "Internal Server Error" });
//   }
// });

// // --- Car Retrieval Endpoints ---
// app.use(require("./routes/retrieve"));

// // Serve uploaded files
// app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// app.get("/", (req, res) => {
//   res.send("Valets Backend is Running....");
// });

// server.listen(PORT, () => {
//   console.log(`🚀 Server running at http://localhost:${PORT}`);
// });




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

io.on("connection", (socket) => {
  console.log("🔌 New client connected");
});

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

// --- Parked Cars Endpoints ---

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
              return res
                .status(201)
                .json({ message: "Valet registered, but could not retrieve valet data." });
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