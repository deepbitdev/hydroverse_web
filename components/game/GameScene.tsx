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
import { createAIBoat, updateAI, AIBoat } from '@/lib/aiBoat';
import { Projectile, updateProjectiles, spawnExplosion } from '@/lib/projectiles';
import { ScoreManager } from '@/lib/scoreManager';
import { SFX } from '@/lib/sfx';

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

  // Tick: AI + projectile collision + ripples
  useFrame((_, dt) => {
    if (!matchRunning) return;
    const playerPos = playerBoatRef.current?.position ?? new THREE.Vector3();

    // Update AI
    aiBoatsRef.current.forEach((boat) => {
      updateAI(boat, playerPos, dt, settings.difficulty);
    });

    // Update projectiles and check collisions
    updateProjectiles(projectilesRef.current, scene, dt);
    const toRemove: number[] = [];

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
            // Schedule respawn
            setTimeout(() => {
              if (playerBoatRef.current) playerBoatRef.current.visible = true;
            }, 5000);
          }
        }
      }
    });

    // AI shoots at player (simple periodic)
    aiBoatsRef.current.forEach((boat, i) => {
      if (!boat.alive) return;
      const dist = boat.mesh.position.distanceTo(playerPos);
      if (dist < 45 && Math.random() < 0.004) {
        const dir = playerPos.clone().sub(boat.mesh.position).normalize();
        dir.y = 0;
        const muzzle = boat.mesh.position.clone().add(new THREE.Vector3(0, 0.5, 0));
        const { createProjectile } = require('@/lib/projectiles');
        const proj = createProjectile(scene, muzzle, dir, false, { damage: 18, projectileSpeed: 25 });
        projectilesRef.current.push(proj);
      }
    });

    // Ripples — age existing + add from moving boats
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

    // Timer
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

      {/* AI boats — rendered imperatively via useEffect in parent */}
    </>
  );
}

// ── AI Renderer — mounts AI meshes into scene ───────────────
function AIRenderer({ aiBoatsRef }: { aiBoatsRef: React.MutableRefObject<AIBoat[]> }) {
  const { scene } = useThree();
  useEffect(() => {
    aiBoatsRef.current.forEach((b) => scene.add(b.mesh));
    return () => { aiBoatsRef.current.forEach((b) => scene.remove(b.mesh)); };
  }, [scene, aiBoatsRef]);
  return null;
}

// ── Top-level game scene ─────────────────────────────────────
export default function GameScene() {
  const { settings, setScreen, startMatch, matchRunning, matchEnded } = useGameStore();
  const playerBoatRef = useRef<THREE.Group>(null);
  const projectilesRef = useRef<Projectile[]>([]);
  const aiBoatsRef = useRef<AIBoat[]>([]);
  const ripplesRef = useRef<{ x: number; z: number; age: number }[]>([]);
  const keys = useRef<Record<string, boolean>>({});
  const [playerPos, setPlayerPos] = useState<{ x: number; z: number } | null>(null);
  const [endState, setEndState] = useState<{ winner: string; color: string } | null>(null);

  // Init AI boats on mount
  useEffect(() => {
    const botCount = settings.bots;
    const boats: AIBoat[] = [];
    const teamColors = [
      [0xcc1133, 0xff6688],
      [0x113399, 0x4488ff],
      [0x228833, 0x44ee88],
      [0x994411, 0xffaa44],
      [0x6611aa, 0xcc44ff],
      [0x119988, 0x44ffee],
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

  // Key listeners
  useEffect(() => {
    const onDown = (e: KeyboardEvent) => { keys.current[e.code] = true; e.preventDefault(); };
    const onUp   = (e: KeyboardEvent) => { keys.current[e.code] = false; };
    window.addEventListener('keydown', onDown);
    window.addEventListener('keyup', onUp);
    return () => { window.removeEventListener('keydown', onDown); window.removeEventListener('keyup', onUp); };
  }, []);

  const handleReturnLobby = useCallback(() => { setScreen('lobby'); }, [setScreen]);
  const handleRematch = useCallback(() => { startMatch(); }, [startMatch]);

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
