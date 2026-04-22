const mongoose = require('mongoose');

const SensorReadingSchema = new mongoose.Schema({
  device_id:  { type: String, required: true, index: true },
 //Environmental
  temp_c:     { type: Number },
  humidity:   { type: Number },
  heat_index: { type: Number },
  uptime_ms:  { type: Number },
  rssi:      { type: Number},
  //electrical
  voltage:    { type: Number },
  current:    { type: Number },
  power:      { type: Number },
  energy:     { type: Number },
  frequency:  { type: Number },
  pf:         { type: Number },
  receivedAt: { type: Date, default: Date.now }
});

// Compound index for fast device+time queries
SensorReadingSchema.index({ device_id: 1, receivedAt: -1 });

// Auto-delete readings older than 30 days (optional, saves storage)
SensorReadingSchema.index({ receivedAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 90 });

module.exports = mongoose.model('SensorReading', SensorReadingSchema);