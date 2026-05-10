// =============================================================
// main.js — ядро: сцена, физика, мир, игрок, UI, день/ночь
// =============================================================
import * as THREE from 'three';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';
import * as CANNON from 'cannon-es';

// ---------- Глобальный контекст игры (доступен другим модулям) ----------
const GAME = (window.GAME = window.GAME || {});
GAME.THREE = THREE;
GAME.CANNON = CANNON;
GAME.listeners = GAME.listeners || {};
GAME.on = (ev, fn) => ((GAME.listeners[ev] = GAME.listeners[ev] || []).push(fn));
GAME.emit = (ev, ...a) => (GAME.listeners[ev] || []).forEach(fn => fn(...a));

// =============================================================
// ПРОЦЕДУРНЫЕ ТЕКСТУРЫ (Canvas 512×512)
// =============================================================
function makeCanvasTexture(draw, size = 512) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const ctx = c.getContext('2d');
  draw(ctx, size);
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.anisotropy = 4;
  return tex;
}
const TEX = {
  grass: makeCanvasTexture((ctx, s) => {
    ctx.fillStyle = '#3d6a2a'; ctx.fillRect(0, 0, s, s);
    for (let i = 0; i < 4000; i++) {
      ctx.fillStyle = `rgba(${40 + Math.random() * 60 | 0},${80 + Math.random() * 80 | 0},${30 + Math.random() * 50 | 0},${0.3 + Math.random() * 0.7})`;
      ctx.fillRect(Math.random() * s, Math.random() * s, 2, 2);
    }
  }),
  snow: makeCanvasTexture((ctx, s) => {
    ctx.fillStyle = '#ecf2f5'; ctx.fillRect(0, 0, s, s);
    for (let i = 0; i < 3000; i++) {
      ctx.fillStyle = `rgba(255,255,255,${0.3 + Math.random() * 0.7})`;
      ctx.fillRect(Math.random() * s, Math.random() * s, 1 + Math.random() * 2, 1 + Math.random() * 2);
    }
    for (let i = 0; i < 200; i++) {
      ctx.fillStyle = `rgba(190,210,220,${0.15})`;
      ctx.beginPath(); ctx.arc(Math.random() * s, Math.random() * s, 8 + Math.random() * 16, 0, 6.28); ctx.fill();
    }
  }),
  sand: makeCanvasTexture((ctx, s) => {
    ctx.fillStyle = '#c9a96b'; ctx.fillRect(0, 0, s, s);
    for (let i = 0; i < 6000; i++) {
      ctx.fillStyle = `rgba(${180 + Math.random() * 50 | 0},${140 + Math.random() * 40 | 0},${80 + Math.random() * 40 | 0},${0.2 + Math.random() * 0.6})`;
      ctx.fillRect(Math.random() * s, Math.random() * s, 1 + Math.random() * 2, 1);
    }
  }),
};
GAME.TEX = TEX;

// =============================================================
// THREE.js сцена / рендер / камера
// =============================================================
const canvas = document.getElementById('game');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb);
scene.fog = new THREE.Fog(0x87ceeb, 100, 400);

const camera = new THREE.PerspectiveCamera(90, innerWidth / innerHeight, 0.1, 1000);
camera.position.set(0, 1.7, 0);

GAME.scene = scene;
GAME.camera = camera;
GAME.renderer = renderer;

addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});

// =============================================================
// ОСВЕЩЕНИЕ (день/ночь)
// =============================================================
const ambient = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambient);

const sun = new THREE.DirectionalLight(0xfff2cc, 1.0);
sun.castShadow = true;
sun.shadow.mapSize.set(1024, 1024);
sun.shadow.camera.left = -60;
sun.shadow.camera.right = 60;
sun.shadow.camera.top = 60;
sun.shadow.camera.bottom = -60;
scene.add(sun);
scene.add(sun.target);

GAME.ambient = ambient;
GAME.sun = sun;

// =============================================================
// ФИЗИКА
// =============================================================
const world = new CANNON.World({ gravity: new CANNON.Vec3(0, -20, 0) });
world.broadphase = new CANNON.NaiveBroadphase();
world.solver.iterations = 8;

const matGround = new CANNON.Material('ground');
const matPlayer = new CANNON.Material('player');
world.addContactMaterial(new CANNON.ContactMaterial(matGround, matPlayer, {
  friction: 0.0, restitution: 0.0,
}));

GAME.world = world;
GAME.matGround = matGround;
GAME.matPlayer = matPlayer;

// =============================================================
// МИР — ГЕНЕРАЦИЯ (500×500м)
// =============================================================
const WORLD_SIZE = 500;
const worldGroup = new THREE.Group();
scene.add(worldGroup);
const worldPhysics = []; // cannon bodies относящиеся к карте

function clearWorld() {
  while (worldGroup.children.length) {
    const c = worldGroup.children.pop();
    c.geometry?.dispose?.();
    if (Array.isArray(c.material)) c.material.forEach(m => m.dispose());
    else c.material?.dispose?.();
  }
  worldPhysics.forEach(b => world.removeBody(b));
  worldPhysics.length = 0;
}

function buildGround(type) {
  clearWorld();
  const segs = (type === 'hills') ? 64 : 2;
  const geom = new THREE.PlaneGeometry(WORLD_SIZE, WORLD_SIZE, segs, segs);
  geom.rotateX(-Math.PI / 2);

  // Высоты для холмов (простой псевдошум)
  if (type === 'hills') {
    const pos = geom.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i), z = pos.getZ(i);
      const h = Math.sin(x * 0.05) * 1.5 + Math.cos(z * 0.06) * 1.5 + Math.sin((x + z) * 0.03) * 2;
      pos.setY(i, h);
    }
    geom.computeVertexNormals();
  }

  let tex, color;
  if (type === 'snow') { tex = TEX.snow; color = 0xffffff; }
  else if (type === 'desert') { tex = TEX.sand; color = 0xd9b87a; }
  else { tex = TEX.grass; color = 0x7ab84a; }
  tex.repeat.set(50, 50);

  const mat = new THREE.MeshLambertMaterial({ map: tex, color });
  const ground = new THREE.Mesh(geom, mat);
  ground.receiveShadow = true;
  worldGroup.add(ground);

  // Физика земли — плоскость (для холмов тоже плоская, чтобы не проваливаться)
  const body = new CANNON.Body({ mass: 0, material: matGround });
  body.addShape(new CANNON.Plane());
  body.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 2);
  world.addBody(body);
  worldPhysics.push(body);

  // Трава
  if (type !== 'snow' && type !== 'desert') addGrass(2000);
  else if (type === 'desert') addDesertDetails();
  else if (type === 'snow') addSnowDetails();

  // Небо по типу карты
  if (type === 'snow') { scene.background = new THREE.Color(0xbcd0df); scene.fog.color.set(0xbcd0df); }
  else if (type === 'desert') { scene.background = new THREE.Color(0xf0c87a); scene.fog.color.set(0xf0c87a); }
  else { scene.background = new THREE.Color(0x87ceeb); scene.fog.color.set(0x87ceeb); }
}

// ---------- Объёмная трава: 2000 плоскостей ----------
let grassMesh = null;
const grassOffsets = [];
function addGrass(count) {
  const geom = new THREE.PlaneGeometry(0.2, 0.5);
  geom.translate(0, 0.25, 0);
  const mat = new THREE.MeshBasicMaterial({
    color: 0x4a8a2a, side: THREE.DoubleSide, transparent: true, alphaTest: 0.3,
  });
  grassMesh = new THREE.InstancedMesh(geom, mat, count);
  grassMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  const dummy = new THREE.Object3D();
  grassOffsets.length = 0;
  for (let i = 0; i < count; i++) {
    const x = (Math.random() - 0.5) * WORLD_SIZE * 0.9;
    const z = (Math.random() - 0.5) * WORLD_SIZE * 0.9;
    dummy.position.set(x, 0, z);
    dummy.rotation.y = Math.random() * Math.PI;
    dummy.scale.set(1, 0.8 + Math.random() * 0.6, 1);
    dummy.updateMatrix();
    grassMesh.setMatrixAt(i, dummy.matrix);
    grassOffsets.push({ base: dummy.matrix.clone(), phase: Math.random() * Math.PI * 2, x, z });
  }
  grassMesh.instanceMatrix.needsUpdate = true;
  worldGroup.add(grassMesh);
}

function addDesertDetails() {
  // Камни — серые сферы
  for (let i = 0; i < 60; i++) {
    const r = 0.5 + Math.random() * 1.5;
    const rock = new THREE.Mesh(
      new THREE.SphereGeometry(r, 8, 6),
      new THREE.MeshLambertMaterial({ color: 0x7a7a7a }),
    );
    rock.position.set((Math.random() - 0.5) * WORLD_SIZE * 0.9, r * 0.5, (Math.random() - 0.5) * WORLD_SIZE * 0.9);
    rock.scale.y = 0.7;
    rock.castShadow = true;
    worldGroup.add(rock);
  }
  // Кактусы — зелёные цилиндры
  for (let i = 0; i < 40; i++) {
    const h = 1.2 + Math.random() * 2;
    const cactus = new THREE.Mesh(
      new THREE.CylinderGeometry(0.15, 0.2, h, 8),
      new THREE.MeshLambertMaterial({ color: 0x3a7a3a }),
    );
    cactus.position.set((Math.random() - 0.5) * WORLD_SIZE * 0.9, h / 2, (Math.random() - 0.5) * WORLD_SIZE * 0.9);
    cactus.castShadow = true;
    worldGroup.add(cactus);
  }
}

function addSnowDetails() {
  // Ёлки (конусы)
  for (let i = 0; i < 80; i++) {
    const tree = new THREE.Group();
    const trunk = new THREE.Mesh(
      new THREE.CylinderGeometry(0.15, 0.2, 1, 6),
      new THREE.MeshLambertMaterial({ color: 0x5a3a1a }),
    );
    trunk.position.y = 0.5;
    const top = new THREE.Mesh(
      new THREE.ConeGeometry(0.9, 2.5, 8),
      new THREE.MeshLambertMaterial({ color: 0x2a5a3a }),
    );
    top.position.y = 1.8;
    tree.add(trunk); tree.add(top);
    tree.position.set((Math.random() - 0.5) * WORLD_SIZE * 0.9, 0, (Math.random() - 0.5) * WORLD_SIZE * 0.9);
    tree.castShadow = true;
    worldGroup.add(tree);
  }
}

// =============================================================
// ИГРОК: физическое тело + FPS-контроллер
// =============================================================
const player = {
  body: null,
  height: 1.8,
  radius: 0.4,
  speed: 5,
  runSpeed: 8,
  crouchSpeed: 2,
  jumpForce: 8,
  onGround: false,
  crouching: false,
  running: false,
  noclip: false,
  god: false,
  hp: 100, maxHp: 100,
  hunger: 100, thirst: 100,
  vel: new THREE.Vector3(),
};
GAME.player = player;

function createPlayerBody(x = 0, z = 0) {
  const body = new CANNON.Body({
    mass: 70, shape: new CANNON.Sphere(player.radius),
    material: matPlayer, linearDamping: 0.9, fixedRotation: true,
  });
  body.position.set(x, 5, z);
  world.addBody(body);
  player.body = body;

  body.addEventListener('collide', (e) => {
    const contact = e.contact;
    const ny = contact.ni.y;
    // Столкновение с полом (нормаль смотрит вверх от игрока)
    if (contact.bi === body) {
      if (-ny > 0.5) player.onGround = true;
    } else if (ny > 0.5) player.onGround = true;
  });
}

// --- Pointer lock + ввод ---
const controls = new PointerLockControls(camera, document.body);
scene.add(controls.getObject());
GAME.controls = controls;

const keys = {};
addEventListener('keydown', (e) => {
  keys[e.code] = true;
  // Console toggle
  if (e.code === 'F1') { e.preventDefault(); toggleConsole(); return; }
  if (e.code === 'KeyG' && !isTyping()) toggleBigMap();
  if (e.code === 'Tab' && !isTyping()) { e.preventDefault(); GAME.emit('toggleInventory'); }
  if (e.code === 'Space' && player.onGround && !player.noclip && controls.isLocked) {
    player.body.velocity.y = player.jumpForce;
    player.onGround = false;
  }
});
addEventListener('keyup', (e) => { keys[e.code] = false; });

function isTyping() {
  const a = document.activeElement;
  return a && (a.tagName === 'INPUT' || a.tagName === 'TEXTAREA');
}

canvas.addEventListener('click', () => {
  if (document.getElementById('menu').style.display === 'none') controls.lock();
});

// =============================================================
// TOOLTIP (raycaster — смотрит на интерактивные объекты)
// =============================================================
const tooltipEl = document.getElementById('tooltip');
const raycaster = new THREE.Raycaster();
raycaster.far = 4;
GAME.raycaster = raycaster;

function updateTooltip() {
  raycaster.setFromCamera({ x: 0, y: 0 }, camera);
  const hits = raycaster.intersectObjects(scene.children, true);
  let found = null;
  for (const h of hits) {
    let o = h.object;
    while (o && !o.userData?.interactable) o = o.parent;
    if (o) { found = o; break; }
  }
  if (found) {
    tooltipEl.style.display = 'block';
    tooltipEl.textContent = found.userData.tooltip || 'Нажми E';
  } else {
    tooltipEl.style.display = 'none';
  }
  GAME.lookTarget = found;
}

addEventListener('keydown', (e) => {
  if (e.code === 'KeyE' && controls.isLocked && GAME.lookTarget) {
    GAME.emit('interact', GAME.lookTarget);
  }
});

// =============================================================
// МИНИКАРТА
// =============================================================
const miniCanvas = document.getElementById('minimap');
const miniCtx = miniCanvas.getContext('2d');

function drawMinimap() {
  const S = 150;
  miniCtx.fillStyle = '#0a3a0a';
  miniCtx.fillRect(0, 0, S, S);
  // Сетка 5×5
  miniCtx.strokeStyle = 'rgba(255,255,255,0.35)';
  miniCtx.lineWidth = 1;
  for (let i = 1; i < 5; i++) {
    miniCtx.beginPath(); miniCtx.moveTo((S / 5) * i, 0); miniCtx.lineTo((S / 5) * i, S); miniCtx.stroke();
    miniCtx.beginPath(); miniCtx.moveTo(0, (S / 5) * i); miniCtx.lineTo(S, (S / 5) * i); miniCtx.stroke();
  }
  // Игрок — красная точка
  const px = ((player.body?.position.x ?? 0) / WORLD_SIZE + 0.5) * S;
  const pz = ((player.body?.position.z ?? 0) / WORLD_SIZE + 0.5) * S;
  miniCtx.fillStyle = '#ff2a2a';
  miniCtx.beginPath(); miniCtx.arc(px, pz, 3.5, 0, 6.28); miniCtx.fill();
  // Направление взгляда
  const dir = new THREE.Vector3(); camera.getWorldDirection(dir);
  miniCtx.strokeStyle = '#fff';
  miniCtx.beginPath(); miniCtx.moveTo(px, pz); miniCtx.lineTo(px + dir.x * 10, pz + dir.z * 10); miniCtx.stroke();
}

// =============================================================
// БОЛЬШАЯ КАРТА (G)
// =============================================================
const mapOverlay = document.getElementById('map-overlay');
const mapCanvas = document.getElementById('map-canvas');
const mapCtx = mapCanvas.getContext('2d');

function drawBigMap() {
  const S = mapCanvas.width;
  mapCtx.fillStyle = '#0a3a0a';
  mapCtx.fillRect(0, 0, S, S);
  mapCtx.strokeStyle = 'rgba(255,255,255,0.5)';
  mapCtx.lineWidth = 2;
  for (let i = 0; i <= 5; i++) {
    mapCtx.beginPath(); mapCtx.moveTo((S / 5) * i, 0); mapCtx.lineTo((S / 5) * i, S); mapCtx.stroke();
    mapCtx.beginPath(); mapCtx.moveTo(0, (S / 5) * i); mapCtx.lineTo(S, (S / 5) * i); mapCtx.stroke();
  }
  mapCtx.font = 'bold 22px Consolas';
  mapCtx.fillStyle = '#fff';
  const letters = ['A', 'B', 'C', 'D', 'E'];
  for (let r = 0; r < 5; r++) for (let c = 0; c < 5; c++) {
    mapCtx.fillText(letters[c] + (r + 1), c * (S / 5) + 10, r * (S / 5) + 28);
  }
  // Игрок
  const px = ((player.body?.position.x ?? 0) / WORLD_SIZE + 0.5) * S;
  const pz = ((player.body?.position.z ?? 0) / WORLD_SIZE + 0.5) * S;
  mapCtx.fillStyle = '#ff2a2a';
  mapCtx.beginPath(); mapCtx.arc(px, pz, 7, 0, 6.28); mapCtx.fill();
}

function toggleBigMap() {
  const open = mapOverlay.classList.toggle('open');
  if (open) { controls.unlock(); drawBigMap(); }
}

// =============================================================
// КОНСОЛЬ (F1)
// =============================================================
const consoleEl = document.getElementById('console');
const consoleLog = document.getElementById('console-log');
const consoleInput = document.getElementById('console-input');

function logConsole(msg) {
  const line = document.createElement('div');
  line.textContent = '> ' + msg;
  consoleLog.appendChild(line);
  consoleLog.scrollTop = consoleLog.scrollHeight;
}
GAME.logConsole = logConsole;

function toggleConsole() {
  const open = consoleEl.classList.toggle('open');
  if (open) { controls.unlock(); consoleInput.focus(); }
  else { consoleInput.blur(); }
}

consoleInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    const cmd = consoleInput.value.trim().toLowerCase();
    consoleInput.value = '';
    if (!cmd) return;
    logConsole(cmd);
    if (cmd === 'noclip') {
      player.noclip = !player.noclip;
      player.body.type = player.noclip ? CANNON.Body.KINEMATIC : CANNON.Body.DYNAMIC;
      if (!player.noclip) player.body.velocity.set(0, 0, 0);
      logConsole('noclip: ' + player.noclip);
    } else if (cmd === 'god') {
      player.god = !player.god;
      logConsole('god: ' + player.god);
    } else if (cmd === 'help') {
      logConsole('Команды: noclip, god, help');
    } else {
      logConsole('Неизвестная команда');
    }
  } else if (e.key === 'Escape') {
    toggleConsole();
  }
});

// =============================================================
// ДЕНЬ/НОЧЬ
// =============================================================
// Цикл: день 10 минут + ночь 5 минут = 15 минут = 900 сек
const DAY_SEC = 600, NIGHT_SEC = 300;
const CYCLE_SEC = DAY_SEC + NIGHT_SEC;
let gameTime = DAY_SEC * 0.25; // старт утром

function updateDayNight(dt) {
  gameTime = (gameTime + dt) % CYCLE_SEC;
  const t01 = gameTime / CYCLE_SEC; // 0..1
  const angle = t01 * Math.PI * 2 - Math.PI / 2; // солнце по кругу
  const R = 100;
  sun.position.set(Math.cos(angle) * R, Math.sin(angle) * R, 30);
  sun.target.position.set(0, 0, 0);

  // Интенсивность: 0 ночью, 1 днём
  const dayFactor = Math.max(0, Math.sin(angle + Math.PI / 2));
  sun.intensity = dayFactor * 1.0;
  ambient.intensity = 0.15 + dayFactor * 0.5;

  // Небо темнее ночью
  const skyDay = new THREE.Color(0x87ceeb);
  const skyNight = new THREE.Color(0x0a0f20);
  const sky = skyNight.clone().lerp(skyDay, dayFactor);
  scene.background = sky;
  scene.fog.color.copy(sky);

  // HH:MM для UI
  const total24 = t01 * 24;
  const hh = Math.floor(total24).toString().padStart(2, '0');
  const mm = Math.floor((total24 - Math.floor(total24)) * 60).toString().padStart(2, '0');
  document.getElementById('time-display').textContent = `${hh}:${mm}`;
}

// =============================================================
// МЕНЮ ВЫБОРА КАРТЫ
// =============================================================
let selectedMap = 'flat';
document.querySelectorAll('.map-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.map-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    selectedMap = btn.dataset.map;
  });
});

document.getElementById('start-btn').addEventListener('click', () => {
  startGame(selectedMap);
});

function startGame(mapType) {
  document.getElementById('menu').style.display = 'none';
  buildGround(mapType);
  createPlayerBody(0, 0);
  GAME.emit('gameStart', mapType);
  controls.lock();
}

// =============================================================
// ГЛАВНЫЙ ЦИКЛ
// =============================================================
const clock = new THREE.Clock();
let fpsAcc = 0, fpsCount = 0, fpsLast = performance.now();

function loop() {
  const dt = Math.min(clock.getDelta(), 0.1);
  const now = performance.now();
  fpsCount++; fpsAcc += dt;
  if (now - fpsLast > 500) {
    document.getElementById('fps-display').textContent = 'FPS: ' + Math.round(fpsCount / fpsAcc);
    fpsAcc = 0; fpsCount = 0; fpsLast = now;
  }

  // Физика
  if (player.body) {
    const forward = new THREE.Vector3();
    camera.getWorldDirection(forward); forward.y = 0; forward.normalize();
    const right = new THREE.Vector3().crossVectors(forward, camera.up).normalize();

    const moveSpeed = player.running ? player.runSpeed : player.crouching ? player.crouchSpeed : player.speed;
    const input = new THREE.Vector3();
    if (keys['KeyW']) input.add(forward);
    if (keys['KeyS']) input.sub(forward);
    if (keys['KeyD']) input.add(right);
    if (keys['KeyA']) input.sub(right);
    input.normalize().multiplyScalar(moveSpeed);

    player.running = !!keys['ShiftLeft'] || !!keys['ShiftRight'];
    player.crouching = !!keys['ControlLeft'] || !!keys['ControlRight'];

    if (player.noclip) {
      const v = new THREE.Vector3().copy(input);
      if (keys['Space']) v.y += moveSpeed;
      if (player.crouching) v.y -= moveSpeed;
      player.body.position.x += v.x * dt;
      player.body.position.y += v.y * dt;
      player.body.position.z += v.z * dt;
      player.body.velocity.set(0, 0, 0);
    } else if (controls.isLocked) {
      player.body.velocity.x = input.x;
      player.body.velocity.z = input.z;
    } else {
      player.body.velocity.x = 0; player.body.velocity.z = 0;
    }

    world.step(1 / 60, dt, 3);

    // Камера привязана к телу
    const crouchDrop = player.crouching ? 0.5 : 0;
    camera.position.set(
      player.body.position.x,
      player.body.position.y + player.height / 2 - 0.1 - crouchDrop,
      player.body.position.z,
    );

    // Ограничения мира
    const half = WORLD_SIZE / 2 - 1;
    player.body.position.x = Math.max(-half, Math.min(half, player.body.position.x));
    player.body.position.z = Math.max(-half, Math.min(half, player.body.position.z));

    // Падение в мир
    if (player.body.position.y < -10) player.body.position.set(0, 5, 0);

    // Проверка "на земле" по скорости
    if (Math.abs(player.body.velocity.y) < 0.05) player.onGround = true;

    // Координаты
    const p = player.body.position;
    document.getElementById('coord-display').textContent = `${p.x.toFixed(1)}, ${p.y.toFixed(1)}, ${p.z.toFixed(1)}`;
  }

  // Покачивание травы
  if (grassMesh && grassOffsets.length) {
    const t = now * 0.001;
    const dummy = new THREE.Object3D();
    // Обновляем только первые 500 инстансов каждый кадр по очереди (экономия)
    const start = (fpsCount * 400) % grassOffsets.length;
    for (let i = 0; i < 400; i++) {
      const idx = (start + i) % grassOffsets.length;
      const g = grassOffsets[idx];
      const sway = Math.sin(t + g.phase) * 0.08;
      dummy.position.set(g.x, 0, g.z);
      dummy.rotation.set(0, g.phase, sway);
      dummy.updateMatrix();
      grassMesh.setMatrixAt(idx, dummy.matrix);
    }
    grassMesh.instanceMatrix.needsUpdate = true;
  }

  updateDayNight(dt);
  updateTooltip();
  drawMinimap();

  GAME.emit('frame', dt);

  renderer.render(scene, camera);
  requestAnimationFrame(loop);
}
loop();

// =============================================================
// Экспорт полезных хелперов для других модулей
// =============================================================
GAME.WORLD_SIZE = WORLD_SIZE;
GAME.worldGroup = worldGroup;
GAME.addMapInteractable = (mesh, tooltip) => {
  mesh.userData.interactable = true;
  mesh.userData.tooltip = tooltip || 'Нажми E';
};
