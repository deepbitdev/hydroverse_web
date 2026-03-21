const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { Server } = require('socket.io');

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

// ── In-memory room store ──────────────────────────────────────
// rooms: Map<roomCode, { mode, players: Map<socketId, PlayerInfo> }>
const rooms = new Map();

function genCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code;
  do {
    code = Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  } while (rooms.has(code));
  return code;
}

function roomSnapshot(roomCode) {
  const room = rooms.get(roomCode);
  if (!room) return [];
  return [...room.players.values()];
}

// ── Boot ──────────────────────────────────────────────────────
app.prepare().then(() => {
  const httpServer = createServer((req, res) => {
    handle(req, res, parse(req.url, true));
  });

  const io = new Server(httpServer, {
    cors: { origin: '*', methods: ['GET', 'POST'] },
  });

  io.on('connection', (socket) => {
    let currentRoom = null;

    // ── Create room ─────────────────────────────────────────
    socket.on('room:create', ({ name = 'PILOT' } = {}) => {
      const code = genCode();
      rooms.set(code, { players: new Map() });

      currentRoom = code;
      socket.join(code);

      const player = { id: socket.id, name, x: 0, z: 0, ry: 0, health: 100, dead: false };
      rooms.get(code).players.set(socket.id, player);

      socket.emit('room:joined', {
        roomCode: code,
        playerId: socket.id,
        players: [],          // no other players yet
      });
    });

    // ── Join room ───────────────────────────────────────────
    socket.on('room:join', ({ roomCode, name = 'PILOT' } = {}) => {
      const code = roomCode?.toUpperCase?.();
      const room = rooms.get(code);

      if (!room) {
        socket.emit('room:error', { message: 'Room not found. Check the code and try again.' });
        return;
      }

      currentRoom = code;
      socket.join(code);

      const existing = [...room.players.values()];
      const player = { id: socket.id, name, x: 0, z: 0, ry: 0, health: 100, dead: false };
      room.players.set(socket.id, player);

      // Tell joiner who's already here
      socket.emit('room:joined', {
        roomCode: code,
        playerId: socket.id,
        players: existing,
      });

      // Tell everyone else about the new player
      socket.to(code).emit('room:player_joined', player);
    });

    // ── Position / health sync (client sends ~20 Hz) ────────
    socket.on('game:state', (state) => {
      if (!currentRoom) return;
      const room = rooms.get(currentRoom);
      if (!room) return;
      const player = room.players.get(socket.id);
      if (player) Object.assign(player, state);
      // Relay to everyone else in the room
      socket.to(currentRoom).emit('game:state', { id: socket.id, ...state });
    });

    // ── Shoot event (for remote visuals) ────────────────────
    socket.on('game:shoot', (data) => {
      if (!currentRoom) return;
      socket.to(currentRoom).emit('game:shoot', { fromId: socket.id, ...data });
    });

    // ── Hit relay — shooter detected hit, tells victim ──────
    socket.on('game:hit', ({ toId, damage }) => {
      if (!currentRoom) return;
      io.to(toId).emit('game:hit', { fromId: socket.id, damage });
    });

    // ── Kill broadcast ───────────────────────────────────────
    socket.on('game:kill', ({ victimId, victimName }) => {
      if (!currentRoom) return;
      const room = rooms.get(currentRoom);
      const killer = room?.players.get(socket.id);
      io.to(currentRoom).emit('game:kill', {
        killerId: socket.id,
        killerName: killer?.name ?? 'UNKNOWN',
        victimId,
        victimName,
      });
    });

    // ── Disconnect ───────────────────────────────────────────
    socket.on('disconnect', () => {
      if (!currentRoom) return;
      const room = rooms.get(currentRoom);
      if (!room) return;
      room.players.delete(socket.id);
      socket.to(currentRoom).emit('room:player_left', { playerId: socket.id });
      if (room.players.size === 0) rooms.delete(currentRoom);
    });
  });

  const port = parseInt(process.env.PORT || '3000', 10);
  httpServer.listen(port, () => {
    console.log(`> Ready on http://localhost:${port}`);
  });
});
