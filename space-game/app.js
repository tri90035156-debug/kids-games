// 太陽系大探險：十關，每關一種 3D 互動。不配音：用短短的注音句子、圖示、手勢提示和字母鍵帶孩子自己試。
// 文字在 content.js（由 tools/build.py 產生）、3D 小工具在 space.js、圖示在 art.js、共用引擎在 engine.js。
(() => {
  'use strict';
  const A = window.A;
  const { $, stage, foot, sayBox, sleep, shake, parent, Z, sfx, say, next, waitAction, dragPick, home, holdLoop, track, keyName, clamp } = G;
  const { T, lerp, ease, wrap } = S3;
  const FAST = /[?&]fast=1/.test(location.search);
  const cap = k => { sayBox.hidden = false; say(k); };      // 只顯示注音句子（沒有配音，不用等）
  const kc = k => '<kbd class="kc">' + k + '</kbd>';

  // ---------- 版面：上面 3D 畫面（裡面有一層 ov 放標籤、小卡、手勢提示），下面放按鈕 ----------
  function frame(below = '', cls = '') {
    stage.innerHTML = '<div class="view3d ' + cls + '" id="v3"><div class="ov" id="ov"></div></div>' + below;
    foot.innerHTML = '';
    return $('#v3');
  }
  // 讀完一張小卡（可以有好幾句），再按「繼續」
  async function card(keys, { extra = '', note = '' } = {}) {
    const c = document.createElement('div');
    c.className = 'card3';
    c.innerHTML = keys.map(k => '<p>' + Z(k) + '</p>').join('') + extra;
    $('#ov').appendChild(c);
    sayBox.hidden = true;
    sfx('pop');
    if (note) parent(note);
    await next();
  }
  // 手勢提示：一隻手示範怎麼做；孩子一動手就消失
  function hint(host, kind, x, y) {
    const d = document.createElement('div');
    d.className = 'hint h-' + kind;
    d.innerHTML = A.hand();
    d.style.left = typeof x === 'number' ? x + 'px' : x;
    d.style.top = typeof y === 'number' ? y + 'px' : y;
    host.appendChild(d);
    let gone = false;
    const off = () => {
      if (gone) return; gone = true; d.remove();
      removeEventListener('pointerdown', off, true); removeEventListener('keydown', off, true);
    };
    setTimeout(() => { if (!gone) { addEventListener('pointerdown', off, true); addEventListener('keydown', off, true); } }, 300);
    return off;
  }
  // 手勢提示放在 3D 物件上，並跟著它移動
  function hint3(v, kind, pos) {
    const off = hint($('#ov'), kind, -999, -999);
    const d = $('#ov').lastChild;
    const stopF = v.on(() => { const p = v.toScreen(pos()); d.style.left = p.x + 'px'; d.style.top = p.y + 'px'; });
    return () => { stopF(); off(); };
  }
  // 按住的鍵（字母和方向鍵都可以）
  function held() {
    const st = {};
    const kd = ev => { const k = keyName(ev); if (k) { st[k] = true; if (k === 'space' || k.length > 1) ev.preventDefault(); } };
    const ku = ev => { const k = keyName(ev); if (k) st[k] = false; };
    addEventListener('keydown', kd); addEventListener('keyup', ku);
    return { on: (...ks) => ks.some(k => st[k]), off() { removeEventListener('keydown', kd); removeEventListener('keyup', ku); } };
  }
  // 讓 r 這麼大的範圍剛好放進畫面（手機直的也看得到）
  // vy：斜著看圓盤時，上下只佔 r 的幾成（從正上方看是 1）
  function fitDist(v, r, pad = 1.12, vy = 1) {
    const t = Math.tan(v.cam.fov * Math.PI / 360);
    return r * pad * Math.max(1 / (t * v.cam.aspect), vy / t);
  }
  function aim(v, dir, r, look = [0, 0, 0], vy = 1) {
    const d = new T.Vector3(...dir).normalize().multiplyScalar(fitDist(v, r, 1.12, vy));
    v.cam.position.set(look[0] + d.x, look[1] + d.y, look[2] + d.z);
    v.cam.lookAt(...look);
  }
  // 等到 test() 成立（每一畫面檢查一次）
  const until = (v, test) => new Promise(res => { const off = v.on((dt, t) => { if (test(dt, t)) { off(); res(); } }); });
  // 暖白的半球光（天空偏藍、地面偏紫），取代硬梆梆的環境光
  const lights = (v, amb = .12) => { v.scene.add(new T.HemisphereLight(0xcfd6ff, 0x4a3860, amb * 5)); };
  // 讓一盞燈投軟影子
  const shadowy = (l, size = 8) => {
    l.castShadow = true; l.shadow.mapSize.set(1024, 1024); l.shadow.bias = -.002;
    if (l.isDirectionalLight) Object.assign(l.shadow.camera, { left: -size, right: size, top: size, bottom: -size, near: .5, far: 60 });
    return l;
  };
  // 黏土小臉貼在星球前面、永遠朝著鏡頭，跟著星球移動（星球自轉時臉不轉）
  function faceOn(v, mesh, kind, r) {
    const f = WORLD.face(kind, r); S3.shade(f); v.scene.add(f);
    const wp = new T.Vector3();
    v.on(() => { mesh.getWorldPosition(wp); f.position.copy(wp); f.lookAt(v.cam.position); });
    return f;
  }
  const SUNLIGHT = 0xfff4e6;

  // ========== 第一關：飛向一顆星星（太陽是一顆星星） ==========
  async function ch1() {
    const el = frame('<div class="ctl"><button class="holdbtn" id="hb">' + kc('F') + Z('c1.hold') + '</button></div>' +
      '<div class="meter gold"><i id="mt"></i></div>');
    const v = S3.view(el, { fov: 50, pos: [0, 0, 0], look: [0, 0, -1] });
    v.scene.add(v.cam);
    S3.stars(v.cam, 2200, 900);                      // 背景星空跟著太空船
    const dust = (() => {                            // 飛過去的小星星，看得出在前進
      const n = 260, r = S3.rng(3), p = new Float32Array(n * 3);
      for (let i = 0; i < n; i++) p.set([(r() - .5) * 120, (r() - .5) * 80, -r() * 260], i * 3);
      const g = new T.BufferGeometry(); g.setAttribute('position', new T.BufferAttribute(p, 3));
      return new T.Points(g, new T.PointsMaterial({ size: 2, sizeAttenuation: false, color: 0xe8e0ff }));
    })();
    v.scene.add(dust);
    const sun = S3.sun(10); sun.position.set(0, 0, -1500); v.scene.add(sun);
    faceOn(v, sun.children[0], 'sun', 10);
    const mt = $('#mt'), hb = $('#hb');
    cap('c1.goal');
    const off = hint($('.ctl'), 'press', '50%', '40%');
    let p = 0, mid = false, wh = 0;
    v.on((dt, t) => {
      const z = -1455 * (1 - Math.pow(1 - p, 3));      // 越飛越近，太陽越長越快
      v.cam.position.set(Math.sin(t * .7) * .4 * (1 - p), Math.cos(t * .5) * .25 * (1 - p), z);
      v.cam.lookAt(0, 0, z - 10);
      sun.children[0].rotation.y += dt * .05;
      const dp = dust.geometry.attributes.position;           // 飛過身邊的星星，繞到前面再用一次
      for (let i = 0; i < dp.count; i++) { const dz = dp.getZ(i) - z; if (dz > 2) dp.setZ(i, dp.getZ(i) - 262); else if (dz < -262) dp.setZ(i, dp.getZ(i) + 262); }
      dp.needsUpdate = true;
    });
    await holdLoop(hb, ['f', 'space', 'up'], (dt, down) => {
      if (down) {
        off();
        p = Math.min(1, p + dt * (FAST ? 2 : .16));
        wh -= dt; if (wh <= 0) { sfx('whoosh'); wh = .9; }
      }
      mt.style.width = (p * 100) + '%';
      if (!mid && p > .55) { mid = true; cap('c1.mid'); }
      return p >= 1;
    });
    $('.ctl').remove(); $('.meter').remove();
    sfx('win');
    await card(['c1.f1', 'c1.f2', 'c1.f3'], {
      note: '太陽是一顆恆星，也是離地球最近的恆星；陽光大約 8 分 20 秒到地球。夜空裡的星星大多也是恆星，最近的一顆（比鄰星）光要走 4 年多。少數特別亮、不太閃的「星星」其實是行星，例如金星、木星。看太陽要用專用的濾鏡，一般墨鏡不行。',
    });
  }

  // ========== 第二關：地球繞太陽（一年） ==========
  async function ch2() {
    const el = frame('<div class="ctl"><div class="laps" id="laps"></div><button class="pill2" id="kd">' + kc('D') + '▶</button></div>');
    const v = S3.view(el, { fov: 40 });
    S3.stars(v.scene); lights(v, .1);
    v.scene.add(S3.sun(1.3));
    v.scene.add(shadowy(new T.PointLight(SUNLIGHT, 2.6, 0, 0)));
    v.scene.add(S3.orbit(5));
    const earth = S3.planet('earth', .62); v.scene.add(earth);
    faceOn(v, earth, 'earth', .62);
    const keys = held();
    let prog = 0, laps = 0, last = null;
    v.on(dt => {
      aim(v, [0, 1, .5], 5.6, [0, 0, 0], .92);
      if (keys.on('d', 'right') || kd.classList.contains('down')) prog += dt * (FAST ? 12 : 2.2);
      if (keys.on('a', 'left')) prog -= dt * 2.2;
      earth.position.copy(S3.onOrbit(prog, 5));
      earth.rotation.y += dt * 3;
    });
    const kd = $('#kd');
    kd.addEventListener('pointerdown', () => kd.classList.add('down'));
    ['pointerup', 'pointerleave', 'pointercancel'].forEach(e => kd.addEventListener(e, () => kd.classList.remove('down')));
    // 手指在太陽旁邊畫圓：手指繞太陽轉幾度，地球就跟著走幾度
    const ang = p => { const c = v.toScreen(new T.Vector3()); return Math.atan2(-(p.y - c.y), p.x - c.x); };
    const untrack = track(el, {
      down(p) { last = ang(p); },
      move(p) { if (last === null) return; const a = ang(p), d = wrap(a - last); last = a; if (Math.abs(d) < .8) prog += d; },
      up() { last = null; },
    });
    cap('c2.goal');
    const offH = hint3(v, 'circle', () => new T.Vector3());
    const lapsEl = $('#laps');
    await until(v, () => {
      const n = Math.floor(Math.abs(prog) / (Math.PI * 2));
      if (n > laps) {
        laps = n;
        lapsEl.insertAdjacentHTML('beforeend', '<span class="cake">' + A.cake() + '</span>');
        sfx('win'); cap(laps < 2 ? 'c2.more' : 'c2.lap');
      }
      return laps >= 2;
    });
    untrack(); keys.off(); offH();
    v.on(dt => { prog += dt * .7; });
    await sleep(FAST ? 50 : 900);
    $('#kd').remove();
    await card(['c2.f1', 'c2.f2'], {
      note: '地球繞太陽一圈（公轉）約 365.25 天，所以每四年多一天（閏年）。四季不是因為離太陽遠近，而是因為地軸傾斜約 23.5 度——北半球的冬天，地球其實離太陽比較近一點。所有行星都朝同一個方向繞太陽。',
    });
  }

  // ========== 第三關：白天和晚上（自轉） ==========
  async function ch3() {
    const el = frame('<div class="ctl"><button class="pill2" id="ka">◀' + kc('A') + '</button><div class="state" id="st"></div>' +
      '<button class="pill2" id="kd">' + kc('D') + '▶</button></div>');
    const v = S3.view(el, { fov: 40 });
    S3.stars(v.scene); lights(v, .06);
    const sunDir = new T.Vector3(-1, 0, .3).normalize();
    const dl = shadowy(new T.DirectionalLight(SUNLIGHT, 3), 4); dl.position.copy(sunDir).multiplyScalar(10); v.scene.add(dl);
    const glow = S3.glow(0xffc46b, 9, .9); glow.position.copy(sunDir).multiplyScalar(14); v.scene.add(glow);
    const earth = S3.planet('earth', 2, 64); v.scene.add(earth);
    faceOn(v, earth, 'earth', 2);
    // 小房子：紅屋頂，站在地球表面、朝外
    const hp = S3.uvToPos(S3.HOME.u, S3.HOME.v, 2);
    const house = new T.Group();
    const body = new T.Mesh(new T.BoxGeometry(.2, .2, .2), new T.MeshLambertMaterial({ color: 0xffffff, emissive: 0x333333 }));
    const roof = new T.Mesh(new T.ConeGeometry(.19, .17, 4), new T.MeshLambertMaterial({ color: 0xdb2e27, emissive: 0x551010 }));
    body.position.y = .1; roof.position.y = .28; roof.rotation.y = Math.PI / 4;
    house.add(body, roof);
    house.position.copy(hp);
    house.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), hp.clone().normalize());
    earth.add(house);
    let rot = Math.atan2(-hp.x, hp.z);              // 一開始小房子正對著我們（不是白天也不是晚上）
    let auto = 0;
    const keys = held();
    const btn = id => { const b = $(id); b.addEventListener('pointerdown', () => b.classList.add('down')); ['pointerup', 'pointerleave', 'pointercancel'].forEach(e => b.addEventListener(e, () => b.classList.remove('down'))); return b; };
    const ka = btn('#ka'), kd = btn('#kd');
    const wp = new T.Vector3();
    let light = 0;
    v.on(dt => {
      aim(v, [0, .12, 1], 2.6);
      if (keys.on('a', 'left') || ka.classList.contains('down')) rot -= dt * 1.6;
      if (keys.on('d', 'right') || kd.classList.contains('down')) rot += dt * 1.6;
      rot += auto * dt;
      earth.rotation.y = rot;
      house.getWorldPosition(wp);
      light = wp.normalize().dot(sunDir);
    });
    let lx = null;
    const untrack = track(el, { down(p) { lx = p.x; }, move(p) { if (lx === null) return; rot += (p.x - lx) * .012; lx = p.x; }, up() { lx = null; } });
    const st = $('#st');
    v.on(() => {                                     // 小房子現在是白天還是晚上
      const s = light > .4 ? 'day' : light < -.4 ? 'night' : 'none';
      if (st.dataset.s === s) return;
      st.dataset.s = s; st.className = 'state ' + s;
      st.innerHTML = '<span class="si">' + (s === 'day' ? A.sunIcon() : s === 'night' ? A.moonIcon() : A.house()) + '</span>' + (s !== 'none' ? Z('c3.' + s) : '');
    });
    cap('c3.goal1');
    hint($('#ov'), 'swipeH', '50%', '55%');
    const dwell = (want) => { let k = 0; return until(v, dt => { k = (want() ? k + dt : 0); return k > .35; }); };
    await dwell(() => light > .55);
    sfx('ok'); cap('c3.dayok');
    await sleep(FAST ? 50 : 1600);
    cap('c3.goal2');
    await dwell(() => light < -.55);
    sfx('ok'); cap('c3.nightok');
    await sleep(FAST ? 50 : 1600);
    untrack(); keys.off();
    $('#ka').remove(); $('#kd').remove();
    auto = .9;                                       // 讓地球自己轉，看白天晚上輪流
    await card(['c3.f1', 'c3.f2'], {
      note: '地球自轉一圈（以太陽為準）是 24 小時。台灣晚上 8 點時，美國紐約是早上 7 點。太陽「東升西落」，是因為地球由西向東自轉。小房子的位置大約在北回歸線（台灣附近）。',
    });
  }

  // ========== 第四關：月亮變變變（月相） ==========
  async function ch4() {
    const el = frame('<div class="ctl"><button class="pill2" id="ka">◀' + kc('A') + '</button><div class="want" id="want"></div>' +
      '<button class="pill2" id="kd">' + kc('D') + '▶</button></div>');
    const v = S3.view(el, { fov: 40 });
    v.cam.layers.enable(1);
    S3.stars(v.scene); lights(v, .035);
    const dl = shadowy(new T.DirectionalLight(SUNLIGHT, 3.2), 5); dl.position.set(-10, 0, 0); v.scene.add(dl);
    const glow = S3.glow(0xffc46b, 8, .95); glow.position.set(-9.5, 0, 0); glow.layers.set(1); v.scene.add(glow);
    for (const z of [-2.4, 0, 2.4]) {               // 陽光從左邊照過來
      const ln = new T.Line(new T.BufferGeometry().setFromPoints([new T.Vector3(-7.5, 0, z), new T.Vector3(-4.6, 0, z)]),
        new T.LineBasicMaterial({ color: 0xbd9558, transparent: true, opacity: .55 }));
      ln.layers.set(1); v.scene.add(ln);
    }
    const earth = S3.planet('earth', .75); v.scene.add(earth);
    faceOn(v, earth, 'earth', .75);
    const ob = S3.orbit(3.2, 0xbd9558, .5); ob.layers.set(1); v.scene.add(ob);
    const moon = S3.planet('moon', .3); v.scene.add(moon);
    // 從地球看月亮的小視窗（右上角）
    const icam = new T.PerspectiveCamera(16, 1, .05, 2000);
    const ov = $('#ov');
    ov.insertAdjacentHTML('beforeend', '<div class="inset" id="ins"><span class="il">' + Z('c4.see') + '</span></div>' +
      '<div class="suntag">' + A.sunIcon() + '<span class="cl">' + Z('c4.sun') + '</span></div>');
    const ins = $('#ins');
    let side = 0;
    v.insets.push({
      cam: icam,
      rect(w, h) {
        const s = Math.round(Math.min(w, h) * .32);
        if (s !== side) { side = s; ins.style.width = ins.style.height = (s + 8) + 'px'; }
        return [w - s - 20, Math.round((h - s) / 2), s, s];
      },
    });
    const keys = held();
    const btn = id => { const b = $(id); b.addEventListener('pointerdown', () => b.classList.add('down')); ['pointerup', 'pointerleave', 'pointercancel'].forEach(e => b.addEventListener(e, () => b.classList.remove('down'))); return b; };
    const ka = btn('#ka'), kd = btn('#kd');
    let a = 2.4, aim2 = null;
    v.on(dt => {
      aim(v, [0, 1, .18], 4.2, [-.6, 0, 0]);
      if (keys.on('d', 'right') || kd.classList.contains('down')) { a += dt * 1.4; aim2 = null; }
      if (keys.on('a', 'left') || ka.classList.contains('down')) { a -= dt * 1.4; aim2 = null; }
      if (aim2 !== null) a += wrap(aim2 - a) * Math.min(1, dt * 10);
      moon.position.copy(S3.onOrbit(a, 3.2));
      earth.rotation.y += dt * .5;
      icam.position.set(0, 0, 0); icam.lookAt(moon.position);
    });
    const ang = p => { const c = v.toScreen(new T.Vector3()); return Math.atan2(-(p.y - c.y), p.x - c.x); };
    const untrack = track(el, { down(p) { aim2 = ang(p); }, move(p) { aim2 = ang(p); }, up() { } });
    cap('c4.goal');
    const offH = hint3(v, 'circle', () => new T.Vector3());
    const want = $('#want');
    const tasks = [['full', [0]], ['half', [Math.PI / 2, -Math.PI / 2]], ['new', [Math.PI]]];
    for (const [shape, targets] of tasks) {
      want.className = 'want';
      want.innerHTML = '<span class="ph">' + A.phase(shape) + '</span>';
      sfx('tap');
      let k = 0;
      await until(v, dt => {
        const ok = targets.some(t => Math.abs(wrap(a - t)) < .36);
        k = ok ? k + dt : 0;
        return k > .3;
      });
      want.classList.add('ok'); sfx('ok'); cap('c4.ok');
      await sleep(FAST ? 50 : 1300);
      cap('c4.goal');
    }
    untrack(); keys.off(); offH();
    $('#ka').remove(); $('#kd').remove(); want.remove();
    v.on(dt => { a += dt * .5; });
    await card(['c4.f1', 'c4.f2'], {
      note: '月亮繞地球一圈約 27 天，月相從新月到下一次新月約 29.5 天。新月時月亮在太陽和地球之間，和太陽一起升落，所以看不到。月相不是地球的影子造成的（那叫月食）；月亮的軌道有點傾斜，所以不會每次滿月都月食。畫面上的「半個月亮」是上弦月（右半邊亮），黃昏時在南方天空。',
    });
  }

  // ========== 第六關：木星有多大（排地球） ==========
  async function ch6() {
    const el = frame('<div class="ctl"><button class="holdbtn" id="put">' + kc('E') + Z('c6.put') + '</button></div>');
    const v = S3.view(el, { fov: 40, pos: [0, 0, 12] });
    S3.stars(v.scene); lights(v, .28);
    const dl = shadowy(new T.DirectionalLight(SUNLIGHT, 2.4), 6); dl.position.set(-20, 4, 12); v.scene.add(dl);
    const RJ = 3, RE = RJ / 11.2;                     // 木星直徑大約是地球的 11.2 倍
    const jup = S3.planet('jupiter', RJ, 64); v.scene.add(jup);
    faceOn(v, jup, 'jupiter', RJ);
    const ov = $('#ov');
    ov.insertAdjacentHTML('beforeend', '<div class="count" id="cnt">0</div>');
    const cnt = $('#cnt');
    let zoom = 0;
    const camFar = new T.Vector3(-18, 2, 100), lookFar = new T.Vector3(-22, 0, 0);
    v.on(dt => {
      jup.rotation.y += dt * .15;
      const near = new T.Vector3(0, 0, fitDist(v, 3.6));
      const e = ease(zoom);
      v.cam.position.lerpVectors(near, camFar, e);
      v.cam.lookAt(new T.Vector3().lerpVectors(new T.Vector3(), lookFar, e));
    });
    cap('c6.goal');
    const off = hint($('.ctl'), 'tap', '50%', '40%');
    let n = 0;
    while (n < 11) {
      await waitAction([{ el: $('#put'), keys: ['e', 'space', 'enter'] }]);
      off();
      // 地球放在木星前面，離鏡頭近一點；按比例縮小，看起來才剛好跟木星的寬度對齊
      const zE = RJ + .4, k = (v.cam.position.z - zE) / v.cam.position.z;
      const e = S3.planet('earth', RE, 24);
      e.scale.setScalar(k);
      const x = (-RJ + RE * (2 * n + 1)) * k;
      e.position.set(x, -6, zE);
      v.scene.add(e);
      let t = 0;
      v.on(dt => { if (t < 1) { t = Math.min(1, t + dt * 3); e.position.y = lerp(-6, 0, ease(t)); } e.rotation.y += dt; });
      n++; cnt.textContent = n;
      sfx(n < 11 ? 'pop' : 'win');
      await sleep(FAST ? 20 : 120);
    }
    $('.ctl').remove();
    await card(['c6.f1']);
    cap('c6.zoom');
    $('#ov .card3').remove();
    cnt.remove();
    const sun = S3.sun(RJ * 109 / 11.2);              // 太陽直徑大約是地球的 109 倍
    sun.position.set(-29.2 - RJ - 7, 0, 0);
    sun.children[1].visible = sun.children[2].visible = false;
    v.scene.add(sun);
    faceOn(v, sun.children[0], 'sun', RJ * 109 / 11.2);
    let t = 0;
    await until(v, dt => { t += dt / (FAST ? .05 : 3.5); zoom = Math.min(1, t); return t >= 1; });
    sfx('ok');
    await card(['c6.f2'], {
      note: '木星直徑約是地球的 11 倍，太陽約是地球的 109 倍。如果比體積，太陽裡面大約可以裝下 130 萬個地球。畫面最後的太陽、木星、地球大小比例是正確的，但距離縮短了很多。',
    });
  }

  // ========== 拜訪星球：認識它，再試試看能不能降落 ==========
  const ROCKY = { mercury: 1, venus: 1, earth: 1, mars: 1 };
  async function visit(k) {
    const el = frame('<div class="ctl" hidden><div class="chip drag" id="ship">' + kc('L') + G.ring(A.ship(), 'sm') + '<span class="cl">' + Z('c7.ship') + '</span></div></div>');
    const v = S3.view(el, { fov: 36 });
    S3.stars(v.scene); lights(v, .45);
    const dl = new T.DirectionalLight(0xffe2b8, 2.6); dl.position.set(-6, 5, 7); dl.castShadow = true;
    dl.shadow.mapSize.set(1024, 1024); Object.assign(dl.shadow.camera, { left: -4, right: 4, top: 4, bottom: -4, near: 1, far: 30 }); v.scene.add(dl);
    const R = 2.2, rock = !!ROCKY[k];
    const pl = S3.planet(k, R, 64); v.scene.add(pl);
    if (k === 'saturn') { const t = new T.Group(); t.rotation.z = .42; t.add(S3.ring(R * 1.3, R * 2.25)); v.scene.add(t); }
    if (k === 'uranus') pl.rotation.z = 1.7;
    const camDir = new T.Vector3(0, .32, 1).normalize();
    const f = WORLD.face(k, R); f.lookAt(camDir); if (k === 'uranus') f.rotateZ(Math.PI / 2); S3.shade(f); v.scene.add(f);
    let cloud = null;
    if (!rock) {                                      // 氣體行星：外面一層厚厚的雲
      cloud = new T.Mesh(new T.SphereGeometry(R * 1.12, 48, 32), S3.clay({ color: 0xfff6e6, transparent: true, opacity: .35, depthWrite: false, bumpMap: null }));
      cloud.visible = false; v.scene.add(cloud);
    }
    const lander = WORLD.rocket();
    lander.body.rotation.z = 0; lander.g.scale.setScalar(.55); lander.g.visible = false; v.scene.add(lander.g);
    const puffs = [];
    v.on((dt, t) => {
      aim(v, camDir.toArray(), k === 'saturn' ? 5 : 3.1, [0, .3, 0]);
      pl.rotation.y += dt * .2;
      if (cloud) cloud.rotation.y += dt * .3;
      lander.flame.scale.setScalar(lander.g.visible ? .5 + Math.sin(t * 40) * .1 : 0);
      puffs.forEach(s => { s.userData.t += dt; const q = s.userData.t; s.position.x += s.userData.dx * dt; s.position.y += dt * .3; s.scale.setScalar(.3 + q * 1.1); s.material.opacity = Math.max(0, .75 - q * .6); });
    });
    sayBox.hidden = true;
    $('#ov').insertAdjacentHTML('beforeend', '<div class="ptag" id="ptag"><div class="pn">' + Z('n.' + k) + '</div><div class="pf">' + Z('p.' + k) + '</div></div>');
    sfx('pop');
    await next();
    $('#ptag').remove();
    $('.ctl').hidden = false;
    cap('v.land');
    const ship = $('#ship');
    const off = hint($('.ctl'), 'dragUp', '50%', '30%');
    const dz = document.createElement('div'); dz.className = 'dropz zone'; $('#ov').appendChild(dz);
    await dragPick([ship], [dz], { itemKeys: [['l', 'space']] });
    off(); dz.remove(); ship.classList.add('gone');
    sfx('whoosh'); sayBox.hidden = true;
    const top = R + .02;
    lander.g.visible = true; lander.g.position.set(0, R + 3, 0);
    if (cloud) cloud.visible = true;
    const mats = []; lander.g.traverse(o => { if (o.material) { o.material = o.material.clone(); o.material.transparent = true; mats.push(o.material); } });
    await until(v, dt => {
      const sp = FAST ? 40 : 1.4;
      if (rock) { lander.g.position.y = Math.max(top + .45, lander.g.position.y - dt * sp); return lander.g.position.y <= top + .45; }
      lander.g.position.y -= dt * sp * .8;
      const q = clamp((top + .6 - lander.g.position.y) / 1.2, 0, 1);
      mats.forEach(m => { m.opacity = 1 - q; });
      return q >= 1;
    });
    lander.flame.visible = false;
    if (rock) {
      S3.jelly(lander.g); S3.jelly(pl); S3.poke(lander.g, 3.2); S3.poke(pl, .8);      // 落地：壓扁再彈回來
      v.on(dt => { S3.wobble(lander.g, dt); S3.wobble(pl, dt); });
      sfx('thud');
      for (let i = 0; i < 9; i++) {
        const s = S3.glow(0xd9b48a, .6, .75); s.material.blending = T.NormalBlending;
        s.position.set((Math.random() - .5) * .5, top + .1, (Math.random() - .5) * .3); s.userData = { t: 0, dx: (Math.random() - .5) * 1.2 };
        v.scene.add(s); puffs.push(s);
      }
      cap('c7.land');
    } else { sfx('no'); cap('c7.sink'); }
    await sleep(FAST ? 50 : 1600);
    $('.ctl').remove();
    await card([rock ? 'v.rock' : 'v.gas'], {
      note: rock ? '水星、金星、地球、火星是「岩石行星」，有固體的地面。金星的大氣很厚又很熱，真的探測器在那裡只撐了大約兩小時。'
        : '木星、土星是「氣體巨行星」（主要是氫和氦）；天王星、海王星常叫「冰巨行星」（含比較多的水、氨、甲烷）。它們都沒有可以降落的固體地面，越往裡面壓力越大，太空船會被壓壞。',
    });
  }

  // ========== 第八關：土星的環（飛近看、從側面看） ==========
  async function ch8() {
    const el = frame('<div class="ctl"><button class="pill2" id="kw">' + kc('W') + '▲</button><button class="pill2" id="kd" hidden>' + kc('D') + '▶</button></div>');
    const v = S3.view(el, { fov: 45 });
    S3.stars(v.scene); lights(v, .3);
    const dl = shadowy(new T.DirectionalLight(SUNLIGHT, 2.4), 4); dl.position.set(8, 5, 6); v.scene.add(dl);
    const sat = S3.planet('saturn', 1, 64); v.scene.add(sat);
    const satFace = faceOn(v, sat, 'saturn', 1);
    const band = S3.ring(1.24, 2.27, .95); v.scene.add(band);
    const bandMats = band.userData.mats();
    // 環裡面的一塊塊冰和石頭
    const N = 6000, rr = S3.rng(5);
    const chunks = new T.InstancedMesh(new T.IcosahedronGeometry(1, 0), new T.MeshLambertMaterial({ color: 0xffffff, transparent: true }), N);
    const mtx = new T.Matrix4(), q = new T.Quaternion(), e = new T.Euler(), col = new T.Color();
    for (let i = 0; i < N; i++) {
      let r;
      do { r = 1.24 + rr() * 1.03; } while (r > 1.95 && r < 2.03);
      const a = rr() * Math.PI * 2, s = .003 + Math.pow(rr(), 6) * .032;
      e.set(rr() * 6, rr() * 6, rr() * 6); q.setFromEuler(e);
      mtx.compose(new T.Vector3(Math.cos(a) * r, (rr() - .5) * .008, Math.sin(a) * r), q, new T.Vector3(s, s * (.6 + rr() * .6), s));
      chunks.setMatrixAt(i, mtx);
      const g = .75 + rr() * .25; col.setRGB(g, g * .96, g * (rr() < .3 ? .82 : .92));
      chunks.setColorAt(i, col);
    }
    const ringGrp = new T.Group(); ringGrp.add(chunks); v.scene.add(ringGrp);
    let p = 0, el2 = 0;                       // p：飛近的程度；el2：往側面看的程度
    const farPos = () => { const d = fitDist(v, 2.6, 1.12, .6); const h = lerp(.42, .015, ease(el2)); return new T.Vector3(0, Math.sin(h) * d, Math.cos(h) * d); };
    const nearPos = new T.Vector3(1.86, .08, .62), nearLook = new T.Vector3(1.4, -.02, -1.1);
    const keys = held();
    const kw = $('#kw'), kd = $('#kd');
    [kw, kd].forEach(b => { b.addEventListener('pointerdown', () => b.classList.add('down')); ['pointerup', 'pointerleave', 'pointercancel'].forEach(x => b.addEventListener(x, () => b.classList.remove('down'))); });
    let phase = 1;
    v.on(dt => {
      ringGrp.rotation.y -= dt * .04; band.rotation.y += dt * .04; sat.rotation.y += dt * .3;
      if (phase === 1 && (keys.on('w', 'up') || kw.classList.contains('down'))) p = Math.min(1, p + dt * (FAST ? 4 : .45));
      if (phase === 1 && keys.on('s', 'down')) p = Math.max(0, p - dt * .45);
      if (phase === 2 && (keys.on('d', 'right', 'a', 'left') || kd.classList.contains('down'))) el2 = Math.min(1, el2 + dt * (FAST ? 4 : .5));
      const k = ease(p);
      v.cam.position.lerpVectors(farPos(), nearPos, k);
      v.cam.lookAt(new T.Vector3().lerpVectors(new T.Vector3(), nearLook, k));
      bandMats.forEach(mm => { mm.opacity = .95 * (1 - clamp((p - .45) / .4, 0, 1)); });
      const ck = clamp((p - .15) / .3, 0, 1);            // 遠遠看是一片環，飛近了才看得到一塊一塊
      chunks.visible = ck > 0; chunks.material.opacity = ck;
    });
    let ly = null, lx = null;
    const untrack = track(el, {
      down(pt) { ly = pt.y; lx = pt.x; },
      move(pt) {
        if (ly === null) return;
        if (phase === 1) p = clamp(p + (ly - pt.y) * .004, 0, 1);
        if (phase === 2) el2 = clamp(el2 + Math.abs(pt.x - lx) * .004, 0, 1);
        ly = pt.y; lx = pt.x;
      },
      up() { ly = null; },
    });
    const ov = $('#ov');
    cap('c8.goal1');
    const off1 = hint(ov, 'swipeUp', '50%', '60%');
    await until(v, () => p >= .97);
    off1();
    sfx('ok'); cap('c8.near');
    await sleep(FAST ? 50 : 2200);
    await card(['c8.f1']);
    $('#ov .card3').remove();
    phase = 0;
    let t = 0;
    await until(v, dt => { t += dt / (FAST ? .05 : 1.6); p = 1 - ease(Math.min(1, t)); return t >= 1; });
    p = 0; phase = 2;
    kw.hidden = true; kd.hidden = false;
    cap('c8.goal2');
    hint(ov, 'swipeH', '50%', '55%');
    await until(v, () => el2 >= .98);
    untrack(); keys.off();
    $('.ctl').remove();
    sfx('ok');
    await card(['c8.f2'], {
      note: '土星環主要是水冰，夾著一些岩石和灰塵；小的像沙粒，大的有房子那麼大。環很寬（從土星表面往外延伸好幾萬公里），但大部分地方只有大約 10 公尺到 1 公里厚。每十幾年，地球會剛好從側面看到土星環，那時環幾乎看不見（上一次是 2025 年）。木星、天王星、海王星也有環，只是很暗。',
    });
  }

  // ========== 第九關：剛剛好的地球（適居帶） ==========
  async function ch9() {
    const el = frame('<div class="ctl"><button class="pill2" id="ka">◀' + kc('A') + '</button><div class="state" id="st"></div>' +
      '<button class="pill2" id="kd">' + kc('D') + '▶</button></div>');
    const v = S3.view(el, { fov: 40 });
    S3.stars(v.scene); lights(v, .1);
    const sun = S3.sun(3); sun.position.set(-9, 0, 0); v.scene.add(sun);
    const pl = shadowy(new T.PointLight(SUNLIGHT, 3, 0, 0)); pl.position.set(-9, 0, 0); v.scene.add(pl);
    const XMIN = -4.4, XMAX = 7.8;
    const rail = new T.Line(new T.BufferGeometry().setFromPoints([new T.Vector3(XMIN, -.8, 0), new T.Vector3(XMAX, -.8, 0)]),
      new T.LineDashedMaterial({ color: 0xbd9558, dashSize: .2, gapSize: .15 }));
    rail.computeLineDistances(); v.scene.add(rail);
    const earth = S3.planet('earth', .78, 48); v.scene.add(earth);
    faceOn(v, earth, 'earth', .78);
    const over = k => { const m = S3.planet(k, .788, 48); m.material.transparent = true; m.material.opacity = 0; earth.add(m); return m; };
    const hot = over('earthHot'), ice = over('earthIce');
    const steam = Array.from({ length: 10 }, (_, i) => { const s = S3.glow(0xffffff, .5, 0); s.material.blending = T.NormalBlending; s.userData.t = i / 10; v.scene.add(s); return s; });
    const zone = new T.Mesh(new T.PlaneGeometry(2.8, 2.6), new T.MeshBasicMaterial({ color: 0x3f6b2e, transparent: true, opacity: 0, depthWrite: false }));
    zone.position.set(1.2, 0, -1); v.scene.add(zone);
    let x = 1.4, drag = false, heat = 0, cold = 0;
    const keys = held();
    const btn = id => { const b = $(id); b.addEventListener('pointerdown', () => b.classList.add('down')); ['pointerup', 'pointerleave', 'pointercancel'].forEach(e => b.addEventListener(e, () => b.classList.remove('down'))); return b; };
    const ka = btn('#ka'), kd = btn('#kd');
    v.on((dt) => {
      const d = new T.Vector3(0, .1, 1).normalize().multiplyScalar(fitDist(v, 8.6, 1.05, .45));
      v.cam.position.set(.6 + d.x, d.y, d.z); v.cam.lookAt(.6, 0, 0);
      if (keys.on('a', 'left') || ka.classList.contains('down')) x -= dt * (FAST ? 30 : 4);
      if (keys.on('d', 'right') || kd.classList.contains('down')) x += dt * (FAST ? 30 : 4);
      x = clamp(x, XMIN, XMAX);
      earth.position.x = lerp(earth.position.x, x, Math.min(1, dt * 12));
      earth.rotation.y += dt * .6;
      const ex = earth.position.x;
      heat = clamp((-.6 - ex) / 2.6, 0, 1); cold = clamp((ex - 3.6) / 3.4, 0, 1);
      hot.material.opacity = heat; ice.material.opacity = cold;
      steam.forEach(s => {
        s.userData.t = (s.userData.t + dt * .5) % 1;
        const k = s.userData.t;
        s.position.set(ex + Math.sin(k * 9 + s.id) * .5, .4 + k * 1.6, .3);
        s.material.opacity = heat > .3 ? (1 - k) * .6 * heat : 0;
        s.scale.setScalar(.4 + k * .8);
      });
    });
    // 手指拖：地球跟著手指的左右位置
    const toX = px => { const a = v.toScreen(new T.Vector3(XMIN, 0, 0)), b = v.toScreen(new T.Vector3(XMAX, 0, 0)); return lerp(XMIN, XMAX, (px - a.x) / (b.x - a.x)); };
    const untrack = track(el, { down(p) { drag = true; x = toX(p.x); }, move(p) { if (drag) x = toX(p.x); }, up() { drag = false; } });
    const st = $('#st');
    const good = () => earth.position.x > -.2 && earth.position.x < 2.6;
    v.on(() => {
      const s = heat > .35 ? 'hot' : cold > .35 ? 'cold' : good() ? 'good' : '';
      if (st.dataset.s === s) return;
      st.dataset.s = s; st.className = 'state ' + s;
      st.innerHTML = s ? Z('c9.' + s) : '';
    });
    cap('c9.goal1');
    const offH = hint3(v, 'swipeL', () => earth.position);
    await until(v, () => heat > .95);
    offH();
    sfx('steam'); cap('c9.hotok');
    await sleep(FAST ? 50 : 1800);
    cap('c9.goal2');
    await until(v, () => cold > .95);
    sfx('crack'); cap('c9.coldok');
    await sleep(FAST ? 50 : 1800);
    cap('c9.goal3');
    let k = 0;
    await until(v, dt => { k = good() && !drag && !keys.on('a', 'd', 'left', 'right') ? k + dt : 0; return k > .5; });
    untrack(); keys.off();
    $('#ka').remove(); $('#kd').remove();
    sfx('win');
    v.on(dt => { zone.material.opacity = Math.min(.35, zone.material.opacity + dt * .4); });
    await card(['c9.f1', 'c9.f2'], {
      note: '天文學家把「行星表面可以有液態水」的距離範圍叫做「適居帶」。除了距離，大氣也很重要：金星的大氣太厚、溫室效應讓它比水星還熱；火星的大氣太稀薄，表面的水大多結成冰。這一關的大小、距離都是示意。',
    });
  }

  // ========== 第十關：發射去火星（算好時間） ==========
  async function ch10() {
    const el = frame('<div class="ctl"><button class="holdbtn" id="fire">' + kc('G') + Z('c10.fire') + '</button></div>');
    const v = S3.view(el, { fov: 40 });
    S3.stars(v.scene); lights(v, .15);
    v.scene.add(S3.sun(.9));
    v.scene.add(shadowy(new T.PointLight(SUNLIGHT, 2.6, 0, 0)));
    const RE = 4, RM = 6.1;
    v.scene.add(S3.orbit(RE), S3.orbit(RM));
    const earth = S3.planet('earth', .44), mars = S3.planet('mars', .36);
    v.scene.add(earth, mars);
    faceOn(v, earth, 'earth', .44); faceOn(v, mars, 'mars', .36);
    const WE = Math.PI * 2 / 7, WM = WE / 1.88;       // 火星繞一圈的時間大約是地球的 1.88 倍
    const TT = .709 * 7;                              // 飛到火星的時間（大約地球的 0.7 年）
    const LEAD = Math.PI - WM * TT;                   // 發射時，火星要在地球前面這麼多
    const TOL = .3;
    const box = new T.Group();
    box.add(new T.Mesh(new T.RingGeometry(RM - .45, RM + .45, 24, 1, -TOL, TOL * 2).rotateX(-Math.PI / 2),
      new T.MeshBasicMaterial({ color: 0xbd9558, transparent: true, opacity: .42, side: T.DoubleSide, depthWrite: false })));
    v.scene.add(box);
    const rocket = new T.Group();
    const rbody = new T.Mesh(new T.ConeGeometry(.12, .4, 12), new T.MeshLambertMaterial({ color: 0xffffff, emissive: 0x444444 }));
    rbody.rotation.z = -Math.PI / 2; rocket.add(rbody);
    const flame = S3.glow(0xffa040, .5, .9); flame.position.x = -.25; rocket.add(flame);
    rocket.visible = false; v.scene.add(rocket);
    const MAXP = 300, tp = new Float32Array(MAXP * 3);
    const trailG = new T.BufferGeometry(); trailG.setAttribute('position', new T.BufferAttribute(tp, 3)); trailG.setDrawRange(0, 0);
    v.scene.add(new T.Line(trailG, new T.LineBasicMaterial({ color: 0xffd38a, transparent: true, opacity: .8 })));
    let aE = 0, aM = LEAD + 1.6, fly = null, zoomK = 0;
    const fire = $('#fire');
    const a = (RE + RM) / 2, ecc = (RM - RE) / (RM + RE);
    v.on(dt => {
      const d = new T.Vector3(0, 1, .42).normalize().multiplyScalar(fitDist(v, 6.7));
      const mz = mars.position.clone().add(new T.Vector3(0, 1.6, 1.4));
      v.cam.position.lerpVectors(d, mz, ease(zoomK)); v.cam.lookAt(new T.Vector3().lerpVectors(new T.Vector3(), mars.position, ease(zoomK)));
      const sp = fly && fly.done ? .3 : 1;
      aE += WE * dt * sp; aM += WM * dt * sp;
      if (fly && !fly.done && fly.fix) aM -= fly.dev * dt / TT;      // 差一點點也算接到：悄悄把火星推到會合點
      earth.position.copy(S3.onOrbit(aE, RE)); mars.position.copy(S3.onOrbit(aM, RM));
      earth.rotation.y += dt; mars.rotation.y += dt;
      box.rotation.y = aE + LEAD;
      const inBox = Math.abs(wrap(aM - aE - LEAD)) < TOL;
      fire.classList.toggle('want', inBox && !fly);
      if (fly && !fly.done) {
        fly.t += dt;
        const k = Math.min(1, fly.t / TT), phi = Math.PI * k;
        const r = a * (1 - ecc * ecc) / (1 + ecc * Math.cos(phi));
        const pos = S3.onOrbit(fly.a0 + phi, r);
        const dir = pos.clone().sub(rocket.position);
        rocket.position.copy(pos);
        if (dir.lengthSq() > 1e-8) rocket.rotation.y = Math.atan2(-dir.z, dir.x);
        const n = trailG.drawRange.count;
        if (n < MAXP) { tp.set([pos.x, pos.y, pos.z], n * 3); trailG.attributes.position.needsUpdate = true; trailG.setDrawRange(0, n + 1); }
        if (k >= 1) fly.done = true;
      }
      if (fly && fly.done && fly.fix) {                     // 降落：火箭變小、直直站在火星上
        rocket.scale.setScalar(.45); rocket.rotation.set(0, 0, Math.PI / 2);
        rocket.position.copy(mars.position).add(new T.Vector3(0, .44, 0)); flame.visible = false;
      }
    });
    cap('c10.goal');
    const off = hint($('.ctl'), 'tap', '50%', '40%');
    for (;;) {
      await waitAction([{ el: fire, keys: ['g', 'space', 'enter'] }]);
      off();
      const dev = wrap(aM - aE - LEAD);
      fly = { t: 0, a0: aE, dev, fix: Math.abs(dev) < TOL, done: false };
      trailG.setDrawRange(0, 0);
      rocket.visible = true; flame.visible = true; rocket.position.copy(earth.position);
      sfx('whoosh'); cap('c10.fly');
      await until(v, () => fly.done);
      if (fly.fix) break;
      sfx('no'); cap('c10.miss');
      await sleep(FAST ? 50 : 1500);
      rocket.visible = false; trailG.setDrawRange(0, 0);
      aM = aE + LEAD + 1.1 + Math.random() * .4;       // 讓火星回到框框前面一點，不用等太久
      fly = null;
    }
    sfx('win');
    $('.ctl').remove();
    let t = 0;
    await until(v, dt => { t += dt / (FAST ? .05 : 2); zoomK = Math.min(1, t); return t >= 1; });
    await card(['c10.f1', 'c10.f2'], {
      note: '去火星最省燃料的時機大約每 26 個月一次（「發射窗口」），沿著「霍曼轉移軌道」飛，大約要 7 個月。火箭要瞄準火星「到時候會在的位置」，不是現在的位置。到現在為止，到過火星表面的都是無人探測車，還沒有人去過。',
    });
  }

  // ---------- 結尾 ----------
  async function finale() {
    S3.stop();
    sayBox.hidden = false;
    stage.innerHTML = '<div class="center"><div class="stamp">太空<br>探險</div><div class="chtitle">' + Z('fin.title') + '</div>' +
      '<div class="stickers">' + ['sun', 'mercury', 'venus', 'earth', 'moon', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune'].map(k => G.ring(S3.img(k), 'sm')).join('') + '</div>' +
      '<div class="ftxt">' + Z('fin.task') + '</div>' +
      '<div class="parent"><b>給家長：</b>可以接著聊：①今晚的月亮是什麼形狀？過幾天再看一次，變大還是變小？②清晨或傍晚，最亮的那顆「星」常常是金星。③如果可以去一顆行星旅行，你想去哪裡？要帶什麼？</div></div>';
    sfx('win');
    cap('fin.hi');
  }

  // ---------- 流程：開場 → 開火箭自由探索 → 飛到星球旁邊做任務 → 全部完成看結尾 ----------
  // 每顆星球的任務（依序做，一次進去做一個）
  const TASKS = {
    sun: ['c1'], mercury: ['visit'], venus: ['visit'], earth: ['visit', 'c2', 'c3', 'c9'], moon: ['c4'],
    mars: ['visit', 'c10'], jupiter: ['visit', 'c6'], saturn: ['visit', 'c8'], uranus: ['visit'], neptune: ['visit'],
  };
  const ACT = { c1: ch1, c2: ch2, c3: ch3, c4: ch4, c6: ch6, c8: ch8, c9: ch9, c10: ch10, visit };
  const SAVE = 'space-world-v1';
  let done = new Set();
  try { done = new Set(JSON.parse(localStorage.getItem(SAVE)) || []); } catch (e) { /* 無痕模式 */ }
  const save = () => { try { localStorage.setItem(SAVE, JSON.stringify([...done])); } catch (e) { /* ignore */ } };
  const TOTAL = Object.values(TASKS).reduce((n, a) => n + a.length, 0);

  async function titleCard(key) {
    S3.stop();
    sayBox.hidden = true; foot.innerHTML = '';
    stage.innerHTML = '<div class="center"><div class="chtitle">' + Z(key) + '</div></div>';
    await sleep(FAST ? 50 : 1400);
  }
  async function runAct(k, a) {
    await titleCard(a === 'visit' ? 'n.' + k : a + '.title');
    stage.innerHTML = ''; foot.innerHTML = '';
    await ACT[a](k);
    G.stopVoice();
  }
  async function intro() {
    sayBox.hidden = true;
    stage.innerHTML = '<div class="hero">' + G.ring(S3.img('saturn', 'hero'), 'lg') +
      '<div class="t"><div class="logo">' + Z('ui.title') + '</div><div class="sub">' + Z('ui.sub') + '</div></div></div>';
    if (done.size && done.size < TOTAL) {
      foot.innerHTML = '<button class="big" id="b1">' + Z('ui.cont') + '</button><button class="big alt" id="b2">' + Z('ui.restart') + '</button>';
      const i = await waitAction([{ el: $('#b1'), keys: ['enter', 'space', 's'] }, { el: $('#b2'), keys: [] }]);
      sfx('tap');
      if (i === 1) { done.clear(); save(); }
    } else {
      done.clear(); save();
      foot.innerHTML = '<button class="big" id="go">' + kc('S') + ' ' + Z('ui.go') + '</button>';
      cap('intro.found');
      await waitAction([{ el: $('#go'), keys: ['s'] }]);
      sfx('ok');
    }
    foot.innerHTML = '';
  }
  async function main() {
    const qs = new URLSearchParams(location.search);
    if (qs.has('act')) {                               // 測試用：?act=earth.c3 直接做那個任務
      const [k, a] = qs.get('act').split('.');
      await runAct(k, a);
    } else if (!qs.has('world')) await intro();       // ?world 直接進太陽系
    let from = null;
    for (;;) {
      const remain = {};
      for (const k in TASKS) remain[k] = TASKS[k].filter(a => !done.has(k + '.' + a)).length;
      if (done.size >= TOTAL) break;
      const k = await WORLD.go(remain, { doneN: done.size, total: TOTAL, from });
      const a = TASKS[k].find(x => !done.has(k + '.' + x));
      await runAct(k, a);
      done.add(k + '.' + a); save();
      from = k;
    }
    await finale();
    foot.innerHTML = '<button class="big" id="again">' + Z('ui.again') + '</button>';
    await waitAction([{ el: $('#again'), keys: ['enter', 'space'] }]);
    done.clear(); save(); location.href = location.pathname;
  }
  main();
})();
