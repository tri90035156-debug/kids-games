// 《機器人出任務》：一座 3D 黏土小鎮、十個任務站、十種手勢。
// 流程：小鎮（自由開車）→ 開到亮亮的站停一下 → 相機滑到任務場景（同一張桌子、道具從桌面升起來）→ 三小關 →
//       回小鎮、裝備「喀」一聲裝上身 → 下一站 …… → 第 10 關自己選裝備 → 結尾 → 自由玩。
// 每關都有三條路：鍵盤（ev.code）、手指（觸控）、點目標（它自己做）。提示階梯：5 秒光暈變亮、15 秒小手示範、
// 失敗兩次光暈指出正確位置、三次自動示範。失敗只會彈回＋輕搖＋低木魚，講怎麼改。
// 測試網址：?fast=1、?m=N&fast=1（直接進第 N 關，前面算做完）、?m=N&sub=S、?town=1&done=5、?end=1。console：__town.state()、__town.say('m8.aha')。
(() => {
  'use strict';
  const { $, S, save, setSave, speak, stopVoice, unlockAudio, keyName } = G;
  const { T, lerp, ease, jelly, poke, wobble } = S3;
  const A = ART, snd = G.snd, FAST = G.FAST;
  const QS = new URLSearchParams(location.search);
  setSave('robot-town-v1');
  if (!Array.isArray(S.done)) S.done = [];
  if (!Array.isArray(S.gear)) S.gear = [];

  // ---------- 場景 ----------
  const host = $('#v3');
  const scene = new T.Scene();
  scene.background = new T.Color(A.C.bg);
  scene.fog = new T.Fog(A.C.bg, 60, 130);
  const cam = new T.PerspectiveCamera(38, 1, .1, 200);
  cam.position.set(0, 20, 26); cam.lookAt(0, 0, 0);
  let v;
  try { v = S3.view(host, { scene, cam }); }
  catch (e) { $('#nogl').hidden = false; host.hidden = true; return; }
  scene.add(new T.HemisphereLight(0xFFF6E6, 0xD9DCC4, 1.9));
  const sun = new T.DirectionalLight(0xFFE7C6, 2.5);
  sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048); sun.shadow.radius = 6; sun.shadow.bias = -.0005;
  Object.assign(sun.shadow.camera, { left: -14, right: 14, top: 14, bottom: -14, near: 1, far: 60 });
  scene.add(sun); scene.add(sun.target);
  const under = new T.Mesh(new T.PlaneGeometry(240, 240), new T.MeshStandardMaterial({ color: 0xEFE5D3, roughness: 1 }));
  under.rotation.x = -Math.PI / 2; under.position.y = -.85; under.receiveShadow = true; scene.add(under);

  // ---------- 補間、等待 ----------
  const tweens = new Set();
  function tween(dur, f) { return new Promise(res => { const tw = { t: 0, dur: Math.max(.001, dur), f, res }; f(0); tweens.add(tw); }); }
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
    snap: () => { snd.mallet(784, 0, .14, .28); snd.mallet(196, 0, .2, .32); },
    up3: (i = 0) => [0, 1, 2].forEach(k => snd.mallet(PEN[clamp(i + 2 + k * 2, 0, 10)], k * .1, .12, .8)),
    chord: () => { [5, 7, 8, 10].forEach((n, k) => snd.mallet(PEN[n], k * .1, .13)); snd.pad([261.6, 329.6, 392, 523.3], .05, .055, 2.6); },
    door: () => snd.pad([261.6, 329.6, 392, 523.3], 0, .06, 2.2),
    land: () => snd.mallet(392, 0, .1, .4),
    bump: (soft = 0) => {     // 撞到東西：木琴，連續撞會換音、變小聲
      const now = performance.now(); if (now - lastBump < 70) return; lastBump = now;
      snd.mallet(PEN[(bumpN++) % 8], 0, soft ? .08 : .15, .6);
    },
    leaf: () => snd.drop(0, .09),
    near: () => snd.mallet(PEN[9], 0, .1, .6),
    step: (n = 0) => snd.wood(n % 2 ? 560 : 640, 0, .07),
    dust: () => snd.wood(1300 + Math.random() * 200, 0, .03),
    rotor: () => snd.glide(320, 290, .3, .025),
    splash: () => { snd.drop(0, .14); snd.drop(.08, .1); snd.glide(260, 120, .5, .05); },
    deep: n => snd.mallet(PEN[clamp(n, 0, 10)] / 2, 0, .12, .9),
    flash: () => { snd.mallet(PEN[10], 0, .1, .3); snd.mallet(PEN[9], .06, .08, .3); },
    pick: () => snd.mallet(PEN[6], 0, .1, .3),
    drop: () => snd.mallet(PEN[3], 0, .12, .4),
    hover: () => snd.wood(1150, 0, .035),
    beat: n => snd.wood(n ? 760 : 880, 0, .05),
  };
  let started = false;
  Object.keys(SFX).forEach(k => { const f = SFX[k]; SFX[k] = (...a) => { if (started) f(...a); }; });

  // ---------- 相機：固定朝北、斜斜往下看；fit 把一堆點框進畫面（留出上方圖示、下方按鈕的位置） ----------
  const camWant = { pos: cam.position.clone(), look: new T.Vector3() }, camLook = new T.Vector3();
  let follow = null;          // 小鎮：{ off: 相機相對主角的位移 }
  let camSpeed = .06;
  const tmpCam = new T.PerspectiveCamera(38, 1, .1, 200);
  function fitCam(pts, { elev = 40, elevPt = 0, top = 72, bottom = 18, side = 14, fov = 0 } = {}) {
    const asp = v.w / Math.max(1, v.h), pt = asp < .8;
    if (pt && elevPt) elev = elevPt;
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
      let lo = 4, hi = 200;
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
      // 只沿著地面滑：上下置中＝往北／南移，左右置中＝往東／西移（看的點一直在地面高度）
      target.z -= ((r.y0 + r.y1) / 2 - (topLim + botLim) / 2) * wpn / Math.max(.3, Math.sin(e));
      target.x += ((r.x0 + r.x1) / 2) * wpn * asp;
    }
    hi = search();
    place(hi);
    return { pos: tmpCam.position.clone(), look: target.clone(), fov: fv };
  }
  function setCam(f, snap = false) {
    camWant.pos.copy(f.pos); camWant.look.copy(f.look);
    if (cam.fov !== f.fov) { cam.fov = f.fov; cam.updateProjectionMatrix(); }
    if (snap) { cam.position.copy(f.pos); camLook.copy(f.look); cam.lookAt(camLook); }
  }

  // ---------- 疊在畫布上的 HTML：鍵帽、三小關的點、小手示範、搖桿、任務按鈕 ----------
  const ov = $('#ov');
  const CAPS = [];
  const capEl = i => { while (CAPS.length <= i) { const k = document.createElement('kbd'); k.className = 'kc rt-kc'; ov.appendChild(k); CAPS.push(k); } return CAPS[i]; };
  const pips = $('#pips'), PIPS = [...pips.children];
  const hand = $('#hand'), stick = $('#stick'), ctl = $('#ctl');
  const HALOS = [];
  const haloAt = i => { while (HALOS.length <= i) { const h = A.halo(1); scene.add(h); HALOS.push(h); } return HALOS[i]; };
  const sp = w => v.toScreen(w);
  const ICON = {
    play: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5.5v13l10.5-6.5z" fill="currentColor"/></svg>',
    erase: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4.5 12a7.5 7.5 0 1 0 2.2-5.3"/><path d="M4 4.5v4h4"/></svg>',
    bulb: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 18h6M10 21h4"/><path d="M12 3a6 6 0 0 0-3.6 10.8c.7.6 1.1 1.3 1.1 2.2h5c0-.9.4-1.6 1.1-2.2A6 6 0 0 0 12 3z" class="f"/></svg>',
    foot: '<svg viewBox="0 0 24 24" aria-hidden="true"><ellipse cx="12" cy="14.5" rx="5" ry="6.5" fill="currentColor"/><circle cx="8" cy="5.5" r="1.7" fill="currentColor"/><circle cx="11.5" cy="4.2" r="1.8" fill="currentColor"/><circle cx="15.2" cy="5.2" r="1.6" fill="currentColor"/></svg>',
    legs: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="5" y="5" width="14" height="6" rx="2"/><path d="M7 11l-1 4 2 4M17 11l1 4-2 4M10 11v8M14 11v8"/></svg>',
    wheels: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="4" y="6" width="16" height="7" rx="2"/><circle cx="8" cy="17" r="2.6"/><circle cx="16" cy="17" r="2.6"/></svg>',
    go: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h13M13 6l6 6-6 6"/></svg>',
  };
  // 任務按鈕：圖示＋（桌機）鍵帽；按下／放開都回呼
  function button({ icon, key = '', cls = '', down, up, label = '' }) {
    const b = document.createElement('button');
    b.className = 'rt-btn ' + cls; b.type = 'button'; b.setAttribute('aria-label', label);
    b.innerHTML = (ICON[icon] || icon) + (key ? '<kbd class="kc rt-bk">' + key + '</kbd>' : '');
    b.addEventListener('pointerdown', ev => { ev.preventDefault(); act(); unlockAudio(); b.classList.add('on'); poke2(b); if (down) down(ev); });
    const u = ev => { b.classList.remove('on'); if (up) up(ev); };
    b.addEventListener('pointerup', u); b.addEventListener('pointercancel', u); b.addEventListener('pointerleave', ev => { if (b.classList.contains('on')) u(ev); });
    ctl.appendChild(b);
    return b;
  }
  function poke2(el) { el.classList.remove('pk'); void el.offsetWidth; el.classList.add('pk'); }

  // ---------- 小手示範：沿著一串點做一遍（點、拖、按住、畫線） ----------
  let demo = null;
  function playDemo(d) {
    if (!d || !d.pts || !d.pts.length) return;
    demo = { ...d, t: 0, dur: d.dur || (d.kind === 'tap' ? .9 * d.pts.length + .4 : 2.2) };
    hand.hidden = false;
  }
  function demoFrame(dt) {
    if (!demo) return;
    demo.t += dt;
    const k = demo.t / demo.dur, pts = demo.pts.map(p => sp(p));
    let x, y, press = 0;
    if (demo.kind === 'tap') {
      const per = (demo.dur - .4) / pts.length, i = Math.min(pts.length - 1, Math.floor(demo.t / per)), f = (demo.t - i * per) / per;
      x = pts[i].x; y = pts[i].y - (1 - Math.min(1, f * 2.5)) * 30; press = f > .4 && f < .7 ? 1 : 0;
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

  // ---------- 字幕：旁白講到哪句，上方就出現那句（有注音）；講完停一下再淡出，點一下重聽 ----------
  // 最多三行：先縮字；手機上還是太長，就在句號、分號後面切成幾頁，照配音播到哪裡換頁。
  const cap = $('#cap'), capT = cap.querySelector('.bt');
  cap.querySelector('.spk').innerHTML = G.speakerIcon;
  let capTok = 0, capTimer = 0, capIv = 0, capPages = [], capPage = 0, capT0 = 0;
  function capLines() {
    const tops = new Set();
    capT.querySelectorAll('.nb').forEach(el => tops.add(Math.round(el.offsetTop / 6)));
    return tops.size;
  }
  const capFits = z => { capT.innerHTML = G.Z({ z }); return capLines() <= 3; };
  const zText = z => z.map(it => typeof it === 'string' ? it : Array.isArray(it) ? it[0] : '').join('');
  function capSplit(z) {
    const cut = (zz, marks) => {
      const out = []; let cur = [];
      zz.forEach(it => { cur.push(it); if (typeof it === 'string' && marks.includes(it)) { out.push(cur); cur = []; } });
      if (cur.length) out.push(cur);
      return out;
    };
    const segs = cut(z, '。！？；').flatMap(s => capFits(s) ? [s] : cut(s, '，、'));
    const pages = []; let cur = [];
    segs.forEach(s => { const t = cur.concat(s); if (cur.length && !capFits(t)) { pages.push(cur); cur = s; } else cur = t; });
    if (cur.length) pages.push(cur);
    return pages.map(zz => ({ z: zz, t: zText(zz) }));
  }
  function capRender(i) {
    capPage = i; capT.innerHTML = G.Z(capPages[i]);
    capT.classList.remove('in'); void capT.offsetWidth; capT.classList.add('in');
  }
  function capShow(k) {
    capTok++; clearTimeout(capTimer); clearInterval(capIv);
    const e = TX[k] || { t: String(k), z: [String(k)] };
    cap.style.fontSize = '';
    capPages = [e];
    if (!capFits(e.z)) {
      if (parseFloat(getComputedStyle(cap).fontSize) > 22) cap.style.fontSize = '22px';
      if (!capFits(e.z)) { cap.style.fontSize = ''; capPages = capSplit(e.z); }
    }
    capRender(0); capT0 = performance.now();
    cap.classList.add('on');
    if (capPages.length > 1) capIv = setInterval(capTick, 100);
    return capTok;
  }
  // 分頁：照字數比例對到配音的進度（沒有音檔就用靜音等待的長度估）
  function capTick() {
    const total = capPages.reduce((a, p) => a + p.t.length, 0), pos = G.voicePos();
    const prog = pos != null ? pos : (performance.now() - capT0) / Math.max(1200, total * 220);
    let acc = 0, want = capPages.length - 1;
    for (let i = 0; i < capPages.length; i++) { acc += capPages[i].t.length; if (prog < acc / total) { want = i; break; } }
    if (want > capPage) capRender(want);
  }
  // 這句講完：停留 max(2.5 秒, 字數 × 0.25 秒) 再淡出（下一句先來就直接換字）
  function capHold(tok) {
    if (tok !== capTok) return;
    clearInterval(capIv); clearTimeout(capTimer);
    const last = capPages.length - 1;
    if (capPage < last) capRender(last);
    capTimer = setTimeout(capHide, Math.max(2500, capPages[last].t.length * 250));
  }
  function capHide() { capTok++; clearTimeout(capTimer); clearInterval(capIv); cap.classList.remove('on'); }

  // ---------- 說話：一句一句排隊（換場景就取消） ----------
  let talkTok = 0, talkLeft = [];
  async function talk(...keys) {
    const my = ++talkTok;
    for (let i = 0; i < keys.length; i++) {
      const k = keys[i];
      if (my !== talkTok) return;
      if (!k) continue;
      talkLeft = keys.slice(i);
      const tok = capShow(k);
      await speak(k);
      if (my === talkTok) capHold(tok);
    }
  }
  const hush = () => { talkTok++; stopVoice(); capHide(); };
  // 點字幕＝從這句重講（後面排著的句子照講）
  cap.addEventListener('click', e => { e.stopPropagation(); act(); unlockAudio(); if (talkLeft.length && cap.classList.contains('on')) talk(...talkLeft); });
  cap.addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); });   // 不搶焦點：之後按空白鍵不會變成重聽

  // ---------- 狀態 ----------
  let mode = 'town';          // town | busy | mission | ending
  let free = !!S.free;
  let lastAct = performance.now(), lastHint = 0, idleSaid = 0;
  const act = () => { lastAct = performance.now(); };
  const nextStation = () => { for (let n = 1; n <= 10; n++) if (!S.done.includes(n)) return n; return 0; };
  const allowed = n => free || S.done.includes(n) || n === nextStation();
  const core = { T, A, S3, scene, cam, v, SFX, tween, wait, clamp, outBack, lerp, ease, talk, hush, speak, act, sp, FAST, allowed, nextStation, get free() { return free; }, button, ICON, haloAt };

  // ---------- 小鎮 ----------
  const town = TOWN(core);
  core.town = town;
  const bot = town.bot;
  function gearList() {
    if (free) return S.gear.slice();
    return S.done.filter(n => n <= 9);
  }
  function dressBot() { A.setGear(bot, gearList(), !!S.legs); town.refresh(); legsBtnPaint(); }
  core.gearList = gearList;
  // 有四條腿之後：右下角一個「腳／輪子」切換鈕（B 鍵也可以）
  const legsBtn = $('#legsBtn');
  function legsBtnPaint() {
    const has = gearList().includes(7);
    legsBtn.hidden = !has || mode !== 'town';
    legsBtn.innerHTML = (S.legs ? ICON.wheels : ICON.legs) + '<kbd class="kc rt-bk">B</kbd>';
  }
  function toggleLegs() {
    if (!gearList().includes(7) || mode !== 'town') return;
    S.legs = !S.legs; save(); SFX.snap(); poke(bot.userData.jel, .3); dressBot();
  }
  legsBtn.addEventListener('click', () => { act(); toggleLegs(); });
  // 自由玩：點工作坊架子上的裝備＝裝上／拿下
  core.toggleGear = n => {
    if (!free || mode !== 'town') return;
    const i = S.gear.indexOf(n);
    if (i >= 0) S.gear.splice(i, 1); else S.gear.push(n);
    save(); SFX.snap(); poke(bot.userData.jel, .35); dressBot(); town.shelfPop(n);
  };

  // ---------- 任務 ----------
  let ctx = null, M = null;
  function missionPos(n) { return town.stationPos(n).multiplyScalar(.35).setY(0); }
  function makeCtx(n, root) {
    let winRes = null;
    const c = {
      n, root, T, A, S3, scene, core, SFX, tween, wait, clamp, lerp, ease, outBack, FAST, sub: 0, fails: 0,
      bot, gearList, button,
      say: key => talk(key),
      sayNow: key => talk(key),
      act,
      // 座標：任務一律用 root 的區域座標（root 沒有轉、沒有縮放）
      W: p => p.clone().add(root.position),
      L: p => p.clone().sub(root.position),
      screen: p => sp(p.clone().add(root.position)),
      view(pts, opts = {}) { const o = new T.Vector3(root.position.x, 0, root.position.z); setCam(fitCam(pts.map(p => p.clone().add(o)), Object.assign({ bottom: c.ctlH ? c.ctlH + 24 : 18 }, opts)), !!opts.snap); c._view = [pts, opts]; },
      ctlH: 0,
      ray(p) { const r = new T.Raycaster(); r.setFromCamera(new T.Vector2(p.x / v.w * 2 - 1, -(p.y / v.h) * 2 + 1), cam); return r; },
      ground(p, h = 0) { const hit = new T.Vector3(); return c.ray(p).ray.intersectPlane(new T.Plane(new T.Vector3(0, 1, 0), -h), hit) ? hit.sub(root.position) : null; },
      planeZ(p, z = 0) { const hit = new T.Vector3(); return c.ray(p).ray.intersectPlane(new T.Plane(new T.Vector3(0, 0, 1), -(z + root.position.z)), hit) ? hit.sub(root.position) : null; },
      pick(p, objs) { const hit = c.ray(p).intersectObjects(objs.filter(o => o && o.visible), true)[0]; if (!hit) return null; let o = hit.object; while (o && !objs.includes(o)) o = o.parent; return o; },
      // 用螢幕距離挑最近的東西（手指不用點得很準）
      nearest(p, list, getPos, maxPx = 70) {
        let best = null, bd = maxPx;
        list.forEach(it => { if (!it) return; const q = c.screen(getPos(it)); const d = Math.hypot(q.x - p.x, q.y - p.y); if (d < bd) { bd = d; best = it; } });
        return best;
      },
      fail(key) {
        c.fails++;
        SFX.no();
        if (key) talk(key);
        if (c.fails >= 3 && M.demo) { setTimeout(() => { if (ctx === c) playDemo(M.demo(c)); }, FAST ? 10 : 900); if (M.assist) M.assist(c); }
      },
      win() { const r = winRes; winRes = null; if (r) r(); },
      _wait() { return new Promise(res => { winRes = res; }); },
    };
    Object.defineProperty(c, 'strong', { get: () => c.fails >= 2 });
    return c;
  }
  async function runMission(n, sub0 = 0) {
    if (mode !== 'town' || !window.MISSIONS || !MISSIONS[n]) return;
    mode = 'busy'; hush(); legsBtnPaint();
    S.cur = n; S.sub = sub0; save();
    town.stopBot();
    SFX.door();
    M = MISSIONS[n];
    const root = new T.Group(); root.position.copy(missionPos(n)); root.position.y = -4; scene.add(root);
    ctx = makeCtx(n, root);
    follow = null;
    await town.hideDecor(true, M.hideBot);
    M.build(ctx);
    root.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
    tween(FAST ? .05 : .8, k => { root.position.y = lerp(-4, 0, outBack(k)); });
    camSpeed = .04;
    await wait(.85);
    camSpeed = .06;
    mode = 'mission';
    pips.hidden = false;
    let first = true;
    for (let s = sub0; s < 3; s++) {
      ctx.sub = s; ctx.fails = 0; S.sub = s; save();
      PIPS.forEach((p, k) => { p.className = k < s ? 'done' : k === s ? 'cur' : ''; });
      M.start(ctx, s);
      act(); lastHint = performance.now();
      const lines = [];
      if (first && M.say.intro) lines.push(M.say.intro);
      lines.push(M.say.subs[s]);
      if (first && M.say.extra) lines.push(M.say.extra);
      talk(...lines);
      first = false;
      await ctx._wait();
      PIPS[s].className = 'done';
      SFX.up3(s * 2); poke(bot.userData.jel, .2);
      if (s < 2) { await wait(1.1); }
    }
    mode = 'busy';
    if (demo) { demo = null; hand.hidden = true; }
    await talk(M.say.ok);
    await wait(.4);
    pips.hidden = true;
    ctl.innerHTML = ''; ctx.ctlH = 0;
    if (M.exit) M.exit(ctx);
    await tween(FAST ? .05 : .6, k => { root.position.y = lerp(0, -5, ease(k)); });
    scene.remove(root);
    root.traverse(o => { if (o.geometry) o.geometry.dispose(); });
    ctx = null; M = null;
    await town.hideDecor(false);
    camFollow(false);
    const fresh = !S.done.includes(n);
    if (fresh) { S.done.push(n); S.done.sort((a, b) => a - b); }
    S.cur = 0; S.sub = 0; save();
    await wait(.5);
    if (fresh && n <= 9) await ceremony(n);
    else { SFX.chord(); poke(bot.userData.jel, .3); }
    await talk(MISSIONS[n].say.aha);
    if (n === 10 && !free) { await runEnding(); return; }
    mode = 'town'; act(); idleSaid = 0; legsBtnPaint();
  }

  // ---------- 裝備上身的儀式：從站上升起來、畫一道弧線飛到身上、喀一聲、上行三音＋和弦 ----------
  async function ceremony(n) {
    const g = A.gearShow(n);
    const st = town.stationPos(n);
    g.position.copy(st).setY(.3); g.scale.multiplyScalar(.01); scene.add(g);
    const s0 = g.scale.x * 100 * .7, s1 = bot.scale.x;
    SFX.near();
    await tween(FAST ? .05 : .6, k => { g.position.y = lerp(.3, 2.4, ease(k)); g.scale.setScalar(s0 * Math.max(.01, outBack(k))); g.rotation.y = k * 3; });
    await wait(.25);
    const from = g.position.clone();
    const mountW = () => { const m = bot.userData.gears[n]; const p = new T.Vector3(); m.updateWorldMatrix(true, false); m.getWorldPosition(p); return p; };
    await tween(FAST ? .05 : .65, k => {
      const to = mountW();
      g.position.lerpVectors(from, to, ease(k)); g.position.y += 1.6 * 4 * k * (1 - k);
      g.scale.setScalar(lerp(s0, s1, ease(k)));
      g.rotation.y = lerp(3, bot.rotation.y + Math.PI * 2, ease(k));
    });
    scene.remove(g);
    dressBot();
    SFX.snap(); poke(bot.userData.jel, .45);
    setTimeout(() => SFX.up3(4), FAST ? 0 : 160);
    setTimeout(() => SFX.chord(), FAST ? 0 : 520);
    town.shelfPop(n);
    await wait(.8);
  }

  // ---------- 結尾：牌子亮、所有裝備一起亮一下、三句話；之後自由玩 ----------
  async function runEnding() {
    mode = 'ending'; hush(); legsBtnPaint();
    if (!S.done.includes(10)) { S.done.push(10); }
    for (let n = 1; n <= 10; n++) if (!S.done.includes(n)) S.done.push(n);
    S.done.sort((a, b) => a - b);
    free = true; S.free = true; S.gear = [1, 2, 3, 4, 5, 6, 8, 9, 7]; save();
    dressBot();
    town.parkBot();
    camFollow(true);
    await wait(.6);
    town.signOn();
    SFX.chord(); poke(bot.userData.jel, .5);
    await talk('end.1');
    town.sparkle();
    SFX.up3(6);
    await talk('end.2');
    await talk('end.3');
    mode = 'town'; act(); legsBtnPaint();
  }

  // ---------- 小鎮相機：跟著主角 ----------
  let followOff = new T.Vector3(0, 14, 14);
  function townFit() {
    const pts = [];
    const pt = v.w / Math.max(1, v.h) < .8;
    const hw = pt ? 3.9 : 8.5, back = pt ? 5 : 6, front = pt ? 4.2 : 5.5;
    [-hw, hw].forEach(x => { pts.push(new T.Vector3(x, 0, -back), new T.Vector3(x, 0, front)); });
    pts.push(new T.Vector3(0, 2.4, 0));
    const f = fitCam(pts, { elev: 40, top: 70, bottom: 20 });
    followOff = f.pos.clone().sub(f.look);
    return f;
  }
  function camFollow(snap) {
    const f = townFit();
    follow = { fov: f.fov };
    if (cam.fov !== f.fov) { cam.fov = f.fov; cam.updateProjectionMatrix(); }
    const look = bot.position.clone().setY(0);
    camWant.look.copy(look); camWant.pos.copy(look).add(followOff);
    if (snap) { cam.position.copy(camWant.pos); camLook.copy(look); cam.lookAt(camLook); }
  }
  core.camFollow = camFollow;

  // ---------- 輸入：指標與鍵盤都交給現在的模式（小鎮或任務） ----------
  const activation = ev => ev.type === 'keydown' || (ev.type === 'pointerup' && ev.pointerType !== 'mouse') || (ev.type === 'pointerdown' && ev.pointerType === 'mouse');
  addEventListener('pointerdown', ev => { if (activation(ev)) firstTouch(); }, true);
  addEventListener('pointerup', ev => { if (activation(ev)) firstTouch(); else unlockAudio(); }, true);
  addEventListener('touchend', () => unlockAudio(), { passive: true, capture: true });
  addEventListener('keydown', ev => { if (activation(ev)) firstTouch(); }, true);
  function firstTouch() {
    unlockAudio();
    if (started) return;
    started = true;
    if (mode === 'town' && !S.done.length && !QS.has('town')) talk('intro.1', 'intro.2');
  }
  const local = ev => { const r = host.getBoundingClientRect(); return { x: ev.clientX - r.left, y: ev.clientY - r.top, ev, type: ev.pointerType, t: performance.now() }; };
  let ptrId = null;
  host.addEventListener('pointerdown', ev => {
    if (ev.button > 0 || ptrId !== null) return;
    ev.preventDefault(); ptrId = ev.pointerId;
    try { host.setPointerCapture(ev.pointerId); } catch (e) { /* ignore */ }
    act();
    const p = local(ev);
    if (mode === 'town') town.down(p);
    else if (mode === 'mission' && M && M.down) M.down(ctx, p);
  });
  host.addEventListener('pointermove', ev => {
    const p = local(ev);
    if (ptrId === null) { if (ev.pointerType === 'mouse') { if (mode === 'town') town.hover(p); else if (mode === 'mission' && M && M.hover) M.hover(ctx, p); } return; }
    if (ev.pointerId !== ptrId) return;
    act();
    if (mode === 'town') town.move(p);
    else if (mode === 'mission' && M && M.move) M.move(ctx, p);
  });
  function endPtr(ev) {
    if (ev.pointerId !== ptrId) return;
    ptrId = null;
    const p = local(ev); p.cancel = ev.type === 'pointercancel';
    if (mode === 'town') town.up(p);
    else if (mode === 'mission' && M && M.up) M.up(ctx, p);
  }
  host.addEventListener('pointerup', endPtr);
  host.addEventListener('pointercancel', endPtr);
  const held = new Set();
  addEventListener('keydown', ev => {
    if (ev.ctrlKey || ev.metaKey || ev.altKey) return;
    const k = keyName(ev) || (ev.code === 'Tab' ? 'tab' : ev.code === 'ShiftLeft' || ev.code === 'ShiftRight' ? 'shift' : '');
    if (!k) return;
    ev.preventDefault();
    act();
    const rep = ev.repeat || held.has(k);
    held.add(k);
    if (mode === 'town') {
      if (k === 'b' && !rep) { toggleLegs(); return; }
      town.key(k, true, rep);
    } else if (mode === 'mission' && M && M.key) M.key(ctx, k, true, rep);
  });
  addEventListener('keyup', ev => {
    const k = keyName(ev) || (ev.code === 'Tab' ? 'tab' : '');
    if (!k) return;
    held.delete(k);
    if (mode === 'town') town.key(k, false);
    else if (mode === 'mission' && M && M.key) M.key(ctx, k, false);
  });
  addEventListener('blur', () => { [...held].forEach(k => { if (mode === 'town') town.key(k, false); else if (M && M.key && ctx) M.key(ctx, k, false); }); held.clear(); });
  town.onEnter = n => runMission(n);
  core.stickEl = stick;

  // ---------- 給家長 ----------
  const info = $('#info'), infoBtn = $('#infoBtn');
  const setInfo = on => { info.hidden = !on; infoBtn.setAttribute('aria-expanded', on ? 'true' : 'false'); };
  infoBtn.addEventListener('click', () => setInfo(info.hidden));
  $('#infoClose').addEventListener('click', () => setInfo(false));

  // ---------- 每一畫面 ----------
  let lastW = 0, lastH = 0;
  const tmp = new T.Vector3();
  v.on((dt, t) => {
    if (v.w !== lastW || v.h !== lastH) {
      lastW = v.w; lastH = v.h;
      if (follow) camFollow(true);
      else if (ctx && ctx._view) ctx.view(ctx._view[0], Object.assign({}, ctx._view[1], { snap: true }));
    }
    for (const tw of [...tweens]) {
      tw.t += dt;
      const k = Math.min(1, tw.t / tw.dur);
      tw.f(k);
      if (k >= 1) { tweens.delete(tw); tw.res(); }
    }
    const now = performance.now(), idle = (now - lastAct) / 1000;
    town.update(dt, t, mode === 'town', idle);
    if (mode === 'town' && follow) {
      camWant.look.copy(bot.position).setY(0);
      camWant.pos.copy(camWant.look).add(followOff);
    }
    // 小鎮：16 秒沒動作提醒一次；32 秒地上出現點點路
    if (mode === 'town' && !free) {
      if (idle > 16 && idleSaid === 0) { idleSaid = 1; talk('town.idle'); }
      if (idle > 32 && idleSaid === 1) { idleSaid = 2; town.showPath(true); talk('town.path'); }
      if (idle < 1 && idleSaid) { idleSaid = 0; town.showPath(false); }
    }
    // 任務
    let glows = [];
    if (mode === 'mission' && M) {
      if (M.frame) M.frame(ctx, dt, t);
      if (M.glow) glows = M.glow(ctx) || [];
      if (idle > 15 && now - lastHint > 15000) {
        lastHint = now;
        if (M.demo) playDemo(M.demo(ctx));
        talk(M.say.subs[ctx.sub]);
      }
    } else if (M && ctx && M.frame && mode === 'busy') M.frame(ctx, dt, t);
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
      h.material.opacity = (g.op != null ? g.op : .38) + .28 * breathe + boost;
    }
    // 鍵帽（觸控裝置不顯示，CSS 處理）
    const caps = (mode === 'mission' && M && M.caps) ? M.caps(ctx) || [] : mode === 'town' ? town.caps() : [];
    for (let i = 0; i < Math.max(caps.length, CAPS.length); i++) {
      const c = caps[i], el = capEl(i);
      if (!c) { el.classList.add('off'); continue; }
      const q = sp(mode === 'mission' ? tmp.copy(c.pos).add(ctx.root.position) : c.pos);
      el.classList.remove('off'); el.textContent = c.text;
      el.classList.toggle('cur', !!c.cur);
      el.style.transform = 'translate(' + q.x.toFixed(1) + 'px,' + q.y.toFixed(1) + 'px) translate(-50%,-100%)';
    }
    demoFrame(dt);
    // 相機
    const kc = 1 - Math.pow(camSpeed, dt);
    cam.position.lerp(camWant.pos, kc); camLook.lerp(camWant.look, kc); cam.lookAt(camLook); cam.updateMatrixWorld();
    sun.target.position.copy(camLook); sun.position.copy(camLook).add(tmp.set(-8, 16, 10));
  });

  // ---------- 開始：讀進度（或測試網址） ----------
  const qn = k => QS.has(k) ? +QS.get(k) : null;
  if (QS.has('done')) { const d = clamp(qn('done') || 0, 0, 10); S.done = []; for (let n = 1; n <= d; n++) S.done.push(n); free = d >= 10; S.free = free; save(); }
  if (QS.has('m')) {
    const n = clamp(qn('m') || 1, 1, 10);
    S.done = []; for (let k = 1; k < n; k++) S.done.push(k);
    free = false; S.free = false; save();
  }
  dressBot();
  town.parkBot(QS.has('m') ? null : (S.done.length && S.done.length < 10 ? S.done[S.done.length - 1] : null));
  camFollow(true);
  if (QS.has('end')) { S.done = [1, 2, 3, 4, 5, 6, 7, 8, 9]; save(); setTimeout(runEnding, 300); }
  else if (QS.has('m')) {
    const n = clamp(qn('m') || 1, 1, 10), sub = clamp(qn('sub') || 0, 0, 2);
    town.parkBot(n);
    camFollow(true);
    setTimeout(() => runMission(n, sub), 300);
  } else if (S.cur && !QS.has('town') && allowed(S.cur)) {
    // 上次做到一半：從那一關、那一小關接著玩
    const n = S.cur, sub = clamp(S.sub || 0, 0, 2);
    town.parkBot(n); camFollow(true);
    setTimeout(() => runMission(n, sub), 600);
  }

  // 測試用：看狀態、找東西在螢幕上的位置
  window.__town = {
    state: () => ({ mode, free, done: S.done.slice(), gear: gearList(), legs: !!S.legs, next: nextStation(), mission: ctx ? { n: ctx.n, sub: ctx.sub, fails: ctx.fails } : null, bot: town.botState() }),
    probe: () => { if (M && M.probe && ctx) { try { return M.probe(ctx); } catch (e) { return {}; } } return town.probe(); },
    meshes: () => { let n = 0; scene.traverse(o => { if (o.isMesh || o.isSprite) n++; }); return n; },
    go: n => runMission(n),
    say: (...keys) => talk(...keys),   // 測試用：講這幾句（字幕一起出現）
    cam: () => ({ pos: cam.position.toArray().map(x => +x.toFixed(2)), want: camWant.pos.toArray().map(x => +x.toFixed(2)), look: camWant.look.toArray().map(x => +x.toFixed(2)), fov: cam.fov, w: v.w, h: v.h }),
  };
})();
