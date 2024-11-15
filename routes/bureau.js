// routes/bureauRouter.js

const express = require('express');
const mysql = require('mysql2');
const bcrypt = require('bcryptjs');
const multer = require('multer');
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

// Storage configuration for document uploads
const documentStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/'); // Save uploaded documents in the 'bureau_documents' directory
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname); // Generate a unique file name using timestamp
  },
});

const uploadDocuments = multer({ storage: documentStorage });

// Bureau creation route with document uploads
router.post('/create', uploadDocuments.array('documents', 10), async (req, res) => {
  const { bureauName, mobileNumber, about, location, email, ownerName, paymentStatus, distributorId, password } = req.body;
  const documentFiles = req.files; // Access uploaded files

  // Check if all required fields are present
  if (!bureauName || !email || !mobileNumber || !ownerName || !distributorId || !password) {
    return res.status(400).json({ message: 'Please fill all required fields.' });
  }

  // Generate a unique bureauId (7-digit random number)
  const generateBureauId = () => {
    const randomNum = Math.floor(1000000 + Math.random() * 9000000); // Generate a random 7-digit number
    return randomNum.toString();
  };

  const bureauId = generateBureauId(); // Generate the unique bureau ID

  try {
    // Check if a bureau already exists with the same email or mobile number
    const checkQuery = 'SELECT * FROM bureau_profiles WHERE email = ? OR mobileNumber = ?';
    db.query(checkQuery, [email, mobileNumber], async (err, results) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ message: 'Server error. Please try again later.' });
      }

      if (results.length > 0) {
        return res.status(409).json({ message: 'Bureau already exists with this email or mobile number.' });
      }

      // Hash the password before saving it to the database using bcryptjs
      bcrypt.hash(password, 10, (err, hashedPassword) => { // saltRounds is 10
        if (err) {
          console.error('Error hashing password:', err);
          return res.status(500).json({ message: 'Error hashing password.' });
        }

        // Insert bureau profile into the database
        const insertQuery =
          'INSERT INTO bureau_profiles (bureauId, bureauName, mobileNumber, about, location, email, ownerName, paymentStatus, distributorId, password, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';
        const values = [
          bureauId,
          bureauName,
          mobileNumber,
          about,
          location,
          email,
          ownerName,
          paymentStatus,
          distributorId,
          hashedPassword, // Save hashed password
          new Date(), // Created at timestamp
        ];

        db.query(insertQuery, values, (err, result) => {
          if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ message: 'Server error. Please try again later.' });
          }

          // If document files are uploaded, store file paths in the database
          if (documentFiles && documentFiles.length > 0) {
            documentFiles.forEach((file) => {
              const filePathQuery = 'INSERT INTO bureau_documents (bureau_id, file_path) VALUES (?, ?)';
              db.query(filePathQuery, [result.insertId, file.path], (err) => {
                if (err) {
                  console.error('Error saving file path:', err);
                }
              });
            });
          }

          // Respond with success message
          res.status(201).json({ message: 'Bureau created successfully', bureauId: bureauId });
        });
      });
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ message: 'Server error. Please try again.' });
  }
});

// Bureau update route
router.put('/update', async (req, res) => {
  const { bureauId, bureauName, mobileNumber, about, location } = req.body;

  if (!bureauId || (!bureauName && !mobileNumber && !about && !location)) {
    return res.status(400).json({ message: 'Please provide bureauId and at least one field to update.' });
  }

  try {
    const updates = [];
    const values = [];

    // Add conditions for updating each field
    if (bureauName) {
      updates.push('bureauName = ?');
      values.push(bureauName);
    }
    if (mobileNumber) {
      updates.push('mobileNumber = ?');
      values.push(mobileNumber);
    }
    if (about) {
      updates.push('about = ?');
      values.push(about);
    }
    if (location) {
      updates.push('location = ?');
      values.push(location);
    }

    values.push(bureauId); // Ensure bureauId is at the end for the WHERE clause

    const updateQuery = `UPDATE bureau_profiles SET ${updates.join(', ')} WHERE bureauId = ?`;

    // Execute the update query
    db.query(updateQuery, values, (err, result) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ message: 'Server error. Please try again later.' });
      }

      if (result.affectedRows === 0) {
        return res.status(404).json({ message: 'Bureau not found.' });
      }

      res.status(200).json({ message: 'Bureau updated successfully' });
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ message: 'Server error. Please try again.' });
  }
});

// Storage configuration for banner upload
const homeBannerStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'homebanners/'); // Save in 'homebanners' directory
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  },
});

const uploadHomeBanner = multer({ storage: homeBannerStorage });

// Upload banner image route
router.put('/uploadBanner', uploadHomeBanner.single('image'), async (req, res) => {
  const { bureauId } = req.body;

  if (!bureauId || !req.file) {
    return res.status(400).json({ message: 'Please provide bureauId and an image to upload.' });
  }

  const imageUrl = `/homebanners/${req.file.filename}`; // Path to the saved image

  try {
    const updateQuery = 'UPDATE bureau_profiles SET welcomeImageBanner = ? WHERE bureauId = ?';
    const values = [imageUrl, bureauId];

    db.query(updateQuery, values, (err, result) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ message: 'Server error. Please try again later.' });
      }

      if (result.affectedRows === 0) {
        return res.status(404).json({ message: 'Bureau not found.' });
      }

      res.status(200).json({ message: 'Image uploaded successfully', imageUrl });
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ message: 'Server error. Please try again.' });
  }
});

// Banner upload route
const bannerImageStorage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, 'bannerimages/');
    },
    filename: (req, file, cb) => {
      cb(null, Date.now() + '-' + file.originalname);
    },
  });
  
  const uploadBannerImages = multer({ storage: bannerImageStorage });
  
  router.post('/slider', uploadBannerImages.single('image'), async (req, res) => {
    const { bureauId } = req.body;
  
    if (!bureauId || !req.file) {
      return res.status(400).json({ message: 'Please provide bureauId and an image to upload.' });
    }
  
    console.log('Bureau ID:', bureauId);
    console.log('File Info:', req.file); // Log file information to ensure it's being received
  
    const imageUrl = `/bannerimages/${req.file.filename}`;
  
    try {
      const insertQuery = 'INSERT INTO slider_images (bureauId, imageUrl) VALUES (?, ?)';
      const values = [bureauId, imageUrl];
  
      db.query(insertQuery, values, (err, result) => {
        if (err) {
          console.error('Database Error:', err); // Log the error for debugging
          return res.status(500).json({ message: 'Server error. Please try again later.' });
        }
  
        res.status(200).json({
          message: 'Image uploaded and inserted into slider_images table successfully.',
          imageUrl,
        });
      });
    } catch (error) {
      console.error('Catch Block Error:', error); // Log any errors from the try block
      res.status(500).json({ message: 'Server error. Please try again.' });
    }
  });
  
  

module.exports = router;
