const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const http = require('http');
const connectDB = require('./config/db');
const { initializeSocket, getRoomStats, getServerStats } = require('./socket');

// Load environment variables
dotenv.config();

// Connect to MongoDB
connectDB();

const app = express();
const httpServer = http.createServer(app);

// CORS configuration
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true
}));

app.get('/', (req, res) => {
  res.send('Welcome to the SketchDB API');
});

// Body parser middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/diagrams', require('./routes/diagrams'));

// Health check route
app.get('/api/health', (req, res) => {
  res.json({ 
    success: true, 
    message: 'SketchDB API is running',
    timestamp: new Date().toISOString()
  });
});

// Socket.IO room statistics (for debugging/monitoring)
app.get('/api/socket-stats', (req, res) => {
  try {
    const roomStats = getRoomStats();
    const serverStats = getServerStats();
    res.json({ 
      success: true, 
      stats: {
        ...serverStats,
        rooms: roomStats
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to get stats' });
  }
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error'
  });
});

const PORT = process.env.PORT || 5000;

// Initialize Socket.IO for real-time collaboration
const io = initializeSocket(httpServer);

// Make io available to routes if needed
app.set('io', io);

httpServer.listen(PORT, () => {
  console.log(`
  ╔════════════════════════════════════════════════════════╗
  ║                                                        ║
  ║   SketchDB Server                                      ║
  ║   Database Diagram Tool Backend                        ║
  ║                                                        ║
  ║   Server running on port ${PORT}                       ║
  ║   Environment: ${process.env.NODE_ENV || 'development'}║                    ║
  ║   Socket.IO: Enabled                                   ║
  ║                                                        ║
  ╚════════════════════════════════════════════════════════╝
  `);
});
