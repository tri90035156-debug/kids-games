// 《試試看實驗室》：一張黏土實驗桌、十個真的做得出來的實驗。每一關都走同一個圈：假設 → 實驗 → 結果，
// 結果又帶出新的問題，再走一圈。每關最後一句結論、記錄本貼上一頁；十關做完有總結。
// 流程：實驗桌 → 點道具（或數字鍵）→ 道具升起、相機滑過去（不換頁）→ 一圈一圈 → 結論＋記錄本 → 回實驗桌 → … → 總結 → 自由玩。
// 三條路：鍵盤（ev.code）、手指、點目標（它自己做）。提示階梯：5 秒光暈變亮、15 秒小手示範＋重講提示、失敗兩次光暈指位置、三次自動示範。
// 測試網址：?fast=1、?e=N&fast=1、?e=N&round=R、?desk=1&done=5、?end=1。console：__lab.state()、__lab.probe()。
(() => {
  'use strict';
  const { $, S, save, setSave, speak, stopVoice, unlockAudio, keyName } = G;
  const { T, lerp, ease, poke, wobble } = S3;
  const A = ART, snd = G.snd, FAST = G.FAST;
  const QS = new URLSearchParams(location.search);
  setSave('science-lab-v1');
  if (!Array.isArray(S.done)) S.done = [];
  if (!Array.isArray(S.book)) S.book = [];
  if (!S.seen || typeof S.seen !== 'object') S.seen = {};

  // ---------- 場景 ----------
  const host = $('#v3');
  const scene = new T.Scene();
  scene.background = new T.Color(A.C.bg);
  scene.fog = new T.Fog(A.C.bg, 60, 130);
  const cam = new T.PerspectiveCamera(38, 1, .1, 200);
  cam.position.set(0, 18, 22); cam.lookAt(0, 0, 0);
  let v;
  try { v = S3.view(host, { scene, cam }); }
  catch (e) { $('#nogl').hidden = false; host.hidden = true; return; }
  scene.add(new T.HemisphereLight(0xFFF6E6, 0xD9DCC4, 1.9));
  const sun = new T.DirectionalLight(0xFFE7C6, 2.4);
  sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048); sun.shadow.radius = 6; sun.shadow.bias = -.0005;
  Object.assign(sun.shadow.camera, { left: -11, right: 11, top: 11, bottom: -11, near: 1, far: 60 });
  scene.add(sun); scene.add(sun.target);
  const under = new T.Mesh(new T.PlaneGeometry(240, 240), new T.MeshStandardMaterial({ color: 0xEFE5D3, roughness: 1 }));
  under.rotation.x = -Math.PI / 2; under.position.y = -.85; under.receiveShadow = true; scene.add(under);

  // ---------- 補間、等待 ----------
  const tweens = new Set();
  function tween(dur, f) { return new Promise(res => { const tw = { t: 0, dur: Math.max(.001, FAST ? Math.min(dur, .05) : dur), f, res }; f(0); tweens.add(tw); }); }
  const wait = s => tween(FAST ? Math.min(s, .05) : s, () => {});
  const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
  const outBack = k => { const c = 1.6; return 1 + (c + 1) * Math.pow(k - 1, 3) + c * Math.pow(k - 1, 2); };

  // ---------- 聲音（全部合成；五聲音階） ----------
  const PEN = [261.6, 293.7, 329.6, 392, 440, 523.3, 587.3, 659.3, 784, 880, 1046.5];
  let bumpN = 0, lastBump = 0;
  const SFX = {
    tap: () => snd.wood(900, 0, .08),
    ok: () => { snd.mallet(PEN[5], 0, .14, .5); snd.mallet(PEN[8], .09, .13, .6); },
    no: () => snd.wood(300, 0, .12),
    tick: () => { snd.mallet(PEN[7], 0, .12, .5); snd.mallet(PEN[9], .08, .1, .5); },
    up3: (i = 0) => [0, 1, 2].forEach(k => snd.mallet(PEN[clamp(i + 2 + k * 2, 0, 10)], k * .1, .12, .8)),
    chord: () => { [5, 7, 8, 10].forEach((n, k) => snd.mallet(PEN[n], k * .1, .13)); snd.pad([261.6, 329.6, 392, 523.3], .05, .055, 2.6); },
    stamp: () => { snd.wood(420, 0, .2); setTimeout(() => SFX.chord(), 160); },
    door: () => snd.pad([261.6, 329.6, 392, 523.3], 0, .06, 2.2),
    land: () => snd.mallet(392, 0, .1, .4),
    bump: (soft = 0) => { const now = performance.now(); if (now - lastBump < 70) return; lastBump = now; snd.mallet(PEN[(bumpN++) % 8], 0, soft ? .08 : .15, .6); },
    note: n => snd.mallet(PEN[clamp(n, 0, 10)], 0, .12, .6),
    drop: () => snd.drop(0, .12),
    splash: () => { snd.drop(0, .14); snd.drop(.08, .1); snd.glide(260, 120, .5, .05); },
    snap: () => { snd.mallet(784, 0, .14, .28); snd.mallet(1046.5, .04, .1, .3); },
    hover: () => snd.wood(1150, 0, .035),
    page: () => snd.wood(1200, 0, .05),
    stir: () => snd.wood(1300 + Math.random() * 200, 0, .025),
    bubble: () => { snd.drop(0, .1); snd.drop(.12, .08); snd.drop(.22, .07); },
    glide: () => snd.glide(320, 290, .3, .025),
    chord2: (a, b) => { snd.mallet(a, 0, .14, .6); snd.mallet(b, 0, .14, .6); },
  };
  let started = false;
  Object.keys(SFX).forEach(k => { const f = SFX[k]; SFX[k] = (...a) => { if (started) f(...a); }; });

  // ---------- 相機：斜斜往下看；fit 把一堆點框進畫面（避開上方圓環＋字幕、下方按鈕） ----------
  const camWant = { pos: cam.position.clone(), look: new T.Vector3() }, camLook = new T.Vector3();
  let camSpeed = .06;
  const tmpCam = new T.PerspectiveCamera(38, 1, .1, 200);
  const topRes = () => { const r = $('#ring').getBoundingClientRect(); return (r.bottom || 150) + (v.w < 480 ? 96 : 76); };
  function fitCam(pts, { elev = 40, elevPt = 0, top = 0, bottom = 18, side = 14, fov = 0 } = {}) {
    const asp = v.w / Math.max(1, v.h), pt = asp < .8;
    if (pt && elevPt) elev = elevPt;
    top = top || topRes();
    const fv = fov || (pt ? 50 : 36);
    tmpCam.fov = fv; tmpCam.aspect = asp; tmpCam.updateProjectionMatrix();
    const e = elev * Math.PI / 180, dir = new T.Vector3(0, Math.sin(e), Math.cos(e));
    const target = pts.reduce((a, p) => a.add(p), new T.Vector3()).divideScalar(pts.length);
    const topLim = 1 - 2 * top / v.h, botLim = -1 + 2 * bottom / v.h, xLim = 1 - 2 * side / v.w;
    const place = d => { tmpCam.position.copy(target).addScaledVector(dir, d); tmpCam.lookAt(target); tmpCam.updateMatrixWorld(); };
    const range = () => {
      let x0 = 9, x1 = -9, y0 = 9, y1 = -9, z1 = -9;
      pts.forEach(p => { const q = p.clone().project(tmpCam); x0 = Math.min(x0, q.x); x1 = Math.max(x1, q.x); y0 = Math.min(y0, q.y); y1 = Math.max(y1, q.y); z1 = Math.max(z1, q.z); });
      return { x0, x1, y0, y1, z1 };
    };
    const search = () => {
      let lo = 3, hi = 200;
      for (let n = 0; n < 32; n++) {
        const d = (lo + hi) / 2; place(d);
        const r = range();
        if (r.z1 < 1 && r.x0 >= -xLim && r.x1 <= xLim && r.y1 <= topLim && r.y0 >= botLim) hi = d; else lo = d;
      }
      return hi;
    };
    let hi = 30;
    for (let it = 0; it < 5; it++) {
      hi = search(); place(hi);
      const r = range();
      const wpn = hi * Math.tan(fv * Math.PI / 360);
      const dy = ((r.y0 + r.y1) / 2 - (topLim + botLim) / 2) * wpn;
      if (elev < 30) target.y += dy; else target.z -= dy / Math.max(.3, Math.sin(e));
      target.x += ((r.x0 + r.x1) / 2) * wpn * asp;
    }
    hi = search(); place(hi);
    return { pos: tmpCam.position.clone(), look: target.clone(), fov: fv };
  }
  function setCam(f, snap = false) {
    camWant.pos.copy(f.pos); camWant.look.copy(f.look);
    if (cam.fov !== f.fov) { cam.fov = f.fov; cam.updateProjectionMatrix(); }
    if (snap) { cam.position.copy(f.pos); camLook.copy(f.look); cam.lookAt(camLook); }
  }

  // ---------- 疊在畫布上的 HTML：鍵帽、小手示範、按鈕 ----------
  const ov = $('#ov'), ctl = $('#ctl'), hand = $('#hand'), mine = $('#mine');
  const CAPS = [];
  const capEl = i => { while (CAPS.length <= i) { const k = document.createElement('kbd'); k.className = 'kc sl-kc'; ov.appendChild(k); CAPS.push(k); } return CAPS[i]; };
  const HALOS = [];
  const haloAt = i => { while (HALOS.length <= i) { const h = A.halo(1); scene.add(h); HALOS.push(h); } return HALOS[i]; };
  const sp = w => v.toScreen(w);
  function button({ icon, key = '', cls = '', down, up, label = '' }) {
    const b = document.createElement('button');
    b.className = 'sl-btn ' + cls; b.type = 'button'; b.setAttribute('aria-label', label);
    b.innerHTML = (A.UI[icon] || icon) + (key ? '<kbd class="kc sl-bk">' + key + '</kbd>' : '');
    b.addEventListener('pointerdown', ev => { ev.preventDefault(); act(); unlockAudio(); b.classList.add('on'); poke2(b); if (down) down(ev); });
    const u = ev => { if (!b.classList.contains('on')) return; b.classList.remove('on'); if (up) up(ev); };
    b.addEventListener('pointerup', u); b.addEventListener('pointercancel', u); b.addEventListener('pointerleave', u);
    ctl.appendChild(b);
    return b;
  }
  function poke2(el) { el.classList.remove('pk'); void el.offsetWidth; el.classList.add('pk'); }

  // 小手示範：pts 是 3D 區域座標（Vector3）或螢幕座標 {x,y}；kind：tap / drag / hold / circle
  let demo = null;
  function playDemo(d) {
    if (!d || !d.pts || !d.pts.length) return;
    demo = { ...d, t: 0, dur: d.dur || (d.kind === 'tap' ? .9 * d.pts.length + .4 : d.kind === 'circle' ? 2.6 : 2.2) };
    hand.hidden = false;
  }
  function demoFrame(dt) {
    if (!demo) return;
    demo.t += dt;
    const k = demo.t / demo.dur;
    const pts = demo.pts.map(p => p.isVector3 ? (ctx ? ctx.screen(p) : sp(p)) : p);
    let x, y, press = 0;
    if (demo.kind === 'tap') {
      const per = (demo.dur - .4) / pts.length, i = Math.min(pts.length - 1, Math.floor(demo.t / per)), f = (demo.t - i * per) / per;
      x = pts[i].x; y = pts[i].y - (1 - Math.min(1, f * 2.5)) * 30; press = f > .4 && f < .7 ? 1 : 0;
    } else if (demo.kind === 'circle') {
      const a = Math.max(0, k - .1) * Math.PI * 4, R = demo.r || 46;
      x = pts[0].x + Math.cos(a) * R; y = pts[0].y + Math.sin(a) * R * .6; press = k > .08 && k < .94 ? 1 : 0;
    } else if (demo.kind === 'hold') {
      const m = pts.length > 1 ? Math.min(1, Math.max(0, (k - .2) / .7)) : 0;
      const p = along(pts, m); x = p.x; y = p.y; press = k > .12 && k < .92 ? 1 : 0;
    } else {
      const m = Math.min(1, Math.max(0, (k - .15) / .75)), p = along(pts, ease(m)); x = p.x; y = p.y; press = k > .1 && k < .93 ? 1 : 0;
    }
    hand.style.transform = 'translate(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px)';
    hand.classList.toggle('press', !!press);
    hand.style.opacity = k < .08 ? k / .08 : k > .95 ? Math.max(0, (1 - k) / .05) : 1;
    if (k >= 1) { demo = null; hand.hidden = true; }
  }
  function along(pts, m) {
    if (pts.length === 1) return pts[0];
    const seg = []; let tot = 0;
    for (let i = 1; i < pts.length; i++) { const l = Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y); seg.push(l); tot += l; }
    let d = m * tot;
    for (let i = 0; i < seg.length; i++) { if (d <= seg[i] || i === seg.length - 1) { const f = seg[i] ? Math.min(1, d / seg[i]) : 1; return { x: lerp(pts[i].x, pts[i + 1].x, f), y: lerp(pts[i].y, pts[i + 1].y, f) }; } d -= seg[i]; }
    return pts[pts.length - 1];
  }

  // ---------- 字幕：照 robot-town 的做法（三行內，太長先縮字再分頁；點一下重聽） ----------
  const cap = $('#cap'), capT = cap.querySelector('.bt');
  cap.querySelector('.spk').innerHTML = G.speakerIcon;
  let capTok = 0, capTimer = 0, capIv = 0, capPages = [], capPage = 0, capT0 = 0;
  function capLines() { const tops = new Set(); capT.querySelectorAll('.nb').forEach(el => tops.add(Math.round(el.offsetTop / 6))); return tops.size; }
  const capFits = z => { capT.innerHTML = G.Z({ z }); return capLines() <= 3; };
  const zText = z => z.map(it => typeof it === 'string' ? it : Array.isArray(it) ? it[0] : '').join('');
  function capSplit(z) {
    const cut = (zz, marks) => { const out = []; let cur = []; zz.forEach(it => { cur.push(it); if (typeof it === 'string' && marks.includes(it)) { out.push(cur); cur = []; } }); if (cur.length) out.push(cur); return out; };
    const segs = cut(z, '。！？；：').flatMap(s => capFits(s) ? [s] : cut(s, '，、'));
    const pages = []; let cur = [];
    segs.forEach(s => { const t = cur.concat(s); if (cur.length && !capFits(t)) { pages.push(cur); cur = s; } else cur = t; });
    if (cur.length) pages.push(cur);
    return pages.map(zz => ({ z: zz, t: zText(zz) }));
  }
  function capRender(i) { capPage = i; capT.innerHTML = G.Z(capPages[i]); capT.classList.remove('in'); void capT.offsetWidth; capT.classList.add('in'); }
  function capShow(k) {
    capTok++; clearTimeout(capTimer); clearInterval(capIv);
    const e = TX[k] || { t: String(k), z: [String(k)] };
    cap.style.fontSize = '';
    capPages = [e];
    if (!capFits(e.z)) {
      if (parseFloat(getComputedStyle(cap).fontSize) > 21) cap.style.fontSize = v.w < 480 ? '20px' : '22px';
      if (!capFits(e.z)) { cap.style.fontSize = ''; capPages = capSplit(e.z); }
    }
    capRender(0); capT0 = performance.now();
    cap.classList.add('on');
    if (capPages.length > 1) capIv = setInterval(capTick, 100);
    return capTok;
  }
  function capTick() {
    const total = capPages.reduce((a, p) => a + p.t.length, 0), pos = G.voicePos();
    const prog = pos != null ? pos : (performance.now() - capT0) / Math.max(1200, total * 220);
    let acc = 0, want = capPages.length - 1;
    for (let i = 0; i < capPages.length; i++) { acc += capPages[i].t.length; if (prog < acc / total) { want = i; break; } }
    if (want > capPage) capRender(want);
  }
  function capHold(tok) {
    if (tok !== capTok) return;
    clearInterval(capIv); clearTimeout(capTimer);
    const last = capPages.length - 1;
    if (capPage < last) capRender(last);
    capTimer = setTimeout(capHide, Math.max(2500, capPages[last].t.length * 250));
  }
  function capHide() { capTok++; clearTimeout(capTimer); clearInterval(capIv); cap.classList.remove('on'); }

  // ---------- 說話：排隊一句一句講；say() 排在後面，sayNow() 先清掉再講；換場景 hush() ----------
  let Q = [], qBusy = false, qTok = 0, qCur = null, lastKey = null;
  function say(...keys) { return new Promise(res => { Q.push({ keys: keys.filter(Boolean), res }); pump(); }); }
  async function pump() {
    if (qBusy) return;
    qBusy = true; const tok = qTok;
    while (Q.length && tok === qTok) {
      const it = Q.shift(); qCur = it;
      for (const k of it.keys) {
        if (tok !== qTok) break;
        lastKey = k;
        const ct = capShow(k);
        await speak(k);
        if (tok === qTok) capHold(ct);
      }
      qCur = null; it.res();
    }
    if (tok === qTok) qBusy = false;
  }
  function hush() { qTok++; const old = Q; Q = []; if (qCur) { const r = qCur.res; qCur = null; r(); } old.forEach(it => it.res()); qBusy = false; stopVoice(); capHide(); }
  function sayNow(...keys) { hush(); return say(...keys); }
  const talking = () => qBusy || Q.length > 0;
  cap.addEventListener('click', e => { e.stopPropagation(); act(); unlockAudio(); if (lastKey) sayNow(lastKey); });
  cap.addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); });

  // ---------- 狀態 ----------
  let mode = 'desk';          // desk | busy | exp | end
  let lastAct = performance.now(), lastHint = 0, idleSaid = 0;
  const act = () => { lastAct = performance.now(); };
  const nextExp = () => { for (let n = 1; n <= 10; n++) if (!S.done.includes(n)) return n; return 0; };
  const allowed = n => !!S.free || S.done.includes(n) || n === nextExp();
  const core = { T, A, S3, scene, cam, v, SFX, tween, wait, clamp, lerp, ease, outBack, say, sayNow, hush, act, sp, FAST, allowed, nextExp, haloAt };

  // ---------- 學習圈、記錄本 ----------
  RING.build();
  RING.show(false);
  BOOK.init({
    list: () => S.book.slice().sort((a, b) => a.n - b.n),
    sfx: k => (SFX[k] || SFX.tap)(),
    replay: n => { const E = EXPS[n]; if (E) sayNow(E.say.end); },
    onClose: () => { act(); },
  });
  const bookBtn = $('#bookBtn');
  bookBtn.innerHTML = A.UI.book;
  bookBtn.addEventListener('click', () => { act(); unlockAudio(); if (mode === 'desk' && S.book.length) { SFX.page(); BOOK.open(); } else SFX.no(); });
  const paintBookBtn = () => { bookBtn.hidden = mode !== 'desk' || !S.book.length; };

  // ---------- 實驗桌 ----------
  const desk = DESK(core);
  core.desk = desk;
  desk.onEnter = n => {
    if (!allowed(n)) { SFX.no(); sayNow('desk.locked'); desk.shake(n); return; }
    runExp(n, 0);
  };
  desk.onBook = () => { if (S.book.length) { SFX.page(); BOOK.open(); } else { SFX.no(); } };

  // ---------- 一個實驗 ----------
  let ctx = null, E = null;
  const EXPS = window.EXPS || [];
  function makeCtx(n, root) {
    let winRes = null;
    const jels = new Set();
    const c = {
      n, root, T, A, S3, scene, core, SFX, tween, wait, clamp, lerp, ease, outBack, FAST, fails: 0, r: 0, hint: null,
      say, sayNow, hush, act,
      W: p => p.clone().add(root.position),
      screen: p => sp(p.clone().add(root.position)),
      view(pts, opts = {}) { const o = new T.Vector3(root.position.x, 0, root.position.z); setCam(fitCam(pts.map(p => p.clone().add(o)), Object.assign({ bottom: c.ctlH || 18 }, opts)), !!opts.snap); c._view = [pts, opts]; },
      ctlH: 0,
      get portrait() { return v.w / Math.max(1, v.h) < .8; },
      ray(p) { const r = new T.Raycaster(); r.setFromCamera(new T.Vector2(p.x / v.w * 2 - 1, -(p.y / v.h) * 2 + 1), cam); return r; },
      ground(p, h = 0) { const hit = new T.Vector3(); return c.ray(p).ray.intersectPlane(new T.Plane(new T.Vector3(0, 1, 0), -h), hit) ? hit.sub(root.position) : null; },
      planeZ(p, z = 0) { const hit = new T.Vector3(); return c.ray(p).ray.intersectPlane(new T.Plane(new T.Vector3(0, 0, 1), -(z + root.position.z)), hit) ? hit.sub(root.position) : null; },
      nearest(p, list, getPos, maxPx = 70) {
        let best = null, bd = maxPx;
        list.forEach(it => { if (!it) return; const q = c.screen(getPos(it)); const d = Math.hypot(q.x - p.x, q.y - p.y); if (d < bd) { bd = d; best = it; } });
        return best;
      },
      jel(o, k = 150, d = 7) { S3.jelly(o, k, d); jels.add(o); return o; },
      poke: (o, a) => poke(o, a),
      _jels: jels,
      button(o) { const b = button(o); c.ctlH = 120; return b; },
      clearButtons() { ctl.innerHTML = ''; c.ctlH = 0; },
      // 等一個手勢做完：實驗程式呼叫 c.win()
      until(hint) { c.fails = 0; if (hint) c.hint = hint; lastHint = performance.now(); act(); return new Promise(res => { winRes = res; }); },
      win() { const r = winRes; winRes = null; if (r) { RESTART.progress(); r(); } },
      get waiting() { return !!winRes; },
      fail(key) {
        c.fails++; SFX.no();
        if (key) sayNow(key);
        if (c.fails >= 3) { setTimeout(() => { if (ctx === c && E && E.demo) playDemo(E.demo(c)); }, FAST ? 10 : 600); if (E.assist) setTimeout(() => { if (ctx === c && c.waiting) E.assist(c); }, FAST ? 20 : 2400); }
      },
      // 學習圈：第一次出現某一步時，用白話解釋那個詞
      async step(s) {
        RING.go(s);
        const k = ['h', 'x', 'r'][s];
        if (k && !S.seen[k]) { S.seen[k] = 1; save(); await say('g.' + k + '1'); }
      },
      async lap() { S.round = (S.round || 0) + 1; c.laps++; save(); mineHide(); await RING.lap(() => { SFX.up3(4); setTimeout(() => SFX.chord(), FAST ? 0 : 400); }); },
      laps: 0,
      setRound(r) { c.r = r; S.round = r; save(); },
      // ---- 假設 ----
      async guessMatch(spec) {
        await c.step(0);
        c.hint = 'g.match'; say('g.match');
        const g = await HYP.match(Object.assign({ mode: 'guess', env: hypEnv() }, spec));
        await HYP.close();
        mineMatch(spec, g);
        return g;
      },
      async guessChoice(spec) {
        await c.step(0);
        c.hint = 'g.choose'; say('g.choose');
        const g = await HYP.choice(Object.assign({ mode: 'guess', env: hypEnv() }, spec));
        await HYP.close();
        mineChoice(spec, g);
        return g;
      },
      // 自己做的假設（放標記）：顯示在「我的假設」
      mine(html) { mineShow(html); },
      // ---- 結果：跟假設比一比 ----
      async checkMatch(spec, guess, truth) {
        await c.step(2);
        const same = guess.every((a, i) => a === truth[i]);
        if (same) { mineMark(true); SFX.tick(); await say('g.same'); return true; }
        mineMark(false);
        await say('g.diff');
        c.hint = 'g.fixm'; say('g.fixm');
        await HYP.match(Object.assign({}, spec, { mode: 'fix', guess, truth, env: hypEnv() }));
        await HYP.close();
        mineMatch(spec, truth, true);
        return false;
      },
      async checkChoice(spec, guess, truth) {
        await c.step(2);
        if (guess === truth) { mineMark(true); SFX.tick(); await say('g.same'); return true; }
        mineMark(false);
        await say('g.diff');
        c.hint = 'g.fixc'; say('g.fixc');
        await HYP.choice(Object.assign({}, spec, { mode: 'fix', guess, truth, env: hypEnv() }));
        await HYP.close();
        mineChoice(spec, truth, true);
        return false;
      },
      // 結果是數字或位置（第 4、10 關）：一樣＝打勾；不一樣＝那張假設卡輕搖
      markMine(same) { mineMark(same); if (same) SFX.tick(); },
      ring: RING, playDemo: d => playDemo(d), haloAt,
    };
    Object.defineProperty(c, 'strong', { get: () => c.fails >= 2 });
    return c;
  }
  function hypEnv() {
    return {
      voice: key => { if (key) sayNow(key); },
      sfx: k => (SFX[k] || SFX.tap)(),
      act,
      nope: () => sayNow('g.nope'),
      demo: async () => { const p = HYP.cur && HYP.cur.demo(); if (p) playDemo({ kind: p.length > 1 ? 'drag' : 'tap', pts: p, dur: 1.8 }); await wait(1.9); },
    };
  }
  // 「我的假設」：假設做完，卡片縮小收到畫面左下角，實驗時一直看得到
  function mineShow(html) { mine.innerHTML = '<span class="sl-mn-h">' + A.UI.think + '</span><div class="sl-mn-b">' + html + '</div><span class="sl-mn-ok"></span>'; mine.hidden = false; mine.classList.remove('ok', 'no'); poke2(mine); }
  function mineMatch(spec, g, fixed) {
    mineShow(spec.left.map((s, i) => '<span class="sl-mn-r">' + s.svg + '<i class="ar"></i>' + (g[i] >= 0 ? spec.right[g[i]].svg : '') + '</span>').join(''));
    if (fixed) mineMark(true, true);
  }
  function mineChoice(spec, i, fixed) { mineShow('<span class="sl-mn-r one">' + spec.opts[i].svg + '</span>'); if (fixed) mineMark(true, true); }
  function mineMark(ok, quiet) {
    mine.classList.toggle('ok', ok); mine.classList.toggle('no', !ok);
    mine.querySelector('.sl-mn-ok').innerHTML = ok ? A.UI.check : '';
    if (!ok && !quiet) { mine.classList.remove('sl-shake'); void mine.offsetWidth; mine.classList.add('sl-shake'); }
  }
  function mineHide() { mine.hidden = true; mine.innerHTML = ''; }

  async function runExp(n, r0 = 0) {
    if (mode !== 'desk' || !EXPS[n]) return;
    mode = 'busy'; hush(); BOOK.close(); paintBookBtn();
    S.cur = n; S.round = r0; save();
    SFX.door();
    E = EXPS[n];
    const root = new T.Group(); root.position.set(0, -4, 0); scene.add(root);
    ctx = makeCtx(n, root);
    ctx.r = r0;
    ctx.laps = (S.book.find(b => b.n === n) ? 0 : 0) + r0;
    desk.focus(n);
    await desk.hide(true);
    E.build(ctx);
    root.traverse(o => { if (o.isMesh && o.castShadow !== false) { o.castShadow = true; o.receiveShadow = true; } });
    tween(.8, k => { root.position.y = lerp(-4, 0, outBack(k)); });
    camSpeed = .04;
    await wait(.85);
    camSpeed = .06;
    RING.reset(r0); RING.show(true);
    mode = 'exp'; act();
    try { await E.play(ctx, r0); } catch (e) { console.error(e); }
    if (ctx === null) return;
    // ---- 結論＋記錄本 ----
    mode = 'busy';
    if (demo) { demo = null; hand.hidden = true; }
    RING.go(-1); mineHide(); ctx.clearButtons();
    const laps = Math.max(ctx.laps, 2);
    const talkEnd = say(E.say.end);
    await wait(.6);
    await BOOK.stamp(n, laps);
    await talkEnd;
    const old = S.book.find(b => b.n === n);
    if (old) old.laps = Math.max(old.laps, laps); else S.book.push({ n, laps });
    const fresh = !S.done.includes(n);
    if (fresh) { S.done.push(n); S.done.sort((a, b) => a - b); }
    S.cur = 0; S.round = 0; save();
    RING.show(false);
    if (E.exit) E.exit(ctx);
    await tween(.6, k => { root.position.y = lerp(0, -5, ease(k)); });
    scene.remove(root);
    root.traverse(o => { if (o.geometry) o.geometry.dispose(); });
    ctx = null; E = null;
    await desk.hide(false);
    deskCam(false);
    desk.refresh();
    mode = 'desk'; act(); idleSaid = 0; paintBookBtn();
    if (n === 10 && !S.ended) { await wait(.4); runSummary(); }
  }

  // ---------- 總結（第 10 關做完後）：連連看複習 → 翻記錄本＋圓環轉十圈以上 → 總結四句 → 自由玩 ----------
  async function runSummary() {
    mode = 'end'; hush(); paintBookBtn(); BOOK.close();
    for (let n = 1; n <= 10; n++) { if (!S.done.includes(n)) S.done.push(n); if (!S.book.find(b => b.n === n)) S.book.push({ n, laps: 2 }); }
    S.done.sort((a, b) => a - b); save();
    desk.refresh(); deskCam(false);
    RING.reset(0); RING.show(true);
    await say('sum.0');
    for (const half of [[1, 2, 3, 4, 5], [6, 7, 8, 9, 10]]) {
      const order = G.shuffle(half);
      const spec = {
        left: half.map(n => ({ svg: A.expIcon(n), say: null })),
        right: order.map(n => ({ svg: A.resIcon(n), say: null })),
        truth: half.map(n => order.indexOf(n)), rkeys: '12345',
        onLink: i => sayNow('k' + half[i]),
      };
      sumHint = 'sum.match';
      say('sum.match');
      await HYP.match(Object.assign({ mode: 'review', env: hypEnv() }, spec));
      await wait(.8);
      await HYP.close();
      while (talking()) await wait(.2);
    }
    sumHint = null;
    const total = S.book.reduce((a, b) => a + (b.laps || 2), 0);
    const pages = S.book.slice().sort((a, b) => a.n - b.n);
    say('sum.book');
    await Promise.all([BOOK.flipAll(pages), RING.spinMany(12, total, i => SFX.note(i % 11))]);
    for (const k of ['sum.1', 'sum.2', 'sum.3', 'sum.4']) {
      if (k === 'sum.3') { RING.lap(() => SFX.up3(6)); }
      await say(k);
    }
    SFX.chord();
    S.free = true; S.ended = true; save();
    RING.show(false);
    await say('sum.free');
    mode = 'desk'; act(); paintBookBtn(); desk.refresh();
  }
  let sumHint = null;

  // ---------- 實驗桌相機 ----------
  function deskCam(snap) { setCam(fitCam(desk.framePts(), { elev: 42, elevPt: 52, bottom: 24 }), snap); }

  // ---------- 輸入 ----------
  const activation = ev => ev.type === 'keydown' || (ev.type === 'pointerup' && ev.pointerType !== 'mouse') || (ev.type === 'pointerdown' && ev.pointerType === 'mouse');
  addEventListener('pointerdown', ev => { if (activation(ev)) firstTouch(); }, true);
  addEventListener('pointerup', ev => { if (activation(ev)) firstTouch(); else unlockAudio(); }, true);
  addEventListener('touchend', () => unlockAudio(), { passive: true, capture: true });
  addEventListener('keydown', ev => { if (activation(ev)) firstTouch(); }, true);
  function firstTouch() {
    unlockAudio();
    if (started) return;
    started = true;
    if (mode === 'desk' && !S.done.length && !QS.has('desk') && !QS.has('e')) say('intro.1', 'intro.2', 'intro.3');
  }
  const local = ev => { const r = host.getBoundingClientRect(); return { x: ev.clientX - r.left, y: ev.clientY - r.top, ev, type: ev.pointerType, t: performance.now() }; };
  let ptrId = null;
  host.addEventListener('pointerdown', ev => {
    if (ev.button > 0) return;
    if (ptrId !== null) { if (mode === 'exp' && E && E.multi && !HYP.open) { ev.preventDefault(); act(); E.down(ctx, local(ev)); } return; }
    ev.preventDefault(); ptrId = ev.pointerId;
    try { host.setPointerCapture(ev.pointerId); } catch (e) { /* ignore */ }
    act();
    const p = local(ev);
    if (mode === 'desk') desk.down(p);
    else if (mode === 'exp' && E && E.down && !HYP.open) E.down(ctx, p);
  });
  host.addEventListener('pointermove', ev => {
    const p = local(ev);
    if (ptrId === null) { if (ev.pointerType === 'mouse') { if (mode === 'desk') desk.hover(p); else if (mode === 'exp' && E && E.hover) E.hover(ctx, p); } return; }
    if (ev.pointerId !== ptrId) return;
    act();
    if (mode === 'desk') desk.move(p);
    else if (mode === 'exp' && E && E.move && !HYP.open) E.move(ctx, p);
  });
  function endPtr(ev) {
    if (ev.pointerId !== ptrId) return;
    ptrId = null;
    const p = local(ev); p.cancel = ev.type === 'pointercancel';
    if (mode === 'desk') desk.up(p);
    else if (mode === 'exp' && E && E.up) E.up(ctx, p);
  }
  host.addEventListener('pointerup', endPtr);
  host.addEventListener('pointercancel', endPtr);
  const held = new Set();
  addEventListener('keydown', ev => {
    if (ev.ctrlKey || ev.metaKey || ev.altKey) return;
    const k = keyName(ev);
    if (!k) return;
    ev.preventDefault();
    act();
    const rep = ev.repeat || held.has(k);
    held.add(k);
    if (BOOK.key(k)) return;
    if (HYP.open) return;
    if (mode === 'desk') { if (!rep && /^\d$/.test(k)) desk.onEnter(k === '0' ? 10 : +k); return; }
    if (mode === 'exp') {
      if (k === 'enter' && RING.waiting && !rep) { RING.tapKey(); return; }
      if (E && E.key) E.key(ctx, k, true, rep);
    }
  });
  addEventListener('keyup', ev => {
    const k = keyName(ev);
    if (!k) return;
    held.delete(k);
    if (mode === 'exp' && E && E.key && !HYP.open) E.key(ctx, k, false);
  });
  addEventListener('blur', () => { [...held].forEach(k => { if (E && E.key && ctx) E.key(ctx, k, false); }); held.clear(); });

  // ---------- 給家長 ----------
  const info = $('#info'), infoBtn = $('#infoBtn');
  const setInfo = on => { info.hidden = !on; infoBtn.setAttribute('aria-expanded', on ? 'true' : 'false'); };
  infoBtn.addEventListener('click', () => setInfo(info.hidden));
  $('#infoClose').addEventListener('click', () => setInfo(false));

  // ---------- 重來鈕（右上角，聲音鈕旁邊） ----------
  // 實驗裡：這一圈重來——重新載入，從存檔的 S.cur／S.round 接著做（道具重設）；進度不丟。
  // 在實驗桌前：回到桌子的起點（?desk=1）。總結時藏起來。
  let rstMode = '';
  function rstSync() {
    const m = mode === 'exp' || (mode === 'busy' && ctx) ? 'exp' : mode;
    if (m === rstMode) return;
    rstMode = m;
    if (m === 'exp') RESTART.set(() => { save(); RESTART.reload({}); });
    else if (m === 'desk') RESTART.set(() => RESTART.reload({ desk: 1 }), { hint: false });
    else if (m === 'end') RESTART.set(null);
  }

  // ---------- 每一畫面 ----------
  let lastW = 0, lastH = 0;
  const tmp = new T.Vector3();
  v.on((dt, t) => {
    rstSync();
    if (v.w !== lastW || v.h !== lastH) {
      lastW = v.w; lastH = v.h;
      if (ctx && ctx._view) ctx.view(ctx._view[0], Object.assign({}, ctx._view[1], { snap: true }));
      else deskCam(true);
    }
    for (const tw of [...tweens]) {
      tw.t += dt;
      const k = Math.min(1, tw.t / tw.dur);
      tw.f(k);
      if (k >= 1) { tweens.delete(tw); tw.res(); }
    }
    const now = performance.now(), idle = (now - lastAct) / 1000;
    desk.update(dt, t, mode === 'desk', idle);
    if (mode === 'desk' && !S.free && !BOOK.isOpen) {
      if (idle > 16 && idleSaid === 0 && !talking()) { idleSaid = 1; say('desk.idle'); }
      if (idle < 1 && idleSaid) idleSaid = 0;
    }
    // 實驗
    let glows = [];
    if (ctx) {
      ctx._jels.forEach(o => wobble(o, dt));
      if (E && E.frame) E.frame(ctx, dt, t);
      if (mode === 'exp' && E && E.glow && !HYP.open) glows = E.glow(ctx) || [];
      // 15 秒沒動作：小手示範＋重講這一步的提示
      if (mode === 'exp' && idle > 15 && now - lastHint > 15000 && !talking()) {
        lastHint = now;
        if (HYP.open && HYP.cur) { const p = HYP.cur.demo(); if (p) playDemo({ kind: p.length > 1 ? 'drag' : 'tap', pts: p }); }
        else if (E.demo) playDemo(E.demo(ctx));
        if (ctx.hint) say(ctx.hint);
      }
    }
    if (mode === 'end' && sumHint && HYP.open && idle > 15 && now - lastHint > 15000 && !talking()) {
      lastHint = now; const p = HYP.cur && HYP.cur.demo(); if (p) playDemo({ kind: 'drag', pts: p }); say(sumHint);
    }
    // 光暈（5 秒沒動作、或失敗兩次，就更亮）
    const breathe = .5 + .5 * Math.sin(t * 2.6), boost = (idle > 5 ? .25 : 0) + (ctx && ctx.strong ? .2 : 0);
    for (let i = 0; i < Math.max(glows.length, HALOS.length); i++) {
      const g = glows[i], h = haloAt(i);
      h.visible = !!g;
      if (!g) continue;
      h.position.copy(g.pos).add(ctx.root.position);
      const s = g.size * (1 + .08 * breathe + (g.strong ? .15 : 0));
      h.scale.set(s, s, 1);
      h.material.color.setHex(g.color || A.C.coral);
      h.material.opacity = Math.min(1, (g.op != null ? g.op : .38) + .28 * breathe + boost);
    }
    // 鍵帽（觸控裝置不顯示，CSS 處理）
    const caps = mode === 'exp' && E && E.caps && !HYP.open ? E.caps(ctx) || [] : mode === 'desk' && !BOOK.isOpen ? desk.caps() : [];
    for (let i = 0; i < Math.max(caps.length, CAPS.length); i++) {
      const c = caps[i], el = capEl(i);
      if (!c) { el.classList.add('off'); continue; }
      const q = sp(mode === 'exp' ? tmp.copy(c.pos).add(ctx.root.position) : c.pos);
      el.classList.remove('off'); el.textContent = c.text;
      el.classList.toggle('cur', !!c.cur);
      el.style.transform = 'translate(' + q.x.toFixed(1) + 'px,' + q.y.toFixed(1) + 'px) translate(-50%,-100%)';
    }
    demoFrame(dt);
    const kc = 1 - Math.pow(camSpeed, dt);
    cam.position.lerp(camWant.pos, kc); camLook.lerp(camWant.look, kc); cam.lookAt(camLook); cam.updateMatrixWorld();
    sun.target.position.copy(camLook); sun.position.copy(camLook).add(tmp.set(-7, 15, 9));
  });

  // ---------- 開始：讀進度（或測試網址） ----------
  const qn = k => QS.has(k) ? +QS.get(k) : null;
  if (QS.has('done')) { const d = clamp(qn('done') || 0, 0, 10); S.done = []; S.book = []; for (let n = 1; n <= d; n++) { S.done.push(n); S.book.push({ n, laps: 2 }); } S.free = d >= 10; S.ended = d >= 10; S.cur = 0; save(); }
  if (QS.has('e')) {
    const n = clamp(qn('e') || 1, 1, 10);
    S.done = []; S.book = []; for (let k = 1; k < n; k++) { S.done.push(k); S.book.push({ n: k, laps: 2 }); }
    S.free = false; S.ended = false; S.seen = n > 1 ? { h: 1, x: 1, r: 1 } : {}; save();
  }
  desk.refresh();
  deskCam(true);
  paintBookBtn();
  if (QS.has('end')) { S.done = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]; S.book = S.done.map(n => ({ n, laps: n === 4 ? 3 : n === 1 || n === 3 || n === 10 ? 3 : 2 })); S.ended = false; S.seen = { h: 1, x: 1, r: 1 }; save(); setTimeout(runSummary, 300); }
  else if (QS.has('e')) { const n = clamp(qn('e') || 1, 1, 10), r = clamp(qn('round') || 0, 0, 3); setTimeout(() => runExp(n, r), 300); }
  else if (S.cur && !QS.has('desk') && allowed(S.cur)) { const n = S.cur, r = clamp(S.round || 0, 0, 3); setTimeout(() => runExp(n, r), 600); }

  // 測試用
  window.__lab = {
    state: () => ({ mode, done: S.done.slice(), book: S.book.slice(), free: !!S.free, next: nextExp(), exp: ctx ? { n: ctx.n, r: ctx.r, laps: ctx.laps, fails: ctx.fails, hint: ctx.hint, waiting: ctx.waiting } : null, ring: { step: RING.step, laps: RING.laps, waiting: RING.waiting }, hyp: HYP.open ? HYP.cur.probe() : null, bookOpen: BOOK.isOpen, talking: talking(), cap: cap.classList.contains('on') ? cap.textContent : '' }),
    probe: () => { if (E && E.probe && ctx) { try { return E.probe(ctx); } catch (e) { return { err: String(e) }; } } return desk.probe(); },
    meshes: () => { let n = 0; scene.traverseVisible(o => { if (o.isMesh || (o.isSprite && o.material.opacity > 0)) n++; }); return n; },
    go: n => runExp(n, 0),
    say: (...k) => sayNow(...k),
    cam: () => ({ pos: cam.position.toArray().map(x => +x.toFixed(2)), look: camWant.look.toArray().map(x => +x.toFixed(2)), fov: cam.fov, w: v.w, h: v.h }),
  };
})();
