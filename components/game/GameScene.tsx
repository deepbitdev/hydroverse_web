'use client';
import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useGameStore } from '@/store/gameStore';
import AnimeWater from '@/components/AnimeWater';
import SkyDome from '@/components/SkyDome';
import { PalmRing } from '@/components/PalmTree';
import { FestivalStage, Buoys, FireworkParticles, CrowdDots, SceneLights } from '@/components/WorldDecorations';
import BoatMesh from '@/components/BoatMesh';
import GameHUD from './GameHUD';
import EndScreen from './EndScreen';
import PlayerController from './PlayerController';
import MobileControls from './MobileControls';
import RemotePlayer from './RemotePlayer';
import { createAIBoat, updateAI, AIBoat } from '@/lib/aiBoat';
import { Projectile, updateProjectiles, spawnExplosion } from '@/lib/projectiles';
import { createProjectile } from '@/lib/projectiles';
import { ScoreManager } from '@/lib/scoreManager';
import { SFX } from '@/lib/sfx';
import { WEAPONS } from '@/lib/weapons';
import { connectSocket, disconnectSocket } from '@/lib/socket';
import type { GameStatePayload, ShootPayload, HitPayload, KillPayload } from '@/lib/multiplayer';

// ── Inner scene that has access to R3F context ──────────────
function GameWorld({
  playerBoatRef,
  projectilesRef,
  aiBoatsRef,
  ripplesRef,
  keys,
  onPositionUpdate,
}: {
  playerBoatRef: React.RefObject<THREE.Group>;
  projectilesRef: React.MutableRefObject<Projectile[]>;
  aiBoatsRef: React.MutableRefObject<AIBoat[]>;
  ripplesRef: React.MutableRefObject<{ x: number; z: number; age: number }[]>;
  keys: React.MutableRefObject<Record<string, boolean>>;
  onPositionUpdate: (pos: { x: number; z: number }) => void;
}) {
  const { scene } = useThree();
  const { settings, player, setPlayer, addKill, tickTimer, matchRunning } = useGameStore();

  useFrame((_, dt) => {
    if (!matchRunning) return;
    const playerPos = playerBoatRef.current?.position ?? new THREE.Vector3();

    // ── AI boats ────────────────────────────────────────────
    aiBoatsRef.current.forEach((boat) => {
      updateAI(boat, playerPos, dt, settings.difficulty);
    });

    // ── Projectile updates & collisions ────────────────────
    updateProjectiles(projectilesRef.current, scene, dt);

    projectilesRef.current.forEach((p) => {
      if (!p.alive) return;
      const ppos = p.mesh.position;

      if (p.isPlayer) {
        // vs AI boats
        aiBoatsRef.current.forEach((boat) => {
          if (!boat.alive || !p.alive) return;
          if (ppos.distanceTo(boat.mesh.position) < 3) {
            boat.health -= p.damage;
            spawnExplosion(scene, ppos.clone(), 12, 0xff6600);
            SFX.explosion(0.6);
            p.alive = false;
            if (boat.health <= 0) {
              boat.alive = false;
              boat.mesh.visible = false;
              boat.respawnTimer = 6;
              spawnExplosion(scene, boat.mesh.position.clone(), 45, 0xff3300);
              SFX.explosion(1.2);
              addKill(`⊕ ${boat.name} destroyed`, '');
            }
          }
        });
      } else {
        // vs player
        if (!player.dead && ppos.distanceTo(playerPos) < 2.8) {
          const newHealth = Math.max(0, player.health - p.damage);
          setPlayer({ health: newHealth });
          SFX.hit();
          p.alive = false;
          spawnExplosion(scene, ppos.clone(), 8, 0xff0000);
          if (newHealth <= 0 && !player.dead) {
            setPlayer({ dead: true });
            spawnExplosion(scene, playerPos.clone(), 50, 0xff3300);
            SFX.explosion(1.8);
            if (playerBoatRef.current) playerBoatRef.current.visible = false;
            addKill('☠ Your vessel was destroyed', 'red');
            setTimeout(() => {
              if (playerBoatRef.current) playerBoatRef.current.visible = true;
            }, 5000);
          }
        }
      }
    });

    // ── AI shoots at player ─────────────────────────────────
    aiBoatsRef.current.forEach((boat) => {
      if (!boat.alive) return;
      const dist = boat.mesh.position.distanceTo(playerPos);
      if (dist < 45 && Math.random() < 0.004) {
        const dir = playerPos.clone().sub(boat.mesh.position).normalize();
        dir.y = 0;
        const muzzle = boat.mesh.position.clone().add(new THREE.Vector3(0, 0.5, 0));
        const proj = createProjectile(scene, muzzle, dir, false, { damage: 18, projectileSpeed: 25 });
        projectilesRef.current.push(proj);
      }
    });

    // ── Ripples ─────────────────────────────────────────────
    ripplesRef.current = ripplesRef.current
      .map((r) => ({ ...r, age: r.age + dt * 0.3 }))
      .filter((r) => r.age < 1);

    if (Math.random() < 0.05 && playerPos.length() > 0) {
      ripplesRef.current.push({ x: playerPos.x, z: playerPos.z, age: 0 });
    }
    aiBoatsRef.current.forEach((b) => {
      if (b.alive && Math.random() < 0.01) {
        ripplesRef.current.push({ x: b.mesh.position.x, z: b.mesh.position.z, age: 0 });
      }
    });
    if (ripplesRef.current.length > 8) ripplesRef.current = ripplesRef.current.slice(-8);

    tickTimer(dt);
  });

  return (
    <>
      <SceneLights />
      <SkyDome />
      <PalmRing count={20} radius={155} />
      <FestivalStage />
      <Buoys />
      <FireworkParticles />
      <CrowdDots />
      <AnimeWater size={900} ripples={ripplesRef.current} />

      {/* Player boat */}
      <group ref={playerBoatRef} position={[0, 0.25, 0]}>
        <BoatMesh primary={0x0044bb} accent={0x00e8d8} isPlayer />
      </group>
    </>
  );
}

// ── AI Renderer ──────────────────────────────────────────────
function AIRenderer({ aiBoatsRef }: { aiBoatsRef: React.MutableRefObject<AIBoat[]> }) {
  const { scene } = useThree();
  useEffect(() => {
    aiBoatsRef.current.forEach((b) => scene.add(b.mesh));
    return () => { aiBoatsRef.current.forEach((b) => scene.remove(b.mesh)); };
  }, [scene, aiBoatsRef]);
  return null;
}

// ── Online: spawn remote projectiles for visual feedback ─────
function RemoteShootReceiver({
  projectilesRef,
}: {
  projectilesRef: React.MutableRefObject<Projectile[]>;
}) {
  const { scene } = useThree();
  const { isOnline } = useGameStore();

  useEffect(() => {
    if (!isOnline) return;
    const socket = connectSocket();

    const handleShoot = (data: ShootPayload) => {
      const origin = new THREE.Vector3(data.x, 0.5, data.z);
      const dir    = new THREE.Vector3(data.dirX, 0, data.dirZ).normalize();
      const weapon = WEAPONS.find((w) => w.id === data.weaponId) ?? WEAPONS[0];
      const proj   = createProjectile(scene, origin, dir, false /* not local player */, weapon);
      // Tag as remote visual only — won't damage local player (handled via game:hit relay)
      proj.damage = 0;
      projectilesRef.current.push(proj);
    };

    socket.on('game:shoot', handleShoot);
    return () => { socket.off('game:shoot', handleShoot); };
  }, [isOnline, scene, projectilesRef]);

  return null;
}

// ── Top-level game scene ─────────────────────────────────────
export default function GameScene() {
  const {
    settings, setScreen, startMatch, matchRunning, matchEnded,
    isOnline, roomCode, playerId, playerName,
    remotePlayers, setRemotePlayer, removeRemotePlayer,
    player, setPlayer, addKill,
  } = useGameStore();

  const playerBoatRef  = useRef<THREE.Group>(null);
  const projectilesRef = useRef<Projectile[]>([]);
  const aiBoatsRef     = useRef<AIBoat[]>([]);
  const ripplesRef     = useRef<{ x: number; z: number; age: number }[]>([]);
  const keys           = useRef<Record<string, boolean>>({});
  const [playerPos, setPlayerPos] = useState<{ x: number; z: number } | null>(null);
  const [endState, setEndState]   = useState<{ winner: string; color: string } | null>(null);

  // Sync timer for online position broadcast (~20 Hz)
  const syncAccum = useRef(0);

  // ── Init AI boats (skipped when online: bots=0) ──────────
  useEffect(() => {
    const botCount = settings.bots;
    const boats: AIBoat[] = [];
    const teamColors = [
      [0xcc1133, 0xff6688], [0x113399, 0x4488ff], [0x228833, 0x44ee88],
      [0x994411, 0xffaa44], [0x6611aa, 0xcc44ff], [0x119988, 0x44ffee],
      [0x885511, 0xffcc44],
    ];
    for (let i = 0; i < botCount; i++) {
      const [primary, accent] = teamColors[i % teamColors.length];
      const team = settings.mode === 'TDM' ? (i % 2 === 0 ? 'red' : 'blue') as 'red' | 'blue' : undefined;
      boats.push(createAIBoat(`ai${i}`, primary, accent, team));
    }
    aiBoatsRef.current = boats;

    ScoreManager.reset([
      { id: 'player', name: 'YOU' },
      ...boats.map((b) => ({ id: b.id, name: b.name, team: b.team })),
    ]);

    SFX.startEngine();
    return () => { SFX.stopEngine(); };
  }, [settings]);

  // ── Keyboard listeners ───────────────────────────────────
  useEffect(() => {
    const onDown = (e: KeyboardEvent) => { keys.current[e.code] = true; e.preventDefault(); };
    const onUp   = (e: KeyboardEvent) => { keys.current[e.code] = false; };
    window.addEventListener('keydown', onDown);
    window.addEventListener('keyup', onUp);
    return () => { window.removeEventListener('keydown', onDown); window.removeEventListener('keyup', onUp); };
  }, []);

  // ── Online: socket event handlers ────────────────────────
  useEffect(() => {
    if (!isOnline) return;

    const socket = connectSocket();

    // Remote position/health updates
    socket.on('game:state', (data: GameStatePayload) => {
      setRemotePlayer(data.id, {
        x: data.x, z: data.z, ry: data.ry,
        health: data.health, dead: data.dead,
      });
    });

    // Player joined mid-match
    socket.on('room:player_joined', (p: { id: string; name: string }) => {
      setRemotePlayer(p.id, { id: p.id, name: p.name, x: 0, z: 0, ry: 0, health: 100, dead: false });
      addKill(`⚓ ${p.name} joined the battle`, 'gold');
    });

    // Player left
    socket.on('room:player_left', ({ playerId: pid }: { playerId: string }) => {
      removeRemotePlayer(pid);
      addKill(`⚓ A pilot disconnected`, '');
    });

    // We got hit by a remote player
    socket.on('game:hit', ({ fromId, damage }: HitPayload) => {
      if (player.dead) return;
      const newHealth = Math.max(0, player.health - damage);
      setPlayer({ health: newHealth });
      SFX.hit();
      if (newHealth <= 0 && !player.dead) {
        setPlayer({ dead: true });
        SFX.explosion(1.8);
        addKill('☠ Your vessel was destroyed', 'red');
        // Tell server we were killed
        socket.emit('game:kill', { victimId: playerId, victimName: playerName });
        if (playerBoatRef.current) playerBoatRef.current.visible = false;
        setTimeout(() => {
          if (playerBoatRef.current) playerBoatRef.current.visible = true;
          setPlayer({ dead: false, health: 100, ammo: 100, boost: 100 });
          addKill('⚓ Vessel repaired — back in action', 'gold');
        }, 5000);
      }
    });

    // Kill broadcast
    socket.on('game:kill', ({ killerName, victimName, victimId }: KillPayload) => {
      if (victimId === playerId) return; // already handled in game:hit
      addKill(`⊕ ${killerName} destroyed ${victimName}`, '');
    });

    return () => {
      socket.off('game:state');
      socket.off('room:player_joined');
      socket.off('room:player_left');
      socket.off('game:hit');
      socket.off('game:kill');
      disconnectSocket();
    };
  }, [isOnline, playerId, playerName, player.dead, player.health,
      setPlayer, setRemotePlayer, removeRemotePlayer, addKill]);

  // ── Online: broadcast local state at ~20 Hz ──────────────
  // We use a requestAnimationFrame loop so it doesn't depend on R3F
  useEffect(() => {
    if (!isOnline) return;
    let rafId: number;
    let lastTime = performance.now();

    const loop = (now: number) => {
      const dt = (now - lastTime) / 1000;
      lastTime = now;
      syncAccum.current += dt;

      if (syncAccum.current >= 0.05 && playerBoatRef.current) {
        syncAccum.current = 0;
        const boat = playerBoatRef.current;
        const socket = connectSocket();
        socket.emit('game:state', {
          x: boat.position.x,
          z: boat.position.z,
          ry: boat.rotation.y,
          health: player.health,
          dead: player.dead,
        });
      }
      rafId = requestAnimationFrame(loop);
    };

    rafId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafId);
  }, [isOnline, player.health, player.dead]);

  // ── Online: detect hits on remote players ────────────────
  // Checked in PlayerController via onShoot callback — we wire it here
  // by passing a shoot callback that the controller can use
  const handlePlayerShoot = useCallback((
    origin: THREE.Vector3,
    dir: THREE.Vector3,
    weaponId: string,
    damage: number,
    projectileSpeed: number,
  ) => {
    if (!isOnline) return;
    const socket = connectSocket();
    socket.emit('game:shoot', {
      x: origin.x, z: origin.z,
      dirX: dir.x, dirZ: dir.z,
      weaponId, damage, projectileSpeed,
    });

    // Local hit detection against remote players
    Object.values(remotePlayers).forEach((rp) => {
      if (rp.dead) return;
      const rpPos = new THREE.Vector3(rp.x, 0.25, rp.z);
      if (origin.distanceTo(rpPos) < 30) { // rough range check
        // We'll let the projectile do the hit detection via the game loop;
        // here we just send the shoot event for the server to relay
      }
    });
  }, [isOnline, remotePlayers]);

  // ── Hit detection for remote players ─────────────────────
  // Run every frame outside R3F via a ref-based check in GameWorld
  // We expose a callback so ProjectileController can call it
  const remoteHitCheck = useCallback((proj: Projectile) => {
    if (!isOnline || !proj.isPlayer) return;
    const socket = connectSocket();
    Object.entries(remotePlayers).forEach(([id, rp]) => {
      if (rp.dead) return;
      const rpPos = new THREE.Vector3(rp.x, 0.25, rp.z);
      if (proj.mesh.position.distanceTo(rpPos) < 3) {
        proj.alive = false;
        socket.emit('game:hit', { toId: id, damage: proj.damage });
        addKill(`⊕ Hit on ${rp.name}`, '');
      }
    });
  }, [isOnline, remotePlayers, addKill]);

  const handleReturnLobby = useCallback(() => { setScreen('lobby'); }, [setScreen]);
  const handleRematch     = useCallback(() => { startMatch(); }, [startMatch]);

  const remotePlayerList = Object.values(remotePlayers);

  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <Canvas
        gl={{ antialias: false, alpha: false }}
        camera={{ fov: 72, near: 0.1, far: 1000, position: [0, 8, 16] }}
        style={{ background: '#1a0400' }}
      >
        <GameWorld
          playerBoatRef={playerBoatRef}
          projectilesRef={projectilesRef}
          aiBoatsRef={aiBoatsRef}
          ripplesRef={ripplesRef}
          keys={keys}
          onPositionUpdate={setPlayerPos}
        />
        <AIRenderer aiBoatsRef={aiBoatsRef} />
        <PlayerController
          boatRef={playerBoatRef}
          projectiles={projectilesRef}
          onPositionUpdate={setPlayerPos}
          keys={keys}
        />

        {/* ── Remote players (PvP) ─────────────────────── */}
        {remotePlayerList.map((rp) => (
          <RemotePlayer
            key={rp.id}
            id={rp.id}
            name={rp.name ?? ''}
            x={rp.x}
            z={rp.z}
            ry={rp.ry}
            health={rp.health}
            dead={rp.dead}
          />
        ))}

        {/* Receive remote shoot events and spawn visual projectiles */}
        <RemoteShootReceiver projectilesRef={projectilesRef} />
      </Canvas>

      <GameHUD
        aiBoats={aiBoatsRef.current}
        playerWorldPos={playerPos}
        onReturnLobby={handleReturnLobby}
      />
      <MobileControls keys={keys} />

      {endState && (
        <EndScreen
          winner={endState.winner}
          winnerColor={endState.color}
          onRematch={handleRematch}
          onLobby={handleReturnLobby}
        />
      )}
    </div>
  );
}
