const mqtt          = require('mqtt');
const SensorReading = require('../models/SensorReading');
const Device        = require('../models/Device');
const { nowBD }     = require('../utils/timeHelper');

let io; // Socket.IO instance — injected from server.js

const connectMQTT = (socketIO) => {
  io = socketIO;

  const client = mqtt.connect(`mqtts://${process.env.MQTT_HOST}:${process.env.MQTT_PORT}`, {
    username:    process.env.MQTT_USER,
    password:    process.env.MQTT_PASS,
    clientId:    'nodejs_backend_' + Math.random().toString(16).slice(2),
    rejectUnauthorized: true,
  });

  client.on('connect', () => {
    console.log('MQTT connected to HiveMQ Cloud');
    client.subscribe('factory/#', { qos: 1 }, (err) => {
      if (err) console.error('MQTT subscribe error:', err);
      else console.log('Subscribed to factory/#');
    });
  });

  client.on('message', async (topic, message) => {
    try {
      const payload = JSON.parse(message.toString());
      
      // console.log(`[MQTT] ${topic}:`, payload);
      console.log(`[${nowBD()}] MQTT message on ${topic}:`, payload)
  
      
      // Save to MongoDB
      const reading = await SensorReading.create({
        device_id:  payload.device_id,
        temp_c:     payload.temp_c,
        humidity:   payload.humidity,
        heat_index: payload.heat_index,
        uptime_ms:  payload.uptime_ms,
        voltage:    payload.voltage,
        current:    payload.current,
        power:      payload.power,
        energy:     payload.energy,
        frequency:  payload.frequency,
        pf:         payload.pf,


        // receivedAt: bdTime,
      });

      // Update device last seen + status
      await Device.findOneAndUpdate(
        { device_id: payload.device_id },
        { status: 'online',
          lastSeen: new Date(),
          rssi: payload.rssi || null, // Update RSSI if provided
        },
        { upsert: true }
      );

    
      // Emit live update to all connected React clients via Socket.IO
      io.emit('sensor_update', {
        device_id: payload.device_id,
        reading,
      });

    } catch (err) {
      console.error('MQTT message processing error:', err.message);
    }
  });

  client.on('error',      (err) => console.error('MQTT error:', err));
  client.on('disconnect', ()    => console.log('MQTT disconnected'));
  client.on('reconnect',  ()    => console.log('MQTT reconnecting...'));
};

module.exports = { connectMQTT };