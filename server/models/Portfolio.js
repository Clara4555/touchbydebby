import mongoose from 'mongoose';

const PortfolioSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  imageUrl: {
    type: String,
    required: true,
  },
  category: {
    type: String,
    enum: ['bridal', 'glam', 'natural', 'editorial'],
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.model('Portfolio', PortfolioSchema);