// 《做一台機器人》的 3D 黏土模型：全部用 three.js 基本幾何拼，沒有貼圖檔、沒有表情符號。
// 顏色只有三種意思：機器人身體＝淡奶油、你裝上去的零件＝珊瑚紅、馬達和燈＝天藍。架子＝木頭，背景＝米白。
// 機器人的座標（還沒放大前）：腳底 y=0，面向 +z。
window.ART = (() => {
  'use strict';
  const T = THREE;
  const C = {
    bg: 0xF7F0E4, ground: 0xF3E9D8, paper: 0xFFF8EE,
    cream: 0xF1E4CF, cream2: 0xD9C8AF, coral: 0xF05A3C, sky: 0x3C9BE0,
    wood: 0xD9B27A, woodDark: 0xB98E5A, ink: 0x3B3430, ghost: 0x8FAAC4, glassOff: 0x34404C,
  };
  const std = (color, o = {}) => new T.MeshStandardMaterial(Object.assign({ color, roughness: .86, metalness: 0 }, o));
  const M = {
    cream: S3.clay({ color: C.cream }),
    cream2: S3.clay({ color: C.cream2 }),
    coral: S3.clay({ color: C.coral }),
    sky: S3.clay({ color: C.sky }),
    ink: std(C.ink),
    wood: std(C.wood, { roughness: .9 }),
    woodDark: std(C.woodDark, { roughness: .9 }),
    paper: std(C.paper, { roughness: .92 }),
    turn: std(0xFBF4E8, { roughness: .9 }),
    block: S3.clay({ color: 0xE9A27A }),            // 要搬的「燙金屬」：暖橘，比零件的珊瑚紅淡
    glass: std(C.glassOff, { roughness: .35, emissive: new T.Color(C.sky), emissiveIntensity: 0 }),
    light: std(0x9DB6C8, { roughness: .5, emissive: new T.Color(C.sky), emissiveIntensity: 0 }),
    white: std(0xFFFFFF, { roughness: .4 }),
    ghost: new T.MeshStandardMaterial({ color: C.ghost, roughness: .9, transparent: true, opacity: .26, depthWrite: false }),
  };

  // ---------- 尺寸（還沒放大前） ----------
  const D = {
    legX: .36, bodyY: 1.42, bodyW: 1.5, bodyH: 1.32, bodyR: .3, bodyD: .8, bevel: .08,
    winR: .38, headY: 2.95, headR: .64, eyeY: 2.97, eyeX: .25, shY: 1.86, shX: .9, armL: 1.3, topY: 3.72,
  };
  D.front = D.bodyD / 2 + D.bevel;                   // 身體正面 z
  D.eyeZ = Math.sqrt(D.headR * D.headR - D.eyeX * D.eyeX - (D.eyeY - D.headY) ** 2);

  const mesh = (geo, mat, x = 0, y = 0, z = 0) => { const m = new T.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = true; m.receiveShadow = true; return m; };
  function roundRect(w, h, r) {
    const s = new T.Shape(), x = -w / 2, y = -h / 2;
    s.moveTo(x + r, y); s.lineTo(x + w - r, y); s.quadraticCurveTo(x + w, y, x + w, y + r);
    s.lineTo(x + w, y + h - r); s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    s.lineTo(x + r, y + h); s.quadraticCurveTo(x, y + h, x, y + h - r);
    s.lineTo(x, y + r); s.quadraticCurveTo(x, y, x + r, y);
    return s;
  }

  // ---------- 共用幾何（輪廓重用同一份） ----------
  const G = {};
  G.leg = new T.LatheGeometry([[0, 0], [.27, 0], [.29, .05], [.27, .15], [.18, .22], [.16, .78], [0, .78]].map(([x, y]) => new T.Vector2(x, y)), 18);
  {
    const s = roundRect(D.bodyW, D.bodyH, D.bodyR);
    const hole = new T.Path(); hole.absarc(0, .03, D.winR, 0, Math.PI * 2, true); s.holes.push(hole);
    G.body = new T.ExtrudeGeometry(s, { depth: D.bodyD, bevelEnabled: true, bevelThickness: D.bevel, bevelSize: D.bevel, bevelSegments: 3, curveSegments: 14 });
    G.body.translate(0, 0, -D.bodyD / 2);
    const solid = roundRect(D.bodyW, D.bodyH, D.bodyR);  // 輪廓用：沒有洞
    G.bodyGhost = new T.ExtrudeGeometry(solid, { depth: D.bodyD, bevelEnabled: true, bevelThickness: D.bevel, bevelSize: D.bevel, bevelSegments: 2, curveSegments: 10 });
    G.bodyGhost.translate(0, 0, -D.bodyD / 2);
  }
  G.plug = new T.CylinderGeometry(D.winR + .01, D.winR + .01, .5, 28); G.plug.rotateX(Math.PI / 2);
  G.neck = new T.CylinderGeometry(.17, .19, .32, 16);
  G.head = new T.SphereGeometry(D.headR, 24, 18);
  G.socket = new T.BoxGeometry(.52, .16, .42);
  G.eyeSocket = new T.CylinderGeometry(.18, .18, .08, 22); G.eyeSocket.rotateX(Math.PI / 2);
  G.armSeg = new T.CapsuleGeometry(.13, D.armL - .4, 4, 12);
  G.motor = new T.CylinderGeometry(.17, .17, .26, 20); G.motor.rotateZ(Math.PI / 2);
  G.claw = new T.TorusGeometry(.14, .058, 8, 18, Math.PI * 1.45);
  G.comp = new T.BoxGeometry(.42, .24, .32);
  G.dot = new T.SphereGeometry(.042, 10, 8);
  G.rim = new T.TorusGeometry(.15, .05, 10, 24);
  G.glass = new T.CylinderGeometry(.135, .135, .06, 22); G.glass.rotateX(Math.PI / 2);
  G.pupil = new T.CylinderGeometry(.058, .058, .03, 16); G.pupil.rotateX(Math.PI / 2);
  G.shine = new T.SphereGeometry(.024, 8, 6);
  {
    // 齒輪：一個 Shape 擠出來，一顆 mesh（中間一個軸孔）
    const s = new T.Shape(), n = 11, ro = .335, ri = .27;
    for (let i = 0; i < n; i++) {
      const a = i / n * Math.PI * 2, w = Math.PI * 2 / n;
      const P = (ang, r) => [Math.cos(ang) * r, Math.sin(ang) * r];
      const pts = [P(a, ri), P(a + w * .18, ro), P(a + w * .48, ro), P(a + w * .64, ri)];
      pts.forEach((p, k) => (i === 0 && k === 0 ? s.moveTo(...p) : s.lineTo(...p)));
    }
    s.closePath();
    const h = new T.Path(); h.absarc(0, 0, .07, 0, Math.PI * 2, true); s.holes.push(h);
    G.gear = new T.ExtrudeGeometry(s, { depth: .1, bevelEnabled: true, bevelThickness: .02, bevelSize: .015, bevelSegments: 2, curveSegments: 10 });
    G.gear.translate(0, 0, -.05);
  }
  G.shaft = new T.CylinderGeometry(.045, .045, 1.0, 10); G.shaft.rotateX(Math.PI / 2);
  G.wing = new T.TorusGeometry(.12, .045, 8, 18);
  G.hub = new T.CylinderGeometry(.09, .09, .16, 14); G.hub.rotateX(Math.PI / 2);
  G.roll = new T.CylinderGeometry(.15, .15, .92, 20); G.roll.rotateZ(Math.PI / 2);
  G.band = new T.CylinderGeometry(.162, .162, .12, 20); G.band.rotateZ(Math.PI / 2);

  // ---------- 身體（齒輪那一步才變成實體）：腳、身體、胸口圓窗、背後發條鑰匙、脖子、圓頭、頭頂插槽、兩個眼窩 ----------
  function body() {
    const g = new T.Group();
    [-D.legX, D.legX].forEach(x => g.add(mesh(G.leg, M.cream, x, 0, 0)));
    g.add(mesh(G.body, M.cream, 0, D.bodyY, 0));
    g.add(mesh(G.plug, M.cream2, 0, D.bodyY + .03, -.05));
    g.add(mesh(G.neck, M.cream2, 0, 2.24, 0));
    g.add(mesh(G.head, M.cream, 0, D.headY, 0));
    g.add(mesh(G.socket, M.cream2, 0, D.headY + D.headR - .02, 0));
    // 背後的發條鑰匙：從圓窗後面伸出來（轉過去才看得到的小獎賞），跟著齒輪轉
    const key = new T.Group(); key.position.set(0, D.bodyY + .03, -D.front + .05);
    const shaft = mesh(G.shaft, M.cream2, 0, 0, -.1); shaft.scale.z = .35; key.add(shaft);
    [-1, 1].forEach(sx => { const w = mesh(G.wing, M.cream2, sx * .13, 0, -.3); w.rotation.x = Math.PI / 2; key.add(w); });
    g.add(key); g.userData.key = key;
    g.userData.sockets = [-1, 1].map(sx => {
      const s = mesh(G.eyeSocket, M.cream2, sx * D.eyeX * .985, D.eyeY, D.eyeZ * .985 - .02);
      s.lookAt(sx * D.eyeX * 3, D.eyeY + (D.eyeY - D.headY) * 2, D.eyeZ * 3);
      g.add(s); return s;
    });
    return g;
  }
  // 半透明的輪廓（設計圖浮出來的樣子）：重用同一份幾何
  function ghost() {
    const g = new T.Group(), part = {};
    const m = (geo, x, y, z) => { const o = new T.Mesh(geo, M.ghost); o.position.set(x, y, z); o.renderOrder = 2; return o; };
    part.body = new T.Group();
    [-D.legX, D.legX].forEach(x => part.body.add(m(G.leg, x, 0, 0)));
    part.body.add(m(G.bodyGhost, 0, D.bodyY, 0));
    part.body.add(m(G.neck, 0, 2.24, 0));
    part.body.add(m(G.head, 0, D.headY, 0));
    part.arms = new T.Group();
    [-1, 1].forEach(sx => { const a = m(G.armSeg, sx * (D.shX + .02), D.shY - D.armL / 2 + .05, 0); a.rotation.z = sx * .05; part.arms.add(a); });
    part.eyes = new T.Group();
    [-1, 1].forEach(sx => { const e = m(G.rim, sx * D.eyeX, D.eyeY, D.eyeZ + .02); e.lookAt(sx * D.eyeX * 3, D.eyeY, D.eyeZ * 3); part.eyes.add(e); });
    part.comp = new T.Group();
    part.comp.add(m(G.comp, 0, D.topY, 0));
    Object.values(part).forEach(p => g.add(p));
    g.userData.part = part;
    return g;
  }

  // ---------- 五個零件：每個都是「外層（位置）＋內層 j（果凍回彈）」 ----------
  function wrap(inner) { const o = new T.Group(); o.add(inner); o.userData.j = inner; return o; }

  // r：一捲設計圖
  function roll() {
    const j = new T.Group();
    j.add(mesh(G.roll, M.paper));
    j.add(mesh(G.band, M.coral));
    return wrap(j);
  }
  // o：齒輪（裝進胸口的圓窗）
  function gear() {
    const j = new T.Group();
    const gr = mesh(G.gear, M.coral); j.add(gr);
    j.add(mesh(G.hub, M.coral, 0, 0, 0));
    const o = wrap(j);
    o.userData.spin = gr;
    return o;
  }
  // b：一對手臂，肩膀是看得到的天藍色小馬達
  function arms() {
    const j = new T.Group(), side = [];
    [-1, 1].forEach(sx => {
      const sh = new T.Group(); sh.position.x = sx * D.shX;
      sh.add(mesh(G.motor, M.sky, sx * .02, 0, 0));
      const seg = mesh(G.armSeg, M.coral, sx * .04, -D.armL / 2 + .07, 0); sh.add(seg);
      const claw = mesh(G.claw, M.coral, sx * .04, -D.armL + .05, 0);
      claw.rotation.z = sx > 0 ? -2.28 : .864;   // C 形夾子，開口朝內
      sh.add(claw);
      sh.userData.claw = claw;
      j.add(sh); side.push(sh);
    });
    const o = wrap(j);
    o.userData.side = side;                  // [左, 右]，轉 rotation.x 舉起來、rotation.z 往內夾
    return o;
  }
  // o：兩顆圓鏡頭眼睛（嵌在圓頭裡）
  function eyes() {
    const j = new T.Group(), pupils = [], lens = [];
    [-1, 1].forEach(sx => {
      const e = new T.Group();
      e.position.set(sx * D.eyeX, 0, 0);
      e.lookAt(sx * D.eyeX * 3 - sx * D.eyeX, (D.eyeY - D.headY) * 2, D.eyeZ * 2);
      e.add(mesh(G.rim, M.coral));
      e.add(mesh(G.glass, M.glass, 0, 0, -.005));
      const p = new T.Group(); p.position.z = .03;
      p.add(mesh(G.pupil, M.ink));
      p.add(mesh(G.shine, M.white, .025, .028, .02));
      e.add(p);
      j.add(e); pupils.push(p); lens.push(e);
    });
    const o = wrap(j);
    o.userData.pupils = pupils; o.userData.lens = lens;
    return o;
  }
  // t：一片小電腦（兩個燈）
  function computer() {
    const j = new T.Group();
    j.add(mesh(G.comp, M.coral));
    [-.09, .09].forEach(x => j.add(mesh(G.dot, M.light, x, .02, .165)));
    return wrap(j);
  }

  // ---------- 場景裡的其他東西 ----------
  // 轉台：機器人站在上面，拖空白處就轉
  function turntable(r = 2.1) {
    const g = new T.Group();
    g.add(mesh(new T.CylinderGeometry(r + .08, r + .14, .12, 48), M.woodDark, 0, .06, 0));
    g.add(mesh(new T.CylinderGeometry(r, r, .1, 48), M.turn, 0, .16, 0));
    return g;
  }
  // 要搬的小方塊（b 那一步才出現）
  function block() { return wrap(mesh(new T.BoxGeometry(.5, .5, .5), M.block)); }

  // 設計圖上畫的：機器人正面的線稿（和輪廓同一個藍灰色）
  function blueprintTex() {
    const W = 256, H = 320, c = document.createElement('canvas'); c.width = W; c.height = H;
    const x = c.getContext('2d');
    x.fillStyle = '#FFF8EE'; x.fillRect(0, 0, W, H);
    x.strokeStyle = 'rgba(143,170,196,.25)'; x.lineWidth = 1;
    for (let i = 16; i < W; i += 16) { x.beginPath(); x.moveTo(i, 0); x.lineTo(i, H); x.stroke(); }
    for (let i = 16; i < H; i += 16) { x.beginPath(); x.moveTo(0, i); x.lineTo(W, i); x.stroke(); }
    x.strokeStyle = '#6F8FAE'; x.lineWidth = 5; x.lineCap = 'round'; x.lineJoin = 'round';
    const cx = W / 2;
    x.beginPath(); x.arc(cx, 96, 44, 0, 7); x.stroke();                                // 頭
    x.strokeRect(cx - 18, 42, 36, 12);                                                  // 頭頂插槽
    [-1, 1].forEach(s => { x.beginPath(); x.arc(cx + s * 17, 98, 11, 0, 7); x.stroke(); });   // 眼睛
    x.beginPath(); x.moveTo(cx, 140); x.lineTo(cx, 152); x.stroke();                   // 脖子
    const rr = (l, t, w, h, r) => { x.beginPath(); x.moveTo(l + r, t); x.arcTo(l + w, t, l + w, t + h, r); x.arcTo(l + w, t + h, l, t + h, r); x.arcTo(l, t + h, l, t, r); x.arcTo(l, t, l + w, t, r); x.closePath(); x.stroke(); };
    rr(cx - 52, 152, 104, 92, 20);                                                      // 身體
    x.beginPath(); x.arc(cx, 198, 25, 0, 7); x.stroke();                                // 胸口圓窗
    [-1, 1].forEach(s => { x.beginPath(); x.moveTo(cx + s * 60, 162); x.lineTo(cx + s * 66, 238); x.stroke(); });   // 手臂
    [-1, 1].forEach(s => { x.beginPath(); x.moveTo(cx + s * 24, 246); x.lineTo(cx + s * 24, 290); x.lineTo(cx + s * 38, 290); x.stroke(); });   // 腳
    const t = new T.CanvasTexture(c); t.colorSpace = T.SRGBColorSpace; t.anisotropy = 4;
    return t;
  }
  // 小畫架：三支腳＋一張會攤開的紙（紙的上緣在 bar 的位置）
  function easel() {
    const g = new T.Group();
    const leg = (x0, z0, x1, y1, z1) => {
      const a = new T.Vector3(x0, 0, z0), b = new T.Vector3(x1, y1, z1), len = a.distanceTo(b);
      const m = mesh(new T.CylinderGeometry(.04, .05, len, 8), M.wood);
      m.position.copy(a).add(b).multiplyScalar(.5);
      m.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), b.clone().sub(a).normalize());
      g.add(m);
    };
    leg(-.5, .2, -.3, 2.35, 0); leg(.5, .2, .3, 2.35, 0); leg(0, -.55, 0, 2.3, -.08);
    const ledge = mesh(new T.BoxGeometry(1.1, .06, .16), M.woodDark, 0, .95, .12); g.add(ledge);
    const bar = new T.Group(); bar.position.set(0, 2.32, .06); bar.rotation.x = -.12; g.add(bar);
    const geo = new T.PlaneGeometry(.96, 1.28); geo.translate(0, -.64, 0);
    const sheet = new T.Mesh(geo, new T.MeshStandardMaterial({ map: blueprintTex(), roughness: .92, side: T.DoubleSide }));
    sheet.position.z = .02; sheet.castShadow = true; sheet.receiveShadow = true;
    sheet.scale.y = .02; sheet.visible = false;
    bar.add(sheet);
    g.userData.bar = bar; g.userData.sheet = sheet;
    return g;
  }
  // 木頭架子：五個零件從左到右 r o b o t
  function shelf(w, h, d) {
    const g = new T.Group();
    g.add(mesh(new T.BoxGeometry(w, h, d), M.wood, 0, h / 2, 0));
    g.add(mesh(new T.BoxGeometry(w + .12, .08, d + .1), M.woodDark, 0, h + .04, 0));
    return g;
  }
  // 呼吸光圈（落點用）：一張圓環貼圖，一般混色（米白底上加法混色會看不見）
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
  function halo(size = .7) {
    const s = new T.Sprite(new T.SpriteMaterial({ map: haloTex(), color: C.coral, transparent: true, opacity: 0, depthTest: false, depthWrite: false }));
    s.scale.set(size, size, 1); s.renderOrder = 10;
    return s;
  }
  // 架子上「現在這一個」底下的光圈（平放在架子上）
  function floorRing() {
    const m = new T.Mesh(new T.RingGeometry(.42, .56, 40), new T.MeshBasicMaterial({ color: C.coral, transparent: true, opacity: 0, depthWrite: false }));
    m.rotation.x = -Math.PI / 2;
    return m;
  }

  return { C, M, D, body, ghost, roll, gear, arms, eyes, computer, turntable, block, easel, shelf, halo, floorRing };
})();
