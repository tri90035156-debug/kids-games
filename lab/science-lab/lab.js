// 實驗桌（主畫面）：一張圓桌、木頭收邊、相機斜斜往下看。十個實驗的小道具沿桌邊排一圈（從正前方開始順時針 1～10），
// 每個前面一個數字牌。「下一個」有珊瑚紅呼吸光暈；做過的是一圈淡綠，可以重玩；還沒開的碰了只搖一下。
// 點道具或按數字鍵 1～0 進去。桌子中間偏右是記錄本（點它可以翻）。桌上的東西碰了都會果凍回彈。
window.DESK = core => {
  'use strict';
  const { T, A, S3, scene, SFX, tween, lerp, ease, outBack } = core;
  const R_TABLE = 8.4, R_PROP = 5.7;
  const g = new T.Group(); scene.add(g);
  g.add(A.table(R_TABLE));
  const top = new T.Group(); g.add(top);
  const pos = n => { const f = (n - 1) * Math.PI * 2 / 10; return new T.Vector3(-Math.sin(f) * R_PROP, 0, Math.cos(f) * R_PROP); };
  const props = [];
  for (let n = 1; n <= 10; n++) {
    const p = new T.Group(); p.position.copy(pos(n));
    const j = new T.Group(); p.add(j);
    j.add(propModel(n)); j.children[0].scale.setScalar(1.45);
    S3.jelly(j, 150, 7);
    const plate = A.numberPlate(n); plate.position.copy(pos(n).clone().setLength(1.55)).setY(0); p.add(plate);
    const halo = A.floorRing(1.25, 1.6, A.C.coral, 0); halo.position.y = .02; p.add(halo);
    const doneR = A.floorRing(1.3, 1.44, A.C.sage, 0); doneR.position.y = .025; p.add(doneR);
    p.rotation.y = 0;
    top.add(p);
    props.push({ n, g: p, j, halo, doneR, shake: 0 });
  }
  const book = new T.Group(); book.position.set(1.6, 0, .4); book.rotation.y = -.25;
  const bookJ = new T.Group(); book.add(bookJ); bookJ.add(A.bookProp()); bookJ.children[0].scale.setScalar(1.3); S3.jelly(bookJ, 150, 7); top.add(book);
  top.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });

  function propModel(n) {
    const m = new T.Group(), add = (o, x = 0, y = 0, z = 0, s = 1) => { o.position.set(x, y, z); o.scale.multiplyScalar(s); m.add(o); return o; };
    if (n === 1) {
      add(A.box(1.5, .06, .9, A.M.wood, 0, .03, 0));
      const tank = A.mesh(new T.BoxGeometry(1.4, .9, .8), A.M.glass, 0, .51, 0); tank.castShadow = false; m.add(tank);
      const w = A.mesh(new T.BoxGeometry(1.34, .62, .74), A.M.water, 0, .37, 0); w.castShadow = false; m.add(w);
      add(A.apple(.9), -.3, .7, 0); add(A.grape(.8), .35, .2, 0);
    } else if (n === 2) { add(A.magnet(), 0, .14, 0, 1.2); add(A.clip(1.3), .55, .03, .4); add(A.nail(1), -.5, .05, .45); }
    else if (n === 3) {
      const ramp = A.mesh(new T.BoxGeometry(1.6, .1, .6), A.M.wood, 0, .38, 0); ramp.rotation.z = .42; m.add(ramp);
      add(A.box(.2, .7, .6, A.M.woodDark, .72, .35, 0)); add(A.car(), -.95, 0, .1, 1);
    } else if (n === 4) { const f = add(A.flashlight(), -.5, .3, 0, 1.1); f.rotation.y = 0; add(A.puppet(), .55, 0, 0, .8); }
    else if (n === 5) { const c = add(A.cup(.38, .8), 0, 0, 0); const w = A.mesh(new T.CylinderGeometry(.34, .32, .5, 20), A.M.water, 0, .27, 0); w.castShadow = false; c.add(w); const s = add(A.spoon(1.1), .25, .9, 0); s.rotation.z = -1.1; }
    else if (n === 6) { add(A.cyl(.6, .55, .06, A.M.paper, 0, .03, 0, 28)); add(A.box(.5, .44, .5, A.std(0xE9F5FA, { roughness: .3, transparent: true, opacity: .85 }), 0, .28, 0, .1)); }
    else if (n === 7) { add(A.pot(), 0, 0, 0, .9); const sp = add(A.sprout(), 0, .5, 0, .8); sp.userData.stem.scale.y = .9; }
    else if (n === 8) {
      add(A.box(1.2, .08, .5, A.M.wood, 0, 1.3, 0)); add(A.box(.1, 1.3, .1, A.M.woodDark, -.55, .65, 0));
      add(A.ball(.2, A.M.iron, -.2, 1.05, 0)); add(A.ball(.13, A.M.wood, .3, 1.1, 0));
    } else if (n === 9) { const c = add(A.cup(.4, .8), 0, .8, 0); c.rotation.x = Math.PI; add(A.box(.6, .06, .6, A.M.paper, 0, .03, 0)); }
    else { const b = add(A.boatFoil(2), 0, .02, 0, .7); [[-.2, 0], [.15, .1], [0, -.2]].forEach(([x, z]) => add(A.ball(.09, A.M.sky, x, .18, z))); void b; }
    return m;
  }

  // ---------- 狀態 ----------
  let hovered = null, downAt = null;
  function refresh() {
    const nx = core.nextExp();
    props.forEach(p => { p.next = p.n === nx; p.done = core.allowed(p.n) && !p.next; p.locked = !core.allowed(p.n); });
  }
  function pickAt(p) {
    let best = null, bd = 80;
    props.forEach(it => { const q = core.sp(it.g.position.clone().setY(.5)); const d = Math.hypot(q.x - p.x, q.y - p.y); if (d < bd) { bd = d; best = it; } });
    const qb = core.sp(book.position.clone().setY(.2));
    if (Math.hypot(qb.x - p.x, qb.y - p.y) < Math.min(bd, 70)) return { book: true };
    return best;
  }
  const api = {
    onEnter: null, onBook: null,
    refresh,
    framePts() { const pts = []; for (let k = 0; k < 8; k++) { const a = k / 8 * Math.PI * 2; pts.push(new T.Vector3(Math.cos(a) * (R_TABLE + .5), 0, Math.sin(a) * (R_TABLE + .5))); } pts.push(new T.Vector3(0, 2.2, -R_TABLE + 2)); return pts; },
    down(p) { downAt = { x: p.x, y: p.y, t: performance.now() }; const it = pickAt(p); if (it && it.j) { S3.poke(it.j, .25); SFX.bump(1); } else if (it && it.book) { S3.poke(bookJ, .25); } },
    move() {},
    up(p) {
      const d = downAt; downAt = null;
      if (!d || p.cancel || Math.hypot(p.x - d.x, p.y - d.y) > 24) return;
      const it = pickAt(p);
      if (!it) return;
      if (it.book) { if (api.onBook) api.onBook(); return; }
      if (api.onEnter) api.onEnter(it.n);
    },
    hover(p) {
      const it = pickAt(p);
      const key = it ? (it.book ? 'book' : it.n) : null;
      document.body.style.cursor = it ? 'pointer' : '';
      if (key !== hovered) { hovered = key; if (it && it.j) { S3.poke(it.j, .12); SFX.hover(); } else if (it && it.book) S3.poke(bookJ, .12); }
    },
    shake(n) { const p = props[n - 1]; if (p) { p.shake = .5; S3.poke(p.j, .2); } },
    focus(n) { const p = props[n - 1]; if (p) S3.poke(p.j, .4); },
    async hide(on) {
      document.body.style.cursor = '';
      if (on) { await tween(.55, k => { top.position.y = lerp(0, -3.2, ease(k)); }); top.visible = false; }
      else { top.visible = true; await tween(.7, k => { top.position.y = lerp(-3.2, 0, outBack(k)); }); props.forEach(p => S3.poke(p.j, .2)); }
    },
    update(dt, t, active, idle) {
      const br = .5 + .5 * Math.sin(t * 2.6);
      props.forEach(p => {
        S3.wobble(p.j, dt);
        p.halo.material.opacity = p.next ? .35 + .3 * br + (idle > 5 ? .2 : 0) : 0;
        p.halo.scale.setScalar(p.next ? 1 + .06 * br : 1);
        p.doneR.material.opacity = p.done ? .55 : 0;
        if (p.shake > 0) { p.shake -= dt; p.j.rotation.z = Math.sin(p.shake * 40) * .08 * p.shake; } else p.j.rotation.z = 0;
        if (p.next && active) p.j.position.y = .04 * Math.max(0, Math.sin(t * 2.2));
        else p.j.position.y = 0;
      });
      S3.wobble(bookJ, dt);
    },
    caps() { return props.filter(p => !p.locked).map(p => ({ pos: p.g.position.clone().setY(1.7), text: String(p.n % 10), cur: p.next })); },
    probe() { return { props: props.map(p => { const q = core.sp(p.g.position.clone().setY(.5)); return { n: p.n, x: Math.round(q.x), y: Math.round(q.y), next: p.next, locked: p.locked }; }), book: (q => [Math.round(q.x), Math.round(q.y)])(core.sp(book.position.clone().setY(.2))) }; },
  };
  return api;
};
