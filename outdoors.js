import * as THREE from 'three';

// Outdoors em formato de ponte sobre a pista: largada, reta oposta e pinheirinho
const OUTDOORS = [
  { t: 0.02, label: 'ANUNCIE AQUI' }, // largada
  { t: 0.25, label: 'ANUNCIE AQUI' }, // reta oposta
  { t: 0.52, label: 'ANUNCIE AQUI' }, // pinheirinho
];

const GANTRY_SPAN        = 18;   // distância entre os dois pilares (pista = 13m + folga)
const POLE_HEIGHT        = 9;
const POLE_WIDTH         = 0.4;
const SIGN_WIDTH         = 14;
const SIGN_HEIGHT        = 2.4;
const SIGN_BOTTOM        = 6.2;  // altura inferior da placa (acima do carro)

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

  // Dois pilares — um de cada lado da pista (eixo X local = transversal à pista)
  const poleGeom = new THREE.BoxGeometry(POLE_WIDTH, POLE_HEIGHT, POLE_WIDTH);
  const half = GANTRY_SPAN / 2;
  for (const xOffset of [-half, half]) {
    const pole = new THREE.Mesh(poleGeom, poleMat);
    pole.position.set(xOffset, POLE_HEIGHT / 2, 0);
    pole.castShadow = true;
    pole.receiveShadow = true;
    group.add(pole);
  }

  // Travessa horizontal ligando os pilares no topo
  const beamGeom = new THREE.BoxGeometry(GANTRY_SPAN, POLE_WIDTH, POLE_WIDTH);
  const beam = new THREE.Mesh(beamGeom, poleMat);
  beam.position.set(0, POLE_HEIGHT - POLE_WIDTH / 2, 0);
  beam.castShadow = true;
  group.add(beam);

  const signTexture = sharedSignTexture || createSignTexture(label);

  const signMatFront = new THREE.MeshStandardMaterial({
    map: signTexture,
    roughness: 0.85,
  });
  const signMatBack = new THREE.MeshStandardMaterial({
    color: SIGN_BG_COLOR,
    roughness: 0.85,
  });

  // Placa atravessada sobre a pista: largura no eixo X (entre pilares), espessura em Z
  const signGeom = new THREE.BoxGeometry(SIGN_WIDTH, SIGN_HEIGHT, 0.2);
  // Faces: +X, -X, +Y, -Y, +Z, -Z. Frente e verso da placa = +Z e -Z.
  const sign = new THREE.Mesh(signGeom, [
    signMatBack,
    signMatBack,
    signMatBack,
    signMatBack,
    signMatFront, // +Z = frente (lado de quem chega)
    signMatFront, // -Z = verso (também com texto, vista reversa)
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

    // Posiciona o pórtico centrado sobre a pista
    outdoor.position.copy(centerPos);

    // Eixo Z local da pórtico = direção da pista (tangente).
    // Como a placa nasce com largura em X e frente em +Z, queremos que +Z
    // aponte na direção em que o carro chega (oposto à tangente).
    const facingDir = tangent.clone().negate();
    outdoor.rotation.y = Math.atan2(facingDir.x, facingDir.z);

    group.add(outdoor);
  }

  scene.add(group);
  return group;
}
