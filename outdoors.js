import * as THREE from 'three';

// Configuração dos 5 outdoors
const OUTDOORS = [
  { t: 0.10, side: 'right', offset: 18, label: 'ANUNCIE AQUI' },
  { t: 0.30, side: 'left',  offset: 22, label: 'ANUNCIE AQUI' },
  { t: 0.50, side: 'right', offset: 18, label: 'ANUNCIE AQUI' },
  { t: 0.75, side: 'left',  offset: 18, label: 'ANUNCIE AQUI' },
  { t: 0.92, side: 'right', offset: 20, label: 'ANUNCIE AQUI' },
];

const TOWER_TOTAL_HEIGHT = 8;
const SIGN_WIDTH         = 6;
const SIGN_HEIGHT        = 3;
const SIGN_BOTTOM        = 4.5;
const POLE_WIDTH         = 0.25;
const POLE_COUNT         = 2;
const POLE_SPACING       = 4;

const SIGN_BG_COLOR    = 0xcc0000;
const SIGN_TEXT_COLOR  = '#000000';
const POLE_COLOR       = 0x222222;

function createSignTexture(label) {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#cc0000';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.strokeStyle = '#000';
  ctx.lineWidth = 12;
  ctx.strokeRect(6, 6, canvas.width - 12, canvas.height - 12);

  ctx.fillStyle = SIGN_TEXT_COLOR;
  ctx.font = 'bold 140px system-ui, -apple-system, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, canvas.width / 2, canvas.height / 2);

  const texture = new THREE.CanvasTexture(canvas);
  texture.anisotropy = 4;
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function createSingleOutdoor(label, sharedSignTexture) {
  const group = new THREE.Group();

  const poleMat = new THREE.MeshStandardMaterial({
    color: POLE_COLOR,
    roughness: 0.7,
    metalness: 0.3,
  });
  const poleGeom = new THREE.BoxGeometry(POLE_WIDTH, TOWER_TOTAL_HEIGHT, POLE_WIDTH);

  for (let i = 0; i < POLE_COUNT; i++) {
    const pole = new THREE.Mesh(poleGeom, poleMat);
    const xOffset = (i - (POLE_COUNT - 1) / 2) * POLE_SPACING;
    pole.position.set(xOffset, TOWER_TOTAL_HEIGHT / 2, 0);
    pole.castShadow = true;
    pole.receiveShadow = true;
    group.add(pole);
  }

  // Reusa textura compartilhada (todas as placas têm o mesmo texto)
  const signTexture = sharedSignTexture || createSignTexture(label);

  const signMatFront = new THREE.MeshStandardMaterial({
    map: signTexture,
    roughness: 0.85,
  });
  const signMatBack = new THREE.MeshStandardMaterial({
    color: SIGN_BG_COLOR,
    roughness: 0.85,
  });

  // BoxGeometry: ordem das faces +X, -X, +Y, -Y, +Z, -Z. +Z é a frente.
  const signGeom = new THREE.BoxGeometry(SIGN_WIDTH, SIGN_HEIGHT, 0.15);
  const sign = new THREE.Mesh(signGeom, [
    signMatBack,
    signMatBack,
    signMatBack,
    signMatBack,
    signMatFront,  // +Z = frente
    signMatBack,
  ]);
  sign.position.set(0, SIGN_BOTTOM + SIGN_HEIGHT / 2, 0);
  sign.castShadow = true;
  sign.receiveShadow = true;
  group.add(sign);

  return group;
}

export function createOutdoors(scene, centerCurve) {
  const group = new THREE.Group();
  group.name = 'outdoors';

  // Textura compartilhada — gerada 1x e reusada nos 5 outdoors
  const sharedTexture = createSignTexture('ANUNCIE AQUI');

  for (const config of OUTDOORS) {
    const outdoor = createSingleOutdoor(config.label, sharedTexture);

    const centerPos = centerCurve.getPointAt(config.t);
    const tangent = centerCurve.getTangentAt(config.t);

    const up = new THREE.Vector3(0, 1, 0);
    const left = new THREE.Vector3().crossVectors(up, tangent).normalize();
    const lateral = config.side === 'left' ? left : left.clone().negate();

    const finalPos = centerPos.clone().addScaledVector(lateral, config.offset);
    finalPos.y = centerPos.y;
    outdoor.position.copy(finalPos);

    // Placa apontando pra pista — +Z local deve casar com -lateral mundial
    const facingDir = lateral.clone().negate();
    outdoor.rotation.y = Math.atan2(facingDir.x, facingDir.z);

    group.add(outdoor);
  }

  scene.add(group);
  return group;
}
