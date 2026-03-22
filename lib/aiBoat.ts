import * as THREE from 'three';

export interface AIBoat {
  id: string;
  name: string;
  mesh: THREE.Group;
  health: number;
  alive: boolean;
  team?: 'red' | 'blue';
  speed: number;
  turnSpeed: number;
  stateTimer: number;
  state: 'patrol' | 'chase' | 'flee' | 'frozen';
  targetPos: THREE.Vector3;
  respawnTimer: number;
  frozenTimer: number;
  kills: number;
  deaths: number;
  score: number;
}

const AI_NAMES = ['STORMCROW','IRONSIDES','BLACKTIDE','SEAWOLF','TEMPEST','RAZORFIN','DEEPSTRIKE','WARWAVE'];

export function createAIBoat(
  id: string,
  primary: number,
  accent: number,
  team?: 'red' | 'blue'
): AIBoat {
  const group = new THREE.Group();
  const hm = new THREE.MeshLambertMaterial({ color: primary });
  const em = new THREE.MeshBasicMaterial({ color: accent });

  // Hull
  const hull = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.55, 5.5), hm);
  group.add(hull);
  // Bow
  const bow = new THREE.Mesh(new THREE.ConeGeometry(1.1, 2.2, 4), hm);
  bow.rotation.x = Math.PI / 2; bow.rotation.y = Math.PI / 4;
  bow.position.set(0, 0, -3.8); group.add(bow);
  // Cabin
  const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.8, 1.8), new THREE.MeshLambertMaterial({ color: 0x0a0a14 }));
  cabin.position.set(0, 0.67, 0.4); group.add(cabin);
  // Engine
  const eng = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.35, 0.6), em);
  eng.position.set(0, 0.1, 2.6); group.add(eng);
  // Stripe
  const stripe = new THREE.Mesh(new THREE.BoxGeometry(2.3, 0.1, 5.6), em);
  stripe.position.y = 0.28; group.add(stripe);

  const spawnAngle = Math.random() * Math.PI * 2;
  const spawnRadius = 15 + Math.random() * 60; // max 75 — well inside arena
  group.position.set(Math.cos(spawnAngle) * spawnRadius, 0.25, Math.sin(spawnAngle) * spawnRadius);
  group.rotation.y = Math.random() * Math.PI * 2;

  return {
    id,
    name: AI_NAMES[parseInt(id.replace('ai','')) % AI_NAMES.length],
    mesh: group,
    health: 100,
    alive: true,
    team,
    speed: 4 + Math.random() * 3,
    turnSpeed: 1.2 + Math.random() * 0.8,
    stateTimer: 0,
    state: 'patrol',
    targetPos: new THREE.Vector3(
      (Math.random() - 0.5) * 160,
      0.25,
      (Math.random() - 0.5) * 160
    ),
    respawnTimer: 0,
    frozenTimer: 0,
    kills: 0,
    deaths: 0,
    score: 0,
  };
}

export interface AIUpdateResult {
  shootTarget: THREE.Vector3 | null; // world position to shoot toward, or null
  shootTargetId: string | null;      // 'player' or boat id
}

export function updateAI(
  boat: AIBoat,
  playerPos: THREE.Vector3,
  dt: number,
  difficulty: string,
  otherBoats: AIBoat[] = [],
): AIUpdateResult {
  if (!boat.alive) {
    if (boat.respawnTimer > 0) {
      boat.respawnTimer -= dt;
      if (boat.respawnTimer <= 0) {
        boat.alive = true;
        boat.health = 100;
        boat.mesh.visible = true;
        const a = Math.random() * Math.PI * 2, r = 15 + Math.random() * 60;
        boat.mesh.position.set(Math.cos(a) * r, 0.25, Math.sin(a) * r);
      }
    }
    return { shootTarget: null, shootTargetId: null };
  }

  if (boat.frozenTimer > 0) {
    boat.frozenTimer -= dt;
    return { shootTarget: null, shootTargetId: null };
  }

  const pos = boat.mesh.position;
  const speedMult = difficulty === 'ACE' ? 1.4 : difficulty === 'CADET' ? 0.6 : 1.0;
  const aggression = difficulty === 'ACE' ? 0.85 : difficulty === 'CADET' ? 0.3 : 0.6;

  boat.stateTimer -= dt;

  // Find nearest enemy (player or other AI boat)
  let nearestPos = playerPos;
  let nearestId  = 'player';
  let nearestDist = pos.distanceTo(playerPos);

  for (const other of otherBoats) {
    if (!other.alive || other.id === boat.id) continue;
    const d = pos.distanceTo(other.mesh.position);
    if (d < nearestDist) {
      nearestDist = d;
      nearestPos  = other.mesh.position;
      nearestId   = other.id;
    }
  }

  // State machine — chase nearest enemy
  if (boat.health < 30 && Math.random() < 0.01) boat.state = 'flee';
  else if (nearestDist < 60 && Math.random() < aggression * 0.02) boat.state = 'chase';
  else if (boat.stateTimer <= 0) {
    boat.state = 'patrol';
    boat.stateTimer = 3 + Math.random() * 4;
    boat.targetPos.set(
      (Math.random() - 0.5) * 200,
      0.25,
      (Math.random() - 0.5) * 200
    );
    // Clamp patrol target inside arena
    boat.targetPos.x = THREE.MathUtils.clamp(boat.targetPos.x, -90, 90);
    boat.targetPos.z = THREE.MathUtils.clamp(boat.targetPos.z, -90, 90);
  }

  const ARENA = 100; // hard arena radius boats must stay within

  let target: THREE.Vector3;
  if (boat.state === 'chase') {
    // Clamp chase target so we never steer toward something outside the arena
    target = nearestPos.clone();
    target.x = THREE.MathUtils.clamp(target.x, -ARENA, ARENA);
    target.z = THREE.MathUtils.clamp(target.z, -ARENA, ARENA);
  } else if (boat.state === 'flee') {
    const away = pos.clone().sub(nearestPos).normalize();
    target = pos.clone().addScaledVector(away, 30);
    // If fleeing would take us out of arena, flip toward center instead
    if (Math.abs(target.x) > ARENA || Math.abs(target.z) > ARENA) {
      target.set(0, 0.25, 0);
    }
  } else {
    target = boat.targetPos;
  }

  // If the boat itself is near the edge, override target to steer back to center
  const distFromCenter = Math.sqrt(pos.x * pos.x + pos.z * pos.z);
  if (distFromCenter > ARENA * 0.85) {
    target = new THREE.Vector3(0, 0.25, 0);
  }

  // Steer toward target
  const toTarget = target.clone().sub(pos).normalize();
  const forward = new THREE.Vector3(0, 0, -1).applyEuler(boat.mesh.rotation);
  const cross = new THREE.Vector3().crossVectors(forward, toTarget);
  const steerMult = distFromCenter > ARENA * 0.85 ? 4 : 1; // stronger turn near edge
  boat.mesh.rotation.y -= cross.y * boat.turnSpeed * dt * speedMult * steerMult;

  // Move forward
  const dir = new THREE.Vector3(0, 0, -1).applyEuler(boat.mesh.rotation);
  pos.addScaledVector(dir, boat.speed * dt * speedMult);
  pos.y = 0.25;

  // Hard clamp — last resort so nothing escapes
  pos.x = THREE.MathUtils.clamp(pos.x, -ARENA, ARENA);
  pos.z = THREE.MathUtils.clamp(pos.z, -ARENA, ARENA);

  // Return shoot info so caller can spawn projectiles
  const canShoot = nearestDist < 45;
  return {
    shootTarget: canShoot ? nearestPos.clone() : null,
    shootTargetId: canShoot ? nearestId : null,
  };
}
