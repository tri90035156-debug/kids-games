// 第 6 關 水底找東西（水下機器人：一條線連到船上）——手勢：往下拖潛下去＋開燈。
// 剖面看：水面一條線、船在上面。往下拖＝下潛，線從船上拉出來，有長度上限，拉到底會被拉住。
// 越深越暗：點燈泡（或按 L）開探照燈，一個圓錐光，照到東西才看得見。碰到看得見的東西＝夾起來，自動浮上來交給船。
// 三小關：找 1 個（淺）→ 2 個（深，要開燈）→ 東西太遠、線不夠長，先把船拖到它上面。
// 三條路：手指拖機器人／拖船；點東西或水裡＝它自己游過去、點水面＝船開過去；鍵盤方向鍵游、靠在船邊時 ← → 開船、L 開燈。
(window.MISSIONS = window.MISSIONS || [])[6] = (() => {
  'use strict';
  const T = THREE;
  const WS = 4.3, DEEP = 2.3, XL = 5.8;
  const LV = [
    { boat: 0, rope: 4.6, items: [[2.3, 2.75, 'shell']], dark: false },
    { boat: 0, rope: 5.6, items: [[-2.4, .38, 'gear'], [4.6, .38, 'bottle']], dark: true },
    { boat: 2.6, rope: 4.6, items: [[-4.6, .38, 'gear']], dark: true },
  ];
  let S = null;

  function backdrop(A) {
    const c = document.createElement('canvas'); c.width = 8; c.height = 256;
    const x = c.getContext('2d'), g = x.createLinearGradient(0, 0, 0, 256);
    g.addColorStop(0, '#BFE3F0'); g.addColorStop(.35, '#8DC3DB'); g.addColorStop(.6, '#3F6E8E'); g.addColorStop(1, '#1E3550');
    x.fillStyle = g; x.fillRect(0, 0, 8, 256);
    const t = new T.CanvasTexture(c); t.colorSpace = T.SRGBColorSpace;
    return t;
  }
  function item(A, kind) {
    const g = new T.Group(), j = new T.Group(); g.add(j);
    const mats = [];
    const mk = (geo, color, x, y, z) => { const m = A.std(color, { roughness: .8 }); mats.push({ m, c: new T.Color(color) }); const o = A.mesh(geo, m, x, y, z); j.add(o); return o; };
    if (kind === 'shell') { const o = mk(new T.SphereGeometry(.32, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2), A.C.coral, 0, 0, 0); o.scale.set(1, .6, .8); mk(new T.TorusGeometry(.2, .04, 6, 14), 0xFFF8EE, 0, .02, 0).rotation.x = Math.PI / 2; }
    else if (kind === 'gear') { mk(new T.TorusGeometry(.26, .1, 8, 10), A.C.amber, 0, .1, 0); mk(new T.CylinderGeometry(.08, .08, .2, 8).rotateX(Math.PI / 2), A.C.amber, 0, .1, 0); }
    else { mk(new T.CapsuleGeometry(.14, .34, 4, 10), A.C.sky, 0, .1, 0).rotation.z = Math.PI / 2.4; mk(new T.CylinderGeometry(.06, .06, .14, 8), 0xD9B27A, .27, .27, 0).rotation.z = Math.PI / 2.4; }
    S3.jelly(j, 160, 7);
    g.userData = { j, mats };
    return g;
  }
  function rov(A) {
    const g = new T.Group(), j = new T.Group(); g.add(j);
    j.add(A.mesh(A.rbox(.95, .5, .6, .14, .05), A.M.cream, 0, 0, 0));
    j.add(A.mesh(A.rbox(.95, .12, .62, .06, .03), A.M.sky, 0, .3, 0));
    [-1, 1].forEach(s => j.add(A.mesh(new T.CylinderGeometry(.13, .13, .26, 12).rotateZ(Math.PI / 2), A.M.amber, -.5, -.08, s * .26)));
    const lamp = A.gear(6); lamp.scale.setScalar(.55); lamp.position.set(.42, -.12, 0); lamp.rotation.y = Math.PI / 2; lamp.rotation.x = .5; j.add(lamp);
    [-1, 1].forEach(s => { const f = A.mesh(new T.CapsuleGeometry(.04, .2, 3, 6), A.M.cream2, .2 + s * .1, -.36, 0); j.add(f); });
    const cone = new T.Mesh(new T.ConeGeometry(1.9, 3.0, 28, 1, true), new T.MeshBasicMaterial({ color: 0xFFF1C2, transparent: true, opacity: 0, depthWrite: false, side: T.DoubleSide }));
    cone.position.set(0, 0, 0); cone.visible = false;
    const coneG = new T.Group(); coneG.position.set(.42, -.15, 0); coneG.rotation.z = .2; coneG.add(cone); cone.position.y = -1.5; j.add(coneG);
    S3.jelly(j, 150, 7);
    g.userData = { j, cone, coneG, lamp };
    return g;
  }

  return {
    say: { intro: 'm6.intro', subs: ['m6.s1', 'm6.s2', 'm6.s3'], ok: 'm6.ok', aha: 'm6.aha' },
    build(c) {
      const A = c.A, root = c.root;
      // 水槽：背板（越深越暗）、沙底、水面線、兩邊的石頭
      root.add(A.mesh(A.rbox(12.8, .2, 2.6, .3, .05), A.M.woodDark, 0, .1 - .2, -.3));
      const back = new T.Mesh(new T.PlaneGeometry(12.4, WS), new T.MeshBasicMaterial({ map: backdrop(A) })); back.position.set(0, WS / 2, -1.3); root.add(back);
      root.add(A.mesh(A.rbox(12.4, .2, 2.4, .2, .04), A.clay(0xE8D1A6), 0, .1, -.2));
      const surf = A.mesh(new T.BoxGeometry(12.4, .06, 2.4), A.std(0xBFE3F0, { transparent: true, opacity: .55, roughness: .3 }), 0, WS, -.2); surf.castShadow = false; root.add(surf);
      const ledge = A.mesh(A.rbox(2.4, 2.4, 1.6, .4, .1), A.clay(0x9C8F7E), 2.6, 1.2, -.5); root.add(ledge);
      [[-5.6, .5, .7], [5.5, .6, .8], [-1, .3, .45], [1.2, .25, .35]].forEach(([x, y, r]) => root.add(A.mesh(new T.SphereGeometry(r, 14, 10).scale(1.3, .8, 1), A.clay(0x8C8072), x, y, -.6)));
      const weeds = [];
      [[-3.6, -.7], [-.2, -.8], [4.6, -.7], [.6, -.6]].forEach(([x, z], i) => { const w = A.mesh(new T.CapsuleGeometry(.07, 1.1 + (i % 2) * .5, 3, 6), A.M.sage, x, .8, z); root.add(w); weeds.push(w); });
      // 船＋線
      const boat = new T.Group(), bj = new T.Group(); boat.add(bj); root.add(boat);
      bj.add(A.mesh(A.rbox(1.9, .45, .95, .4, .08), A.M.wood, 0, .15, 0));
      bj.add(A.mesh(A.rbox(.8, .55, .65, .12, .04), A.M.cream, -.3, .62, 0));
      bj.add(A.mesh(new T.CylinderGeometry(.16, .16, .5, 12).rotateX(Math.PI / 2), A.M.coral, .55, .5, 0));
      S3.jelly(bj, 150, 7);
      const seg = new T.CylinderGeometry(.035, .035, 1, 6), rope = [];
      for (let k = 0; k < 14; k++) { const m = A.mesh(seg, A.M.coral, 0, 0, 0); m.castShadow = false; root.add(m); rope.push(m); }
      const r = rov(A); root.add(r);
      S = { c, A, boat, bj, rope, rov: r, weeds, items: [], bx: 0, x: 0, y: WS - .5, tx: null, ty: null, light: false, carry: null, auto: null, drag: null, keys: { up: 0, down: 0, left: 0, right: 0 }, taut: 0, ropeSaid: 0, darkSaid: 0, t: 0 };
      S.lightBtn = c.button({ icon: 'bulb', key: 'L', label: '探照燈', down: () => toggleLight(c) });
      c.ctlH = 96;
      c.view([new T.Vector3(-6.3, -.2, 0), new T.Vector3(6.3, -.2, 0), new T.Vector3(-6.3, WS + 1.1, 0), new T.Vector3(6.3, WS + 1.1, 0)], { elev: 8, elevPt: 10 });
    },
    start(c, sub) {
      const A = c.A, L = LV[sub];
      S.sub = sub; S.L = L; S.carry = null; S.auto = null; S.drag = null; S.found = 0;
      S.items.forEach(it => it.g.parent && it.g.parent.remove(it.g));
      S.items = L.items.map(([x, y, kind]) => { const g = item(A, kind); g.position.set(x, y, 0); c.root.add(g); return { g, x, y, kind, got: false, vis: 1 }; });
      S.bx = L.boat; S.x = L.boat; S.y = WS - .55; S.tx = null; S.ty = null;
      setLight(c, sub === 0 ? false : S.light && sub !== 1 ? S.light : false);
    },
    // ---------- 輸入 ----------
    down(c, p) {
      const bq = c.screen(new T.Vector3(S.bx, WS + .3, 0)), rq = c.screen(new T.Vector3(S.x, S.y, 0));
      const g = c.planeZ(p, 0), db = Math.hypot(bq.x - p.x, bq.y - p.y), dr = Math.hypot(rq.x - p.x, rq.y - p.y);
      if ((db < 60 && db < dr) || (g && g.y > WS + .05)) S.drag = { what: 'boat', x: p.x, y: p.y, moved: false };
      else S.drag = { what: 'rov', x: p.x, y: p.y, moved: false };
      S.auto = null;
    },
    move(c, p) {
      const d = S.drag; if (!d) return;
      if (!d.moved && Math.hypot(p.x - d.x, p.y - d.y) < 8) return;
      d.moved = true;
      const g = c.planeZ(p, 0); if (!g) return;
      if (d.what === 'boat') S.boatT = Math.max(-5.3, Math.min(5.3, g.x));
      else { S.tx = g.x; S.ty = g.y; }
    },
    up(c, p) {
      const d = S.drag; S.drag = null; S.tx = null; S.ty = null;
      if (!d || d.moved) { S.boatT = null; return; }
      const g = c.planeZ(p, 0); if (!g) return;
      // 點：船（水面上）／看得見的東西／水裡的位置
      if (d.what === 'boat' || g.y > WS - .1) { S.boatT = Math.max(-5.3, Math.min(5.3, g.x)); S.autoBoat = true; c.SFX.tap(); return; }
      const it = c.nearest(p, S.items.filter(q => !q.got && q.vis > .5), q => new T.Vector3(q.x, q.y + .1, 0), 60);
      S.auto = it ? { x: it.x, y: it.y + .45 } : { x: g.x, y: g.y };
      c.SFX.tap();
    },
    key(c, k, down, rep) {
      const m = { up: 'up', w: 'up', down: 'down', s: 'down', left: 'left', a: 'left', right: 'right', d: 'right' }[k];
      if (m) { S.keys[m] = down ? 1 : 0; if (down) S.auto = null; return; }
      if (down && !rep && k === 'l') toggleLight(c);
    },
    frame(c, dt, t) {
      if (!S || !S.L) return;
      S.t += dt;
      const L = S.L, docked = Math.hypot(S.x - S.bx, S.y - (WS - .55)) < .7;
      // 船：拖、點、或靠在船邊時用 ← →
      let bv = 0;
      if (S.boatT != null) { const d = S.boatT - S.bx; bv = Math.max(-3, Math.min(3, d * 4)); if (Math.abs(d) < .05 && S.autoBoat) { S.boatT = null; S.autoBoat = false; } }
      else if (docked && !S.carry && (S.keys.left || S.keys.right) && !S.keys.up && !S.keys.down) bv = (S.keys.right - S.keys.left) * 2.4;
      S.bx = Math.max(-5.3, Math.min(5.3, S.bx + bv * dt));
      if (docked && bv) { S.x += bv * dt; }
      // 機器人：拖（跟手 lerp）、鍵盤、自己游（夾到東西就自己浮上去）
      let vx = 0, vy = 0;
      if (S.carry) { const tx = S.bx, ty = WS - .55; vx = (tx - S.x) * 2.4; vy = (ty - S.y) * 2.4; if (Math.hypot(tx - S.x, ty - S.y) < .2) handOver(c); }
      else if (S.tx != null) { vx = (S.tx - S.x) * 5; vy = (S.ty - S.y) * 5; }
      else if (S.auto) { const dx = S.auto.x - S.x, dy = S.auto.y - S.y, d = Math.hypot(dx, dy); if (d < .15) S.auto = null; else { vx = dx / d * Math.min(2.6, d * 3); vy = dy / d * Math.min(2.6, d * 3); } }
      else if (!(docked && (S.keys.left || S.keys.right) && !S.keys.up && !S.keys.down)) { vx = (S.keys.right - S.keys.left) * 2.4; vy = (S.keys.up - S.keys.down) * 2.4; }
      const sp = Math.hypot(vx, vy), mx = 3.4; if (sp > mx) { vx *= mx / sp; vy *= mx / sp; }
      S.x += vx * dt; S.y += vy * dt;
      S.x = Math.max(-XL, Math.min(XL, S.x)); S.y = Math.max(.42, Math.min(WS - .5, S.y));
      if (S.x > 1.35 && S.x < 3.85 && S.y < 2.4 + .3) { if (S.y > 2.2) S.y = 2.7; else S.x = S.x < 2.6 ? 1.35 : 3.85; }   // 石頭平台
      // 線的長度：拉到底就被拉住（船拖走時，機器人被拉著走）
      const ax = S.bx + .55, ay = WS + .1, dx = S.x - ax, dy = S.y - ay, dist = Math.hypot(dx, dy);
      const wantFar = (S.tx != null && Math.hypot(S.tx - ax, S.ty - ay) > L.rope) || (S.auto && Math.hypot(S.auto.x - ax, S.auto.y - ay) > L.rope) || ((S.keys.left || S.keys.right || S.keys.down) && dist >= L.rope - .02);
      if (dist > L.rope) { S.x = ax + dx / dist * L.rope; S.y = ay + dy / dist * L.rope; }
      if (dist >= L.rope - .05 && wantFar) {
        S.taut += dt;
        if (S.taut > .9 && S.t - S.ropeSaid > 6) { S.ropeSaid = S.t; S3.poke(S.rov.userData.j, .3); c.fail('m6.rope'); }
      } else S.taut = Math.max(0, S.taut - dt);
      // 線：鬆的時候往下垂，拉緊時直直的
      const slack = Math.max(0, L.rope - Math.hypot(S.x - ax, S.y - ay)), sag = Math.min(1.6, slack * .5);
      const pts = [];
      for (let k = 0; k <= S.rope.length; k++) { const u = k / S.rope.length; pts.push(new T.Vector3(ax + (S.x - ax) * u, ay + (S.y + .25 - ay) * u - Math.sin(u * Math.PI) * sag, 0)); }
      S.rope.forEach((m, k) => { const a = pts[k], b = pts[k + 1], l = a.distanceTo(b); m.position.copy(a).add(b).multiplyScalar(.5); m.scale.set(1, l, 1); m.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), b.clone().sub(a).normalize()); });
      // 畫面
      S.boat.position.set(S.bx, WS - .05 + Math.sin(S.t * 1.6) * .05, 0); S.boat.rotation.z = Math.sin(S.t * 1.2) * .04 - bv * .02;
      S3.wobble(S.bj, dt);
      const u = S.rov.userData;
      S.rov.position.set(S.x, S.y, 0);
      if (Math.abs(vx) > .2) S.rov.rotation.y = S3.lerp(S.rov.rotation.y, vx > 0 ? 0 : Math.PI, .12);
      u.j.rotation.z = S3.lerp(u.j.rotation.z, Math.max(-.25, Math.min(.25, vy * .08)), .1);
      S3.wobble(u.j, dt);
      u.cone.material.opacity = S3.lerp(u.cone.material.opacity, S.light ? .22 : 0, .15);
      S.weeds.forEach((w, i) => { w.rotation.z = Math.sin(S.t * 1.3 + i) * .12; });
      // 深的地方很暗：開燈、照到才看得見
      const fx = S.rov.rotation.y > 1.5 ? -1 : 1;
      const cdir = new T.Vector2(Math.sin(.45) * fx, -Math.cos(.45)).normalize();
      S.items.forEach(it => {
        if (it.got) return;
        const deep = L.dark && it.y < DEEP;
        let lit = false;
        if (S.light) { const ox = it.x - S.x, oy = it.y - S.y; lit = Math.hypot(ox, oy) < 2.9 && oy < .35; }
        const want = !deep || lit ? 1 : .06;
        it.vis = S3.lerp(it.vis, want, .12);
        it.g.userData.mats.forEach(({ m, c: col }) => { m.color.copy(col).lerp(new T.Color(0x1E3550), 1 - it.vis); });
        it.g.position.set(it.x, it.y + Math.sin(S.t * 2 + it.x) * .03, 0);
        S3.wobble(it.g.userData.j, dt);
        // 碰到：看得見就夾起來；太暗就提醒開燈
        if (!S.carry && Math.hypot(it.x - S.x, it.y - (S.y - .35)) < .6) {
          if (it.vis > .5) { S.carry = it; it.got = true; S.auto = null; S.tx = null; S3.poke(it.g.userData.j, .4); c.SFX.pick(); }
          else if (S.t - S.darkSaid > 5) { S.darkSaid = S.t; c.fail('m6.dark'); }
        }
      });
      if (S.carry) S.carry.g.position.set(S.x + .1, S.y - .5, 0);
      if (Math.floor(S.t * 2) !== Math.floor((S.t - dt) * 2) && (Math.abs(vx) + Math.abs(vy) > .5)) c.SFX.deep(Math.floor(6 - S.y));
      S.lightBtn.classList.toggle('lit', S.light);
      S.lightBtn.classList.toggle('glow', !S.light && L.dark && (S.sub === 1 || c.strong));
    },
    glow(c) {
      if (!S || !S.L) return [];
      const it = S.items.find(q => !q.got);
      if (!it || S.carry) return [{ pos: new T.Vector3(S.bx, WS + .4, 0), size: 2, color: c.A.C.sky }];
      const out = [];
      const reach = Math.hypot(it.x - (S.bx + .55), it.y + .45 - (WS + .1)) <= S.L.rope;
      if (!reach) out.push({ pos: new T.Vector3(it.x, WS + .3, 0), size: 1.8, color: c.A.C.amber, strong: true });
      if (it.vis > .5 || c.strong) out.push({ pos: new T.Vector3(it.x, it.y + .15, 0), size: 1.4, strong: c.strong });
      return out;
    },
    demo(c) {
      const it = S.items.find(q => !q.got);
      if (!it) return null;
      const reach = Math.hypot(it.x - (S.bx + .55), it.y + .45 - (WS + .1)) <= S.L.rope;
      if (!reach) return { kind: 'drag', pts: [new T.Vector3(S.bx, WS + .3, 0), new T.Vector3(it.x, WS + .3, 0)], dur: 2.2 };
      return { kind: 'drag', pts: [new T.Vector3(S.x, S.y, 0), new T.Vector3(it.x, it.y + .45, 0)], dur: 2.2 };
    },
    assist(c) {
      const it = S.items.find(q => !q.got); if (!it) return;
      if (S.L.dark && !S.light) setLight(c, true);
      const reach = Math.hypot(it.x - (S.bx + .55), it.y + .45 - (WS + .1)) <= S.L.rope;
      if (!reach) { S.boatT = it.x - .3; S.autoBoat = true; } else S.auto = { x: it.x, y: it.y + .45 };
    },
    probe(c) {
      const sc = v => { const q = c.screen(v); return [Math.round(q.x), Math.round(q.y)]; };
      const it = S.items.find(q => !q.got);
      return { x: S.x, y: S.y, bx: S.bx, light: S.light, carry: !!S.carry, rope: S.L.rope, me: sc(new T.Vector3(S.x, S.y, 0)), boat: sc(new T.Vector3(S.bx, WS + .3, 0)), item: it ? { x: it.x, y: it.y, vis: +it.vis.toFixed(2), scr: sc(new T.Vector3(it.x, it.y + .45, 0)), top: sc(new T.Vector3(it.x - .3, WS + .3, 0)) } : null, left: S.items.filter(q => !q.got).length + (S.carry ? 1 : 0) };
    },
    exit() { S = null; },
  };

  function setLight(c, on) { S.light = on; S.rov.userData.cone.visible = true; }
  function toggleLight(c) { setLight(c, !S.light); c.SFX[S.light ? 'near' : 'tap'](); S3.poke(S.rov.userData.j, .25); }
  // 浮上來：東西交給船
  function handOver(c) {
    const it = S.carry; S.carry = null;
    const from = it.g.position.clone(), to = new T.Vector3(S.bx - .2, WS + .55, 0);
    c.tween(.5, k => { it.g.position.lerpVectors(from, to, k); it.g.position.y += Math.sin(k * Math.PI) * .6; }).then(() => {
      if (!S) return;
      it.g.visible = false; S3.poke(S.bj, .4); c.SFX.ok();
      if (S.items.every(q => q.got) && !S.carry) setTimeout(() => { if (S) c.win(); }, c.FAST ? 20 : 400);
    });
  }
})();
