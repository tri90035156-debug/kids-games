// 《種子小偵探》3D 版（2026-11-08 第 6 批）：一條黏土花園小徑，一關往右走一段（鏡頭跟著平移）。
// 接上共用引擎（engine.js：封面、標題卡、?ch=N、重來鈕、字幕泡泡＋配音），3D 用 kit3d.js、場景在 garden.js。八關（七關＋加碼關），每關一種 3D 動作，相鄰兩關不一樣：
// 1 手指劃過果實把它切開，找種子  2 照順序點（開花、蜜蜂、小果實、熟了），東西排上小木架  3 拖澆水壺去澆水、點太陽，樹一段一段長高
// 4 按住種子，它的樹從種子長出來  5 點一棵對的樹（這顆種子會長成哪一種）  6 把種子丟給風、水或松鼠，看它飛去哪裡
// 7 照順序點，種子的一生排成一圈  8 把孢子、種子、花拖到時間軸上
// 配音稿一句沒改（tools/content.py 沒動、沒重錄）。各關最後的「選一個」也是點 3D 東西。測試：?ch=N&fast=1、?fin=1、__sd.win()、__sd.aid()。
(() => {
  'use strict';
  const { $, stage, Z, say, speak, sleep, shuffle, FAST } = G;
  const K = K3, { T } = K;
  const sfx = n => G.sfx(n);
  const note = i => G.note && G.note(i);
  K.init({ bg: 0xF3EEDF, ground: 0xCFDDB0 });
  if (K.ok) GD.ground(K.scene);
  const V = (x, y, z) => new T.Vector3(x, y, z);
  const W = (o, k = 150, d = 7) => K.wrap(o, k, d);
  let winStep = null, aid = null, X = 0;
  const scr = (o, dy = 0) => { const q = K.sp(K.pos(o).add(V(0, dy, 0))), r = K.v.el.getBoundingClientRect(); return { x: Math.round(r.left + q.x), y: Math.round(r.top + q.y) }; };
  function coach(goal, demo) {
    let last = performance.now(), off = null;
    const act = () => { last = performance.now(); if (off) { off(); off = null; } };
    addEventListener('pointerdown', act, true); addEventListener('keydown', act, true);
    const iv = setInterval(() => { if (performance.now() - last < 15000) return; last = performance.now(); if (goal) say(goal); if (demo) { if (off) off(); off = demo(); setTimeout(() => { if (off) { off(); off = null; } }, 4000); } }, 1000);
    return () => { clearInterval(iv); removeEventListener('pointerdown', act, true); removeEventListener('keydown', act, true); if (off) off(); };
  }
  let wrong = 0, hints = [];
  function missed(obj, rightObj) { K.poke(obj.userData.j || obj, -.35); sfx('no'); wrong++; say(wrong >= 2 ? 'g.no2' : 'g.no1'); if (wrong === 2 && rightObj) hints.push(K.halo(rightObj, 2.4)); }
  const clearHints = () => { hints.forEach(K.haloOff); hints = []; wrong = 0; };
  const okSay = () => say(['g.ok1', 'g.ok2', 'g.ok3'][Math.floor(Math.random() * 3)]);
  // 每一關在小徑上的位置（往右走）
  const at = (x, y, z) => V(X + x, y, z);
  const P = (o, x, y, z) => K.add(o, X + x, y, z);
  const PT = () => K.portrait();
  // 每關第一次框鏡頭：先跳到位置左邊一點，再慢慢往右滑過去（像沿著小徑往右走）
  let framedX = null;
  function frame(pts, o) {
    const pp = pts.map(p => p.clone().add(V(X, 0, 0)));
    if (framedX !== X) { framedX = X; K.frameTo(pp, o, true); K.cam.position.x -= 4; } else K.frameTo(pp, o);
  }
  // 點一個 3D 東西（或按它的鍵）
  function tapOne(objs, keys, right, dy = .8) {
    return new Promise(res => {
      const pick = i => { if (i < 0 || !objs[i]) return; if (i === right) { offK(); res(i); return; } missed(objs[i], objs[right]); if (wrong >= 3) { offK(); res(right); } };
      K.inputs({ up(p) { if (!p.cancel) pick(K.nearest(p, objs, { max: 120, at: o => K.pos(o).add(V(0, dy, 0)) })); } });
      const offK = K.keys((k, dn) => { const i = keys.indexOf(k); if (dn && i >= 0) { pick(i); return true; } return false; });
      winStep = () => { offK(); res(right); };
      aid = () => ({ kb: [keys[right]], ptr: { tap: scr(objs[right], dy) } });
    });
  }
  // 選一個（3D）：兩三個東西放在小徑前面，下面有字
  async function quiz3d({ q, ok, opts }) {
    const gs = opts.map((o, i) => { const g = W(o.make()); P(g, (i - (opts.length - 1) / 2) * 2.8, 0, 4.6); K.tag(g, Z(o.text), -.15); K.cap(g, 'ABC'[i], 1.7); return g; });
    gs.forEach((g, i) => setTimeout(() => K.poke(g.userData.j, .5), i * 90)); sfx('pop');
    frame([V(-4.4, 0, 6), V(4.4, 0, 6), V(-4.4, 2, 2.6), V(4.4, 2, 2.6)], { elev: 26, elevPt: 34 });
    say(q);
    const right = opts.findIndex(o => o.ok);
    const offC = coach(q, () => K.hand(gs[right], 'tap'));
    await tapOne(gs, 'abc', right, .6);
    offC(); clearHints(); K.inputs({}); aid = null;
    K.poke(gs[right].userData.j, .6); sfx('ok');
    await say(ok);
    await G.next();
  }

  // ========== 1 找種子：手指劃過果實把它切開 ==========
  async function ch1() {
    if (!K.mount()) return;
    K.level(); X = 0;
    const stall = P(K.box(8.4, .3, 2.4, GD.mat('trunk')), 0, .9, .4); void stall;
    [-3.9, 3.9].forEach(x => P(K.box(.3, .9, 2, GD.mat('trunk')), x, .45, .4));
    const KIND = [['apple', 'c1.apple', 'c1.apple.l'], ['mango', 'c1.mango', 'c1.mango.l'], ['pinecone', 'c1.pine', 'c1.pine.l']];
    const fr = KIND.map(([k], i) => { const g = W(GD[k](false)); g.userData.k = k; P(g, (i - 1) * 2.6, 1.05, .4); return g; });
    fr.forEach((g, i) => { K.tag(g, Z(KIND[i][2]), 2); K.cap(g, String(i + 1), 2.9); });
    frame([V(-4.4, .6, 1.8), V(4.4, .6, 1.8), V(-4.4, 3.6, -.4), V(4.4, 3.6, -.4)], { elev: 22, elevPt: 26 });
    say('c1.intro');
    let opened = 0;
    const open = async i => {
      const g = fr[i]; if (g.userData.open) return;
      g.userData.open = true; opened++;
      const j = g.userData.j; j.remove(j.children[0]); j.add(GD[g.userData.k](true)); K.poke(j, .6); sfx('ok');
      const p = say(KIND[i][1]);
      if (opened === 3) { await p; finish(); }
    };
    let finish;
    const offC = coach('c1.intro', () => { const i = fr.findIndex(g => !g.userData.open); return i >= 0 ? K.hand(fr[i], 'wipe') : null; });
    await new Promise(res => {
      finish = res;
      // 劃過：按下去移動超過 30 像素就切開；點一下也可以（先抖一下，再點一次才開）
      let st = null;
      K.inputs({
        down(p) { st = { x: p.x, y: p.y, i: K.nearest(p, fr.map(g => (g.userData.open ? null : g)), { max: 120, at: o => K.pos(o).add(V(0, .7, 0)) }), cut: false }; if (st.i >= 0) K.poke(fr[st.i].userData.j, .2); },
        move(p) { if (!st || st.cut) return; if (Math.hypot(p.x - st.x, p.y - st.y) > 30) { const i = st.i >= 0 ? st.i : K.nearest(p, fr.map(g => (g.userData.open ? null : g)), { max: 120, at: o => K.pos(o).add(V(0, .7, 0)) }); if (i >= 0) { st.cut = true; open(i); } } },
        up(p) { if (st && !st.cut && st.i >= 0 && Math.hypot(p.x - st.x, p.y - st.y) < 12) open(st.i); st = null; },
      });
      K.keys((k, dn) => { const i = '123'.indexOf(k); if (dn && i >= 0) { open(i); return true; } return false; });
      winStep = () => fr.forEach((g, i) => open(i));
      aid = () => { const i = fr.findIndex(g => !g.userData.open); return i >= 0 ? { kb: [String(i + 1)], ptr: { wipe: scr(fr[i], .7) } } : null; };
    });
    offC(); K.inputs({}); aid = null;
    await say('c1.done');
    await quiz3d({ q: 'c1.q', ok: 'c1.ok', opts: [{ text: 'c1.o1', make: () => GD.apple(true), ok: true }, { text: 'c1.o2', make: () => { const g = new T.Group(); const r = K.ball(.6, GD.mat('grey'), 0, .5, 0, 12); r.scale.set(1.2, .8, 1); g.add(r); return g; } }, { text: 'c1.o3', make: () => { const g = new T.Group(); [[0, .9, .5], [.45, .85, .38], [-.45, .85, .38]].forEach(([x, y, r]) => g.add(K.ball(r, GD.mat('white'), x, y, 0, 12))); return g; } }] });
  }

  // ========== 照順序點：東西排上小木架（第 2、7 關共用） ==========
  async function orderTap({ intro, done, items, ring = false }) {
    const n = items.length, ord = shuffle(items.map((_, i) => i));
    const two = PT() && n >= 5;
    const gs = ord.map((k, j) => { const g = W(items[k].make()); g.userData.k = k; if (two) P(g, j < 3 ? (j - 1) * 2.8 : (j - 3.5) * 2.8, 0, j < 3 ? 3.2 : 5.2); else P(g, (j - (n - 1) / 2) * (PT() ? 1.9 : 2.4), 0, 3.6); return g; });
    gs.forEach((g, j) => { K.tag(g, Z(items[g.userData.k].label), -.15); K.cap(g, String(j + 1), 1.9); });
    // 目的地：一排（或一圈）木頭小圓盤
    const R = 2.6;
    const slots = items.map((_, i) => ring ? at(Math.cos(-Math.PI / 2 + i / n * Math.PI * 2) * R, .08, -.6 + Math.sin(-Math.PI / 2 + i / n * Math.PI * 2) * R * .7) : at((i - (n - 1) / 2) * (PT() ? 1.9 : 2.4), .08, -.6));
    slots.forEach(s => K.add(GD.slotDisc(), s.x, 0, s.z));
    const ex = Math.max(3.4, (n - 1) / 2 * (PT() ? 1.9 : 2.4) + 1);
    frame(ring ? [V(-3.8, 0, two ? 6.2 : 4.6), V(3.8, 0, two ? 6.2 : 4.6), V(-3.6, 1.4, -2.8), V(3.6, 1.4, -2.8)] : [V(-ex, 0, 4.6), V(ex, 0, 4.6), V(-ex, 1.6, -1.4), V(ex, 1.6, -1.4)], { elev: 34, elevPt: 46 });
    say(intro);
    for (let s = 0; s < n; s++) {
      const right = gs.findIndex(g => g && g.userData.k === s);
      const offC = coach(intro, () => K.hand(gs[right], 'tap'));
      await tapOne(gs, '123456'.slice(0, n), right, .8);
      offC(); clearHints(); K.inputs({}); aid = null;
      const g = gs[right]; gs[right] = null;
      const from = g.position.clone(), to = slots[s];
      await K.tween(.5, k => { g.position.lerpVectors(from, to, K.ease(k)); g.position.y = to.y + Math.sin(k * Math.PI) * 1.4; });
      K.poke(g.userData.j, .4); sfx('bump');
      await say(items[s].say);
    }
    if (ring) { const t = new T.Mesh(new T.TorusGeometry(R, .06, 6, 48), K.clay(0xF2A23A)); t.rotation.x = -Math.PI / 2; t.scale.y = .7; K.add(t, X, .1, -.6); sfx('win'); }
    await say(done);
  }

  // ========== 2 種子怎麼來：照順序點 ==========
  async function ch2() {
    if (!K.mount()) return;
    K.level(); X = 18;
    const bee0 = W(GD.bee()); P(bee0, -3.4, 2.6, -2); let t0 = 0; K.on(dt => { t0 += dt; bee0.position.set(X - 3.4 + Math.sin(t0) * 1.2, 2.6 + Math.sin(t0 * 3) * .2, -2 + Math.cos(t0) * .5); });
    await orderTap({ intro: 'c2.intro', done: 'c2.done', items: [
      { make: () => GD.flower(), label: 'c2.l1', say: 'c2.n1' },
      { make: () => { const g = GD.flower(); const b = GD.bee(); b.position.set(.3, 1.6, 0); g.add(b); return g; }, label: 'c2.l2', say: 'c2.n2' },
      { make: () => GD.tinyFruit(), label: 'c2.l3', say: 'c2.n3' },
      { make: () => GD.apple(false), label: 'c2.l4', say: 'c2.n4' },
    ] });
    await G.next();
    K.level();
    await quiz3d({ q: 'c2.q', ok: 'c2.ok', opts: [{ text: 'c2.o1', make: () => GD.flower(), ok: true }, { text: 'c2.o2', make: () => GD.apple(false) }, { text: 'c2.o3', make: () => { const g = new T.Group(); g.add(K.box(1.2, .4, 1.2, GD.mat('soil'), 0, .2, 0)); return g; } }] });
  }

  // ========== 3 種子變成樹：拖澆水壺去澆水、點太陽 ==========
  async function ch3() {
    if (!K.mount()) return;
    K.level(); X = 36;
    const pt = W(GD.pot(), 120, 8); P(pt, 0, 0, .4);
    const gr = GD.growing(); pt.userData.j.add(gr);
    const can = W(GD.can()); P(can, -3.2, 0, 2.4);
    const sn = W(GD.sun(.8)); P(sn, 3.2, 4, -1.6);
    const drops = K.dots(18, .08, GD.mat('water')); K.lv.add(drops);
    K.on(dt => { drops.userData.P.forEach(q => { if (q.life > 0) { q.p.y -= dt * 3; q.life -= dt; if (q.p.y < 1) q.life = 0; } }); drops.userData.sync(); });
    const kw = K.cap(can, 'W', 1.3), ks = K.cap(sn, 'S', 1.2);
    frame([V(-4.4, 0, 3.6), V(4.4, 0, 3.6), V(-3, 5.2, -1.6), V(4.2, 5, -1.6)], { elev: 18, elevPt: 24 });
    // 先點一下泥土把種子種進去
    say('c3.intro');
    await new Promise(res => {
      K.inputs({ up(p) { if (!p.cancel && K.nearest(p, [pt], { max: 150, at: o => K.pos(o).add(V(0, 1, 0)) }) >= 0) res(); } });
      const offK = K.keys((k, dn) => { if (dn && (k === 'space' || k === 'enter')) { offK(); res(); return true; } return false; });
      winStep = res; aid = () => ({ kb: ['space'], ptr: { tap: scr(pt, 1) } });
    });
    K.inputs({}); aid = null;
    K.poke(pt.userData.j, .4); sfx('ok'); gr.userData.set(1);
    await say('c3.s1');
    const want = ['w', 'w', 's', 's', 'w', 's'];
    const canHome = can.position.clone();
    for (let k = 1; k <= 6; k++) {
      const w = want[k - 1];
      const h = K.halo(w === 'w' ? can : sn, 1.8);
      say('c3.k' + k);
      const offC = coach('c3.k' + k, () => (w === 'w' ? K.hand(can, 'drag', pt) : K.hand(sn, 'tap')));
      await new Promise(res => {
        const water = async () => {
          if (w !== 'w') { K.poke(can.userData.j, -.3); sfx('no'); return; }
          offK(); K.inputs({});
          const from = can.position.clone(), to = at(-1.4, 1.6, .4);
          await K.tween(.4, t => { can.position.lerpVectors(from, to, K.ease(t)); });
          can.rotation.z = -.6; sfx('pour');
          drops.userData.P.forEach((q, i) => { q.life = 1; q.s = 1; q.p.set(X - .6 + Math.random() * .5, 2 + i * .08, .4 + (Math.random() - .5) * .5); });
          await K.wait(.6); can.rotation.z = 0;
          await K.tween(.35, t => { can.position.lerpVectors(to, canHome, K.ease(t)); });
          res();
        };
        const shine = () => { if (w !== 's') { K.poke(sn.userData.j, -.3); sfx('no'); return; } offK(); K.poke(sn.userData.j, .6); sfx('ok'); res(); };
        let grab = null;
        K.inputs({
          down(p) { if (K.nearest(p, [can], { max: 100, at: o => K.pos(o).add(V(0, .4, 0)) }) >= 0) grab = { x: p.x, y: p.y }; },
          move(p) { if (!grab) return; const g = K.ground(p, 0); if (g) can.position.set(K.clamp(g.x, X - 5, X + 5), .6, K.clamp(g.z, -2, 4)); },
          up(p) {
            if (grab) { const moved = Math.hypot(p.x - grab.x, p.y - grab.y) > 10; grab = null; const near = can.position.distanceTo(at(0, .6, .4)) < 2.2 || K.nearest(p, [pt], { max: 160, at: o => K.pos(o).add(V(0, 1, 0)) }) >= 0; if (!moved || near) water(); else K.tween(.3, t => can.position.lerp(canHome, t)); return; }
            if (K.nearest(p, [sn], { max: 110 }) >= 0) shine();
            else if (K.nearest(p, [pt], { max: 120, at: o => K.pos(o).add(V(0, 1, 0)) }) >= 0 && w === 'w') water();
          },
        });
        const offK = K.keys((key, dn) => { if (!dn) return false; if (key === 'w') { water(); return true; } if (key === 's') { shine(); return true; } return false; });
        winStep = () => { offK(); res(); };
        aid = () => (w === 'w' ? { kb: ['w'], ptr: { drag: [scr(can, .4), scr(pt, 1.2)] } } : { kb: ['s'], ptr: { tap: scr(sn) } });
      });
      offC(); K.haloOff(h); aid = null;
      gr.userData.set(k + 1); K.poke(pt.userData.j, .3); note(2 + k);
      if (k === 6) sfx('win');
      await say('c3.s' + (k + 1));
    }
    K.capOff(kw); K.capOff(ks);
    await say('c3.done');
    await G.next();
    K.level();
    await quiz3d({ q: 'c3.q', ok: 'c3.ok', opts: [{ text: 'c3.o1', make: () => { const g = new T.Group(); const r = K.cyl(.06, .01, 1.2, GD.mat('cream'), 0, .6, 0, 8); g.add(r); [-1, 1].forEach(s => { const b = K.cyl(.03, .01, .5, GD.mat('cream'), s * .2, .4, 0, 6); b.rotation.z = s * .7; g.add(b); }); return g; }, ok: true },
      { text: 'c3.o2', make: () => { const g = new T.Group(); const l = K.ball(.5, GD.mat('leaf'), 0, .5, 0, 12); l.scale.set(1.3, .25, .7); g.add(l); return g; } }, { text: 'c3.o3', make: () => GD.flower('petal', .6) }] });
  }

  // ========== 4 認識種子：按住種子，它的樹從種子長出來 ==========
  const IDS = ['oak', 'pine', 'maple', 'coconut', 'mango', 'apple'];
  async function ch4() {
    if (!K.mount()) return;
    K.level(); X = 54;
    const pt = PT();
    const seeds = IDS.map((id, i) => { const g = W(GD.SEED[id](1.6)); g.userData.id = id; if (pt) P(g, (i % 3 - 1) * 2.8, 0, 1.4 + Math.floor(i / 3) * 3.2); else P(g, (i - 2.5) * 2.4, 0, 3); return g; });
    const trees = IDS.map((id, i) => { const t = GD.tree(id, .01); t.position.copy(seeds[i].position).add(V(0, 0, -1)); K.lv.add(t); return t; });
    seeds.forEach((g, i) => K.cap(g, String(i + 1), 1.2));
    frame(pt ? [V(-3.8, 0, 5.6), V(3.8, 0, 5.6), V(-3.8, 3.2, -.6), V(3.8, 3.2, -.6)] : [V(-6.6, 0, 4.4), V(6.6, 0, 4.4), V(-6.6, 3.4, 1), V(6.6, 3.4, 1)], { elev: 22, elevPt: 30 });
    say('c4.intro');
    const grow = IDS.map(() => 0), seen = new Set();
    let holding = -1;
    const offC = coach('c4.intro', () => { const i = IDS.findIndex(id => !seen.has(id)); return i >= 0 ? K.hand(seeds[i], 'hold') : null; });
    await new Promise(res => {
      K.on(dt => {
        if (holding >= 0 && grow[holding] < 1) {
          grow[holding] = Math.min(1, grow[holding] + dt * (FAST ? 4 : .9));
          trees[holding].scale.setScalar(.01 + grow[holding] * .85); K.poke(seeds[holding].userData.j, .02);
          if (grow[holding] >= 1) {
            const id = IDS[holding]; seen.add(id); sfx('ok'); note(seen.size + 2); K.tag(seeds[holding], Z('seed.' + id), -.15);
            const p = say('info.' + id);
            if (seen.size === IDS.length) p.then(res);
            holding = -1;
          }
        }
      });
      K.inputs({ down(p) { const i = K.nearest(p, seeds, { max: 110, at: o => K.pos(o).add(V(0, .4, 0)) }); if (i >= 0 && grow[i] < 1) { holding = i; sfx('tap'); } }, up() { holding = -1; } });
      K.keys((k, dn) => { const i = '123456'.indexOf(k); if (i < 0) return false; if (dn) { if (grow[i] < 1) holding = i; } else if (holding === i) holding = -1; return true; });
      winStep = () => { IDS.forEach((id, i) => { grow[i] = 1; trees[i].scale.setScalar(.86); seen.add(id); }); res(); };
      aid = () => { const i = grow.findIndex(g => g < 1); return i >= 0 ? { kb: { hold: String(i + 1), ms: FAST ? 400 : 1300 }, ptr: { hold: scr(seeds[i], .4), ms: FAST ? 400 : 1300 } } : null; };
    });
    offC(); K.inputs({}); aid = null;
    await say('c4.done');
    await G.next();
  }

  // ========== 5 種子配對：點一棵對的樹 ==========
  async function ch5() {
    if (!K.mount()) return;
    K.level(); X = 72;
    frame([V(-4.6, 0, 4.4), V(4.6, 0, 4.4), V(-4.6, 3.6, -1.4), V(4.6, 3.6, -1.4)], { elev: 18, elevPt: 24 });
    await say('c5.intro');
    for (const id of shuffle(IDS).slice(0, 4)) {
      K.level();
      const sd = W(GD.SEED[id](1.6)); P(sd, 0, 0, 3.6); K.poke(sd.userData.j, .5);
      const others = shuffle(IDS.filter(x => x !== id)).slice(0, 2);
      const opts = shuffle([id, ...others]);
      const ts = opts.map((t, i) => { const g = W(GD.tree(t, .9), 120, 8); P(g, (i - 1) * 3, 0, -.6); K.tag(g, Z('tree.' + t), -.2); K.cap(g, 'ABC'[i], 3.2); return g; });
      sfx('pop');
      say('q5.' + id);
      const right = opts.indexOf(id);
      const offC = coach('q5.' + id, () => K.hand(ts[right], 'tap'));
      await tapOne(ts, 'abc', right, 1.6);
      offC(); clearHints(); K.inputs({}); aid = null;
      K.poke(ts[right].userData.j, .5); sfx('ok');
      const from = sd.position.clone(), to = ts[right].position.clone().add(V(0, 0, 1));
      await K.tween(.5, k => { sd.position.lerpVectors(from, to, K.ease(k)); sd.position.y = Math.sin(k * Math.PI) * 1.4; });
      await say('ok5.' + id);
    }
  }

  // ========== 6 種子去旅行：把種子丟給風、水或松鼠 ==========
  async function ch6() {
    if (!K.mount()) return;
    K.level(); X = 90;
    await say('c6.intro');
    const rounds = [{ n: 1, id: 'maple', who: 0 }, { n: 2, id: 'coconut', who: 1 }, { n: 3, id: 'oak', who: 2 }];
    const HELP = [['h.wind', () => GD.wind()], ['h.water', () => GD.stream()], ['h.animal', () => GD.squirrel()]];
    for (const r of rounds) {
      K.level();
      const hs = HELP.map(([lab, f], i) => { const g = W(f(), 120, 8); P(g, (i - 1) * 3.2, 0, -.6); K.tag(g, Z(lab), -.2); K.cap(g, 'ABC'[i], 2); return g; });
      const sd = W(GD.SEED[r.id](1.5)); P(sd, 0, 0, 3.8);
      frame([V(-4.8, 0, 4.8), V(4.8, 0, 4.8), V(-4.8, 2.6, -1.6), V(4.8, 2.6, -1.6)], { elev: 30, elevPt: 40 });
      say('c6.q' + r.n);
      const offC = coach('c6.q' + r.n, () => K.hand(sd, 'drag', hs[r.who]));
      await new Promise(res => {
        const judge = (j, viaDrop) => {
          if (j !== r.who) { missed(hs[j], hs[r.who]); if (wrong >= 3) { setTimeout(() => { D.land(0, hs[r.who].position.clone().add(V(0, .3, .8))).then(res); }, 300); } return null; }
          const to = hs[j].position.clone().add(V(0, .3, .8));
          if (!viaDrop) D.land(0, to).then(res); else setTimeout(res, 450);
          return to;
        };
        const D = K.drag([sd], { h: 0, lift: .7, drop: (_, p) => { const j = K.nearest(K.v.toScreen(p), hs, { max: 140 }); return j >= 0 ? judge(j, true) : null; } });
        K.inputs({ down: D.down, move: D.move, up(p) { if (D.sel() === 0) { const j = K.nearest(p, hs, { max: 130, at: o => K.pos(o).add(V(0, .8, 0)) }); if (j >= 0) { D.select(-1); judge(j, false); return; } } else { const j = K.nearest(p, hs, { max: 110, at: o => K.pos(o).add(V(0, .8, 0)) }); if (j >= 0 && K.nearest(p, [sd], { max: 70 }) < 0) { judge(j, false); return; } } D.up(p); } });
        const offK = K.keys((k, dn) => { const j = 'abc'.indexOf(k); if (dn && j >= 0) { judge(j, false); return true; } return false; });
        winStep = () => { offK(); res(); };
        aid = () => ({ kb: ['abc'[r.who]], ptr: { drag: [scr(sd, .3), scr(hs[r.who], .8)] } });
      });
      offC(); clearHints(); K.inputs({}); aid = null;
      sfx('ok');
      // 看它去哪裡：風把種子吹高飛遠、水讓椰子漂走、松鼠把橡實埋進土裡（冒出小芽）
      const from = sd.position.clone();
      if (r.who === 0) await K.tween(1.6, k => { sd.position.set(from.x + k * 6, from.y + Math.sin(k * Math.PI) * 3, from.z - k * 2); sd.rotation.y += .3; });
      else if (r.who === 1) await K.tween(1.6, k => { sd.position.set(from.x + k * 5, .1 + Math.sin(k * 12) * .08, from.z - k * 1.5); });
      else { await K.tween(.8, k => { sd.position.y = from.y - k * .6; }); const sp = GD.flower('leaf2', .5); P(sp, from.x - X, 0, from.z); K.poke(sp, .4); }
      await say('c6.ok' + r.n);
    }
    await say('c6.done');
    await G.next();
  }

  // ========== 7 種子的一生：照順序點，排成一圈 ==========
  async function ch7() {
    if (!K.mount()) return;
    K.level(); X = 108;
    await orderTap({ intro: 'c7.intro', done: 'c7.done', ring: true, items: [
      { make: () => GD.acorn(1.4), label: 'c7.l1', say: 'c7.n1' },
      { make: () => { const g = new T.Group(); g.add(GD.flower('leaf2', .5)); return g; }, label: 'c7.l2', say: 'c7.n2' },
      { make: () => GD.tree('oak', .55), label: 'c7.l3', say: 'c7.n3' },
      { make: () => { const t = GD.tree('oak', .55); [[.4, 1.4, .4], [-.3, 1.2, .5]].forEach(([x, y, z]) => t.add(GD.flower('petal', .01)).position.set(x, y, z)); return t; }, label: 'c7.l4', say: 'c7.n4' },
      { make: () => { const t = GD.tree('oak', .55); [[.4, 1.2, .5], [-.4, 1.4, .4]].forEach(([x, y, z]) => t.add(GD.acorn(.8)).position.set(x, y - .3, z)); return t; }, label: 'c7.l5', say: 'c7.n5' },
    ] });
    await G.next();
  }

  // ========== 8 最早的種子：把孢子、種子、花拖到時間軸上 ==========
  async function ch8() {
    if (!K.mount()) return;
    K.level(); X = 126;
    const ITEMS = [[() => GD.fern(), 'c8.l1', 'c8.n1'], [() => GD.pinecone(true), 'c8.l2', 'c8.n2'], [() => GD.flower(), 'c8.l3', 'c8.n3']];
    // 時間軸：一條木頭長條，左邊很久很久以前 → 右邊
    P(K.box(9, .14, .6, GD.mat('trunk')), 0, .07, -.8);
    const ar = new T.Mesh(new T.ConeGeometry(.35, .7, 10), GD.mat('trunk')); ar.rotation.z = -Math.PI / 2; P(ar, 4.8, .14, -.8);
    const slots = [-3, 0, 3].map(x => at(x, .14, -.8));
    slots.forEach(s => K.add(GD.slotDisc('cream'), s.x, .1, s.z));
    const ord = shuffle([0, 1, 2]);
    const gs = ord.map((k, j) => { const g = W(ITEMS[k][0]()); g.userData.k = k; P(g, (j - 1) * 3, 0, 3.2); K.tag(g, Z(ITEMS[k][1]), -.15); return g; });
    const caps = gs.map((g, j) => K.cap(g, String(j + 1), 1.8));
    frame([V(-5, 0, 4.4), V(5.2, 0, 4.4), V(-5, 1.8, -1.6), V(5.2, 1.8, -1.6)], { elev: 30, elevPt: 40 });
    say('c8.intro');
    let n = 0;
    const offC = coach('c8.intro', () => { const i = gs.findIndex(g => g.userData.k === n); return K.hand(gs[i], 'drag', slots[n]); });
    await new Promise(res => {
      const dm = gs.slice();
      const judge = (i, viaDrop) => {
        if (gs[i].userData.k !== n) { missed(gs[i], gs.find(g => g.userData.k === n)); return null; }
        clearHints(); dm[i] = null; K.capOff(caps[i]);
        const to = slots[n].clone(); sfx('ok'); const s = say(ITEMS[n][2]); n++;
        if (!viaDrop) D.land(i, to);
        if (n === 3) s.then(res);
        return to;
      };
      const D = K.drag(dm, { h: 0, lift: .7, drop: (i, p) => (Math.abs(p.z + .8) < 1.6 ? judge(i, true) : null) });
      K.inputs({ down: D.down, move: D.move, up(p) { const s = D.sel(); if (s >= 0 && K.nearest(p, slots, { max: 120 }) >= 0) { D.select(-1); judge(s, false); return; } D.up(p); } });
      K.keys((k, dn) => { const i = '123'.indexOf(k); if (dn && i >= 0 && dm[i]) { judge(i, false); return true; } return false; });
      winStep = () => { while (n < 3) judge(gs.findIndex(g => g.userData.k === n), false); };
      aid = () => { if (n >= 3) return null; const i = gs.findIndex(g => g.userData.k === n); return { kb: [String(i + 1)], ptr: { drag: [scr(gs[i], .4), scr(slots[n], .1)] } }; };
    });
    offC(); K.inputs({}); aid = null;
    await say('c8.done');
    const c = document.createElement('div'); c.className = 'k3-card';
    c.innerHTML = '<b>給家長：</b>化石證據顯示，種子植物約在 3.6 億年前（泥盆紀晚期）出現，最早的開花植物約在 1.3 億年前（白堊紀早期，確切時間仍有討論）。孢子通常是單一細胞，沒有儲存養分；種子裡有胚、養分和種皮。第一顆種子不是某一天突然出現，是很多代慢慢演變出來的。';
    K.ov.appendChild(c);
    await G.next();
    c.remove();
    K.level();
    await quiz3d({ q: 'c8.q', ok: 'c8.ok', opts: [{ text: 'c8.o1', make: () => GD.acorn(1.4), ok: true }, { text: 'c8.o2', make: () => GD.flower() }] });
  }

  // ---------- 結尾：小徑盡頭一排六棵樹，點了會晃 ----------
  async function finale() {
    if (!K.mount()) { stage.innerHTML = '<div class="chtitle">' + G.Zs('fin.title') + '</div>'; await say('fin.hi'); return; }
    K.level(); X = 144;
    const ts = IDS.map((id, i) => { const g = W(GD.tree(id, .8), 120, 8); P(g, (i - 2.5) * 2.2, 0, -.4); return g; });
    const sds = IDS.map((id, i) => { const g = W(GD.SEED[id](1.1)); P(g, (i - 2.5) * 2.2, 0, 2); return g; });
    frame([V(-6.6, 0, 3), V(6.6, 0, 3), V(-6.6, 3.4, -.4), V(6.6, 3.4, -.4)], { elev: 18, elevPt: 24 });
    K.inputs({ up(p) { const i = K.nearest(p, ts.concat(sds), { max: 100, at: o => K.pos(o).add(V(0, .8, 0)) }); if (i >= 0) { K.poke((ts.concat(sds))[i].userData.j, .5); note(i % 8 + 2); } } });
    ts.forEach((g, i) => setTimeout(() => K.poke(g.userData.j, .5), i * 120));
    const c = document.createElement('div'); c.className = 'k3-card'; c.innerHTML = '<div class="chtitle">' + G.Zs('fin.title') + '</div>'; K.ov.appendChild(c);
    sfx('win');
    await say('fin.hi'); await say('fin.task');
  }

  const wrapCh = f => async () => { aid = null; winStep = null; wrong = 0; hints = []; await f(); aid = null; winStep = null; };
  G.run({ saveKey: 'seed-game-v1', stamp: '種子', heroArt: A.acorn ? A.acorn() : '', chapters: [ch1, ch2, ch3, ch4, ch5, ch6, ch7, ch8].map(wrapCh), finale });
  window.__sd = { win: () => { if (winStep) winStep(); }, aid: () => { try { return aid ? aid() : null; } catch (e) { return null; } } };
})();
