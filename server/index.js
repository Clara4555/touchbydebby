import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import path from "path";
import mongoose from "mongoose";
import multer from "multer";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";
import fs from "fs";
import { fileURLToPath } from "url";

/* =======================
   CONFIG
======================= */
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

/* =======================
   MODELS (ES MODULE IMPORTS)
======================= */
import User from "./models/User.js";
import Service from "./models/Service.js";
import Booking from "./models/Booking.js";
import Portfolio from "./models/Portfolio.js";

/* =======================
   PERMANENT UPLOAD DIRECTORIES
======================= */
// Use a permanent directory in your project (not temp)
// Create in project root or a dedicated storage location
const projectRoot = process.cwd();
const uploadsDir = path.join(projectRoot, "uploads");
const paymentsDir = path.join(uploadsDir, "payments");
const portfolioDir = path.join(uploadsDir, "portfolio");

// Ensure directories exist with proper error handling
const ensureDirectories = () => {
  try {
    // Create main uploads directory
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
      console.log(`✅ Created uploads directory: ${uploadsDir}`);
    }

    // Create subdirectories
    [paymentsDir, portfolioDir].forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        console.log(`✅ Created directory: ${dir}`);
      }
    });

    // Verify write permissions
    const testFile = path.join(uploadsDir, "write_test.txt");
    fs.writeFileSync(testFile, "Write test - " + new Date().toISOString());
    fs.unlinkSync(testFile);
    
    console.log(`✅ Write permissions verified for: ${uploadsDir}`);
    console.log(`📁 Permanent upload path: ${uploadsDir}`);
    
  } catch (error) {
    console.error("❌ FATAL: Cannot create/write to uploads directory:", error.message);
    console.error("Please check:");
    console.error("1. Disk space availability");
    console.error("2. File permissions on the project folder");
    console.error("3. If using OneDrive, ensure 'Files On-Demand' is disabled for this folder");
    console.error("\n💡 Solution: Run as Administrator or change project location");
    process.exit(1); // Stop server if can't write files
  }
};

// Create directories on server start
ensureDirectories();

/* =======================
   DATABASE CONNECTION
======================= */
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch(err => console.error("❌ MongoDB Error:", err));

/* =======================
   MIDDLEWARE
======================= */
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use("/uploads", express.static(uploadsDir));

/* =======================
   INITIAL DATA
======================= */
async function initializeAdmin() {
  console.log("ℹ️  Admin will be created via setup endpoint");
  // No auto-creation - admin must setup via /api/auth/setup
}

async function initializeServices() {
  const services = await Service.find();

  if (services.length === 0) {
    await Service.insertMany([
      { 
        name: "Bridal Makeup", 
        description: "Complete bridal makeup package for your special day",
        price: 250, 
        category: "bridal", 
        duration: "2 hours" 
      },
      { 
        name: "Evening Glam", 
        description: "Glamorous makeup for evening events and parties",
        price: 150, 
        category: "glam", 
        duration: "1.5 hours" 
      },
      { 
        name: "Natural Makeup", 
        description: "Light, natural-looking makeup for everyday wear",
        price: 120, 
        category: "natural", 
        duration: "1 hour" 
      },
      { 
        name: "Editorial Makeup", 
        description: "Creative makeup for photoshoots and editorial work",
        price: 200, 
        category: "editorial", 
        duration: "2 hours" 
      },
      { 
        name: "Event Makeup", 
        description: "Makeup for special events and occasions",
        price: 130, 
        category: "events", 
        duration: "1.5 hours" 
      },
    ]);

    console.log("✅ Default services created");
  }
}

/* =======================
   MULTER CONFIG (PRODUCTION-READY)
======================= */
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Determine folder based on route
    let uploadPath = paymentsDir; // Default for bookings
    
    // Check if this is a portfolio upload
    if (req.path && req.path.includes("portfolio")) {
      uploadPath = portfolioDir;
    }
    
    // Double-check directory exists
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    // Create unique, safe filename
    const uniquePrefix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const safeFilename = file.originalname
      .toLowerCase()
      .replace(/[^a-z0-9.]/g, '_') // Replace special chars with underscores
      .replace(/\s+/g, '_');
    
    const finalFilename = `${uniquePrefix}-${safeFilename}`;
    cb(null, finalFilename);
  },
});

// File filter for images only
const fileFilter = (req, file, cb) => {
  const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed.'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { 
    fileSize: 10 * 1024 * 1024, // 10MB max file size
    files: 1 // Max 1 file per upload
  },
});

/* =======================
   EMAIL SETUP
======================= */
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

/* =======================
   AUTH MIDDLEWARE
======================= */
const auth = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace("Bearer ", "");
    if (!token) return res.status(401).json({ error: "Unauthorized" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);

    if (!user) return res.status(401).json({ error: "Unauthorized" });

    req.user = user;
    next();
  } catch {
    res.status(401).json({ error: "Unauthorized" });
  }
};

/* =======================
   ROUTES
======================= */

// ✅ Admin Setup (first-time only)
app.post("/api/auth/setup", async (req, res) => {
  try {
    const existingAdmin = await User.findOne({ role: "admin" });
    
    if (existingAdmin) {
      return res.status(400).json({ 
        error: "Admin already exists. Use login instead." 
      });
    }

    const { email, password, name } = req.body;
    
    // Validate input
    if (!email || !password || !name) {
      return res.status(400).json({ error: "All fields are required" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create admin user
    const admin = await User.create({
      email,
      password: hashedPassword,
      name,
      role: "admin"
    });

    // Generate token
    const token = jwt.sign(
      { userId: admin._id },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.status(201).json({
      message: "Admin account created successfully",
      token,
      user: admin
    });
  } catch (error) {
    console.error("Setup error:", error);
    res.status(500).json({ error: "Failed to create admin account" });
  }
});

// Login
app.post("/api/auth/login", async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });
  if (!user) {
    // Check for first-time setup
    const totalUsers = await User.countDocuments();
    if (totalUsers === 0) {
      return res.status(404).json({ 
        error: "No admin found. Please setup admin account first.",
        requiresSetup: true 
      });
    }
    return res.status(401).json({ error: "Invalid credentials" });
  }

  const match = await bcrypt.compare(password, user.password);
  if (!match) return res.status(401).json({ error: "Invalid credentials" });

  const token = jwt.sign(
    { userId: user._id },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );

  res.json({ token, user });
});

// Services
app.get("/api/services", async (_, res) => {
  const services = await Service.find();
  res.json(services);
});

// Portfolio Routes
app.get("/api/portfolio", async (req, res) => {
  try {
    const images = await Portfolio.find(req.query.category ? { category: req.query.category } : {});
    res.json(images);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch portfolio" });
  }
});

// Upload portfolio image (admin only)
app.post("/api/admin/portfolio", auth, upload.single("image"), async (req, res) => {
  try {
    const { title, category } = req.body;
    
    if (!req.file) {
      return res.status(400).json({ error: "Image file is required" });
    }
    
    if (!title || !category) {
      return res.status(400).json({ error: "Title and category are required" });
    }
    
    const portfolio = await Portfolio.create({
      title,
      imageUrl: `/uploads/portfolio/${req.file.filename}`,
      category
    });
    
    res.status(201).json({
      message: "Portfolio image uploaded successfully",
      portfolio
    });
  } catch (error) {
    console.error("Portfolio upload error:", error);
    res.status(500).json({ error: "Failed to upload portfolio image" });
  }
});

// Delete portfolio image (admin only)
app.delete("/api/admin/portfolio/:id", auth, async (req, res) => {
  try {
    const portfolio = await Portfolio.findById(req.params.id);
    
    if (!portfolio) {
      return res.status(404).json({ error: "Portfolio image not found" });
    }
    
    // Delete the physical file
    const filePath = path.join(uploadsDir, portfolio.imageUrl.replace('/uploads/', ''));
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    
    // Delete from database
    await portfolio.deleteOne();
    
    res.json({ message: "Portfolio image deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete portfolio image" });
  }
});

// Booking
app.post("/api/bookings", upload.single("paymentScreenshot"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "Payment proof is required" });
    }

    // Parse numeric fields
    const bookingData = {
      ...req.body,
      amountPaid: parseFloat(req.body.amountPaid),
      totalAmount: parseFloat(req.body.totalAmount),
      preferredDate: new Date(req.body.preferredDate),
      paymentScreenshot: `/uploads/payments/${req.file.filename}`
    };

    const booking = await Booking.create(bookingData);

    // Send emails if SMTP is configured
    if (process.env.SMTP_USER && process.env.SMTP_PASS) {
      try {
        // Email to admin
        await transporter.sendMail({
          to: process.env.ADMIN_EMAIL,
          subject: "New Booking - touchbydebby",
          html: `
            <h2>New Booking Received</h2>
            <p><strong>Client:</strong> ${booking.fullName}</p>
            <p><strong>Email:</strong> ${booking.email}</p>
            <p><strong>Phone:</strong> ${booking.phone}</p>
            <p><strong>Service:</strong> ${booking.serviceName}</p>
            <p><strong>Date:</strong> ${booking.preferredDate.toDateString()}</p>
            <p><strong>Time:</strong> ${booking.preferredTime}</p>
            <p><strong>Amount Paid:</strong> $${booking.amountPaid}</p>
            <p><strong>Total Amount:</strong> $${booking.totalAmount}</p>
            <p>Please check the admin dashboard for payment verification.</p>
          `,
        });

        // Email to customer
        await transporter.sendMail({
          to: booking.email,
          subject: "Booking Received - touchbydebby",
          html: `
            <h2>Booking Request Received</h2>
            <p>Dear ${booking.fullName},</p>
            <p>Thank you for booking with touchbydebby!</p>
            <p>We have received your appointment request for <strong>${booking.serviceName}</strong> on <strong>${booking.preferredDate.toDateString()}</strong> at <strong>${booking.preferredTime}</strong>.</p>
            <p>Your booking is currently <strong>pending confirmation</strong>. We will review your payment and contact you shortly to confirm your appointment.</p>
            <p>If you have any questions, please don't hesitate to contact us.</p>
            <p>Best regards,<br>The touchbydebby Team</p>
          `,
        });
      } catch (emailError) {
        console.error("Email sending failed:", emailError);
        // Don't fail the booking if email fails
      }
    }

    res.status(201).json({
      message: "Booking submitted successfully",
      booking
    });
  } catch (error) {
    console.error("Booking error:", error);
    
    // Clean up uploaded file if booking failed
    if (req.file) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (unlinkError) {
        console.error("Failed to cleanup file:", unlinkError);
      }
    }
    
    res.status(500).json({ 
      error: "Failed to create booking",
      details: error.message 
    });
  }
});

// Admin Booking Management
app.get("/api/admin/bookings", auth, async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const query = status ? { status } : {};
    
    const bookings = await Booking.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));
    
    const total = await Booking.countDocuments(query);
    
    res.json({
      bookings,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch bookings" });
  }
});

app.put("/api/admin/bookings/:id/status", auth, async (req, res) => {
  try {
    const { status, notes } = req.body;
    
    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ error: "Booking not found" });
    }
    
    booking.status = status;
    if (notes) booking.notes = notes;
    
    await booking.save();
    
    // Send status update email to customer
    if (process.env.SMTP_USER && process.env.SMTP_PASS) {
      try {
        await transporter.sendMail({
          to: booking.email,
          subject: `Booking ${status} - touchbydebby`,
          html: `
            <h2>Booking Update</h2>
            <p>Dear ${booking.fullName},</p>
            <p>Your booking for <strong>${booking.serviceName}</strong> has been <strong>${status}</strong>.</p>
            ${status === 'confirmed' ? `
              <p>Your appointment is confirmed! We look forward to seeing you on <strong>${booking.preferredDate.toDateString()}</strong> at <strong>${booking.preferredTime}</strong>.</p>
              <p>Please arrive 15 minutes before your scheduled time.</p>
            ` : ''}
            ${notes ? `<p><strong>Notes:</strong> ${notes}</p>` : ''}
            <p>If you have any questions, please don't hesitate to contact us.</p>
            <p>Best regards,<br>The touchbydebby Team</p>
          `,
        });
      } catch (emailError) {
        console.error("Status email failed:", emailError);
      }
    }
    
    res.json({ 
      message: "Booking status updated", 
      booking 
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to update booking status" });
  }
});

// Health check with file system verification
app.get("/api/health", (_, res) => {
  const health = {
    status: "OK",
    timestamp: new Date().toISOString(),
    uploads: {
      directory: uploadsDir,
      exists: fs.existsSync(uploadsDir),
      writable: false,
      payments: {
        directory: paymentsDir,
        exists: fs.existsSync(paymentsDir)
      },
      portfolio: {
        directory: portfolioDir,
        exists: fs.existsSync(portfolioDir)
      }
    }
  };
  
  // Test write permission
  try {
    const testFile = path.join(uploadsDir, "health_check.txt");
    fs.writeFileSync(testFile, "Health check - " + new Date().toISOString());
    fs.unlinkSync(testFile);
    health.uploads.writable = true;
  } catch (error) {
    health.uploads.writable = false;
    health.uploads.writeError = error.message;
  }
  
  res.json(health);
});

// Cleanup route (optional - for maintenance)
app.delete("/api/admin/cleanup", auth, async (req, res) => {
  try {
    // Delete bookings older than 1 year
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    
    const oldBookings = await Booking.find({ 
      createdAt: { $lt: oneYearAgo },
      status: { $in: ['completed', 'cancelled'] }
    });
    
    let deletedFiles = 0;
    for (const booking of oldBookings) {
      // Delete payment screenshot file
      if (booking.paymentScreenshot) {
        const filePath = path.join(uploadsDir, booking.paymentScreenshot.replace('/uploads/', ''));
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
          deletedFiles++;
        }
      }
    }
    
    // Delete old bookings from database
    const result = await Booking.deleteMany({ 
      createdAt: { $lt: oneYearAgo },
      status: { $in: ['completed', 'cancelled'] }
    });
    
    res.json({
      message: "Cleanup completed",
      deletedBookings: result.deletedCount,
      deletedFiles: deletedFiles
    });
  } catch (error) {
    res.status(500).json({ error: "Cleanup failed" });
  }
});

/* =======================
   ERROR HANDLING MIDDLEWARE
======================= */
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File too large. Maximum size is 10MB.' });
    }
    return res.status(400).json({ error: err.message });
  }
  
  console.error("Server error:", err);
  res.status(500).json({ error: "Internal server error" });
});

/* =======================
   START SERVER
======================= */
const PORT = process.env.PORT || 5000;

app.listen(PORT, async () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📁 Permanent upload directory: ${uploadsDir}`);
  console.log(`📁 Access uploaded files at: http://localhost:${PORT}/uploads/`);
  
  await initializeAdmin();
  await initializeServices();
});