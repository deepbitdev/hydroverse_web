'use client';
import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export function FestivalStage() {
  const screenRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    if (screenRef.current) {
      const t = clock.getElapsedTime();
      const mat = screenRef.current.material as THREE.MeshBasicMaterial;
      mat.color.setHSL((t * 0.1) % 1, 1, 0.5);
    }
  });

  return (
    <group position={[0, 0, -130]}>
      {/* Stage platform */}
      <mesh position={[0, 0.75, 0]}>
        <boxGeometry args={[30, 1.5, 12]} />
        <meshLambertMaterial color={0x3a2010} />
      </mesh>
      {/* Back wall */}
      <mesh position={[0, 7, -5.5]}>
        <boxGeometry args={[30, 12, 1]} />
        <meshLambertMaterial color={0x1a0808} />
      </mesh>
      {/* LED screen */}
      <mesh ref={screenRef} position={[0, 8, -5]}>
        <boxGeometry args={[24, 8, 0.2]} />
        <meshBasicMaterial color={0xff6600} />
      </mesh>
      {/* Truss towers */}
      {[-13, 13].map((x) => (
        <group key={x}>
          <mesh position={[x, 8, -4]}>
            <boxGeometry args={[1, 14, 1]} />
            <meshLambertMaterial color={0x888888} />
          </mesh>
          {[0xff6600, 0xff3366, 0x33ccff].map((c, j) => (
            <group key={j}>
              <mesh position={[x, 10 + j * 1.5, -4]}>
                <sphereGeometry args={[0.3, 4, 4]} />
                <meshBasicMaterial color={c} />
              </mesh>
              <pointLight color={c} intensity={4} distance={40} position={[x, 10 + j * 1.5, -4]} />
            </group>
          ))}
        </group>
      ))}
      {/* Speaker stacks */}
      {[-12, 12].map((x) => (
        <mesh key={x} position={[x, 3, -5]}>
          <boxGeometry args={[2.5, 5, 2.5]} />
          <meshLambertMaterial color={0x111111} />
        </mesh>
      ))}
    </group>
  );
}

export function Buoys() {
  const buoyRef = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (buoyRef.current) {
      buoyRef.current.children.forEach((child, i) => {
        child.position.y = 0.8 + Math.sin(clock.getElapsedTime() * 1.5 + i) * 0.2;
      });
    }
  });

  const buoyData = useMemo(() =>
    Array.from({ length: 6 }, (_, i) => {
      const a = (i / 6) * Math.PI * 2;
      return { pos: [Math.cos(a) * 80, 0.8, Math.sin(a) * 80] as [number, number, number], color: i % 2 ? 0xff3300 : 0xffee00 };
    }), []);

  return (
    <group ref={buoyRef}>
      {buoyData.map((b, i) => (
        <group key={i}>
          <mesh position={b.pos}>
            <sphereGeometry args={[0.8, 6, 6]} />
            <meshBasicMaterial color={b.color} />
          </mesh>
          <pointLight color={b.color} intensity={2} distance={18} position={b.pos} />
        </group>
      ))}
    </group>
  );
}


export function CrowdDots() {
  const positions = useMemo(() => {
    const arr = new Float32Array(600 * 3);
    for (let i = 0; i < 600; i++) {
      const a = Math.random() * Math.PI * 2, r = 120 + Math.random() * 60;
      arr[i * 3]     = Math.cos(a) * r;
      arr[i * 3 + 1] = 0.5 + Math.random() * 0.8;
      arr[i * 3 + 2] = Math.sin(a) * r;
    }
    return arr;
  }, []);

  return (
    <points>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial color={0xffcc88} size={1.2} sizeAttenuation />
    </points>
  );
}

export function SceneLights() {
  return (
    <>
      <ambientLight color={0xffe0a0} intensity={2.8} />
      <directionalLight color={0xffaa33} intensity={2.2} position={[80, 40, -120]} />
      <directionalLight color={0xff6688} intensity={1.0} position={[-80, 20, 80]} />
      <pointLight color={0xffdd00} intensity={3} distance={120} position={[0, 8, -80]} />
      <pointLight color={0xff3388} intensity={3} distance={120} position={[60, 6, -60]} />
      <pointLight color={0x33ddff} intensity={3} distance={120} position={[-60, 6, -60]} />
      <pointLight color={0xff6600} intensity={3} distance={120} position={[0, 4, 80]} />
      <fogExp2 attach="fog" color={0xff8833} density={0.006} />
    </>
  );
}
