const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { createServer } = require('http');
const { Server } = require('socket.io');
require('dotenv').config();

// Import routes
const authRoutes = require('./routes/auth');
const projectRoutes = require('./routes/projects');
const pageRoutes = require('./routes/pages');
const logRoutes = require('./routes/logs');

// Import socket handlers
const socketHandlers = require('./socket/socketHandlers');

const app = express();
const server = createServer(app);

// Socket.IO setup - optimized for memory
const io = new Server(server, {
  cors: {
    origin: [
      process.env.FRONTEND_URL || "http://localhost:3000",
      "https://serena-workspace.vercel.app",
      "https://serena-workspace-git-main.vercel.app"
    ],
    methods: ["GET", "POST"]
  },
  // Memory optimization
  pingTimeout: 60000,
  pingInterval: 25000,
  maxHttpBufferSize: 1e6, // 1MB
  allowEIO3: true
});

// Middleware
app.use(helmet());
app.use(cors({
  origin: [
    process.env.FRONTEND_URL || "http://localhost:3000",
    "https://serena-workspace.vercel.app",
    "https://serena-workspace-git-main.vercel.app"
  ],
  credentials: true
}));

// Rate limiting - more restrictive for free tier
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 50, // Reduced to 50 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use(limiter);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Database connection
const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/notion-workspace';
console.log('Attempting to connect to MongoDB...');
console.log('MongoDB URI:', mongoUri.replace(/\/\/.*@/, '//***:***@')); // Hide credentials in logs

mongoose.connect(mongoUri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
  console.log('MongoDB connected successfully');
  console.log('Database connection established');
})
.catch(err => {
  console.error('MongoDB connection error:', err);
  console.error('Failed to connect to database');
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/pages', pageRoutes);
app.use('/api/logs', logRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({ 
    message: 'Notion Workspace API is running!',
    status: 'OK',
    timestamp: new Date().toISOString()
  });
});

// Health check
app.get('/api/health', (req, res) => {
  const memUsage = process.memoryUsage();
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: {
      rss: Math.round(memUsage.rss / 1024 / 1024) + ' MB',
      heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024) + ' MB',
      heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024) + ' MB',
      external: Math.round(memUsage.external / 1024 / 1024) + ' MB'
    }
  });
});

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);
  
  socketHandlers(socket, io);
  
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

const PORT = process.env.PORT || 5000;

// Memory monitoring
setInterval(() => {
  const memUsage = process.memoryUsage();
  const memMB = Math.round(memUsage.rss / 1024 / 1024);
  console.log(`Memory usage: ${memMB}MB`);
  
  // If memory usage is too high, log warning
  if (memMB > 400) { // Railway free tier limit is ~512MB
    console.warn(`High memory usage: ${memMB}MB`);
  }
}, 30000); // Check every 30 seconds

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Process terminated');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  server.close(() => {
    console.log('Process terminated');
    process.exit(0);
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log('='.repeat(50));
  console.log('🚀 NOTION WORKSPACE BACKEND STARTING...');
  console.log('🔄 MongoDB whitelist updated - retrying connection...');
  console.log('='.repeat(50));
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Health check endpoint: http://0.0.0.0:${PORT}/api/health`);
  console.log(`MongoDB URI configured: ${process.env.MONGODB_URI ? 'Yes' : 'No'}`);
  console.log(`JWT Secret configured: ${process.env.JWT_SECRET ? 'Yes' : 'No'}`);
  console.log(`All environment variables loaded successfully!`);
  console.log('='.repeat(50));
  console.log('✅ BACKEND READY TO ACCEPT REQUESTS!');
  console.log('='.repeat(50));
});

module.exports = { app, server, io };
