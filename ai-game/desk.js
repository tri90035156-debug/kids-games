// 《AI 從哪裡來》3D 場景：一張方形黏土書桌，中間一台會笑的電腦，每關桌上換道具。
// 照片卡＝一張黏土小卡，上面貼原本 art.js 畫的動物圖（照片本來就是平的，這關在分照片）。
window.DK = (() => {
  'use strict';
  const { T, clay, glass, mesh, box, ball, cyl } = K3;
  const C = { desk: 0xD9B48A, deskD: 0xB98C5E, floor: 0xEFE5D3, case: 0xF3EADB, screen: 0x3B4A5A, face: 0xFFF3DE, red: 0xC0392B, gold: 0xF2A23A, green: 0x6F9A72,
    blue: 0x3C9BE0, skin: 0xF2C9A0, shirt: 0x8FB38A, pants: 0x5D7B9A, dark: 0x3B3430, grey: 0xB8C0C6, white: 0xFFFBF4, wall: 0xC9A478, pink: 0xF4A7B0, sky: 0xCFE6F2, brown: 0x9A6B45 };
  const M = {};
  const mat = (k, o) => M[k] || (M[k] = clay(C[k], o));

  // ---------- 書桌（一直都在） ----------
  function desk(scene) {
    const g = new T.Group();
    g.add(box(60, .4, 60, mat('floor'), 0, -6.2, 0));
    g.add(box(15, .5, 11, mat('desk'), 0, -.25, 0));
    g.add(box(15.2, .3, 11.2, mat('deskD'), 0, -.6, 0));
    [[-7, -5], [7, -5], [-7, 5], [7, 5]].forEach(([x, z]) => g.add(box(.6, 5.6, .6, mat('deskD'), x, -3.3, z)));
    g.traverse(o => { if (o.isMesh) { o.receiveShadow = true; o.castShadow = o.position.y < -1; } });
    scene.add(g);
    return g;
  }
  // ---------- 會笑的電腦：face('happy'|'think'|'oops') ----------
  function computer(s = 1) {
    const g = new T.Group();
    g.add(box(2.6, 1.9, .5, mat('case'), 0, 1.45, 0));
    const scr = box(2.2, 1.5, .1, mat('screen', { roughness: .5 }), 0, 1.45, .26); g.add(scr);
    g.add(box(.5, .5, .4, mat('case'), 0, .25, 0)); g.add(box(1.4, .1, .9, mat('case'), 0, .05, .1));
    const face = new T.Group(); face.position.set(0, 1.45, .33); g.add(face);
    const eyes = [-.4, .4].map(x => { const e = ball(.12, mat('face'), x, .2, 0, 10); e.scale.z = .3; face.add(e); return e; });
    const smile = new T.Mesh(new T.TorusGeometry(.35, .06, 6, 16, Math.PI), mat('face')); smile.rotation.z = Math.PI; smile.position.y = -.12; face.add(smile);
    g.userData.face = kind => { smile.rotation.z = kind === 'oops' ? 0 : Math.PI; smile.position.y = kind === 'oops' ? -.38 : -.12; eyes.forEach(e => e.scale.y = kind === 'think' ? .4 : 1); };
    // 背後三顆旋鈕（第 5 關會轉）
    g.userData.knobs = [-.7, 0, .7].map(x => { const k = new T.Group(); k.position.set(x, 1.1, -.3); k.add(cyl(.18, .18, .2, mat('gold'), 0, 0, 0, 14)).rotation.x = Math.PI / 2; k.add(box(.05, .2, .08, mat('dark'), 0, .06, -.12)); g.add(k); return k; });
    g.scale.setScalar(s);
    return g;
  }
  // ---------- 人偶：手、腳、眼睛、耳朵、頭（第 1 關） ----------
  function doll() {
    const g = new T.Group();
    const torso = ball(.7, mat('shirt'), 0, 2.1, 0, 18); torso.scale.set(1, 1.2, .8); g.add(torso);
    const head = ball(.6, mat('skin'), 0, 3.5, 0, 18); g.add(head);
    [-1, 1].forEach(s => {
      const arm = cyl(.16, .16, 1.2, mat('shirt'), s * .9, 2.2, 0, 10); arm.rotation.z = s * .5; g.add(arm);
      g.add(ball(.2, mat('skin'), s * 1.25, 1.65, 0, 10));
      g.add(cyl(.2, .2, 1.2, mat('pants'), s * .3, .7, 0, 10));
      g.add(ball(.22, mat('dark'), s * .3, .12, .12, 10));
      g.add(ball(.13, mat('skin'), s * .6, 3.5, 0, 8));
      g.add(ball(.07, mat('dark'), s * .2, 3.6, .54, 8));
    });
    // 五個部位的位置（世界座標用 g 的子物件取）
    const spot = (x, y, z) => { const o = new T.Group(); o.position.set(x, y, z); g.add(o); return o; };
    g.userData.spots = { hand: spot(1.25, 1.65, .2), foot: spot(-.3, .12, .3), eye: spot(-.2, 3.6, .6), ear: spot(.62, 3.5, .1), head: spot(0, 4.2, 0) };
    return g;
  }
  function hammer() { const g = new T.Group(); g.add(cyl(.07, .07, 1, mat('brown'), 0, .5, 0, 8)); g.add(box(.6, .25, .25, mat('grey'), 0, 1, 0)); g.rotation.z = .3; return g; }
  function bike() { const g = new T.Group(); [-.45, .45].forEach(x => { const w = new T.Mesh(new T.TorusGeometry(.3, .05, 6, 18), mat('dark')); w.position.set(x, .32, 0); g.add(w); }); g.add(box(.9, .06, .06, mat('red'), 0, .5, 0)); g.add(box(.06, .3, .06, mat('red'), .3, .65, 0)); return g; }
  function glasses() { const g = new T.Group(); [-.25, .25].forEach(x => { const r = new T.Mesh(new T.TorusGeometry(.18, .04, 6, 16), mat('dark')); r.position.set(x, .3, 0); g.add(r); }); g.add(box(.15, .04, .04, mat('dark'), 0, .32, 0)); return g; }
  function phone() { const g = new T.Group(); g.add(box(.4, .7, .1, mat('dark'), 0, .4, 0)); g.add(box(.32, .5, .02, mat('sky'), 0, .42, .06)); return g; }
  function chip() { const g = new T.Group(); g.add(box(.6, .14, .6, mat('dark'), 0, .1, 0)); for (let i = 0; i < 3; i++) [-1, 1].forEach(s => g.add(box(.08, .06, .2, mat('gold'), -.2 + i * .2, .06, s * .38))); g.add(box(.3, .04, .3, mat('gold'), 0, .19, 0)); return g; }
  // ---------- 第 2 關：格子、小機器人、牆、星星 ----------
  function robot() { const g = new T.Group(); g.add(box(.6, .5, .5, mat('grey'), 0, .35, 0)); g.add(box(.5, .35, .4, mat('grey'), 0, .8, 0)); [-.12, .12].forEach(x => g.add(ball(.06, mat('blue'), x, .85, .2, 8))); g.add(cyl(.02, .02, .25, mat('dark'), 0, 1.1, 0, 6)); g.add(ball(.06, mat('red'), 0, 1.24, 0, 8)); return g; }
  function wall() { return box(.9, .7, .9, mat('wall'), 0, .35, 0); }
  function star() { const s = new T.Shape(); for (let i = 0; i < 10; i++) { const r = i % 2 ? .18 : .4, a = i / 10 * Math.PI * 2 - Math.PI / 2; if (i) s.lineTo(Math.cos(a) * r, Math.sin(a) * r); else s.moveTo(Math.cos(a) * r, Math.sin(a) * r); } const m = new T.Mesh(new T.ExtrudeGeometry(s, { depth: .15, bevelEnabled: true, bevelThickness: .04, bevelSize: .04, bevelSegments: 1 }), mat('gold')); m.position.y = .5; m.castShadow = true; const g = new T.Group(); g.add(m); return g; }
  // ---------- 照片卡（動物圖貼在黏土小卡上） ----------
  const TEXC = {};
  function picTex(svg) {
    if (TEXC[svg]) return TEXC[svg];
    let s = svg.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256"');
    const t = new T.TextureLoader().load('data:image/svg+xml;charset=utf-8,' + encodeURIComponent(s));
    t.colorSpace = T.SRGBColorSpace; TEXC[svg] = t;
    return t;
  }
  function photo(svg, w = 1.3) {
    const g = new T.Group();
    g.add(box(w, w * 1.1, .08, mat('white'), 0, 0, 0));
    const p = new T.Mesh(new T.PlaneGeometry(w * .86, w * .86), new T.MeshStandardMaterial({ map: picTex(svg), roughness: .9, transparent: true })); p.position.set(0, w * .05, .05); g.add(p);
    return g;
  }
  function basket(col = 'green') { const g = new T.Group(); g.add(cyl(1.2, .9, .8, mat(col), 0, .4, 0, 20)); g.add(cyl(1.05, 1.05, .05, mat('white'), 0, .78, 0, 20)); return g; }
  function lever(col = 'gold') { const g = new T.Group(); g.add(box(.7, .3, .7, mat('grey'), 0, .15, 0)); const arm = new T.Group(); arm.position.y = .3; arm.add(cyl(.06, .06, 1, mat('dark'), 0, .5, 0, 8)); arm.add(ball(.2, mat(col), 0, 1.05, 0, 12)); g.add(arm); g.userData.arm = arm; return g; }
  function oBlock() { const g = new T.Group(); const t = new T.Mesh(new T.TorusGeometry(.45, .16, 10, 24), mat('green')); t.position.y = .65; g.add(t); return g; }
  function xBlock() { const g = new T.Group(); [-1, 1].forEach(s => { const b = box(1.1, .3, .3, mat('red'), 0, .65, 0); b.rotation.z = s * .78; g.add(b); }); return g; }
  function node(col = 'gold', r = .35) { const g = new T.Group(); g.add(ball(r, mat(col), 0, r + .05, 0, 16)); return g; }
  function funnel() { const g = new T.Group(); const f = new T.Mesh(new T.CylinderGeometry(1.1, .3, 1, 20, 1, true), mat('gold', { side: T.DoubleSide })); f.position.y = .5; g.add(f); return g; }
  // ---------- 第 8 關：電腦長大了 ----------
  function bigComputer() { const g = new T.Group(); [-1, 0, 1].forEach(x => { g.add(box(.8, 2, .7, mat('grey'), x * .9, 1, 0)); g.add(box(.5, .3, .02, mat('dark'), x * .9, 1.4, .36)); }); return g; }
  function people() { const g = new T.Group(); [-.5, .5].forEach((x, i) => { g.add(cyl(.25, .3, .8, mat(i ? 'pink' : 'blue'), x, .4, 0, 12)); g.add(ball(.22, mat('skin'), x, 1, 0, 12)); }); g.add(box(.6, .5, .06, mat('white'), 0, .9, .3)); return g; }
  function desktop() { const g = computer(.55); return g; }
  function chatPhone() { const g = phone(); g.scale.setScalar(1.5); const b = ball(.18, mat('white'), .35, 1.25, 0, 10); b.scale.set(1.4, 1, .5); g.add(b); return g; }
  // ---------- 第 9 關：字的積木 ----------
  function block(col = 'white') { const g = new T.Group(); g.add(box(1.6, .7, .9, mat(col), 0, .35, 0)); return g; }
  // ---------- 第 10 關：AI 畫錯的三個地方（兩條尾巴的貓、長在樹上的魚、開在屋頂的門） ----------
  function cat(tails = 1) {
    const g = new T.Group(); const fur = clay(0xF2A23A);
    const b = ball(.5, fur, 0, .5, 0, 14); b.scale.set(1.3, .9, .8); g.add(b);
    g.add(ball(.36, fur, .65, .9, 0, 14));
    [-1, 1].forEach(s => { const e = new T.Mesh(new T.ConeGeometry(.12, .25, 8), fur); e.position.set(.65 + s * .15, 1.25, 0); g.add(e); });
    for (let i = 0; i < tails; i++) { const t = cyl(.06, .05, .8, fur, -.75, .85, (i - (tails - 1) / 2) * .3, 6); t.rotation.z = .6; g.add(t); }
    return g;
  }
  function fishTree() { const g = new T.Group(); g.add(cyl(.15, .2, 1.6, mat('brown'), 0, .8, 0, 8)); g.add(ball(.9, mat('green'), 0, 2, 0, 14)); [[.5, 1.8, .6], [-.4, 2.2, .6]].forEach(([x, y, z]) => { const f = ball(.2, mat('blue'), x, y, z, 10); f.scale.set(1.6, .8, .6); g.add(f); const t = new T.Mesh(new T.ConeGeometry(.12, .2, 6), mat('blue')); t.rotation.z = Math.PI / 2; t.position.set(x - .35, y, z); g.add(t); }); return g; }
  function oddHouse() { const g = new T.Group(); g.add(box(1.6, 1.2, 1.4, mat('white'), 0, .6, 0)); const r = new T.Mesh(new T.ConeGeometry(1.3, .8, 4), mat('red')); r.position.y = 1.6; r.rotation.y = Math.PI / 4; g.add(r); g.add(box(.45, .6, .05, mat('brown'), 0, 1.75, .52)); return g; }
  // 願望：翻譯（兩個對話泡泡）、醫生（紅十字）、地球、書
  function wish(i) {
    const g = new T.Group();
    if (i === 0) [-.35, .35].forEach((x, k) => { const b = ball(.4, mat(k ? 'sky' : 'pink'), x, .6 + k * .3, 0, 12); b.scale.set(1.2, .8, .4); g.add(b); });
    else if (i === 1) { g.add(box(.9, .3, .3, mat('red'), 0, .6, 0)); g.add(box(.3, .9, .3, mat('red'), 0, .6, 0)); }
    else if (i === 2) { g.add(ball(.55, mat('blue'), 0, .6, 0, 18)); [[.2, .2], [-.25, -.1]].forEach(([x, y]) => { const l = ball(.22, mat('green'), x, .6 + y, .42, 10); l.scale.z = .4; g.add(l); }); }
    else { g.add(box(1, .15, .7, mat('red'), 0, .1, 0)); g.add(box(.9, .1, .62, mat('white'), 0, .22, 0)); }
    return g;
  }
  return { C, M, mat, desk, computer, doll, hammer, bike, glasses, phone, chip, robot, wall, star, photo, basket, lever, oBlock, xBlock, node, funnel, bigComputer, people, desktop, chatPhone, block, cat, fishTree, oddHouse, wish };
})();
