// 《颱風怎麼來？》3D 場景：一片方形的黏土海面、立體的臺灣島（中央山脈）、遠一點看是一張黏土地圖（中國、日本、菲律賓…，示意不是真實比例），
// 一團逆時針轉的黏土颱風（雲臂是一個 InstancedMesh，整團只有 3 個物件）、太陽、小房子與防颱用品。
window.TY = (() => {
  'use strict';
  const { T, clay, glass, mesh, box, ball, cyl } = K3;
  const C = { sea: 0x5CA8D6, sea2: 0x3C8CC4, warm: 0xF2A35A, cold: 0xD6EEFA, land: 0xA5CB8C, land2: 0x8FB38A, mount: 0x6F9A72, cloud: 0xFFFFFF, eye: 0x2E6A98,
    sun: 0xFFC24A, red: 0xD2402A, amber: 0xF2A23A, white: 0xFFFBF4, cream: 0xFFF3DE, wood: 0xB98C5E, roof: 0xD2402A, glassB: 0xBFE3F2, dark: 0x3B3430, leaf: 0x4E9A3C };
  const M = {};
  const mat = (k, o) => M[k] || (M[k] = clay(C[k], o));
  const LAND = {
  cn:[[113,40],[113,22.2],[113.5,22.2],[114.3,22.4],[115.5,22.7],[116.5,23],[117.5,23.7],[118.2,24.5],[119,25.3],[119.6,26],[119.9,26.8],[120.5,27.5],[121,28.2],[121.6,29],[122,29.8],[121.5,30.6],[121.9,31.2],[121.3,32],[120.8,32.6],[120.3,34],[119.3,34.8],[120,35.9],[121,36.6],[122.5,37.1],[121.5,37.6],[120.5,37.6],[119,37.2],[118.5,38.1],[117.7,38.8],[118.3,39.2],[119.3,39.4],[120,40]],
  kr:[[124.6,40],[124.4,39.6],[125.2,39],[125,38.3],[126.1,37.7],[126.6,37],[126.2,36],[126.5,35],[126.4,34.4],[127.4,34.6],[128.5,34.9],[129.2,35.2],[129.5,36],[129.4,37],[128.6,38.2],[128.4,38.8],[127.6,39.7],[128.2,40]],
  kyu:[[130.9,33.95],[130.4,33.6],[129.8,33.4],[129.6,32.8],[130,32.4],[130.2,31.4],[130.7,31],[131.1,31.4],[131.4,31.9],[131.7,32.6],[131.9,33.2],[131.5,33.6]],
  shi:[[132.5,33.2],[133,32.75],[133.4,33.4],[134.2,33.3],[134.7,33.8],[134.3,34.2],[133.2,34.1],[132.6,33.9]],
  hon:[[130.9,34.1],[131.8,34.7],[132.6,35.4],[133.3,35.55],[134.4,35.65],[135.2,35.7],[135.9,35.8],[136.1,36.3],[136.8,37.2],[137.4,37.5],[137.3,36.8],[138.3,37.2],[139,37.9],[139.6,38.6],[139.9,39.6],[140,40.2],[141.7,40.2],[141.9,39],[141.5,38.3],[141,38],[141,37],[140.8,36.3],[140.8,35.7],[140.4,35.1],[139.8,35],[139.6,35.3],[139.1,35.2],[138.8,34.6],[138.2,34.6],[137.3,34.6],[136.9,34.3],[136.3,34.2],[135.9,33.5],[135.4,33.7],[135.1,34.2],[135.3,34.6],[134.5,34.7],[133.5,34.5],[132.4,34.3],[131.3,33.95]],
  luz:[[120.6,18.5],[121.2,18.6],[122.2,18.5],[122.3,17.2],[122,16.2],[121.6,15.7],[121.6,14.6],[122.2,14.2],[123,13.8],[124.1,13],[123.9,12.6],[123.2,13],[122.6,13.4],[121.8,13.9],[121,13.8],[120.6,14.3],[120.6,14.8],[119.9,15.4],[119.8,16.3],[120.4,16.6],[120.4,17.6]],
  min:[[120.3,13.5],[121.5,13.2],[121.2,12.2],[120.4,12.6]],
  sam:[[124.3,12.5],[125.6,12.2],[125.5,11],[124.9,10.3],[124.3,11.2]],
  pan:[[122,11.8],[123.1,11.5],[122.6,10.5],[121.9,10.7]],
  neg:[[122.6,10.9],[123.4,10.9],[123.2,9.2],[122.4,9.6]],
  mnd:[[123.5,8],[123.8,8.7],[125.3,9.6],[126.3,9.3],[126.6,8]],
  tw:[[121.55,25.3],[121.95,25.0],[121.85,24.6],[121.6,24.0],[121.5,23.4],[121.2,22.8],[120.9,22.3],[120.85,21.9],[120.7,22.0],[120.6,22.5],[120.25,22.6],[120.1,23.0],[120.15,23.6],[120.4,24.2],[120.75,24.7],[121.05,25.05]]
};
const ISLE=[[127.9,26.5,5,2],[125.3,24.8,2,1.5],[124.2,24.4,2.4,1.6],[123,24.45,1.4,1.2],[129.4,28.3,3,1.8],[130.6,30.4,2,1.6],[144.8,13.45,2.2,2.6]];

  // ---------- 地圖投影：經緯度 → 平面（x 往東、z 往南） ----------
  // 近看臺灣：near(lon,lat)；遠看東亞：far(lon,lat)
  const near = (lon, lat) => new T.Vector3((lon - 121) * 2.4, 0, (23.7 - lat) * 2.4);
  const far = (lon, lat) => new T.Vector3((lon - 131) * .45, 0, (24 - lat) * .45);
  function landMesh(pts, proj, h = .25, col = 'land') {
    const sh = new T.Shape();
    pts.forEach(([lo, la], i) => { const p = proj(lo, la); if (i) sh.lineTo(p.x, -p.z); else sh.moveTo(p.x, -p.z); });
    const g = new T.ExtrudeGeometry(sh, { depth: h, bevelEnabled: true, bevelThickness: h * .3, bevelSize: h * .25, bevelSegments: 2, curveSegments: 4 });
    const m = new T.Mesh(g, mat(col)); m.rotation.x = -Math.PI / 2; m.castShadow = m.receiveShadow = true;
    return m;
  }
  // 方形海面（近看）
  function seaSquare(w = 14, d = 12) { const s = box(w, .3, d, mat('sea', { roughness: .55 }), 0, -.15, 0); s.castShadow = false; return s; }
  // 立體臺灣（近看）：島＋中央山脈三座山
  function taiwan() {
    const g = new T.Group();
    g.add(landMesh(LAND.tw, near, .35));
    [[121.2, 24.2, .9, 1.1], [121.0, 23.5, 1, 1.4], [120.85, 22.8, .8, .9]].forEach(([lo, la, r, h]) => { const p = near(lo, la); const c = new T.Mesh(new T.ConeGeometry(r, h, 10), mat('mount')); c.position.set(p.x, .35 + h / 2, p.z); c.castShadow = true; g.add(c); });
    return g;
  }
  // 遠看的地圖：東亞的陸地（示意）
  function asiaMap() {
    const g = new T.Group();
    g.add(box(18.5, .3, 14, mat('sea', { roughness: .55 }), 0, -.15, 0));
    ['cn', 'kr', 'kyu', 'shi', 'hon', 'luz', 'mnd', 'tw'].forEach(k => g.add(landMesh(LAND[k], far, .18, k === 'tw' ? 'land2' : 'land')));
    [[127.9, 26.5, .22], [144.8, 13.45, .16]].forEach(([lo, la, r]) => { const p = far(lo, la); g.add(cyl(r, r, .2, mat('land'), p.x, .1, p.z, 12)); });
    return g;
  }
  // ---------- 颱風：一團逆時針轉的黏土雲 ----------
  function typhoon(R = 2, o = {}) {
    const g = new T.Group(), spin = new T.Group(); g.add(spin);
    const core = new T.Mesh(new T.SphereGeometry(R * .32, 20, 14), mat('cloud')); core.scale.y = .45; core.castShadow = true; spin.add(core);
    const eye = cyl(R * .09, R * .09, R * .2, mat('eye'), 0, 0, 0, 14); spin.add(eye);
    const arms = o.arms || 4, per = o.per || 7, n = arms * per;
    const puffs = new T.InstancedMesh(new T.SphereGeometry(1, 14, 10), mat('cloud'), n); puffs.castShadow = true;
    const Mx = new T.Matrix4(), Q = new T.Quaternion(), P = new T.Vector3(), S = new T.Vector3();
    let k = 0;
    for (let a = 0; a < arms; a++) for (let i = 1; i <= per; i++) {
      const t = i / per, ang = a * Math.PI * 2 / arms - t * 2.3, r = R * (.25 + t * .8);
      P.set(Math.cos(ang) * r, -t * R * .05, Math.sin(ang) * r); const s = R * (.24 * (1 - t * .65)); S.set(s, s * .45, s);
      Mx.compose(P, Q, S); puffs.setMatrixAt(k++, Mx);
    }
    spin.add(puffs);
    g.userData = { spin, core, eye, puffs, R, speed: o.speed == null ? 1.2 : o.speed };
    g.userData.step = dt => { spin.rotation.y += dt * g.userData.speed; };
    return g;
  }
  function sun(r = .9) { const g = new T.Group(); g.add(ball(r, new T.MeshBasicMaterial({ color: C.sun }), 0, 0, 0, 20)); g.add(K3.S3.glow(0xFFC46B, r * 4.2, .6)); return g; }
  function cloud(s = 1) { const g = new T.Group(); [[0, 0, 0, .55], [.5, -.05, 0, .42], [-.5, -.05, 0, .42], [.2, .3, 0, .4]].forEach(([x, y, z, r]) => g.add(ball(r * s, mat('cloud'), x * s, y * s, z, 14))); return g; }
  function house() { const g = new T.Group(); g.add(box(1.6, 1.2, 1.4, mat('white'), 0, .6, 0)); const r = new T.Mesh(new T.ConeGeometry(1.35, .9, 4), mat('roof')); r.position.y = 1.65; r.rotation.y = Math.PI / 4; r.castShadow = true; g.add(r); g.add(box(.45, .7, .05, mat('wood'), 0, .35, .71)); return g; }
  function star() { const s = new T.Shape(); for (let i = 0; i < 10; i++) { const r = i % 2 ? .22 : .5, a = i / 10 * Math.PI * 2 - Math.PI / 2; const x = Math.cos(a) * r, y = Math.sin(a) * r; if (i) s.lineTo(x, y); else s.moveTo(x, y); } const m = new T.Mesh(new T.ExtrudeGeometry(s, { depth: .18, bevelEnabled: true, bevelThickness: .05, bevelSize: .05, bevelSegments: 1 }), mat('amber')); m.rotation.x = -Math.PI / 2; m.castShadow = true; const g = new T.Group(); g.add(m); return g; }
  function leaf() { const g = new T.Group(); const l = ball(.5, mat('leaf'), 0, .12, 0, 14); l.scale.set(1.4, .2, .7); g.add(l); g.add(box(1.4, .04, .05, clay(0x2F6B24), 0, .2, 0)); return g; }
  function earthBall(r = .9) { const g = new T.Group(); g.add(ball(r, mat('sea'), 0, 0, 0, 24)); [[.3, .3, .5], [-.4, -.1, .45], [.1, -.5, .4]].forEach(([x, y, s]) => { const b = ball(r * s * .6, mat('land'), 0, 0, 0, 12); const p = new T.Vector3(x, y, .8).normalize().multiplyScalar(r * .92); b.position.copy(p); b.scale.z = .5; b.lookAt(p.clone().multiplyScalar(2)); g.add(b); }); return g; }
  // 防颱小任務的六張卡（3D 小場景）
  function card(i) {
    const g = new T.Group();
    if (i === 0) g.add(house());
    else if (i === 1) { for (let k = 0; k < 3; k++) { const w = new T.Mesh(new T.TorusGeometry(.5, .14, 8, 16, Math.PI), mat('sea')); w.position.set(-.8 + k * .8, .3, 0); g.add(w); } g.add(box(.3, .6, .3, mat('red'), 0, .3, .6)); }
    else if (i === 2) { g.add(cyl(.18, .18, .9, mat('dark'), -.4, .45, 0, 12)).rotation.z = Math.PI / 2; g.add(cyl(.25, .25, .25, mat('amber'), .1, .45, 0, 12)).rotation.z = Math.PI / 2; g.add(cyl(.28, .28, 1, glass(0xBFE3F2, .6), .7, .5, 0, 14)); }
    else if (i === 3) { g.add(cyl(.45, .32, .6, clay(0xC2693C), 0, .3, 0, 14)); const p = ball(.45, mat('leaf'), 0, .85, 0, 12); p.scale.y = 1.2; g.add(p); }
    else if (i === 4) { const m = new T.Mesh(new T.ConeGeometry(1, 1.5, 6), mat('mount')); m.position.y = .75; g.add(m); g.add(box(.4, .05, 1.6, mat('sea'), .9, .05, .3)); }
    else { g.add(box(1.4, 1.4, .1, mat('wood'), 0, .7, 0)); g.add(box(1.2, 1.2, .06, glass(0xBFE3F2, .5), 0, .7, .04)); }
    return g;
  }
  return { C, M, mat, LAND, near, far, landMesh, seaSquare, taiwan, asiaMap, typhoon, sun, cloud, house, star, leaf, earthBall, card };
})();
