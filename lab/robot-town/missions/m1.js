// 第 1 關 送包裹（人行道上的送貨機器人）——手勢：開車（方向鍵／觸控搖桿，有慣性）。
// 頭上頂著包裹，開到同色的門口光墊上停下來，包裹自己滑進門。轉彎太快包裹會掉（彈兩下），開過去就自動撿回來。
// 三小關：送 1 戶 → 2 戶（路上有三角錐）→ 3 戶（有兩顆會滾的球，撞到你你會被推一下）。
// 三條路：方向鍵／WASD；手指按住拉（按哪裡哪裡就是搖桿）；點房子或掉下來的包裹＝自己開過去（開得慢，包裹不會掉）。
(window.MISSIONS = window.MISSIONS || [])[1] = (() => {
  'use strict';
  const T = THREE, D = DRIVE;
  const X0 = -5.6, X1 = 5.6, Z0 = -4.6, Z1 = 4.4;
  const HOUSES = [
    { x: -3.4, z: -3.2, door: 0, pad: [-3.4, -1.55], color: 'sky' },
    { x: 3.4, z: -3.2, door: 0, pad: [3.4, -1.55], color: 'amber' },
    { x: 4.4, z: 2.4, door: -Math.PI / 2, pad: [2.75, 2.4], color: 'green' },
  ];
  const TARGETS = [[1], [0, 2], [0, 1, 2]];
  const START = { x: -3.9, z: 3.1, th: Math.PI };
  let S = null;

  function house(A, h) {
    const g = new T.Group(); g.position.set(h.x, 0, h.z); g.rotation.y = h.door;
    const j = new T.Group(); g.add(j);
    j.add(A.mesh(A.rbox(1.7, 1.25, 1.5, .2, .05), A.M.cream, 0, .62, 0));
    const roof = A.mesh(new T.CylinderGeometry(.01, 1.35, .8, 4, 1), A.M[h.color], 0, 1.62, 0); roof.rotation.y = Math.PI / 4; roof.scale.z = .85; j.add(roof);
    j.add(A.mesh(A.rbox(.55, .8, .12, .2, .03), A.M.woodDark, 0, .4, .76));
    S3.jelly(j, 140, 7); g.userData.j = j;
    return g;
  }
  function parcel(A) {
    const g = new T.Group();
    g.add(A.mesh(A.rbox(.9, .7, .8, .08, .04), A.M.wood, 0, .35, 0));
    g.add(A.mesh(new T.BoxGeometry(.92, .06, .16), A.M.coral, 0, .71, 0));
    g.add(A.mesh(new T.BoxGeometry(.16, .06, .82), A.M.coral, 0, .71, 0));
    return g;
  }

  return {
    say: { intro: 'm1.intro', subs: ['m1.s1', 'm1.s2', 'm1.s3'], ok: 'm1.ok', aha: 'm1.aha' },
    hideBot: true,
    build(c) {
      const A = c.A, root = c.root;
      root.add(A.slab(12.2, 10, A.M.paper, .12));
      // 人行道：一個十字路
      const rd = A.M.road;
      root.add(A.mesh(new T.BoxGeometry(11.6, .02, 1.6), rd, 0, .13, .3));
      root.add(A.mesh(new T.BoxGeometry(1.6, .02, 9.2), rd, -.3, .13, -.1));
      const houses = HOUSES.map(h => { const g = house(A, h); root.add(g); return g; });
      const pads = HOUSES.map(h => {
        const p = A.floorRing(.0, .8, A.C[h.color], .55); p.position.set(h.pad[0], .15, h.pad[1]); root.add(p);
        const ring = A.floorRing(.82, .98, A.C[h.color], .8); ring.position.set(h.pad[0], .16, h.pad[1]); root.add(ring);
        return { p, ring };
      });
      const bot = A.bot(); bot.scale.setScalar(.55); root.add(bot);
      S3.jelly(bot.userData.jel, 150, 8);
      A.setGear(bot, c.gearList(), false);
      bot.position.y = .12;
      S = { c, A, houses, pads, bot, car: D.car(START.x, START.z, START.th), props: [], parcels: [], loose: null, keys: { up: 0, down: 0, left: 0, right: 0 }, stick: null, down: null, auto: null, done: [], targets: [], hot: 0, stopSaid: 0, passT: 0, kick: { x: 0, z: 0 } };
      S.car.r = .62;
      c.view([new T.Vector3(X0 - .4, 0, Z0 - .2), new T.Vector3(X1 + .4, 0, Z0 - .2), new T.Vector3(X0 - .4, 0, Z1 + .6), new T.Vector3(X1 + .4, 0, Z1 + .6), new T.Vector3(0, 2.2, Z0)], { elev: 52, elevPt: 72 });
    },
    start(c, sub) {
      const A = c.A;
      S.targets = TARGETS[sub].slice(); S.done = []; S.auto = null; S.stick = null;
      Object.assign(S.car, D.car(START.x, START.z, START.th), { r: .62, max: 6.5, acc: 16 });
      S.props.forEach(p => c.root.remove(p.obj)); S.props = [];
      S.parcels.forEach(p => p.parent && p.parent.remove(p)); S.parcels = [];
      if (S.loose) { c.root.remove(S.loose.obj); S.loose = null; }
      // 頭上疊著要送的包裹
      S.targets.forEach((_, i) => { const p = parcel(A); p.position.set(0, 3.95 + i * .74, 0); S.bot.userData.lean.add(p); S.parcels.push(p); S3.jelly(p, 160, 7); });
      HOUSES.forEach((h, i) => { const on = S.targets.includes(i); S.pads[i].p.visible = S.pads[i].ring.visible = on; S.pads[i].p.material.color.setHex(A.C[h.color]); });
      if (sub >= 1) [[-3.9, .9], [-3.1, .9], [1.2, -.5], [1.2, .5]].forEach(([x, z]) => { const o = A.cone(); c.root.add(o); S.props.push(D.prop(o, 'cone', x, z)); });
      if (sub >= 2) [[-1.5, -1.8, 1.6, 0], [1.8, 1.6, -1.4, .2]].forEach(([x, z, vx, vz], k) => {
        const o = A.ball(k ? A.C.sky : A.C.amber); c.root.add(o);
        const p = D.prop(o, 'ball', x, z, { fr: .92, bounce: 1 }); p.vx = vx; p.vz = vz; p.keep = Math.hypot(vx, vz); S.props.push(p);
      });
      S.props.forEach(p => { p.obj.position.y = .12; });
      D.pose(S.car, S.bot, 0, 0);
    },
    // ---------- 輸入 ----------
    key(c, k, down) {
      const m = { up: 'up', w: 'up', down: 'down', s: 'down', left: 'left', a: 'left', right: 'right', d: 'right' }[k];
      if (m) { S.keys[m] = down ? 1 : 0; if (down) S.auto = null; }
    },
    down(c, p) { S.down = { x: p.x, y: p.y, moved: false }; },
    move(c, p) {
      if (!S.down) return;
      const dx = p.x - S.down.x, dy = p.y - S.down.y, d = Math.hypot(dx, dy), st = c.core.stickEl;
      if (!S.down.moved && d < 12) return;
      if (!S.down.moved) { S.down.moved = true; S.auto = null; st.hidden = false; st.style.transform = 'translate(' + S.down.x + 'px,' + S.down.y + 'px)'; }
      const k = Math.min(1, d / 64);
      S.stick = { dx: dx / (d || 1) * k, dz: dy / (d || 1) * k };
      st.firstElementChild.style.transform = 'translate(' + (S.stick.dx * 64).toFixed(1) + 'px,' + (S.stick.dz * 64).toFixed(1) + 'px)';
    },
    up(c, p) {
      const was = S.down; S.down = null; S.stick = null;
      const st = c.core.stickEl; st.hidden = true; st.firstElementChild.style.transform = '';
      if (!was || was.moved || p.cancel) return;
      // 點房子／光墊／掉下來的包裹＝自己開過去
      if (S.loose && Math.hypot(...['x', 'y'].map(a => c.screen(S.loose.obj.position)[a] - p[a])) < 70) { S.auto = { x: S.loose.x, z: S.loose.z }; c.SFX.tap(); return; }
      const hi = c.nearest(p, S.targets.filter(i => !S.done.includes(i)), i => new T.Vector3(HOUSES[i].pad[0], .3, HOUSES[i].pad[1]), 90)
        ?? (() => { const o = c.pick(p, S.houses); return o ? S.houses.indexOf(o) : null; })();
      if (hi != null && hi >= 0) { S.auto = { x: HOUSES[hi].pad[0], z: HOUSES[hi].pad[1] }; poke(S.houses[hi].userData.j, .25); c.SFX.tap(); return; }
      const g = c.ground(p, .12);
      if (g && g.x > X0 && g.x < X1 && g.z > Z0 && g.z < Z1) { S.auto = { x: g.x, z: g.z }; c.SFX.tap(); }
    },
    // ---------- 每一畫面 ----------
    frame(c, dt, t) {
      if (!S) return;
      const car = S.car, A = c.A, active = c.core && true;
      let want = null, brake = false;
      const kx = S.keys.right - S.keys.left, kz = S.keys.down - S.keys.up;
      if (kx || kz) want = { dx: kx, dz: kz };
      else if (S.stick) want = S.stick;
      else if (S.auto) {
        const dx = S.auto.x - car.x, dz = S.auto.z - car.z, d = Math.hypot(dx, dz);
        if (d < .3) { S.auto = null; brake = true; } else { const m = Math.min(.62, Math.max(.25, d / 3)); want = { dx: dx / d * m, dz: dz / d * m }; }
      } else brake = true;
      D.step(car, dt, want, brake);
      car.x += S.kick.x * dt; car.z += S.kick.z * dt; S.kick.x *= Math.pow(.02, dt); S.kick.z *= Math.pow(.02, dt);
      // 邊界與房子
      if (car.x < X0 || car.x > X1 || car.z < Z0 || car.z > Z1) {
        car.x = Math.max(X0, Math.min(X1, car.x)); car.z = Math.max(Z0, Math.min(Z1, car.z));
        if (Math.abs(car.v) > 1.5) { c.SFX.bump(1); poke(S.bot.userData.jel, .3); D.flashBumper(S.bot); }
        car.v *= -.3;
      }
      HOUSES.forEach((h, i) => {
        const dx = car.x - h.x, dz = car.z - h.z, d = Math.hypot(dx, dz), m = 1.05 + car.r;
        if (d < m) { car.x = h.x + dx / d * m; car.z = h.z + dz / d * m; if (Math.abs(car.v) > 1.2) { c.SFX.bump(1); poke(S.houses[i].userData.j, .2); poke(S.bot.userData.jel, .25); D.flashBumper(S.bot); } car.v *= .4; }
      });
      // 球撞到你：你被推一下
      S.props.forEach(p => {
        if (p.kind !== 'ball') return;
        const dx = car.x - p.x, dz = car.z - p.z, d = Math.hypot(dx, dz);
        if (d < p.r + car.r + .05 && Math.hypot(p.vx, p.vz) > .6) { S.kick.x += dx / d * 2.2; S.kick.z += dz / d * 2.2; }
      });
      D.hitProps(car, S.bot, S.props, p => c.SFX.bump(p.kind === 'ball' ? 1 : 0));
      D.stepProps(S.props, dt, p => {
        if (p.x < X0 + p.r || p.x > X1 - p.r) { p.x = Math.max(X0 + p.r, Math.min(X1 - p.r, p.x)); p.vx *= -p.bounce; }
        if (p.z < Z0 + p.r || p.z > Z1 - p.r) { p.z = Math.max(Z0 + p.r, Math.min(Z1 - p.r, p.z)); p.vz *= -p.bounce; }
        HOUSES.forEach(h => { const dx = p.x - h.x, dz = p.z - h.z, d = Math.hypot(dx, dz), m = 1.05 + p.r; if (d < m) { const nx = dx / d, nz = dz / d; p.x = h.x + nx * m; p.z = h.z + nz * m; const vn = p.vx * nx + p.vz * nz; if (vn < 0) { p.vx -= 2 * vn * nx; p.vz -= 2 * vn * nz; } } });
        if (p.keep) { const s = Math.hypot(p.vx, p.vz) || 1; const k = Math.max(p.keep, s * .99) / s; p.vx *= k; p.vz *= k; }   // 球一直滾
      });
      D.pose(car, S.bot, dt, t);
      S.houses.forEach(h => S3.wobble(h.userData.j, dt));
      S.parcels.forEach((p, i) => { S3.wobble(p, dt); p.rotation.z = S3.lerp(p.rotation.z, -car.roll * (1 + i) * 1.5, .2); });
      // 轉彎太快：最上面的包裹掉下來（自己開過去會慢，不會掉）
      if (S.parcels.length && !S.loose && car.lat > 15 && Math.abs(car.v) > 4.2) { S.hot += dt; if (S.hot > .12) dropParcel(c); } else S.hot = 0;
      if (S.loose) {
        const L = S.loose;
        if (!L.rest) {
          L.vy -= 9.8 * 1.4 * dt; L.x += L.vx * dt; L.z += L.vz * dt; L.y += L.vy * dt;
          L.x = Math.max(X0, Math.min(X1, L.x)); L.z = Math.max(Z0, Math.min(Z1, L.z));
          if (L.y <= .12) { L.y = .12; poke(L.obj, .4); c.SFX.land(); L.bounce++; L.vy = L.bounce < 3 ? -L.vy * .42 : 0; L.vx *= .5; L.vz *= .5; if (L.bounce >= 3) L.rest = true; }
          L.obj.rotation.z += L.spin * dt;
        } else L.obj.rotation.z = S3.lerp(L.obj.rotation.z, 0, .1);
        L.obj.position.set(L.x, L.y, L.z); S3.wobble(L.obj, dt);
        if (L.rest && Math.hypot(car.x - L.x, car.z - L.z) < .95) pickParcel(c);
      }
      // 停在門口光墊上：包裹滑進門
      if (S.parcels.length) {
        S.targets.forEach(i => {
          if (S.done.includes(i)) return;
          const [px, pz] = HOUSES[i].pad, d = Math.hypot(car.x - px, car.z - pz);
          if (d < .85) {
            if (Math.abs(car.v) < 2.6) deliver(c, i);
            else S.passT = 1;
          }
        });
      }
      if (S.passT > 0) { S.passT -= dt; if (S.passT <= 0 && t - S.stopSaid > 8) { S.stopSaid = t; c.say('m1.stop'); } }
      S.pads.forEach((pd, i) => { pd.ring.scale.setScalar(1 + .06 * Math.sin(t * 3 + i)); pd.p.material.opacity = S.done.includes(i) ? .25 : .5; });
    },
    glow(c) {
      if (!S) return [];
      if (S.loose) return [{ pos: new T.Vector3(S.loose.x, .6, S.loose.z), size: 2, strong: true }];
      return S.targets.filter(i => !S.done.includes(i)).map(i => ({ pos: new T.Vector3(HOUSES[i].pad[0], .4, HOUSES[i].pad[1]), size: 2.4, color: c.A.C[HOUSES[i].color], strong: c.strong }));
    },
    demo(c) {
      const to = S.loose ? [S.loose.x, S.loose.z] : (() => { const i = S.targets.find(k => !S.done.includes(k)); return i == null ? [0, 0] : HOUSES[i].pad; })();
      const a = new T.Vector3(S.car.x, .5, S.car.z), b = new T.Vector3(to[0], .3, to[1]);
      return { kind: 'drag', pts: [a, a.clone().lerp(b, .5), b], dur: 2.4 };
    },
    assist(c) {      // 錯三次：它自己慢慢開過去一次
      if (S.loose) S.auto = { x: S.loose.x, z: S.loose.z };
      else { const i = S.targets.find(k => !S.done.includes(k)); if (i != null) S.auto = { x: HOUSES[i].pad[0], z: HOUSES[i].pad[1] }; }
    },
    probe(c) {
      const sc = v => { const q = c.screen(v); return [Math.round(q.x), Math.round(q.y)]; };
      return {
        bot: sc(new T.Vector3(S.car.x, .5, S.car.z)), car: { x: S.car.x, z: S.car.z, v: S.car.v },
        targets: S.targets.filter(i => !S.done.includes(i)).map(i => ({ i, scr: sc(new T.Vector3(HOUSES[i].pad[0], .15, HOUSES[i].pad[1])), x: HOUSES[i].pad[0], z: HOUSES[i].pad[1] })),
        loose: S.loose ? { scr: sc(new T.Vector3(S.loose.x, .4, S.loose.z)), x: S.loose.x, z: S.loose.z, rest: S.loose.rest } : null,
        carrying: S.parcels.length,
      };
    },
    exit() { S = null; },
  };

  function poke(o, a) { S3.poke(o, a); }
  function dropParcel(c) {
    const p = S.parcels.pop(), car = S.car;
    const w = new T.Vector3(); p.getWorldPosition(w); w.sub(c.root.position);
    S.bot.userData.lean.remove(p); p.scale.setScalar(.55); c.root.add(p);
    // 往轉彎的外側飛出去
    const side = Math.sign(car.turn || 1), ox = Math.cos(car.th) * -side, oz = -Math.sin(car.th) * -side;
    S.loose = { obj: p, x: w.x, y: w.y, z: w.z, vx: ox * 2.6 + Math.sin(car.th) * car.v * .4, vz: oz * 2.6 + Math.cos(car.th) * car.v * .4, vy: 2.5, bounce: 0, rest: false, spin: side * 4 };
    poke(S.bot.userData.jel, .3);
    c.fail('m1.drop');
  }
  function pickParcel(c) {
    const L = S.loose; S.loose = null;
    c.root.remove(L.obj); L.obj.scale.setScalar(1); L.obj.rotation.set(0, 0, 0);
    L.obj.position.set(0, 3.95 + S.parcels.length * .74, 0); S.bot.userData.lean.add(L.obj); S.parcels.push(L.obj);
    S3.poke(L.obj, .4); c.SFX.pick(); poke(S.bot.userData.jel, .2);
  }
  function deliver(c, i) {
    S.done.push(i);
    const p = S.parcels.pop(), h = HOUSES[i];
    const w = new T.Vector3(); p.getWorldPosition(w); w.sub(c.root.position);
    S.bot.userData.lean.remove(p); p.scale.setScalar(.55); p.position.copy(w); c.root.add(p);
    const door = new T.Vector3(h.x + Math.sin(h.door) * .75, .3, h.z + Math.cos(h.door) * .75), from = w.clone();
    c.SFX.ok(); S.auto = null;
    c.tween(.55, k => { p.position.lerpVectors(from, door, k); p.position.y += 4 * k * (1 - k) * .8; p.scale.setScalar(.55 * (1 - k * .8)); }).then(() => {
      c.root.remove(p); poke(S.houses[i].userData.j, .4); c.SFX.drop();
      if (S && S.done.length === S.targets.length) c.win();
    });
  }
})();
