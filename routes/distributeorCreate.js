const express = require('express');
const mysql = require('mysql2');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const dotenv = require('dotenv');

// Initialize environment variables
dotenv.config();

// Set up MySQL connection
const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

// Set up file upload using multer
const upload = multer({ dest: 'uploads/' });

// Create the router
const router = express.Router();

// Create distributor route
router.post('/create', upload.array('documents', 10), async (req, res) => {
  const { fullName, email, mobileNumber, password, createdAt, location, paymentStatus, companyName } = req.body;
  const documentFiles = req.files; // Access uploaded files

  if (!fullName || !email || !mobileNumber || !password || !companyName) {
    return res.status(400).json({ message: 'Please fill all required fields.' });
  }

  try {
    const checkQuery = 'SELECT * FROM distributor_profiles WHERE email = ? OR mobileNumber = ?';
    db.query(checkQuery, [email, mobileNumber], async (err, results) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ message: 'Server error. Please try again later.' });
      }

      if (results.length > 0) {
        return res.status(409).json({ message: 'Distributor already exists with this email or mobile number.' });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const insertQuery = 
        'INSERT INTO distributor_profiles (fullName, email, mobileNumber, password, createdAt, location, paymentStatus, companyName) VALUES (?, ?, ?, ?, ?, ?, ?, ?)';
      const values = [
        fullName,
        email,
        mobileNumber,
        hashedPassword,
        createdAt || new Date(),
        location,
        paymentStatus,
        companyName,
      ];

      db.query(insertQuery, values, (err, result) => {
        if (err) {
          console.error('Database error:', err);
          return res.status(500).json({ message: 'Server error. Please try again later.' });
        }

        // Store document file paths in the database if necessary
        if (documentFiles && documentFiles.length > 0) {
          documentFiles.forEach((file) => {
            const filePathQuery = 'INSERT INTO distributor_documents (distributor_id, file_path) VALUES (?, ?)';
            db.query(filePathQuery, [result.insertId, file.path], (err) => {
              if (err) {
                console.error('Error saving file path:', err);
              }
            });
          });
        }

        res.status(201).json({ message: 'Distributor created successfully' });
      });
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ message: 'Server error. Please try again.' });
  }
});

module.exports = router;
