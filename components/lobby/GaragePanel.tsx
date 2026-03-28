'use client';
import React from 'react';
import { useGameStore } from '@/store/gameStore';
import { connectSocket } from '@/lib/socket';

const NEON_COLORS = [
  { name: 'NONE', value: null },
  { name: 'CYAN', value: 0x00e8d8 },
  { name: 'LAVA', value: 0xff4400 },
  { name: 'LIME', value: 0x44ee88 },
  { name: 'PURPLE', value: 0xcc44ff },
];

const HULL_COLORS = [
  { name: 'OCEAN', value: 0x0066cc },
  { name: 'STEALTH', value: 0x222222 },
  { name: 'CRIMSON', value: 0xcc1133 },
  { name: 'GOLD', value: 0xffcc00 },
  { name: 'FOREST', value: 0x228833 },
];

export default function GaragePanel({ onClose }: { onClose: () => void }) {
  const { playerCustomization, setPlayerCustomization, isOnline } = useGameStore();

  const update = (patch: any) => {
    const next = { ...(playerCustomization || {}), ...patch };
    setPlayerCustomization?.(next);
    
    if (isOnline) {
      const socket = connectSocket();
      socket?.emit('room:update_customization', next);
    }
  };

  const boxStyle: React.CSSProperties = {
    position: 'fixed', inset: 0, zIndex: 400,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)',
  };

  return (
    <div style={boxStyle}>
      <div style={{
        background: 'rgba(0,8,20,0.95)', border: '2px solid #ffcc00',
        padding: '40px', minWidth: 450, boxShadow: '0 0 50px rgba(255,204,0,0.2)'
      }}>
        <div style={{ fontFamily: "'Rajdhani'", fontSize: 32, fontWeight: 700, color: '#ffcc00', letterSpacing: 6, marginBottom: 4 }}>
          HYDRO-GARAGE
        </div>
        <div style={{ fontSize: 10, letterSpacing: 4, color: 'rgba(255,255,255,0.3)', marginBottom: 30 }}>
          VESSEL CUSTOMIZATION & TUNING
        </div>

        {/* Hull Color Section */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 10, color: '#ffcc00', letterSpacing: 3, marginBottom: 12 }}>HULL COLOR</div>
          <div style={{ display: 'flex', gap: 8 }}>
            {HULL_COLORS.map(c => (
              <button 
                key={c.name}
                onClick={() => update({ primaryColor: c.value })}
                style={{
                  flex: 1, padding: '8px', fontSize: 10, cursor: 'pointer',
                  background: playerCustomization?.primaryColor === c.value ? '#ffcc0022' : 'transparent',
                  border: `1px solid ${playerCustomization?.primaryColor === c.value ? '#ffcc00' : 'rgba(255,255,255,0.1)'}`,
                  color: playerCustomization?.primaryColor === c.value ? '#ffcc00' : 'white'
                }}
              >
                {c.name}
              </button>
            ))}
          </div>
        </div>

        {/* Neon Section */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 10, color: '#ffcc00', letterSpacing: 3, marginBottom: 12 }}>NEON UNDERGLOW</div>
          <div style={{ display: 'flex', gap: 8 }}>
            {NEON_COLORS.map(c => (
              <button 
                key={c.name}
                onClick={() => update({ neonColor: c.value, glowIntensity: c.value ? 2 : 0 })}
                style={{
                  flex: 1, padding: '8px', fontSize: 10, cursor: 'pointer',
                  background: playerCustomization?.neonColor === c.value ? '#ffcc0022' : 'transparent',
                  border: `1px solid ${playerCustomization?.neonColor === c.value ? '#ffcc00' : 'rgba(255,255,255,0.1)'}`,
                  color: playerCustomization?.neonColor === c.value ? '#ffcc00' : 'white'
                }}
              >
                {c.name}
              </button>
            ))}
          </div>
        </div>

        {/* Performance Parts */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ fontSize: 10, color: '#ffcc00', letterSpacing: 3, marginBottom: 12 }}>PERFORMANCE UPGRADES</div>
          <UpgradeRow 
            label="ENGINE (SPEED)" 
            level={playerCustomization?.partUpgrades?.engine ?? 0} 
            onUpdate={(l) => update({ partUpgrades: { ...(playerCustomization?.partUpgrades || {}), engine: l }})} 
          />
          <UpgradeRow 
            label="RUDDER (HANDLING)" 
            level={playerCustomization?.partUpgrades?.rudder ?? 0} 
            onUpdate={(l) => update({ partUpgrades: { ...(playerCustomization?.partUpgrades || {}), rudder: l }})} 
          />
        </div>

        <button onClick={onClose} style={{
          width: '100%', padding: '12px', background: '#ffcc00', color: 'black',
          fontWeight: 700, border: 'none', cursor: 'pointer', letterSpacing: 4,
          clipPath: 'polygon(10px 0, 100% 0, calc(100% - 10px) 100%, 0 100%)'
        }}>
          EXIT GARAGE
        </button>
      </div>
    </div>
  );
}

function UpgradeRow({ label, level, onUpdate }: { label: string, level: number, onUpdate: (l: number) => void }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
      <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>{label}</span>
      <div style={{ display: 'flex', gap: 4 }}>
        {[0, 1, 2, 3].map(i => (
          <div key={i} onClick={() => onUpdate(i)} style={{
            width: 24, height: 8, cursor: 'pointer',
            background: i <= level ? '#ffcc00' : 'rgba(255,255,255,0.1)'
          }} />
        ))}
      </div>
    </div>
  );
}