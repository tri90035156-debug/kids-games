// 《頌缽工坊》3D 版（2026-11-08 第 8 批）：一張長長的黏土工作檯（左邊火爐、右邊冷水桶），缽沿著檯子一站一站往右。
// 共用引擎 engine.js 管流程、配音、注音字幕泡泡、重來鈕；3D 用 kit3d.js、場景在 workshop.js。
// **磨缽聲照舊用 WebAudio 即時合成（G.hum：繞得越快越響），擦亮的手感照舊（真的一塊一塊把黑皮擦掉）。**
// 十關，每關一種 3D 動作，相鄰兩關不一樣：
// 1 敲缽、繞著缽口畫圈磨（木棒真的繞著轉、金色波紋）  2 把「缶」「本」兩塊字的積木拖進牌子  3 一直敲石頭，裂開找銅礦、錫礦
// 4 把四塊銅、一塊錫拖進坩堝  5 上下拉風箱，火變高、坩堝變紅  6 按住倒金屬液進模子，到白線放手  7 跟著師傅的節奏輪流敲；冷了拖回火裡
// 8 把缽拖進火爐燒紅，再拖進冷水桶（滋——冒白煙）  9 來回擦，把缽上的黑皮擦亮  10 敲三個大小缽、找最低的聲音；倒水、磨磨看，水面跳舞
// 配音稿一句沒改（tools/content.py 沒動、沒重錄）。測試：?ch=N&fast=1、?fin=1；console：__bw.win()、__bw.aid()。
(() => {
  'use strict';
  const { $, stage, Z, say, speak, sleep, shuffle, strike, hum, FAST } = G;
  const K = K3, { T } = K;
  const sfx = n => G.sfx(n);
  const note = i => G.note && G.note(i);
  K.init({ bg: 0xF3EEDF, ground: 0xE8DCC8 });
  if (K.ok) WS.bench(K.scene);
  const V = (x, y, z) => new T.Vector3(x, y, z);
  const W = (o, k = 150, d = 7) => K.wrap(o, k, d);
  const PARENT = ["木棒磨著缽口時，會「黏住、滑開、黏住、滑開」，一直推著缽振動（和濕手指磨玻璃杯口是同一個道理）。可以讓孩子在缽唱歌時輕摸缽身，感覺它在抖。", "「缽」是形聲字：「缶」表示陶器，「本」表聲。這個字最早用來翻譯梵文 pātra（缽多羅），指僧人用的食器，多半是陶或鐵做的；異體字「鉢」改用金字旁。", "銅礦常見的有綠色的孔雀石；錫礦主要是黑褐色的錫石。礦石要在高溫下「冶煉」，金屬才會分離出來。這一關把冶煉簡化成「燒一燒」。", "傳統手工頌缽多半是「高錫青銅」（響銅），大約 78% 銅、22% 錫，差不多就是四比一。錫太多會又硬又脆；錫太少聲音不夠亮。常聽到的「七種金屬」說法，成分分析多半找不到根據。", "高錫青銅大約在 900°C 上下熔化（實際溫度依銅錫比例而定）；家用烤箱最高約 250°C。風箱把空氣（氧氣）送進爐子，火就燒得更旺、更熱。", "尼泊爾的手工頌缽，通常先把熔好的青銅倒進小模子，鑄成一塊厚厚的圓餅（坯），之後再一邊加熱一邊敲成碗。也有工廠直接鑄造成形，再用車床修整。", "高錫青銅冷的時候很脆，必須加熱到暗紅色才能鍛打，敲一陣子就要回爐。尼泊爾的工坊常由三、四位師傅圍著輪流下槌，一個缽要敲上千次。", "含錫約 22% 的青銅若慢慢冷卻會變得很脆；從高溫直接淬火，可以保留比較有韌性的組織。印度、韓國的傳統響銅器也用同樣的方法。", "淬火後的缽表面有一層黑色氧化皮，師傅會用車床或刮刀刮掉、再打磨。有些缽會保留外面的槌痕，看得出是手工敲出來的。", "缽越大、壁越薄，聲音越低。缽振動時把水面推出規律的波紋（稱為法拉第波），磨得夠用力，水珠甚至會跳起來；加水也讓缽振動得慢一點，所以音變低。"];
  const FIN = "回家可以做「水杯樂器」：幾個玻璃杯裝不同高度的水，用筷子輕敲——水越多，聲音越低，和頌缽加水是同一個道理。也可以找找家裡的鍋子、湯匙，比比看哪個聲音最長。</div></div>";
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
  const clearHints = () => { hints.forEach(K.haloOff); hints = []; wrong = 0; };
  const endCard = n => K.card('<b>給家長：</b>' + PARENT[n - 1]);
  const PT = () => K.portrait();
  const P = (o, x, y, z) => K.add(o, X + x, y, z);
  let framedX = null;
  function frame(pts, o) { const pp = pts.map(p => p.clone().add(V(X, 0, 0))); if (framedX !== X) { framedX = X; K.frameTo(pp, o, true); K.cam.position.x -= 3; } else K.frameTo(pp, o); }
  const benchPts = (w = 4.4, hgt = 3) => [V(-w, 0, 3.2), V(w, 0, 3.2), V(-w, hgt, -2.4), V(w, hgt, -2.4)];
  function begin(i) { if (!K.mount()) return false; K.level(); X = i * 14; return true; }

  // ---------- 缽：敲（波紋一圈）、繞著缽口磨（WebAudio 嗡嗡聲，越快越響） ----------
  function bowlSet(r = 1.4, x = 0, z = 0) {
    const cu = P(WS.cushion(r), x, 0, z);
    const b = W(WS.bowl(r), 120, 9); P(b, x, r * .38, z);
    const st = WS.mallet(); st.scale.setScalar(.8); K.lv.add(st);
    const wv = WS.waves(r); P(wv, x, r * .38 + r * .72, z);
    const B = b.userData.j.children[0];
    const stickAt = a => { st.position.set(b.position.x + Math.cos(a) * (r + .1), b.position.y + B.userData.h - .2, b.position.z + Math.sin(a) * (r + .1)); st.rotation.set(Math.sin(a) * .5, 0, -Math.cos(a) * .5); };
    stickAt(-Math.PI / 4);
    let ding = 0;
    K.on(dt => { ding = Math.max(0, ding - dt * .5); wv.children.forEach((t, i) => { t.material.opacity = Math.max(ding, wv.userData.e || 0) * (1 - i * .25); t.scale.setScalar(1 + ((performance.now() / 1000 + i * .3) % 1) * .15); }); });
    return { cu, b, B, st, wv, r, stickAt, ding: () => { ding = 1; K.poke(b.userData.j, .25); } };
  }
  function rubBowl(bs, { f0 = 220, onLevel } = {}) {
    return new Promise(res => {
      const h = hum(f0);
      let ang = null, acc = 0, speed = 0, energy = 0, full = 0, auto = -Math.PI / 2, down = false;
      const center = () => K.sp(bs.b.position.clone().setY(bs.b.position.y + bs.B.userData.h));
      K.inputs({
        down(p) { const c = center(); ang = Math.atan2(p.y - c.y, p.x - c.x); },
        move(p) { const c = center(); const a = Math.atan2(p.y - c.y, p.x - c.x); if (ang !== null) { let d = a - ang; if (d > Math.PI) d -= 2 * Math.PI; if (d < -Math.PI) d += 2 * Math.PI; acc += Math.abs(d); } ang = a; bs.stickAt(a); },
        up() { ang = null; },
      });
      const offK = K.keys((k, dn) => { if (k === 'space') { down = dn; return true; } return false; });
      winStep = () => { energy = 1; full = 1; };
      aid = () => ({ kb: { hold: 'space', ms: FAST ? 1500 : 4000 }, ptr: { circle: scr(bs.b, bs.B.userData.h) } });
      let last = performance.now();
      const iv = setInterval(() => {
        const now = performance.now(), dt = Math.min(.1, (now - last) / 1000); last = now;
        if (down) { auto += dt * 4.2; acc += dt * 4.2; bs.stickAt(auto); }
        speed = speed * .85 + (acc / dt) * .15; acc = 0;
        energy = speed > 1.8 ? Math.min(1, energy + dt * (FAST ? 2 : .42)) : Math.max(0, energy - dt * .3);
        h.set(energy); bs.wv.userData.e = energy; if (energy > .6) K.poke(bs.b.userData.j, .01);
        if (onLevel) onLevel(energy);
        full = energy >= 1 ? full + dt : 0;
        if (full >= (FAST ? .1 : 1)) { clearInterval(iv); offK(); K.inputs({}); aid = null; res(h); }
      }, 30);
    });
  }
  // 點一個 3D 東西（或按它的鍵）
  function tapOne(objs, keys, right, dy = .6, wrongKey = null) {
    return new Promise(res => {
      const pick = i => { if (i < 0 || !objs[i]) return; if (i === right) { offK(); res(i); return; } K.poke(objs[i].userData.j || objs[i], -.35); sfx('no'); wrong++; say(wrongKey || (wrong >= 2 ? 'g.no2' : 'g.no1')); if (wrong === 2) hints.push(K.halo(objs[right], 2.2)); if (wrong >= 3) { offK(); res(right); } };
      K.inputs({ up(p) { if (!p.cancel) pick(K.nearest(p, objs, { max: 120, at: o => K.pos(o).add(V(0, dy, 0)) })); } });
      const offK = K.keys((k, dn) => { const i = keys.indexOf(k); if (dn && i >= 0) { pick(i); return true; } return false; });
      winStep = () => { offK(); res(right); };
      aid = () => ({ kb: [keys[right]], ptr: { tap: scr(objs[right], dy) } });
    });
  }
  // 拖一個東西到某個目標（或點東西再點目標、或按鍵）；ok(j) 判斷對不對
  function dragTo(item, targets, { ok, key = 'space', tkeys = null, wrongSay = 'g.no1', onRight, dropScreen = true, land = (j) => K.pos(targets[j]).add(V(0, .6, 0)) } = {}) {
    return new Promise(res => {
      let fin = false;
      const judge = (j, viaDrop) => {
        if (fin) return null;
        if (!ok(j)) { K.poke(targets[j].userData.j || targets[j], -.3); sfx('no'); wrong++; say(typeof wrongSay === 'function' ? wrongSay(j) : wrongSay); return null; }
        fin = true; clearHints();
        const to = land(j);
        if (!viaDrop) D.land(0, to).then(() => res(j)); else setTimeout(() => res(j), 300);
        if (onRight) onRight(j);
        return to;
      };
      const D = K.drag([item], { h: 0, lift: .7, dropScreen: (_, p) => { const j = K.nearest(p, targets, { max: 150, at: o => K.pos(o).add(V(0, .8, 0)) }); return j >= 0 ? judge(j, true) : null; } });
      K.inputs({ down: D.down, move: D.move, up(p) { if (D.sel() === 0 || K.nearest(p, [item], { max: 70 }) < 0) { const j = K.nearest(p, targets, { max: 140, at: o => K.pos(o).add(V(0, .8, 0)) }); if (j >= 0 && (D.sel() === 0 || K.nearest(p, [item], { max: 70 }) < 0)) { D.select(-1); judge(j, false); return; } } D.up(p); } });
      const offK = K.keys((k, dn) => { if (!dn) return false; if (tkeys) { const j = tkeys.indexOf(k); if (j >= 0) { judge(j, false); return true; } } else if (k === key) { const j = targets.findIndex((_, jj) => ok(jj)); judge(j, false); return true; } return false; });
      void offK;
      winStep = () => judge(targets.findIndex((_, jj) => ok(jj)), false);
      aid = () => { const j = targets.findIndex((_, jj) => ok(jj)); return fin ? null : { kb: [tkeys ? tkeys[j] : key], ptr: { drag: [scr(item, .3), scr(targets[j], .8)] } }; };
    });
  }

  // ========== 1 聽頌缽唱歌：敲一下，再繞著缽口磨 ==========
  async function ch1() {
    if (!begin(0)) return;
    const bs = bowlSet(1.5, 0, .4);
    frame(benchPts(3.6, 3.4), { elev: 30, elevPt: 40 });
    say('c1.hit');
    await new Promise(res => {
      const hit = () => { offK(); K.inputs({}); res(); };
      K.inputs({ up(p) { if (!p.cancel && K.nearest(p, [bs.b], { max: 150, at: o => K.pos(o).add(V(0, .6, 0)) }) >= 0) hit(); } });
      const offK = K.keys((k, dn) => { if (dn && (k === 'd' || k === 'space')) { hit(); return true; } return false; });
      winStep = hit; aid = () => ({ kb: ['d'], ptr: { tap: scr(bs.b, .6) } });
    });
    aid = null; strike(220); bs.ding();
    await say('c1.hitok');
    const tip = K.tag(bs.cu, Z('ui.rubtip'), -.4);
    say('c1.rub');
    const offC = coach('c1.rub', () => K.hand(bs.b, 'circle'));
    const h = await rubBowl(bs, { f0: 220 });
    offC(); K.capOff(tip);
    await say('c1.sing');
    h.stop(); bs.wv.userData.e = 0;
    await say('c1.why');
    await say('c1.done');
    await endCard(1);
  }

  // ========== 2 缽這個字：把「缶」「本」兩塊字的積木拖進牌子 ==========
  async function ch2() {
    if (!begin(1)) return;
    await say('c2.intro');
    const plaque = P(K.box(3.4, 1.9, .3, WS.mat('benchD')), 0, 1.4, -1.6);
    const slots = [-1, 1].map(s => { const o = new T.Group(); P(o, s * .8, .55, -1.3); return o; });
    slots.forEach(o => { const f = K.box(1.4, 1.4, .1, WS.mat('cream')); f.position.copy(o.position).add(V(0, .75, -.1)); K.lv.add(f); });
    const ord = shuffle(['缶', '本']);
    const tiles = ord.map((ch, i) => { const g = W(WS.tile(ch)); g.userData.ch = ch; P(g, (i ? 1 : -1) * 1.6, 0, 2.2); K.cap(g, 'AB'[i], 1.8); return g; });
    slots.forEach((o, j) => K.cap(o, ['←', '→'][j], 1.8));
    void plaque;
    frame(benchPts(3.4, 3.2), { elev: 22, elevPt: 28 });
    say('c2.how');
    let left = 2;
    const offC = coach('c2.how', () => { const i = tiles.findIndex(g => !g.userData.done); return i >= 0 ? K.hand(tiles[i], 'drag', slots[tiles[i].userData.ch === '缶' ? 0 : 1]) : null; });
    await new Promise(res => {
      const dm = tiles.slice();
      const put = (i, j, viaDrop) => {
        const g = tiles[i], want = g.userData.ch === '缶' ? 0 : 1;
        if (j !== want) { K.poke(g.userData.j, -.35); sfx('no'); speak('g.no1'); return null; }
        g.userData.done = true; dm[i] = null; sfx('ok');
        const to = slots[j].position.clone();
        if (!viaDrop) D.land(i, to);
        say(g.userData.ch === '缶' ? 'c2.fou' : 'c2.ben').then(() => { if (--left === 0) res(); });
        return to;
      };
      const D = K.drag(dm, { h: 0, lift: .7, dropScreen: (i, p) => { const j = K.nearest(p, slots, { max: 130, at: o => K.pos(o).add(V(0, .8, 0)) }); return j >= 0 ? put(i, j, true) : null; } });
      let picked = -1;
      K.inputs({ down: D.down, move: D.move, up(p) { const s = D.sel(); if (s >= 0) { const j = K.nearest(p, slots, { max: 120, at: o => K.pos(o).add(V(0, .8, 0)) }); if (j >= 0) { D.select(-1); put(s, j, false); return; } } D.up(p); } });
      K.keys((k, dn) => { if (!dn) return false; const i = 'ab'.indexOf(k); if (i >= 0 && !tiles[i].userData.done) { picked = i; D.select(i); return true; } const j = ['left', 'right'].indexOf(k) >= 0 ? ['left', 'right'].indexOf(k) : ['1', '2'].indexOf(k); if (j >= 0 && picked >= 0) { const i2 = picked; picked = -1; D.select(-1); put(i2, j, false); return true; } return false; });
      winStep = () => tiles.forEach((g, i) => { if (!g.userData.done) put(i, g.userData.ch === '缶' ? 0 : 1, false); });
      aid = () => { const i = tiles.findIndex(g => !g.userData.done); if (i < 0) return null; const j = tiles[i].userData.ch === '缶' ? 0 : 1; return { kb: ['ab'[i], ['left', 'right'][j]], ptr: { drag: [scr(tiles[i], .7), scr(slots[j], .8)] } }; };
    });
    offC(); K.inputs({}); aid = null;
    sfx('win');
    K.level();
    const bo = W(WS.tile('缽', 2.2)); P(bo, 0, 0, 0); K.poke(bo.userData.j, .6);
    frame(benchPts(3.4, 3.2), { elev: 22, elevPt: 28 });
    await say('c2.made');
    K.level();
    ['金', '＋', '本', '＝', '鉢'].forEach((ch, i) => { const g = W(ch === '＋' || ch === '＝' ? WS.tile(ch, .8) : WS.tile(ch, 1.3)); P(g, (i - 2) * (PT() ? 1.35 : 1.7), 0, .4); setTimeout(() => K.poke(g.userData.j, .4), i * 120); });
    await say('c2.metal');
    await endCard(2);
    // 選一個：頌缽是什麼做的？
    K.level();
    const opts = [['c2.o1', () => WS.bowl(.9)], ['c2.o2', () => { const g = new T.Group(); const l = K.cyl(.5, .5, 1.6, WS.mat('stick'), 0, .5, 0, 14); l.rotation.z = Math.PI / 2; g.add(l); return g; }], ['c2.o3', () => { const g = new T.Group(); g.add(K.cyl(.6, .5, .8, K.clay(0x7FC8E8, { roughness: .3 }), 0, .4, 0, 16)); return g; }]];
    const gs = opts.map(([t, f], i) => { const g = W(f()); P(g, (i - 1) * (PT() ? 2.4 : 3), 0, .8); K.tag(g, Z(t), -.2); K.cap(g, 'ABC'[i], 1.6); return g; });
    say('c2.q');
    await tapOne(gs, 'abc', 0, .5);
    clearHints(); K.inputs({}); aid = null;
    strike(330); K.poke(gs[0].userData.j, .5); sfx('ok');
    await say('c2.ok');
    await G.next();
  }

  // ========== 3 找金屬：一直敲石頭，裂開找銅礦、錫礦 ==========
  async function ch3() {
    if (!begin(2)) return;
    await say('c3.intro');
    const kinds = shuffle(['plain', 'cu', 'sn']);
    const rocks = kinds.map((k, i) => { const g = W(WS.rock(0), 120, 8); g.userData.k = k; g.userData.hits = 0; P(g, (i - 1) * (PT() ? 2.5 : 3.2), 0, .6); K.cap(g, String(i + 1), 1.8); return g; });
    const hm = WS.hammer(); hm.scale.setScalar(.9); K.lv.add(hm); hm.visible = false;
    frame(benchPts(PT() ? 3.6 : 4.4, 2.6), { elev: 26, elevPt: 34 });
    say('c3.how');
    const has = k => rocks.some(g => g.userData.open && g.userData.k === k);
    const offC = coach('c3.how', () => { const g = rocks.find(x => !x.userData.open); return g ? K.hand(g, 'tap') : null; });
    await new Promise(res => {
      const hit = i => {
        if (i < 0) return; const g = rocks[i]; if (g.userData.open) return;
        g.userData.hits++; sfx('crack'); K.poke(g.userData.j, -.4);
        hm.visible = true; hm.position.copy(g.position).add(V(.6, 1.2, .4)); hm.rotation.z = .8; K.tween(.15, t => { hm.rotation.z = .8 - t * .9; }).then(() => { hm.visible = false; });
        const j = g.userData.j; j.remove(j.children[0]);
        if (g.userData.hits < 5) { j.add(WS.rock(g.userData.hits)); return; }
        g.userData.open = true; j.add(WS.ore(g.userData.k)); K.poke(j, .6);
        if (g.userData.k === 'plain') { say('c3.plain'); return; }
        sfx('ok'); K.tag(g, Z(g.userData.k === 'cu' ? 'c3.cul' : 'c3.snl'), -.2);
        say(g.userData.k === 'cu' ? 'c3.cu' : 'c3.sn').then(() => { if (has('cu') && has('sn')) res(); });
      };
      K.inputs({ up(p) { if (!p.cancel) hit(K.nearest(p, rocks, { max: 130, at: o => K.pos(o).add(V(0, .7, 0)) })); } });
      K.keys((k, dn) => { if (!dn) return false; const i = '123'.indexOf(k); if (i >= 0) { hit(i); return true; } if (k === 'k') { hit(rocks.findIndex(g => !g.userData.open)); return true; } return false; });
      winStep = () => rocks.forEach((g, i) => { while (!g.userData.open) hit(i); });
      aid = () => { const i = rocks.findIndex(g => !g.userData.open); return i >= 0 ? { kb: [String(i + 1)], ptr: { tap: scr(rocks[i], .7) } } : null; };
    });
    offC(); K.inputs({}); aid = null;
    sfx('win');
    P(WS.ingot('cu'), -1, 0, 2.6); P(WS.ingot('sn'), 1, 0, 2.6);
    await say('c3.done');
    await endCard(3);
  }

  // ========== 4 調配方：把四塊銅、一塊錫拖進坩堝 ==========
  async function ch4() {
    if (!begin(3)) return;
    await say('c4.intro');
    const cr = W(WS.crucible(0)); cr.userData.j.children[0].scale.setScalar(1.6); P(cr, 0, 0, -.6);
    const CRU = cr.userData.j.children[0];
    const cuP = [0, 1, 2, 3, 4].map(i => { const g = W(WS.ingot('cu')); g.userData.k = 'cu'; P(g, PT() ? -2.2 : -3.4, i * .32, 2 - (i % 2) * .1); return g; });
    const snP = [0, 1].map(i => { const g = W(WS.ingot('sn')); g.userData.k = 'sn'; P(g, PT() ? 2.2 : 3.4, i * .32, 2); return g; });
    K.tag(cuP[0], Z('c4.cu'), -.3); K.tag(snP[0], Z('c4.sn'), -.3); K.cap(cuP[4], 'A', .8); K.cap(snP[1], 'B', .8);
    const cnt = K.tag(cr, '', 2.4);
    frame(benchPts(PT() ? 3.4 : 4.4, 2.6), { elev: 30, elevPt: 40 });
    say('c4.how');
    let cu = 0, sn = 0;
    const paint = () => { cnt.el.innerHTML = Z('c4.cu') + ' ' + '●'.repeat(cu) + '○'.repeat(4 - cu) + '　' + Z('c4.sn') + ' ' + '●'.repeat(sn) + '○'.repeat(1 - sn); CRU.userData.set((cu + sn) / 5 * .55, new T.Color(0xC9CCD0).lerp(new T.Color(0xD07A4A), cu / Math.max(1, cu + sn)).getHex()); };
    paint();
    const offC = coach('c4.how', () => K.hand(cu < 4 ? cuP.find(g => !g.userData.done) : snP.find(g => !g.userData.done), 'drag', cr));
    await new Promise(res => {
      const items = cuP.concat(snP), dm = items.slice();
      const put = (i, viaDrop) => {
        const g = items[i];
        if (g.userData.k === 'cu' && cu >= 4) { sfx('no'); speak('c4.toomuchcu'); return null; }
        if (g.userData.k === 'sn' && sn >= 1) { K.poke(cr.userData.j, -.4); sfx('crack'); speak('c4.toomuchsn'); return null; }
        g.userData.done = true; dm[i] = null;
        if (g.userData.k === 'cu') cu++; else sn++;
        sfx('bump'); K.poke(cr.userData.j, .3);
        const to = cr.position.clone().add(V(0, 1.2, 0));
        const fin = () => { g.visible = false; paint(); if (cu >= 4 && sn >= 1) res(); };
        if (!viaDrop) D.land(i, to).then(fin); else setTimeout(fin, 280);
        return to;
      };
      const D = K.drag(dm, { h: 0, lift: .7, dropScreen: (i, p) => (K.nearest(p, [cr], { max: 150, at: o => K.pos(o).add(V(0, 1, 0)) }) >= 0 ? put(i, true) : null) });
      K.inputs({ down: D.down, move: D.move, up(p) { const s = D.sel(); if (s >= 0 && K.nearest(p, [cr], { max: 140, at: o => K.pos(o).add(V(0, 1, 0)) }) >= 0) { D.select(-1); put(s, false); return; } D.up(p); } });
      K.keys((k, dn) => { if (!dn) return false; if (k === 'a') { const i = items.findIndex(g => g.userData.k === 'cu' && !g.userData.done); if (i >= 0) put(i, false); return true; } if (k === 'b') { const i = items.findIndex(g => g.userData.k === 'sn' && !g.userData.done); if (i >= 0) put(i, false); return true; } return false; });
      winStep = () => { while (cu < 4) put(items.findIndex(g => g.userData.k === 'cu' && !g.userData.done), false); if (sn < 1) put(items.findIndex(g => g.userData.k === 'sn' && !g.userData.done), false); };
      aid = () => { const want = cu < 4 ? 'cu' : sn < 1 ? 'sn' : null; if (!want) return null; const i = items.findIndex(g => g.userData.k === want && !g.userData.done); return { kb: [want === 'cu' ? 'a' : 'b'], ptr: { drag: [scr(items[i], .2), scr(cr, 1)] } }; };
    });
    offC(); K.inputs({}); aid = null;
    sfx('win');
    await say('c4.done');
    await endCard(4);
  }

  // ========== 5 生火：上下拉風箱，火變高、坩堝變紅 ==========
  async function ch5() {
    if (!begin(4)) return;
    const fu = P(WS.furnace(), -1.4, 0, -.4);
    const fl = WS.flames(); P(fl, -1.4, 1.4, -.4); fl.scale.setScalar(.1);
    const cr = WS.crucible(.4, 0x8A7A6A); P(cr, -1.4, 1.42, -.4);
    const be = W(WS.bellows(), 120, 8); P(be, 2, 0, .6);
    const BE = be.userData.j.children[0];
    K.cap(be, 'W ↕ S', 1.6);
    frame(benchPts(PT() ? 3.6 : 4.4, 3.4), { elev: 22, elevPt: 30 });
    await say('c5.intro');
    say('c5.how');
    let temp = 0, saidRed = false, lastKey = '', lastY = null, dir = 0, travel = 0, squeeze = 0;
    const pump = () => { temp = Math.min(1, temp + .075); sfx('whoosh'); squeeze = 1; };
    K.on(dt => {
      if (temp < 1) temp = Math.max(0, temp - dt * .03);
      squeeze = Math.max(0, squeeze - dt * 3);
      BE.userData.bag.scale.y = .5 - squeeze * .25; BE.userData.top.position.y = 1.05 - squeeze * .3;
      fl.scale.set(.6 + temp * .6, .1 + temp * 1.6, .6 + temp * .6);
      cr.userData.set(.4, new T.Color(0x8A7A6A).lerp(new T.Color(0xFFB347), temp).getHex(), temp > .5 ? (temp - .5) * 2 : 0);
    });
    const offC = coach('c5.how', () => K.hand(be, 'drag', fu));
    await new Promise(res => {
      K.inputs({
        down(p) { lastY = p.y; dir = 0; travel = 0; },
        move(p) { if (lastY === null) return; const dy = p.y - lastY; lastY = p.y; const d = Math.sign(dy); if (!d) return; if (d !== dir) { if (travel > 24) pump(); dir = d; travel = 0; } travel += Math.abs(dy); },
        up() { if (travel > 24) pump(); lastY = null; },
      });
      K.keys((k, dn) => { if (dn && (k === 'w' || k === 's') && k !== lastKey) { lastKey = k; pump(); return true; } return false; });
      const iv = setInterval(() => { if (temp >= .5 && !saidRed) { saidRed = true; say('c5.red'); } if (temp >= 1) { clearInterval(iv); res(); } }, 60);
      winStep = () => { temp = 1; };
      aid = () => { const p = scr(be, .7); return { kb: [lastKey === 'w' ? 's' : 'w'], ptr: { drag: [p, { x: p.x, y: p.y + 70 }] } }; };
    });
    offC(); K.inputs({}); aid = null;
    sfx('win');
    await say('c5.melt');
    await endCard(5);
  }

  // ========== 6 倒進模子：按住倒、到白線放手（兩次） ==========
  async function ch6() {
    if (!begin(5)) return;
    const cr = W(WS.crucible(.5, 0xFFB347)); P(cr, -1.2, 1.6, -.2); cr.userData.j.children[0].userData.set(.5, 0xFFB347, .8);
    const md = P(WS.mold(), 1, 0, .4);
    const liq = md.userData.liq;
    const stream = K.cyl(.08, .08, 1, new T.MeshBasicMaterial({ color: 0xFFB347 }), 0, 0, 0, 8); K.lv.add(stream); stream.visible = false;
    frame(benchPts(3.4, 3.4), { elev: 26, elevPt: 34 });
    const hb = K.btn({ key: '␣', label: 'c6.pour', cls: 'hot' });
    await say('c6.intro');
    say('c6.how');
    for (let round = 0; round < 2; round++) {
      let level = 0;
      liq.material.color.setHex(0xFF8A3D); liq.material.emissiveIntensity = .8;
      const setL = () => { liq.position.y = .2 + Math.min(1, level) * .32; liq.scale.y = 1; };
      setL();
      for (;;) {
        const offC = coach('c6.how', () => K.hand(cr, 'hold'));
        const r = await new Promise(res => {
          let down = false, was = false, pt = 0;
          const iv = setInterval(() => {
            const dt = .03;
            cr.userData.j.rotation.z = K.lerp(cr.userData.j.rotation.z, down ? -.9 : 0, .2);
            stream.visible = down; if (down) { stream.position.set(X + .1, 1, .2); stream.scale.y = 1.4; }
            hb.classList.toggle('on', down);
            if (down) { was = true; level += dt * (FAST ? 1.2 : .3); pt += dt; if (pt > .25) { pt = 0; sfx('pour'); } setL(); if (level >= 1) { clearInterval(iv); fin('over'); } }
            else if (was) { clearInterval(iv); fin('rel'); }
          }, 30);
          const fin = v => { stream.visible = false; cr.userData.j.rotation.z = 0; hb.classList.remove('on'); K.inputs({}); offK(); hb.onpointerdown = null; res(v); };
          hb.onpointerdown = e => { e.preventDefault(); down = true; };
          const up = () => { down = false; }; addEventListener('pointerup', up, { once: false });
          K.inputs({ down(p) { if (K.nearest(p, [cr, md], { max: 150, at: o => K.pos(o).add(V(0, .6, 0)) }) >= 0) down = true; }, up() { down = false; } });
          const offK = K.keys((k, dn) => { if (k === 'space') { down = dn; return true; } return false; });
          winStep = () => { level = .8; was = true; down = false; };
          aid = () => ({ kb: { hold: 'space', ms: Math.round(((.8 - level) / (FAST ? 1.2 : .3)) * 1000) }, ptr: { hold: scr(cr, .6), ms: Math.round(((.8 - level) / (FAST ? 1.2 : .3)) * 1000) } });
        });
        offC(); aid = null;
        if (r === 'over') { sfx('no'); await say('c6.over'); level = 0; setL(); continue; }
        if (level >= .72) break;
        say('c6.less');
      }
      sfx('ok'); K.poke(md, .2);
      await say('c6.ok');
      if (round === 0) { await say('c6.again'); }
    }
    K.clearBtns();
    await K.tween(1, t => { liq.material.color.setHex(0xC9964A); liq.material.emissiveIntensity = .8 * (1 - t); });
    await say('c6.done');
    await endCard(6);
  }

  // ========== 7 趁熱敲打：師傅敲三下，第四下換你；冷了拖回火裡 ==========
  async function ch7() {
    if (!begin(6)) return;
    const av = P(WS.anvil(), 0, 0, .2);
    const dc = W(WS.disc(), 160, 7); P(dc, 0, 1.12, .2);
    const DC = dc.userData.j.children[0].userData.d;
    const hms = [0, 1, 2, 3].map(j => { const a = -Math.PI / 2 + j * Math.PI / 2 + .6; const h = WS.hammer(); P(h, Math.cos(a) * 1.6, 0, .2 + Math.sin(a) * 1.2); h.lookAt(av.position.clone().setY(0)); return h; });
    const you = K.tag(hms[3], Z('c7.you'), 2.2);
    const fire = W(WS.flames(), 120, 8); P(fire, PT() ? -2.4 : -3.6, 0, 1.6); fire.visible = false; const fl = K.tag(fire, Z('c7.fire'), 1.2); fl.el.hidden = true;
    frame(benchPts(PT() ? 3.4 : 4.4, 3), { elev: 30, elevPt: 40 });
    let depth = 0, heat = 1, good = 0;
    const paint = () => { DC.scale.set(1 + depth * .2, 1 + depth * 2.5, 1 + depth * .2); DC.material.emissiveIntensity = heat * .7; DC.material.color.setHex(new T.Color(0x6B5236).lerp(new T.Color(0xC9964A), heat).getHex()); };
    paint();
    await say('c7.intro');
    await say('c7.team');
    say('c7.how');
    const swing = j => { const h = hms[j]; K.tween(.25, t => { h.rotation.x = -Math.sin(t * Math.PI) * .8; }); };
    while (good < 8) {
      await new Promise(res => {
        let b = -1, mine = false, lastMiss = 0;
        const tickBeat = () => { b = (b + 1) % 4; mine = false; hms.forEach((h, j) => { h.scale.setScalar(j === b ? 1.15 : 1); }); if (b < 3) { swing(b); strike(560, .05, .45); } };
        const hit = () => {
          if (b === 3 && !mine) {
            mine = true; swing(3); sfx('clang'); good++; depth = good / 8; heat = Math.max(0, heat - .25); paint(); K.poke(dc.userData.j, .4); note(good);
            if (good % 4 === 0) { clearInterval(iv); offK(); K.inputs({}); res(); }
          } else if (performance.now() - lastMiss > 4000) { lastMiss = performance.now(); sfx('tap'); speak('c7.miss'); }
        };
        const offK = K.keys((k, dn) => { if (dn && (k === 'space' || k === 'enter')) { hit(); return true; } return false; });
        K.inputs({ up(p) { if (!p.cancel) hit(); } });
        tickBeat();
        const iv = setInterval(tickBeat, FAST ? 120 : 720);
        winStep = () => { good = good - (good % 4) + 4; depth = good / 8; heat = 0; paint(); clearInterval(iv); offK(); K.inputs({}); res(); };
        aid = () => (b === 3 && !mine ? { kb: ['space'], ptr: { tap: scr(dc) } } : null);
      });
      aid = null;
      if (good >= 8) break;
      await say('c7.cool');
      fire.visible = true; fl.el.hidden = false;
      await dragTo(dc, [fire], { ok: () => true, key: 'space', land: () => fire.position.clone().add(V(0, .6, 0)) });
      aid = null; sfx('whoosh');
      await K.tween(1.2, t => { heat = t; paint(); });
      await K.tween(.4, t => { dc.position.lerpVectors(fire.position.clone().add(V(0, .6, 0)), V(X, 1.12, .2), t); });
      fire.visible = false; fl.el.hidden = true;
      await say('c7.hot');
    }
    K.capOff(you);
    sfx('win');
    const b = WS.bowl(.9); b.position.copy(dc.position); dc.visible = false; K.lv.add(b);
    await say('c7.shape');
    await say('c7.done');
    await endCard(7);
  }

  // ========== 8 泡冷水：拖進火爐燒紅，再拖進冷水桶 ==========
  async function ch8() {
    if (!begin(7)) return;
    const sx = PT() ? 2.6 : 3.6;
    const fu = W(WS.furnace(), 120, 8); P(fu, -sx, 0, -.2); const fl = WS.flames(); fl.position.y = 1.4; fu.userData.j.add(fl);
    const bk = W(WS.bucket(), 120, 8); P(bk, sx, 0, -.2);
    K.tag(fu, Z('c8.fire'), -.3); K.tag(bk, Z('c8.water'), -.3); K.cap(fu, '←', 2.6); K.cap(bk, '→', 2.2);
    const bowlMat = K.clay(0x6B5236, { roughness: .5, metalness: .2 });
    const bw = W(WS.bowl(.9, { mat: bowlMat })); P(bw, 0, 0, 1.4);
    const steam = K.dots(18, .25, new T.MeshStandardMaterial({ color: 0xffffff, transparent: true, opacity: .8 })); K.lv.add(steam);
    K.on(dt => { steam.userData.P.forEach(q => { if (q.life > 0) { q.p.y += dt * 1.6; q.life -= dt * .5; q.s = 1 + (1 - q.life) * 1.5; } }); steam.userData.sync(); });
    frame(benchPts(PT() ? 3.8 : 4.8, 3), { elev: 26, elevPt: 34 });
    await say('c8.intro');
    say('c8.how');
    let heat = 0;
    const paintBowl = h => { bowlMat.color.setHex(new T.Color(0x6B5236).lerp(new T.Color(0xE8603A), h).getHex()); bowlMat.emissive = new T.Color(0xFF5A10); bowlMat.emissiveIntensity = h * .6; };
    const offC = coach('c8.how', () => K.hand(bw, 'drag', heat >= 1 ? bk : fu));
    for (;;) {
      const j = await dragTo(bw, [fu, bk], { ok: jj => (heat >= 1 ? jj === 1 : jj === 0), tkeys: ['left', 'right'], wrongSay: jj => (jj === 1 ? 'c8.notyet' : 'g.no1'), land: jj => K.pos([fu, bk][jj]).add(V(0, jj ? .8 : 1.5, 0)) });
      aid = null;
      if (j === 0) { sfx('whoosh'); say('c8.wait'); await K.tween(FAST ? .05 : 1.8, t => { heat = t; paintBowl(t); }); heat = 1; paintBowl(1); await K.tween(.4, t => { bw.position.lerp(V(X, 0, 1.4), t); }); continue; }
      break;
    }
    offC();
    sfx('steam');
    steam.userData.P.forEach((q, i) => { q.life = 1; q.s = 1; q.p.set(bk.position.x + (Math.random() - .5) * 1.2, 1.3 + i * .05, bk.position.z + (Math.random() - .5) * 1); });
    await K.tween(1, t => paintBowl(1 - t));
    bowlMat.color.setHex(0x3E342C); bowlMat.emissiveIntensity = 0;
    await say('c8.zz');
    await say('c8.why');
    await endCard(8);
  }

  // ========== 9 磨亮亮：來回擦，把缽上的黑皮擦掉 ==========
  async function ch9() {
    if (!begin(8)) return;
    // 缽外面一層黑皮：一張 canvas 貼圖，擦到的地方真的被擦掉，下面露出亮亮的青銅
    const cv = document.createElement('canvas'); cv.width = 256; cv.height = 128;
    const cx = cv.getContext('2d'); cx.fillStyle = '#3e342c'; cx.fillRect(0, 0, 256, 128);
    cx.fillStyle = '#2c241e'; for (let k = 0; k < 220; k++) { cx.beginPath(); cx.arc(Math.random() * 256, Math.random() * 128, 1 + Math.random() * 2.4, 0, 7); cx.fill(); }
    const tex = new T.CanvasTexture(cv);
    const r = 1.8;
    const cu = P(WS.cushion(r), 0, 0, .2);
    const bw = W(WS.bowl(r, { color: 0xE0B060 }), 120, 9); P(bw, 0, r * .62, .2);
    const B = bw.userData.j.children[0];
    const skin = new T.Mesh(B.userData.outer.geometry, new T.MeshStandardMaterial({ map: tex, transparent: true, roughness: .9, side: T.FrontSide, polygonOffset: true, polygonOffsetFactor: -2 }));
    skin.scale.setScalar(1.01); B.add(skin);
    void cu;
    frame(benchPts(3.2, 2.6), { elev: 16, elevPt: 20 });
    const meter = K.tag(cu, '<span class="bw-meter"><span class="bw-fill"></span></span>', -.6);
    const count = () => { const d = cx.getImageData(0, 0, 256, 128).data; let n = 0, c = 0; for (let y = 6; y < 72; y += 6) for (let x = 0; x < 256; x += 6) { const u = x / 256; if (u > .25 && u < .75) continue; n++; if (d[(y * 256 + x) * 4 + 3] > 40) c++; } return c / n; };
    const total = count();
    const rub = (u, v, rr = 22) => { cx.save(); cx.globalCompositeOperation = 'destination-out'; [-256, 0, 256].forEach(dx => { cx.beginPath(); cx.arc(u * 256 + dx, (1 - v) * 128, rr, 0, 7); cx.fill(); }); cx.restore(); tex.needsUpdate = true; };
    const at = p => { const rc = new T.Raycaster(); rc.setFromCamera(new T.Vector2(p.x / K.v.w * 2 - 1, -(p.y / K.v.h) * 2 + 1), K.cam); const hit = rc.intersectObject(skin)[0]; return hit && hit.uv; };
    await say('c9.intro');
    say('c9.how');
    const offC = coach('c9.how', () => K.hand(bw, 'wipe'));
    let saidHalf = false, lastSnd = 0;
    await new Promise(res => {
      const after = () => {
        const now = performance.now(); if (now - lastSnd > 90) { lastSnd = now; sfx('scrub'); }
        const done = 1 - count() / total;
        meter.el.querySelector('.bw-fill').style.width = Math.min(100, done / .88 * 100) + '%';
        if (done >= .5 && !saidHalf) { saidHalf = true; say('c9.half'); }
        if (done >= .88) { offK(); K.inputs({}); res(); }
      };
      let down = false;
      K.inputs({ down(p) { down = true; const uv = at(p); if (uv) { rub(uv.x, uv.y); after(); } }, move(p) { if (!down) return; const uv = at(p); if (uv) { rub(uv.x, uv.y); after(); } }, up() { down = false; } });
      const offK = K.keys((k, dn) => { if (!dn || (k !== 'a' && k !== 'd')) return false; const v = .15 + Math.random() * .75; for (let u = -.25; u <= .25; u += .02) rub((u + 1) % 1, v, 16); K.poke(bw.userData.j, .06); after(); return true; });
      winStep = () => { cx.clearRect(0, 0, 256, 128); tex.needsUpdate = true; after(); };
      aid = () => { const c = scr(bw, B.userData.h * (.25 + Math.random() * .5)); c.w = 120; c.h = 40; return { kb: ['a', 'd', 'a', 'd'], ptr: { wipe: c } }; };
    });
    offC(); aid = null;
    skin.visible = false; strike(260); K.poke(bw.userData.j, .4);
    sfx('win');
    await say('c9.done');
    await endCard(9);
  }

  // ========== 10 大缽小缽：敲三個缽找最低的聲音；倒水、磨磨看，水面跳舞 ==========
  async function ch10() {
    if (!begin(9)) return;
    const Bz = [{ k: 'big', r: 1.5, f: 140 }, { k: 'mid', r: 1.1, f: 230 }, { k: 'small', r: .75, f: 370 }];
    const ord = shuffle([0, 1, 2]);
    const sx = PT() ? 2.5 : 3.4;
    const bws = ord.map((bi, p) => { const g = W(WS.bowl(Bz[bi].r), 120, 9); g.userData.bi = bi; P(g, (p - 1) * sx, 0, .6); K.tag(g, Z('c10.' + Bz[bi].k), -.3); K.cap(g, String(p + 1), Bz[bi].r + .6); return g; });
    frame(benchPts(PT() ? 3.8 : 5, 2.6), { elev: 24, elevPt: 32 });
    const play = p => { strike(Bz[ord[p]].f, .22, 3.5); K.poke(bws[p].userData.j, .35); };
    say('c10.intro');
    const heard = new Set();
    await new Promise(res => {
      const tap = p => { if (p < 0) return; play(p); heard.add(p); if (heard.size === 3) { offK(); K.inputs({}); res(); } };
      K.inputs({ up(q) { if (!q.cancel) tap(K.nearest(q, bws, { max: 140, at: o => K.pos(o).add(V(0, .6, 0)) })); } });
      const offK = K.keys((k, dn) => { const i = '123'.indexOf(k); if (dn && i >= 0) { tap(i); return true; } return false; });
      winStep = () => { [0, 1, 2].forEach(tap); };
      aid = () => { const i = [0, 1, 2].find(x => !heard.has(x)); return i != null ? { kb: [String(i + 1)], ptr: { tap: scr(bws[i], .6) } } : null; };
    });
    aid = null;
    await sleep(FAST ? 30 : 1200);
    say('c10.q');
    const right = ord.indexOf(0);
    await tapOne(bws, '123', right, .6);
    clearHints(); K.inputs({}); aid = null;
    play(right); sfx('ok');
    await say('c10.ok');
    await G.next();
    // 倒水、磨磨看
    K.level();
    const bs = bowlSet(1.6, 0, .2);
    const wat = K.cyl(1.25, 1.25, .04, K.clay(0x5CC3E8, { roughness: .2 }), 0, 0, 0, 32); wat.visible = false; bs.B.add(wat); wat.position.y = bs.B.userData.h * .55;
    const jug = W(WS.pitcher()); P(jug, PT() ? 2.4 : 3.4, 0, 1.6);
    const drops = K.dots(16, .08, K.clay(0x5CC3E8)); K.lv.add(drops);
    frame(benchPts(PT() ? 3.6 : 4.4, 3.4), { elev: 34, elevPt: 44 });
    say('c10.water');
    await dragTo(jug, [bs.b], { ok: () => true, key: 'space', land: () => bs.b.position.clone().add(V(.9, 2.2, 0)) });
    aid = null;
    jug.userData.j.rotation.z = .9; sfx('pour'); setTimeout(() => sfx('pour'), 250);
    await K.wait(.6); wat.visible = true; jug.visible = false;
    const tip = K.tag(bs.cu, Z('ui.rubtip'), -.4);
    say('c10.rub');
    let tt = 0;
    K.on(dt => {
      const e = bs.wv.userData.e || 0; tt += dt;
      wat.scale.y = 1 + Math.sin(tt * 30) * e * 6;
      drops.userData.P.forEach(q => { if (q.life <= 0 && e > .85 && Math.random() < .3) { const a = Math.random() * Math.PI * 2; q.life = 1; q.s = 1; q.p.set(bs.b.position.x + Math.cos(a) * 1, bs.b.position.y + wat.position.y, bs.b.position.z + Math.sin(a) * 1); q.v.set(0, 2 + Math.random(), 0); } if (q.life > 0) { q.v.y -= dt * 9; q.p.addScaledVector(q.v, dt); q.life -= dt * 1.2; if (q.p.y < bs.b.position.y + wat.position.y) q.life = 0; } });
      drops.userData.sync();
    });
    const offC = coach('c10.rub', () => K.hand(bs.b, 'circle'));
    const h = await rubBowl(bs, { f0: 196 });
    offC(); K.capOff(tip);
    await say('c10.dance');
    h.stop(); bs.wv.userData.e = 0;
    await say('c10.low');
    sfx('win');
    await say('c10.done');
    await endCard(10);
  }

  // ---------- 結尾：工作檯上一排做好的缽，點了會唱 ----------
  async function finale() {
    if (!begin(10)) { stage.innerHTML = '<div class="chtitle">' + G.Zs('fin.title') + '</div>'; await say('fin.hi'); return; }
    const rs = [.7, 1, 1.3, 1, .7];
    const bws = rs.map((r, i) => { const g = W(WS.bowl(r), 120, 9); P(g, (i - 2) * 2.2, 0, .6); return g; });
    frame(benchPts(5.4, 2), { elev: 22, elevPt: 28 });
    K.inputs({ up(p) { const i = K.nearest(p, bws, { max: 120 }); if (i >= 0) { strike(140 + (1.3 - rs[i]) * 300, .2, 3); K.poke(bws[i].userData.j, .4); } } });
    bws.forEach((g, i) => setTimeout(() => K.poke(g.userData.j, .4), i * 120));
    const c = document.createElement('div'); c.className = 'k3-card'; c.innerHTML = '<div class="chtitle">' + G.Zs('fin.title') + '</div><b>給家長：</b>' + FIN; K.ov.appendChild(c);
    sfx('win');
    await say('fin.hi');
    await say('fin.task');
  }

  const wrapCh = f => async () => { aid = null; winStep = null; wrong = 0; hints = []; await f(); aid = null; winStep = null; };
  G.run({ saveKey: 'bowl-game-v1', stamp: '缽', heroArt: A.bowlSide(), chapters: [ch1, ch2, ch3, ch4, ch5, ch6, ch7, ch8, ch9, ch10].map(wrapCh), finale });
  window.__bw = { win: () => { if (winStep) winStep(); }, aid: () => { try { return aid ? aid() : null; } catch (e) { return null; } } };
})();
