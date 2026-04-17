const jwt    = require('jsonwebtoken');
const User   = require('../models/User');

const protect = async (req, res, next) => {
  let token = req.headers.authorization?.split(' ')[1]; // Bearer <token>

  if (!token)
    return res.status(401).json({ message: 'Not authorized — no token' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id).select('-password');
    next();
  } catch {
    return res.status(401).json({ message: 'Not authorized — invalid token' });
  }
};

const adminOnly = (req, res, next) => {
  if (req.user?.role !== 'admin')
    return res.status(403).json({ message: 'Admin access required' });
  next();
};

module.exports = { protect, adminOnly };