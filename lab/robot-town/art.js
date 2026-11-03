// 《機器人出任務》的 3D 黏土模型：全部用 three.js 基本幾何拼，沒有貼圖檔、沒有表情符號。
// 主角就是《做一台機器人》做好的那台（米白身體、珊瑚紅零件、天藍馬達），底下多一塊有輪子的底盤。
// 顏色的意思：機器人身體＝淡奶油、原本的零件＝珊瑚紅、馬達和燈＝天藍、任務拿到的裝備＝琥珀。
// 機器人的座標（還沒放大前）：腳底 y=0，面向 +z。
window.ART = (() => {
  'use strict';
  const T = THREE;
  const C = {
    bg: 0xF7F0E4, ground: 0xF3E9D8, paper: 0xFFF8EE, road: 0xEADCC2,
    cream: 0xF1E4CF, cream2: 0xD9C8AF, coral: 0xF05A3C, sky: 0x3C9BE0, amber: 0xF2A33A, yellow: 0xF7C948,
    sage: 0x6F9A72, sage2: 0xA9C4A3, leaf: 0x8DB487, green: 0x4CB05A, purple: 0x8B6FD6,
    wood: 0xD9B27A, woodDark: 0xB98E5A, ink: 0x3B3430, glassOff: 0x34404C,
  };
  const std = (color, o = {}) => new T.MeshStandardMaterial(Object.assign({ color, roughness: .86, metalness: 0 }, o));
  const clay = color => S3.clay({ color });
  const M = {
    cream: clay(C.cream), cream2: clay(C.cream2), coral: clay(C.coral), sky: clay(C.sky), amber: clay(C.amber),
    yellow: clay(C.yellow), sage: clay(C.sage), sage2: clay(C.sage2), leaf: clay(C.leaf), green: clay(C.green),
    ink: std(C.ink), wood: std(C.wood, { roughness: .9 }), woodDark: std(C.woodDark, { roughness: .9 }),
    paper: std(C.paper, { roughness: .92 }), road: std(C.road, { roughness: .95 }), ground: std(C.ground, { roughness: .95 }),
    glass: std(C.glassOff, { roughness: .35, emissive: new T.Color(C.sky), emissiveIntensity: .5 }),
    light: std(0x9DB6C8, { roughness: .5, emissive: new T.Color(C.sky), emissiveIntensity: 1.1 }),
    white: std(0xFFFFFF, { roughness: .4 }),
  };
  const mat = color => clay(color);

  // ---------- 尺寸（還沒放大前；和《做一台機器人》一樣） ----------
  const D = {
    bodyY: 1.42, bodyW: 1.5, bodyH: 1.32, bodyR: .3, bodyD: .8, bevel: .08,
    winR: .38, headY: 2.95, headR: .64, eyeY: 2.97, eyeX: .25, shY: 1.86, shX: .9, armL: 1.3, topY: 3.72,
  };
  D.front = D.bodyD / 2 + D.bevel;
  D.eyeZ = Math.sqrt(D.headR * D.headR - D.eyeX * D.eyeX - (D.eyeY - D.headY) ** 2);

  const mesh = (geo, m, x = 0, y = 0, z = 0) => { const o = new T.Mesh(geo, m); o.position.set(x, y, z); o.castShadow = true; o.receiveShadow = true; return o; };
  function roundRect(w, h, r) {
    const s = new T.Shape(), x = -w / 2, y = -h / 2;
    s.moveTo(x + r, y); s.lineTo(x + w - r, y); s.quadraticCurveTo(x + w, y, x + w, y + r);
    s.lineTo(x + w, y + h - r); s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    s.lineTo(x + r, y + h); s.quadraticCurveTo(x, y + h, x, y + h - r);
    s.lineTo(x, y + r); s.quadraticCurveTo(x, y, x + r, y);
    return s;
  }
  // 圓角方塊（往 y 擠出，中心在原點）
  function rbox(w, h, d, r = .12, bevel = .05) {
    const g = new T.ExtrudeGeometry(roundRect(w, d, Math.min(r, w / 2 - .01, d / 2 - .01)), { depth: h - bevel * 2, bevelEnabled: true, bevelThickness: bevel, bevelSize: bevel, bevelSegments: 2, curveSegments: 6 });
    g.rotateX(-Math.PI / 2); g.translate(0, -h / 2 + bevel, 0);
    return g;
  }

  // ---------- 共用幾何 ----------
  const G = {};
  {
    const s = roundRect(D.bodyW, D.bodyH, D.bodyR);
    const hole = new T.Path(); hole.absarc(0, .03, D.winR, 0, Math.PI * 2, true); s.holes.push(hole);
    G.body = new T.ExtrudeGeometry(s, { depth: D.bodyD, bevelEnabled: true, bevelThickness: D.bevel, bevelSize: D.bevel, bevelSegments: 3, curveSegments: 14 });
    G.body.translate(0, 0, -D.bodyD / 2);
  }
  G.plug = new T.CylinderGeometry(D.winR + .01, D.winR + .01, .5, 28); G.plug.rotateX(Math.PI / 2);
  G.neck = new T.CylinderGeometry(.17, .19, .32, 16);
  G.head = new T.SphereGeometry(D.headR, 24, 18);
  G.socket = new T.BoxGeometry(.52, .16, .42);
  G.armSeg = new T.CapsuleGeometry(.13, D.armL - .4, 4, 12);
  G.motor = new T.CylinderGeometry(.17, .17, .26, 20); G.motor.rotateZ(Math.PI / 2);
  G.claw = new T.TorusGeometry(.14, .058, 8, 18, Math.PI * 1.45);
  G.comp = new T.BoxGeometry(.42, .24, .32);
  G.dot = new T.SphereGeometry(.042, 10, 8);
  G.rim = new T.TorusGeometry(.15, .05, 10, 24);
  G.glass = new T.CylinderGeometry(.135, .135, .06, 22); G.glass.rotateX(Math.PI / 2);
  G.pupil = new T.CylinderGeometry(.058, .058, .03, 16); G.pupil.rotateX(Math.PI / 2);
  G.shine = new T.SphereGeometry(.024, 8, 6);
  G.wheel = new T.CylinderGeometry(.27, .27, .2, 20); G.wheel.rotateZ(Math.PI / 2);
  G.hubcap = new T.CylinderGeometry(.11, .11, .22, 12); G.hubcap.rotateZ(Math.PI / 2);
  G.chassis = rbox(1.55, .42, 1.5, .25, .07);
  G.ball = new T.SphereGeometry(1, 20, 14);
  G.cyl = new T.CylinderGeometry(1, 1, 1, 18);
  G.box = new T.BoxGeometry(1, 1, 1);

  // ---------- 主角 ----------
  // 回傳 group：root（位置、朝向）→ jel（果凍）→ lean（加速後仰、轉彎側傾）→ 身體、零件、裝備
  function bot() {
    const root = new T.Group(), jel = new T.Group(), lean = new T.Group();
    root.add(jel); jel.add(lean);
    // 底盤＋四個小輪子
    lean.add(mesh(G.chassis, M.cream2, 0, .56, 0));
    const wheels = [];
    [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([sx, sz]) => {
      const w = new T.Group(); w.position.set(sx * .8, .27, sz * .48);
      w.add(mesh(G.wheel, M.ink)); w.add(mesh(G.hubcap, M.sky));
      lean.add(w); wheels.push(w);
    });
    // 身體（跟《做一台機器人》一樣）
    lean.add(mesh(G.body, M.cream, 0, D.bodyY, 0));
    lean.add(mesh(G.plug, M.cream2, 0, D.bodyY + .03, -.05));
    lean.add(mesh(G.neck, M.cream2, 0, 2.24, 0));
    const head = new T.Group(); lean.add(head);
    head.add(mesh(G.head, M.cream, 0, D.headY, 0));
    head.add(mesh(G.socket, M.cream2, 0, D.headY + D.headR - .02, 0));
    // 小電腦
    const comp = mesh(G.comp, M.coral, 0, D.topY, 0); head.add(comp);
    [-.09, .09].forEach(x => head.add(mesh(G.dot, M.light, x, D.topY + .02, .165)));
    // 眼睛
    const pupils = [], lens = [];
    [-1, 1].forEach(sx => {
      const e = new T.Group();
      e.position.set(sx * D.eyeX, D.eyeY, D.eyeZ);
      e.lookAt(sx * D.eyeX * 3, D.eyeY + (D.eyeY - D.headY) * 2, D.eyeZ * 3);
      e.add(mesh(G.rim, M.coral));
      e.add(mesh(G.glass, M.glass, 0, 0, -.005));
      const p = new T.Group(); p.position.z = .03;
      p.add(mesh(G.pupil, M.ink)); p.add(mesh(G.shine, M.white, .025, .028, .02));
      e.add(p); head.add(e); pupils.push(p); lens.push(e);
    });
    // 手臂：肩膀天藍小馬達＋珊瑚紅手臂＋夾子；side[0]＝機器人的右手（畫面左邊）
    const side = [];
    [-1, 1].forEach(sx => {
      const sh = new T.Group(); sh.position.set(sx * D.shX, D.shY, 0);
      sh.add(mesh(G.motor, M.sky, sx * .02, 0, 0));
      sh.add(mesh(G.armSeg, M.coral, sx * .04, -D.armL / 2 + .07, 0));
      const hand = new T.Group(); hand.position.set(sx * .04, -D.armL + .05, 0); sh.add(hand);
      const claw = mesh(G.claw, M.coral); claw.rotation.z = sx > 0 ? -2.28 : .864; hand.add(claw);
      sh.userData.hand = hand;
      lean.add(sh); side.push(sh);
    });
    // 裝備位（每一個都是 gear(n) 的同一份模型，裝上去就固定在身上）
    const gears = {};
    const at = (n, parent, x, y, z) => { const g = gear(n); g.position.set(x, y, z); g.visible = false; parent.add(g); gears[n] = g; return g; };
    at(1, lean, 0, 0, 0);
    at(2, lean, 0, .5, .86);
    at(3, side[0].userData.hand, 0, -.05, 0);
    at(4, head, .36, D.headY + .42, -.12);
    at(5, lean, 0, 1.6, -.52);
    at(6, lean, 0, D.bodyY + .03, .3);
    at(7, lean, 0, 0, 0);
    at(8, lean, 0, .3, 0);
    at(9, side[1].userData.hand, 0, -.05, 0);
    root.userData = { jel, lean, head, wheels, pupils, lens, side, gears, comp, walk: 0 };
    root.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
    return root;
  }
  // 依裝備清單顯示；legs：用腳（有四條腿時）
  function setGear(b, list, legs = false) {
    const u = b.userData;
    for (let n = 1; n <= 9; n++) if (u.gears[n]) u.gears[n].visible = list.includes(n);
    const useLegs = legs && list.includes(7);
    u.gears[7].visible = useLegs;
    const big = list.includes(1) && !useLegs;
    u.gears[1].visible = big;
    u.wheels.forEach(w => { w.visible = !big && !useLegs; });
    u.legs = useLegs;
  }

  // ---------- 十個裝備（第 10 關沒有新裝備） ----------
  // 每一個都以「裝在機器人身上的那個點」為原點
  function gear(n) {
    const g = new T.Group(), A = M.amber;
    if (n === 1) {        // 一對大輪子：琥珀輪框＋深色胎面＋一圈胎紋
      const ws = [];
      [-1, 1].forEach(sx => {
        const w = new T.Group(); w.position.set(sx * .98, .46, 0);
        const tire = mesh(new T.CylinderGeometry(.46, .46, .28, 24), M.ink); tire.rotation.z = Math.PI / 2; w.add(tire);
        const rim = mesh(new T.CylinderGeometry(.24, .24, .3, 16), A); rim.rotation.z = Math.PI / 2; w.add(rim);
        for (let k = 0; k < 10; k++) {
          const a = k / 10 * Math.PI * 2, t = mesh(new T.BoxGeometry(.3, .09, .12), M.ink, 0, Math.cos(a) * .46, Math.sin(a) * .46);
          t.rotation.x = -a; w.add(t);
        }
        g.add(w); ws.push(w);
      });
      g.userData.spin = ws;
    } else if (n === 2) { // 前保險桿：一條圓圓的軟條，碰到會亮
      const m = A.clone(); m.emissive = new T.Color(C.sky); m.emissiveIntensity = 0;
      const bar = mesh(new T.CapsuleGeometry(.14, 1.3, 4, 12), m); bar.rotation.z = Math.PI / 2; g.add(bar);
      [-.55, .55].forEach(x => g.add(mesh(new T.CylinderGeometry(.06, .06, .2, 8).rotateX(Math.PI / 2), M.cream2, x, 0, -.12)));
      g.userData.glowMat = m;
    } else if (n === 3) { // 右手夾子：兩根粗指頭
      g.add(mesh(new T.CylinderGeometry(.16, .16, .14, 14), A, 0, 0, 0));
      const fingers = [-1, 1].map(s => { const f = new T.Group(); f.position.x = s * .1; f.add(mesh(new T.CapsuleGeometry(.055, .26, 3, 8), A, 0, -.2, 0)); f.rotation.z = s * .25; g.add(f); return f; });
      g.userData.fingers = fingers;
    } else if (n === 4) { // 頭頂相機桿：細桿＋小相機（天藍鏡頭）
      g.add(mesh(new T.CylinderGeometry(.04, .05, .62, 8), M.cream2, 0, .31, 0));
      const cam = new T.Group(); cam.position.y = .7; g.add(cam);
      cam.add(mesh(new T.BoxGeometry(.32, .22, .24), A));
      cam.add(mesh(new T.CylinderGeometry(.08, .08, .1, 14).rotateX(Math.PI / 2), M.light, 0, 0, .15));
      g.userData.cam = cam;
    } else if (n === 5) { // 背上螺旋槳帽：一根桿子伸到頭上方，兩片槳
      g.add(mesh(new T.CylinderGeometry(.045, .045, 2.5, 8), M.cream2, 0, 1.25, 0));
      const rot = new T.Group(); rot.position.y = 2.55; g.add(rot);
      rot.add(mesh(new T.CylinderGeometry(.1, .1, .1, 12), A));
      [0, Math.PI].forEach(a => { const b = mesh(new T.CapsuleGeometry(.07, .62, 3, 8), A, Math.cos(a) * .42, 0, Math.sin(a) * .42); b.rotation.z = Math.PI / 2; b.rotation.y = -a; b.scale.y = .45; b.rotation.x = .25; rot.add(b); });
      g.userData.rotor = rot;
    } else if (n === 6) { // 胸口探照燈
      g.add(mesh(new T.CylinderGeometry(.36, .3, .26, 22).rotateX(Math.PI / 2), A, 0, 0, 0));
      const lm = M.light.clone(); lm.emissiveIntensity = 1.4;
      g.add(mesh(new T.CylinderGeometry(.25, .25, .06, 22).rotateX(Math.PI / 2), lm, 0, 0, .13));
      g.userData.lamp = lm;
    } else if (n === 7) { // 四條腿（取代輪子）
      const legs = [];
      [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([sx, sz]) => {
        const hip = new T.Group(); hip.position.set(sx * .62, .5, sz * .45); g.add(hip);
        hip.add(mesh(new T.SphereGeometry(.13, 12, 10), M.cream2));
        const up = mesh(new T.CapsuleGeometry(.09, .2, 3, 8), A, 0, -.17, 0); hip.add(up);
        const knee = new T.Group(); knee.position.y = -.32; hip.add(knee);
        knee.add(mesh(new T.CapsuleGeometry(.08, .1, 3, 8), A, 0, -.1, 0));
        knee.add(mesh(new T.SphereGeometry(.12, 12, 8).scale(1, .5, 1.2), M.ink, 0, -.17, .03));
        legs.push({ hip, knee, sx, sz });
      });
      g.userData.legs = legs;
    } else if (n === 8) { // 腳下升降盤
      g.add(mesh(new T.CylinderGeometry(.95, .95, .08, 32), A, 0, 0, 0));
      g.add(mesh(new T.CylinderGeometry(.5, .5, .1, 24), M.cream2, 0, .05, 0));
    } else if (n === 9) { // 左手鑷子：兩根細長的尖
      g.add(mesh(new T.CylinderGeometry(.1, .12, .14, 12), A, 0, 0, 0));
      [-1, 1].forEach(s => { const p = mesh(new T.CylinderGeometry(.025, .012, .5, 6), A, s * .045, -.3, 0); p.rotation.z = s * .08; g.add(p); });
    }
    g.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
    return g;
  }
  // 每個裝備單獨放在架子上／飛過去時的樣子（放大＋擺正）
  const GEAR_SHOW = { 1: [.55, 0, -.42, 0], 2: [.8, 0, 0, 0], 3: [1.3, 0, .35, 0], 4: [1, 0, 0, 0], 5: [.45, 0, 0, 0], 6: [1.1, 0, 0, 0], 7: [.9, 0, -.05, 0], 8: [.75, 0, 0, 0], 9: [1.4, 0, .45, 0] };
  function gearShow(n) {
    const g = new T.Group(), inner = gear(n), [s, , y] = GEAR_SHOW[n] || [1, 0, 0];
    if (n === 1) inner.children.forEach(w => { w.position.x *= .55; });
    inner.position.y = y; g.add(inner); g.scale.setScalar(s);
    g.userData.inner = inner;
    return g;
  }

  // ---------- 小鎮 ----------
  // 圓桌：米色桌面＋木頭收邊
  function table(r) {
    const g = new T.Group();
    g.add(mesh(new T.CylinderGeometry(r + .5, r + .8, .8, 72), M.woodDark, 0, -.42, 0));
    const top = mesh(new T.CylinderGeometry(r, r, .06, 72), M.ground, 0, -.03, 0); g.add(top);
    g.add(mesh(new T.TorusGeometry(r + .25, .28, 10, 96).rotateX(Math.PI / 2), M.wood, 0, -.02, 0));
    return g;
  }
  // 環狀道路
  function road(r, w) {
    const m = new T.Mesh(new T.RingGeometry(r - w / 2, r + w / 2, 96, 1), M.road);
    m.rotation.x = -Math.PI / 2; m.position.y = .005; m.receiveShadow = true;
    return m;
  }
  // 數字貼圖（站號）：米白底、墨色數字（只有數字，沒有字）
  const numTex = {};
  function numberTex(n) {
    if (numTex[n]) return numTex[n];
    const c = document.createElement('canvas'); c.width = c.height = 128;
    const x = c.getContext('2d');
    x.fillStyle = '#FFF8EE'; x.beginPath(); x.arc(64, 64, 62, 0, 7); x.fill();
    x.fillStyle = '#3B3430'; x.font = '700 76px "Avenir Next","Helvetica Neue",system-ui,sans-serif';
    x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(String(n), 64, 70);
    const t = new T.CanvasTexture(c); t.colorSpace = T.SRGBColorSpace; t.anisotropy = 4;
    numTex[n] = t; return t;
  }
  // 任務站：圓形地墊＋光暈圈＋站號＋一個小標誌（這一站在做什麼）
  function station(n) {
    const g = new T.Group();
    g.add(mesh(new T.CylinderGeometry(1.15, 1.2, .08, 40), M.paper, 0, .04, 0));
    const ring = new T.Mesh(new T.RingGeometry(1.25, 1.55, 48), new T.MeshBasicMaterial({ color: C.coral, transparent: true, opacity: 0, depthWrite: false }));
    ring.rotation.x = -Math.PI / 2; ring.position.y = .03; g.add(ring);
    const done = new T.Mesh(new T.RingGeometry(.92, 1.08, 40), new T.MeshBasicMaterial({ color: C.sage, transparent: true, opacity: 0, depthWrite: false }));
    done.rotation.x = -Math.PI / 2; done.position.y = .09; g.add(done);
    // 站號：立在地墊後面的小牌子（朝南，鏡頭看得到）
    const post = new T.Group(); post.position.set(0, 0, -1.25); g.add(post);
    post.add(mesh(new T.CylinderGeometry(.06, .07, 1.1, 8), M.wood, 0, .55, 0));
    const plate = mesh(new T.CylinderGeometry(.42, .42, .08, 28).rotateX(Math.PI / 2), M.wood, 0, 1.3, 0); post.add(plate);
    const face = new T.Mesh(new T.CircleGeometry(.37, 28), new T.MeshStandardMaterial({ map: numberTex(n), roughness: .9 }));
    face.position.set(0, 1.3, .045); post.add(face);
    const em = emblem(n); em.position.set(.85, .08, -.75); g.add(em);
    g.userData = { ring, done, post, emblem: em };
    return g;
  }
  // 每一站的小標誌（顏色＝那一關的道具顏色）
  function emblem(n) {
    const g = new T.Group(), s = .9;
    const add = (geo, m, x, y, z) => { const o = mesh(geo, m, x * s, y * s, z * s); g.add(o); return o; };
    if (n === 1) { add(rbox(.5, .4, .5, .06, .03), M.wood, 0, .2, 0); add(new T.BoxGeometry(.52, .05, .1), M.coral, 0, .4, 0); }
    else if (n === 2) { add(new T.CylinderGeometry(.32, .34, .14, 24), M.cream, 0, .07, 0); add(new T.CylinderGeometry(.12, .12, .05, 16), M.sky, 0, .16, 0); }
    else if (n === 3) { add(rbox(.5, .32, .4, .06, .03), M.sky, 0, .16, 0); add(new T.SphereGeometry(.12, 12, 10), M.coral, 0, .4, 0); }
    else if (n === 4) { add(new T.SphereGeometry(.35, 16, 10).scale(1, .45, 1), clay(0xD98A5A), 0, .05, 0); add(new T.CylinderGeometry(.025, .025, .6, 6), M.wood, 0, .4, 0); add(new T.BoxGeometry(.25, .16, .02), M.coral, .13, .6, 0); }
    else if (n === 5) { add(new T.CylinderGeometry(.04, .04, .4, 6), M.cream2, 0, .2, 0); const p = add(new T.CapsuleGeometry(.05, .55, 3, 6), M.amber, 0, .42, 0); p.rotation.z = Math.PI / 2; }
    else if (n === 6) { add(new T.SphereGeometry(.34, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2), M.sky, 0, 0, 0); add(new T.BoxGeometry(.3, .12, .16), M.cream, 0, .38, 0); }
    else if (n === 7) { for (let k = 0; k < 3; k++) add(new T.BoxGeometry(.5, .14 * (k + 1), .18), M.wood, 0, .07 * (k + 1), (k - 1) * .18); }
    else if (n === 8) { add(new T.BoxGeometry(.46, .42, .46), M.yellow, 0, .29, 0); add(new T.CylinderGeometry(.22, .22, .08, 16), M.amber, 0, .04, 0); }
    else if (n === 9) { add(new T.CylinderGeometry(.3, .3, .2, 20), M.wood, 0, .1, 0); add(new T.TorusGeometry(.12, .04, 8, 16).rotateX(Math.PI / 2), M.amber, 0, .22, 0); }
    else { add(new T.CylinderGeometry(.06, .06, .5, 8), M.wood, 0, .25, 0); add(new T.CylinderGeometry(.24, .24, .06, 6).rotateX(Math.PI / 2), M.amber, 0, .62, 0); }
    return g;
  }
  // 工作坊：小房子＋門口的牌子（第 10 關做完才亮）＋裝備架（十格）
  function workshop() {
    const g = new T.Group();
    g.add(mesh(rbox(4.2, 2.2, 3.0, .3, .08), M.cream, 0, 1.1, -.6));
    const roof = mesh(new T.CylinderGeometry(.01, 3.0, 1.2, 4, 1), M.coral, 0, 2.8, -.6); roof.rotation.y = Math.PI / 4; roof.scale.set(1.05, 1, .78); g.add(roof);
    g.add(mesh(rbox(1.1, 1.5, .2, .4, .04), M.woodDark, 0, .75, .92));
    [-1.35, 1.35].forEach(x => g.add(mesh(new T.BoxGeometry(.7, .6, .1), M.light, x, 1.35, .92)));
    // 牌子：圓牌，平常是木頭色，全部做完變琥珀色發光
    const sm = std(C.wood, { roughness: .8, emissive: new T.Color(C.amber), emissiveIntensity: 0 });
    const sign = mesh(new T.CylinderGeometry(.45, .45, .1, 28).rotateX(Math.PI / 2), sm, 0, 1.95, 1.0); g.add(sign);
    // 裝備架：門前一長條木架，九格（第 10 關沒有新裝備）
    const shelf = new T.Group(); shelf.position.set(0, 0, 2.05); g.add(shelf);
    shelf.add(mesh(rbox(5.4, .5, .9, .12, .04), M.wood, 0, .25, 0));
    shelf.add(mesh(new T.BoxGeometry(5.5, .07, 1.0), M.woodDark, 0, .53, 0));
    const slots = [];
    for (let k = 0; k < 9; k++) { const p = new T.Group(); p.position.set((k - 4) * .58, .57, 0); shelf.add(p); slots.push(p); }
    g.userData = { sign, signMat: sm, shelf, slots };
    return g;
  }
  // ---------- 可以撞的東西 ----------
  function cone() {
    const g = new T.Group();
    g.add(mesh(new T.BoxGeometry(.7, .08, .7), M.coral, 0, .04, 0));
    g.add(mesh(new T.ConeGeometry(.3, .85, 18), M.coral, 0, .5, 0));
    g.add(mesh(new T.CylinderGeometry(.205, .245, .14, 18), M.paper, 0, .42, 0));
    return g;
  }
  function ball(color) {
    const g = new T.Group(); const b = mesh(new T.SphereGeometry(.42, 20, 14), clay(color), 0, .42, 0); g.add(b);
    g.add(mesh(new T.TorusGeometry(.42, .04, 6, 24), M.paper, 0, .42, 0));
    g.userData.spinner = g;
    return g;
  }
  function mailbox() {
    const g = new T.Group();
    g.add(mesh(new T.CylinderGeometry(.07, .09, .9, 8), M.woodDark, 0, .45, 0));
    const box = new T.Group(); box.position.y = 1.02; g.add(box);
    box.add(mesh(new T.CapsuleGeometry(.22, .38, 4, 12).rotateX(Math.PI / 2), M.sky));
    const flag = mesh(new T.BoxGeometry(.04, .26, .1), M.coral, .25, .12, -.1); box.add(flag);
    return g;
  }
  function tree(k = 0) {
    const g = new T.Group();
    g.add(mesh(new T.CylinderGeometry(.13, .17, .7, 10), M.woodDark, 0, .35, 0));
    const m = [M.sage, M.leaf, M.sage2][k % 3];
    g.add(mesh(new T.SphereGeometry(.62, 18, 14), m, 0, 1.15, 0));
    g.add(mesh(new T.SphereGeometry(.42, 16, 12), m, .32, .9, .2));
    return g;
  }
  function bench() {
    const g = new T.Group();
    g.add(mesh(rbox(1.5, .12, .5, .08, .03), M.wood, 0, .45, 0));
    g.add(mesh(rbox(1.5, .4, .1, .05, .02), M.wood, 0, .8, -.22));
    [-.6, .6].forEach(x => g.add(mesh(new T.BoxGeometry(.1, .42, .4), M.woodDark, x, .2, 0)));
    return g;
  }

  // ---------- 光暈（落點、目標用）：一張圓環貼圖 ----------
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
  // 平放在地上的圓圈
  function floorRing(r0 = .42, r1 = .56, color = C.coral, op = 0) {
    const m = new T.Mesh(new T.RingGeometry(r0, r1, 40), new T.MeshBasicMaterial({ color, transparent: true, opacity: op, depthWrite: false }));
    m.rotation.x = -Math.PI / 2;
    return m;
  }
  // 一塊「舞台」底板（任務場景升起來的那塊）
  function slab(w, d, m = M.paper, h = .16) { return mesh(rbox(w, h, d, .5, .05), m, 0, h / 2, 0); }

  return { C, M, D, G, std, clay, mat, mesh, rbox, roundRect, bot, setGear, gear, gearShow, table, road, station, emblem, workshop, cone, ball, mailbox, tree, bench, halo, floorRing, slab, numberTex };
})();
