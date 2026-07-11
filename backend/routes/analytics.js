const express       = require('express')
const SensorReading = require('../models/SensorReading')
const { protect }   = require('../middleware/authMiddleware')

const router = express.Router()

// GET /api/analytics/:device_id/heatmap
router.get('/:device_id/heatmap', protect, async (req, res) => {
  try {
    const BD_OFFSET_MS = 6 * 60 * 60 * 1000    // UTC+6
    const since = new Date(Date.now() - 28 * 24 * 3600 * 1000)

    const pipeline = [
      {
        $match: {
          device_id:  req.params.device_id,
          receivedAt: { $gte: since }
        }
      },
      {
        // Shift UTC → BST before extracting day/hour
        $addFields: {
          bstDate: {
            $dateAdd: {
              startDate: '$receivedAt',
              unit:      'millisecond',
              amount:    BD_OFFSET_MS
            }
          }
        }
      },
      {
        $group: {
          _id: {
            // dayOfWeek: 1=Sun,2=Mon…7=Sat in MongoDB
            // We remap to 0=Mon…6=Sun in the response
            dow:  { $dayOfWeek: '$bstDate' },
            hour: { $hour:      '$bstDate' },
          },
          totalKwh: {
            $sum: {
              $multiply: [
                { $ifNull: ['$power', 0] },
                // 10s publish interval → kWh per reading
                { $literal: 10 / 3600 / 1000 }
              ]
            }
          },
          count: { $sum: 1 }
        }
      }
    ]

    const rows = await SensorReading.aggregate(pipeline)

    // Build 7×24 grid indexed [0=Mon … 6=Sun][0=00:00 … 23:00] in BST
    // MongoDB dow: 1=Sun,2=Mon,3=Tue,4=Wed,5=Thu,6=Fri,7=Sat
    // Our grid:    0=Mon,1=Tue,2=Wed,3=Thu,4=Fri,5=Sat,6=Sun
    const mongoToGrid = { 2:0, 3:1, 4:2, 5:3, 6:4, 7:5, 1:6 }

    const grid  = Array.from({ length: 7 }, () => Array(24).fill(0))
    const count = Array.from({ length: 7 }, () => Array(24).fill(0))

    rows.forEach(r => {
      const gridDay = mongoToGrid[r._id.dow]
      const hour    = r._id.hour                  // already BST
      if (gridDay !== undefined && hour >= 0 && hour < 24) {
        grid[gridDay][hour]  += r.totalKwh
        count[gridDay][hour] += r.count
      }
    })

    // Round kWh to 3 decimal places
    const gridRounded = grid.map(row =>
      row.map(v => Math.round(v * 1000) / 1000)
    )

    res.json({
      grid:  gridRounded,
      count,
      days:  ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'],
      hours: Array.from({ length: 24 }, (_, i) => i),
      timezone: 'Asia/Dhaka (BST UTC+6)',
      since: since.toISOString(),
    })
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
    const device_id = req.params.device_id
    const BD_OFFSET = 6 * 60 * 60 * 1000        // UTC+6 ms

    // Last 24 hours in UTC
    const nowUTC   = new Date()
    const since    = new Date(nowUTC.getTime() - 24 * 3600 * 1000)

    // Aggregate readings grouped by BST hour (0–23)
    const pipeline = [
      {
        $match: {
          device_id,
          receivedAt: { $gte: since }
        }
      },
      {
        // Shift UTC → BST by adding 6 hours before extracting hour
        $addFields: {
          bstDate: {
            $dateAdd: {
              startDate: '$receivedAt',
              unit:      'millisecond',
              amount:    BD_OFFSET
            }
          }
        }
      },
      {
        $group: {
          _id:   { $hour: '$bstDate' },   // 0–23 in BST
          count: { $sum: 1 },
          // Track the actual UTC timestamps so we can calc exact coverage
          firstSeen: { $min: '$receivedAt' },
          lastSeen:  { $max: '$receivedAt' },
        }
      },
      { $sort: { _id: 1 } }
    ]

    const rows = await SensorReading.aggregate(pipeline)

    // Build a full 0–23 BST hour array
    // Current BST hour so we can mark future hours as "not yet"
    const nowBST      = new Date(nowUTC.getTime() + BD_OFFSET)
    const currentBSTH = nowBST.getUTCHours()

    // Map hour → reading count
    const countMap = {}
    rows.forEach(r => { countMap[r._id] = r.count })

    const result = Array.from({ length: 24 }, (_, bstHour) => {
      const isFuture = bstHour > currentBSTH
      const count    = countMap[bstHour] ?? 0

      return {
        bstHour,                                   // 0–23
        label:   bstHour.toString().padStart(2,'0') + ':00',
        count,
        online:  !isFuture && count > 0,
        future:  isFuture,
        // Uptime percentage within that hour (assuming 10s publish interval)
        // max possible readings = 3600/10 = 360
        pct:     isFuture ? null : Math.min(100, Math.round((count / 360) * 100))
      }
    })

    res.json(result)
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

// ── NEW ROUTE ─────────────────────────────────────────────────────────────────

/**
 * GET /api/analytics/:device_id/day
 * Query param: date=YYYY-MM-DD  (BST calendar date)
 *
 * Returns:
 *  {
 *    readings: [...],     // all readings for that BST day, sorted asc
 *    totalKwh: number,    // sum of energy for sidebar display
 *    date: string,        // the queried BST date
 *    count: number,
 *  }
 */
router.get('/:device_id/day', protect, async (req, res) => {
  try {
    const { device_id } = req.params
    const { date }      = req.query   // e.g. "2026-04-11"

    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({
        message: 'date query param required in YYYY-MM-DD format (BST)'
      })
    }

    const BST_OFFSET_MS = 6 * 60 * 60 * 1000   // UTC+6

    // Parse the BST date and compute UTC window
    // BST 00:00 on [date]  = UTC [date - 6h]
    // BST 23:59:59 on [date] = UTC [date + 17h59m59s]
    const [yr, mo, dy] = date.split('-').map(Number)

    // Start of day in BST → subtract 6h to get UTC
    const bstDayStart  = new Date(Date.UTC(yr, mo - 1, dy, 0, 0, 0))
    const utcStart     = new Date(bstDayStart.getTime() - BST_OFFSET_MS)

    // End of day in BST → add 23h59m59.999s then subtract 6h
    const bstDayEnd    = new Date(Date.UTC(yr, mo - 1, dy, 23, 59, 59, 999))
    const utcEnd       = new Date(bstDayEnd.getTime() - BST_OFFSET_MS)

    const readings = await SensorReading.find({
      device_id,
      receivedAt: { $gte: utcStart, $lte: utcEnd },
    })
    .sort({ receivedAt: 1 })          // ascending — for chart left→right
    .select('voltage current power energy frequency pf temp_c humidity heat_index receivedAt')
    .lean()

    // Calculate total kWh for the day
    // Each reading represents one 10-second interval → kWh = W × (10/3600) / 1000
    const totalKwh = readings.reduce((sum, r) => {
      return sum + ((r.power ?? 0) * 10 / 3600 / 1000)
    }, 0)

    res.json({
      date,
      count:    readings.length,
      totalKwh: +totalKwh.toFixed(3),
      readings,
    })

  } catch (err) {
    console.error('[analytics/day] Error:', err.message)
    res.status(500).json({ message: err.message })
  }
})


// ── ALSO ADD to backend/routes/analytics.js ──────────────────────────────────
// GET /api/analytics/:device_id/day-list?days=14
// Returns the kWh total for each of the last N days — used to pre-populate
// the sidebar without fetching full readings for every day

router.get('/:device_id/day-list', protect, async (req, res) => {
  try {
    const { device_id } = req.params
    const days          = Math.min(parseInt(req.query.days) || 14, 90)
    const BST_OFFSET_MS = 6 * 60 * 60 * 1000

    const now = new Date()
    // Start of today in BST
    const todayBST = new Date(now.getTime() + BST_OFFSET_MS)
    todayBST.setUTCHours(0, 0, 0, 0)
    const utcStart = new Date(todayBST.getTime() - BST_OFFSET_MS - (days - 1) * 86400000)

    const pipeline = [
      {
        $match: {
          device_id,
          receivedAt: { $gte: utcStart }
        }
      },
      {
        $addFields: {
          bstDate: {
            $dateAdd: {
              startDate: '$receivedAt',
              unit:      'millisecond',
              amount:    BST_OFFSET_MS
            }
          }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$bstDate' }
          },
          totalKwh: {
            $sum: {
              $multiply: [
                { $ifNull: ['$power', 0] },
                { $literal: 10 / 3600 / 1000 }
              ]
            }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: -1 } }
    ]

    const results = await SensorReading.aggregate(pipeline)

    // Return as { date → { kwh, count } }
    const map = {}
    results.forEach(r => {
      map[r._id] = {
        kwh:   +r.totalKwh.toFixed(3),
        count: r.count
      }
    })

    res.json(map)

  } catch (err) {
    console.error('[analytics/day-list] Error:', err.message)
    res.status(500).json({ message: err.message })
  }
})

module.exports = router