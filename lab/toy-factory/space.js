// three.js 的共用小工具：一張畫布輪流給各關用、星空、行星貼圖（用程式畫，不用外部圖片）、發光、點選。
// 畫風：夜空裡的黏土微縮模型——霧面黏土質感、太陽是暖色光源、軟影子、移軸鏡頭的上下模糊。
window.S3 = (() => {
  'use strict';
  const T = window.THREE;
  const BG = 0x141a3c;
  let R = null, cur = null, rafId = 0;

  function renderer() {
    if (!R) {
      R = new T.WebGLRenderer({ antialias: true });
      R.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      R.outputColorSpace = T.SRGBColorSpace;
      R.toneMapping = T.ACESFilmicToneMapping; R.toneMappingExposure = 1.2;
      R.shadowMap.enabled = true; R.shadowMap.type = T.PCFSoftShadowMap;
      R.domElement.className = 'gl';
    }
    return R;
  }

  // ---------- 一關一個場景：view(el) 把畫布放進 el，回傳 { scene, cam, on(f), pick… } ----------
  // scene/cam 可以傳進來重複用（太陽系世界每次回來都是同一個），keep：離開時不要清掉；post：移軸模糊
  function view(el, { fov = 45, pos = [0, 6, 14], look = [0, 0, 0], scene = null, cam = null, keep = false, post = false } = {}) {
    stop();
    const r = renderer();
    el.appendChild(r.domElement);
    if (!scene) { scene = new T.Scene(); scene.background = new T.Color(BG); }
    if (!cam) { cam = new T.PerspectiveCamera(fov, 1, .02, 4000); cam.position.set(...pos); cam.lookAt(...look); }
    const v = { el, scene, cam, keep, post, focus: .5, blur: .7, fns: [], insets: [], t: 0, last: performance.now(), look: new T.Vector3(...look), w: 1, h: 1 };
    const size = () => {
      const w = el.clientWidth, h = el.clientHeight;
      if (!w || !h) return;
      v.w = w; v.h = h;
      r.setSize(w, h, false);
      cam.aspect = w / h; cam.updateProjectionMatrix();
    };
    v.ro = new ResizeObserver(size); v.ro.observe(el); size();
    v.on = f => { v.fns.push(f); return () => { v.fns = v.fns.filter(g => g !== f); }; };
    // 世界座標 → el 裡的像素座標
    v.toScreen = p => { const q = p.clone().project(cam); return { x: (q.x + 1) / 2 * v.w, y: (1 - q.y) / 2 * v.h, z: q.z }; };
    // 點到哪個物件（objs 裡的 mesh 或 group）
    const ray = new T.Raycaster();
    v.pick = (x, y, objs) => {
      ray.setFromCamera(new T.Vector2(x / v.w * 2 - 1, -(y / v.h) * 2 + 1), cam);
      const hit = ray.intersectObjects(objs, true)[0];
      if (!hit) return null;
      let o = hit.object;
      while (o && !objs.includes(o)) o = o.parent;
      return o;
    };
    cur = v;
    cancelAnimationFrame(rafId);
    rafId = requestAnimationFrame(raf);
    return v;
  }
  function stop() {
    if (!cur) return;
    cur.ro.disconnect();
    if (!cur.keep) cur.scene.traverse(o => { if (o.geometry) o.geometry.dispose(); });
    cur = null;
  }

  // ---------- 移軸鏡頭：先畫到暫存畫面，再左右、上下各模糊一次（中間清楚，上下越遠越模糊） ----------
  let PP = null;
  function postFx() {
    if (PP) return PP;
    const rt = () => new T.WebGLRenderTarget(1, 1, { type: T.HalfFloatType, samples: 4 });
    const vs = 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0., 1.); }';
    const fs = last => `uniform sampler2D tDiffuse; uniform vec2 dir; uniform float focus; uniform float amt; varying vec2 vUv;
      void main(){
        float d = abs(vUv.y - focus);
        float k = smoothstep(.2, .55, d) * amt;
        vec4 c = vec4(0.); float ws = 0.;
        for (int i = -5; i <= 5; i++) { float w = exp(-float(i * i) / 10.); c += texture2D(tDiffuse, vUv + dir * float(i) * k) * w; ws += w; }
        gl_FragColor = c / ws;
        ${last ? `float vg = smoothstep(1.15, .35, length((vUv - .5) * vec2(1.1, 1.3))); gl_FragColor.rgb *= mix(.72, 1., vg);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>` : ''}
      }`;
    const mat = last => new T.ShaderMaterial({ uniforms: { tDiffuse: { value: null }, dir: { value: new T.Vector2() }, focus: { value: .5 }, amt: { value: 1 } },
      vertexShader: vs, fragmentShader: fs(last), depthTest: false, depthWrite: false });
    PP = { a: rt(), b: rt(), h: mat(false), v: mat(true), cam: new T.OrthographicCamera(-1, 1, 1, -1, 0, 1), quad: new T.Mesh(new T.PlaneGeometry(2, 2)), size: new T.Vector2() };
    PP.scene = new T.Scene(); PP.scene.add(PP.quad);
    return PP;
  }
  function renderPost(r, v) {
    const P = postFx();
    r.getDrawingBufferSize(P.size);
    if (P.a.width !== P.size.x || P.a.height !== P.size.y) { P.a.setSize(P.size.x, P.size.y); P.b.setSize(P.size.x, P.size.y); }
    r.setRenderTarget(P.a); r.render(v.scene, v.cam);
    const px = 2.6 * v.blur * (r.getPixelRatio());
    P.quad.material = P.h; P.h.uniforms.tDiffuse.value = P.a.texture; P.h.uniforms.dir.value.set(1 / P.size.x, 0);
    P.h.uniforms.focus.value = v.focus; P.h.uniforms.amt.value = px;
    r.setRenderTarget(P.b); r.render(P.scene, P.cam);
    P.quad.material = P.v; P.v.uniforms.tDiffuse.value = P.b.texture; P.v.uniforms.dir.value.set(0, 1 / P.size.y);
    P.v.uniforms.focus.value = v.focus; P.v.uniforms.amt.value = px;
    r.setRenderTarget(null); r.render(P.scene, P.cam);
  }
  function step(now) {
    const v = cur;
    if (!v) return;
    const dt = Math.min(.1, Math.max(0, (now - v.last) / 1000));
    v.last = now; v.t += dt;
    for (const f of v.fns.slice()) f(dt, v.t);
    const r = R;
    r.setScissorTest(false);
    r.setViewport(0, 0, v.w, v.h);
    if (v.post) renderPost(r, v); else r.render(v.scene, v.cam);
    for (const ins of v.insets) {         // 小視窗（例如：從地球看月亮）
      const [x, y, w, h] = ins.rect(v.w, v.h);
      r.setScissorTest(true);
      r.setScissor(x, v.h - y - h, w, h); r.setViewport(x, v.h - y - h, w, h);
      ins.cam.aspect = w / h; ins.cam.updateProjectionMatrix();
      r.render(v.scene, ins.cam);
    }
    r.setScissorTest(false);
  }
  function raf(now) { step(now); if (cur) rafId = requestAnimationFrame(raf); }
  // 預覽分頁在背景時 requestAnimationFrame 會停，用計時器補一下
  setInterval(() => { if (cur && performance.now() - cur.last > 150) step(performance.now()); }, 100);

  // ---------- 小工具 ----------
  const lerp = (a, b, k) => a + (b - a) * k;
  const ease = k => k < .5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
  const wrap = a => { while (a > Math.PI) a -= 2 * Math.PI; while (a < -Math.PI) a += 2 * Math.PI; return a; };
  function rng(seed) {
    let s = seed >>> 0;
    return () => { s += 0x6D2B79F5; let t = s; t = Math.imul(t ^ t >>> 15, t | 1); t ^= t + Math.imul(t ^ t >>> 7, t | 61); return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  }

  // ---------- 星空 ----------
  function stars(scene, n = 1600, rad = 600, seed = 7) {
    const r = rng(seed), p = new Float32Array(n * 3), c = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      const u = r() * 2 - 1, th = r() * Math.PI * 2, s = Math.sqrt(1 - u * u);
      p.set([rad * s * Math.cos(th), rad * u, rad * s * Math.sin(th)], i * 3);
      const k = .55 + r() * .45, warm = r() < .3;
      c.set([k, k * (warm ? .9 : .97), k * (warm ? .78 : 1)], i * 3);
    }
    const g = new T.BufferGeometry();
    g.setAttribute('position', new T.BufferAttribute(p, 3));
    g.setAttribute('color', new T.BufferAttribute(c, 3));
    const m = new T.Points(g, new T.PointsMaterial({ size: 2, sizeAttenuation: false, vertexColors: true }));
    scene.add(m);
    return m;
  }
  let sparkle = null;
  function sparkleTex() {
    if (sparkle) return sparkle;
    const c = document.createElement('canvas'); c.width = c.height = 64;
    const x = c.getContext('2d');
    x.fillStyle = '#fff6d8';
    x.beginPath();
    x.moveTo(32, 4); x.quadraticCurveTo(35, 29, 60, 32); x.quadraticCurveTo(35, 35, 32, 60);
    x.quadraticCurveTo(29, 35, 4, 32); x.quadraticCurveTo(29, 29, 32, 4); x.fill();
    sparkle = new T.CanvasTexture(c); sparkle.colorSpace = T.SRGBColorSpace;
    return sparkle;
  }

  // ---------- 發光（加法混色的圓形貼圖） ----------
  let glowTex = null;
  function glow(color = 0xffc46b, size = 4, opacity = .9) {
    if (!glowTex) {
      const c = document.createElement('canvas'); c.width = c.height = 128;
      const x = c.getContext('2d'), g = x.createRadialGradient(64, 64, 0, 64, 64, 64);
      g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(.25, 'rgba(255,255,255,.55)');
      g.addColorStop(.6, 'rgba(255,255,255,.12)'); g.addColorStop(1, 'rgba(255,255,255,0)');
      x.fillStyle = g; x.fillRect(0, 0, 128, 128);
      glowTex = new T.CanvasTexture(c);
    }
    const s = new T.Sprite(new T.SpriteMaterial({ map: glowTex, color, transparent: true, opacity, blending: T.AdditiveBlending, depthWrite: false }));
    s.scale.set(size, size, 1);
    return s;
  }

  // ---------- 行星貼圖：用 canvas 畫（經度從左到右、北極在上） ----------
  const TEX = {}, CAN = {};
  function paint(kind) {
    if (CAN[kind]) return CAN[kind];
    const W = kind === 'earth' || kind === 'jupiter' ? 1024 : 512, H = W / 2;
    const c = document.createElement('canvas'); c.width = W; c.height = H;
    const x = c.getContext('2d');
    const r = rng(kind.split('').reduce((a, ch) => a * 31 + ch.charCodeAt(0), 7));
    const fill = col => { x.fillStyle = col; x.fillRect(0, 0, W, H); };
    // 在 (u,v) 畫一個軟邊圓點，左右邊界會接起來
    const dot = (u, vv, rad, col, a = 1, soft = .5) => {
      for (const dx of [-W, 0, W]) {
        const cx = u * W + dx, cy = vv * H;
        if (cx + rad < 0 || cx - rad > W) continue;
        const g = x.createRadialGradient(cx, cy, 0, cx, cy, rad);
        g.addColorStop(0, col); g.addColorStop(1 - soft, col); g.addColorStop(1, 'rgba(0,0,0,0)');
        x.globalAlpha = a; x.fillStyle = g; x.beginPath(); x.arc(cx, cy, rad, 0, 7); x.fill();
      }
      x.globalAlpha = 1;
    };
    const bands = (cols, n, wob = .02) => {
      for (let y = 0; y < H; y++) {
        const v = y / H;
        const k = (Math.sin(v * n * Math.PI + Math.sin(v * 23) * 1.3) + 1) / 2;
        const i = Math.min(cols.length - 1, Math.floor((k + (r() - .5) * wob) * cols.length));
        x.fillStyle = cols[Math.max(0, i)]; x.fillRect(0, y, W, 1);
      }
    };
    const craters = (n, col, light) => {
      for (let i = 0; i < n; i++) {
        const u = r(), vv = .1 + r() * .8, rad = (2 + Math.pow(r(), 3) * 22) * W / 512;
        dot(u, vv, rad, col, .55, .3);
        dot(u + rad * .25 / W, vv + rad * .25 / H, rad * .7, light, .25, .4);
      }
    };
    const speckle = (n, cols, rmin, rmax, a = .35) => {
      for (let i = 0; i < n; i++) dot(r(), r(), (rmin + r() * (rmax - rmin)) * W / 512, cols[Math.floor(r() * cols.length)], a);
    };

    if (kind === 'sun') {
      fill('#ffb43c');
      speckle(120, ['#ffc65a', '#ff9f35'], 14, 40, .18);
      speckle(3000, ['#ffd36b', '#ff9a2e', '#ffe08a'], .8, 2.2, .4);
    } else if (kind === 'mercury') {
      fill('#9a918a'); speckle(400, ['#857b74', '#b0a79f'], 4, 18, .4); craters(160, '#6f665f', '#c8bfb6');
    } else if (kind === 'moon') {
      fill('#a8a49e'); speckle(300, ['#8d8983', '#bdb9b2'], 6, 26, .45);
      for (let i = 0; i < 9; i++) dot(.15 + r() * .7, .3 + r() * .4, 20 + r() * 30, '#7c7872', .5, .6);   // 月海
      craters(140, '#8a867f', '#d4d0c9');
    } else if (kind === 'venus') {
      bands(['#e6c98e', '#d9b877', '#edd8a8', '#cfae6c'], 9, .25);
      speckle(500, ['#f1dfb5', '#c9a464'], 8, 30, .25);
    } else if (kind === 'earth' || kind === 'earthHot' || kind === 'earthIce') {
      if (kind === 'earth') fill('#2f6fa6');
      else if (kind === 'earthHot') fill('#8a4a2a');
      else fill('#cfe3ec');
      const land = kind === 'earth' ? ['#5d8a3c', '#7a9a4a', '#a58c57'] : kind === 'earthHot' ? ['#6e3a22', '#a5603a', '#5b2e1c'] : ['#f4f8fa', '#e2eef3', '#ffffff'];
      // 大陸：一團一團的圓點
      const blobs = [[.22, .3], [.3, .62], [.52, .3], [.55, .58], [.75, .3], [.84, .66], [.62, .42], [.12, .4]];
      blobs.forEach(([u, vv]) => { for (let i = 0; i < 26; i++) dot(u + (r() - .5) * .13, vv + (r() - .5) * .2, (10 + r() * 26) * W / 512, land[Math.floor(r() * land.length)], 1, .25); });
      // 我們住的地方（小房子的位置）一定是陸地
      for (let i = 0; i < 10; i++) dot(HOME.u + (r() - .5) * .03, HOME.v + (r() - .5) * .05, (6 + r() * 10) * W / 512, land[0], 1, .25);
      x.fillStyle = kind === 'earthHot' ? '#7a4026' : '#f4f8fa';
      x.fillRect(0, 0, W, H * .06); x.fillRect(0, H * .94, W, H * .06);
      if (kind !== 'earthHot') speckle(140, ['#ffffff'], 6, 22, .28);       // 雲
    } else if (kind === 'mars') {
      fill('#c1643a'); speckle(700, ['#a9502c', '#d27a4a', '#8e4426'], 4, 26, .45); craters(60, '#8e4426', '#d98a5a');
      x.fillStyle = '#f2ece6'; x.fillRect(0, 0, W, H * .05); x.fillRect(0, H * .96, W, H * .04);
    } else if (kind === 'jupiter') {
      bands(['#d8c3a5', '#c39c74', '#e9dcc6', '#b07f56', '#efe3cf', '#c8a27d'], 14, .12);
      speckle(300, ['#f4ead9', '#a8774f'], 2, 6, .12);
      x.save(); x.translate(W * .62, H * .62); x.scale(1.9, 1);
      const g = x.createRadialGradient(0, 0, 0, 0, 0, H * .055);
      g.addColorStop(0, '#b4502f'); g.addColorStop(.7, '#c46a43'); g.addColorStop(1, 'rgba(196,106,67,0)');
      x.fillStyle = g; x.beginPath(); x.arc(0, 0, H * .055, 0, 7); x.fill(); x.restore();
    } else if (kind === 'saturn') {
      bands(['#e8d6a8', '#d9bf86', '#efe2bf', '#cdb173'], 11, .1);
    } else if (kind === 'uranus') {
      fill('#a6dde3'); bands(['#a6dde3', '#9fd6dd', '#b0e3e8'], 6, .05);
    } else if (kind === 'neptune') {
      fill('#3f66c9'); bands(['#3f66c9', '#4a72d2', '#365bb8'], 8, .1);
      dot(.4, .6, 26, '#26408a', .8, .6); speckle(40, ['#d8e4ff'], 3, 8, .35);
    }
    CAN[kind] = c;
    return c;
  }
  // 小房子（我們住的地方）在地球貼圖上的位置：北緯約 23.5 度
  const HOME = { u: .80, v: (90 - 23.5) / 180 };
  function tex(kind) {
    if (!TEX[kind]) { TEX[kind] = new T.CanvasTexture(paint(kind)); TEX[kind].colorSpace = T.SRGBColorSpace; TEX[kind].anisotropy = 4; }
    return TEX[kind];
  }
  // 貼圖上的 (u,v) 在半徑 rad 的球面上的位置（跟 SphereGeometry 的算法一樣）
  function uvToPos(u, v, rad = 1) {
    const phi = u * Math.PI * 2, th = v * Math.PI;
    return new T.Vector3(-rad * Math.cos(phi) * Math.sin(th), rad * Math.cos(th), rad * Math.sin(phi) * Math.sin(th));
  }

  // ---------- 星球 ----------
  // 黏土：霧面、邊緣有一點絨絨的光（sheen），表面有指紋般的小凹凸
  let bump = null;
  function clayBump() {
    if (bump) return bump;
    const c = document.createElement('canvas'); c.width = c.height = 256;
    const x = c.getContext('2d'), r = rng(42);
    x.fillStyle = '#808080'; x.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 900; i++) {
      const cx = r() * 256, cy = r() * 256, rad = 2 + r() * 9, g = x.createRadialGradient(cx, cy, 0, cx, cy, rad);
      const v = r() < .5 ? 'rgba(255,255,255,.18)' : 'rgba(0,0,0,.18)';
      g.addColorStop(0, v); g.addColorStop(1, 'rgba(128,128,128,0)');
      x.fillStyle = g; x.beginPath(); x.arc(cx, cy, rad, 0, 7); x.fill();
    }
    bump = new T.CanvasTexture(c); bump.wrapS = bump.wrapT = T.RepeatWrapping; bump.repeat.set(3, 2);
    return bump;
  }
  function clay(opts = {}) {
    return new T.MeshPhysicalMaterial(Object.assign({
      roughness: .9, metalness: 0,
      bumpMap: clayBump(), bumpScale: .12,
    }, opts));
  }
  // 果凍回彈：poke 一下會被壓扁再彈回來（彈簧＋阻尼，每一小步算一次才不會爆掉）
  function jelly(o, k = 160, c = 7) { o.userData.jl = { x: 0, v: 0, k, c, base: o.scale.clone() }; return o; }
  function poke(o, amt) { if (o && o.userData.jl) o.userData.jl.v += amt; }
  function wobble(o, dt) {
    const j = o.userData.jl;
    if (!j) return;
    for (let n = Math.ceil(dt / .008), h = dt / n; n > 0; n--) { j.v += (-j.k * j.x - j.c * j.v) * h; j.x += j.v * h; }
    j.x = Math.max(-.45, Math.min(.45, j.x));
    o.scale.set(j.base.x * (1 + j.x * .6), j.base.y * (1 - j.x), j.base.z * (1 + j.x * .6));
  }
  // 同一個物件也投影子、也接影子
  const shade = o => { o.traverse(m => { if (m.isMesh) { m.castShadow = true; m.receiveShadow = true; } }); return o; };
  // 每顆星球的黏土顏色（高彩焦點色；顏色＝身分）
  const PAL = {
    sun: 0xffc24a, mercury: 0xb8b0a6, venus: 0xf2a33a, earth: 0x3c9be0, moon: 0xe2ded6, mars: 0xf05a3c,
    jupiter: 0xe8c79a, saturn: 0xf1d9a4, uranus: 0x8fdde3, neptune: 0x4a6fe0, earthHot: 0xa5603a, earthIce: 0xe9f3f6,
  };
  // 貼在球面上的小塊黏土（大陸、極冠、斑點、隕石坑）：位置用貼圖座標 (u,v)，朝外、壓扁
  function blob(parent, r, u, v, size, color, flat = .32, sink = 0) {
    const m = new T.Mesh(new T.SphereGeometry(size, 24, 16), clay({ color }));
    m.scale.set(1, 1, flat);
    const p = uvToPos(u, v, r - sink);
    m.position.copy(p); m.lookAt(p.clone().multiplyScalar(2));
    m.castShadow = m.receiveShadow = true;
    parent.add(m);
    return m;
  }
  // 一圈緯度帶（木星、土星的條紋）：同一顆球的一片，顏色不一樣
  function band(parent, r, lat1, lat2, color) {
    const a = (90 - lat2) * Math.PI / 180, b = (90 - lat1) * Math.PI / 180;
    const m = new T.Mesh(new T.SphereGeometry(r * 1.006, 64, 16, 0, Math.PI * 2, a, b - a), clay({ color }));
    m.receiveShadow = true;
    parent.add(m);
    return m;
  }
  function planet(kind, rad = 1, seg = 48) {
    const g = new T.SphereGeometry(rad, seg, Math.round(seg * .66));
    const m = kind === 'sun'
      ? new T.MeshBasicMaterial({ color: PAL.sun, toneMapped: false })
      : clay({ color: PAL[kind] || 0xcccccc });
    const mesh = new T.Mesh(g, m);
    mesh.userData.kind = kind;
    if (kind === 'sun') return mesh;
    mesh.castShadow = true; mesh.receiveShadow = true;
    const r = rng(kind.length * 131);
    const R0 = rad;
    if (kind === 'earth') {
      const land = [0x4cb05a, 0x5bb86a, 0x3f9d4e];
      [[.22, .3, .34], [.3, .62, .3], [.52, .3, .36], [.55, .58, .28], [.75, .32, .3], [.84, .66, .26], [.12, .45, .22], [HOME.u, HOME.v, .3]]
        .forEach(([u, v, k], i) => blob(mesh, R0, u, v, R0 * k, land[i % 3], .3));
      blob(mesh, R0, 0, .02, R0 * .3, 0xfff6e6, .25); blob(mesh, R0, 0, .98, R0 * .3, 0xfff6e6, .25);     // 極冠
    } else if (kind === 'mars') {
      blob(mesh, R0, 0, .03, R0 * .26, 0xfff3e6, .22); blob(mesh, R0, 0, .97, R0 * .22, 0xfff3e6, .22);
      [[.3, .45, .3], [.62, .55, .24], [.85, .4, .2]].forEach(([u, v, k]) => blob(mesh, R0, u, v, R0 * k, 0xc9472d, .18));
    } else if (kind === 'mercury' || kind === 'moon') {
      const c = kind === 'moon' ? 0xc4bfb6 : 0x978f86;
      for (let i = 0; i < 9; i++) blob(mesh, R0, r(), .15 + r() * .7, R0 * (.08 + r() * .14), c, .14, R0 * .03);
    } else if (kind === 'jupiter') {
      band(mesh, R0, 8, 20, 0xc9955e); band(mesh, R0, -18, -6, 0xc9955e); band(mesh, R0, 32, 40, 0xd8ab78); band(mesh, R0, -42, -34, 0xd8ab78);
      blob(mesh, R0, .62, .62, R0 * .22, 0xe0533c, .22).scale.x = 1.7;      // 大紅斑
    } else if (kind === 'saturn') {
      band(mesh, R0, 6, 16, 0xd6b46f); band(mesh, R0, -22, -12, 0xd6b46f); band(mesh, R0, 34, 42, 0xe4c98a);
    } else if (kind === 'venus') {
      band(mesh, R0, 10, 24, 0xf7b85a); band(mesh, R0, -30, -16, 0xf7b85a);
    } else if (kind === 'neptune') {
      blob(mesh, R0, .4, .6, R0 * .2, 0x2e4bb0, .2).scale.x = 1.5;
    } else if (kind === 'uranus') {
      band(mesh, R0, -6, 6, 0x9fe5ea);
    }
    return mesh;
  }
  function sun(rad = 1) {
    const grp = new T.Group();
    grp.add(planet('sun', rad, 48));
    grp.add(glow(0xffb24a, rad * 4.2, .7));
    grp.add(glow(0xfff1c4, rad * 2.5, .55));
    return grp;
  }
  // 土星環：兩圈扁扁的黏土環（淺、深各一圈），中間留一條縫
  function ring(inner, outer, opacity = 1) {
    const g = new T.Group();
    const mk = (a, b, color) => {
      const m = new T.Mesh(new T.RingGeometry(a, b, 96, 1), clay({ color, side: T.DoubleSide, transparent: opacity < 1, opacity }));
      m.rotation.x = -Math.PI / 2; m.castShadow = m.receiveShadow = true; g.add(m);
    };
    const w = outer - inner;
    mk(inner, inner + w * .55, 0xe9d3a3); mk(inner + w * .62, outer, 0xcfb27a);
    g.userData.mats = () => { const a = []; g.traverse(o => { if (o.material) a.push(o.material); }); return a; };
    return g;
  }
  // 細細的軌道線
  function orbit(rad, color = 0xbd9558, opacity = .45) {
    const pts = [];
    for (let i = 0; i <= 128; i++) { const a = i / 128 * Math.PI * 2; pts.push(new T.Vector3(Math.cos(a) * rad, 0, -Math.sin(a) * rad)); }
    return new T.Line(new T.BufferGeometry().setFromPoints(pts), new T.LineBasicMaterial({ color, transparent: true, opacity }));
  }
  // 平面上的角度 a（逆時針、從 +x 開始）→ 位置
  const onOrbit = (a, rad, y = 0) => new T.Vector3(Math.cos(a) * rad, y, -Math.sin(a) * rad);

  // ---------- 2D 小頭像（給徽章用）：和 3D 同一個顏色的圓，加一點簡單特徵 ----------
  const PORT = {};
  const hex = c => '#' + c.toString(16).padStart(6, '0');
  function portrait(kind, size = 160) {
    const key = kind + size;
    if (PORT[key]) return PORT[key];
    const c = document.createElement('canvas'); c.width = c.height = size;
    const x = c.getContext('2d'), cx = size / 2, cy = size / 2, R0 = size * (kind === 'saturn' ? .3 : .42);
    const disc = (col, r = R0) => { x.fillStyle = col; x.beginPath(); x.arc(cx, cy, r, 0, 7); x.fill(); };
    const ringPart = front => {
      x.save(); x.translate(cx, cy); x.rotate(-.3); x.scale(1, .34);
      x.beginPath(); x.rect(-size, front ? 0 : -size, size * 2, size); x.clip();
      x.lineWidth = R0 * .5; x.strokeStyle = '#e9d3a3'; x.beginPath(); x.arc(0, 0, R0 * 1.7, 0, 7); x.stroke();
      x.restore();
    };
    if (kind === 'saturn') ringPart(false);
    disc(hex(PAL[kind] || 0xcccccc));
    x.save(); x.beginPath(); x.arc(cx, cy, R0, 0, 7); x.clip();
    const dot = (dx, dy, r, col) => { x.fillStyle = col; x.beginPath(); x.ellipse(cx + dx * R0, cy + dy * R0, r * R0, r * R0 * .8, 0, 0, 7); x.fill(); };
    const stripe = (dy, h, col) => { x.fillStyle = col; x.fillRect(0, cy + dy * R0 - h * R0 / 2, size, h * R0); };
    if (kind === 'earth') { dot(-.3, -.25, .4, '#4cb05a'); dot(.35, .3, .32, '#4cb05a'); dot(.3, -.5, .22, '#5bb86a'); }
    else if (kind === 'mars') { dot(.2, .2, .3, '#c9472d'); dot(0, -.9, .3, '#fff3e6'); }
    else if (kind === 'jupiter') { stripe(-.35, .18, '#c9955e'); stripe(.3, .16, '#c9955e'); dot(.35, .35, .18, '#e0533c'); }
    else if (kind === 'saturn') { stripe(-.3, .16, '#d6b46f'); stripe(.35, .14, '#d6b46f'); }
    else if (kind === 'venus') { stripe(-.3, .2, '#f7b85a'); stripe(.4, .18, '#f7b85a'); }
    else if (kind === 'neptune') { dot(-.2, .2, .22, '#2e4bb0'); }
    else if (kind === 'mercury' || kind === 'moon') { const c2 = kind === 'moon' ? '#c4bfb6' : '#978f86'; dot(-.3, -.2, .18, c2); dot(.35, .25, .14, c2); dot(.1, .5, .1, c2); }
    // 一點點立體感：左上亮、右下暗
    const g = x.createRadialGradient(cx - R0 * .4, cy - R0 * .4, R0 * .2, cx, cy, R0 * 1.1);
    g.addColorStop(0, 'rgba(255,255,255,.22)'); g.addColorStop(.6, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(40,30,50,.28)');
    x.fillStyle = g; x.fillRect(0, 0, size, size);
    x.restore();
    if (kind === 'saturn') ringPart(true);
    PORT[key] = c.toDataURL('image/png');
    return PORT[key];
  }
  const img = (kind, cls = '') => '<img class="pimg ' + cls + '" alt="" src="' + portrait(kind) + '">';

  return { T, view, stop, current: () => cur, clay, shade, jelly, poke, wobble, PAL, blob, stars, glow, tex, planet, sun, ring, orbit, onOrbit, uvToPos, HOME, portrait, img, lerp, ease, wrap, rng };
})();
