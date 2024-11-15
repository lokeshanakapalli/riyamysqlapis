const express = require('express');
const mysql = require('mysql2');
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

// Function to handle querying a table
const handleQuery = (table, res) => {
  db.query(`SELECT * FROM ${table}`, (err, results) => {
    if (err) {
      return res.status(500).json({ message: 'Server error' });
    }
    res.json(results);
  });
};

// Routes for each table (only GET for now)
router.get('/caste', (req, res) => handleQuery('caste', res));
router.get('/sub_caste', (req, res) => handleQuery('sub_caste', res));
router.get('/raasi', (req, res) => handleQuery('raasi', res));
router.get('/star', (req, res) => handleQuery('star', res));
router.get('/education', (req, res) => handleQuery('education', res));
router.get('/extra_skills', (req, res) => handleQuery('extra_skills', res));
router.get('/annual_income', (req, res) => handleQuery('annual_income', res));
router.get('/city', (req, res) => handleQuery('city', res));
router.get('/state', (req, res) => handleQuery('state', res));
router.get('/country', (req, res) => handleQuery('country', res));

module.exports = router;
