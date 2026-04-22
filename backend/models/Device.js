const mongoose = require('mongoose');

const DeviceSchema = new mongoose.Schema({
  device_id:   { type: String, required: true, unique: true }, // e.g. "esp32_01"
  name:        { type: String, required: true },               // e.g. "Line 1 - Temp Sensor"
  location:    { type: String },                               // e.g. "Factory Line 1"
  topic:       { type: String, required: true },               // MQTT topic
  status:      { type: String, enum: ['online', 'offline'], default: 'offline' },
  lastSeen:    { type: Date },
  rssi:          { type: Number }, // Signal strength
  createdAt:   { type: Date, default: Date.now }
});

module.exports = mongoose.model('Device', DeviceSchema);