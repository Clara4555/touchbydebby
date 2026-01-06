const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Booking = require('../models/Booking');
const { sendEmail } = require('../config/email');
const { auth, isAdmin } = require('../middleware/auth');

const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/payments';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only images are allowed'));
    }
  },
});

router.post('/', upload.single('paymentScreenshot'), async (req, res) => {
  try {
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

    if (!req.file) {
      return res.status(400).json({ error: 'Payment screenshot is required' });
    }

    const booking = new Booking({
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
    });

    await booking.save();

    // Send email to admin
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@touchbydebby.com';
    const adminHtml = `
      <h2>New Booking Received</h2>
      <p><strong>Client:</strong> ${fullName}</p>
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Phone:</strong> ${phone}</p>
      <p><strong>Service:</strong> ${serviceName}</p>
      <p><strong>Date:</strong> ${new Date(preferredDate).toLocaleDateString()}</p>
      <p><strong>Time:</strong> ${preferredTime}</p>
      <p><strong>Amount Paid:</strong> $${amountPaid}</p>
      <p><strong>Total Amount:</strong> $${totalAmount}</p>
      <p>Please check the admin dashboard for payment verification.</p>
    `;

    await sendEmail(adminEmail, 'New Booking - touchbydebby', adminHtml);

    // Send confirmation email to customer
    const customerHtml = `
      <h2>Booking Request Received</h2>
      <p>Dear ${fullName},</p>
      <p>Thank you for booking with touchbydebby!</p>
      <p>We have received your appointment request for <strong>${serviceName}</strong> on <strong>${new Date(preferredDate).toLocaleDateString()}</strong> at <strong>${preferredTime}</strong>.</p>
      <p>Your booking is currently <strong>pending confirmation</strong>. We will review your payment and contact you shortly to confirm your appointment.</p>
      <p>If you have any questions, please don't hesitate to contact us.</p>
      <p>Best regards,<br>The touchbydebby Team</p>
    `;

    await sendEmail(email, 'Booking Received - touchbydebby', customerHtml);

    res.status(201).json({
      message: 'Booking submitted successfully',
      booking,
    });
  } catch (error) {
    console.error('Booking error:', error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/', auth, isAdmin, async (req, res) => {
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
    res.status(500).json({ error: error.message });
  }
});

router.put('/:id/status', auth, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;
    
    const booking = await Booking.findById(id);
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }
    
    booking.status = status;
    if (notes) booking.notes = notes;
    
    await booking.save();
    
    // Send status update email to customer
    const statusEmailHtml = `
      <h2>Booking Update</h2>
      <p>Dear ${booking.fullName},</p>
      <p>Your booking for <strong>${booking.serviceName}</strong> has been <strong>${status}</strong>.</p>
      ${status === 'confirmed' ? `
        <p>Your appointment is confirmed! We look forward to seeing you on <strong>${new Date(booking.preferredDate).toLocaleDateString()}</strong> at <strong>${booking.preferredTime}</strong>.</p>
        <p>Please arrive 15 minutes before your scheduled time.</p>
      ` : ''}
      ${notes ? `<p><strong>Notes:</strong> ${notes}</p>` : ''}
      <p>If you have any questions, please don't hesitate to contact us.</p>
      <p>Best regards,<br>The touchbydebby Team</p>
    `;
    
    await sendEmail(booking.email, `Booking ${status} - touchbydebby`, statusEmailHtml);
    
    res.json({ message: 'Booking status updated', booking });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;