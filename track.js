import * as THREE from 'three';

// 120 waypoints extraídos uniformemente do SVG vetorial oficial de Interlagos.
// Perímetro ~4309m, espaçamento ~36m, 15 curvas, elevação Y suavizada (~20m de desnível).
export const INTERLAGOS_WAYPOINTS = [
  { x: -258.38, y: 5.00, z: -119.60, name: 'reta_largada' },
  { x: -278.93, y: 4.90, z: -89.89, name: 'reta_p_curva_1' },
  { x: -299.08, y: 4.80, z: -59.91, name: 'reta_p_curva_1' },
  { x: -318.61, y: 4.70, z: -29.52, name: 'reta_p_curva_1' },
  { x: -338.23, y: 4.60, z: 0.81, name: 'reta_p_curva_1' },
  { x: -358.20, y: 4.44, z: 30.91, name: 'reta_p_curva_1' },
  { x: -378.24, y: 4.00, z: 60.97, name: 'reta_p_curva_1' },
  { x: -398.30, y: 3.50, z: 91.01, name: 'reta_p_curva_1' },
  { x: -418.30, y: 2.85, z: 121.10, name: 'reta_p_curva_1' },
  { x: -438.01, y: 1.50, z: 151.37, name: 'reta_p_curva_1' },
  { x: -456.99, y: -0.08, z: 182.11, name: 'curva_1_entrada' },
  { x: -473.46, y: -2.00, z: 214.22, name: 'curva_1_entrada' },
  { x: -474.47, y: -4.00, z: 249.13, name: 'curva_1_apex' },
  { x: -447.94, y: -6.00, z: 270.78, name: 'curva_1_saida' },
  { x: -411.90, y: -8.07, z: 272.94, name: 'curva_2_entrada' },
  { x: -378.53, y: -10.24, z: 284.01, name: 'curva_2_apex' },
  { x: -367.41, y: -11.25, z: 317.98, name: 'curva_2_saida' },
  { x: -355.59, y: -11.93, z: 352.02, name: 'curva_2_saida' },
  { x: -335.98, y: -12.29, z: 382.26, name: 'reta_p_curva_3' },
  { x: -310.01, y: -12.71, z: 407.26, name: 'reta_p_curva_3' },
  { x: -279.21, y: -13.11, z: 426.00, name: 'curva_3_entrada' },
  { x: -245.05, y: -14.00, z: 437.53, name: 'curva_3_entrada' },
  { x: -209.17, y: -14.77, z: 440.81, name: 'curva_3_apex' },
  { x: -173.62, y: -14.50, z: 434.97, name: 'curva_3_saida' },
  { x: -140.48, y: -14.00, z: 420.72, name: 'curva_3_saida' },
  { x: -107.95, y: -13.50, z: 405.00, name: 'reta_p_curva_4' },
  { x: -75.44, y: -13.00, z: 389.25, name: 'reta_p_curva_4' },
  { x: -42.95, y: -12.50, z: 373.46, name: 'reta_p_curva_4' },
  { x: -10.48, y: -12.00, z: 357.63, name: 'reta_p_curva_4' },
  { x: 21.97, y: -11.50, z: 341.75, name: 'reta_p_curva_4' },
  { x: 54.39, y: -11.00, z: 325.83, name: 'reta_p_curva_4' },
  { x: 86.79, y: -10.50, z: 309.85, name: 'reta_p_curva_4' },
  { x: 119.16, y: -10.00, z: 293.80, name: 'reta_p_curva_4' },
  { x: 151.48, y: -9.50, z: 277.68, name: 'reta_p_curva_4' },
  { x: 183.77, y: -9.00, z: 261.47, name: 'reta_p_curva_4' },
  { x: 216.00, y: -8.50, z: 245.16, name: 'reta_p_curva_4' },
  { x: 248.17, y: -8.00, z: 228.71, name: 'curva_4_entrada' },
  { x: 280.25, y: -7.50, z: 212.11, name: 'curva_4_entrada' },
  { x: 312.21, y: -7.00, z: 195.28, name: 'curva_4_apex' },
  { x: 344.01, y: -6.50, z: 178.13, name: 'curva_4_saida' },
  { x: 375.52, y: -6.00, z: 160.47, name: 'curva_4_saida' },
  { x: 406.41, y: -5.50, z: 141.74, name: 'curva_5_entrada' },
  { x: 428.17, y: -5.04, z: 115.42, name: 'curva_5_apex' },
  { x: 420.45, y: -4.75, z: 80.35, name: 'curva_5_saida' },
  { x: 404.71, y: -4.50, z: 47.87, name: 'curva_5_saida' },
  { x: 384.93, y: -4.25, z: 17.67, name: 'reta_p_curva_6' },
  { x: 361.67, y: -4.00, z: -9.94, name: 'reta_p_curva_6' },
  { x: 334.24, y: -3.75, z: -33.34, name: 'reta_p_curva_6' },
  { x: 300.81, y: -3.50, z: -45.94, name: 'reta_p_curva_6' },
  { x: 264.73, y: -3.25, z: -46.94, name: 'reta_p_curva_6' },
  { x: 228.66, y: -3.02, z: -45.09, name: 'reta_p_curva_6' },
  { x: 192.64, y: -2.88, z: -42.34, name: 'reta_p_curva_6' },
  { x: 156.65, y: -2.75, z: -39.20, name: 'reta_p_curva_6' },
  { x: 120.68, y: -2.62, z: -35.87, name: 'reta_p_curva_6' },
  { x: 84.72, y: -2.50, z: -32.44, name: 'reta_p_curva_6' },
  { x: 48.76, y: -2.38, z: -28.95, name: 'reta_p_curva_6' },
  { x: 12.81, y: -2.25, z: -25.43, name: 'curva_6_entrada' },
  { x: -23.25, y: -2.12, z: -23.40, name: 'curva_6_entrada' },
  { x: -59.31, y: -2.00, z: -25.07, name: 'curva_6_apex' },
  { x: -94.43, y: -1.86, z: -33.15, name: 'curva_6_saida' },
  { x: -124.11, y: -1.71, z: -53.06, name: 'curva_6_saida' },
  { x: -144.13, y: -1.57, z: -83.03, name: 'curva_7_entrada' },
  { x: -150.54, y: -1.43, z: -118.06, name: 'curva_7_apex' },
  { x: -138.10, y: -1.29, z: -151.72, name: 'curva_7_saida' },
  { x: -117.60, y: -1.14, z: -181.43, name: 'curva_8_entrada' },
  { x: -94.55, y: -0.98, z: -209.24, name: 'curva_8_apex' },
  { x: -69.67, y: -0.71, z: -235.41, name: 'curva_8_saida' },
  { x: -38.61, y: -0.43, z: -251.23, name: 'curva_9_entrada' },
  { x: -23.68, y: -0.14, z: -220.18, name: 'curva_9_apex' },
  { x: -16.05, y: 0.14, z: -184.94, name: 'curva_9_saida' },
  { x: 5.63, y: 0.43, z: -157.09, name: 'curva_9_saida' },
  { x: 40.88, y: 0.71, z: -151.91, name: 'curva_10_entrada' },
  { x: 69.89, y: 1.03, z: -170.39, name: 'curva_10_apex' },
  { x: 79.57, y: 1.50, z: -205.04, name: 'curva_10_saida' },
  { x: 83.65, y: 2.00, z: -240.92, name: 'curva_10_saida' },
  { x: 88.38, y: 2.50, z: -276.71, name: 'curva_11_entrada' },
  { x: 98.15, y: 2.95, z: -311.45, name: 'curva_11_apex' },
  { x: 113.10, y: 3.17, z: -344.29, name: 'curva_11_saida' },
  { x: 135.40, y: 3.33, z: -372.46, name: 'curva_11_saida' },
  { x: 166.81, y: 3.50, z: -372.62, name: 'reta_p_curva_12' },
  { x: 169.21, y: 3.67, z: -336.95, name: 'reta_p_curva_12' },
  { x: 164.95, y: 3.83, z: -301.08, name: 'reta_p_curva_12' },
  { x: 162.48, y: 4.00, z: -265.06, name: 'reta_p_curva_12' },
  { x: 164.87, y: 4.17, z: -229.06, name: 'curva_12_entrada' },
  { x: 176.54, y: 4.33, z: -195.08, name: 'curva_12_entrada' },
  { x: 201.28, y: 4.48, z: -169.21, name: 'curva_12_apex' },
  { x: 234.21, y: 4.56, z: -154.68, name: 'curva_12_saida' },
  { x: 270.06, y: 4.62, z: -151.87, name: 'curva_12_saida' },
  { x: 306.09, y: 4.69, z: -154.39, name: 'reta_p_curva_13' },
  { x: 341.95, y: 4.75, z: -158.68, name: 'reta_p_curva_13' },
  { x: 377.65, y: 4.81, z: -164.22, name: 'reta_p_curva_13' },
  { x: 413.12, y: 4.88, z: -171.05, name: 'curva_13_entrada' },
  { x: 448.15, y: 4.94, z: -179.84, name: 'curva_13_entrada' },
  { x: 474.47, y: 4.99, z: -199.94, name: 'curva_13_apex' },
  { x: 470.22, y: 5.00, z: -235.68, name: 'curva_13_saida' },
  { x: 459.65, y: 5.00, z: -270.20, name: 'curva_13_saida' },
  { x: 445.24, y: 5.00, z: -303.31, name: 'reta_p_curva_14' },
  { x: 425.56, y: 5.00, z: -332.91, name: 'reta_p_curva_14' },
  { x: 399.00, y: 5.00, z: -357.33, name: 'curva_14_entrada' },
  { x: 369.62, y: 5.00, z: -378.34, name: 'curva_14_entrada' },
  { x: 338.65, y: 5.01, z: -396.92, name: 'curva_14_apex' },
  { x: 306.46, y: 5.06, z: -413.30, name: 'curva_14_saida' },
  { x: 273.15, y: 5.12, z: -427.23, name: 'curva_14_saida' },
  { x: 238.60, y: 5.19, z: -437.71, name: 'reta_p_curva_15' },
  { x: 202.80, y: 5.25, z: -440.81, name: 'reta_p_curva_15' },
  { x: 167.59, y: 5.31, z: -432.93, name: 'reta_p_curva_15' },
  { x: 133.38, y: 5.38, z: -421.34, name: 'reta_p_curva_15' },
  { x: 99.83, y: 5.44, z: -407.96, name: 'reta_p_curva_15' },
  { x: 66.79, y: 5.49, z: -393.35, name: 'reta_p_curva_15' },
  { x: 34.19, y: 5.50, z: -377.79, name: 'reta_p_curva_15' },
  { x: 2.01, y: 5.50, z: -361.36, name: 'reta_p_curva_15' },
  { x: -29.71, y: 5.50, z: -344.09, name: 'reta_p_curva_15' },
  { x: -60.94, y: 5.50, z: -325.92, name: 'reta_p_curva_15' },
  { x: -91.52, y: 5.50, z: -306.71, name: 'curva_15_entrada' },
  { x: -121.20, y: 5.50, z: -286.12, name: 'curva_15_entrada' },
  { x: -149.27, y: 5.48, z: -263.40, name: 'curva_15_apex' },
  { x: -172.72, y: 5.40, z: -235.95, name: 'curva_15_saida' },
  { x: -194.78, y: 5.30, z: -207.35, name: 'curva_15_saida' },
  { x: -216.32, y: 5.20, z: -178.35, name: 'reta_p_curva_1' },
  { x: -237.51, y: 5.10, z: -149.09, name: 'reta_p_curva_1' },
];

// Curvas que viram para a esquerda → zebra no lado interno (esquerdo)
const LEFT_TURN_NUMBERS = new Set([1, 2, 7, 8, 10, 14]);
// Curvas que viram para a direita → zebra no lado direito
const RIGHT_TURN_NUMBERS = new Set([3, 4, 5, 6, 9, 11, 12, 13, 15]);

function buildClosedRibbon3D(points, width) {
  const N = points.length;
  const positions = [];
  const indices = [];
  const half = width / 2;
  for (let i = 0; i < N; i++) {
    const p = points[i];
    const prev = points[(i - 1 + N) % N];
    const next = points[(i + 1) % N];
    const tx = next.x - prev.x;
    const tz = next.z - prev.z;
    const len = Math.hypot(tx, tz) || 1;
    const nx = -tz / len;
    const nz = tx / len;
    positions.push(p.x + nx * half, p.y, p.z + nz * half);
    positions.push(p.x - nx * half, p.y, p.z - nz * half);
  }
  for (let i = 0; i < N; i++) {
    const a = i * 2, b = a + 1;
    const c = ((i + 1) % N) * 2, d = c + 1;
    indices.push(a, c, b, b, c, d);
  }
  const geom = new THREE.BufferGeometry();
  geom.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geom.setIndex(indices);
  geom.computeVertexNormals();
  return geom;
}

function findCurvaSegments(waypoints) {
  const segments = [];
  let i = 0;
  while (i < waypoints.length) {
    const m = waypoints[i].name.match(/^curva_(\d+)_/);
    if (m) {
      const num = parseInt(m[1], 10);
      const startIdx = i;
      let endIdx = i;
      while (i < waypoints.length) {
        const mn = waypoints[i].name.match(/^curva_(\d+)_/);
        if (!mn || parseInt(mn[1], 10) !== num) break;
        endIdx = i;
        i++;
      }
      segments.push({ num, startIdx, endIdx });
    } else {
      i++;
    }
  }
  return segments;
}

function buildKerbGeometry(curve, t0, t1, side, asphaltHalf, kerbWidth, yLift) {
  const positions = [];
  const colors = [];
  const indices = [];
  const cellLen = 2;

  const arcLengthApprox = curve.getLength() * (t1 - t0);
  const samplesCount = Math.max(8, Math.ceil(arcLengthApprox / 1.0));

  const samples = [];
  for (let i = 0; i <= samplesCount; i++) {
    const t = t0 + (t1 - t0) * (i / samplesCount);
    samples.push({
      pos: curve.getPoint(t),
      tangent: curve.getTangent(t),
    });
  }

  let arcLen = 0;
  for (let i = 0; i < samples.length - 1; i++) {
    const sa = samples[i];
    const sb = samples[i + 1];

    const aPerp = sidePerp(sa.tangent, side);
    const bPerp = sidePerp(sb.tangent, side);

    const aInner = {
      x: sa.pos.x + aPerp.x * asphaltHalf,
      y: sa.pos.y + yLift,
      z: sa.pos.z + aPerp.z * asphaltHalf,
    };
    const aOuter = {
      x: sa.pos.x + aPerp.x * (asphaltHalf + kerbWidth),
      y: sa.pos.y + yLift,
      z: sa.pos.z + aPerp.z * (asphaltHalf + kerbWidth),
    };
    const bInner = {
      x: sb.pos.x + bPerp.x * asphaltHalf,
      y: sb.pos.y + yLift,
      z: sb.pos.z + bPerp.z * asphaltHalf,
    };
    const bOuter = {
      x: sb.pos.x + bPerp.x * (asphaltHalf + kerbWidth),
      y: sb.pos.y + yLift,
      z: sb.pos.z + bPerp.z * (asphaltHalf + kerbWidth),
    };

    const isRed = Math.floor(arcLen / cellLen) % 2 === 0;
    const c = isRed ? [0.85, 0.05, 0.05] : [0.95, 0.95, 0.95];

    const baseIdx = positions.length / 3;
    positions.push(aInner.x, aInner.y, aInner.z);
    positions.push(aOuter.x, aOuter.y, aOuter.z);
    positions.push(bInner.x, bInner.y, bInner.z);
    positions.push(bOuter.x, bOuter.y, bOuter.z);
    for (let k = 0; k < 4; k++) colors.push(c[0], c[1], c[2]);
    indices.push(baseIdx, baseIdx + 2, baseIdx + 1, baseIdx + 1, baseIdx + 2, baseIdx + 3);

    arcLen += sa.pos.distanceTo(sb.pos);
  }

  const geom = new THREE.BufferGeometry();
  geom.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geom.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  geom.setIndex(indices);
  geom.computeVertexNormals();
  return geom;
}

function sidePerp(tangent, side) {
  const tx = tangent.x, tz = tangent.z;
  const len = Math.hypot(tx, tz) || 1;
  const utx = tx / len, utz = tz / len;
  // forward → left perp = (tz, -tx) / right perp = (-tz, tx) (rotação ±90° em torno de Y)
  if (side === 'left') return { x: utz, z: -utx };
  return { x: -utz, z: utx };
}

export function createInterlagosTrack(scene, opts = {}) {
  const TRACK_WIDTH = opts.trackWidth ?? 13;

  const trackGroup = new THREE.Group();
  scene.add(trackGroup);

  // Curva central a partir dos waypoints (Y é elevação)
  const ctrl = INTERLAGOS_WAYPOINTS.map(w => new THREE.Vector3(w.x, w.y, w.z));
  const curve = new THREE.CatmullRomCurve3(ctrl, true, 'centripetal', 0.5);

  // Densifica preservando Y por ponto — amostra manual em t∈[0,1) pra evitar
  // o ponto duplicado no fechamento (CatmullRomCurve3 closed retorna o mesmo
  // ponto em t=0 e t=1, criando quad degenerado no ribbon).
  const DENSE_N = 800;
  const dense = new Array(DENSE_N);
  for (let i = 0; i < DENSE_N; i++) {
    dense[i] = curve.getPoint(i / DENSE_N);
  }
  // Cache para o minimapa (mesma fonte do traçado 3D)
  _minimapPath = dense.map(p => ({ x: p.x, z: p.z }));

  // Borda branca (faixa um pouco mais larga, levemente abaixo do asfalto)
  const edgeMesh = new THREE.Mesh(
    buildClosedRibbon3D(dense, TRACK_WIDTH + 1.2),
    new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.9 })
  );
  edgeMesh.position.y -= 0.01;
  edgeMesh.receiveShadow = true;
  trackGroup.add(edgeMesh);

  // Asfalto
  const asphaltMesh = new THREE.Mesh(
    buildClosedRibbon3D(dense, TRACK_WIDTH),
    new THREE.MeshStandardMaterial({ color: 0x2a2a2c, roughness: 0.95 })
  );
  asphaltMesh.receiveShadow = true;
  trackGroup.add(asphaltMesh);

  // Zebras nas curvas
  const segments = findCurvaSegments(INTERLAGOS_WAYPOINTS);
  const N = INTERLAGOS_WAYPOINTS.length;
  const kerbMat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.7 });
  for (const seg of segments) {
    let side = null;
    if (LEFT_TURN_NUMBERS.has(seg.num)) side = 'left';
    else if (RIGHT_TURN_NUMBERS.has(seg.num)) side = 'right';
    if (!side) continue;
    const t0 = seg.startIdx / N;
    const t1 = seg.endIdx / N;
    if (t1 <= t0) continue;
    const kerbGeom = buildKerbGeometry(curve, t0, t1, side, TRACK_WIDTH / 2, 1.0, 0.05);
    const kerb = new THREE.Mesh(kerbGeom, kerbMat);
    kerb.receiveShadow = true;
    trackGroup.add(kerb);
  }

  // Linha de largada xadrez no waypoint 0 (largada da reta principal).
  const startT = 0;
  const sf = curve.getPoint(startT);
  const sfTangent = curve.getTangent(startT);
  const tlen = Math.hypot(sfTangent.x, sfTangent.z) || 1;
  const txn = sfTangent.x / tlen, tzn = sfTangent.z / tlen;
  const nx = -tzn, nz = txn;
  const cellSize = 1.4;
  const cellsAcross = Math.floor(TRACK_WIDTH / cellSize);
  const trackAngle = Math.atan2(txn, tzn);

  const cellGeom = new THREE.PlaneGeometry(cellSize, cellSize);
  cellGeom.rotateX(-Math.PI / 2);

  for (let row = 0; row < 2; row++) {
    for (let i = 0; i < cellsAcross; i++) {
      const offsetN = (i - (cellsAcross - 1) / 2) * cellSize;
      const offsetT = row * cellSize;
      const cx = sf.x + nx * offsetN + txn * offsetT;
      const cz = sf.z + nz * offsetN + tzn * offsetT;
      const black = ((i + row) % 2) === 0;
      const cell = new THREE.Mesh(
        cellGeom,
        new THREE.MeshBasicMaterial({ color: black ? 0x000000 : 0xffffff })
      );
      cell.rotation.y = trackAngle;
      cell.position.set(cx, sf.y + 0.015, cz);
      trackGroup.add(cell);
    }
  }

  // Bounds em XZ com margem de 50m
  let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
  for (const p of dense) {
    if (p.x < minX) minX = p.x;
    if (p.x > maxX) maxX = p.x;
    if (p.z < minZ) minZ = p.z;
    if (p.z > maxZ) maxZ = p.z;
  }
  const bounds = {
    cx: (minX + maxX) / 2,
    cz: (minZ + maxZ) / 2,
    halfW: (maxX - minX) / 2 + 50,
    halfH: (maxZ - minZ) / 2 + 50,
  };

  // Posição inicial: waypoint 0 com Y elevado +0.1 (acima do asfalto)
  const startPosition = new THREE.Vector3(sf.x, sf.y + 0.1, sf.z);
  const startRotationY = Math.atan2(-txn, -tzn);

  return {
    trackMesh: asphaltMesh,
    centerCurve: curve,
    startPosition,
    startRotationY,
    length: curve.getLength(),
    bounds,
  };
}

// Pré-computado em createInterlagosTrack pra usar no minimapa.
let _minimapPath = null;

export function drawMinimap(canvas, carPosition, carRotation) {
  if (!_minimapPath) return;
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;
  ctx.clearRect(0, 0, W, H);

  // Bounding box do traçado denso em XZ
  let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
  for (const p of _minimapPath) {
    if (p.x < minX) minX = p.x;
    if (p.x > maxX) maxX = p.x;
    if (p.z < minZ) minZ = p.z;
    if (p.z > maxZ) maxZ = p.z;
  }
  const margin = 10;
  const sx = (W - 2 * margin) / (maxX - minX);
  const sz = (H - 2 * margin) / (maxZ - minZ);
  const scale = Math.min(sx, sz);
  const toPx = (x, z) => [
    margin + (x - minX) * scale,
    margin + (z - minZ) * scale,
  ];

  // Pista (linha suavizada — usa os mesmos pontos do asfalto 3D)
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  const [x0, y0] = toPx(_minimapPath[0].x, _minimapPath[0].z);
  ctx.moveTo(x0, y0);
  for (let i = 1; i < _minimapPath.length; i++) {
    const [px, py] = toPx(_minimapPath[i].x, _minimapPath[i].z);
    ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.stroke();

  // Carro como bolinha azul
  if (carPosition) {
    const [cx, cy] = toPx(carPosition.x, carPosition.z);
    ctx.fillStyle = '#ff2a2a';
    ctx.beginPath();
    ctx.arc(cx, cy, 5, 0, Math.PI * 2);
    ctx.fill();
  }
}
