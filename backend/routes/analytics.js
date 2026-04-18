const express       = require('express')
const SensorReading = require('../models/SensorReading')
const { protect }   = require('../middleware/authMiddleware')

const router = express.Router()

// GET /api/analytics/:device_id/heatmap
// Returns kWh per hour per day-of-week for the last 4 weeks
router.get('/:device_id/heatmap', protect, async (req, res) => {
  try {
    const since = new Date(Date.now() - 28 * 24 * 3600 * 1000)
    const readings = await SensorReading.find({
      device_id:  req.params.device_id,
      receivedAt: { $gte: since }
    }).select('power receivedAt')

    // Build a 7×24 grid (day × hour) summing kWh
    const grid = Array.from({ length: 7 }, () => Array(24).fill(0))
    const count = Array.from({ length: 7 }, () => Array(24).fill(0))

    readings.forEach(r => {
      const d = new Date(r.receivedAt)
      const dayBD  = new Date(d.getTime() + 6*3600*1000).getDay()   // 0=Sun, BD adjusted
      const hourBD = new Date(d.getTime() + 6*3600*1000).getHours()
      const kwh = (r.power || 0) * (10 / 3600 / 1000)               // assuming 10s intervals
      grid[dayBD][hourBD] += kwh
      count[dayBD][hourBD]++
    })

    res.json({ grid, count })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// GET /api/analytics/:device_id/daily?days=7
// Returns daily energy totals (kWh per day)
router.get('/:device_id/daily', protect, async (req, res) => {
  try {
    const days  = parseInt(req.query.days) || 7
    const since = new Date(Date.now() - days * 24 * 3600 * 1000)

    const pipeline = [
      { $match: { device_id: req.params.device_id, receivedAt: { $gte: since } } },
      { $addFields: {
          bdDate: { $dateAdd: { startDate: '$receivedAt', unit: 'hour', amount: 6 } }
      }},
      { $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$bdDate' } },
          totalKwh:   { $sum: { $multiply: [{ $ifNull: ['$power', 0] }, 10/3600/1000] } },
          avgVoltage: { $avg: '$voltage' },
          avgPF:      { $avg: '$pf' },
          readings:   { $sum: 1 }
      }},
      { $sort: { _id: 1 } }
    ]

    const result = await SensorReading.aggregate(pipeline)
    res.json(result)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// GET /api/analytics/:device_id/uptime?hours=24
// Returns online/offline status per hour
router.get('/:device_id/uptime', protect, async (req, res) => {
  try {
    const hours = parseInt(req.query.hours) || 24
    const since = new Date(Date.now() - hours * 3600 * 1000)

    const pipeline = [
      { $match: { device_id: req.params.device_id, receivedAt: { $gte: since } } },
      { $addFields: {
          bdDate: { $dateAdd: { startDate: '$receivedAt', unit: 'hour', amount: 6 } }
      }},
      { $group: {
          _id:     { $hour: '$bdDate' },
          count:   { $sum: 1 }
      }},
      { $sort: { _id: 1 } }
    ]

    const result = await SensorReading.aggregate(pipeline)
    // Fill missing hours as offline
    const uptimeMap = {}
    result.forEach(r => { uptimeMap[r._id] = r.count })
    const full = Array.from({ length: hours }, (_, i) => {
      const hour = new Date(since.getTime() + i * 3600 * 1000)
      const h = new Date(hour.getTime() + 6*3600*1000).getHours()
      return { hour: h, count: uptimeMap[h] || 0, online: !!(uptimeMap[h]) }
    })

    res.json(full)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// GET /api/analytics/:device_id/summary
// Latest reading + today's totals
router.get('/:device_id/summary', protect, async (req, res) => {
  try {
    const latest = await SensorReading
      .findOne({ device_id: req.params.device_id })
      .sort({ receivedAt: -1 })

    const todayStart = new Date()
    todayStart.setUTCHours(todayStart.getUTCHours() - 6)         // shift to BD midnight
    todayStart.setHours(0, 0, 0, 0)
    const todayStartUTC = new Date(todayStart.getTime() - 6*3600*1000)

    const todayStats = await SensorReading.aggregate([
      { $match: { device_id: req.params.device_id, receivedAt: { $gte: todayStartUTC } } },
      { $group: {
          _id:        null,
          totalKwh:   { $sum: { $multiply: [{ $ifNull: ['$power', 0] }, 10/3600/1000] } },
          avgVoltage: { $avg: '$voltage' },
          maxPower:   { $max: '$power' },
          avgPF:      { $avg: '$pf' },
          readings:   { $sum: 1 }
      }}
    ])

    res.json({ latest, today: todayStats[0] || null })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

module.exports = router