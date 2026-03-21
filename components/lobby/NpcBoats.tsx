'use client';
import React, { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export interface NpcDef {
  id: string;
  mode: string;
  position: [number, number, number];
  color: number;
  accentColor: number;
  label: string;
  subtitle: string;
  greeting: string[];
  flagColor: number;
}

export const NPC_DEFS: NpcDef[] = [
  {
    id: 'ffa',
    mode: 'FFA',
    position: [0, 0, -18],
    color: 0xff3344,
    accentColor: 0xff8800,
    label: 'FREE FOR ALL',
    subtitle: 'EVERY BOAT FOR ITSELF',
    greeting: [
      'Every captain for themselves!',
      'Last one floating wins.',
      'No teams. Pure chaos.',
      'Think you can outlast everyone?',
    ],
    flagColor: 0xff3344,
  },
  {
    id: 'tdm',
    mode: 'TDM',
    position: [-22, 0, -8],
    color: 0x4488ff,
    accentColor: 0x00e8d8,
    label: 'TEAM DEATHMATCH',
    subtitle: 'RED FLEET vs BLUE FLEET',
    greeting: [
      'Choose your fleet wisely.',
      'Red versus Blue — classic rivalry.',
      'Teamwork wins the day.',
      'Your squad needs you, captain.',
    ],
    flagColor: 0x4488ff,
  },
  {
    id: 'race',
    mode: 'RACE',
    position: [22, 0, -8],
    color: 0x44ee88,
    accentColor: 0xffcc00,
    label: 'RACE MODE',
    subtitle: 'FIRST TO CROSS WINS',
    greeting: [
      'Speed is everything here.',
      'Hit the buoys in order!',
      'No weapons — just pure throttle.',
      'Can you master the course?',
    ],
    flagColor: 0x44ee88,
  },
  {
    id: 'siege',
    mode: 'SIEGE',
    position: [-14, 0, 10],
    color: 0xff9900,
    accentColor: 0xff3344,
    label: 'SIEGE',
    subtitle: 'DEFEND THE PLATFORM',
    greeting: [
      'Protect the floating platform!',
      'Attackers vs Defenders.',
      'Hold your ground or sink trying.',
      'The platform is worth more than your hull.',
    ],
    flagColor: 0xff9900,
  },
];

interface NpcBoatProps {
  npc: NpcDef;
  isNear: boolean;
  dialogueIdx: number;
}

export function NpcBoat({ npc, isNear, dialogueIdx }: NpcBoatProps) {
  const groupRef = useRef<THREE.Group>(null);
  const flagRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (groupRef.current) {
      groupRef.current.position.y = Math.sin(t * 1.2 + npc.position[0]) * 0.15;
      groupRef.current.rotation.z = Math.sin(t * 0.8 + npc.position[2]) * 0.04;
    }
    if (flagRef.current) {
      flagRef.current.rotation.y = Math.sin(t * 3) * 0.3;
    }
  });

  return (
    <group position={npc.position}>
      <group ref={groupRef}>
        {/* Hull */}
        <mesh>
          <boxGeometry args={[2.2, 0.55, 5.5]} />
          <meshLambertMaterial color={npc.color} />
        </mesh>

        {/* Bow */}
        <mesh position={[0, 0, -3.8]} rotation={[Math.PI / 2, Math.PI / 4, 0]}>
          <coneGeometry args={[1.1, 2.2, 4]} />
          <meshLambertMaterial color={npc.color} />
        </mesh>

        {/* Cabin */}
        <mesh position={[0, 0.67, 0.4]}>
          <boxGeometry args={[1.4, 0.8, 1.8]} />
          <meshLambertMaterial color={0x0a0a18} />
        </mesh>

        {/* Engine glow */}
        <mesh position={[0, 0.1, 2.6]}>
          <boxGeometry args={[1.2, 0.35, 0.6]} />
          <meshBasicMaterial color={npc.accentColor} />
        </mesh>

        {/* Stripe */}
        <mesh position={[0, 0.28, 0]}>
          <boxGeometry args={[2.3, 0.1, 5.6]} />
          <meshBasicMaterial color={npc.accentColor} />
        </mesh>

        {/* Flag pole */}
        <mesh position={[0, 1.8, -1]}>
          <cylinderGeometry args={[0.05, 0.05, 2.5, 4]} />
          <meshBasicMaterial color={0xcccccc} />
        </mesh>

        {/* Flag */}
        <mesh ref={flagRef} position={[0.5, 2.9, -1]}>
          <planeGeometry args={[1.2, 0.7]} />
          <meshBasicMaterial color={npc.flagColor} side={THREE.DoubleSide} />
        </mesh>

        {/* NPC glow when nearby */}
        {isNear && (
          <pointLight color={npc.accentColor} intensity={3} distance={12} position={[0, 2, 0]} />
        )}
      </group>
    </group>
  );
}
