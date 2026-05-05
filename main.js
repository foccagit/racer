import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { createInterlagosTrack, INTERLAGOS_WAYPOINTS, drawMinimap } from './track.js';
import {
  raceState, startRace, registerLapCompleted, getTotalTime, getBestLap,
  getRanking, saveToRanking, formatTime,
} from './race.js';
import { initTrail, updateTrail, clearTrail } from './trail.js';
import { createOutdoors } from './outdoors.js';

const _ray = new THREE.Raycaster();
const _rayOrigin = new THREE.Vector3();
const _rayDown = new THREE.Vector3(0, -1, 0);

// === Wheel detail: geometrias/materiais compartilhados (1 alocação total) ===
const WHEEL_RADIUS = 0.30;
const _wheelDiscGeom  = new THREE.CircleGeometry(WHEEL_RADIUS * 0.85, 24);
const _wheelSpokeGeom = new THREE.BoxGeometry(WHEEL_RADIUS * 1.5, WHEEL_RADIUS * 0.12, 0.02);
const _wheelHubGeom   = new THREE.CircleGeometry(WHEEL_RADIUS * 0.22, 12);
const _wheelBlurGeom  = new THREE.CircleGeometry(WHEEL_RADIUS * 0.85, 24);
const _wheelDiscMat   = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.9 });
const _wheelSpokeMat  = new THREE.MeshStandardMaterial({ color: 0xcccccc, metalness: 0.6, roughness: 0.4 });
const _wheelHubMat    = new THREE.MeshStandardMaterial({ color: 0x888888, metalness: 0.8 });
const _wheelBlurMat   = new THREE.MeshStandardMaterial({ color: 0x666666, transparent: true, opacity: 0, roughness: 0.9 });

const state = {
  scene: null,
  renderer: null,
  cameraPersp: null,
  cameraOrtho: null,
  activeCamera: null,
  mode: '3D',
  car: null,
  carBody: null,
  frontWheels: [],
  allWheels: [],
  keys: { up: false, down: false, left: false, right: false },
  velocity: 0,
  steerAngle: 0,
  // física
  maxSpeed: 75,
  maxReverseSpeed: 25,
  acceleration: 35,
  brakeDecel: 60,
  friction: 14,
  maxSteer: Math.PI / 5,
  steerSpeed: 3.2,
  steerReturn: 4.5,
  // câmera
  camOffset3D: new THREE.Vector3(0, 6, 13),
  camLookAhead: new THREE.Vector3(0, 1, 0),
  orthoHeight: 80,
  // controle de câmera por mouse
  userYaw: 0,
  userPitch: 0,
  dragging: false,
  lastMouse: { x: 0, y: 0 },
  zoom3D: 1,
  zoomOrtho: 1,
  // colisão
  colliders: [],
  carRadius: 1.05,
  // pista
  trackMesh: null,
  trackStart: null,
  trackBounds: null,
  overview: false,
  offTrack: false,
  // cronômetro
  lapState: 'idle', // 'idle' | 'running'
  lapStartTime: 0,
  lapMaxProgress: 0,
  startT: 0,
  curveSamples: null,
  completedLaps: [],
  // regras de volta à pista
  offTrackTimer: 0,    // segundos consecutivos fora da pista
  wrongWayTimer: 0,    // segundos consecutivos no sentido contrário
  wrongWay: false,
  fpsAccum: { frames: 0, time: 0 },
};

const clock = new THREE.Clock();

function init() {
  setupScene();

  const interlagos = createInterlagosTrack(state.scene);
  state.trackMesh = interlagos.trackMesh;
  initTrail(state.scene);
  createOutdoors(state.scene, interlagos.centerCurve);
  state.centerCurve = interlagos.centerCurve;
  state.trackStart = { pos: interlagos.startPosition, rot: interlagos.startRotationY };
  state.trackBounds = interlagos.bounds;

  createCar();
  if (state.trackStart) {
    state.car.position.copy(state.trackStart.pos);
    state.car.rotation.y = state.trackStart.rot;
  }

  setupCameras();
  setupControls();
  setupMinimap();
  setupLapTimer();
  setupMenuButtons();
  showStartScreen();
  window.addEventListener('resize', onResize);
  animate();
}

function setupLapTimer() {
  // Pré-amostra a curva pra encontrar o t mais próximo do carro a cada frame
  const N = 600;
  const samples = new Array(N + 1);
  for (let i = 0; i <= N; i++) {
    const t = i / N;
    const p = state.centerCurve.getPoint(t);
    samples[i] = { t, x: p.x, z: p.z };
  }
  state.curveSamples = samples;
  state.startT = nearestSampleT(state.trackStart.pos.x, state.trackStart.pos.z);
}

function nearestSampleT(x, z) {
  const samples = state.curveSamples;
  let best = 0, bestDist = Infinity;
  for (let i = 0; i < samples.length; i++) {
    const s = samples[i];
    const dx = s.x - x, dz = s.z - z;
    const d = dx * dx + dz * dz;
    if (d < bestDist) { bestDist = d; best = s.t; }
  }
  return best;
}

function respawnOnTrack() {
  if (!state.centerCurve) return;
  const t = nearestSampleT(state.car.position.x, state.car.position.z);
  const point = state.centerCurve.getPoint(t);
  const tangent = state.centerCurve.getTangent(t);
  state.car.position.set(point.x, point.y + 0.5, point.z);
  // alinha a frente do carro (-Z local) com o sentido da pista (tangente +t)
  state.car.rotation.y = Math.atan2(-tangent.x, -tangent.z);
  state.velocity = 0;
  state.steerAngle = 0;
  state.fallVelocity = 0;
  state.offTrackTimer = 0;
  state.wrongWayTimer = 0;
  state.wrongWay = false;
  // Reseta a rotação visual do modelo (pode estar rodando do efeito pião)
  if (state.carModel) state.carModel.rotation.y = Math.PI;
  clearTrail();
  document.getElementById('wrong-way-msg').classList.remove('show');
}

function updateTrackRules(dt) {
  if (!state.centerCurve || !state.car) return;
  const msgEl = document.getElementById('wrong-way-msg');

  // Off-track 2s → respawn no centro da pista
  if (state.offTrack) {
    state.offTrackTimer += dt;
    if (state.offTrackTimer >= 2) {
      respawnOnTrack();
      return;
    }
  } else {
    state.offTrackTimer = 0;
  }

  // Sentido contrário: dot da velocidade real com tangente da pista
  const speed = state.velocity;
  if (Math.abs(speed) > 1.5) {
    const t = nearestSampleT(state.car.position.x, state.car.position.z);
    const tangent = state.centerCurve.getTangent(t);
    // forward do carro multiplicado pela velocidade dá direção real do movimento
    const fwd = new THREE.Vector3(0, 0, -1).applyQuaternion(state.car.quaternion);
    const moveX = fwd.x * speed, moveZ = fwd.z * speed;
    const dot = moveX * tangent.x + moveZ * tangent.z;
    state.wrongWay = dot < -0.5;
  } else {
    state.wrongWay = false;
  }

  if (state.wrongWay) {
    state.wrongWayTimer += dt;
    msgEl.classList.add('show');
    if (state.wrongWayTimer >= 4) {
      respawnOnTrack();
      return;
    }
  } else {
    state.wrongWayTimer = 0;
    msgEl.classList.remove('show');
  }
}

function updateLapTimer() {
  const el = document.getElementById('active-lap');
  if (!el) return;
  const ms = state.lapState === 'running'
    ? performance.now() - state.lapStartTime
    : 0;
  el.textContent = formatLapTime(ms);
}

function appendCompletedLap(ms) {
  const list = document.getElementById('past-laps');
  if (!list) return;
  const row = document.createElement('div');
  row.className = 'row';
  row.textContent = formatLapTime(ms);
  list.appendChild(row);
}

// ===== Fluxo de corrida =====
function resetGameState() {
  if (state.car && state.trackStart) {
    state.car.position.copy(state.trackStart.pos);
    state.car.rotation.y = state.trackStart.rot;
  }
  if (state.carModel) state.carModel.rotation.y = Math.PI;
  state.velocity = 0;
  state.steerAngle = 0;
  state.fallVelocity = 0;
  state.lapState = 'idle';
  state.lapStartTime = 0;
  state.lapMaxProgress = 0;
  state.completedLaps = [];
  state.offTrackTimer = 0;
  state.wrongWayTimer = 0;
  state.offTrack = false;
  state.wrongWay = false;
  clearTrail();
  // limpa lista de voltas anteriores no HUD
  const list = document.getElementById('past-laps');
  if (list) list.innerHTML = '';
  const active = document.getElementById('active-lap');
  if (active) active.textContent = formatLapTime(0);
  const wm = document.getElementById('wrong-way-msg');
  if (wm) wm.classList.remove('show');
}

function showStartScreen() {
  document.getElementById('screen-start').classList.remove('hidden');
  document.getElementById('screen-finish').classList.add('hidden');
  document.getElementById('screen-ranking').classList.add('hidden');
  document.getElementById('hud-lap-counter').classList.add('hidden');
  raceState.status = 'menu';
  resetGameState();
}

function startGame() {
  document.getElementById('screen-start').classList.add('hidden');
  document.getElementById('screen-finish').classList.add('hidden');
  document.getElementById('screen-ranking').classList.add('hidden');
  document.getElementById('hud-lap-counter').classList.remove('hidden');
  resetGameState();
  startRace();
  updateLapHUD();
  // O timer só vai começar de fato quando o jogador acelerar — lógica existente
}

function updateLapHUD() {
  const el = document.getElementById('hud-lap-num');
  if (el) el.textContent = String(raceState.currentLap);
}

function showFinishScreen() {
  document.getElementById('hud-lap-counter').classList.add('hidden');
  document.getElementById('screen-finish').classList.remove('hidden');

  document.getElementById('finish-total').textContent = formatTime(getTotalTime());
  document.getElementById('finish-best-lap').textContent = formatTime(getBestLap());

  const lapsDiv = document.getElementById('finish-laps');
  lapsDiv.innerHTML = '';
  const bestIdx = raceState.lapTimes.indexOf(getBestLap());
  raceState.lapTimes.forEach((time, i) => {
    const div = document.createElement('div');
    div.className = 'result-line';
    const star = i === bestIdx ? ' ⭐' : '';
    div.innerHTML = `<span>Volta ${i + 1}:${star}</span><strong>${formatTime(time)}</strong>`;
    lapsDiv.appendChild(div);
  });

  document.getElementById('finish-name-section').style.display = 'block';
  document.getElementById('finish-position').classList.add('hidden');
  document.getElementById('player-name').value = '';
  setTimeout(() => document.getElementById('player-name').focus(), 100);
}

function saveScore() {
  const name = document.getElementById('player-name').value.trim() || 'PILOTO';
  const totalTime = getTotalTime();
  const position = saveToRanking(name, totalTime, raceState.lapTimes);

  document.getElementById('finish-name-section').style.display = 'none';
  const posDiv = document.getElementById('finish-position');
  posDiv.classList.remove('hidden');
  if (position) {
    const medal = position === 1 ? '🥇' : position === 2 ? '🥈' : position === 3 ? '🥉' : '🏆';
    posDiv.innerHTML = `${medal} Você ficou em <strong>${position}º lugar</strong> no ranking!`;
  } else {
    posDiv.innerHTML = `Tempo registrado, mas não entrou no top 10. Tente de novo!`;
  }
}

function showRanking() {
  document.getElementById('screen-start').classList.add('hidden');
  document.getElementById('screen-ranking').classList.remove('hidden');
  const tbody = document.getElementById('ranking-body');
  const ranking = getRanking();
  tbody.innerHTML = '';
  if (ranking.length === 0) {
    tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;color:#666;">Nenhum tempo registrado ainda</td></tr>';
  } else {
    ranking.forEach((entry, i) => {
      const tr = document.createElement('tr');
      tr.innerHTML = `<td>${i + 1}</td><td>${entry.name}</td><td>${formatTime(entry.totalTime)}</td><td>${formatTime(entry.bestLap)}</td>`;
      tbody.appendChild(tr);
    });
  }
}

function setupMenuButtons() {
  document.getElementById('btn-play').addEventListener('click', startGame);
  document.getElementById('btn-show-ranking').addEventListener('click', showRanking);
  document.getElementById('btn-close-ranking').addEventListener('click', showStartScreen);
  document.getElementById('btn-save-score').addEventListener('click', saveScore);
  document.getElementById('btn-back-to-menu').addEventListener('click', showStartScreen);
  document.getElementById('player-name').addEventListener('keydown', (e) => {
    if (e.code === 'Enter') saveScore();
  });
}

function formatLapTime(ms) {
  const total = Math.max(0, Math.floor(ms));
  const minutes = Math.floor(total / 60000);
  const seconds = Math.floor((total % 60000) / 1000);
  const millis = total % 1000;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}:${String(millis).padStart(3, '0')}`;
}

function setupMinimap() {
  state.minimapCanvas = document.getElementById('minimap');
}

function updateMinimap() {
  if (!state.minimapCanvas || !state.car) return;
  drawMinimap(state.minimapCanvas, state.car.position, state.car.rotation.y);
}

function setupScene() {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x000000);
  scene.fog = null;

  // Luzes
  const ambient = new THREE.AmbientLight(0xffffff, 0.85);
  scene.add(ambient);

  const dir = new THREE.DirectionalLight(0xffffff, 0.7);
  dir.position.set(200, 400, 100);
  dir.castShadow = true;
  dir.shadow.mapSize.set(2048, 2048);
  const d = 80;
  dir.shadow.camera.left = -d;
  dir.shadow.camera.right = d;
  dir.shadow.camera.top = d;
  dir.shadow.camera.bottom = -d;
  dir.shadow.camera.near = 1;
  dir.shadow.camera.far = 2500;
  dir.shadow.bias = -0.0005;
  scene.add(dir);
  scene.add(dir.target);

  // Chão preto absoluto: MeshBasicMaterial não responde a luz/sombra/reflexo.
  const groundGeom = new THREE.PlaneGeometry(4000, 4000);
  const groundMat = new THREE.MeshBasicMaterial({ color: 0x000000 });
  const ground = new THREE.Mesh(groundGeom, groundMat);
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -16;
  ground.receiveShadow = false;
  scene.add(ground);
  state.ground = ground;

  // Renderer
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  document.getElementById('app').appendChild(renderer.domElement);

  state.scene = scene;
  state.renderer = renderer;
  state.ambient = ambient;
  state.sun = dir;
  state.directional = dir; // alias compat
}

function createCar() {
  // Cria o Group vazio imediatamente — física, câmera e raycast já podem
  // referenciar state.car desde o frame 0.
  const carGroup = new THREE.Group();
  state.scene.add(carGroup);
  state.car = carGroup;
  state.carBody = carGroup;

  const loader = new GLTFLoader();
  loader.load('./models/race.glb', (gltf) => {
    const model = gltf.scene;

    // Sombras (carrocaria recebe; nada projeta — coerente com o resto da cena)
    model.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = false;
        child.receiveShadow = true;
      }
    });

    // Pack do Kenney usa +Z como frente; nosso código assume -Z = frente.
    model.rotation.y = Math.PI;
    // Escala aproximada — modelos do Kenney vêm em ~1m, queremos carro de ~4m.
    model.scale.setScalar(1.6);
    // Pivot do GLB fica no chão entre as rodas — só pequeno offset pra
    // garantir que as rodas tocam o asfalto (raycast põe o group em hit.y + 0.1).
    model.position.y = 0;

    carGroup.add(model);
    state.carModel = model;

    // Tuning: body vermelho estilo F1, rodas pretas
    model.traverse((child) => {
      if (!child.isMesh || !child.material) return;
      if (child.name === 'body') {
        child.material = child.material.clone();
        child.material.color.set(0xd9201e);
        child.material.metalness = 0.25;
        child.material.roughness = 0.35;
      } else if (/wheel|tire|roda/i.test(child.name)) {
        child.material = child.material.clone();
        child.material.color.set(0x1a1a1a);
        child.material.metalness = 0.1;
        child.material.roughness = 0.85;
        if (child.material.map) child.material.map = null;
      }
    });

    // Identifica e envolve cada roda num pivot separado.
    // Pivot recebe o esterço (rotation.y); a mesh fica pro rolamento (rotation.x).
    // Sem isso, ambas rotações na mesma mesh geram efeito de tremor.
    const wheelMeshes = [];
    model.traverse((child) => {
      if (child.isMesh && /wheel|tire|roda/i.test(child.name)) {
        wheelMeshes.push(child);
      }
    });
    for (const wheel of wheelMeshes) {
      const pivot = new THREE.Group();
      pivot.position.copy(wheel.position);
      wheel.parent.add(pivot);
      wheel.position.set(0, 0, 0);
      pivot.add(wheel); // remove do parent antigo automaticamente

      // Detalhe visual: 1 spokes group apenas no lado externo (interno fica oculto)
      const detail = buildWheelDetail();
      detail.rotation.y = -Math.PI / 2;
      detail.position.x = 0.13;
      wheel.add(detail);

      state.allWheels.push(wheel);
      if (/front|frente/i.test(wheel.name)) {
        state.frontWheels.push(pivot);
      }
    }
  }, undefined, (err) => {
    console.error('Falha carregando race.glb:', err);
  });
}

function buildWheelDetail() {
  // Reusa geometrias e materiais compartilhados — não cria novas instâncias.
  const group = new THREE.Group();

  const disc = new THREE.Mesh(_wheelDiscGeom, _wheelDiscMat);
  group.add(disc);

  for (let i = 0; i < 4; i++) {
    const spoke = new THREE.Mesh(_wheelSpokeGeom, _wheelSpokeMat);
    spoke.rotation.z = (i * Math.PI) / 4;
    spoke.position.z = 0.001;
    group.add(spoke);
  }

  const hub = new THREE.Mesh(_wheelHubGeom, _wheelHubMat);
  hub.position.z = 0.011;
  group.add(hub);

  const blur = new THREE.Mesh(_wheelBlurGeom, _wheelBlurMat);
  blur.position.z = 0.012;
  group.add(blur);

  return group;
}

function setupCameras() {
  const aspect = window.innerWidth / window.innerHeight;

  const persp = new THREE.PerspectiveCamera(60, aspect, 0.1, 3000);
  persp.position.set(0, 5, 10);

  const h = state.orthoHeight;
  const ortho = new THREE.OrthographicCamera(-h * aspect, h * aspect, h, -h, 0.1, 3000);
  ortho.position.set(0, 60, 0);
  ortho.lookAt(0, 0, 0);

  state.cameraPersp = persp;
  state.cameraOrtho = ortho;
  state.activeCamera = persp;
}

function setupControls() {
  const map = {
    ArrowUp: 'up',
    ArrowDown: 'down',
    ArrowLeft: 'left',
    ArrowRight: 'right',
  };
  window.addEventListener('keydown', (e) => {
    if (map[e.code]) { state.keys[map[e.code]] = true; e.preventDefault(); }
  });
  window.addEventListener('keyup', (e) => {
    if (map[e.code]) { state.keys[map[e.code]] = false; e.preventDefault(); }
  });
  document.getElementById('reset-view-btn').addEventListener('click', resetView);

  // Drag do mouse para orbitar a câmera ao redor do carro
  const canvas = state.renderer.domElement;
  canvas.style.cursor = 'grab';
  const onDown = (x, y) => {
    state.dragging = true;
    state.lastMouse.x = x;
    state.lastMouse.y = y;
    canvas.style.cursor = 'grabbing';
  };
  const onMove = (x, y) => {
    if (!state.dragging) return;
    const dx = x - state.lastMouse.x;
    const dy = y - state.lastMouse.y;
    state.lastMouse.x = x;
    state.lastMouse.y = y;
    state.userYaw -= dx * 0.005;
    state.userPitch -= dy * 0.005;
    state.userPitch = Math.max(-0.35, Math.min(1.1, state.userPitch));
    showResetButton();
  };
  const onUp = () => {
    state.dragging = false;
    canvas.style.cursor = 'grab';
  };
  canvas.addEventListener('mousedown', (e) => onDown(e.clientX, e.clientY));
  window.addEventListener('mousemove', (e) => onMove(e.clientX, e.clientY));
  window.addEventListener('mouseup', onUp);
  canvas.addEventListener('touchstart', (e) => {
    if (e.touches.length === 1) onDown(e.touches[0].clientX, e.touches[0].clientY);
  }, { passive: true });
  window.addEventListener('touchmove', (e) => {
    if (e.touches.length === 1) onMove(e.touches[0].clientX, e.touches[0].clientY);
  }, { passive: true });
  window.addEventListener('touchend', onUp);

  // Zoom com a roda do mouse
  canvas.addEventListener('wheel', (e) => {
    e.preventDefault();
    const factor = Math.exp(e.deltaY * 0.001);
    state.zoom3D = Math.max(0.4, Math.min(3, state.zoom3D * factor));
    if (Math.abs(state.zoom3D - 1) > 0.01) showResetButton();
  }, { passive: false });
}

function showResetButton() {
  const btn = document.getElementById('reset-view-btn');
  if (btn) btn.style.display = '';
}

function resetView() {
  state.userYaw = 0;
  state.userPitch = 0;
  state.zoom3D = 1;
  const btn = document.getElementById('reset-view-btn');
  if (btn) btn.style.display = 'none';
}

function collides(x, z, r) {
  for (let i = 0; i < state.colliders.length; i++) {
    const c = state.colliders[i];
    if (x + r > c.minX && x - r < c.maxX && z + r > c.minZ && z - r < c.maxZ) return true;
  }
  return false;
}

function updateCar(dt) {
  // Bloqueia física fora do estado de corrida (menu, fim, ranking)
  if (raceState.status !== 'racing') return;
  const k = state.keys;

  // Inicia o cronômetro na primeira aceleração
  if (state.lapState === 'idle' && k.up) {
    state.lapState = 'running';
    state.lapStartTime = performance.now();
    state.lapMaxProgress = 0;
    if (raceState.status !== 'racing') startRace(); // fallback
  }

  // Lentidão combinada fora da pista: aceleração reduzida, atrito maior,
  // velocidade máxima reduzida. Jogador ainda pode voltar por força bruta
  // antes do respawn de 2s.
  const OFF_TRACK_MAX_SPEED_MULT = 0.40;
  const OFF_TRACK_ACCEL_MULT     = 0.50;
  const OFF_TRACK_FRICTION_MULT  = 4.0;   // atrito 4x mais forte
  const accelMul = state.offTrack ? OFF_TRACK_ACCEL_MULT : 1.0;
  const frictionMul = state.offTrack ? OFF_TRACK_FRICTION_MULT : 1.0;
  const speedCap = state.offTrack ? state.maxSpeed * OFF_TRACK_MAX_SPEED_MULT : state.maxSpeed;

  // Aceleração / freio / ré
  if (k.up) {
    state.velocity += state.acceleration * accelMul * dt;
  } else if (k.down) {
    if (state.velocity > 0) {
      state.velocity -= state.brakeDecel * dt;
    } else {
      state.velocity -= state.acceleration * 0.7 * dt;
    }
  } else {
    const f = state.friction * frictionMul * dt;
    if (state.velocity > 0) state.velocity = Math.max(0, state.velocity - f);
    else if (state.velocity < 0) state.velocity = Math.min(0, state.velocity + f);
  }
  // Se já estava acima do speedCap (entrou rápido na grama), aplica drag em
  // vez de cortar bruscamente. Caso contrário, clamp normal.
  if (state.offTrack && state.velocity > speedCap) {
    state.velocity *= 0.92; // drag mais forte na grama
  } else {
    state.velocity = Math.max(-state.maxReverseSpeed, Math.min(speedCap, state.velocity));
  }

  // Esterço
  let targetSteer = 0;
  if (k.left) targetSteer = state.maxSteer;
  else if (k.right) targetSteer = -state.maxSteer;

  const steerLerp = (targetSteer === 0 ? state.steerReturn : state.steerSpeed) * dt;
  state.steerAngle += (targetSteer - state.steerAngle) * Math.min(1, steerLerp);

  if (Math.abs(state.velocity) > 0.05) {
    const speedFactor = Math.min(1, Math.abs(state.velocity) / 6);
    const dir = state.velocity >= 0 ? 1 : -1;
    state.car.rotation.y += state.steerAngle * speedFactor * dir * dt * 1.6;
  }

  // Movimento (-Z local é frente)
  const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(state.car.quaternion);
  const dx = forward.x * state.velocity * dt;
  const dz = forward.z * state.velocity * dt;
  const r = state.carRadius;
  let blocked = false;

  const newX = state.car.position.x + dx;
  if (!collides(newX, state.car.position.z, r)) {
    state.car.position.x = newX;
  } else {
    blocked = true;
  }
  const newZ = state.car.position.z + dz;
  if (!collides(state.car.position.x, newZ, r)) {
    state.car.position.z = newZ;
  } else {
    blocked = true;
  }
  if (blocked) state.velocity = 0;

  // Rodas dianteiras (esterço) — aplicado nos pivots que envolvem cada roda
  for (const pivot of state.frontWheels) pivot.rotation.y = state.steerAngle;

  // Giro das rodas
  const spin = state.velocity * dt / 0.35;
  for (const w of state.allWheels) w.rotation.x += spin;

  // Motion blur — material compartilhado: 1 atribuição cobre todas as rodas
  _wheelBlurMat.opacity = Math.min(0.7, Math.abs(state.velocity) / state.maxSpeed * 0.9);

  // Detecção de volta completa: registra o tempo, mostra na lista e reinicia
  // o cronômetro pra próxima volta (lapState segue 'running').
  if (state.lapState === 'running' && state.curveSamples) {
    const carT = nearestSampleT(state.car.position.x, state.car.position.z);
    const progress = (carT - state.startT + 1) % 1;
    if (progress > state.lapMaxProgress) state.lapMaxProgress = progress;
    if (state.lapMaxProgress > 0.6 && progress < 0.04) {
      const now = performance.now();
      const lapMs = now - state.lapStartTime;
      state.completedLaps.push(lapMs);
      appendCompletedLap(lapMs);
      state.lapStartTime = now;
      state.lapMaxProgress = 0;
      // Hook do fluxo de corrida (3 voltas)
      const result = registerLapCompleted(lapMs);
      if (result === 'finished') {
        showFinishScreen();
      } else if (result === 'continue') {
        updateLapHUD();
      }
    }
  }

  // Cola o carro na pista com transição suave em saltos verticais grandes.
  // Histerese (debounce 3 frames) na flag offTrack — elimina flicker que
  // alimentava o updateTrail com dezenas de segmentos por segundo.
  if (state.trackMesh) {
    _rayOrigin.set(state.car.position.x, state.car.position.y + 50, state.car.position.z);
    _ray.set(_rayOrigin, _rayDown);
    const hits = _ray.intersectObject(state.trackMesh, false);
    const rawOnTrack = hits.length > 0;

    if (state.offTrackCounter == null) state.offTrackCounter = 0;
    if (rawOnTrack) {
      state.offTrackCounter = Math.min(0, state.offTrackCounter + 1);
    } else {
      state.offTrackCounter = Math.max(-3, state.offTrackCounter - 1);
    }
    if (state.offTrackCounter >= 0) state.offTrack = false;
    else if (state.offTrackCounter <= -3) state.offTrack = true;
    // Entre -1 e -2: mantém estado anterior (zona de histerese)

    // Aplica Y sempre que o ray bater, independente da flag debounced
    if (rawOnTrack) {
      const targetY = hits[0].point.y + 0.1;
      const dy = targetY - state.car.position.y;
      if (Math.abs(dy) < 0.5) {
        state.car.position.y = targetY;
      } else {
        state.car.position.y += dy * 0.15;
      }
    }
  }

  // Sombra direcional acompanha o carro
  if (state.sun) {
    state.sun.position.set(
      state.car.position.x + 20,
      state.car.position.y + 40,
      state.car.position.z + 20
    );
    state.sun.target.position.copy(state.car.position);
    state.sun.target.updateMatrixWorld();
  }
}

const _camTargetPos = new THREE.Vector3();
const _camLookTarget = new THREE.Vector3();
const _yAxis = new THREE.Vector3(0, 1, 0);
const _isoOffset = new THREE.Vector3(60, 55, 60);

function updateCamera(dt) {
  const car = state.car;

  const offset3D = state.camOffset3D.clone().multiplyScalar(state.zoom3D);
  offset3D.applyEuler(new THREE.Euler(state.userPitch, state.userYaw, 0, 'YXZ'));
  offset3D.applyQuaternion(car.quaternion);
  const desired3D = car.position.clone().add(offset3D);
  const lookAt3D = car.position.clone().add(state.camLookAhead);

  const t = 1 - Math.pow(0.001, dt);

  state.cameraPersp.position.lerp(desired3D, t);
  _camLookTarget.copy(state.cameraPersp.userData.look || lookAt3D);
  _camLookTarget.lerp(lookAt3D, t);
  state.cameraPersp.userData.look = _camLookTarget.clone();
  state.cameraPersp.lookAt(_camLookTarget);
  state.activeCamera = state.cameraPersp;
}

function onResize() {
  const w = window.innerWidth;
  const h = window.innerHeight;
  const aspect = w / h;
  state.renderer.setSize(w, h);
  state.cameraPersp.aspect = aspect;
  state.cameraPersp.updateProjectionMatrix();
}

function animate() {
  requestAnimationFrame(animate);
  const dt = Math.min(0.05, clock.getDelta());
  updateCar(dt);
  updateTrackRules(dt);
  if (state.car) updateTrail(state.offTrack, state.car, dt);
  updateCamera(dt);
  updateMinimap();
  updateLapTimer();

  // FPS counter
  state.fpsAccum.frames++;
  state.fpsAccum.time += dt;
  if (state.fpsAccum.time >= 0.5) {
    const fps = Math.round(state.fpsAccum.frames / state.fpsAccum.time);
    const fpsEl = document.getElementById('fps');
    if (fpsEl) fpsEl.textContent = `FPS: ${fps}`;
    state.fpsAccum.frames = 0;
    state.fpsAccum.time = 0;
  }

  state.renderer.render(state.scene, state.activeCamera);
}

init();
