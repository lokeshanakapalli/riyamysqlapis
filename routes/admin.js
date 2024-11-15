// adminRoutes.js
const express = require('express');
const mysql = require('mysql2');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');

dotenv.config(); // Load environment variables

const router = express.Router();

// Set up MySQL connection
const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});



// Admin login route
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  // Find admin by email
  db.query('SELECT * FROM admin WHERE email = ?', [email], async (err, results) => {
    if (err) {
      console.error('Database query error:', err);
      return res.status(500).json({ message: 'Server error. Please try again later.' });
    }

    if (results.length === 0) {
      return res.status(404).json({ message: 'Admin not found' });
    }

    const admin = results[0];

    // Check password
    const isPasswordValid = await bcrypt.compare(password, admin.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid password' });
    }

    // Respond with success message
    res.status(200).json({ message: 'Login successful' });
  });
});

// Get all admin details route
router.get('/', (req, res) => {
  db.query('SELECT * FROM admin', (err, results) => {
    if (err) {
      return res.status(500).json({ message: 'Server error' });
    }
    res.json(results);
  });
});

// Get a specific admin by ID
router.get('/:id', (req, res) => {
  const adminId = req.params.id;

  db.query('SELECT * FROM admin WHERE id = ?', [adminId], (err, results) => {
    if (err) {
      return res.status(500).json({ message: 'Server error' });
    }
    if (results.length === 0) {
      return res.status(404).json({ message: 'Admin not found' });
    }
    res.json(results[0]);
  });
});

module.exports = router;

