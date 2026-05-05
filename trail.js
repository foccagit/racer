import * as THREE from 'three';

const MAX_SEGMENTS = 200;
const SEGMENT_LIFE = 5.0;     // segundos
const TRAIL_Y_OFFSET = 0.05;
const TRAIL_WIDTH = 0.15;     // referência (linewidth não funciona em WebGL na maioria dos browsers)

const segments = [];
let lastLeftPos = null;
let lastRightPos = null;

let trailGeom = null;
let trailMat = null;
let trailMesh = null;

const _leftLocal  = new THREE.Vector3(-0.9, 0.05,  1.5);
const _rightLocal = new THREE.Vector3( 0.9, 0.05,  1.5);

export function initTrail(scene) {
  trailGeom = new THREE.BufferGeometry();
  const maxVertices = MAX_SEGMENTS * 4; // 2 linhas × 2 vértices por segmento
  trailGeom.setAttribute('position', new THREE.BufferAttribute(new Float32Array(maxVertices * 3), 3));
  trailGeom.setAttribute('color',    new THREE.BufferAttribute(new Float32Array(maxVertices * 3), 3));

  trailMat = new THREE.LineBasicMaterial({
    vertexColors: true,
    transparent: true,
    opacity: 0.6,
    linewidth: 1,
  });

  trailMesh = new THREE.LineSegments(trailGeom, trailMat);
  trailMesh.frustumCulled = false;
  scene.add(trailMesh);
}

export function updateTrail(isOffTrack, car, dt) {
  if (!trailMesh || !car) return;

  // Posição global das rodas traseiras (em coords locais do carro)
  const leftWorld  = _leftLocal.clone().applyMatrix4(car.matrixWorld);
  const rightWorld = _rightLocal.clone().applyMatrix4(car.matrixWorld);
  leftWorld.y  += TRAIL_Y_OFFSET;
  rightWorld.y += TRAIL_Y_OFFSET;

  if (isOffTrack && lastLeftPos && lastRightPos) {
    segments.push({
      pointsLeft:  [lastLeftPos.clone(), leftWorld.clone()],
      pointsRight: [lastRightPos.clone(), rightWorld.clone()],
      age: 0,
    });
    if (segments.length > MAX_SEGMENTS) segments.shift();
  }

  // Idade + remoção dos antigos
  for (let i = segments.length - 1; i >= 0; i--) {
    segments[i].age += dt;
    if (segments[i].age > SEGMENT_LIFE) segments.splice(i, 1);
  }

  // Salva posição atual mesmo se na pista — evita "pulo" ao reentrar fora
  lastLeftPos  = leftWorld.clone();
  lastRightPos = rightWorld.clone();

  // Atualiza buffers
  const positions = trailGeom.attributes.position.array;
  const colors    = trailGeom.attributes.color.array;
  let idx = 0;

  for (const seg of segments) {
    const lifeRatio = 1 - (seg.age / SEGMENT_LIFE);
    const c = lifeRatio;

    // Linha esquerda
    positions[idx*3+0] = seg.pointsLeft[0].x;
    positions[idx*3+1] = seg.pointsLeft[0].y;
    positions[idx*3+2] = seg.pointsLeft[0].z;
    colors[idx*3+0] = c; colors[idx*3+1] = c; colors[idx*3+2] = c;
    idx++;

    positions[idx*3+0] = seg.pointsLeft[1].x;
    positions[idx*3+1] = seg.pointsLeft[1].y;
    positions[idx*3+2] = seg.pointsLeft[1].z;
    colors[idx*3+0] = c; colors[idx*3+1] = c; colors[idx*3+2] = c;
    idx++;

    // Linha direita
    positions[idx*3+0] = seg.pointsRight[0].x;
    positions[idx*3+1] = seg.pointsRight[0].y;
    positions[idx*3+2] = seg.pointsRight[0].z;
    colors[idx*3+0] = c; colors[idx*3+1] = c; colors[idx*3+2] = c;
    idx++;

    positions[idx*3+0] = seg.pointsRight[1].x;
    positions[idx*3+1] = seg.pointsRight[1].y;
    positions[idx*3+2] = seg.pointsRight[1].z;
    colors[idx*3+0] = c; colors[idx*3+1] = c; colors[idx*3+2] = c;
    idx++;
  }

  // Resto do buffer = vértices degenerados (não desenhados via setDrawRange)
  trailGeom.attributes.position.needsUpdate = true;
  trailGeom.attributes.color.needsUpdate    = true;
  trailGeom.setDrawRange(0, segments.length * 4);
}

export function clearTrail() {
  segments.length = 0;
  lastLeftPos = null;
  lastRightPos = null;
  if (trailGeom) trailGeom.setDrawRange(0, 0);
}
