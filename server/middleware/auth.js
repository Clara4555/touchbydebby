// middleware/auth.js
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const auth = async (req, res, next) => {
  try {
    console.log("🔐 Auth middleware called");
    const token = req.headers.authorization?.replace("Bearer ", "");
    
    if (!token) {
      console.log("❌ No token provided");
      return res.status(401).json({ error: "Unauthorized" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'touchbydebby-secret-key');
    const user = await User.findById(decoded.userId);

    if (!user) {
      console.log("❌ User not found");
      return res.status(401).json({ error: "Unauthorized" });
    }

    req.user = user;
    console.log("✅ Authenticated user:", user.email);
    next();
  } catch (error) {
    console.error("🔐 Auth error:", error.message);
    res.status(401).json({ error: "Unauthorized" });
  }
};

export const isAdmin = (req, res, next) => {
  if (req.user.role !== "admin") {
    console.log("❌ User is not an admin:", req.user.email);
    return res.status(403).json({ error: "Admin access required" });
  }
  console.log("✅ User is admin:", req.user.email);
  next();
};