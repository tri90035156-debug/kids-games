// 3D 關卡工具（2026-11-08 第 3 批起：小水滴、玩偶、颱風、種子、AI、頌缽六個遊戲共用，每個資料夾一份一模一樣的複本，
// 改了要全部同步、md5 比對）。搭配共用引擎 engine.js（封面、標題卡、?ch=N、重來鈕、配音＋注音字幕泡泡）與 space.js（S3：黏土材質、果凍回彈）。
// 一個遊戲只有一個 3D 場景（持續存在）：每關 K.level() 換掉上一關的道具、K.stage() 把畫布放回 #stage（標題卡會把它拿掉）。
// 給每關用的：補間 tween/wait、相機 frame、點選 nearest/ground、拖曳有重量 drag、落地木琴＋果凍、鍵帽 cap、光暈 halo、小手 hand、
// 按鈕 btn（含按住）、3D 連連看 match、粒子 dots、結尾小卡 card、WebGL 開不了的備案。
// 手機：pixelRatio ≤ 2（S3.view）、球 16～24 段、同一畫面物件 ≤ 60（__k.meshes() 量）。
window.K3 = (() => {
  'use strict';
  const T = window.THREE, S3 = window.S3;
  const { $, stage, foot, FAST, Z } = G;
  const sfx = (n, v) => G.sfx(n, v);
  let ok = true, v = null, scene = null, cam = null;
  const host = document.createElement('div');
  host.className = 'k3';
  host.innerHTML = '<div class="k3-v"></div><div class="k3-ov"></div><div class="k3-ctl"></div>';
  const view = host.querySelector('.k3-v'), ov = host.querySelector('.k3-ov'), ctl = host.querySelector('.k3-ctl');
  const lerp = (a, b, k) => a + (b - a) * k;
  const ease = k => k < .5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
  const outBack = k => { const c = 1.6; return 1 + (c + 1) * Math.pow(k - 1, 3) + c * Math.pow(k - 1, 2); };
  const clamp = (x, a, b) => Math.max(a, Math.min(b, x));

  // ---------- 場景、燈光、相機 ----------
  let BG = 0xF7F0E4, sun = null;
  function init(o = {}) {
    if (o.bg != null) BG = o.bg;
    scene = new T.Scene(); scene.background = new T.Color(BG);
    scene.fog = new T.Fog(BG, 40, 90);
    cam = new T.PerspectiveCamera(40, 1, .1, 200); cam.position.set(0, 10, 14); cam.lookAt(0, 0, 0);
    try {
      document.body.appendChild(host); host.style.cssText = 'position:fixed;left:0;top:0;width:10px;height:10px;opacity:0;pointer-events:none';
      v = S3.view(view, { scene, cam, keep: true });
      host.style.cssText = '';
      host.remove();
    } catch (e) { ok = false; host.remove(); return false; }
    scene.add(new T.HemisphereLight(0xFFF6E6, o.ground || 0xD9DCC4, 1.9));
    sun = new T.DirectionalLight(0xFFE7C6, 2.3);
    sun.castShadow = true; sun.shadow.mapSize.set(1024, 1024); sun.shadow.radius = 5; sun.shadow.bias = -.0006;
    Object.assign(sun.shadow.camera, { left: -12, right: 12, top: 12, bottom: -12, near: 1, far: 60 });
    scene.add(sun); scene.add(sun.target);
    v.on(frame);
    return true;
  }
  // 沒有 WebGL：一句話＋回首頁
  function noGL() {
    stage.innerHTML = '<div class="k3-nogl">這台裝置打不開 3D 畫面。<a href="../../">回到所有遊戲</a></div>';
    foot.innerHTML = '';
  }
  // 把畫布放回 #stage（標題卡會把 stage 清空）
  function mount() {
    if (!ok) { noGL(); return false; }
    if (host.parentNode !== stage) { stage.innerHTML = ''; stage.appendChild(host); }
    return true;
  }

  // ---------- 每關的道具：一個 group，換關就丟掉 ----------
  let lv = null, fns = [], jels = new Set(), input = {}, keyFns = [], caps = [], halos = [], hands = [], frameWant = null;
  function level(o = {}) {
    if (lv) { scene.remove(lv); lv.traverse(x => { if (x.geometry) x.geometry.dispose(); }); }
    fns = []; jels = new Set(); input = {}; caps.forEach(c => c.el.remove()); caps = []; halos.forEach(h => scene.remove(h.s)); halos = [];
    hands.forEach(h => h.el.remove()); hands = [];
    keyFns.forEach(f => f()); keyFns = [];
    ctl.innerHTML = ''; ov.querySelectorAll('.k3-card,.k3-tag').forEach(e => e.remove());
    lv = new T.Group(); scene.add(lv);
    return lv;
  }
  // 手機直的嗎
  // 看整個視窗（字幕泡泡變高時 #stage 會變矮，用它判斷會誤判成橫的）
  function portrait() { return innerWidth / Math.max(1, innerHeight) < .8; }
  const on = f => { fns.push(f); return () => { fns = fns.filter(g => g !== f); }; };
  // 一個東西：放進這關、投影子、可以果凍回彈
  function add(o, x = 0, y = 0, z = 0, parent = null) { o.position.set(x, y, z); (parent || lv).add(o); shade(o); return o; }
  const shade = o => { o.traverse(m => { if (m.isMesh && m.userData.noShadow !== true) { m.castShadow = true; m.receiveShadow = true; } }); return o; };
  function jel(o, k = 150, d = 7) { S3.jelly(o, k, d); jels.add(o); return o; }
  const poke = (o, a = .3) => S3.poke(o, a);
  // 把一個物件包一層，外層管位置、內層管果凍（jel 會改 scale）
  function wrap(o, k, d) { const g = new T.Group(), j = new T.Group(); g.add(j); j.add(o); jel(j, k, d); g.userData.j = j; return g; }

  // ---------- 材質、形狀 ----------
  const clay = (color, o = {}) => S3.clay(Object.assign({ color }, o));
  const glass = (color = 0xE6F4FA, opacity = .35) => new T.MeshPhysicalMaterial({ color, roughness: .1, metalness: 0, transparent: true, opacity, depthWrite: false });
  function mesh(geo, mat, x = 0, y = 0, z = 0) { const m = new T.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = m.receiveShadow = true; return m; }
  const box = (w, h, d, mat, x, y, z) => mesh(new T.BoxGeometry(w, h, d), mat, x, y, z);
  const ball = (r, mat, x, y, z, seg = 20) => mesh(new T.SphereGeometry(r, seg, Math.max(10, Math.round(seg * .7))), mat, x, y, z);
  const cyl = (rt, rb, h, mat, x, y, z, seg = 24) => mesh(new T.CylinderGeometry(rt, rb, h, seg), mat, x, y, z);

  // ---------- 補間、等待（?fast=1 變很快） ----------
  const tweens = new Set();
  function tween(dur, f) { return new Promise(res => { tweens.add({ t: 0, dur: Math.max(.001, FAST ? Math.min(dur, .04) : dur), f, res }); f(0); }); }
  const wait = s => tween(FAST ? Math.min(s, .04) : s, () => {});

  // ---------- 相機：把一堆點框進畫面（下方留給按鈕） ----------
  const want = { pos: new T.Vector3(0, 10, 14), look: new T.Vector3() }, look = new T.Vector3();
  const tmpCam = new T.PerspectiveCamera(40, 1, .1, 200);
  function fit(pts, { elev = 38, elevPt = 0, fov = 0, top = 10, side = 12, bottom = 0 } = {}) {
    const w = Math.max(1, v.w), h = Math.max(1, v.h), asp = w / h, pt = asp < .8;
    if (pt && elevPt) elev = elevPt;
    bottom = bottom || (ctl.children.length ? ctl.offsetHeight + 14 : 12);
    const fv = fov || (pt ? 46 : 36);
    tmpCam.fov = fv; tmpCam.aspect = asp; tmpCam.updateProjectionMatrix();
    const e = elev * Math.PI / 180, dir = new T.Vector3(0, Math.sin(e), Math.cos(e));
    const target = pts.reduce((a, p) => a.add(p), new T.Vector3()).divideScalar(pts.length);
    const topLim = 1 - 2 * top / h, botLim = -1 + 2 * bottom / h, xLim = 1 - 2 * side / w;
    const place = d => { tmpCam.position.copy(target).addScaledVector(dir, d); tmpCam.lookAt(target); tmpCam.updateMatrixWorld(); };
    const range = () => { let x0 = 9, x1 = -9, y0 = 9, y1 = -9, z1 = -9; pts.forEach(p => { const q = p.clone().project(tmpCam); x0 = Math.min(x0, q.x); x1 = Math.max(x1, q.x); y0 = Math.min(y0, q.y); y1 = Math.max(y1, q.y); z1 = Math.max(z1, q.z); }); return { x0, x1, y0, y1, z1 }; };
    const search = () => { let lo = 2, hi = 200; for (let n = 0; n < 30; n++) { const d = (lo + hi) / 2; place(d); const r = range(); if (r.z1 < 1 && r.x0 >= -xLim && r.x1 <= xLim && r.y1 <= topLim && r.y0 >= botLim) hi = d; else lo = d; } return hi; };
    let d = 30;
    for (let it = 0; it < 4; it++) {
      d = search(); place(d);
      const r = range(), wpn = d * Math.tan(fv * Math.PI / 360);
      const dy = ((r.y0 + r.y1) / 2 - (topLim + botLim) / 2) * wpn;
      target.y += dy * Math.cos(e); target.z -= dy * Math.sin(e);
      target.x += ((r.x0 + r.x1) / 2) * wpn * asp;
    }
    d = search(); place(d);
    return { pos: tmpCam.position.clone(), look: target.clone(), fov: fv };
  }
  // 框住這些點；之後畫面大小變了會自動重框
  function frameTo(pts, opts = {}, snap = false) {
    frameWant = [pts, opts];
    const f = fit(pts, opts);
    want.pos.copy(f.pos); want.look.copy(f.look);
    if (cam.fov !== f.fov) { cam.fov = f.fov; cam.updateProjectionMatrix(); }
    if (snap) { cam.position.copy(f.pos); look.copy(f.look); cam.lookAt(look); }
  }

  // ---------- 螢幕座標、點選 ----------
  const W = new T.Vector3();
  const pos = o => o.isVector3 ? o.clone() : o.getWorldPosition(W).clone();
  const sp = o => v.toScreen(pos(o));
  function nearest(p, list, { max = 80, at = o => pos(o) } = {}) {
    let best = -1, bd = max;
    list.forEach((o, i) => { if (!o) return; const q = v.toScreen(at(o)); const d = Math.hypot(q.x - p.x, q.y - p.y); if (d < bd) { bd = d; best = i; } });
    return best;
  }
  function ray(p) { const r = new T.Raycaster(); r.setFromCamera(new T.Vector2(p.x / v.w * 2 - 1, -(p.y / v.h) * 2 + 1), cam); return r; }
  function ground(p, h = 0) { const hit = new T.Vector3(); return ray(p).ray.intersectPlane(new T.Plane(new T.Vector3(0, 1, 0), -h), hit) ? hit : null; }
  function hitList(p, list) { const hit = ray(p).intersectObjects(list.filter(Boolean), true)[0]; if (!hit) return -1; let o = hit.object; while (o && !list.includes(o)) o = o.parent; return list.indexOf(o); }

  // ---------- 輸入：手指／滑鼠（每關給 down/move/up），鍵盤（每關給 keys） ----------
  let ptr = null;
  const local = ev => { const r = view.getBoundingClientRect(); return { x: ev.clientX - r.left, y: ev.clientY - r.top, ev, t: performance.now() }; };
  view.addEventListener('pointerdown', ev => {
    if (ev.button > 0 || ptr !== null) return;
    ev.preventDefault(); ptr = ev.pointerId; G.unlockAudio();
    try { view.setPointerCapture(ev.pointerId); } catch (e) { /* ignore */ }
    if (input.down) input.down(local(ev));
  });
  view.addEventListener('pointermove', ev => { if (ptr === null) { if (input.hover) input.hover(local(ev)); return; } if (ev.pointerId === ptr && input.move) input.move(local(ev)); });
  const end = ev => { if (ev.pointerId !== ptr) return; ptr = null; const p = local(ev); p.cancel = ev.type === 'pointercancel'; if (input.up) input.up(p); };
  view.addEventListener('pointerup', end); view.addEventListener('pointercancel', end);
  function inputs(o) { input = o || {}; }
  // keys(f)：f(k, down, repeat)；回傳 true＝吃掉這個鍵
  function keys(f) {
    const kd = ev => { if (ev.ctrlKey || ev.metaKey || ev.altKey) return; const k = G.keyName(ev); if (k && f(k, true, ev.repeat)) ev.preventDefault(); };
    const ku = ev => { const k = G.keyName(ev); if (k) f(k, false, false); };
    addEventListener('keydown', kd); addEventListener('keyup', ku);
    const off = () => { removeEventListener('keydown', kd); removeEventListener('keyup', ku); };
    keyFns.push(off); return off;
  }

  // ---------- 拖曳有重量：抓起來會浮高一點、跟手慢一點、往旁邊甩會歪；放開落地有木琴＋果凍 ----------
  // items：物件（外層 group，內層 userData.j 是果凍）；drop(i, worldPos) 回傳 Vector3（放到哪）或 null（彈回去）
  // 也可以「點一下東西、再點位置」：pick(i) 選起來，再點地面 → drop(i, pos)
  // dropScreen(i, 螢幕座標)：放手時用手指在畫面上的位置判斷（目標是立著的東西、不在地上時用這個）
  function drag(items, { h = 0, lift = .5, drop, dropScreen = null, onPick, bounds = null, keyPick = null, homeOf = null } = {}) {
    const st = items.map(o => ({ o, home: (homeOf ? homeOf(o) : o.position.clone()), want: null, vel: new T.Vector3(), held: false, busy: false }));
    let cur = -1, sel = -1, down = null;
    const bound = p => { if (bounds) { p.x = clamp(p.x, bounds[0], bounds[1]); p.z = clamp(p.z, bounds[2], bounds[3]); } return p; };
    const api = {
      items, st, enabled: true, sel: () => sel,
      async land(i, to, { arc = 1.2, dur = .45 } = {}) {
        const s = st[i]; s.busy = true; s.held = false; s.want = null;
        const from = s.o.position.clone();
        await tween(dur, k => { s.o.position.lerpVectors(from, to, ease(k)); s.o.position.y += Math.sin(k * Math.PI) * arc; s.o.rotation.z *= .85; s.o.rotation.x *= .85; });
        s.o.position.copy(to); s.o.rotation.x = s.o.rotation.z = 0;
        if (s.o.userData.j) poke(s.o.userData.j, .45);
        sfx('bump'); s.busy = false;
      },
      home(i) { return api.land(i, st[i].home.clone(), { arc: .6, dur: .35 }); },
      setHome(i, p) { st[i].home.copy(p); },
      select(i) { sel = i; items.forEach((o, k) => { if (o && o.userData.j) { if (k === i) poke(o.userData.j, .25); } }); if (onPick) onPick(i); if (i >= 0) sfx('tap'); },
      async release(i, p) {
        const s = st[i]; s.held = false; s.want = null;
        const to = drop ? await drop(i, p) : null;
        if (to) await api.land(i, to, { arc: .3, dur: .25 }); else await api.home(i);
      },
    };
    on(dt => {
      st.forEach(s => {
        if (!s.held || !s.want || !s.o) return;
        const p = s.o.position, prev = p.clone();
        p.lerp(s.want, 1 - Math.pow(.0009, dt));           // 跟手但慢一點（有重量）
        s.vel.copy(p).sub(prev).divideScalar(Math.max(dt, .001));
        s.o.rotation.z = lerp(s.o.rotation.z, clamp(-s.vel.x * .05, -.35, .35), .2);
        s.o.rotation.x = lerp(s.o.rotation.x, clamp(s.vel.z * .05, -.35, .35), .2);
      });
    });
    api.down = p => {
      if (!api.enabled) return false;
      const i = nearest(p, items.map((o, k) => o && !st[k].busy ? o : null), { max: 70 });
      down = { x: p.x, y: p.y, i, moved: false };
      if (i >= 0) { cur = i; if (items[i].userData.j) poke(items[i].userData.j, .2); }
      return i >= 0;
    };
    api.move = p => {
      if (!down) return;
      if (!down.moved && Math.hypot(p.x - down.x, p.y - down.y) > 10) {
        down.moved = true;
        if (cur >= 0) { const s = st[cur]; s.held = true; sfx('tap'); sel = -1; }
      }
      if (cur >= 0 && st[cur].held) { const g = ground(p, h); if (g) { st[cur].want = bound(g.setY(h + lift)); } }
    };
    api.up = p => {
      const d = down; down = null;
      if (!d) return;
      if (cur >= 0 && st[cur].held) {
        const i = cur; cur = -1;
        if (dropScreen) { st[i].held = false; st[i].want = null; Promise.resolve(dropScreen(i, p)).then(to => (to ? api.land(i, to, { arc: .3, dur: .25 }) : api.home(i))); return; }
        const g = ground(p, h); api.release(i, g ? bound(g.setY(h)) : st[i].home.clone()); return;
      }
      cur = -1;
      if (d.moved) return;
      if (d.i >= 0) { api.select(sel === d.i ? -1 : d.i); return; }        // 點東西＝選起來（再點一次＝取消）
      if (sel >= 0) { const i = sel; sel = -1; const g = ground(p, h); if (g) api.release(i, bound(g.setY(h))); }   // 再點位置＝放過去
    };
    return api;
  }

  // ---------- 疊在畫面上的東西：鍵帽、光暈、小手、按鈕、小卡 ----------
  // 鍵帽跟著 3D 物件；觸控裝置不顯示（CSS）
  function cap(o, key, dy = .9) { const el = document.createElement('kbd'); el.className = 'kc k3-kc'; el.textContent = key.toUpperCase(); ov.appendChild(el); const c = { o, el, dy, on: true }; caps.push(c); return c; }
  const capOff = c => { if (c) { c.on = false; c.el.remove(); caps = caps.filter(x => x !== c); } };
  // 光暈：一圈呼吸的暖光，放在物件底下
  function halo(o, size = 1.6, color = 0xF2A33A) { const s = S3.glow(color, size, .7); s.material.depthTest = false; s.renderOrder = 5; scene.add(s); const h = { o, s, size, on: true, strong: false }; halos.push(h); return h; }
  const haloOff = h => { if (h) { scene.remove(h.s); halos = halos.filter(x => x !== h); } };
  // 小手示範：kind＝tap / hold / drag（to 是終點物件）/ circle / wipe
  const HAND = '<svg viewBox="0 0 64 64" aria-hidden="true"><circle class="tip" cx="20" cy="12" r="11"/><path class="hd" d="M14 12 v24 l-6 -5 c-3 -3 -8 1 -5 5 l12 16 c3 4 7 7 13 7 h10 c8 0 13 -6 13 -13 v-14 c0 -4 -6 -4 -6 0 v-2 c0 -4 -6 -4 -6 0 v-2 c0 -4 -6 -4 -6 0 v-16 c0 -5 -8 -5 -8 0z"/></svg>';
  function hand(o, kind = 'tap', to = null) {
    const el = document.createElement('div'); el.className = 'k3-hand ' + kind; el.innerHTML = HAND; ov.appendChild(el);
    const hd = { o, to, el, kind, t: 0 }; hands.push(hd);
    const off = () => { el.remove(); hands = hands.filter(x => x !== hd); removeEventListener('pointerdown', off, true); removeEventListener('keydown', off, true); };
    setTimeout(() => { addEventListener('pointerdown', off, true); addEventListener('keydown', off, true); }, 300);
    return off;
  }
  // 下方按鈕（圖示＋鍵帽＋注音字）；hold：按住才算（用引擎的 holdLoop）
  function btn({ icon = '', label = '', key = '', cls = '' } = {}) {
    const b = document.createElement('button'); b.type = 'button'; b.className = 'k3-btn ' + cls;
    b.innerHTML = (key ? '<kbd class="kc">' + key.toUpperCase() + '</kbd>' : '') + (icon ? '<span class="k3-bi">' + icon + '</span>' : '') + (label ? '<span class="k3-bl">' + Z(label) + '</span>' : '');
    ctl.appendChild(b);
    if (frameWant) setTimeout(() => frameTo(frameWant[0], frameWant[1]), 0);
    return b;
  }
  function clearBtns() { ctl.innerHTML = ''; if (frameWant) frameTo(frameWant[0], frameWant[1]); }
  // 每關結尾的「給家長」小卡（只顯示，不唸），按繼續
  async function card(html) {
    const c = document.createElement('div'); c.className = 'k3-card'; c.innerHTML = html; ov.appendChild(c);
    sfx('pop');
    await G.next();
    c.remove();
  }
  // 浮在物件上的小標籤（圖示或短字），跟著物件
  function tag(o, html, dy = 1) { const el = document.createElement('div'); el.className = 'k3-tag'; el.innerHTML = html; ov.appendChild(el); const c = { o, el, dy, on: true, tag: true }; caps.push(c); return c; }

  // ---------- 3D 連連看：左邊的東西連到右邊的東西 ----------
  // 點左再點右、點右再點左、從一邊拖到另一邊；鍵盤：左邊 lk（例如 'abcde'）、右邊 rk（'jkl'）。
  // truth[i]＝左 i 的正確右邊；right(i,j) 連對、wrong(i,j) 連錯時呼叫；全部連對就結束。
  function match({ left, right, truth, lk = 'abcde', rk = 'jkl', h = 0, color = 0xF05A3C, onRight, onWrong, at = o => pos(o) }) {
    return new Promise(res => {
      const done = left.map(() => false);
      let sel = null, drag0 = null, busy = false;
      const lines = new T.Group(); lv.add(lines);
      const tmpMat = new T.MeshBasicMaterial({ color, transparent: true, opacity: .55 });
      let tmp = null;
      const tube = (a, b, mat) => { const mid = a.clone().lerp(b, .5); mid.y += .5; const cur = new T.QuadraticBezierCurve3(a, mid, b); return new T.Mesh(new T.TubeGeometry(cur, 24, .07, 8, false), mat); };
      const lc = [], rc = [];
      left.forEach((o, i) => lc.push(cap(o, lk[i]))); right.forEach((o, j) => rc.push(cap(o, rk[j])));
      const hl = [];
      const paint = () => { hl.forEach(haloOff); hl.length = 0; if (sel) { const o = sel.side === 'L' ? left[sel.i] : right[sel.i]; hl.push(halo(o, 2, color)); } };
      const tryLink = async (i, j) => {
        if (busy || done[i]) return;
        busy = true; sel = null; paint();
        if (truth[i] === j) {
          done[i] = true;
          const m = tube(at(left[i]), at(right[j]), clay(color, { roughness: .6 })); lines.add(m);
          [left[i], right[j]].forEach(o => { const jj = o.userData.j || o; poke(jj, .35); });
          capOff(lc[i]);
          if (onRight) await onRight(i, j);
        } else {
          [left[i], right[j]].forEach(o => { const jj = o.userData.j || o; poke(jj, -.3); });
          if (onWrong) await onWrong(i, j);
        }
        busy = false;
        if (done.every(Boolean)) { rc.forEach(capOff); stopK(); res(); }
      };
      const pickSide = p => { const i = nearest(p, left.map((o, k) => done[k] ? null : o), { max: 70, at }); if (i >= 0) return { side: 'L', i }; const j = nearest(p, right, { max: 80, at }); return j >= 0 ? { side: 'R', i: j } : null; };
      const choose = s => {
        if (!s) { sel = null; paint(); return; }
        if (sel && sel.side !== s.side) { const [i, j] = s.side === 'R' ? [sel.i, s.i] : [s.i, sel.i]; tryLink(i, j); return; }
        sel = sel && sel.side === s.side && sel.i === s.i ? null : s; sfx('tap'); paint();
      };
      inputs({
        down(p) { if (busy) return; const s = pickSide(p); drag0 = { p, s, moved: false }; },
        move(p) {
          if (!drag0 || !drag0.s) return;
          if (!drag0.moved && Math.hypot(p.x - drag0.p.x, p.y - drag0.p.y) > 12) { drag0.moved = true; sel = drag0.s; paint(); }
          if (drag0.moved) { const g = ground(p, h + .3); if (g) { if (tmp) { lines.remove(tmp); tmp.geometry.dispose(); } const a = at(drag0.s.side === 'L' ? left[drag0.s.i] : right[drag0.s.i]); tmp = tube(a, g, tmpMat); lines.add(tmp); } }
        },
        up(p) {
          const d = drag0; drag0 = null;
          if (tmp) { lines.remove(tmp); tmp.geometry.dispose(); tmp = null; }
          if (!d) return;
          if (!d.moved) { choose(pickSide(p)); return; }
          const s = pickSide(p);
          if (s && d.s && s.side !== d.s.side) choose(s); else { sel = null; paint(); }
        },
      });
      const stopK = keys((k, dn) => {
        if (!dn) return false;
        const i = lk.indexOf(k), j = rk.indexOf(k);
        if (i >= 0 && i < left.length && !done[i]) { choose({ side: 'L', i }); return true; }
        if (j >= 0 && j < right.length) { choose({ side: 'R', i: j }); return true; }
        return false;
      });
      match.cur = { left, right, truth, done, link: tryLink };
    });
  }

  // ---------- 小顆粒（水蒸氣、泡泡、雨）：一個 InstancedMesh ＝ 一個物件 ----------
  function dots(n, r, mat) {
    const m = new T.InstancedMesh(new T.SphereGeometry(r, 10, 8), mat, n);
    m.userData.noShadow = true; m.castShadow = false; m.receiveShadow = false;
    const P = Array.from({ length: n }, () => ({ p: new T.Vector3(0, -99, 0), v: new T.Vector3(), life: 0, s: 1 }));
    const M = new T.Matrix4(), Q = new T.Quaternion(), Sv = new T.Vector3();
    m.userData.P = P;
    m.userData.sync = () => { P.forEach((q, i) => { Sv.setScalar(q.life > 0 ? q.s : 0); M.compose(q.p, Q, Sv); m.setMatrixAt(i, M); }); m.instanceMatrix.needsUpdate = true; };
    m.userData.sync();
    return m;
  }

  // ---------- 每一畫面 ----------
  const tmpV = new T.Vector3();
  function frame(dt, t) {
    if (frameWant && (v.w !== frame.w || v.h !== frame.h)) { frame.w = v.w; frame.h = v.h; frameTo(frameWant[0], frameWant[1], true); }
    for (const tw of [...tweens]) { tw.t += dt; const k = Math.min(1, tw.t / tw.dur); tw.f(k); if (k >= 1) { tweens.delete(tw); tw.res(); } }
    jels.forEach(o => S3.wobble(o, dt));
    for (const f of fns.slice()) f(dt, t);
    const br = .5 + .5 * Math.sin(t * 2.6);
    halos.forEach(h => { h.s.position.copy(pos(h.o)); h.s.position.y += .05; const s = h.size * (1 + .1 * br); h.s.scale.set(s, s, 1); h.s.material.opacity = .35 + .35 * br; });
    // 同一個東西有標籤又有鍵帽：鍵帽放在標籤右邊（底對齊），兩個不重疊
    const tagOf = new Map(); caps.forEach(c => { if (c.tag) tagOf.set(c.o, c); });
    caps.forEach(c => {
      const t = !c.tag && tagOf.get(c.o);
      const q = v.toScreen(pos(c.o).add(tmpV.set(0, t ? t.dy : c.dy, 0)));
      if (t) q.x += (t.el.offsetWidth + c.el.offsetWidth) / 2 + 4;
      // dy < 0 的標籤＝放在東西下面：上緣對齊那一點、往下長，不蓋住東西
      const below = (c.tag ? c.dy : t ? t.dy : 1) < 0;
      c.el.style.transform = 'translate(' + q.x.toFixed(1) + 'px,' + q.y.toFixed(1) + 'px) translate(-50%,' + (below ? '4px' : '-100%') + ')';
    });
    hands.forEach(hd => {
      hd.t += dt;
      const a = v.toScreen(pos(hd.o));
      let x = a.x, y = a.y;
      if (hd.kind === 'drag' && hd.to) { const b = v.toScreen(pos(hd.to)); const k = ease(Math.min(1, (hd.t % 2) / 1.5)); x = lerp(a.x, b.x, k); y = lerp(a.y, b.y, k); }
      else if (hd.kind === 'circle') { x += Math.cos(hd.t * 3) * 40; y += Math.sin(hd.t * 3) * 26; }
      else if (hd.kind === 'wipe') { x += Math.sin(hd.t * 4) * 40; }
      hd.el.style.transform = 'translate(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px)';
    });
    const kc = 1 - Math.pow(.05, dt);
    cam.position.lerp(want.pos, kc); look.lerp(want.look, kc); cam.lookAt(look); cam.updateMatrixWorld();
    if (sun) { sun.target.position.copy(look); sun.position.copy(look).add(tmpV.set(-6, 14, 8)); }
  }

  // 測試用
  window.__k = {
    meshes: () => { let n = 0; scene.traverseVisible(o => { if (o.isMesh || o.isSprite || o.isPoints) n++; }); return n; },
    cam: () => ({ pos: cam.position.toArray().map(x => +x.toFixed(2)), w: v.w, h: v.h }),
    ok: () => ok,
  };

  return {
    T, S3, init, mount, noGL, level, portrait, on, add, shade, jel, poke, wrap, clay, glass, mesh, box, ball, cyl, tween, wait, lerp, ease, outBack, clamp,
    fit, frameTo, sp, pos, nearest, ground, hitList, inputs, keys, drag, cap, capOff, halo, haloOff, hand, btn, clearBtns, card, tag, match, dots,
    get ok() { return ok; }, get scene() { return scene; }, get cam() { return cam; }, get v() { return v; }, get lv() { return lv; }, get ov() { return ov; }, get ctl() { return ctl; },
  };
})();
