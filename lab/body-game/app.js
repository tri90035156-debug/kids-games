// 《我的身體裡面》（2026-11-08 第 9 批，新遊戲；設計書 設計.md）：一個黏土大頭小人，身上十扇小門。
// 每一關打開一扇門，器官浮到前面放大，用手幫它動一次；每關一句結論＋「給家長」小卡，十關後總結。
// 共用引擎 engine.js（封面、標題卡、?ch=N、重來鈕、字幕泡泡＋配音），3D 用 kit3d.js、場景在 body3d.js。十關手勢（相鄰不同）：
// 1 一直點牙齒咬飯糰  2 沿食道往下拖  3 按住讓胃攪  4 連連看（食物→給身體什麼）  5 照順序點一口飯的旅行
// 6 跟著節奏壓心臟  7 按住吸氣、放開吐氣  8 連連看（骨頭→幫什麼忙）  9 往上拉手臂（肌肉鼓起來）  10 點掉細菌、點月亮睡覺
// 測試：?ch=N&fast=1、?fin=1；console：__bd.win()、__bd.aid()、__k.meshes()。
(() => {
  'use strict';
  const { $, stage, Z, say, speak, sleep, shuffle, FAST } = G;
  const K = K3, { T } = K;
  const sfx = n => G.sfx(n);
  const note = i => G.note && G.note(i);
  K.init({ bg: 0xF7F0E4, ground: 0xF3E8D6 });
  if (K.ok) BD.stage(K.scene);
  const V = (x, y, z) => new T.Vector3(x, y, z);
  const W = (o, k = 150, d = 7) => K.wrap(o, k, d);
  let winStep = null, aid = null;
  const scr = (o, dy = 0) => { const q = K.sp(K.pos(o).add(V(0, dy, 0))), r = K.v.el.getBoundingClientRect(); return { x: Math.round(r.left + q.x), y: Math.round(r.top + q.y) }; };
  function coach(goal, demo) {
    let last = performance.now(), off = null;
    const act = () => { last = performance.now(); if (off) { off(); off = null; } };
    addEventListener('pointerdown', act, true); addEventListener('keydown', act, true);
    const iv = setInterval(() => { if (performance.now() - last < 15000) return; last = performance.now(); if (goal) say(goal); if (demo) { if (off) off(); off = demo(); setTimeout(() => { if (off) { off(); off = null; } }, 4000); } }, 1000);
    return () => { clearInterval(iv); removeEventListener('pointerdown', act, true); removeEventListener('keydown', act, true); if (off) off(); };
  }
  let wrong = 0, hints = [];
  const clearHints = () => { hints.forEach(K.haloOff); hints = []; wrong = 0; };
  const PT = () => K.portrait();
  const BG = new T.Color(0xF7F0E4);

  // ---------- 一關的骨架：小人在後面、打開第 n 扇門，器官放在前面 ----------
  let person = null;
  async function chapter(n, build) {
    if (!K.mount()) return;
    K.level();
    K.scene.background.copy(BG);
    person = W(BD.person(PT() ? .8 : .9), 120, 8); K.add(person, PT() ? 0 : -3.6, 0, PT() ? -4.2 : -1.6);
    const P = person.userData.j.children[0].userData;
    const door = P.doors[n - 1];
    const hl = K.halo(door, 1.2);
    door.rotation.y = 0;
    const c = { n, P, door, k: s => 'c' + n + '.' + s, front: PT() ? V(0, 0, 1.4) : V(1.8, 0, .6) };
    const pts = PT() ? [V(-3.2, 0, 4), V(3.2, 0, 4), V(-2.6, 4.6, -4.2), V(2.6, 4.6, -4.2)] : [V(-5.4, 0, 3.2), V(5.2, 0, 3.2), V(-5, 4.4, -1.6), V(5, 4, -1.6)];
    K.frameTo(pts, { elev: 16, elevPt: 18 });
    await K.tween(.5, t => { door.rotation.y = t * 1.6; });
    K.haloOff(hl);
    await build(c);
    K.inputs({}); aid = null;
    await say(c.k('end'));
    await K.card('<b>' + Z('ui.parent') + '：</b>' + Z('p' + n));
  }
  // 器官從門後面浮到前面
  async function rise(o, to, s = 1) {
    const from = K.pos(person).add(V(0, 2.4, .6));
    K.lv.add(o); o.position.copy(from); o.scale.setScalar(.05);
    await K.tween(.7, t => { o.position.lerpVectors(from, to, K.ease(t)); o.scale.setScalar(.05 + (s - .05) * K.outBack(t)); });
    return o;
  }
  const story = async n => { for (const k of Object.keys(TX).filter(x => new RegExp('^c' + n + '\\.s\\d$').test(x))) await say(k); };
  // 點一個 3D 東西（或按它的鍵）
  function tapOne(objs, keys, right, dy = .6) {
    return new Promise(res => {
      const pick = i => { if (i < 0 || !objs[i]) return; if (i === right) { offK(); res(i); return; } K.poke(objs[i].userData.j || objs[i], -.35); sfx('no'); wrong++; say(wrong >= 2 ? 'g.no2' : 'g.no1'); if (wrong === 2) hints.push(K.halo(objs[right], 2)); if (wrong >= 3) { offK(); res(right); } };
      K.inputs({ up(p) { if (!p.cancel) pick(K.nearest(p, objs, { max: 120, at: o => K.pos(o).add(V(0, dy, 0)) })); } });
      const offK = K.keys((k, dn) => { const i = keys.indexOf(k); if (dn && i >= 0) { pick(i); return true; } return false; });
      winStep = () => { offK(); res(right); };
      aid = () => ({ kb: [keys[right]], ptr: { tap: scr(objs[right], dy) } });
    });
  }

  // ========== 1 嘴巴：一直點牙齒，咬一咬 ==========
  const ch1 = () => chapter(1, async c => {
    const m = W(BD.mouth(), 140, 8); await rise(m, c.front.clone().add(V(0, 1.8, 0)), PT() ? .9 : 1);
    const M = m.userData.j.children[0].userData;
    const rb = W(BD.riceBall()); m.userData.j.children[0].add(rb); rb.position.set(0, 0, .3);
    const bits = K.dots(20, .08, BD.mat('rice')); K.lv.add(bits);
    await story(1);
    say(c.k('task'));
    const offC = coach(c.k('task'), () => K.hand(m, 'tap'));
    let n = 0, mid = false;
    await new Promise(res => {
      const bite = () => {
        if (n >= 8) return;
        n++; sfx('bump'); K.poke(m.userData.j, .2);
        K.tween(.14, t => { const k = Math.sin(t * Math.PI); M.top.position.y = -k * .35; M.bot.position.y = k * .35; });
        rb.scale.setScalar(1 - n * .1);
        const q = bits.userData.P.find(x => x.life <= 0); if (q) { q.life = 1; q.s = 1; q.p.copy(K.pos(m)).add(V((Math.random() - .5) * 1.2, (Math.random() - .5) * .6, .5)); }
        bits.userData.P.forEach((x, i) => { if (i < n * 2) { x.life = 1; x.s = 1; x.p.copy(K.pos(m)).add(V((Math.random() - .5) * 1.4, (Math.random() - .5) * .7, .5)); } }); bits.userData.sync();
        if (!mid && n >= 4) { mid = true; say(c.k('mid')); }
        if (n >= 8) setTimeout(res, 300);
      };
      K.inputs({ up(p) { if (!p.cancel) bite(); } });
      K.keys((k, dn) => { if (dn && (k === 'space' || k === 'enter')) { bite(); return true; } return false; });
      winStep = () => { while (n < 8) bite(); };
      aid = () => (n < 8 ? { kb: ['space'], ptr: { tap: scr(m) } } : null);
    });
    offC(); sfx('ok');
  });

  // ========== 2 食道：沿著食道往下拖 ==========
  const ch2 = () => chapter(2, async c => {
    const e = new T.Group(); const es = BD.esophagus(8); e.add(es); await rise(e, c.front.clone().add(V(0, 4.4, 0)), PT() ? .75 : .8);
    const rings = es.userData.rings;
    const rb = BD.riceBall(.55); e.add(rb); rb.position.y = .3;
    await story(2);
    say(c.k('task'));
    const offC = coach(c.k('task'), () => K.hand(rb, 'drag', rings[7]));
    let k = 0, mid = false;   // k：0～1 擠到哪裡
    K.on(() => { rb.position.y = .3 - k * 3.9; rings.forEach((r, i) => { const d = Math.abs(i * .55 - k * 3.9); const s = d < .7 ? .65 + d * .5 : 1; r.scale.set(s, s, 1); }); });
    await new Promise(res => {
      const set = v => { if (v > k) { if (Math.floor(v * 8) > Math.floor(k * 8)) note(Math.floor(v * 8)); k = Math.min(1, v); } if (!mid && k > .45) { mid = true; say(c.k('mid')); } if (k >= 1) { res(); } };
      const top = () => K.sp(rings[0]), bot = () => K.sp(rings[7]);
      let drag = false;
      K.inputs({ down(p) { drag = true; }, move(p) { if (!drag) return; const a = top(), b = bot(); set(K.clamp((p.y - a.y) / Math.max(1, b.y - a.y), 0, 1)); }, up() { drag = false; } });
      K.keys((kk, dn) => { if (dn && (kk === 'down' || kk === 's' || kk === 'space')) { set(k + .13); return true; } return false; });
      winStep = () => set(1);
      aid = () => ({ kb: ['down'], ptr: { drag: [scr(rings[0]), scr(rings[7], -.6)] } });
    });
    offC(); sfx('ok');
  });

  // ========== 3 胃：按住，攪一攪 ==========
  const ch3 = () => chapter(3, async c => {
    const st = W(BD.stomach(), 120, 8); await rise(st, c.front.clone().add(V(0, 2, 0)), PT() ? .8 : .9);
    const S = st.userData.j.children[0].userData;
    const foodM = S.food.material = S.food.material.clone();
    const bits = []; for (let i = 0; i < 6; i++) { const b = K.ball(.18, BD.mat(i % 3 === 0 ? 'veg' : i % 3 === 1 ? 'egg' : 'rice'), (Math.random() - .5) * 1.4, (Math.random() - .5) * .6, .6, 10); st.userData.j.children[0].add(b); bits.push(b); }
    await story(3);
    const hb = K.btn({ key: '␣', label: 'ui.stir', cls: 'hot' });
    say(c.k('task'));
    const offC = coach(c.k('task'), () => K.hand(st, 'hold'));
    let p = 0, down = false, finger = false, mid = false, tt = 0;
    const porridge = new T.Color(0xF2D9A0), white = new T.Color(0xFFFDF5);
    K.on(dt => {
      const on = down || finger; hb.classList.toggle('on', on);
      if (on && p < 1) { p = Math.min(1, p + dt * (FAST ? 2 : .22)); tt += dt; S.s.scale.set(1.3 + Math.sin(tt * 8) * .08, 1 - Math.sin(tt * 8) * .06, .8); bits.forEach((b, i) => { b.position.x = Math.sin(tt * 3 + i) * .7 * (1 - p); b.position.y = Math.cos(tt * 4 + i * 2) * .3; b.scale.setScalar(1 - p * .9); }); if (Math.random() < .05) sfx('bump'); }
      foodM.color.copy(white).lerp(porridge, p);
      if (!mid && p > .5) { mid = true; say(c.k('mid')); }
    });
    hb.addEventListener('pointerdown', e => { e.preventDefault(); down = true; }); addEventListener('pointerup', () => { down = false; });
    K.inputs({ down(q) { if (K.nearest(q, [st], { max: 160 }) >= 0) finger = true; }, up() { finger = false; } });
    K.keys((k, dn) => { if (k === 'space') { down = dn; return true; } return false; });
    winStep = () => { p = 1; };
    aid = () => (p < 1 ? { kb: { hold: 'space', ms: 900 }, ptr: { hold: scr(st), ms: 900 } } : null);
    await new Promise(res => { const iv = setInterval(() => { if (p >= 1) { clearInterval(iv); res(); } }, 60); });
    offC(); K.clearBtns(); sfx('ok');
  });

  // ========== 連連看（第 4、8 關） ==========
  async function link(c, { left, right, truth, says, lk = 'abc', rk = 'jkl' }) {
    const miss = left.map(() => 0);
    const offC = coach(c.k('task'), () => { const m = K.match.cur; const i = m ? m.done.findIndex(d => !d) : -1; return i >= 0 ? K.hand(left[i], 'drag', right[truth[i]]) : null; });
    winStep = () => { const m = K.match.cur; if (m) m.done.forEach((d, i) => { if (!d) m.link(i, truth[i]); }); };
    aid = () => { const m = K.match.cur; const i = m ? m.done.findIndex(d => !d) : -1; return i >= 0 ? { kb: [lk[i], rk[truth[i]]], ptr: { drag: [scr(left[i], .6), scr(right[truth[i]], .6)] } } : null; };
    await K.match({
      left, right, truth, lk, rk, at: o => K.pos(o).add(V(0, .6, 0)),
      onRight: async i => { sfx('ok'); clearHints(); await say(says[i]); },
      onWrong: async (i, j) => { miss[i]++; sfx('no'); say(miss[i] >= 2 ? 'g.no2' : 'g.no1'); if (miss[i] === 2) hints.push(K.halo(right[truth[i]], 2)); },
    });
    offC();
  }

  // ========== 4 小腸：連連看（食物 → 給身體什麼） ==========
  const ch4 = () => chapter(4, async c => {
    const si = W(BD.smallIntestine(), 120, 8); await rise(si, c.front.clone().add(V(0, 3.6, -1.2)), .9);
    await story(4);
    const sp = PT() ? 2 : 2.4, cx = c.front.x;
    const F = ['rice', 'egg', 'veg'], R = ['power', 'grow', 'poo'];
    const ord = shuffle([0, 1, 2]);
    const left = F.map((k, i) => { const g = W(BD.food(k)); K.add(g, cx + (i - 1) * sp, 0, c.front.z + 3.6); K.tag(g, Z('f.' + k), -.2); return g; });
    const right = ord.map((r, j) => { const g = W(BD.result(R[r])); K.add(g, cx + (j - 1) * sp, 0, c.front.z - .2); K.tag(g, Z('r.' + R[r]), j % 2 ? 2.3 : 1.4); return g; });
    K.frameTo(PT() ? [V(-3.2, 0, 5.8), V(3.2, 0, 5.8), V(-2.6, 3, -4.2), V(2.6, 3, -4.2)] : [V(-5.4, 0, 5), V(5.2, 0, 5), V(-5, 4.4, -1.6), V(5, 4.6, -1.6)], { elev: 40, elevPt: 50 });
    say(c.k('task'));
    await link(c, { left, right, truth: [0, 1, 2].map(i => ord.indexOf(i)), says: ['c4.rice', 'c4.egg', 'c4.veg'] });
    // 好東西從小腸跑進血管：小點點散出去
    const dots = K.dots(18, .12, BD.mat('gold')); K.lv.add(dots);
    const o = K.pos(si);
    await K.tween(1.2, t => { dots.userData.P.forEach((q, i) => { const a = i / 18 * Math.PI * 2; q.life = 1; q.s = 1; q.p.set(o.x + Math.cos(a) * t * 3, o.y + Math.sin(a) * t * 2, o.z + .5); }); dots.userData.sync(); });
    K.lv.remove(dots); sfx('win');
  });

  // ========== 5 一口飯的旅行：照順序點五站 ==========
  const ch5 = () => chapter(5, async c => {
    const li = W(BD.largeIntestine(), 120, 8); await rise(li, c.front.clone().add(V(0, 4.2, -1.4)), .7);
    await story(5);
    const KEYS = ['mouth', 'eso', 'stomach', 'small', 'large'];
    const ord = shuffle([0, 1, 2, 3, 4]);
    const sp = PT() ? 1.5 : 1.9, cx = c.front.x;
    const gs = ord.map((k, j) => { const g = W(BD.ORGAN_MINI[KEYS[k]]()); g.userData.k = k; K.add(g, cx + (j - 2) * sp, 0, c.front.z + 2.4); K.tag(g, Z('o.' + KEYS[k]), -.2); K.cap(g, String(j + 1), 1.8); return g; });
    const rb = W(BD.riceBall(.4)); K.add(rb, cx - 3 * sp, .4, c.front.z + 3.6);
    K.frameTo(PT() ? [V(-3.6, 0, 5.2), V(3.6, 0, 5.2), V(-2.6, 4.6, -4.2), V(2.6, 4.6, -4.2)] : [V(-5.4, 0, 4.4), V(5.4, 0, 4.4), V(-5, 4.4, -1.6), V(5, 4.6, -1.6)], { elev: 22, elevPt: 26 });
    say(c.k('task'));
    for (let s = 0; s < 5; s++) {
      const right = gs.findIndex(g => g.userData.k === s);
      const offC = coach(c.k('task'), () => K.hand(gs[right], 'tap'));
      await tapOne(gs, '12345', right, .8);
      offC(); clearHints(); K.inputs({}); aid = null;
      const from = rb.position.clone(), to = K.pos(gs[right]).add(V(0, 1.4, 0));
      await K.tween(.45, t => { rb.position.lerpVectors(from, to, K.ease(t)); rb.position.y += Math.sin(t * Math.PI) * 1.2; rb.scale.setScalar(1 - s * .12); });
      K.poke(gs[right].userData.j, .4); sfx('ok');
      await say('c5.n' + (s + 1));
    }
    // 大腸把水吸回身體：藍色小水滴往外跑
    const wd = K.dots(12, .12, K.clay(0x5CC3E8)); K.lv.add(wd); const o = K.pos(li);
    await K.tween(1, t => { wd.userData.P.forEach((q, i) => { const a = i / 12 * Math.PI * 2; q.life = 1; q.s = 1; q.p.set(o.x + Math.cos(a) * (.5 + t * 2.5), o.y + Math.sin(a) * (.5 + t * 1.6), o.z + .6); }); wd.userData.sync(); });
    K.lv.remove(wd);
    rb.userData.j.children[0].children[0].material = BD.mat('brown');
  });

  // ========== 6 心臟：跟著節奏壓 ==========
  const ch6 = () => chapter(6, async c => {
    const h = W(BD.heart(), 200, 6); await rise(h, c.front.clone().add(V(0, 2.2, 0)), PT() ? .9 : 1);
    // 一圈血管：心臟出去、繞一圈回來
    const pts = []; for (let i = 0; i <= 40; i++) { const a = i / 40 * Math.PI * 2; pts.push(K.pos(h).add(V(Math.cos(a) * 2.2, Math.sin(a) * 1.6, -.3))); }
    const curve = new T.CatmullRomCurve3(pts, true);
    K.lv.add(new T.Mesh(new T.TubeGeometry(curve, 60, .08, 6, true), K.clay(0xF0A08E)));
    const blood = K.dots(14, .13, BD.mat('red')); K.lv.add(blood);
    let flow = 0, speed = 0;
    K.on(dt => { speed = Math.max(0, speed - dt * .8); flow += dt * (.05 + speed); blood.userData.P.forEach((q, i) => { q.life = 1; q.s = 1; q.p.copy(curve.getPoint(((i / 14) + flow) % 1)); }); blood.userData.sync(); });
    await story(6);
    say(c.k('task'));
    let beats = 0, phase = 1, tick = 0;
    const offC = coach(c.k('task'), () => K.hand(h, 'tap'));
    // 咚咚的節拍（木魚），孩子跟著壓
    const met = setInterval(() => { tick++; G.sfx('tap'); }, FAST ? 150 : 800);
    await new Promise(res => {
      const press = () => {
        beats++; sfx('bump'); K.poke(h.userData.j, .5); speed = Math.min(1.2, speed + (phase === 2 ? .45 : .3));
        if (phase === 1 && beats === 3) say(c.k('mid'));
        if (phase === 1 && beats >= 6) { phase = 2; beats = 0; clearInterval(met); say(c.k('run')); }
        else if (phase === 2 && beats >= 8) res();
      };
      K.inputs({ down(p) { press(); } });
      K.keys((k, dn) => { if (dn && (k === 'space' || k === 'enter')) { press(); return true; } return false; });
      winStep = () => { phase = 2; beats = 8; res(); };
      aid = () => ({ kb: ['space'], ptr: { tap: scr(h) } });
    });
    clearInterval(met); offC(); sfx('ok');
  });

  // ========== 7 肺：按住吸氣、放開吐氣（三次） ==========
  const ch7 = () => chapter(7, async c => {
    const lu = W(BD.lungs(), 120, 8); await rise(lu, c.front.clone().add(V(0, 2.2, 0)), PT() ? .8 : .9);
    const L = lu.userData.j.children[0].userData.L;
    const air = K.dots(16, .1, K.clay(0xBFE3F2)); K.lv.add(air);
    await story(7);
    const hb = K.btn({ key: '␣', label: 'ui.breathe', cls: 'hot' });
    say(c.k('task'));
    const offC = coach(c.k('task'), () => K.hand(lu, 'hold'));
    let v = 0, down = false, finger = false, cycles = 0, full = false;
    const o = K.pos(lu);
    K.on(dt => {
      const on = down || finger; hb.classList.toggle('on', on);
      v = on ? Math.min(1, v + dt * (FAST ? 4 : .9)) : Math.max(0, v - dt * (FAST ? 4 : 1.1));
      L.forEach(b => b.scale.set(.85 * (1 + v * .3), 1.3 * (1 + v * .25), .7 * (1 + v * .3)));
      air.userData.P.forEach((q, i) => { q.life = 1; q.s = .8; const t = on ? v : 1 - v; q.p.set(o.x + (i % 2 ? .9 : -.9) * t, o.y + 2.6 - t * 2.6 + (i % 4) * .2, o.z + .7); }); air.userData.sync();
      if (on && v >= .95 && !full) { full = true; say(c.k('in')); sfx('bump'); }
      if (!on && full && v <= .05) { full = false; cycles++; say(c.k('out')); note(cycles + 3); }
    });
    hb.addEventListener('pointerdown', e => { e.preventDefault(); down = true; }); addEventListener('pointerup', () => { down = false; });
    K.inputs({ down(q) { if (K.nearest(q, [lu], { max: 160 }) >= 0) finger = true; }, up() { finger = false; } });
    K.keys((k, dn) => { if (k === 'space') { down = dn; return true; } return false; });
    winStep = () => { cycles = 3; };
    aid = () => (cycles < 3 && !full && v < .05 ? { kb: { hold: 'space', ms: FAST ? 400 : 1400 }, ptr: { hold: scr(lu), ms: FAST ? 400 : 1400 } } : null);
    await new Promise(res => { const iv = setInterval(() => { if (cycles >= 3) { clearInterval(iv); res(); } }, 80); });
    await sleep(FAST ? 30 : 600);
    offC(); K.clearBtns(); sfx('ok');
  });

  // ========== 8 骨頭：連連看（骨頭 → 幫什麼忙） ==========
  const ch8 = () => chapter(8, async c => {
    await story(8);
    const sp = PT() ? 2.1 : 2.5, cx = c.front.x;
    const B = ['skull', 'ribs', 'leg'], J = ['brain', 'heart', 'walk'];
    const ord = shuffle([0, 1, 2]);
    const left = B.map((k, i) => { const g = W(BD[k === 'leg' ? 'legBone' : k]()); g.userData.j.children[0].scale.setScalar(.75); K.add(g, cx + (i - 1) * sp, 0, c.front.z + 3.6); K.tag(g, Z('b.' + k), -.2); return g; });
    const JM = { brain: () => { const g = new T.Group(); const b = K.ball(.5, BD.mat('pink'), 0, .6, 0, 16); b.scale.set(1.2, .9, 1); g.add(b); return g; }, heart: () => { const g = BD.heart(); g.scale.setScalar(.4); g.position.y = .6; const w = new T.Group(); w.add(g); return w; }, walk: () => { const g = new T.Group(); [-1, 1].forEach(s => { const f = K.ball(.3, BD.mat('dark'), s * .3, .2, s * .2, 12); f.scale.set(1, .5, 1.6); g.add(f); }); return g; } };
    const right = ord.map((r, j) => { const g = W(JM[J[r]]()); K.add(g, cx + (j - 1) * sp, 0, c.front.z - .2); K.tag(g, Z('j.' + J[r]), j % 2 ? 2.3 : 1.4); return g; });
    K.frameTo(PT() ? [V(-3.2, 0, 5.8), V(3.2, 0, 5.8), V(-2.6, 3, -4.2), V(2.6, 3, -4.2)] : [V(-5.4, 0, 5), V(5.2, 0, 5), V(-5, 4.4, -1.6), V(5, 3, -1.6)], { elev: 40, elevPt: 50 });
    say(c.k('task'));
    await link(c, { left, right, truth: [0, 1, 2].map(i => ord.indexOf(i)), says: ['c8.skull', 'c8.ribs', 'c8.leg'] });
    sfx('win');
  });

  // ========== 9 肌肉：往上拉手臂，肌肉鼓起來 ==========
  const ch9 = () => chapter(9, async c => {
    const ar = W(BD.armRig(), 120, 8); await rise(ar, c.front.clone().add(V(-1, 2, 0)), PT() ? .85 : 1);
    const A = ar.userData.j.children[0].userData;
    const hand = A.elbow.children[1];
    await story(9);
    say(c.k('task'));
    const offC = coach(c.k('task'), () => K.hand(hand, 'drag', K.add(new T.Group(), K.pos(ar).x + 1, 4.2, K.pos(ar).z)));
    let ang = 0, want = 0, held = false, mid = false, bent = false;
    K.on(() => {
      ang = K.lerp(ang, want, .2); A.elbow.rotation.z = ang;
      const k = ang / 2.2; A.bi.scale.set(2.2 - k * .8, .6 + k * .5, .7 + k * .4); A.tri.scale.set(2.2 + k * .2, .5 - k * .1, .6);
    });
    await new Promise(res => {
      const check = () => { if (!mid && ang > 1.7) { mid = true; bent = true; say(c.k('mid')); sfx('ok'); } };
      const release = () => { held = false; if (bent) { want = 0; say(c.k('down')).then(res); } else want = 0; };
      const iv = setInterval(check, 60);
      let y0 = null;
      K.inputs({ down(p) { held = true; y0 = p.y; }, move(p) { if (!held) return; want = K.clamp((y0 - p.y) / 120 * 2.2, 0, 2.2); }, up() { clearInterval(iv); check(); release(); } });
      K.keys((k, dn) => { if (k !== 'w' && k !== 'up') return false; if (dn) { held = true; want = 2.2; } else { check(); release(); } return true; });
      winStep = () => { ang = want = 2.2; check(); release(); };
      aid = () => (!bent ? { kb: { hold: 'w', ms: 700 }, ptr: { drag: [scr(hand), { x: scr(hand).x, y: scr(hand).y - 160 }] } } : null);
    });
    offC();
  });

  // ========== 10 皮膚與睡覺：點掉細菌，點月亮睡覺 ==========
  const ch10 = () => chapter(10, async c => {
    const sk = W(BD.skinPatch(), 120, 8); await rise(sk, c.front.clone().add(V(0, .3, .6)), PT() ? .75 : .9);
    await story(10);
    say(c.k('task'));
    const gs = [];
    for (let i = 0; i < 5; i++) { const g = W(BD.germ()); const a = i / 5 * Math.PI * 2; g.userData.a = a; K.add(g, K.pos(sk).x + Math.cos(a) * 3, 1.6 + (i % 2) * .6, K.pos(sk).z + Math.sin(a) * 1.2); gs.push(g); }
    let tt = 0;
    K.on(dt => { tt += dt; gs.forEach((g, i) => { if (!g.visible || g.userData.gone) return; const r = 1.4 + Math.sin(tt * 2 + i) * .5; g.position.x = K.pos(sk).x + Math.cos(g.userData.a + tt * .5) * r; g.position.y = 1 + Math.abs(Math.sin(tt * 3 + i)) * .8; }); });
    const offC = coach(c.k('task'), () => { const g = gs.find(x => !x.userData.gone); return g ? K.hand(g, 'tap') : null; });
    await new Promise(res => {
      const flick = i => { if (i < 0) return; const g = gs[i]; if (g.userData.gone) return; g.userData.gone = true; sfx('pop'); K.poke(sk.userData.j, .2); const from = g.position.clone(), dir = from.clone().sub(K.pos(sk)).setY(0).normalize(); K.tween(.5, t => { g.position.copy(from).addScaledVector(dir, t * 6); g.position.y = from.y + t * 2; }).then(() => { g.visible = false; }); if (gs.every(x => x.userData.gone)) setTimeout(res, 500); };
      K.inputs({ up(p) { if (!p.cancel) flick(K.nearest(p, gs.map(g => (g.userData.gone ? null : g)), { max: 110 })); } });
      K.keys((k, dn) => { if (dn && (k === 'space' || k === 'enter')) { flick(gs.findIndex(g => !g.userData.gone)); return true; } return false; });
      winStep = () => gs.forEach((_, i) => flick(i));
      aid = () => { const i = gs.findIndex(g => !g.userData.gone); return i >= 0 ? { kb: ['space'], ptr: { tap: scr(gs[i]) } } : null; };
    });
    offC(); aid = null;
    await say(c.k('ok'));
    // 睡覺：點月亮
    const mn = W(BD.moon()); K.add(mn, K.pos(sk).x + (PT() ? 1.6 : 2.4), 3.6, K.pos(sk).z - .6); K.poke(mn.userData.j, .5); K.cap(mn, 'M', 1);
    say(c.k('sleep'));
    await tapOne([mn], 'm', 0, 0);
    K.inputs({}); aid = null;
    const night = new T.Color(0x3C4A6E), cut = sk.userData.j.children[0].userData.cut;
    sfx('chord');
    await K.tween(1.2, t => { K.scene.background.copy(BG).lerp(night, t * .7); });
    const say2 = say(c.k('heal'));
    await K.tween(FAST ? .05 : 2.5, t => { cut.scale.set(1 - t * .95, 1, 1 - t * .9); });
    await say2;
    await K.tween(1, t => { K.scene.background.copy(BG).lerp(night, (1 - t) * .7); });
    sfx('ok');
  });

  // ---------- 結尾：總結三句，小人揮手 ----------
  async function finale() {
    if (!K.mount()) { stage.innerHTML = '<div class="chtitle">' + G.Zs('fin.title') + '</div>'; await say('sum.1'); return; }
    K.level(); K.scene.background.copy(BG);
    const p = W(BD.person(1), 120, 8); K.add(p, 0, 0, 0);
    const P = p.userData.j.children[0].userData;
    K.frameTo([V(-3, 0, 2), V(3, 0, 2), V(-2, 5.8, 0), V(2, 5.8, 0)], { elev: 12, elevPt: 14 });
    let tt = 0; K.on(dt => { tt += dt; P.arms[1].sh.rotation.z = -2.4 + Math.sin(tt * 6) * .3; });
    K.inputs({ up() { K.poke(p.userData.j, .4); note(Math.floor(Math.random() * 8)); } });
    const c = document.createElement('div'); c.className = 'k3-card'; c.innerHTML = '<div class="chtitle">' + G.Zs('fin.title') + '</div>'; K.ov.appendChild(c);
    sfx('win');
    for (const k of ['sum.1', 'sum.2', 'sum.3']) await say(k);
  }

  const wrapCh = f => async () => { aid = null; winStep = null; wrong = 0; hints = []; await f(); aid = null; winStep = null; };
  G.run({
    saveKey: 'body-game-v1', stamp: '身體',
    heroArt: '<svg viewBox="0 0 100 100"><circle cx="50" cy="38" r="26" fill="#F6CDA8"/><circle cx="41" cy="36" r="3.4" fill="#3B3430"/><circle cx="59" cy="36" r="3.4" fill="#3B3430"/><path d="M42 47q8 7 16 0" stroke="#3B3430" stroke-width="3" fill="none" stroke-linecap="round"/><ellipse cx="50" cy="80" rx="20" ry="17" fill="#8FB38A"/><circle cx="50" cy="78" r="5" fill="#F2A23A"/></svg>',
    chapters: [ch1, ch2, ch3, ch4, ch5, ch6, ch7, ch8, ch9, ch10].map(wrapCh), finale,
  });
  window.__bd = { win: () => { if (winStep) winStep(); }, aid: () => { try { return aid ? aid() : null; } catch (e) { return null; } } };
})();
