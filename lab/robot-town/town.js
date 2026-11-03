// 小鎮：一張圓桌、環狀路、中央工作坊、十個任務站、可以撞的東西；主角機器人開車（有慣性、會後仰點頭、撞到壓扁回彈）。
// DRIVE：車子的物理（小鎮和第 1 關共用）。TOWN(core)：建好小鎮，回傳 update／輸入／相機用的介面。
window.DRIVE = (() => {
  'use strict';
  const { lerp, wobble, poke } = S3;
  const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
  const wrapA = a => { while (a > Math.PI) a -= 2 * Math.PI; while (a < -Math.PI) a += 2 * Math.PI; return a; };
  function car(x = 0, z = 0, th = 0) { return { x, z, th, v: 0, pv: 0, turn: 0, pitch: 0, roll: 0, walk: 0, max: 8, acc: 18, lat: 0, r: .62 }; }
  // want：{ dx, dz }（世界方向，長度 0～1）或 null。方向鍵＝世界的上下左右（鏡頭固定朝北）
  function step(c, dt, want, brake = false) {
    let thr = 0, turn = 0;
    if (want) {
      const mag = Math.min(1, Math.hypot(want.dx, want.dz));
      if (mag > .1) {
        const d = wrapA(Math.atan2(want.dx, want.dz) - c.th);
        turn = clamp(d * 3.5, -1, 1);
        thr = mag * (Math.abs(d) < 1.2 ? 1 : .12);
      }
    }
    const rate = turn * 3.6;
    c.th = wrapA(c.th + rate * dt);
    c.v += thr * c.acc * dt;
    c.v -= c.v * (thr ? .85 : brake ? 6 : 2.6) * dt;
    c.v = clamp(c.v, -c.max * .4, c.max);
    c.x += Math.sin(c.th) * c.v * dt; c.z += Math.cos(c.th) * c.v * dt;
    const a = (c.v - c.pv) / Math.max(dt, 1e-3); c.pv = c.v;
    c.lat = Math.abs(c.v * rate);
    c.pitch = lerp(c.pitch, clamp(-a * .011, -.15, .15), 1 - Math.pow(.002, dt));     // 加速後仰、煞車點頭
    c.roll = lerp(c.roll, clamp(-c.v * rate * .012, -.12, .12), 1 - Math.pow(.01, dt)); // 轉彎往外側傾
    c.turn = turn;
  }
  // 把車子的狀態套到機器人模型上（輪子轉、腿走、螺旋槳轉、相機桿轉頭）
  function pose(c, b, dt, t) {
    const u = b.userData;
    b.position.set(c.x, b.position.y, c.z); b.rotation.y = c.th;
    u.lean.rotation.x = c.pitch; u.lean.rotation.z = c.roll;
    wobble(u.jel, dt);
    u.wheels.forEach(w => { w.rotation.x += c.v * dt / .27; });
    const g = u.gears;
    if (g[1] && g[1].visible) g[1].userData.spin.forEach(w => { w.rotation.x += c.v * dt / .46; });
    if (g[7] && g[7].visible) {
      const sp = Math.min(1, Math.abs(c.v) / 2);
      c.walk += Math.abs(c.v) * dt * 4.2;
      g[7].userData.legs.forEach((L, i) => {
        const ph = c.walk + (i === 0 || i === 3 ? 0 : Math.PI);
        L.hip.rotation.x = Math.sin(ph) * .55 * sp;
        L.knee.rotation.x = Math.max(0, -Math.cos(ph)) * .7 * sp;
      });
      u.lean.position.y = .16 + Math.abs(Math.sin(c.walk)) * .05 * sp;
    } else u.lean.position.y = 0;
    if (g[5] && g[5].visible) g[5].userData.rotor.rotation.y += dt * (2.2 + Math.abs(c.v) * 1.5);
    if (g[4] && g[4].visible) g[4].userData.cam.rotation.y = Math.sin(t * .6) * .9;
    if (g[2] && g[2].visible) { const m = g[2].userData.glowMat; m.emissiveIntensity = Math.max(0, m.emissiveIntensity - dt * 2.5); }
  }
  // 撞到東西時保險桿亮一下
  function flashBumper(b) { const g = b.userData.gears[2]; if (g && g.visible) g.userData.glowMat.emissiveIntensity = 1.2; }

  // ---------- 可以撞的東西 ----------
  // kind：cone（輕、會倒）ball（會滾很遠、不倒）mailbox（重、搖一搖）tree（不動、搖一搖）bench（重、滑一點）
  const KIND = {
    cone: { r: .34, m: 1, fr: .04, tip: 1.15, bounce: .4 },
    ball: { r: .42, m: .8, fr: .5, tip: 0, bounce: .8 },
    mailbox: { r: .32, m: 3, fr: .002, tip: .3, bounce: .2 },
    tree: { r: .5, m: 99, fr: 0, tip: .16, bounce: .1 },
    bench: { r: .78, m: 3.5, fr: .01, tip: .12, bounce: .2 },
    box: { r: .42, m: 1.4, fr: .02, tip: .5, bounce: .3 },
  };
  function prop(obj, kind, x, z, o = {}) {
    const k = KIND[kind];
    const p = Object.assign({ obj, kind, x, z, vx: 0, vz: 0, r: k.r, m: k.m, fr: k.fr, tipMax: k.tip, bounce: k.bounce, tip: 0, tipDir: 0, spin: 0, ry: obj.rotation.y, home: { x, z } }, o);
    S3.jelly(obj, 140, 7);
    obj.position.set(x, 0, z);
    return p;
  }
  // 車子撞東西：東西被推開、倒下、再站回來；車子壓扁一下
  function hitProps(c, b, props, sfx) {
    let hit = null;
    props.forEach(p => {
      if (p.off) return;
      const dx = p.x - c.x, dz = p.z - c.z, d = Math.hypot(dx, dz), minD = p.r + c.r;
      if (d < minD && d > 1e-4) {
        const nx = dx / d, nz = dz / d;
        const sp = Math.abs(c.v), push = Math.max(1.4, sp * 1.05) / Math.sqrt(p.m);
        if (p.m < 50) { p.vx += nx * push; p.vz += nz * push; }
        const k = p.m > 50 ? 1 : .6;
        c.x -= nx * (minD - d) * k; c.z -= nz * (minD - d) * k;
        if (p.m > 5) c.v *= -.3; else c.v *= .65;
        if (sp > .6 || !p.touch) {
          p.tip = Math.max(p.tip, sp > 2.5 || p.m < 2 ? 1 : .5); p.tipDir = Math.atan2(nz, nx); p.spin = (Math.random() - .5) * 5;
          poke(p.obj, .35 + Math.min(.3, sp * .05)); poke(b.userData.jel, .2 + Math.min(.25, sp * .03));
          flashBumper(b);
          if (sfx) sfx(p);
        }
        p.touch = true;
        hit = p;
      } else p.touch = false;
    });
    return hit;
  }
  // 東西自己的物理：滑、互撞（連鎖）、邊界彈回、倒下再站回來
  function stepProps(props, dt, bound, sfx) {
    for (let i = 0; i < props.length; i++) for (let j = i + 1; j < props.length; j++) {
      const a = props[i], b = props[j];
      if (a.off || b.off) continue;
      const dx = b.x - a.x, dz = b.z - a.z, d = Math.hypot(dx, dz), minD = a.r + b.r;
      if (d < minD && d > 1e-4) {
        const nx = dx / d, nz = dz / d, ov = minD - d, wa = b.m / (a.m + b.m), wb = a.m / (a.m + b.m);
        if (a.m < 50) { a.x -= nx * ov * wa; a.z -= nz * ov * wa; }
        if (b.m < 50) { b.x += nx * ov * wb; b.z += nz * ov * wb; }
        const rv = (b.vx - a.vx) * nx + (b.vz - a.vz) * nz;
        if (rv < 0) {
          const imp = -rv * 1.2;
          if (a.m < 50) { a.vx -= nx * imp * wa; a.vz -= nz * imp * wa; }
          if (b.m < 50) { b.vx += nx * imp * wb; b.vz += nz * imp * wb; }
          if (imp > .8) { [a, b].forEach(p => { poke(p.obj, .25); if (p.tipMax && imp > 1.5) { p.tip = Math.max(p.tip, .6); p.tipDir = Math.atan2(p === a ? -nz : nz, p === a ? -nx : nx); } }); if (sfx) sfx(b, true); }
        }
      }
    }
    props.forEach(p => {
      if (p.off) return;
      p.x += p.vx * dt; p.z += p.vz * dt;
      const f = Math.pow(p.fr, dt); p.vx *= f; p.vz *= f;
      if (bound) bound(p);
      p.obj.position.x = p.x; p.obj.position.z = p.z;
      wobble(p.obj, dt);
      const sp = Math.hypot(p.vx, p.vz);
      if (p.kind === 'ball' && sp > .01) {        // 球：沿著滾的方向轉
        const ax = new THREE.Vector3(p.vz, 0, -p.vx).normalize();
        p.obj.rotateOnWorldAxis(ax, sp * dt / p.r);
      } else if (p.tipMax) {
        if (p.tip > 0) {
          p.tip = Math.max(0, p.tip - dt * (p.m > 2 ? 1.6 : .55));
          const k = p.m > 2 ? Math.sin(p.tip * Math.PI * 3) * p.tip : Math.sin(Math.min(1, p.tip) * Math.PI);
          const amt = k * p.tipMax;
          p.obj.rotation.set(Math.sin(p.tipDir) * amt, p.ry, -Math.cos(p.tipDir) * amt, 'YXZ');
          p.ry += p.spin * dt * p.tip;
        } else { p.obj.rotation.x = lerp(p.obj.rotation.x, 0, .2); p.obj.rotation.z = lerp(p.obj.rotation.z, 0, .2); }
      }
    });
  }
  return { car, step, pose, prop, hitProps, stepProps, flashBumper, wrapA, clamp, KIND };
})();

window.TOWN = function (core) {
  'use strict';
  const { T, A, S3, scene, SFX, tween, wait, lerp, ease, outBack } = core;
  const { poke, wobble, jelly } = S3;
  const D = DRIVE, clamp = D.clamp;
  const R_TABLE = 16, R_ROAD = 9.8, R_ST = 13, BS = .5;
  const ang = (deg, r) => { const a = deg * Math.PI / 180; return { x: -r * Math.sin(a), z: r * Math.cos(a), a }; };

  scene.add(A.table(R_TABLE));
  scene.add(A.road(R_ROAD, 2.6));
  // 路中間一圈短短的紙色虛線
  {
    const im = new T.InstancedMesh(new T.BoxGeometry(.5, .012, .12), A.M.paper, 40), m4 = new T.Matrix4(), q = new T.Quaternion(), one = new T.Vector3(1, 1, 1);
    for (let k = 0; k < 40; k++) {
      const a = k / 40 * Math.PI * 2;
      im.setMatrixAt(k, m4.compose(new T.Vector3(-R_ROAD * Math.sin(a), .012, R_ROAD * Math.cos(a)), q.setFromAxisAngle(new T.Vector3(0, 1, 0), -a), one));
    }
    im.receiveShadow = true; scene.add(im);
  }
  const decor = new T.Group(); scene.add(decor);
  const ws = A.workshop(); ws.position.set(0, 0, -.6); decor.add(ws);
  const WU = ws.userData;
  const STATICS = [[-1.1, -1.2, 1.55], [1.1, -1.2, 1.55], [0, -1.2, 1.6], [-2.2, 1.45, .55], [-1.1, 1.45, .55], [0, 1.45, .55], [1.1, 1.45, .55], [2.2, 1.45, .55]];

  // ---------- 十個任務站：從正南（鏡頭前面）開始，順時針 ----------
  const ST = [];
  for (let n = 1; n <= 10; n++) {
    const p = ang((n - 1) * 36, R_ST);
    const s = A.station(n); s.position.set(p.x, 0, p.z); decor.add(s);
    jelly(s.userData.post, 150, 8); jelly(s.userData.emblem, 150, 8);
    ST[n] = { n, g: s, x: p.x, z: p.z, hold: 0, armed: true, shake: 0 };
  }
  const stationPos = n => new T.Vector3(ST[n].x, 0, ST[n].z);

  // ---------- 可以撞的東西（少而精） ----------
  const props = [];
  const addProp = (obj, kind, deg, r, o) => { const p = ang(deg, r); obj.rotation.y = o && o.ry || 0; decor.add(obj); const pr = D.prop(obj, kind, p.x, p.z, o); props.push(pr); return pr; };
  [54, 162, 270].forEach(d => { addProp(A.cone(), 'cone', d - 3, R_ROAD - .55); addProp(A.cone(), 'cone', d + 3, R_ROAD + .55); });
  [[100, 6.4, A.C.sky], [220, 6.6, A.C.amber], [340, 6.2, A.C.green]].forEach(([d, r, c]) => addProp(A.ball(c), 'ball', d, r));
  [126, 306].forEach(d => addProp(A.mailbox(), 'mailbox', d, 12.4, { ry: -d * Math.PI / 180 }));
  [[18, 14.7], [90, 14.8], [198, 14.7], [234, 14.8], [342, 14.6], [150, 6.2]].forEach(([d, r], i) => addProp(A.tree(i), 'tree', d, r));
  [[45, 6.6], [300, 6.7]].forEach(([d, r]) => addProp(A.bench(), 'bench', d, r, { ry: -(d) * Math.PI / 180 }));
  const propSfx = (p, chain) => { if (p.kind === 'tree') SFX.leaf(); else SFX.bump(chain ? 1 : 0); };
  function bound(p) {
    const r = Math.hypot(p.x, p.z), lim = R_TABLE - .6 - p.r;
    if (r > lim) { const nx = p.x / r, nz = p.z / r; p.x = nx * lim; p.z = nz * lim; const vn = p.vx * nx + p.vz * nz; if (vn > 0) { p.vx -= (1 + p.bounce) * vn * nx; p.vz -= (1 + p.bounce) * vn * nz; } }
    STATICS.forEach(([sx, sz, sr]) => {
      const dx = p.x - sx, dz = p.z - sz, d = Math.hypot(dx, dz), m = sr + p.r;
      if (d < m && d > 1e-4) { const nx = dx / d, nz = dz / d; p.x = sx + nx * m; p.z = sz + nz * m; const vn = p.vx * nx + p.vz * nz; if (vn < 0) { p.vx -= (1 + p.bounce) * vn * nx; p.vz -= (1 + p.bounce) * vn * nz; } }
    });
  }

  // ---------- 主角 ----------
  const bot = A.bot(); bot.scale.setScalar(BS); scene.add(bot);
  jelly(bot.userData.jel, 150, 8);
  const car = D.car(0, 4.2, 0);
  let auto = null;                     // 自己開過去：{ x, z, n }
  let stick = null;                    // 觸控搖桿：{ ox, oy, dx, dy, on }
  const keys = { up: 0, down: 0, left: 0, right: 0 };
  const KEYMAP = { up: 'up', w: 'up', down: 'down', s: 'down', left: 'left', a: 'left', right: 'right', d: 'right' };
  let lookAt = null, lookT = 0, blinkT = 2, lockSaid = 0;

  // ---------- 點點路（太久沒動作時，從主角畫到下一站） ----------
  const dots = [];
  { const g = new T.CylinderGeometry(.13, .13, .02, 12), m = new T.MeshBasicMaterial({ color: A.C.coral, transparent: true, opacity: 0, depthWrite: false });
    for (let i = 0; i < 40; i++) { const d = new T.Mesh(g, m.clone()); d.position.y = .03; d.visible = false; scene.add(d); dots.push(d); } }
  let pathOn = false;

  // ---------- 架子上的裝備（做完的任務，裝備也擺一份在架子上） ----------
  const minis = {};
  function refresh() {
    const done = core.nextStation ? [] : [];
    for (let n = 1; n <= 9; n++) {
      const has = (window.G.S.done || []).includes(n);
      if (has && !minis[n]) {
        const m = A.gearShow(n); m.scale.multiplyScalar(.42); WU.slots[n - 1].add(m); jelly(m, 150, 7); minis[n] = m;
        m.traverse(o => { if (o.isMesh) o.castShadow = true; });
      }
      if (minis[n]) {
        minis[n].visible = has;
        const on = core.gearList().includes(n);
        minis[n].userData.inner.position.y = (A.gearShow(n).userData.inner.position.y) + (on ? 0 : 0);
        minis[n].userData.dim = !on;
      }
    }
  }
  const shelfPop = n => { if (minis[n]) poke(minis[n], .5); };
  function signOn() { tween(core.FAST ? .05 : 1.2, k => { WU.signMat.emissiveIntensity = k * .9; WU.signMat.color.lerpColors(new T.Color(A.C.wood), new T.Color(A.C.amber), k); }); poke(ws, .3); }
  if ((window.G.S.done || []).includes(10)) { WU.signMat.emissiveIntensity = .9; WU.signMat.color.setHex(A.C.amber); }
  function sparkle() { Object.values(minis).forEach((m, i) => setTimeout(() => { poke(m, .5); SFX.near(); }, i * 90)); poke(bot.userData.jel, .4); }
  jelly(ws, 120, 8);

  // ---------- 路線：被工作坊擋住就沿著環狀路繞 ----------
  function segDist(ax, az, bx, bz, px, pz) {
    const vx = bx - ax, vz = bz - az, l2 = vx * vx + vz * vz || 1;
    const t = clamp(((px - ax) * vx + (pz - az) * vz) / l2, 0, 1);
    return Math.hypot(ax + vx * t - px, az + vz * t - pz);
  }
  function routeDir(x, z, tx, tz) {
    if (segDist(x, z, tx, tz, 0, -.4) > 3.9) return { dx: tx - x, dz: tz - z };
    const rb = Math.hypot(x, z);
    const pb = Math.atan2(x, z), pt = Math.atan2(tx, tz), dp = D.wrapA(pt - pb);
    if (rb < R_ROAD - 1.5) return { dx: Math.sin(pb), dz: Math.cos(pb) };
    const a = pb + Math.sign(dp || 1) * .5;
    return { dx: Math.sin(a) * R_ROAD - x, dz: Math.cos(a) * R_ROAD - z };
  }
  function goTo(n) {
    if (!core.allowed(n)) { nudgeStation(n); return; }
    auto = { x: ST[n].x, z: ST[n].z, n };
    ST[n].armed = true;
    SFX.tap();
  }
  function nudgeStation(n) {
    const s = ST[n]; poke(s.g.userData.post, .4); poke(s.g.userData.emblem, .4); s.shake = 1; SFX.no();
    const now = performance.now();
    if (now - lockSaid > 6000) { lockSaid = now; core.talk('town.locked'); }
  }

  // ---------- 輸入 ----------
  const pickables = () => ST.slice(1).map(s => s.g).concat(props.map(p => p.obj), [bot, ws]);
  function stationAt(p) {
    let best = 0, bd = 60;
    for (let n = 1; n <= 10; n++) {
      const q = core.sp(new T.Vector3(ST[n].x, .3, ST[n].z)), q2 = core.sp(new T.Vector3(ST[n].x, 1.4, ST[n].z - 1.25));
      const d = Math.min(Math.hypot(q.x - p.x, q.y - p.y), Math.hypot(q2.x - p.x, q2.y - p.y));
      if (d < bd) { bd = d; best = n; }
    }
    return best;
  }
  function ray(p) { const r = new T.Raycaster(); r.setFromCamera(new T.Vector2(p.x / core.v.w * 2 - 1, -(p.y / core.v.h) * 2 + 1), core.cam); return r; }
  function tap(p) {
    const n = stationAt(p);
    if (n) { goTo(n); return; }
    const hit = ray(p).intersectObjects(pickables(), true)[0];
    let o = hit && hit.object, target = null;
    while (o && !target) { if (o === bot || o === ws || ST.some(s => s && s.g === o) || props.some(q => q.obj === o)) target = o; else o = o.parent; }
    if (target === bot) { poke(bot.userData.jel, .45); SFX.snap(); blinkT = 0; return; }
    if (target === ws) {
      // 自由玩：點架子上的裝備＝裝上／拿下
      if (core.free) {
        const slot = WU.slots.findIndex(s => { let q = hit.object; while (q) { if (q === s) return true; q = q.parent; } return false; });
        if (slot >= 0 && minis[slot + 1]) { core.toggleGear && core.toggleGear(slot + 1); return; }
      }
      poke(ws, .25); SFX.bump(1); return;
    }
    const pr = props.find(q => q.obj === target);
    if (pr) { poke(pr.obj, .5); pr.tip = Math.max(pr.tip, .5); pr.tipDir = Math.random() * 6.28; pr.spin = (Math.random() - .5) * 4; propSfx(pr); return; }
    // 點地上：開過去
    const g = new T.Vector3();
    if (ray(p).ray.intersectPlane(new T.Plane(new T.Vector3(0, 1, 0), 0), g) && Math.hypot(g.x, g.z) < R_TABLE - 1) { auto = { x: g.x, z: g.z, n: 0 }; SFX.tap(); }
  }
  let down = null;
  const stickEl = core.stickEl, knob = stickEl && stickEl.firstElementChild;
  function showStick(on) {
    if (!stickEl) return;
    stickEl.hidden = !on;
    if (!on) return;
    stickEl.style.transform = 'translate(' + down.x + 'px,' + down.y + 'px)';
  }
  const api = {
    bot, decor, stationPos, onEnter: null,
    down(p) { down = { x: p.x, y: p.y, t: p.t, moved: false }; stick = null; },
    move(p) {
      if (!down) return;
      const dx = p.x - down.x, dy = p.y - down.y, d = Math.hypot(dx, dy);
      if (!down.moved && d < 12) return;
      if (!down.moved) { down.moved = true; auto = null; showStick(true); }
      const R = 64, k = Math.min(1, d / R);
      stick = { dx: dx / (d || 1) * k, dy: dy / (d || 1) * k };
      if (knob) knob.style.transform = 'translate(' + (stick.dx * R).toFixed(1) + 'px,' + (stick.dy * R).toFixed(1) + 'px)';
    },
    up(p) {
      if (!down) return;
      const was = down; down = null; stick = null; showStick(false);
      if (knob) knob.style.transform = '';
      if (!was.moved && !p.cancel) tap(p);
    },
    hover(p) {
      const n = stationAt(p);
      let over = !!n;
      if (!over) { const hit = ray(p).intersectObjects(props.map(q => q.obj).concat([bot]), true)[0]; over = !!hit; }
      core.v.el.style.cursor = over ? 'pointer' : '';
    },
    key(k, isDown, rep) {
      if (KEYMAP[k]) { keys[KEYMAP[k]] = isDown ? 1 : 0; if (isDown) auto = null; return; }
      if (!isDown || rep) return;
      if (/^\d$/.test(k)) { goTo(k === '0' ? 10 : +k); return; }
      if (k === 'enter' || k === 'space') {
        const n = onMat();
        if (n) { if (core.allowed(n)) { ST[n].armed = true; ST[n].hold = .6; } else nudgeStation(n); }
        else { const nx = core.nextStation(); if (nx) goTo(nx); }
      }
    },
    caps() {
      const nx = core.free ? 0 : core.nextStation();
      if (!nx) return [];
      return [{ pos: new T.Vector3(ST[nx].x, 2.25, ST[nx].z - 1.25), text: String(nx % 10), cur: true }];
    },
    stopBot() { car.v = 0; auto = null; stick = null; down = null; showStick(false); Object.keys(keys).forEach(k => { keys[k] = 0; }); G.engine(0); },
    parkBot(n) {
      if (n && ST[n]) {
        const s = ST[n], r = Math.hypot(s.x, s.z), k = (r - 2.1) / r;
        car.x = s.x * k; car.z = s.z * k; car.th = Math.atan2(s.x, s.z) + Math.PI; s.armed = false;
        ST.forEach(q => { if (q) q.hold = 0; });
      } else { car.x = 0; car.z = 4.2; car.th = 0; }
      car.v = 0; D.pose(car, bot, 0, 0);
    },
    hideDecor(hide, hideBot) {
      return new Promise(res => {
        if (hide) { decor.visible = true; }
        const y0 = decor.position.y, y1 = hide ? -5 : 0;
        if (!hide) { decor.visible = true; bot.visible = true; }
        tween(core.FAST ? .05 : .55, k => { decor.position.y = lerp(y0, y1, ease(k)); }).then(() => {
          if (hide) { decor.visible = false; if (hideBot) bot.visible = false; }
          res();
        });
        if (hide && hideBot) setTimeout(() => { bot.visible = false; }, core.FAST ? 10 : 400);
        if (!hide) {
          const n = onMat(true); if (n) ST[n].armed = false;
        }
      });
    },
    refresh, shelfPop, signOn, sparkle,
    showPath(on) { pathOn = on; if (!on) dots.forEach(d => { d.visible = false; }); else layPath(); },
    botState: () => ({ x: +car.x.toFixed(2), z: +car.z.toFixed(2), v: +car.v.toFixed(2), th: +car.th.toFixed(2), auto: !!auto }),
    probe() {
      const s = {};
      for (let n = 1; n <= 10; n++) { const q = core.sp(new T.Vector3(ST[n].x, .1, ST[n].z)); s[n] = [Math.round(q.x), Math.round(q.y)]; }
      const b = core.sp(bot.position.clone());
      return { stations: s, bot: [Math.round(b.x), Math.round(b.y)], props: props.map(p => ({ kind: p.kind, x: +p.x.toFixed(2), z: +p.z.toFixed(2) })) };
    },
  };
  function onMat(any) {
    for (let n = 1; n <= 10; n++) if (Math.hypot(car.x - ST[n].x, car.z - ST[n].z) < (any ? 2.4 : 1.15)) return n;
    return 0;
  }
  function layPath() {
    const n = core.nextStation(); if (!n) return;
    let x = car.x, z = car.z, i = 0;
    for (let s = 0; s < 120 && i < dots.length; s++) {
      const d = routeDir(x, z, ST[n].x, ST[n].z), l = Math.hypot(d.dx, d.dz) || 1;
      x += d.dx / l * .2; z += d.dz / l * .2;
      if (s % 4 === 3) { dots[i].position.set(x, .03, z); dots[i].visible = true; dots[i].userData.k = i; i++; }
      if (Math.hypot(x - ST[n].x, z - ST[n].z) < 1.3) break;
    }
    for (; i < dots.length; i++) dots[i].visible = false;
  }

  // ---------- 每一畫面 ----------
  const tmp = new T.Vector3();
  api.update = (dt, t, active, idle) => {
    let want = null, brake = false;
    if (active) {
      const kx = keys.right - keys.left, kz = keys.down - keys.up;
      if (kx || kz) want = { dx: kx, dz: kz };
      else if (stick) want = { dx: stick.dx, dz: stick.dy };
      else if (auto) {
        const dx = auto.x - car.x, dz = auto.z - car.z, d = Math.hypot(dx, dz);
        const stop = auto.n ? .25 : .5;
        if (d < stop) { auto = null; brake = true; }
        else { const r = routeDir(car.x, car.z, auto.x, auto.z), l = Math.hypot(r.dx, r.dz) || 1, m = clamp(d / 2.6, .3, 1); want = { dx: r.dx / l * m, dz: r.dz / l * m }; }
      } else brake = true;
    } else brake = true;
    const legs = bot.userData.legs, big = bot.userData.gears[1].visible;
    car.max = legs ? 6 : big ? 10 : 8; car.acc = big ? 22 : 18;
    D.step(car, dt, want, brake);
    // 桌邊、工作坊
    const r = Math.hypot(car.x, car.z), lim = R_TABLE - 1;
    if (r > lim) { car.x *= lim / r; car.z *= lim / r; if (Math.abs(car.v) > 1.5) { SFX.bump(1); poke(bot.userData.jel, .3); D.flashBumper(bot); } car.v *= -.3; }
    STATICS.forEach(([sx, sz, sr]) => {
      const dx = car.x - sx, dz = car.z - sz, d = Math.hypot(dx, dz), m = sr + car.r;
      if (d < m && d > 1e-4) {
        car.x = sx + dx / d * m; car.z = sz + dz / d * m;
        if (Math.abs(car.v) > 1.5) { SFX.bump(1); poke(bot.userData.jel, .3); poke(ws, .12); D.flashBumper(bot); }
        car.v *= .5;
      }
    });
    D.hitProps(car, bot, props, propSfx);
    D.stepProps(props, dt, bound, propSfx);
    D.pose(car, bot, dt, t);
    G.engine(active ? Math.abs(car.v) / car.max : 0);

    // 任務站：只有「下一站」亮；做完的站是一圈淡綠；停在地墊上 0.6 秒就進去
    const breathe = .5 + .5 * Math.sin(t * 2.6), nx = core.nextStation();
    for (let n = 1; n <= 10; n++) {
      const s = ST[n], u = s.g.userData, d = Math.hypot(car.x - s.x, car.z - s.z);
      const isNext = !core.free && n === nx, done = (G.S.done || []).includes(n);
      if (!s.armed && d > 2.2) s.armed = true;
      if (active && s.armed && d < 1.15 && Math.abs(car.v) < 2.4 && !stick && !keys.up && !keys.down && !keys.left && !keys.right && (!auto || auto.n === n)) {
        if (core.allowed(n)) {
          if (s.hold === 0) SFX.near();
          s.hold += dt;
          if (s.hold >= .6) { s.hold = 0; s.armed = false; auto = null; car.v = 0; if (api.onEnter) api.onEnter(n); }
        } else if (s.armed) { s.armed = false; car.v = -4; nudgeStation(n); }
      } else if (s.hold > 0 && !(d < 1.15)) s.hold = 0;
      const k = s.hold / .6;
      u.ring.material.opacity = (isNext || core.free ? (isNext ? .35 + .3 * breathe + (idle > 5 ? .2 : 0) + (pathOn ? .2 : 0) : 0) : 0) + k * .5;
      u.ring.scale.setScalar(1 + .05 * breathe - k * .25);
      u.done.material.opacity = done ? .6 : 0;
      wobble(u.post, dt); wobble(u.emblem, dt);
      if (s.shake > 0) { u.post.rotation.z = Math.sin(t * 40) * .12 * s.shake; s.shake = Math.max(0, s.shake - dt * 2.5); } else u.post.rotation.z = 0;
      u.emblem.rotation.y = isNext ? Math.sin(t * 1.4) * .4 : 0;
    }
    if (pathOn) { if (Math.floor(t * 4) % 2 === 0) layPath(); dots.forEach((d, i) => { if (d.visible) d.material.opacity = .25 + .45 * (.5 + .5 * Math.sin(t * 4 - i * .5)); }); }
    // 架子上的裝備慢慢轉；沒裝上身的淡一點
    Object.values(minis).forEach((m, i) => { m.rotation.y = Math.sin(t * .6 + i) * .5; wobble(m, dt); });
    wobble(ws, dt);
    // 眼睛：看著下一站（或手指），偶爾眨眼
    const u = bot.userData;
    let target = null;
    if (nx && !core.free) target = tmp.set(ST[nx].x, .5, ST[nx].z);
    if (auto) target = tmp.set(auto.x, .5, auto.z);
    if (target) {
      bot.updateMatrixWorld(true);
      const lp = bot.worldToLocal(target.clone());
      const ax = clamp(Math.atan2(lp.x, lp.z) * .06, -.06, .06);
      u.pupils.forEach(pu => { pu.position.x = lerp(pu.position.x, -ax, .15); pu.position.y = lerp(pu.position.y, -.01, .15); });
    } else u.pupils.forEach(pu => { pu.position.x = lerp(pu.position.x, Math.sin(t * .7) * .04, .1); });
    blinkT -= dt;
    if (blinkT < 0) { const k = Math.min(1, -blinkT / .2); u.lens.forEach(l => { l.scale.y = 1 - Math.sin(k * Math.PI) * .9; }); if (k >= 1) blinkT = 2.5 + Math.random() * 3; }
  };
  return api;
};
