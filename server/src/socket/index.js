import { Server } from 'socket.io';

let io;

export const initSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:5173',
      methods: ['GET', 'POST'],
    },
  });

  io.on('connection', (socket) => {
    console.log(`🔌 Client connected: ${socket.id}`);

    // Join a show-specific room to get real-time seat updates
    socket.on('join_show', (showId) => {
      socket.join(`show:${showId}`);
      console.log(`Socket ${socket.id} joined show:${showId}`);
    });

    socket.on('leave_show', (showId) => {
      socket.leave(`show:${showId}`);
    });

    socket.on('disconnect', () => {
      console.log(`❌ Client disconnected: ${socket.id}`);
    });
  });

  return io;
};

// Emit seat status updates to everyone in a show room
export const emitSeatUpdate = (showId, seats) => {
  if (io) {
    io.to(`show:${showId}`).emit('seat_update', { showId, seats });
  }
};

export { io };