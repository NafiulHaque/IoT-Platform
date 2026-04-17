const express        = require('express');
const SensorReading  = require('../models/SensorReading');
const { protect }    = require('../middleware/authMiddleware');

const router = express.Router();

// GET /api/readings/:device_id — latest 100 readings
router.get('/:device_id', protect, async (req, res) => {
  try {
    const readings = await SensorReading
      .find({ device_id: req.params.device_id })
      .sort({ receivedAt: -1 })
      .limit(100);
    res.json(readings);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/readings/:device_id/latest — single latest reading
router.get('/:device_id/latest', protect, async (req, res) => {
  try {
    const reading = await SensorReading
      .findOne({ device_id: req.params.device_id })
      .sort({ receivedAt: -1 });
    res.json(reading);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/readings/:device_id/daily — daily average for past 7 days (for chart)
router.get('/:device_id/daily', protect, async (req, res) => {
  try {
    const { device_id } = req.params;
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      // console.log('Calculating daily averages since:', sevenDaysAgo);
    const readings = await SensorReading.aggregate([
      {
        $match: { 
          device_id: device_id,
          receivedAt: { $gte: sevenDaysAgo }
        }   
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$receivedAt" } },
          avgTemp: { $avg: "$temp_c" },
          avgHumidity: { $avg: "$humidity" }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);

    res.json(readings);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});



module.exports = router;