const express = require('express');
const mysql = require('mysql2');
const dotenv = require('dotenv');
const multer = require('multer');
const cors = require('cors');
const bcrypt = require('bcryptjs'); // Use bcryptjs instead of bcrypt
const app = express();
const imageRouter = require('./routes/imageRouter2');
const adminRoutes = require('./routes/admin');
const distributerloginn = require('./routes/distributer.js');
const bureaulogin = require('./routes/bureaulogin.js');
const bureauRouter = require('./routes/bureau.js');
const Getimages = require('./routes/getimages.js');
const bureauProfilesRouter = require('./routes/bureauProfilesRouter');
const distributorRoutes = require('./routes/distributeorCreate.js');
const Allrouters = require('./routes/regRouters.js');

// Enable CORS for all routes and use dotenv
app.use(cors());
dotenv.config();
app.use(express.json()); // To parse JSON request bodies

const port = process.env.PORT || 5000;
// Database connection setup
const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

db.connect((err) => {
  if (err) {
    console.error('Database connection failed:', err.stack);
    return;
  }
  console.log('Connected to database');
});
app.use('/api', imageRouter);
app.use('/api/admin', adminRoutes); // Now, all routes prefixed with /api/admin will use adminRoutes
app.use('/api/distributor', distributerloginn); 
app.use('/api', bureaulogin);

app.use('/api/bureau', bureauRouter);

app.use('/api/bureau', Getimages);
app.use('/api', bureauProfilesRouter);

app.use('/api/distributor', distributorRoutes);
app.use('/api', Allrouters);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});



// Endpoint to get bureau profiles by distributor ID
app.get('/api/bureau_profiles_distributer', (req, res) => {
  const distributorId = req.query.distributorId;

  // Check if distributorId is provided
  if (!distributorId) {
    return res.status(400).json({ message: 'Distributor ID is required' });
  }

  // Query to get bureau profiles for the specified distributor ID
  const query = 'SELECT * FROM bureau_profiles WHERE distributorId = ?';
  db.query(query, [distributorId], (err, results) => {
    if (err) {
      console.error('Database query error:', err);
      return res.status(500).json({ message: 'Server error. Please try again later.' });
    }

    // Respond with the results
    res.status(200).json({ bureauProfiles: results });
  });
});


// Endpoint to get all bureau profiles
app.get('/api/bureau_profiles', (req, res) => {
  // Query to get all records from the bureau_profiles table
  db.query('SELECT * FROM bureau_profiles', (err, results) => {
    if (err) {
      console.error('Database query error:', err);
      return res.status(500).json({ message: 'Server error. Please try again later.' });
    }

    // Respond with the results
    res.status(200).json({ bureauProfiles: results });
  });
});

// Endpoint to get all distributor profiles
app.get('/api/distributors', (req, res) => {
  // Query to get all records from the distributor_profiles table
  db.query('SELECT * FROM distributor_profiles', (err, results) => {
    if (err) {
      console.error('Database query error:', err);
      return res.status(500).json({ message: 'Server error. Please try again later.' });
    }

    // Respond with the results
    res.status(200).json({ distributors: results });
  });
});

// API endpoint to delete a banner image for a bureau
app.delete('/api/deleteBannerImage/:imageId', async (req, res) => {
  const { imageId } = req.params;

  if (!imageId) {
    return res.status(400).json({ message: 'Please provide imageId.' });
  }

  try {
    // Query to delete the image from the database
    const deleteQuery = 'DELETE FROM slider_images WHERE id = ?';
    const values = [imageId];

    db.query(deleteQuery, values, (err, result) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ message: 'Server error. Please try again later.' });
      }

      // Check if the image was deleted
      if (result.affectedRows === 0) {
        return res.status(404).json({ message: 'Image not found.' });
      }

      // Respond with success message
      res.status(200).json({ message: 'Image deleted successfully.' });
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ message: 'Server error. Please try again later.' });
  }
});


const galleryImageStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'galleryimages/'); // Save images in 'galleryimages' directory
  },
  filename: (req, file, cb) => {
    const fileName = Date.now() + '-' + file.originalname;
    cb(null, fileName); // Rename the file with a timestamp to avoid conflicts
  },
});

// Set up multer to handle gallery image uploads
const uploadGalleryImages = multer({ storage: galleryImageStorage });

// API endpoint to upload a single gallery image
app.post('/api/gallery/upload', uploadGalleryImages.single('image'), async (req, res) => {
  const { bureauId } = req.body;

  if (!bureauId || !req.file) {
    return res.status(400).json({ message: 'Please provide bureauId and an image to upload.' });
  }

  // Collect the URL of the uploaded image
  const imageUrl = `/galleryimages/${req.file.filename}`; // Image path in the folder

  try {
    // Insert the image URL into the gallery_images table
    const insertQuery = 'INSERT INTO gallery_images (bureauId, imageUrl) VALUES (?, ?)';
    const values = [bureauId, imageUrl];

    db.query(insertQuery, values, (err, result) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ message: 'Server error. Please try again later.' });
      }

      // Check if the row was inserted successfully
      if (result.affectedRows === 0) {
        return res.status(404).json({ message: 'Bureau not found or image could not be inserted.' });
      }

      res.status(200).json({
        message: 'Image uploaded and inserted into gallery_images table successfully.',
        imageUrl,
      });
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ message: 'Server error. Please try again.' });
  }
});



// API endpoint to delete a gallery image for a bureau
app.delete('/api/deleteGalleryImage/:imageId', async (req, res) => {
  const { imageId } = req.params;

  if (!imageId) {
    return res.status(400).json({ message: 'Please provide imageId.' });
  }

  try {
    // Query to delete the image from the database
    const deleteQuery = 'DELETE FROM gallery_images WHERE id = ?';
    const values = [imageId];

    db.query(deleteQuery, values, (err, result) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ message: 'Server error. Please try again later.' });
      }

      // Check if the image was deleted
      if (result.affectedRows === 0) {
        return res.status(404).json({ message: 'Image not found.' });
      }

      // Respond with success message
      res.status(200).json({ message: 'Image deleted successfully.' });
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ message: 'Server error. Please try again later.' });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
