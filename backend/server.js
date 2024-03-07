const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const app = express();
require('dotenv').config();
const nodemailer = require('nodemailer');
const jwt = require('jsonwebtoken');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/galaxyetech', {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => console.log('MongoDB Connected'))
  .catch(err => console.log(err));

// Middlewares
app.use(cors());
app.use(bodyParser.json());

// Define a schema for Package
const PackageSchema = new mongoose.Schema({
  selectedImage: String,
  name: String,
  numberOfCameras: String, 
  waterproofBoxes: String,
  wireLength: String,
  hardDriveCapacity: String,
  dvr: String,
  dcPins: String,
  bncConnectors: String,
  packagePrice: String,
});

// Create a model from the schema
const Package = mongoose.model('Package', PackageSchema);

// Route for adding a new package
app.post('/api/packages', async (req, res) => {
  try {
    const newPackage = new Package(req.body);
    await newPackage.save();
    res.status(201).send(newPackage);
  } catch (error) {
    res.status(500).send(error);
  }
});

// Route for fetching all packages
app.get('/api/packages', async (req, res) => {
  try {
    const packages = await Package.find({});
    res.status(200).send(packages);
  } catch (error) {
    res.status(500).send(error);
  }
});

app.get('/api/packages/:id', async (req, res) => {
  try {
    const packageId = req.params.id;
    const package = await Package.findById(packageId);
    res.status(200).send(package);
  } catch (error) {
    res.status(500).send(error);
  }
});


app.delete('/api/packages/:id', async (req, res) => {
  try {
      const packageId = req.params.id;
      const deletedPackage = await Package.findByIdAndDelete(packageId);

      if (!deletedPackage) {
          return res.status(404).send({ message: 'Package not found' });
      }

      res.status(200).send({ message: 'Package deleted successfully' });
  } catch (error) {
      res.status(500).send({ message: 'Error deleting package', error });
  }
});


app.put('/api/packages/:id', async (req, res) => {
  const packageId = req.params.id;
  const packageData = req.body;

  try {
      const updatedPackage = await Package.findByIdAndUpdate(
          packageId,
          packageData,
          { new: true } // This option returns the updated document
      );

      if (!updatedPackage) {
          return res.status(404).send({ message: 'Package not found' });
      }

      res.status(200).send(updatedPackage);
  } catch (error) {
      res.status(500).send({ message: 'Error updating package', error });
  }
});



//******************************** Uploading Image to Image Gallery*************************************/
// Configure multer for file storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'D:/FYP/galaxyetech/galaxyetech/public/images'); // set the destination of uploaded files
    },
    filename: (req, file, cb) => {
        // create a unique filename
        cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

// Upload endpoint
app.post('/api/upload-image', upload.single('image'), (req, res) => {
    if (!req.file) {
        return res.status(400).send('No file uploaded.');
    }

    // Respond with the path of the uploaded file
    res.status(200).json({ filePath: `/images/${req.file.filename}` });
});

// Serve static files from public folder
app.use(express.static('public'));


app.delete('/api/delete-image/:imageName', (req, res) => {
    const imageName = req.params.imageName;
    const imagePath = path.join('D:/FYP/galaxyetech/galaxyetech/public/images', imageName);
  
    fs.unlink(imagePath, (err) => {
      if (err) {
        return res.status(500).send('Error deleting image');
      }
      res.status(200).send('Image deleted');
    });
  });


app.use(express.json());

// In-memory store for OTPs
const otpStore = {};

// Transporter for nodemailer
const transporter = nodemailer.createTransport({
  service: 'gmail', // Use your email service
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  }
});

// Email and OTP Verification Endpoint
app.post('/api/send-otp', (req, res) => {
  const { email } = req.body;
  if (email === process.env.ADMIN_EMAIL) {
    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Store OTP with 1-minute expiry
    otpStore[email] = { otp, expires: Date.now() + 60000 };

    // Send OTP via email
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Your OTP',
      text: `Your OTP is: ${otp}`
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        return res.status(500).send({ message: 'Error sending email', error });
        
      }
      res.send({ message: 'OTP sent successfully' });
    });
  } else {
    res.status(401).send({ message: 'Unauthorized' });
  }
});

// OTP Validation Endpoint
app.post('/api/verify-otp', (req, res) => {
  const { email, otp } = req.body;
  const storedOtpData = otpStore[email];
  if (storedOtpData && storedOtpData.otp === otp && storedOtpData.expires > Date.now()) {
    // OTP is valid
    console.log("within otp verification")
    delete otpStore[email]; // Remove OTP from store

    // Create a token
    const token = jwt.sign({ email }, process.env.JWT_SECRET, { expiresIn: '30m' });
    res.send({ token, message: 'OTP verified successfully' });
  } else {
    res.status(400).send({ message: 'Invalid OTP or OTP expired' });
  }
});

// Logout Endpoint
app.post('/api/logout', (req, res) => {
  localStorage.removeItem('authToken');
  res.send({ message: 'Logged out successfully' });
});




// Start the server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
