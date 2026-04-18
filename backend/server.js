require('dotenv').config();
const express      = require('express');
const cors         = require('cors');
const http         = require('http');
const { Server }   = require('socket.io');
const connectDB    = require('./config/db');
const { connectMQTT } = require('./services/mqttService');
const { startOfflineDetector } = require('./services/offlineDetector');

const app    = express();
const server = http.createServer(app);
const io     = new Server(server, {
  cors: { origin: 'http://localhost:5173', credentials: true }
});

// ── Middleware ──
app.use(cors({ origin: 'http://localhost:5173', credentials: true }));
app.use(express.json());

// ── Routes ──
app.use('/api/auth',     require('./routes/auth'));
app.use('/api/devices',  require('./routes/devices'));
app.use('/api/readings', require('./routes/readings'));
app.use('/api/analytics', require('./routes/analytics'));


// ── Socket.IO auth middleware ──
io.use((socket, next) => {
  const token = socket.handshake.auth?.token;
  if (!token) return next(new Error('Authentication required'));
  try {
    const jwt     = require('jsonwebtoken');
    socket.user   = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    next(new Error('Invalid token'));
  }
});

io.on('connection', (socket) => {
  console.log('React client connected:', socket.id);
  socket.on('disconnect', () => console.log('Client disconnected:', socket.id));
});

// ── Start ──
connectDB().then(() => {
  connectMQTT(io);
  startOfflineDetector(io);
  server.listen(process.env.PORT, () =>
    console.log(`Server running on port ${process.env.PORT}`)
  );
});