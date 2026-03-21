'use client';
import React, { useRef, useEffect, useCallback } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { NPC_DEFS } from './NpcBoats';

const WALK_SPEED = 25;
const TURN_SPEED = 2.5;
const INTERACT_RADIUS = 8;

export interface PlayerAvatarHandle {
  position: THREE.Vector3;
  nearestNpc: string | null;
}

interface PlayerAvatarProps {
  onNearNpc: (id: string | null) => void;
  keys: React.MutableRefObject<Record<string, boolean>>;
}

export default function PlayerAvatar({ onNearNpc, keys }: PlayerAvatarProps) {
  const groupRef = useRef<THREE.Group>(null);
  const cameraYaw = useRef(0);
  const nearRef = useRef<string | null>(null);
  const { camera } = useThree();

  useFrame(({ clock }, dt) => {
    if (!groupRef.current) return;
    const k = keys.current;
    const pos = groupRef.current.position;
    const rot = groupRef.current.rotation;

    // Turn left/right
    if (k['KeyA'] || k['ArrowLeft'])  rot.y += TURN_SPEED * dt;
    if (k['KeyD'] || k['ArrowRight']) rot.y -= TURN_SPEED * dt;

    // Move forward/back
    const dir = new THREE.Vector3(0, 0, -1).applyEuler(new THREE.Euler(0, rot.y, 0));
    if (k['KeyW'] || k['ArrowUp'])   pos.addScaledVector(dir, WALK_SPEED * dt);
    if (k['KeyS'] || k['ArrowDown']) pos.addScaledVector(dir, -WALK_SPEED * dt);

    // Clamp to arena
    pos.x = THREE.MathUtils.clamp(pos.x, -100, 100);
    pos.z = THREE.MathUtils.clamp(pos.z, -100, 30);
    pos.y = 0;

    // Bob while moving
    const moving = k['KeyW'] || k['KeyS'] || k['ArrowUp'] || k['ArrowDown'];
    if (moving) pos.y = Math.sin(clock.getElapsedTime() * 10) * 0.08;

    // Camera follow — 3rd person behind boat
    const camOffset = new THREE.Vector3(0, 10, 18).applyEuler(new THREE.Euler(0, rot.y, 0));
    camera.position.lerp(pos.clone().add(camOffset), 0.08);
    camera.lookAt(pos.clone().add(new THREE.Vector3(0, 1, 0)));

    // Check NPC proximity
    let nearest: string | null = null;
    let nearestDist = Infinity;
    NPC_DEFS.forEach((npc) => {
      const d = pos.distanceTo(new THREE.Vector3(...npc.position));
      if (d < INTERACT_RADIUS && d < nearestDist) {
        nearestDist = d;
        nearest = npc.id;
      }
    });
    if (nearest !== nearRef.current) {
      nearRef.current = nearest;
      onNearNpc(nearest);
    }
  });

  return (
    <group ref={groupRef} position={[0, 0, 20]}>
      {/* Player boat hull — distinct cyan color */}
      <mesh>
        <boxGeometry args={[2.0, 0.5, 4.8]} />
        <meshLambertMaterial color={0x0066cc} />
      </mesh>
      <mesh position={[0, 0, -3.3]} rotation={[Math.PI / 2, Math.PI / 4, 0]}>
        <coneGeometry args={[1.0, 2.0, 4]} />
        <meshLambertMaterial color={0x0066cc} />
      </mesh>
      <mesh position={[0, 0.6, 0.3]}>
        <boxGeometry args={[1.2, 0.7, 1.6]} />
        <meshLambertMaterial color={0x0a0a20} />
      </mesh>
      <mesh position={[0, 0.1, 2.3]}>
        <boxGeometry args={[1.0, 0.3, 0.5]} />
        <meshBasicMaterial color={0x00e8d8} />
      </mesh>
      <mesh position={[0, 0.26, 0]}>
        <boxGeometry args={[2.1, 0.08, 4.9]} />
        <meshBasicMaterial color={0x00e8d8} />
      </mesh>

      {/* Player indicator light */}
      <pointLight color={0x00e8d8} intensity={2} distance={8} position={[0, 1.5, 0]} />
    </group>
  );
}
