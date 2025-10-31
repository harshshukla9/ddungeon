// Simple WebSocket server for testing multiplayer functionality
// Run with: node server-example.js

const { Server } = require('socket.io');
const http = require('http');

const server = http.createServer();
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Store game rooms and players
const rooms = new Map();
const players = new Map();

io.on('connection', (socket) => {
  console.log('Player connected:', socket.id);

  socket.on('create_room', (data) => {
    const { room, player } = data;
    
    // Add player to room
    room.players = [player];
    rooms.set(room.id, room);
    players.set(socket.id, { ...player, socketId: socket.id, roomId: room.id });
    
    // Join socket room
    socket.join(room.id);
    
    // Send room joined event
    socket.emit('room_joined', { room, players: [player] });
    
    console.log(`Room created: ${room.name} by ${player.name}`);
  });

  socket.on('join_room', (data) => {
    const { roomId, player } = data;
    const room = rooms.get(roomId);
    
    if (!room) {
      socket.emit('error', 'Room not found');
      return;
    }
    
    if (room.players.length >= room.maxPlayers) {
      socket.emit('error', 'Room is full');
      return;
    }
    
    // Add player to room
    room.players.push(player);
    players.set(socket.id, { ...player, socketId: socket.id, roomId: room.id });
    
    // Join socket room
    socket.join(roomId);
    
    // Notify all players in room
    io.to(roomId).emit('player_joined', player);
    socket.emit('room_joined', { room, players: room.players });
    
    console.log(`${player.name} joined room: ${room.name}`);
  });

  socket.on('leave_room', (data) => {
    const { roomId, playerId } = data;
    const room = rooms.get(roomId);
    const player = players.get(socket.id);
    
    if (room && player) {
      // Remove player from room
      room.players = room.players.filter(p => p.id !== playerId);
      players.delete(socket.id);
      
      // Leave socket room
      socket.leave(roomId);
      
      // Notify other players
      socket.to(roomId).emit('player_left', playerId);
      
      // Delete room if empty
      if (room.players.length === 0) {
        rooms.delete(roomId);
      }
      
      console.log(`Player left room: ${room.name}`);
    }
  });

  socket.on('player_update', (data) => {
    const { playerId, updates } = data;
    const player = players.get(socket.id);
    
    if (player && player.roomId) {
      // Update player data
      Object.assign(player, updates);
      
      // Broadcast to other players in room
      socket.to(player.roomId).emit('player_update', { playerId, updates });
    }
  });

  socket.on('game_event', (event) => {
    const player = players.get(socket.id);
    
    if (player && player.roomId) {
      // Broadcast game event to all players in room
      io.to(player.roomId).emit('game_event', event);
    }
  });

  socket.on('get_room_list', () => {
    const roomList = Array.from(rooms.values()).map(room => ({
      id: room.id,
      name: room.name,
      players: room.players,
      maxPlayers: room.maxPlayers,
      gameMode: room.gameMode,
      isActive: room.isActive,
      level: room.level,
      hostId: room.hostId
    }));
    
    socket.emit('room_list', roomList);
  });

  socket.on('start_game', (data) => {
    const { roomId } = data;
    const room = rooms.get(roomId);
    const player = players.get(socket.id);
    
    if (room && player && room.hostId === player.id) {
      room.isActive = true;
      io.to(roomId).emit('game_started', { room });
      console.log(`Game started in room: ${room.name}`);
    }
  });

  socket.on('disconnect', () => {
    const player = players.get(socket.id);
    
    if (player && player.roomId) {
      const room = rooms.get(player.roomId);
      
      if (room) {
        // Remove player from room
        room.players = room.players.filter(p => p.id !== player.id);
        
        // Notify other players
        socket.to(player.roomId).emit('player_left', player.id);
        
        // Delete room if empty
        if (room.players.length === 0) {
          rooms.delete(player.roomId);
        }
      }
      
      players.delete(socket.id);
      console.log('Player disconnected:', player.name);
    }
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Multiplayer server running on port ${PORT}`);
  console.log(`Connect your game to: ws://localhost:${PORT}`);
});
