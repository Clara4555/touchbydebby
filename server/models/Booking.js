// models/Booking.js
import mongoose from 'mongoose';

const BookingSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    lowercase: true,
  },
  phone: {
    type: String,
    required: true,
  },
  serviceType: {
    type: String,
    required: true,
  },
  serviceName: {
    type: String,
    required: true,
  },
  preferredDate: {
    type: Date,
    required: true,
  },
  preferredTime: {
    type: String,
    required: true,
  },
  location: {
    type: String,
    default: '',
  },
  paymentScreenshot: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'cancelled', 'completed'],
    default: 'pending',
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'verified', 'rejected'],
    default: 'pending',
  },
  amountPaid: {
    type: Number,
    required: true,
  },
  totalAmount: {
    type: Number,
    required: true,
  },
  amountPaidNaira: {
    type: Number,
    required: true,
  },
  totalAmountNaira: {
    type: Number,
    required: true,
  },
  paymentVerifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  paymentVerifiedAt: {
    type: Date,
  },
  paymentRejectionReason: {
    type: String,
    default: '',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.model('Booking', BookingSchema);