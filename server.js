require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { createServer } = require('http');
const { Server } = require('socket.io');
// removed mongoose DB connection - using JSON file storage
const errorHandler = require('./middleware/errorHandler');

// No DB connect required for JSON-file storage

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
  },
});

const { setIO } = require('./utils/io');
setIO(io);

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/tasks', require('./routes/tasks'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Error handler middleware
app.use(errorHandler);

// WebSocket events
io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);

  socket.on('user:login', (userData) => {
    socket.join(`user:${userData.id}`);
    console.log(`User ${userData.id} connected via WebSocket`);
  });

  socket.on('task:create', (data) => {
    // Broadcast to all clients of that user
    io.to(`user:${data.userId}`).emit('task:created', data);
  });

  socket.on('task:update', (data) => {
    // Broadcast to all clients of that user
    io.to(`user:${data.userId}`).emit('task:updated', data);
  });

  socket.on('task:delete', (data) => {
    // Broadcast to all clients of that user
    io.to(`user:${data.userId}`).emit('task:deleted', data);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 2000;

httpServer.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

module.exports = { app, io };
