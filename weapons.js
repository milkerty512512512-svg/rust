// =============================================================
// weapons.js — оружие, стрельба, звуки, электрика, турели, PvE
// =============================================================
const GAME = (window.GAME = window.GAME || {});
GAME.listeners = GAME.listeners || {};
GAME.on = GAME.on || ((ev, fn) => ((GAME.listeners[ev] = GAME.listeners[ev] || []).push(fn)));
GAME.emit = GAME.emit || ((ev, ...a) => (GAME.listeners[ev] || []).forEach(fn => fn(...a)));

function whenReady(fn) {
  if (GAME.THREE && GAME.scene) return fn();
  const iv = setInterval(() => { if (GAME.THREE && GAME.scene) { clearInterval(iv); fn(); } }, 50);
}

whenReady(() => {
  const THREE = GAME.THREE;
  const scene = GAME.scene;
  const camera = GAME.camera;

  // =============================================================
  // WEB AUDIO (звуки генерируются осцилляторами + шумом)
  // =============================================================
  const AC = new (window.AudioContext || window.webkitAudioContext)();
  addEventListener('click', () => AC.resume?.(), { once: true });

  function noiseBuffer(dur = 0.3) {
    const n = Math.floor(AC.sampleRate * dur);
    const b = AC.createBuffer(1, n, AC.sampleRate);
    const d = b.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
    return b;
  }

  function playGunSound(kind) {
    const t = AC.currentTime;
    const master = AC.createGain();
    master.gain.value = 0.25;
    master.connect(AC.destination);

    // Шумовой компонент (дульный «пых»)
    const src = AC.createBufferSource();
    src.buffer = noiseBuffer(0.25);
    const flt = AC.createBiquadFilter();
    flt.type = 'lowpass';
    const gain = AC.createGain();

    // Осциллятор — тело выстрела
    const osc = AC.createOscillator();
    const oscGain = AC.createGain();
    osc.connect(oscGain);

    const presets = {
      pistol:   { freq: 220, dur: 0.10, noiseCut: 2000, noiseGain: 0.5 },
      rifle:    { freq: 180, dur: 0.12, noiseCut: 3500, noiseGain: 0.7 },
      shotgun:  { freq: 90,  dur: 0.22, noiseCut: 1200, noiseGain: 1.0 },
      sniper:   { freq: 140, dur: 0.20, noiseCut: 4500, noiseGain: 0.9 },
      smg:      { freq: 260, dur: 0.08, noiseCut: 3000, noiseGain: 0.4 },
      explosion:{ freq: 50,  dur: 0.70, noiseCut: 800,  noiseGain: 1.2 },
      melee:    { freq: 400, dur: 0.05, noiseCut: 1500, noiseGain: 0.2 },
      bow:      { freq: 900, dur: 0.12, noiseCut: 2500, noiseGain: 0.15 },
      reload:   { freq: 600, dur: 0.08, noiseCut: 2000, noiseGain: 0.1 },
      step:     { freq: 120, dur: 0.05, noiseCut: 800,  noiseGain: 0.12 },
      step_wood:{ freq: 180, dur: 0.05, noiseCut: 1200, noiseGain: 0.18 },
      step_metal:{freq: 320, dur: 0.04, noiseCut: 2500, noiseGain: 0.25 },
    };
    const p = presets[kind] || presets.rifle;

    osc.frequency.setValueAtTime(p.freq * 2, t);
    osc.frequency.exponentialRampToValueAtTime(40, t + p.dur);
    oscGain.gain.setValueAtTime(0.7, t);
    oscGain.gain.exponentialRampToValueAtTime(0.001, t + p.dur);

    flt.frequency.value = p.noiseCut;
    gain.gain.setValueAtTime(p.noiseGain, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + p.dur);

    src.connect(flt).connect(gain).connect(master);
    oscGain.connect(master);
    osc.start(t); osc.stop(t + p.dur);
    src.start(t); src.stop(t + p.dur);
  }
  GAME.playSound = playGunSound;

  // =============================================================
  // КАТАЛОГ ОРУЖИЯ
  // =============================================================
  // kind: melee | bow | pistol | rifle | shotgun | sniper | smg | explosive | throwable
  const WEAPONS = {
    rock:          { name: 'Камень',      kind: 'melee',   damage: 10, fireRate: 1.0, recoil: 0,    reach: 2.5, sound: 'melee' },
    knife:         { name: 'Нож',         kind: 'melee',   damage: 20, fireRate: 1.5, recoil: 0,    reach: 2.0, sound: 'melee' },
    machete:       { name: 'Мачете',      kind: 'melee',   damage: 35, fireRate: 1.2, recoil: 0,    reach: 2.5, sound: 'melee' },
    wood_spear:    { name: 'Копьё',       kind: 'melee',   damage: 40, fireRate: 0.8, recoil: 0,    reach: 3.0, sound: 'melee' },
    club:          { name: 'Дубинка',     kind: 'melee',   damage: 25, fireRate: 1.1, recoil: 0,    reach: 2.5, sound: 'melee' },
    bow:           { name: 'Лук',         kind: 'bow',     damage: 45, fireRate: 1.0, recoil: 0,    mag: 1,  reload: 0.8, ammo: 'arrow', sound: 'bow' },
    crossbow:      { name: 'Арбалет',     kind: 'bow',     damage: 60, fireRate: 0.6, recoil: 0,    mag: 1,  reload: 1.5, ammo: 'arrow', sound: 'bow' },
    compound_bow:  { name: 'Составной',   kind: 'bow',     damage: 80, fireRate: 1.2, recoil: 0,    mag: 1,  reload: 0.7, ammo: 'arrow', sound: 'bow' },
    revolver:      { name: 'Револьвер',   kind: 'pistol',  damage: 35, fireRate: 2.5, recoil: 0.015,mag: 8,  reload: 2.5, ammo: 'pistol', sound: 'pistol' },
    p2:            { name: 'P2',          kind: 'pistol',  damage: 22, fireRate: 3.5, recoil: 0.010,mag: 10, reload: 1.5, ammo: 'pistol', sound: 'pistol' },
    m92:           { name: 'M92',         kind: 'pistol',  damage: 28, fireRate: 5.0, recoil: 0.012,mag: 15, reload: 2.0, ammo: 'pistol', sound: 'pistol' },
    python:        { name: 'Python',      kind: 'pistol',  damage: 50, fireRate: 1.8, recoil: 0.018,mag: 6,  reload: 2.8, ammo: 'pistol', sound: 'pistol' },
    double_barrel: { name: 'Двустволка',  kind: 'shotgun', damage: 15, pellets: 12, burst: 2, fireRate: 2.5, recoil: 0.04, mag: 2, reload: 2.5, ammo: 'shotgun', sound: 'shotgun' },
    pump_shotgun:  { name: 'Помповый',    kind: 'shotgun', damage: 18, pellets: 12, fireRate: 1.5, recoil: 0.035, mag: 6, reload: 3.5, ammo: 'shotgun', sound: 'shotgun' },
    spas:          { name: 'SPAS',        kind: 'shotgun', damage: 16, pellets: 12, fireRate: 2.0, recoil: 0.03,  mag: 8, reload: 4.0, ammo: 'shotgun', sound: 'shotgun' },
    tommy:         { name: 'Tommy',       kind: 'smg',     damage: 22, fireRate: 9.0, recoil: 0.015, mag: 20, reload: 3.0, ammo: 'pistol', sound: 'smg' },
    mp5:           { name: 'MP5',         kind: 'smg',     damage: 30, fireRate: 8.0, recoil: 0.018, mag: 30, reload: 2.5, ammo: 'pistol', sound: 'smg' },
    ak47:          { name: 'AK-47',       kind: 'rifle',   damage: 40, fireRate: 8.0, recoil: 0.030, mag: 30, reload: 3.5, ammo: 'rifle', sound: 'rifle' },
    lr300:         { name: 'LR-300',      kind: 'rifle',   damage: 38, fireRate: 8.5, recoil: 0.020, mag: 30, reload: 3.0, ammo: 'rifle', sound: 'rifle' },
    sar:           { name: 'SAR',         kind: 'rifle',   damage: 45, fireRate: 3.5, recoil: 0.025, mag: 16, reload: 2.5, ammo: 'rifle', sound: 'rifle' },
    m249:          { name: 'M249',        kind: 'rifle',   damage: 50, fireRate: 9.0, recoil: 0.035, mag: 100,reload: 5.0, ammo: 'rifle', sound: 'rifle' },
    m39:           { name: 'M39',         kind: 'rifle',   damage: 55, fireRate: 3.0, recoil: 0.022, mag: 20, reload: 3.0, ammo: 'rifle', sound: 'rifle' },
    bolt:          { name: 'Bolt Action', kind: 'sniper',  damage: 90, fireRate: 0.8, recoil: 0.045, mag: 5,  reload: 4.0, ammo: 'rifle', sound: 'sniper' },
    l96:           { name: 'L96',         kind: 'sniper',  damage: 120,fireRate: 1.0, recoil: 0.050, mag: 5,  reload: 4.0, ammo: 'rifle', sound: 'sniper' },
    f1_grenade:    { name: 'Граната',     kind: 'throwable', damage: 150, fuse: 3.0, sound: 'explosion' },
    flash:         { name: 'Flashbang',   kind: 'throwable', damage: 0,   fuse: 2.0, sound: 'explosion' },
    rpg:           { name: 'РПГ',         kind: 'explosive', damage: 300, fireRate: 0.5, recoil: 0.06, mag: 1, reload: 4.0, ammo: 'rpg', sound: 'explosion', splash: 4 },
    c4:            { name: 'C4',          kind: 'explosive', damage: 500, placeable: true, fuse: 10.0, sound: 'explosion', splash: 6 },
    satchel:       { name: 'Satchel',     kind: 'explosive', damage: 180, placeable: true, fuse: 7.0,  sound: 'explosion', splash: 4 },
  };
  GAME.WEAPONS = WEAPONS;

  // =============================================================
  // СОСТОЯНИЕ ОРУЖИЯ ИГРОКА
  // =============================================================
  const gunState = {
    current: null,       // WEAPONS[type]
    magLoaded: 0,
    lastShot: 0,
    reloading: false,
    recoilOffset: 0,
  };

  GAME.on('hotbarChange', (item) => {
    if (item && WEAPONS[item.type]) {
      gunState.current = { ...WEAPONS[item.type], type: item.type };
      gunState.magLoaded = gunState.current.mag ?? 0;
      gunState.reloading = false;
    } else {
      gunState.current = null;
    }
  });

  // =============================================================
  // ЭФФЕКТЫ: искры / импакт
  // =============================================================
  const sparks = []; // {mesh, life}

  function spawnSpark(pos, color = 0xffaa00) {
    const geom = new THREE.BufferGeometry();
    const n = 10;
    const p = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) { p[i*3] = pos.x; p[i*3+1] = pos.y; p[i*3+2] = pos.z; }
    geom.setAttribute('position', new THREE.BufferAttribute(p, 3));
    const mat = new THREE.PointsMaterial({ color, size: 0.1, transparent: true, opacity: 1 });
    const pts = new THREE.Points(geom, mat);
    scene.add(pts);
    const vels = [];
    for (let i = 0; i < n; i++) {
      vels.push(new THREE.Vector3((Math.random()-0.5)*4, Math.random()*3, (Math.random()-0.5)*4));
    }
    sparks.push({ mesh: pts, vels, life: 0.5, max: 0.5 });
  }

  function updateSparks(dt) {
    for (let i = sparks.length - 1; i >= 0; i--) {
      const s = sparks[i];
      s.life -= dt;
      const p = s.mesh.geometry.attributes.position.array;
      for (let j = 0; j < s.vels.length; j++) {
        p[j*3]   += s.vels[j].x * dt;
        p[j*3+1] += s.vels[j].y * dt;
        p[j*3+2] += s.vels[j].z * dt;
        s.vels[j].y -= 8 * dt;
      }
      s.mesh.geometry.attributes.position.needsUpdate = true;
      s.mesh.material.opacity = Math.max(0, s.life / s.max);
      if (s.life <= 0) {
        scene.remove(s.mesh);
        s.mesh.geometry.dispose(); s.mesh.material.dispose();
        sparks.splice(i, 1);
      }
    }
  }

  // =============================================================
  // СТРЕЛЬБА
  // =============================================================
  const raycaster = new THREE.Raycaster();

  function doDamage(target, dmg) {
    // Блок?
    const block = target?.userData?.block;
    if (block) {
      block.hp -= dmg;
      if (block.hp <= 0) {
        scene.remove(block.mesh);
        GAME.world.removeBody(block.body);
        const i = GAME.BLOCKS.indexOf(block);
        if (i >= 0) GAME.BLOCKS.splice(i, 1);
      }
      return;
    }
    // NPC?
    const npc = target?.userData?.npc;
    if (npc) {
      npc.hp -= dmg;
      if (npc.hp <= 0) killNpc(npc);
      return;
    }
    // Турель
    const turret = target?.userData?.turret;
    if (turret) {
      turret.hp -= dmg;
      if (turret.hp <= 0) removeTurret(turret);
    }
  }

  function shoot(spread = 0) {
    const w = gunState.current;
    if (!w) return meleeSwing();
    const now = performance.now();
    const interval = 1000 / (w.fireRate || 1);
    if (now - gunState.lastShot < interval) return;
    if (gunState.reloading) return;
    if (w.mag !== undefined && gunState.magLoaded <= 0) { reload(); return; }
    gunState.lastShot = now;
    if (w.mag !== undefined) gunState.magLoaded--;

    GAME.playSound(w.sound || 'rifle');

    // Отдача камеры
    gunState.recoilOffset += w.recoil || 0;

    const pellets = w.pellets || 1;
    const shots = w.burst || 1;

    for (let s = 0; s < shots; s++) {
      setTimeout(() => {
        for (let i = 0; i < pellets; i++) {
          const dir = new THREE.Vector3();
          camera.getWorldDirection(dir);
          dir.x += (Math.random() - 0.5) * (spread + (pellets > 1 ? 0.08 : 0));
          dir.y += (Math.random() - 0.5) * (spread + (pellets > 1 ? 0.08 : 0));
          dir.normalize();
          raycaster.set(camera.position, dir);
          raycaster.far = 200;
          const pickables = [];
          scene.traverse(o => { if (o.isMesh && !o.userData?.isGhost) pickables.push(o); });
          const hits = raycaster.intersectObjects(pickables, false);
          const hit = hits[0];
          if (hit) {
            spawnSpark(hit.point, 0xffaa00);
            doDamage(hit.object, w.damage);
            if (w.splash) splashDamage(hit.point, w.splash, w.damage);
          }
        }
      }, s * 180);
    }
  }

  function meleeSwing() {
    GAME.playSound('melee');
    const dir = new THREE.Vector3(); camera.getWorldDirection(dir);
    raycaster.set(camera.position, dir);
    raycaster.far = 2.5;
    const pickables = [];
    scene.traverse(o => { if (o.isMesh && !o.userData?.isGhost) pickables.push(o); });
    const hits = raycaster.intersectObjects(pickables, false);
    if (hits[0]) {
      spawnSpark(hits[0].point, 0xffffff);
      doDamage(hits[0].object, 10);
    }
  }

  function reload() {
    const w = gunState.current;
    if (!w || w.mag === undefined || gunState.reloading) return;
    gunState.reloading = true;
    GAME.playSound('reload');
    setTimeout(() => {
      gunState.magLoaded = w.mag;
      gunState.reloading = false;
    }, (w.reload || 2) * 1000);
  }

  function splashDamage(pos, radius, dmg) {
    for (const b of GAME.BLOCKS) {
      if (b.mesh.position.distanceTo(pos) < radius) doDamage(b.mesh, dmg * 0.5);
    }
    for (const npc of NPCS) {
      if (npc.mesh.position.distanceTo(pos) < radius) doDamage(npc.mesh, dmg * 0.7);
    }
    // Визуальная вспышка
    const flash = new THREE.Mesh(
      new THREE.SphereGeometry(radius, 16, 16),
      new THREE.MeshBasicMaterial({ color: 0xff7f24, transparent: true, opacity: 0.6 }),
    );
    flash.position.copy(pos);
    scene.add(flash);
    setTimeout(() => { scene.remove(flash); flash.geometry.dispose(); flash.material.dispose(); }, 200);
  }

  // =============================================================
  // ВВОД: ЛКМ стрелять, R перезарядка
  // =============================================================
  addEventListener('mousedown', (e) => {
    if (!GAME.controls?.isLocked) return;
    const active = GAME.getActiveItem?.();
    // Не стреляем из building_plan / hammer — их обрабатывает building.js
    if (active && (active.type === 'building_plan' || active.type === 'hammer')) return;
    if (e.button === 0 && gunState.current) shoot(0.01);
  });

  addEventListener('keydown', (e) => {
    if (e.code === 'KeyR' && GAME.controls?.isLocked) {
      // R конфликт с поворотом блока — если план в руке, не перезаряжаем
      const active = GAME.getActiveItem?.();
      if (active?.type === 'building_plan' || active?.type === 'hammer') return;
      reload();
    }
  });

  // =============================================================
  // PvE: Учёные и Вертолёт
  // =============================================================
  const NPCS = [];
  GAME.NPCS = NPCS;

  function spawnScientist(x, z) {
    const group = new THREE.Group();
    const body = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.35, 1.1, 4, 8),
      new THREE.MeshLambertMaterial({ color: 0x2a4a8a }),
    );
    body.position.y = 0.9;
    const head = new THREE.Mesh(
      new THREE.SphereGeometry(0.28, 10, 8),
      new THREE.MeshLambertMaterial({ color: 0xd9b28f }),
    );
    head.position.y = 1.75;
    group.add(body); group.add(head);
    group.position.set(x, 0, z);
    group.castShadow = true;
    scene.add(group);

    body.userData.npc = head.userData.npc = { hp: 100 };
    const npc = {
      mesh: group, bodyMesh: body, hp: 100, maxHp: 100,
      target: null, fireCooldown: 0, patrolT: 0,
      patrolCenter: new THREE.Vector3(x, 0, z),
    };
    body.userData.npc = npc; head.userData.npc = npc;
    NPCS.push(npc);
    return npc;
  }

  function killNpc(npc) {
    scene.remove(npc.mesh);
    npc.mesh.traverse(o => { o.geometry?.dispose?.(); o.material?.dispose?.(); });
    const i = NPCS.indexOf(npc);
    if (i >= 0) NPCS.splice(i, 1);
    GAME.logConsole?.('Учёный убит');
  }

  function updateNpcs(dt) {
    const player = GAME.player;
    if (!player?.body) return;
    const pp = player.body.position;

    for (const npc of NPCS) {
      const p = npc.mesh.position;
      const dist = Math.hypot(pp.x - p.x, pp.z - p.z);

      if (dist < 40) {
        // Заметили игрока — идут и стреляют
        const dx = pp.x - p.x, dz = pp.z - p.z;
        const len = Math.hypot(dx, dz) || 1;
        p.x += (dx / len) * 1.5 * dt;
        p.z += (dz / len) * 1.5 * dt;
        npc.mesh.rotation.y = Math.atan2(dx, dz);

        npc.fireCooldown -= dt;
        if (npc.fireCooldown <= 0 && dist < 30) {
          npc.fireCooldown = 0.4;
          GAME.playSound('smg');
          // Искра у игрока (визуальный выстрел в сторону игрока)
          spawnSpark(new THREE.Vector3(pp.x, pp.y + 1, pp.z), 0xff4444);
          // Урон игроку (если не god)
          if (!player.god && Math.random() < 0.3) {
            player.hp = Math.max(0, player.hp - 5);
            document.getElementById('hp-fill').style.width = (player.hp / player.maxHp * 100) + '%';
          }
        }
      } else {
        // Патруль вокруг центра
        npc.patrolT += dt * 0.3;
        p.x = npc.patrolCenter.x + Math.cos(npc.patrolT) * 6;
        p.z = npc.patrolCenter.z + Math.sin(npc.patrolT) * 6;
        npc.mesh.rotation.y = -npc.patrolT + Math.PI / 2;
      }
    }
  }

  // ---------- Вертолёт (раз в 15 мин) ----------
  let heli = null;
  let heliTimer = 15 * 60; // 15 мин первого появления

  function spawnHeli() {
    const group = new THREE.Group();
    const body = new THREE.Mesh(
      new THREE.BoxGeometry(2, 1.4, 4),
      new THREE.MeshLambertMaterial({ color: 0x333333 }),
    );
    const tail = new THREE.Mesh(
      new THREE.BoxGeometry(0.4, 0.4, 3),
      new THREE.MeshLambertMaterial({ color: 0x333333 }),
    );
    tail.position.z = -3;
    const rotor = new THREE.Mesh(
      new THREE.BoxGeometry(7, 0.06, 0.2),
      new THREE.MeshLambertMaterial({ color: 0x111111 }),
    );
    rotor.position.y = 1.0;
    group.add(body); group.add(tail); group.add(rotor);
    group.position.set(100, 40, 100);
    scene.add(group);

    heli = { mesh: group, rotor, hp: 500, fireCooldown: 0, angle: 0 };
  }

  function updateHeli(dt) {
    heliTimer -= dt;
    if (!heli && heliTimer <= 0) { spawnHeli(); heliTimer = 15 * 60; }
    if (!heli) return;

    heli.rotor.rotation.y += dt * 30;
    heli.angle += dt * 0.2;
    heli.mesh.position.x = Math.cos(heli.angle) * 80;
    heli.mesh.position.z = Math.sin(heli.angle) * 80;
    heli.mesh.rotation.y = -heli.angle + Math.PI / 2;

    heli.fireCooldown -= dt;
    const player = GAME.player;
    if (heli.fireCooldown <= 0 && player?.body) {
      heli.fireCooldown = 1.0;
      GAME.playSound('smg');
      const pp = player.body.position;
      spawnSpark(new THREE.Vector3(pp.x, pp.y + 1.5, pp.z), 0xff8800);
      if (!player.god && Math.random() < 0.2) {
        player.hp = Math.max(0, player.hp - 10);
        document.getElementById('hp-fill').style.width = (player.hp / player.maxHp * 100) + '%';
      }
    }

    if (heli.hp <= 0) {
      scene.remove(heli.mesh);
      heli.mesh.traverse(o => { o.geometry?.dispose?.(); o.material?.dispose?.(); });
      heli = null;
      GAME.logConsole?.('Вертолёт уничтожен!');
    }
  }

  // =============================================================
  // ЭЛЕКТРИКА
  // =============================================================
  const elecNodes = []; // { id, mesh, kind, produce, consume, input, output, store, capacity }
  const elecWires = []; // { from, to, mesh }
  let nodeId = 0;
  GAME.elecNodes = elecNodes;

  function addElecNode(kind, pos) {
    const meshes = {
      solar:         () => new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.1, 1.2), new THREE.MeshLambertMaterial({ color: 0x223366 })),
      windmill:      () => {
        const g = new THREE.Group();
        const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 3, 8), new THREE.MeshLambertMaterial({ color: 0x999 }));
        pole.position.y = 1.5; g.add(pole);
        const blades = new THREE.Mesh(new THREE.BoxGeometry(2, 0.1, 0.1), new THREE.MeshLambertMaterial({ color: 0xeee }));
        blades.position.y = 3; g.add(blades);
        g.userData.blades = blades;
        return g;
      },
      battery_small: () => new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.6, 0.4), new THREE.MeshLambertMaterial({ color: 0x4a8 })),
      battery_large: () => new THREE.Mesh(new THREE.BoxGeometry(1, 1.2, 0.6), new THREE.MeshLambertMaterial({ color: 0x4a8 })),
      lamp:          () => new THREE.Mesh(new THREE.SphereGeometry(0.2, 12, 8), new THREE.MeshBasicMaterial({ color: 0xffe080 })),
      searchlight:   () => new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.4, 0.6), new THREE.MeshLambertMaterial({ color: 0x555 })),
    };
    const make = meshes[kind] || (() => new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.4, 0.4), new THREE.MeshLambertMaterial({ color: 0x888 })));
    const mesh = make();
    mesh.position.copy(pos);
    mesh.castShadow = true;
    scene.add(mesh);
    mesh.userData.interactable = true;
    mesh.userData.tooltip = 'E — подключить провод';

    const kindDef = {
      solar:         { produce: 20,  consume: 0, capacity: 0 },
      windmill:      { produce: 150, consume: 0, capacity: 0 },
      battery_small: { produce: 0,   consume: 0, capacity: 50,  store: 0 },
      battery_large: { produce: 0,   consume: 0, capacity: 100, store: 0, eff: 0.8 },
      lamp:          { produce: 0,   consume: 1,  capacity: 0 },
      searchlight:   { produce: 0,   consume: 5,  capacity: 0 },
      auto_turret:   { produce: 0,   consume: 10, capacity: 0 },
      flame_turret:  { produce: 0,   consume: 8,  capacity: 0 },
    }[kind] || { produce: 0, consume: 0, capacity: 0 };

    const node = {
      id: ++nodeId, kind, mesh, input: 0, output: 0, powered: false,
      ...kindDef,
    };
    mesh.userData.elecNode = node;
    elecNodes.push(node);
    return node;
  }
  GAME.addElecNode = addElecNode;

  // Провод (кривая Безье)
  let wireFrom = null;
  function connectWire(from, to) {
    const p0 = from.mesh.position;
    const p1 = to.mesh.position;
    const mid = new THREE.Vector3((p0.x + p1.x) / 2, (p0.y + p1.y) / 2 - 0.6, (p0.z + p1.z) / 2);
    const curve = new THREE.QuadraticBezierCurve3(p0, mid, p1);
    const geom = new THREE.TubeGeometry(curve, 16, 0.03, 6, false);
    const mat = new THREE.MeshBasicMaterial({ color: 0xff7f24 });
    const mesh = new THREE.Mesh(geom, mat);
    scene.add(mesh);
    elecWires.push({ from, to, mesh });
  }

  GAME.on('interact', (obj) => {
    const node = obj.userData?.elecNode;
    if (!node) return;
    if (!wireFrom) { wireFrom = node; GAME.logConsole?.('Источник выбран: ' + node.kind); }
    else if (wireFrom !== node) {
      connectWire(wireFrom, node);
      GAME.logConsole?.('Провод: ' + wireFrom.kind + ' → ' + node.kind);
      wireFrom = null;
    }
  });

  // Пересчёт энергосети (простой граф)
  function updateElectricity(dt) {
    // Сброс
    for (const n of elecNodes) { n.input = 0; n.powered = false; }

    // Генераторы: ветряк всегда, солнечная — днём
    const dayFactor = Math.max(0, GAME.sun?.intensity || 1);
    for (const n of elecNodes) {
      if (n.kind === 'solar') n.output = n.produce * dayFactor;
      else if (n.kind === 'windmill') n.output = n.produce;
      else if (n.capacity > 0) {
        // Аккумулятор: если есть запас — отдаёт до consume
        n.output = n.store > 0 ? Math.min(n.store, n.produce || 50) : 0;
      } else n.output = 0;
    }

    // Распределение по проводам (упрощённо: сумма по рёбрам)
    for (const w of elecWires) {
      const give = Math.min(w.from.output, Math.max(0, w.to.consume - w.to.input) || w.from.output);
      w.to.input += give;
      w.from.output -= give;
      if (w.to.capacity > 0) {
        const eff = w.to.eff || 1;
        w.to.store = Math.min(w.to.capacity, w.to.store + give * dt * eff);
      }
    }
    for (const n of elecNodes) {
      n.powered = n.input >= n.consume && n.consume > 0;
      // Лампа светится
      if (n.kind === 'lamp') {
        n.mesh.material.color.setHex(n.powered ? 0xffe080 : 0x333300);
      }
      if (n.kind === 'searchlight') {
        n.mesh.material.color.setHex(n.powered ? 0xffe080 : 0x222);
      }
    }
    // Ветрогенератор крутит лопасти
    for (const n of elecNodes) {
      if (n.kind === 'windmill') n.mesh.userData.blades.rotation.z += dt * 5;
    }
  }

  // =============================================================
  // ТУРЕЛИ
  // =============================================================
  const TURRETS = [];
  GAME.TURRETS = TURRETS;

  function spawnAutoTurret(pos) {
    const g = new THREE.Group();
    const tripod = new THREE.Mesh(
      new THREE.CylinderGeometry(0.4, 0.5, 0.8, 8),
      new THREE.MeshLambertMaterial({ color: 0x555 }),
    );
    tripod.position.y = 0.4; g.add(tripod);
    const head = new THREE.Mesh(
      new THREE.BoxGeometry(0.4, 0.3, 0.6),
      new THREE.MeshLambertMaterial({ color: 0x444 }),
    );
    head.position.y = 0.95; g.add(head);
    const barrel = new THREE.Mesh(
      new THREE.CylinderGeometry(0.04, 0.04, 0.8, 6),
      new THREE.MeshLambertMaterial({ color: 0x222 }),
    );
    barrel.rotation.x = Math.PI / 2; barrel.position.set(0, 0.95, 0.6); g.add(barrel);
    // Красный лазер
    const laserGeom = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, 0.95, 0.6), new THREE.Vector3(0, 0.95, 30),
    ]);
    const laser = new THREE.Line(laserGeom, new THREE.LineBasicMaterial({ color: 0xff2020, transparent: true, opacity: 0.5 }));
    g.add(laser);

    g.position.copy(pos);
    scene.add(g);

    const node = addElecNode('auto_turret', pos);
    const turret = {
      mesh: g, head, barrel, laser, hp: 200, fireCooldown: 0,
      kind: 'auto', node, range: 30,
    };
    g.userData.turret = turret;
    g.userData.interactable = true;
    g.userData.tooltip = 'E — настроить турель';
    TURRETS.push(turret);
    return turret;
  }
  GAME.spawnAutoTurret = spawnAutoTurret;

  function spawnFlameTurret(pos) {
    const g = new THREE.Group();
    const body = new THREE.Mesh(
      new THREE.BoxGeometry(0.5, 0.6, 0.6),
      new THREE.MeshLambertMaterial({ color: 0x555 }),
    );
    body.position.y = 0.3; g.add(body);
    const nozzle = new THREE.Mesh(
      new THREE.CylinderGeometry(0.08, 0.12, 0.4, 8),
      new THREE.MeshLambertMaterial({ color: 0xff6a00 }),
    );
    nozzle.rotation.x = Math.PI / 2; nozzle.position.set(0, 0.3, 0.4); g.add(nozzle);
    g.position.copy(pos);
    scene.add(g);
    const node = addElecNode('flame_turret', pos);
    const turret = { mesh: g, hp: 150, kind: 'flame', node, fireCooldown: 0, range: 6, particles: [] };
    g.userData.turret = turret;
    TURRETS.push(turret);
    return turret;
  }
  GAME.spawnFlameTurret = spawnFlameTurret;

  function removeTurret(turret) {
    scene.remove(turret.mesh);
    turret.mesh.traverse(o => { o.geometry?.dispose?.(); o.material?.dispose?.(); });
    const i = TURRETS.indexOf(turret);
    if (i >= 0) TURRETS.splice(i, 1);
    const j = elecNodes.indexOf(turret.node);
    if (j >= 0) elecNodes.splice(j, 1);
  }

  function updateTurrets(dt) {
    for (const t of TURRETS) {
      if (!t.node.powered) { t.laser && (t.laser.visible = false); continue; }
      t.laser && (t.laser.visible = true);

      // Ищем ближайшего NPC (или вертолёт) в радиусе
      let best = null, bestD = t.range;
      const check = (obj) => {
        const d = obj.mesh.position.distanceTo(t.mesh.position);
        if (d < bestD) { bestD = d; best = obj; }
      };
      NPCS.forEach(check);
      if (heli) check(heli);

      if (best) {
        const dir = new THREE.Vector3().subVectors(best.mesh.position, t.mesh.position);
        if (t.head) t.head.rotation.y = Math.atan2(dir.x, dir.z);
        t.fireCooldown -= dt;
        if (t.fireCooldown <= 0) {
          t.fireCooldown = t.kind === 'flame' ? 0.3 : 0.2;
          GAME.playSound(t.kind === 'flame' ? 'shotgun' : 'rifle');
          spawnSpark(best.mesh.position.clone(), t.kind === 'flame' ? 0xff6a00 : 0xffaa00);
          best.hp -= t.kind === 'flame' ? 15 : 25;
          if (best.hp <= 0) {
            if (best === heli) heli = null;
            else killNpc(best);
          }
        }
      }
    }
  }

  // =============================================================
  // ЗВУКИ ШАГОВ
  // =============================================================
  let stepTimer = 0;
  function updateSteps(dt) {
    const player = GAME.player;
    if (!player?.body) return;
    const v = player.body.velocity;
    const speed = Math.hypot(v.x, v.z);
    if (speed < 0.5 || !player.onGround) { stepTimer = 0.2; return; }
    stepTimer -= dt;
    if (stepTimer <= 0) {
      stepTimer = player.running ? 0.3 : 0.5;
      // Тип поверхности — упрощённо: если стоим на блоке, то wood/metal/etc
      // Проверяем ближайший блок внизу
      let surface = 'step';
      if (GAME.BLOCKS) {
        const pp = player.body.position;
        for (const b of GAME.BLOCKS) {
          if (Math.abs(b.mesh.position.x - pp.x) < 2 &&
              Math.abs(b.mesh.position.z - pp.z) < 2 &&
              Math.abs(b.mesh.position.y - pp.y + 1) < 2) {
            if (b.tier === 'wood') surface = 'step_wood';
            else if (b.tier === 'metal' || b.tier === 'armored') surface = 'step_metal';
            break;
          }
        }
      }
      GAME.playSound(surface);
    }
  }

  // =============================================================
  // ОТДАЧА КАМЕРЫ
  // =============================================================
  function updateRecoil(dt) {
    // Плавно возвращаемся
    if (gunState.recoilOffset > 0) {
      camera.rotation.x += gunState.recoilOffset * 0.5;
      gunState.recoilOffset *= Math.max(0, 1 - dt * 8);
    }
  }

  // =============================================================
  // СПАВН УЧЁНЫХ ПРИ СТАРТЕ
  // =============================================================
  GAME.on('gameStart', () => {
    for (let i = 0; i < 6; i++) {
      const a = Math.random() * Math.PI * 2;
      const r = 30 + Math.random() * 100;
      spawnScientist(Math.cos(a) * r, Math.sin(a) * r);
    }
    GAME.logConsole?.('Игра запущена. Учёные патрулируют карту.');
  });

  // =============================================================
  // ГЛАВНЫЙ FRAME-ХУК
  // =============================================================
  GAME.on('frame', (dt) => {
    updateSparks(dt);
    updateNpcs(dt);
    updateHeli(dt);
    updateElectricity(dt);
    updateTurrets(dt);
    updateSteps(dt);
    updateRecoil(dt);
  });

  GAME.logConsole?.('Оружие, электрика, турели, PvE загружены.');
});
