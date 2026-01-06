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
   UPLOAD DIRECTORIES
======================= */
const uploadsDir = path.join(__dirname, "uploads");

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  fs.mkdirSync(path.join(uploadsDir, "payments"), { recursive: true });
  fs.mkdirSync(path.join(uploadsDir, "portfolio"), { recursive: true });
}

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

// Login
/* ========================
   ROUTES
======================= */

// ✅ ADD THIS NEW ROUTE (Admin Setup - first-time only)
app.post("/api/auth/setup", async (req, res) => {
  try {
    // Check if any admin already exists
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

// Login (already exists - KEEP THIS)
app.post("/api/auth/login", async (req, res) => {
  // ... keep existing login code but ADD this check at the beginning:
  const { email, password } = req.body;

  const user = await User.findOne({ email });
  if (!user) {
    // ✅ ADD THIS CHECK for first-time setup
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

// ... rest of your existing routes (services, portfolio, bookings, etc.) ...
// Services
app.get("/api/services", async (_, res) => {
  const services = await Service.find();
  res.json(services);
});

// Portfolio
app.get("/api/portfolio", async (req, res) => {
  const images = await Portfolio.find(req.query.category ? { category: req.query.category } : {});
  res.json(images);
});

// Booking
app.post("/api/bookings", upload.single("paymentScreenshot"), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: "Payment proof required" });

  const booking = await Booking.create({
    ...req.body,
    paymentScreenshot: `/uploads/payments/${req.file.filename}`,
  });

  if (process.env.SMTP_USER && process.env.SMTP_PASS) {
    await transporter.sendMail({
      to: process.env.ADMIN_EMAIL,
      subject: "New Booking - touchbydebby",
      html: `<p>New booking from ${booking.fullName}</p>`,
    });

    await transporter.sendMail({
      to: booking.email,
      subject: "Booking Received",
      html: `<p>Your booking is pending confirmation.</p>`,
    });
  }

  res.status(201).json(booking);
});

// Admin
app.get("/api/admin/bookings", auth, async (_, res) => {
  const bookings = await Booking.find().sort({ createdAt: -1 });
  res.json(bookings);
});

app.put("/api/admin/bookings/:id/status", auth, async (req, res) => {
  const booking = await Booking.findByIdAndUpdate(
    req.params.id,
    { status: req.body.status },
    { new: true }
  );
  res.json(booking);
});

// Health
app.get("/api/health", (_, res) => res.json({ status: "OK" }));

/* =======================
   START SERVER
======================= */
const PORT = process.env.PORT || 5000;

app.listen(PORT, async () => {
  console.log(`🚀 Server running on port ${PORT}`);
  await initializeAdmin();
  await initializeServices();
});
