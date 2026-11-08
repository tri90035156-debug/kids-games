// 《小水滴變變變》3D 版（2026-11-08 第 3 批）：一座黏土廚房流理台。十關，每關一種 3D 才有的動作，相鄰兩關不一樣：
// 1 按住讓太陽曬冰塊（冰塊真的融成一灘）  2 點放大鏡玻璃球（球裡小點點怎麼動）  3 按住讓瓶子變冷（冰冒出瓶口）＋把冰塊丟進水杯（浮起來）
// 4 把東西丟進兩個盆（有重量、落地木琴）  5 手指繞圈轉爐子旋鈕（火變大、水滾、冒煙）  6 沿著木軌拖溫度珠（球裡小點點變）
// 7 擦冰杯上的霧（擦掉的地方真的變清楚、水珠流下來）  8 照順序點冰棒（飛到托盤上）  9 3D 連連看（拉一條黏土線）  10 照亮光點 S U R 轉三圈水循環
// 配音稿完全沒改（tools/content.py 的 SAY 一句都沒動，不用重錄）。字幕＝引擎的泡泡（注音、點了重聽）。
// 鍵盤、手指、點目標三條路都通；15 秒沒動作：重講這一步＋小手示範；錯兩次：光暈指答案；錯三次：自己做一次。
// 測試：?ch=N&fast=1、?fin=1；console：__k.meshes()、__wg.win()（直接過這一步）。
(() => {
  'use strict';
  const A = window.A;
  const { $, stage, foot, sleep, shuffle, Z, speak, say, tip, next, holdLoop, FAST } = G;
  const K = K3, { T } = K;
  const sfx = (n, v) => G.sfx(n, v);
  const note = (i, v) => G.note && G.note(i, v);
  const kc = k => '<kbd class="kc">' + k + '</kbd>';

  if (!K.init({ bg: 0xF7F0E4 })) { /* WebGL 開不了：每關 mount() 會顯示一句話＋回首頁 */ }
  let kitchen = null;
  if (K.ok) kitchen = KIT.kitchen(K.scene);
  const sunInWin = () => kitchen.userData.sun;

  // ---------- 小幫手 ----------
  let winStep = null;                         // 測試用：__wg.win() 直接過這一步
  // 測試用：__wg.aid() 告訴試玩腳本「下一步」要按哪些鍵（kb）、手指要點／拖／按住哪裡（ptr，頁面座標）
  let aid = null;
  const scr = (o, dy = 0) => { const q = K.sp(K.pos(o).add(new T.Vector3(0, dy, 0))), r = K.v.el.getBoundingClientRect(); return { x: Math.round(r.left + q.x), y: Math.round(r.top + q.y) }; };
  // 15 秒沒動作：重講這一步＋小手示範
  function coach(goal, demo) {
    let last = performance.now(), off = null;
    const act = () => { last = performance.now(); if (off) { off(); off = null; } };
    addEventListener('pointerdown', act, true); addEventListener('keydown', act, true);
    const iv = setInterval(() => {
      if (performance.now() - last < 15000) return;
      last = performance.now();
      if (goal) say(goal);
      if (demo) { if (off) off(); off = demo(); setTimeout(() => { if (off) { off(); off = null; } }, 4000); }
    }, 1000);
    return () => { clearInterval(iv); removeEventListener('pointerdown', act, true); removeEventListener('keydown', act, true); if (off) off(); };
  }
  // 錯的時候：搖一下、低音、提示句；兩次光暈指答案；三次自己做
  let hints = [];
  function missed(obj, n, key, rightObj) {
    K.poke(obj.userData.j || obj, -.35); sfx('no');
    tip(n >= 2 ? 'g.no2' : key);
    if (n === 2 && rightObj) hints.push(K.halo(rightObj, 2.2));
  }
  const clearHints = () => { hints.forEach(K.haloOff); hints = []; };
  async function ritual(objs = []) {
    sfx('win');
    objs.forEach((o, i) => setTimeout(() => K.poke(o.userData.j || o, .4), i * 90));
    await K.wait(1.1);
  }
  const endCard = n => K.card('<b>' + Z('ui.parent') + '：</b>' + Z('p' + n));
  const W = (o, k = 150, d = 7) => K.wrap(o, k, d);          // 外層管位置、內層果凍
  const V = (x, y, z) => new T.Vector3(x, y, z);
  const smooth = (a, b, x) => { const t = K.clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };

  // ========== 第一關：融化（按住，讓太陽曬冰塊） ==========
  async function ch1() {
    if (!K.mount()) return;
    const L = K.level();
    K.add(KIT.plate(1.7), 0, 0, .6);
    const pud = K.add(KIT.puddle(1.3), 0, .14, .6); pud.scale.set(.1, 1, .1);
    const cube = W(KIT.iceCube(1.4)); K.add(cube, 0, .14 + .7, .6);
    const lens = K.add(KIT.lens(1.1), 3.4, 1.6, .4); const LS = lens.userData.lens; LS.snap({ solid: 1, energy: .1 });
    // 從窗戶照下來的一道暖光（按住時變亮）
    const beam = new T.Mesh(new T.CylinderGeometry(.9, 2.2, 6, 20, 1, true), new T.MeshBasicMaterial({ color: 0xFFD27A, transparent: true, opacity: 0, depthWrite: false, side: T.DoubleSide }));
    beam.userData.noShadow = true; L.add(beam);
    const from = V(-4.4, 5.1, -3.2), to = V(0, 1.2, .6); beam.position.lerpVectors(from, to, .5); beam.lookAt(to); beam.rotateX(Math.PI / 2);
    K.on((dt, t) => LS.step(dt, t));
    K.frameTo([V(-4.5, 5.5, -3.3), V(4.6, 0, 2), V(-2.5, 0, 2.4), V(4.6, 2.8, 0)], { elev: 22, elevPt: 26 });
    const hb = K.btn({ key: 'H', icon: A.sun(), label: 'c1.heat', cls: 'hot' });
    say('c1.goal');
    const offC = coach('c1.goal', () => K.hand(cube, 'hold'));
    let finger = false, p = 0, mid = false;
    K.inputs({ down(q) { if (K.nearest(q, [cube], { max: 110 }) >= 0) { finger = true; K.poke(cube.userData.j, .15); } }, up() { finger = false; } });
    winStep = () => { p = 1; };
    aid = () => ({ kb: { hold: 'h' }, ptr: { hold: scr(cube) } });
    let snd = 0;
    await holdLoop(hb, ['h', 'space'], (dt, down) => {
      const on = down || finger;
      hb.classList.toggle('on', on);
      if (on) { p = Math.min(1, p + dt * (FAST ? 3 : .17)); snd -= dt; if (snd <= 0) { snd = .7; note(Math.floor(p * 6)); } }
      beam.material.opacity = K.lerp(beam.material.opacity, on ? .32 : .05, .2);
      const s = 1 - p * .82;
      cube.scale.set(.25 + s * .75, s, .25 + s * .75); cube.position.y = .14 + .7 * s;
      pud.scale.set(.1 + p * 1.1, 1, .1 + p * 1.1);
      LS.set({ solid: 1 - smooth(.25, .7, p), energy: .1 + p * .45 });
      if (!mid && p > .45) { mid = true; say('c1.mid'); }
      return p >= 1;
    });
    offC(); K.clearBtns(); beam.material.opacity = 0; cube.visible = false;
    sfx('ok');
    await say('c1.done');
    await ritual([lens.children[0]]);
    await endCard(1);
  }

  // ========== 第二關：三種樣子（點放大鏡玻璃球） ==========
  async function ch2() {
    if (!K.mount()) return;
    K.level();
    const kinds = shuffle(['ice', 'water', 'steam']);
    const CFG = { ice: { solid: 1, energy: .1, gas: 0 }, water: { solid: 0, energy: .45, gas: 0 }, steam: { solid: 0, energy: .7, gas: 1 } };
    const lenses = kinds.map((k, i) => { const g = W(KIT.lens(1.05), 160, 7); K.add(g, (i - 1) * 3.2, 1.55, .6); const LS = g.userData.j.children[0].userData.lens; LS.snap(CFG[k]); g.userData.k = k; g.userData.LS = LS; return g; });
    K.on((dt, t) => lenses.forEach(g => g.userData.LS.step(dt, t)));
    // 題目：一個 3D 小東西浮在上面（冰塊／水滴／一朵水蒸氣小雲）
    const ASK = { ice: () => KIT.iceCube(.9), water: () => KIT.raindrop(), steam: () => KIT.cloud(.8) };
    let ask = null;
    K.frameTo([V(-5, 0, 2), V(5, 0, 2), V(0, 4.6, 0), V(-5, 3, 0), V(5, 3, 0)], { elev: 16, elevPt: 20 });
    const caps = lenses.map((g, i) => K.cap(g, 'ABC'[i], 1.4));
    const QS = [['c2.q1', 'ice', 'c2.ice'], ['c2.q2', 'water', 'c2.water'], ['c2.q3', 'steam', 'c2.steam']];
    for (const [q, k, msg] of QS) {
      if (ask) K.lv.remove(ask);
      ask = W(ASK[k]()); K.add(ask, 0, 3.2, -.4); K.poke(ask.userData.j, .5); sfx('pop');
      say(q);
      const right = lenses.findIndex(g => g.userData.k === k);
      let miss = 0;
      const offC = coach(q, () => K.hand(lenses[right], 'tap'));
      await new Promise(res => {
        const pick = i => {
          if (i < 0 || lenses[i].userData.done) return;
          if (i === right) { offK(); res(); return; }
          miss++; missed(lenses[i], miss, 'c2.wrong', lenses[right]);
          if (miss >= 3) { offK(); res(); }
        };
        K.inputs({ up(p) { if (!p.cancel) pick(K.nearest(p, lenses, { max: 110 })); } });
        const offK = K.keys((key, dn) => { const i = 'abc'.indexOf(key); if (dn && i >= 0) { pick(i); return true; } return false; });
        winStep = () => { offK(); res(); };
        aid = () => ({ kb: ['abc'[right]], ptr: { tap: scr(lenses[right]) } });
      });
      offC(); K.inputs({});
      clearHints();
      const g = lenses[right]; g.userData.done = true; K.poke(g.userData.j, .45); sfx('ok');
      await say(msg);
    }
    caps.forEach(K.capOff);
    const st = lenses.find(g => g.userData.k === 'steam').userData.LS;
    st.set({ ghost: 1 });
    await say('c2.see');
    await K.wait(.6);
    st.set({ ghost: 0 });
    await ritual(lenses);
    await endCard(2);
  }

  // ========== 第三關：凝固（按住變冷：冰冒出瓶口）＋ 把冰塊丟進水杯（浮起來） ==========
  async function ch3() {
    if (!K.mount()) return;
    const L = K.level();
    const bot = W(KIT.bottle(), 140, 8); K.add(bot, -2.4, 0, .4);
    const B = bot.userData.j.children[0];
    const ice = K.mesh(new T.CylinderGeometry(.24, .24, .6, 18), KIT.iceMat(), 0, 1.9, 0); ice.scale.y = .01; B.add(ice);
    const lens = K.add(KIT.lens(1.05), 1.4, 1.6, .2); const LS = lens.userData.lens; LS.snap({ solid: 0, energy: .45 });
    const frost = []; for (let i = 0; i < 7; i++) { const f = K.ball(.08, KIT.mat('white'), Math.cos(i) * .56, .3 + i * .22, Math.sin(i) * .56, 8); f.scale.setScalar(.01); B.add(f); frost.push(f); }
    K.on((dt, t) => LS.step(dt, t));
    K.frameTo([V(-4.2, 0, 2.2), V(3.2, 0, 2.2), V(-3.2, 3.4, 0), V(3, 3, 0)], { elev: 20, elevPt: 24 });
    const hb = K.btn({ key: 'C', icon: A.snowflake(), label: 'c3.cold', cls: 'cold' });
    say('c3.goal');
    let offC = coach('c3.goal', () => K.hand(bot, 'hold'));
    let finger = false, p = 0, mid = false, snd = 0;
    K.inputs({ down(q) { if (K.nearest(q, [bot], { max: 120, at: o => K.pos(o).add(V(0, 1, 0)) }) >= 0) { finger = true; K.poke(bot.userData.j, .15); } }, up() { finger = false; } });
    winStep = () => { p = 1; };
    aid = () => ({ kb: { hold: 'c' }, ptr: { hold: scr(bot, 1) } });
    const waterM = B.userData.water.material.clone(); B.userData.water.material = waterM;
    const iceC = new T.Color(0xD8EEF7), wC = waterM.color.clone();
    await holdLoop(hb, ['c', 'space'], (dt, down) => {
      const on = down || finger; hb.classList.toggle('on', on);
      if (on) { p = Math.min(1, p + dt * (FAST ? 3 : .17)); snd -= dt; if (snd <= 0) { snd = .7; note(8 - Math.floor(p * 6)); } }
      waterM.color.copy(wC).lerp(iceC, smooth(.3, .9, p)); waterM.opacity = .78 + p * .15;
      frost.forEach((f, i) => f.scale.setScalar(smooth(i / 9, i / 9 + .3, p)));
      LS.set({ solid: smooth(.3, .75, p), energy: .45 - p * .35 });
      if (!mid && p > .45) { mid = true; say('c3.mid'); }
      return p >= 1;
    });
    offC(); K.clearBtns();
    sfx('ok');
    await say('c3.done');
    // 冰變大：冒出瓶口一點點
    await K.tween(.8, k => { ice.scale.y = Math.max(.01, K.outBack(k)); ice.position.y = 1.9 + .3 * k; });
    K.poke(bot.userData.j, .3); sfx('pop');
    await say('c3.big');
    // 把冰塊丟進水杯
    const cup = W(KIT.cup(1.5, .85), 150, 7); K.add(cup, 3.6, 0, .8);
    const cw = K.mesh(new T.CylinderGeometry(.8, .7, 1.05, 24), KIT.waterMat(), 0, .55, 0); cw.castShadow = false; cup.userData.j.children[0].add(cw);
    const cube = W(KIT.iceCube(.8)); K.add(cube, -.2, .4, 1.8);
    K.poke(cube.userData.j, .4); sfx('bump');
    K.frameTo([V(-4.2, 0, 2.4), V(5, 0, 2.4), V(-3.2, 3.4, 0), V(5, 2.6, 0)], { elev: 22, elevPt: 26 });
    const fc = K.cap(cube, 'F', .9);
    say('c3.drop');
    offC = coach('c3.drop', () => K.hand(cube, 'drag', cup));
    const top = V(3.6, 1.05 - .8 * .4, .8);                // 冰塊大約九成在水面下
    await new Promise(res => {
      const D = K.drag([cube], {
        h: 0, lift: .6,
        drop: (i, p) => p.distanceTo(V(3.6, 0, .8)) < 1.8 ? (res(), top.clone()) : null,
      });
      K.inputs({ down: D.down, move: D.move, up(p) { if (D.sel() === 0 && K.nearest(p, [cup], { max: 120, at: o => K.pos(o).add(V(0, .8, 0)) }) >= 0) { D.select(-1); D.release(0, V(3.6, 0, .8)); return; } D.up(p); } });
      const goCup = () => { D.release(0, V(3.6, 0, .8)); };
      const offK = K.keys((k, dn) => { if (dn && (k === 'f' || k === 'space')) { offK(); goCup(); return true; } return false; });
      winStep = goCup;
      aid = () => ({ kb: ['f'], ptr: { drag: [scr(cube), scr(cup, .6)] } });
    });
    offC(); K.capOff(fc); K.inputs({});
    await K.wait(.5);
    sfx('pour'); K.poke(cup.userData.j, .3);
    let tt = 0; K.on(dt => { tt += dt; cube.position.y = top.y + Math.sin(tt * 2.2) * .05 * Math.exp(-tt * .6); });
    await say('c3.float');
    await ritual([cup]);
    await endCard(3);
  }

  // ========== 第四關：硬硬的、會流動的（把東西丟進兩個盆） ==========
  async function ch4() {
    if (!K.mount()) return;
    K.level();
    const ITEMS = [['ice', () => KIT.iceCube(.85), 0], ['pop', () => KIT.popsicle(0), 0], ['snow', () => KIT.snowBall(), 0], ['rain', () => KIT.raindrop(), 1], ['soup', () => KIT.soupBowl(), 1], ['milk', () => KIT.milkGlass(), 1]];
    const order = shuffle(ITEMS.map((_, i) => i));
    const PT = K.portrait();               // 手機直的：排兩排，東西大一點
    const items = order.map((k, j) => { const g = W(ITEMS[k][1]()); g.userData.k = k; if (PT) K.add(g, (j % 3 - 1) * 2.6, 0, 1.1 + Math.floor(j / 3) * 1.8); else K.add(g, (j - 2.5) * 1.9, 0, 2.2); g.scale.setScalar(PT ? 1.15 : .95); return g; });
    const basin = (x, col) => { const g = W(new T.Group(), 120, 8); const j = g.userData.j; j.add(K.cyl(2.1, 1.7, .7, K.clay(col), 0, .35, 0, 32)); j.add(K.cyl(1.85, 1.85, .05, K.clay(0xFFFBF4), 0, .68, 0, 32)); K.add(g, x, 0, -.9); return g; };
    const bs = [basin(-2.8, 0xCFE6F2), basin(2.8, 0x5CC3E8)];
    if (PT) bs.forEach(b => { b.position.z = -1.4; });
    K.tag(bs[0], Z('c4.solid'), 1.3); K.tag(bs[1], Z('c4.liquid'), 1.3);
    const bc = [K.cap(bs[0], 'J', 1.9), K.cap(bs[1], 'L', 1.9)];
    const ic = items.map((g, j) => K.cap(g, 'ABCDEF'[j], 1.7));
    K.frameTo(PT ? [V(-4.8, 0, 3.6), V(4.8, 0, 3.6), V(-4.8, 0, -2.4), V(4.8, 0, -2.4), V(0, 1.6, -1)] : [V(-6, 0, 3), V(6, 0, 3), V(-5, 0, -2.6), V(5, 0, -2.6), V(0, 2.5, -1)], { elev: 44, elevPt: 52 });
    say('c4.goal');
    let offC = coach('c4.goal', () => { const i = items.findIndex(g => !g.userData.done); return i >= 0 ? K.hand(items[i], 'drag', bs[ITEMS[items[i].userData.k][2]]) : null; });
    const filled = [0, 0], miss = items.map(() => 0);
    let left = items.length;
    await new Promise(res => {
      const slot = b => { const n = filled[b]++; return V(bs[b].position.x + (n - 1) * .9, .75, bs[b].position.z + (n % 2 ? .4 : -.3)); };
      const dragItems = items.slice();
      const D = K.drag(dragItems, {
        h: 0, lift: .6,
        drop: (i, p) => {
          const d = bs.map(b => p.distanceTo(b.position)), b = d[0] < d[1] ? 0 : 1;
          if (d[b] > 2.6) return null;
          return judge(i, b, true);
        },
      });
      // 放進 b 號盆：對了回傳落點，錯了彈回去
      function judge(i, b, viaDrop) {
        const g = items[i], want = ITEMS[g.userData.k][2];
        if (b !== want) { miss[i]++; missed(g, miss[i], 'c4.wrong', bs[want]); if (miss[i] >= 3) setTimeout(() => put(i, want, false), 400); return null; }
        return put(i, b, viaDrop);
      }
      function put(i, b, viaDrop) {
        const g = items[i]; if (g.userData.done) return null;
        g.userData.done = true; dragItems[i] = null; K.capOff(ic[i]); ic[i] = null; clearHints();
        const to = slot(b);
        K.poke(bs[b].userData.j, .3); sfx('ok');
        speak('it.' + ITEMS[g.userData.k][0]);
        if (!viaDrop) D.land(i, to);
        if (--left === 0) setTimeout(res, FAST ? 10 : 900);
        return to;
      }
      K.inputs({ down: D.down, move: D.move, up(p) { const s = D.sel(); if (s >= 0) { const b = K.nearest(p, bs, { max: 140 }); if (b >= 0) { D.select(-1); judge(s, b, false); return; } } D.up(p); } });
      let picked = -1;
      K.keys((k, dn) => {
        if (!dn) return false;
        const i = 'abcdef'.indexOf(k);
        if (i >= 0 && items[i] && !items[i].userData.done) { picked = i; D.select(i); return true; }
        const b = 'jl'.indexOf(k);
        if (b >= 0 && picked >= 0) { const i2 = picked; picked = -1; D.select(-1); judge(i2, b, false); return true; }
        return false;
      });
      winStep = () => items.forEach((g, i) => { if (!g.userData.done) put(i, ITEMS[g.userData.k][2], false); });
      aid = () => { const i = items.findIndex(g => !g.userData.done); if (i < 0) return null; const w = ITEMS[items[i].userData.k][2]; return { kb: ['abcdef'[i], 'jl'[w]], ptr: { drag: [scr(items[i], .4), scr(bs[w], .6)] } }; };
    });
    offC(); bc.forEach(K.capOff); K.inputs({});
    await K.wait(.4);
    await say('c4.done');
    await ritual(bs);
    await endCard(4);
  }

  // ========== 第五關：水滾了（手指繞圈轉爐子旋鈕） ==========
  async function ch5() {
    if (!K.mount()) return;
    K.level();
    const sv = K.add(KIT.stove(), 0, 0, .4);
    const knob = sv.userData.knob, flame = sv.userData.flame;
    const pt = W(KIT.pot(), 120, 9); K.add(pt, 0, .38, .3);
    const water = pt.userData.j.children[0].userData.water;
    const bub = K.dots(24, .09, KIT.mat('white')); K.lv.add(bub);
    const stm = K.dots(30, .2, new T.MeshStandardMaterial({ color: 0xffffff, transparent: true, opacity: .75, roughness: 1 })); K.lv.add(stm);
    K.frameTo([V(-3, 0, 2.6), V(3, 0, 2.6), V(0, 5.2, 0), V(-2, 3, -1)], { elev: 30, elevPt: 34 });
    const kcap = K.cap(knob, 'K', .7);
    say('c5.goal');
    const offC = coach('c5.goal', () => K.hand(knob, 'circle'));
    let lv = 0, rot = 0, mid = false, boil = false, lastA = null, tt = 0;
    const add = d => { lv = Math.min(1, lv + d); };
    K.on(dt => {
      tt += dt;
      knob.rotation.y = -rot * Math.PI / 180;
      flame.scale.set(1, .15 + lv * 1.6 + Math.sin(tt * 30) * .06 * lv, 1); flame.visible = lv > .02;
      // 泡泡：越熱越多越大
      const B = bub.userData.P, rate = lv < .3 ? 0 : lv < 1 ? (lv - .3) * 14 : 24;
      B.forEach(q => { if (q.life <= 0 && Math.random() < rate * dt / 10) { q.life = 1; q.p.set((Math.random() - .5) * 1.4, .45, .3 + (Math.random() - .5) * 1.2); q.s = lv >= 1 ? 1.8 : .7; } if (q.life > 0) { q.p.y += dt * (.6 + lv); q.life -= dt * 1.5; if (q.p.y > 1.38) q.life = 0; } });
      bub.userData.sync();
      water.position.y = .95 + (lv >= 1 ? Math.sin(tt * 18) * .02 : 0);
      // 白煙（很小的水珠）
      const S = stm.userData.P, sr = boil ? 18 : lv > .6 ? 4 : 0;
      S.forEach(q => { if (q.life <= 0 && Math.random() < sr * dt / 10) { q.life = 1; q.p.set((Math.random() - .5) * 1.2, 1.5, .3 + (Math.random() - .5) * .8); q.v.set((Math.random() - .5) * .3, 1 + Math.random() * .5, 0); } if (q.life > 0) { q.p.addScaledVector(q.v, dt); q.life -= dt * .45; q.s = .6 + (1 - q.life) * 1.6; } });
      stm.userData.sync();
    });
    const turn = d => { rot += d; add(Math.abs(d) / 1080); K.poke(pt.userData.j, .02); };
    winStep = () => { lv = 1; };
    aid = () => ({ kb: ['k'], ptr: { circle: scr(knob) } });
    K.inputs({
      down(p) { const c = K.sp(knob); lastA = Math.atan2(p.y - c.y, p.x - c.x); },
      move(p) { if (lastA === null) return; const c = K.sp(knob); const a = Math.atan2(p.y - c.y, p.x - c.x); let d = a - lastA; if (d > Math.PI) d -= 2 * Math.PI; if (d < -Math.PI) d += 2 * Math.PI; lastA = a; if (Math.hypot(p.x - c.x, p.y - c.y) > 14) turn(Math.abs(d) * 180 / Math.PI); },
      up() { lastA = null; },
    });
    const offK = K.keys((k, dn) => { if (dn && (k === 'k' || k === 'space')) { turn(180); note(Math.floor(lv * 8)); return true; } return false; });
    let snd = 0;
    await new Promise(res => { const iv = setInterval(() => { snd++; if (snd % 8 === 0 && lv > 0 && lv < 1) note(Math.floor(lv * 8)); if (!mid && lv >= .5) { mid = true; say('c5.mid'); } if (lv >= 1) { clearInterval(iv); res(); } }, 60); });
    offK(); offC(); K.capOff(kcap); K.inputs({});
    boil = true; sfx('ok'); sfx('steam');
    await say('c5.boil');
    await say('c5.smoke');
    await say('c5.done');
    await ritual([pt]);
    await endCard(5);
  }

  // ========== 第六關：冷一點，熱一點（沿著木軌拖溫度珠） ==========
  async function ch6() {
    if (!K.mount()) return;
    K.level();
    const X0 = -5.5, X1 = 5.5, TMIN = -20, TMAX = 120, Z0 = 1.8;
    const tx = T_ => X0 + (T_ - TMIN) / (TMAX - TMIN) * (X1 - X0), tOf = x => Math.round(TMIN + (x - X0) / (X1 - X0) * (TMAX - TMIN));
    const rail = K.add(K.box(X1 - X0 + .6, .2, .5, KIT.mat('woodDark')), 0, .1, Z0);
    // 冷到熱：藍→紅的一條黏土色帶
    for (let i = 0; i < 7; i++) { const c = new T.Color(0x7FB8E0).lerp(new T.Color(0xF05A3C), i / 6); K.add(K.box((X1 - X0) / 7, .06, .52, K.clay(c.getHex())), X0 + (i + .5) * (X1 - X0) / 7, .22, Z0); }
    const bead = W(K.ball(.42, K.clay(0xF2A33A), 0, 0, 0)); K.add(bead, tx(20), .62, Z0);
    const f0 = W(KIT.flag(0x3C9BE0)); K.add(f0, tx(0), .2, Z0 - .5);
    const f100 = W(KIT.flag(0xF05A3C)); K.add(f100, tx(100), .2, Z0 - .5);
    const lens = K.add(KIT.lens(1.5), 0, 2.4, -1); const LS = lens.userData.lens;
    const num = K.tag(bead, '20°C', .9);
    let T_ = 20, drag = false;
    const show = () => {
      bead.position.x = tx(T_); num.el.textContent = T_ + '°C';
      LS.set(T_ < 0 ? { solid: 1, energy: .05 + (T_ + 20) / 200, gas: 0 } : T_ < 100 ? { solid: 0, energy: .2 + T_ / 250, gas: 0 } : { solid: 0, energy: .8, gas: 1 });
    };
    show();
    K.on((dt, t) => LS.step(dt, t));
    K.frameTo([V(X0 - .5, 0, Z0 + .6), V(X1 + .5, 0, Z0 + .6), V(0, 4.1, -1), V(-2, 1, -1)], { elev: 22, elevPt: 26 });
    const bc = K.cap(bead, '←→', 1.5);
    for (const [goal, aim, ok, flag] of [['c6.goal0', 0, 'c6.ok0', f0], ['c6.goal100', 100, 'c6.ok100', f100]]) {
      say(goal);
      const h = K.halo(flag, 1.4);
      const offC = coach(goal, () => K.hand(bead, 'drag', flag));
      let tries = 0;
      await new Promise(res => {
        const check = () => {
          if (Math.abs(T_ - aim) <= 6) { T_ = aim; show(); res(); return; }
          if (Math.abs(T_ - aim) <= 14) { tip('c6.near'); return; }
          tries++; K.poke(flag.userData.j, .3); sfx('no'); tip('c6.wrong');
          if (tries >= 3) { T_ = aim; show(); res(); }
        };
        K.inputs({
          down(p) { if (K.nearest(p, [bead], { max: 90 }) >= 0) { drag = true; K.poke(bead.userData.j, .2); sfx('tap'); } else { const g = K.ground(p, .6); if (g && Math.abs(g.z - Z0) < 1.5) { drag = true; T_ = K.clamp(tOf(g.x), TMIN, TMAX); show(); } } },
          move(p) { if (!drag) return; const g = K.ground(p, .6); if (g) { const n = K.clamp(tOf(g.x), TMIN, TMAX); if (Math.floor(n / 10) !== Math.floor(T_ / 10)) note(K.clamp(Math.floor((n + 20) / 15), 0, 10), .08); T_ = n; show(); } },
          up() { if (!drag) return; drag = false; K.poke(bead.userData.j, .35); sfx('bump'); check(); },
        });
        let kt = 0;
        const offK = K.keys((k, dn) => {
          if (!dn) { if (['a', 'd', 'left', 'right'].includes(k)) { clearTimeout(kt); kt = setTimeout(check, 700); } return false; }
          if (k === 'a' || k === 'left') { T_ = Math.max(TMIN, T_ - 5); show(); note(K.clamp(Math.floor((T_ + 20) / 15), 0, 10), .08); return true; }
          if (k === 'd' || k === 'right') { T_ = Math.min(TMAX, T_ + 5); show(); note(K.clamp(Math.floor((T_ + 20) / 15), 0, 10), .08); return true; }
          if (k === 'enter' || k === 'space') { check(); return true; }
          return false;
        });
        winStep = () => { T_ = aim; show(); res(); };
        aid = () => ({ kb: [T_ < aim ? 'd' : T_ > aim ? 'a' : 'enter'], ptr: { drag: [scr(bead), scr(V(tx(aim), .6, Z0))] } });
        const r0 = res; res = () => { clearTimeout(kt); offK(); r0(); };     // eslint-disable-line no-param-reassign
      });
      offC(); K.haloOff(h); K.inputs({});
      K.poke(flag.userData.j, .45); sfx('ok');
      await say(ok);
    }
    K.capOff(bc);
    await say('c6.done');
    await ritual([f0, f100]);
    await endCard(6);
  }

  // ========== 第七關：杯子出汗了（擦冰杯上的霧） ==========
  async function ch7() {
    if (!K.mount()) return;
    K.level();
    const g = W(new T.Group(), 140, 8); K.add(g, 0, 0, .6);
    const J = g.userData.j;
    const R = 1.25, H = 3;
    const cupM = new T.Mesh(new T.CylinderGeometry(R, R * .88, H, 32, 1, true), KIT.iceMat()); cupM.position.y = H / 2; J.add(cupM);
    J.add(K.cyl(R * .86, R * .86, .08, KIT.mat('ice'), 0, .04, 0, 32));
    const drink = K.mesh(new T.CylinderGeometry(R * .94, R * .84, H * .75, 32), KIT.mat('amber', { roughness: .5 }), 0, H * .38, 0); J.add(drink);
    [[-.4, .2], [.35, -.1], [0, .4]].forEach(([x, z], i) => { const c = KIT.iceCube(.55); c.position.set(x, H * .75 + .05, z); c.rotation.y = i; J.add(c); });
    // 霧：一層白白的貼圖，擦到的地方真的被擦掉
    const cv = document.createElement('canvas'); cv.width = 256; cv.height = 128;
    const cx = cv.getContext('2d'); cx.fillStyle = 'rgba(255,255,255,.88)'; cx.fillRect(0, 0, 256, 128);
    for (let i = 0; i < 90; i++) { cx.fillStyle = 'rgba(235,245,250,.9)'; cx.beginPath(); cx.arc(Math.random() * 256, Math.random() * 128, 1 + Math.random() * 2.5, 0, 7); cx.fill(); }
    const tex = new T.CanvasTexture(cv);
    const fog = new T.Mesh(new T.CylinderGeometry(R * 1.02, R * .9, H * .96, 32, 1, true), new T.MeshStandardMaterial({ map: tex, transparent: true, roughness: 1, depthWrite: false }));
    fog.position.y = H / 2; fog.userData.noShadow = true; J.add(fog);
    const drops = K.dots(14, .1, KIT.waterMat()); J.add(drops);
    K.frameTo([V(-2.4, 0, 2), V(2.4, 0, 2), V(-1.8, H + .8, 0), V(1.8, H + .8, 0)], { elev: 12, elevPt: 14 });
    say('c7.goal');
    const offC = coach('c7.goal', () => K.hand(g, 'wipe'));
    // 前半圈（朝鏡頭）：u 在 0.75～1、0～0.25
    const front = u => (u > .75 ? u - 1 : u);
    const progress = () => { const d = cx.getImageData(0, 0, 256, 128).data; let n = 0, c = 0; for (let y = 8; y < 120; y += 8) for (let x = 0; x < 256; x += 8) { const u = x / 256; if (Math.abs(front(u)) > .2) continue; n++; if (d[(y * 256 + x) * 4 + 3] < 60) c++; } return c / n; };
    const rub = (u, v, r = 16) => { cx.save(); cx.globalCompositeOperation = 'destination-out'; [-256, 0, 256].forEach(dx => { cx.beginPath(); cx.arc(u * 256 + dx, (1 - v) * 128, r, 0, 7); cx.fill(); }); cx.restore(); tex.needsUpdate = true; };
    let said = 0, prog = 0, lastSnd = 0;
    const D = drops.userData.P;
    K.on(dt => { D.forEach(q => { if (q.life > 0) { q.p.y -= dt * (.4 + (1 - q.life) * 1.2); q.life -= dt * .4; if (q.p.y < .2) q.life = 0; } }); drops.userData.sync(); });
    const spawnDrop = (u) => { const q = D.find(x => x.life <= 0); if (!q) return; const a = u * Math.PI * 2; q.life = 1; q.s = 1.3; q.p.set(Math.sin(a) * R * 1.05, H * .8, Math.cos(a) * R * 1.05); };
    await new Promise(res => {
      const after = () => {
        const now = performance.now(); if (now - lastSnd > 110) { lastSnd = now; sfx('scrub'); }
        prog = progress();
        if (!said && prog > .05) { said = 1; say('c7.mid'); spawnDrop(0); }
        else if (said === 1 && prog > .3) { said = 2; say('c7.why'); }
        if (Math.random() < .3) spawnDrop(Math.random() * .4 - .2);
        if (prog > .55) res();
      };
      const at = p => { const r = new T.Raycaster(); r.setFromCamera(new T.Vector2(p.x / K.v.w * 2 - 1, -(p.y / K.v.h) * 2 + 1), K.cam); const hit = r.intersectObject(fog)[0]; return hit && hit.uv; };
      let down = false;
      K.inputs({ down(p) { down = true; const uv = at(p); if (uv) { rub(uv.x, uv.y); after(); } }, move(p) { if (!down) return; const uv = at(p); if (uv) { rub(uv.x, uv.y); after(); } }, up() { down = false; } });
      const COL = { a: -.15, s: -.05, d: .05, f: .15 };
      const offK = K.keys((k, dn) => { if (!dn || !(k in COL)) return false; const u = (COL[k] + 1) % 1; for (let v = .08; v < .96; v += .06) rub(u, v, 14); K.poke(J, .08); after(); return true; });
      winStep = () => { cx.clearRect(0, 0, 256, 128); tex.needsUpdate = true; after(); };
      aid = () => ({ kb: ['a', 's', 'd', 'f'], ptr: { wipe: scr(g, 1.6) } });
      const r0 = res; res = () => { offK(); r0(); };     // eslint-disable-line no-param-reassign
    });
    offC(); K.inputs({});
    for (let i = 0; i < 6; i++) spawnDrop(Math.random() * .4 - .2);
    sfx('ok');
    await say('c7.done');
    await ritual([g]);
    await endCard(7);
  }

  // ========== 第八關：冰棒慢慢變軟（照順序點，飛到托盤上） ==========
  async function ch8() {
    if (!K.mount()) return;
    K.level();
    const tray = K.add(K.box(9.6, .16, 2, KIT.mat('cream')), 0, .08, -.8);
    const slots = [0, 1, 2, 3].map(i => V((i - 1.5) * 2.4, .16, -.8));
    slots.forEach((s, i) => { const d = K.add(K.cyl(.5, .5, .04, K.clay(0xE8DCC8), 0, 0, 0, 20), s.x, .18, s.z); void d; void i; });
    const sun = K.add(KIT.sunBall(.6), -5.6, 3.4, -1.6);
    let order; do { order = shuffle([0, 1, 2, 3]); } while (order.every((v, i) => v === i));
    const pops = order.map((s, j) => { const g = W(KIT.popsicle(s)); g.userData.s = s; K.add(g, (j - 1.5) * 2.4, 0, 2); return g; });
    const caps = pops.map((g, j) => K.cap(g, 'ABCD'[j], 2.3));
    K.frameTo([V(-6, 0, 3), V(6, 0, 3), V(-6, 3.8, -1.6), V(5.5, 0, -2)], { elev: 34, elevPt: 44 });
    say('c8.goal');
    for (let k = 0; k < 4; k++) {
      const right = pops.findIndex(g => g && g.userData.s === k);
      const h = K.halo(slots[k], 1.3);
      let miss = 0;
      const offC = coach('c8.goal', () => K.hand(pops[right], 'tap'));
      await new Promise(res => {
        const pick = i => {
          if (i < 0 || !pops[i]) return;
          if (i === right) { offK(); res(); return; }
          miss++; missed(pops[i], miss, 'c8.wrong', pops[right]);
          if (miss >= 3) { offK(); res(); }
        };
        K.inputs({ up(p) { if (!p.cancel) pick(K.nearest(p, pops, { max: 110, at: o => K.pos(o).add(V(0, 1, 0)) })); } });
        const offK = K.keys((key, dn) => { const i = 'abcd'.indexOf(key); if (dn && i >= 0) { pick(i); return true; } return false; });
        winStep = () => { offK(); res(); };
        aid = () => ({ kb: ['abcd'[right]], ptr: { tap: scr(pops[right], 1) } });
      });
      offC(); K.haloOff(h); clearHints(); K.inputs({});
      const g = pops[right]; pops[right] = null; K.capOff(caps[right]);
      const from = g.position.clone();
      await K.tween(.5, t => { g.position.lerpVectors(from, slots[k], K.ease(t)); g.position.y = .16 + Math.sin(t * Math.PI) * 1.4; });
      K.poke(g.userData.j, .4); sfx('bump'); note(7 - k * 2);
    }
    K.poke(sun.children[0], .3);
    sfx('ok');
    await say('c8.done');
    await ritual([tray]);
    await endCard(8);
  }

  // ========== 第九關：生活裡的變身（3D 連連看） ==========
  async function ch9() {
    if (!K.mount()) return;
    K.level();
    const SITS = [['c9.s1', () => KIT.clothes(), 0, 'c9.r1'], ['c9.s2', () => { const c = KIT.cup(1.1, .45); c.add(KIT.droplets()).position.set(0, -.2, .5); return c; }, 1, 'c9.r2'], ['c9.s3', () => KIT.mirror(), 1, 'c9.r3'],
      ['c9.s4', () => KIT.soupBowl(true), 1, 'c9.r4'], ['c9.s5', () => KIT.freezer(), 2, 'c9.r5']];
    const ANS = [['c9.evap', () => KIT.evap()], ['c9.cond', () => KIT.droplets()], ['c9.frz', () => KIT.snowflake()]];
    const PT = K.portrait();
    const left = SITS.map((s, i) => { const g = W(s[1]()); g.userData.j.children[0].scale.setScalar(PT ? .9 : .8); if (PT) K.add(g, i < 3 ? (i - 1) * 3 : (i - 3.5) * 3, 0, i < 3 ? .8 : 2.6); else K.add(g, (i - 2) * 2.5, 0, 2.2); return g; });
    const right = ANS.map((a, j) => { const g = W(a[1]()); K.add(g, (j - 1) * (PT ? 3 : 3.6), 0, PT ? -2.2 : -1.6); return g; });
    right.forEach((g, j) => K.tag(g, Z(ANS[j][0]), 2));
    K.frameTo(PT ? [V(-4.4, 0, 3.4), V(4.4, 0, 3.4), V(-4, 2.4, -2.2), V(4, 2.4, -2.2)] : [V(-6.2, 0, 3.2), V(6.2, 0, 3.2), V(-4.8, 2.4, -1.6), V(4.8, 2.4, -1.6)], { elev: 40, elevPt: 50 });
    say('c9.goal');
    const offC = coach('c9.goal', () => { const i = (K.match.cur || { done: [] }).done.findIndex(d => !d); return i >= 0 ? K.hand(left[i], 'drag', right[SITS[i][2]]) : null; });
    const miss = left.map(() => 0);
    aid = () => { const m = K.match.cur; const i = m ? m.done.findIndex(d => !d) : -1; if (i < 0) return null; const t = SITS[i][2]; return { kb: ['abcde'[i], 'jkl'[t]], ptr: { drag: [scr(left[i], .8), scr(right[t], .8)] } }; };
    winStep = () => { const m = K.match.cur; if (m) m.done.forEach((d, i) => { if (!d) m.link(i, SITS[i][2]); }); };
    await K.match({
      left, right, truth: SITS.map(s => s[2]), lk: 'abcde', rk: 'jkl', h: 0,
      at: o => K.pos(o).add(V(0, .8, 0)),
      onRight: async i => { sfx('ok'); speak(SITS[i][0]); await K.wait(.2); say(SITS[i][3]); },
      onWrong: async i => { miss[i]++; sfx('no'); tip(miss[i] >= 2 ? 'g.no2' : 'c9.wrong'); },
    });
    offC(); K.inputs({});
    while (G.voicePos() !== null) await sleep(150);
    await say('c9.done');
    await ritual(right);
    await endCard(9);
  }

  // ========== 第十關：水轉一圈（照亮光點 S U R，轉三圈） ==========
  async function ch10() {
    if (!K.mount()) return;
    K.level();
    const sea = K.add(K.box(6.4, .3, 4, K.clay(0x5CC3E8, { roughness: .5 })), 1.6, .15, .4);
    const land = K.add(K.box(3.4, .9, 4, K.clay(0x8FB38A)), -3.3, .45, .4);
    const mt = K.add(new T.Mesh(new T.ConeGeometry(1.2, 1.8, 16), K.clay(0x6F9A72)), -3.4, 1.8, .2); mt.castShadow = true;
    const sun = W(KIT.sunBall(.75)); K.add(sun, -3.6, 5.2, -1.2);
    const cl = W(KIT.cloud(1.2)); K.add(cl, 1.6, 4.6, -.2);
    const spotU = K.add(new T.Group(), 1.6, .4, .8);
    const vap = K.dots(24, .12, new T.MeshStandardMaterial({ color: 0xffffff, transparent: true, opacity: .8 })); K.lv.add(vap);
    const rain = K.dots(30, .1, KIT.waterMat()); K.lv.add(rain);
    K.frameTo([V(-5.2, 0, 2.6), V(5, 0, 2.6), V(-4.4, 6, -1.2), V(3.4, 5.6, -.2)], { elev: 14, elevPt: 18 });
    const spots = [sun, spotU, cl], keys = ['s', 'u', 'r'];
    const caps = spots.map((o, i) => K.cap(o, 'SUR'[i], i === 1 ? .5 : 1.3));
    let seaHot = 0, clS = 1;
    K.on(dt => {
      seaHot = Math.max(0, seaHot - dt * .5);
      sea.material.color.setHex(0x5CC3E8).lerp(new T.Color(0xF2C27A), seaHot * .5);
      cl.scale.setScalar(K.lerp(cl.scale.x, clS, .05));
      vap.userData.P.forEach(q => { if (q.life > 0) { q.p.y += dt * 1.6; q.p.x += (cl.position.x - q.p.x) * dt * .3; q.life -= dt * .3; if (q.p.y > 4.2) q.life = 0; } }); vap.userData.sync();
      rain.userData.P.forEach(q => { if (q.life > 0) { q.p.y -= dt * 4.5; if (q.p.y < .35) q.life = 0; } }); rain.userData.sync();
    });
    const ACT = [
      () => { K.poke(sun.userData.j, .45); seaHot = 1; },
      () => { vap.userData.P.forEach((q, i) => { q.life = 1; q.s = .8; q.p.set(.2 + Math.random() * 3, .35 - i * .12, -.6 + Math.random() * 2); }); clS = 1.35; },
      () => { clS = 1; K.poke(cl.userData.j, .3); rain.userData.P.forEach((q, i) => { q.life = 1; q.s = 1; q.p.set(.4 + Math.random() * 2.6, 4.2 + i * .15, -.6 + Math.random() * 1.2); }); sfx('pour'); },
    ];
    const EXPL = ['c10.s', 'c10.u', 'c10.r'];
    say('c10.goal');
    await sleep(FAST ? 30 : 900);
    for (let r = 0; r < 3; r++) {
      if (r === 1) say('c10.again');
      if (r === 2) say('c10.last');
      for (let s = 0; s < 3; s++) {
        const h = K.halo(spots[s], s === 1 ? 3 : 2.4);
        let miss = 0;
        const offC = coach('c10.goal', () => K.hand(spots[s], 'tap'));
        await new Promise(res => {
          const pick = i => {
            if (i < 0) return;
            if (i === s) { offK(); res(); return; }
            miss++; K.poke(spots[i].userData.j || spots[i], -.3); sfx('no');
            if (miss >= 3) { offK(); res(); }
          };
          K.inputs({ up(p) { if (!p.cancel) pick(K.nearest(p, spots, { max: 120 })); } });
          const offK = K.keys((key, dn) => { const i = keys.indexOf(key); if (dn && i >= 0) { pick(i); return true; } return false; });
          winStep = () => { offK(); res(); };
          aid = () => ({ kb: ['sur'[s]], ptr: { tap: scr(spots[s]) } });
        });
        offC(); K.haloOff(h); K.inputs({});
        note(3 + r * 2 + s, .17);
        ACT[s]();
        if (r === 0) await say(EXPL[s]); else await sleep(FAST ? 30 : 750);
      }
    }
    caps.forEach(K.capOff);
    sfx('ok');
    await sleep(FAST ? 30 : 400);
    await say('c10.done');
    await ritual([sun, cl]);
    await endCard(10);
  }

  // ---------- 結尾：流理台上排一排十關的小東西，點了會跳 ----------
  async function finale() {
    if (!K.mount()) { stage.innerHTML = '<div class="chtitle">' + G.Zs('fin.title') + '</div>'; await say('fin.hi'); return; }
    K.level();
    const mk = [() => KIT.iceCube(.8), () => KIT.raindrop(), () => KIT.cloud(.6), () => KIT.popsicle(0), () => KIT.snowBall(), () => KIT.soupBowl(true), () => KIT.milkGlass()];
    const row = mk.map((f, i) => { const g = W(f()); K.add(g, (i - 3) * 1.6, 0, 1); return g; });
    K.frameTo([V(-5.6, 0, 2), V(5.6, 0, 2), V(0, 2.4, 0)], { elev: 22, elevPt: 26 });
    K.inputs({ up(p) { const i = K.nearest(p, row, { max: 90 }); if (i >= 0) { K.poke(row[i].userData.j, .5); note(3 + i); } } });
    row.forEach((g, i) => setTimeout(() => K.poke(g.userData.j, .5), i * 120));
    const c = document.createElement('div'); c.className = 'k3-card'; c.innerHTML = '<div class="chtitle wg-fint">' + G.Zs('fin.title') + '</div><b>' + Z('ui.parent') + '：</b>' + Z('fin.parent');
    K.ov.appendChild(c);
    sfx('win');
    await speak('fin.title');
    await say('fin.hi');
    await say('fin.task');
  }

  // 每關開始、做完都把測試用的 aid 清掉（等下一步出現才給）
  const wrapCh = f => async () => { aid = null; winStep = null; await f(); aid = null; winStep = null; };
  G.run({ saveKey: 'water-game-v1', stamp: '水', heroArt: A.hero(), chapters: [ch1, ch2, ch3, ch4, ch5, ch6, ch7, ch8, ch9, ch10].map(wrapCh), finale });
  window.__wg = { win: () => { if (winStep) winStep(); }, aid: () => { try { return aid ? aid() : null; } catch (e) { return null; } } };
})();
