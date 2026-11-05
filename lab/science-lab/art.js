// 《試試看實驗室》的模型與圖示：3D 全部用 three.js 基本幾何拼（霧面黏土），卡片圖示是手寫 SVG（沒有外部圖、沒有表情符號）。
// 顏色：主色天藍（水、玻璃）；假設＝琥珀、實驗＝天藍、結果＝草綠；「現在這一步」一律珊瑚紅。
window.ART = (() => {
  'use strict';
  const T = THREE;
  const C = {
    bg: 0xF7F0E4, ground: 0xF3E9D8, paper: 0xFFF8EE, cream: 0xF1E4CF, cream2: 0xD9C8AF,
    coral: 0xF05A3C, sky: 0x3C9BE0, amber: 0xF2A33A, yellow: 0xF7C948, green: 0x4CB05A,
    sage: 0x6F9A72, sage2: 0xA9C4A3, leaf: 0x8DB487, purple: 0x8B6FD6,
    wood: 0xD9B27A, woodDark: 0xB98E5A, ink: 0x3B3430, stone: 0x9C948A, iron: 0x6E6A66, alu: 0xC9CDD1,
    water: 0x9CCFE6, glass: 0xDCEFF5, orange: 0xF29A3A, apple: 0xE0533C, grape: 0x7A5BB0,
  };
  const std = (color, o = {}) => new T.MeshStandardMaterial(Object.assign({ color, roughness: .86, metalness: 0 }, o));
  const clay = color => S3.clay({ color });
  const M = {
    cream: clay(C.cream), cream2: clay(C.cream2), coral: clay(C.coral), sky: clay(C.sky), amber: clay(C.amber),
    yellow: clay(C.yellow), green: clay(C.green), sage: clay(C.sage), sage2: clay(C.sage2), leaf: clay(C.leaf),
    wood: std(C.wood, { roughness: .9 }), woodDark: std(C.woodDark, { roughness: .9 }), ink: std(C.ink),
    paper: std(C.paper, { roughness: .92 }), ground: std(C.ground, { roughness: .95 }),
    stone: clay(C.stone), iron: std(C.iron, { roughness: .6 }), alu: std(C.alu, { roughness: .5 }),
    orange: clay(C.orange), apple: clay(C.apple), grape: clay(C.grape), purple: clay(C.purple),
    water: std(0x7FC0E2, { roughness: .35, transparent: true, opacity: .5, depthWrite: false }),
    glass: std(C.glass, { roughness: .2, transparent: true, opacity: .16, depthWrite: false, side: T.DoubleSide }),
    white: std(0xFFFFFF, { roughness: .5 }),
  };
  const mesh = (geo, m, x = 0, y = 0, z = 0) => { const o = new T.Mesh(geo, m); o.position.set(x, y, z); o.castShadow = true; o.receiveShadow = true; return o; };
  function roundRect(w, h, r) {
    const s = new T.Shape(), x = -w / 2, y = -h / 2;
    s.moveTo(x + r, y); s.lineTo(x + w - r, y); s.quadraticCurveTo(x + w, y, x + w, y + r);
    s.lineTo(x + w, y + h - r); s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    s.lineTo(x + r, y + h); s.quadraticCurveTo(x, y + h, x, y + h - r);
    s.lineTo(x, y + r); s.quadraticCurveTo(x, y, x + r, y);
    return s;
  }
  // 圓角方塊（中心在原點）
  function rbox(w, h, d, r = .12, bevel = .05) {
    const g = new T.ExtrudeGeometry(roundRect(w, d, Math.max(.01, Math.min(r, w / 2 - .01, d / 2 - .01))), { depth: Math.max(.01, h - bevel * 2), bevelEnabled: true, bevelThickness: bevel, bevelSize: bevel, bevelSegments: 2, curveSegments: 6 });
    g.rotateX(-Math.PI / 2); g.translate(0, -h / 2 + bevel, 0);
    return g;
  }
  const box = (w, h, d, m, x, y, z, r = .06) => mesh(rbox(w, h, d, r, Math.min(.04, h / 4, w / 4, d / 4)), m, x, y, z);
  const ball = (r, m, x, y, z, seg = 18) => mesh(new T.SphereGeometry(r, seg, Math.round(seg * .7)), m, x, y, z);
  const cyl = (r0, r1, h, m, x, y, z, seg = 20) => mesh(new T.CylinderGeometry(r0, r1, h, seg), m, x, y, z);

  // ---------- 桌子：米色桌面＋木頭收邊 ----------
  function table(r) {
    const g = new T.Group();
    g.add(mesh(new T.CylinderGeometry(r + .5, r + .8, .8, 72), M.woodDark, 0, -.42, 0));
    g.add(mesh(new T.CylinderGeometry(r, r, .06, 72), M.ground, 0, -.03, 0));
    g.add(mesh(new T.TorusGeometry(r + .25, .28, 10, 96).rotateX(Math.PI / 2), M.wood, 0, -.02, 0));
    return g;
  }
  // 數字牌
  const numTex = {};
  function numberTex(n) {
    if (numTex[n]) return numTex[n];
    const c = document.createElement('canvas'); c.width = c.height = 128;
    const x = c.getContext('2d');
    x.fillStyle = '#FFF8EE'; x.beginPath(); x.arc(64, 64, 62, 0, 7); x.fill();
    x.fillStyle = '#3B3430'; x.font = '700 72px "Avenir Next","Helvetica Neue",system-ui,sans-serif';
    x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(String(n), 64, 70);
    const t = new T.CanvasTexture(c); t.colorSpace = T.SRGBColorSpace; t.anisotropy = 4;
    numTex[n] = t; return t;
  }
  function numberPlate(n) {
    const g = new T.Group();
    g.add(mesh(new T.CylinderGeometry(.34, .36, .08, 28), M.wood, 0, .04, 0));
    const f = new T.Mesh(new T.CircleGeometry(.3, 28), new T.MeshStandardMaterial({ map: numberTex(n), roughness: .9 }));
    f.rotation.x = -Math.PI / 2; f.position.y = .085; g.add(f);
    return g;
  }
  // 光暈：一張圓環貼圖
  let ringTex = null;
  function haloTex() {
    if (ringTex) return ringTex;
    const c = document.createElement('canvas'); c.width = c.height = 128;
    const x = c.getContext('2d'), g = x.createRadialGradient(64, 64, 20, 64, 64, 62);
    g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(.55, 'rgba(255,255,255,.9)');
    g.addColorStop(.7, 'rgba(255,255,255,.55)'); g.addColorStop(1, 'rgba(255,255,255,0)');
    x.fillStyle = g; x.fillRect(0, 0, 128, 128);
    ringTex = new T.CanvasTexture(c);
    return ringTex;
  }
  function halo(size = 1, color = C.coral) {
    const s = new T.Sprite(new T.SpriteMaterial({ map: haloTex(), color, transparent: true, opacity: 0, depthTest: false, depthWrite: false }));
    s.scale.set(size, size, 1); s.renderOrder = 10;
    return s;
  }
  function floorRing(r0 = .42, r1 = .56, color = C.coral, op = 0) {
    const m = new T.Mesh(new T.RingGeometry(r0, r1, 40), new T.MeshBasicMaterial({ color, transparent: true, opacity: op, depthWrite: false }));
    m.rotation.x = -Math.PI / 2;
    return m;
  }

  // ---------- 小東西（實驗用，也拿來當桌上的小道具） ----------
  function apple(s = 1) {
    const g = new T.Group();
    const b = ball(.32 * s, M.apple, 0, 0, 0, 20); b.scale.set(1, .9, 1); g.add(b);
    g.add(cyl(.02 * s, .025 * s, .16 * s, M.woodDark, 0, .32 * s, 0, 6));
    const l = ball(.07 * s, M.leaf, .07 * s, .34 * s, 0, 8); l.scale.set(1.6, .4, 1); g.add(l);
    return g;
  }
  function grape(s = 1) {
    const g = new T.Group();
    [[0, 0, 0], [.14, .05, .05], [-.13, .04, -.03], [0, .14, -.02], [.06, -.12, .06], [-.07, -.1, -.06]].forEach(([x, y, z]) => g.add(ball(.1 * s, M.grape, x * s, y * s, z * s, 12)));
    g.add(cyl(.015 * s, .015 * s, .14 * s, M.woodDark, 0, .25 * s, 0, 6));
    return g;
  }
  function stone(s = 1) { const g = new T.Group(); const m = ball(.24 * s, M.stone, 0, 0, 0, 12); m.scale.set(1.25, .75, 1); m.rotation.z = .3; g.add(m); return g; }
  function woodBlock(s = 1) { const g = new T.Group(); g.add(box(.5 * s, .32 * s, .36 * s, M.wood, 0, 0, 0)); return g; }
  function orange(s = 1, peeled = false) {
    const g = new T.Group();
    const flesh = ball(.27 * s, clay(0xF6B860), 0, 0, 0, 20); g.add(flesh);
    [0, 1, 2, 3, 4, 5].forEach(k => { const seg = new T.Mesh(new T.TorusGeometry(.27 * s, .006 * s, 4, 24, Math.PI), std(0xF9D9A0)); seg.rotation.y = k * Math.PI / 6; flesh.add(seg); });
    const peel = ball(.32 * s, M.orange, 0, 0, 0, 22); g.add(peel);
    const top = ball(.04 * s, M.leaf, 0, .32 * s, 0, 8); peel.add(top);
    peel.visible = !peeled;
    g.userData = { peel, flesh };
    return g;
  }
  function clip(s = 1) {
    const g = new T.Group(), m = M.alu;
    const t1 = mesh(new T.TorusGeometry(.12 * s, .022 * s, 6, 18, Math.PI), m, .14 * s, 0, 0); t1.rotation.z = -Math.PI / 2; g.add(t1);
    const t2 = mesh(new T.TorusGeometry(.08 * s, .022 * s, 6, 14, Math.PI), m, -.16 * s, .02 * s, 0); t2.rotation.z = Math.PI / 2; g.add(t2);
    [[.12, 0, .3], [-.1, -.04, .26], [0, .08, .26]].forEach(([y, x, l], i) => { const c = mesh(new T.CylinderGeometry(.022 * s, .022 * s, l * s, 6), m, x * s, (i === 0 ? .12 : i === 1 ? -.12 : .06) * s, 0); c.rotation.z = Math.PI / 2; g.add(c); });
    g.rotation.x = -Math.PI / 2;
    const w = new T.Group(); w.add(g); return w;
  }
  function nail(s = 1) {
    const g = new T.Group();
    const sh = mesh(new T.CylinderGeometry(.03 * s, .03 * s, .62 * s, 8), M.iron, 0, 0, 0); sh.rotation.z = Math.PI / 2; g.add(sh);
    const hd = mesh(new T.CylinderGeometry(.08 * s, .08 * s, .03 * s, 14), M.iron, -.31 * s, 0, 0); hd.rotation.z = Math.PI / 2; g.add(hd);
    const tp = mesh(new T.ConeGeometry(.03 * s, .08 * s, 8), M.iron, .35 * s, 0, 0); tp.rotation.z = -Math.PI / 2; g.add(tp);
    return g;
  }
  function spoon(s = 1, m = M.wood) {
    const g = new T.Group();
    const h = mesh(new T.CylinderGeometry(.035 * s, .045 * s, .5 * s, 8), m, -.2 * s, 0, 0); h.rotation.z = Math.PI / 2; g.add(h);
    const b = ball(.13 * s, m, .14 * s, 0, 0, 14); b.scale.set(1.2, .35, .9); g.add(b);
    return g;
  }
  function eraser(s = 1) { const g = new T.Group(); g.add(box(.42 * s, .16 * s, .24 * s, clay(0xF2B8C0), 0, 0, 0)); g.add(box(.18 * s, .17 * s, .25 * s, M.sky, .13 * s, 0, 0)); return g; }
  function can(s = 1, m = M.alu, band = M.sky) {
    const g = new T.Group();
    g.add(cyl(.18 * s, .18 * s, .48 * s, m, 0, 0, 0));
    g.add(cyl(.185 * s, .185 * s, .2 * s, band, 0, 0, 0));
    g.add(cyl(.15 * s, .17 * s, .03 * s, m, 0, .25 * s, 0));
    return g;
  }
  function coin(s = 1) {
    const g = new T.Group();
    g.add(cyl(.2 * s, .2 * s, .05 * s, std(0xD8D6CC, { roughness: .45 }), 0, 0, 0, 24));
    g.add(mesh(new T.TorusGeometry(.17 * s, .012 * s, 4, 24).rotateX(Math.PI / 2), std(0xBDBAB0, { roughness: .5 }), 0, .027 * s, 0));
    return g;
  }
  const cupM = std(0xD5ECF5, { roughness: .15, transparent: true, opacity: .42, depthWrite: false, side: T.DoubleSide });
  function cup(r = .5, h = 1.1, m = cupM) {
    const g = new T.Group();
    const wall = mesh(new T.CylinderGeometry(r, r * .9, h, 28, 1, true), m, 0, h / 2, 0); wall.castShadow = false; g.add(wall);
    const bot = mesh(new T.CylinderGeometry(r * .9, r * .9, .05, 28), m, 0, .025, 0); bot.castShadow = false; g.add(bot);
    g.userData = { wall, r, h };
    return g;
  }
  function towel(w = 1.6, d = 1, color = C.sage2) {
    const g = new T.Group();
    g.add(box(w, .08, d, clay(color), 0, .04, 0, .1));
    [-1, 1].forEach(s => g.add(box(.06, .085, d * .96, clay(0xFFF8EE), s * (w / 2 - .12), .045, 0, .02)));
    return g;
  }
  function flashlight() {
    const g = new T.Group();
    const b = mesh(new T.CylinderGeometry(.16, .16, .7, 16), M.sky, 0, 0, 0); b.rotation.z = Math.PI / 2; g.add(b);
    const h = mesh(new T.CylinderGeometry(.26, .17, .26, 18), M.sky, .44, 0, 0); h.rotation.z = Math.PI / 2; g.add(h);
    const lens = mesh(new T.CylinderGeometry(.23, .23, .03, 18), std(0xFFF4C8, { emissive: new T.Color(0xFFE7A8), emissiveIntensity: .2 }), .58, 0, 0); lens.rotation.z = Math.PI / 2; g.add(lens);
    g.add(box(.12, .06, .1, M.coral, -.05, .17, 0, .02));
    g.userData = { lens };
    return g;
  }
  function puppet() {
    const g = new T.Group();
    g.add(cyl(.22, .26, .1, M.woodDark, 0, .05, 0));
    g.add(mesh(new T.CapsuleGeometry(.2, .45, 4, 12), M.coral, 0, .5, 0));
    g.add(ball(.2, M.cream, 0, 1.05, 0, 16));
    return g;
  }
  function magnet() {
    const g = new T.Group();
    const arc = mesh(new T.TorusGeometry(.32, .12, 10, 24, Math.PI), M.coral, 0, 0, 0); arc.rotation.x = -Math.PI / 2; arc.rotation.z = Math.PI; g.add(arc);
    [-1, 1].forEach(s => {
      g.add(mesh(new T.CylinderGeometry(.12, .12, .3, 14).rotateX(Math.PI / 2), M.coral, s * .32, 0, .15));
      g.add(mesh(new T.CylinderGeometry(.122, .122, .14, 14).rotateX(Math.PI / 2), M.white, s * .32, 0, .36));
    });
    return g;
  }
  function car(big = false) {
    const s = big ? 1.4 : 1, g = new T.Group();
    g.add(box(.7 * s, .24 * s, .42 * s, big ? M.purple : M.amber, 0, .22 * s, 0, .1));
    g.add(box(.36 * s, .2 * s, .36 * s, M.cream, -.04 * s, .42 * s, 0, .08));
    const wh = [];
    [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([sx, sz]) => { const w = mesh(new T.CylinderGeometry(.11 * s, .11 * s, .07 * s, 14).rotateX(Math.PI / 2), M.ink, sx * .22 * s, .11 * s, sz * .22 * s); g.add(w); wh.push(w); });
    g.userData = { wh, s };
    return g;
  }
  function block() { return box(.36, .22, .3, M.wood, 0, .11, 0, .04); }
  function calendar() {
    const g = new T.Group();
    g.add(box(.9, 1.1, .1, M.paper, 0, .55, 0, .06));
    g.add(box(.9, .22, .12, M.coral, 0, 1.02, 0, .05));
    return g;
  }
  function pot() {
    const g = new T.Group();
    g.add(cyl(.5, .38, .55, clay(0xC97B55), 0, .275, 0, 22));
    g.add(cyl(.46, .46, .04, clay(0xFFF8EE), 0, .53, 0, 22));   // 棉花
    return g;
  }
  function sprout() {      // 一株綠豆苗：莖＋兩片子葉（形狀由 grow() 調）
    const g = new T.Group();
    const stem = mesh(new T.CylinderGeometry(.03, .04, 1, 6), clay(0xEFE6B8), 0, .5, 0); g.add(stem);
    const leaves = [-1, 1].map(s => { const l = ball(.1, clay(0x8DB487), s * .08, 1, 0, 10); l.scale.set(1.4, .35, .9); g.add(l); return l; });
    const bean = ball(.07, clay(0x6E9A4E), 0, .03, 0, 10); g.add(bean);
    g.userData = { stem, leaves, bean };
    return g;
  }
  function bookProp() {
    const g = new T.Group();
    g.add(box(1.5, .2, 1.1, M.sky, 0, .1, 0, .08));
    g.add(box(1.4, .08, 1.0, M.paper, .02, .22, 0, .05));
    g.add(box(.1, .22, 1.12, clay(0x2F7FC0), -.72, .11, 0, .03));
    g.add(box(.6, .02, .14, M.coral, .25, .27, .3, .03));
    return g;
  }
  function boatFoil(kind) {
    const m = std(0xD6DADF, { roughness: .45 });
    const g = new T.Group();
    if (kind === 0) { const b = ball(.32, m, 0, .2, 0, 10); b.scale.set(1, .85, 1); g.add(b); }
    else if (kind === 1) { g.add(box(1.5, .1, .4, m, 0, .05, 0, .04)); [-1, 1].forEach(s => g.add(box(1.5, .28, .05, m, 0, .17, s * .2, .02))); [-1, 1].forEach(s => g.add(box(.05, .28, .42, m, s * .74, .17, 0, .02))); }
    else { g.add(box(1.4, .08, 1.4, m, 0, .04, 0, .06)); [-1, 1].forEach(s => g.add(box(1.4, .22, .05, m, 0, .14, s * .68, .02))); [-1, 1].forEach(s => g.add(box(.05, .22, 1.4, m, s * .68, .14, 0, .02))); }
    return g;
  }

  // ---------- SVG 圖示（卡片、記錄本、總結） ----------
  const sv = (inner, vb = '0 0 64 64') => '<svg viewBox="' + vb + '" aria-hidden="true">' + inner + '</svg>';
  const W = '<rect x="4" y="34" width="56" height="26" rx="6" fill="#BFE0EE"/><path d="M4 36q7-4 14 0t14 0 14 0 14 0" fill="none" stroke="#7FBBD6" stroke-width="2"/>';
  const SVG = {
    apple: '<circle cx="32" cy="36" r="17" fill="#E0533C"/><path d="M32 20v-7" stroke="#B98E5A" stroke-width="3" stroke-linecap="round"/><ellipse cx="40" cy="15" rx="7" ry="3.5" fill="#8DB487"/>',
    grape: '<g fill="#7A5BB0"><circle cx="26" cy="26" r="7"/><circle cx="39" cy="26" r="7"/><circle cx="32" cy="37" r="7"/><circle cx="20" cy="38" r="6"/><circle cx="44" cy="38" r="6"/><circle cx="32" cy="49" r="6"/></g><path d="M32 19v-8" stroke="#B98E5A" stroke-width="3" stroke-linecap="round"/>',
    stone: '<ellipse cx="32" cy="38" rx="20" ry="13" fill="#9C948A"/><ellipse cx="26" cy="33" rx="7" ry="3" fill="#B7B0A6"/>',
    wood: '<rect x="13" y="24" width="38" height="24" rx="4" fill="#D9B27A"/><path d="M18 31h26M18 38h20" stroke="#B98E5A" stroke-width="2" stroke-linecap="round"/>',
    orange: '<circle cx="32" cy="36" r="18" fill="#F29A3A"/><circle cx="32" cy="18" r="3" fill="#8DB487"/><g fill="#F8B866"><circle cx="25" cy="31" r="1.5"/><circle cx="38" cy="40" r="1.5"/><circle cx="30" cy="45" r="1.5"/></g>',
    peeled: '<circle cx="32" cy="36" r="15" fill="#F6B860"/><path d="M32 21v30M19 28l26 16M19 44l26-16" stroke="#F9D9A0" stroke-width="2"/><path d="M6 54q8-6 14 0" fill="none" stroke="#F29A3A" stroke-width="5" stroke-linecap="round"/>',
    clip: '<path d="M22 46V20a8 8 0 0 1 16 0v26a5 5 0 0 1-10 0V24" fill="none" stroke="#8C9298" stroke-width="3.6" stroke-linecap="round"/>',
    nail: '<rect x="12" y="29" width="34" height="6" rx="2" fill="#6E6A66"/><rect x="9" y="24" width="5" height="16" rx="2" fill="#6E6A66"/><path d="M46 29l9 3-9 3z" fill="#6E6A66"/>',
    spoon: '<rect x="8" y="29" width="30" height="6" rx="3" fill="#D9B27A"/><ellipse cx="46" cy="32" rx="11" ry="8" fill="#D9B27A"/>',
    eraser: '<rect x="12" y="24" width="40" height="18" rx="4" fill="#F2B8C0"/><rect x="38" y="24" width="14" height="18" rx="3" fill="#3C9BE0"/>',
    alcan: '<rect x="20" y="12" width="24" height="42" rx="6" fill="#C9CDD1"/><rect x="20" y="24" width="24" height="16" fill="#3C9BE0"/><rect x="25" y="9" width="14" height="4" rx="2" fill="#AEB3B8"/>',
    tin: '<rect x="18" y="14" width="28" height="38" rx="4" fill="#8E8A86"/><rect x="18" y="24" width="28" height="18" fill="#F2A33A"/><path d="M18 18h28M18 48h28" stroke="#6E6A66" stroke-width="2"/>',
    coin: '<circle cx="32" cy="32" r="18" fill="#D8D6CC"/><circle cx="32" cy="32" r="14" fill="none" stroke="#BDBAB0" stroke-width="2"/>',
    sugar: '<ellipse cx="32" cy="50" rx="22" ry="6" fill="#E8DDCB"/><g fill="#fff" stroke="#B98E5A" stroke-width="2"><rect x="16" y="30" width="14" height="14" rx="2"/><rect x="34" y="30" width="14" height="14" rx="2"/><rect x="25" y="15" width="14" height="14" rx="2"/></g>',
    salt: '<ellipse cx="32" cy="46" rx="22" ry="7" fill="#E8DDCB"/><g fill="#fff" stroke="#B98E5A" stroke-width="1.6"><rect x="16" y="30" width="6" height="6"/><rect x="26" y="24" width="6" height="6"/><rect x="36" y="32" width="6" height="6"/><rect x="44" y="24" width="6" height="6"/><rect x="22" y="40" width="6" height="6"/><rect x="34" y="42" width="6" height="6"/></g>',
    sand: '<path d="M10 48q22-26 44 0z" fill="#E8C99A"/><g fill="#C9A66E"><circle cx="24" cy="42" r="1.6"/><circle cx="32" cy="36" r="1.6"/><circle cx="40" cy="43" r="1.6"/><circle cx="30" cy="45" r="1.6"/></g>',
    pebble: '<ellipse cx="22" cy="40" rx="9" ry="6" fill="#9C948A"/><ellipse cx="40" cy="38" rx="10" ry="7" fill="#B0A89E"/><ellipse cx="32" cy="28" rx="7" ry="5" fill="#8A837A"/>',
    float: W + '<circle cx="32" cy="32" r="10" fill="#F2A33A"/><path d="M32 6v10M27 11l5-5 5 5" stroke="#3B3430" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/>',
    sink: W + '<circle cx="32" cy="53" r="6" fill="#F2A33A"/><path d="M32 14v18M27 27l5 5 5-5" stroke="#3B3430" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/>',
    magYes: '<path d="M14 14v18a18 18 0 0 0 36 0V14h-10v18a8 8 0 0 1-16 0V14z" fill="#F05A3C"/><rect x="14" y="10" width="10" height="7" fill="#fff"/><rect x="40" y="10" width="10" height="7" fill="#fff"/><circle cx="32" cy="58" r="4" fill="#6E6A66"/><path d="M32 52v-6" stroke="#3B3430" stroke-width="2.6" stroke-linecap="round"/>',
    magNo: '<path d="M14 8v16a18 18 0 0 0 36 0V8h-10v16a8 8 0 0 1-16 0V8z" fill="#F05A3C" opacity=".85"/><circle cx="32" cy="57" r="4" fill="#D9B27A"/><path d="M22 50l20 0" stroke="#3B3430" stroke-width="2.6" stroke-linecap="round" stroke-dasharray="3 4"/>',
    gone: '<path d="M16 14h32l-4 42H20z" fill="#DCEFF5" stroke="#9CCFE6" stroke-width="2"/><rect x="18" y="26" width="28" height="28" fill="#9CCFE6" opacity=".7"/>',
    still: '<path d="M16 14h32l-4 42H20z" fill="#DCEFF5" stroke="#9CCFE6" stroke-width="2"/><rect x="18" y="26" width="28" height="28" fill="#9CCFE6" opacity=".7"/><path d="M21 54q11-10 22 0z" fill="#C9A66E"/>',
    far: '<path d="M4 50h56" stroke="#B98E5A" stroke-width="3"/><rect x="44" y="40" width="14" height="9" rx="3" fill="#F2A33A"/><path d="M8 44h30M32 39l6 5-6 5" stroke="#3B3430" stroke-width="2.6" fill="none" stroke-linecap="round"/>',
    near: '<path d="M4 50h56" stroke="#B98E5A" stroke-width="3"/><rect x="18" y="40" width="14" height="9" rx="3" fill="#F2A33A"/><path d="M6 44h8" stroke="#3B3430" stroke-width="2.6" stroke-linecap="round"/>',
    same: '<path d="M14 26h36M14 38h36" stroke="#3B3430" stroke-width="5" stroke-linecap="round"/>',
    bigcar: '<rect x="10" y="24" width="40" height="16" rx="6" fill="#8B6FD6"/><rect x="18" y="14" width="20" height="12" rx="4" fill="#F1E4CF"/><circle cx="20" cy="44" r="6" fill="#3B3430"/><circle cx="42" cy="44" r="6" fill="#3B3430"/>',
    smallcar: '<rect x="20" y="32" width="26" height="11" rx="4" fill="#F2A33A"/><rect x="25" y="25" width="13" height="9" rx="3" fill="#F1E4CF"/><circle cx="26" cy="46" r="4" fill="#3B3430"/><circle cx="40" cy="46" r="4" fill="#3B3430"/>',
    shadowBig: '<rect x="44" y="6" width="14" height="52" fill="#E8DDCB"/><ellipse cx="51" cy="20" rx="6" ry="6" fill="#6E6A66"/><rect x="45" y="26" width="12" height="26" rx="5" fill="#6E6A66"/><circle cx="24" cy="38" r="5" fill="#F1E4CF"/><rect x="21" y="43" width="6" height="11" rx="3" fill="#F05A3C"/>',
    shadowSmall: '<rect x="44" y="6" width="14" height="52" fill="#E8DDCB"/><circle cx="51" cy="36" r="3.5" fill="#6E6A66"/><rect x="47.5" y="40" width="7" height="12" rx="3" fill="#6E6A66"/><circle cx="24" cy="38" r="5" fill="#F1E4CF"/><rect x="21" y="43" width="6" height="11" rx="3" fill="#F05A3C"/>',
    warm: '<path d="M16 22h32l-4 34H20z" fill="#9CCFE6" opacity=".8"/><path d="M24 16q-4-5 0-10M32 16q-4-5 0-10M40 16q-4-5 0-10" stroke="#F2A33A" stroke-width="2.6" fill="none" stroke-linecap="round"/>',
    cold: '<path d="M16 22h32l-4 34H20z" fill="#9CCFE6" opacity=".8"/><rect x="24" y="30" width="8" height="8" rx="2" fill="#fff"/><rect x="34" y="38" width="8" height="8" rx="2" fill="#fff"/>',
    meltFast: '<ellipse cx="32" cy="50" rx="24" ry="7" fill="#9CCFE6"/><rect x="27" y="40" width="10" height="8" rx="3" fill="#E9F5FA" stroke="#9CCFE6"/>',
    meltSlow: '<ellipse cx="32" cy="52" rx="14" ry="4" fill="#9CCFE6"/><rect x="20" y="26" width="24" height="24" rx="5" fill="#E9F5FA" stroke="#9CCFE6"/>',
    coolFast: '<path d="M18 26h28v22a8 8 0 0 1-8 8H26a8 8 0 0 1-8-8z" fill="#8A5A3C"/><path d="M46 32h4a6 6 0 0 1 0 12h-4" fill="none" stroke="#8A5A3C" stroke-width="4"/>',
    coolSlow: '<path d="M18 26h28v22a8 8 0 0 1-8 8H26a8 8 0 0 1-8-8z" fill="#8A5A3C"/><path d="M46 32h4a6 6 0 0 1 0 12h-4" fill="none" stroke="#8A5A3C" stroke-width="4"/><path d="M26 20q-4-5 0-10M34 20q-4-5 0-10" stroke="#B0A89E" stroke-width="2.6" fill="none" stroke-linecap="round"/>',
    beanNone: '<path d="M14 44h36l-4 14H18z" fill="#C97B55"/><ellipse cx="32" cy="44" rx="18" ry="4" fill="#FFF8EE"/><ellipse cx="32" cy="42" rx="4" ry="3" fill="#6E9A4E"/>',
    beanSame: '<path d="M8 46h22l-3 12H11zM34 46h22l-3 12H37z" fill="#C97B55"/><path d="M19 46V30M45 46V30" stroke="#8DB487" stroke-width="3"/><ellipse cx="19" cy="28" rx="6" ry="3" fill="#8DB487"/><ellipse cx="45" cy="28" rx="6" ry="3" fill="#8DB487"/>',
    beanTall: '<path d="M8 46h22l-3 12H11zM34 46h22l-3 12H37z" fill="#C97B55"/><path d="M19 46V32" stroke="#8DB487" stroke-width="3"/><ellipse cx="19" cy="30" rx="6" ry="3" fill="#8DB487"/><path d="M45 46V12" stroke="#E9DB94" stroke-width="2.4"/><ellipse cx="45" cy="11" rx="4" ry="2" fill="#E9DB94"/>',
    beanGreen: '<path d="M21 46h22l-3 12H24z" fill="#C97B55"/><path d="M32 46V14" stroke="#6FA060" stroke-width="3"/><ellipse cx="25" cy="14" rx="7" ry="3" fill="#4CB05A"/><ellipse cx="39" cy="14" rx="7" ry="3" fill="#4CB05A"/><circle cx="52" cy="12" r="6" fill="#F7C948"/>',
    beanYellow: '<path d="M21 46h22l-3 12H24z" fill="#C97B55"/><path d="M32 46V14" stroke="#E9DB94" stroke-width="2.4"/><ellipse cx="32" cy="13" rx="4" ry="2" fill="#E9DB94"/>',
    ironFirst: '<path d="M6 56h52" stroke="#B98E5A" stroke-width="3"/><circle cx="20" cy="49" r="7" fill="#6E6A66"/><circle cx="44" cy="22" r="5" fill="#D9B27A"/>',
    woodFirst: '<path d="M6 56h52" stroke="#B98E5A" stroke-width="3"/><circle cx="20" cy="22" r="7" fill="#6E6A66"/><circle cx="44" cy="51" r="5" fill="#D9B27A"/>',
    together: '<path d="M6 56h52" stroke="#B98E5A" stroke-width="3"/><circle cx="20" cy="49" r="7" fill="#6E6A66"/><circle cx="44" cy="51" r="5" fill="#D9B27A"/><path d="M14 36h36" stroke="#3B3430" stroke-width="2.4" stroke-dasharray="3 4"/>',
    flatFirst: '<path d="M6 56h52" stroke="#B98E5A" stroke-width="3"/><rect x="10" y="50" width="20" height="3" fill="#FFF8EE" stroke="#D9C8AF"/><circle cx="44" cy="20" r="6" fill="#FFF8EE" stroke="#D9C8AF" stroke-width="2"/>',
    ballFirst: '<path d="M6 56h52" stroke="#B98E5A" stroke-width="3"/><path d="M8 20q10-6 20 0" fill="none" stroke="#D9C8AF" stroke-width="3"/><circle cx="44" cy="50" r="6" fill="#FFF8EE" stroke="#D9C8AF" stroke-width="2"/>',
    wet: '<rect x="14" y="20" width="36" height="28" rx="4" fill="#8FB8CC"/><path d="M22 54q3-5 6 0a3 3 0 0 1-6 0zM38 54q3-5 6 0a3 3 0 0 1-6 0z" fill="#3C9BE0"/>',
    dry: '<rect x="14" y="20" width="36" height="28" rx="4" fill="#FFF8EE" stroke="#D9C8AF" stroke-width="2"/><path d="M20 30h24M20 38h16" stroke="#E8DDCB" stroke-width="2"/>',
    lab: '<circle cx="32" cy="32" r="22" fill="#FFF8EE" stroke="#3C9BE0" stroke-width="3"/>',
    boats: '<circle cx="14" cy="30" r="8" fill="#D6DADF"/><path d="M26 26h14l-2 8H28z" fill="#D6DADF"/><path d="M44 22h16l-2 12H46z" fill="#D6DADF"/><path d="M6 46h52" stroke="#F2A33A" stroke-width="3" stroke-dasharray="2 5"/>',
  };
  // 每一關的小圖（實驗、結果）：總結連連看與記錄本用
  const EXP = {
    1: W + '<circle cx="22" cy="34" r="8" fill="#E0533C"/><circle cx="44" cy="52" r="5" fill="#7A5BB0"/>',
    2: SVG.magYes, 3: '<path d="M6 54L30 30v24z" fill="#D9B27A"/><rect x="34" y="44" width="14" height="9" rx="3" fill="#F2A33A"/><path d="M6 56h52" stroke="#B98E5A" stroke-width="3"/>',
    4: SVG.shadowBig, 5: SVG.sugar, 6: '<rect x="12" y="28" width="20" height="20" rx="4" fill="#E9F5FA" stroke="#9CCFE6" stroke-width="2"/><path d="M36 22h20v30H36z" fill="#A9C4A3"/>',
    7: SVG.beanTall, 8: '<path d="M8 10h48" stroke="#B98E5A" stroke-width="4"/><circle cx="20" cy="22" r="7" fill="#6E6A66"/><circle cx="44" cy="22" r="5" fill="#D9B27A"/><path d="M20 34v14M44 34v14" stroke="#3B3430" stroke-width="2.4" stroke-dasharray="3 4"/>',
    9: W + '<path d="M22 10h20v30H22z" fill="#DCEFF5" stroke="#9CCFE6" stroke-width="2"/><rect x="25" y="12" width="14" height="8" fill="#FFF8EE"/>',
    10: W + '<path d="M10 36h44l-5 8H15z" fill="#D6DADF"/><circle cx="24" cy="32" r="4" fill="#3C9BE0"/><circle cx="34" cy="32" r="4" fill="#F05A3C"/><circle cx="44" cy="32" r="4" fill="#F2A33A"/>',
  };
  const RES = {
    1: '<g transform="translate(0 2)">' + W + '</g><circle cx="20" cy="36" r="8" fill="#F29A3A"/><circle cx="44" cy="54" r="7" fill="#F6B860"/>',
    2: '<circle cx="18" cy="32" r="10" fill="#6E6A66"/><path d="M12 32h12" stroke="#fff" stroke-width="2"/><circle cx="46" cy="32" r="10" fill="#C9CDD1"/><path d="M40 26l12 12M52 26L40 38" stroke="#3B3430" stroke-width="2.6" stroke-linecap="round"/>',
    3: SVG.far, 4: '<circle cx="14" cy="32" r="6" fill="#3C9BE0"/><path d="M20 32h8" stroke="#3B3430" stroke-width="2.4"/><rect x="40" y="8" width="16" height="48" fill="#E8DDCB"/><ellipse cx="48" cy="20" rx="6" ry="6" fill="#6E6A66"/><rect x="42" y="27" width="12" height="25" rx="5" fill="#6E6A66"/>',
    5: '<path d="M14 14h36l-4 42H18z" fill="#DCEFF5" stroke="#9CCFE6" stroke-width="2"/><g fill="#3C9BE0"><circle cx="24" cy="30" r="2"/><circle cx="36" cy="26" r="2"/><circle cx="30" cy="40" r="2"/><circle cx="40" cy="44" r="2"/></g><g fill="#F2A33A"><circle cx="28" cy="32" r="1.6"/><circle cx="38" cy="36" r="1.6"/><circle cx="24" cy="46" r="1.6"/></g>',
    6: SVG.meltSlow, 7: SVG.beanGreen, 8: SVG.together, 9: SVG.dry,
    10: W + '<path d="M6 36h52l-4 6H10z" fill="#D6DADF"/><g fill="#3C9BE0"><circle cx="14" cy="32" r="3"/><circle cx="22" cy="32" r="3"/><circle cx="30" cy="32" r="3"/><circle cx="38" cy="32" r="3"/><circle cx="46" cy="32" r="3"/></g>',
  };
  const icon = k => sv(SVG[k] || SVG.lab);
  const expIcon = n => sv(EXP[n]);
  const resIcon = n => sv(RES[n]);
  // 記錄本一頁的三格（假設／實驗／結果），無字
  const PAGE = {
    1: ['apple', 'e1', 'float'], 2: ['clip', 'e2', 'magYes'], 3: ['far', 'e3', 'far'], 4: ['shadowSmall', 'e4', 'shadowBig'],
    5: ['sugar', 'e5', 'r5'], 6: ['meltFast', 'e6', 'meltSlow'], 7: ['beanSame', 'e7', 'beanGreen'], 8: ['ironFirst', 'e8', 'together'],
    9: ['wet', 'e9', 'dry'], 10: ['boats', 'e10', 'r10'],
  };
  const pageCell = k => /^e\d+$/.test(k) ? expIcon(+k.slice(1)) : /^r\d+$/.test(k) ? resIcon(+k.slice(1)) : icon(k);
  const page = n => PAGE[n].map(pageCell);
  // 學習圈中央、按鈕用的線條圖示
  const UI = {
    play: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5.5v13l10.5-6.5z" fill="currentColor"/></svg>',
    light: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 18h6M10 21h4"/><path d="M12 3a6 6 0 0 0-3.6 10.8c.7.6 1.1 1.3 1.1 2.2h5c0-.9.4-1.6 1.1-2.2A6 6 0 0 0 12 3z"/></svg>',
    book: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round" aria-hidden="true"><path d="M4 5.5C6.5 4 9.5 4 12 5.5 14.5 4 17.5 4 20 5.5v13c-2.5-1.5-5.5-1.5-8 0-2.5-1.5-5.5-1.5-8 0z"/><path d="M12 5.5v13"/></svg>',
    left: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg>',
    right: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 5l7 7-7 7"/></svg>',
    back: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 14l-5-5 5-5"/><path d="M4 9h10a6 6 0 0 1 0 12h-3"/></svg>',
    check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>',
    think: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M5 12a7 6 0 1 1 4 5.4L5.5 20l1-3.6A6 6 0 0 1 5 12z"/></svg>',
    redo: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4.5 12a7.5 7.5 0 1 0 2.2-5.3"/><path d="M4 4.5v4h4"/></svg>',
    ball: sv(SVG.stone.replace('#9C948A', '#D6DADF').replace('#B7B0A6', '#E6E9EC')),
    narrow: sv('<path d="M6 30h52l-4 10H10z" fill="#D6DADF"/>'),
    wide: sv('<path d="M8 26h48l-3 16H11z" fill="#D6DADF"/><path d="M8 26h48" stroke="#BFC4C9" stroke-width="2"/>'),
    marble: sv('<circle cx="32" cy="32" r="14" fill="#3C9BE0"/><circle cx="27" cy="27" r="4" fill="#9CCFE6"/>'),
  };

  return { C, M, std, clay, mesh, rbox, box, ball, cyl, roundRect, table, numberPlate, numberTex, halo, floorRing,
    apple, grape, stone, woodBlock, orange, clip, nail, spoon, eraser, can, coin, cup, towel, flashlight, puppet, magnet, car, block, calendar, pot, sprout, bookProp, boatFoil,
    SVG, icon, expIcon, resIcon, page, sv, UI };
})();
