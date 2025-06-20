const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const pool = require('../db');

// Storage config for DL images
const storage = multer.diskStorage({
  destination: './uploads/',
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({ storage });

// POST: Register a new valet (including optional temporary)
router.post('/', upload.fields([{ name: 'dlFront' }, { name: 'dlBack' }]), async (req, res) => {
  try {
    const { name, dob, aadhaar, dlNumber, phone, isTemporary, expiresAt } = req.body;

    const dlFront = req.files.dlFront?.[0]?.filename;
    const dlBack = req.files.dlBack?.[0]?.filename;

    if (!dlFront || !dlBack) {
      return res.status(400).json({ error: 'DL images are required' });
    }

    const query = `
      INSERT INTO valets (
        name, dob, aadhaar, dl_number, phone, dl_front, dl_back, is_temporary, expires_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `;
    const values = [
      name.toUpperCase(),
      dob,
      aadhaar,
      dlNumber.toUpperCase(),
      phone,
      dlFront,
      dlBack,
      isTemporary === 'true',
      isTemporary === 'true' ? expiresAt : null
    ];

    const result = await pool.query(query, values);
    res.status(201).json({ valet: result.rows[0] });
  } catch (err) {
    console.error('Error registering valet:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// GET: Fetch all active valets (ignore expired temporary valets)
// router.get('/', async (req, res) => {
//   try {
//     const result = await pool.query(`
//       SELECT * FROM valets
//       WHERE is_temporary = false OR (is_temporary = true AND expires_at > NOW())
//       ORDER BY name
//     `);
//     res.json(result.rows);
//   } catch (err) {
//     console.error('Error fetching valets:', err);
//     res.status(500).json({ error: 'Internal Server Error' });
//   }
// });


// In your `router.get('/', ...)` for valets:
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT * FROM valets
      WHERE is_temporary = false OR (is_temporary = true AND expires_at > NOW())
      ORDER BY name
    `);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching valets:', err);
    res.status(500).json({ error: 'Internal Server Error', details: err.message }); // <-- Add details for debugging
  }
});

module.exports = router;
