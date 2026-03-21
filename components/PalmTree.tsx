'use client';
import React, { useMemo } from 'react';
import * as THREE from 'three';

interface PalmProps {
  position: [number, number, number];
  height?: number;
}

export function PalmTree({ position, height = 8 }: PalmProps) {
  const lightColors = [0xffee00, 0xff3366, 0x33ffcc, 0xff8800, 0xffffff, 0xff44aa, 0x44ffff, 0xffcc00];

  return (
    <group position={position}>
      {/* Trunk */}
      <mesh position={[0, height / 2, 0]}>
        <cylinderGeometry args={[0.2, 0.35, height, 6]} />
        <meshLambertMaterial color={0x8B5E2A} />
      </mesh>

      {/* Fronds */}
      {Array.from({ length: 6 }, (_, i) => {
        const angle = (i / 6) * Math.PI * 2;
        return (
          <mesh
            key={i}
            position={[Math.sin(angle) * 1.2, height + 0.5, Math.cos(angle) * 1.2]}
            rotation={[0, angle, 0.7]}
          >
            <planeGeometry args={[0.6, 3.5]} />
            <meshBasicMaterial color={0x2d8a2d} side={THREE.DoubleSide} />
          </mesh>
        );
      })}

      {/* Fairy lights */}
      {lightColors.map((color, i) => {
        const a = (i / 8) * Math.PI * 2;
        return (
          <mesh key={i} position={[Math.cos(a) * 1.8, height - 0.5 + Math.sin(i) * 0.5, Math.sin(a) * 1.8]}>
            <sphereGeometry args={[0.12, 4, 4]} />
            <meshBasicMaterial color={color} />
          </mesh>
        );
      })}
    </group>
  );
}

export function PalmRing({ count = 24, radius = 160 }: { count?: number; radius?: number }) {
  const palms = useMemo(() => Array.from({ length: count }, (_, i) => {
    const angle = (i / count) * Math.PI * 2;
    const r = radius + (Math.random() * 30 - 15);
    return {
      position: [Math.cos(angle) * r, 0, Math.sin(angle) * r] as [number, number, number],
      height: 6 + Math.random() * 5,
    };
  }), [count, radius]);

  return (
    <>
      {palms.map((p, i) => <PalmTree key={i} position={p.position} height={p.height} />)}
    </>
  );
}
