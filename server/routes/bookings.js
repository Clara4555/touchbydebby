// routes/bookings.js

const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Booking = require('../models/Booking');
const { sendEmail } = require('../config/email');
const { auth, isAdmin } = require('../middleware/auth');

const router = express.Router();

// Conversion rate (adjust as needed)
const EXCHANGE_RATE = 1500; // 1 USD = 1500 NGN

/* =======================
   MULTER CONFIG
======================= */
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/payments';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
});

/* =======================
   CREATE BOOKING
======================= */
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

    // Calculate Naira amounts
    const amountPaidNaira = Math.round(parseFloat(amountPaid) * EXCHANGE_RATE);
    const totalAmountNaira = Math.round(parseFloat(totalAmount) * EXCHANGE_RATE);

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
      amountPaidNaira,
      totalAmountNaira,
    });

    await booking.save();
    // Add at the end of routes/bookings.js
router.get('/admin/users', auth, async (req, res) => {
  try {
    // For testing - return dummy data
    res.json([
      { _id: '1', name: 'Admin User', email: 'admin@example.com', role: 'admin' }
    ]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

    /* ========================
       ADMIN EMAIL - UPDATED WITH PAYMENT SCREENSHOT
    ======================== */
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@touchbydebby.com';
    const baseUrl = process.env.BASE_URL || 'http://localhost:5000';
    const paymentScreenshotUrl = `${baseUrl}/uploads/payments/${req.file.filename}`;

    const adminHtml = `
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
    `;

    await sendEmail(adminEmail, '🎀 New Booking Requires Verification - touchbydebby', adminHtml);

    /* ========================
       CUSTOMER EMAIL - UPDATED WITH PAYMENT INSTRUCTIONS
    ======================== */
    const customerHtml = `
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
          .payment-info {
            background: #F0FFF4;
            border-radius: 10px;
            padding: 20px;
            margin: 20px 0;
            border-left: 4px solid #48BB78;
          }
          .bank-details {
            background: #E6F3FF;
            border-radius: 10px;
            padding: 20px;
            margin: 20px 0;
            border-left: 4px solid #4299E1;
          }
          .bank-detail {
            margin: 10px 0;
            padding: 8px 0;
            border-bottom: 1px solid rgba(66, 153, 225, 0.2);
          }
          .bank-detail:last-child {
            border-bottom: none;
          }
          .footer {
            text-align: center;
            padding: 25px;
            background: #FFF5F7;
            color: #666;
            font-size: 14px;
            border-top: 1px solid #FFE4E9;
          }
          .next-steps {
            background: #FFF3CD;
            padding: 15px;
            border-radius: 8px;
            margin: 20px 0;
          }
          .currency {
            font-size: 14px;
            color: #666;
            margin-left: 5px;
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
            
            <div class="payment-info">
              <h4 style="margin-top: 0; color: #2F855A;">Payment Information</h4>
              <div style="margin: 15px 0;">
                <p style="margin: 10px 0;">Total Service Amount:</p>
                <p style="font-size: 24px; font-weight: bold; color: #2F855A; margin: 5px 0;">
                  ₦${totalAmountNaira.toLocaleString()}
                  <span class="currency">($${totalAmount} USD)</span>
                </p>
              </div>
              <div style="margin: 15px 0;">
                <p style="margin: 10px 0;">Required Deposit (75%):</p>
                <p style="font-size: 20px; font-weight: bold; color: #48BB78; margin: 5px 0;">
                  ₦${amountPaidNaira.toLocaleString()}
                  <span class="currency">($${amountPaid} USD)</span>
                </p>
              </div>
            </div>
            
            <div class="bank-details">
              <h4 style="margin-top: 0; color: #2B6CB0;">Payment Instructions</h4>
              <p style="margin-bottom: 15px;">Please transfer the deposit amount to our bank account:</p>
              
              <div class="bank-detail">
                <strong>Bank:</strong> OPay
              </div>
              <div class="bank-detail">
                <strong>Account Number:</strong> 9159113921
              </div>
              <div class="bank-detail">
                <strong>Account Name:</strong> Favour Esohe Modmodu
              </div>
              
              <p style="margin-top: 15px; padding: 10px; background: white; border-radius: 5px; font-size: 14px;">
                <strong>Note:</strong> Please include your name as a reference when making the transfer.
              </p>
            </div>
            
            <div class="next-steps">
              <h4 style="margin-top: 0; color: #856404;">What Happens Next?</h4>
              <p style="margin: 10px 0;">
                1. Complete your payment using the bank details above<br>
                2. Upload your payment screenshot in the booking form<br>
                3. We'll verify your payment within 24 hours<br>
                4. You'll receive a confirmation email once verified<br>
                5. We'll send final preparation details before your appointment
              </p>
            </div>
            
            <p>If you have any questions or need to make changes to your booking, please reply to this email.</p>
            
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
    `;

    await sendEmail(email, '✨ Your Booking is Confirmed - touchbydebby', customerHtml);

    // Send response with bank details
    res.status(201).json({
      message: 'Booking submitted successfully',
      booking,
      paymentInstructions: {
        bankName: 'OPay',
        accountNumber: '9159113921',
        accountName: 'Favour Esohe Modmodu',
        depositAmount: {
          naira: amountPaidNaira,
          usd: amountPaid
        },
        totalAmount: {
          naira: totalAmountNaira,
          usd: totalAmount
        }
      }
    });
  } catch (error) {
    console.error('Booking error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;