# Hydroverse

A browser-based 3D multiplayer boat battle game built with Next.js, React Three Fiber, and custom GLSL shaders.

## Overview

Hydroverse drops players into a cel-shaded ocean arena to compete in boat combat. The game features hand-crafted water and sky shaders, AI opponents, projectile physics, and a lobby with NPC boats before jumping into a match.

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 |
| 3D Rendering | React Three Fiber + Three.js |
| Shaders | Custom GLSL (water + sky) |
| State | Zustand |
| Styling | Tailwind CSS |
| Language | TypeScript |

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Other Scripts

```bash
npm run build   # Production build
npm run start   # Serve production build
```

## Project Structure

```
hydroverse/
├── app/                    # Next.js app router
│   ├── page.tsx            # Root page (dynamic import, no SSR)
│   └── layout.tsx          # Root layout
├── components/
│   ├── HydroApp.tsx        # Screen router (lobby ↔ game)
│   ├── AnimeWater.tsx      # Water surface mesh + ripple system
│   ├── SkyDome.tsx         # Sky sphere with procedural shader
│   ├── BoatMesh.tsx        # Boat 3D model
│   ├── PalmTree.tsx        # Palm tree decoration
│   ├── WorldDecorations.tsx # Stage, buoys, fireworks, crowd
│   ├── lobby/
│   │   ├── LobbyScene.tsx  # Lobby world setup
│   │   ├── LobbyHUD.tsx    # Lobby UI
│   │   ├── LobbyDock.tsx   # Dock decorations
│   │   ├── NpcBoats.tsx    # Idle NPC boats
│   │   └── PlayerAvatar.tsx# Player character in lobby
│   └── game/
│       ├── GameScene.tsx   # Game world setup + game loop
│       ├── GameHUD.tsx     # In-game HUD (health, ammo, boost)
│       ├── GameWorld.tsx   # Inner game world component
│       ├── PlayerController.tsx # Player input + boat physics
│       └── EndScreen.tsx   # Match end / results screen
├── shaders/
│   ├── waterShader.ts      # Cel-shaded water (Voronoi + ripples)
│   └── skyShader.ts        # Procedural sky (gradient + clouds + sun)
├── lib/
│   ├── aiBoat.ts           # AI pathfinding and behavior
│   ├── projectiles.ts      # Projectile physics and collision
│   ├── scoreManager.ts     # Score tracking
│   ├── sfx.ts              # Sound effects
│   └── weapons.ts          # Weapon definitions
└── store/
    └── gameStore.ts        # Zustand global state
```

## Shaders

### Water (`shaders/waterShader.ts`)

Custom GLSL fragment shader using dual Voronoi layers for cel-shaded ocean water:

- **Voronoi cells** — two blended layers create the animated water pattern
- **3-stop cel ramp** — deep ocean blue → ocean blue → bright highlight
- **Foam edges** — hard-edged white borders between cells
- **Ripple rings** — up to 8 concurrent concentric ripple sources (triggered by boats and collisions)
- **Surface sparkles** — random glints for detail
- **Horizon fade** — distance-based transparency blend

### Sky (`shaders/skyShader.ts`)

Procedural GLSL sky dome rendered on a sphere with `BackSide` material:

- **5-stop gradient** — sea haze → pale horizon → mid blue → deep blue → zenith
- **Sun + corona** — sharp disc with soft glow
- **Atmospheric haze** — blue-white horizon scatter
- **Fractal clouds** — 3-octave FBM noise in a mid-sky band with soft undersides

## Game Systems

- **Player controller** — WASD/arrow key movement, boost, aiming
- **AI boats** — pathfinding with configurable difficulty
- **Weapons** — multiple weapon types with cooldowns
- **Projectile physics** — collision detection against boats and world geometry
- **Ripple system** — water ripples spawned by boat wakes and projectile impacts
- **Match timer** — configurable time limits with kill feed and score tracking

## State Management

Global state lives in a single Zustand store (`store/gameStore.ts`) covering:

- Current screen (`lobby` | `game`)
- Match settings (game mode, difficulty, bot count, limits)
- Player stats (health, ammo, boost, speed)
- Match state (timer, running, ended, kill feed)
