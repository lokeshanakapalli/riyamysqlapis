const express = require('express');
const mysql = require('mysql2');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const router = express.Router();

// Set up MySQL connection
const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

// API endpoint to fetch all banner images for a bureau by bureauId
router.get('/getBannerimages/:bureauId', async (req, res) => {
  const { bureauId } = req.params;  // Get bureauId from URL parameters

  if (!bureauId) {
    return res.status(400).json({ message: 'Please provide bureauId.' });
  }

  try {
    // Query to get all banner images for a specific bureau
    const selectQuery = 'SELECT id, imageUrl FROM slider_images WHERE bureauId = ?';
    const values = [bureauId];

    db.query(selectQuery, values, (err, result) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ message: 'Server error. Please try again later.' });
      }

      // Check if images exist for the bureau
      if (result.length === 0) {
        return res.status(404).json({ message: 'No images found for the given bureau.' });
      }

      // Respond with the image data including id and imageUrl
      res.status(200).json({
        message: 'Banner images fetched successfully.',
        bureauId: bureauId,  // Include bureauId in the response for clarity
        data: result.map(image => ({ id: image.id, imageUrl: image.imageUrl })),  // Return both id and imageUrl
      });
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ message: 'Server error. Please try again.' });
  }
});

// API endpoint to fetch all gallery images for a bureau
router.get('/getGalleryImages/:bureauId', async (req, res) => {
  const { bureauId } = req.params;  // Get bureauId from URL parameters

  if (!bureauId) {
    return res.status(400).json({ message: 'Please provide bureauId.' });
  }

  try {
    // Query to get all gallery images for a specific bureau
    const selectQuery = 'SELECT id, imageUrl FROM gallery_images WHERE bureauId = ?';
    const values = [bureauId];

    db.query(selectQuery, values, (err, result) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ message: 'Server error. Please try again later.' });
      }

      // Check if images exist for the bureau
      if (result.length === 0) {
        return res.status(404).json({ message: 'No images found for the given bureau.' });
      }

      // Respond with the image data including id and imageUrl
      res.status(200).json({
        message: 'Gallery images fetched successfully.',
        bureauId: bureauId,  // Include bureauId in the response for clarity
        data: result.map(image => ({ id: image.id, imageUrl: image.imageUrl })),  // Return both id and imageUrl
      });
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ message: 'Server error. Please try again.' });
  }
});

// Export the router as part of the /api/bureau API path
module.exports = router;
