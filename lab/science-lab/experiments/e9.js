// 第 9 關 抓住空氣——手勢：倒扣直直往下壓；傾斜（側看水缸）。
// 第一圈：杯底塞紙巾（拖進去）→ 杯子自己翻過來 →「紙會濕嗎？」→ 直直往下壓、再拿起來 → 摸一下紙巾（點）→ 乾的。
//         直著壓：水在杯口被空氣擋住，杯裡水位只上升一點點。
// 第二圈：「杯子歪一下呢？」→ 壓下去以後左右歪（拖杯子左右、或 ← →）→ 超過一個角度，大泡泡咕嚕冒上來、水進去、紙巾變深色 → 拿起來摸 → 濕了。
(window.EXPS = window.EXPS || [])[9] = (() => {
  'use strict';
  const T = THREE;
  const SURF = 2.0, TB = .14, CH = 1.3, CR = .5, UP = 3.9, LOW = .45, TILT = .5;
  let S = null;

  return {
    say: { end: 'e9.end' },
    build(c) {
      const A = c.A, root = c.root;
      root.add(A.box(7.2, .1, 3, A.M.paper, -.6, .05, 0, .4));
      const TW = 1.9;
      [[0, .8], [0, -.8]].forEach(([, z]) => { const g = A.mesh(new T.BoxGeometry(TW * 2, 2.7, .05), A.M.glass, 0, 1.45, z); g.castShadow = false; root.add(g); });
      [-1, 1].forEach(s => { const w = A.mesh(new T.BoxGeometry(.05, 2.7, 1.6), A.M.glass, s * TW, 1.45, 0); w.castShadow = false; root.add(w); });
      root.add(A.box(TW * 2 + .2, .1, 1.8, A.M.wood, 0, .1, 0, .05));
      const water = A.mesh(new T.BoxGeometry(TW * 2 - .1, SURF - TB, 1.5), A.M.water, 0, TB + (SURF - TB) / 2, 0); water.castShadow = false; water.renderOrder = 2; root.add(water);
      // 杯子（倒扣後：杯口朝下）：pivot 在杯口中心
      const cup = new T.Group(), cj = new T.Group(); cup.add(cj);
      const body = A.cup(CR, CH); cj.add(body);
      const inner = A.mesh(new T.CylinderGeometry(CR * .88, CR * .88, 1, 22), A.std(0x7FC0E2, { transparent: true, opacity: .55, depthWrite: false, roughness: .3 }), 0, 0, 0); inner.castShadow = false; inner.visible = false; cj.add(inner);
      const tissue = A.ball(.3, A.std(0xFFFFFF, { roughness: .95 }), 0, 0, 0, 12); tissue.scale.set(1.2, .7, 1.2); cj.add(tissue);
      c.jel(cj); root.add(cup);
      S = { c, A, cup, cj, body, inner, tissue, ph: 'idle', y: UP, tilt: 0, keys: {}, drag: null, flip: 0, deep: false, fill: 0, wet: 0, bubbles: [], t: 0, tHome: new T.Vector3(-3.2, .3, .6) };
      tissue.position.copy(S.tHome); cj.remove(tissue); root.add(tissue);
      cup.position.set(-2.6, 0, -.2);
      c.view([new T.Vector3(-4, 0, 1.2), new T.Vector3(2.4, 0, 1.2), new T.Vector3(-4, UP + 1.6, -.8), new T.Vector3(2.4, UP + 1.6, -.8)], { elev: 12, elevPt: 18 });
    },
    async play(c, r0) {
      const A = c.A;
      const CH1 = { opts: [{ svg: A.icon('wet'), label: 'c.wet', say: 'o.wet' }, { svg: A.icon('dry'), label: 'c.dry', say: 'o.dry' }] };
      // 準備：紙巾塞進杯底
      S.ph = 'stuff';
      if (r0 === 0) { c.setRound(0); await c.say('e9.q'); }
      c.say('e9.x0');
      await c.until('e9.x0');
      await flipOver(c);
      if (r0 === 0) {
        const g = await c.guessChoice(CH1);
        await c.step(1);
        S.ph = 'press'; S.deep = false; S.allowTilt = false;
        c.say('e9.x1');
        await c.until('e9.x1');
        S.ph = 'touch';
        c.say('e9.touch');
        await c.until('e9.touch');
        S.ph = 'idle';
        await c.say('e9.r1');
        await c.checkChoice(CH1, g, 1);
        await c.lap();
      }
      c.setRound(1);
      await c.say('e9.q2');
      const g2 = await c.guessChoice(CH1);
      await c.step(1);
      S.ph = 'press'; S.deep = false; S.allowTilt = true; S.needTilt = true;
      c.say('e9.x2');
      await c.until('e9.x2');
      S.ph = 'touch';
      c.say('e9.touch');
      await c.until('e9.touch');
      S.ph = 'idle';
      await c.say('e9.r2');
      await c.checkChoice(CH1, g2, 0);
      await c.lap();
    },
    down(c, p) {
      if (S.ph === 'stuff') { const q = c.screen(S.tissue.position); if (Math.hypot(q.x - p.x, q.y - p.y) < 90) { S.drag = { k: 'tissue', x: p.x, y: p.y, moved: false }; return; } }
      if (S.ph === 'press') { S.drag = { k: 'cup', x: p.x, y: p.y, y0: S.y, t0: S.tilt, moved: false }; c.poke(S.cj, .15); return; }
      if (S.ph === 'touch') { const q = c.screen(tissueWorld()); if (Math.hypot(q.x - p.x, q.y - p.y) < 110) touch(c); }
    },
    move(c, p) {
      const d = S.drag; if (!d) return;
      if (Math.hypot(p.x - d.x, p.y - d.y) > 10) d.moved = true;
      if (d.k === 'tissue') { const q = c.planeZ(p, .6); if (q) S.tissue.position.set(q.x, Math.max(.3, q.y), .6); }
      if (d.k === 'cup') {
        const q = c.planeZ(p, 0); if (!q) return;
        S.y = Math.max(LOW, Math.min(UP, q.y));
        if (S.allowTilt && S.y < SURF - .5) S.tilt = Math.max(-.9, Math.min(.9, (p.x - d.x) / 160));
      }
    },
    up(c, p) {
      const d = S.drag; S.drag = null;
      if (!d) return;
      if (d.k === 'tissue') { const q = c.screen(S.cup.position.clone().setY(.6)); if (!d.moved || Math.hypot(q.x - p.x, q.y - p.y) < 130) stuff(c); else { S.tissue.position.copy(S.tHome); c.fail(); } return; }
      if (d.k === 'cup' && !d.moved) { autoPress(c); }
      if (d.k === 'cup') S.tilt = S.tilt * .3;
    },
    key(c, k, down, rep) {
      if (['up', 'down', 'left', 'right'].includes(k)) { S.keys[k] = down; return; }
      if (!down || rep) return;
      if (S.ph === 'stuff' && (k === 't' || k === 'space' || k === 'enter')) stuff(c);
      else if (S.ph === 'press' && (k === 'space' || k === 'enter')) autoPress(c);
      else if (S.ph === 'touch' && (k === 'space' || k === 'enter')) touch(c);
    },
    frame(c, dt) {
      if (!S) return;
      S.t += dt;
      const K = S.keys;
      if (S.ph === 'press') {
        if (K.down) S.y = Math.max(LOW, S.y - 2.2 * dt);
        if (K.up) S.y = Math.min(UP, S.y + 2.2 * dt);
        if (S.allowTilt && S.y < SURF - .5) { if (K.left) S.tilt = Math.max(-.9, S.tilt - 1.4 * dt); if (K.right) S.tilt = Math.min(.9, S.tilt + 1.4 * dt); }
        if (!K.left && !K.right && !S.drag && !S.auto) S.tilt *= Math.pow(.2, dt);
      }
      if (S.auto) runAuto(c, dt);
      if (S.flip > 0) {
        // 杯口在 S.y、往下；杯子水平位置在水缸上方
        S.cup.position.set(0, S.y, 0);
        S.cup.rotation.z = S.tilt;
        S.cj.rotation.x = Math.PI;
        S.cj.position.y = CH;
        const depth = SURF - S.y;                  // 杯口在水面下多深
        if (S.ph === 'press' && depth > 1.0) S.deep = true;
        // 歪太多：空氣跑出去、水進來
        if (Math.abs(S.tilt) > TILT && depth > .4 && S.fill < 1) {
          S.fill = Math.min(1, S.fill + dt * .6);
          if (Math.random() < dt * 6) bubble(c);
          if (S.fill > .55) S.wet = 1;
        }
        const air = depth > 0 ? Math.min(.08, depth * .06) : 0;
        const lvl = Math.max(air, S.fill * Math.min(CH, Math.max(0, depth)));
        S.inner.visible = depth > 0 && lvl > .01;
        S.inner.scale.set(1, Math.max(.01, Math.min(CH - .02, lvl)), 1); S.inner.position.y = CH - Math.min(CH - .02, lvl) / 2;
        S.tissue.material.color.setHex(S.wet ? 0x8FB8CC : 0xFFFFFF);
        if (S.ph === 'press' && S.deep && S.y > SURF + .4 && (!S.needTilt || S.wet)) { S.ph = 'lifted'; c.SFX.ok(); setTimeout(() => S && c.win(), c.FAST ? 10 : 300); }
        if (S.y > SURF + .2 && S.fill > 0 && S.ph !== 'press') S.fill = Math.max(0, S.fill - dt);
      }
      S.bubbles = S.bubbles.filter(b => { b.m.position.y += dt * 1.6; b.m.position.x += Math.sin(S.t * 6 + b.p) * dt * .3; if (b.m.position.y > SURF) { c.root.remove(b.m); return false; } return true; });
    },
    glow(c) {
      if (S.ph === 'stuff') return [{ pos: S.tissue.position.clone(), size: 1.2, strong: c.strong }, { pos: S.cup.position.clone().setY(.2), size: 1.4, color: c.A.C.sky, op: .2 }];
      if (S.ph === 'press') return [{ pos: new T.Vector3(0, S.deep ? UP - .5 : .6, 0), size: 1.6, color: c.A.C.sky, op: .25, strong: c.strong }];
      if (S.ph === 'touch') return [{ pos: tissueWorld(), size: 1.2, strong: c.strong }];
      return [];
    },
    caps(c) {
      if (S.ph === 'stuff') return [{ pos: S.tissue.position.clone().setY(1.1), text: 'T', cur: true }];
      if (S.ph === 'press') return [{ pos: new T.Vector3(.9, S.y + 1.6, 0), text: S.deep ? '↑' : '↓', cur: true }].concat(S.allowTilt && S.deep === false && S.y < SURF - .5 ? [{ pos: new T.Vector3(-.9, S.y + 1.6, 0), text: '←→' }] : []);
      if (S.ph === 'touch') return [{ pos: tissueWorld().add(new T.Vector3(0, .9, 0)), text: '␣', cur: true }];
      return [];
    },
    demo(c) {
      if (S.ph === 'stuff') return { kind: 'drag', pts: [S.tissue.position.clone(), S.cup.position.clone().setY(1)] };
      if (S.ph === 'press') {
        if (S.allowTilt && S.y < SURF - .5 && !S.wet) return { kind: 'drag', pts: [new T.Vector3(0, S.y + .6, 0), new T.Vector3(1.2, S.y + .6, 0)] };
        return { kind: 'drag', pts: [new T.Vector3(0, S.y + .6, 0), new T.Vector3(0, S.deep ? UP : LOW + .6, 0)] };
      }
      if (S.ph === 'touch') return { kind: 'tap', pts: [tissueWorld()] };
      return null;
    },
    assist(c) { if (S.ph === 'stuff') stuff(c); else if (S.ph === 'press') autoPress(c); else if (S.ph === 'touch') touch(c); },
    probe(c) {
      const sc = v => { const q = c.screen(v); return [Math.round(q.x), Math.round(q.y)]; };
      return { ph: S.ph, y: +S.y.toFixed(2), tilt: +S.tilt.toFixed(2), deep: S.deep, fill: +S.fill.toFixed(2), wet: S.wet, cup: sc(new T.Vector3(0, S.y + .6, 0)), tissue: sc(S.flip ? tissueWorld() : S.tissue.position), cupHome: sc(S.cup.position.clone().setY(.6)) };
    },
    exit() { S = null; },
  };

  function tissueWorld() { const v = new T.Vector3(); S.tissue.getWorldPosition(v); return v.sub(S.c.root.position); }
  function stuff(c) {
    if (S.ph !== 'stuff') return;
    S.ph = 'stuffing'; c.act();
    const from = S.tissue.position.clone(), to = S.cup.position.clone().setY(1.0);
    c.tween(.4, k => { S.tissue.position.lerpVectors(from, to, c.ease(k)); S.tissue.position.y += Math.sin(k * Math.PI) * .6; }).then(() => {
      if (!S) return;
      c.root.remove(S.tissue); S.cj.add(S.tissue); S.tissue.position.set(0, .2, 0);
      c.poke(S.cj, .3); c.SFX.tap();
      setTimeout(() => S && c.win(), c.FAST ? 10 : 200);
    });
  }
  async function flipOver(c) {
    if (S.flip) { S.y = UP; S.tilt = 0; S.fill = 0; S.wet = 0; return; }
    const from = S.cup.position.clone();
    await c.tween(.7, k => { S.cup.position.lerpVectors(from, new T.Vector3(0, UP, 0), c.ease(k)); S.cj.rotation.x = Math.PI * c.ease(k); S.cj.position.y = CH * c.ease(k); S.cup.position.y += Math.sin(k * Math.PI) * .6; });
    if (!S) return;
    S.flip = 1; S.y = UP; c.SFX.snap(); c.poke(S.cj, .3);
  }
  function autoPress(c) { if (S.ph !== 'press' || S.auto) return; c.act(); S.auto = { st: 0 }; }
  function runAuto(c, dt) {
    const a = S.auto;
    if (a.st === 0) { S.y -= 2 * dt; if (S.y <= LOW + .2) a.st = S.needTilt ? 1 : 2; }
    else if (a.st === 1) { S.tilt = Math.min(.8, S.tilt + 1.5 * dt); if (S.wet) a.st = 2; }
    else { S.tilt *= .9; S.y += 2 * dt; if (S.y >= UP) { S.y = UP; S.auto = null; } }
  }
  function touch(c) {
    if (S.ph !== 'touch') return;
    S.ph = 'touched'; c.act();
    c.poke(S.cj, .35);
    if (S.wet) c.SFX.drop(); else c.SFX.chord2(659.3, 784);
    setTimeout(() => S && c.win(), c.FAST ? 10 : 500);
  }
  function bubble(c) {
    const m = S.A.ball(.08 + Math.random() * .1, S.A.std(0xFFFFFF, { transparent: true, opacity: .7, roughness: .2 }), (S.tilt > 0 ? -1 : 1) * CR * .9, S.y + .1, 0, 10);
    m.castShadow = false; c.root.add(m); S.bubbles.push({ m, p: Math.random() * 6 });
    if (Math.random() < .5) c.SFX.bubble();
  }
})();
