// 《玩偶怎麼來？》3D 版（2026-11-08 第 4 批）：一條黏土旅程路——原料區 → 工廠輸送帶 → 港口 → 商店與家，小熊在路上走。
// 接上共用引擎（engine.js：封面、標題卡、?ch=N、重來鈕、字幕泡泡＋配音），3D 用 kit3d.js。十關，每關一種 3D 動作，相鄰兩關不一樣：
// 1 把原料拖到它的來源（棉花田／綿羊／抽油機）  2 照順序點機器，石油一站一站變成絨布  3 3D 連連看（小熊的部位 → 材料）
// 4 選一個（桌上三樣東西）  5 把六個工站拖上輸送帶排好  6 按住塞棉花（小熊真的鼓起來）  7 選一個（斷針／秤／名牌），小熊走過金屬探測門
// 8 把紙箱拖到下一站（箱子→貨櫃→卡車→船→海關→商店）  9 3D 連連看（誰 → 做什麼）  10 照順序點，小熊沿著路走完整趟旅行
// 原本的句子一句沒改（只多錄十關標題）；字幕＝引擎的泡泡（注音、點了重聽）。測試：?ch=N&fast=1、?fin=1、__tf.win()、__tf.aid()。
(() => {
  'use strict';
  const { $, stage, sleep, shuffle, Z, speak, say, FAST } = G;
  const K = K3, { T } = K;
  const sfx = n => G.sfx(n);
  K.init({ bg: 0xF3EEDF, ground: 0xCFDDB0 });
  if (K.ok) JY.ground(K.scene);

  // ---------- 小幫手（和小水滴同一套） ----------
  let winStep = null, aid = null;
  const scr = (o, dy = 0) => { const q = K.sp(K.pos(o).add(new T.Vector3(0, dy, 0))), r = K.v.el.getBoundingClientRect(); return { x: Math.round(r.left + q.x), y: Math.round(r.top + q.y) }; };
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
  let hints = [], wrong = 0;
  function missed(obj, rightObj, key) {
    K.poke(obj.userData.j || obj, -.35); sfx('no'); wrong++;
    say(key || (wrong >= 2 ? 'g.no2' : 'g.no1'));
    if (wrong === 2 && rightObj) hints.push(K.halo(rightObj, 2.4));
  }
  const clearHints = () => { hints.forEach(K.haloOff); hints = []; wrong = 0; };
  async function ritual(objs = []) { sfx('win'); objs.forEach((o, i) => setTimeout(() => K.poke(o.userData.j || o, .4), i * 90)); await K.wait(1); }
  const W = (o, k = 150, d = 7) => K.wrap(o, k, d);
  const V = (x, y, z) => new T.Vector3(x, y, z);
  // 小熊走到某個地方（一跳一跳）
  async function walk(b, to, dur = .9) {
    const from = b.position.clone();
    const a = Math.atan2(to.x - from.x, to.z - from.z); b.rotation.y = a;
    await K.tween(dur, k => { b.position.lerpVectors(from, to, K.ease(k)); b.position.y = from.y + Math.abs(Math.sin(k * Math.PI * 4)) * .25; });
    b.rotation.y = 0; b.position.y = to.y;
  }
  // 點一個東西（或按它的鍵）：right 是對的那一個；回傳點到的索引（錯的自己處理提示）
  function tapOne(objs, keys, right, { dy = .8, wrongSay = null, onWrong = null } = {}) {
    return new Promise(res => {
      const pick = i => {
        if (i < 0 || !objs[i]) return;
        if (i === right) { offK(); res(i); return; }
        if (onWrong) onWrong(i);
        missed(objs[i], objs[right], typeof wrongSay === 'function' ? wrongSay(i) : wrongSay);
        if (wrong >= 3) { offK(); res(right); }
      };
      K.inputs({ up(p) { if (!p.cancel) pick(K.nearest(p, objs, { max: 110, at: o => K.pos(o).add(V(0, dy, 0)) })); } });
      const offK = K.keys((k, dn) => { const i = keys.indexOf(k); if (dn && i >= 0) { pick(i); return true; } return false; });
      winStep = () => { offK(); res(right); };
      aid = () => ({ kb: [keys[right]], ptr: { tap: scr(objs[right], dy) } });
    });
  }
  const NUM = '123456';

  // ========== 1 原料從哪裡來：把原料拖到它的來源 ==========
  async function ch1() {
    if (!K.mount()) return;
    K.level();
    await say('ch1');
    const SRC = { 'c.field': () => JY.field(), 'c.sheep': () => JY.sheep(), 'c.oil': () => JY.oilPump() };
    const MAT = { 'c.cotton': () => JY.cottonBall(), 'c.wool': () => JY.woolTuft(), 'c.poly': () => JY.spool() };
    const pairs = [['c.cotton', 'c.field', 'l1.cotton'], ['c.wool', 'c.sheep', 'l1.wool'], ['c.poly', 'c.oil', 'l1.oil']];
    const srcOrder = shuffle([0, 1, 2]);
    const srcs = srcOrder.map((p, j) => { const g = W(SRC[pairs[p][1]](), 120, 8); g.userData.p = p; K.add(g, (j - 1) * 3.6, 0, -.6); return g; });
    const mats = pairs.map((p, i) => { const g = W(MAT[p[0]]()); g.userData.p = i; g.userData.j.children[0].scale.setScalar(1.5); K.add(g, (i - 1) * 2.6, 0, 3.6); return g; });
    const pump = srcs.find(g => g.userData.p === 2).userData.j.children[0];
    let tt = 0; K.on(dt => { tt += dt; pump.userData.beam.rotation.z = Math.sin(tt * 2) * .25; });
    const mc = mats.map((g, i) => K.cap(g, 'ABC'[i], 1.2)); srcs.forEach((g, j) => K.cap(g, NUM[j], 2.2));
    K.frameTo([V(-5.4, 0, 4.8), V(5.4, 0, 4.8), V(-5.4, 2, -1.6), V(5.4, 2, -1.6)], { elev: 36, elevPt: 44 });
    say('l1.q', 'g.match');
    const offC = coach('g.match', () => { const i = mats.findIndex(g => !g.userData.done); return i >= 0 ? K.hand(mats[i], 'drag', srcs.find(s => s.userData.p === i)) : null; });
    let left = 3;
    await new Promise(res => {
      const dm = mats.slice();
      const put = async (i, sj, viaDrop) => {
        const g = mats[i], s = srcs[sj];
        if (s.userData.p !== i) { missed(s, srcs.find(x => x.userData.p === i)); return null; }
        clearHints(); g.userData.done = true; dm[i] = null; K.capOff(mc[i]);
        const to = s.position.clone().add(V(1.2, 0, 1.1));
        K.poke(s.userData.j, .35); sfx('ok'); say(pairs[i][2]);
        if (!viaDrop) D.land(i, to);
        if (--left === 0) setTimeout(res, 300);
        return to;
      };
      const D = K.drag(dm, {
        h: 0, lift: .6,
        onPick: i => { if (i >= 0) say(pairs[i][0]); },
        drop: (i, p) => { const sj = K.nearest(K.v.toScreen(p), srcs, { max: 130 }); return sj >= 0 ? put(i, sj, true) : null; },
      });
      K.inputs({ down: D.down, move: D.move, up(p) { const s = D.sel(); if (s >= 0) { const sj = K.nearest(p, srcs, { max: 120, at: o => K.pos(o).add(V(0, 1, 0)) }); if (sj >= 0) { D.select(-1); put(s, sj, false); return; } } D.up(p); } });
      let picked = -1;
      K.keys((k, dn) => {
        if (!dn) return false;
        const i = 'abc'.indexOf(k); if (i >= 0 && !mats[i].userData.done) { picked = i; D.select(i); return true; }
        const j = NUM.indexOf(k); if (j >= 0 && j < 3 && picked >= 0) { const i2 = picked; picked = -1; D.select(-1); put(i2, j, false); return true; }
        return false;
      });
      winStep = () => mats.forEach((g, i) => { if (!g.userData.done) put(i, srcs.findIndex(s => s.userData.p === i), false); });
      aid = () => { const i = mats.findIndex(g => !g.userData.done); if (i < 0) return null; const sj = srcs.findIndex(s => s.userData.p === i); return { kb: ['abc'[i], NUM[sj]], ptr: { drag: [scr(mats[i], .3), scr(srcs[sj], .8)] } }; };
    });
    offC(); K.inputs({});
    await G.sleep(FAST ? 20 : 300); while (G.voicePos() !== null) await sleep(150);
    await say('l1.done');
    await ritual(srcs);
  }

  // ========== 2 石油變絨布：照順序點機器，東西一站一站變 ==========
  async function ch2() {
    if (!K.mount()) return;
    K.level();
    const STEPS = [['c.pump', 'l2.s1', 'pump'], ['c.pellet', 'l2.s2', 'pellet'], ['c.fiber', 'l2.s3', 'fiber'], ['c.weave', 'l2.s4', 'loom'], ['c.dye', 'l2.s5', 'dye']];
    K.add(JY.belt(14), 0, 0, 1.6);
    const order = shuffle([0, 1, 2, 3, 4]);
    const ms = order.map((s, j) => { const g = W(JY.machine(STEPS[s][2]), 140, 8); g.userData.s = s; K.add(g, (j - 2) * 2.8, 0, -.4); return g; });
    ms.forEach((g, j) => K.cap(g, NUM[j], 2));
    // 傳送的東西：黑油 → 顆粒 → 細絲 → 絨布 → 粉紅絨布
    const LOOK = [() => JY.oilDrop(), () => JY.pellets(), () => JY.spool('white'), () => JY.cloth('cream'), () => JY.cloth('pink')];
    let token = null;
    K.frameTo([V(-6.4, 0, 3), V(6.4, 0, 3), V(-6.4, 2.2, -1.2), V(6.4, 2.2, -1.2)], { elev: 30, elevPt: 38 });
    say('l2.q', 'g.order');
    for (let n = 0; n < 5; n++) {
      const right = ms.findIndex(g => g.userData.s === n);
      const offC = coach('g.order', () => K.hand(ms[right], 'tap'));
      await tapOne(ms, NUM, right, { dy: 1.2, wrongSay: i => STEPS[ms[i].userData.s][0] });
      offC(); clearHints(); K.inputs({});
      const g = ms[right]; K.poke(g.userData.j, .5); sfx('ok');
      const to = V(g.position.x, .62, 1.6);
      if (token) K.lv.remove(token);
      token = W(LOOK[n]()); token.userData.j.children[0].scale.setScalar(1.2); K.add(token, to.x, 2.4, to.z);
      K.tween(.4, k => { token.position.y = K.lerp(2.4, .62, K.ease(k)); }).then(() => { K.poke(token.userData.j, .4); sfx('bump'); });
      await say(STEPS[n][1]);
    }
    await say('l2.done');
    await ritual(ms);
  }

  // ========== 3 小熊是什麼做的：3D 連連看（部位 → 材料） ==========
  async function ch3() {
    if (!K.mount()) return;
    K.level();
    const pairs = [['c.furOf', 'c.fur', 'l3.fur'], ['c.fillOf', 'c.fill', 'l3.fill'], ['c.eyeOf', 'c.eye', 'l3.eye'], ['c.threadOf', 'c.thread', 'l3.thread']];
    const PART = [() => { const g = new T.Group(); g.add(K.box(.9, .7, .12, JY.mat('fur'), 0, .4, 0)); return g; }, () => { const g = new T.Group(); [[0, .4, 0, .3], [.25, .3, .1, .22], [-.25, .32, 0, .22]].forEach(([x, y, z, r]) => g.add(K.ball(r, JY.mat('cream'), x, y, z, 12))); return g; },
      () => { const g = new T.Group(); g.add(K.ball(.4, JY.mat('fur'), 0, .45, 0, 16)); g.add(K.ball(.1, JY.mat('dark'), .15, .55, .33, 10)); return g; }, () => { const g = new T.Group(); g.add(K.box(.9, .5, .1, JY.mat('fur'), 0, .3, 0)); for (let i = 0; i < 5; i++) g.add(K.box(.05, .2, .12, JY.mat('red'), -.32 + i * .16, .3, 0)); return g; }];
    const MAT = [() => JY.cloth('fur'), () => JY.cottonBall(), () => { const g = new T.Group(); g.add(K.ball(.22, JY.mat('dark'), 0, .45, 0, 14)); g.add(K.cyl(.05, .05, .35, JY.mat('white'), 0, .2, 0, 8)); g.add(K.cyl(.18, .18, .05, JY.mat('white'), 0, .05, 0, 12)); return g; }, () => JY.spool('red')];
    const PT = K.portrait();
    const big = W(JY.bear(1.3)); K.add(big, PT ? 0 : -6.2, 0, PT ? -3.2 : 0);
    const left = pairs.map((p, i) => { const g = W(PART[i]()); g.userData.j.children[0].scale.setScalar(1.4); K.add(g, (i - 1.5) * 2.4, 0, 3.2); return g; });
    const ord = shuffle([0, 1, 2, 3]);
    const right = ord.map((p, j) => { const g = W(MAT[p]()); g.userData.j.children[0].scale.setScalar(1.4); K.add(g, (j - 1.5) * 2.4, 0, -.6); g.userData.p = p; return g; });
    K.frameTo([V(-4.6, 0, 4.4), V(4.6, 0, 4.4), V(-4.6, 1.4, -1.6), V(4.6, 1.4, -1.6), V(PT ? 0 : -6.8, 2.8, PT ? -3.2 : 0)], { elev: 38, elevPt: 46 });
    say('l3.q', 'g.match');
    const offC = coach('g.match', () => { const m = K.match.cur; const i = m ? m.done.findIndex(d => !d) : -1; return i >= 0 ? K.hand(left[i], 'drag', right[ord.indexOf(i)]) : null; });
    winStep = () => { const m = K.match.cur; if (m) m.done.forEach((d, i) => { if (!d) m.link(i, ord.indexOf(i)); }); };
    aid = () => { const m = K.match.cur; const i = m ? m.done.findIndex(d => !d) : -1; if (i < 0) return null; const j = ord.indexOf(i); return { kb: ['abcd'[i], NUM[j]], ptr: { drag: [scr(left[i], .5), scr(right[j], .5)] } }; };
    await K.match({
      left, right, truth: pairs.map((_, i) => ord.indexOf(i)), lk: 'abcd', rk: '1234', at: o => K.pos(o).add(V(0, .6, 0)),
      onRight: async i => { clearHints(); sfx('ok'); K.poke(big.userData.j, .3); say(pairs[i][2]); },
      onWrong: async (i, j) => { missed(right[j], right[ord.indexOf(i)]); },
    });
    offC(); K.inputs({});
    while (G.voicePos() !== null) await sleep(150);
    await say('l3.done');
    await ritual([big]);
  }

  // ========== 4 先做什麼：選一個（設計圖／棉花袋／一盒眼睛） ==========
  async function ch4() {
    if (!K.mount()) return;
    K.level();
    await say('ch2');
    K.add(JY.factory(), 0, 0, -4.2);
    K.add(K.box(8.6, .3, 2.6, JY.mat('furDark'), 0, .95, 1), 0, 0, 0);
    [-3.9, 3.9].forEach(x => K.add(K.box(.3, .95, 2.2, JY.mat('furDark')), x, .48, 1));
    const opts = [() => JY.design(), () => JY.cottonBag(), () => JY.eyesBox()].map((f, i) => { const g = W(f()); g.userData.j.children[0].scale.setScalar(1.5); K.add(g, (i - 1) * 2.7, 1.1, 1); return g; });
    opts.forEach((g, i) => K.cap(g, 'ABC'[i], 1.5));
    const tags = ['l4.a', 'l4.b', 'l4.c'];
    K.frameTo([V(-4.6, 1, 2.8), V(4.6, 1, 2.8), V(0, 3.2, -4.2), V(-4, 2.6, -.4), V(4, 2.6, -.4)], { elev: 22, elevPt: 26 });
    say('l4.q', 'g.pick');
    // 點一下：先唸那一個選項（第一次），再點一次＝選它
    const offC = coach('l4.q', () => K.hand(opts[0], 'tap'));
    await tapOne(opts, 'abc', 0, { dy: .8, wrongSay: () => 'l4.no', onWrong: i => K.poke(opts[i].userData.j, -.3) });
    offC(); clearHints(); K.inputs({});
    K.poke(opts[0].userData.j, .5); sfx('ok');
    await say(tags[0]);
    await say('l4.yes');
    await ritual(opts);
  }

  // ========== 5 工廠的每一步：把六個工站拖上輸送帶排好 ==========
  async function ch5() {
    if (!K.mount()) return;
    K.level();
    const STEPS = [['c.cut', 'l5.s1', 'cut'], ['c.eyes', 'l5.s2', 'eyes'], ['c.sew', 'l5.s3', 'sew'], ['c.flip', 'l5.s4', 'flip'], ['c.stuff', 'l5.s5', 'stuff'], ['c.close', 'l5.s6', 'close']];
    const PT = K.portrait();
    const bx = K.add(JY.belt(PT ? 9 : 13), 0, 0, -1);
    const sp = PT ? 1.5 : 2.1, slots = [0, 1, 2, 3, 4, 5].map(i => V((i - 2.5) * sp, .56, -1));
    slots.forEach((s, i) => K.add(JY.number(i + 1), s.x, .56, -1 + .95));
    const ord = shuffle([0, 1, 2, 3, 4, 5]);
    const items = ord.map((s, j) => { const g = W(JY.station(STEPS[s][2])); g.userData.s = s; if (PT) K.add(g, (j % 3 - 1) * 2.6, 0, 1.8 + Math.floor(j / 3) * 1.8); else K.add(g, (j - 2.5) * 2.1, 0, 2.6); return g; });
    const ic = items.map((g, j) => K.cap(g, NUM[j], 1.4));
    void bx;
    K.frameTo(PT ? [V(-4.2, 0, 4.4), V(4.2, 0, 4.4), V(-4.2, 1, -1.8), V(4.2, 1, -1.8)] : [V(-6.2, 0, 3.6), V(6.2, 0, 3.6), V(-6.2, 1, -1.8), V(6.2, 1, -1.8)], { elev: 40, elevPt: 48 });
    say('l5.q', 'g.order');
    let n = 0;
    const offC = coach('g.order', () => { const i = items.findIndex(g => g && g.userData.s === n); return i >= 0 ? K.hand(items[i], 'drag', slots[n]) : null; });
    await new Promise(res => {
      const dm = items.slice();
      const judge = (i, viaDrop) => {
        const g = items[i];
        if (g.userData.s !== n) { say(STEPS[g.userData.s][0]); missed(g, items.find(x => x.userData.s === n)); return null; }
        clearHints(); dm[i] = null; K.capOff(ic[i]);
        const to = slots[n].clone(); sfx('ok'); say(STEPS[n][1]); n++;
        if (!viaDrop) D.land(i, to);
        if (n === 6) setTimeout(res, 200);
        return to;
      };
      const D = K.drag(dm, { h: 0, lift: .6, drop: (i, p) => (Math.abs(p.z + 1) < 1.6 && Math.abs(p.x) < sp * 3.4 ? judge(i, true) : null) });
      K.inputs({ down: D.down, move: D.move, up(p) { const s = D.sel(); if (s >= 0 && K.nearest(p, slots, { max: 120 }) >= 0) { D.select(-1); judge(s, false); return; } D.up(p); } });
      K.keys((k, dn) => { const i = NUM.indexOf(k); if (dn && i >= 0 && dm[i]) { judge(i, false); return true; } return false; });
      winStep = () => { while (n < 6) { const i = items.findIndex(g => g.userData.s === n); judge(i, false); } };
      aid = () => { const i = items.findIndex(g => g.userData.s === n); if (i < 0 || n >= 6) return null; return { kb: [NUM[i]], ptr: { drag: [scr(items[i], .3), scr(slots[n], .2)] } }; };
    });
    offC(); K.inputs({});
    while (G.voicePos() !== null) await sleep(150);
    await say('l5.done');
    await ritual(items);
  }

  // ========== 6 塞棉花：按住，小熊真的鼓起來；剛剛好才放手 ==========
  async function ch6() {
    if (!K.mount()) return;
    K.level();
    const mch = K.add(JY.station('stuff'), -1.6, 0, .4); mch.scale.setScalar(2);
    const b = W(JY.bear(1.4), 120, 7); K.add(b, 1.4, 0, .4);
    const puff = b.userData.j.children[0].userData.puff;
    // 量表：一根直立的透明管，綠色那一段是剛剛好
    const gauge = new T.Group(); K.add(gauge, 3.8, 0, .4);
    gauge.add(K.cyl(.32, .32, 3, K.glass(0xFFFFFF, .3), 0, 1.6, 0, 16));
    const band = K.cyl(.36, .36, .6, K.clay(0x8FB38A), 0, .1 + 3 * .62 + .3, 0, 16); band.scale.y = 1; gauge.add(band);
    band.position.y = .1 + 3 * .62; band.scale.y = (3 * .2) / .6; band.position.y = .1 + 3 * .72;
    const fill = K.cyl(.26, .26, 1, K.clay(0xF4A7B0), 0, .1, 0, 16); gauge.add(fill);
    const puffs = K.dots(16, .14, JY.mat('cotton')); K.lv.add(puffs);
    K.frameTo([V(-3.6, 0, 2), V(4.6, 0, 2), V(-2, 3.6, 0), V(4.4, 3.6, 0)], { elev: 18, elevPt: 22 });
    const hb = K.btn({ key: '␣', label: 'ui.hold', cls: 'hot' });
    say('l6.q');
    const offC = coach('l6.q', () => K.hand(hb.isConnected ? b : b, 'hold'));
    let v = 0, down = false, over = false, done = false, finger = false, blow = 0;
    const paint = () => { puff(.65 + v * .65); fill.scale.y = Math.max(.01, v * 3); fill.position.y = .1 + v * 1.5; };
    K.on(dt => {
      const P = puffs.userData.P;
      P.forEach(q => { if (q.life > 0) { q.p.x += dt * 2.4; q.p.y += Math.sin(q.life * 9) * dt * .3; q.life -= dt * 1.3; } });
      if (down && Math.random() < .5) { const q = P.find(x => x.life <= 0); if (q) { q.life = 1; q.s = 1; q.p.set(-.4, 1, .4); } }
      puffs.userData.sync();
    });
    paint();
    await new Promise(res => {
      const press = () => { if (done || over || down) return; down = true; hb.classList.add('on'); };
      const release = () => {
        if (!down) return; down = false; hb.classList.remove('on');
        if (v >= .62 && v <= .82) { done = true; res(); return; }
        if (v > .82) { over = true; sfx('no'); say('l6.over'); } else say('l6.more');
      };
      const iv = setInterval(() => {
        const dt = .03;
        if (down) { v = Math.min(1, v + dt * (FAST ? 1.2 : .36)); blow -= dt; if (blow <= 0) { blow = .25; sfx('bump'); } K.poke(b.userData.j, .02); }
        else if (over) { v = Math.max(0, v - dt * 1.2); if (v === 0) { over = false; say('l6.q'); } }
        paint();
        if (done) clearInterval(iv);
      }, 30);
      hb.addEventListener('pointerdown', e => { e.preventDefault(); press(); });
      addEventListener('pointerup', release); addEventListener('pointercancel', release);
      K.inputs({ down(p) { if (K.nearest(p, [b, mch], { max: 140, at: o => K.pos(o).add(V(0, 1, 0)) }) >= 0) { finger = true; press(); } }, up() { if (finger) { finger = false; release(); } } });
      K.keys((k, dn, rep) => { if (k !== 'space' && k !== 'enter') return false; if (dn && !rep) press(); else if (!dn) release(); return true; });
      winStep = () => { v = .72; down = true; release(); };
      // 試玩：按住大約到綠色那一段再放手
      aid = () => { const ms = Math.round(((.72 - v) / (FAST ? 1.2 : .36)) * 1000); return ms > 0 && !over ? { kb: { hold: 'space', ms }, ptr: { hold: scr(b, 1), ms } } : null; };
    });
    offC(); K.clearBtns(); K.inputs({});
    K.poke(b.userData.j, .5); sfx('ok');
    await say('l6.ok');
    await ritual([b]);
  }

  // ========== 7 金屬探測器：小熊走過探測門；選一個（斷針／秤／名牌） ==========
  async function ch7() {
    if (!K.mount()) return;
    K.level();
    K.add(JY.belt(10), 0, 0, -1.4);
    const det = K.add(JY.detector(), 0, .5, -1.4);
    const b = W(JY.bear(.8)); K.add(b, -4, .56, -1.4);
    const opts = [() => JY.needle(), () => JY.scale(), () => JY.nameTag()].map((f, i) => { const g = W(f()); g.userData.j.children[0].scale.setScalar(1.6); K.add(g, (i - 1) * 2.8, 0, 2.6); return g; });
    opts.forEach((g, i) => K.cap(g, 'ABC'[i], 1.4));
    K.frameTo([V(-5, 0, 3.8), V(5, 0, 3.8), V(-5, 3.2, -1.8), V(5, 3.2, -1.8)], { elev: 30, elevPt: 36 });
    walk(b, V(0, .56, -1.4), 1.6).then(() => { det.userData.light.material.color.setHex(0xF05A3C); sfx('beep'); K.poke(b.userData.j, .3); });
    say('l7.q', 'g.pick');
    const offC = coach('l7.q', () => K.hand(opts[0], 'tap'));
    await tapOne(opts, 'abc', 0, { dy: .6, wrongSay: () => 'l7.no' });
    offC(); clearHints(); K.inputs({});
    K.poke(opts[0].userData.j, .5); sfx('ok');
    await say('l7.yes');
    det.userData.light.material.color.setHex(0x8fdc8f);
    walk(b, V(4, .56, -1.4), 1.4);
    await say('l7.done');
    await ritual([b]);
  }

  // ========== 8 小熊坐什麼來：把紙箱拖到下一站 ==========
  async function ch8() {
    if (!K.mount()) return;
    K.level();
    await say('ch3');
    const STOPS = [['c.box', 'l8.s1', () => { const g = new T.Group(); g.add(K.box(1.6, .7, 1.2, JY.mat('furDark'), 0, .35, 0)); return g; }], ['c.container', 'l8.s2', () => JY.container('container2')], ['c.truck', 'l8.s3', () => JY.truck()],
      ['c.ship', 'l8.s4', () => { const g = JY.ship(); g.scale.setScalar(.6); return g; }], ['c.customs', 'l8.s5', () => JY.booth()], ['c.shop', 'l8.s6', () => JY.shop()]];
    const PT = K.portrait();
    const sea = K.add(JY.seaPatch(PT ? 9 : 16, 3.4), 0, .02, -3.6); void sea;
    // 六站散在港口（不是照順序排），孩子要自己找下一站
    const POS = PT ? [[-2.6, 3.2], [2.6, 3.4], [0, 1.2], [-2.8, -.9], [2.8, -1], [0, -3.4]] : [[-6, 2.6], [-2, 3.2], [2.2, 2.4], [6, 3], [-4, -.6], [4.2, -.4]];
    const ord = shuffle([0, 1, 2, 3, 4, 5]);
    const stops = ord.map((s, j) => { const g = W(STOPS[s][2](), 120, 8); g.userData.s = s; const [x, z] = POS[j]; K.add(g, x, 0, z + (STOPS[s][0] === 'c.ship' ? 0 : 0)); return g; });
    stops.forEach((g, j) => K.cap(g, NUM[j], 1.9));
    const box = W(JY.cbox(1)); const bb = JY.miniBear(.3); bb.position.y = .7; box.userData.j.add(bb);
    K.add(box, PT ? 0 : -6, 0, PT ? 5 : 4.6);
    const path = new T.Group(); K.lv.add(path);
    K.frameTo(PT ? [V(-4, 0, 5.6), V(4, 0, 5.6), V(-4, 1.4, -4.4), V(4, 1.4, -4.4)] : [V(-7.4, 0, 5.4), V(7.4, 0, 5.4), V(-7.4, 1.6, -1.6), V(7.4, 1.6, -1.6)], { elev: 44, elevPt: 54 });
    say('l8.q', 'g.order');
    let n = 0, last = box.position.clone();
    const offC = coach('g.order', () => { const j = stops.findIndex(g => g.userData.s === n); return K.hand(box, 'drag', stops[j]); });
    await new Promise(res => {
      const go = async (j, viaDrop) => {
        const g = stops[j];
        if (g.userData.s !== n) { say(STOPS[g.userData.s][0]); missed(g, stops.find(x => x.userData.s === n)); return null; }
        clearHints();
        const to = g.position.clone().add(V(0, 0, 1.3));
        const a = last.clone().setY(.1), c = to.clone().setY(.1);
        const seg = new T.Mesh(new T.TubeGeometry(new T.LineCurve3(a, c), 4, .08, 6, false), K.clay(0xF2A33A)); path.add(seg); last = to.clone();
        K.poke(g.userData.j, .35); sfx('ok'); say(STOPS[n][1]); n++;
        if (!viaDrop) D.land(0, to);
        else D.setHome(0, to);
        D.setHome(0, to);
        if (n === 6) setTimeout(res, 300);
        return to;
      };
      const D = K.drag([box], { h: 0, lift: .7, drop: (i, p) => { const j = K.nearest(K.v.toScreen(p), stops, { max: 130 }); return j >= 0 ? go(j, true) : null; } });
      K.inputs({ down: D.down, move: D.move, up(p) { if (D.sel() === 0) { const j = K.nearest(p, stops, { max: 120, at: o => K.pos(o).add(V(0, 1, 0)) }); if (j >= 0) { D.select(-1); go(j, false); return; } } else { const j = K.nearest(p, stops, { max: 90, at: o => K.pos(o).add(V(0, 1, 0)) }); if (j >= 0 && K.nearest(p, [box], { max: 70 }) < 0) { go(j, false); return; } } D.up(p); } });
      K.keys((k, dn) => { const j = NUM.indexOf(k); if (dn && j >= 0) { go(j, false); return true; } return false; });
      winStep = () => { while (n < 6) go(stops.findIndex(g => g.userData.s === n), false); };
      aid = () => { if (n >= 6) return null; const j = stops.findIndex(g => g.userData.s === n); return { kb: [NUM[j]], ptr: { drag: [scr(box, .4), scr(stops[j], .6)] } }; };
    });
    offC(); K.inputs({});
    while (G.voicePos() !== null) await sleep(150);
    await say('l8.done');
    await ritual(stops);
  }

  // ========== 9 誰做了什麼：3D 連連看（誰 → 做什麼） ==========
  async function ch9() {
    if (!K.mount()) return;
    K.level();
    const pairs = [['c.factory', 'c.make', 'l9.factory'], ['c.shipco', 'c.carry', 'l9.ship'], ['c.customsP', 'c.check', 'l9.customs'], ['c.shopP', 'c.sell', 'l9.shop'], ['c.parent', 'c.buy', 'l9.parent']];
    const WHO = [() => JY.factory(), () => { const g = JY.ship(); g.scale.setScalar(.5); return g; }, () => JY.booth(), () => JY.shop(), () => JY.parents()];
    const WHAT = [() => JY.miniBear(.6), () => { const g = JY.container('container3'); g.scale.setScalar(.6); return g; }, () => JY.shield(), () => JY.shelf(), () => JY.coin()];
    const PT = K.portrait(), sx = PT ? 1.95 : 2.8;
    const left = WHO.map((f, i) => { const g = W(f(), 120, 8); g.userData.j.children[0].scale.multiplyScalar(PT ? .62 : .8); K.add(g, (i - 2) * sx, 0, 3); return g; });
    const ord = shuffle([0, 1, 2, 3, 4]);
    const right = ord.map((p, j) => { const g = W(WHAT[p]()); K.add(g, (j - 2) * sx, 0, -1.4); return g; });
    K.frameTo(PT ? [V(-4.6, 0, 4.4), V(4.6, 0, 4.4), V(-4.6, 1.8, -2), V(4.6, 1.8, -2)] : [V(-6.6, 0, 4.4), V(6.6, 0, 4.4), V(-6.6, 1.8, -2), V(6.6, 1.8, -2)], { elev: 38, elevPt: 46 });
    say('l9.q', 'g.match');
    const offC = coach('g.match', () => { const m = K.match.cur; const i = m ? m.done.findIndex(d => !d) : -1; return i >= 0 ? K.hand(left[i], 'drag', right[ord.indexOf(i)]) : null; });
    winStep = () => { const m = K.match.cur; if (m) m.done.forEach((d, i) => { if (!d) m.link(i, ord.indexOf(i)); }); };
    aid = () => { const m = K.match.cur; const i = m ? m.done.findIndex(d => !d) : -1; if (i < 0) return null; const j = ord.indexOf(i); return { kb: ['abcde'[i], NUM[j]], ptr: { drag: [scr(left[i], .8), scr(right[j], .6)] } }; };
    await K.match({
      left, right, truth: pairs.map((_, i) => ord.indexOf(i)), lk: 'abcde', rk: '12345', at: o => K.pos(o).add(V(0, .7, 0)),
      onRight: async i => { clearHints(); sfx('ok'); say(pairs[i][2]); },
      onWrong: async (i, j) => { missed(right[j], right[ord.indexOf(i)]); },
    });
    offC(); K.inputs({});
    while (G.voicePos() !== null) await sleep(150);
    await say('l9.trade');
    await ritual(left);
  }

  // ========== 10 小熊的旅行：照順序點，小熊沿著路走完整趟 ==========
  async function ch10() {
    if (!K.mount()) return;
    K.level();
    const STEPS = [['c.raw', 'l10.s1', () => JY.oilPump()], ['c.cloth', 'l10.s2', () => JY.cloth('pink')], ['c.fac', 'l10.s3', () => JY.factory()], ['c.sea', 'l10.s4', () => { const g = JY.ship(); g.scale.setScalar(.55); return g; }], ['c.toShop', 'l10.s5', () => JY.shop()], ['c.home', 'l10.s6', () => JY.house()]];
    const PT = K.portrait();
    const POS = PT ? [[-2.6, -2.6], [2.6, -2.4], [-2.8, .4], [2.8, .6], [-2.4, 3.2], [2.6, 3.4]] : [[-6.4, -1.2], [-2.2, -1.6], [2.2, -1.2], [6.4, -1.6], [-4.2, 2.2], [4.2, 2.4]];
    const ord = shuffle([0, 1, 2, 3, 4, 5]);
    const st = ord.map((s, j) => { const g = W(STEPS[s][2](), 120, 8); g.userData.s = s; g.userData.j.children[0].scale.multiplyScalar(.85); K.add(g, POS[j][0], 0, POS[j][1]); return g; });
    st.forEach((g, j) => K.cap(g, NUM[j], 1.9));
    const b = W(JY.bear(.6)); K.add(b, 0, 0, PT ? 5.4 : 4.6);
    const path = new T.Group(); K.lv.add(path);
    K.frameTo(PT ? [V(-4, 0, 6), V(4, 0, 6), V(-4, 1.6, -3.6), V(4, 1.6, -3.6)] : [V(-7.6, 0, 5.4), V(7.6, 0, 5.4), V(-7.6, 1.6, -2.6), V(7.6, 1.6, -2.6)], { elev: 46, elevPt: 56 });
    say('l10.q', 'g.order');
    for (let n = 0; n < 6; n++) {
      const right = st.findIndex(g => g.userData.s === n);
      const offC = coach('g.order', () => K.hand(st[right], 'tap'));
      await tapOne(st, NUM, right, { dy: 1, wrongSay: i => STEPS[st[i].userData.s][0] });
      offC(); clearHints(); K.inputs({});
      const to = st[right].position.clone().add(V(0, 0, 1.2));
      const seg = new T.Mesh(new T.TubeGeometry(new T.LineCurve3(b.position.clone().setY(.1), to.clone().setY(.1)), 4, .08, 6, false), K.clay(0xF2A33A)); path.add(seg);
      K.poke(st[right].userData.j, .4); sfx('ok');
      walk(b, to, .9);
      await say(STEPS[n][1]);
    }
    K.poke(b.userData.j, .5);
    await ritual(st);
  }

  // ---------- 結尾：小熊回到家，總結三句；給家長的小卡 ----------
  async function finale() {
    if (!K.mount()) { stage.innerHTML = '<div class="chtitle">' + G.Zs('ui.title') + '</div>'; await say('end.1'); return; }
    K.level();
    const h = K.add(JY.house(), 2.2, 0, -.4); h.scale.setScalar(1.4);
    const b = W(JY.bear(1)); K.add(b, -2.6, 0, 1.4);
    const sh = K.add(JY.shop(), -4.8, 0, -1.4); void sh;
    K.frameTo([V(-6, 0, 2.6), V(4.4, 0, 2.6), V(0, 3.6, -1.4)], { elev: 20, elevPt: 24 });
    K.inputs({ up(p) { if (K.nearest(p, [b], { max: 120, at: o => K.pos(o).add(V(0, 1, 0)) }) >= 0) { K.poke(b.userData.j, .5); sfx('bump'); } } });
    walk(b, V(1.2, 0, 1.6), 2);
    const c = document.createElement('div'); c.className = 'k3-card'; c.innerHTML = '<b>' + Z('ui.parent') + '：</b>' + Z('p.all'); K.ov.appendChild(c);
    sfx('win');
    for (const k of ['end.1', 'end.2', 'end.3']) await say(k);
  }

  const wrapCh = f => async () => { aid = null; winStep = null; wrong = 0; hints = []; await f(); aid = null; winStep = null; };
  G.run({ saveKey: 'toy-factory-v2', stamp: '小熊', heroArt: '<svg viewBox="0 0 48 48" fill="none" stroke="#8E2A1A" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><circle cx="14" cy="14" r="5"/><circle cx="34" cy="14" r="5"/><ellipse cx="24" cy="26" rx="14" ry="13"/><circle cx="19" cy="23" r="1.6" fill="#8E2A1A"/><circle cx="29" cy="23" r="1.6" fill="#8E2A1A"/><path d="M21 30q3 2.5 6 0"/></svg>',
    chapters: [ch1, ch2, ch3, ch4, ch5, ch6, ch7, ch8, ch9, ch10].map(wrapCh), finale });
  window.__tf = { win: () => { if (winStep) winStep(); }, aid: () => { try { return aid ? aid() : null; } catch (e) { return null; } } };
})();
