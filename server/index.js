// index.js
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

// Exchange rate (1 USD to NGN)
const EXCHANGE_RATE = 1500;

/* =======================
   MODELS
======================= */
import User from "./models/User.js";
import Service from "./models/Service.js";
import Booking from "./models/Booking.js";
import Portfolio from "./models/Portfolio.js";
// Remove these lines:
// const adminRoutes = require('./routes/admin');
// const adminBookingsRoutes = require('./routes/adminBookings'); // If separate
// Add these imports (since you're using ES modules):
import adminRoutes from './routes/admin.js';
import adminBookingsRoutes from './routes/adminBookings.js'; // If you have this file

/* =======================
   UPLOAD DIRECTORIES
======================= */
const uploadsDir = path.join(__dirname, "uploads");

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  fs.mkdirSync(path.join(uploadsDir, "payments"), { recursive: true });
  fs.mkdirSync(path.join(uploadsDir, "portfolio"), { recursive: true });
}

/* =======================
   MIDDLEWARE
======================= */
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use("/uploads", express.static(uploadsDir));
// In your main server file
// Mount routes
app.use('/api/admin', adminRoutes);
app.use('/api/admin', adminBookingsRoutes);

/* =======================
   DATABASE CONNECTION
======================= */
mongoose
  .connect(process.env.MONGO_URI, {
    serverSelectionTimeoutMS: 10000,
    socketTimeoutMS: 45000,
    family: 4, // force IPv4
  })
  .then(async () => {
    console.log("✅ MongoDB Connected");

    // Initialize default services AFTER DB connects
    await initializeServices();
  })
  .catch(err => {
    console.error("❌ MongoDB Connection Error:", err);
    process.exit(1);
  });

/* =======================
   INITIAL DATA
======================= */
async function initializeServices() {
  const count = await Service.countDocuments();

  if (count === 0) {
    await Service.insertMany([
      {
        name: "Bridal Makeup",
        description: "Complete bridal makeup package",
        price: 250,
        category: "bridal",
        duration: "2 hours",
      },
      {
        name: "Evening Glam",
        description: "Glam makeup for special events",
        price: 150,
        category: "glam",
        duration: "1.5 hours",
      },
      {
        name: "Natural Makeup",
        description: "Light, natural everyday makeup",
        price: 120,
        category: "natural",
        duration: "1 hour",
      },
      {
        name: "Editorial Makeup",
        description: "Creative makeup for photoshoots",
        price: 200,
        category: "editorial",
        duration: "2 hours",
      },
      {
        name: "Event Makeup",
        description: "Makeup for events and occasions",
        price: 130,
        category: "events",
        duration: "1.5 hours",
      },
    ]);

    console.log("✅ Default services created");
  }
}

/* =======================
   MULTER CONFIG
======================= */
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const folder = req.path.includes("portfolio") ? "portfolio" : "payments";
    cb(null, path.join(uploadsDir, folder));
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
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
    console.log("🔐 Auth middleware called");
    const token = req.headers.authorization?.replace("Bearer ", "");
    console.log("Token received:", token ? "Yes" : "No");
    
    if (!token) {
      console.log("❌ No token provided");
      return res.status(401).json({ error: "Unauthorized" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'touchbydebby-secret-key');
    console.log("Decoded token:", decoded);
    
    const user = await User.findById(decoded.userId);
    console.log("User found:", user ? `Yes (${user.email})` : "No");

    if (!user || user.role !== "admin") {
      console.log("❌ User not admin or not found");
      return res.status(401).json({ error: "Unauthorized" });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error("🔐 Auth error:", error.message);
    res.status(401).json({ error: "Unauthorized" });
  }
};

/* =======================
   ROUTES
======================= */

/* ---------- ADMIN SETUP (FIRST TIME ONLY) ---------- */
app.post("/api/auth/setup", async (req, res) => {
  console.log("🛠️ Admin setup endpoint called");
  console.log("Request body:", req.body);
  
  try {
    // Check if any admin exists
    const existingAdmin = await User.findOne({ role: "admin" });
    console.log("Existing admin found:", existingAdmin ? "Yes" : "No");
    
    if (existingAdmin) {
      console.log("❌ Admin already exists");
      return res.status(400).json({ error: "Admin already exists" });
    }

    const { email, password, name } = req.body;
    console.log("Registration data:", { email, name });
    
    if (!email || !password || !name) {
      console.log("❌ Missing fields");
      return res.status(400).json({ error: "All fields are required" });
    }

    // Check if email already exists (even for non-admin)
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      console.log("❌ Email already exists");
      return res.status(400).json({ error: "Email already registered" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    console.log("Password hashed successfully");

    const admin = await User.create({
      email,
      password: hashedPassword,
      name,
      role: "admin",
    });
    
    console.log("✅ Admin created successfully:", admin.email);

    const token = jwt.sign(
      { userId: admin._id, email: admin.email },
      process.env.JWT_SECRET || 'touchbydebby-secret-key',
      { expiresIn: "7d" }
    );
    
    console.log("✅ Token generated");

    res.status(201).json({ 
      message: "Admin created successfully", 
      token, 
      user: {
        id: admin._id,
        email: admin.email,
        name: admin.name,
        role: admin.role,
      }
    });
  } catch (error) {
    console.error("❌ Setup error:", error.message);
    res.status(500).json({ error: error.message });
  }
});

/* ---------- LOGIN ---------- */
app.post("/api/auth/login", async (req, res) => {
  console.log("🔑 Login endpoint called");
  console.log("Request body:", req.body);
  
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      console.log("❌ Missing email or password");
      return res.status(400).json({ error: "Email and password are required" });
    }

    // Check if user exists
    const user = await User.findOne({ email });
    console.log("User found:", user ? `Yes (role: ${user.role})` : "No");
    
    if (!user) {
      // Check if any admin exists at all
      const adminCount = await User.countDocuments({ role: "admin" });
      console.log("Total admin users:", adminCount);
      
      if (adminCount === 0) {
        console.log("⚠️ No admin found - requires setup");
        return res.status(404).json({
          error: "No admin found",
          requiresSetup: true,
        });
      }
      console.log("❌ Invalid credentials");
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Check if user is admin
    if (user.role !== "admin") {
      console.log("❌ User is not an admin");
      return res.status(401).json({ error: "Unauthorized - Admin access only" });
    }

    // Verify password
    const match = await bcrypt.compare(password, user.password);
    console.log("Password match:", match ? "Yes" : "No");
    
    if (!match) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Generate token
    const token = jwt.sign(
      { userId: user._id, email: user.email },
      process.env.JWT_SECRET || 'touchbydebby-secret-key',
      { expiresIn: "7d" }
    );
    
    console.log("✅ Login successful for:", user.email);

    res.json({ 
      token, 
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
      }
    });
  } catch (error) {
    console.error("❌ Login error:", error.message);
    res.status(500).json({ error: error.message });
  }
});

/* ---------- CHECK AUTH STATUS ---------- */
app.get("/api/auth/me", auth, async (req, res) => {
  console.log("👤 Auth check endpoint called");
  console.log("User:", req.user.email);
  
  res.json({
    user: {
      id: req.user._id,
      email: req.user.email,
      name: req.user.name,
      role: req.user.role,
    },
  });
});

/* ---------- CHECK IF SETUP REQUIRED ---------- */
app.get("/api/auth/check-setup", async (req, res) => {
  console.log("🔍 Checking if setup required");
  
  try {
    const adminCount = await User.countDocuments({ role: "admin" });
    console.log("Admin count:", adminCount);
    
    res.json({ 
      requiresSetup: adminCount === 0,
      adminCount 
    });
  } catch (error) {
    console.error("❌ Check setup error:", error.message);
    res.status(500).json({ error: error.message });
  }
});

/* ---------- SERVICES ---------- */
app.get("/api/services", async (_, res) => {
  console.log("📦 Fetching services");
  
  try {
    const services = await Service.find();
    console.log("Found services:", services.length);
    res.json(services);
  } catch (error) {
    console.error("❌ Services error:", error.message);
    res.status(500).json({ error: error.message });
  }
});

/* ---------- PORTFOLIO ---------- */
app.get("/api/portfolio", async (req, res) => {
  console.log("🖼️ Fetching portfolio");
  
  try {
    const filter = req.query.category ? { category: req.query.category } : {};
    const images = await Portfolio.find(filter);
    console.log("Found portfolio images:", images.length);
    res.json(images);
  } catch (error) {
    console.error("❌ Portfolio error:", error.message);
    res.status(500).json({ error: error.message });
  }
});

/* ---------- BOOKINGS ---------- */
app.post(
  "/api/bookings",
  upload.single("paymentScreenshot"),
  async (req, res) => {
    try {
      if (!req.file) {
        console.log("❌ No payment screenshot provided");
        return res.status(400).json({ error: "Payment screenshot is required" });
      }

      const {
        fullName,
        email,
        phone,
        serviceType,
        serviceName,
        preferredDate,
        preferredTime,
        location,
        amountPaid,
        totalAmount,
      } = req.body;
      
      console.log("Booking data received:", { fullName, email, serviceName });

      // Calculate Naira amounts
      const amountPaidNaira = Math.round(parseFloat(amountPaid) * EXCHANGE_RATE);
      const totalAmountNaira = Math.round(parseFloat(totalAmount) * EXCHANGE_RATE);

      const booking = await Booking.create({
        fullName,
        email,
        phone,
        serviceType,
        serviceName,
        preferredDate,
        preferredTime,
        location,
        paymentScreenshot: `/uploads/payments/${req.file.filename}`,
        amountPaid,
        totalAmount,
        amountPaidNaira,
        totalAmountNaira,
      });
      
      console.log("✅ Booking created:", booking._id);

      // Email sending code remains the same...
      if (process.env.SMTP_USER && process.env.SMTP_PASS) {
        const baseUrl = process.env.BASE_URL || 'http://localhost:5000';
        const paymentScreenshotUrl = `${baseUrl}/uploads/payments/${req.file.filename}`;
        const adminEmail = process.env.ADMIN_EMAIL || process.env.SMTP_USER;

        // Admin email
        try {
          await transporter.sendMail({
            to: adminEmail,
            subject: "🎀 New Booking Requires Verification - touchbydebby",
            html: `
              <!DOCTYPE html>
              <html>
              <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>New Booking - touchbydebby</title>
                <style>
                 body {
                    font-family: 'Arial', sans-serif;
                    line-height: 1.6;
                    color: #333;
                    margin: 0;
                    padding: 20px;
                    background-color: #f9f9f9;
                  }
                  .container {
                    max-width: 700px;
                    margin: 0 auto;
                    background: white;
                    border-radius: 16px;
                    overflow: hidden;
                    box-shadow: 0 4px 20px rgba(0,0,0,0.1);
                  }
                  .header {
                    background: linear-gradient(135deg, #FFD1DC 0%, #FFB6C1 100%);
                    padding: 30px 20px;
                    text-align: center;
                    color: #7a0039;
                  }
                  .header h1 {
                    margin: 0;
                    font-size: 28px;
                    font-weight: bold;
                  }
                  .content {
                    padding: 30px;
                  }
                  .booking-card {
                    background: #FFF5F7;
                    border-radius: 12px;
                    padding: 20px;
                    margin: 25px 0;
                    border-left: 4px solid #FF6B9D;
                  }
                  .info-row {
                    display: flex;
                    justify-content: space-between;
                    padding: 12px 0;
                    border-bottom: 1px solid #FFE4E9;
                  }
                  .info-row:last-child {
                    border-bottom: none;
                  }
                  .info-label {
                    font-weight: 600;
                    color: #7a0039;
                  }
                  .info-value {
                    color: #333;
                  }
                  .amount {
                    font-size: 20px;
                    font-weight: bold;
                    color: #FF6B9D;
                  }
                  .currency {
                    font-size: 14px;
                    color: #666;
                    margin-left: 5px;
                  }
                  .status-tag {
                    display: inline-block;
                    background: #FFF3CD;
                    color: #856404;
                    padding: 8px 20px;
                    border-radius: 20px;
                    font-weight: 600;
                    font-size: 14px;
                    margin: 15px 0;
                  }
                  .payment-screenshot {
                    margin: 20px 0;
                    text-align: center;
                  }
                  .payment-screenshot img {
                    max-width: 100%;
                    border-radius: 8px;
                    border: 2px solid #FFE4E9;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                  }
                  .footer {
                    text-align: center;
                    padding: 20px;
                    background: #FFF5F7;
                    color: #666;
                    font-size: 14px;
                    border-top: 1px solid #FFE4E9;
                  }
                </style>
              </head>
              <body>
                <div class="container">
                  <div class="header">
                    <h1>📅 New Booking Alert</h1>
                    <p>Appointment requires your attention</p>
                  </div>
                  
                  <div class="content">
                    <h2 style="color: #7a0039; margin-top: 0;">Client Information</h2>
                    
                    <div class="booking-card">
                      <div class="info-row">
                        <span class="info-label">Client:</span>
                        <span class="info-value">${fullName}</span>
                      </div>
                      <div class="info-row">
                        <span class="info-label">Contact:</span>
                        <span class="info-value">${email} | ${phone}</span>
                      </div>
                      <div class="info-row">
                        <span class="info-label">Service:</span>
                        <span class="info-value">${serviceName}</span>
                      </div>
                      <div class="info-row">
                        <span class="info-label">Date & Time:</span>
                        <span class="info-value">
                          ${new Date(preferredDate).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })} at ${preferredTime}:00
                        </span>
                      </div>
                      ${location ? `
                      <div class="info-row">
                        <span class="info-label">Location:</span>
                        <span class="info-value">${location}</span>
                      </div>
                      ` : ''}
                      <div class="info-row">
                        <span class="info-label">Deposit Paid:</span>
                        <span class="info-value">
                          <span class="amount">₦${amountPaidNaira.toLocaleString()}</span>
                          <span class="currency">($${amountPaid} USD)</span>
                        </span>
                      </div>
                      <div class="info-row">
                        <span class="info-label">Total Amount:</span>
                        <span class="info-value">
                          <span class="amount">₦${totalAmountNaira.toLocaleString()}</span>
                          <span class="currency">($${totalAmount} USD)</span>
                        </span>
                      </div>
                    </div>
                    
                    <div class="payment-screenshot">
                      <h3 style="color: #7a0039;">Payment Screenshot</h3>
                      <img src="${paymentScreenshotUrl}" alt="Payment Screenshot" style="max-width: 500px; margin: 10px auto;">
                      <p style="color: #666; font-size: 14px;">
                        <a href="${paymentScreenshotUrl}" style="color: #FF6B9D;">View Full Size</a>
                      </p>
                    </div>
                    
                    <div class="status-tag">
                      ⚠️ Action Required: Verify Payment Screenshot
                    </div>
                    
                    <p style="color: #666; font-size: 14px;">
                      Please log in to the admin dashboard to review the payment screenshot and confirm this booking.
                      The client has been notified that their booking is pending verification.
                    </p>
                  </div>
                  
                  <div class="footer">
                    <p>touchbydebby Admin System | Automated Notification</p>
                  </div>
                </div>
              </body>
              </html>
            `,
          });
          console.log("✅ Admin email sent");
        } catch (emailError) {
          console.error("❌ Admin email error:", emailError.message);
        }

        // Customer email
        try {
          await transporter.sendMail({
            to: email,
            subject: "✨ Your Booking is Being Confirmed - touchbydebby",
            html: `
              <!DOCTYPE html>
              <html>
              <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Booking Confirmation - touchbydebby</title>
                <style>
                  body {
                    font-family: 'Arial', sans-serif;
                    line-height: 1.6;
                    color: #333;
                    margin: 0;
                    padding: 20px;
                    background-color: #f9f9f9;
                  }
                  .container {
                    max-width: 600px;
                    margin: 0 auto;
                    background: white;
                    border-radius: 16px;
                    overflow: hidden;
                    box-shadow: 0 4px 20px rgba(0,0,0,0.1);
                  }
                  .header {
                    background: linear-gradient(135deg, #FFD1DC 0%, #FFB6C1 100%);
                    padding: 40px 20px;
                    text-align: center;
                    color: #7a0039;
                  }
                  .header h1 {
                    margin: 0;
                    font-size: 32px;
                    font-weight: bold;
                  }
                  .content {
                    padding: 40px 30px;
                  }
                  .appointment-details {
                    background: #FFF5F7;
                    border-radius: 12px;
                    padding: 25px;
                    margin: 25px 0;
                  }
                  .detail {
                    margin-bottom: 15px;
                  }
                  .detail-label {
                    font-weight: 600;
                    color: #7a0039;
                    display: block;
                    margin-bottom: 5px;
                    font-size: 14px;
                  }
                  .detail-value {
                    color: #333;
                    font-size: 16px;
                  }
                  .payment-confirmation {
                    background: #F0FFF4;
                    border-radius: 10px;
                    padding: 20px;
                    margin: 20px 0;
                    border-left: 4px solid #48BB78;
                    text-align: center;
                  }
                  .footer {
                    text-align: center;
                    padding: 25px;
                    background: #FFF5F7;
                    color: #666;
                    font-size: 14px;
                    border-top: 1px solid #FFE4E9;
                  }
                  .status-badge {
                    display: inline-block;
                    background: #FFF3CD;
                    color: #856404;
                    padding: 10px 20px;
                    border-radius: 20px;
                    font-weight: 600;
                    margin: 15px 0;
                  }
                  .contact-info {
                    background: #E6F3FF;
                    border-radius: 10px;
                    padding: 20px;
                    margin: 20px 0;
                    border-left: 4px solid #4299E1;
                  }
                </style>
              </head>
              <body>
                <div class="container">
                  <div class="header">
                    <h1>Thank You for Your Booking! ✨</h1>
                  </div>
                  
                  <div class="content">
                    <p>Dear <strong>${fullName}</strong>,</p>
                    
                    <p>We've successfully received your appointment request for <strong>${serviceName}</strong>. We're excited to help you look and feel absolutely stunning! 💕</p>
                    
                    <div class="appointment-details">
                      <h3 style="color: #7a0039; margin-top: 0;">Your Appointment Details</h3>
                      
                      <div class="detail">
                        <span class="detail-label">📅 Date</span>
                        <span class="detail-value">${new Date(preferredDate).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</span>
                      </div>
                      
                      <div class="detail">
                        <span class="detail-label">⏰ Time</span>
                        <span class="detail-value">${preferredTime}:00</span>
                      </div>
                      
                      <div class="detail">
                        <span class="detail-label">💄 Service</span>
                        <span class="detail-value">${serviceName}</span>
                      </div>
                      
                      ${location ? `
                      <div class="detail">
                        <span class="detail-label">📍 Location</span>
                        <span class="detail-value">${location}</span>
                      </div>
                      ` : ''}
                    </div>
                    
                    <div class="payment-confirmation">
                      <h4 style="margin-top: 0; color: #2F855A;">Payment Received</h4>
                      <p style="font-size: 24px; font-weight: bold; color: #2F855A; margin: 10px 0;">
                        ₦${amountPaidNaira.toLocaleString()}
                        <span style="font-size: 14px; color: #666;">($${amountPaid} USD)</span>
                      </p>
                      <p style="color: #666;">Deposit payment received and screenshot uploaded successfully.</p>
                    </div>
                    
                    <div class="status-badge">
                      ⏳ Status: Payment Being Verified
                    </div>
                    
                    <div class="contact-info">
                      <h4 style="margin-top: 0; color: #2B6CB0;">Need to make changes?</h4>
                      <p>If you have any questions or need to make changes to your booking, please reply to this email or contact us.</p>
                      <p style="margin-top: 10px;">
                        📧 ${process.env.SMTP_USER}<br>
                        📱 [Your Contact Number]
                      </p>
                    </div>
                    
                    <p>We'll verify your payment within 24 hours and send you a final confirmation email.</p>
                    
                    <p>We look forward to making you feel beautiful!<br>
                    <strong>The touchbydebby Team 💝</strong></p>
                  </div>
                  
                  <div class="footer">
                    <p><strong>touchbydebby Makeup Studio</strong><br>
                    Professional makeup services for every occasion</p>
                    <p style="font-size: 12px; opacity: 0.7;">This is an automated confirmation email.</p>
                  </div>
                </div>
              </body>
              </html>
            `,
          });
          console.log("✅ Customer email sent");
        } catch (emailError) {
          console.error("❌ Customer email error:", emailError.message);
        }
      }

      // Send response
      res.status(201).json({
        message: 'Booking submitted successfully',
        booking,
      });
    } catch (error) {
      console.error('❌ Booking error:', error.message);
      res.status(500).json({ error: error.message });
    }
  }
);
/* ---------- DEBUG: TEST EMAIL ---------- */
app.get("/api/debug/send-test-email", async (req, res) => {
  try {
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      return res.status(400).json({ error: "Email configuration missing" });
    }

    await transporter.sendMail({
      to: process.env.SMTP_USER,
      subject: "Test Email from touchbydebby",
      text: "This is a test email from your touchbydebby server.",
      html: "<h1>Test Email</h1><p>This is a test email from your touchbydebby server.</p>",
    });

    res.json({ message: "Test email sent successfully" });
  } catch (error) {
    console.error("Test email error:", error);
    res.status(500).json({ error: error.message });
  }
});
/* ---------- ADMIN BOOKINGS ---------- */
// app.get("/api/admin/bookings", auth, async (req, res) => {
//   console.log("📋 Fetching bookings for admin:", req.user.email);
  
//   try {
//     const bookings = await Booking.find().sort({ createdAt: -1 });
//     console.log("Found bookings:", bookings.length);
//     res.json(bookings);
//   } catch (error) {
//     console.error("❌ Get bookings error:", error.message);
//     res.status(500).json({ error: error.message });
//   }
// });

app.get("/api/admin/bookings/:id", auth, async (req, res) => {
  console.log("📋 Fetching booking:", req.params.id);
  
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      console.log("❌ Booking not found");
      return res.status(404).json({ error: 'Booking not found' });
    }
    console.log("✅ Booking found");
    res.json(booking);
  } catch (error) {
    console.error("❌ Get booking error:", error.message);
    res.status(500).json({ error: error.message });
  }
});

app.put("/api/admin/bookings/:id/status", auth, async (req, res) => {
  console.log("🔄 Updating booking status:", req.params.id, req.body.status);
  
  try {
    const booking = await Booking.findByIdAndUpdate(
      req.params.id,
      { status: req.body.status },
      { new: true }
    );
    console.log("✅ Booking status updated");
    res.json(booking);
  } catch (error) {
    console.error("❌ Update booking error:", error.message);
    res.status(500).json({ error: error.message });
  }
});

/* ---------- DELETE BOOKING ---------- */
app.delete("/api/admin/bookings/:id", auth, async (req, res) => {
  console.log("🗑️ Deleting booking:", req.params.id);
  
  try {
    await Booking.findByIdAndDelete(req.params.id);
    console.log("✅ Booking deleted");
    res.json({ message: 'Booking deleted successfully' });
  } catch (error) {
    console.error("❌ Delete booking error:", error.message);
    res.status(500).json({ error: error.message });
  }
});

/* ---------- ADMIN PORTFOLIO CRUD ---------- */
// app.get("/api/admin/portfolio", auth, async (req, res) => {
//   console.log("🖼️ Fetching portfolio for admin");
  
//   try {
//     const portfolio = await Portfolio.find();
//     res.json(portfolio);
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// });

app.post("/api/admin/portfolio", auth, upload.single('image'), async (req, res) => {
  try {
    console.log("📸 Adding portfolio item");
    const { title, category } = req.body;
    
    if (!req.file) {
      return res.status(400).json({ error: "Image is required" });
    }
    
    const imageUrl = `/uploads/portfolio/${req.file.filename}`;
    
    const portfolioItem = await Portfolio.create({
      title,
      category,
      imageUrl,
    });
    
    console.log("✅ Portfolio item added");
    res.status(201).json(portfolioItem);
  } catch (error) {
    console.error("❌ Add portfolio error:", error.message);
    res.status(500).json({ error: error.message });
  }
});

app.put("/api/admin/portfolio/:id", auth, upload.single('image'), async (req, res) => {
  try {
    console.log("📝 Updating portfolio item:", req.params.id);
    const { title, category } = req.body;
    
    const updateData = { title, category };
    
    if (req.file) {
      updateData.imageUrl = `/uploads/portfolio/${req.file.filename}`;
    }
    
    const portfolioItem = await Portfolio.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );
    
    console.log("✅ Portfolio item updated");
    res.json(portfolioItem);
  } catch (error) {
    console.error("❌ Update portfolio error:", error.message);
    res.status(500).json({ error: error.message });
  }
});

app.delete("/api/admin/portfolio/:id", auth, async (req, res) => {
  try {
    console.log("🗑️ Deleting portfolio item:", req.params.id);
    await Portfolio.findByIdAndDelete(req.params.id);
    console.log("✅ Portfolio item deleted");
    res.json({ message: 'Portfolio item deleted' });
  } catch (error) {
    console.error("❌ Delete portfolio error:", error.message);
    res.status(500).json({ error: error.message });
  }
});

/* ---------- ADMIN SERVICES CRUD ---------- */
// app.post("/api/admin/services", auth, async (req, res) => {
//   try {
//     console.log("➕ Adding service");
//     const service = await Service.create(req.body);
//     console.log("✅ Service added");
//     res.status(201).json(service);
//   } catch (error) {
//     console.error("❌ Add service error:", error.message);
//     res.status(500).json({ error: error.message });
//   }
// });

app.put("/api/admin/services/:id", auth, async (req, res) => {
  try {
    console.log("📝 Updating service:", req.params.id);
    const service = await Service.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    console.log("✅ Service updated");
    res.json(service);
  } catch (error) {
    console.error("❌ Update service error:", error.message);
    res.status(500).json({ error: error.message });
  }
});

app.delete("/api/admin/services/:id", auth, async (req, res) => {
  try {
    console.log("🗑️ Deleting service:", req.params.id);
    await Service.findByIdAndDelete(req.params.id);
    console.log("✅ Service deleted");
    res.json({ message: 'Service deleted' });
  } catch (error) {
    console.error("❌ Delete service error:", error.message);
    res.status(500).json({ error: error.message });
  }
});

/* ---------- ADMIN USERS CRUD ---------- */
// app.get("/api/admin/users", auth, async (req, res) => {
//   console.log("👥 Fetching admin users");
  
//   try {
//     const users = await User.find({ role: "admin" }).select('-password');
//     console.log("Found admin users:", users.length);
//     res.json(users);
//   } catch (error) {
//     console.error("❌ Get admin users error:", error.message);
//     res.status(500).json({ error: error.message });
//   }
// });

app.post("/api/admin/users", auth, async (req, res) => {
  try {
    console.log("➕ Adding admin user");
    const { name, email, password } = req.body;
    
    // Check if email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      console.log("❌ Email already exists");
      return res.status(400).json({ error: 'Email already exists' });
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Create admin user
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role: 'admin',
    });
    
    console.log("✅ Admin user added");
    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role
    });
  } catch (error) {
    console.error("❌ Add admin user error:", error.message);
    res.status(500).json({ error: error.message });
  }
});

app.put("/api/admin/users/:id", auth, async (req, res) => {
  try {
    console.log("📝 Updating admin user:", req.params.id);
    const { name, email } = req.body;
    
    // Check if email already exists for other users
    const existingUser = await User.findOne({ 
      email, 
      _id: { $ne: req.params.id } 
    });
    
    if (existingUser) {
      return res.status(400).json({ error: 'Email already exists' });
    }
    
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { name, email },
      { new: true }
    ).select('-password');
    
    console.log("✅ Admin user updated");
    res.json(user);
  } catch (error) {
    console.error("❌ Update admin user error:", error.message);
    res.status(500).json({ error: error.message });
  }
});

app.delete("/api/admin/users/:id", auth, async (req, res) => {
  try {
    console.log("🗑️ Deleting admin user:", req.params.id);
    
    // Prevent deleting own account
    if (req.user._id.toString() === req.params.id) {
      console.log("❌ Cannot delete own account");
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }
    
    // Prevent deleting the last admin
    const adminCount = await User.countDocuments({ role: 'admin' });
    if (adminCount <= 1) {
      console.log("❌ Cannot delete last admin");
      return res.status(400).json({ error: 'Cannot delete the last admin account' });
    }
    
    await User.findByIdAndDelete(req.params.id);
    console.log("✅ Admin user deleted");
    res.json({ message: 'Admin user deleted' });
  } catch (error) {
    console.error("❌ Delete admin user error:", error.message);
    res.status(500).json({ error: error.message });
  }
});

/* ---------- ADMIN SETTINGS ---------- */
// app.put("/api/admin/settings", auth, async (req, res) => {
//   try {
//     console.log("⚙️ Updating settings");
//     // For now, just return success
//     // In a real app, you would save these to a database
//     res.json({ 
//       message: 'Settings saved successfully',
//       settings: req.body 
//     });
//   } catch (error) {
//     console.error("❌ Update settings error:", error.message);
//     res.status(500).json({ error: error.message });
//   }
// });

/* ---------- PAYMENT VERIFICATION ---------- */
// app.put("/api/admin/bookings/:id/verify-payment", auth, async (req, res) => {
//   console.log("💰 Verifying payment for booking:", req.params.id);
  
//   try {
//     const { verificationStatus, rejectionReason } = req.body;
//     console.log("Verification data:", { verificationStatus, rejectionReason });
    
//     const booking = await Booking.findById(req.params.id);
//     if (!booking) {
//       console.log("❌ Booking not found");
//       return res.status(404).json({ error: 'Booking not found' });
//     }

//     // Update payment status
//     booking.paymentStatus = verificationStatus;
//     booking.paymentVerifiedBy = req.user._id;
//     booking.paymentVerifiedAt = new Date();
    
//     if (verificationStatus === 'rejected') {
//       booking.paymentRejectionReason = rejectionReason || '';
//     } else if (verificationStatus === 'verified') {
//       booking.status = 'confirmed'; // Auto-confirm booking when payment is verified
//     }
    
//     await booking.save();
//     console.log("✅ Payment verification updated");

//     // Send email to customer based on verification status
//     if (process.env.SMTP_USER && process.env.SMTP_PASS) {
//       if (verificationStatus === 'verified') {
//         // Send payment verified confirmation email
//         try {
//           await transporter.sendMail({
//             to: booking.email,
//             subject: "✅ Payment Verified - Your Appointment is Confirmed!",
//             html: `
//               <!DOCTYPE html>
//               <html>
//               <head>
//                 <meta charset="UTF-8">
//                 <meta name="viewport" content="width=device-width, initial-scale=1.0">
//                 <title>Payment Verified - touchbydebby</title>
//                 <style>
//                   body {
//                     font-family: 'Arial', sans-serif;
//                     line-height: 1.6;
//                     color: #333;
//                     margin: 0;
//                     padding: 20px;
//                     background-color: #f9f9f9;
//                   }
//                   .container {
//                     max-width: 600px;
//                     margin: 0 auto;
//                     background: white;
//                     border-radius: 16px;
//                     overflow: hidden;
//                     box-shadow: 0 4px 20px rgba(0,0,0,0.1);
//                   }
//                   .header {
//                     background: linear-gradient(135deg, #48BB78 0%, #38A169 100%);
//                     padding: 40px 20px;
//                     text-align: center;
//                     color: white;
//                   }
//                   .header h1 {
//                     margin: 0;
//                     font-size: 32px;
//                     font-weight: bold;
//                   }
//                   .content {
//                     padding: 40px 30px;
//                   }
//                   .confirmation-box {
//                     background: #F0FFF4;
//                     border-radius: 12px;
//                     padding: 25px;
//                     margin: 25px 0;
//                     border: 2px solid #48BB78;
//                     text-align: center;
//                   }
//                   .appointment-details {
//                     background: #FFF5F7;
//                     border-radius: 12px;
//                     padding: 25px;
//                     margin: 25px 0;
//                   }
//                   .detail {
//                     margin-bottom: 15px;
//                   }
//                   .detail-label {
//                     font-weight: 600;
//                     color: #7a0039;
//                     display: block;
//                     margin-bottom: 5px;
//                     font-size: 14px;
//                   }
//                   .detail-value {
//                     color: #333;
//                     font-size: 16px;
//                   }
//                   .status-badge {
//                     display: inline-block;
//                     background: #D4EDDA;
//                     color: #155724;
//                     padding: 10px 25px;
//                     border-radius: 20px;
//                     font-weight: 600;
//                     margin: 15px 0;
//                     font-size: 16px;
//                   }
//                   .preparation-tips {
//                     background: #FFF3CD;
//                     border-radius: 10px;
//                     padding: 20px;
//                     margin: 20px 0;
//                     border-left: 4px solid #FFC107;
//                   }
//                   .footer {
//                     text-align: center;
//                     padding: 25px;
//                     background: #FFF5F7;
//                     color: #666;
//                     font-size: 14px;
//                     border-top: 1px solid #FFE4E9;
//                   }
//                 </style>
//               </head>
//               <body>
//                 <div class="container">
//                   <div class="header">
//                     <h1>🎉 Payment Verified!</h1>
//                     <p>Your appointment is now confirmed</p>
//                   </div>
                  
//                   <div class="content">
//                     <p>Dear <strong>${booking.fullName}</strong>,</p>
                    
//                     <p>Great news! Your payment has been successfully verified. Your appointment is now confirmed and we're looking forward to serving you! 💖</p>
                    
//                     <div class="confirmation-box">
//                       <h3 style="color: #2F855A; margin-top: 0;">✅ Booking Confirmed</h3>
//                       <div class="status-badge">
//                         🎀 Appointment Status: CONFIRMED
//                       </div>
//                       <p style="color: #666;">Your deposit of ₦${booking.amountPaidNaira.toLocaleString()} ($${booking.amountPaid}) has been verified.</p>
//                     </div>
                    
//                     <div class="appointment-details">
//                       <h3 style="color: #7a0039; margin-top: 0;">Appointment Details</h3>
                      
//                       <div class="detail">
//                         <span class="detail-label">📅 Date</span>
//                         <span class="detail-value">${new Date(booking.preferredDate).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</span>
//                       </div>
                      
//                       <div class="detail">
//                         <span class="detail-label">⏰ Time</span>
//                         <span class="detail-value">${booking.preferredTime}:00</span>
//                       </div>
                      
//                       <div class="detail">
//                         <span class="detail-label">💄 Service</span>
//                         <span class="detail-value">${booking.serviceName}</span>
//                       </div>
                      
//                       ${booking.location ? `
//                       <div class="detail">
//                         <span class="detail-label">📍 Location</span>
//                         <span class="detail-value">${booking.location}</span>
//                       </div>
//                       ` : ''}
//                     </div>
                    
//                     <div class="preparation-tips">
//                       <h4 style="margin-top: 0; color: #856404;">Preparation Tips</h4>
//                       <p style="margin: 10px 0;">
//                         • Please arrive 15 minutes before your appointment<br>
//                         • Bring reference photos if you have specific makeup looks in mind<br>
//                         • Come with clean, moisturized skin<br>
//                         • Feel free to bring your own makeup if you prefer specific products
//                       </p>
//                     </div>
                    
//                     <div class="contact-info">
//                       <h4 style="color: #2B6CB0;">Need to make changes?</h4>
//                       <p>If you need to reschedule or have any questions, please reply to this email.</p>
//                       <p style="margin-top: 10px;">
//                         📧 ${process.env.SMTP_USER}<br>
//                         📱 [Your Contact Number]
//                       </p>
//                     </div>
                    
//                     <p>We're excited to make you feel beautiful! See you soon! ✨</p>
                    
//                     <p><strong>The touchbydebby Team 💝</strong></p>
//                   </div>
                  
//                   <div class="footer">
//                     <p><strong>touchbydebby Makeup Studio</strong><br>
//                     Professional makeup services for every occasion</p>
//                     <p style="font-size: 12px; opacity: 0.7;">This is a confirmed appointment. Please save this email for your records.</p>
//                   </div>
//                 </div>
//               </body>
//               </html>
//             `,
//           });
//           console.log("✅ Verification email sent to:", booking.email);
//         } catch (emailError) {
//           console.error("❌ Verification email error:", emailError.message);
//         }
//       } else if (verificationStatus === 'rejected') {
//         // Send payment rejected email
//         try {
//           await transporter.sendMail({
//             to: booking.email,
//             subject: "⚠️ Payment Verification Required - touchbydebby",
//             html: `
//               <!DOCTYPE html>
//               <html>
//               <head>
//                 <meta charset="UTF-8">
//                 <meta name="viewport" content="width=device-width, initial-scale=1.0">
//                 <title>Payment Verification Required - touchbydebby</title>
//                 <style>
//                   body {
//                     font-family: 'Arial', sans-serif;
//                     line-height: 1.6;
//                     color: #333;
//                     margin: 0;
//                     padding: 20px;
//                     background-color: #f9f9f9;
//                   }
//                   .container {
//                     max-width: 600px;
//                     margin: 0 auto;
//                     background: white;
//                     border-radius: 16px;
//                     overflow: hidden;
//                     box-shadow: 0 4px 20px rgba(0,0,0,0.1);
//                   }
//                   .header {
//                     background: linear-gradient(135deg, #FBD38D 0%, #F6AD55 100%);
//                     padding: 40px 20px;
//                     text-align: center;
//                     color: #7B341E;
//                   }
//                   .header h1 {
//                     margin: 0;
//                     font-size: 32px;
//                     font-weight: bold;
//                   }
//                   .content {
//                     padding: 40px 30px;
//                   }
//                   .warning-box {
//                     background: #FFF3CD;
//                     border-radius: 12px;
//                     padding: 25px;
//                     margin: 25px 0;
//                     border: 2px solid #FFC107;
//                   }
//                   .bank-details {
//                     background: #E6F3FF;
//                     border-radius: 10px;
//                     padding: 20px;
//                     margin: 20px 0;
//                     border-left: 4px solid #4299E1;
//                   }
//                   .footer {
//                     text-align: center;
//                     padding: 25px;
//                     background: #FFF5F7;
//                     color: #666;
//                     font-size: 14px;
//                     border-top: 1px solid #FFE4E9;
//                   }
//                 </style>
//               </head>
//               <body>
//                 <div class="container">
//                   <div class="header">
//                     <h1>⚠️ Payment Verification Required</h1>
//                   </div>
                  
//                   <div class="content">
//                     <p>Dear <strong>${booking.fullName}</strong>,</p>
                    
//                     <div class="warning-box">
//                       <h3 style="color: #7B341E; margin-top: 0;">Action Required</h3>
//                       <p>We were unable to verify your payment. Please review the details:</p>
//                       <p><strong>Reason:</strong> ${rejectionReason || 'Payment verification failed'}</p>
//                     </div>
                    
//                     <p>To confirm your booking, please:</p>
                    
//                     <div class="bank-details">
//                       <h4 style="margin-top: 0; color: #2B6CB0;">Payment Instructions</h4>
//                       <p>Transfer ₦${booking.amountPaidNaira.toLocaleString()} to:</p>
//                       <div style="background: white; padding: 15px; border-radius: 8px; margin: 10px 0;">
//                         <p><strong>Bank:</strong> OPay</p>
//                         <p><strong>Account:</strong> 9159113921</p>
//                         <p><strong>Name:</strong> Favour Esohe Modmodu</p>
//                       </div>
//                       <p style="font-size: 14px;">Please include your name as reference and upload a clear screenshot.</p>
//                     </div>
                    
//                     <p>Once you've made the payment, please:</p>
//                     <ol style="color: #666;">
//                       <li>Take a clear screenshot of the transaction</li>
//                       <li>Reply to this email with the screenshot</li>
//                       <li>We'll verify and confirm your appointment</li>
//                     </ol>
                    
//                     <p>If you've already made the payment, please reply with the screenshot for verification.</p>
                    
//                     <p><strong>The touchbydebby Team 💝</strong></p>
//                   </div>
                  
//                   <div class="footer">
//                     <p><strong>touchbydebby Makeup Studio</strong><br>
//                     Professional makeup services for every occasion</p>
//                   </div>
//                 </div>
//               </body>
//               </html>
//             `,
//           });
//           console.log("✅ Rejection email sent to:", booking.email);
//         } catch (emailError) {
//           console.error("❌ Rejection email error:", emailError.message);
//         }
//       }
//     }

//     res.json({ 
//       message: `Payment ${verificationStatus} successfully`,
//       booking 
//     });
//   } catch (error) {
//     console.error('❌ Payment verification error:', error.message);
//     res.status(500).json({ error: error.message });
//   }
// });
/* ---------- HEALTH ---------- */
app.get("/api/health", (_, res) => {
  console.log("🏥 Health check");
  res.json({ status: "OK", timestamp: new Date().toISOString() });
});

/* =======================
   START SERVER
======================= */
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📁 Uploads directory: ${uploadsDir}`);
  console.log(`🔐 JWT Secret: ${process.env.JWT_SECRET ? "Set" : "Not set - using default"}`);
  console.log(`📧 SMTP User: ${process.env.SMTP_USER ? "Set" : "Not set"}`);
});