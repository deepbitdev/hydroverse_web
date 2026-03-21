'use client';
import React, { Suspense } from 'react';
import { useGameStore } from '@/store/gameStore';
import LobbyScene from './lobby/LobbyScene';
import GameScene from './game/GameScene';

export default function HydroApp() {
  const screen = useGameStore((s) => s.screen);

  return (
    <div style={{ width: '100vw', height: '100vh', overflow: 'hidden', background: '#1a0800' }}>
      <div className="scanlines" />
      <Suspense fallback={<LoadingScreen />}>
        {screen === 'lobby' ? <LobbyScene /> : <GameScene />}
      </Suspense>
    </div>
  );
}

function LoadingScreen() {
  return (
    <div style={{
      position: 'fixed', inset: 0, display: 'flex',
      flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      background: 'radial-gradient(ellipse 80% 60% at 50% 40%, #cc4400, #1a0800)',
    }}>
      <div className="logo-text" style={{ fontSize: 'clamp(48px,8vw,100px)', letterSpacing: 14 }}>
        HYDROVERSE
      </div>
      <div style={{ color: 'rgba(0,200,255,0.5)', fontSize: 10, letterSpacing: 6, marginTop: 16 }}>
        LOADING SYSTEMS...
      </div>
    </div>
  );
}
