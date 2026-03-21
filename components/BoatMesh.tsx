'use client';
import React, { forwardRef } from 'react';
import * as THREE from 'three';

interface BoatProps {
  primary?: number;
  accent?: number;
  isPlayer?: boolean;
}

const BoatMesh = forwardRef<THREE.Group, BoatProps>(
  ({ primary = 0x1a4a8a, accent = 0x00e8d8, isPlayer = false }, ref) => {
    return (
      <group ref={ref}>
        {/* Hull */}
        <mesh userData={{ isPlayerHull: isPlayer }}>
          <boxGeometry args={[2.2, 0.55, 5.5]} />
          <meshLambertMaterial color={primary} />
        </mesh>

        {/* Bow cone */}
        <mesh position={[0, 0, -3.8]} rotation={[Math.PI / 2, Math.PI / 4, 0]}>
          <coneGeometry args={[1.1, 2.2, 4]} />
          <meshLambertMaterial color={primary} />
        </mesh>

        {/* Cabin */}
        <mesh position={[0, 0.67, 0.4]}>
          <boxGeometry args={[1.4, 0.8, 1.8]} />
          <meshLambertMaterial color={0x0a0a14} />
        </mesh>

        {/* Engine glow */}
        <mesh position={[0, 0.1, 2.6]}>
          <boxGeometry args={[1.2, 0.35, 0.6]} />
          <meshBasicMaterial color={accent} />
        </mesh>

        {/* Stripe */}
        <mesh position={[0, 0.28, 0]}>
          <boxGeometry args={[2.3, 0.1, 5.6]} />
          <meshBasicMaterial color={accent} />
        </mesh>

        {/* Wake */}
        <mesh position={[0, 0.05, 3.5]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[1.8, 4]} />
          <meshBasicMaterial color={0x224466} transparent opacity={0.15} side={THREE.DoubleSide} />
        </mesh>
      </group>
    );
  }
);

BoatMesh.displayName = 'BoatMesh';
export default BoatMesh;
