// 第 5 關 誰不見了？——手勢：舀進水（拖湯匙從小碟到杯子）、畫圈攪拌。
// 第一圈：糖、鹽、沙、小石頭連到「不見了／還在」→ 每一杯舀、攪 → 比一比 → 放大鏡看糖水（糖的小點點散在水的小點點之間）。
// 第二圈：「溫水和冷水，哪一杯的糖比較快不見？」→ 兩杯一起攪 → 溫水那杯先攪完。用詞「溫水」不用「熱水」。
// 三條路：拖湯匙＋畫圈；鍵盤 A～D 選杯子、空白鍵舀、按住 → 攪；點小碟＝自己舀、點杯子＝自己攪。
(window.EXPS = window.EXPS || [])[5] = (() => {
  'use strict';
  const T = THREE;
  let S = null;
  const KINDS = ['sugar', 'salt', 'sand', 'pebble'];
  const GONE = { sugar: true, salt: true, sand: false, pebble: false };
  const COL = { sugar: 0xFFFFFF, salt: 0xF4F1EA, sand: 0xE0BE86, pebble: 0x9C948A };

  function makeCup(c, x, z, kind, warm) {
    const A = c.A, g = new T.Group(); g.position.set(x, 0, z); c.root.add(g);
    const cup = A.cup(.48, 1.1); g.add(cup);
    const w = A.mesh(new T.CylinderGeometry(.44, .4, .78, 24), A.std(0x9CCFE6, { roughness: .3, transparent: true, opacity: .3, depthWrite: false }), 0, .44, 0); w.castShadow = false; w.renderOrder = 2; g.add(w);
    const gr = [];
    for (let i = 0; i < 7; i++) {
      const big = kind === 'pebble';
      const m = big ? A.ball(.11, A.clay(COL[kind]), 0, 0, 0, 8) : A.mesh(new T.BoxGeometry(.1, .1, .1), A.std(COL[kind], { roughness: .6 }), 0, 0, 0);
      m.visible = false; g.add(m); gr.push({ m, a: i / 7 * Math.PI * 2, r: .12 + (i % 3) * .09, y: .1 });
    }
    const steam = [];
    if (warm) for (let i = 0; i < 3; i++) { const s = A.mesh(new T.CapsuleGeometry(.03, .35, 3, 6), A.std(0xFFFFFF, { transparent: true, opacity: .5, depthWrite: false }), (i - 1) * .18, 1.35, 0); s.castShadow = false; g.add(s); steam.push(s); }
    const j = new T.Group(); g.add(j);
    return { g, x, z, kind, gr, poured: false, prog: 0, done: false, steam, warm, w };
  }
  function makePlate(c, x, z, kind) {
    const A = c.A, g = new T.Group(); g.position.set(x, 0, z); c.root.add(g);
    g.add(A.cyl(.36, .32, .05, A.M.paper, 0, .03, 0, 20));
    const pile = kind === 'pebble' ? new T.Group() : A.mesh(new T.ConeGeometry(.24, .16, 16), A.clay(COL[kind]), 0, .13, 0);
    if (kind === 'pebble') [[-.1, 0], [.1, .05], [0, -.1]].forEach(([a, b]) => pile.add(A.ball(.09, A.clay(COL.pebble), a, .12, b, 8)));
    g.add(pile);
    return { g, x, z, kind };
  }

  return {
    say: { end: 'e5.end' },
    build(c) {
      const A = c.A, root = c.root;
      const P = c.portrait;
      root.add(A.box(P ? 5.2 : 8, .1, P ? 6.2 : 4, A.M.paper, 0, .05, 0, .5));
      const spoon = new T.Group(), sj = new T.Group(); spoon.add(sj); sj.add(A.spoon(2.2, A.std(0xC9CDD1, { roughness: .45 }))); c.jel(sj); root.add(spoon);
      const mag = new T.Group(), mgj = new T.Group(); mag.add(mgj);
      mgj.add(A.mesh(new T.TorusGeometry(.42, .07, 10, 28), A.M.sky, 0, 0, 0)); const hd = A.box(.14, .14, .7, A.M.woodDark, 0, 0, .75, .04); mgj.add(hd);
      mgj.rotation.x = -Math.PI / 2; c.jel(mgj); mag.visible = false; root.add(mag);
      S = { c, A, cups: [], plates: [], spoon, sj, mag, mgj, ph: 'idle', sel: 0, carry: null, drag: null, stirAng: 0, last: null, keys: {}, t: 0 };
      S.spoonHome = new T.Vector3(P ? 2.0 : 3.4, .1, P ? 2.6 : 1.6);
      spoon.position.copy(S.spoonHome);
      const ext = P ? [new T.Vector3(-2.4, 0, 3.0), new T.Vector3(2.4, 0, 3.0), new T.Vector3(-2.4, 1.3, -2.6), new T.Vector3(2.4, 1.3, -2.6)]
        : [new T.Vector3(-3.8, 0, 1.9), new T.Vector3(3.8, 0, 1.9), new T.Vector3(-3.8, 1.3, -1.6), new T.Vector3(3.8, 1.3, -1.6)];
      c.view(ext, { elev: 42, elevPt: 52 });
    },
    async play(c, r0) {
      const A = c.A, P = c.portrait;
      if (r0 === 0) {
        c.setRound(0);
        const xs = P ? [[-1.1, -1.6], [1.1, -1.6], [-1.1, .6], [1.1, .6]] : [[-2.7, -.6], [-.9, -.6], [.9, -.6], [2.7, -.6]];
        S.cups = KINDS.map((k, i) => makeCup(c, xs[i][0], xs[i][1], k));
        S.plates = KINDS.map((k, i) => makePlate(c, xs[i][0] + (P ? .75 : 0), xs[i][1] + (P ? .2 : 1.25), k));
        await c.say('e5.q');
        const spec = { left: KINDS.map(k => ({ svg: A.icon(k), say: 'n.' + k })), right: [{ svg: A.icon('gone'), label: 'c.gone', say: 'a.gone' }, { svg: A.icon('still'), label: 'c.still', say: 'a.still' }] };
        const g = await c.guessMatch(spec);
        await c.step(1);
        S.ph = 'work'; S.active = S.cups;
        c.say('e5.x1');
        await c.until('e5.x1');
        S.ph = 'idle';
        await c.wait(.5);
        await c.say('e5.r1');
        await c.checkMatch(spec, g, KINDS.map(k => GONE[k] ? 0 : 1));
        // 放大鏡：糖真的消失了嗎？
        S.ph = 'mag'; S.mag.visible = true; S.mag.position.set(P ? -2.0 : 3.4, .5, P ? 2.4 : 1.4); c.poke(S.mgj, .4);
        c.say('e5.mag');
        await c.until('e5.mag');
        S.ph = 'idle';
        await c.say('e5.mag2');
        hideLens();
        S.mag.visible = false;
        await c.lap();
        S.cups.forEach(cu => c.root.remove(cu.g)); S.plates.forEach(p => c.root.remove(p.g));
      }
      c.setRound(1);
      S.cups = [makeCup(c, -1.1, -.3, 'sugar', true), makeCup(c, 1.1, -.3, 'sugar', false)];
      S.cups.forEach(cu => { cu.poured = true; cu.gr.forEach(o => { o.m.visible = true; }); c.poke(cu.g, .3); });
      S.plates = [];
      c.SFX.land();
      await c.say('e5.q2');
      const CH = { opts: [{ svg: A.icon('warm'), label: 'c.warm', say: 'o.warm' }, { svg: A.icon('cold'), label: 'c.cold', say: 'o.cold' }] };
      const g2 = await c.guessChoice(CH);
      await c.step(1);
      S.ph = 'stir2'; S.active = S.cups;
      c.say('e5.x2');
      await c.until('e5.x2');
      S.ph = 'idle';
      await c.wait(.4);
      await c.say('e5.r2');
      await c.checkChoice(CH, g2, 0);
      await c.lap();
    },
    down(c, p) {
      act(c);
      if (S.ph === 'mag') { const q = c.screen(S.mag.position); if (Math.hypot(q.x - p.x, q.y - p.y) < 90) { S.drag = { k: 'mag' }; c.poke(S.mgj, .2); return; } S.tap = { x: p.x, y: p.y }; return; }
      if (S.ph === 'work') {
        const pl = c.nearest(p, S.plates.filter(pl => !cupOf(pl).poured), pl => pl.g.position, 80);
        if (pl) { S.drag = { k: 'spoon', pl, x: p.x, y: p.y, moved: false }; scoop(c, pl); return; }
      }
      const cu = c.nearest(p, S.cups, cu => cu.g.position.clone().setY(.6), 100);
      if (cu && cu.poured && !cu.done && (S.ph === 'work' || S.ph === 'stir2')) { S.drag = { k: 'stir', cu, x: p.x, y: p.y, moved: false }; S.last = null; return; }
      S.tap = { x: p.x, y: p.y };
    },
    move(c, p) {
      const d = S.drag; if (!d) return;
      if (Math.hypot(p.x - (d.x || 0), p.y - (d.y || 0)) > 12) d.moved = true;
      if (d.k === 'spoon') { const g = c.ground(p, 1.4); if (g) S.spoon.position.lerp(g, .5); }
      else if (d.k === 'mag') { const g = c.ground(p, .5); if (g) S.mag.position.copy(g); }
      else if (d.k === 'stir') {
        const q = c.screen(d.cu.g.position.clone().setY(.6));
        const a = Math.atan2(p.y - q.y, p.x - q.x);
        if (S.last != null) { let da = a - S.last; while (da > Math.PI) da -= 2 * Math.PI; while (da < -Math.PI) da += 2 * Math.PI; stir(c, d.cu, Math.abs(da) / (Math.PI * 2) / 2.2); }
        S.last = a;
      }
    },
    up(c, p) {
      const d = S.drag; S.drag = null;
      if (d && d.k === 'spoon') {
        const cu = cupOf(d.pl);
        const q = c.screen(cu.g.position.clone().setY(1)), near = Math.hypot(q.x - p.x, q.y - p.y) < 110;
        if (!d.moved || near) pour(c, cu); else { S.carry = null; spoonHome(c); c.fail(); }
        return;
      }
      if (d && d.k === 'mag') { const sug = S.cups[0], q = c.screen(sug.g.position.clone().setY(.8)); if (Math.hypot(q.x - p.x, q.y - p.y) < 120) lens(c); else c.fail(); return; }
      if (d && d.k === 'stir') { if (!d.moved) autoStir(c, d.cu); return; }
      const t = S.tap; S.tap = null;
      if (!t || Math.hypot(p.x - t.x, p.y - t.y) > 14) return;
      if (S.ph === 'mag') { const q = c.screen(S.cups[0].g.position.clone().setY(.8)); if (Math.hypot(q.x - p.x, q.y - p.y) < 120) lens(c); }
    },
    key(c, k, down, rep) {
      if (k === 'right') { S.keys.r = down; return; }
      if (!down || rep) return;
      act(c);
      const li = 'abcd'.indexOf(k);
      if (li >= 0 && S.cups[li]) { S.sel = li; c.poke(S.cups[li].g.children[0], .1); c.SFX.tap(); return; }
      if (S.ph === 'mag' && (k === 'space' || k === 'enter' || k === 'm')) { lens(c); return; }
      if (S.ph === 'work' && (k === 'space' || k === 'enter')) {
        let cu = S.cups[S.sel]; if (!cu || cu.done) cu = S.cups.find(x => !x.done) || cu;
        if (!cu.poured) { scoop(c, plateOf(cu)); pour(c, cu); } else if (!cu.done) autoStir(c, cu);
      }
      if (S.ph === 'stir2' && (k === 'space' || k === 'enter')) autoStir(c, S.cups[0]);
    },
    frame(c, dt) {
      if (!S) return;
      S.t += dt;
      if (S.keys.r && (S.ph === 'work' || S.ph === 'stir2')) { let cu = S.ph === 'stir2' ? S.cups[0] : S.cups[S.sel]; if (cu && (!cu.poured || cu.done)) cu = S.cups.find(x => x.poured && !x.done); if (cu) stir(c, cu, dt * .35); }
      if (S.auto) { stir(c, S.auto, dt * .45); if (S.auto.done) S.auto = null; }
      S.cups.forEach(cu => {
        cu.spin = (cu.spin || 0) * Math.pow(.25, dt);
        cu.gr.forEach((o, i) => {
          if (!o.m.visible) return;
          o.a += cu.spin * dt * 9;
          const gone = GONE[cu.kind];
          const k = gone ? Math.max(0, 1 - cu.prog * 1.05) : 1;
          o.m.scale.setScalar(Math.max(.001, k));
          const lift = Math.min(.35, cu.spin * .6) * (gone ? 1 : 1);
          o.m.position.set(Math.cos(o.a) * o.r, .1 + lift * (.5 + .5 * Math.sin(i + S.t * 3)) + (i % 2) * .03, Math.sin(o.a) * o.r);
          if (gone && k <= .001) o.m.visible = false;
        });
        cu.steam.forEach((s, i) => { s.position.y = 1.3 + ((S.t * .4 + i * .33) % 1) * .5; s.material.opacity = .45 * (1 - ((S.t * .4 + i * .33) % 1)); });
      });
      if (S.carry) { S.spoon.position.y = Math.max(S.spoon.position.y, 1.3); }
      if (S.lensEl) { const q = c.screen(S.cups[0].g.position.clone().setY(.6)); S.lensEl.style.transform = 'translate(' + (q.x - 80) + 'px,' + (q.y - 190) + 'px)'; }
    },
    glow(c) {
      if (S.ph === 'mag') return [{ pos: S.mag.position.clone(), size: 1.4, color: c.A.C.sky, strong: c.strong }, { pos: S.cups[0].g.position.clone().setY(.3), size: 1.4 }];
      if (S.ph !== 'work' && S.ph !== 'stir2') return [];
      const cu = S.cups.find(x => !x.done);
      if (!cu) return [];
      if (!cu.poured) return [{ pos: plateOf(cu).g.position.clone().setY(.2), size: 1.1, strong: c.strong }];
      return [{ pos: cu.g.position.clone().setY(.1), size: 1.6, strong: c.strong }];
    },
    caps(c) {
      if (S.ph === 'work') return S.cups.map((cu, i) => ({ pos: cu.g.position.clone().setY(1.6), text: 'ABCD'[i], cur: i === S.sel }));
      if (S.ph === 'stir2') return [{ pos: new T.Vector3(0, 1.6, -.3), text: '→', cur: true }];
      if (S.ph === 'mag') return [{ pos: S.mag.position.clone().setY(1.0), text: '␣', cur: true }];
      return [];
    },
    demo(c) {
      if (S.ph === 'mag') return { kind: 'drag', pts: [S.mag.position.clone(), S.cups[0].g.position.clone().setY(1)] };
      const cu = S.cups.find(x => !x.done); if (!cu) return null;
      if (!cu.poured) return { kind: 'drag', pts: [plateOf(cu).g.position.clone().setY(.2), cu.g.position.clone().setY(1.2)] };
      return { kind: 'circle', pts: [cu.g.position.clone().setY(.6)], r: 40 };
    },
    assist(c) {
      if (S.ph === 'mag') { lens(c); return; }
      const cu = S.cups.find(x => !x.done); if (!cu) return;
      if (!cu.poured) { scoop(c, plateOf(cu)); pour(c, cu); } else autoStir(c, cu);
    },
    probe(c) {
      const sc = v => { const q = c.screen(v); return [Math.round(q.x), Math.round(q.y)]; };
      return { ph: S.ph, cups: S.cups.map(cu => ({ k: cu.kind, warm: cu.warm, poured: cu.poured, prog: +cu.prog.toFixed(2), done: cu.done, scr: sc(cu.g.position.clone().setY(.6)) })), plates: S.plates.map(p => sc(p.g.position.clone().setY(.15))), mag: sc(S.mag.position), lens: !!S.lensEl };
    },
    exit() { hideLens(); S = null; },
  };

  function act(c) { c.act(); }
  function cupOf(pl) { return S.cups[S.plates.indexOf(pl)]; }
  function plateOf(cu) { return S.plates[S.cups.indexOf(cu)]; }
  function scoop(c, pl) { if (!pl) return; S.carry = pl.kind; S.spoon.position.copy(pl.g.position).setY(1.3); c.poke(S.sj, .3); c.SFX.tap(); }
  function spoonHome(c) { const from = S.spoon.position.clone(); c.tween(.35, k => S.spoon.position.lerpVectors(from, S.spoonHome, k)); }
  function pour(c, cu) {
    if (cu.poured) { spoonHome(c); return; }
    S.carry = null;
    const from = S.spoon.position.clone(), to = cu.g.position.clone().add(new T.Vector3(.2, 1.4, 0));
    c.tween(.3, k => S.spoon.position.lerpVectors(from, to, k)).then(() => {
      if (!S) return;
      S.sj.rotation.x = .9; c.SFX.drop();
      cu.poured = true; cu.gr.forEach((o, i) => { o.m.visible = true; o.m.position.set(Math.cos(o.a) * o.r, .1 + i * .02, Math.sin(o.a) * o.r); });
      setTimeout(() => { if (!S) return; S.sj.rotation.x = 0; spoonHome(c); }, c.FAST ? 10 : 350);
    });
  }
  function stir(c, cu, amt) {
    if (cu.done || !cu.poured) return;
    S.stirT = (S.stirT || 0) + amt;
    if (S.stirT > .06) { S.stirT = 0; c.SFX.stir(); }
    const list = S.ph === 'stir2' ? S.cups : [cu];
    list.forEach(x => {
      if (x.done) return;
      x.spin = Math.min(1.2, (x.spin || 0) + amt * 6);
      x.prog = Math.min(1, x.prog + amt * (x.warm === false ? .45 : 1));
      if (x.prog >= 1 || (S.ph === 'stir2' && x.warm && x.prog >= 1)) finish(c, x);
    });
  }
  function finish(c, cu) {
    cu.done = true; c.SFX.note(GONE[cu.kind] ? 9 : 3);
    if (S.ph === 'stir2') { if (cu.warm) { S.ph = 'idle'; setTimeout(() => S && c.win(), c.FAST ? 10 : 600); } return; }
    if (S.cups.every(x => x.done)) { S.ph = 'idle'; setTimeout(() => S && c.win(), c.FAST ? 10 : 700); }
  }
  function autoStir(c, cu) { if (!cu.poured || cu.done) return; S.auto = cu; }
  // 放大鏡：糖的小點點（琥珀）散在水的小點點（天藍）之間，一直在動
  function lens(c) {
    if (S.ph !== 'mag' || S.lensEl) return;
    S.ph = 'lens'; c.act();
    S.mag.position.copy(S.cups[0].g.position).setY(1.3);
    const el = document.createElement('div'); el.className = 'sl-lens';
    const cv = document.createElement('canvas'); cv.width = cv.height = 320; el.appendChild(cv);
    document.querySelector('#ov').appendChild(el); S.lensEl = el;
    const x = cv.getContext('2d'), ps = [];
    for (let i = 0; i < 34; i++) ps.push({ x: Math.random() * 320, y: Math.random() * 320, vx: Math.random() - .5, vy: Math.random() - .5, s: i < 9 });
    const loop = () => {
      if (!S || S.lensEl !== el) return;
      x.clearRect(0, 0, 320, 320); x.fillStyle = '#EAF5FA'; x.beginPath(); x.arc(160, 160, 158, 0, 7); x.fill();
      ps.forEach(p => { p.x += p.vx * 1.6; p.y += p.vy * 1.6; if (Math.hypot(p.x - 160, p.y - 160) > 140) { p.vx *= -1; p.vy *= -1; } x.fillStyle = p.s ? '#F2A33A' : '#7FC0E2'; x.beginPath(); x.arc(p.x, p.y, p.s ? 9 : 12, 0, 7); x.fill(); });
      requestAnimationFrame(loop);
    };
    loop();
    c.SFX.chord2(659.3, 784);
    setTimeout(() => S && c.win(), c.FAST ? 10 : 800);
  }
  function hideLens() { if (S && S.lensEl) { S.lensEl.remove(); S.lensEl = null; } }
})();
