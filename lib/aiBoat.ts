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
  const spawnRadius = 40 + Math.random() * 60;
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

export function updateAI(
  boat: AIBoat,
  playerPos: THREE.Vector3,
  dt: number,
  difficulty: string
): void {
  if (!boat.alive) {
    if (boat.respawnTimer > 0) {
      boat.respawnTimer -= dt;
      if (boat.respawnTimer <= 0) {
        boat.alive = true;
        boat.health = 100;
        boat.mesh.visible = true;
        const a = Math.random() * Math.PI * 2, r = 40 + Math.random() * 60;
        boat.mesh.position.set(Math.cos(a) * r, 0.25, Math.sin(a) * r);
      }
    }
    return;
  }

  if (boat.frozenTimer > 0) {
    boat.frozenTimer -= dt;
    return;
  }

  const pos = boat.mesh.position;
  const speedMult = difficulty === 'ACE' ? 1.4 : difficulty === 'CADET' ? 0.6 : 1.0;
  const aggression = difficulty === 'ACE' ? 0.85 : difficulty === 'CADET' ? 0.3 : 0.6;

  boat.stateTimer -= dt;

  // State machine
  const distToPlayer = pos.distanceTo(playerPos);
  if (boat.health < 30 && Math.random() < 0.01) boat.state = 'flee';
  else if (distToPlayer < 60 && Math.random() < aggression * 0.02) boat.state = 'chase';
  else if (boat.stateTimer <= 0) {
    boat.state = 'patrol';
    boat.stateTimer = 3 + Math.random() * 4;
    boat.targetPos.set(
      (Math.random() - 0.5) * 160,
      0.25,
      (Math.random() - 0.5) * 160
    );
  }

  let target: THREE.Vector3;
  if (boat.state === 'chase') target = playerPos.clone();
  else if (boat.state === 'flee') {
    const away = pos.clone().sub(playerPos).normalize();
    target = pos.clone().addScaledVector(away, 30);
  } else {
    target = boat.targetPos;
  }

  // Steer toward target
  const toTarget = target.clone().sub(pos).normalize();
  const forward = new THREE.Vector3(0, 0, -1).applyEuler(boat.mesh.rotation);
  const cross = new THREE.Vector3().crossVectors(forward, toTarget);
  boat.mesh.rotation.y -= cross.y * boat.turnSpeed * dt * speedMult;

  // Move forward
  const dir = new THREE.Vector3(0, 0, -1).applyEuler(boat.mesh.rotation);
  pos.addScaledVector(dir, boat.speed * dt * speedMult);
  pos.y = 0.25;

  // Arena boundary
  const boundary = 150;
  if (Math.abs(pos.x) > boundary || Math.abs(pos.z) > boundary) {
    boat.mesh.rotation.y += Math.PI * dt * 2;
  }
}
