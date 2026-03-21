// Shared types for the multiplayer system

export interface RemotePlayerState {
  id: string;
  name: string;
  // Current (interpolated toward these)
  x: number;
  z: number;
  ry: number;
  health: number;
  dead: boolean;
}

export interface RoomJoinedPayload {
  roomCode: string;
  playerId: string;
  players: RemotePlayerState[];
}

export interface GameStatePayload {
  id: string;
  x: number;
  z: number;
  ry: number;
  health: number;
  dead: boolean;
}

export interface ShootPayload {
  fromId: string;
  x: number;
  z: number;
  dirX: number;
  dirZ: number;
  weaponId: string;
  projectileSpeed: number;
  damage: number;
}

export interface HitPayload {
  fromId: string;
  damage: number;
}

export interface KillPayload {
  killerId: string;
  killerName: string;
  victimId: string;
  victimName: string;
}

// Assigns a deterministic boat color per remote player ID
const REMOTE_COLORS: [number, number][] = [
  [0xcc1133, 0xff4466],
  [0x228833, 0x44ee88],
  [0x994411, 0xffaa44],
  [0x6611aa, 0xcc44ff],
  [0x119988, 0x44ffee],
  [0x885511, 0xffcc44],
  [0x113399, 0x4488ff],
];

export function remotePlayerColor(id: string): [number, number] {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  return REMOTE_COLORS[hash % REMOTE_COLORS.length];
}
