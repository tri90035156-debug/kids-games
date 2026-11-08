// 《小水滴變變變》3D 場景：一座黏土廚房流理台（木頭檯面、米白磁磚牆、一扇有太陽的窗），
// 加上十關會用到的黏土小東西，和一顆「放大鏡玻璃球」（球裡的小點點照冰／水／水蒸氣的樣子動）。
window.KIT = (() => {
  'use strict';
  const { T, clay, glass, mesh, box, ball, cyl } = K3;
  const C = {
    wood: 0xD9B48A, woodDark: 0xB98C5E, tile: 0xF6EEDF, grout: 0xE6DAC6, sky: 0xBFE3F2, sunY: 0xFFC24A,
    ice: 0xD8EEF7, water: 0x5CC3E8, deep: 0x2FA6D6, steam: 0xFFFFFF, white: 0xFFFBF4, red: 0xF05A3C, amber: 0xF2A33A,
    sage: 0x8FB38A, pink: 0xF4A7B0, brown: 0x8A5A3C, steel: 0xC9CED3, flame: 0xFF8A3D, cream: 0xFFF3DE, milk: 0xFFFDF7, soup: 0xE7A65A,
  };
  const M = {};
  const mat = (k, o) => M[k] || (M[k] = clay(C[k], o));
  const iceMat = () => M.iceGl || (M.iceGl = new T.MeshPhysicalMaterial({ color: C.ice, roughness: .25, transmission: 0, transparent: true, opacity: .82 }));
  const waterMat = () => M.waterGl || (M.waterGl = new T.MeshPhysicalMaterial({ color: C.water, roughness: .15, transparent: true, opacity: .78 }));

  // ---------- 廚房（一直都在） ----------
  function kitchen(scene) {
    const g = new T.Group();
    const top = box(44, .5, 7, mat('wood'), 0, -.25, 0); g.add(top);
    const edge = box(44, .25, .4, mat('woodDark'), 0, -.42, 3.55); g.add(edge);
    const wall = box(44, 14, .4, mat('tile'), 0, 7, -3.7); g.add(wall);
    const strip = box(44, .14, .1, mat('grout'), 0, 1.4, -3.45); g.add(strip);
    // 下面的櫥櫃：讓流理台站在地上，不是飄在空中
    const cab = box(44, 40, 6.4, mat('cream'), 0, -20.5, -.1); g.add(cab);
    [-11, -6.6, -2.2, 2.2, 6.6, 11].forEach(x => g.add(box(4.1, 5.6, .12, mat('tile'), x, -4.1, 3.12)));
    // 窗戶：木框＋天空＋太陽
    const win = new T.Group(); win.position.set(-3.2, 4.4, -3.45);
    win.add(box(4.6, 3.4, .12, mat('woodDark'), 0, 0, 0));
    const pane = mesh(new T.PlaneGeometry(4.1, 2.9), new T.MeshBasicMaterial({ color: C.sky }), 0, 0, .08); pane.receiveShadow = false; win.add(pane);
    const s = ball(.55, new T.MeshBasicMaterial({ color: C.sunY }), -1.2, .7, .12, 20); win.add(s);
    win.add(box(.12, 2.9, .1, mat('woodDark'), 0, 0, .12)); win.add(box(4.1, .12, .1, mat('woodDark'), 0, 0, .12));
    g.add(win);
    g.userData.sun = s;
    scene.add(g);
    g.traverse(o => { if (o.isMesh) { o.receiveShadow = true; o.castShadow = o !== top && o !== wall; } });
    return g;
  }

  // ---------- 放大鏡玻璃球：裡面 n 顆小點點 ----------
  // set({ solid: 0~1（排整齊）, energy: 0~1（動多快）, gas: 0~1（散滿整顆球）, ghost: 0~1（看不見） })
  function lens(r = 1, o = {}) {
    const g = new T.Group();
    const shell = new T.Mesh(new T.SphereGeometry(r, 24, 18), glass(0xEAF6FB, .28)); shell.renderOrder = 2; g.add(shell);
    const rim = new T.Mesh(new T.TorusGeometry(r * 1.01, r * .07, 10, 32), mat('amber', { roughness: .5 })); rim.rotation.y = Math.PI / 2; g.add(rim);
    const stem = cyl(r * .1, r * .14, r * .9, mat('woodDark'), 0, -r * 1.35, 0, 12); g.add(stem);
    const n = o.n || 18;
    const dm = new T.MeshStandardMaterial({ color: o.color || C.deep, roughness: .5, transparent: true, opacity: 1 });
    const dots = new T.InstancedMesh(new T.SphereGeometry(r * .11, 12, 8), dm, n); g.add(dots);
    const home = [];
    for (let i = 0; i < n; i++) { const a = i % 3, b = Math.floor(i / 3) % 3, c = Math.floor(i / 9); home.push(new T.Vector3((a - 1) * r * .32, (b - 1) * r * .32 - r * .05, (c - .5) * r * .32)); }
    const P = home.map(h => ({ p: h.clone(), v: new T.Vector3(Math.random() - .5, Math.random() - .5, Math.random() - .5).normalize() }));
    const st = { solid: 1, energy: .1, gas: 0, ghost: 0 }, want = Object.assign({ solid: 1, energy: .1, gas: 0, ghost: 0 }, o.state || {});
    Object.assign(st, want);
    const Mx = new T.Matrix4(), Q = new T.Quaternion(), Sv = new T.Vector3(1, 1, 1), tmp = new T.Vector3();
    g.userData.lens = {
      set(s) { Object.assign(want, s); },
      snap(s) { Object.assign(want, s); Object.assign(st, want); },
      get state() { return st; },
      step(dt, t) {
        for (const k in want) st[k] += (want[k] - st[k]) * Math.min(1, dt * 2.5);
        const sp = r * (.3 + st.energy * 2.2) * (1 + st.gas * 1.5), lim = r * (.78 - (1 - st.gas) * .1), floor = -r * .75;
        P.forEach((q, i) => {
          q.p.addScaledVector(q.v, sp * dt * (1 - st.solid));
          // 液體：往下沉一點、擠在一起；氣體：散滿整顆
          if (st.gas < .5) q.v.y -= dt * (1 - st.solid) * .8;
          if (q.p.length() > lim) { q.p.setLength(lim); q.v.copy(q.p).normalize().negate().add(tmp.set(Math.random() - .5, Math.random() - .5, Math.random() - .5).multiplyScalar(.9)).normalize(); }
          if (q.p.y < floor) { q.p.y = floor; q.v.y = Math.abs(q.v.y); }
          // 固體：被拉回整齊的位子，在原地輕輕抖
          const jit = .03 * r * (1 + st.energy * 3);
          const hx = home[i].x + Math.sin(t * 13 + i) * jit, hy = home[i].y + Math.cos(t * 11 + i * 2) * jit, hz = home[i].z + Math.sin(t * 9 + i * 3) * jit;
          q.p.x += (hx - q.p.x) * st.solid * Math.min(1, dt * 6); q.p.y += (hy - q.p.y) * st.solid * Math.min(1, dt * 6); q.p.z += (hz - q.p.z) * st.solid * Math.min(1, dt * 6);
          Sv.setScalar(1 - st.gas * .35);
          Mx.compose(q.p, Q, Sv); dots.setMatrixAt(i, Mx);
        });
        dots.instanceMatrix.needsUpdate = true;
        dm.opacity = 1 - st.ghost; dots.visible = st.ghost < .97;
      },
    };
    return g;
  }

  // ---------- 小東西 ----------
  function iceCube(s = 1) { const m = new T.Mesh(new T.BoxGeometry(s, s, s, 2, 2, 2), iceMat()); m.castShadow = true; const g = new T.Group(); g.add(m); const hi = box(s * .5, s * .05, s * .12, mat('white'), -s * .15, s * .5, s * .2); g.add(hi); return g; }
  function plate(r = 1.6) { return cyl(r, r * .85, .14, mat('white'), 0, .07, 0, 28); }
  function puddle(r = 1) { const m = cyl(r, r, .06, waterMat(), 0, .03, 0, 28); m.castShadow = false; return m; }
  function bottle() {
    const g = new T.Group();
    const body = new T.Mesh(new T.CylinderGeometry(.55, .55, 1.8, 24), glass(0xDDF1F8, .4)); body.position.y = .9; g.add(body);
    const neck = new T.Mesh(new T.CylinderGeometry(.25, .5, .5, 20), glass(0xDDF1F8, .4)); neck.position.y = 2.05; g.add(neck);
    const water = new T.Mesh(new T.CylinderGeometry(.5, .5, 1.5, 24), waterMat()); water.position.y = .78; g.add(water);
    g.userData.water = water; g.userData.body = body;
    return g;
  }
  function cup(h = 1.4, r = .65) {
    const g = new T.Group();
    const c = new T.Mesh(new T.CylinderGeometry(r, r * .85, h, 24, 1, true), glass(0xE6F4FA, .35)); c.position.y = h / 2; g.add(c);
    const b = cyl(r * .85, r * .85, .06, glass(0xE6F4FA, .5), 0, .03, 0); g.add(b);
    return g;
  }
  function popsicle(stage = 0) {
    // 0 剛拿出來、1 有點軟、2 滴水變小、3 一灘水＋木棒
    const g = new T.Group();
    const stick = box(.18, 1.1, .08, mat('wood'), 0, stage === 3 ? .1 : .5, 0); if (stage === 3) stick.rotation.z = Math.PI / 2 - .2; g.add(stick);
    if (stage < 3) {
      const k = [1, .8, .55][stage];
      const pop = new T.Mesh(new T.BoxGeometry(.7, 1.3 * k, .35, 2, 3, 1), mat('pink')); pop.position.y = 1 + .65 * k; pop.castShadow = true;
      if (stage >= 1) { const pos = pop.geometry.attributes.position; for (let i = 0; i < pos.count; i++) { const y = pos.getY(i); if (y > 0) pos.setX(i, pos.getX(i) * (1 - stage * .12)); } pos.needsUpdate = true; }
      g.add(pop);
    }
    if (stage >= 1) { const p = puddle([0, .3, .5, .8][stage]); p.material = mat('pink'); p.scale.y = .5; g.add(p); }
    return g;
  }
  function snowBall() { const g = new T.Group(); g.add(ball(.45, mat('white'), 0, .45, 0)); g.add(ball(.3, mat('white'), .3, .3, .2)); return g; }
  function raindrop() { const g = new T.Group(); g.add(ball(.38, waterMat(), 0, .4, 0)); const tip = new T.Mesh(new T.ConeGeometry(.36, .55, 20), waterMat()); tip.position.y = .85; g.add(tip); return g; }
  function soupBowl(smoke = false) {
    const g = new T.Group();
    g.add(cyl(.75, .5, .55, mat('white'), 0, .28, 0)); g.add(cyl(.66, .66, .05, mat('soup'), 0, .5, 0));
    if (smoke) [-.2, .15].forEach((x, i) => { const s = ball(.18, mat('white'), x, .9 + i * .3, 0, 12); s.scale.set(1, 1.4, 1); g.add(s); });
    return g;
  }
  function milkGlass() { const g = cup(1.1, .4); const m = cyl(.36, .32, .8, mat('milk'), 0, .42, 0); g.add(m); return g; }
  function pot() {
    const g = new T.Group();
    g.add(cyl(1.1, 1, 1.1, mat('steel', { roughness: .55, metalness: .2 }), 0, .55, 0, 28));
    [-1, 1].forEach(s => g.add(box(.5, .14, .2, mat('woodDark'), s * 1.3, .9, 0)));
    const w = cyl(1, 1, .05, waterMat(), 0, .95, 0, 28); g.add(w); g.userData.water = w;
    return g;
  }
  function stove() {
    const g = new T.Group();
    g.add(box(3.4, .3, 2.6, mat('steel', { roughness: .6 }), 0, .15, 0));
    g.add(cyl(.9, .9, .08, mat('woodDark'), 0, .34, -.1, 24));
    const knob = new T.Group(); knob.position.set(1.25, .3, 1.15);
    knob.add(cyl(.32, .32, .3, mat('red'), 0, .15, 0, 20)); knob.add(box(.08, .1, .3, mat('white'), 0, .32, .1));
    g.add(knob); g.userData.knob = knob;
    const fl = new T.Group(); fl.position.set(0, .38, -.1);
    for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2; const f = new T.Mesh(new T.ConeGeometry(.16, .5, 10), new T.MeshBasicMaterial({ color: i % 2 ? C.flame : C.amber })); f.position.set(Math.cos(a) * .55, .2, Math.sin(a) * .55); fl.add(f); }
    g.add(fl); g.userData.flame = fl;
    return g;
  }
  function flag(color = C.red) { const g = new T.Group(); g.add(cyl(.04, .04, 1.2, mat('woodDark'), 0, .6, 0, 8)); const f = new T.Mesh(new T.BufferGeometry().setFromPoints([new T.Vector3(0, 1.2, 0), new T.Vector3(.6, 1.02, 0), new T.Vector3(0, .84, 0)]), clay(color, { side: T.DoubleSide })); f.geometry.computeVertexNormals(); g.add(f); return g; }
  function clothes() {
    const g = new T.Group();
    [-1, 1].forEach(s => g.add(cyl(.05, .05, 1.6, mat('woodDark'), s * .9, .8, 0, 8)));
    g.add(cyl(.02, .02, 1.8, mat('woodDark'), 0, 1.55, 0, 6)).rotation.z = Math.PI / 2;
    const sh = box(.9, .8, .06, mat('sage'), 0, 1.1, 0); g.add(sh);
    return g;
  }
  function mirror() { const g = new T.Group(); g.add(box(1.3, 1.6, .1, mat('woodDark'), 0, 1, 0)); const m = box(1.1, 1.4, .05, clay(0xE9F2F5, { roughness: .4 }), 0, 1, .06); g.add(m); [-.25, .2, 0].forEach((x, i) => g.add(ball(.07, waterMat(), x, .7 + i * .3, .1, 10))); return g; }
  function freezer() { const g = new T.Group(); g.add(box(1.4, 1.5, 1.2, mat('white'), 0, .75, 0)); g.add(box(.08, .5, .1, mat('steel'), .5, 1.1, .62)); const tray = box(.9, .15, .5, iceMat(), 0, 1.55, 0); g.add(tray); return g; }
  function cloud(s = 1) { const g = new T.Group(); [[0, 0, 0, .55], [.5, -.05, 0, .42], [-.5, -.05, 0, .42], [.2, .3, 0, .4]].forEach(([x, y, z, r]) => g.add(ball(r * s, mat('white'), x * s, y * s, z, 16))); return g; }
  function sunBall(r = .7) { const g = new T.Group(); g.add(ball(r, new T.MeshBasicMaterial({ color: C.sunY }), 0, 0, 0, 20)); g.add(K3.S3.glow(0xFFC46B, r * 4, .55)); return g; }
  // 結冰的符號（小雪花）、變水蒸氣（小水窪＋往上的箭頭）、凝結（三顆水珠）：給連連看右邊用
  function snowflake() { const g = new T.Group(); for (let i = 0; i < 3; i++) { const b = box(.12, 1.1, .12, mat('ice'), 0, .7, 0); b.rotation.z = i * Math.PI / 3; g.add(b); } g.add(ball(.15, mat('white'), 0, .7, 0, 12)); return g; }
  function evap() { const g = new T.Group(); g.add(puddle(.6)); for (let i = 0; i < 3; i++) g.add(ball(.1 + i * .02, mat('white'), (i - 1) * .3, .45 + i * .25, 0, 10)); const a = new T.Mesh(new T.ConeGeometry(.2, .35, 12), mat('amber')); a.position.y = 1.35; g.add(a); return g; }
  function droplets() { const g = new T.Group(); [[-.3, .4], [.2, .7], [-.05, 1.05]].forEach(([x, y]) => { const d = ball(.2, waterMat(), x, y, 0, 14); d.scale.y = 1.3; g.add(d); }); return g; }

  return { C, M, mat, kitchen, lens, iceCube, plate, puddle, bottle, cup, popsicle, snowBall, raindrop, soupBowl, milkGlass, pot, stove, flag, clothes, mirror, freezer, cloud, sunBall, snowflake, evap, droplets, iceMat, waterMat };
})();
