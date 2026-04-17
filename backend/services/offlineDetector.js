const Device = require('../models/Device')

const OFFLINE_THRESHOLD_MS = 2 * 60 * 1000  // 2 minutes — adjust to your publish interval

const startOfflineDetector = (io) => {
  setInterval(async () => {
    try {
      const cutoff = new Date(Date.now() - OFFLINE_THRESHOLD_MS)
      // Both Date.now() and lastSeen are UTC — safe to compare directly
      const result = await Device.updateMany(
        {
          status:   'online',
          lastSeen: { $lt: cutoff }   // last seen more than 2 min ago
        },
        { status: 'offline' }
      )

      if (result.modifiedCount > 0) {
        // Notify React clients of status change
        const updated = await Device.find({ status: 'offline' })
        updated.forEach(d => {
          io.emit('device_status', { device_id: d.device_id, status: 'offline' })
        })
      }
    } catch (err) {
      console.error('Offline detector error:', err.message)
    }
  }, 30 * 1000)  // check every 30 seconds
}

module.exports = { startOfflineDetector }