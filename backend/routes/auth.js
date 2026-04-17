const express  = require('express')
const jwt      = require('jsonwebtoken')
const User     = require('../models/User')
const { protect, adminOnly } = require('../middleware/authMiddleware')

const router = express.Router()

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE })

// ── POST /api/auth/setup ─────────────────────────────
// Creates the very first admin — only works when zero users exist
router.post('/setup', async (req, res) => {
  try {
    const count = await User.countDocuments()
    if (count > 0)
      return res.status(403).json({ message: 'Setup already complete' })

    const { name, email, password } = req.body
    const user = await User.create({ name, email, password, role: 'admin' })
    res.status(201).json({
      token: signToken(user._id),
      user:  { id: user._id, name, email, role: 'admin' },
    })
  } catch (err) {
    console.error('Backend error:', err);
    res.status(500).json({ message: err.message })
  }
})

// ── POST /api/auth/login ─────────────────────────────
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body
    const user = await User.findOne({ email })
    if (!user || !(await user.matchPassword(password)))
      return res.status(401).json({ message: 'Invalid email or password' })
    res.json({
      token: signToken(user._id),
      user:  { id: user._id, name: user.name, email, role: user.role },
    })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// ── GET /api/auth/me ─────────────────────────────────
router.get('/me', protect, (req, res) => res.json(req.user))

// ── GET /api/auth/users — admin only ────────────────
router.get('/users', protect, adminOnly, async (req, res) => {
  const users = await User.find().select('-password').sort({ createdAt: -1 })
  res.json(users)
})

// ── POST /api/auth/users — admin creates a user ─────
router.post('/users', protect, adminOnly, async (req, res) => {
  try {
    const { name, email, password, role } = req.body
    const exists = await User.findOne({ email })
    if (exists)
      return res.status(400).json({ message: 'Email already registered' })
    const user = await User.create({ name, email, password, role })
    res.status(201).json({ id: user._id, name, email, role })
  } catch (err) {
    res.status(400).json({ message: err.message })
  }
})

// ── PUT /api/auth/users/:id — admin edits a user ────
router.put('/users/:id', protect, adminOnly, async (req, res) => {
  try {
    const { name, email, role, password } = req.body
    const user = await User.findById(req.params.id)
    if (!user) return res.status(404).json({ message: 'User not found' })

    user.name  = name  ?? user.name
    user.email = email ?? user.email
    user.role  = role  ?? user.role
    if (password) user.password = password   // pre-save hook re-hashes

    await user.save()
    res.json({ id: user._id, name: user.name, email: user.email, role: user.role })
  } catch (err) {
    res.status(400).json({ message: err.message })
  }
})

// ── DELETE /api/auth/users/:id — admin deletes ──────
router.delete('/users/:id', protect, adminOnly, async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
    if (!user) return res.status(404).json({ message: 'User not found' })
    if (user._id.toString() === req.user._id.toString())
      return res.status(400).json({ message: 'Cannot delete your own account' })
    await user.deleteOne()
    res.json({ message: 'User deleted' })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// ── GET /api/auth/check-setup ────────────────────────
// Frontend calls this to know if first-run setup is needed
router.get('/check-setup', async (req, res) => {
  const count = await User.countDocuments()
  res.json({ needsSetup: count === 0 })
})

module.exports = router