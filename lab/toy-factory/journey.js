// 《玩偶怎麼來？》3D 場景：一條黏土旅程路（原料區 → 工廠輸送帶 → 港口 → 商店與家），小熊在路上走。
// 地面與路一直都在；每關的道具在 app.js 用 K3.level() 放上去（換關就丟）。
window.JY = (() => {
  'use strict';
  const { T, clay, glass, mesh, box, ball, cyl } = K3;
  const C = {
    grass: 0xCFDDB0, road: 0xE8D7B8, roadEdge: 0xD2BC96, fur: 0xD9A66B, furDark: 0xB98048, dark: 0x4A3328, white: 0xFFFBF4,
    cotton: 0xFFFFFF, stem: 0x7A9A4A, leaf: 0x8FB38A, sheep: 0xF4EEE2, oil: 0x3B3430, pump: 0x8E2A1A, steel: 0xB8C0C6,
    belt: 0x6E6A66, red: 0xF05A3C, amber: 0xF2A33A, blue: 0x3C9BE0, sea: 0x5CC3E8, sea2: 0x3C9BE0, cardboard: 0xC9A478,
    container: 0xF05A3C, container2: 0x3C9BE0, container3: 0xF2A33A, pink: 0xF4A7B0, green: 0x6F9A72, cream: 0xFFF3DE, purple: 0x9C7BD0,
  };
  const M = {};
  const mat = (k, o) => M[k] || (M[k] = clay(C[k], o));

  // ---------- 地面＋一條長長的路（一直都在） ----------
  function ground(scene) {
    const g = new T.Group();
    const gr = box(140, .4, 60, mat('grass'), 0, -.2, 0); g.add(gr);
    const rd = box(140, .06, 3.2, mat('road'), 0, .03, 4.2); g.add(rd);
    [5.85, 2.55].forEach(z => g.add(box(140, .08, .2, mat('roadEdge'), 0, .04, z)));
    g.traverse(o => { if (o.isMesh) { o.receiveShadow = true; o.castShadow = false; } });
    scene.add(g);
    return g;
  }

  // ---------- 小熊（k：鼓起來的程度 0～1.4） ----------
  function bear(scale = 1) {
    const g = new T.Group(), body = new T.Group(); g.add(body);
    const fur = mat('fur'), dark = mat('dark');
    const torso = ball(.55, fur, 0, .62, 0); torso.scale.set(1, 1.08, .9); body.add(torso);
    const head = ball(.46, fur, 0, 1.45, 0); body.add(head);
    [-1, 1].forEach(s => {
      body.add(ball(.16, fur, s * .36, 1.8, 0, 12));
      body.add(ball(.06, dark, s * .16, 1.52, .4, 10));
      const arm = ball(.18, fur, s * .58, .8, .05, 12); arm.scale.set(1, 1.5, 1); arm.rotation.z = -s * .5; body.add(arm);
      const leg = ball(.21, fur, s * .3, .2, .3, 12); leg.scale.set(1, .9, 1.4); body.add(leg);
    });
    body.add(ball(.08, dark, 0, 1.38, .45, 10));
    const muzzle = ball(.17, mat('cream'), 0, 1.33, .36, 12); muzzle.scale.z = .6; body.add(muzzle);
    g.scale.setScalar(scale);
    g.userData.puff = k => { torso.scale.set(k, 1.08 * (.7 + k * .3), .9 * k); body.children.forEach(o => { if (o !== torso && o !== head && o.position.y < 1.2) o.position.x = Math.sign(o.position.x) * Math.abs(o.position.x) * (.8 + k * .2); }); };
    return g;
  }

  // 遠遠的小小熊（只有頭、身體、兩個耳朵：4 個物件，放在箱子上、架子上）
  function miniBear(sc = .35) { const g = new T.Group(); const f = mat('fur'); g.add(ball(.55, f, 0, .6, 0, 14)); g.add(ball(.42, f, 0, 1.35, 0, 14)); [-1, 1].forEach(s => g.add(ball(.15, f, s * .34, 1.7, 0, 10))); g.scale.setScalar(sc); return g; }

  // ---------- 原料區 ----------
  function cottonPlant() { const g = new T.Group(); g.add(cyl(.06, .08, 1, mat('stem'), 0, .5, 0, 8)); [[0, 1.05, 0], [.25, .8, .1], [-.22, .75, -.05]].forEach(([x, y, z]) => g.add(ball(.2, mat('cotton'), x, y, z, 12))); return g; }
  function field() { const g = new T.Group(); g.add(box(2.6, .14, 1.8, clay(0xB98C5E), 0, .07, 0)); [[-.8, -.4], [.1, .35], [.8, -.3]].forEach(([x, z]) => { const p = cottonPlant(); p.position.set(x, .1, z); g.add(p); }); return g; }
  function sheep() {
    const g = new T.Group();
    [[0, .9, 0, .55], [.4, 1, .1, .38], [-.4, .95, -.05, .4], [0, 1.25, 0, .38]].forEach(([x, y, z, r]) => g.add(ball(r, mat('sheep'), x, y, z, 14)));
    const h = ball(.26, mat('dark'), .78, 1.1, 0, 12); h.scale.set(1.2, 1, .9); g.add(h);
    [[-.3, -.25], [.3, -.25], [-.3, .25], [.3, .25]].forEach(([x, z]) => g.add(cyl(.07, .07, .5, mat('dark'), x, .25, z, 8)));
    return g;
  }
  function oilPump() {
    const g = new T.Group();
    g.add(box(1.6, .2, 1, mat('steel'), 0, .1, 0));
    g.add(box(.18, 1.3, .18, mat('pump'), -.2, .85, 0));
    const beam = new T.Group(); beam.position.set(-.2, 1.5, 0); beam.add(box(1.8, .18, .2, mat('pump'), .2, 0, 0)); const head = box(.3, .5, .24, mat('pump'), -.75, -.1, 0); beam.add(head); g.add(beam);
    g.add(cyl(.25, .3, .2, mat('oil'), -.95, .1, 0, 14));
    g.userData.beam = beam;
    return g;
  }
  function cottonBall() { const g = new T.Group(); [[0, .35, 0, .32], [.2, .3, .1, .22], [-.2, .28, -.05, .22]].forEach(([x, y, z, r]) => g.add(ball(r, mat('cotton'), x, y, z, 14))); return g; }
  function woolTuft() { const g = new T.Group(); for (let i = 0; i < 5; i++) { const a = i / 5 * Math.PI * 2; g.add(ball(.18, mat('sheep'), Math.cos(a) * .2, .3 + (i % 2) * .08, Math.sin(a) * .2, 10)); } return g; }
  function spool(col = 'purple') { const g = new T.Group(); g.add(cyl(.32, .32, .1, mat('cardboard'), 0, .05, 0, 16)); g.add(cyl(.26, .26, .5, mat(col), 0, .35, 0, 16)); g.add(cyl(.32, .32, .1, mat('cardboard'), 0, .65, 0, 16)); return g; }
  function oilDrop() { const g = new T.Group(); g.add(ball(.3, mat('oil', { roughness: .4 }), 0, .32, 0, 16)); const t = new T.Mesh(new T.ConeGeometry(.28, .4, 16), mat('oil')); t.position.y = .68; g.add(t); return g; }
  function pellets() { const g = new T.Group(); [[0, 0], [.2, .1], [-.18, .12], [.05, -.2], [-.1, -.1]].forEach(([x, z], i) => g.add(ball(.1, mat(i % 2 ? 'white' : 'cream'), x, .1, z, 10))); return g; }
  function cloth(col = 'pink') { const g = new T.Group(); const c = box(.9, .08, .7, mat(col), 0, .05, 0); g.add(c); g.add(box(.9, .14, .12, mat(col), 0, .1, .35)); return g; }

  // ---------- 機器（小小的黏土方塊＋一個特徵） ----------
  function machine(kind) {
    const g = new T.Group();
    const base = box(1.3, .9, 1.1, mat(kind === 'dye' ? 'blue' : kind === 'loom' ? 'amber' : 'steel'), 0, .45, 0); g.add(base);
    if (kind === 'pump') { const p = oilPump(); p.scale.setScalar(.6); p.position.y = .9; g.add(p); }
    else if (kind === 'pellet') { const f = new T.Mesh(new T.ConeGeometry(.5, .6, 16, 1, true), mat('steel')); f.rotation.x = Math.PI; f.position.y = 1.2; g.add(f); g.add(pellets()).position.y = .9; }
    else if (kind === 'fiber') { [-.3, 0, .3].forEach(x => g.add(cyl(.03, .03, .8, mat('white'), x, 1.2, .2, 6))); g.add(cyl(.2, .2, .2, mat('red'), 0, 1.05, -.2, 12)); }
    else if (kind === 'loom') { g.add(box(1.1, .5, .1, mat('furDark'), 0, 1.15, -.3)); const c = cloth('cream'); c.position.y = .92; g.add(c); }
    else if (kind === 'dye') { g.add(cyl(.45, .4, .3, mat('white'), 0, 1.05, 0, 16)); g.add(cyl(.4, .4, .05, mat('pink'), 0, 1.2, 0, 16)); }
    return g;
  }
  function belt(len = 10) {
    const g = new T.Group();
    g.add(box(len, .5, 1.6, mat('steel'), 0, .25, 0));
    const top = box(len, .06, 1.4, mat('belt'), 0, .53, 0); g.add(top);
    for (let i = 0; i < 4; i++) g.add(box(.2, .5, .2, mat('belt'), (i / 3 - .5) * (len - .4), .25, .9));
    return g;
  }
  // 工廠裡的六站（第 5 關）
  function station(kind) {
    const g = new T.Group();
    if (kind === 'cut') { g.add(box(1, .3, .8, mat('steel'), 0, .15, 0)); g.add(box(.9, .2, .7, mat('red'), 0, .9, 0)); g.add(box(.08, .5, .08, mat('dark'), 0, .55, 0)); }
    else if (kind === 'eyes') { g.add(box(.9, .2, .7, mat('cream'), 0, .1, 0)); [-.2, .2].forEach(x => { g.add(ball(.14, mat('dark'), x, .38, 0, 12)); g.add(cyl(.04, .04, .3, mat('white'), x, .2, 0, 6)); }); }
    else if (kind === 'sew') { g.add(box(1, .3, .6, mat('white'), 0, .15, 0)); g.add(box(.2, .7, .3, mat('white'), -.35, .6, 0)); g.add(box(.8, .2, .3, mat('white'), 0, .9, 0)); g.add(cyl(.02, .02, .35, mat('dark'), .3, .65, 0, 6)); }
    else if (kind === 'flip') { const b = miniBear(.5); b.rotation.z = Math.PI; b.position.y = 1.1; g.add(b); g.add(box(.9, .2, .6, mat('cream'), 0, .1, 0)); }
    else if (kind === 'stuff') { g.add(cyl(.35, .35, .7, mat('steel'), 0, .35, 0, 14)); const n = new T.Mesh(new T.ConeGeometry(.2, .5, 12), mat('steel')); n.rotation.z = -Math.PI / 2; n.position.set(.5, .5, 0); g.add(n); g.add(ball(.18, mat('cotton'), .85, .5, 0, 10)); }
    else if (kind === 'close') { g.add(cyl(.02, .02, .9, mat('steel'), 0, .55, 0, 6)).rotation.z = .4; g.add(spool('red')).scale.setScalar(.7); }
    return g;
  }

  // ---------- 港口、貿易 ----------
  function cbox(s = 1) { const g = new T.Group(); g.add(box(.9 * s, .7 * s, .7 * s, mat('cardboard'), 0, .35 * s, 0)); g.add(box(.2 * s, .72 * s, .72 * s, mat('cream'), 0, .35 * s, 0)); return g; }
  function container(col = 'container') { const g = new T.Group(); g.add(box(2.4, 1.1, 1, mat(col), 0, .55, 0)); [-.6, .6].forEach(x => g.add(box(.06, 1, 1.04, mat('white', { roughness: .9 }), x, .55, 0))); return g; }
  function truck() { const g = new T.Group(); g.add(box(1, .9, 1, mat('red'), 1.2, .65, 0)); g.add(box(2.4, .2, 1, mat('steel'), -.2, .3, 0)); [-1, .2, 1.2].forEach(x => [-.5, .5].forEach(z => g.add(cyl(.22, .22, .15, mat('dark'), x, .22, z, 12)).rotation.x = Math.PI / 2)); return g; }
  function ship() {
    const g = new T.Group();
    const hull = box(5, .9, 1.8, mat('red'), 0, .45, 0); g.add(hull);
    g.add(box(4.6, .3, 1.6, mat('white'), 0, .95, 0));
    g.add(box(.9, 1.2, 1.2, mat('white'), 1.8, 1.6, 0));
    [[-1.4, 'container'], [-.2, 'container2'], [.9, 'container3']].forEach(([x, c]) => { const k = container(c); k.scale.set(.42, .7, 1.1); k.rotation.y = Math.PI / 2; k.position.set(x, 1.1, 0); g.add(k); });
    return g;
  }
  function seaPatch(w = 10, d = 6) { const s = box(w, .1, d, mat('sea', { roughness: .5 }), 0, .05, 0); s.receiveShadow = true; return s; }
  function crane() { const g = new T.Group(); g.add(box(.3, 3.6, .3, mat('amber'), 0, 1.8, 0)); g.add(box(3, .25, .3, mat('amber'), .9, 3.5, 0)); g.add(cyl(.02, .02, 1.4, mat('dark'), 2.2, 2.75, 0, 6)); return g; }
  function booth() { const g = new T.Group(); g.add(box(1.2, 1.4, 1.2, mat('blue'), 0, .7, 0)); g.add(box(1.4, .2, 1.4, mat('white'), 0, 1.5, 0)); g.add(box(.6, .4, .05, glass(0xE6F4FA, .6), 0, .9, .62)); return g; }
  function shop() { const g = new T.Group(); g.add(box(2.2, 1.6, 1.6, mat('cream'), 0, .8, 0)); const roof = box(2.5, .25, 1.9, mat('red'), 0, 1.75, 0); g.add(roof); [-.7, 0, .7].forEach((x, i) => g.add(box(.6, .12, .3, mat(i % 2 ? 'white' : 'red'), x, 1.55, .95))); g.add(box(.7, 1, .05, mat('furDark'), 0, .5, .81)); return g; }
  function house() { const g = new T.Group(); g.add(box(1.8, 1.4, 1.6, mat('white'), 0, .7, 0)); const r = new T.Mesh(new T.ConeGeometry(1.5, 1, 4), mat('red')); r.position.y = 1.9; r.rotation.y = Math.PI / 4; r.castShadow = true; g.add(r); g.add(box(.5, .8, .05, mat('furDark'), 0, .4, .81)); return g; }
  function factory() { const g = new T.Group(); g.add(box(3, 1.8, 2, mat('steel'), 0, .9, 0)); [-.9, 0, .9].forEach(x => { const r = new T.Mesh(new T.ConeGeometry(.6, .6, 3), mat('steel')); r.position.set(x, 2, 0); r.rotation.y = Math.PI / 2; g.add(r); }); g.add(cyl(.18, .2, 1.2, mat('red'), 1.1, 2.4, -.5, 10)); return g; }
  function person(col = 'blue', h = 1) { const g = new T.Group(); g.add(cyl(.28, .34, .9 * h, mat(col), 0, .45 * h, 0, 14)); g.add(ball(.26, mat('cream'), 0, .9 * h + .3, 0, 14)); return g; }
  function parents() { const g = new T.Group(); const a = person('green', 1.1); a.position.x = -.35; g.add(a); const b = person('purple', 1); b.position.x = .35; g.add(b); return g; }
  function coin() { const g = new T.Group(); const c = cyl(.4, .4, .1, mat('amber', { roughness: .45, metalness: .3 }), 0, .45, 0, 20); c.rotation.x = Math.PI / 2; g.add(c); return g; }
  function shelf() { const g = new T.Group(); g.add(box(1.4, .1, .5, mat('furDark'), 0, .5, 0)); g.add(box(1.4, .1, .5, mat('furDark'), 0, 1.1, 0)); [-.65, .65].forEach(x => g.add(box(.08, 1.2, .5, mat('furDark'), x, .6, 0))); const b = miniBear(.3); b.position.set(0, .55, 0); g.add(b); return g; }
  function shield() { const g = new T.Group(); const s = cyl(.5, .5, .12, mat('green'), 0, .6, 0, 6); s.rotation.x = Math.PI / 2; g.add(s); const c = box(.12, .4, .06, mat('white'), -.1, .55, .08); c.rotation.z = .7; g.add(c); const c2 = box(.12, .6, .06, mat('white'), .12, .65, .08); c2.rotation.z = -.6; g.add(c2); return g; }
  // 設計圖（紙＋虛線小熊）、一袋棉花、一盒眼睛：第 4 關
  function design() { const g = new T.Group(); g.add(box(1.2, .04, .9, mat('white'), 0, .02, 0)); const b = bear(.3); b.rotation.x = -Math.PI / 2; b.position.set(0, .06, .25); g.add(b); g.add(cyl(.03, .03, .8, mat('red'), .5, .06, 0, 6)).rotation.z = Math.PI / 2; return g; }
  function cottonBag() { const g = new T.Group(); const b = ball(.5, mat('cream'), 0, .5, 0, 16); b.scale.y = 1.1; g.add(b); g.add(ball(.25, mat('cotton'), 0, 1.05, 0, 12)); return g; }
  function eyesBox() { const g = new T.Group(); g.add(box(.9, .3, .7, mat('cardboard'), 0, .15, 0)); [[-.2, 0], [.2, 0], [0, .15]].forEach(([x, z]) => g.add(ball(.12, mat('dark'), x, .38, z, 10))); return g; }
  // 第 7 關：斷針、秤、名牌
  function needle() { const g = new T.Group(); const a = cyl(.03, .03, .6, mat('steel', { roughness: .3, metalness: .5 }), -.15, .3, 0, 6); a.rotation.z = .9; g.add(a); const b = cyl(.03, .03, .4, mat('steel', { roughness: .3, metalness: .5 }), .25, .2, 0, 6); b.rotation.z = -.5; g.add(b); g.add(box(1, .06, .6, mat('cream'), 0, .03, 0)); return g; }
  function scale() { const g = new T.Group(); g.add(box(.9, .3, .9, mat('white'), 0, .15, 0)); g.add(cyl(.5, .5, .06, mat('steel'), 0, .33, 0, 16)); g.add(box(.4, .2, .05, mat('dark'), 0, .17, .46)); return g; }
  function nameTag() { const g = new T.Group(); const t = box(.8, .5, .06, mat('pink'), 0, .5, 0); g.add(t); g.add(cyl(.02, .02, .5, mat('red'), 0, .85, 0, 6)); return g; }
  function detector() { const g = new T.Group(); [-1.1, 1.1].forEach(x => g.add(box(.3, 2.2, .5, mat('steel'), x, 1.1, 0))); g.add(box(2.5, .3, .5, mat('steel'), 0, 2.3, 0)); const l = ball(.15, new T.MeshBasicMaterial({ color: 0x8fdc8f }), 0, 2.5, 0, 10); g.add(l); g.userData.light = l; return g; }
  function number(n) { const g = new T.Group(); g.add(cyl(.34, .34, .06, mat(n % 2 ? 'cream' : 'white'), 0, .03, 0, 20)); return g; }

  return { C, M, mat, ground, bear, miniBear, cottonPlant, field, sheep, oilPump, cottonBall, woolTuft, spool, oilDrop, pellets, cloth, machine, belt, station, cbox, container, truck, ship, seaPatch, crane, booth, shop, house, factory, person, parents, coin, shelf, shield, design, cottonBag, eyesBox, needle, scale, nameTag, detector, number };
})();
