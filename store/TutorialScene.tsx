'use client';
import React, { useRef, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import SkyDome from '@/components/SkyDome';
import AnimeWater from '@/components/AnimeWater';
import { SceneLights } from '@/components/WorldDecorations';
import PlayerAvatar from '@/components/lobby/PlayerAvatar';
import TutorialHUD from './TutorialHUD';
import { adaptiveDpr } from '@/lib/deviceUtils';

export default function TutorialScene() {
  const keys = useRef<Record<string, boolean>>({});

  useEffect(() => {
    const onDown = (e: KeyboardEvent) => { keys.current[e.code] = true; };
    const onUp = (e: KeyboardEvent) => { keys.current[e.code] = false; };
    window.addEventListener('keydown', onDown);
    window.addEventListener('keyup', onUp);
    return () => { window.removeEventListener('keydown', onDown); window.removeEventListener('keyup', onUp); };
  }, []);

  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <Canvas
        gl={{ antialias: true, alpha: false }}
        camera={{ fov: 65, near: 0.1, far: 1000, position: [0, 12, 35] }}
        style={{ background: '#000510' }}
        dpr={adaptiveDpr()}
      >
        <SceneLights />
        <SkyDome />
        <AnimeWater size={500} />
        
        {/* Minimal world for tutorial */}
        <PlayerAvatar onNearNpc={() => {}} keys={keys} />
      </Canvas>

      <TutorialHUD />
    </div>
  );
}