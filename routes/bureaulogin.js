const express = require('express');
const mysql = require('mysql2');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');

dotenv.config();

const router = express.Router();

// Set up MySQL connection
const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

// Login route for admin authentication
router.post('/bureaulogin', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  // Find bureau by email in MySQL
  db.query('SELECT * FROM bureau_profiles WHERE email = ?', [email], async (err, results) => {
    if (err) {
      console.error('Database query error:', err);
      return res.status(500).json({ message: 'Server error. Please try again later.' });
    }

    // Check if Bureau exists
    if (results.length === 0) {
      return res.status(404).json({ message: 'Bureau not found' });
    }

    const bureau = results[0]; // Get the first result (should be only one)

    // Validate password with bcryptjs
    const isPasswordValid = await bcrypt.compare(password, bureau.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid password' });
    }

    // Respond with success if password is valid
    res.status(200).json({ message: 'Login successful', id: bureau.bureauId });
  });
});

module.exports = router;
