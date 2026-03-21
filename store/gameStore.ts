import { create } from 'zustand';

export type Screen = 'lobby' | 'game';
export type GameMode = 'FFA' | 'TDM' | 'RACE' | 'SIEGE';
export type Difficulty = 'CADET' | 'VETERAN' | 'ACE';
export type BotCount = 3 | 5 | 7;

export interface Settings {
  mode: GameMode;
  difficulty: Difficulty;
  bots: BotCount;
  scoreLimit: number;
  timeLimit: number;
}

export interface PlayerState {
  health: number;
  ammo: number;
  boost: number;
  speed: number;
  dead: boolean;
  reloading: boolean;
  weaponIdx: number;
}

export interface GameState {
  screen: Screen;
  settings: Settings;
  player: PlayerState;
  matchTimer: number;
  matchRunning: boolean;
  matchEnded: boolean;
  killFeed: { id: number; msg: string; cls: string }[];
  nextKillId: number;

  // actions
  setScreen: (s: Screen) => void;
  setSettings: (s: Partial<Settings>) => void;
  startMatch: () => void;
  endMatchAction: () => void;
  setPlayer: (p: Partial<PlayerState>) => void;
  tickTimer: (dt: number) => void;
  addKill: (msg: string, cls?: string) => void;
  removeKill: (id: number) => void;
}

export const useGameStore = create<GameState>((set, get) => ({
  screen: 'lobby',
  settings: {
    mode: 'FFA',
    difficulty: 'VETERAN',
    bots: 5,
    scoreLimit: 10,
    timeLimit: 300,
  },
  player: {
    health: 100, ammo: 100, boost: 100,
    speed: 0, dead: false, reloading: false, weaponIdx: 0,
  },
  matchTimer: 300,
  matchRunning: false,
  matchEnded: false,
  killFeed: [],
  nextKillId: 0,

  setScreen: (screen) => set({ screen }),
  setSettings: (s) => set((state) => ({ settings: { ...state.settings, ...s } })),

  startMatch: () => set((state) => ({
    screen: 'game',
    matchRunning: true,
    matchEnded: false,
    matchTimer: state.settings.timeLimit,
    player: { health: 100, ammo: 100, boost: 100, speed: 0, dead: false, reloading: false, weaponIdx: 0 },
    killFeed: [],
  })),

  endMatchAction: () => set({ matchRunning: false, matchEnded: true }),

  setPlayer: (p) => set((state) => ({ player: { ...state.player, ...p } })),

  tickTimer: (dt) => set((state) => {
    const t = Math.max(0, state.matchTimer - dt);
    return { matchTimer: t };
  }),

  addKill: (msg, cls = '') => {
    const id = get().nextKillId;
    set((state) => ({
      killFeed: [{ id, msg, cls }, ...state.killFeed].slice(0, 8),
      nextKillId: state.nextKillId + 1,
    }));
    setTimeout(() => get().removeKill(id), 3800);
  },

  removeKill: (id) => set((state) => ({
    killFeed: state.killFeed.filter((k) => k.id !== id),
  })),
}));
