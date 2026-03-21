'use client';
import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { remotePlayerColor } from '@/lib/multiplayer';

interface RemotePlayerProps {
  id: string;
  x: number;
  z: number;
  ry: number;
  health: number;
  dead: boolean;
  name: string;
}

export default function RemotePlayer({ id, x, z, ry, dead, name }: RemotePlayerProps) {
  const groupRef = useRef<THREE.Group>(null);

  // Track interpolation targets via ref to avoid stale closures
  const target = useRef({ x, z, ry });
  target.current = { x, z, ry };

  const [primary, accent] = remotePlayerColor(id);

  useFrame((_, dt) => {
    const g = groupRef.current;
    if (!g) return;

    const alpha = Math.min(1, dt * 12);
    g.position.x = THREE.MathUtils.lerp(g.position.x, target.current.x, alpha);
    g.position.z = THREE.MathUtils.lerp(g.position.z, target.current.z, alpha);
    g.position.y = 0.25 + Math.sin(Date.now() * 0.001) * 0.05;

    // Shortest-path rotation lerp
    let diff = target.current.ry - g.rotation.y;
    while (diff > Math.PI)  diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;
    g.rotation.y += diff * alpha;

    g.visible = !dead;
  });

  return (
    <group ref={groupRef} position={[x, 0.25, z]}>
      {/* Hull */}
      <mesh>
        <boxGeometry args={[2.2, 0.55, 5.2]} />
        <meshLambertMaterial color={primary} />
      </mesh>
      {/* Bow */}
      <mesh position={[0, 0, -3.6]} rotation={[Math.PI / 2, Math.PI / 4, 0]}>
        <coneGeometry args={[1.1, 2.2, 4]} />
        <meshLambertMaterial color={primary} />
      </mesh>
      {/* Cabin */}
      <mesh position={[0, 0.6, 0.3]}>
        <boxGeometry args={[1.3, 0.75, 1.8]} />
        <meshLambertMaterial color={0x0a0a20} />
      </mesh>
      {/* Accent stripe */}
      <mesh position={[0, 0.29, 0]}>
        <boxGeometry args={[2.3, 0.08, 5.3]} />
        <meshBasicMaterial color={accent} />
      </mesh>
      {/* Name tag — simple point light as marker */}
      <pointLight color={accent} intensity={1.5} distance={6} position={[0, 2, 0]} />
    </group>
  );
}
