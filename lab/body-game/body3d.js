// 《我的身體裡面》3D 場景：米白小舞台上一個黏土大頭小人（頭大身小、圓眼睛、微笑），身上十扇小門（小圓片）。
// 進一關：那扇門轉開、鏡頭拉近，器官從門後面浮出來放大到前面。器官都是圓圓的黏土、顏色柔和，可愛不噁心。
window.BD = (() => {
  'use strict';
  const { T, clay, glass, mesh, box, ball, cyl } = K3;
  const C = { stage: 0xF3E8D6, skin: 0xF6CDA8, shirt: 0x8FB38A, pants: 0x6C8FB0, dark: 0x3B3430, cheek: 0xF4A7B0, door: 0xF2A23A, white: 0xFFFBF4, rice: 0xFFFDF5,
    pink: 0xF4A7B0, coral: 0xF07C6C, organ: 0xE88A8A, stomach: 0xF2A0A0, gut: 0xF6B8A8, gut2: 0xE8A090, red: 0xE0533C, blue: 0x6C8FB0, bone: 0xF6EBD2, green: 0x8BC17A, germ: 0x7FBF5A,
    brown: 0x9A6B45, egg: 0xFFE08A, veg: 0x6FA05A, gold: 0xF2C14E, moon: 0xFFE9A8, night: 0x3C4A6E };
  const M = {};
  const mat = (k, o) => M[k] || (M[k] = clay(C[k], o));

  // ---------- 小舞台（一直都在） ----------
  function stage(scene) {
    const g = new T.Group();
    g.add(box(60, .4, 60, mat('stage'), 0, -.2, 0));
    g.traverse(o => { if (o.isMesh) { o.receiveShadow = true; o.castShadow = false; } });
    scene.add(g);
    return g;
  }
  // ---------- 大頭小人：十扇門的位置 ----------
  function person(s = 1) {
    const g = new T.Group();
    const body = ball(.95, mat('shirt'), 0, 2.2, 0, 22); body.scale.set(1, 1.25, .8); g.add(body);
    const head = ball(1.35, mat('skin'), 0, 4.4, 0, 24); g.add(head);
    [-1, 1].forEach(sx => {
      g.add(ball(.16, mat('dark'), sx * .42, 4.6, 1.22, 12));
      const ck = ball(.18, mat('cheek'), sx * .72, 4.2, 1.1, 10); ck.scale.z = .4; g.add(ck);
      g.add(ball(.22, mat('skin'), sx * 1.32, 4.4, 0, 10));
      const leg = cyl(.28, .26, 1.3, mat('pants'), sx * .42, .65, 0, 12); g.add(leg);
      g.add(ball(.3, mat('dark'), sx * .42, .1, .14, 12));
    });
    const smile = new T.Mesh(new T.TorusGeometry(.32, .06, 6, 16, Math.PI), mat('dark')); smile.rotation.z = Math.PI; smile.position.set(0, 4.05, 1.3); g.add(smile);
    // 手臂（第 9 關會彎）：肩膀 → 上臂 → 手肘 → 前臂
    const arms = [-1, 1].map(sx => { const sh = new T.Group(); sh.position.set(sx * .95, 2.9, 0); const up = cyl(.2, .18, 1.1, mat('shirt'), 0, -.55, 0, 10); sh.add(up); const el = new T.Group(); el.position.y = -1.1; sh.add(el); el.add(cyl(.17, .15, 1, mat('skin'), 0, -.5, 0, 10)); el.add(ball(.2, mat('skin'), 0, -1.05, 0, 10)); sh.rotation.z = sx * .25; g.add(sh); return { sh, el }; });
    // 十扇門（小圓片）：位置在身上
    const D = (x, y, z) => { const d = new T.Group(); d.position.set(x, y, z); const disc = cyl(.24, .24, .06, mat('door'), 0, 0, 0, 18); disc.rotation.x = Math.PI / 2; d.add(disc); g.add(d); return d; };
    const doors = [D(0, 3.82, 1.32), D(0, 3.1, .82), D(.25, 2.55, .78), D(0, 2, .82), D(-.25, 1.5, .76), D(-.35, 2.85, .78), D(.38, 2.85, .76), D(1.4, 2.1, .3), D(.42, .9, .3), D(-.42, .9, .3)];
    g.userData = { head, body, arms, doors, smile };
    g.scale.setScalar(s);
    return g;
  }
  // ---------- 器官 ----------
  function mouth() {
    const g = new T.Group();
    const lip = new T.Mesh(new T.TorusGeometry(1.4, .3, 12, 32), mat('coral')); lip.scale.y = .7; g.add(lip);
    const inside = cyl(1.35, 1.35, .1, mat('organ'), 0, 0, -.2, 28); inside.rotation.x = Math.PI / 2; inside.scale.z = .7; g.add(inside);
    const top = new T.Group(), bot = new T.Group(); g.add(top); g.add(bot);
    for (let i = 0; i < 6; i++) { const x = (i - 2.5) * .36; top.add(box(.3, .32, .3, mat('white'), x, .55, .1)); bot.add(box(.3, .32, .3, mat('white'), x, -.55, .1)); }
    g.userData = { top, bot };
    return g;
  }
  function riceBall(s = 1) { const g = new T.Group(); const b = ball(.6 * s, mat('rice'), 0, 0, 0, 18); b.scale.y = .85; g.add(b); return g; }
  function esophagus(n = 8) { const g = new T.Group(); const rings = []; for (let i = 0; i < n; i++) { const r = new T.Mesh(new T.TorusGeometry(.55, .18, 10, 22), mat(i % 2 ? 'pink' : 'coral')); r.rotation.x = Math.PI / 2; r.position.y = -i * .55; g.add(r); rings.push(r); } g.userData.rings = rings; return g; }
  function stomach() {
    const g = new T.Group();
    const s = ball(1.6, mat('stomach'), 0, 0, 0, 24); s.scale.set(1.3, 1, .8); g.add(s);
    const tube = cyl(.35, .35, 1, mat('stomach'), -1.3, 1.2, 0, 12); tube.rotation.z = .5; g.add(tube);
    const food = ball(1.1, mat('rice', { transparent: true, opacity: .9 }), 0, -.2, .4, 18); food.scale.set(1.2, .7, .5); g.add(food);
    g.userData = { s, food };
    return g;
  }
  function smallIntestine() {
    const g = new T.Group();
    const pts = []; for (let i = 0; i <= 80; i++) { const t = i / 80; const a = t * Math.PI * 7; const r = .6 + .9 * Math.sin(t * Math.PI); pts.push(new T.Vector3(Math.cos(a) * r, 1 - t * 2, Math.sin(a) * r * .4)); }
    const tube = new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3(pts), 160, .22, 10, false), mat('gut')); tube.castShadow = true; g.add(tube);
    g.userData.curve = new T.CatmullRomCurve3(pts);
    return g;
  }
  function largeIntestine() {
    const g = new T.Group();
    const pts = [[-1.4, -1.2], [-1.6, 0], [-1.4, 1.2], [0, 1.4], [1.4, 1.2], [1.6, 0], [1.4, -1.2], [.6, -1.6]].map(([x, y]) => new T.Vector3(x, y, 0));
    const tube = new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3(pts), 60, .38, 12, false), mat('gut2')); tube.castShadow = true; g.add(tube);
    g.userData.curve = new T.CatmullRomCurve3(pts);
    return g;
  }
  function heart() {
    const g = new T.Group();
    [-1, 1].forEach(s => { const b = ball(.8, mat('red'), s * .45, .3, 0, 22); g.add(b); });
    const tip = new T.Mesh(new T.ConeGeometry(1.08, 1.4, 22), mat('red')); tip.rotation.z = Math.PI; tip.position.y = -.6; g.add(tip);
    [[-.35, 'red'], [.35, 'blue']].forEach(([x, c]) => { const t = cyl(.18, .18, .9, mat(c), x, 1.2, -.1, 12); g.add(t); });
    return g;
  }
  function lungs() {
    const g = new T.Group();
    const L = [-1, 1].map(s => { const b = ball(1, mat('pink'), s * 1.05, 0, 0, 22); b.scale.set(.85, 1.3, .7); g.add(b); return b; });
    g.add(cyl(.18, .18, 1.4, mat('coral'), 0, 1.6, 0, 12));
    [-1, 1].forEach(s => { const t = cyl(.12, .12, .8, mat('coral'), s * .45, .75, 0, 10); t.rotation.z = -s * .8; g.add(t); });
    g.userData.L = L;
    return g;
  }
  function skull() { const g = new T.Group(); g.add(ball(.9, mat('bone'), 0, .9, 0, 20)); [-1, 1].forEach(s => g.add(ball(.2, mat('dark'), s * .32, .95, .78, 10))); g.add(box(.7, .35, .6, mat('bone'), 0, .25, .25)); return g; }
  function ribs() { const g = new T.Group(); g.add(cyl(.1, .1, 2.2, mat('bone'), 0, 1.1, -.3, 10)); for (let i = 0; i < 5; i++) { const r = new T.Mesh(new T.TorusGeometry(.75 - i * .05, .08, 8, 22, Math.PI * 1.6), mat('bone')); r.rotation.set(Math.PI / 2, 0, Math.PI * .7); r.position.y = 1.7 - i * .32; g.add(r); } return g; }
  function legBone() { const g = new T.Group(); g.add(cyl(.16, .16, 2, mat('bone'), 0, 1.1, 0, 12)); [0, 2.2].forEach(y => [-1, 1].forEach(s => g.add(ball(.24, mat('bone'), s * .14, y + .05, 0, 12)))); return g; }
  // 第 9 關：手臂特寫（上臂骨、前臂骨、一條會鼓起來的肌肉、後面一條）
  function armRig() {
    const g = new T.Group();
    const upper = cyl(.16, .16, 2.4, mat('bone'), 0, 0, 0, 12); upper.rotation.z = Math.PI / 2; g.add(upper);
    const elbow = new T.Group(); elbow.position.x = 1.25; g.add(elbow);
    const fore = cyl(.14, .14, 2.2, mat('bone'), 1.1, 0, 0, 12); fore.rotation.z = Math.PI / 2; elbow.add(fore);
    const hand = ball(.38, mat('skin'), 2.35, 0, 0, 14); elbow.add(hand);
    const bi = ball(.5, mat('red'), 0, .45, .1, 18); bi.scale.set(2.2, .6, .7); g.add(bi);
    const tri = ball(.45, mat('coral'), 0, -.42, -.1, 18); tri.scale.set(2.2, .5, .6); g.add(tri);
    g.add(ball(.25, mat('bone'), 1.25, 0, 0, 12));
    g.userData = { elbow, bi, tri };
    return g;
  }
  function skinPatch() { const g = new T.Group(); const s = box(4.4, .4, 3, mat('skin'), 0, .2, 0); g.add(s); const cut = box(.9, .06, .25, mat('red'), .6, .42, .3); g.add(cut); g.userData.cut = cut; return g; }
  // 細菌：綠色小球＋一圈小刺（小刺是一個 InstancedMesh，整隻只有 3 個物件）
  function germ() {
    const g = new T.Group(); g.add(ball(.3, mat('germ'), 0, 0, 0, 14));
    const sp = new T.InstancedMesh(new T.SphereGeometry(.07, 6, 4), mat('green'), 8), Mx = new T.Matrix4();
    for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2; Mx.makeTranslation(Math.cos(a) * .36, Math.sin(a) * .36, 0); sp.setMatrixAt(i, Mx); }
    g.add(sp);
    const eyes = new T.InstancedMesh(new T.SphereGeometry(.05, 6, 4), mat('dark'), 2); [-1, 1].forEach((s2, i) => { Mx.makeTranslation(s2 * .1, .06, .27); eyes.setMatrixAt(i, Mx); }); g.add(eyes);
    return g;
  }
  function moon() { const g = new T.Group(); g.add(ball(.6, mat('moon'), 0, 0, 0, 18)); const c = ball(.5, mat('night'), .3, .15, .2, 14); c.scale.z = .6; g.add(c); return g; }
  // 食物（第 4 關）
  function food(k) { const g = new T.Group(); if (k === 'rice') { g.add(cyl(.6, .4, .4, mat('white'), 0, .2, 0, 16)); g.add(ball(.5, mat('rice'), 0, .45, 0, 14)).scale.y = .5; } else if (k === 'egg') { const e = ball(.45, mat('white'), 0, .45, 0, 14); e.scale.y = 1.25; g.add(e); } else { [[-.2, 0], [.2, .1], [0, -.2]].forEach(([x, z]) => { const l = ball(.3, mat('veg'), x, .35, z, 12); l.scale.y = 1.4; g.add(l); }); } return g; }
  function result(k) { const g = new T.Group(); if (k === 'power') { const b = new T.Mesh(new T.OctahedronGeometry(.45, 0), mat('gold')); b.position.y = .6; b.scale.y = 1.5; g.add(b); } else if (k === 'grow') { [0, 1, 2].forEach(i => g.add(box(.3, .4 + i * .35, .3, mat('coral'), (i - 1) * .38, .2 + i * .17, 0))); } else { const t = new T.Mesh(new T.TorusGeometry(.4, .12, 8, 20), mat('green')); t.position.y = .5; g.add(t); } return g; }
  const ORGAN_MINI = { mouth: () => { const g = mouth(); g.scale.setScalar(.35); g.position.y = .6; const w = new T.Group(); w.add(g); return w; }, eso: () => { const g = esophagus(4); g.scale.setScalar(.45); g.position.y = 1.2; const w = new T.Group(); w.add(g); return w; }, stomach: () => { const g = stomach(); g.scale.setScalar(.35); g.position.y = .6; const w = new T.Group(); w.add(g); return w; }, small: () => { const g = smallIntestine(); g.scale.setScalar(.4); g.position.y = .6; const w = new T.Group(); w.add(g); return w; }, large: () => { const g = largeIntestine(); g.scale.setScalar(.32); g.position.y = .6; const w = new T.Group(); w.add(g); return w; } };
  return { C, M, mat, stage, person, mouth, riceBall, esophagus, stomach, smallIntestine, largeIntestine, heart, lungs, skull, ribs, legBone, armRig, skinPatch, germ, moon, food, result, ORGAN_MINI };
})();
