// 《頌缽工坊》3D 場景：一張長長的黏土工作檯（左邊火爐、右邊冷水桶），缽沿著檯子一站一站往右。
// 頌缽用 LatheGeometry 轉出來（外面青銅色、裡面深一點）；字的積木用 canvas 寫字貼上去。
window.WS = (() => {
  'use strict';
  const { T, clay, glass, mesh, box, ball, cyl } = K3;
  const C = { bench: 0xB98C5E, benchD: 0x9A6B45, wall: 0xEFE3CE, bronze: 0xC9964A, bronzeIn: 0x9A6E36, dark: 0x3E342C, cushion: 0xC0392B, wood: 0xD9B48A, stick: 0x8A5A3C,
    rock: 0xA8A097, rock2: 0x8E867D, cu: 0xD07A4A, cuOre: 0x5FA67A, sn: 0xC9CCD0, snOre: 0x4A3E36, iron: 0x6E6A66, fire: 0xFF8A3D, fire2: 0xF2C14E, water: 0x5CC3E8, steel: 0xB8C0C6, white: 0xFFFBF4, cream: 0xFFF3DE, red: 0xC0392B };
  const M = {};
  const mat = (k, o) => M[k] || (M[k] = clay(C[k], o));

  // ---------- 工作檯（一直都在）：長長一條，後面一面牆 ----------
  function bench(scene) {
    const g = new T.Group();
    g.add(box(400, .5, 7, mat('bench'), 120, -.25, 0));
    g.add(box(400, 30, 6, mat('benchD'), 120, -15.6, .2));
    g.add(box(400, 14, .4, mat('wall'), 120, 6.5, -3.8));
    g.traverse(o => { if (o.isMesh) { o.receiveShadow = true; o.castShadow = false; } });
    scene.add(g);
    return g;
  }
  // ---------- 頌缽 ----------
  function bowl(r = 1.4, o = {}) {
    const g = new T.Group();
    const pts = []; for (let i = 0; i <= 12; i++) { const t = i / 12; pts.push(new T.Vector2(r * (.25 + .75 * Math.sin(t * Math.PI / 2)) * (t < .05 ? 0 : 1), r * .72 * (1 - Math.cos(t * Math.PI / 2)))); }
    pts[0].set(0, 0);
    const outer = new T.Mesh(new T.LatheGeometry(pts, 40), o.mat || clay(o.color || C.bronze, { roughness: .45, metalness: .35, side: T.DoubleSide }));
    outer.castShadow = outer.receiveShadow = true; g.add(outer);
    const rim = new T.Mesh(new T.TorusGeometry(r, r * .045, 8, 40), clay(o.color || C.bronze, { roughness: .4, metalness: .35 })); rim.rotation.x = Math.PI / 2; rim.position.y = r * .72; g.add(rim);
    g.userData = { r, h: r * .72, outer, rim };
    return g;
  }
  function cushion(r = 1.6) { const c = new T.Mesh(new T.TorusGeometry(r * .7, r * .3, 12, 28), mat('cushion')); c.rotation.x = Math.PI / 2; c.position.y = r * .3; c.castShadow = c.receiveShadow = true; const g = new T.Group(); g.add(c); return g; }
  function mallet() { const g = new T.Group(); g.add(cyl(.09, .09, 1.8, mat('stick'), 0, .9, 0, 10)); const h = cyl(.17, .17, .3, mat('cream'), 0, 1.8, 0, 12); g.add(h); return g; }
  // 波紋：一圈一圈往外的淡環
  function waves(r) { const g = new T.Group(); for (let i = 0; i < 3; i++) { const t = new T.Mesh(new T.TorusGeometry(r * (1.15 + i * .25), .03, 6, 40), new T.MeshBasicMaterial({ color: 0xF2C14E, transparent: true, opacity: 0, depthWrite: false })); t.rotation.x = Math.PI / 2; g.add(t); } return g; }
  // ---------- 字的積木 ----------
  const TEX = {};
  function glyph(ch, col = '#3E342C') {
    if (TEX[ch + col]) return TEX[ch + col];
    const c = document.createElement('canvas'); c.width = c.height = 256;
    const x = c.getContext('2d'); x.fillStyle = '#FFF3DE'; x.fillRect(0, 0, 256, 256);
    x.fillStyle = col; x.font = '700 190px "Noto Serif TC","Noto Sans TC",serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(ch, 128, 140);
    const t = new T.CanvasTexture(c); t.colorSpace = T.SRGBColorSpace; TEX[ch + col] = t; return t;
  }
  function tile(ch, w = 1.4) {
    const g = new T.Group();
    g.add(box(w, w, .3, mat('wood'), 0, w / 2, 0));
    const f = new T.Mesh(new T.PlaneGeometry(w * .86, w * .86), new T.MeshStandardMaterial({ map: glyph(ch), roughness: .9 })); f.position.set(0, w / 2, .16); g.add(f);
    return g;
  }
  // ---------- 礦石、金屬 ----------
  function rock(cracks = 0) { const g = new T.Group(); const r = new T.Mesh(new T.DodecahedronGeometry(.8, 0), mat('rock')); r.position.y = .7; r.scale.set(1.2, .9, 1); r.castShadow = true; g.add(r); for (let i = 0; i < cracks; i++) { const c = box(.06, .5, .05, mat('dark'), -.3 + i * .15, .8 + (i % 2) * .2, .75); c.rotation.z = (i % 2 ? -.6 : .5); g.add(c); } return g; }
  function ore(kind) { const g = new T.Group(); const col = kind === 'cu' ? 'cuOre' : kind === 'sn' ? 'snOre' : 'rock2'; [[-.3, .3, 0, .35], [.25, .3, .1, .3], [0, .5, -.1, .32]].forEach(([x, y, z, r]) => { const m = new T.Mesh(new T.DodecahedronGeometry(r, 0), mat(col)); m.position.set(x, y, z); m.castShadow = true; g.add(m); }); return g; }
  function ingot(kind) { const g = new T.Group(); const m = box(.9, .3, .45, mat(kind, { roughness: .4, metalness: .4 }), 0, .15, 0); g.add(m); return g; }
  function crucible(fill = 0, col = C.cu) {
    const g = new T.Group();
    const c = new T.Mesh(new T.CylinderGeometry(.75, .5, 1.1, 20, 1, true), mat('iron', { side: T.DoubleSide })); c.position.y = .55; c.castShadow = true; g.add(c);
    g.add(cyl(.5, .5, .06, mat('iron'), 0, .03, 0, 20));
    const liq = cyl(.7, .5, .02, new T.MeshStandardMaterial({ color: col, emissive: 0x000000, roughness: .5 }), 0, .1, 0, 20); g.add(liq);
    g.userData.set = (k, c2, glow = 0) => { liq.visible = k > .01; liq.position.y = .08 + k * .9; liq.scale.set(.75 + k * .3, 1, .75 + k * .3); if (c2 != null) liq.material.color.setHex(c2); liq.material.emissive.setHex(glow ? 0xFF7A20 : 0); liq.material.emissiveIntensity = glow; };
    g.userData.set(fill);
    return g;
  }
  function furnace() { const g = new T.Group(); g.add(cyl(1.4, 1.6, 1.4, mat('rock2'), 0, .7, 0, 20)); g.add(cyl(1.1, 1.1, .05, mat('dark'), 0, 1.42, 0, 20)); return g; }
  function flames() { const g = new T.Group(); for (let i = 0; i < 7; i++) { const a = i / 7 * Math.PI * 2; const f = new T.Mesh(new T.ConeGeometry(.2, .9, 8), new T.MeshBasicMaterial({ color: i % 2 ? C.fire : C.fire2 })); f.position.set(Math.cos(a) * .65, .45, Math.sin(a) * .65); g.add(f); } return g; }
  function bellows() { const g = new T.Group(); const bag = ball(.8, mat('wood'), 0, .7, 0, 16); bag.scale.set(1.2, .5, .9); g.add(bag); const top = box(1.8, .1, 1.1, mat('stick'), 0, 1.05, 0); g.add(top); g.add(box(1.8, .1, 1.1, mat('stick'), 0, .35, 0)); const n = new T.Mesh(new T.ConeGeometry(.15, .8, 10), mat('iron')); n.rotation.z = Math.PI / 2; n.position.set(-1.2, .7, 0); g.add(n); g.userData = { bag, top }; return g; }
  function mold() { const g = new T.Group(); g.add(box(2, .5, 2, mat('rock2'), 0, .25, 0)); const hole = cyl(.7, .7, .06, mat('dark'), 0, .51, 0, 24); g.add(hole); const line = new T.Mesh(new T.TorusGeometry(.7, .03, 6, 32), mat('white')); line.rotation.x = Math.PI / 2; line.position.y = .53; g.add(line); const liq = cyl(.68, .68, .02, new T.MeshStandardMaterial({ color: C.fire, emissive: 0xFF7A20, emissiveIntensity: .8 }), 0, .2, 0, 24); g.add(liq); g.userData.liq = liq; return g; }
  function anvil() { const g = new T.Group(); g.add(box(1.4, .8, 1, mat('iron'), 0, .4, 0)); g.add(box(2, .3, 1.2, mat('iron'), 0, .95, 0)); return g; }
  function disc() { const g = new T.Group(); const d = cyl(.9, .9, .25, new T.MeshStandardMaterial({ color: C.bronze, emissive: 0xFF5A10, emissiveIntensity: .6, roughness: .5 }), 0, .12, 0, 28); g.add(d); g.userData.d = d; return g; }
  function hammer() { const g = new T.Group(); g.add(cyl(.07, .07, 1.6, mat('stick'), 0, .8, 0, 8)); const h = box(.6, .35, .35, mat('iron'), 0, 1.6, 0); g.add(h); return g; }
  function bucket() { const g = new T.Group(); const b = new T.Mesh(new T.CylinderGeometry(1.2, 1, 1.4, 24, 1, true), mat('wood', { side: T.DoubleSide })); b.position.y = .7; b.castShadow = true; g.add(b); g.add(cyl(1, 1, .06, mat('wood'), 0, .03, 0, 24)); g.add(cyl(1.15, 1.15, .05, mat('water', { roughness: .3 }), 0, 1.2, 0, 24)); [.3, 1.1].forEach(y => { const r = new T.Mesh(new T.TorusGeometry(1.14 - y * .05, .04, 6, 28), mat('iron')); r.rotation.x = Math.PI / 2; r.position.y = y; g.add(r); }); return g; }
  function pitcher() { const g = new T.Group(); g.add(cyl(.45, .55, 1.1, mat('white'), 0, .55, 0, 18)); const sp = new T.Mesh(new T.ConeGeometry(.15, .4, 8), mat('white')); sp.rotation.z = -Math.PI / 2; sp.position.set(.55, 1, 0); g.add(sp); const h = new T.Mesh(new T.TorusGeometry(.3, .07, 6, 14, Math.PI), mat('white')); h.rotation.z = Math.PI / 2; h.position.set(-.5, .6, 0); g.add(h); return g; }
  return { C, M, mat, bench, bowl, cushion, mallet, waves, tile, rock, ore, ingot, crucible, furnace, flames, bellows, mold, anvil, disc, hammer, bucket, pitcher };
})();
