// =============================================================
// building.js — строительство, призрак, привязка, улучшение,
// двери, кодовый замок, TC (шкаф собственника)
// =============================================================
const GAME = (window.GAME = window.GAME || {});
GAME.listeners = GAME.listeners || {};
GAME.on = GAME.on || ((ev, fn) => ((GAME.listeners[ev] = GAME.listeners[ev] || []).push(fn)));
GAME.emit = GAME.emit || ((ev, ...a) => (GAME.listeners[ev] || []).forEach(fn => fn(...a)));

// Ждём пока main.js подгрузится и положит THREE/сцену в GAME
function whenReady(fn) {
  if (GAME.THREE && GAME.scene) return fn();
  const iv = setInterval(() => {
    if (GAME.THREE && GAME.scene) { clearInterval(iv); fn(); }
  }, 50);
}

whenReady(() => {
  const THREE = GAME.THREE;
  const CANNON = GAME.CANNON;
  const scene = GAME.scene;
  const world = GAME.world;
  const camera = GAME.camera;

  // =============================================================
  // ПРОЦЕДУРНЫЕ ТЕКСТУРЫ БЛОКОВ (Canvas 512x512)
  // =============================================================
  function makeTex(draw, size = 512) {
    const c = document.createElement('canvas'); c.width = c.height = size;
    draw(c.getContext('2d'), size);
    const t = new THREE.CanvasTexture(c);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    return t;
  }
  const BLOCK_TEX = {
    twigs: makeTex((ctx, s) => {
      ctx.fillStyle = '#8B6A4A'; ctx.fillRect(0, 0, s, s);
      ctx.strokeStyle = '#5a3a1a'; ctx.lineWidth = 3;
      for (let i = 0; i < 40; i++) {
        ctx.beginPath(); ctx.moveTo(Math.random() * s, Math.random() * s);
        ctx.lineTo(Math.random() * s, Math.random() * s); ctx.stroke();
      }
    }),
    wood: makeTex((ctx, s) => {
      ctx.fillStyle = '#6B4226'; ctx.fillRect(0, 0, s, s);
      for (let y = 0; y < s; y += 64) {
        ctx.fillStyle = '#7a4e2e'; ctx.fillRect(0, y, s, 62);
        ctx.strokeStyle = '#4A2E18'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(s, y); ctx.stroke();
        for (let i = 0; i < 30; i++) {
          ctx.strokeStyle = `rgba(60,35,15,${Math.random() * 0.4 + 0.2})`;
          ctx.lineWidth = 1; ctx.beginPath();
          const yy = y + Math.random() * 60;
          ctx.moveTo(Math.random() * s, yy);
          ctx.lineTo(Math.random() * s, yy + (Math.random() - 0.5) * 4);
          ctx.stroke();
        }
      }
    }),
    stone: makeTex((ctx, s) => {
      ctx.fillStyle = '#707070'; ctx.fillRect(0, 0, s, s);
      for (let i = 0; i < 80; i++) {
        const x = Math.random() * s, y = Math.random() * s;
        const r = 20 + Math.random() * 40;
        ctx.fillStyle = `rgb(${100 + Math.random() * 40 | 0},${100 + Math.random() * 40 | 0},${100 + Math.random() * 40 | 0})`;
        ctx.beginPath(); ctx.arc(x, y, r, 0, 6.28); ctx.fill();
        ctx.strokeStyle = '#3a3a3a'; ctx.lineWidth = 2; ctx.stroke();
      }
    }),
    metal: makeTex((ctx, s) => {
      ctx.fillStyle = '#5B7A6A'; ctx.fillRect(0, 0, s, s);
      for (let y = 0; y < s; y += 24) {
        ctx.fillStyle = y / 24 % 2 === 0 ? '#4a6b5c' : '#6a8c7a';
        ctx.fillRect(0, y, s, 12);
      }
      ctx.fillStyle = '#333';
      for (let y = 16; y < s; y += 64) for (let x = 16; x < s; x += 64) {
        ctx.beginPath(); ctx.arc(x, y, 4, 0, 6.28); ctx.fill();
      }
    }),
    armored: makeTex((ctx, s) => {
      ctx.fillStyle = '#3E2A36'; ctx.fillRect(0, 0, s, s);
      for (let i = 0; i < 3000; i++) {
        ctx.fillStyle = `rgba(${60 + Math.random() * 40 | 0},${40 + Math.random() * 30 | 0},${50 + Math.random() * 30 | 0},${0.3 + Math.random() * 0.4})`;
        ctx.fillRect(Math.random() * s, Math.random() * s, 2, 2);
      }
      ctx.strokeStyle = '#000'; ctx.lineWidth = 3;
      for (let x = 0; x < s; x += 128) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, s); ctx.stroke(); }
      for (let y = 0; y < s; y += 128) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(s, y); ctx.stroke(); }
    }),
  };

  // =============================================================
  // УРОВНИ (tier) МАТЕРИАЛОВ
  // =============================================================
  const TIERS = {
    twigs:   { name: 'Twigs',       color: 0x8B6A4A, hp: 10,   tex: BLOCK_TEX.twigs,   opacity: 0.7 },
    wood:    { name: 'Wood',        color: 0x6B4226, hp: 250,  tex: BLOCK_TEX.wood },
    stone:   { name: 'Stone',       color: 0x707070, hp: 500,  tex: BLOCK_TEX.stone },
    metal:   { name: 'Sheet Metal', color: 0x5B7A6A, hp: 1000, tex: BLOCK_TEX.metal },
    armored: { name: 'Armored',     color: 0x3E2A36, hp: 2000, tex: BLOCK_TEX.armored },
  };
  const TIER_ORDER = ['twigs', 'wood', 'stone', 'metal', 'armored'];
  GAME.TIERS = TIERS;

  // =============================================================
  // MERGE BOXES (утилита объединения геометрий)
  // =============================================================
  function mergeBoxes(geoms) {
    let totalV = 0, totalI = 0;
    geoms.forEach(g => {
      totalV += g.attributes.position.count;
      totalI += g.index ? g.index.count : g.attributes.position.count;
    });
    const positions = new Float32Array(totalV * 3);
    const normals = new Float32Array(totalV * 3);
    const indices = new Uint32Array(totalI);
    let voff = 0, ioff = 0;
    geoms.forEach(g => {
      g.computeVertexNormals();
      const p = g.attributes.position.array;
      const n = g.attributes.normal.array;
      positions.set(p, voff * 3);
      normals.set(n, voff * 3);
      const gi = g.index ? g.index.array : null;
      if (gi) for (let i = 0; i < gi.length; i++) indices[ioff++] = gi[i] + voff;
      else for (let i = 0; i < g.attributes.position.count; i++) indices[ioff++] = i + voff;
      voff += g.attributes.position.count;
    });
    const merged = new THREE.BufferGeometry();
    merged.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    merged.setAttribute('normal', new THREE.BufferAttribute(normals, 3));
    merged.setIndex(new THREE.BufferAttribute(indices, 1));
    return merged;
  }

  // =============================================================
  // ТИПЫ БЛОКОВ
  // =============================================================
  const BLOCK_TYPES = {
    foundation: {
      name: 'Фундамент', grid: 3, height: 0.3,
      make: () => new THREE.BoxGeometry(3, 0.3, 3),
      snapType: 'foundation',
    },
    foundation_tri: {
      name: 'Треугольный фундамент', grid: 3, height: 0.3,
      make: () => {
        const g = new THREE.BufferGeometry();
        const v = new Float32Array([
          -1.5, 0, -1.5,   1.5, 0, -1.5,   0, 0, 1.5,
          -1.5, 0.3, -1.5, 1.5, 0.3, -1.5, 0, 0.3, 1.5,
        ]);
        const idx = [0,2,1, 3,4,5, 0,1,4, 0,4,3, 1,2,5, 1,5,4, 2,0,3, 2,3,5];
        g.setAttribute('position', new THREE.BufferAttribute(v, 3));
        g.setIndex(idx); g.computeVertexNormals();
        return g;
      },
      snapType: 'foundation_tri',
    },
    wall: {
      name: 'Стена', grid: 3, height: 3,
      make: () => new THREE.BoxGeometry(3, 3, 0.2),
      snapType: 'wall',
    },
    wall_half: {
      name: 'Полустена', grid: 3, height: 1.5,
      make: () => new THREE.BoxGeometry(3, 1.5, 0.2),
      snapType: 'wall',
    },
    wall_low: {
      name: 'Низкая стена', grid: 3, height: 1,
      make: () => new THREE.BoxGeometry(3, 1, 0.2),
      snapType: 'wall',
    },
    wall_doorway: {
      name: 'Дверной проём', grid: 3, height: 3,
      make: () => {
        const g1 = new THREE.BoxGeometry(3, 0.5, 0.2); g1.translate(0, 2.75, 0);
        const g2 = new THREE.BoxGeometry(0.7, 2.5, 0.2); g2.translate(-1.15, 1.25, 0);
        const g3 = new THREE.BoxGeometry(0.7, 2.5, 0.2); g3.translate(1.15, 1.25, 0);
        return mergeBoxes([g1, g2, g3]);
      },
      snapType: 'wall_door',
    },
    wall_window: {
      name: 'Оконная рама', grid: 3, height: 3,
      make: () => {
        const g1 = new THREE.BoxGeometry(3, 0.9, 0.2); g1.translate(0, 2.55, 0);
        const g2 = new THREE.BoxGeometry(3, 0.9, 0.2); g2.translate(0, 0.45, 0);
        const g3 = new THREE.BoxGeometry(0.7, 1.2, 0.2); g3.translate(-1.15, 1.5, 0);
        const g4 = new THREE.BoxGeometry(0.7, 1.2, 0.2); g4.translate(1.15, 1.5, 0);
        return mergeBoxes([g1, g2, g3, g4]);
      },
      snapType: 'wall',
    },
    floor: {
      name: 'Пол', grid: 3, height: 0.2,
      make: () => new THREE.BoxGeometry(3, 0.2, 3),
      snapType: 'floor',
    },
    floor_tri: {
      name: 'Треугольный пол', grid: 3, height: 0.2,
      make: () => {
        const g = new THREE.BufferGeometry();
        const v = new Float32Array([
          -1.5, 0, -1.5,   1.5, 0, -1.5,   0, 0, 1.5,
          -1.5, 0.2, -1.5, 1.5, 0.2, -1.5, 0, 0.2, 1.5,
        ]);
        const idx = [0,2,1, 3,4,5, 0,1,4, 0,4,3, 1,2,5, 1,5,4, 2,0,3, 2,3,5];
        g.setAttribute('position', new THREE.BufferAttribute(v, 3));
        g.setIndex(idx); g.computeVertexNormals();
        return g;
      },
      snapType: 'floor',
    },
    roof: {
      name: 'Крыша', grid: 3, height: 1.5,
      make: () => {
        const g = new THREE.BufferGeometry();
        const v = new Float32Array([
          -1.5, 0, -1.5,   1.5, 0, -1.5,   1.5, 0, 1.5,   -1.5, 0, 1.5,
          -1.5, 1.5, 0,    1.5, 1.5, 0,
        ]);
        const idx = [0,1,2, 0,2,3, 0,4,5, 0,5,1, 2,5,4, 2,4,3, 0,3,4, 1,5,2];
        g.setAttribute('position', new THREE.BufferAttribute(v, 3));
        g.setIndex(idx); g.computeVertexNormals();
        return g;
      },
      snapType: 'roof',
    },
    stairs: {
      name: 'Лестница', grid: 3, height: 3,
      make: () => {
        const geoms = [];
        const steps = 8;
        for (let i = 0; i < steps; i++) {
          const g = new THREE.BoxGeometry(3, 3 / steps, 3 / steps);
          g.translate(0, (i + 0.5) * (3 / steps), -1.5 + (i + 0.5) * (3 / steps));
          geoms.push(g);
        }
        return mergeBoxes(geoms);
      },
      snapType: 'stairs',
    },
    door_wood: {
      name: 'Деревянная дверь', grid: 3, height: 2.5,
      make: () => new THREE.BoxGeometry(2, 2.5, 0.1),
      snapType: 'door', isDoor: true, doorMaterial: 'wood',
    },
    door_metal: {
      name: 'Металлическая дверь', grid: 3, height: 2.5,
      make: () => new THREE.BoxGeometry(2, 2.5, 0.1),
      snapType: 'door', isDoor: true, doorMaterial: 'metal',
    },
    garage_door: {
      name: 'Гаражные ворота', grid: 3, height: 3,
      make: () => new THREE.BoxGeometry(3, 3, 0.1),
      snapType: 'door', isDoor: true, doorMaterial: 'garage',
    },
  };
  GAME.BLOCK_TYPES = BLOCK_TYPES;

  // =============================================================
  // PIE-МЕНЮ (8 секторов)
  // =============================================================
  const PIE_CATEGORIES = [
    { label: 'Фундаменты', blocks: ['foundation', 'foundation_tri'] },
    { label: 'Стены',      blocks: ['wall', 'wall_half', 'wall_low', 'wall_doorway', 'wall_window'] },
    { label: 'Полы',       blocks: ['floor', 'floor_tri'] },
    { label: 'Крыши',      blocks: ['roof'] },
    { label: 'Лестницы',   blocks: ['stairs'] },
    { label: 'Двери',      blocks: ['door_wood', 'door_metal', 'garage_door'] },
    { label: 'Развёртывание', blocks: [] },
    { label: 'Электрика',  blocks: [] },
  ];

  const pieEl = document.getElementById('pie-menu');
  const pieCtx = pieEl.getContext('2d');

  let pieOpen = false;
  let pieHoverSector = -1;
  let pieSubBlocks = null;
  let pieSubHover = -1;

  function drawPie() {
    const S = 360, R = 160, r0 = 60;
    pieCtx.clearRect(0, 0, S, S);
    const items = pieSubBlocks || PIE_CATEGORIES;
    const hover = pieSubBlocks ? pieSubHover : pieHoverSector;
    const n = items.length;
    for (let i = 0; i < n; i++) {
      const a0 = (i / n) * Math.PI * 2 - Math.PI / 2;
      const a1 = ((i + 1) / n) * Math.PI * 2 - Math.PI / 2;
      const isHover = i === hover;
      pieCtx.beginPath();
      pieCtx.moveTo(S / 2 + Math.cos(a0) * r0, S / 2 + Math.sin(a0) * r0);
      pieCtx.arc(S / 2, S / 2, isHover ? R + 8 : R, a0, a1);
      pieCtx.lineTo(S / 2 + Math.cos(a1) * r0, S / 2 + Math.sin(a1) * r0);
      pieCtx.arc(S / 2, S / 2, r0, a1, a0, true);
      pieCtx.closePath();
      pieCtx.fillStyle = isHover ? 'rgba(255,127,36,0.85)' : 'rgba(20,20,20,0.8)';
      pieCtx.fill();
      pieCtx.strokeStyle = isHover ? '#ffb072' : '#333';
      pieCtx.lineWidth = isHover ? 3 : 1;
      pieCtx.stroke();

      const am = (a0 + a1) / 2;
      const tx = S / 2 + Math.cos(am) * (R + r0) / 2;
      const ty = S / 2 + Math.sin(am) * (R + r0) / 2;
      pieCtx.fillStyle = '#fff';
      pieCtx.font = isHover ? 'bold 14px Consolas' : '12px Consolas';
      pieCtx.textAlign = 'center';
      pieCtx.textBaseline = 'middle';
      const it = items[i];
      const label = typeof it === 'string' ? it : it.label;
      pieCtx.fillText(label, tx, ty);
    }
  }

  function openPie() {
    pieOpen = true; pieSubBlocks = null; pieHoverSector = -1;
    pieEl.style.display = 'block';
    drawPie();
  }
  function closePie() {
    pieOpen = false; pieSubBlocks = null;
    pieEl.style.display = 'none';
  }

  function piePick(x, y) {
    const rect = pieEl.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = x - cx, dy = y - cy;
    const dist = Math.hypot(dx, dy);
    if (dist < 50 || dist > 190) return -1;
    const items = pieSubBlocks || PIE_CATEGORIES;
    const n = items.length;
    let a = Math.atan2(dy, dx) + Math.PI / 2;
    if (a < 0) a += Math.PI * 2;
    return Math.floor((a / (Math.PI * 2)) * n) % n;
  }

  // =============================================================
  // ПРИЗРАК БЛОКА + SNAPPING
  // =============================================================
  const BLOCKS = [];
  GAME.BLOCKS = BLOCKS;

  let ghost = null;
  let currentBlockType = 'foundation';
  let currentRotation = 0;
  let ghostValid = false;

  const ghostMatValid = new THREE.MeshBasicMaterial({ color: 0x4488ff, transparent: true, opacity: 0.5, depthWrite: false });
  const ghostMatInvalid = new THREE.MeshBasicMaterial({ color: 0xff4444, transparent: true, opacity: 0.5, depthWrite: false });

  function setGhost(type) {
    if (ghost) { scene.remove(ghost); ghost.geometry.dispose(); ghost = null; }
    currentBlockType = type;
    const def = BLOCK_TYPES[type];
    if (!def) return;
    ghost = new THREE.Mesh(def.make(), ghostMatValid);
    ghost.userData.isGhost = true;
    scene.add(ghost);
  }

  const raycaster = new THREE.Raycaster();
  raycaster.far = 8;

  function findNearestBlockBy(pos, pred) {
    let best = null, bestD = 3;
    for (const b of BLOCKS) {
      if (!pred(b)) continue;
      const d = b.mesh.position.distanceTo(pos);
      if (d < bestD) { bestD = d; best = b; }
    }
    return best;
  }

  function checkValid(pos) {
    for (const b of BLOCKS) {
      if (b.mesh.position.distanceTo(pos) < 0.3) return false;
    }
    if (GAME.tcZones) {
      for (const tc of GAME.tcZones) {
        if (tc.owner !== 'player' && tc.mesh.position.distanceTo(pos) < tc.radius) return false;
      }
    }
    return true;
  }

  function updateGhost() {
    if (!ghost) return;
    raycaster.setFromCamera({ x: 0, y: 0 }, camera);
    const pickables = [];
    scene.traverse(o => { if (o.isMesh && !o.userData?.isGhost) pickables.push(o); });
    const hits = raycaster.intersectObjects(pickables, false);
    const hit = hits[0];
    if (!hit) { ghost.visible = false; return; }
    ghost.visible = true;

    const def = BLOCK_TYPES[currentBlockType];
    const pos = hit.point.clone();

    const grid = def.grid || 3;
    pos.x = Math.round(pos.x / grid) * grid;
    pos.z = Math.round(pos.z / grid) * grid;

    let y = 0;
    if (def.snapType === 'foundation' || def.snapType === 'foundation_tri') {
      y = def.height / 2;
    } else if (def.snapType === 'wall' || def.snapType === 'wall_door') {
      y = def.height / 2 + 0.3;
      const found = findNearestBlockBy(pos, b => b.def.snapType === 'foundation');
      if (found) y = found.mesh.position.y + 0.15 + def.height / 2;
    } else if (def.snapType === 'floor') {
      y = 3 + 0.1;
      const found = findNearestBlockBy(pos, b => b.def.snapType === 'wall');
      if (found) y = found.mesh.position.y + 1.5 + 0.1;
    } else if (def.snapType === 'roof') {
      y = 3 + 0.1;
    } else if (def.snapType === 'stairs') {
      y = def.height / 2 + 0.3;
    } else if (def.snapType === 'door') {
      const door = findNearestBlockBy(pos, b => b.type === 'wall_doorway');
      if (door) {
        pos.copy(door.mesh.position);
        currentRotation = door.mesh.rotation.y;
        ghost.rotation.y = currentRotation;
        pos.y = 1.25 + 0.3;
        ghost.position.copy(pos);
        ghost.material = checkValid(pos) ? ghostMatValid : ghostMatInvalid;
        ghostValid = true;
        return;
      } else {
        ghost.visible = false; return;
      }
    }
    pos.y = y;
    ghost.position.copy(pos);
    ghost.rotation.y = currentRotation;

    ghostValid = checkValid(pos);
    ghost.material = ghostValid ? ghostMatValid : ghostMatInvalid;
  }

  // =============================================================
  // УСТАНОВКА БЛОКА
  // =============================================================
  function placeBlock() {
    if (!ghost || !ghost.visible || !ghostValid) return;
    const def = BLOCK_TYPES[currentBlockType];
    const tier = TIERS.twigs;

    const mat = new THREE.MeshLambertMaterial({ color: tier.color, map: tier.tex });
    const mesh = new THREE.Mesh(def.make(), mat);
    mesh.position.copy(ghost.position);
    mesh.rotation.y = ghost.rotation.y;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    scene.add(mesh);

    const half = new THREE.Box3().setFromObject(mesh).getSize(new THREE.Vector3()).multiplyScalar(0.5);
    const body = new CANNON.Body({ mass: 0, material: GAME.matGround });
    body.addShape(new CANNON.Box(new CANNON.Vec3(Math.max(0.05, half.x), Math.max(0.05, half.y), Math.max(0.05, half.z))));
    body.position.set(mesh.position.x, mesh.position.y, mesh.position.z);
    body.quaternion.setFromEuler(0, mesh.rotation.y, 0);
    world.addBody(body);

    const block = {
      type: currentBlockType, tier: 'twigs', def, mesh, body,
      hp: tier.hp, maxHp: tier.hp,
      doorState: def.isDoor ? { open: false, animT: 0, codelock: null } : null,
    };
    mesh.userData.block = block;
    mesh.userData.interactable = def.isDoor || currentBlockType === 'wall_doorway';
    mesh.userData.tooltip = def.isDoor ? 'E — открыть/закрыть' : 'E — кодовый замок';
    BLOCKS.push(block);
  }

  // =============================================================
  // КИЯНКА: HP-бар, улучшение, снос
  // =============================================================
  const blockHpEl = document.getElementById('block-hp');
  const blockHpName = blockHpEl.querySelector('.name');
  const blockHpFill = blockHpEl.querySelector('.bar-fill');
  const blockHpNums = blockHpEl.querySelector('.nums');

  let lookBlock = null;
  let demoStart = 0;
  let demoLMB = false;

  function updateLookBlock() {
    raycaster.setFromCamera({ x: 0, y: 0 }, camera);
    const pickables = [];
    scene.traverse(o => { if (o.isMesh && o.userData?.block) pickables.push(o); });
    const hits = raycaster.intersectObjects(pickables, false);
    lookBlock = hits[0]?.object.userData.block || null;

    const active = GAME.getActiveItem?.();
    const hasHammer = active && (active.type === 'hammer' || active.type === 'building_plan');

    if (lookBlock && hasHammer) {
      blockHpEl.style.display = 'block';
      const tier = TIERS[lookBlock.tier];
      blockHpName.textContent = lookBlock.def.name + ' — ' + tier.name;
      const pct = Math.max(0, lookBlock.hp / lookBlock.maxHp);
      blockHpFill.style.width = (pct * 100) + '%';
      blockHpFill.style.background = pct > 0.66 ? '#4caf50' : pct > 0.33 ? '#ffc107' : '#c23b22';
      blockHpNums.textContent = Math.round(lookBlock.hp) + ' / ' + lookBlock.maxHp;
    } else {
      blockHpEl.style.display = 'none';
    }
  }

  function upgradeBlock(block, tierKey) {
    const tier = TIERS[tierKey];
    if (!tier) return;
    block.tier = tierKey;
    block.maxHp = tier.hp; block.hp = tier.hp;
    block.mesh.material = new THREE.MeshLambertMaterial({ color: tier.color, map: tier.tex });
    GAME.logConsole?.('Улучшено до ' + tier.name);
  }

  // =============================================================
  // ДВЕРИ — E открывает/закрывает, анимация, кодовый замок
  // =============================================================
  GAME.on('interact', (obj) => {
    const block = obj.userData?.block;
    if (!block) return;
    if (block.def.isDoor) {
      if (block.doorState.codelock && !block.doorState.codelock.unlocked) {
        openCodelockUI(block, false);
        return;
      }
      block.doorState.open = !block.doorState.open;
    } else if (block.type === 'wall_doorway') {
      // Вешаем кодовый замок на ближайшую дверь (если есть)
      const near = BLOCKS.find(b => b.def.isDoor && b.mesh.position.distanceTo(block.mesh.position) < 1.5);
      if (near) openCodelockUI(near, true);
    }
  });

  function animateDoors(dt) {
    for (const b of BLOCKS) {
      if (!b.def.isDoor) continue;
      if (b.mesh.userData.baseY === undefined) b.mesh.userData.baseY = b.mesh.position.y;
      if (b.mesh.userData.baseRot === undefined) b.mesh.userData.baseRot = b.mesh.rotation.y;
      const target = b.doorState.open ? 1 : 0;
      b.doorState.animT = THREE.MathUtils.damp(b.doorState.animT, target, 8, dt);
      if (b.def.doorMaterial === 'garage') {
        b.mesh.position.y = b.mesh.userData.baseY + b.doorState.animT * 2.5;
      } else {
        b.mesh.rotation.y = b.mesh.userData.baseRot + b.doorState.animT * (Math.PI / 2);
      }
    }
  }

  // ---------- Кодовый замок UI ----------
  const codelockUI = document.getElementById('codelock-ui');
  const codelockDisplay = document.getElementById('codelock-display');
  const codelockKeys = document.getElementById('codelock-keys');
  const codelockSet = document.getElementById('codelock-set');

  let codelockBuffer = '';
  let codelockTarget = null;
  let codelockSetMode = false;

  codelockKeys.addEventListener('click', (e) => {
    if (e.target.tagName !== 'BUTTON') return;
    const t = e.target.textContent;
    if (t === 'C') codelockBuffer = '';
    else if (t === '\u232B' || t === '⌫') codelockBuffer = codelockBuffer.slice(0, -1);
    else if (/\d/.test(t) && codelockBuffer.length < 4) codelockBuffer += t;
    renderCodelock();
  });

  function renderCodelock() {
    codelockDisplay.textContent = codelockBuffer.padEnd(4, '-');
  }

  codelockSet.addEventListener('click', () => {
    if (!codelockTarget) return;
    if (codelockSetMode) {
      codelockTarget.doorState = codelockTarget.doorState || { open: false, animT: 0 };
      codelockTarget.doorState.codelock = { code: codelockBuffer, unlocked: true };
      GAME.logConsole?.('Код установлен: ' + codelockBuffer);
    } else {
      if (codelockTarget.doorState?.codelock?.code === codelockBuffer) {
        codelockTarget.doorState.codelock.unlocked = true;
        GAME.logConsole?.('Замок разблокирован');
      } else {
        GAME.logConsole?.('Неверный код');
      }
    }
    closeCodelockUI();
  });

  function openCodelockUI(target, setMode) {
    codelockTarget = target;
    codelockSetMode = setMode;
    codelockBuffer = '';
    codelockUI.style.display = 'block';
    codelockSet.textContent = setMode ? 'Установить' : 'Проверить';
    GAME.controls?.unlock?.();
    renderCodelock();
  }
  function closeCodelockUI() {
    codelockUI.style.display = 'none';
    codelockTarget = null;
  }

  // =============================================================
  // TC — шкаф собственника
  // =============================================================
  GAME.tcZones = [];
  function placeTC(pos) {
    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(1, 1.8, 1),
      new THREE.MeshLambertMaterial({ color: 0x6a3a1a, map: BLOCK_TEX.wood }),
    );
    mesh.position.copy(pos); mesh.position.y += 0.9;
    mesh.castShadow = true;
    scene.add(mesh);
    mesh.userData.interactable = true;
    mesh.userData.tooltip = 'TC (шкаф собственника)';
    GAME.tcZones.push({ mesh, owner: 'player', radius: 25 });
  }
  GAME.placeTC = placeTC;

  // =============================================================
  // ВВОД: ПКМ (pie), R (поворот), ЛКМ (поставить / снос)
  // =============================================================
  addEventListener('mousemove', (e) => {
    if (pieOpen) {
      if (pieSubBlocks) pieSubHover = piePick(e.clientX, e.clientY);
      else pieHoverSector = piePick(e.clientX, e.clientY);
      drawPie();
    }
  });

  addEventListener('mousedown', (e) => {
    const active = GAME.getActiveItem?.();
    if (e.button === 2) {
      if (!active) return;
      if (active.type === 'building_plan' || active.type === 'hammer') {
        e.preventDefault();
        openPie();
      }
    }
    if (e.button === 0) {
      if (active?.type === 'building_plan' && ghost?.visible) {
        placeBlock();
      }
      if (active?.type === 'hammer' && lookBlock) {
        demoStart = performance.now();
        demoLMB = true;
      }
    }
  });

  addEventListener('mouseup', (e) => {
    if (e.button === 2 && pieOpen) {
      const active = GAME.getActiveItem?.();
      if (!pieSubBlocks) {
        if (pieHoverSector >= 0) {
          if (active?.type === 'hammer') {
            pieSubBlocks = TIER_ORDER.map(k => ({ label: TIERS[k].name, tier: k }));
          } else {
            const cat = PIE_CATEGORIES[pieHoverSector];
            if (cat.blocks.length > 0) {
              pieSubBlocks = cat.blocks.map(b => ({ label: BLOCK_TYPES[b].name, block: b }));
            } else { closePie(); return; }
          }
          pieSubHover = -1;
          drawPie();
          return;
        } else { closePie(); return; }
      } else {
        if (pieSubHover >= 0) {
          const chosen = pieSubBlocks[pieSubHover];
          if (chosen.block) {
            setGhost(chosen.block);
          } else if (chosen.tier && lookBlock) {
            upgradeBlock(lookBlock, chosen.tier);
          }
        }
        closePie();
      }
    }
    if (e.button === 0) demoLMB = false;
  });

  addEventListener('contextmenu', (e) => e.preventDefault());

  addEventListener('keydown', (e) => {
    if (e.code === 'KeyR') {
      if (currentBlockType === 'foundation_tri' || currentBlockType === 'floor_tri') {
        currentRotation += Math.PI / 3; // 60°
      } else {
        currentRotation += Math.PI / 2; // 90° (стены, полустены, лестницы, двери)
      }
    }
    if (e.code === 'Escape') closeCodelockUI();
  });

  // =============================================================
  // ХОТБАР: при смене активного предмета — создаём/прячем призрак
  // =============================================================
  GAME.on('hotbarChange', (item) => {
    if (ghost) { scene.remove(ghost); ghost.geometry.dispose(); ghost = null; }
    if (item?.type === 'building_plan') {
      setGhost(currentBlockType || 'foundation');
    }
  });

  // =============================================================
  // КАДР
  // =============================================================
  GAME.on('frame', (dt) => {
    const active = GAME.getActiveItem?.();
    if (ghost && active?.type === 'building_plan' && !pieOpen) updateGhost();
    else if (ghost) ghost.visible = false;

    updateLookBlock();

    if (demoLMB && lookBlock && active?.type === 'hammer') {
      const held = (performance.now() - demoStart) / 1000;
      if (held > 2) {
        scene.remove(lookBlock.mesh);
        lookBlock.mesh.geometry.dispose();
        lookBlock.mesh.material.dispose?.();
        world.removeBody(lookBlock.body);
        const i = BLOCKS.indexOf(lookBlock);
        if (i >= 0) BLOCKS.splice(i, 1);
        demoLMB = false;
        lookBlock = null;
        GAME.logConsole?.('Блок снесён');
      }
    }

    animateDoors(dt);
  });

  GAME.logConsole?.('Система строительства готова');
});
