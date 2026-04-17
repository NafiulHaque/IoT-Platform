const express  = require('express')
const Device   = require('../models/Device')
const { protect, adminOnly } = require('../middleware/authMiddleware')

const router = express.Router()

router.get('/',       protect,              async (req, res) => {
  const devices = await Device.find().sort({ createdAt: -1 })
  res.json(devices)
})

router.post('/',      protect, adminOnly,   async (req, res) => {
  try {
    const device = await Device.create(req.body)
    res.status(201).json(device)
  } catch (err) {
    res.status(400).json({ message: err.message })
  }
})

router.put('/:id',    protect, adminOnly,   async (req, res) => {
  try {
    const device = await Device.findByIdAndUpdate(req.params.id, req.body, { new: true }) 
    res.json(device)
  } catch (err) {
    res.status(400).json({ message: err.message })
  }
})

router.delete('/:id', protect, adminOnly,   async (req, res) => {
  await Device.findByIdAndDelete(req.params.id)
  res.json({ message: 'Device deleted' })
})

module.exports = router