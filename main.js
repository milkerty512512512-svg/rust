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
// --- Простая функция шума для органичности текстур ---
function noise2D(x, y) {
  const n = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
  return n - Math.floor(n);
}
function smoothNoise(x, y) {
  const ix = Math.floor(x), iy = Math.floor(y);
  const fx = x - ix, fy = y - iy;
  const a = noise2D(ix, iy);
  const b = noise2D(ix + 1, iy);
  const c = noise2D(ix, iy + 1);
  const d = noise2D(ix + 1, iy + 1);
  return a * (1-fx)*(1-fy) + b * fx*(1-fy) + c * (1-fx)*fy + d * fx*fy;
}

const TEX = {
  // ======================================================
  // ТРАВА — реалистичная, 6 слоёв
  // ======================================================
  grass: makeCanvasTexture((ctx, s) => {
    // Слой 1: базовый градиент с шумом
    const img = ctx.createImageData(s, s);
    for (let y = 0; y < s; y++) {
      for (let x = 0; x < s; x++) {
        const n1 = smoothNoise(x * 0.03, y * 0.03);
        const n2 = smoothNoise(x * 0.1, y * 0.1) * 0.5;
        const n3 = smoothNoise(x * 0.3, y * 0.3) * 0.25;
        const n = n1 + n2 + n3;
        // Базовые оттенки зелёного
        const r = 40 + n * 40 | 0;
        const g = 80 + n * 70 | 0;
        const b = 25 + n * 35 | 0;
        const idx = (y * s + x) * 4;
        img.data[idx] = r;
        img.data[idx+1] = g;
        img.data[idx+2] = b;
        img.data[idx+3] = 255;
      }
    }
    ctx.putImageData(img, 0, 0);
    // Слой 2: тёмные пятна земли (где мало травы)
    for (let i = 0; i < 40; i++) {
      const x = Math.random()*s, y = Math.random()*s, r = 15 + Math.random()*35;
      const grd = ctx.createRadialGradient(x, y, 0, x, y, r);
      grd.addColorStop(0, `rgba(${50+Math.random()*20|0},${40+Math.random()*15|0},20,0.6)`);
      grd.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = grd;
      ctx.beginPath(); ctx.arc(x, y, r, 0, 6.28); ctx.fill();
    }
    // Слой 3: светлые пятна свежей травы
    for (let i = 0; i < 60; i++) {
      const x = Math.random()*s, y = Math.random()*s, r = 10 + Math.random()*25;
      const grd = ctx.createRadialGradient(x, y, 0, x, y, r);
      grd.addColorStop(0, `rgba(${100+Math.random()*50|0},${160+Math.random()*50|0},${50+Math.random()*30|0},0.5)`);
      grd.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = grd;
      ctx.beginPath(); ctx.arc(x, y, r, 0, 6.28); ctx.fill();
    }
    // Слой 4: Травинки (тонкие штрихи вверх)
    for (let i = 0; i < 800; i++) {
      const x = Math.random()*s, y = Math.random()*s;
      const h = 3 + Math.random()*7;
      const tilt = (Math.random()-0.5) * 3;
      const shade = 40 + Math.random()*60;
      ctx.strokeStyle = `rgba(${shade*0.6|0},${shade*1.4|0},${shade*0.5|0},${0.4+Math.random()*0.4})`;
      ctx.lineWidth = 0.8 + Math.random()*0.5;
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x+tilt, y-h); ctx.stroke();
    }
    // Слой 5: Толстые травинки (передний план)
    for (let i = 0; i < 200; i++) {
      const x = Math.random()*s, y = Math.random()*s;
      const h = 5 + Math.random()*10;
      ctx.strokeStyle = `rgba(${60+Math.random()*40|0},${130+Math.random()*50|0},${40+Math.random()*30|0},0.7)`;
      ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(x, y);
      ctx.quadraticCurveTo(x+(Math.random()-0.5)*4, y-h/2, x+(Math.random()-0.5)*6, y-h);
      ctx.stroke();
    }
    // Слой 6: Мелкие цветочки
    for (let i = 0; i < 30; i++) {
      const x = Math.random()*s, y = Math.random()*s;
      const colors = ['#fff0a0', '#ffc0d0', '#ffffff', '#ffe040'];
      ctx.fillStyle = colors[Math.floor(Math.random()*colors.length)];
      ctx.beginPath();
      for (let p = 0; p < 5; p++) {
        const a = p * Math.PI * 2 / 5;
        ctx.arc(x + Math.cos(a)*1.5, y + Math.sin(a)*1.5, 1.2, 0, 6.28);
      }
      ctx.fill();
    }
    // Слой 7: мелкий шум/зернистость
    const noise = ctx.createImageData(s, s);
    for (let i = 0; i < noise.data.length; i += 4) {
      const v = (Math.random() - 0.5) * 20;
      noise.data[i] = 0; noise.data[i+1] = v; noise.data[i+2] = 0;
      noise.data[i+3] = Math.abs(v) * 4;
    }
    const nc = document.createElement('canvas'); nc.width = nc.height = s;
    nc.getContext('2d').putImageData(noise, 0, 0);
    ctx.globalCompositeOperation = 'overlay';
    ctx.drawImage(nc, 0, 0);
    ctx.globalCompositeOperation = 'source-over';
  }),
  // ======================================================
  // СНЕГ — пушистый, с сугробами
  // ======================================================
  snow: makeCanvasTexture((ctx, s) => {
    // База — градиент с шумом
    const img = ctx.createImageData(s, s);
    for (let y = 0; y < s; y++) {
      for (let x = 0; x < s; x++) {
        const n = smoothNoise(x * 0.04, y * 0.04) * 40;
        const n2 = smoothNoise(x * 0.2, y * 0.2) * 20;
        const v = 220 + n + n2 | 0;
        const idx = (y * s + x) * 4;
        img.data[idx] = Math.min(255, v);
        img.data[idx+1] = Math.min(255, v+5);
        img.data[idx+2] = Math.min(255, v+10);
        img.data[idx+3] = 255;
      }
    }
    ctx.putImageData(img, 0, 0);
    // Сугробы — голубоватые тени
    for (let i = 0; i < 100; i++) {
      const x = Math.random()*s, y = Math.random()*s, r = 15 + Math.random()*40;
      const grd = ctx.createRadialGradient(x, y, 0, x, y, r);
      grd.addColorStop(0, 'rgba(170,195,220,0.3)');
      grd.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = grd;
      ctx.beginPath(); ctx.arc(x, y, r, 0, 6.28); ctx.fill();
    }
    // Блёстки-кристаллы
    for (let i = 0; i < 600; i++) {
      const x = Math.random()*s, y = Math.random()*s;
      ctx.fillStyle = `rgba(255,255,255,${0.6+Math.random()*0.4})`;
      ctx.fillRect(x, y, 1.5, 1.5);
    }
    // Крупные блёстки
    for (let i = 0; i < 60; i++) {
      const x = Math.random()*s, y = Math.random()*s;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.moveTo(x, y-3); ctx.lineTo(x+1, y); ctx.lineTo(x+3, y);
      ctx.lineTo(x+1, y+1); ctx.lineTo(x, y+3); ctx.lineTo(x-1, y+1);
      ctx.lineTo(x-3, y); ctx.lineTo(x-1, y);
      ctx.closePath(); ctx.fill();
    }
    // Следы / царапины
    ctx.strokeStyle = 'rgba(180,200,220,0.25)';
    ctx.lineWidth = 1;
    for (let i = 0; i < 40; i++) {
      ctx.beginPath();
      ctx.moveTo(Math.random()*s, Math.random()*s);
      ctx.bezierCurveTo(Math.random()*s, Math.random()*s, Math.random()*s, Math.random()*s, Math.random()*s, Math.random()*s);
      ctx.stroke();
    }
  }),
  // ======================================================
  // ПЕСОК — дюны, рябь, камешки
  // ======================================================
  sand: makeCanvasTexture((ctx, s) => {
    // База — градиент оттенков
    const img = ctx.createImageData(s, s);
    for (let y = 0; y < s; y++) {
      for (let x = 0; x < s; x++) {
        const n1 = smoothNoise(x * 0.02, y * 0.02) * 50;
        const n2 = smoothNoise(x * 0.08, y * 0.08) * 25;
        const v = n1 + n2;
        const idx = (y * s + x) * 4;
        img.data[idx] = Math.min(255, 195 + v);
        img.data[idx+1] = Math.min(255, 160 + v * 0.8);
        img.data[idx+2] = Math.min(255, 100 + v * 0.5);
        img.data[idx+3] = 255;
      }
    }
    ctx.putImageData(img, 0, 0);
    // Рябь песчаных волн
    for (let y = 0; y < s; y += 4) {
      ctx.strokeStyle = `rgba(${140+Math.random()*30|0},${110+Math.random()*25|0},${60+Math.random()*25|0},0.3)`;
      ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(0, y);
      for (let x = 0; x < s; x += 8) {
        const dy = Math.sin(x * 0.04 + y * 0.2) * 3 + Math.sin(x * 0.15) * 1.5;
        ctx.lineTo(x, y + dy);
      }
      ctx.stroke();
    }
    // Зёрна крупные
    for (let i = 0; i < 2000; i++) {
      const v = 180 + Math.random()*60 | 0;
      ctx.fillStyle = `rgba(${v},${v*0.8|0},${v*0.5|0},${0.3+Math.random()*0.4})`;
      ctx.fillRect(Math.random()*s, Math.random()*s, 1.5, 1);
    }
    // Камешки
    for (let i = 0; i < 80; i++) {
      const x = Math.random()*s, y = Math.random()*s, r = 2 + Math.random()*4;
      const grd = ctx.createRadialGradient(x-r*0.3, y-r*0.3, 0, x, y, r);
      grd.addColorStop(0, '#a89870');
      grd.addColorStop(1, '#5a4830');
      ctx.fillStyle = grd;
      ctx.beginPath(); ctx.arc(x, y, r, 0, 6.28); ctx.fill();
    }
    // Ракушки редко
    for (let i = 0; i < 8; i++) {
      ctx.strokeStyle = '#fff0e0'; ctx.lineWidth = 1.5;
      const x = Math.random()*s, y = Math.random()*s;
      ctx.beginPath(); ctx.arc(x, y, 3+Math.random()*3, 0.3, 2.8); ctx.stroke();
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
  tex.repeat.set(80, 80);

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
  if (type !== 'snow' && type !== 'desert') addGrass(5000);
  else if (type === 'desert') addDesertDetails();
  else if (type === 'snow') addSnowDetails();

  // Небо по типу карты
  if (type === 'snow') { scene.background = new THREE.Color(0xbcd0df); scene.fog.color.set(0xbcd0df); }
  else if (type === 'desert') { scene.background = new THREE.Color(0xf0c87a); scene.fog.color.set(0xf0c87a); }
  else { scene.background = new THREE.Color(0x87ceeb); scene.fog.color.set(0x87ceeb); }
}

// ---------- Объёмная трава: 5000 плоскостей с процедурной текстурой ----------
let grassMesh = null;
const grassOffsets = [];
function addGrass(count) {
  // Текстура травинки — вертикальный градиент с прозрачностью
  const gc = document.createElement('canvas');
  gc.width = 32; gc.height = 64;
  const gctx = gc.getContext('2d');
  // Несколько травинок на одной текстуре
  for (let b = 0; b < 3; b++) {
    const x = 6 + b * 10;
    const grd = gctx.createLinearGradient(0, 0, 0, 64);
    grd.addColorStop(0, 'rgba(160,220,80,0)');
    grd.addColorStop(0.1, 'rgba(130,200,70,0.9)');
    grd.addColorStop(0.6, 'rgba(70,140,40,1)');
    grd.addColorStop(1, 'rgba(40,90,25,1)');
    gctx.fillStyle = grd;
    gctx.beginPath();
    gctx.moveTo(x, 64);
    gctx.lineTo(x-2, 10);
    gctx.quadraticCurveTo(x, 0, x+2, 10);
    gctx.lineTo(x, 64);
    gctx.closePath();
    gctx.fill();
  }
  const grassTex = new THREE.CanvasTexture(gc);
  grassTex.wrapS = grassTex.wrapT = THREE.ClampToEdgeWrapping;

  const geom = new THREE.PlaneGeometry(0.35, 0.7);
  geom.translate(0, 0.35, 0);
  const mat = new THREE.MeshBasicMaterial({
    map: grassTex,
    side: THREE.DoubleSide,
    transparent: true,
    alphaTest: 0.3,
  });
  grassMesh = new THREE.InstancedMesh(geom, mat, count);
  grassMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);

  // Цвета для разнообразия
  const colors = new Float32Array(count * 3);
  grassMesh.instanceColor = new THREE.InstancedBufferAttribute(colors, 3);

  const dummy = new THREE.Object3D();
  grassOffsets.length = 0;
  // Распределяем пучками (кустами) для естественности
  const clusters = 200;
  let idx = 0;
  for (let c = 0; c < clusters && idx < count; c++) {
    const cx = (Math.random() - 0.5) * WORLD_SIZE * 0.9;
    const cz = (Math.random() - 0.5) * WORLD_SIZE * 0.9;
    const perCluster = Math.min(count - idx, 20 + Math.floor(Math.random() * 15));
    for (let i = 0; i < perCluster && idx < count; i++) {
      // В пределах ~3м от центра кластера
      const x = cx + (Math.random() - 0.5) * 6;
      const z = cz + (Math.random() - 0.5) * 6;
      dummy.position.set(x, 0, z);
      dummy.rotation.y = Math.random() * Math.PI;
      const scale = 0.7 + Math.random() * 0.7;
      dummy.scale.set(scale, scale * (0.9 + Math.random() * 0.4), scale);
      dummy.updateMatrix();
      grassMesh.setMatrixAt(idx, dummy.matrix);
      // Цвет травинки
      const shade = 0.7 + Math.random() * 0.6;
      colors[idx*3]   = 0.4 * shade;
      colors[idx*3+1] = 0.8 * shade;
      colors[idx*3+2] = 0.3 * shade;
      grassOffsets.push({ phase: Math.random() * Math.PI * 2, x, z, rotY: dummy.rotation.y, sx: scale, sy: dummy.scale.y });
      idx++;
    }
  }
  // Остаток разбросать
  while (idx < count) {
    const x = (Math.random() - 0.5) * WORLD_SIZE * 0.9;
    const z = (Math.random() - 0.5) * WORLD_SIZE * 0.9;
    dummy.position.set(x, 0, z);
    dummy.rotation.y = Math.random() * Math.PI;
    const scale = 0.7 + Math.random() * 0.7;
    dummy.scale.set(scale, scale, scale);
    dummy.updateMatrix();
    grassMesh.setMatrixAt(idx, dummy.matrix);
    colors[idx*3] = 0.3; colors[idx*3+1] = 0.7; colors[idx*3+2] = 0.25;
    grassOffsets.push({ phase: Math.random() * Math.PI * 2, x, z, rotY: dummy.rotation.y, sx: scale, sy: scale });
    idx++;
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
      if (player.noclip) {
        player.body.collisionResponse = false;
        player.body.velocity.set(0, 0, 0);
      } else {
        player.body.collisionResponse = true;
      }
      logConsole('noclip: ' + (player.noclip ? 'ON — летаешь сквозь всё' : 'OFF'));
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
      // Noclip: полёт в направлении камеры, сквозь всё
      const camDir = new THREE.Vector3();
      camera.getWorldDirection(camDir);
      const flySpeed = player.running ? player.runSpeed * 2 : moveSpeed;
      const v = new THREE.Vector3();
      if (keys['KeyW']) v.add(camDir);
      if (keys['KeyS']) v.sub(camDir);
      if (keys['KeyD']) v.add(right);
      if (keys['KeyA']) v.sub(right);
      if (keys['Space']) v.y += 1;
      if (player.crouching) v.y -= 1;
      v.normalize().multiplyScalar(flySpeed * dt);
      player.body.position.x += v.x;
      player.body.position.y += v.y;
      player.body.position.z += v.z;
      player.body.velocity.set(0, 0, 0);
      // Не вызываем world.step — тело не взаимодействует ни с чем
    } else if (controls.isLocked) {
      player.body.velocity.x = input.x;
      player.body.velocity.z = input.z;
    } else {
      player.body.velocity.x = 0; player.body.velocity.z = 0;
    }

    if (!player.noclip) world.step(1 / 60, dt, 3);

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
    // Обновляем 500 инстансов каждый кадр для производительности
    const start = (fpsCount * 500) % grassOffsets.length;
    for (let i = 0; i < 500; i++) {
      const ii = (start + i) % grassOffsets.length;
      const g = grassOffsets[ii];
      const sway = Math.sin(t + g.phase) * 0.1;
      dummy.position.set(g.x, 0, g.z);
      dummy.rotation.set(0, g.rotY, sway);
      dummy.scale.set(g.sx, g.sy, g.sx);
      dummy.updateMatrix();
      grassMesh.setMatrixAt(ii, dummy.matrix);
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

// =============================================================
// ПРЕДМЕТ В РУКЕ (3D-модель привязана к камере)
// =============================================================
const handGroup = new THREE.Group();
handGroup.position.set(0.35, -0.35, -0.6); // правый-нижний от камеры
camera.add(handGroup);
scene.add(camera); // чтобы дети камеры рендерились

let currentHandItem = null;

function makeHandModel(type) {
  const g = new THREE.Group();
  const mat = (color) => new THREE.MeshLambertMaterial({ color });

  switch (type) {
    // --- Мили ---
    case 'rock':
      g.add(new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 6), mat(0x8a8a8a)));
      break;
    case 'torch':
      const stick = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.025, 0.5, 6), mat(0x8B5A2B));
      const flame = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.12, 8), new THREE.MeshBasicMaterial({ color: 0xff6a00 }));
      flame.position.y = 0.3; stick.position.y = 0; g.add(stick); g.add(flame);
      break;
    case 'knife': case 'machete':
      const blade = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.3, 0.05), mat(0xcccccc));
      const handle = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.12, 0.04), mat(0x5a3a1a));
      handle.position.y = -0.2; g.add(blade); g.add(handle);
      break;
    case 'wood_spear': case 'bone_spear':
      const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.9, 6), mat(0x8B5A2B));
      const tip = new THREE.Mesh(new THREE.ConeGeometry(0.03, 0.1, 6), mat(0xcccccc));
      tip.position.y = 0.5; g.add(shaft); g.add(tip);
      break;
    // --- Топоры/кирки ---
    case 'axe': case 'stone_hatchet':
      const axH = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.5, 6), mat(0x8B5A2B));
      const axB = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.1, 0.02), mat(0x888888));
      axB.position.set(0.06, 0.2, 0); g.add(axH); g.add(axB);
      break;
    case 'pickaxe': case 'stone_pick':
      const piH = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.5, 6), mat(0x8B5A2B));
      const piB = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.03, 0.02), mat(0x888888));
      piB.position.set(0, 0.25, 0); g.add(piH); g.add(piB);
      break;
    // --- Строительство ---
    case 'building_plan':
      const paper = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.28, 0.01), mat(0x4488ff));
      paper.rotation.z = 0.1; g.add(paper);
      break;
    case 'hammer':
      const hH = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.35, 6), mat(0x8B5A2B));
      const hB = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.06, 0.06), mat(0x888888));
      hB.position.set(0, 0.2, 0); g.add(hH); g.add(hB);
      break;
    // --- Пистолеты ---
    case 'revolver': case 'p2': case 'm92': case 'python':
      const pBody = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.06, 0.22), mat(0x444444));
      const pGrip = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.12, 0.04), mat(0x5a3a1a));
      pGrip.position.set(0, -0.08, 0.06); g.add(pBody); g.add(pGrip);
      break;
    // --- Дробовики ---
    case 'double_barrel': case 'pump_shotgun': case 'spas':
      const sBody = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.04, 0.5), mat(0x333333));
      const sGrip = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.12, 0.08), mat(0x5a3a1a));
      sGrip.position.set(0, -0.06, 0.12); const sPump = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.035, 0.12), mat(0x6a3a1a));
      sPump.position.set(0, -0.02, -0.08); g.add(sBody); g.add(sGrip); g.add(sPump);
      break;
    // --- Автоматы ---
    case 'ak47': case 'lr300': case 'sar': case 'm249': case 'm39':
      const rBody = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.06, 0.55), mat(0x444444));
      const rMag = new THREE.Mesh(new THREE.BoxGeometry(0.025, 0.12, 0.04), mat(0x222222));
      rMag.position.set(0, -0.08, 0.05); const rStock = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.06, 0.15), mat(0x5a3a1a));
      rStock.position.set(0, 0, 0.32); g.add(rBody); g.add(rMag); g.add(rStock);
      break;
    // --- SMG ---
    case 'tommy': case 'mp5':
      const smBody = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.05, 0.35), mat(0x333333));
      const smMag = new THREE.Mesh(new THREE.BoxGeometry(0.025, 0.1, 0.03), mat(0x222222));
      smMag.position.set(0, -0.06, 0); const smGrip = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.08, 0.03), mat(0x333333));
      smGrip.position.set(0, -0.05, 0.1); g.add(smBody); g.add(smMag); g.add(smGrip);
      break;
    // --- Снайперки ---
    case 'bolt': case 'l96':
      const snBody = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.05, 0.7), mat(0x333333));
      const snScope = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.08, 8), mat(0x222222));
      snScope.rotation.x = Math.PI/2; snScope.position.set(0, 0.05, -0.1);
      const snStock = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.07, 0.18), mat(0x5a3a1a));
      snStock.position.set(0, 0, 0.38); g.add(snBody); g.add(snScope); g.add(snStock);
      break;
    // --- Луки ---
    case 'bow': case 'crossbow': case 'compound_bow':
      const bowBody = new THREE.Mesh(new THREE.TorusGeometry(0.15, 0.015, 8, 16, Math.PI), mat(0x8B5A2B));
      bowBody.rotation.z = Math.PI/2; g.add(bowBody);
      break;
    // --- Взрывчатка ---
    case 'c4':
      const c4b = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.08, 0.2), mat(0xe8d16a));
      g.add(c4b); break;
    case 'rpg':
      const rpgTube = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.6, 8), mat(0x444444));
      rpgTube.rotation.x = Math.PI/2; g.add(rpgTube); break;
    // --- Default: простой куб ---
    default:
      const cube = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 0.1), mat(0x888888));
      g.add(cube);
  }
  g.scale.set(0.8, 0.8, 0.8);
  return g;
}

// Обновление модели в руке при смене хотбара
GAME.on('hotbarChange', (item) => {
  // Убираем старую
  while (handGroup.children.length) {
    const c = handGroup.children.pop();
    c.traverse(o => { o.geometry?.dispose?.(); o.material?.dispose?.(); });
  }
  currentHandItem = null;
  if (item) {
    const model = makeHandModel(item.type);
    handGroup.add(model);
    currentHandItem = item.type;
  }
});

// Лёгкая анимация покачивания в руке при ходьбе
let handBobT = 0;
GAME.on('frame', (dt) => {
  if (!player.body) return;
  const speed = Math.hypot(player.body.velocity.x, player.body.velocity.z);
  if (speed > 1 && player.onGround) {
    handBobT += dt * (player.running ? 12 : 8);
    handGroup.position.y = -0.35 + Math.sin(handBobT) * 0.015;
    handGroup.position.x = 0.35 + Math.cos(handBobT * 0.5) * 0.008;
  } else {
    handBobT = 0;
    handGroup.position.set(0.35, -0.35, -0.6);
  }
});
