'use client';
import React from 'react';
import { useGameStore } from '@/store/gameStore';
import { ScoreManager, PlayerScore } from '@/lib/scoreManager';

interface EndScreenProps {
  winner: string;
  winnerColor: string;
  onRematch: () => void;
  onLobby: () => void;
}

function TeamTable({ players, teamColor, teamLabel }: { players: PlayerScore[]; teamColor: string; teamLabel: string }) {
  const sorted = [...players].sort((a, b) => b.score - a.score);
  return (
    <div style={{
      background: 'rgba(0,8,20,0.95)',
      border: `1px solid ${teamColor}44`,
      padding: 20, flex: 1,
      boxShadow: `0 0 20px ${teamColor}22`,
    }}>
      <div style={{
        fontFamily: "'Rajdhani',sans-serif", fontSize: 13, fontWeight: 700,
        letterSpacing: 5, color: teamColor, marginBottom: 14, textAlign: 'center',
        borderBottom: `1px solid ${teamColor}33`, paddingBottom: 10,
      }}>
        {teamLabel}
        <span style={{ marginLeft: 10, fontSize: 18 }}>{ScoreManager.teamScores[teamLabel.toLowerCase() as 'red' | 'blue']}</span>
        <span style={{ fontSize: 9, letterSpacing: 3, color: 'rgba(255,255,255,0.3)', marginLeft: 4 }}>PTS</span>
      </div>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: "'Share Tech Mono'" }}>
        <thead>
          <tr>
            {['PILOT', 'K', 'D', 'SC'].map((h) => (
              <th key={h} style={{ fontSize: 9, letterSpacing: 2, color: `${teamColor}88`, padding: '4px 8px', borderBottom: `1px solid ${teamColor}22`, textAlign: 'left' }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sorted.map((p, i) => (
            <tr key={p.id} style={{ background: i === 0 ? `${teamColor}10` : 'transparent' }}>
              <td style={{ fontSize: 11, padding: '6px 8px', borderBottom: '1px solid rgba(255,255,255,0.04)', color: p.id === 'player' ? 'var(--cyan)' : 'rgba(255,255,255,0.75)' }}>
                {i === 0 ? '★ ' : ''}{p.name}{p.id === 'player' ? ' ◀' : ''}
              </td>
              <td style={{ fontSize: 11, padding: '6px 8px', borderBottom: '1px solid rgba(255,255,255,0.04)', color: '#44ee88' }}>{p.kills}</td>
              <td style={{ fontSize: 11, padding: '6px 8px', borderBottom: '1px solid rgba(255,255,255,0.04)', color: '#ff4466' }}>{p.deaths}</td>
              <td style={{ padding: '6px 8px', borderBottom: '1px solid rgba(255,255,255,0.04)', color: '#ffcc00', fontFamily: "'Rajdhani'", fontSize: 15, fontWeight: 700 }}>{p.score}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function EndScreen({ winner, winnerColor, onRematch, onLobby }: EndScreenProps) {
  const { settings } = useGameStore();
  const sorted = ScoreManager.getSorted();
  const isTDM = settings.mode === 'TDM';

  const redPlayers  = sorted.filter((p) => p.team === 'red');
  const bluePlayers = sorted.filter((p) => p.team === 'blue');

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 300,
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(0,5,15,0.97)', backdropFilter: 'blur(12px)',
    }}>
      <div style={{ fontSize: 11, letterSpacing: 6, color: 'rgba(255,255,255,0.3)', marginBottom: 8 }}>
        {isTDM ? 'TEAM DEATHMATCH' : settings.mode === 'LBS' ? 'LAST BOAT STANDING' : 'MATCH COMPLETE'}
      </div>
      <div style={{
        fontFamily: "'Rajdhani',sans-serif", fontSize: 60, fontWeight: 700,
        letterSpacing: 10, color: winnerColor,
        textShadow: `0 0 40px ${winnerColor}88`,
        marginBottom: 4,
      }}>
        {winner}
      </div>
      <div style={{ fontSize: 9, letterSpacing: 5, color: 'rgba(255,255,255,0.2)', marginBottom: 32 }}>
        FINAL STANDINGS
      </div>

      {isTDM ? (
        /* ── TDM: two side-by-side team tables ── */
        <div style={{ display: 'flex', gap: 16, marginBottom: 36, minWidth: 680, maxWidth: 860 }}>
          <TeamTable players={redPlayers}  teamColor="#ff3344" teamLabel="RED"  />
          <TeamTable players={bluePlayers} teamColor="#4488ff" teamLabel="BLUE" />
        </div>
      ) : (
        /* ── FFA: single sorted table ── */
        <div style={{
          background: 'rgba(0,8,20,0.95)', border: '1px solid rgba(0,200,255,0.2)',
          padding: 24, minWidth: 420, marginBottom: 36,
        }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: "'Share Tech Mono'" }}>
            <thead>
              <tr>
                {['CAPTAIN', 'KILLS', 'DEATHS', 'SCORE'].map((h) => (
                  <th key={h} style={{ fontSize: 9, letterSpacing: 3, color: 'rgba(0,200,255,0.4)', padding: '5px 10px', borderBottom: '1px solid rgba(0,200,255,0.15)', textAlign: 'left' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sorted.map((p, i) => (
                <tr key={p.id} style={{ background: i === 0 ? 'rgba(0,200,255,0.05)' : 'transparent' }}>
                  <td style={{ fontSize: 11, padding: '7px 10px', borderBottom: '1px solid rgba(255,255,255,0.05)', color: p.id === 'player' ? 'var(--cyan)' : 'rgba(255,255,255,0.75)' }}>
                    {i === 0 ? '👑 ' : ''}{p.name}
                  </td>
                  <td style={{ fontSize: 11, padding: '7px 10px', borderBottom: '1px solid rgba(255,255,255,0.05)', color: '#44ee88' }}>{p.kills}</td>
                  <td style={{ fontSize: 11, padding: '7px 10px', borderBottom: '1px solid rgba(255,255,255,0.05)', color: '#ff4466' }}>{p.deaths}</td>
                  <td style={{ padding: '7px 10px', borderBottom: '1px solid rgba(255,255,255,0.05)', color: '#ffcc00', fontFamily: "'Rajdhani'", fontSize: 16, fontWeight: 700 }}>{p.score}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div style={{ display: 'flex', gap: 16 }}>
        <button onClick={onLobby} style={{
          fontFamily: "'Rajdhani',sans-serif", fontSize: 12, fontWeight: 700, letterSpacing: 5,
          padding: '12px 36px', background: 'transparent',
          border: '1px solid rgba(255,255,255,0.2)', color: 'rgba(255,255,255,0.4)',
          cursor: 'pointer',
        }}>← LOBBY</button>
        <button onClick={onRematch} style={{
          fontFamily: "'Rajdhani',sans-serif", fontSize: 13, fontWeight: 700, letterSpacing: 6,
          padding: '13px 44px', background: 'transparent',
          border: `1px solid ${winnerColor}66`, color: winnerColor,
          cursor: 'pointer', clipPath: 'polygon(14px 0,100% 0,calc(100% - 14px) 100%,0 100%)',
        }}>⊕ REMATCH</button>
      </div>
    </div>
  );
}
