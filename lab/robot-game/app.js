// 《做一台機器人》：一個 3D 場景、五個零件、五步歷史。
// 主畫面（零中文）→ 五步（r o b o t）→ 結尾重播（機器人散開、照五步裝回去、講完整故事）→ 自由玩（點零件重聽那一步）。
// 每裝好一個零件，就用那個零件玩一個小挑戰（三小關，一關比一關難；失敗只會走回去再試）：
//   o 齒輪＝在畫面上轉圈圈上發條，轉幾圈走幾步，剛好停在旗子上；b 手臂＝點方塊，疊成塔（大的放下面才穩）；
//   o 眼睛＝燈關掉，揮手叫醒眼睛，手指移到哪它看到哪，找出藏起來的方塊；t 電腦＝按住開機，排箭頭程式走到終點。
// 輸入三條路都通：按那一步的字母鍵、點發光的零件（零件自己飛進去）、用手指把零件拖到機器人身上。
// 測試：?fast=1（旁白不等）、?step=N（已經裝好 N 個零件，不重播動畫、不唸）、?play=N&lv=L（直接玩第 N 個挑戰的第 L 關，L＝0～2）、?end=1（直接看結尾重播）。
(() => {
  'use strict';
  const { $, S, save, setSave, sleep, speak, fadeVoice, unlockAudio, keyName } = G;
  const { T, lerp, ease, jelly, poke, wobble, wrap } = S3;
  const A = ART, D = A.D, snd = G.snd;
  const QS = new URLSearchParams(location.search);
  setSave('robot-v1');

  // ---------- 五步 ----------
  const STEPS = [
    { key: 'r', en: 'en.r', say: 'step.r', end: 'end.2' },
    { key: 'o', en: 'en.o', say: 'step.o1', end: 'end.3' },
    { key: 'b', en: 'en.b', say: 'step.b', end: 'end.4' },
    { key: 'o', en: 'en.o', say: 'step.o2', end: 'end.5' },
    { key: 't', en: 'en.t', say: 'step.t', end: 'end.6' },
  ];
  // 小寫字母的筆順（四線格：頂線 8、中線 38、基線 68、下線 92；viewBox 0 0 80 100）
  const GLYPH = {
    r: ['M31 38 V68', 'M31 52 C33 43 41 37.5 52 39.5'],
    o: ['M51.5 43 C47 37.5 34 37 28.5 44.5 C24 51 25 61.5 32 66 C39 70 49 68 52.5 61 C55.5 55 55.5 47.5 51.5 43'],
    b: ['M28 8 V68', 'M28 53 C30 43.5 37 38 44 38 C52 38 56.5 45 56.5 53 C56.5 61.5 50.5 68 43.5 68 C36.5 68 30.5 64 28 57'],
    t: ['M38 16 V60 C38 66 42.5 69 49 66.5', 'M27 38 H51'],
  };

  // ---------- 場景 ----------
  const host = $('#v3');
  const scene = new T.Scene();
  scene.background = new T.Color(A.C.bg);
  scene.fog = new T.Fog(A.C.bg, 26, 60);
  const cam = new T.PerspectiveCamera(34, 1, .1, 120);
  let v;
  try {
    v = S3.view(host, { scene, cam, post: false });
  } catch (e) {
    $('#nogl').hidden = false; host.hidden = true; $('#ov').hidden = true;
    return;
  }
  const hemi = new T.HemisphereLight(0xFFF6E6, 0xD9DCC4, 1.9); scene.add(hemi);
  const sun = new T.DirectionalLight(0xFFE7C6, 2.5);
  sun.position.set(-6, 13, 9); sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048); sun.shadow.radius = 6; sun.shadow.bias = -.0004;
  Object.assign(sun.shadow.camera, { left: -7, right: 7, top: 7, bottom: -7, near: 1, far: 40 });
  scene.add(sun); scene.add(sun.target);

  const ground = new T.Mesh(new T.PlaneGeometry(90, 90), new T.MeshStandardMaterial({ color: A.C.ground, roughness: .95 }));
  ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; scene.add(ground);

  // 轉台 → 機器人（放大、果凍）→ 前傾用的 lean → 身體與零件
  // 版面分「橫／平板」與「手機直的」兩種：直的時候架子收窄、機器人放大（見 applyLayout）
  let BOT_S = 1.25;
  const turn = new T.Group(); scene.add(turn);
  const table = A.turntable(2.1); turn.add(table);
  const TT = .21;                                       // 轉台上緣
  const bot = new T.Group(); bot.position.y = TT; bot.scale.setScalar(BOT_S); jelly(bot, 150, 8); turn.add(bot);
  const lean = new T.Group(); bot.add(lean);
  const body = A.body(); body.visible = false; lean.add(body);
  const wkey = body.userData.key;                       // 背後的發條鑰匙（跟著齒輪轉）
  const ghost = A.ghost(); ghost.visible = false; lean.add(ghost);
  const GP = ghost.userData.part;
  const block = A.block(); block.visible = false; bot.add(block); jelly(block.userData.j);
  const BLOCK_REST = new T.Vector3(0, .25, 1.0);
  block.position.copy(BLOCK_REST);

  // 畫架（設計圖攤開的地方）
  const easel = A.easel(); easel.rotation.y = .5; scene.add(easel);
  const bar = easel.userData.bar, sheet = easel.userData.sheet;

  // 架子
  let SLOT = 1.25, SHW = SLOT * 5 + .35, PK = 1;
  const SHW0 = SHW, SHH = 1.0, SHD = 1.0, SHZ = 3.75, TOP = SHH + .08;
  const shelfG = A.shelf(SHW0, SHH, SHD); shelfG.position.z = SHZ; scene.add(shelfG);
  const slotX = i => (i - 2) * SLOT;

  // 光圈：落點兩個（手臂、眼睛有兩個位置）、架子上一個
  const halos = [A.halo(), A.halo()]; halos.forEach(h => scene.add(h));
  const fring = A.floorRing(); scene.add(fring);

  // 小挑戰的道具：走道（齒輪、電腦）、紙墊＋三塊方塊（手臂）、藏起來的方塊＋眼睛的光（眼睛）
  const TRACK_N = 7;
  const trk = A.track(TRACK_N, TT + .012); trk.visible = false; turn.add(trk);
  const TU = trk.userData, plank = trk.children[0];
  let CELL = 1;
  const pad = A.pad(); pad.visible = false; turn.add(pad);
  const CUBE_S = [.42, .58, .75];                       // 小、中、大
  const cubes = CUBE_S.map(s => { const c = A.cube(s); c.visible = false; turn.add(c); return c; });
  const cubeRings = cubes.map(() => { const r = A.floorRing(); r.visible = false; turn.add(r); return r; });
  const hid = [0, 1, 2].map(() => {
    const c = A.cube(.45), m = c.userData.mesh;
    m.material = A.M.block.clone(); m.material.transparent = true; m.material.opacity = 0;
    c.visible = false; scene.add(c); return c;
  });
  const spot = new T.SpotLight(0xEAF4FF, 0, 0, .38, .65, 1.2); spot.visible = false; scene.add(spot); scene.add(spot.target);
  const gazeDisc = new T.Mesh(new T.CircleGeometry(.8, 40), new T.MeshBasicMaterial({ color: 0xF4F9FF, transparent: true, opacity: 0, depthWrite: false }));
  gazeDisc.rotation.x = -Math.PI / 2; gazeDisc.visible = false; scene.add(gazeDisc);

  // ---------- 五個零件 ----------
  const shelfPose = [   // 在架子上的樣子：離架面的高度、大小、朝向（稍微朝鏡頭仰）
    { y: .155, s: 1.0, rx: 0, ry: .12 },
    { y: .335 * 1.42, s: 1.42, rx: -.12, ry: .32 },
    { y: (D.armL + .1) * .78, s: .78, rx: -.12, ry: 0 },
    { y: .2 * 1.15, s: 1.15, rx: -.4, ry: 0 },
    { y: .12 * 2.2, s: 2.2, rx: -.3, ry: .3 },
  ];
  const mounts = [
    null,                                                // r 另外算（先落在轉台，再跳上畫架）
    new T.Vector3(0, D.bodyY + .03, .34),
    new T.Vector3(0, D.shY, 0),
    new T.Vector3(0, D.eyeY, D.eyeZ + .012),
    new T.Vector3(0, D.topY, 0),
  ];
  const P = [A.roll(), A.gear(), A.arms(), A.eyes(), A.computer()].map((obj, i) => {
    const sp = shelfPose[i];
    const home = { pos: new T.Vector3(), q: new T.Quaternion().setFromEuler(new T.Euler(sp.rx, sp.ry, 0)), s: new T.Vector3() };
    obj.traverse(m => { if (m.isMesh) { m.castShadow = true; m.receiveShadow = true; } });
    jelly(obj.userData.j, 160, 7);
    scene.add(obj);
    return { i, obj, j: obj.userData.j, home, state: 'shelf', shake: 0, hint: 0, vel: new T.Vector3(), capY: 0, capOff: 0 };
  });
  // 手臂在架子上靠攏一點（裝上去時再張開到肩膀的寬度）
  const spreadArms = k => P[2].obj.userData.side.forEach((a, n) => { a.position.x = (n ? 1 : -1) * lerp(.4, D.shX, k); });
  spreadArms(0);
  // 鍵帽掛在零件頂端上方：先量每個零件（大小 1 時）頂端離中心多高
  P.forEach(p => {
    const sp = shelfPose[p.i];
    p.obj.position.set(0, 0, 0); p.obj.quaternion.copy(p.home.q); p.obj.scale.setScalar(sp.s); p.obj.updateMatrixWorld(true);
    p.capOff = new T.Box3().setFromObject(p.obj).max.y / sp.s;
  });
  let portrait = null;
  function applyLayout(pt) {
    portrait = pt;
    SLOT = pt ? 1.0 : 1.25; SHW = SLOT * 5 + .35; PK = pt ? .84 : 1;
    BOT_S = pt ? 1.5 : 1.25;
    shelfG.scale.x = SHW / SHW0;
    bot.userData.jl.base.setScalar(BOT_S);
    const tk = BOT_S / 1.25; table.scale.set(tk, 1, tk);
    CELL = (pt ? .62 : .75) * BOT_S; trk.scale.set(CELL, 1, CELL);
    pad.scale.set(tk, 1, tk); pad.position.set(BOT_S, TT, 0);
    cubes.forEach(c => { if (c.parent === turn) c.scale.setScalar(tk); });
    hid.forEach(c => c.scale.setScalar(tk));
    easel.position.set(pt ? -2.45 : -2.85, 0, pt ? -1.75 : -1.25); easel.scale.setScalar(pt ? .92 : 1);
    P.forEach(p => {
      const sp = shelfPose[p.i], s = sp.s * PK;
      p.home.pos.set(slotX(p.i), TOP + sp.y * PK, SHZ); p.home.s.setScalar(s);
      p.capY = p.home.pos.y + p.capOff * s + .1;
      if (p.state === 'shelf') { p.obj.position.copy(p.home.pos); p.obj.quaternion.copy(p.home.q); p.obj.scale.copy(p.home.s); }
    });
    FIT_PTS.length = 0;
    [-1, 1].forEach(sx => {
      FIT_PTS.push(new T.Vector3(sx * SHW / 2, 0, SHZ + SHD / 2));          // 架子前下角
      FIT_PTS.push(new T.Vector3(sx * SHW / 2, TOP + .9 * PK, SHZ - SHD / 2));   // 架子上零件的頂
      FIT_PTS.push(new T.Vector3(sx * 2.15 * tk, 0, 0));                     // 轉台
      FIT_PTS.push(new T.Vector3(sx * 1.45 * BOT_S, 2.6 * BOT_S, 0));        // 機器人兩側
    });
    FIT_PTS.push(new T.Vector3(0, TT + 3.9 * BOT_S, 0));                      // 機器人頭頂
    easel.updateMatrixWorld(true);
    FIT_PTS.push(easel.localToWorld(new T.Vector3(-.5, 2.45, 0)), easel.localToWorld(new T.Vector3(-.55, 0, .25)));   // 畫架
  }
  const FIT_PTS = [];
  applyLayout(false);

  // ---------- 疊在畫布上的 HTML：四線格（＝架子正面＝進度）、鍵帽 ----------
  const ov = $('#ov'), strip = $('#strip');
  const NS = 'http://www.w3.org/2000/svg';
  const LET = STEPS.map(s => {
    const svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('viewBox', '0 0 80 100'); svg.setAttribute('class', 'rb-let');
    const paths = GLYPH[s.key].map(d => { const p = document.createElementNS(NS, 'path'); p.setAttribute('d', d); svg.appendChild(p); return p; });
    strip.appendChild(svg);
    return { svg, paths, len: null };
  });
  const CAPS = STEPS.map(s => {
    const k = document.createElement('kbd'); k.className = 'kc rb-kc'; k.textContent = s.key.toUpperCase();
    ov.appendChild(k); return k;
  });
  const chCap = document.createElement('kbd'); chCap.className = 'kc rb-kc cur off'; ov.appendChild(chCap);
  const pips = document.createElement('div'); pips.className = 'rb-pips'; pips.hidden = true; ov.appendChild(pips);
  const PIPS = [0, 1, 2].map(() => { const i = document.createElement('i'); pips.appendChild(i); return i; });

  // ---------- 小工具：補間、等待 ----------
  const tweens = new Set();
  function tween(dur, f) {
    return new Promise(res => { const tw = { t: 0, dur: Math.max(.001, dur), f, res }; f(0); tweens.add(tw); });
  }
  const wait = s => tween(s, () => {});
  const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
  const outBack = k => { const c = 1.6; return 1 + (c + 1) * Math.pow(k - 1, 3) + c * Math.pow(k - 1, 2); };

  // ---------- 聲音（全部合成） ----------
  const PEN = [261.6, 293.7, 329.6, 392, 440, 523.3, 587.3, 659.3, 784, 880, 1046.5];
  const SFX = {
    snap: () => { snd.mallet(784, 0, .14, .28); snd.mallet(196, 0, .2, .32); },       // 喀：木琴短音＋低一點的 thud
    stroke: n => snd.mallet(PEN[clamp(n, 0, PEN.length - 1)], 0, .12, .7),          // 字母一筆：往上的木琴
    done: i => [0, 1, 2].forEach(k => snd.mallet(PEN[clamp(i + 2 + k * 2, 0, 10)], k * .1, .1, .8)),   // 裝好一個：上行三音
    land: () => snd.mallet(392, 0, .1, .4),
    back: () => snd.wood(700, 0, .07),
    no: () => snd.wood(300, 0, .12),
    hover: () => snd.wood(1150, 0, .035),
    chord: () => { [5, 7, 8, 10].forEach((n, k) => snd.mallet(PEN[n], k * .1, .13)); snd.pad([261.6, 329.6, 392, 523.3], .05, .055, 2.6); },
    block: () => snd.mallet(130.8, 0, .2, .4),
    ratchet: n => { snd.wood(1500, 0, .09); snd.mallet(PEN[clamp(n + 1, 0, 10)], .02, .1, .35); },   // 發條轉滿一圈：喀＋一個往上的音
    foot: n => snd.wood(n % 2 ? 560 : 620, 0, .05),
    find: () => { snd.mallet(PEN[7], 0, .16, .6); snd.mallet(PEN[9], .08, .14, .7); },
    win: () => { [4, 6, 8].forEach((n, k) => snd.mallet(PEN[n], k * .09, .14, .7)); },
    card: n => snd.mallet(PEN[clamp(n + 2, 0, 10)], 0, .12, .3),
  };

  // ---------- 狀態 ----------
  const placed = [false, false, false, false, false];
  let phase = 'build';          // build | play（小挑戰）| ending | free
  let ch = null;                // 現在的小挑戰：{ part, lv, goal, fit, down/move/up/hover/key/keyup/frame, glow, cap, hintKey }
  let carryObj = null;          // 手臂搬的東西（沒設＝裝手臂那一步的方塊）
  const held = {};              // 小挑戰裡按著的方向鍵
  let cur = 0;                  // 下一個要裝的
  let glowOn = true;            // 現在這一個發不發光（句子講完才亮；一開始就亮）
  let epoch = 0;                // 每裝一個零件 +1，舊的流程看到就停
  let lastAct = performance.now(), lastHint = 0;
  let eyesOn = false;
  let busyAct = [false, false, false, false, false];
  const pose = { th: [0, 0], ph: [0, 0], lean: 0 };     // 手臂：舉起（th）、往內夾（ph）；身體前傾
  let carry = null;             // 搬方塊時：方塊跟著兩隻手

  // ---------- 位置換算 ----------
  const _v = new T.Vector3(), _q = new T.Quaternion(), _s = new T.Vector3(), _m = new T.Matrix4();
  function worldPose(parent, pos, q = new T.Quaternion(), s = new T.Vector3(1, 1, 1)) {
    parent.updateWorldMatrix(true, false);
    _m.compose(pos, q, s).premultiply(parent.matrixWorld);
    const out = { pos: new T.Vector3(), q: new T.Quaternion(), s: new T.Vector3() };
    _m.decompose(out.pos, out.q, out.s);
    return out;
  }
  const rollLand = () => worldPose(turn, new T.Vector3(0, TT + .16, .2), new T.Quaternion().setFromEuler(new T.Euler(0, 0, 0)));
  const rollBar = () => worldPose(bar, new T.Vector3(0, .02, .1));
  const mountWorld = i => i === 0 ? rollLand() : worldPose(lean, mounts[i]);
  const shelfWorld = i => P[i].home;
  const sp = p3 => v.toScreen(p3);

  // ---------- 飛行：有重力的弧線，落地壓扁 ----------
  let armSpread = 0;
  function flyTo(p, getTo, { dur = .8, arc = 1.4, spread = null } = {}) {
    const o = p.obj;
    scene.attach(o);
    const from = { pos: o.position.clone(), q: o.quaternion.clone(), s: o.scale.clone() };
    const sp0 = armSpread;
    p.state = 'fly';
    return tween(dur, k => {
      const to = getTo();
      if (p.i === 2 && spread !== null) { armSpread = lerp(sp0, spread, ease(k)); spreadArms(armSpread); }
      o.position.lerpVectors(from.pos, to.pos, k);
      o.position.y += arc * 4 * k * (1 - k);
      o.quaternion.slerpQuaternions(from.q, to.q, ease(k));
      o.scale.lerpVectors(from.s, to.s, ease(k));
    });
  }
  // 卡進機器人身上（或畫架）：之後跟著機器人轉
  function attachAt(p) {
    const o = p.obj;
    if (p.i === 0) {
      bar.attach(o); o.position.set(0, .02, .1); o.quaternion.identity(); o.scale.setScalar(1);
    } else {
      lean.attach(o); o.position.copy(mounts[p.i]); o.quaternion.identity(); o.scale.setScalar(1);
    }
    if (p.i === 2) { armSpread = 1; spreadArms(1); }
    p.state = 'placed';
  }
  function toShelf(p) {
    const o = p.obj; scene.attach(o);
    o.position.copy(p.home.pos); o.quaternion.copy(p.home.q); o.scale.copy(p.home.s);
    if (p.i === 2) { armSpread = 0; spreadArms(0); }
    p.state = 'shelf';
  }

  // ---------- 材質淡入淡出 ----------
  function fadeMats(mats, from, to, dur) {
    mats.forEach(m => { m.transparent = true; m.opacity = from; m.needsUpdate = true; });
    return tween(dur, k => mats.forEach(m => { m.opacity = lerp(from, to, ease(k)); })).then(() => {
      mats.forEach(m => { if (to >= 1) { m.transparent = false; m.opacity = 1; m.needsUpdate = true; } });
    });
  }
  const BODY_MATS = [A.M.cream, A.M.cream2];
  function ghostVis() {
    ghost.visible = placed[0];
    GP.body.visible = !placed[1]; GP.arms.visible = !placed[2]; GP.eyes.visible = !placed[3]; GP.comp.visible = !placed[4];
  }

  // ---------- 字母：在架子正面的四線格裡一筆一筆寫出來 ----------
  function letterLens(i) {
    const L = LET[i];
    if (!L.len) L.len = L.paths.map(p => { try { return p.getTotalLength() || 100; } catch (e) { return 100; } });
    return L.len;
  }
  function letterSet(i, state) {   // 'none' | 'on' | 'dim'
    const L = LET[i], len = letterLens(i);
    L.svg.classList.remove('fresh', 'dim', 'flash');
    L.paths.forEach((p, k) => { p.style.strokeDasharray = len[k]; p.style.strokeDashoffset = state === 'none' ? len[k] : 0; p.style.opacity = state === 'none' ? 0 : 1; });
    if (state === 'dim') L.svg.classList.add('dim');
  }
  async function letterWrite(i) {
    const L = LET[i], len = letterLens(i);
    L.svg.classList.remove('dim', 'flash'); L.svg.classList.add('fresh');
    L.paths.forEach((p, k) => { p.style.strokeDasharray = len[k]; p.style.strokeDashoffset = len[k]; p.style.opacity = 0; });
    for (let k = 0; k < L.paths.length; k++) {
      const p = L.paths[k];
      p.style.opacity = 1;
      SFX.stroke(i + k * 2 + 2);
      await tween(L.paths.length === 1 ? .62 : .38, e => { p.style.strokeDashoffset = len[k] * (1 - e); });
    }
    setTimeout(() => L.svg.classList.remove('fresh'), 900);
  }
  function letterFlash(i) {
    const s = LET[i].svg; s.classList.remove('flash'); void s.getBoundingClientRect(); s.classList.add('flash');
  }

  // ---------- 每一步裝好以後「動一下」 ----------
  function setArms() {
    const arms = P[2].obj.userData.side;
    arms.forEach((a, k) => { const sx = k ? 1 : -1; a.rotation.x = -pose.th[k]; a.rotation.z = -sx * pose.ph[k]; });
    lean.rotation.x = pose.lean;
  }
  function armsTo(th0, th1, ph0, ph1, ln, dur) {
    const a = { th: pose.th.slice(), ph: pose.ph.slice(), lean: pose.lean };
    return tween(dur, k => {
      const e = ease(k);
      pose.th[0] = lerp(a.th[0], th0, e); pose.th[1] = lerp(a.th[1], th1, e);
      pose.ph[0] = lerp(a.ph[0], ph0, e); pose.ph[1] = lerp(a.ph[1], ph1, e);
      pose.lean = lerp(a.lean, ln, e);
    });
  }
  function handsMid() {   // 兩隻手中間（bot 座標）
    const side = P[2].obj.userData.side, a = new T.Vector3(), b = new T.Vector3();
    lean.updateWorldMatrix(true, true);
    side[0].userData.claw.getWorldPosition(a); side[1].userData.claw.getWorldPosition(b);
    return bot.worldToLocal(a.add(b).multiplyScalar(.5));
  }
  function blink() {
    const lens = P[3].obj.userData.lens;
    return tween(.22, k => { const s = 1 - Math.sin(k * Math.PI) * .9; lens.forEach(l => { l.scale.y = s; }); });
  }
  function spinGear(turns, dur) {
    const g = P[1].obj.userData.spin, key = wkey, a0 = g.rotation.z;
    return tween(dur, k => { const r = a0 - turns * Math.PI * 2 * (1 - Math.pow(1 - k, 2.2)); g.rotation.z = r; key.rotation.z = r; });
  }
  const ACT = [
    // r：設計圖從轉台跳上畫架、攤開；工作台上浮出半透明的輪廓
    async (replay) => {
      if (!replay) {
        await flyTo(P[0], rollBar, { dur: .6, arc: .9 });
        attachAt(P[0]); poke(P[0].j, .3); SFX.land();
      } else poke(P[0].j, .3);
      sheet.visible = true;
      const s0 = replay ? .25 : .02;
      const unroll = tween(.75, k => { sheet.scale.y = lerp(s0, 1, outBack(k)); });
      if (!replay) { ghostVis(); A.M.ghost.opacity = 0; await tween(.9, k => { A.M.ghost.opacity = .26 * ease(k); }); }
      await unroll;
    },
    // o：齒輪轉幾圈、發條鑰匙跟著轉；身體從輪廓變成實體
    async (replay) => {
      if (!replay) {
        body.visible = true;
        const f = fadeMats(BODY_MATS, .2, 1, .9);
        setTimeout(() => { GP.body.visible = false; }, 250);
        poke(bot, .18);
        await Promise.all([f, spinGear(3, 1.8)]);
      } else { poke(bot, .12); await spinGear(2, 1.4); }
    },
    // b：方塊掉到轉台上，手臂把它舉起來再放下（工廠搬東西）
    async () => {
      if (!block.visible) await dropBlock();
      await armsTo(.62, .62, .36, .36, .26, .6);
      const mid = handsMid(), off = block.position.clone().sub(mid);
      carry = off;
      await armsTo(1.45, 1.45, .36, .36, 0, .75);
      poke(block.userData.j, .2); poke(bot, .1);
      await wait(.35);
      await armsTo(.62, .62, .36, .36, .26, .7);
      carry = null; block.position.copy(BLOCK_REST); poke(block.userData.j, .25); SFX.block();
      await armsTo(0, 0, 0, 0, 0, .55);
    },
    // o：眼睛亮起來，之後一直跟著手指／滑鼠看
    async () => {
      eyesOn = true;
      await tween(.8, k => { A.M.glass.emissiveIntensity = Math.sin(k * Math.PI) * .9 + k * .45; });
      await blink();
    },
    // t：頭頂燈亮、胸口齒輪轉、手臂揮一下、眼睛眨一下＝接上電，動起來了
    async () => {
      await tween(.5, k => { A.M.light.emissiveIntensity = k * 1.3; });
      poke(bot, .22);
      await Promise.all([spinGear(1.5, 1.4), wave(), (async () => { await wait(.3); await blink(); await wait(.5); await blink(); })()]);
    },
  ];
  async function wave() {
    await armsTo(0, 2.55, 0, -.25, 0, .5);
    await tween(1.0, k => { pose.ph[1] = -.25 + Math.sin(k * Math.PI * 4) * .3; });
    await armsTo(0, 0, 0, 0, 0, .5);
  }
  // 方塊掉下來：簡單重力＋落地壓扁
  function dropBlock() {
    block.visible = true; block.scale.setScalar(1); block.position.set(BLOCK_REST.x, 2.6, BLOCK_REST.z);
    let vy = 0;
    return new Promise(res => {
      const off = v.on(dt => {
        vy -= 9.8 * 1.6 * dt; block.position.y += vy * dt;
        if (block.position.y <= BLOCK_REST.y) { block.position.y = BLOCK_REST.y; poke(block.userData.j, .4); SFX.block(); off(); res(); }
      });
    });
  }

  async function runAct(i, replay = false) {
    if (busyAct[i]) return;
    busyAct[i] = true;
    try { await ACT[i](replay); } finally { busyAct[i] = false; }
  }

  // ---------- 裝上一個零件 ----------
  async function install(i) {
    const my = ++epoch;
    fadeVoice(200);
    placed[i] = true;
    cur = i + 1; glowOn = false;
    if (phase === 'build') { S.step = cur; save(); }
    attachIfNeeded(i);
    if (i > 0) ghostVis();                 // r 的輪廓由 ACT 淡入
    SFX.snap(); poke(bot, .14); poke(P[i].j, .35);
    wantFront = 2.5;
    let act = i === 4 ? null : runAct(i);  // 電腦要先按住開機，才動起來
    await Promise.all([letterWrite(i), speak(STEPS[i].en)]);
    SFX.done(i);
    if (my !== epoch || phase !== 'build') return;
    if (i === 4) { await bootHold(); if (my !== epoch) return; act = runAct(4); }
    await speak(STEPS[i].say);
    if (my !== epoch || phase !== 'build') return;
    if (i > 0) {
      if (act) await act;
      await challenge(i, 0);
      if (my !== epoch) return;
    }
    if (i === 4) { await sleep(G.FAST ? 100 : 700); if (my === epoch) runEnding(); return; }
    glowOn = true; lastAct = performance.now();
  }
  function attachIfNeeded(i) {
    if (i === 0) {              // r 先落在轉台上（ACT 會再把它送上畫架）
      const o = P[0].obj; scene.attach(o); const lp = rollLand();
      o.position.copy(lp.pos); o.quaternion.copy(lp.q); o.scale.copy(lp.s); P[0].state = 'placed';
    } else attachAt(P[i]);
  }
  // 點或按鍵：零件自己飛進去
  async function autoFly(i) {
    const p = P[i];
    if (p.state !== 'shelf' && p.state !== 'slide') return;
    wantFront = 3;
    await flyTo(p, () => mountWorld(i), { dur: .8, arc: 1.5, spread: 1 });
    install(i);
  }
  // 拖到了：最後一小段吸進去
  async function snapIn(i) {
    wantFront = 3;
    await flyTo(P[i], () => mountWorld(i), { dur: .22, arc: .1, spread: 1 });
    install(i);
  }
  function nudge(i) {   // 還沒輪到：原地晃一下＋低木魚
    P[i].shake = 1; SFX.no();
  }

  // =====================================================================
  // 小挑戰：每裝好一個零件，就用它的本事玩三小關
  // =====================================================================
  const TAU = Math.PI * 2;
  const WALK_A = Math.PI / 2 - .25;                    // 往右走時斜斜朝向鏡頭：看得到臉，也看得到背後的發條鑰匙
  const k1 = () => BOT_S / 1.25;
  async function challenge(i, lv0 = 0) {
    phase = 'play'; glowOn = false; wantFront = 0;
    ch = { part: i, lv: lv0 };
    try { await [null, gearPlay, armsPlay, eyesPlay, progPlay][i](lv0); }
    finally { ch = null; Object.keys(held).forEach(k => { held[k] = false; }); }
    S.cl = Math.max(S.cl || 0, i); save();
    phase = 'build';
    fit(false);
  }
  const lineOf = (pre, lv) => lv === 0 ? pre + '.intro' : pre + '.' + (lv + 1);
  // 開場那一關先講怎麼玩；之後每關一句。講的同時就可以開始玩。
  function levelLine(pre, lv, lv0) {
    const k = lineOf(pre, lv);
    ch.hintKey = k;
    return lv === lv0 && lv0 > 0 ? (async () => { await speak(pre + '.intro'); await speak(k); })() : speak(k);
  }
  async function cheer(key) { SFX.win(); poke(bot, .2); await Promise.all([speak(key), wait(G.FAST ? .1 : .9)]); }

  // ---------- 走道與走路 ----------
  const legs = () => [body.children[0], body.children[1]];
  let botCell = 0;
  function face(a, dur = .35) { const a0 = bot.rotation.y; return tween(dur, k => { bot.rotation.y = lerp(a0, a, ease(k)); }); }
  function setTrack(goal, rocks = []) {
    TU.tiles.forEach((t, k) => { t.visible = k <= goal; });
    TU.lit.forEach(r => { r.userData.on = 0; r.material.opacity = 0; });
    plank.scale.x = (goal + 1.1) / (TRACK_N + 1.1); plank.position.x = goal / 2;
    TU.flag.position.set(goal, TU.top, -.42);
    TU.wall.position.x = goal + .62;
    TU.stumps.forEach((s, n) => { s.visible = n < rocks.length; if (s.visible) { s.position.set(rocks[n], TU.top, 0); poke(s.userData.j, .3); } });
    poke(TU.flag.userData.j, .35);
    ch.goal = goal; ch.rocks = rocks;
  }
  async function trackIn(goal, rocks) {
    setTrack(goal, rocks);
    ch.fit = ch.fit || 'track'; fit(false);
    trk.visible = true;
    await tween(.5, k => { trk.scale.y = Math.max(.01, outBack(k)); });
    await face(WALK_A, .45);
  }
  async function trackOut() {
    await backHome();
    await face(0, .4);
    await tween(.4, k => { trk.scale.y = Math.max(.01, 1 - ease(k)); });
    trk.visible = false; trk.scale.y = 1;
    ch.goal = 0; ch.fit = null; fit(false);
  }
  async function stepTo(c1, dur = .42, n = 0) {
    const x0 = bot.position.x, x1 = c1 * CELL, lg = legs()[n % 2], sx = n % 2 ? 1 : -1;
    const g = P[1].obj.userData.spin, a0 = g.rotation.z;
    await tween(dur, k => {
      const s = Math.sin(k * Math.PI);
      bot.position.x = lerp(x0, x1, ease(k)); bot.position.y = TT + .06 * s * BOT_S;
      lg.position.y = .12 * s; lean.rotation.z = sx * .08 * s;
      g.rotation.z = a0 + k * 1.3; wkey.rotation.z = g.rotation.z;
    });
    lg.position.y = 0; lean.rotation.z = 0; bot.position.y = TT;
    botCell = c1; poke(bot, .06); SFX.foot(n);
    if (TU.lit[c1]) TU.lit[c1].userData.on = 0;
  }
  async function bump(obj, dist = .34) {
    const x0 = bot.position.x;
    await tween(.18, k => { bot.position.x = x0 + dist * CELL * Math.sin(k * Math.PI / 2); });
    poke(bot, .28); if (obj) poke(obj, .4); SFX.no(); snd.wood(420, .05, .1);
    await tween(.4, k => { bot.position.x = x0 + dist * CELL * (1 - ease(k)); });
  }
  async function jumpTo(c1, blocked) {
    const x0 = bot.position.x, x1 = c1 * CELL, h = .9 * BOT_S;
    poke(bot, .22); await wait(.14);
    if (blocked) {           // 落點有木樁／牆：跳到一半撞回來
      const xm = lerp(x0, x1, .62);
      await tween(.42, k => { bot.position.x = lerp(x0, xm, k); bot.position.y = TT + h * Math.sin(k * Math.PI * .8); });
      poke(blocked, .45); SFX.no(); snd.wood(420, .05, .1);
      await tween(.42, k => { bot.position.x = lerp(xm, x0, ease(k)); bot.position.y = TT + h * Math.sin(Math.PI * .8) * (1 - k) * (1 - k); });
      bot.position.y = TT; poke(bot, .3); return;
    }
    await tween(.7, k => { bot.position.x = lerp(x0, x1, k); bot.position.y = TT + h * 4 * k * (1 - k); });
    bot.position.y = TT; botCell = c1; poke(bot, .32); SFX.block();
  }
  async function backHome() {
    if (botCell === 0) return;
    await face(-WALK_A, .3);
    for (let c = botCell - 1, n = 0; c >= 0; c--, n++) await stepTo(c, G.FAST ? .05 : .24, n);
    await face(WALK_A, .3);
  }
  async function flagWin() {
    poke(TU.flag.userData.j, .5);
    const cl = TU.flag.userData.cloth;
    await tween(.9, k => { cl.rotation.y = Math.sin(k * Math.PI * 4) * .5 * (1 - k); });
  }

  // ---------- o 齒輪：轉圈圈上發條，轉幾圈走幾步 ----------
  const GEAR_GOALS = [2, 3, 5];
  async function gearPlay(lv0) {
    await trackIn(GEAR_GOALS[lv0]);
    for (let lv = lv0; lv < 3; lv++) {
      ch.lv = lv;
      if (lv > lv0) { setTrack(GEAR_GOALS[lv]); fit(false); }
      levelLine('g', lv, lv0);
      for (;;) {
        const turns = await windOnce(lv < 2);
        fadeVoice(150);
        let r = 'short';
        for (let s = 0; s < turns; s++) {
          if (botCell + 1 > ch.goal) { await bump(TU.wall); r = 'over'; break; }
          await stepTo(botCell + 1, G.FAST ? .06 : .42, s);
        }
        TU.lit.forEach(l => { l.userData.on = 0; });
        if (r !== 'over' && botCell === ch.goal) { await Promise.all([flagWin(), cheer('g.ok')]); break; }
        await Promise.all([speak(r === 'over' ? 'g.over' : 'g.short'), (async () => { await wait(.3); await backHome(); })()]);
      }
      if (lv < 2) await backHome();
    }
    await speak('g.done');
    await trackOut();
  }
  // 等孩子上好發條（放開手，或鍵盤停 1.4 秒）→ 回傳轉了幾圈
  function windOnce(lit) {
    return new Promise(res => {
      const W = { acc: 0, turns: 0, last: null, head: null, kt: 0 };
      const g = P[1].obj.userData.spin, a0 = g.rotation.z;
      const show = () => {
        const a = a0 - Math.abs(W.acc);
        g.rotation.z = a; wkey.rotation.z = a;
        TU.lit.forEach((r, k) => { r.userData.on = lit && k > botCell && k <= botCell + W.turns && k <= ch.goal ? 1 : 0; });
      };
      const setTurns = n => {
        if (n > W.turns) { SFX.ratchet(n); poke(bot, .05); if (botCell + n > ch.goal) poke(TU.wall, .15); }
        W.turns = n;
      };
      const done = () => {
        if (W.turns < 1) return false;
        clearTimeout(W.kt);
        ch.down = ch.move = ch.up = ch.key = null; ch.glow = ch.cap = null;
        res(W.turns); return true;
      };
      ch.glow = () => W.last ? [] : [{ pos: wkey.getWorldPosition(new T.Vector3()), size: .75 * k1() }];
      ch.cap = () => ({ text: 'O', pos: wkey.getWorldPosition(new T.Vector3()).add(new T.Vector3(-.3, .5 * BOT_S, 0)) });
      ch.down = q => { W.last = q; W.head = null; };
      // 用「手指前進方向轉了多少」來算圈數：在畫面哪裡畫圈都可以，畫一整圈＝轉一圈
      ch.move = q => {
        if (!W.last) return;
        const dx = q.x - W.last.x, dy = q.y - W.last.y;
        if (Math.hypot(dx, dy) < 6) return;
        const h = Math.atan2(dy, dx);
        if (W.head !== null) { const d = wrap(h - W.head); if (Math.abs(d) < 1.7) W.acc += d; }
        W.head = h; W.last = q;
        setTurns(Math.min(TRACK_N, Math.floor(Math.abs(W.acc) / TAU)));
        show();
      };
      ch.up = () => {
        W.last = null;
        if (done()) return;
        const a = W.acc;                     // 沒轉滿一圈：鑰匙彈回去
        tween(.3, k => { W.acc = a * (1 - ease(k)); show(); });
        poke(bot, .08);
      };
      ch.key = k => {
        if (k === 'o' || k === 'right' || k === 'up') {
          const n = Math.min(TRACK_N, W.turns + 1), a = Math.abs(W.acc);
          setTurns(n);
          tween(.25, e => { W.acc = lerp(a, n * TAU, ease(e)); show(); });
          clearTimeout(W.kt); W.kt = setTimeout(done, G.FAST ? 300 : 1400);
          return true;
        }
        if ((k === 'enter' || k === 'space') && W.turns) { done(); return true; }
        return false;
      };
    });
  }

  // ---------- b 手臂：點方塊，搬到紙墊上疊起來（大的放下面才穩） ----------
  const ARM_LV = [[2], [0, 2], [1, 0, 2]];               // 每關有哪幾塊（CUBE_S 的索引），依序放在 SPOT_A
  const SPOT_A = [0, -.95, -1.85];
  const reach = () => 1.0 * BOT_S;
  const spotPos = n => new T.Vector3(Math.sin(SPOT_A[n]) * reach(), TT, Math.cos(SPOT_A[n]) * reach());
  async function armsPlay(lv0) {
    if (block.visible) tween(.4, k => block.scale.setScalar(1 - ease(k))).then(() => { block.visible = false; block.scale.setScalar(1); });
    pad.visible = true; pad.position.set(reach(), TT, 0);
    await tween(.4, k => { pad.scale.y = Math.max(.01, outBack(k)); });
    for (let lv = lv0; lv < 3; lv++) {
      ch.lv = lv;
      const set = ARM_LV[lv].map((si, n) => ({ c: cubes[si], size: CUBE_S[si] * k1(), spot: n, ring: cubeRings[n], up: false }));
      ch.cubes = set; ch.sel = 0;
      await Promise.all(set.map(async (b, n) => {
        await wait(n * .12);
        const p = spotPos(b.spot); b.c.position.set(p.x, TT + b.size / 2, p.z); b.c.quaternion.identity(); b.c.visible = true;
        await tween(.35, k => b.c.scale.setScalar(k1() * Math.max(.01, outBack(k))));
        poke(b.c.userData.j, .3); SFX.land();
      }));
      levelLine('a', lv, lv0);
      let stack = [];
      for (;;) {
        const b = await pickCube(set);
        fadeVoice(150);
        await carryToPad(b, stack);
        stack.push(b); b.up = true;
        const n = stack.length;
        if (n >= 2 && stack[n - 1].size > stack[n - 2].size) {     // 大的疊在小的上面：倒了
          await topple(stack[n - 1], stack[n - 2]);
          await Promise.all([speak('a.fall'), resetCubes(set)]);
          stack = [];
          continue;
        }
        if (n === set.length) break;
      }
      await cheer('a.ok');
      await Promise.all(set.map(b => tween(.35, k => b.c.scale.setScalar(k1() * Math.max(.01, 1 - ease(k)))).then(() => { b.c.visible = false; })));
    }
    ch.cubes = null;
    await speak('a.done');
    await tween(.3, k => { pad.scale.y = Math.max(.01, 1 - ease(k)); });
    pad.visible = false; pad.scale.y = 1;
  }
  function pickCube(set) {
    return new Promise(res => {
      const left = () => set.filter(b => !b.up);
      const go = b => { ch.down = ch.key = null; ch.cap = null; res(b); };
      const fix = () => { const l = left(); if (!l.includes(set[ch.sel])) ch.sel = set.indexOf(l[0]); };
      fix();
      ch.cap = () => { const b = set[ch.sel]; return b && !b.up ? { text: 'B', pos: b.c.position.clone().add(new T.Vector3(0, b.size / 2 + .35, 0)) } : null; };
      ch.down = q => {
        const l = left();
        const o = v.pick(q.x, q.y, l.map(b => b.c));
        let b = l.find(x => x.c === o);
        if (!b) {            // 手指粗：離方塊中心 70px 內也算
          let bd = 1e9;
          l.forEach(x => { const s = sp(x.c.position), d = Math.hypot(s.x - q.x, s.y - q.y); if (d < Math.max(70, v.w * .09) && d < bd) { bd = d; b = x; } });
        }
        if (b) { poke(b.c.userData.j, .3); SFX.hover(); go(b); } else { poke(bot, .06); }
      };
      ch.key = k => {
        const l = left();
        if (k === 'left' || k === 'right') {
          const idx = l.indexOf(set[ch.sel]), n = (idx + (k === 'right' ? 1 : -1) + l.length) % l.length;
          ch.sel = set.indexOf(l[n]); poke(l[n].c.userData.j, .25); SFX.hover(); return true;
        }
        if (k === 'b' || k === 'enter' || k === 'space') { fix(); go(set[ch.sel]); return true; }
        return false;
      };
    });
  }
  const stackTop = stack => TT + .035 * k1() + stack.reduce((a, b) => a + b.size, 0);
  async function carryToPad(b, stack) {
    const c = b.c;
    await face(SPOT_A[b.spot], .45);
    await armsTo(.62, .62, .36, .36, .26, .45);
    bot.attach(c); carryObj = c; carry = c.position.clone().sub(handsMid());
    poke(c.userData.j, .2); snd.wood(900, 0, .06);
    await armsTo(1.25, 1.25, .36, .36, 0, .45);
    await face(Math.PI / 2, .55);
    await armsTo(.95, .95, .36, .36, .12, .3);
    carry = null; carryObj = null; turn.attach(c);
    const from = c.position.clone(), q0 = c.quaternion.clone(), qI = new T.Quaternion();
    const to = new T.Vector3(reach(), stackTop(stack) + b.size / 2, 0);
    await tween(.32, k => {
      c.position.x = lerp(from.x, to.x, ease(k)); c.position.z = lerp(from.z, to.z, ease(k));
      c.position.y = lerp(from.y, to.y, k * k);
      c.quaternion.slerpQuaternions(q0, qI, ease(k));
    });
    poke(c.userData.j, .4); SFX.block();
    if (stack.length) poke(stack[stack.length - 1].c.userData.j, .2);
    armsTo(0, 0, 0, 0, 0, .45);
  }
  async function topple(top, under) {
    const c = top.c, p0 = c.position.clone(), r = top.size;
    await tween(.25, k => { c.rotation.z = Math.sin(k * Math.PI * 3) * .12; });    // 晃一晃
    poke(under.c.userData.j, .3);
    await tween(.6, k => {
      c.rotation.z = -ease(k) * Math.PI / 2;
      c.position.x = p0.x + r * 1.1 * ease(k);
      c.position.y = lerp(p0.y, TT + r / 2, k * k);
    });
    poke(c.userData.j, .45); SFX.block(); snd.wood(300, .06, .12);
    await wait(.25);
  }
  async function resetCubes(set) {
    await Promise.all(set.map(async (b, n) => {
      await wait(n * .1 + .3);
      const c = b.c, from = c.position.clone(), q0 = c.quaternion.clone(), qI = new T.Quaternion(), p = spotPos(b.spot);
      const to = new T.Vector3(p.x, TT + b.size / 2, p.z);
      await tween(.6, k => { c.position.lerpVectors(from, to, k); c.position.y += 1.2 * 4 * k * (1 - k); c.quaternion.slerpQuaternions(q0, qI, ease(k)); });
      b.up = false; poke(c.userData.j, .3); SFX.land();
    }));
    await face(0, .35);
  }

  // ---------- o 眼睛：燈關掉，揮手叫醒眼睛，手指帶它看，找藏起來的方塊 ----------
  const R0 = () => 2.1 * k1();
  function hidePos(lv) {
    const R = R0(), s = .45 * k1();
    const tt = (x, z) => new T.Vector3(x * R, TT + s / 2, z * R), gd = (x, z) => new T.Vector3(x * R, s / 2, z * R);
    return [[tt(.62, .5)], [tt(-.66, .42), gd(1.08, -.5)], [gd(-1.05, -.1), tt(.1, .82), gd(1.0, .95)]][lv];
  }
  const gaze = new T.Vector3(0, 0, 1.5), gazeWant = new T.Vector3(0, 0, 1.5), gazePlane = new T.Plane(new T.Vector3(0, 1, 0), 0);
  let night = 0;
  function setNight(k) {
    night = k;
    hemi.intensity = lerp(1.9, .16, k); sun.intensity = lerp(2.5, .06, k);
    scene.background.set(A.C.bg).lerp(new T.Color(0x35302c), k); scene.fog.color.copy(scene.background);
  }
  async function eyesPlay(lv0) {
    const E = { on: false, wake: 0, list: [] };
    ch.eyes = E;
    eyesOn = false;
    await tween(1.1, k => { setNight(ease(k)); A.M.glass.emissiveIntensity = .45 * (1 - k); });
    // 揮手叫醒：手指（或滑鼠）在畫面上移動夠多、或按方向鍵
    await new Promise(res => {
      speak('e.intro'); ch.hintKey = 'e.intro';
      const t0 = performance.now();
      let last = null;
      const mv = q => { if (last) E.wake += Math.hypot(q.x - last.x, q.y - last.y); last = q; };
      ch.down = q => { last = q; }; ch.move = mv; ch.hover = mv; ch.up = () => { last = null; };
      ch.key = k => { if (['left', 'right', 'up', 'down', 'o'].includes(k)) { E.wake = 1e9; return true; } return false; };
      ch.cap = () => ({ text: '← →', pos: lean.localToWorld(new T.Vector3(0, D.topY + .5, 0)) });
      ch.frame = () => {
        const now = performance.now();
        if (E.wake > 260 || now - t0 > (G.FAST ? 300 : 22000)) { ch.frame = null; res(); }
        else if (E.wake > 0) A.M.glass.emissiveIntensity = Math.min(.5, E.wake / 260 * .5);
      };
    });
    fadeVoice(150);
    ch.cap = null;
    eyesOn = true; E.on = true;
    gaze.copy(lean.localToWorld(new T.Vector3(0, 0, 1.4))); gaze.y = 0; gazeWant.copy(gaze);
    spot.visible = true; gazeDisc.visible = true;
    poke(bot, .2); SFX.find();
    tween(.6, k => { A.M.glass.emissiveIntensity = .5 + k * .5; spot.intensity = k * 46; gazeDisc.material.opacity = k * .1; });
    await blink();
    // 看哪裡：手指按著／滑鼠移動／方向鍵
    const aim = q => {
      const r = rayTo(q.x, q.y), hit = new T.Vector3();
      if (r.ray.intersectPlane(gazePlane, hit)) gazeWant.copy(hit);
    };
    ch.down = aim; ch.move = aim; ch.hover = aim; ch.up = null; ch.key = k => ['left', 'right', 'up', 'down'].includes(k);
    ch.frame = (dt, t, now) => eyesFrame(dt, now);
    for (let lv = lv0; lv < 3; lv++) {
      ch.lv = lv;
      const pos = hidePos(lv);
      E.list = pos.map((p, n) => {
        const c = hid[n], m = c.userData.mesh;
        c.position.copy(p); c.quaternion.setFromEuler(new T.Euler(0, n * .7 + .3, 0)); c.visible = true;
        m.material.opacity = 0; m.material.transparent = true; m.visible = false; m.material.emissiveIntensity = 0;
        return { c, m, found: false, dwell: 0 };
      });
      ch.hintKey = lv === 0 ? 'e.look' : 'e.' + (lv + 1);
      if (lv === lv0 && lv > 0) (async () => { await speak('e.look'); await speak(ch.hintKey); })(); else speak(ch.hintKey);
      await new Promise(res => { E.done = res; });
      await wait(.5);
      await cheer('e.ok');
      await Promise.all(E.list.map(h => tween(.35, k => h.c.scale.setScalar(k1() * Math.max(.01, 1 - ease(k)))).then(() => { h.c.visible = false; h.c.scale.setScalar(k1()); })));
      E.list = [];
    }
    ch.frame = null; ch.down = ch.move = ch.hover = ch.key = null;
    const sp0 = spot.intensity;
    await tween(1.0, k => { setNight(1 - ease(k)); spot.intensity = sp0 * (1 - k); gazeDisc.material.opacity = .1 * (1 - k); A.M.glass.emissiveIntensity = lerp(1, .45, k); });
    spot.visible = false; gazeDisc.visible = false;
    await speak('e.done');
  }
  function eyesFrame(dt, now) {
    const E = ch.eyes, s = k1();
    // 方向鍵：看的地方慢慢移
    const sx = (held.right ? 1 : 0) - (held.left ? 1 : 0), sz = (held.down ? 1 : 0) - (held.up ? 1 : 0);
    if (sx || sz) { gazeWant.x += sx * 3.2 * s * dt; gazeWant.z += sz * 3.2 * s * dt; lastAct = now; }
    const R = R0();
    gazeWant.x = clamp(gazeWant.x, -1.35 * R, 1.35 * R); gazeWant.z = clamp(gazeWant.z, -1.25 * R, 1.3 * R); gazeWant.y = 0;
    gaze.lerp(gazeWant, 1 - Math.pow(.004, dt));
    const eye = lean.localToWorld(new T.Vector3(0, D.eyeY, D.eyeZ + .1));
    spot.position.copy(eye).addScaledVector(tmp.copy(gaze).sub(eye).normalize(), .9 * s);   // 從眼睛前面一點打出去，不照到自己 spot.target.position.copy(gaze); spot.target.updateMatrixWorld();
    gazeDisc.position.set(gaze.x, .02, gaze.z); gazeDisc.scale.setScalar(s);
    const g = sp(gaze); look.x = g.x; look.y = g.y; look.t = now;
    let left = 0;
    E.list.forEach(h => {
      if (h.found) return;
      left++;
      const d = Math.hypot(h.c.position.x - gaze.x, h.c.position.z - gaze.z);
      const vis = clamp(1 - (d - .45 * s) / (1.0 * s), 0, 1);
      h.m.material.opacity = vis; h.m.visible = vis > .02; h.m.castShadow = vis > .6;
      if (d < .7 * s) { h.dwell += dt; if (h.dwell > .3) foundIt(h); } else h.dwell = Math.max(0, h.dwell - dt);
    });
    if (E.list.length && !left && E.done) { const f = E.done; E.done = null; f(); }
  }
  function foundIt(h) {
    h.found = true; h.m.material.opacity = 1; h.m.visible = true; h.m.castShadow = true;
    h.m.material.emissive.set(0xE9A27A); h.m.material.emissiveIntensity = .55;          // 找到的方塊在暗處也看得到
    const y0 = h.c.position.y;
    tween(.5, k => { h.c.position.y = y0 + .6 * k1() * 4 * k * (1 - k); }).then(() => { h.c.position.y = y0; poke(h.c.userData.j, .4); });
    poke(h.c.userData.j, .3); SFX.find(); poke(bot, .12); blink();
    if (ch.eyes.list.some(x => !x.found)) speak('e.found');
    lastAct = performance.now();
  }

  // ---------- t 電腦：按住開機；排箭頭程式，照著走到終點 ----------
  function bootHold() {
    return new Promise(res => {
      phase = 'play';
      let held2 = 0, holding = false;
      const comp = () => P[4].obj.getWorldPosition(new T.Vector3());
      const t0 = performance.now();
      ch = { part: 4, hintKey: 'p.boot' };
      ch.glow = () => [{ pos: comp(), size: .8 * k1() }];
      ch.cap = () => ({ text: 'T', pos: comp().add(new T.Vector3(0, .55 * BOT_S, 0)) });
      ch.down = q => {
        const c = sp(comp());
        if (v.pick(q.x, q.y, [P[4].obj, body]) || Math.hypot(c.x - q.x, c.y - q.y) < Math.max(80, v.w * .12)) holding = true;
        else poke(bot, .06);
      };
      ch.up = () => { holding = false; };
      ch.key = k => { if (k === 't' || k === 'space' || k === 'enter') { holding = true; return true; } return false; };
      ch.keyup = k => { if (k === 't' || k === 'space' || k === 'enter') holding = false; };
      ch.frame = (dt, t, now) => {
        if (holding) held2 = Math.min(1, held2 + dt / .7);
        else if (held2 > 0) { if (held2 > .05) poke(P[4].j, .2); held2 = 0; }
        if (now - t0 > (G.FAST ? 400 : 30000) && !holding) held2 = 1;      // 很久都沒按：自己接上
        P[4].obj.position.y = mounts[4].y - .07 * held2;
        A.M.light.emissiveIntensity = held2 * .8;
        if (held2 >= 1) {
          P[4].obj.position.y = mounts[4].y; poke(P[4].j, .45); SFX.snap();
          ch = null; phase = 'build'; res();
        }
      };
      speak('p.boot');
    });
  }
  const PROG_LV = [{ goal: 3, rocks: [], jump: false }, { goal: 4, rocks: [2], jump: true }, { goal: 6, rocks: [1, 4], jump: true }];
  const PROG_MAX = 7;
  const progEl = $('#prog'), slotsEl = $('#slots'), cmdW = $('#cmdW'), cmdJ = $('#cmdJ'), cmdGo = $('#cmdGo');
  const ICON = {
    w: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 12h14"/><path d="M13 6l6 6-6 6"/></svg>',
    j: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 19C5 7 16 6 20 16"/><path d="M20.5 10.5 20 16l-5-1.5"/><rect x="9.6" y="17" width="4" height="4" rx="1" fill="currentColor" stroke="none"/></svg>',
  };
  cmdW.innerHTML = ICON.w + '<kbd class="kc rb-kc rb-pk">→</kbd>';
  cmdJ.innerHTML = ICON.j + '<kbd class="kc rb-kc rb-pk">↑</kbd>';
  let prog = [], running = false;
  const slotEls = [];
  for (let n = 0; n < PROG_MAX; n++) {
    const b = document.createElement('button'); b.className = 'rb-slot'; b.tabIndex = -1; b.setAttribute('aria-label', '拿掉這一步');
    b.addEventListener('click', () => { if (running || n >= prog.length || !ch || !ch.prog) return; prog.splice(n, 1); SFX.back(); drawProg(); lastAct = performance.now(); });
    slotsEl.appendChild(b); slotEls.push(b);
  }
  function drawProg(runIdx = -1) {
    slotEls.forEach((b, n) => {
      const c = prog[n];
      b.innerHTML = c ? ICON[c] : '';
      b.classList.toggle('on', !!c); b.classList.toggle('run', n === runIdx);
    });
    cmdGo.classList.toggle('ready', prog.length > 0 && !running);
    progEl.classList.toggle('busy', running);
  }
  function addCmd(c) {
    if (running || !ch || !ch.prog || prog.length >= PROG_MAX) { if (prog.length >= PROG_MAX) poke(bot, .06); return; }
    if (c === 'j' && !ch.prog.jump) return;
    prog.push(c); SFX.card(prog.length); drawProg(); lastAct = performance.now();
    const el = slotEls[prog.length - 1]; el.classList.remove('pop'); void el.offsetWidth; el.classList.add('pop');
  }
  cmdW.addEventListener('click', () => addCmd('w'));
  cmdJ.addEventListener('click', () => addCmd('j'));
  cmdGo.addEventListener('click', () => { if (ch && ch.prog && ch.prog.go) ch.prog.go(); });
  [cmdW, cmdJ, cmdGo].forEach(b => { b.tabIndex = -1; });
  async function progPlay(lv0) {
    ch.fit = 'prog';
    progEl.hidden = false;
    ch.prog = { jump: PROG_LV[lv0].jump };
    cmdJ.hidden = !ch.prog.jump;
    prog = []; drawProg();
    await trackIn(PROG_LV[lv0].goal, PROG_LV[lv0].rocks);
    for (let lv = lv0; lv < 3; lv++) {
      const L = PROG_LV[lv];
      ch.lv = lv; ch.prog.jump = L.jump; cmdJ.hidden = !L.jump;
      if (lv > lv0) { setTrack(L.goal, L.rocks); fit(false); }
      prog = []; drawProg();
      levelLine('p', lv, lv0);
      for (;;) {
        await new Promise(res => {
          ch.prog.go = () => { if (running || !prog.length) { poke(bot, .06); return; } ch.prog.go = null; res(); };
          ch.key = k => {
            if (k === 'right' || k === 'w') { addCmd('w'); return true; }
            if (k === 'up' || k === 'j') { addCmd('j'); return true; }
            if (k === 'back' || k === 'left') { if (!running && prog.length) { prog.pop(); SFX.back(); drawProg(); } return true; }
            if (k === 'enter' || k === 'space' || k === 't') { if (ch.prog.go) ch.prog.go(); return true; }
            return false;
          };
        });
        fadeVoice(150);
        running = true; drawProg();
        const r = await runProg(L);
        running = false; drawProg();
        if (r === 'ok') { await Promise.all([flagWin(), cheer('p.ok')]); break; }
        await Promise.all([speak(r === 'bump' ? 'p.bump' : 'p.short'), (async () => { await wait(.4); await backHome(); })()]);
      }
      if (lv < 2) await backHome();
    }
    ch.key = null; ch.prog = null;
    progEl.hidden = true;
    await speak('p.done');
    await trackOut();
  }
  async function runProg(L) {
    const blockAt = c => c > L.goal ? TU.wall : (L.rocks.includes(c) ? TU.stumps[L.rocks.indexOf(c)].userData.j : null);
    for (let n = 0; n < prog.length; n++) {
      drawProg(n); SFX.card(n);
      await wait(G.FAST ? .02 : .18);
      if (prog[n] === 'w') {
        const b = blockAt(botCell + 1);
        if (b) { await bump(b); drawProg(); return 'bump'; }
        await stepTo(botCell + 1, G.FAST ? .06 : .45, n);
      } else {
        const b = blockAt(botCell + 2);
        if (b) { await jumpTo(botCell + 2, b); drawProg(); return 'bump'; }
        await jumpTo(botCell + 2);
      }
    }
    drawProg();
    return botCell === L.goal ? 'ok' : 'short';
  }

  // ---------- 直接擺好（重開頁面、?step=N）：不飛、不唸 ----------
  function placeInstant(i) {
    placed[i] = true;
    if (i === 0) { attachAt(P[0]); sheet.visible = true; sheet.scale.y = 1; A.M.ghost.opacity = .26; }
    else attachAt(P[i]);
    if (i === 1) { body.visible = true; BODY_MATS.forEach(m => { m.transparent = false; m.opacity = 1; m.needsUpdate = true; }); }
    if (i === 3) { eyesOn = true; A.M.glass.emissiveIntensity = .45; }
    if (i === 4) A.M.light.emissiveIntensity = 1.3;
    letterSet(i, 'on');
    ghostVis();
  }

  // ---------- 結尾重播 ----------
  async function disassemble() {
    eyesOn = false; carry = null;
    pose.th = [0, 0]; pose.ph = [0, 0]; pose.lean = 0;
    const jobs = [];
    LET.forEach((_, i) => letterSet(i, 'dim'));
    // 零件一個一個輕輕彈回架子
    [4, 3, 2, 1].forEach((i, k) => jobs.push((async () => {
      await wait(.15 * k);
      placed[i] = false;
      poke(P[i].j, .2);
      await flyTo(P[i], () => shelfWorld(i), { dur: .75, arc: 1.1, spread: 0 });
      toShelf(P[i]); poke(P[i].j, .3); SFX.land();
    })()));
    jobs.push(tween(.6, k => { A.M.light.emissiveIntensity = 1.3 * (1 - k); A.M.glass.emissiveIntensity = .45 * (1 - k); }));
    jobs.push((async () => {   // 方塊縮小收起來
      await tween(.4, k => block.scale.setScalar(1 - ease(k)));
      block.visible = false; block.scale.setScalar(1);
    })());
    jobs.push((async () => {   // 身體變回輪廓、再淡掉
      await wait(.5);
      ghostVis(); GP.body.visible = true;
      await fadeMats(BODY_MATS, 1, 0, .6);
      body.visible = false;
    })());
    jobs.push((async () => {   // 設計圖捲起來、回架子
      await wait(.8);
      await tween(.5, k => { sheet.scale.y = lerp(1, .02, ease(k)); A.M.ghost.opacity = .26 * (1 - k); });
      sheet.visible = false; placed[0] = false; ghost.visible = false; A.M.ghost.opacity = .26;
      await flyTo(P[0], () => shelfWorld(0), { dur: .7, arc: 1.2 });
      toShelf(P[0]); poke(P[0].j, .3); SFX.land();
    })());
    await Promise.all(jobs);
    ghostVis();
  }
  async function reassemble(i) {
    wantFront = 3;
    await flyTo(P[i], () => mountWorld(i), { dur: .85, arc: 1.5, spread: 1 });
    placed[i] = true; attachIfNeeded(i);
    if (i > 0) ghostVis();
    SFX.snap(); poke(bot, .14); poke(P[i].j, .35);
    await Promise.all([runAct(i), letterWrite(i)]);
  }
  async function runEnding() {
    if (phase === 'ending') return;
    phase = 'ending'; epoch++; glowOn = false;
    fadeVoice(200);
    await Promise.all([speak('end.1'), disassemble()]);
    for (let i = 0; i < 5; i++) await Promise.all([speak(STEPS[i].end), reassemble(i), wait(G.FAST ? .2 : 1.2)]);
    SFX.chord();
    // end.7：整台慢慢轉一圈給你看
    yaw = wrap(yaw); const y0 = yaw; spinning = true;
    await Promise.all([speak('end.7'), tween(G.FAST ? 2.5 : 6, k => { yaw = y0 + ease(k) * Math.PI * 2; yawV = 0; })]);
    spinning = false; yaw = wrap(yaw);
    await speak('end.8');
    LET.forEach((_, i) => letterFlash(i));
    SFX.chord();
    await Promise.all([speak('en.robot'), wave(), (async () => { await wait(.4); await blink(); })()]);
    S.step = 5; S.done = true; save();
    goFree();
  }
  function goFree() {
    phase = 'free'; glowOn = false;
    $('#corner').hidden = false;
  }

  // ---------- 輸入 ----------
  let yaw = 0, yawV = 0, wantFront = 0, spinning = false;
  const keysHeld = {};
  let ptr = null;                           // 正在按著的手指／滑鼠
  let hoverPart = -1;
  const look = { x: 0, y: 0, t: -9, mouse: false };
  const ray = new T.Raycaster(), ndc = new T.Vector2(), plane = new T.Plane();
  const local = ev => { const r = host.getBoundingClientRect(); return { x: ev.clientX - r.left, y: ev.clientY - r.top }; };
  // 第一次碰＝開始：解鎖聲音、播開場兩句（觸控要等手指放開才算「使用者剛碰到」，iOS 才肯出聲）
  let started = false;
  const activation = ev => ev.type === 'keydown' || ev.type === 'touchend' || (ev.type === 'pointerup' && ev.pointerType !== 'mouse') || (ev.type === 'pointerdown' && ev.pointerType === 'mouse');
  addEventListener('pointerdown', ev => { if (activation(ev)) firstTouch(); }, true);
  addEventListener('pointerup', ev => { if (activation(ev)) firstTouch(); else unlockAudio(); }, true);
  addEventListener('touchend', () => unlockAudio(), { passive: true, capture: true });
  addEventListener('click', () => unlockAudio(), true);
  function firstTouch() {
    unlockAudio();
    if (started) return;
    started = true;
    if (phase === 'build' && cur === 0) {
      const my = epoch;
      (async () => { await speak('intro.1'); if (my === epoch) await speak('intro.2'); })();
    }
  }
  // 架子上的哪一個（用螢幕距離：手機上每格至少 44px 好按）
  function slotPx() { return Math.abs(sp(new T.Vector3(slotX(1), TOP, SHZ)).x - sp(new T.Vector3(slotX(0), TOP, SHZ)).x); }
  function shelfHit(x, y) {
    const w = slotPx(); let best = -1, bd = 1e9;
    P.forEach((p, i) => {
      if (p.state !== 'shelf') return;
      const c = sp(p.obj.position);
      const dx = Math.abs(x - c.x), dy = y - c.y;
      if (dx < Math.max(24, w * .5) && dy > -Math.max(44, w * .95) && dy < Math.max(34, w * .7) && dx + Math.abs(dy) < bd) { bd = dx + Math.abs(dy); best = i; }
    });
    return best;
  }
  // 自由玩：點到機器人的哪一個部分
  function robotHit(x, y) {
    const objs = [P[0].obj, sheet, P[1].obj, P[2].obj, P[3].obj, P[4].obj, body];
    const o = v.pick(x, y, objs);
    if (!o) return -1;
    if (o === sheet || o === P[0].obj) return 0;
    if (o === body) return 1;
    return [1, 2, 3, 4].find(i => P[i].obj === o) ?? -1;
  }
  function rayTo(x, y) { ndc.set(x / v.w * 2 - 1, -(y / v.h) * 2 + 1); ray.setFromCamera(ndc, cam); return ray; }

  host.addEventListener('pointerdown', ev => {
    if (ev.button > 0) return;
    ev.preventDefault();
    const q = local(ev);
    lastAct = performance.now();
    look.x = q.x; look.y = q.y; look.t = performance.now(); look.mouse = ev.pointerType === 'mouse';
    if (phase === 'play') {
      ptr = { id: ev.pointerId, x0: q.x, y0: q.y, x: q.x, y: q.y, part: -1, mode: 'play', lt: performance.now(), lx: q.x };
      try { host.setPointerCapture(ev.pointerId); } catch (e) { /* ignore */ }
      if (ch && ch.down) ch.down(q);
      return;
    }
    const hit = phase === 'build' ? shelfHit(q.x, q.y) : -1;
    ptr = { id: ev.pointerId, x0: q.x, y0: q.y, x: q.x, y: q.y, part: hit, mode: 'pending', lt: performance.now(), lx: q.x };
    try { host.setPointerCapture(ev.pointerId); } catch (e) { /* ignore */ }
    if (hit >= 0) poke(P[hit].j, .12);
  });
  host.addEventListener('pointermove', ev => {
    const q = local(ev);
    look.x = q.x; look.y = q.y; look.t = performance.now(); look.mouse = ev.pointerType === 'mouse';
    if (!ptr || ev.pointerId !== ptr.id) {
      if (phase === 'play') { if (ev.pointerType === 'mouse' && ch && ch.hover) ch.hover(q); }
      else if (ev.pointerType === 'mouse') hoverCheck(q.x, q.y);
      return;
    }
    const now = performance.now(), dx = q.x - ptr.x;
    if (ptr.mode === 'play') { ptr.x = q.x; ptr.y = q.y; lastAct = now; if (ch && ch.move) ch.move(q); return; }
    ptr.x = q.x; ptr.y = q.y;
    if (ptr.mode === 'pending' && Math.hypot(q.x - ptr.x0, q.y - ptr.y0) > 8) {
      const p = ptr.part >= 0 ? P[ptr.part] : null;
      if (p && ptr.part === cur && phase === 'build' && p.state === 'shelf') { ptr.mode = 'drag'; p.state = 'drag'; p.near = false; wantFront = 9; dragPlane(ptr.part); }
      else ptr.mode = 'rotate';
    }
    if (ptr.mode === 'rotate') {
      const d = dx * .011;
      yaw += d; const dtm = Math.max(8, now - ptr.lt) / 1000;
      yawV = lerp(yawV, d / dtm, .5);
      ptr.lt = now;
    }
    lastAct = now;
  });
  function endPtr(ev) {
    if (!ptr || ev.pointerId !== ptr.id) return;
    const pr = ptr; ptr = null;
    if (pr.mode === 'play') { if (ch && ch.up) ch.up(local(ev)); }
    else if (pr.mode === 'pending' && ev.type === 'pointerup') tap(pr);
    else if (pr.mode === 'drag') dropPart(pr.part);
    else if (pr.mode === 'rotate' && performance.now() - pr.lt > 90) yawV = 0;   // 停住再放手就不滑
    if (!look.mouse) look.t = performance.now();
  }
  host.addEventListener('pointerup', endPtr);
  host.addEventListener('pointercancel', endPtr);
  host.addEventListener('pointerleave', () => { if (!ptr && hoverPart >= 0) { hoverPart = -1; host.style.cursor = ''; } });

  function tap(pr) {
    if (phase === 'build') {
      if (pr.part >= 0) {
        if (pr.part === cur) autoFly(pr.part); else nudge(pr.part);
        return;
      }
      const h = robotHit(pr.x, pr.y);
      if (h >= 0 || v.pick(pr.x, pr.y, [turn])) { poke(bot, .1); SFX.back(); }
    } else if (phase === 'free') {
      const h = robotHit(pr.x, pr.y);
      if (h >= 0) replay(h);
      else if (v.pick(pr.x, pr.y, [turn])) { poke(bot, .1); SFX.back(); }
    }
  }
  // 自由玩：點一個零件＝重唸字母＋那一步的句子＋那一步的動作
  let replayTok = 0;
  async function replay(i) {
    const my = ++replayTok;
    fadeVoice(150);
    poke(P[i].j, .3); SFX.snap();
    letterFlash(i);
    wantFront = i === 0 ? 0 : 2;
    runAct(i, true);
    await speak(STEPS[i].en);
    if (my !== replayTok) return;
    await speak(STEPS[i].say);
  }

  function dragPlane(i) {
    const t = mountWorld(i).pos, n = new T.Vector3();
    cam.getWorldDirection(n);
    plane.setFromNormalAndCoplanarPoint(n.negate(), t);
  }
  function snapR() { return Math.max(56, Math.min(v.w, v.h) * .13); }
  function dropPart(i) {
    const p = P[i];
    if (p.state !== 'drag') return;
    const a = sp(p.obj.position), b = sp(mountWorld(i).pos);
    if (Math.hypot(a.x - b.x, a.y - b.y) < snapR()) { snapIn(i); return; }
    // 放在別處：滑一下，再彈回架子（不出錯聲、不算錯）
    p.state = 'slide'; p.slideT = 0;
  }

  function hoverCheck(x, y) {
    let h = phase === 'build' ? shelfHit(x, y) : -1;
    let pointer = h >= 0;
    if (!pointer && phase === 'free') pointer = robotHit(x, y) >= 0;
    if (h !== hoverPart) {
      hoverPart = h;
      if (h >= 0) { poke(P[h].j, .1); SFX.hover(); }
    }
    host.style.cursor = pointer ? 'pointer' : 'grab';
  }

  addEventListener('keydown', ev => {
    if (ev.metaKey || ev.ctrlKey || ev.altKey) return;     // Cmd+R 重新整理不算按 R
    const k = keyName(ev);
    if (phase === 'play') {
      if (!k) return;
      firstTouch(); lastAct = performance.now();
      if (['left', 'right', 'up', 'down'].includes(k)) held[k] = true;
      const used = !ev.repeat && ch && ch.key && ch.key(k, ev);
      if (used || ['left', 'right', 'up', 'down', 'space', 'enter', 'back'].includes(k)) ev.preventDefault();
      return;
    }
    if (k === 'left' || k === 'right') { keysHeld[k] = true; ev.preventDefault(); firstTouch(); lastAct = performance.now(); return; }
    if (ev.repeat || !'robt'.includes(k) || !k) return;
    firstTouch();
    lastAct = performance.now();
    if (phase === 'build') {
      let i;
      if (k === 'o') i = [1, 3].find(j => !placed[j]);     // O 出現兩次：只對下一個還沒裝的 o
      else i = STEPS.findIndex(s => s.key === k);
      if (i === undefined || i < 0 || placed[i]) return;
      ev.preventDefault();
      if (i === cur && (P[i].state === 'shelf' || P[i].state === 'slide')) autoFly(i);
      else if (P[i].state === 'shelf') nudge(i);
    } else if (phase === 'free') {
      ev.preventDefault();
      replay(k === 'o' ? (lastO = lastO === 1 ? 3 : 1) : STEPS.findIndex(s => s.key === k));
    }
  });
  let lastO = 3;
  addEventListener('keyup', ev => {
    const k = keyName(ev);
    if (k === 'left' || k === 'right') keysHeld[k] = false;
    if (k in held) held[k] = false;
    if (phase === 'play' && ch && ch.keyup) ch.keyup(k);
  });
  addEventListener('blur', () => { keysHeld.left = keysHeld.right = false; Object.keys(held).forEach(k => { held[k] = false; }); if (ch && ch.keyup) ['t', 'space', 'enter'].forEach(k => ch.keyup(k)); });

  // 右下角：重玩、給家長
  $('#againBtn').addEventListener('click', () => {
    S.step = 0; S.done = false; save(); G.stopVoice();
    location.href = location.pathname;
  });
  const info = $('#info'), infoBtn = $('#infoBtn');
  const setInfo = on => { info.hidden = !on; infoBtn.setAttribute('aria-expanded', on ? 'true' : 'false'); };
  infoBtn.addEventListener('click', () => setInfo(info.hidden));
  $('#infoClose').addEventListener('click', () => setInfo(false));

  // ---------- 相機：機器人＋架子都要在畫面裡（手機直的也是）；小挑戰的走道也要進來 ----------
  // fit() 算出「該在哪裡」，每一畫面慢慢滑過去（視窗大小改變時直接跳到位）
  let lastW = 0, lastH = 0;
  const camWant = { pos: new T.Vector3(0, 8, 14), look: new T.Vector3(0, 2, 1.6) }, camLook = new T.Vector3(0, 2, 1.6);
  function extraFit() {
    if (!ch || !ch.goal) return [];
    const x = (ch.goal + .8) * CELL;
    return [new T.Vector3(x, 0, .75 * CELL), new T.Vector3(x, 0, -.75 * CELL),
      new T.Vector3(ch.goal * CELL, TT + 3.9 * BOT_S, 0), new T.Vector3(ch.goal * CELL + .6 * BOT_S, 2.6 * BOT_S, 0)];
  }
  function progNdc() {
    if (!ch || ch.fit !== 'prog' || progEl.hidden) return 0;
    return 2 * (progEl.offsetHeight + 14) / Math.max(1, v.h);
  }
  function fit(snap = true) {
    const asp = v.w / v.h;
    if ((asp < .85) !== portrait) applyLayout(asp < .85);
    cam.fov = portrait ? 42 : 34;
    cam.aspect = asp;
    cam.updateProjectionMatrix();
    const keepPos = cam.position.clone();
    const pts = FIT_PTS.concat(extraFit());
    const elev = (portrait ? 34 : 29) * Math.PI / 180;
    const dir = new T.Vector3(0, Math.sin(elev), Math.cos(elev));
    const target = new T.Vector3(0, 2.0, 1.6);
    const topLim = portrait ? .8 : .78, botLim = (portrait ? -.84 : -.86) + progNdc(), xLim = portrait ? .965 : .9;
    const place = d => { cam.position.copy(target).addScaledVector(dir, d); cam.lookAt(target); cam.updateMatrixWorld(); };
    const range = () => {
      let x0 = 9, x1 = -9, y0 = 9, y1 = -9;
      pts.forEach(p => { const q = p.clone().project(cam); x0 = Math.min(x0, q.x); x1 = Math.max(x1, q.x); y0 = Math.min(y0, q.y); y1 = Math.max(y1, q.y); });
      return { x0, x1, y0, y1 };
    };
    let hi = 20;
    for (let it = 0; it < 4; it++) {
      let lo = 3; hi = 80;
      for (let n = 0; n < 30; n++) {
        const d = (lo + hi) / 2; place(d);
        const r = range();
        if (Math.max(-r.x0, r.x1) <= xLim && r.y1 <= topLim && r.y0 >= botLim) hi = d; else lo = d;
      }
      place(hi);
      const r = range();
      // 上下置中到可用區域；左右也置中（走道往右伸出去時）
      const midWant = (topLim + botLim) / 2, mid = (r.y0 + r.y1) / 2;
      const up = new T.Vector3(0, 1, 0).applyQuaternion(cam.quaternion), right = new T.Vector3(1, 0, 0).applyQuaternion(cam.quaternion);
      const worldPerNdc = hi * Math.tan(cam.fov * Math.PI / 360);
      target.addScaledVector(up, (mid - midWant) * worldPerNdc);
      target.addScaledVector(right, (r.x0 + r.x1) / 2 * worldPerNdc * asp);
    }
    place(hi);
    camWant.pos.copy(cam.position); camWant.look.copy(target);
    if (snap) camLook.copy(target);
    else { cam.position.copy(keepPos); cam.lookAt(camLook); cam.updateMatrixWorld(); }
    lastW = v.w; lastH = v.h;
  }

  // ---------- 每一畫面 ----------
  const tmp = new T.Vector3();
  v.on((dt, t) => {
    if (v.w !== lastW || v.h !== lastH) fit(true);
    { const kc = 1 - Math.pow(.06, dt); cam.position.lerp(camWant.pos, kc); camLook.lerp(camWant.look, kc); cam.lookAt(camLook); cam.updateMatrixWorld(); }
    for (const tw of [...tweens]) {
      tw.t += dt;
      const k = Math.min(1, tw.t / tw.dur);
      tw.f(k);
      if (k >= 1) { tweens.delete(tw); tw.res(); }
    }
    const now = performance.now();

    // 轉台：拖＝轉、放手滑一下；← → 鍵；裝零件時自己慢慢轉回正面
    if (keysHeld.left) yawV = lerp(yawV, -2.2, .15);
    else if (keysHeld.right) yawV = lerp(yawV, 2.2, .15);
    wantFront = Math.max(0, wantFront - dt);
    const busy = P.some(p => p.state === 'drag' || p.state === 'fly');
    const rotating = ptr && ptr.mode === 'rotate', keyRot = keysHeld.left || keysHeld.right;
    if (!spinning) {
      if (phase === 'play') { yaw = wrap(yaw); yaw = lerp(yaw, 0, 1 - Math.pow(.02, dt)); yawV = 0; }
      else if ((wantFront > 0 || busy) && !rotating && !keyRot) { yaw = wrap(yaw); yaw = lerp(yaw, 0, 1 - Math.pow(.08, dt)); yawV = 0; }
      else if (!rotating) { yaw += yawV * dt; if (!keyRot) yawV *= Math.pow(.06, dt); }
    }
    turn.rotation.y = yaw;

    // 機器人：果凍、手臂、搬方塊
    wobble(bot, dt);
    setArms();
    if (carry) (carryObj || block).position.copy(handsMid().add(carry));
    wobble(block.userData.j, dt);
    wobble(TU.wall, dt); wobble(TU.flag.userData.j, dt); TU.stumps.forEach(s => wobble(s.userData.j, dt));
    cubes.forEach(c => wobble(c.userData.j, dt)); hid.forEach(c => wobble(c.userData.j, dt));
    TU.lit.forEach(r => { r.material.opacity = lerp(r.material.opacity, (r.userData.on || 0) * .85, 1 - Math.pow(.001, dt)); });
    if (ch && ch.frame) ch.frame(dt, t, now);

    // 眼睛跟著手指／滑鼠看（手指放開一會兒，就慢慢回來看你）
    if (eyesOn && placed[3]) {
      const hp = sp(lean.localToWorld(tmp.set(0, D.eyeY, D.eyeZ)));
      let dx = 0, dy = 0;
      const fresh = look.mouse || now - look.t < 1400;
      if (fresh && look.t > 0) { dx = (look.x - hp.x) / 240; dy = (look.y - hp.y) / 240; }
      else { dx = Math.sin(t * .7) * .25; dy = Math.sin(t * .43) * .12; }
      const l = Math.hypot(dx, dy); if (l > 1) { dx /= l; dy /= l; }
      P[3].obj.userData.pupils.forEach(pu => { pu.position.x = lerp(pu.position.x, dx * .055, .2); pu.position.y = lerp(pu.position.y, -dy * .055, .2); });
    }

    // 零件
    const idle = (now - lastAct) / 1000;
    P.forEach((p, i) => {
      wobble(p.j, dt);
      if (p.shake > 0) { p.j.rotation.z = Math.sin(t * 38) * .16 * p.shake; p.shake = Math.max(0, p.shake - dt * 2.4); if (!p.shake) p.j.rotation.z = 0; }
      if (p.state === 'shelf') {
        const isCur = phase === 'build' && i === cur && glowOn;
        const bob = isCur ? Math.sin(t * 3) * .035 + .035 : 0;
        // 15 秒沒動：零件自己跳一下、往機器人的方向（示範）
        if (isCur && idle > 15 && now - lastHint > 15000) { lastHint = now; p.hint = 1; }
        let hx = 0, hy = 0, hz = 0;
        if (p.hint > 0) {
          const k = 1 - p.hint, s = Math.sin(k * Math.PI);
          const to = mountWorld(i).pos.sub(p.home.pos).multiplyScalar(.18 * s);
          hx = to.x; hy = s * .7; hz = to.z;
          p.hint = Math.max(0, p.hint - dt * 1.1);
          if (p.hint === 0) { poke(p.j, .3); SFX.back(); }
        }
        p.obj.position.set(p.home.pos.x + hx, p.home.pos.y + bob + hy, p.home.pos.z + hz);
      } else if (p.state === 'drag' && ptr) {
        const r = rayTo(ptr.x, ptr.y), hit = new T.Vector3();
        if (r.ray.intersectPlane(plane, hit)) {
          const prev = p.obj.position.clone();
          p.obj.position.lerp(hit, 1 - Math.pow(.7, dt * 60));        // 跟手但略慢（約 0.3）
          p.vel.copy(p.obj.position).sub(prev).divideScalar(Math.max(dt, 1e-3));
          const tilt = clamp(-p.vel.x * .02, -.105, .105);             // 朝移動方向傾斜 ≤ 6°
          p.j.rotation.z = lerp(p.j.rotation.z, tilt, .25);
          p.obj.scale.lerp(tmp.copy(p.home.s).multiplyScalar(1.12), .2);
          const a = sp(p.obj.position), b = sp(mountWorld(i).pos);
          const near = Math.hypot(a.x - b.x, a.y - b.y) < snapR();
          if (near && !p.near) { poke(bot, .1); SFX.hover(); }       // 拖到目標上方：機器人先壓一下
          p.near = near;
        }
      } else if (p.state === 'slide') {
        p.slideT += dt;
        p.obj.position.addScaledVector(p.vel, dt); p.vel.multiplyScalar(Math.pow(.05, dt));
        p.j.rotation.z = lerp(p.j.rotation.z, 0, .2);
        if (p.slideT > .25) {
          p.state = 'fly';
          flyTo(p, () => p.home, { dur: .45, arc: .5 }).then(() => { if (p.state === 'fly') { toShelf(p); poke(p.j, .3); SFX.back(); } });
        }
      }
      if (p.state !== 'drag' && p.state !== 'slide' && !p.shake) p.j.rotation.z = lerp(p.j.rotation.z, 0, .2);
    });

    // 光圈：現在這一步的落點＋架子上的那一格（5 秒沒動就亮一點）
    const showGlow = phase === 'build' && cur < 5 && glowOn && P[cur].state !== 'fly';
    const breathe = .5 + .5 * Math.sin(t * 2.6);
    const boost = idle > 5 ? .3 : 0;
    const dragging = showGlow && P[cur].state === 'drag';
    if (showGlow) {
      const tg = haloTargets(cur);
      halos.forEach((h, k) => {
        const p = tg[k];
        h.visible = !!p;
        if (!p) return;
        h.position.copy(p.pos);
        const s = p.size * (1 + .08 * breathe + (dragging && P[cur].near ? .3 : 0));
        h.scale.set(s, s, 1);
        const facing = cur === 0 ? 1 : Math.max(0, Math.cos(wrap(yaw))) ** 2;   // 機器人轉過去時，身上的光圈跟著淡掉
        h.material.opacity = (dragging ? (P[cur].near ? .95 : .7) : .38 + .3 * breathe + boost) * facing;
      });
      fring.visible = P[cur].state === 'shelf';
      fring.position.set(slotX(cur), TOP + .012, SHZ);
      fring.material.opacity = .3 + .3 * breathe + boost;
      fring.scale.setScalar(1 + .06 * breathe);
    } else if (phase === 'play' && ch && ch.glow) {
      const tg = ch.glow();
      halos.forEach((h, k) => {
        const p = tg[k]; h.visible = !!p; if (!p) return;
        h.position.copy(p.pos); const s = p.size * (1 + .1 * breathe); h.scale.set(s, s, 1);
        h.material.opacity = .4 + .35 * breathe + boost;
      });
      fring.visible = false;
    } else { halos.forEach(h => { h.visible = false; }); fring.visible = false; }
    // 手臂那關：還沒搬的方塊底下一圈光（鍵盤選到的那一塊比較亮）
    cubeRings.forEach((r, n) => {
      const b = ch && ch.cubes && ch.cubes[n];
      r.visible = !!(b && !b.up && b.c.visible && b.c.parent === turn);
      if (!r.visible) return;
      r.position.set(b.c.position.x, TT + .012, b.c.position.z);
      const on = ch.down ? 1 : 0, sel = ch.sel === n ? 1 : 0;
      r.scale.setScalar(b.size * 2.1 * (1 + .06 * breathe + .12 * sel));
      r.material.opacity = on * (.25 + .25 * breathe + .25 * sel + boost);
    });
    // 小挑戰很久沒動：再講一次這一關怎麼玩
    if (phase === 'play' && ch && ch.hintKey && idle > 16 && now - lastHint > 16000 && !running) { lastHint = now; lastAct = now - 8000; speak(ch.hintKey); }

    // HTML 疊層：四線格貼在架子正面、鍵帽掛在零件上方
    const fz = SHZ + SHD / 2 + .01;
    const lt = sp(tmp.set(-SHW / 2 + .12, SHH - .06, fz)), rb = sp(new T.Vector3(SHW / 2 - .12, .1, fz));
    const sh = Math.max(20, rb.y - lt.y);
    strip.style.left = lt.x + 'px'; strip.style.top = lt.y + 'px';
    strip.style.width = (rb.x - lt.x) + 'px'; strip.style.height = sh + 'px';
    LET.forEach((L, i) => {
      const c = sp(tmp.set(slotX(i), .5, fz));
      const w = sh * .8;
      L.svg.style.left = (c.x - lt.x - w / 2) + 'px'; L.svg.style.width = w + 'px'; L.svg.style.height = sh + 'px';
    });
    // 小挑戰：三個小點＝三小關（掛在那個字母下面）；鍵盤提示
    if (ch && ch.lv != null && ch.part >= 1 && ch.part <= 4) {
      const c = sp(tmp.set(slotX(ch.part), .5, fz));
      pips.hidden = false;
      pips.style.transform = 'translate(' + c.x.toFixed(1) + 'px,' + (rb.y + 8).toFixed(1) + 'px) translate(-50%,0)';
      PIPS.forEach((p, n) => { p.className = n < ch.lv ? 'done' : n === ch.lv ? 'cur' : ''; });
    } else pips.hidden = true;
    const cp = ch && ch.cap && ch.cap();
    if (cp) {
      const c = sp(cp.pos);
      chCap.textContent = cp.text; chCap.classList.remove('off');
      chCap.style.transform = 'translate(' + c.x.toFixed(1) + 'px,' + c.y.toFixed(1) + 'px) translate(-50%,-100%)';
    } else chCap.classList.add('off');
    CAPS.forEach((el, i) => {
      const p = P[i], show = phase === 'build' && (p.state === 'shelf');
      el.classList.toggle('off', !show);
      if (!show) return;
      const c = sp(tmp.set(p.obj.position.x, p.capY + (p.obj.position.y - p.home.pos.y), p.obj.position.z));
      el.style.transform = 'translate(' + c.x.toFixed(1) + 'px,' + c.y.toFixed(1) + 'px) translate(-50%,-100%)';
      el.classList.toggle('cur', i === cur && glowOn);
    });
  });
  // 落點的光圈：位置與大小（世界座標）
  function haloTargets(i) {
    const W = (x, y, z) => lean.localToWorld(new T.Vector3(x, y, z)), k = BOT_S / 1.25;
    if (i === 0) return [{ pos: worldPose(turn, new T.Vector3(0, TT + .5, .2)).pos, size: 2.4 * k }];
    if (i === 1) return [{ pos: W(0, D.bodyY + .03, D.front), size: 1.15 * k }];
    if (i === 2) return [{ pos: W(-D.shX, D.shY, 0), size: .7 * k }, { pos: W(D.shX, D.shY, 0), size: .7 * k }];
    if (i === 3) return [{ pos: W(-D.eyeX, D.eyeY, D.eyeZ), size: .55 * k }, { pos: W(D.eyeX, D.eyeY, D.eyeZ), size: .55 * k }];
    return [{ pos: W(0, D.topY - .05, 0), size: .8 * k }];
  }

  // ---------- 開始：讀進度（或測試網址） ----------
  LET.forEach((_, i) => letterSet(i, 'none'));
  let startN = Math.max(0, Math.min(5, +S.step || 0));
  if (S.done) startN = 5;
  // 小挑戰：最後裝上的那個零件，挑戰還沒過關，就從那個挑戰接著玩
  let resume = 0, resumeLv = 0;
  if (QS.has('step')) { startN = Math.max(0, Math.min(5, +QS.get('step') || 0)); S.cl = Math.max(0, startN - 1); }
  else if (QS.has('play')) {
    resume = Math.max(1, Math.min(4, +QS.get('play') || 1)); startN = resume + 1;
    resumeLv = Math.max(0, Math.min(2, +QS.get('lv') || 0)); S.cl = resume - 1;
  } else if (!QS.has('end') && !S.done && startN >= 2 && (S.cl || 0) < startN - 1) resume = startN - 1;
  if (QS.has('end')) startN = 5;
  for (let i = 0; i < startN; i++) placeInstant(i);
  cur = startN;
  if (QS.has('end')) { setTimeout(runEnding, 300); }
  else if (resume) {
    S.step = startN; save(); glowOn = false;
    setTimeout(async () => {
      const my = ++epoch;
      await challenge(resume, resumeLv);
      if (my !== epoch) return;
      if (resume === 4) runEnding(); else { glowOn = true; lastAct = performance.now(); }
    }, 400);
  }
  else if (startN >= 5 && !S.done && !QS.has('step')) { S.step = 5; save(); setTimeout(runEnding, 400); }
  else if (startN >= 5) { S.step = 5; S.done = true; save(); goFree(); }
  else { S.step = startN; save(); }

  // 量測用（tester／judge）：架子上每個零件在螢幕上的寬度（px）
  window.__robot = {
    partPx: () => P.map(p => {
      const b = new T.Box3().setFromObject(p.obj); let x0 = 1e9, x1 = -1e9;
      [b.min.x, b.max.x].forEach(x => [b.min.y, b.max.y].forEach(y => [b.min.z, b.max.z].forEach(z => { const q = sp(new T.Vector3(x, y, z)); x0 = Math.min(x0, q.x); x1 = Math.max(x1, q.x); })));
      return Math.round(x1 - x0);
    }),
    slotPx: () => Math.round(slotPx()),
    at: i => { const a = sp(P[i].obj.position), b = sp(mountWorld(i).pos); return [Math.round(a.x), Math.round(a.y), Math.round(b.x), Math.round(b.y)]; },
    state: () => ({ phase, cur, placed: placed.slice(), ch: ch ? { part: ch.part, lv: ch.lv, goal: ch.goal || 0, cell: botCell, input: !!ch.key } : null }),
    cubePx: () => ch && ch.cubes ? ch.cubes.map(b => { const q = sp(b.c.position); return { s: +b.size.toFixed(2), up: b.up, x: Math.round(q.x), y: Math.round(q.y) }; }) : [],
    hidPx: () => hid.filter(c => c.visible).map(c => { const q = sp(c.position); return [Math.round(q.x), Math.round(q.y)]; }),
    meshes: () => { let n = 0; scene.traverse(o => { if (o.isMesh || o.isSprite) n++; }); return n; },
  };
})();
