const express = require('express');
const path = require('path');
const router = express.Router();

// Serve static files from each directory
router.use('/bannerimages', express.static(path.join(__dirname, '..', 'bannerimages')));
router.use('/galleryimages', express.static(path.join(__dirname, '..', 'galleryimages')));
router.use('/homebanners', express.static(path.join(__dirname, '..', 'homebanners')));
router.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// Route to serve files dynamically from each directory
router.get('/:folder/:imageName', (req, res) => {
  const { folder, imageName } = req.params;

  // Restrict folder access to the specified directories only
  const allowedFolders = ['bannerimages', 'galleryimages', 'homebanners', 'uploads'];
  if (!allowedFolders.includes(folder)) {
    return res.status(403).json({ message: 'Access to this folder is not allowed.' });
  }

  // Resolve the path dynamically based on the folder and image name
  const imagePath = path.join(__dirname, '..', folder, imageName);

  // Send the file or return a 404 error if not found
  res.sendFile(imagePath, (err) => {
    if (err) {
      console.error(err);
      return res.status(404).json({ message: 'Image not found' });
    }
  });
});

module.exports = router;
