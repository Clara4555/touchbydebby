// routes/admin.js
import express from 'express';
const router = express.Router();
import User from '../models/User.js';
import { auth, isAdmin } from '../middleware/auth.js';
import bcrypt from 'bcryptjs';
import Portfolio from '../models/Portfolio.js';
import Service from '../models/Service.js';

// Get all users (admin only)
router.get('/users', auth, isAdmin, async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create new admin user
router.post('/users', auth, isAdmin, async (req, res) => {
  try {
    const { name, email, password, role = 'admin' } = req.body;

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const user = new User({
      name,
      email,
      password: hashedPassword,
      role
    });

    await user.save();

    // Don't send password back
    const userResponse = user.toObject();
    delete userResponse.password;

    res.status(201).json(userResponse);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update user
router.put('/users/:id', auth, isAdmin, async (req, res) => {
  try {
    const { name, email } = req.body;
    
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    user.name = name || user.name;
    user.email = email || user.email;

    await user.save();

    // Don't send password back
    const userResponse = user.toObject();
    delete userResponse.password;

    res.json(userResponse);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Admin portfolio routes
router.get('/portfolio', auth, isAdmin, async (req, res) => {
  try {
    const portfolio = await Portfolio.find().sort({ createdAt: -1 });
    res.json(portfolio);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/portfolio', auth, isAdmin, async (req, res) => {
  // Add portfolio creation logic here
  res.json({ message: 'Portfolio creation endpoint' });
});

router.put('/portfolio/:id', auth, isAdmin, async (req, res) => {
  // Add portfolio update logic here
  res.json({ message: 'Portfolio update endpoint' });
});

router.delete('/portfolio/:id', auth, isAdmin, async (req, res) => {
  // Add portfolio deletion logic here
  res.json({ message: 'Portfolio deletion endpoint' });
});

// Admin service routes
router.get('/services', auth, isAdmin, async (req, res) => {
  try {
    const services = await Service.find();
    res.json(services);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/services', auth, isAdmin, async (req, res) => {
  // Add service creation logic here
  res.json({ message: 'Service creation endpoint' });
});

router.put('/services/:id', auth, isAdmin, async (req, res) => {
  // Add service update logic here
  res.json({ message: 'Service update endpoint' });
});

router.delete('/services/:id', auth, isAdmin, async (req, res) => {
  // Add service deletion logic here
  res.json({ message: 'Service deletion endpoint' });
});

// Delete user
router.delete('/users/:id', auth, isAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Prevent deleting yourself
    if (user._id.toString() === req.user.id) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }

    await user.remove();
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;