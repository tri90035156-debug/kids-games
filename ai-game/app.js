// 《AI 從哪裡來》3D 版（2026-11-08 第 7 批）：一張方形黏土書桌，中間一台會笑的電腦，每關桌上換道具。
// 共用引擎 engine.js 管流程、配音、注音字幕泡泡、重來鈕；3D 用 kit3d.js、場景在 desk.js。十關，每關一種 3D 動作，相鄰兩關不一樣：
// 1 把工具拖到人偶身上（槌子→手、腳踏車→腳…，最後 AI 晶片→頭）  2 排箭頭步驟，小機器人在桌上的格子裡走  3 拉一根規則拉桿，照片卡經過電腦被蓋章
// 4 把照片卡丟進「是貓／不是貓」兩個籃子  5 點桌上的 ○ 或 ✕ 方塊（電腦猜錯，背後三顆旋鈕會轉）  6 在三排小球之間拉黏土線（神經網路），消息光點跑過去
// 7 按住，照片一張一張倒進電腦上的漏斗  8 把五台電腦拖上時間線  9 點字的積木填空，再按一下 AI 就接一個詞  10 點出 AI 畫錯的三個地方，再選一個願望
// 配音稿一句沒改（tools/content.py 沒動、沒重錄）。測試：?ch=N&fast=1、?fin=1；console：__ai.win()、__ai.aid()、__k.meshes()。
(() => {
  'use strict';
  const { $, stage, Z, say, speak, sleep, shuffle, FAST } = G;
  const K = K3, { T } = K;
  const sfx = n => G.sfx(n);
  const note = i => G.note && G.note(i);
  K.init({ bg: 0xF3EEDF, ground: 0xEFE5D3 });
  if (K.ok) DK.desk(K.scene);
  const V = (x, y, z) => new T.Vector3(x, y, z);
  const W = (o, k = 150, d = 7) => K.wrap(o, k, d);
  const PARENT = ["人類一直在做「延伸身體」的工具。電腦是延伸計算的工具；AI 則想延伸「認東西、聽懂話、做判斷」這類原本要靠人腦的事。", "第一批電子計算機出現在 1940 年代。傳統程式是人把每一步都寫清楚，電腦照做；這一關就是在「寫程式」。機器人＝會動的身體＋當腦袋的電腦；AI 是讓電腦學習的方法，不一定有身體（手機、聊天的 AI 都沒有身體）。可以在家玩「機器人遊戲」：孩子當機器人，家長說「向前兩步、左轉」。", "1970–80 年代流行的「專家系統」就是請專家寫大量規則。規則很難涵蓋所有例外（折耳貓、狐狸），這是後來改走「從例子學習」的重要原因。", "這就是「監督式學習」：人先替資料貼上答案（標註），電腦從大量例子裡自己找出規律。真正的 AI 要看成千上萬張照片。", "訓練時，電腦每猜錯一次，就把內部數以百萬計的「參數」（旋鈕）往能猜對的方向微調一點；重複非常多次，就是「訓練」。", "人工神經網路（1958 年的「感知器」是早期代表）受大腦啟發，但非常簡化。每條連線有個數字叫「權重」，學習就是調整這些數字——像這關最後線條變粗變細。", "2009 年的 ImageNet 資料集約有 1400 萬張標註過的照片；2012 年，研究者用顯示卡（GPU）訓練深層神經網路，辨識正確率大躍進，這是「深度學習」熱潮的起點。", "約 1945 年：ENIAC 等早期電腦佔滿整個房間。1956 年：達特茅斯會議，「人工智慧」這個名詞正式出現。1980 年代：個人電腦進入家庭。2007 年前後：智慧型手機普及。2010 年代起：深度學習；2022 年：聊天機器人 ChatGPT 公開。", "大型語言模型（例如 ChatGPT）讀過大量文字，核心任務是預測「下一個詞」最可能是什麼，一個接一個產生句子；之後再用人類的回饋訓練，讓回答更有用。它沒有真的理解或經驗，所以會說出聽起來很對、其實錯的話。", "AI 會「一本正經地說錯話」或畫出不合理的細節（研究者稱為「幻覺」），也可能學到資料裡的偏見。可以和孩子約定：AI 說的事，重要的要再查證；不把名字、住址告訴 AI。"];
  const FIN = "可以接著聊：①家裡哪些東西用到 AI（地圖導航、相簿搜尋「貓」、語音助理）？②哪些事情適合請 AI 幫忙，哪些應該自己想？③玩「下一個字」接龍，體驗 AI 怎麼說話。</div></div>";
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
  const endCard = n => K.card('<b>給家長：</b>' + PARENT[n - 1]);
  const PT = () => K.portrait();
  let comp = null;
  // 每關：電腦放在書桌後面中間
  function base(o = {}) {
    if (!K.mount()) return false;
    K.level();
    if (o.comp !== false) { comp = W(DK.computer(o.cs || .9), 140, 8); K.add(comp, o.cx || 0, 0, o.cz != null ? o.cz : -3.6); comp.userData.j.children[0].userData.face('happy'); }
    return true;
  }
  const face = k => comp && comp.userData.j.children[0].userData.face(k);
  const deskPts = (y = 0) => (PT() ? [V(-4.3, y, 4.6), V(4.3, y, 4.6), V(-4.3, 2.4, -4.4), V(4.3, 2.4, -4.4)] : [V(-7.2, y, 5.2), V(7.2, y, 5.2), V(-7.2, 2.6, -5.2), V(7.2, 2.6, -5.2)]);
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

  // ========== 1 人愛做工具：把工具拖到人偶身上 ==========
  async function ch1() {
    if (!base({ comp: false })) return;
    const d = W(DK.doll(), 120, 8); K.add(d, 0, 0, -1.6);
    const spots = d.userData.j.children[0].userData.spots;
    const parts = ['hand', 'foot', 'eye', 'ear', 'head'], tools = ['hammer', 'bike', 'glasses', 'phone'];
    parts.forEach((p, i) => K.cap(spots[p], String(i + 1), .3));
    const ts = tools.map((t, i) => { const g = W(DK[t]()); g.userData.j.children[0].scale.setScalar(1.6); K.add(g, (i - 1.5) * (PT() ? 2.2 : 2.8), 0, 3.4); K.tag(g, Z('t.' + t), -.2); return g; });
    const tc = ts.map((g, i) => K.cap(g, 'ABCD'[i], 1.6));
    K.frameTo(PT() ? [V(-4.4, 0, 4.6), V(4.4, 0, 4.6), V(-3, 4.6, -1.6), V(3, 4.6, -1.6)] : [V(-5.8, 0, 4.6), V(5.8, 0, 4.6), V(-3, 4.6, -1.6), V(3, 4.6, -1.6)], { elev: 18, elevPt: 22 });
    say('c1.intro');
    const offC = coach('c1.intro', () => { const i = ts.findIndex(g => !g.userData.done); return i >= 0 ? K.hand(ts[i], 'drag', spots[parts[i]]) : null; });
    let left = 4, picked = -1;
    await new Promise(res => {
      const dm = ts.slice();
      const put = (i, pj, viaDrop) => {
        if (pj !== i) { K.poke(d.userData.j, -.25); sfx('no'); wrong++; say('c1.wrong'); if (wrong >= 2) hints.push(K.halo(spots[parts[i]], 1.4)); return null; }
        clearHints(); ts[i].userData.done = true; dm[i] = null; K.capOff(tc[i]);
        const to = K.pos(spots[parts[i]]).add(V(0, -.3, .4));
        K.poke(d.userData.j, .3); sfx('ok');
        const p = say('c1.' + tools[i]);
        if (!viaDrop) D.land(i, to);
        if (--left === 0) p.then(res);
        return to;
      };
      const near = p => K.nearest(p, parts.slice(0, 4).map(k => spots[k]), { max: 110 });
      const D = K.drag(dm, { h: 0, lift: .6, dropScreen: (i, p) => { const j = near(p); return j >= 0 ? put(i, j, true) : null; } });
      K.inputs({ down: D.down, move: D.move, up(p) { const s = D.sel(); if (s >= 0) { const j = near(p); if (j >= 0) { D.select(-1); put(s, j, false); return; } } D.up(p); } });
      K.keys((k, dn) => { if (!dn) return false; const i = 'abcd'.indexOf(k); if (i >= 0 && !ts[i].userData.done) { picked = i; D.select(i); return true; } const j = '1234'.indexOf(k); if (j >= 0 && picked >= 0) { const i2 = picked; picked = -1; D.select(-1); put(i2, j, false); return true; } return false; });
      winStep = () => ts.forEach((g, i) => { if (!g.userData.done) put(i, i, false); });
      aid = () => { const i = ts.findIndex(g => !g.userData.done); return i >= 0 ? { kb: ['abcd'[i], String(i + 1)], ptr: { drag: [scr(ts[i], .3), scr(spots[parts[i]])] } } : null; };
    });
    offC(); K.inputs({}); aid = null;
    // AI 晶片：拖到頭上
    const chip = W(DK.chip()); chip.userData.j.children[0].scale.setScalar(1.8); K.add(chip, 0, 0, 3.4); K.tag(chip, Z('t.ai'), -.2); K.cap(chip, 'E', 1);
    const hh = K.halo(spots.head, 1.6);
    await say('c1.ask');
    await new Promise(res => {
      const D = K.drag([chip], { h: 0, lift: .6, dropScreen: (_, p) => (K.nearest(p, [spots.head], { max: 150 }) >= 0 ? (setTimeout(res, 500), K.pos(spots.head).add(V(0, .1, 0))) : null) });
      const go = () => { D.land(0, K.pos(spots.head).add(V(0, .1, 0))).then(res); };
      K.inputs({ down: D.down, move: D.move, up(p) { if (D.sel() === 0 && K.nearest(p, [spots.head], { max: 130 }) >= 0) { D.select(-1); go(); return; } D.up(p); } });
      K.keys((k, dn) => { if (dn && (k === 'e' || k === '5')) { go(); return true; } return false; });
      winStep = go; aid = () => ({ kb: ['e'], ptr: { drag: [scr(chip, .2), scr(spots.head)] } });
    });
    K.inputs({}); aid = null; K.haloOff(hh);
    sfx('win'); K.poke(d.userData.j, .5);
    await say('c1.ai');
    await say('c1.why');
    await endCard(1);
  }

  // ========== 2 電腦照著做：排箭頭步驟，小機器人在格子裡走 ==========
  const PUZ = [{ w: 5, h: 3, start: [0, 1], goal: [3, 1], walls: [] }, { w: 5, h: 3, start: [0, 2], goal: [3, 0], walls: [[1, 1], [1, 2]] }];
  const DIR = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };
  const ARROW = d => '<svg viewBox="0 0 40 40"><path d="M20 32V9M10 18l10-10 10 10" fill="none" stroke="currentColor" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" transform="rotate(' + { up: 0, right: 90, down: 180, left: 270 }[d] + ' 20 20)"/></svg>';
  async function ch2() {
    if (!base({ cx: PT() ? 0 : -5, cz: -3.8, cs: .7 })) return;
    await say('c2.intro');
    for (let n = 0; n < PUZ.length; n++) {
      const P = PUZ[n], S = 1.4, ox = -(P.w - 1) / 2 * S, oz = -(P.h - 1) / 2 * S + .6;
      const grid = new T.Group(); K.lv.add(grid);
      const cell = ([x, y]) => V(ox + x * S, 0, oz + y * S);
      for (let y = 0; y < P.h; y++) for (let x = 0; x < P.w; x++) { const t = K.box(S * .92, .06, S * .92, K.clay((x + y) % 2 ? 0xF3EADB : 0xE8DCC8), 0, .03, 0); t.position.copy(cell([x, y])).setY(.03); grid.add(t); }
      P.walls.forEach(w => { const m = DK.wall(); m.position.copy(cell(w)); grid.add(m); });
      const st = W(DK.star()); st.position.copy(cell(P.goal)); grid.add(st);
      const bot = W(DK.robot()); bot.position.copy(cell(P.start)); grid.add(bot);
      // 程式列：一排小方塊（在格子前面）
      const progG = new T.Group(); K.lv.add(progG);
      const prog = [];
      const paint = () => { progG.clear(); prog.forEach((d, i) => { const b = K.box(.5, .12, .5, K.clay(0xF2A23A), ox + i * .62, .06, oz + P.h * S + .2); progG.add(b); const a = new T.Mesh(new T.ConeGeometry(.16, .3, 8), K.clay(0x3B3430)); a.position.copy(b.position).setY(.25); a.rotation.set(Math.PI / 2, 0, { up: 0, right: -Math.PI / 2, down: Math.PI, left: Math.PI / 2 }[d]); progG.add(a); }); };
      K.frameTo(PT() ? [V(-4, 0, 4.2), V(4, 0, 4.2), V(-4, 1.6, -3.2), V(4, 1.6, -3.2)] : [V(-7, 0, 4.2), V(4, 0, 4.2), V(-7, 2.4, -3.6), V(4, 1.6, -3.2)], { elev: 46, elevPt: 56 });
      K.clearBtns();
      const btns = ['left', 'up', 'down', 'right'].map(d => { const b = K.btn({ icon: ARROW(d), cls: 'sm' }); b.dataset.d = d; return b; });
      const bDel = K.btn({ key: 'X', label: 'c2.del', cls: 'sm' }), bRun = K.btn({ key: 'G', label: 'c2.run', cls: 'sm hot' });
      if (n === 0) { await say('c2.robot'); await say('c2.how'); say('c2.erase'); } else say('c2.next');
      // 這題的一種走法（給試玩腳本）
      const SOL = n === 0 ? ['right', 'right', 'right'] : ['up', 'up', 'right', 'right', 'right'];
      const offC = coach(n === 0 ? 'c2.how' : 'c2.next', () => K.hand(st, 'tap'));
      await new Promise(res => {
        let running = false;
        const add = d => { if (running || prog.length >= 10) return; prog.push(d); sfx('tap'); note(prog.length); paint(); };
        const del = () => { if (running) return; prog.pop(); sfx('tap'); paint(); };
        const run = async () => {
          if (running) return;
          if (!prog.length) { K.poke(bot.userData.j, -.3); sfx('no'); return; }
          running = true;
          let [x, y] = P.start, bad = false;
          for (const d of prog) {
            const [dx, dy] = DIR[d], nx = x + dx, ny = y + dy;
            if (nx < 0 || ny < 0 || nx >= P.w || ny >= P.h || P.walls.some(w => w[0] === nx && w[1] === ny)) { bad = true; break; }
            const from = bot.position.clone(), to = cell([nx, ny]);
            await K.tween(.35, k => { bot.position.lerpVectors(from, to, K.ease(k)); bot.position.y = Math.sin(k * Math.PI) * .25; });
            x = nx; y = ny; sfx('bump');
          }
          if (!bad && x === P.goal[0] && y === P.goal[1]) { sfx('win'); K.poke(st.userData.j, .6); face('happy'); await say('c2.ok'); res(); return; }
          K.poke(bot.userData.j, -.5); sfx('no'); face('oops');
          await say('c2.bump');
          face('happy'); bot.position.copy(cell(P.start)); running = false;
        };
        btns.forEach(b => b.addEventListener('click', () => add(b.dataset.d)));
        bDel.addEventListener('click', del); bRun.addEventListener('click', run);
        K.keys((k, dn) => { if (!dn) return false; if (DIR[k]) { add(k); return true; } if (k === 'x' || k === 'back') { del(); return true; } if (k === 'g' || k === 'enter') { run(); return true; } return false; });
        winStep = () => { prog.length = 0; prog.push(...SOL); paint(); run(); };
        aid = () => { if (running) return null; if (prog.length && prog.join() !== SOL.slice(0, prog.length).join()) return { kb: ['x'], ptr: { tapEl: '.k3-btn:nth-child(5)' } }; if (prog.length < SOL.length) { const d = SOL[prog.length]; return { kb: [d], ptr: { tapEl: '.k3-btn:nth-child(' + (['left', 'up', 'down', 'right'].indexOf(d) + 1) + ')' } }; } return { kb: ['g'], ptr: { tapEl: '.k3-btn.hot' } }; };
      });
      offC(); aid = null; K.clearBtns();
      K.lv.remove(grid); K.lv.remove(progG);
    }
    await say('c2.done');
    await endCard(2);
  }

  // ========== 3 規則不夠用：拉一根規則拉桿，照片卡經過電腦被蓋章 ==========
  const RULE_PICS = [['catOrange', true], ['fox', false], ['catFold', true], ['dog', false]];
  const RULES = { a: [true, true, false, false], b: [true, true, true, true] };
  async function ch3() {
    if (!base({ cz: -3.8 })) return;
    await say('c3.intro');
    const lv = ['a', 'b'].map((r, i) => { const g = W(DK.lever(i ? 'pink' : 'gold')); K.add(g, (i ? 1 : -1) * (PT() ? 2.6 : 3.4), 0, -1.6); K.tag(g, Z('c3.r' + r), 1.9); K.cap(g, 'AB'[i], 2.6); return g; });
    const pics = RULE_PICS.map(([id], i) => { const g = W(DK.photo(A.ANIMALS[id]())); g.rotation.x = -.5; K.add(g, (i - 1.5) * (PT() ? 2.1 : 2.6), .7, 2.6); return g; });
    const stamps = [];
    K.frameTo(deskPts(), { elev: 30, elevPt: 40 });
    say('c3.pick');
    const tried = new Set();
    while (tried.size < 2) {
      const right = tried.has('a') ? 1 : 0;
      const offC = coach('c3.pick', () => K.hand(lv[right], 'tap'));
      const k = await new Promise(res => {
        const pick = i => { if (i < 0 || tried.has('ab'[i])) return; offK(); res(i); };
        K.inputs({ up(p) { if (!p.cancel) pick(K.nearest(p, lv, { max: 130, at: o => K.pos(o).add(V(0, 1, 0)) })); } });
        const offK = K.keys((kk, dn) => { const i = 'ab'.indexOf(kk); if (dn && i >= 0) { pick(i); return true; } return false; });
        winStep = () => { offK(); res(right); };
        aid = () => ({ kb: ['ab'[right]], ptr: { tap: scr(lv[right], 1) } });
      });
      offC(); K.inputs({}); aid = null;
      const r = 'ab'[k]; tried.add(r); sfx('tap');
      const arm = lv[k].userData.j.children[0].userData.arm;
      await K.tween(.3, t => { arm.rotation.z = -t * .9; });
      face('think');
      stamps.forEach(s => K.lv.remove(s)); stamps.length = 0;
      for (let i = 0; i < pics.length; i++) {
        await K.wait(.55);
        const guess = RULES[r][i], right2 = guess === RULE_PICS[i][1];
        const s = guess ? DK.oBlock() : DK.xBlock(); s.scale.setScalar(.45); s.position.copy(pics[i].position).add(V(.45, .3, .3)); K.lv.add(s); stamps.push(s);
        K.poke(pics[i].userData.j, right2 ? .35 : -.4); sfx(right2 ? 'pop' : 'no');
      }
      face('oops');
      await K.wait(.4);
      await say(r === 'a' ? 'c3.failA' : 'c3.failB');
      await K.tween(.3, t => { arm.rotation.z = -.9 + t * .9; });
      face('happy');
      if (tried.size < 2) say('c3.other');
    }
    await say('c3.done');
    await endCard(3);
  }

  // ========== 4 你來當老師：把照片卡丟進兩個籃子 ==========
  const TRUTH = { catOrange: true, catBlack: true, catFold: true, catSleep: true, fox: false, dog: false, rabbit: false, owl: false };
  async function ch4() {
    if (!base({ cz: -3.8, cs: .75 })) return;
    await say('c4.intro');
    const bY = W(DK.basket('green'), 120, 8), bN = W(DK.basket('pink'), 120, 8);
    K.add(bY, PT() ? -2.6 : -4, 0, .2); K.add(bN, PT() ? 2.6 : 4, 0, .2);
    K.tag(bY, Z('c4.yes'), 1.2); K.tag(bN, Z('c4.no'), 1.2); K.cap(bY, '←', 1.9); K.cap(bN, '→', 1.9);
    // 電腦旁邊的學習條
    const meter = K.box(.01, .2, .3, K.clay(0xF2A23A), 0, 2.4, -3.4); meter.position.x = -1.4; K.lv.add(meter);
    K.frameTo(deskPts(), { elev: 32, elevPt: 42 });
    say('c4.how');
    const order = shuffle(Object.keys(TRUTH));
    const pile = [0, 0];
    for (let n = 0; n < order.length; n++) {
      const id = order[n];
      const card = W(DK.photo(A.ANIMALS[id](), 1.5)); card.rotation.x = -.7; K.add(card, 0, .8, 3.4); K.poke(card.userData.j, .5); sfx('pop');
      const want = TRUTH[id] ? 0 : 1, bins = [bY, bN];
      const offC = coach('c4.how', () => K.hand(card, 'drag', bins[want]));
      await new Promise(res => {
        const judge = (b, viaDrop) => {
          if (b !== want) { K.poke(bins[b].userData.j, -.3); sfx('no'); wrong++; say('c4.wrong'); if (wrong >= 2) hints.push(K.halo(bins[want], 2.6)); if (wrong >= 3) setTimeout(() => judge(want, false), 300); return null; }
          clearHints();
          const to = bins[b].position.clone().add(V((pile[b] % 3 - 1) * .4, .9 + Math.floor(pile[b] / 3) * .12, 0)); pile[b]++;
          K.poke(bins[b].userData.j, .35); sfx('ok');
          if (!viaDrop) D.land(0, to).then(res); else setTimeout(res, 350);
          return to;
        };
        const D = K.drag([card], { h: 0, lift: .8, drop: (_, p) => { const d0 = p.distanceTo(bY.position), d1 = p.distanceTo(bN.position); return Math.min(d0, d1) < 2.6 ? judge(d0 < d1 ? 0 : 1, true) : null; } });
        K.inputs({ down: D.down, move: D.move, up(p) { if (D.sel() === 0 || K.nearest(p, [card], { max: 70 }) < 0) { const b = K.nearest(p, bins, { max: 130, at: o => K.pos(o).add(V(0, .6, 0)) }); if (b >= 0) { D.select(-1); judge(b, false); return; } } D.up(p); } });
        const offK = K.keys((k, dn) => { if (!dn) return false; if (k === 'left' || k === 'a') { offK(); judge(0, false); return true; } if (k === 'right' || k === 'b') { offK(); judge(1, false); return true; } return false; });
        winStep = () => judge(want, false);
        aid = () => ({ kb: [want ? 'right' : 'left'], ptr: { drag: [scr(card), scr(bins[want], .6)] } });
      });
      offC(); K.inputs({}); aid = null;
      card.rotation.x = -1.4;
      meter.scale.x = 1; meter.geometry.dispose(); meter.geometry = new T.BoxGeometry(Math.max(.01, 2.8 * (n + 1) / order.length), .2, .3); meter.position.x = -1.4 + 1.4 * (n + 1) / order.length;
      if (id === 'owl') await say('c4.owl');
    }
    sfx('win'); face('happy');
    await say('c4.done');
    await endCard(4);
  }

  // ========== 5 猜錯了再改：點 ○ 或 ✕；猜錯時電腦背後的旋鈕會轉 ==========
  const GUESS = [['catBlack', true], ['fox', true], ['dog', false], ['owl', true], ['catFold', true]];
  async function ch5() {
    if (!base({ cz: -2.4, cs: 1.1 })) return;
    comp.rotation.y = .5;
    const knobs = comp.userData.j.children[0].userData.knobs;
    const pic = new T.Group(); K.add(pic, PT() ? 0 : -3.8, .6, PT() ? 2.4 : .8);
    const bubble = new T.Group(); K.add(bubble, .4, 3.6, -2.2);
    const bO = W(DK.oBlock()), bX = W(DK.xBlock()); K.add(bO, PT() ? -2.2 : 2.2, 0, 3.4); K.add(bX, PT() ? 2.2 : 4.8, 0, 3.4); K.cap(bO, 'O', 1.5); K.cap(bX, 'X', 1.5);
    K.frameTo(deskPts(), { elev: 26, elevPt: 34 });
    await say('c5.intro');
    for (const [id, guess0] of GUESS) {
      let guess = guess0;
      pic.clear(); const ph = DK.photo(A.ANIMALS[id](), 1.8); ph.rotation.x = -.4; pic.add(ph); K.poke(pic, .3);
      for (;;) {
        bubble.clear(); const g = guess ? DK.oBlock() : DK.xBlock(); g.scale.setScalar(.6); bubble.add(g); bubble.add(K.ball(.6, K.clay(0xFFFBF4), 0, .4, -.2, 12));
        face('think'); sfx('beep');
        const right = guess === TRUTH[id];
        const k = await tapOne([bO, bX], 'ox', right ? 0 : 1, .6, 'c5.look');
        clearHints(); K.inputs({}); aid = null;
        K.poke((k ? bX : bO).userData.j, .4);
        if (right) { face('happy'); sfx('ok'); await say('c5.right'); break; }
        face('oops'); sfx('no');
        await say('c5.fix');
        await K.tween(.9, t => knobs.forEach((kn, j) => { kn.rotation.z = (kn.userData.a || 0) + t * (1.5 + j); }));
        knobs.forEach((kn, j) => { kn.userData.a = (kn.userData.a || 0) + 1.5 + j; });
        sfx('tap');
        guess = !guess;
        await say('c5.again');
      }
    }
    await say('c5.done');
    await endCard(5);
  }

  // ========== 6 學大腦連一連：在三排小球之間拉黏土線 ==========
  async function ch6() {
    if (!base({ comp: false })) return;
    await say('c6.intro');
    const PTm = PT(), sx = PTm ? 3 : 4.2;
    const NS = [[-sx, -2.2, 'c6.ear'], [-sx, 0, 'c6.whisker'], [-sx, 2.2, 'c6.fur'], [0, -1.1], [0, 1.1], [sx, 0, 'c6.cat']];
    const L = [0, 0, 0, 1, 1, 2];
    const nodes = NS.map(([x, z, lab], i) => { const g = W(DK.node(i === 5 ? 'pink' : L[i] === 1 ? 'blue' : 'gold', i === 5 ? .55 : .4)); K.add(g, x, 0, z); if (lab) K.tag(g, Z(lab), i === 5 ? 1.5 : 1.2); return g; });
    nodes.forEach((g, i) => K.cap(g, 'abcdef'[i], 1.1));
    const lines = new T.Group(); K.lv.add(lines);
    const conn = [];
    const has = (a, b) => conn.some(c => c[0] === a && c[1] === b);
    const complete = () => [0, 1, 2].every(a => [3, 4].some(h => has(a, h) && has(h, 5)));
    const tube = (a, b, m) => { const p = K.pos(nodes[a]).setY(.45), q = K.pos(nodes[b]).setY(.45); const mid = p.clone().lerp(q, .5); mid.y += .5; return new T.Mesh(new T.TubeGeometry(new T.QuadraticBezierCurve3(p, mid, q), 16, .07, 6, false), m); };
    const lineMat = K.clay(0x8E2A1A);
    K.frameTo(PTm ? [V(-4, 0, 3.4), V(4, 0, 3.4), V(-4, 1, -3.2), V(4, 1, -3.2)] : [V(-5.6, 0, 3.4), V(5.6, 0, 3.4), V(-5.6, 1, -3.2), V(5.6, 1, -3.2)], { elev: 50, elevPt: 60 });
    await say('c6.ai');
    say('c6.how');
    let from = -1, saidMore = false, hl = null, tmp = null;
    const mark = () => { if (hl) K.haloOff(hl); hl = from >= 0 ? K.halo(nodes[from], 1.4) : null; };
    const offC = coach('c6.how', () => K.hand(nodes[0], 'drag', nodes[3]));
    await new Promise(res => {
      const connect = (a, b) => {
        if (L[a] > L[b]) [a, b] = [b, a];
        if (L[b] !== L[a] + 1 || has(a, b)) return false;
        conn.push([a, b]); lines.add(tube(a, b, lineMat));
        K.poke(nodes[a].userData.j, .3); K.poke(nodes[b].userData.j, .3); sfx('pop'); note(conn.length);
        if (complete()) { res(); }
        else if (!saidMore && conn.some(c => c[1] === 5)) { saidMore = true; say('c6.more'); }
        return true;
      };
      const pickN = p => K.nearest(p, nodes, { max: 70, at: o => K.pos(o).add(V(0, .4, 0)) });
      let down = null;
      K.inputs({
        down(p) { const i = pickN(p); down = { i, x: p.x, y: p.y }; if (i >= 0 && from >= 0 && from !== i) { if (connect(from, i)) { from = -1; mark(); down = null; return; } } if (i >= 0) { from = i; mark(); } },
        move(p) { if (!down || down.i < 0) return; if (tmp) { lines.remove(tmp); tmp.geometry.dispose(); tmp = null; } const g = K.ground(p, .45); if (!g) return; const a = K.pos(nodes[down.i]).setY(.45); const mid = a.clone().lerp(g, .5); mid.y += .4; tmp = new T.Mesh(new T.TubeGeometry(new T.QuadraticBezierCurve3(a, mid, g), 12, .05, 6, false), K.clay(0xF2A23A)); lines.add(tmp); },
        up(p) { if (tmp) { lines.remove(tmp); tmp.geometry.dispose(); tmp = null; } if (!down) return; const i = pickN(p); if (down.i >= 0 && i >= 0 && i !== down.i && connect(down.i, i)) { from = -1; mark(); } down = null; },
      });
      let kfrom = -1;
      K.keys((k, dn) => { if (!dn) return false; const i = 'abcdef'.indexOf(k); if (i < 0) return false; if (kfrom >= 0 && kfrom !== i) { connect(kfrom, i); kfrom = -1; from = -1; mark(); } else { kfrom = i; from = i; mark(); } return true; });
      const NEED = [[0, 3], [1, 3], [2, 4], [3, 5], [4, 5]];
      winStep = () => NEED.forEach(([a, b]) => { if (!has(a, b)) connect(a, b); });
      aid = () => { const nx = NEED.find(([a, b]) => !has(a, b)); return nx ? { kb: ['abcdef'[nx[0]], 'abcdef'[nx[1]]], ptr: { drag: [scr(nodes[nx[0]], .4), scr(nodes[nx[1]], .4)] } } : null; };
    });
    offC(); K.inputs({}); aid = null; from = -1; mark();
    // 消息光點沿著線跑
    sfx('win');
    const dots = K.dots(conn.length, .14, K.clay(0xF2C14E)); K.lv.add(dots);
    await K.tween(1.4, t => { conn.forEach((c, i) => { const q = dots.userData.P[i]; const tt = L[c[0]] === 0 ? Math.min(1, t * 2) : Math.max(0, t * 2 - 1); q.life = 1; q.s = 1; q.p.lerpVectors(K.pos(nodes[c[0]]).setY(.9), K.pos(nodes[c[1]]).setY(.9), tt); }); dots.userData.sync(); });
    K.lv.remove(dots); K.poke(nodes[5].userData.j, .6);
    await say('c6.go');
    lines.children.forEach(l => l.scale.setScalar(1)); lines.children.forEach(l => { const s = Math.random() < .5 ? 1.8 : .5; l.geometry.dispose(); const pts = l.geometry; void pts; l.scale.set(1, 1, 1); l.material = s > 1 ? K.clay(0xC0392B) : K.clay(0xE8B9A8); });
    await say('c6.done');
    await endCard(6);
  }

  // ========== 7 例子要很多：按住，照片倒進電腦上的漏斗 ==========
  async function ch7() {
    if (!base({ cz: -1.6, cs: 1.1 })) return;
    const fun = K.add(DK.funnel(), 0, 2.4, -1.6);
    const cnt = K.tag(comp, '0', 3.4);
    const fly = K.dots(20, .3, K.clay(0xFFFBF4)); K.lv.add(fly);
    const tests = new T.Group(); K.add(tests, 0, 0, 2.8);
    K.frameTo(deskPts(), { elev: 22, elevPt: 30 });
    await say('c7.intro');
    const hb = K.btn({ key: '␣', label: 'c7.feed', cls: 'hot' });
    say('c7.how');
    let p = 0, down = false, finger = false;
    K.on(dt => {
      fly.userData.P.forEach(q => { if (q.life > 0) { q.p.y -= dt * 4; q.life -= dt * 1.2; if (q.p.y < 2.6) q.life = 0; } });
      if ((down || finger) && Math.random() < .5) { const q = fly.userData.P.find(x => x.life <= 0); if (q) { q.life = 1; q.s = 1; q.p.set((Math.random() - .5) * 1.4, 5.4, -1.6 + (Math.random() - .5)); } }
      fly.userData.sync();
    });
    for (;;) {
      const offC = coach('c7.how', () => K.hand(fun, 'hold'));
      await new Promise(res => {
        let was = false;
        const iv = setInterval(() => {
          const on = down || finger; hb.classList.toggle('on', on);
          if (on) { was = true; p = Math.min(1, p + .03 / (FAST ? .4 : 4.5)); cnt.el.textContent = Math.round(Math.pow(10, p * 6.3)).toLocaleString('en-US'); if (Math.random() < .3) sfx('pop'); }
          if ((was && !on) || p >= 1) { clearInterval(iv); res(); }
        }, 30);
        hb.onpointerdown = e => { e.preventDefault(); down = true; };
        addEventListener('pointerup', () => { down = false; });
        K.inputs({ down(q) { if (K.nearest(q, [comp, fun], { max: 160, at: o => K.pos(o).add(V(0, 1.2, 0)) }) >= 0) finger = true; }, up() { finger = false; } });
        K.keys((k, dn) => { if (k === 'space') { down = dn; return true; } return false; });
        winStep = () => { p = 1; };
        aid = () => ({ kb: { hold: 'space', ms: FAST ? 500 : 5000 }, ptr: { hold: scr(comp, 1.4), ms: FAST ? 500 : 5000 } });
      });
      offC(); aid = null; down = false; finger = false; hb.classList.remove('on');
      // 考試：越多例子，猜錯越少
      const nW = p >= .95 ? 0 : p >= .6 ? 1 : p >= .3 ? 2 : 3;
      const ids = shuffle(Object.keys(TRUTH)).slice(0, 6), bad = new Set(shuffle([0, 1, 2, 3, 4, 5]).slice(0, nW));
      tests.clear();
      for (let i = 0; i < 6; i++) {
        await K.wait(.26);
        const ph = DK.photo(A.ANIMALS[ids[i]](), .9); ph.rotation.x = -.6; ph.position.set((i - 2.5) * (PT() ? 1.1 : 1.4), .6, 0); tests.add(ph);
        const mk = bad.has(i) ? DK.xBlock() : DK.oBlock(); mk.scale.setScalar(.3); mk.position.set((i - 2.5) * (PT() ? 1.1 : 1.4) + .3, .9, .4); tests.add(mk);
        sfx(bad.has(i) ? 'no' : 'pop');
      }
      if (!nW) { sfx('win'); face('happy'); K.clearBtns(); await say('c7.ok'); break; }
      face('oops');
      await say('c7.few');
      face('happy');
    }
    await say('c7.done');
    await endCard(7);
  }

  // ========== 8 電腦長大了：把五台電腦拖上時間線 ==========
  async function ch8() {
    if (!base({ comp: false })) return;
    const MK = [() => DK.bigComputer(), () => DK.people(), () => DK.desktop(), () => DK.phone(), () => DK.chatPhone()];
    const sp = PT() ? 1.9 : 2.6;
    K.add(K.box(sp * 5, .14, .5, DK.mat('deskD')), 0, .07, -2);
    const ar = new T.Mesh(new T.ConeGeometry(.35, .7, 10), DK.mat('deskD')); ar.rotation.z = -Math.PI / 2; K.add(ar, sp * 2.6, .14, -2);
    const slots = [0, 1, 2, 3, 4].map(i => V((i - 2) * sp, .14, -2));
    slots.forEach((s, i) => { K.add(K.cyl(.6, .6, .06, DK.mat('white'), 0, 0, 0, 20), s.x, .16, s.z); K.cap(K.add(new T.Group(), s.x, .2, s.z), String(i + 1), .1); });
    K.tag(K.add(new T.Group(), -sp * 2, .2, -3.2), Z('c8.old'), 0); K.tag(K.add(new T.Group(), sp * 2, .2, -3.2), Z('c8.now'), 0);
    const ord = shuffle([0, 1, 2, 3, 4]);
    const gs = ord.map((k, j) => { const g = W(MK[k]()); g.userData.k = k; g.userData.j.children[0].scale.multiplyScalar(PT() ? .7 : .85); K.add(g, PT() ? (j < 3 ? (j - 1) * 2.8 : (j - 3.5) * 2.8) : (j - 2) * 2.6, 0, PT() ? (j < 3 ? 1.6 : 3.6) : 2.6); K.tag(g, Z('c8.l' + (k + 1)), -.2); return g; });
    const caps = gs.map((g, j) => K.cap(g, 'ABCDE'[j], 2.4));
    K.frameTo(deskPts(), { elev: 34, elevPt: 46 });
    say('c8.intro');
    let left = 5, picked = -1;
    const offC = coach('c8.intro', () => { const i = gs.findIndex(g => !g.userData.done); return i >= 0 ? K.hand(gs[i], 'drag', slots[gs[i].userData.k]) : null; });
    await new Promise(res => {
      const dm = gs.slice();
      const put = (i, t, viaDrop) => {
        const g = gs[i];
        if (g.userData.k !== t) { K.poke(g.userData.j, -.35); sfx('no'); wrong++; say('g.order'); if (wrong >= 2) hints.push(K.halo(slots[g.userData.k], 1.4)); return null; }
        clearHints(); g.userData.done = true; dm[i] = null; K.capOff(caps[i]);
        const to = slots[t].clone(); sfx('ok');
        if (!viaDrop) D.land(i, to);
        const p = say('c8.n' + (t + 1));
        if (--left === 0) p.then(res);
        return to;
      };
      const near = p => K.nearest(p, slots, { max: 90 });
      const D = K.drag(dm, { h: 0, lift: .7, drop: (i, p) => { const t = near(K.v.toScreen(p)); return t >= 0 ? put(i, t, true) : null; } });
      K.inputs({ down: D.down, move: D.move, up(p) { const s = D.sel(); if (s >= 0) { const t = near(p); if (t >= 0) { D.select(-1); put(s, t, false); return; } } D.up(p); } });
      K.keys((k, dn) => { if (!dn) return false; const i = 'abcde'.indexOf(k); if (i >= 0 && !gs[i].userData.done) { picked = i; D.select(i); return true; } const t = '12345'.indexOf(k); if (t >= 0 && picked >= 0) { const i2 = picked; picked = -1; D.select(-1); put(i2, t, false); return true; } return false; });
      winStep = () => gs.forEach((g, i) => { if (!g.userData.done) put(i, g.userData.k, false); });
      aid = () => { const i = gs.findIndex(g => !g.userData.done); return i >= 0 ? { kb: ['abcde'[i], String(gs[i].userData.k + 1)], ptr: { drag: [scr(gs[i], .3), scr(slots[gs[i].userData.k])] } } : null; };
    });
    offC(); K.inputs({}); aid = null;
    sfx('win');
    await say('c8.done');
    await endCard(8);
  }

  // ========== 9 猜下一個字：點字的積木填空；再按一下，AI 就接一個詞 ==========
  async function ch9() {
    if (!base({ cz: -3.6, cs: .8 })) return;
    K.frameTo(deskPts(), { elev: 28, elevPt: 38 });
    await say('c9.intro');
    for (let r = 1; r <= 3; r++) {
      const sent = K.tag(K.add(new T.Group(), 0, .4, -.6), Z('c9.s' + r) + ' <span class="ai-blank">？</span>', 0);
      const ord = shuffle(['a', 'b', 'c']);
      const bs = ord.map((x, i) => { const g = W(DK.block(x === 'a' ? 'white' : 'white')); K.add(g, (i - 1) * (PT() ? 2.4 : 3), 0, 2.6); K.tag(g, Z('c9.' + x + r), .5); K.cap(g, 'ABC'[i], 1.4); return g; });
      if (r === 1) await say('c9.you');
      say('c9.q' + r);
      const right = ord.indexOf('a');
      const offC = coach('c9.q' + r, () => K.hand(bs[right], 'tap'));
      await tapOne(bs, 'abc', right, .4);
      offC(); clearHints(); K.inputs({}); aid = null;
      const g = bs[right], from = g.position.clone(), to = V(0, 0, .6);
      await K.tween(.45, t => { g.position.lerpVectors(from, to, K.ease(t)); g.position.y = Math.sin(t * Math.PI) * 1.2; });
      sent.el.querySelector('.ai-blank').innerHTML = Z('c9.a' + r);
      sfx('ok'); K.poke(g.userData.j, .4);
      await say('c9.ok');
      await K.wait(.3);
      bs.forEach(b => K.lv.remove(b)); sent.el.remove();
      K.ov.querySelectorAll('.k3-tag,.k3-kc').forEach(e => e.remove());
    }
    // AI 說故事：每按一下，猜下一個詞
    let NW = 0; while (TX['st.' + NW + '.0']) NW++;
    const story = K.tag(K.add(new T.Group(), 0, .4, 1.4), '', 0); story.el.classList.add('ai-story');
    const hb = K.btn({ key: '␣', label: 'c9.tap', cls: 'hot' });
    await say('c9.gen');
    for (let n = 0; n < NW; n++) {
      await new Promise(res => {
        const go = () => { offK(); hb.onclick = null; K.inputs({}); res(); };
        hb.onclick = go;
        K.inputs({ up(p) { if (!p.cancel) go(); } });
        const offK = K.keys((k, dn) => { if (dn && (k === 'space' || k === 'enter')) { go(); return true; } return false; });
        winStep = go; aid = () => ({ kb: ['space'], ptr: { tapEl: '.k3-btn.hot' } });
      });
      aid = null;
      face('think'); sfx('beep');
      const cands = shuffle([0, 1, 2]).map((j, i) => { const b = DK.block(j === 0 ? 'gold' : 'white'); b.scale.setScalar(.6); b.position.set((i - 1) * 1.6, 3.8, -3.2); K.lv.add(b); return b; });
      await K.wait(.35);
      cands.forEach(b => K.lv.remove(b));
      story.el.insertAdjacentHTML('beforeend', Z('st.' + n + '.0'));
      sfx('pop'); face('happy'); K.poke(comp.userData.j, .2);
    }
    K.clearBtns();
    await say('c9.story');
    await say('c9.done');
    await endCard(9);
  }

  // ========== 10 AI 也會出錯：點出三個怪怪的地方，再選一個願望 ==========
  async function ch10() {
    if (!base({ comp: false })) return;
    const PTm = PT();
    const cat = W(DK.cat(2)); K.add(cat, PTm ? -2 : -4, 0, 1.6);
    const tree = W(DK.fishTree()); K.add(tree, PTm ? 2 : 0, 0, -2);
    const house = W(DK.oddHouse()); K.add(house, PTm ? -1.6 : 4, 0, PTm ? -2.6 : 0);
    const bugs = [cat, tree, house], found = new Set();
    K.frameTo(deskPts(), { elev: 30, elevPt: 40 });
    say('c10.intro');
    const offC = coach('c10.intro', () => { const i = [0, 1, 2].find(x => !found.has(x)); return i != null ? K.hand(bugs[i], 'tap') : null; });
    await new Promise(res => {
      const hit = i => { if (i < 0 || found.has(i)) { sfx('tap'); return; } found.add(i); const r = new T.Mesh(new T.TorusGeometry(1.3, .07, 6, 32), K.clay(0xC0392B)); r.rotation.x = -Math.PI / 2; r.position.copy(bugs[i].position).setY(.1); K.lv.add(r); K.poke(bugs[i].userData.j, .5); sfx('ok'); say('c10.f' + (i + 1)).then(() => { if (found.size === 3) res(); }); };
      K.inputs({ up(p) { if (!p.cancel) hit(K.nearest(p, bugs, { max: 140, at: o => K.pos(o).add(V(0, 1, 0)) })); } });
      K.keys((k, dn) => { const i = '123'.indexOf(k); if (dn && i >= 0) { hit(i); return true; } return false; });
      winStep = () => { [0, 1, 2].forEach(hit); };
      aid = () => { const i = [0, 1, 2].find(x => !found.has(x)); return i != null ? { kb: [String(i + 1)], ptr: { tap: scr(bugs[i], 1) } } : null; };
    });
    offC(); K.inputs({}); aid = null;
    sfx('win');
    await say('c10.why');
    await say('c10.you');
    K.level();
    const ws = [0, 1, 2, 3].map(i => { const g = W(DK.wish(i)); g.userData.j.children[0].scale.setScalar(1.4); K.add(g, PTm ? (i % 2 ? 1.8 : -1.8) : (i - 1.5) * 3, 0, PTm ? (i < 2 ? -.4 : 2.6) : 1); K.tag(g, Z('c10.w' + (i + 1)), -.2); K.cap(g, 'ABCD'[i], 2); return g; });
    K.frameTo(deskPts(), { elev: 30, elevPt: 40 });
    say('c10.wish');
    const k = await new Promise(res => {
      K.inputs({ up(p) { const i = K.nearest(p, ws, { max: 130, at: o => K.pos(o).add(V(0, .8, 0)) }); if (i >= 0) res(i); } });
      K.keys((kk, dn) => { const i = 'abcd'.indexOf(kk); if (dn && i >= 0) { res(i); return true; } return false; });
      winStep = () => res(0); aid = () => ({ kb: ['a'], ptr: { tap: scr(ws[0], .8) } });
    });
    K.inputs({}); aid = null;
    K.poke(ws[k].userData.j, .6); sfx('ok');
    await say('c10.r' + (k + 1));
    await say('c10.done');
    await endCard(10);
  }

  // ---------- 結尾 ----------
  async function finale() {
    if (!base({ cs: 1.2 })) { stage.innerHTML = '<div class="chtitle">' + G.Zs('fin.title') + '</div>'; await say('fin.hi'); return; }
    const row = [DK.hammer(), DK.chip(), DK.photo(A.ANIMALS.catOrange()), DK.chatPhone(), DK.wish(3)].map((o, i) => { const g = W(o); g.userData.j.children[0].scale.multiplyScalar(1.3); K.add(g, (i - 2) * 2.4, i === 2 ? .7 : 0, 2.6); return g; });
    K.frameTo(deskPts(), { elev: 24, elevPt: 32 });
    K.inputs({ up(p) { const i = K.nearest(p, row, { max: 110 }); if (i >= 0) { K.poke(row[i].userData.j, .5); note(i + 3); } } });
    row.forEach((g, i) => setTimeout(() => K.poke(g.userData.j, .5), i * 120));
    const c = document.createElement('div'); c.className = 'k3-card'; c.innerHTML = '<div class="chtitle">' + G.Zs('fin.title') + '</div><b>給家長：</b>' + FIN; K.ov.appendChild(c);
    sfx('win');
    await say('fin.hi');
    await say('fin.task');
  }

  const wrapCh = f => async () => { aid = null; winStep = null; wrong = 0; hints = []; await f(); aid = null; winStep = null; };
  G.run({ saveKey: 'ai-game-v1', stamp: 'AI', heroArt: A.computer('happy'), chapters: [ch1, ch2, ch3, ch4, ch5, ch6, ch7, ch8, ch9, ch10].map(wrapCh), finale });
  window.__ai = { win: () => { if (winStep) winStep(); }, aid: () => { try { return aid ? aid() : null; } catch (e) { return null; } } };
})();
