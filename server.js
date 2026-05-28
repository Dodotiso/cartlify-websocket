const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] }
});

const users = new Map();

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.on('auth', (userId) => {
    users.set(Number(userId), socket.id);
    socket.userId = userId;
    console.log(`User ${userId} authenticated`);
  });

  socket.on('disconnect', () => {
    if (socket.userId) {
      users.delete(Number(socket.userId));
      console.log(`User ${socket.userId} disconnected`);
    }
  });
});

app.post('/send-notification', express.json(), (req, res) => {
  const { userId, type, title, message } = req.body;
  const socketId = users.get(Number(userId));
  if (socketId) {
    io.to(socketId).emit('notification', { type, title, message });
    res.json({ success: true });
  } else {
    res.json({ success: false, message: 'User not connected' });
  }
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`WebSocket server running on port ${PORT}`);
});