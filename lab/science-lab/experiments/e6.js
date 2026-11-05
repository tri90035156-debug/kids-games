// 第 6 關 冰塊穿外套——手勢：拖毛巾包住、轉時鐘快轉（拖指針繞圈，或按住時鐘／按住 →）。
// 第一圈：「包毛巾的冰，比較快融化還是比較慢？」→ 包一塊 → 轉時鐘 → 兩塊一起變小、盤子積水，沒包的先融完 → 掀開毛巾，還剩一塊 → 慢。
// 第二圈：兩杯熱可可（都冒煙），包一杯 → 轉時鐘 → 沒包的不冒煙了，包著的還在冒 → 慢涼。
// 融化速度：沒包＝1，包著＝0.45（只是示意的比例；方向和真的一樣）。
(window.EXPS = window.EXPS || [])[6] = (() => {
  'use strict';
  const T = THREE;
  let S = null;
  const XS = [-1.5, 1.5];

  function makeIce(c, x) {
    const A = c.A, g = new T.Group(); g.position.set(x, 0, 0); c.root.add(g);
    g.add(A.cyl(.95, .85, .08, A.M.paper, 0, .04, 0, 28));
    const pud = A.mesh(new T.CylinderGeometry(.8, .8, .02, 28), A.std(0xB9DDEE, { roughness: .3 }), 0, .09, 0); pud.scale.setScalar(.05); g.add(pud);
    const ice = new T.Group(); ice.position.y = .1; g.add(ice);
    ice.add(A.box(.8, .8, .8, A.std(0xE9F5FA, { roughness: .25, transparent: true, opacity: .9 }), 0, .4, 0, .14));
    return { g, ice, pud, left: 1, wrapped: false, kind: 'ice' };
  }
  function makeCocoa(c, x) {
    const A = c.A, g = new T.Group(); g.position.set(x, 0, 0); c.root.add(g);
    g.add(A.cyl(.75, .7, .06, A.M.paper, 0, .03, 0, 24));
    const mug = new T.Group(); mug.position.y = .06; g.add(mug);
    mug.add(A.cyl(.5, .45, 1, A.clay(0xF1E4CF), 0, .5, 0, 24));
    mug.add(A.cyl(.44, .44, .04, A.clay(0x8A5A3C), 0, .95, 0, 24));
    const h = A.mesh(new T.TorusGeometry(.22, .07, 8, 16), A.clay(0xF1E4CF), .55, .5, 0); mug.add(h);
    const steam = [];
    for (let i = 0; i < 3; i++) { const s = A.mesh(new T.CapsuleGeometry(.05, .45, 3, 6), A.std(0xFFFFFF, { transparent: true, opacity: .5, depthWrite: false }), (i - 1) * .2, 1.4, 0); s.castShadow = false; g.add(s); steam.push(s); }
    return { g, mug, steam, left: 1, wrapped: false, kind: 'cocoa' };
  }

  return {
    say: { end: 'e6.end' },
    build(c) {
      const A = c.A, root = c.root;
      root.add(A.box(7.4, .1, 4.2, A.M.paper, 0, .05, 0, .5));
      // 毛巾（攤在右前方）
      const towel = new T.Group(), tj = new T.Group(); towel.add(tj); tj.add(A.towel(1.6, 1.1, 0xA9C4A3)); c.jel(tj);
      const cover = A.mesh(new T.SphereGeometry(.75, 22, 14, 0, Math.PI * 2, 0, Math.PI / 2), A.clay(0xA9C4A3), 0, 0, 0); cover.scale.set(1.15, 1.35, 1.15); cover.visible = false; towel.add(cover);
      root.add(towel);
      // 時鐘（左前方，平放的大圓盤＋一根指針）
      const clock = new T.Group(), cj = new T.Group(); clock.add(cj);
      cj.add(A.cyl(.75, .78, .14, A.M.paper, 0, .07, 0, 32));
      cj.add(A.mesh(new T.TorusGeometry(.76, .06, 8, 36).rotateX(Math.PI / 2), A.M.coral, 0, .14, 0));
      for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; cj.add(A.box(.05, .03, .14, A.M.ink, Math.sin(a) * .58, .15, -Math.cos(a) * .58, .01)); }
      const hand = new T.Group(); hand.position.y = .17; cj.add(hand);
      hand.add(A.box(.08, .04, .55, A.M.ink, 0, 0, -.25, .02)); hand.add(A.ball(.07, A.M.coral, 0, .02, 0, 10));
      c.jel(cj); root.add(clock);
      S = { c, A, towel, tj, cover, clock, cj, hand, items: [], ph: 'idle', drag: null, t: 0, time: 0, ang: 0, last: null, hold: false, keys: {}, tHome: new T.Vector3(2.9, .1, 1.6), cHome: new T.Vector3(-2.9, 0, 1.6) };
      towel.position.copy(S.tHome); clock.position.copy(S.cHome);
      c.view([new T.Vector3(-3.7, 0, 2.6), new T.Vector3(3.7, 0, 2.6), new T.Vector3(-3.7, 1.6, -1.4), new T.Vector3(3.7, 1.6, -1.4)], { elev: 40, elevPt: 50 });
    },
    async play(c, r0) {
      const A = c.A;
      if (r0 === 0) {
        c.setRound(0);
        S.items = XS.map(x => makeIce(c, x));
        await c.say('e6.q');
        const CH = { opts: [{ svg: A.icon('meltFast'), label: 'c.fast', say: 'o.fast' }, { svg: A.icon('meltSlow'), label: 'c.slow', say: 'o.slow' }] };
        const g = await c.guessChoice(CH);
        await runRound(c, 'e6.x1');
        await c.say('e6.lift');
        S.ph = 'lift';
        await c.until('e6.lift');
        S.ph = 'idle';
        await c.say('e6.r1');
        await c.checkChoice(CH, g, 1);
        await c.lap();
        S.items.forEach(it => c.root.remove(it.g));
        resetTowel();
      }
      c.setRound(1);
      S.items = XS.map(x => makeCocoa(c, x));
      S.items.forEach(it => c.poke(it.g, .3)); c.SFX.land();
      await c.say('e6.q2');
      const CH2 = { opts: [{ svg: A.icon('coolFast'), label: 'c.fast', say: 'o.fast' }, { svg: A.icon('coolSlow'), label: 'c.slow', say: 'o.slow' }] };
      const g2 = await c.guessChoice(CH2);
      await runRound(c, 'e6.x2');
      await c.say('e6.r2');
      await c.checkChoice(CH2, g2, 1);
      await c.lap();
    },
    down(c, p) {
      const tq = c.screen(S.towel.position), cq = c.screen(S.clock.position);
      if (S.ph === 'wrap' && Math.hypot(tq.x - p.x, tq.y - p.y) < 90) { S.drag = { k: 'towel', x: p.x, y: p.y, moved: false }; c.poke(S.tj, .2); c.SFX.tap(); return; }
      if (S.ph === 'clock' && Math.hypot(cq.x - p.x, cq.y - p.y) < 110) { S.drag = { k: 'clock', x: p.x, y: p.y, t: performance.now() }; S.last = null; S.hold = true; c.poke(S.cj, .15); return; }
      if (S.ph === 'lift' && Math.hypot(tq.x - p.x, tq.y - p.y) < 110) { lift(c); return; }
      S.tap = { x: p.x, y: p.y };
    },
    move(c, p) {
      const d = S.drag; if (!d) return;
      if (d.k === 'towel') { if (Math.hypot(p.x - d.x, p.y - d.y) > 10) d.moved = true; const g = c.ground(p, .1); if (g) S.towel.position.set(g.x, .5, g.z); }
      if (d.k === 'clock') {
        const q = c.screen(S.clock.position);
        const a = Math.atan2(p.y - q.y, p.x - q.x);
        if (Math.hypot(p.x - q.x, p.y - q.y) > 18 && S.last != null) { let da = a - S.last; while (da > Math.PI) da -= 2 * Math.PI; while (da < -Math.PI) da += 2 * Math.PI; advance(c, Math.abs(da) / (Math.PI * 2) / 3); S.hold = false; }
        S.last = a;
      }
    },
    up(c, p) {
      const d = S.drag; S.drag = null; S.hold = false;
      if (d && d.k === 'towel') {
        const it = c.nearest(p, S.items, it => it.g.position.clone().setY(.5), 130);
        if (it) wrap(c, it); else if (!d.moved) wrap(c, S.items[0]); else { c.fail(); resetTowel(); }
        return;
      }
      const t = S.tap; S.tap = null;
      if (!t || Math.hypot(p.x - t.x, p.y - t.y) > 14) return;
      if (S.ph === 'wrap') { const it = c.nearest(p, S.items, it => it.g.position.clone().setY(.5), 120); if (it) wrap(c, it); }
    },
    key(c, k, down, rep) {
      if (k === 'right' || k === 'space') { S.keys.r = down; if (down && S.ph === 'lift') lift(c); return; }
      if (!down || rep) return;
      if (S.ph === 'wrap' && (k === 'a' || k === 'left')) wrap(c, S.items[0]);
      else if (S.ph === 'wrap' && (k === 'b' || k === 'd' || k === 'enter')) wrap(c, S.items[k === 'enter' ? 0 : 1]);
      else if (S.ph === 'lift' && k === 'enter') lift(c);
    },
    frame(c, dt) {
      if (!S) return;
      S.t += dt;
      if (S.ph === 'clock' && (S.hold || S.keys.r)) advance(c, dt * .3);
      S.hand.rotation.y = -S.ang;
      S.items.forEach(it => {
        if (it.kind === 'ice') {
          const k = Math.max(0, it.left);
          it.ice.scale.set(Math.max(.001, Math.cbrt(k)), Math.max(.001, k), Math.max(.001, Math.cbrt(k)));
          it.ice.visible = k > .02;
          it.pud.scale.setScalar(.05 + (1 - k) * .95);
        } else {
          it.steam.forEach((s, i) => { const ph = (S.t * .35 + i * .33) % 1; s.position.y = 1.3 + ph * .7; s.material.opacity = .5 * (1 - ph) * Math.max(0, Math.min(1, (it.left - .1) * 2)); });
        }
      });
    },
    glow(c) {
      if (S.ph === 'wrap') return [{ pos: S.towel.position.clone(), size: 1.8, strong: c.strong }, { pos: S.items[0].g.position.clone().setY(.1), size: 2, color: c.A.C.sage, op: .2 }];
      if (S.ph === 'clock') return [{ pos: S.clock.position.clone().setY(.2), size: 2, strong: c.strong }];
      if (S.ph === 'lift') return [{ pos: S.towel.position.clone().setY(.1), size: 2.2, strong: c.strong }];
      return [];
    },
    caps(c) {
      if (S.ph === 'wrap') return [{ pos: S.items[0].g.position.clone().setY(1.7), text: 'A', cur: true }, { pos: S.items[1].g.position.clone().setY(1.7), text: 'B' }];
      if (S.ph === 'clock') return [{ pos: S.clock.position.clone().setY(.9), text: '→', cur: true }];
      if (S.ph === 'lift') return [{ pos: S.towel.position.clone().setY(2), text: '␣', cur: true }];
      return [];
    },
    demo(c) {
      if (S.ph === 'wrap') return { kind: 'drag', pts: [S.towel.position.clone(), S.items[0].g.position.clone().setY(.6)] };
      if (S.ph === 'clock') return { kind: 'circle', pts: [S.clock.position.clone().setY(.2)], r: 40 };
      if (S.ph === 'lift') return { kind: 'tap', pts: [S.towel.position.clone()] };
      return null;
    },
    assist(c) { if (S.ph === 'wrap') wrap(c, S.items[0]); else if (S.ph === 'clock') S.autoClock = true; else if (S.ph === 'lift') lift(c); },
    probe(c) {
      const sc = v => { const q = c.screen(v); return [Math.round(q.x), Math.round(q.y)]; };
      return { ph: S.ph, time: +S.time.toFixed(2), towel: sc(S.towel.position), clock: sc(S.clock.position), items: S.items.map(it => ({ kind: it.kind, left: +it.left.toFixed(2), wrapped: it.wrapped, scr: sc(it.g.position.clone().setY(.5)) })) };
    },
    exit() { S = null; },
  };

  async function runRound(c, hint) {
    await c.step(1);
    S.ph = 'wrap'; S.time = 0; S.lifted = false;
    c.say(hint);
    await c.until(hint);
    S.ph = 'clock';
    c.say('e6.clock');
    const tick = setInterval(() => { if (S && S.autoClock) advance(c, .02); }, 30);
    await c.until('e6.clock');
    clearInterval(tick); S.autoClock = false;
    S.ph = 'idle';
    await c.wait(.4);
  }
  function wrap(c, it) {
    if (S.ph !== 'wrap' || !it) return;
    S.ph = 'wrapping'; c.act();
    const from = S.towel.position.clone(), to = it.g.position.clone().setY(.1);
    c.tween(.45, k => { S.towel.position.lerpVectors(from, to, c.ease(k)); S.towel.position.y += Math.sin(k * Math.PI) * .8; }).then(() => {
      if (!S) return;
      S.tj.visible = false; S.cover.visible = true; S.cover.scale.set(1.15, it.kind === 'ice' ? 1.35 : 1.8, 1.15);
      it.wrapped = true; S.wrapped = it;
      c.poke(S.tj, .3); c.SFX.land();
      setTimeout(() => S && c.win(), c.FAST ? 10 : 300);
    });
  }
  function resetTowel() { S.towel.position.copy(S.tHome); S.tj.visible = true; S.cover.visible = false; S.towel.rotation.set(0, 0, 0); }
  function advance(c, amt) {
    if (S.ph !== 'clock') return;
    c.act();
    S.time = Math.min(1, S.time + amt);
    const prevAng = S.ang;
    S.ang = S.time * Math.PI * 6;
    if (Math.floor(prevAng / (Math.PI / 2)) !== Math.floor(S.ang / (Math.PI / 2))) c.SFX.stir();
    S.items.forEach(it => { it.left = 1 - S.time * (it.wrapped ? .45 : 1); });
    if (S.time >= 1) { S.ph = 'ticked'; c.SFX.chord2(392, 523.3); setTimeout(() => S && c.win(), c.FAST ? 10 : 500); }
  }
  function lift(c) {
    if (S.ph !== 'lift') return;
    S.ph = 'idle'; S.lifted = true;
    const from = S.towel.position.clone();
    S.cover.visible = false; S.tj.visible = true;
    c.tween(.5, k => { S.towel.position.lerpVectors(from, S.tHome, c.ease(k)); S.towel.position.y += Math.sin(k * Math.PI) * 1.2; }).then(() => { if (!S) return; c.SFX.land(); if (S.wrapped) c.poke(S.wrapped.g, .4); c.SFX.ok(); setTimeout(() => S && c.win(), c.FAST ? 10 : 400); });
  }
})();
