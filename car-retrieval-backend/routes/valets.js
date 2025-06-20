const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const db = require("../db");

// Storage config for DL images
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, "../uploads/"));
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(
      null,
      file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname)
    );
  },
});

const upload = multer({ storage });

// POST: Register a new valet (including optional temporary)
router.post(
  "/",
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
      `INSERT INTO valets (
        name, dob, aadhaar, dl_number, phone, dl_front, dl_back, is_temporary, expires_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
        // Fetch and return the newly added valet
        db.query(
          "SELECT * FROM valets WHERE id = ?",
          [result.insertId],
          (err2, rows) => {
            if (err2) {
              return res
                .status(201)
                .json({
                  message:
                    "Valet registered, but could not retrieve valet data.",
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
router.get("/", (req, res) => {
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

module.exports = router;
