// routes/adminBookings.js
import express from 'express';
const router = express.Router();
import Booking from '../models/Booking.js';
import { auth, isAdmin } from '../middleware/auth.js';

// Get all bookings (admin only)
router.get('/bookings', auth, isAdmin, async (req, res) => {
  try {
    const bookings = await Booking.find().sort({ createdAt: -1 });
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update booking status
router.put('/bookings/:id/status', auth, isAdmin, async (req, res) => {
  try {
    const { status } = req.body;
    
    if (!['pending', 'confirmed', 'cancelled', 'completed'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const booking = await Booking.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    res.json(booking);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Verify payment
router.put('/bookings/:id/verify-payment', auth, isAdmin, async (req, res) => {
  try {
    const { verificationStatus, rejectionReason } = req.body;
    
    if (!['verified', 'rejected'].includes(verificationStatus)) {
      return res.status(400).json({ error: 'Invalid verification status' });
    }

    const updateData = {
      paymentStatus: verificationStatus,
      paymentVerifiedBy: req.user.id,
      paymentVerifiedAt: new Date()
    };

    if (verificationStatus === 'rejected' && rejectionReason) {
      updateData.paymentRejectionReason = rejectionReason;
    }

    const booking = await Booking.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    res.json(booking);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete booking
router.delete('/bookings/:id', auth, isAdmin, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    await booking.remove();
    res.json({ message: 'Booking deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;