// 太陽系小模型世界：一座放在圓形底座上的黏土太陽系。孩子開小火箭飛來飛去，飛到星球旁邊就能進去做任務。
// 距離和大小都縮小了（示意）；太陽是唯一的暖色光源，星球、火箭、小石頭的影子都會落在底座上。
window.WORLD = (() => {
  'use strict';
  const { T, lerp, wrap, onOrbit } = S3;
  const { $, stage, foot, keyName, sfx, say, sayBox, track, Z } = G;
  const kc = k => '<kbd class="kc">' + k + '</kbd>';
  const BASE_Y = -2.6, BASE_R = 84;
  const CAM_DIR = new T.Vector3(0, 21, 25).normalize();      // 斜 40 度俯視，固定朝北、不旋轉
  // 名字、半徑、離太陽的距離、角度（度）
  const ST = [
    { k: 'sun', r: 4, d: 0, a: 0 },
    { k: 'mercury', r: .9, d: 10.5, a: 35 },
    { k: 'venus', r: 1.3, d: 16, a: 115 },
    { k: 'earth', r: 1.4, d: 23, a: 205 },
    { k: 'mars', r: 1.1, d: 30, a: 300 },
    { k: 'jupiter', r: 3, d: 43, a: 25 },
    { k: 'saturn', r: 2.5, d: 54, a: 140 },
    { k: 'uranus', r: 1.8, d: 65, a: 245 },
    { k: 'neptune', r: 1.7, d: 75, a: 335 },
  ];
  ST.forEach(s => { s.pos = onOrbit(s.a * Math.PI / 180, s.d); });
  const earth = ST.find(s => s.k === 'earth');
  ST.push({ k: 'moon', r: .5, pos: earth.pos.clone().add(new T.Vector3(3.6, 0, 1.2)) });
  const BELT = [34, 38];
  // 每顆星球的「身分色」：光暈、徽章都用它
  const HALO = { sun: 0xf7c948, mercury: 0xc9c2b8, venus: 0xf2a33a, earth: 0x3c9be0, moon: 0xe8e4dc, mars: 0xf05a3c, jupiter: 0xd9b27a, saturn: 0xf7c948, uranus: 0x7fd8e0, neptune: 0x8b6fd6 };
  const NUM = { sun: '1', mercury: '2', venus: '3', earth: '4', mars: '5', jupiter: '6', saturn: '7', uranus: '8', neptune: '9', moon: '0' };                              // 小行星帶在火星和木星中間

  let W = null;

  // ---------- 黏土小臉：豆豆眼、彎彎嘴、腮紅，每顆星球的表情不一樣 ----------
  const BLACK = new T.MeshStandardMaterial({ color: 0x3b3430, roughness: .35 });      // 深棕色，不是純黑
  const WHITE = new T.MeshBasicMaterial({ color: 0xffffff });
  const PINK = S3.clay({ color: 0xff8f9e, bumpMap: null });
  const DROP = new T.MeshPhysicalMaterial({ color: 0x9fd8ff, roughness: .1, clearcoat: 1 });
  function face(kind, r) {
    const g = new T.Group();
    const at = (x, y, out = 1) => new T.Vector3(x, y, Math.sqrt(Math.max(0, 1 - x * x - y * y))).multiplyScalar(r * out);
    const stick = (obj, x, y, out = 1.07) => {        // 貼在球面上、朝外（稍微浮出來，才不會被大陸擋住）
      const p = new T.Group(); p.position.copy(at(x, y, out)); p.lookAt(p.position.clone().multiplyScalar(2)); p.add(obj); g.add(p); return p;
    };
    const bead = (x, y, s = .11, dx = 0, dy = 0) => {
      const e = new T.Mesh(new T.SphereGeometry(r * s, 18, 14), BLACK); e.scale.z = .55;
      const hl = new T.Mesh(new T.SphereGeometry(r * s * .28, 10, 8), WHITE); hl.position.set(r * s * (-.3 + dx), r * s * (.35 + dy), r * s * .5);
      e.add(hl); stick(e, x, y);
    };
    const arc = (x, y, w, up, tube = .045) => {      // up=true：開心的 ^ ；false：微笑的 U（圓圓胖胖的黏土條）
      const m = new T.Mesh(new T.TorusGeometry(r * w, r * tube, 10, 24, Math.PI), BLACK);
      if (!up) m.rotation.z = Math.PI;
      stick(m, x, y);
    };
    const blush = (x, y) => { const b = new T.Mesh(new T.SphereGeometry(r * .1, 14, 10), PINK); b.scale.set(1.4, .8, .35); stick(b, x, y); };
    const mouthO = (x, y, s) => { const m = new T.Mesh(new T.SphereGeometry(r * s, 16, 12), BLACK); m.scale.set(.8, 1, .35); stick(m, x, y); };
    if (kind === 'sun') {                             // 戴墨鏡：眼睛不可以直接看太陽
      const lens = new T.MeshStandardMaterial({ color: 0x241b2a, roughness: .15, metalness: .3 });
      [-1, 1].forEach(sx => { const l = new T.Mesh(new T.SphereGeometry(r * .17, 20, 14), lens); l.scale.set(1.25, .9, .3); stick(l, sx * .25, .16, 1.01); });
      const bar = new T.Mesh(new T.CylinderGeometry(r * .04, r * .04, r * .2, 8), lens); bar.rotation.z = Math.PI / 2; stick(bar, 0, .2, 1.02);
      arc(0, -.22, .18, false, .05);
    } else if (kind === 'mercury') {                  // 好熱、跑好快：流汗
      bead(-.28, .14, .12); bead(.28, .14, .12); mouthO(0, -.22, .08);
      const d = new T.Mesh(new T.SphereGeometry(r * .09, 14, 10), DROP); d.scale.y = 1.4; stick(d, .62, .36);
    } else if (kind === 'venus') {                    // 熱呼呼：瞇瞇眼、紅臉
      arc(-.27, .14, .1, false); arc(.27, .14, .1, false); arc(0, -.24, .13, false); blush(-.48, -.08); blush(.48, -.08);
    } else if (kind === 'earth') {                    // 我們的家：開心
      arc(-.26, .16, .1, true); arc(.26, .16, .1, true); arc(0, -.2, .17, false, .03); blush(-.46, -.04); blush(.46, -.04);
    } else if (kind === 'moon') {                     // 想睡覺
      arc(-.28, .1, .1, false); arc(.28, .1, .1, false); arc(0, -.25, .08, false);
    } else if (kind === 'mars') {
      bead(-.26, .12); bead(.26, .12); arc(0, -.2, .14, false); blush(-.46, -.06); blush(.46, -.06);
    } else if (kind === 'jupiter') {                  // 好大：哇！
      bead(-.26, .16, .1); bead(.26, .16, .1); mouthO(0, -.2, .09); blush(-.45, -.04); blush(.45, -.04);
    } else if (kind === 'saturn') {                   // 眨眼
      bead(-.26, .14); arc(.26, .12, .09, true); arc(0, -.2, .15, false); blush(-.45, -.04); blush(.45, -.04);
    } else if (kind === 'uranus') {                   // 躺著轉：整張臉轉 90 度
      bead(-.25, .14); bead(.25, .14); arc(0, -.2, .14, false);
    } else if (kind === 'neptune') {                  // 好冷：眼睛看旁邊、嘴巴抖抖
      bead(-.25, .14, .12, .5, 0); bead(.25, .14, .12, .5, 0); mouthO(0, -.24, .07);
    }
    return g;
  }

  // ---------- 小火箭 ----------
  function rocket() {
    const g = new T.Group(), body = new T.Group();
    body.rotation.z = -Math.PI / 2;                   // 模型是直的，轉成朝 +x 前進
    g.add(body);
    const cream = S3.clay({ color: 0xf5ecdc, bumpMap: null }), red = S3.clay({ color: 0xe0533c, bumpMap: null });
    const glass = new T.MeshPhysicalMaterial({ color: 0x7cc6ee, roughness: .12, clearcoat: 1 });
    const hull = new T.Mesh(new T.CapsuleGeometry(.42, .7, 8, 18), cream);
    const nose = new T.Mesh(new T.ConeGeometry(.4, .5, 22), red); nose.position.y = .78;
    const tip = new T.Mesh(new T.SphereGeometry(.09, 12, 10), red); tip.position.y = 1.04;
    body.add(hull, nose, tip);
    [-1, 1].forEach(sz => { const w = new T.Mesh(new T.SphereGeometry(.15, 16, 12), glass); w.position.set(0, .2, sz * .38); w.scale.z = .5; body.add(w); });
    for (let i = 0; i < 3; i++) {
      const f = new T.Mesh(new T.SphereGeometry(.3, 16, 12), red), a = i * Math.PI * 2 / 3;
      f.scale.set(.25, .9, .7); f.position.set(Math.cos(a) * .38, -.5, Math.sin(a) * .38); f.rotation.y = -a; body.add(f);
    }
    const flame = new T.Group(); flame.position.y = -.85; body.add(flame);
    const f1 = new T.Mesh(new T.ConeGeometry(.26, .8, 16), new T.MeshBasicMaterial({ color: 0xff7a2e, toneMapped: false }));
    const f2 = new T.Mesh(new T.ConeGeometry(.14, .5, 12), new T.MeshBasicMaterial({ color: 0xffe08a, toneMapped: false }));
    f1.rotation.z = f2.rotation.z = Math.PI; f1.position.y = -.4; f2.position.y = -.28;
    flame.add(f1, f2);
    const fl = new T.PointLight(0xff8a3d, 0, 9, 1.6); fl.position.y = -1.1; body.add(fl);    // 火焰會照亮底座
    S3.shade(hull.parent); f1.castShadow = f2.castShadow = false;
    return { g, body, flame, fl };
  }

  // ---------- 蓋出整座模型 ----------
  function build() {
    const scene = new T.Scene();
    scene.background = new T.Color(0x0e1331);
    scene.fog = new T.Fog(0x0e1331, 70, 150);
    const sky = S3.stars(scene, 1800, 420);
    sky.traverse(o => { if (o.material) o.material.fog = false; });
    scene.add(new T.HemisphereLight(0xb5c2ff, 0x3a2c50, .95));
    const front = new T.DirectionalLight(0xffe6c8, .45); front.position.copy(CAM_DIR).multiplyScalar(50); scene.add(front);   // 正面補一點光，小臉才看得清楚
    const rim = new T.DirectionalLight(0x9bb0ff, .35); rim.position.set(-20, 30, -30); scene.add(rim);
    const sunL = new T.PointLight(0xffe7c6, 2.4, 0, 0);
    sunL.castShadow = true; sunL.shadow.mapSize.set(1024, 1024); sunL.shadow.camera.near = 3; sunL.shadow.camera.far = 130; sunL.shadow.bias = -.002;
    scene.add(sunL);

    // 底座：深藍黏土圓盤、金色的軌道溝
    // 底座：深藍黏土圓盤，邊緣用木頭收邊（像桌上的立體模型）
    const baseMat = S3.clay({ color: 0x35427e, roughness: .92 });
    const base = new T.Mesh(new T.CylinderGeometry(BASE_R, BASE_R - 1, 3, 120), baseMat);
    base.position.y = BASE_Y - 1.5; base.receiveShadow = true; scene.add(base);
    const wood = S3.clay({ color: 0xb98e5a, roughness: .9 });
    const lip = new T.Mesh(new T.TorusGeometry(BASE_R, 1.1, 14, 160), wood);
    lip.rotation.x = Math.PI / 2; lip.position.y = BASE_Y - .2; lip.receiveShadow = lip.castShadow = true; scene.add(lip);
    const skirt = new T.Mesh(new T.CylinderGeometry(BASE_R + .6, BASE_R + .6, 2.2, 120, 1, true), wood);
    skirt.position.y = BASE_Y - 1.5; scene.add(skirt);
    const glowLine = new T.MeshBasicMaterial({ color: 0xffcf7a, transparent: true, opacity: .3, toneMapped: false });
    ST.filter(s => s.d).forEach(s => {
      const t = new T.Mesh(new T.TorusGeometry(s.d, .045, 6, 200), glowLine); t.rotation.x = Math.PI / 2; t.position.y = BASE_Y + .02; scene.add(t);
    });

    // 星球、支架、小臉
    const rod = new T.MeshPhysicalMaterial({ color: 0xffffff, roughness: .15, transparent: true, opacity: .28 });
    const foot = S3.clay({ color: 0xb98e5a, roughness: .9 });       // 木頭小底座
    const bodies = [];
    ST.forEach(s => {
      const grp = new T.Group(); grp.position.copy(s.pos); scene.add(grp);
      let mesh;
      if (s.k === 'sun') {
        mesh = S3.planet('sun', s.r, 64); grp.add(mesh);
        grp.add(S3.glow(0xffb24a, s.r * 4.5, .7), S3.glow(0xfff1c4, s.r * 2.6, .6));
      } else {
        mesh = S3.planet(s.k, s.r, 48); grp.add(mesh);
        if (s.k === 'saturn') { const tilt = new T.Group(); tilt.rotation.z = .42; tilt.add(S3.ring(s.r * 1.3, s.r * 2.25)); grp.add(tilt); }
        if (s.k === 'uranus') mesh.rotation.z = 1.7;
      }
      const h = s.pos.y - s.r - BASE_Y;
      const st = new T.Mesh(new T.CylinderGeometry(s.k === 'sun' ? .25 : .07, s.k === 'sun' ? .25 : .07, h, 10), rod);
      st.position.set(s.pos.x, BASE_Y + h / 2, s.pos.z); scene.add(st);
      const ft = new T.Mesh(new T.CylinderGeometry(s.r * .45 + .3, s.r * .5 + .35, .25, 28), foot);
      ft.position.set(s.pos.x, BASE_Y + .12, s.pos.z); ft.receiveShadow = ft.castShadow = true; scene.add(ft);
      const f = face(s.k, s.r);
      f.position.copy(s.pos); f.lookAt(s.pos.clone().add(CAM_DIR));
      if (s.k === 'uranus') f.rotateZ(Math.PI / 2);
      S3.shade(f); scene.add(f);
      // 還有任務的星球：底座上一圈會呼吸的光暈
      const halo = new T.Group(); halo.position.set(s.pos.x, BASE_Y + .3, s.pos.z);
      const hc = HALO[s.k] || 0xffd38a;
      const hr = new T.Mesh(new T.TorusGeometry(s.r + 1.3, .12, 8, 64), new T.MeshBasicMaterial({ color: hc, transparent: true, opacity: .5, toneMapped: false }));
      hr.rotation.x = Math.PI / 2; halo.add(hr);
      const hg = S3.glow(hc, (s.r + 2) * 2.4, .35); hg.position.y = .2; halo.add(hg);
      scene.add(halo);
      S3.jelly(grp);
      bodies.push({ s, mesh, grp, face: f, halo, hr, hg });
    });

    // 小行星帶：可以撞開的小石頭
    const rr = S3.rng(9), rocks = [];
    const rockMats = [0x8b7f74, 0x9d8a78, 0x6f6660].map(c => S3.clay({ color: c, roughness: .95 }));
    for (let i = 0; i < 46; i++) {
      const size = .35 + rr() * .55, a = rr() * Math.PI * 2, d = lerp(BELT[0], BELT[1], rr());
      const m = new T.Mesh(new T.DodecahedronGeometry(size, 0), rockMats[i % 3]);
      m.position.copy(onOrbit(a, d)); m.position.y = (rr() - .5) * .8;
      m.rotation.set(rr() * 6, rr() * 6, rr() * 6);
      m.castShadow = m.receiveShadow = true; scene.add(m);
      rocks.push({ m, r: size, vel: new T.Vector3(), spin: new T.Vector3((rr() - .5), (rr() - .5), (rr() - .5)).multiplyScalar(.6) });
    }

    const rk = rocket(); scene.add(rk.g);
    const cam = new T.PerspectiveCamera(36, 1, .5, 900);
    S3.jelly(rk.body, 220, 8);
    W = { scene, cam, bodies, rocks, rk, pos: earth.pos.clone().add(new T.Vector3(0, 0, earth.r + 8)), vel: new T.Vector3(), th: Math.PI / 2, camAt: null };
    return W;
  }

  // ---------- 開火箭 ----------
  // remain：每個星球還有幾個任務；回傳孩子要進去的星球
  function go(remain, { doneN = 0, total = 0, from = null } = {}) {
    if (!W) build();
    stage.innerHTML = '<div class="view3d world" id="v3"><div class="ov" id="ov"></div><div class="stick" id="stick" hidden><i></i></div></div>' +
      '<div class="wctl"><div class="wkeys">' + kc('W') + kc('A') + kc('S') + kc('D') + '</div></div>';
    foot.innerHTML = '';
    const el = $('#v3'), ov = $('#ov'), stick = $('#stick');
    const v = S3.view(el, { scene: W.scene, cam: W.cam, keep: true, post: true });
    if (from) {                                       // 從星球出來：停在它前面
      const s = ST.find(x => x.k === from);
      W.pos.copy(s.pos).add(new T.Vector3(0, 0, s.r + 3.8)); W.vel.set(0, 0, 0); W.th = Math.PI / 2;
    }
    // 提示只在第一次顯示，孩子一動手就淡出
    sayBox.hidden = !!W.hinted;
    if (!W.hinted) say('w.goal');
    const hintOff = () => { if (W.hinted) return; W.hinted = true; sayBox.classList.add('fade'); setTimeout(() => { sayBox.hidden = true; sayBox.classList.remove('fade'); }, 1600); };
    ov.insertAdjacentHTML('beforeend', '<div class="wcount"><span class="star">★</span><b>' + doneN + '</b> / ' + total + '</div>' +
      '<button class="enter" id="enter" hidden></button>');
    const enter = $('#enter');
    // 徽章：還有任務的星球各一個。在畫面裡時浮在星球上方；不在畫面裡時貼在邊緣、指向它。點了火箭自己飛過去。
    const badges = {};
    ST.forEach(s => {
      if (!remain[s.k]) return;
      const b = document.createElement('button');
      b.className = 'badge3'; b.style.setProperty('--c', '#' + HALO[s.k].toString(16).padStart(6, '0'));
      b.innerHTML = S3.img(s.k) + kc(NUM[s.k]) + '<i></i>';
      b.addEventListener('pointerdown', ev => ev.stopPropagation());
      b.addEventListener('click', () => { autoTo(s); });
      ov.appendChild(b); badges[s.k] = { el: b, s };
    });

    // ---- 自動駕駛：飛到某顆星球前面 ----
    let auto = null;
    const autoTo = s => { auto = s; hintOff(); sfx('tap'); };
    // ---- 鍵盤 ----
    const st = {};
    const kd = ev => {
      const k = keyName(ev); if (!k) return;
      if (/^\d$/.test(k)) { const s = ST.find(x => NUM[x.k] === k); if (s && remain[s.k] && !ev.repeat) autoTo(s); return; }
      st[k] = true; auto = null; hintOff();
      if (k.length > 1 && k !== 'enter') ev.preventDefault();
    };
    const ku = ev => { const k = keyName(ev); if (k) st[k] = false; };
    addEventListener('keydown', kd); addEventListener('keyup', ku);
    // ---- 觸控：按在哪裡，哪裡就是搖桿 ----
    let joy = null;
    const untrack = track(el, {
      down(p) { joy = { x: p.x, y: p.y, dx: 0, dy: 0 }; auto = null; hintOff(); stick.hidden = false; stick.style.left = p.x + 'px'; stick.style.top = p.y + 'px'; },
      move(p) { if (!joy) return; const dx = p.x - joy.x, dy = p.y - joy.y, l = Math.hypot(dx, dy), m = Math.min(l, 70); joy.dx = l ? dx / l * m : 0; joy.dy = l ? dy / l * m : 0; stick.firstChild.style.transform = 'translate(' + joy.dx + 'px,' + joy.dy + 'px)'; },
      up() { joy = null; stick.hidden = true; stick.firstChild.style.transform = ''; },
    });
    // ---- 滑鼠移到星球上：游標變手、星球輕輕晃一下 ----
    let hover = null;
    const onMove = ev => {
      if (ev.pointerType && ev.pointerType !== 'mouse') return;
      const r = el.getBoundingClientRect();
      const o = v.pick(ev.clientX - r.left, ev.clientY - r.top, W.bodies.map(b => b.grp));
      const b = o ? W.bodies.find(x => x.grp === o) : null;
      if (b !== hover) { hover = b; el.style.cursor = b ? 'pointer' : ''; if (b) { S3.poke(b.grp, .6); sfx('hover'); } }
    };
    el.addEventListener('pointermove', onMove);
    el.addEventListener('click', ev => { if (hover && remain[hover.s.k]) autoTo(hover.s); });

    let near = null, bumpT = 0, nearShown = null;
    const camAt = W.camAt || W.pos.clone();
    const look = new T.Vector3().copy(camAt);
    const coarse = matchMedia('(pointer:coarse)').matches;
    v.on((dt, t) => {
      // ---- 操作 ----
      let thrust = 0, turn = 0;
      if (st.w || st.up) thrust = 1;
      if (st.s || st.down) thrust = -.6;
      if (st.a || st.left) turn += 1;
      if (st.d || st.right) turn -= 1;
      if (joy && Math.hypot(joy.dx, joy.dy) > 8) {        // 搖桿方向＝世界方向（鏡頭固定朝北）
        const want = Math.atan2(-joy.dy, joy.dx), d = wrap(want - W.th);
        turn = Math.max(-1, Math.min(1, d * 2.4));
        thrust = Math.abs(d) < 1.2 ? Math.min(1, Math.hypot(joy.dx, joy.dy) / 50) : .2;
      }
      if (auto) {
        const dx = auto.pos.x - W.pos.x, dz = auto.pos.z - W.pos.z, dist = Math.hypot(dx, dz) - auto.r;
        if (dist < 2.6) auto = null;
        else {
          const want = Math.atan2(-dz, dx), d = wrap(want - W.th);
          turn = Math.max(-1, Math.min(1, d * 2.4));
          thrust = Math.abs(d) < 1 ? Math.min(1, dist / 6) : .15;
        }
      }
      W.th += turn * 3 * dt;
      const fwd = new T.Vector3(Math.cos(W.th), 0, -Math.sin(W.th));
      W.vel.addScaledVector(fwd, thrust * 30 * dt);
      W.vel.multiplyScalar(Math.exp(-1.7 * dt));
      W.pos.addScaledVector(W.vel, dt);
      G.engine && G.engine(Math.abs(thrust) * .6 + W.vel.length() * .02);
      // ---- 碰撞：星球彈開、小石頭被推走 ----
      for (const s of ST) {
        const d = W.pos.clone().sub(s.pos); d.y = 0;
        const min = s.r + .9, len = d.length();
        if (len < min && len > 1e-4) {
          d.divideScalar(len); W.pos.copy(s.pos).addScaledVector(d, min); W.pos.y = 0;
          const vn = W.vel.dot(d);
          if (vn < 0) {
            W.vel.addScaledVector(d, -1.7 * vn);
            if (bumpT <= 0 && vn < -2) { sfx('bump'); bumpT = .4; S3.poke(W.rk.body, Math.min(4, -vn * .35)); S3.poke(W.bodies.find(b => b.s === s).grp, Math.min(2.5, -vn * .12)); }
          }
        }
      }
      for (const r of W.rocks) {
        const d = r.m.position.clone().sub(W.pos); d.y = 0;
        const min = r.r + .7, len = d.length();
        if (len < min && len > 1e-4) {
          d.divideScalar(len);
          r.m.position.copy(W.pos).addScaledVector(d, min).setY(r.m.position.y);
          r.vel.addScaledVector(d, Math.max(2, W.vel.length() * 1.1));
          W.vel.multiplyScalar(.85);
          if (bumpT <= 0) { sfx('thud'); bumpT = .25; S3.poke(W.rk.body, 1.6); }
        }
        r.m.position.addScaledVector(r.vel, dt); r.vel.multiplyScalar(Math.exp(-1.2 * dt));
        r.m.rotation.x += (r.spin.x + r.vel.length() * .3) * dt; r.m.rotation.y += r.spin.y * dt;
      }
      bumpT -= dt;
      const R2 = Math.hypot(W.pos.x, W.pos.z);
      if (R2 > BASE_R - 4) { W.pos.multiplyScalar((BASE_R - 4) / R2); if (W.vel.length() > 3) sfx('edge'); W.vel.multiplyScalar(.5); }
      // ---- 火箭的樣子：加速後仰、轉彎側傾、果凍回彈 ----
      W.rk.g.position.set(W.pos.x, Math.sin(t * 2.2) * .12, W.pos.z);
      W.rk.g.rotation.y = W.th;
      W.rk.body.rotation.x = lerp(W.rk.body.rotation.x, -turn * .45, Math.min(1, dt * 6));
      W.rk.body.rotation.y = lerp(W.rk.body.rotation.y, thrust > 0 ? .18 : thrust < 0 ? -.2 : 0, Math.min(1, dt * 5));
      const fl = Math.max(0, Math.abs(thrust)) * (.85 + Math.sin(t * 40) * .15);
      W.rk.flame.scale.setScalar(Math.max(.05, fl)); W.rk.fl.intensity = fl * 3;
      W.bodies.forEach(b => {
        b.mesh.rotation.y += dt * (b.s.k === 'sun' ? .05 : .25);
        S3.wobble(b.grp, dt); b.face.scale.copy(b.grp.scale);     // 小臉跟著星球一起晃
        b.halo.visible = !!remain[b.s.k];
        if (b.halo.visible) {                             // 門口的光暈會呼吸，越近越亮
          const dd = Math.max(0, W.pos.distanceTo(b.s.pos) - b.s.r), nearK = Math.max(0, 1 - dd / 14);
          const p = .5 + .5 * Math.sin(t * 2.4);
          b.hr.material.opacity = .25 + p * .2 + nearK * .55; b.hg.material.opacity = .12 + p * .12 + nearK * .5;
          b.halo.scale.setScalar(1 + nearK * .12);
        }
      });
      if (thrust > 0 && !W.thr) S3.poke(W.rk.body, -1.2);   // 一加速就被拉長一點
      W.thr = thrust > 0;
      S3.wobble(W.rk.body, dt);
      // ---- 鏡頭跟著火箭（固定角度、固定朝北，像桌上的小模型） ----
      const zoom = v.cam.aspect < 1 ? 1.45 : 1;
      camAt.lerp(W.pos, Math.min(1, dt * 3.5));
      look.copy(camAt);
      v.cam.position.copy(look).addScaledVector(CAM_DIR, 27 * zoom);
      v.cam.lookAt(look);
      W.camAt = camAt;
      v.focus = 1 - v.toScreen(W.rk.g.position).y / v.h;
      // ---- 靠近星球：名字才浮出來 ----
      near = null;
      for (const s of ST) if (remain[s.k] && W.pos.distanceTo(s.pos) < s.r + 3.4) { near = s; break; }
      if (near !== nearShown) {
        nearShown = near;
        enter.hidden = !near;
        if (near) { enter.innerHTML = (coarse ? '' : kc('E')) + '<span class="cl">' + Z('n.' + near.k) + '</span><span class="tasks">' + '★'.repeat(remain[near.k]) + '</span>'; sfx('near'); }
      }
      if (near) {
        const p = v.toScreen(near.pos.clone().add(new T.Vector3(0, near.r + .6, 0)));
        enter.style.left = p.x + 'px'; enter.style.top = p.y + 'px';
      }
      // ---- 徽章：在星球上方，或貼到畫面邊緣 ----
      const m = 44, top = 90, bot = 70;
      for (const k in badges) {
        const { el: a, s } = badges[k];
        a.hidden = near === s;
        if (a.hidden) continue;
        const p = v.toScreen(s.pos.clone().add(new T.Vector3(0, s.r + .6, 0)));
        const off = p.x < m || p.x > v.w - m || p.y < m + top || p.y > v.h - m - bot || p.z > 1;
        a.classList.toggle('far', off);
        if (!off) { a.style.left = p.x + 'px'; a.style.top = p.y + 'px'; continue; }
        const cx = v.w / 2, cy = v.h / 2;
        let dx = p.x - cx, dy = p.y - cy;
        if (p.z > 1) { dx = -dx; dy = -dy; }
        const sc = Math.min((cx - m) / Math.abs(dx || 1e-3), (cy - m - (dy < 0 ? top : bot)) / Math.abs(dy || 1e-3));
        a.style.left = (cx + dx * sc) + 'px'; a.style.top = (cy + dy * sc) + 'px';
        a.querySelector('i').style.transform = 'rotate(' + Math.atan2(dy, dx) + 'rad)';
      }
    });
    return new Promise(res => {
      const done = k => {
        removeEventListener('keydown', kd); removeEventListener('keyup', ku); removeEventListener('keydown', ke); untrack();
        el.removeEventListener('pointermove', onMove); el.style.cursor = '';
        G.engine && G.engine(0);
        sfx('door'); res(k);
      };
      const ke = ev => { const k = keyName(ev); if ((k === 'e' || k === 'enter') && near && !ev.repeat) { ev.preventDefault(); done(near.k); } };
      addEventListener('keydown', ke);
      enter.addEventListener('pointerdown', ev => ev.stopPropagation());   // 不要被當成搖桿
      enter.addEventListener('click', () => { if (near) done(near.k); });
    });
  }

  return { go, ST, face, rocket };
})();
