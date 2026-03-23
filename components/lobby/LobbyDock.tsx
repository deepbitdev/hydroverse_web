'use client';
import React, { useMemo } from 'react';
import * as THREE from 'three';

export default function LobbyDock() {
  // Central hexagonal dock platform where you spawn
  return (
    <group>
      {/* Central circular dock platform */}
      <mesh position={[0, -0.2, 8]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[28, 32]} />
        <meshLambertMaterial color={0x5a3a1a} />
      </mesh>

      {/* Dock planks */}
      {Array.from({ length: 12 }, (_, i) => (
        <mesh key={i} position={[0, -0.1, -15 + i * 4]}>
          <boxGeometry args={[56, 0.15, 0.3]} />
          <meshLambertMaterial color={0x7a5a2a} />
        </mesh>
      ))}

      {/* Edge railing posts */}
      {Array.from({ length: 16 }, (_, i) => {
        const a = (i / 16) * Math.PI * 2;
        const r = 27;
        return (
          <mesh key={i} position={[Math.cos(a) * r, 0.6, 8 + Math.sin(a) * r]}>
            <cylinderGeometry args={[0.12, 0.12, 1.4, 4]} />
            <meshLambertMaterial color={0x8B6914} />
          </mesh>
        );
      })}

      {/* Dock lights along edge */}
      {Array.from({ length: 8 }, (_, i) => {
        const a = (i / 8) * Math.PI * 2;
        const r = 26;
        const color = [0xffee00, 0xff4466, 0x00ffcc, 0xff8800][i % 4];
        return (
          <group key={i}>
            <mesh position={[Math.cos(a) * r, 1.2, 8 + Math.sin(a) * r]}>
              <sphereGeometry args={[0.2, 6, 6]} />
              <meshBasicMaterial color={color} />
            </mesh>
            <pointLight color={color} intensity={1.5} distance={12} position={[Math.cos(a) * r, 1.5, 8 + Math.sin(a) * r]} />
          </group>
        );
      })}

      {/* NPC docking piers - extend toward each NPC */}
      {[
        { dir: [0, -1], len: 20, x: 0, z: -8 },      // FFA — forward
        { dir: [-1, 0], len: 20, x: -20, z: 0 },     // TDM — left
        { dir: [1, 0],  len: 20, x: 20, z: 0 },      // LBS — right
      ].map((p, i) => (
        <mesh key={i} position={[p.x, -0.2, p.z]}>
          <boxGeometry args={[p.dir[0] !== 0 ? p.len : 3, 0.3, p.dir[1] !== 0 ? p.len : 3]} />
          <meshLambertMaterial color={0x6a4a1a} />
        </mesh>
      ))}
    </group>
  );
}
