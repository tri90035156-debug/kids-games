// 第 2 關 磁鐵吸什麼？——手勢：拿磁鐵在桌上掃（俯視）。
// 第一圈：迴紋針、鐵釘、木湯匙、橡皮擦連到「吸／不吸」→ 掃 → 比一比。
// 第二圈：「金屬都會被吸嗎？」鋁罐、十元硬幣、鐵罐再連 → 掃 → 比一比。
// 靠近鐵做的東西：它先抖、再「啪」吸上來（木琴）；不吸的東西完全不動（靠很近也不動）。掃過每一樣東西＝實驗做完。
// 三條路：拖磁鐵；鍵盤方向鍵移動、Enter 自己掃一遍；點東西＝磁鐵自己滑過去。
(window.EXPS = window.EXPS || [])[2] = (() => {
  'use strict';
  const T = THREE;
  let S = null;
  const R1 = [['clip', true], ['nail', true], ['spoon', false], ['eraser', false]];
  const R2 = [['alcan', false], ['coin', false], ['tin', true]];
  const NEAR = 1.4, SNAP = .9, TEST = 1.1;
  const LIM = { x: 3.3, z: 1.9 };

  function model(A, k) {
    if (k === 'clip') return A.clip(2.2);
    if (k === 'nail') return A.nail(1.8);
    if (k === 'spoon') return A.spoon(1.8);
    if (k === 'eraser') return A.eraser(1.8);
    if (k === 'alcan') { const g = A.can(1.6); g.rotation.z = Math.PI / 2; g.position.y = 0; const w = new T.Group(); w.add(g); return w; }
    if (k === 'coin') return A.coin(2.0);
    if (k === 'tin') { const g = A.can(1.6, A.M.iron, A.M.amber); g.rotation.z = Math.PI / 2; const w = new T.Group(); w.add(g); return w; }
  }
  const lift = k => k === 'alcan' || k === 'tin' ? .3 : k === 'coin' ? .05 : .12;

  function spawn(c, list) {
    S.items.forEach(it => c.root.remove(it.g));
    const P = c.portrait ? [[-1.3, -1.1], [1.3, -1.0], [-1.3, 1.1], [1.3, 1.2]] : [[-1.5, -.9], [.6, 1.0], [2.4, -.8], [-.3, -.4]];
    const P3 = c.portrait ? [[-1.2, -1.0], [1.2, -.4], [-.2, 1.2]] : [[-1.2, .9], [.6, -.9], [2.3, .7]];
    const pos = list.length === 4 ? P : P3;
    S.items = list.map(([k, mag], i) => {
      const g = new T.Group(), j = new T.Group(); g.add(j); j.add(model(c.A, k));
      c.jel(j, 160, 7);
      g.position.set(pos[i][0], lift(k), pos[i][1]); g.rotation.y = (i * 1.7) % 3 - 1.5;
      c.root.add(g);
      return { k, mag, g, j, home: g.position.clone(), st: 'table', tested: false, jit: 0, off: null };
    });
  }

  return {
    say: { end: 'e2.end' },
    build(c) {
      const A = c.A, root = c.root;
      if (c.portrait) LIM.x = 2.2, LIM.z = 2.3; else LIM.x = 3.6, LIM.z = 1.9;
      root.add(A.box(LIM.x * 2 + 1.6, .1, LIM.z * 2 + 1.6, A.M.paper, 0, .05, 0, .5));
      const mag = new T.Group(), mj = new T.Group(); mag.add(mj); mj.add(A.magnet()); mj.children[0].scale.setScalar(1.5);
      c.jel(mj, 150, 7);
      mag.position.set(-LIM.x + .2, .32, c.portrait ? 2.0 : .9); root.add(mag);
      S = { c, A, items: [], mag, mj, want: mag.position.clone(), ph: 'idle', drag: null, keys: {}, auto: null, t: 0 };
      const ext = [new T.Vector3(-LIM.x - .6, 0, LIM.z + .8), new T.Vector3(LIM.x + .6, 0, LIM.z + .8), new T.Vector3(-LIM.x - .6, 0, -LIM.z - .8), new T.Vector3(LIM.x + .6, 0, -LIM.z - .8)];
      c.view(ext, { elev: 58, elevPt: 64 });
    },
    async play(c, r0) {
      const A = c.A, RIGHT = [{ svg: A.icon('magYes'), label: 'c.yes', say: 'a.yes' }, { svg: A.icon('magNo'), label: 'c.no', say: 'a.no' }];
      if (r0 === 0) {
        c.setRound(0);
        spawn(c, R1);
        await c.say('e2.q');
        const spec = { left: R1.map(([k]) => ({ svg: A.icon(k), say: 'n.' + k })), right: RIGHT };
        const g = await c.guessMatch(spec);
        await c.step(1);
        S.ph = 'sweep'; c.say('e2.x1');
        await c.until('e2.x1');
        S.ph = 'idle';
        await c.wait(.5);
        await c.say('e2.r1');
        await c.checkMatch(spec, g, R1.map(([, m]) => m ? 0 : 1));
        await c.lap();
        await shakeOff(c);
      }
      c.setRound(1);
      spawn(c, R2);
      S.items.forEach(it => c.poke(it.j, .4)); c.SFX.land();
      await c.say('e2.q2');
      const spec2 = { left: R2.map(([k]) => ({ svg: A.icon(k), say: 'n.' + k })), right: RIGHT };
      const g2 = await c.guessMatch(spec2);
      await c.step(1);
      S.ph = 'sweep'; c.say('e2.x2');
      await c.until('e2.x2');
      S.ph = 'idle';
      await c.wait(.5);
      await c.say('e2.r2');
      await c.checkMatch(spec2, g2, R2.map(([, m]) => m ? 0 : 1));
      await c.lap();
    },
    down(c, p) {
      const q = c.screen(S.mag.position);
      if (Math.hypot(q.x - p.x, q.y - p.y) < 80) { S.drag = { x: p.x, y: p.y, moved: false }; S.auto = null; c.poke(S.mj, .2); c.SFX.tap(); return; }
      S.tap = { x: p.x, y: p.y };
    },
    move(c, p) {
      if (S.drag) {
        if (Math.hypot(p.x - S.drag.x, p.y - S.drag.y) > 8) S.drag.moved = true;
        const g = c.ground(p, .32); if (g) S.want.set(clampX(g.x), .32, clampZ(g.z));
      }
    },
    up(c, p) {
      if (S.drag) { S.drag = null; return; }
      const t = S.tap; S.tap = null;
      if (!t || Math.hypot(p.x - t.x, p.y - t.y) > 14) return;
      const it = c.nearest(p, S.items, it => it.g.position, 90);
      if (it && S.ph === 'sweep') S.auto = [it.home.clone().setY(.32)];
      else if (it) c.poke(it.j, .3);
      else { const g = c.ground(p, .32); if (g && S.ph === 'sweep') S.auto = [new T.Vector3(clampX(g.x), .32, clampZ(g.z))]; }
    },
    key(c, k, down) {
      if (['left', 'right', 'up', 'down', 'a', 'd', 'w', 's'].includes(k)) { S.keys[k] = down; if (down) S.auto = null; return; }
      if (down && k === 'enter' && S.ph === 'sweep') sweepAll();
    },
    frame(c, dt) {
      if (!S) return;
      S.t += dt;
      const K = S.keys, kx = (K.right || K.d ? 1 : 0) - (K.left || K.a ? 1 : 0), kz = (K.down || K.s ? 1 : 0) - (K.up || K.w ? 1 : 0);
      if (kx || kz) { S.want.x = clampX(S.want.x + kx * 3.2 * dt); S.want.z = clampZ(S.want.z + kz * 3.2 * dt); }
      if (S.auto && S.auto.length) {
        const tgt = S.auto[0], d = tgt.clone().sub(S.want); d.y = 0;
        const L = d.length(), stp = 3.4 * dt;
        if (L < stp) { S.want.copy(tgt); S.auto.shift(); } else S.want.addScaledVector(d, stp / L);
      }
      const prev = S.mag.position.clone();
      S.mag.position.lerp(S.want, .3);
      const mv = S.mag.position.clone().sub(prev);
      S.mag.rotation.z = -mv.x * 1.5; S.mag.rotation.x = mv.z * 1.5;
      const tip = S.mag.position.clone().add(new T.Vector3(0, -.05, .4));
      S.items.forEach(it => {
        if (it.st === 'stuck') { it.g.position.copy(S.mag.position).add(it.off); return; }
        if (it.st !== 'table') return;
        const d = Math.min(Math.hypot(it.g.position.x - tip.x, it.g.position.z - tip.z), Math.hypot(it.g.position.x - S.mag.position.x, it.g.position.z - S.mag.position.z) + .15);
        if (S.ph === 'sweep' && d < TEST && !it.mag && !it.tested) { it.tested = true; c.SFX.note(1); check(c); }
        if (!it.mag) { it.j.position.set(0, 0, 0); return; }     // 不吸的東西：完全不動
        if (d < NEAR) {
          const k = 1 - d / NEAR;
          it.j.position.set((Math.random() - .5) * .08 * k, Math.abs(Math.sin(S.t * 40)) * .06 * k, (Math.random() - .5) * .08 * k);
          if (d < SNAP) snap(c, it, tip);
        } else it.j.position.set(0, 0, 0);
      });
    },
    glow(c) {
      if (S.ph !== 'sweep') return [];
      const it = S.items.find(i => !i.tested);
      const out = [{ pos: S.mag.position.clone().setY(.05), size: 1.8, color: c.A.C.coral, op: .2 }];
      if (it) out.push({ pos: it.home.clone().setY(.1), size: 1.4, strong: c.strong });
      return out;
    },
    caps(c) { return S.ph === 'sweep' ? [{ pos: S.mag.position.clone().setY(1.1), text: '↑↓←→', cur: true }] : []; },
    demo(c) {
      const it = S.items.find(i => !i.tested);
      if (!it) return null;
      return { kind: 'drag', pts: [S.mag.position.clone(), it.home.clone().add(new T.Vector3(0, .3, -.6))] };
    },
    assist(c) { sweepAll(); },
    probe(c) {
      const sc = v => { const q = c.screen(v); return [Math.round(q.x), Math.round(q.y)]; };
      return { ph: S.ph, mag: sc(S.mag.position), items: S.items.map(it => ({ k: it.k, st: it.st, tested: it.tested, scr: sc(it.home) })) };
    },
    exit() { S = null; },
  };

  function clampX(x) { return Math.max(-LIM.x, Math.min(LIM.x, x)); }
  function clampZ(z) { return Math.max(-LIM.z, Math.min(LIM.z + .6, z)); }
  function sweepAll() { S.auto = S.items.filter(i => !i.tested).map(i => i.home.clone().add(new T.Vector3(0, .32 - i.home.y, -.4))); }
  function snap(c, it, tip) {
    it.st = 'flying';
    const from = it.g.position.clone();
    const n = S.items.filter(i => i.st === 'stuck').length;
    const off = new T.Vector3((n - .5) * .35, -.12, .78);
    c.tween(.18, k => { it.g.position.lerpVectors(from, S.mag.position.clone().add(off), k); }).then(() => {
      if (!S) return;
      it.st = 'stuck'; it.off = off; it.tested = true; it.j.position.set(0, 0, 0);
      c.poke(it.j, .4); c.poke(S.mj, .3); c.SFX.snap();
      check(c);
    });
  }
  function check(c) { if (S.ph === 'sweep' && S.items.every(i => i.tested)) { S.ph = 'done'; setTimeout(() => { if (S) c.win(); }, c.FAST ? 10 : 500); } }
  // 甩掉吸上來的東西：掉回桌上
  async function shakeOff(c) {
    const st = S.items.filter(i => i.st === 'stuck');
    for (const it of st) {
      it.st = 'flying';
      const from = it.g.position.clone();
      c.tween(.4, k => { it.g.position.lerpVectors(from, it.home, k); it.g.position.y += Math.sin(k * Math.PI) * .6; }).then(() => { if (S) { c.poke(it.j, .3); c.SFX.land(); } });
    }
    S.mag.rotation.z = .3;
    await c.wait(.5);
  }
})();
