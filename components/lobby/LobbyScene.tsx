'use client';
import React, { useRef, useState, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { PerspectiveCamera } from '@react-three/drei';
import AnimeWater from '@/components/AnimeWater';
import SkyDome from '@/components/SkyDome';
import { PalmRing } from '@/components/PalmTree';
import { FestivalStage, Buoys, FireworkParticles, CrowdDots, SceneLights } from '@/components/WorldDecorations';
import { NPC_DEFS, NpcBoat } from './NpcBoats';
import PlayerAvatar from './PlayerAvatar';
import LobbyDock from './LobbyDock';
import LobbyHUD from './LobbyHUD';

export default function LobbyScene() {
  const [nearNpcId, setNearNpcId] = useState<string | null>(null);
  const keys = useRef<Record<string, boolean>>({});

  useEffect(() => {
    const onDown = (e: KeyboardEvent) => {
      keys.current[e.code] = true;
      if (e.code === 'KeyE' && nearNpcId) {
        // Trigger dialogue advance via a custom event
        window.dispatchEvent(new CustomEvent('lobby-interact'));
      }
    };
    const onUp = (e: KeyboardEvent) => { keys.current[e.code] = false; };
    window.addEventListener('keydown', onDown);
    window.addEventListener('keyup', onUp);
    return () => { window.removeEventListener('keydown', onDown); window.removeEventListener('keyup', onUp); };
  }, [nearNpcId]);

  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <Canvas
        gl={{ antialias: true, alpha: false }}
        camera={{ fov: 65, near: 0.1, far: 1000, position: [0, 12, 35] }}
        style={{ background: '#1a0400' }}
      >
        <SceneLights />
        <SkyDome />
        <AnimeWater size={900} />
        <LobbyDock />
        <PalmRing count={20} radius={155} />
        <FestivalStage />
        <Buoys />
        <FireworkParticles />
        <CrowdDots />

        {/* NPC boats — one per game mode */}
        {NPC_DEFS.map((npc) => (
          <NpcBoat
            key={npc.id}
            npc={npc}
            isNear={nearNpcId === npc.id}
            dialogueIdx={0}
          />
        ))}

        {/* Controllable player avatar */}
        <PlayerAvatar onNearNpc={setNearNpcId} keys={keys} />
      </Canvas>

      {/* 2D HUD overlay */}
      <LobbyHUD nearNpcId={nearNpcId} />
    </div>
  );
}
