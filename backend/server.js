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




// ── Dynamic CORS for production ──
const allowedOrigins = [
  process.env.CLIENT_URL,          // your Vercel URL
  'http://localhost:5173',          // local dev
  'http://localhost:3000',
].filter(Boolean)


const corsOptions = {
  origin: (origin, callback) => {
    // allow requests with no origin (mobile apps, Postman)
    if (!origin) return callback(null, true)
    if (allowedOrigins.includes(origin)) return callback(null, true)
    callback(new Error('Not allowed by CORS'))
  },
  credentials: true,
}

// ── Middleware ──
app.use(cors(corsOptions));
app.use(express.json());

const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    credentials: true,
  },
})

// ── Health check endpoint — Railway needs this ──
app.get('/health', (req, res) => res.json({ status: 'ok', uptime: process.uptime() }));

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