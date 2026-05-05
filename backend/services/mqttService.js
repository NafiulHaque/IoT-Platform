const mqtt          = require('mqtt');
const SensorReading = require('../models/SensorReading');
const Device        = require('../models/Device');
const { nowBD }     = require('../utils/timeHelper');

let ioInstance = null; // Socket.IO instance — injected from server.js

const connectMQTT = (io) => {
  ioInstance = io;

  const client = mqtt.connect(
    `mqtts://${process.env.MQTT_HOST}:${process.env.MQTT_PORT}`,
 {
    username:    process.env.MQTT_USER,
    password:    process.env.MQTT_PASS,
    clientId:    'nodejs_backend_' + Math.random().toString(16).slice(2),
    rejectUnauthorized: true,
    reconnectPeriod: 5000,
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
  
       if (!payload.device_id) {
        console.warn('[MQTT] Payload missing device_id — skipping')
        return
      }

    // Save to MongoDB
      const reading = await SensorReading.create({
        device_id:  payload.device_id,
        voltage:    payload.voltage    ? Number(payload.voltage)   : undefined,
        current:    payload.current    ? Number(payload.current)   : undefined,
        power:      payload.power      ? Number(payload.power)     : undefined,
        energy:     payload.energy     ? Number(payload.energy)    : undefined,
        frequency:  payload.frequency  ? Number(payload.frequency) : undefined,
        pf:         payload.pf         ? Number(payload.pf)        : undefined,
        temp_c:     payload.temp_c     ? Number(payload.temp_c)    : undefined,
        humidity:   payload.humidity   ? Number(payload.humidity)  : undefined,
        heat_index: payload.heat_index ? Number(payload.heat_index): undefined,
      });

      // Update device last seen + status
      await Device.findOneAndUpdate(
        { device_id: payload.device_id },
        { status: 'online',
          lastSeen: new Date(),
          rssi: payload.rssi || null, // Update RSSI if provided
        },
        { upsert: true, returnDocument: 'after' }
      );

    
      // Emit live update to all connected React clients via Socket.IO
      if (ioInstance){
        ioInstance.emit('sensor_update', {
        device_id: payload.device_id,
        reading,
      })
      console.log(`[Socket] Emitted sensor_update for ${payload.device_id}`)

      } else {
        console.warn(`[Socket] ioInstance is null update not emitted`)
      }

    } catch (err) {
      console.error('MQTT message processing error:', err.message);
    }
  });

  client.on('error',      (err) => console.error('MQTT error:', err));
  client.on('disconnect', ()    => console.log('MQTT disconnected'));
  client.on('reconnect',  ()    => console.log('MQTT reconnecting...'));
  client.on( 'offline',    ()    => console.warn('MQTT Client offline'));
};

module.exports = { connectMQTT };