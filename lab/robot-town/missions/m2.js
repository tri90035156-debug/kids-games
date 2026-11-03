// 第 2 關 掃房間（掃地機器人：碰到就轉彎）——手勢：拖家具。
// 掃地機器人自己走直線，碰到牆或家具就壓扁一下、轉個彎再走；經過灰塵就吸掉。孩子不操控它，只幫它把擋路的東西搬開。
// 三小關：一個角落被椅子擋住 → 兩個房間、門口擋著箱子 → 灰塵藏在地毯下（把地毯拉開）。
// 三條路：手指拖家具（有重量、會傾斜）；點家具＝它自己滑到旁邊；鍵盤 Tab／空白鍵選家具、方向鍵推、Enter 移到旁邊。
// 失敗（溫柔）：9 秒都沒吸到灰塵＝「它過不去，幫它移開」，擋路的那件家具會發光。
(window.MISSIONS = window.MISSIONS || [])[2] = (() => {
  'use strict';
  const T = THREE;
  const VR = .42;                 // 掃地機器人半徑
  // 每一小關：牆（AABB）、家具（可以拖）、灰塵、起點、家具「移到旁邊」的位置、區域（找門用）
  const LV = [
    {
      walls: [[-4.6, -3.7, 4.6, -3.4], [-4.6, 3.4, 4.6, 3.7], [-4.9, -3.7, -4.6, 3.7], [4.6, -3.7, 4.9, 3.7], [1.9, -3.4, 2.2, -1.25], [2.2, -1.55, 3.0, -1.25]],
      furn: [{ kind: 'chair', x: 3.8, z: -1.35, w: 1.05, d: .95, park: [2.6, 1.6] }],
      dust: [[-3.6, -2.6], [-1.2, 2.4], [-3.4, 2.2], [.2, -1.8], [1.0, .8], [3.5, -2.9], [2.7, -2.5], [4.0, -2.3]],
      start: [-2.6, 0, .6],
      areas: [{ r: [2.2, -3.4, 4.6, -1.25], in: [3.8, -2.0], out: [3.8, -.55] }],
    },
    {
      walls: [[-4.6, -3.7, 4.6, -3.4], [-4.6, 3.4, 4.6, 3.7], [-4.9, -3.7, -4.6, 3.7], [4.6, -3.7, 4.9, 3.7], [-.15, -3.4, .15, -.7], [-.15, .7, .15, 3.4]],
      furn: [{ kind: 'box', x: 0, z: 0, w: 1.1, d: 1.1, park: [-1.9, -1.4] }, { kind: 'chair', x: 3.1, z: 1.5, w: 1.05, d: .95, park: [3.4, -1.9] }],
      dust: [[-3.5, -2.6], [-2.2, 2.4], [-3.6, .6], [2.0, -2.5], [3.6, -.8], [1.4, 2.6], [3.9, 2.8], [2.2, .3]],
      start: [-2.4, .2, 1.3],
      areas: [{ r: [.15, -3.4, 4.6, 3.4], in: [1.0, 0], out: [-1.0, 0] }],
    },
    {
      walls: [[-4.6, -3.7, 4.6, -3.4], [-4.6, 3.4, 4.6, 3.7], [-4.9, -3.7, -4.6, 3.7], [4.6, -3.7, 4.9, 3.7], [-1.0, -.15, 1.0, .15]],
      furn: [{ kind: 'rug', x: 2.5, z: -1.6, w: 2.6, d: 2.0, park: [3.0, 2.3], flat: true }, { kind: 'chair', x: -2.6, z: -1.2, w: 1.05, d: .95, park: [-3.6, 2.6] }],
      dust: [[-3.4, 1.6], [-.4, 2.4], [-1.6, -2.5], [1.0, 1.0], [2.0, -1.2], [3.0, -2.1], [2.8, -1.0], [-3.2, -2.9]],
      start: [-1.2, 1.4, 2.6],
      areas: [],
    },
  ];
  let S = null;

  function chair(A) {
    const g = new T.Group(), j = new T.Group(); g.add(j);
    j.add(A.mesh(A.rbox(.95, .12, .85, .1, .03), A.M.wood, 0, .5, 0));
    j.add(A.mesh(A.rbox(.95, .62, .12, .06, .03), A.M.wood, 0, .86, -.38));
    [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([sx, sz]) => j.add(A.mesh(new T.CylinderGeometry(.05, .06, .48, 8), A.M.woodDark, sx * .38, .24, sz * .33)));
    return g;
  }
  function box(A) {
    const g = new T.Group(), j = new T.Group(); g.add(j);
    j.add(A.mesh(A.rbox(1.05, .9, 1.05, .08, .04), A.M.wood, 0, .45, 0));
    j.add(A.mesh(new T.BoxGeometry(1.07, .06, .2), A.M.woodDark, 0, .91, 0));
    return g;
  }
  function rug(A) {
    const g = new T.Group(), j = new T.Group(); g.add(j);
    j.add(A.mesh(A.rbox(2.6, .08, 2.0, .3, .03), A.M.sage2, 0, .05, 0));
    [-.6, 0, .6].forEach(z => j.add(A.mesh(new T.BoxGeometry(2.3, .012, .12), A.M.paper, 0, .095, z)));
    return g;
  }
  function vacuum(A) {
    const g = new T.Group(), j = new T.Group(); g.add(j);
    j.add(A.mesh(new T.CylinderGeometry(VR, VR + .02, .2, 32), A.M.cream, 0, .12, 0));
    j.add(A.mesh(new T.CylinderGeometry(.13, .13, .05, 18), A.M.sky, 0, .24, 0));
    const bump = A.mesh(new T.TorusGeometry(VR + .01, .05, 6, 20, Math.PI * .9), A.M.coral, 0, .13, 0); bump.rotation.x = Math.PI / 2; bump.rotation.z = Math.PI * .55; j.add(bump);
    const brush = new T.Group(); brush.position.set(.26, .04, .26); j.add(brush);
    [0, 1, 2].forEach(k => { const b = A.mesh(new T.BoxGeometry(.24, .015, .03), A.M.woodDark, 0, 0, 0); b.rotation.y = k * 2.1; brush.add(b); });
    S3.jelly(j, 160, 7);
    g.userData = { j, brush };
    return g;
  }

  // ---------- 碰撞：圓 vs 方塊 ----------
  function circleBox(x, z, r, b) {
    const cx = Math.max(b[0], Math.min(b[2], x)), cz = Math.max(b[1], Math.min(b[3], z));
    const dx = x - cx, dz = z - cz, d = Math.hypot(dx, dz);
    if (d >= r - .004) return null;
    if (d < 1e-4) return { nx: 0, nz: 1, pen: r + .01 };
    return { nx: dx / d, nz: dz / d, pen: r - d + .01 };
  }
  const fbox = f => [f.x - f.w / 2, f.z - f.d / 2, f.x + f.w / 2, f.z + f.d / 2];
  const inR = (x, z, r) => x > r[0] && x < r[2] && z > r[1] && z < r[3];

  function aim(c, from) {
    const v = S.vac, L = LV[S.sub];
    const left = S.dust.filter(d => !d.eaten);
    if (!left.length) return;
    // 灰塵在另一個區域（角落、隔壁房間）：先往那個區域的門口走
    const here = L.areas.find(a => inR(v.x, v.z, a.r));
    let best = null, bd = 1e9;
    left.forEach(d => { const dd = Math.hypot(d.x - v.x, d.z - v.z) + (d.under ? 6 : 0); if (dd < bd) { bd = dd; best = d; } });
    let tx = best.x, tz = best.z, wp = false;
    const there = L.areas.find(a => inR(best.x, best.z, a.r));
    const near = q => Math.hypot(q[0] - v.x, q[1] - v.z) < .45;
    if (there && there !== here) { const q = near(there.out) ? there.in : there.out; tx = q[0]; tz = q[1]; wp = true; }
    else if (here && !there) { const q = near(here.in) ? here.out : here.in; tx = q[0]; tz = q[1]; wp = true; }
    v.wp = wp ? [tx, tz] : null;
    const calm = performance.now() - S.lastEat > 5000 ? .25 : 1;   // 好久沒吸到：少亂轉，直接往灰塵走
    let h = Math.atan2(tx - v.x, tz - v.z) + (Math.random() - .5) * (wp ? .1 : (.4 + Math.min(1.4, S.same * .45)) * calm);
    if (from && (S.same >= 2 || S.miss >= 3) && !wp) {   // 一直撞同一個東西：沿著它的邊滑過去（往灰塵那一側）
      const base = Math.atan2(from.nx, from.nz), tx2 = Math.sin(h), tz2 = Math.cos(h);
      const a1 = base + Math.PI / 2 - .25, a2 = base - Math.PI / 2 + .25;
      h = (Math.sin(a1) * tx2 + Math.cos(a1) * tz2) > (Math.sin(a2) * tx2 + Math.cos(a2) * tz2) ? a1 : a2;
      if (S.same >= 5 || S.miss >= 8) h += (Math.random() - .5) * 1.2;
      v.h = h; return;
    }
    if (from) {   // 不能往牆裡走：至少要離開碰到的那一面
      const hx = Math.sin(h), hz = Math.cos(h);
      if (hx * from.nx + hz * from.nz < .25) { const base = Math.atan2(from.nx, from.nz), side = Math.random() < .5 ? -1 : 1; h = base + side * (.3 + Math.random() * .9); }
    }
    v.h = h;
  }

  return {
    say: { intro: 'm2.intro', subs: ['m2.s1', 'm2.s2', 'm2.s3'], ok: 'm2.ok', aha: 'm2.aha' },
    build(c) {
      const A = c.A;
      c.root.add(A.slab(10.4, 8.4, A.M.paper, .1));
      const floor = A.mesh(new T.BoxGeometry(9.2, .02, 6.8), A.std(0xF4EADB, { roughness: .95 }), 0, .11, 0); c.root.add(floor);
      S = { c, A, sub: 0, walls: [], wallG: new T.Group(), furn: [], dust: [], vac: null, vacG: vacuum(A), drag: null, sel: -1, keys: { up: 0, down: 0, left: 0, right: 0 }, lastEat: 0, same: 0, lastHit: null, t: 0 };
      c.root.add(S.wallG); c.root.add(S.vacG);
      c.view([new T.Vector3(-5.1, 0, -4.2), new T.Vector3(5.1, 0, -4.2), new T.Vector3(-5.1, 0, 4.2), new T.Vector3(5.1, 0, 4.2), new T.Vector3(0, .8, -3.7)], { elev: 62, elevPt: 80 });
    },
    start(c, sub) {
      const A = c.A, L = LV[sub];
      S.sub = sub; S.drag = null; S.sel = -1; S.same = 0; S.miss = 0; S.lastHit = null;
      S.wallG.clear(); S.furn.forEach(f => c.root.remove(f.g)); S.dust.forEach(d => c.root.remove(d.m));
      S.walls = L.walls.map(b => b.slice());
      S.walls.forEach(b => { const w = b[2] - b[0], d = b[3] - b[1]; S.wallG.add(A.mesh(A.rbox(w, .6, d, .1, .03), A.M.cream2, (b[0] + b[2]) / 2, .41, (b[1] + b[3]) / 2)); });
      S.wallG.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
      S.furn = L.furn.map(f => {
        const g = f.kind === 'chair' ? chair(A) : f.kind === 'box' ? box(A) : rug(A);
        g.position.set(f.x, .11, f.z); c.root.add(g); S3.jelly(g.children[0], 150, 7);
        g.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
        return Object.assign({ g, vx: 0, vz: 0, tilt: 0 }, f);
      });
      const dg = new T.SphereGeometry(.11, 10, 6), dm = A.std(0xB7A58C, { roughness: 1 });
      S.dust = L.dust.map(([x, z]) => { const m = new T.Mesh(dg, dm); m.scale.y = .4; m.position.set(x, .13, z); c.root.add(m); return { x, z, m, eaten: false, under: false }; });
      const [sx, sz, sh] = L.start;
      S.vac = { x: sx, z: sz, h: sh, v: 2.6, pause: 0 };
      S.vacG.position.set(sx, .11, sz);
      S.lastEat = performance.now();
      aim(c, null);
    },
    // ---------- 輸入 ----------
    down(c, p) {
      const f = pickFurn(c, p);
      if (!f) return;
      const g = c.ground(p, .11);
      S.drag = { f, ox: g ? f.x - g.x : 0, oz: g ? f.z - g.z : 0, x: p.x, y: p.y, moved: false, tx: f.x, tz: f.z };
      S.sel = S.furn.indexOf(f);
      S3.poke(f.g.children[0], .2); c.SFX.pick();
    },
    move(c, p) {
      const d = S.drag; if (!d) return;
      if (!d.moved && Math.hypot(p.x - d.x, p.y - d.y) < 8) return;
      d.moved = true;
      const g = c.ground(p, .11); if (!g) return;
      d.tx = g.x + d.ox; d.tz = g.z + d.oz;
    },
    up(c, p) {
      const d = S.drag; S.drag = null;
      if (!d) return;
      if (!d.moved) { park(c, d.f); return; }
      S3.poke(d.f.g.children[0], .3); c.SFX.drop();
    },
    hover(c, p) { c.core.v.el.style.cursor = pickFurn(c, p) ? 'grab' : ''; },
    key(c, k, down, rep) {
      const m = { up: 'up', w: 'up', down: 'down', s: 'down', left: 'left', a: 'left', right: 'right', d: 'right' }[k];
      if (m) { S.keys[m] = down ? 1 : 0; if (down && S.sel < 0) S.sel = 0; return; }
      if (!down || rep) return;
      if (k === 'tab' || k === 'space') { S.sel = (S.sel + 1) % S.furn.length; S3.poke(S.furn[S.sel].g.children[0], .3); c.SFX.tap(); }
      else if (k === 'enter' && S.furn.length) { if (S.sel < 0) S.sel = 0; park(c, S.furn[S.sel]); }
      else if (/^\d$/.test(k) && S.furn[+k - 1]) { S.sel = +k - 1; S3.poke(S.furn[S.sel].g.children[0], .3); c.SFX.tap(); }
    },
    frame(c, dt, t) {
      if (!S || !S.vac) return;
      S.t += dt;
      // 家具：跟手（lerp .3）、朝移動方向傾斜、不能穿牆；鍵盤推選到的那一件
      S.furn.forEach((f, i) => {
        let tx = null, tz = null;
        if (S.drag && S.drag.f === f && S.drag.moved) { tx = S.drag.tx; tz = S.drag.tz; }
        else if (i === S.sel && (S.keys.left || S.keys.right || S.keys.up || S.keys.down)) { tx = f.x + (S.keys.right - S.keys.left) * 3.2 * dt * 3; tz = f.z + (S.keys.down - S.keys.up) * 3.2 * dt * 3; }
        else if (f.parkTo) { tx = f.parkTo[0]; tz = f.parkTo[1]; if (Math.hypot(tx - f.x, tz - f.z) < .05) { f.parkTo = null; S3.poke(f.g.children[0], .3); c.SFX.drop(); } }
        const px = f.x, pz = f.z;
        if (tx != null) { const k = f.parkTo ? 1 - Math.pow(.02, dt) : 1 - Math.pow(.7, dt * 60); f.x += (tx - f.x) * k; f.z += (tz - f.z) * k; }
        else { f.x += f.vx * dt; f.z += f.vz * dt; const fr = Math.pow(.03, dt); f.vx *= fr; f.vz *= fr; }
        // 不能穿牆、不能出房間
        f.x = Math.max(-4.6 + f.w / 2, Math.min(4.6 - f.w / 2, f.x)); f.z = Math.max(-3.4 + f.d / 2, Math.min(3.4 - f.d / 2, f.z));
        if (!f.flat) S.walls.forEach(b => {
          const a = fbox(f);
          const ox = Math.min(a[2], b[2]) - Math.max(a[0], b[0]), oz = Math.min(a[3], b[3]) - Math.max(a[1], b[1]);
          if (ox > 0 && oz > 0) { if (ox < oz) f.x += (f.x < (b[0] + b[2]) / 2 ? -ox : ox); else f.z += (f.z < (b[1] + b[3]) / 2 ? -oz : oz); }
        });
        if (tx != null) { f.vx = (f.x - px) / Math.max(dt, 1e-3); f.vz = (f.z - pz) / Math.max(dt, 1e-3); }
        const tilt = Math.max(-.1, Math.min(.1, -f.vx * .03)), tiltZ = Math.max(-.1, Math.min(.1, f.vz * .03));
        f.g.rotation.z = S3.lerp(f.g.rotation.z, tilt, .25); f.g.rotation.x = S3.lerp(f.g.rotation.x, tiltZ, .25);
        f.g.position.set(f.x, .11 + (S.drag && S.drag.f === f ? .12 : 0) + (f.parkTo ? .1 : 0), f.z);
        S3.wobble(f.g.children[0], dt);
      });
      // 地毯底下的灰塵：看不見、吸不到
      const rugF = S.furn.find(f => f.flat);
      S.dust.forEach(d => {
        if (d.eaten) return;
        d.under = !!(rugF && inR(d.x, d.z, fbox(rugF)));
        // 家具壓在灰塵上（或擋到吸不到）：也算吸不到，那件家具就是要移開的
        d.cover = S.furn.find(f => !f.flat && inR(d.x, d.z, (b => [b[0] - VR * .9, b[1] - VR * .9, b[2] + VR * .9, b[3] + VR * .9])(fbox(f)))) || null;
        d.m.visible = !d.under;
      });
      // 掃地機器人：直直走，碰到東西才轉彎
      const v = S.vac;
      if (v.pause > 0) v.pause -= dt;
      else { v.x += Math.sin(v.h) * v.v * dt; v.z += Math.cos(v.h) * v.v * dt; }
      let hit = null, hitObj = null;
      S.walls.forEach((b, i) => { const r = circleBox(v.x, v.z, VR, b); if (r) { v.x += r.nx * r.pen; v.z += r.nz * r.pen; hit = r; hitObj = 'w' + i; } });
      S.furn.forEach((f, i) => {
        if (f.flat) return;
        const r = circleBox(v.x, v.z, VR, fbox(f));
        if (r) { v.x += r.nx * r.pen; v.z += r.nz * r.pen; hit = r; hitObj = 'f' + i; S3.poke(f.g.children[0], .15); if (!(S.drag && S.drag.f === f) && !f.parkTo) { f.x -= r.nx * .04; f.z -= r.nz * .04; } }
      });
      if (hit && v.pause <= 0) {
        S.same = hitObj === S.lastHit ? S.same + 1 : 0; S.lastHit = hitObj; S.miss = (S.miss || 0) + 1;
        S3.poke(S.vacG.userData.j, .35); c.SFX.bump(1);
        v.pause = .25; aim(c, hit);
      }
      if (v.wp && v.pause <= 0 && Math.hypot(v.wp[0] - v.x, v.wp[1] - v.z) < .35) aim(c, null);
      S.vacG.position.set(v.x, .11, v.z); S.vacG.rotation.y = v.h;
      S3.wobble(S.vacG.userData.j, dt); S.vacG.userData.brush.rotation.y += dt * 14;
      S.dust.forEach(d => {
        if (d.eaten || d.under) return;
        if (Math.hypot(d.x - v.x, d.z - v.z) < VR + .05) {
          d.eaten = true; c.SFX.dust(); S.lastEat = performance.now(); S.miss = 0;
          c.tween(.3, k => { d.m.scale.set(1 - k, .4 * (1 - k), 1 - k); d.m.position.x = S3.lerp(d.x, v.x, k); d.m.position.z = S3.lerp(d.z, v.z, k); }).then(() => { d.m.visible = false; });
          if (S.dust.every(q => q.eaten)) { v.v = 0; setTimeout(() => { if (S) c.win(); }, c.FAST ? 30 : 500); }
        }
      });
      // 9 秒都沒吸到：它過不去（溫柔的提醒，擋路的家具發光）
      if (performance.now() - S.lastEat > 9000 && !S.dust.every(q => q.eaten)) { S.lastEat = performance.now(); c.fail('m2.stuck'); }
    },
    glow(c) {
      if (!S) return [];
      const f = blocker();
      const out = [];
      if (f) out.push({ pos: new T.Vector3(f.x, .6, f.z), size: Math.max(f.w, f.d) * 1.7, strong: c.strong });
      if (S.sel >= 0 && S.furn[S.sel] && S.furn[S.sel] !== f) { const s = S.furn[S.sel]; out.push({ pos: new T.Vector3(s.x, .6, s.z), size: Math.max(s.w, s.d) * 1.4, op: .2, color: c.A.C.sky }); }
      return out;
    },
    caps(c) {
      if (!S) return [];
      const f = S.furn[S.sel >= 0 ? S.sel : 0] || null;
      return f ? [{ pos: new T.Vector3(f.x, 1.5, f.z), text: S.sel >= 0 ? '↔' : '⇥', cur: true }] : [];
    },
    demo(c) {
      const f = blocker() || S.furn[0];
      return { kind: 'drag', pts: [new T.Vector3(f.x, .5, f.z), new T.Vector3(f.park[0], .5, f.park[1])], dur: 2.4 };
    },
    assist(c) { const f = blocker(); if (f) park(c, f); },
    probe(c) {
      const sc = v => { const q = c.screen(v); return [Math.round(q.x), Math.round(q.y)]; };
      return { vac: { x: +S.vac.x.toFixed(2), z: +S.vac.z.toFixed(2), h: +S.vac.h.toFixed(2), v: S.vac.v, p: +S.vac.pause.toFixed(2), wp: S.vac.wp, hit: S.lastHit, same: S.same }, furn: S.furn.map(f => ({ kind: f.kind, scr: sc(new T.Vector3(f.x, .4, f.z)), park: sc(new T.Vector3(f.park[0], .4, f.park[1])), x: f.x, z: f.z, home: Math.hypot(f.x - f.park[0], f.z - f.park[1]) < .3 })), left: S.dust.filter(d => !d.eaten).length, blocker: S.furn.indexOf(blocker()) };
    },
    exit() { S = null; },
  };

  // 擋路的家具：還在原位、而且那個區域還有灰塵（或灰塵在地毯底下）
  function blocker() {
    if (!S) return null;
    const L = LV[S.sub];
    const cov = S.dust.find(d => !d.eaten && d.cover);
    if (cov) return cov.cover;
    return S.furn.find((f, i) => {
      const o = L.furn[i];
      if (Math.hypot(f.x - o.x, f.z - o.z) > 1.2) return false;
      if (f.flat) return S.dust.some(d => !d.eaten && d.under);
      if (o.kind === 'chair' && S.sub === 2) return false;
      if (o.kind === 'chair' && S.sub === 1) return false;
      return S.dust.some(d => !d.eaten && L.areas.some(a => inR(d.x, d.z, a.r)));
    }) || null;
  }
  function pickFurn(c, p) {
    const o = c.pick(p, S.furn.map(f => f.g));
    if (o) return S.furn.find(f => f.g === o);
    return c.nearest(p, S.furn, f => new T.Vector3(f.x, .4, f.z), 54);
  }
  function park(c, f) { f.parkTo = f.park.slice(); S.sel = S.furn.indexOf(f); S3.poke(f.g.children[0], .3); c.SFX.tap(); }
})();
