const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const multer = require('multer');
const { v2: cloudinary } = require('cloudinary');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const app = express();
require('dotenv').config();
const nodemailer = require('nodemailer');
const jwt = require('jsonwebtoken');

const swaggerJsDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

// Swagger options
const swaggerOptions = {
  swaggerDefinition: {
    openapi: '3.0.0',
    info: {
      title: 'Galaxyetech API',
      version: '1.0.0',
      description: 'API documentation for Galaxyetech application',
    },
    servers: [
      {
        url: 'http://localhost:3001',
      },
    ],
  },
  apis: ['server.js'], // Path to the API docs
};

// Initialize swagger-jsdoc
const swaggerDocs = swaggerJsDoc(swaggerOptions);

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: '', // Folder name in Cloudinary
    format: async (req, file) => 'jpg', // Format can be jpg, png, etc.
    public_id: (req, file) => `custom_prefix_${Date.now()}`, // Set your custom public_id here
  },
});


const upload = multer({ storage });

// Connect to MongoDB Atlas
mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
    .then(() => console.log('MongoDB Connected'))
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

const imageSchema = new mongoose.Schema({
  name: { type: String, required: true },
  cloudinary_url: { type: String, required: true },
});

// Create a model from the schema
const Package = mongoose.model('Package', PackageSchema);

/**
 * @swagger
 * /api/packages:
 *   post:
 *     summary: Add a new package
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               selectedImage:
 *                 type: string
 *               name:
 *                 type: string
 *               numberOfCameras:
 *                 type: string
 *               waterproofBoxes:
 *                 type: string
 *               wireLength:
 *                 type: string
 *               hardDriveCapacity:
 *                 type: string
 *               dvr:
 *                 type: string
 *               dcPins:
 *                 type: string
 *               bncConnectors:
 *                 type: string
 *               packagePrice:
 *                 type: string
 *     responses:
 *       201:
 *         description: Package created successfully
 *       500:
 *         description: Error creating package
 */

app.post('/api/packages', async (req, res) => {
    try {
        const newPackage = new Package(req.body);
        await newPackage.save();
        res.status(201).send(newPackage);
    } catch (error) {
        res.status(500).send(error);
    }
});

/**
 * @swagger
 * /api/packages:
 *   get:
 *     summary: Get all packages
 *     responses:
 *       200:
 *         description: A list of packages
 *       500:
 *         description: Error fetching packages
 */

app.get('/api/packages', async (req, res) => {
    try {
        const packages = await Package.find({});
        res.status(200).send(packages);
    } catch (error) {
        res.status(500).send(error);
    }
});

/**
 * @swagger
 * /api/packages/{id}:
 *   get:
 *     summary: Get a package by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: The ID of the package to retrieve
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: A single package
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 _id:
 *                   type: string
 *                 selectedImage:
 *                   type: string
 *                 name:
 *                   type: string
 *                 numberOfCameras:
 *                   type: string
 *                 waterproofBoxes:
 *                   type: string
 *                 wireLength:
 *                   type: string
 *                 hardDriveCapacity:
 *                   type: string
 *                 dvr:
 *                   type: string
 *                 dcPins:
 *                   type: string
 *                 bncConnectors:
 *                   type: string
 *                 packagePrice:
 *                   type: string
 *       404:
 *         description: Package not found
 *       500:
 *         description: Error fetching package
 */
app.get('/api/packages/:id', async (req, res) => {
  try {
      const packageId = req.params.id;
      const package = await Package.findById(packageId);
      res.status(200).send(package);
  } catch (error) {
      res.status(500).send(error);
  }
});

/**
* @swagger
* /api/packages/{id}:
*   delete:
*     summary: Delete a package by ID
*     parameters:
*       - in: path
*         name: id
*         required: true
*         description: The ID of the package to delete
*         schema:
*           type: string
*     responses:
*       200:
*         description: Package deleted successfully
*       404:
*         description: Package not found
*       500:
*         description: Error deleting package
*/
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

/**
* @swagger
* /api/packages/{id}:
*   put:
*     summary: Update a package by ID
*     parameters:
*       - in: path
*         name: id
*         required: true
*         description: The ID of the package to update
*         schema:
*           type: string
*     requestBody:
*       required: true
*       content:
*         application/json:
*           schema:
*             type: object
*             properties:
*               selectedImage:
*                 type: string
*               name:
*                 type: string
*               numberOfCameras:
*                 type: string
*               waterproofBoxes:
*                 type: string
*               wireLength:
*                 type: string
*               hardDriveCapacity:
*                 type: string
*               dvr:
*                 type: string
*               dcPins:
*                 type: string
*               bncConnectors:
*                 type: string
*               packagePrice:
*                 type: string
*     responses:
*       200:
*         description: Package updated successfully
*       404:
*         description: Package not found
*       500:
*         description: Error updating package
*/
app.put('/api/packages/:id', async (req, res) => {
  const packageId = req.params.id;
  const packageData = req.body;

  try {
      const updatedPackage = await Package.findByIdAndUpdate(
          packageId,
          packageData,
          { new: true }
      );

      if (!updatedPackage) {
          return res.status(404).send({ message: 'Package not found' });
      }

      res.status(200).send(updatedPackage);
  } catch (error) {
      res.status(500).send({ message: 'Error updating package', error });
  }
});

/**
 * @swagger
 * /api/upload-image:
 *   post:
 *     summary: Upload an image to Cloudinary
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: The image file to upload
 *     responses:
 *       200:
 *         description: Image uploaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 filePath:
 *                   type: string
 *                   description: The URL of the uploaded image
 *       400:
 *         description: No file uploaded
 *       500:
 *         description: Error uploading image
 */
app.post('/api/upload-image', upload.single('image'), (req, res) => {
  if (!req.file) {
      return res.status(400).send('No file uploaded.');
  }

  // Respond with the URL of the uploaded image
  res.status(200).json({ filePath: req.file.path });
});

/**
* @swagger
* /api/delete-image/{publicId}:
*   delete:
*     summary: Delete an image from Cloudinary
*     parameters:
*       - in: path
*         name: publicId
*         required: true
*         description: The public ID of the image to delete
*         schema:
*           type: string
*     responses:
*       200:
*         description: Image deleted successfully
*       500:
*         description: Error deleting image
*/
app.delete('/api/delete-image/:publicId', async (req, res) => {
  const { publicId } = req.params;
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    console.log('Cloudinary deletion result:', result); // Log the Cloudinary response
    if (result.result === 'not found') {
      return res.status(404).send('Image not found');
    }
    res.status(200).send('Image deleted');
  } catch (error) {
    console.error('Error deleting image:', error);
    res.status(500).send('Error deleting image');
  }
});



app.get('/api/gallery-images', async (req, res) => {
  try {
    // Use Cloudinary API to fetch images from the root directory
    const result = await cloudinary.search
      .expression('folder:""') // An empty folder string indicates the root directory
      .sort_by('public_id', 'desc')
      .max_results(30)
      .execute();

    // Map the result to get URLs and public IDs
    const images = result.resources.map((file) => ({
      url: file.secure_url,
      public_id: file.public_id // Get the public_id for future use (like deletion)
    }));

    res.status(200).json(images);
  } catch (error) {
    console.error('Error fetching images:', error);
    res.status(500).send({ message: 'Error fetching images', error });
  }
});


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



/**
 * @swagger
 * /api/send-otp:
 *   post:
 *     summary: Send an OTP to the user's email
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: The email address to send the OTP to
 *     responses:
 *       200:
 *         description: OTP sent successfully
 *       401:
 *         description: Unauthorized - email does not match the admin email
 *       500:
 *         description: Error sending email
 */

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

/**
* @swagger
* /api/verify-otp:
*   post:
*     summary: Verify the OTP sent to the user's email
*     requestBody:
*       required: true
*       content:
*         application/json:
*           schema:
*             type: object
*             properties:
*               email:
*                 type: string
*                 format: email
*                 description: The email address of the user
*               otp:
*                 type: string
*                 description: The OTP to verify
*     responses:
*       200:
*         description: OTP verified successfully
*         content:
*           application/json:
*             schema:
*               type: object
*               properties:
*                 token:
*                   type: string
*                   description: JWT token for authenticated session
*                 message:
*                   type: string
*                   description: Success message
*       400:
*         description: Invalid OTP or OTP expired
*/
app.post('/api/verify-otp', (req, res) => {
  const { email, otp } = req.body;
  const storedOtpData = otpStore[email];
  if (storedOtpData && storedOtpData.otp === otp && storedOtpData.expires > Date.now()) {
      delete otpStore[email];
      const token = jwt.sign({ email }, process.env.JWT_SECRET, { expiresIn: '30m' });
      res.send({ token, message: 'OTP verified successfully' });
  } else {
      res.status(400).send({ message: 'Invalid OTP or OTP expired' });
  }
});

/**
* @swagger
* /api/logout:
*   post:
*     summary: Logout the user
*     responses:
*       200:
*         description: Logged out successfully
*/
app.post('/api/logout', (req, res) => {
  res.send({ message: 'Logged out successfully' });
});


const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
