// 《做一台機器人》：一個 3D 場景、五個零件、五步歷史。
// 主畫面（零中文）→ 五步（r o b o t）→ 結尾重播（機器人散開、照五步裝回去、講完整故事）→ 自由玩（點零件重聽那一步）。
// 輸入三條路都通：按那一步的字母鍵、點發光的零件（零件自己飛進去）、用手指把零件拖到機器人身上。
// 測試：?fast=1（旁白不等）、?step=N（已經裝好 N 個零件，不重播動畫、不唸）、?end=1（直接看結尾重播）。
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
  scene.add(new T.HemisphereLight(0xFFF6E6, 0xD9DCC4, 1.9));
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
  };

  // ---------- 狀態 ----------
  const placed = [false, false, false, false, false];
  let phase = 'build';          // build | ending | free
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
    const act = runAct(i);
    await Promise.all([letterWrite(i), speak(STEPS[i].en)]);
    SFX.done(i);
    if (my !== epoch || phase !== 'build') return;
    await speak(STEPS[i].say);
    if (my !== epoch || phase !== 'build') return;
    if (i === 4) { await act; await sleep(G.FAST ? 100 : 700); if (my === epoch) runEnding(); return; }
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

  // ---------- 直接擺好（重開頁面、?step=N）：不飛、不唸 ----------
  function placeInstant(i) {
    placed[i] = true;
    if (i === 0) { attachAt(P[0]); sheet.visible = true; sheet.scale.y = 1; A.M.ghost.opacity = .26; }
    else attachAt(P[i]);
    if (i === 1) { body.visible = true; BODY_MATS.forEach(m => { m.transparent = false; m.opacity = 1; m.needsUpdate = true; }); }
    if (i === 2) { block.visible = true; block.position.copy(BLOCK_REST); }
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
    const hit = phase === 'build' ? shelfHit(q.x, q.y) : -1;
    ptr = { id: ev.pointerId, x0: q.x, y0: q.y, x: q.x, y: q.y, part: hit, mode: 'pending', lt: performance.now(), lx: q.x };
    try { host.setPointerCapture(ev.pointerId); } catch (e) { /* ignore */ }
    if (hit >= 0) poke(P[hit].j, .12);
  });
  host.addEventListener('pointermove', ev => {
    const q = local(ev);
    look.x = q.x; look.y = q.y; look.t = performance.now(); look.mouse = ev.pointerType === 'mouse';
    if (!ptr || ev.pointerId !== ptr.id) {
      if (ev.pointerType === 'mouse') hoverCheck(q.x, q.y);
      return;
    }
    const now = performance.now(), dx = q.x - ptr.x;
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
    if (pr.mode === 'pending' && ev.type === 'pointerup') tap(pr);
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
  addEventListener('keyup', ev => { const k = keyName(ev); if (k === 'left' || k === 'right') keysHeld[k] = false; });
  addEventListener('blur', () => { keysHeld.left = keysHeld.right = false; });

  // 右下角：重玩、給家長
  $('#againBtn').addEventListener('click', () => {
    S.step = 0; S.done = false; save(); G.stopVoice();
    location.href = location.pathname;
  });
  const info = $('#info'), infoBtn = $('#infoBtn');
  const setInfo = on => { info.hidden = !on; infoBtn.setAttribute('aria-expanded', on ? 'true' : 'false'); };
  infoBtn.addEventListener('click', () => setInfo(info.hidden));
  $('#infoClose').addEventListener('click', () => setInfo(false));

  // ---------- 相機：機器人＋架子都要在畫面裡（手機直的也是） ----------
  let lastW = 0, lastH = 0;
  function fit() {
    const asp = v.w / v.h;
    if ((asp < .85) !== portrait) applyLayout(asp < .85);
    cam.fov = portrait ? 42 : 34;
    cam.aspect = asp;
    cam.updateProjectionMatrix();
    const elev = (portrait ? 34 : 29) * Math.PI / 180;
    const dir = new T.Vector3(0, Math.sin(elev), Math.cos(elev));
    const target = new T.Vector3(0, 2.0, 1.6);
    const topLim = portrait ? .8 : .78, botLim = portrait ? -.84 : -.86, xLim = portrait ? .965 : .9;
    const place = d => { cam.position.copy(target).addScaledVector(dir, d); cam.lookAt(target); cam.updateMatrixWorld(); };
    const range = () => {
      let x = 0, y0 = 9, y1 = -9;
      FIT_PTS.forEach(p => { const q = p.clone().project(cam); x = Math.max(x, Math.abs(q.x)); y0 = Math.min(y0, q.y); y1 = Math.max(y1, q.y); });
      return { x, y0, y1 };
    };
    for (let it = 0; it < 4; it++) {
      let lo = 3, hi = 80;
      for (let n = 0; n < 30; n++) {
        const d = (lo + hi) / 2; place(d);
        const r = range();
        if (r.x <= xLim && r.y1 <= topLim && r.y0 >= botLim) hi = d; else lo = d;
      }
      place(hi);
      const r = range();
      // 上下置中到可用區域
      const midWant = (topLim + botLim) / 2, mid = (r.y0 + r.y1) / 2;
      const up = new T.Vector3(0, 1, 0).applyQuaternion(cam.quaternion);
      const worldPerNdc = hi * Math.tan(cam.fov * Math.PI / 360);
      target.addScaledVector(up, (mid - midWant) * worldPerNdc);
    }
    lastW = v.w; lastH = v.h;
  }

  // ---------- 每一畫面 ----------
  const tmp = new T.Vector3();
  v.on((dt, t) => {
    if (v.w !== lastW || v.h !== lastH) fit();
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
      if ((wantFront > 0 || busy) && !rotating && !keyRot) { yaw = wrap(yaw); yaw = lerp(yaw, 0, 1 - Math.pow(.08, dt)); yawV = 0; }
      else if (!rotating) { yaw += yawV * dt; if (!keyRot) yawV *= Math.pow(.06, dt); }
    }
    turn.rotation.y = yaw;

    // 機器人：果凍、手臂、搬方塊
    wobble(bot, dt);
    setArms();
    if (carry) { block.position.copy(handsMid().add(carry)); }
    wobble(block.userData.j, dt);

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
    } else { halos.forEach(h => { h.visible = false; }); fring.visible = false; }

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
  if (QS.has('step')) startN = Math.max(0, Math.min(5, +QS.get('step') || 0));
  if (QS.has('end')) startN = 5;
  for (let i = 0; i < startN; i++) placeInstant(i);
  cur = startN;
  if (QS.has('end')) { setTimeout(runEnding, 300); }
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
    state: () => ({ phase, cur, placed: placed.slice() }),
    meshes: () => { let n = 0; scene.traverse(o => { if (o.isMesh || o.isSprite) n++; }); return n; },
  };
})();
