import { io, Socket } from 'socket.io-client';

// In production (Vercel) set NEXT_PUBLIC_SOCKET_URL to your Railway/Render server URL.
// Locally, leave it unset — the custom server.js handles both Next.js and Socket.io on
// the same port so a relative connection works fine.
const SOCKET_URL =
  process.env.NEXT_PUBLIC_SOCKET_URL ||
  (typeof window !== 'undefined' ? window.location.origin : '');

let _socket: Socket | null = null;

export function getSocket(): Socket {
  if (!_socket) {
    _socket = io(SOCKET_URL, {
      autoConnect: false,
      // Try WebSocket first, fall back to polling if the host doesn't support it
      transports: ['websocket', 'polling'],
    });
  }
  return _socket;
}

export function connectSocket(): Socket {
  const s = getSocket();
  if (!s.connected) s.connect();
  return s;
}

export function disconnectSocket(): void {
  if (_socket) {
    _socket.disconnect();
    _socket = null;
  }
}
