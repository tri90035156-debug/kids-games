// 《颱風怎麼來？》3D 版（2026-11-08 第 5 批）：一片方形的黏土海、立體的臺灣島；看路線的關卡鏡頭拉遠，變成一張黏土東亞地圖。
// 共用引擎 engine.js 管流程、配音、注音字幕泡泡、重來鈕；3D 用 kit3d.js、場景在 ty3d.js。十關，每關一種 3D 動作，相鄰兩關不一樣：
// 1 點颱風叫醒它  2 按住太陽，海變暖、水蒸氣往上飄、雲長成颱風  3 讓地球轉起來看風往右彎，再用手指逆時針畫圈
// 4 點颱風的眼、眼牆、雨帶（可以放臺灣比大小）  5 在水面上拖出水流方向，樹葉漂去碰星星  6 拉大拉小太平洋高氣壓（一個半透明的圓頂），看颱風的路怎麼變
// 7 防颱小任務：把東西拖到「好」或「不好」  8 按「繼續走」，颱風在地圖上往北轉  9 拖著颱風去冷海、爬上陸地，力氣變成零  10 點 3D 答案（兩個小東西選一個）
// 配音稿一句沒改（tools/content.py 的 SAY 沒動）。每關：故事一句一句唸 → 要做的事 → 互動 → 做完 → 「為什麼？」＋「繼續」。
// 測試：?ch=N&fast=1、?fin=1；console：__ty.win()、__ty.aid()、__k.meshes()。
(() => {
  'use strict';
  const { $, stage, foot, Z, say, speak, sleep, waitAction, stopVoice, FAST } = G;
  const K = K3, { T } = K;
  const sfx = n => G.sfx(n);
  const note = i => G.note && G.note(i);
  K.init({ bg: 0xEEF4F6, ground: 0xCFE5F4 });
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

  // ---------- 一關的骨架 ----------
  async function chapter(n, build) {
    if (!K.mount()) return;
    K.level();
    const k = s => 'c' + n + '.' + s;
    let fin;
    const finished = new Promise(r => { fin = r; });
    const c = { n, k, live: false, done: false, say: s => say(k(s)),
      finish() { if (c.done) return; c.done = true; c.live = false; sfx('win'); fin(); }, offC: null };
    build(c);
    const story = Object.keys(TX).filter(x => new RegExp('^c' + n + '\\.s\\d$').test(x));
    for (const s of story) await say(s);
    c.live = true;
    say(k('task'));
    await finished;
    if (c.offC) c.offC();
    K.inputs({});
    await say(k('ok'));
    await outro(n);
  }
  // 做完：「為什麼？」（一句一句唸）＋「繼續」
  async function outro(n) {
    const why = Object.keys(TX).filter(x => new RegExp('^c' + n + '\\.w\\d$').test(x));
    foot.innerHTML = (why.length ? '<button class="big alt ty-why" id="why">' + Z('ui.why') + '</button>' : '') + '<button class="big" id="nx">' + Z('ui.next') + ' ▶</button>';
    let tok = 0;
    if (why.length) $('#why').addEventListener('click', async () => { const my = ++tok; sfx('tap'); for (const w of why) { if (my !== tok) return; await say(w); } });
    await waitAction([{ el: $('#nx'), keys: ['enter', 'space'] }]);
    tok++; stopVoice(); sfx('tap'); foot.innerHTML = '';
  }
  // 方形海：手機直的時候窄一點、深一點，畫面才不會空空的
  const SEA = () => (K.portrait() ? [11.5, 15] : [16, 12]);
  const seaPts = (y = 0) => { const [w, d] = SEA(); return [V(-w / 2, 0, d / 2), V(w / 2, 0, d / 2), V(-w / 2, y, -d / 2), V(w / 2, y, -d / 2)]; };
  const sea = () => K.add(TY.seaSquare(...SEA()), 0, 0, 0);
  // 近看的場景：方形海＋立體臺灣（臺灣在左邊）
  function nearScene(tx = -3.4) {
    sea();
    const tw = K.add(TY.taiwan(), tx, 0, 0);
    return tw;
  }
  const spinAll = list => K.on(dt => list.forEach(t => t.userData.step(dt)));

  // ========== 1 嗨！這是颱風：點颱風三下叫醒它 ==========
  const ch1 = () => chapter(1, c => {
    nearScene(-4.2);
    const ty = W(TY.typhoon(2.2, { speed: .15 }), 120, 8); K.add(ty, K.portrait() ? 2.2 : 2.6, .5, K.portrait() ? -3 : -.2); ty.scale.setScalar(.7);
    const t0 = ty.userData.j.children[0]; spinAll([t0]);
    K.tag(ty, Z('lab.name'), 1.2);
    K.frameTo(seaPts(), { elev: 46, elevPt: 56 });
    let n = 0;
    const poke = () => {
      if (!c.live || n >= 3) return;
      n++; t0.userData.speed = .15 + n * .9; ty.scale.setScalar(.7 + n * .12); K.poke(ty.userData.j, .4); sfx('pop'); note(3 + n);
      if (n < 3) c.say('more'); else c.finish();
    };
    K.inputs({ up(p) { if (!p.cancel && K.nearest(p, [ty], { max: 150 }) >= 0) poke(); } });
    K.keys((key, dn) => { if (dn && (key === 'space' || key === 'enter')) { poke(); return true; } return false; });
    c.offC = coach('c1.task', () => K.hand(ty, 'tap'));
    winStep = () => { while (n < 3 && !c.done) { c.live = true; poke(); } };
    aid = () => (c.live ? { kb: ['space'], ptr: { tap: scr(ty) } } : null);
  });

  // ========== 2 颱風怎麼生出來：按住太陽，海變暖、雲長成颱風 ==========
  const ch2 = () => chapter(2, c => {
    const sq = sea();
    const seaM = sq.material = sq.material.clone();
    const sun = W(TY.sun(1)); K.add(sun, -4.6, 4.6, -2.6);
    const temp = K.tag(sun, '24°C', 1.5);
    const vap = K.dots(30, .16, new T.MeshStandardMaterial({ color: 0xffffff, transparent: true, opacity: .85 })); K.lv.add(vap);
    const clouds = new T.Group(); K.add(clouds, 1.2, 2.6, 0); [[-1, 0, 0, .7], [-.3, .2, .2, .9], [.5, 0, -.2, .8], [1.1, -.1, .1, .6], [0, .6, 0, .7]].forEach(([x, y, z, r]) => clouds.add(K.ball(r, TY.mat('cloud'), x, y, z, 14))); clouds.scale.setScalar(.01);
    const ty = TY.typhoon(2.4, { speed: 1.4 }); K.add(ty, 1.2, .6, 0); ty.scale.setScalar(.01); spinAll([ty]);
    K.frameTo(seaPts().concat([V(-4.6, 5.6, -2.6)]), { elev: 30, elevPt: 40 });
    const hb = K.btn({ key: 'H', icon: '<svg viewBox="0 0 40 40"><circle cx="20" cy="20" r="9" fill="#fff"/><g stroke="#fff" stroke-width="3" stroke-linecap="round"><path d="M20 3v5M20 32v5M3 20h5M32 20h5M8 8l3 3M29 29l3 3M32 8l-3 3M8 32l3-3"/></g></svg>', cls: 'hot' });
    let p = 0, said = 0, finger = false, down = false, formed = false;
    const warmC = new T.Color(0xF2A35A), seaC = seaM.color.clone();
    K.on(dt => {
      const on = (down || finger) && c.live;
      hb.classList.toggle('on', on);
      if (on && !formed) { p = Math.min(1, p + dt * (FAST ? 2 : .22)); K.poke(sun.userData.j, .01); }
      const t = Math.round(24 + p * 4); temp.el.textContent = t + '°C';
      seaM.color.copy(seaC).lerp(warmC, p * .55);
      vap.userData.P.forEach(q => { if (q.life <= 0 && p > .45 && !formed && Math.random() < dt * 8) { q.life = 1; q.s = 1; q.p.set((Math.random() - .5) * 10, .2, (Math.random() - .5) * 6); } if (q.life > 0) { q.p.y += dt * 1.6; q.p.x += (1.2 - q.p.x) * dt * .5; q.p.z += (0 - q.p.z) * dt * .5; q.life -= dt * .5; if (q.p.y > 2.6) q.life = 0; } }); vap.userData.sync();
      clouds.scale.setScalar(K.lerp(clouds.scale.x, p > .7 && !formed ? (p - .6) * 2.5 : formed ? .01 : .01, .08));
      if (t >= 25 && said === 0) { said = 1; c.say('hot'); }
      if (t >= 27 && said === 1) { said = 2; c.say('cloud'); }
      if (p >= 1 && !formed) {
        formed = true; sfx('ok');
        K.tween(1.2, k => { ty.scale.setScalar(.01 + k); }).then(() => c.finish());
      }
    });
    hb.addEventListener('pointerdown', e => { e.preventDefault(); down = true; });
    addEventListener('pointerup', () => { down = false; });
    K.inputs({ down(q) { if (K.nearest(q, [sun], { max: 140 }) >= 0) finger = true; }, up() { finger = false; } });
    K.keys((key, dn) => { if (key === 'h' || key === 'space') { down = dn; return true; } return false; });
    c.offC = coach('c2.task', () => K.hand(sun, 'hold'));
    winStep = () => { p = 1; };
    aid = () => (c.live && !formed ? { kb: { hold: 'h', ms: 900 }, ptr: { hold: scr(sun), ms: 900 } } : null);
  });

  // ========== 3 為什麼會轉：讓地球轉起來，風往右彎；再逆時針畫圈 ==========
  const ch3 = () => chapter(3, c => {
    sea();
    const earth = W(TY.earthBall(.9)); K.add(earth, -5.4, 1.4, -3.2);
    K.tag(earth, Z('lab.earth'), 1.3);
    const ring = K.add(new T.Mesh(new T.TorusGeometry(.6, .05, 8, 32), K.clay(0xF2A23A)), 0, .1, 0); ring.rotation.x = -Math.PI / 2;
    const emptyT = K.tag(ring, Z('lab.empty'), .6);
    const wind = K.dots(36, .12, TY.mat('cloud')); K.lv.add(wind);
    const P = wind.userData.P;
    const spawn = q => { const a = Math.random() * Math.PI * 2; q.p.set(Math.cos(a) * 6, .4, Math.sin(a) * 5); q.v.set(-Math.cos(a), 0, -Math.sin(a)).multiplyScalar(2.2); q.life = 1; q.s = 1; };
    P.forEach(q => { spawn(q); q.p.multiplyScalar(.3 + Math.random() * .7); });
    let spinOn = false, phase = 1, acc = 0, lastA = null, ty = null, hint = null;
    K.on(dt => {
      if (phase < 2) {
        P.forEach(q => {
          const d = Math.hypot(q.p.x, q.p.z) || 1;
          q.v.x += (-q.p.x / d * 1.6 + (spinOn ? 1.9 * q.v.z : 0)) * dt; q.v.z += (-q.p.z / d * 1.6 - (spinOn ? 1.9 * q.v.x : 0)) * dt;
          const s = Math.hypot(q.v.x, q.v.z); if (s > 3.2) q.v.multiplyScalar(3.2 / s);
          q.p.addScaledVector(q.v, dt); if (d < .6 || d > 7.5) spawn(q);
        });
        wind.userData.sync();
      }
      if (spinOn) earth.userData.j.rotation.y += dt * 2;
      if (ty && !lastA) ty.userData.step(dt);
    });
    const btn = K.btn({ label: 'c3.btnOn', cls: 'hot' });
    const toggle = () => {
      if (phase !== 1 || !c.live) return;
      spinOn = !spinOn; btn.querySelector('.k3-bl').innerHTML = Z(spinOn ? 'c3.btnOff' : 'c3.btnOn'); sfx('tap');
      c.say(spinOn ? 'curve' : 'straight');
      if (spinOn) { phase = 1.5; setTimeout(startSpin, FAST ? 30 : 3800); }
    };
    btn.addEventListener('click', toggle);
    function startSpin() {
      phase = 2; K.clearBtns(); K.capOff(emptyT); wind.visible = false;
      ty = TY.typhoon(2.6, { speed: 0 }); K.add(ty, 0, .5, 0); ty.scale.setScalar(.1);
      K.tween(.8, k => ty.scale.setScalar(.1 + .9 * k));
      // 逆時針的提示：一圈點點，和一個箭頭
      hint = new T.Group(); K.lv.add(hint);
      for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 1.5; hint.add(K.ball(.12, K.clay(0xF2A23A), Math.cos(a) * 3.6, .3, -Math.sin(a) * 3.6, 8)); }
      c.say('task2');
      aid = () => (phase === 2 ? { kb: ['left', 'left', 'left'], ptr: { circle: scr(ty), ccw: true } } : null);
    }
    const turn = da => {   // da > 0：逆時針（從上面看）
      if (phase !== 2) return;
      acc += da; ty.userData.spin.rotation.y += da;
      if (acc < -Math.PI * 1.2) { acc = 0; sfx('no'); c.say('wrong'); }
      if (acc > Math.PI * 3.6) { phase = 3; ty.userData.speed = 1.6; if (hint) hint.visible = false; c.finish(); }
    };
    K.inputs({
      down(p) { if (phase !== 2) return; const q = K.sp(ty); lastA = Math.atan2(p.y - q.y, p.x - q.x); },
      move(p) { if (phase !== 2 || lastA === null) return; const q = K.sp(ty); const a = Math.atan2(p.y - q.y, p.x - q.x); let d = a - lastA; if (d > Math.PI) d -= 2 * Math.PI; if (d < -Math.PI) d += 2 * Math.PI; lastA = a; if (Math.hypot(p.x - q.x, p.y - q.y) > 16) turn(-d); },
      up() { lastA = null; },
    });
    K.keys((key, dn) => { if (!dn) return false; if ((key === 'space' || key === 'enter') && phase === 1) { toggle(); return true; } if (key === 'left' || key === 'a') { turn(.7); return true; } if (key === 'right' || key === 'd') { turn(-.7); return true; } return false; });
    K.frameTo(seaPts(1.6), { elev: 50, elevPt: 60 });
    c.offC = coach('c3.task', () => (phase === 2 ? K.hand(ty, 'circle') : K.hand(earth, 'tap')));
    winStep = () => { if (phase === 1) { c.live = true; toggle(); } setTimeout(() => { if (phase === 1.5) startSpin(); turn(Math.PI * 4); }, 80); };
    aid = () => (c.live && phase === 1 ? { kb: ['space'], ptr: { tapEl: '.k3-btn' } } : null);
  });

  // ========== 4 長什麼樣子：點颱風眼、眼牆、雨帶 ==========
  const ch4 = () => chapter(4, c => {
    sea();
    const ty = TY.typhoon(4.2, { speed: .35, per: 8 }); K.add(ty, 0, .6, 0); spinAll([ty]);
    const tw = TY.taiwan(); tw.scale.setScalar(.75); tw.visible = false; K.add(tw, -.4, .02, .4);
    const mk = { eye: K.add(new T.Group(), 0, 1, 0), wall: K.add(new T.Group(), 1.4, 1, -.6), band: K.add(new T.Group(), -3, 1, 2.2) };
    K.frameTo([V(-5, 0, 4.6), V(5, 0, 4.6), V(-5, 0, -4.6), V(5, 0, -4.6)], { elev: 62, elevPt: 72 });
    const found = new Set(), rings = [];
    const mark = key => {
      const r = { eye: [.5, .12], wall: [1.4, .3], band: [3.2, .14] }[key];
      const m = new T.Mesh(new T.TorusGeometry(r[0], r[1], 8, 40), K.clay(0xF2A23A)); m.rotation.x = -Math.PI / 2; K.add(m, 0, 1.15, 0); rings.push(m);
      K.tag(mk[key], Z('lab.' + key), .3);
    };
    const hit = key => {
      if (!c.live) return;
      if (!found.has(key)) { found.add(key); mark(key); sfx('ok'); } else sfx('tap');
      if (found.size === 3) { c.live = false; say(c.k(key)).then(() => { c.live = true; c.finish(); }); }
      else c.say(key);
    };
    K.inputs({ up(p) { if (p.cancel) return; const g = K.ground(p, .6); if (!g) return; const d = Math.hypot(g.x, g.z); const key = d < .7 ? 'eye' : d < 1.9 ? 'wall' : d < 5 ? 'band' : null; if (key) hit(key); } });
    const twb = K.btn({ label: 'c4.btnTw' });
    twb.addEventListener('click', () => { if (!c.live) return; tw.visible = !tw.visible; twb.classList.toggle('on', tw.visible); sfx('tap'); if (tw.visible) c.say('tw'); });
    const order = ['eye', 'wall', 'band'];
    K.keys((key, dn) => { if (dn && (key === 'space' || key === 'enter')) { const nx = order.find(x => !found.has(x)); if (nx) hit(nx); return true; } return false; });
    c.offC = coach('c4.task', () => K.hand(mk[order.find(x => !found.has(x)) || 'eye'], 'tap'));
    winStep = () => { order.forEach(x => { if (!found.has(x)) { found.add(x); mark(x); } }); c.finish(); };
    aid = () => { const nx = order.find(x => !found.has(x)); return c.live && nx ? { kb: ['space'], ptr: { tap: scr(mk[nx], -.4) } } : null; };
  });

  // ========== 5 為什麼會走：在水面上拖出水流，樹葉漂去碰星星 ==========
  const ch5 = () => chapter(5, c => {
    const pond = K.add(K.box(14, .3, 11, TY.mat('sea2', { roughness: .5 })), 0, -.15, 0); void pond;
    const flow = K.dots(40, .08, TY.mat('cloud')); K.lv.add(flow);
    flow.userData.P.forEach(q => { q.life = 1; q.s = 1; q.p.set((Math.random() - .5) * 13, .05, (Math.random() - .5) * 10); });
    const SP = [[-4.6, 3.2], [-4.4, -3.4], [4.2, -3.6]].map(([x, z]) => { const s = W(TY.star()); K.add(s, x, .1, z); s.userData.got = false; return s; });
    const lf = W(TY.leaf()); K.add(lf, 4.4, .1, 3.2);
    let dir = V(-1, 0, 0), got = 0;
    const arrow = new T.Mesh(new T.ConeGeometry(.3, .7, 10), K.clay(0xF2A23A)); arrow.rotation.z = -Math.PI / 2; const ag = new T.Group(); ag.add(arrow); K.add(ag, 0, .4, 0);
    K.on(dt => {
      const go = c.live;
      flow.userData.P.forEach(q => { q.p.addScaledVector(dir, dt * 2.6); if (q.p.x < -7) q.p.x = 7; if (q.p.x > 7) q.p.x = -7; if (q.p.z < -5.5) q.p.z = 5.5; if (q.p.z > 5.5) q.p.z = -5.5; }); flow.userData.sync();
      if (go && got < 3) { lf.position.addScaledVector(dir, dt * 2); lf.position.x = K.clamp(lf.position.x, -6.4, 6.4); lf.position.z = K.clamp(lf.position.z, -5, 5); }
      const a = Math.atan2(-dir.z, dir.x); lf.rotation.y = K.lerp(lf.rotation.y, a, .1); ag.position.copy(lf.position).add(dir.clone().multiplyScalar(1.4)).setY(.4); ag.rotation.y = a;
      SP.forEach(s => { s.rotation.y += dt; if (!s.userData.got && s.position.distanceTo(lf.position.clone().setY(.1)) < 1.1) { s.userData.got = true; got++; sfx('ok'); K.tween(.4, k => s.scale.setScalar(1 + k * 1.5)).then(() => { s.visible = false; }); if (got < 3) c.say('star'); else c.finish(); } });
    });
    const setDir = (x, z) => { const v = V(x, 0, z); if (v.length() < .01) return; dir = v.normalize(); };
    K.inputs({ down(p) { if (!c.live) return; const g = K.ground(p, 0); if (g) setDir(g.x - lf.position.x, g.z - lf.position.z); }, move(p) { if (!c.live) return; const g = K.ground(p, 0); if (g) setDir(g.x - lf.position.x, g.z - lf.position.z); } });
    K.keys((key, dn) => { if (!dn) return false; const m = { up: [0, -1], w: [0, -1], down: [0, 1], s: [0, 1], left: [-1, 0], a: [-1, 0], right: [1, 0], d: [1, 0] }[key]; if (m) { setDir(m[0], m[1]); sfx('tap'); return true; } return false; });
    K.frameTo([V(-7, 0, 5.6), V(7, 0, 5.6), V(-7, 0, -5.6), V(7, 0, -5.6)], { elev: 62, elevPt: 70 });
    c.offC = coach('c5.task', () => K.hand(lf, 'drag', SP.find(s => !s.userData.got) || lf));
    winStep = () => { SP.forEach(s => { if (!s.userData.got) { lf.position.copy(s.position); } }); };
    const keyTo = s => { const d = s.position.clone().sub(lf.position); return Math.abs(d.x) > Math.abs(d.z) ? (d.x < 0 ? 'left' : 'right') : (d.z < 0 ? 'up' : 'down'); };
    aid = () => { const s = SP.find(x => !x.userData.got); if (!c.live || !s) return null; return { kb: [keyTo(s)], ptr: { tap: scr(s) } }; };
  });

  // ========== 6 颱風通常怎麼走：拉大拉小太平洋高氣壓，看路怎麼變 ==========
  const TYPICAL = [[146, 12.5], [139, 15], [131.6, 18.5], [126, 21.6], [123.4, 23.8], [124.3, 26.4], [126.8, 30], [129.8, 33.8]];
  function trail(pts, color = 0xD2402A) {
    const cur = new T.CatmullRomCurve3(pts.map(([lo, la]) => TY.far(lo, la).setY(.25)));
    const geo = new T.TubeGeometry(cur, 64, .07, 6, false); const m = new T.Mesh(geo, K.clay(color)); m.castShadow = false;
    geo.setDrawRange(0, 0); const total = geo.index.count;
    m.userData.cur = cur; m.userData.show = k => geo.setDrawRange(0, Math.floor(total * k / 6) * 6);
    return m;
  }
  const ch6 = () => chapter(6, c => {
    K.add(TY.asiaMap(), 0, 0, 0);
    [['lab.tw', 118.6, 23.4], ['lab.jp', 137, 36.4], ['lab.ph', 121.6, 16.4], ['lab.pac', 141, 21]].forEach(([k, lo, la]) => K.tag(K.add(new T.Group(), TY.far(lo, la).x, .2, TY.far(lo, la).z), Z(k), 0));
    const SZ = { big: [140, 25.5, 1.55], mid: [143, 27.5, 1.05], small: [146.5, 30, .62] };
    const dome = new T.Mesh(new T.SphereGeometry(3.4, 28, 14, 0, Math.PI * 2, 0, Math.PI / 2), new T.MeshStandardMaterial({ color: 0xF2A23A, transparent: true, opacity: .32, roughness: .8, depthWrite: false }));
    dome.scale.set(1, .45, .65); K.lv.add(dome);
    let hs = SZ.mid.slice();
    const drawHp = () => { const p = TY.far(hs[0], hs[1]); dome.position.set(p.x, 0, p.z); dome.scale.set(hs[2], hs[2] * .45, hs[2] * .65); };
    drawHp();
    K.tag(dome, Z('lab.hp'), 1.2);
    const ROUTE = { big: [[131.6, 17.7], [126.5, 20.4], [122.3, 22.4], [119.2, 23.8], [116.3, 24.8]], mid: [[131.6, 17.7], [123.6, 23.6], [124.3, 25.6], [126.6, 29.6], [129.6, 34]], small: [[131.6, 17.7], [130.6, 21.5], [131.6, 25.6], [134.6, 29.8], [138.4, 33.6]] };
    const ty = TY.typhoon(.55, { speed: 3 }); K.add(ty, TY.far(131.6, 17.7).x, .3, TY.far(131.6, 17.7).z); spinAll([ty]);
    K.frameTo([V(-8.4, 0, 6.4), V(8.4, 0, 6.4), V(-8.4, 0, -6.4), V(8.4, 0, -6.4)], { elev: 58, elevPt: 70 });
    let line = null, busy = false, realOn = false;
    const tried = new Set();
    const run = async (pts, dur) => {
      if (line) K.lv.remove(line);
      line = trail(pts); K.lv.add(line);
      await K.tween(dur, k => { line.userData.show(k); const p = line.userData.cur.getPoint(k); ty.position.set(p.x, .3, p.z); });
    };
    const tryIt = async key => {
      if (busy || !c.live) return; busy = true; tried.add(key); sfx('tap');
      const from = hs.slice(), to = SZ[key];
      await K.tween(.6, q => { hs = from.map((v, i) => v + (to[i] - v) * q); drawHp(); });
      c.say(key);
      await run(ROUTE[key], 2.2);
      busy = false;
      if (tried.size >= 2 && !realOn) { realOn = true; const b = K.btn({ label: 'c6.btnReal', cls: 'hot', key: '↵' }); b.addEventListener('click', real); c.say('task2'); }
    };
    async function real() {
      if (busy || !c.live) return; busy = true; sfx('tap');
      const from = hs.slice(), to = SZ.mid; K.tween(.5, q => { hs = from.map((v, i) => v + (to[i] - v) * q); drawHp(); });
      await run(TYPICAL, 3.4);
      busy = false; c.finish();
    }
    // 拉圓頂的邊：往外＝變大、往裡＝變小；放手就照最近的大小走一次
    let grab = null;
    K.inputs({
      down(p) { if (!c.live || busy) return; const g = K.ground(p, 0); if (!g) return; const d = Math.hypot(g.x - dome.position.x, (g.z - dome.position.z) / .65); if (d < 3.4 * hs[2] + 1.2) grab = { d0: d, s0: hs[2] }; },
      move(p) { if (!grab) return; const g = K.ground(p, 0); if (!g) return; const d = Math.hypot(g.x - dome.position.x, (g.z - dome.position.z) / .65); hs[2] = K.clamp(grab.s0 * (d / Math.max(.5, grab.d0)), .55, 1.65); drawHp(); },
      up() { if (!grab) return; grab = null; const s = hs[2]; tryIt(s > 1.3 ? 'big' : s < .82 ? 'small' : 'mid'); },
    });
    const bts = [['c6.btnBig', 'big', '1'], ['c6.btnMid', 'mid', '2'], ['c6.btnSmall', 'small', '3']].map(([l, key, kk]) => { const b = K.btn({ label: l, key: kk, cls: 'sm' }); b.addEventListener('click', () => tryIt(key)); return b; });
    void bts;
    K.keys((key, dn) => { if (!dn) return false; if (key === '1') tryIt('big'); else if (key === '2') tryIt('mid'); else if (key === '3') tryIt('small'); else if ((key === 'enter' || key === 'space') && realOn) real(); else return false; return true; });
    c.offC = coach('c6.task', () => K.hand(dome, 'drag', ty));
    winStep = () => { c.finish(); };
    aid = () => { if (!c.live || busy) return null; if (realOn) return { kb: ['enter'], ptr: { tapEl: '.k3-btn.hot' } }; const nx = ['big', 'small'].find(x => !tried.has(x)) || 'mid'; return { kb: [{ big: '1', mid: '2', small: '3' }[nx]], ptr: { tapEl: '.k3-btn:nth-child(' + ({ big: 1, mid: 2, small: 3 }[nx]) + ')' } }; };
  });

  // ========== 7 颱風來了，怎麼辦：把東西拖到「好」或「不好」 ==========
  const ch7 = () => chapter(7, c => {
    nearScene(-4.4);
    const ty = TY.typhoon(2, { speed: 1.4 }); K.add(ty, 2.2, 1.6, -3.4); spinAll([ty]);
    const rain = K.dots(30, .07, TY.mat('cloud')); K.lv.add(rain);
    K.on(dt => rain.userData.P.forEach(q => { if (q.life <= 0) { q.life = 1; q.s = 1; q.p.set(-4.4 + (Math.random() - .5) * 3, 3 + Math.random() * 2, (Math.random() - .5) * 4); } q.p.y -= dt * 5; if (q.p.y < .2) q.life = 0; }) || rain.userData.sync());
    const mat = (x, col, label, kk) => { const g = W(new T.Group(), 120, 8); g.userData.j.add(K.cyl(1.6, 1.6, .16, K.clay(col), 0, .08, 0, 32)); K.add(g, x, 0, 2.4); K.tag(g, Z(label), .5); K.cap(g, kk, 1.2); return g; };
    const good = mat(-2.2, 0x8FB38A, 'c7.good', 'A'), bad = mat(2.2, 0xF0A08E, 'c7.bad', 'B');
    const GOOD = [1, 0, 1, 1, 0, 0];
    let i = 0, item = null, lock = false;
    const show = () => {
      if (item) K.lv.remove(item);
      item = W(TY.card(i)); K.add(item, 0, 0, 4.6); item.userData.j.children[0].scale.setScalar(.9);
      K.poke(item.userData.j, .5); sfx('pop');
      if (c.live) say('c7.k' + (i + 1));
      D = K.drag([item], { h: 0, lift: .6, drop: (_, p) => { const d0 = p.distanceTo(good.position), d1 = p.distanceTo(bad.position); if (Math.min(d0, d1) > 2.4) return null; return answer(d0 < d1 ? 1 : 0, true); } });
    };
    let D = null;
    const answer = (g, viaDrop) => {
      if (lock || !c.live) return null;
      const m = g ? good : bad;
      if (g === GOOD[i]) {
        sfx('ok'); lock = true; K.poke(m.userData.j, .4);
        const to = m.position.clone().setY(.16);
        if (!viaDrop) D.land(0, to);
        say('c7.a' + (i + 1)).then(() => { lock = false; i++; if (i < 6) show(); else { K.lv.remove(item); item = null; c.finish(); } });
        return to;
      }
      sfx('no'); K.poke(m.userData.j, -.3); say('g.again');
      return null;
    };
    show();
    K.inputs({ down: p => D && D.down(p), move: p => D && D.move(p), up(p) { if (D && D.sel && D.sel() < 0) { const j = K.nearest(p, [good, bad], { max: 110 }); if (j >= 0 && K.nearest(p, [item], { max: 70 }) < 0) { answer(j === 0 ? 1 : 0, false); return; } } if (D) D.up(p); } });
    K.keys((key, dn) => { if (!dn) return false; if (key === 'a') { answer(1, false); return true; } if (key === 'b') { answer(0, false); return true; } return false; });
    // 故事唸完、說完任務，再唸第一張
    const t0 = setInterval(() => { if (c.live) { clearInterval(t0); setTimeout(() => { if (i === 0 && !lock) say('c7.k1'); }, FAST ? 0 : 2600); } }, 100);
    K.frameTo(seaPts(2.4).concat([V(0, 0, 5.8)]), { elev: 34, elevPt: 46 });
    c.offC = coach('c7.task', () => (item ? K.hand(item, 'drag', GOOD[i] ? good : bad) : null));
    winStep = () => { i = 6; c.finish(); };
    aid = () => (c.live && item && !lock ? { kb: [GOOD[i] ? 'a' : 'b'], ptr: { drag: [scr(item, .4), scr(GOOD[i] ? good : bad, .2)] } } : null);
  });

  // ========== 8 經過臺灣以後：按「繼續走」，颱風往北轉 ==========
  const ch8 = () => chapter(8, c => {
    K.add(TY.asiaMap(), 0, 0, 0);
    [['lab.tw', 118.6, 23.4], ['lab.jp', 137, 36.4]].forEach(([k, lo, la]) => K.tag(K.add(new T.Group(), TY.far(lo, la).x, .2, TY.far(lo, la).z), Z(k), 0));
    const back = trail(TYPICAL.slice(0, 5), 0xD2402A); back.userData.show(1); K.lv.add(back);
    const NEXT = [[123.4, 23.8], [124.6, 26.2], [126.8, 30], [130.2, 33.6]];
    const PLACE = [['lab.oki', 128.6, 26.2], ['lab.ecs', 123.4, 30.6], ['lab.kyu', 131.6, 31.6]];
    const ty = TY.typhoon(.6, { speed: 3 }); const p0 = TY.far(...NEXT[0]); K.add(ty, p0.x, .3, p0.z); spinAll([ty]);
    K.frameTo([V(-6, 0, 5), V(8, 0, 5), V(-6, 0, -6.6), V(8, 0, -6.6)], { elev: 58, elevPt: 70 });
    let step = 0, busy = false;
    const b = K.btn({ label: 'c8.btn', cls: 'hot', key: '↵' });
    const go = async () => {
      if (busy || step >= 3 || !c.live) return; busy = true; sfx('tap');
      const seg = trail([NEXT[step], NEXT[step + 1]], 0xF2A23A); K.lv.add(seg);
      await K.tween(1.4, k => { seg.userData.show(k); const p = seg.userData.cur.getPoint(k); ty.position.set(p.x, .3, p.z); });
      const [lk, lo, la] = PLACE[step]; K.tag(K.add(new T.Group(), TY.far(lo, la).x, .2, TY.far(lo, la).z), Z(lk), 0);
      step++;
      if (step === 2) K.tag(K.add(new T.Group(), TY.far(134.5, 33).x, .2, TY.far(134.5, 33).z), Z('lab.plane'), 0);
      if (step === 3) { K.clearBtns(); c.live = false; K.tween(1, k => ty.scale.setScalar(1 - k * .4)); await say(c.k('p3')); c.live = true; c.finish(); }
      else { c.say('p' + step); busy = false; }
    };
    b.addEventListener('click', go);
    K.keys((key, dn) => { if (dn && (key === 'enter' || key === 'space')) { go(); return true; } return false; });
    c.offC = coach('c8.task', () => K.hand(ty, 'tap'));
    winStep = () => { c.finish(); };
    aid = () => (c.live && !busy && step < 3 ? { kb: ['enter'], ptr: { tapEl: '.k3-btn.hot' } } : null);
  });

  // ========== 9 颱風怎麼會消失：拖去冷海或陸地，力氣變成零 ==========
  const ch9 = () => chapter(9, c => {
    K.add(K.box(16, .3, 12, TY.mat('sea', { roughness: .55 })), 0, -.15, 0);
    K.add(K.box(16, .32, 3.6, TY.mat('cold')), 0, -.14, -4.2);                       // 北邊冷冷的海
    const warm = K.add(new T.Mesh(new T.CircleGeometry(4, 32), new T.MeshBasicMaterial({ color: 0xF2A35A, transparent: true, opacity: .45, depthWrite: false })), 3.2, .03, 2); warm.rotation.x = -Math.PI / 2;
    K.add(K.box(5, .8, 8.4, TY.mat('land')), -5.5, .4, 1.8);                          // 陸地
    [[-6.4, 1.4, 1.1, 1.3], [-4.8, -.4, .9, 1.1], [-5.6, 3.4, .8, .9]].forEach(([x, z, r, h]) => { const m = new T.Mesh(new T.ConeGeometry(r, h, 10), TY.mat('mount')); m.castShadow = true; K.add(m, x, .8 + h / 2, z); });
    [['lab.cold', 0, -4.6], ['lab.land', -5.5, -1.6], ['lab.warm', 3.2, 4.6]].forEach(([k, x, z]) => K.tag(K.add(new T.Group(), x, .4, z), Z(k), 0));
    const ty = TY.typhoon(2, { speed: 2 }); K.add(ty, 3.2, .4, 2); spinAll([ty]);
    const bar = K.tag(K.add(new T.Group(), K.portrait() ? 0 : 4.6, .4, K.portrait() ? 6.2 : -5.8), '', 0); bar.el.className = 'k3-tag ty-bar'; bar.el.innerHTML = Z('lab.power') + '<span class="pw"><span class="pf"></span></span>';
    let E = 70, drag = false, zone = 'warm', ended = false;
    const keys = {};
    const zoneOf = p => (p.z < -2.4 ? 'cold' : p.x < -3 ? 'land' : 'warm');
    K.on(dt => {
      if (ended) return;
      const kx = (keys.right || keys.d ? 1 : 0) - (keys.left || keys.a ? 1 : 0), kz = (keys.down || keys.s ? 1 : 0) - (keys.up || keys.w ? 1 : 0);
      if (c.live && (kx || kz)) { ty.position.x = K.clamp(ty.position.x + kx * 4 * dt, -7, 7); ty.position.z = K.clamp(ty.position.z + kz * 4 * dt, -5.4, 5.4); }
      const z = zoneOf(ty.position);
      if (z !== zone) { zone = z; if (c.live) { sfx(z === 'warm' ? 'pop' : 'tap'); c.say(z); } }
      if (c.live) { E += (z === 'warm' ? 16 : z === 'cold' ? -22 : -30) * dt; E = K.clamp(E, 0, 100); }
      bar.el.querySelector('.pf').style.width = E + '%';
      ty.scale.setScalar(.35 + E / 100 * .75); ty.userData.speed = .4 + E / 30;
      if (E <= 0 && c.live) {
        ended = true;
        K.tween(1, k => { ty.scale.setScalar(.35 * (1 - k) + .01); }).then(() => { const cl = TY.cloud(.9); K.add(cl, ty.position.x, .8, ty.position.z); c.finish(); });
      }
    });
    K.inputs({
      down(p) { if (!c.live) return; if (K.nearest(p, [ty], { max: 120 }) >= 0) drag = true; },
      move(p) { if (!drag) return; const g = K.ground(p, .4); if (g) { ty.position.x = K.clamp(g.x, -7, 7); ty.position.z = K.clamp(g.z, -5.4, 5.4); } },
      up() { drag = false; },
    });
    K.keys((key, dn) => { if (['up', 'down', 'left', 'right', 'w', 'a', 's', 'd'].includes(key)) { keys[key] = dn; return true; } return false; });
    K.frameTo([V(-8, 0, 6.2), V(8, 0, 6.2), V(-8, 0, -6), V(8, 0, -6)], { elev: 56, elevPt: 66 });
    c.offC = coach('c9.task', () => K.hand(ty, 'drag', K.add(new T.Group(), 0, 0, -4.2)));
    winStep = () => { ty.position.set(0, .4, -4.2); E = 0; };
    aid = () => (c.live && !ended ? { kb: { hold: 'up', ms: 1600 }, ptr: { drag: [scr(ty), scr(V(0, .4, -4.4))] } } : null);
  });

  // ========== 10 颱風小博士：點 3D 答案（兩個選一個） ==========
  async function ch10() {
    if (!K.mount()) return;
    K.level();
    sea();
    const big = TY.typhoon(1.6, { speed: 1 }); K.add(big, 0, 1.2, -3.4); spinAll([big]);
    K.tag(big, Z('lab.dr'), 1.2);
    K.frameTo(seaPts(2.4), { elev: 30, elevPt: 44 });
    for (const s of ['c10.s1', 'c10.s2', 'c10.s3']) await say(s);
    const ANS = [
      [() => { const g = new T.Group(); g.add(K.cyl(1, .8, .6, K.clay(0xFFFBF4), 0, .3, 0, 24)); g.add(K.cyl(.92, .92, .05, K.clay(0xF2A35A), 0, .58, 0, 24)); return g; }, () => { const g = new T.Group(); g.add(K.ball(.6, K.clay(0xFFFFFF), 0, .6, 0, 16)); g.add(K.ball(.4, K.clay(0xFFFFFF), .4, .4, .2, 12)); return g; }],
      [() => TY.typhoon(1, { speed: -1.6 }), () => TY.typhoon(1, { speed: 1.6 })],
      [() => TY.typhoon(1, { speed: 3 }), () => { const g = new T.Group(); g.add(K.cyl(.7, .7, .06, K.clay(0x2E6A98), 0, .1, 0, 24)); g.add(TY.cloud(.5)).position.set(0, .9, 0); return g; }],
      [() => { const g = new T.Group(); for (let k = 0; k < 3; k++) { const w = new T.Mesh(new T.TorusGeometry(.4, .12, 8, 16, Math.PI), TY.mat('sea')); w.position.set(-.6 + k * .6, .2, 0); g.add(w); } return g; }, () => { const g = new T.Group(); [-1, 1].forEach(s => { const b = K.box(1.3, .25, .25, K.clay(0xD2402A), 0, .6, 0); b.rotation.z = s * .8; g.add(b); }); return g; }],
    ];
    const QS = [['c10.q1', 'c10.a1a', 'c10.a1b', 0], ['c10.q2', 'c10.a2a', 'c10.a2b', 1], ['c10.q3', 'c10.a3a', 'c10.a3b', 1], ['c10.q4', 'c10.a4a', 'c10.a4b', 1]];
    for (let q = 0; q < 4; q++) {
      const [qk, a, b, right] = QS[q];
      const opts = ANS[q].map((f, i) => { const g = W(f()); K.add(g, (i ? 1 : -1) * 2.6, .3, 1.4); K.tag(g, '<kbd class="kc">' + 'AB'[i] + '</kbd> ' + Z([a, b][i]), -.2); return g; });
      const sp = []; opts.forEach(g => { const t = g.userData.j.children[0]; if (t.userData.step) sp.push(t); }); if (sp.length) spinAll(sp);
      opts.forEach(g => K.poke(g.userData.j, .5)); sfx('pop');
      say(qk);
      let miss = 0;
      const offC = coach(qk, () => K.hand(opts[right], 'tap'));
      await new Promise(res => {
        const pick = i => { if (i < 0) return; if (i === right) { offK(); res(); return; } miss++; K.poke(opts[i].userData.j, -.35); sfx('no'); say(miss >= 2 ? 'g.no2' : 'g.again'); if (miss >= 2) K.halo(opts[right], 2.4); };
        K.inputs({ up(p) { if (!p.cancel) pick(K.nearest(p, opts, { max: 130, at: o => K.pos(o).add(V(0, .5, 0)) })); } });
        const offK = K.keys((key, dn) => { const i = 'ab'.indexOf(key); if (dn && i >= 0) { pick(i); return true; } return false; });
        winStep = () => { offK(); res(); };
        aid = () => ({ kb: ['ab'[right]], ptr: { tap: scr(opts[right], .5) } });
      });
      offC(); K.inputs({}); aid = null;
      K.poke(opts[right].userData.j, .6); sfx('ok');
      await say('c10.right');
      opts.forEach(g => K.lv.remove(g));
      K.lv.children.filter(o => o.isSprite).forEach(o => K.lv.remove(o));
      document.querySelectorAll('.k3-tag').forEach(e => { if (/kc/.test(e.innerHTML)) e.remove(); });
    }
    sfx('win');
    await say('c10.ok');
  }

  // ---------- 結尾 ----------
  async function finale() {
    if (!K.mount()) { stage.innerHTML = '<div class="chtitle">' + G.Zs('fin.title') + '</div>'; await say('fin.hi'); return; }
    K.level();
    nearScene(-2.4);
    const h = K.add(TY.house(), -2.6, .4, .6); h.scale.setScalar(.5);
    const ty = TY.typhoon(1.6, { speed: .8 }); K.add(ty, 3.4, .8, -2.4); spinAll([ty]);
    K.frameTo(seaPts(1.6), { elev: 34, elevPt: 44 });
    const c = document.createElement('div'); c.className = 'k3-card';
    c.innerHTML = '<b>給家長：</b>這個遊戲講一般的颱風：在熱熱的海上生成、北半球逆時針轉、颱風眼與眼牆、被駛流與太平洋高氣壓推著走、秋天容易在臺灣東邊轉向、遇到冷海或陸地就減弱。第 1 關的「薔琵」（2026 年，名字由寮國提供，一種香花）只是當例子。地圖是示意，不是真實比例；颱風的實際路線請看中央氣象署。資料來源：中央氣象署〈颱風百科〉與颱風警報說明、香港天文台〈熱帶氣旋名字的意思〉。';
    K.ov.appendChild(c);
    sfx('win');
    await say('fin.hi');
    await speak('fin.task');
  }

  const wrapCh = f => async () => { aid = null; winStep = null; await f(); aid = null; winStep = null; };
  G.run({
    saveKey: 'typhoon-game-v1', stamp: '颱風',
    heroArt: '<svg viewBox="-60 -60 120 120"><circle r="56" fill="#4D97CB"/><g fill="#fff" opacity=".95"><path d="M0-40C24-40 40-20 36 4 30-18 14-26 0-24z"/><path d="M40 0C40 24 20 40-4 36 18 30 26 14 24 0z"/><path d="M0 40C-24 40-40 20-36-4-30 18-14 26 0 24z"/><path d="M-40 0C-40-24-20-40 4-36-18-30-26-14-24 0z"/></g><circle r="14" fill="#fff"/><circle r="5" fill="#2E6A98"/></svg>',
    chapters: [ch1, ch2, ch3, ch4, ch5, ch6, ch7, ch8, ch9, ch10].map(wrapCh), finale,
  });
  window.__ty = { win: () => { if (winStep) winStep(); }, aid: () => { try { return aid ? aid() : null; } catch (e) { return null; } } };
})();
