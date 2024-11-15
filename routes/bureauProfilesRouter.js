const express = require('express');
const dotenv = require('dotenv'); // To load environment variables from .env file
const mysql = require('mysql2'); // Import the mysql module

const router = express.Router();
dotenv.config();

// Set up MySQL connection
const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

// Connect to MySQL
db.connect((err) => {
  if (err) {
    console.error('Error connecting to database:', err);
  } else {
    console.log('Connected to the MySQL database');
  }
});

// Endpoint to get bureau profiles by bureauId
router.get('/bureau_profiles_bureauId', (req, res) => {
  const bureauId = req.query.bureauId;

  // Check if bureauId is provided
  if (!bureauId) {
    return res.status(400).json({ message: 'bureauId is required' });
  }

  // Query to get bureau profiles for the specified bureauId
  const query = 'SELECT * FROM bureau_profiles WHERE bureauId = ?';
  db.query(query, [bureauId], (err, results) => {
    if (err) {
      console.error('Database query error:', err);
      return res.status(500).json({ message: 'Server error. Please try again later.' });
    }

    // Respond with the results, only returning the columns fetched by the query
    res.status(200).json({ bureauProfiles: results });
  });
});

module.exports = router;
