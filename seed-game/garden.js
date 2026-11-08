// 《種子小偵探》3D 場景：一條黏土花園小徑（草地、石板路），一關往右走一段。
// 果實（蘋果、芒果、松果，切開看得到種子）、花、蜜蜂、花盆、澆水壺、太陽、六種種子與六種樹、風、小溪、松鼠、蕨類…
window.GD = (() => {
  'use strict';
  const { T, clay, glass, mesh, box, ball, cyl } = K3;
  const C = {
    grass: 0xCFDDB0, path: 0xE8DCC8, stone: 0xDCCFB8, soil: 0x8A5A3C, soilD: 0x6E4630, trunk: 0x9A6B45, leaf: 0x6FA05A, leaf2: 0x8FB38A, dark: 0x3B3430,
    red: 0xE0533C, apple: 0xD9483A, flesh: 0xFFF1D6, mango: 0xF2B33A, mangoF: 0xFFD27A, pine: 0x9A6B45, petal: 0xF4A7B0, yellow: 0xF2C94C, white: 0xFFFBF4,
    sun: 0xFFC24A, blue: 0x3C9BE0, water: 0x5CC3E8, acorn: 0xB07A45, cap: 0x7A5A3C, coco: 0x8A5A3C, cocoF: 0xFFF6E6, maple: 0xD98A4A, fern: 0x5E8F4E, grey: 0xB8B0A6, cream: 0xFFF3DE,
  };
  const M = {};
  const mat = (k, o) => M[k] || (M[k] = clay(C[k], o));

  // ---------- 一直都在：草地＋石板小徑 ----------
  function ground(scene) {
    const g = new T.Group();
    g.add(box(400, .4, 60, mat('grass'), 120, -.2, 0));
    g.add(box(400, .06, 2.6, mat('path'), 120, .03, 3.8));
    g.traverse(o => { if (o.isMesh) { o.receiveShadow = true; o.castShadow = false; } });
    scene.add(g);
    return g;
  }

  // ---------- 果實：完整的、切開的（兩半往兩邊倒，中間看到種子） ----------
  function apple(open = false) {
    const g = new T.Group();
    if (!open) { const a = ball(.7, mat('apple'), 0, .7, 0, 22); a.scale.y = .92; g.add(a); g.add(cyl(.04, .05, .35, mat('trunk'), 0, 1.4, 0, 6)); const l = ball(.16, mat('leaf'), .18, 1.45, 0, 8); l.scale.set(1.4, .4, .8); g.add(l); return g; }
    [-1, 1].forEach(s => { const h = new T.Group(); const sk = new T.Mesh(new T.SphereGeometry(.7, 22, 14, 0, Math.PI), mat('apple')); sk.rotation.y = s > 0 ? Math.PI / 2 : -Math.PI / 2; h.add(sk); const f = new T.Mesh(new T.CircleGeometry(.66, 24), mat('flesh')); f.rotation.y = s > 0 ? -Math.PI / 2 : Math.PI / 2; f.position.x = s * .001; h.add(f); [-.12, .12].forEach(y => { const sd = ball(.07, mat('dark'), s * .02, y, .0, 8); sd.scale.set(.5, 1.2, .8); h.add(sd); }); h.position.set(s * .25, .7, 0); h.rotation.z = -s * .9; h.userData.side = s; g.add(h); });
    return g;
  }
  function mango(open = false) {
    const g = new T.Group();
    if (!open) { const m = ball(.75, mat('mango'), 0, .7, 0, 22); m.scale.set(1, .85, .72); g.add(m); return g; }
    [-1, 1].forEach(s => { const h = new T.Group(); const sk = new T.Mesh(new T.SphereGeometry(.72, 20, 14, 0, Math.PI), mat('mango')); sk.rotation.y = s > 0 ? Math.PI / 2 : -Math.PI / 2; sk.scale.set(.72, .85, 1); h.add(sk); const f = new T.Mesh(new T.CircleGeometry(.6, 24), mat('mangoF')); f.rotation.y = s > 0 ? -Math.PI / 2 : Math.PI / 2; f.scale.set(1, .85, 1); h.add(f); h.position.set(s * .3, .7, 0); h.rotation.z = -s * .9; g.add(h); });
    const pit = ball(.36, mat('cream'), 0, .55, 0, 16); pit.scale.set(.6, 1, .4); g.add(pit);
    return g;
  }
  function pinecone(open = false) {
    const g = new T.Group();
    const n = 5;
    for (let i = 0; i < n; i++) { const r = .45 * (1 - i / (n + 1)) + .1; const c = new T.Mesh(new T.ConeGeometry(r, .35, 10), mat('pine')); c.position.y = .25 + i * .26; c.rotation.x = Math.PI; c.scale.setScalar(open ? 1.25 : 1); g.add(c); }
    if (open) [[.4, .6], [-.38, .8], [.2, 1]].forEach(([x, y]) => { const s = ball(.08, mat('cream'), x, y, .2, 8); s.scale.set(1.3, .7, .5); g.add(s); });
    return g;
  }
  // ---------- 花、蜜蜂、小果實 ----------
  function flower(col = 'petal', h = 1.2) {
    const g = new T.Group();
    g.add(cyl(.05, .06, h, mat('leaf'), 0, h / 2, 0, 8));
    for (let i = 0; i < 5; i++) { const a = i / 5 * Math.PI * 2; const p = ball(.22, mat(col), Math.cos(a) * .25, h + .05, Math.sin(a) * .25, 10); p.scale.y = .4; g.add(p); }
    g.add(ball(.14, mat('yellow'), 0, h + .1, 0, 10));
    return g;
  }
  function bee() {
    const g = new T.Group();
    const b = ball(.22, mat('yellow'), 0, 0, 0, 12); b.scale.x = 1.4; g.add(b);
    g.add(box(.08, .3, .3, mat('dark'), .05, 0, 0)); g.add(box(.08, .3, .3, mat('dark'), -.12, 0, 0));
    [-1, 1].forEach(s => { const w = ball(.15, glass(0xFFFFFF, .7), 0, .18, s * .15, 8); w.scale.set(1, .3, .7); g.add(w); });
    return g;
  }
  function tinyFruit() { const g = flower('leaf2', 1); g.add(ball(.24, mat('leaf'), 0, 1.15, 0, 12)); return g; }
  // ---------- 種、長大 ----------
  function pot() { const g = new T.Group(); g.add(cyl(1.1, .8, 1, clay(0xC2693C), 0, .5, 0, 24)); g.add(cyl(1, 1, .08, mat('soil'), 0, 1.01, 0, 24)); return g; }
  function can() {
    const g = new T.Group();
    g.add(cyl(.4, .45, .7, mat('blue'), 0, .35, 0, 16));
    const sp = cyl(.06, .1, .9, mat('blue'), .6, .55, 0, 8); sp.rotation.z = -1; g.add(sp);
    const h = new T.Mesh(new T.TorusGeometry(.28, .06, 6, 14, Math.PI), mat('blue')); h.position.set(-.2, .75, 0); h.rotation.z = .3; g.add(h);
    return g;
  }
  function sun(r = .8) { const g = new T.Group(); g.add(ball(r, new T.MeshBasicMaterial({ color: C.sun }), 0, 0, 0, 20)); g.add(K3.S3.glow(0xFFC46B, r * 4, .6)); return g; }
  // 長成大樹：k 0～1（種子→根→芽→葉→樹苗→大樹）
  function growing() {
    const g = new T.Group();
    const seed = ball(.16, mat('acorn'), 0, .95, 0, 10); seed.scale.set(1, .8, .8); g.add(seed);
    const root = cyl(.03, .01, .5, mat('cream'), 0, .75, 0, 6); g.add(root);
    const trunk = cyl(.08, .14, 1, mat('trunk'), 0, 1.5, 0, 10); g.add(trunk);
    const crown = ball(.9, mat('leaf'), 0, 2.4, 0, 18); g.add(crown);
    const leaves = [-1, 1].map(s => { const l = ball(.14, mat('leaf2'), s * .15, 1.3, 0, 8); l.scale.set(1.4, .4, .8); g.add(l); return l; });
    g.userData.set = n => {             // n：0 種子睡在土裡 … 7 大樹
      seed.scale.setScalar(n >= 1 ? 1.3 : 1); seed.visible = n <= 3;
      root.visible = n >= 2; root.scale.y = n >= 2 ? 1 : .1;
      const h = [0, 0, 0, .25, .4, .6, .85, 1][n] || 0;
      trunk.visible = n >= 3; trunk.scale.set(.4 + h * .6, Math.max(.01, h), .4 + h * .6); trunk.position.y = .95 + h * .5;
      leaves.forEach(l => { l.visible = n >= 4 && n < 7; l.position.y = .95 + h + .05; });
      crown.visible = n >= 6; crown.scale.setScalar(n >= 7 ? 1.4 : .6); crown.position.y = .95 + h + (n >= 7 ? 1.1 : .5);
    };
    g.userData.set(0);
    return g;
  }
  // ---------- 六種種子、六種樹 ----------
  function acorn(s = 1) { const g = new T.Group(); const b = ball(.3 * s, mat('acorn'), 0, .32 * s, 0, 14); b.scale.y = 1.2; g.add(b); const c = ball(.32 * s, mat('cap'), 0, .55 * s, 0, 14); c.scale.y = .5; g.add(c); g.add(cyl(.03 * s, .03 * s, .15 * s, mat('cap'), 0, .72 * s, 0, 6)); return g; }
  function samara(s = 1) { const g = new T.Group(); g.add(ball(.15 * s, mat('maple'), 0, .2 * s, 0, 10)); const w = ball(.4 * s, mat('maple'), .35 * s, .25 * s, 0, 12); w.scale.set(1.3, .12, .5); g.add(w); return g; }
  function coconut(s = 1) { const g = new T.Group(); const c = ball(.5 * s, mat('coco'), 0, .5 * s, 0, 16); c.scale.y = .9; g.add(c); return g; }
  function appleSeed(s = 1) { const g = new T.Group(); const a = ball(.18 * s, mat('dark'), 0, .2 * s, 0, 10); a.scale.set(.7, 1.2, .6); g.add(a); return g; }
  function mangoPit(s = 1) { const g = new T.Group(); const a = ball(.4 * s, mat('cream'), 0, .3 * s, 0, 14); a.scale.set(1.3, .5, .8); g.add(a); return g; }
  const SEED = { oak: acorn, pine: s => { const g = pinecone(); g.scale.setScalar(.6 * (s || 1)); return g; }, maple: samara, coconut, mango: mangoPit, apple: appleSeed };
  function tree(kind, h = 1) {
    const g = new T.Group();
    if (kind === 'pine') { g.add(cyl(.12, .18, 1, mat('trunk'), 0, .5, 0, 8)); [0, 1, 2].forEach(i => { const c = new T.Mesh(new T.ConeGeometry(1 - i * .25, 1.1, 12), mat('leaf')); c.position.y = 1.2 + i * .65; c.castShadow = true; g.add(c); }); }
    else if (kind === 'coconut') { const t = cyl(.12, .18, 2.6, mat('trunk'), 0, 1.3, 0, 8); t.rotation.z = .15; g.add(t); for (let i = 0; i < 5; i++) { const a = i / 5 * Math.PI * 2; const l = ball(.6, mat('leaf'), Math.cos(a) * .6 - .2, 2.6, Math.sin(a) * .6, 10); l.scale.set(1.4, .2, .45); l.rotation.y = -a; g.add(l); } g.add(ball(.18, mat('coco'), -.15, 2.4, .1, 10)); }
    else {
      g.add(cyl(.14, .2, 1.4, mat('trunk'), 0, .7, 0, 8));
      const col = kind === 'maple' ? 'maple' : 'leaf';
      g.add(ball(1, mat(col), 0, 1.9, 0, 18));
      if (kind === 'apple') [[.5, 1.7, .6], [-.5, 2.1, .5], [.1, 2.4, .7]].forEach(([x, y, z]) => g.add(ball(.15, mat('apple'), x, y, z, 10)));
      if (kind === 'mango') [[.5, 1.6, .6], [-.4, 1.9, .6]].forEach(([x, y, z]) => { const m = ball(.17, mat('mango'), x, y, z, 10); m.scale.y = 1.3; g.add(m); });
      if (kind === 'oak') g.add(ball(.7, mat('leaf2'), .7, 1.6, .2, 14));
    }
    g.scale.setScalar(h);
    return g;
  }
  // ---------- 旅行的幫手：風（一團轉圈的風）、水（一條小溪）、松鼠 ----------
  function wind() { const g = new T.Group(); for (let i = 0; i < 3; i++) { const t = new T.Mesh(new T.TorusGeometry(.35 + i * .2, .05, 6, 24, Math.PI * 1.4), mat('white')); t.rotation.x = Math.PI / 2; t.rotation.z = i; t.position.y = .8 + i * .25; g.add(t); } return g; }
  function stream() { const g = new T.Group(); const s = box(2.4, .06, 1.4, mat('water', { roughness: .3 }), 0, .04, 0); g.add(s); [[-.6, .3], [.5, -.3]].forEach(([x, z]) => g.add(box(.5, .02, .06, mat('white'), x, .08, z))); return g; }
  function squirrel() {
    const g = new T.Group();
    const b = ball(.35, mat('maple'), 0, .45, 0, 14); b.scale.y = 1.2; g.add(b);
    g.add(ball(.25, mat('maple'), .15, .95, 0, 12));
    [-1, 1].forEach(s => g.add(ball(.07, mat('maple'), .15, 1.18, s * .12, 8)));
    g.add(ball(.04, mat('dark'), .36, 1, .1, 6));
    const t = ball(.35, mat('maple'), -.4, .8, 0, 12); t.scale.set(.6, 1.4, .6); g.add(t);
    return g;
  }
  // ---------- 加碼關：蕨類（孢子）、花 ----------
  function fern() { const g = new T.Group(); for (let i = 0; i < 4; i++) { const a = i / 4 * Math.PI * 2; const f = ball(.5, mat('fern'), Math.cos(a) * .35, .5, Math.sin(a) * .35, 10); f.scale.set(.3, 1.2, .3); f.rotation.z = Math.cos(a) * .6; f.rotation.x = -Math.sin(a) * .6; g.add(f); } [[.3, 1, .2], [-.2, 1.1, -.2], [0, 1.3, .1]].forEach(([x, y, z]) => g.add(ball(.05, mat('cap'), x, y, z, 6))); return g; }
  function slotDisc(col = 'stone') { return cyl(.7, .7, .08, mat(col), 0, .04, 0, 20); }

  return { C, M, mat, ground, apple, mango, pinecone, flower, bee, tinyFruit, pot, can, sun, growing, acorn, samara, coconut, appleSeed, mangoPit, SEED, tree, wind, stream, squirrel, fern, slotDisc };
})();
