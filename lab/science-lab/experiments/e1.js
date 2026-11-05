// 第 1 關 沉下去？浮起來？——手勢：拖進水缸放手。
// 第一圈：蘋果、葡萄、石頭、木塊連到「浮／沉」（連連看）→ 一個個放進水 → 比一比。
// 第二圈：「那橘子呢？」選浮或沉 → 放（浮）。第三圈：「剝了皮呢？」選 → 在橘子上畫一圈（或點三下）剝皮 → 放（沉）。
// 照真實情況：蘋果浮（露出一部分）、木塊浮、葡萄慢慢沉、石頭快沉；帶皮橘子浮（大部分泡在水裡）、剝皮的慢慢沉。浮的會上下晃兩下再停。
// 三條路：拖曳；鍵盤 A～D／← → 選、空白鍵或 Enter 放進水；點東西＝它自己跳進水缸。水裡的東西可以撈起來再放。
(window.EXPS = window.EXPS || [])[1] = (() => {
  'use strict';
  const T = THREE;
  const TW = 2.3, TB = .14, SURF = 2.0, FLOOR = .1;     // 水缸半寬、缸底、水面高度
  let S = null;
  // 每樣東西：真實的浮沉、浮的時候中心在水面下多少、沉的速度
  const KIND = {
    apple: { float: true, depth: .14, r: .42, mk: A => A.apple(1.3) },
    grape: { float: false, sinkV: .45, r: .34, mk: A => A.grape(1.3) },
    stone: { float: false, sinkV: 2.2, r: .26, mk: A => A.stone(1.3) },
    wood: { float: true, depth: 0, r: .22, mk: A => A.woodBlock(1.3) },
    orange: { float: true, depth: .3, r: .42, mk: A => A.orange(1.3) },
  };
  const HOME_L = [[-4.7, 0], [-3.7, 0], [3.7, 0], [4.7, 0], [4.2, .9]], HOME_P = [[-1.95, 2.1], [-.65, 2.1], [.65, 2.1], [1.95, 2.1], [0, 3.1]];
  let HOME = HOME_L;

  function makeItem(c, kind, home) {
    const A = c.A, k = KIND[kind];
    const g = new T.Group(), j = new T.Group(); g.add(j); j.add(k.mk(A));
    c.jel(j, 150, 7);
    const it = { kind, k, g, j, home: new T.Vector3(home[0], k.r, home[1]), pos: new T.Vector3(home[0], k.r, home[1]), vy: 0, st: 'table', tested: false, t: 0, peeled: false };
    g.position.copy(it.pos);
    c.root.add(g);
    return it;
  }
  const items = () => S.items.concat([S.orange]).filter(it => it.g.visible);
  const sinkV = it => it.kind === 'orange' ? (it.peeled ? .6 : 0) : it.k.sinkV;
  const floats = it => it.kind === 'orange' ? !it.peeled : it.k.float;
  const radius = it => it.kind === 'orange' && it.peeled ? .35 : it.k.r;

  return {
    say: { end: 'e1.end' },
    build(c) {
      const A = c.A, root = c.root;
      HOME = c.portrait ? HOME_P : HOME_L;
      root.add(c.portrait ? A.box(6.4, .1, 7.4, A.M.paper, 0, .05, 1.2, .4) : A.box(11.6, .1, 3.4, A.M.paper, 0, .05, 0, .4));
      // 水缸：玻璃四面＋淡藍的水
      const glassM = A.M.glass;
      const front = A.mesh(new T.BoxGeometry(TW * 2, 2.6, .05), glassM, 0, 1.4, .9); front.castShadow = false; root.add(front);
      const back = A.mesh(new T.BoxGeometry(TW * 2, 2.6, .05), glassM, 0, 1.4, -.9); back.castShadow = false; root.add(back);
      [-1, 1].forEach(s => { const w = A.mesh(new T.BoxGeometry(.05, 2.6, 1.8), glassM, s * TW, 1.4, 0); w.castShadow = false; root.add(w); });
      root.add(A.box(TW * 2 + .2, .1, 2, A.M.wood, 0, .1, 0, .05));
      const water = A.mesh(new T.BoxGeometry(TW * 2 - .1, SURF - TB, 1.7), A.M.water, 0, TB + (SURF - TB) / 2, 0); water.castShadow = false; water.renderOrder = 2; root.add(water);
      const top = A.mesh(new T.PlaneGeometry(TW * 2 - .1, 1.7), A.std(0xBFE0EE, { transparent: true, opacity: .5, depthWrite: false }), 0, SURF, 0); top.rotation.x = -Math.PI / 2; top.castShadow = false; root.add(top);
      S = { c, A, items: [], water, sel: 0, ph: 'idle', drag: null, drops: [], peelN: 0, peelAng: 0, peelLast: null, t: 0, peelBits: [] };
      ['apple', 'grape', 'stone', 'wood'].forEach((k, i) => S.items.push(makeItem(c, k, HOME[i])));
      S.orange = makeItem(c, 'orange', HOME[4]); S.orange.g.visible = false;
      if (c.portrait) c.view([new T.Vector3(-2.5, 0, 3.6), new T.Vector3(2.5, 0, 3.6), new T.Vector3(-2.5, 3.0, -.9), new T.Vector3(2.5, 3.0, -.9)], { elev: 24 });
      else c.view([new T.Vector3(-5.4, 0, 1.4), new T.Vector3(5.4, 0, 1.4), new T.Vector3(-5.4, 2.8, -.8), new T.Vector3(5.4, 2.8, -.8)], { elev: 14 });
    },
    async play(c, r0) {
      const A = c.A;
      const LEFT = ['apple', 'grape', 'stone', 'wood'];
      const RIGHT = [{ svg: A.icon('float'), label: 'c.float', say: 'a.float' }, { svg: A.icon('sink'), label: 'c.sink', say: 'a.sink' }];
      if (r0 >= 1) S.items.forEach(it => putInWater(it, true));
      if (r0 === 0) {
        c.setRound(0);
        await c.say('e1.q');
        const spec = { left: LEFT.map(k => ({ svg: A.icon(k), say: 'n.' + k })), right: RIGHT };
        const g = await c.guessMatch(spec);
        await c.step(1);
        S.ph = 'drop'; S.need = S.items.slice();
        c.say('e1.x1');
        await c.until('e1.x1');
        S.ph = 'idle';
        await c.wait(.6);
        await c.say('e1.r1');
        await c.checkMatch(spec, g, LEFT.map(k => KIND[k].float ? 0 : 1));
        await c.lap();
      }
      const CH = { opts: [{ svg: A.icon('float'), label: 'c.float', say: 'a.float' }, { svg: A.icon('sink'), label: 'c.sink', say: 'a.sink' }] };
      if (r0 <= 1) {
        c.setRound(1);
        showOrange(c);
        await c.say('e1.q2');
        const g = await c.guessChoice(CH);
        await c.step(1);
        S.ph = 'drop'; S.need = [S.orange];
        c.say('e1.x2');
        await c.until('e1.x2');
        S.ph = 'idle';
        await c.wait(.4);
        await c.say('e1.r2');
        await c.checkChoice(CH, g, 0);
        await c.lap();
      }
      c.setRound(2);
      if (!S.orange.g.visible) showOrange(c);
      if (S.orange.st !== 'table') await liftOut(c, S.orange);
      await c.say('e1.q3');
      const g3 = await c.guessChoice(CH);
      await c.step(1);
      S.ph = 'peel'; S.peelN = 0; S.peelAng = 0;
      c.say('e1.x3');
      await c.until('e1.x3');
      S.ph = 'drop'; S.need = [S.orange]; S.orange.tested = false;
      c.hint = 'e1.x2';
      await c.until('e1.x2');
      S.ph = 'idle';
      await c.wait(.8);
      await c.say('e1.r3');
      await c.checkChoice(CH, g3, 1);
      await c.lap();
    },
    // ---------- 輸入 ----------
    down(c, p) {
      if (S.ph === 'peel') { S.peelLast = null; S.peelDown = { x: p.x, y: p.y, t: performance.now(), moved: false }; return; }
      if (S.ph !== 'drop') { const it = c.nearest(p, items(), it => it.g.position, 70); if (it) { c.poke(it.j, .3); c.SFX.bump(1); } return; }
      const it = c.nearest(p, items().filter(i => i.st !== 'fall'), it => it.g.position, 80);
      if (!it) return;
      S.drag = { it, x: p.x, y: p.y, moved: false, t: performance.now() };
      c.poke(it.j, .2); c.SFX.tap();
    },
    move(c, p) {
      if (S.ph === 'peel') { peelTrack(c, p); return; }
      const d = S.drag; if (!d) return;
      if (!d.moved && Math.hypot(p.x - d.x, p.y - d.y) > 10) { d.moved = true; d.it.st = 'drag'; }
      if (!d.moved) return;
      const q = c.planeZ(p, 0); if (!q) return;
      d.want = new T.Vector3(Math.max(-5.4, Math.min(5.4, q.x)), Math.max(.3, Math.min(4.2, q.y)), 0);
    },
    up(c, p) {
      if (S.ph === 'peel') { const d = S.peelDown; S.peelDown = null; if (d && !d.moved && Math.hypot(p.x - d.x, p.y - d.y) < 14) { const q = c.screen(S.orange.g.position); if (Math.hypot(q.x - p.x, q.y - p.y) < 90) peelTick(c, 1); } return; }
      const d = S.drag; S.drag = null;
      if (!d) return;
      const it = d.it;
      if (!d.moved) { autoDrop(c, it); return; }       // 點一下：它自己跳進水缸
      const wx = d.want ? d.want.x : it.pos.x;
      if (Math.abs(wx) < TW - .2 && (!d.want || d.want.y > 1.2) && !p.cancel) { it.pos.x = wx; if (d.want) it.pos.y = Math.max(it.pos.y, d.want.y); release(c, it); }
      else { goHome(c, it); if (S.ph === 'drop') c.fail(); }
    },
    key(c, k, down, rep) {
      if (!down || rep) return;
      const list = S.ph === 'drop' ? (S.need.length === 1 ? S.need : items()) : [];
      if (S.ph === 'peel' && (k === 'space' || k === 'enter')) { peelTick(c, 1); return; }
      if (S.ph !== 'drop') return;
      const li = 'abcd'.indexOf(k);
      if (li >= 0 && S.items[li] && S.need.length > 1) { S.sel = li; c.poke(S.items[li].j, .25); c.SFX.tap(); return; }
      if (k === 'left' || k === 'right') { const L = list; const i = L.indexOf(L[S.sel % L.length]); S.sel = (i + (k === 'left' ? L.length - 1 : 1)) % L.length; c.poke(L[S.sel].j, .25); c.SFX.tap(); return; }
      if (k === 'space' || k === 'enter') { const L = list; let it = L[S.sel % L.length]; if (!it || it.tested) it = L.find(i => !i.tested) || it; if (it) autoDrop(c, it); }
    },
    frame(c, dt) {
      if (!S) return;
      S.t += dt;
      const d = S.drag;
      if (d && d.want) { d.it.pos.lerp(d.want, .3); }
      S.items.concat([S.orange]).forEach(it => {
        if (!it.g.visible) return;
        if (it.st === 'fall' || it.st === 'water') {
          it.t += dt;
          const r = radius(it), wasAbove = it.pos.y > SURF;
          if (it.pos.y > SURF + .05 && it.st === 'fall') { it.vy -= 9.8 * dt; }
          else {
            if (it.st === 'fall') { it.st = 'water'; it.t = 0; it.vy *= .35; splash(c, it.pos.x); }
            if (floats(it)) {
              const yEq = SURF - it.k.depth;
              it.vy += (-(it.pos.y - yEq) * 22 - it.vy * 2.4) * dt;
            } else {
              const v = -sinkV(it);
              it.vy += (v - it.vy) * Math.min(1, dt * 3);
            }
          }
          it.pos.y += it.vy * dt;
          it.pos.z += (0 - it.pos.z) * Math.min(1, dt * 10);
          const bot = TB + r * .8;
          if (it.pos.y < bot) { if (it.vy < -.3) { c.poke(it.j, .25); c.SFX.land(); } it.pos.y = bot; it.vy = 0; }
          void wasAbove;
          if (it.st === 'water' && it.t > 1.6 && Math.abs(it.vy) < .06 && !it.tested) { it.tested = true; c.SFX.note(floats(it) ? 8 : 2); checkDone(c); }
        }
        it.g.position.copy(it.pos);
        if (it.st === 'water' && floats(it)) it.g.rotation.z = Math.sin(S.t * 1.3 + it.home.x) * .06;
      });
      S.drops = S.drops.filter(dr => { dr.t += dt; dr.m.position.set(dr.x + dr.vx * dr.t, SURF + dr.vy * dr.t - 4.9 * dr.t * dr.t, dr.z); if (dr.t > .6) { c.root.remove(dr.m); return false; } return true; });
      S.peelBits.forEach(b => { if (b.t < 1) { b.t += dt * 1.6; b.m.position.lerpVectors(b.a, b.b, Math.min(1, b.t)); b.m.position.y += Math.sin(Math.min(1, b.t) * Math.PI) * .8; } });
    },
    glow(c) {
      if (S.ph === 'peel') return [{ pos: S.orange.g.position.clone(), size: 1.7, strong: c.strong }];
      if (S.ph !== 'drop') return [];
      const it = S.need.find(i => !i.tested && i.st === 'table');
      const out = [];
      if (it) out.push({ pos: it.g.position.clone(), size: 1.3, strong: c.strong });
      return out;
    },
    caps(c) {
      if (S.ph === 'peel') return [{ pos: S.orange.g.position.clone().setY(S.orange.pos.y + .9), text: '␣', cur: true }];
      if (S.ph !== 'drop') return [];
      if (S.need.length === 1) return S.need[0].st === 'table' ? [{ pos: S.need[0].pos.clone().setY(1.2), text: '␣', cur: true }] : [];
      return S.items.map((it, i) => it.st === 'table' ? { pos: it.pos.clone().setY(1.2), text: 'ABCD'[i], cur: !it.tested } : null).filter(Boolean);
    },
    demo(c) {
      if (S.ph === 'peel') return { kind: 'circle', pts: [S.orange.g.position.clone()], r: 42 };
      const it = (S.need || []).find(i => !i.tested && i.st === 'table');
      if (!it) return null;
      return { kind: 'drag', pts: [it.pos.clone(), new T.Vector3(it.pos.x * .6, 3.2, 0), new T.Vector3(0, 2.8, 0)] };
    },
    assist(c) {
      if (S.ph === 'peel') { peelTick(c, 3); return; }
      const it = (S.need || []).find(i => !i.tested && i.st === 'table'); if (it) autoDrop(c, it);
    },
    probe(c) {
      const sc = v => { const q = c.screen(v); return [Math.round(q.x), Math.round(q.y)]; };
      return { ph: S.ph, items: S.items.concat([S.orange]).map(it => ({ kind: it.kind, st: it.st, tested: it.tested, y: +it.pos.y.toFixed(2), scr: sc(it.pos), vis: it.g.visible, peeled: it.peeled })), tank: sc(new T.Vector3(0, 2.6, 0)), peelN: S.peelN };
    },
    exit() { S = null; },
  };

  function checkDone(c) { if (S.ph === 'drop' && S.need.every(i => i.tested)) setTimeout(() => { if (S) c.win(); }, c.FAST ? 10 : 300); }
  function release(c, it) { it.st = 'fall'; it.vy = 0; it.t = 0; it.pos.x = Math.max(-TW + .5, Math.min(TW - .5, it.pos.x)); if (it.pos.y < SURF + .3) it.pos.y = SURF + .3; c.act(); }
  // 自己跳進水缸：畫一道弧線到水缸上方，再放手
  function autoDrop(c, it) {
    if (S.ph !== 'drop' || it.st !== 'table') return;
    it.st = 'drag';
    const from = it.pos.clone(), to = new T.Vector3(Math.max(-1.6, Math.min(1.6, it.home.x * (HOME === HOME_P ? .8 : .35))), 3.4, 0);
    c.tween(.55, k => { it.pos.lerpVectors(from, to, c.ease(k)); it.pos.y += Math.sin(k * Math.PI) * .8; }).then(() => { if (S) release(c, it); });
  }
  function goHome(c, it) {
    it.st = 'drag';
    const from = it.pos.clone();
    c.tween(.4, k => { it.pos.lerpVectors(from, it.home, c.ease(k)); }).then(() => { if (!S) return; it.st = 'table'; c.poke(it.j, .3); c.SFX.land(); });
  }
  function putInWater(it, settled) {
    it.st = 'water'; it.tested = !!settled; it.t = 2;
    it.pos.set(Math.max(-1.7, Math.min(1.7, it.home.x * (HOME === HOME_P ? .85 : .45))), floats(it) ? SURF - it.k.depth : TB + radius(it) * .8, 0);
    it.vy = 0; it.g.position.copy(it.pos);
  }
  async function liftOut(c, it) {
    it.st = 'drag';
    const from = it.pos.clone();
    await c.tween(.6, k => { it.pos.lerpVectors(from, it.home, c.ease(k)); it.pos.y += Math.sin(k * Math.PI) * 1.4; });
    if (!S) return;
    it.st = 'table'; it.tested = false; c.poke(it.j, .3); c.SFX.land();
  }
  function showOrange(c) {
    const o = S.orange; o.g.visible = true; o.st = 'drag';
    const st0 = new T.Vector3(o.home.x + 3, 2.5, o.home.z); o.pos.copy(st0);
    c.tween(.6, k => { o.pos.lerpVectors(st0, o.home, c.ease(k)); }).then(() => { if (!S) return; o.st = 'table'; c.poke(o.j, .4); c.SFX.land(); });
  }
  function splash(c, x) {
    c.SFX.splash();
    for (let k = 0; k < 6; k++) {
      const m = c.A.ball(.06, c.A.M.sky, x, SURF, 0, 8); m.castShadow = false; c.root.add(m);
      S.drops.push({ m, x, z: (k % 3 - 1) * .2, vx: Math.cos(k * 1.1) * 1.3, vy: 1.8 + (k % 3) * .6, t: 0 });
    }
  }
  // 剝皮：在橘子上畫圈（累積繞的角度）或點三下／空白鍵三下
  function peelTrack(c, p) {
    const d = S.peelDown; if (d && Math.hypot(p.x - d.x, p.y - d.y) > 14) d.moved = true;
    const q = c.screen(S.orange.g.position);
    const a = Math.atan2(p.y - q.y, p.x - q.x);
    if (Math.hypot(p.x - q.x, p.y - q.y) > 160) { S.peelLast = null; return; }
    if (S.peelLast != null) { let da = a - S.peelLast; while (da > Math.PI) da -= 2 * Math.PI; while (da < -Math.PI) da += 2 * Math.PI; S.peelAng += Math.abs(da); }
    S.peelLast = a;
    const n = Math.floor(S.peelAng / (Math.PI * 2 / 3));
    if (n > S.peelN) peelTick(c, n - S.peelN);
  }
  function peelTick(c, n) {
    if (S.ph !== 'peel') return;
    for (let i = 0; i < n && S.peelN < 3; i++) {
      S.peelN++;
      c.poke(S.orange.j, .3); c.SFX.note(3 + S.peelN * 2);
      // 一片皮飛到桌上
      const bit = c.A.ball(.22, c.A.M.orange, 0, 0, 0, 10); bit.scale.set(1.3, .25, 1);
      const a = S.orange.pos.clone().add(new T.Vector3(0, .2, 0)), b = S.orange.home.clone().add(new T.Vector3(-1.2 + S.peelN * .6, 0, .7)).setY(.06);
      bit.position.copy(a); c.root.add(bit); S.peelBits.push({ m: bit, a, b, t: 0 });
      S.orange.g.userData && null;
      const peel = S.orange.j.children[0].userData.peel;
      peel.scale.setScalar(1 - S.peelN * .08);
      peel.material = peel.material.clone(); peel.material.transparent = true; peel.material.opacity = 1 - S.peelN * .3;
    }
    if (S.peelN >= 3) {
      const o = S.orange, ud = o.j.children[0].userData;
      ud.peel.visible = false; o.peeled = true; c.poke(o.j, .4); c.SFX.ok();
      S.ph = 'peeled';
      setTimeout(() => { if (S) c.win(); }, c.FAST ? 10 : 500);
    }
  }
})();
