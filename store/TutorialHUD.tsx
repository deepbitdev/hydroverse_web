'use client';
import React from 'react';
import { useGameStore } from '@/store/gameStore';

export default function TutorialHUD() {
  const completeTutorial = useGameStore((s) => s.completeTutorial);

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      pointerEvents: 'none', textAlign: 'center', background: 'rgba(0,5,10,0.4)'
    }}>
      <div style={{
        background: 'rgba(0,10,20,0.85)', backdropFilter: 'blur(10px)',
        padding: '40px 60px', border: '1px solid var(--cyan)',
        clipPath: 'polygon(20px 0, 100% 0, calc(100% - 20px) 100%, 0 100%)',
        pointerEvents: 'all'
      }}>
        <div style={{ fontFamily: "'Rajdhani'", fontSize: 42, fontWeight: 700, color: 'var(--cyan)', letterSpacing: 10, marginBottom: 8 }}>
          WELCOME PILOT
        </div>
        <div style={{ fontSize: 11, letterSpacing: 4, color: 'rgba(255,255,255,0.4)', marginBottom: 40 }}>
          INITIALIZING VESSEL CONTROL SYSTEMS
        </div>

        <div style={{ display: 'flex', gap: 40, marginBottom: 50, justifyContent: 'center' }}>
          <ControlHint keys={['W','A','S','D']} label="MOVEMENT" />
          <ControlHint keys={['SHIFT']} label="BOOST" />
          <ControlHint keys={['SPACE']} label="FIRE" />
        </div>

        <button 
          onClick={completeTutorial}
          style={{
            padding: '14px 40px', background: 'var(--cyan)', color: 'black',
            border: 'none', fontWeight: 700, fontFamily: "'Rajdhani'", fontSize: 16,
            letterSpacing: 4, cursor: 'pointer', clipPath: 'polygon(10px 0, 100% 0, calc(100% - 10px) 100%, 0 100%)'
          }}
        >
          ENTER THE HYDROVERSE
        </button>
      </div>
    </div>
  );
}

function ControlHint({ keys, label }: { keys: string[], label: string }) {
  return (
    <div>
      <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginBottom: 10 }}>
        {keys.map(k => (
          <div key={k} style={{ padding: '6px 12px', border: '1px solid var(--cyan)', color: 'var(--cyan)', fontFamily: "'Share Tech Mono'", fontSize: 14 }}>
            {k}
          </div>
        ))}
      </div>
      <div style={{ fontSize: 9, letterSpacing: 3, color: 'rgba(255,255,255,0.3)' }}>{label}</div>
    </div>
  );
}