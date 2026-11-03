// 第 5 關 飛過河（無人機：四個螺旋槳）——手勢：按住升起、左右傾斜。
// 按住（畫面任一處、↑ 或空白鍵）螺旋槳轉快、慢慢升；放開慢慢降；← → 或手指按住往左右拉＝傾斜，往那邊飛。
// 掉進河裡：「噗通」濕掉、彈回起點（不罰，很好笑）。風用幾片飄的葉子畫出來，看得出方向。
// 三小關：飛到對岸 → 有風（往右吹），降在對岸的圓圈裡 → 降在河中間小島的圓圈裡。
// 三條路：按住＋拉；鍵盤 ↑／空白鍵＋← →；點目標（對岸、圓圈、小島）＝它自己飛過去降落。
(window.MISSIONS = window.MISSIONS || [])[5] = (() => {
  'use strict';
  const T = THREE;
  const BANK = .45, WATER = .18, RX = 1.7, START = -4.4;
  const LV = [
    { goal: 'bank', wind: 0 },
    { goal: 'pad', pad: [3.4, .75], wind: 1.0 },
    { goal: 'island', pad: [0, .7], island: 1.15, wind: .4 },
  ];
  let S = null;

  function drone(A) {
    const g = new T.Group(), j = new T.Group(), tilt = new T.Group(); g.add(tilt); tilt.add(j);
    j.add(A.mesh(A.rbox(.7, .3, .7, .14, .05), A.M.cream, 0, .32, 0));
    j.add(A.mesh(new T.SphereGeometry(.12, 12, 8), A.M.light, 0, .32, .36));
    const rot = [];
    [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([sx, sz]) => {
      const arm = A.mesh(new T.BoxGeometry(.6, .07, .1), A.M.cream2, sx * .38, .38, sz * .38); arm.rotation.y = -sx * sz * Math.PI / 4; j.add(arm);
      const r = new T.Group(); r.position.set(sx * .6, .47, sz * .6); j.add(r);
      r.add(A.mesh(new T.CylinderGeometry(.06, .06, .1, 8), A.M.cream2));
      [0, Math.PI].forEach(a => { const b = A.mesh(new T.CapsuleGeometry(.05, .34, 3, 6), A.M.amber, Math.cos(a) * .2, .06, Math.sin(a) * .2); b.rotation.z = Math.PI / 2; b.rotation.y = -a; b.scale.y = .5; r.add(b); });
      rot.push(r);
    });
    [-1, 1].forEach(sx => j.add(A.mesh(new T.BoxGeometry(.06, .2, .5), A.M.cream2, sx * .26, .1, 0)));
    S3.jelly(j, 150, 7);
    g.userData = { j, tilt, rot };
    return g;
  }
  const groundAt = x => {
    if (S.lv.island && Math.abs(x) < S.lv.island) return BANK;
    return Math.abs(x) < RX ? null : BANK;
  };

  return {
    say: { intro: 'm5.intro', subs: ['m5.s1', 'm5.s2', 'm5.s3'], ok: 'm5.ok', aha: 'm5.aha' },
    build(c) {
      const A = c.A, root = c.root;
      root.add(A.mesh(A.rbox(13, .1, 6, .5, .04), A.M.paper, 0, .05, 0));
      [-1, 1].forEach(s => root.add(A.mesh(A.rbox(6.4 - RX, BANK, 5.6, .3, .06), A.M.sage2, s * (6.4 + RX) / 2, BANK / 2, 0)));
      const water = A.mesh(new T.BoxGeometry(RX * 2 + .2, WATER, 5.6), A.std(0x9CCFE6, { roughness: .45 }), 0, WATER / 2, 0); root.add(water);
      const ripples = [];
      for (let k = 0; k < 6; k++) { const r = A.mesh(new T.BoxGeometry(.5, .01, .06), A.M.paper, 0, WATER + .01, -2.4 + k * .95); r.castShadow = false; root.add(r); ripples.push(r); }
      // 樹、草叢（岸邊的樣子）
      [[-5.6, -2.0], [5.5, -2.1], [-2.6, -2.3], [2.9, 2.2]].forEach(([x, z], i) => { const t = A.tree(i); t.scale.setScalar(.8); t.position.set(x, BANK, z); root.add(t); });
      const island = A.mesh(new T.CylinderGeometry(1.15, 1.3, BANK, 32), A.clay(0xE8C99A), 0, BANK / 2, 0); island.visible = false; root.add(island);
      const pad = new T.Group(); root.add(pad);
      const padDisc = A.mesh(new T.CylinderGeometry(1, 1, .04, 32), A.std(A.C.amber, { transparent: true, opacity: .55 }), 0, 0, 0); pad.add(padDisc);
      const padRing = A.floorRing(.9, 1.0, A.C.amber, .9); padRing.position.y = .03; pad.add(padRing);
      const leaves = [];
      for (let k = 0; k < 7; k++) { const l = A.mesh(new T.SphereGeometry(.13, 8, 6).scale(1.6, .35, 1), A.M.leaf, 0, 0, 0); root.add(l); leaves.push({ m: l, x: -6 + k * 1.8, y: 1 + (k % 3) * 1.1, ph: k }); }
      const d = drone(A); root.add(d);
      S = { c, A, water, ripples, island, pad, leaves, d, x: START, y: BANK, vx: 0, vy: 0, hold: false, tilt: 0, keyTilt: 0, keyHold: false, auto: null, landed: true, down: null, rotT: 0, spin: 0, t: 0, wet: 0 };
      c.view([new T.Vector3(-6.4, 0, 2.8), new T.Vector3(6.4, 0, 2.8), new T.Vector3(-6.4, 0, -2.8), new T.Vector3(6.4, 0, -2.8), new T.Vector3(-6, 3.6, 0), new T.Vector3(6, 3.6, 0)], { elev: 28, elevPt: 40 });
    },
    start(c, sub) {
      S.lv = LV[sub]; S.sub = sub;
      S.island.visible = !!S.lv.island;
      S.pad.visible = !!S.lv.pad;
      if (S.lv.pad) { S.pad.position.set(S.lv.pad[0], BANK + .02, 0); S.pad.scale.setScalar(S.lv.pad[1]); }
      S.leaves.forEach(l => { l.m.visible = S.lv.wind > 0; });
      reset(c);
    },
    // ---------- 輸入 ----------
    down(c, p) { S.down = { x: p.x, y: p.y, t: performance.now(), moved: false }; S.hold = true; S.auto = null; },
    move(c, p) {
      const d = S.down; if (!d) return;
      if (Math.hypot(p.x - d.x, p.y - d.y) > 10) d.moved = true;
      S.tilt = Math.max(-1, Math.min(1, (p.x - d.x) / 60));
    },
    up(c, p) {
      const d = S.down; S.down = null; S.hold = false; S.tilt = 0;
      if (!d || d.moved || performance.now() - d.t > 260) return;
      // 點目標：它自己飛過去
      const tx = goalX(), q = c.screen(new T.Vector3(tx, BANK, 0));
      if (Math.hypot(q.x - p.x, q.y - p.y) < 110 || (S.lv.goal === 'bank' && p.x > q.x - 60)) { S.auto = { x: tx }; c.SFX.tap(); }
    },
    key(c, k, down) {
      if (k === 'up' || k === 'w' || k === 'space') { S.keyHold = down; if (down) S.auto = null; }
      else if (k === 'left' || k === 'a') { S.keyTilt = down ? -1 : (S.keyTilt === -1 ? 0 : S.keyTilt); if (down) S.auto = null; }
      else if (k === 'right' || k === 'd') { S.keyTilt = down ? 1 : (S.keyTilt === 1 ? 0 : S.keyTilt); if (down) S.auto = null; }
      else if (k === 'enter' && down) S.auto = { x: goalX() };
    },
    frame(c, dt, t) {
      if (!S || !S.lv) return;
      S.t += dt;
      let hold = S.hold || S.keyHold, tilt = S.keyTilt || S.tilt;
      if (S.auto) {     // 自己飛：先升高、再橫移、到了上方再降
        const dx = S.auto.x - S.x, high = S.y > 2.4;
        hold = Math.abs(dx) > .25 ? !high || S.vy < -.3 : false;
        tilt = high || Math.abs(dx) < .25 ? Math.max(-1, Math.min(1, dx * .9 - S.vx * .7 - S.lv.wind * .25)) : 0;
      }
      if (S.wet > 0) { S.wet -= dt; hold = false; tilt = 0; }
      // 螺旋槳：按住轉快（往上），放開慢慢降；傾斜就往那邊飛；風把它往右推
      const ay = hold ? 5.2 : -3.6;
      S.vy += ay * dt; S.vy = Math.max(-2.1, Math.min(2.4, S.vy)); S.vy *= Math.pow(.6, dt);
      if (!S.landed || hold) {
        S.vx += (tilt * 4.2 + (S.landed ? 0 : S.lv.wind)) * dt; S.vx *= Math.pow(.25, dt);
        if (hold && S.landed) { S.landed = false; S.vy = Math.max(S.vy, .8); }
      }
      if (!S.landed) { S.x += S.vx * dt; S.y += S.vy * dt; }
      if (S.y > 4.0) { S.y = 4.0; S.vy = Math.min(0, S.vy); }
      if (S.x < -6.1) { S.x = -6.1; S.vx = Math.abs(S.vx) * .4; S3.poke(S.d.userData.j, .2); c.SFX.bump(1); }
      if (S.x > 6.1) { S.x = 6.1; S.vx = -Math.abs(S.vx) * .4; S3.poke(S.d.userData.j, .2); c.SFX.bump(1); }
      // 落地／掉進水
      if (!S.landed && S.vy <= 0) {
        const gy = groundAt(S.x);
        if (gy != null && S.y <= gy) land(c, gy);
        else if (gy == null && S.y <= WATER + .05 && S.wet <= 0) splash(c);
      }
      // 畫面
      const u = S.d.userData;
      S.d.position.set(S.x, S.y, 0);
      u.tilt.rotation.z = S3.lerp(u.tilt.rotation.z, -tilt * .32 - (S.landed ? 0 : S.lv.wind * .05), .15);
      S.spin = S3.lerp(S.spin, S.landed && !hold ? 0 : hold ? 32 : 14, .1);
      u.rot.forEach((r, i) => { r.rotation.y += S.spin * dt * (i % 2 ? 1 : -1); });
      S3.wobble(u.j, dt);
      if (hold && !S.landed) { S.rotT -= dt; if (S.rotT <= 0) { S.rotT = .3; c.SFX.rotor(); } }
      S.leaves.forEach(l => { if (!l.m.visible) return; l.x += S.lv.wind * 1.4 * dt; if (l.x > 6.3) l.x = -6.3; l.m.position.set(l.x, l.y + Math.sin(S.t * 2 + l.ph) * .2, -1.2 + (l.ph % 3) * .9); l.m.rotation.y += dt * 2; });
      S.ripples.forEach((r, k) => { r.position.z = -2.6 + ((k * .95 + S.t * .5) % 5.4); });
      S.pad.children[1].scale.setScalar(1 + .05 * Math.sin(S.t * 3));
    },
    glow(c) {
      if (!S || !S.lv) return [];
      const tx = goalX();
      return [{ pos: new T.Vector3(tx, BANK + .3, 0), size: S.lv.pad ? S.lv.pad[1] * 2.6 : 2.4, color: c.A.C.amber, strong: c.strong }];
    },
    caps(c) {
      if (!S || !S.lv || !S.landed) return [];
      return [{ pos: new T.Vector3(S.x, S.y + 1.3, 0), text: '↑', cur: true }];
    },
    demo(c) {
      const tx = goalX();
      return { kind: 'hold', pts: [new T.Vector3(S.x, S.y + .6, 0), new T.Vector3(S.x + (tx > S.x ? 1.6 : -1.6), S.y + .6, 0)], dur: 2.6 };
    },
    assist(c) { if (S.landed) S.auto = { x: goalX() }; },
    probe(c) {
      const sc = v => { const q = c.screen(v); return [Math.round(q.x), Math.round(q.y)]; };
      return { x: S.x, y: S.y, vx: S.vx, vy: S.vy, landed: S.landed, goal: goalX(), goalScr: sc(new T.Vector3(goalX(), BANK, 0)), me: sc(new T.Vector3(S.x, S.y, 0)), wind: S.lv.wind, padR: S.lv.pad ? S.lv.pad[1] : 0 };
    },
    exit() { S = null; },
  };

  function goalX() { return S.lv.pad ? S.lv.pad[0] : 3.6; }
  function reset(c) { S.x = START; S.y = BANK; S.vx = 0; S.vy = 0; S.landed = true; S.auto = null; S.d.position.set(S.x, S.y, 0); }
  function land(c, gy) {
    S.y = gy; S.landed = true; S.vx *= .2; const imp = -S.vy; S.vy = 0; S.auto = null;
    S3.poke(S.d.userData.j, .2 + Math.min(.3, imp * .15)); c.SFX.land();
    if (S.x < -RX) return;                           // 回到起點這一岸：沒事
    const L = S.lv;
    if (L.goal === 'bank') { if (S.x > RX) done(c); return; }
    if (Math.abs(S.x - L.pad[0]) <= L.pad[1] + .3) done(c);
    else c.fail('m5.miss');
  }
  function done(c) { const d = S.d; S3.poke(d.userData.j, .4); c.SFX.ok(); S.won = true; setTimeout(() => { if (S) c.win(); }, c.FAST ? 20 : 500); }
  // 噗通：濕掉、沉一下、彈回起點
  function splash(c) {
    S.wet = 1.2; S.vy = 0; S.vx = 0; S.auto = null;
    c.SFX.splash(); S3.poke(S.d.userData.j, .5);
    const x0 = S.x, drops = [];
    for (let k = 0; k < 6; k++) { const m = c.A.mesh(new T.SphereGeometry(.07, 8, 6), c.A.M.sky, x0, WATER, 0); c.root.add(m); drops.push({ m, vx: Math.cos(k) * 1.4, vy: 2 + k % 3, vz: Math.sin(k * 2) }); }
    c.tween(.8, k => { drops.forEach(d => { d.m.position.x += d.vx * .016; d.m.position.z += d.vz * .016; d.m.position.y = WATER + d.vy * k - 4 * k * k; }); S.y = WATER - .25 * Math.sin(k * Math.PI); })
      .then(() => { drops.forEach(d => c.root.remove(d.m)); if (!S) return; reset(c); S3.poke(S.d.userData.j, .5); c.SFX.land(); });
    c.fail('m5.splash');
  }
})();
