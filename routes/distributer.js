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



// Distributor Login route
router.post('/login', (req, res) => {
  const { email, password } = req.body;

  // Find distributor by email in MySQL
  db.query('SELECT * FROM distributor_profiles WHERE email = ?', [email], async (err, results) => {
    if (err) {
      console.error('Database query error:', err);
      return res.status(500).json({ message: 'Server error. Please try again later.' });
    }

    // Check if distributor exists
    if (results.length === 0) {
      return res.status(404).json({ message: 'Distributor not found' });
    }

    const distributor = results[0]; // Get the first result

    // Validate password with bcrypt
    const isPasswordValid = await bcrypt.compare(password, distributor.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid password' });
    }

    // Send back the distributor ID and success message
    res.status(200).json({ message: 'Login successful', id: distributor.id });
  });
});

module.exports = router;
