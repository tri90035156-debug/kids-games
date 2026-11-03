// 第 3 關 工廠分類（工廠手臂，Unimate 的後代）——手勢：抓放（按住夾起、拖過去、放開）。
// 輸送帶從左往右送東西（木頭滾軸會轉）。按住東西＝夾子下來夾起；拖到對的箱子上方放開＝掉進去（箱子壓扁回彈＋木琴）。
// 放錯：東西彈出來、滾回帶子上，低木魚。帶子盡頭掉下去的東西會從左邊再出來（不罰）。
// 三小關：2 色各 2 個（帶子不動）→ 3 色、帶子會動 → 照形狀（圓、方）分，帶子更快。
// 三條路：手指按住拖；點東西（夾起來）再點箱子；鍵盤 ← → 選、空白鍵夾／放、1 2 3 直接放進第幾個箱子。
(window.MISSIONS = window.MISSIONS || [])[3] = (() => {
  'use strict';
  const T = THREE;
  const BZ = -1.3, BY = .62, BX0 = -5.2, BX1 = 4.4;     // 輸送帶：z、上緣高度、左右端
  const BINZ = 2.3, HY = 2.4;                            // 箱子的 z、夾子平常的高度
  const LV = [
    { bins: ['coral', 'sky'], items: [['coral', 's'], ['sky', 's'], ['sky', 'c'], ['coral', 'c']], speed: 0, by: 'color' },
    { bins: ['coral', 'sky', 'amber'], items: [['amber', 's'], ['coral', 'c'], ['sky', 's'], ['amber', 'c'], ['sky', 'c'], ['coral', 's']], speed: .5, by: 'color' },
    { bins: ['round', 'square'], items: [['coral', 's'], ['sky', 'c'], ['amber', 'c'], ['sky', 's'], ['coral', 'c'], ['amber', 's']], speed: .75, by: 'shape' },
  ];
  let S = null;

  function bin(A, kind) {
    const g = new T.Group(), j = new T.Group(); g.add(j);
    const m = A.M[kind] || A.M.cream2, w = 1.9, d = 1.5, h = .9;
    j.add(A.mesh(new T.BoxGeometry(w, .12, d), m, 0, .06, 0));
    [[0, -d / 2, w, .14], [0, d / 2, w, .14]].forEach(([x, z, ww, dd]) => j.add(A.mesh(A.rbox(ww, h, dd, .05, .02), m, x, h / 2, z)));
    [[-w / 2, 0], [w / 2, 0]].forEach(([x, z]) => j.add(A.mesh(A.rbox(.14, h, d, .05, .02), m, x, h / 2, z)));
    if (kind === 'round') j.add(A.mesh(new T.SphereGeometry(.26, 16, 12), A.M.ink, 0, h * .5, d / 2 + .2));
    if (kind === 'square') j.add(A.mesh(A.rbox(.46, .46, .14, .04, .02), A.M.ink, 0, h * .5, d / 2 + .14));
    S3.jelly(j, 150, 7);
    g.userData.j = j;
    return g;
  }
  function item(A, color, shape) {
    const g = new T.Group(), j = new T.Group(); g.add(j);
    if (shape === 's') j.add(A.mesh(new T.SphereGeometry(.33, 20, 14), A.M[color], 0, .33, 0));
    else j.add(A.mesh(A.rbox(.6, .6, .6, .1, .05), A.M[color], 0, .3, 0));
    S3.jelly(j, 160, 7);
    g.userData.j = j;
    return g;
  }
  const rightBin = it => S.lv.by === 'color' ? S.lv.bins.indexOf(it.color) : (it.shape === 's' ? 0 : 1);
  const binX = k => (k - (S.lv.bins.length - 1) / 2) * 2.5;

  return {
    say: { intro: 'm3.intro', subs: ['m3.s1', 'm3.s2', 'm3.s3'], ok: 'm3.ok', aha: 'm3.aha' },
    build(c) {
      const A = c.A, root = c.root;
      root.add(A.slab(12.4, 7.6, A.M.paper, .1));
      // 輸送帶：木頭底座＋米色帶面＋會轉的滾軸＋往右跑的紋路
      const belt = new T.Group(); root.add(belt);
      belt.add(A.mesh(A.rbox(BX1 - BX0 + .6, .42, 1.6, .2, .04), A.M.woodDark, (BX0 + BX1) / 2, .32, BZ));
      belt.add(A.mesh(new T.BoxGeometry(BX1 - BX0 + .2, .06, 1.35), A.M.cream2, (BX0 + BX1) / 2, BY - .03, BZ));
      const rollers = [BX0, BX1].map(x => { const r = A.mesh(new T.CylinderGeometry(.3, .3, 1.5, 16).rotateX(Math.PI / 2), A.M.wood, x, .45, BZ); belt.add(r); return r; });
      const stripes = [];
      for (let k = 0; k < 10; k++) { const s = A.mesh(new T.BoxGeometry(.12, .02, 1.3), A.M.woodDark, 0, BY + .005, BZ); s.castShadow = false; belt.add(s); stripes.push(s); }
      // 門型吊架：兩條側軌＋一根會前後走的橫樑＋會左右走的小車＋夾子（就是你等一下會拿到的那個夾子）
      const gx0 = -6.0, gx1 = 5.2;
      [[gx0, -2.4], [gx0, 3.4], [gx1, -2.4], [gx1, 3.4]].forEach(([x, z]) => root.add(A.mesh(new T.CylinderGeometry(.09, .11, 3.6, 10), A.M.wood, x, 1.8, z)));
      [gx0, gx1].forEach(x => root.add(A.mesh(new T.BoxGeometry(.2, .2, 6.0), A.M.woodDark, x, 3.6, .5)));
      const beam = A.mesh(new T.BoxGeometry(gx1 - gx0, .2, .26), A.M.wood, (gx0 + gx1) / 2, 3.72, 0); root.add(beam);
      const car = new T.Group(); root.add(car);
      car.add(A.mesh(A.rbox(.6, .3, .5, .08, .03), A.M.cream, 0, 3.55, 0));
      const rod = A.mesh(new T.CylinderGeometry(.06, .06, 1, 8), A.M.cream2, 0, 0, 0); car.add(rod);
      const claw = A.gear(3); claw.scale.setScalar(2.1); car.add(claw);
      const bins = new T.Group(); root.add(bins);
      S = { c, A, belt, rollers, stripes, beam, car, rod, claw, binsG: bins, bins: [], items: [], lv: null, head: { x: -2, z: 0, y: HY }, want: { x: -2, z: .4 }, hold: null, grab: null, drag: null, sel: 0, selBin: 0, t: 0 };
      c.view([new T.Vector3(-6.4, 0, -2.6), new T.Vector3(5.6, 0, -2.6), new T.Vector3(-6.4, 0, 3.8), new T.Vector3(5.6, 0, 3.8), new T.Vector3(0, 3.9, -2.4), new T.Vector3(0, 3.9, 3.4)], { elev: 46, elevPt: 66 });
    },
    start(c, sub) {
      const A = c.A, L = LV[sub];
      S.lv = L; S.hold = null; S.grab = null; S.drag = null; S.sel = 0;
      S.binsG.clear(); S.items.forEach(it => c.root.remove(it.g));
      S.bins = L.bins.map((k, i) => { const g = bin(A, k); g.position.set(binX(i), .1, BINZ); S.binsG.add(g); return { g, kind: k, x: binX(i) }; });
      S.binsG.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
      const n = L.items.length, gap = Math.min(1.5, (BX1 - BX0 - 1) / n);
      S.items = L.items.map(([color, shape], i) => {
        const g = item(A, color, shape); c.root.add(g);
        g.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
        const it = { g, color, shape, x: BX0 + .7 + i * gap, z: BZ, y: BY, state: 'belt', vy: 0 };
        g.position.set(it.x, it.y, it.z);
        return it;
      });
    },
    // ---------- 輸入 ----------
    down(c, p) {
      if (S.hold) { S.drag = { x: p.x, y: p.y, moved: false, held: true }; return; }
      const it = pickItem(c, p);
      if (!it) { const b = binAt(c, p); if (b >= 0) S3.poke(S.bins[b].g.userData.j, .2); return; }
      S.sel = S.items.indexOf(it);
      grab(c, it);
      S.drag = { x: p.x, y: p.y, moved: false, held: false };
    },
    move(c, p) {
      const d = S.drag; if (!d) return;
      if (!d.moved && Math.hypot(p.x - d.x, p.y - d.y) < 10) return;
      d.moved = true;
      const g = c.ground(p, 1.2); if (g) { S.want.x = Math.max(-5.6, Math.min(4.8, g.x)); S.want.z = Math.max(-2, Math.min(3.1, g.z)); }
      const b = binAt(c, p); S.bins.forEach((bn, i) => { if (i === b && !bn.over) { S3.poke(bn.g.userData.j, .12); c.SFX.hover(); } bn.over = i === b; });
    },
    up(c, p) {
      const d = S.drag; S.drag = null;
      S.bins.forEach(b => { b.over = false; });
      if (!d) return;
      if (!d.moved && !d.held) return;              // 點一下：夾著，等你點箱子
      const b = binAt(c, p);
      if (b >= 0) release(c, b);
      else if (d.moved) release(c, -1);
    },
    hover(c, p) { c.core.v.el.style.cursor = S.hold ? (binAt(c, p) >= 0 ? 'pointer' : 'grabbing') : pickItem(c, p) ? 'grab' : ''; },
    key(c, k, down, rep) {
      if (!down || rep) return;
      const live = S.items.filter(it => it.state === 'belt');
      if (k === 'left' || k === 'right' || k === 'a' || k === 'd') {
        const dir = k === 'left' || k === 'a' ? -1 : 1;
        if (S.hold) { S.selBin = (S.selBin + dir + S.bins.length) % S.bins.length; S.want.x = S.bins[S.selBin].x; S.want.z = BINZ; c.SFX.tap(); }
        else if (live.length) { const ord = live.slice().sort((a, b) => a.x - b.x); let i = ord.indexOf(S.items[S.sel]); i = i < 0 ? 0 : (i + dir + ord.length) % ord.length; S.sel = S.items.indexOf(ord[i]); S3.poke(ord[i].g.userData.j, .2); c.SFX.tap(); }
      } else if (k === 'space' || k === 'enter') {
        if (S.hold) release(c, S.selBin);
        else { const it = S.items[S.sel] && S.items[S.sel].state === 'belt' ? S.items[S.sel] : live.sort((a, b) => b.x - a.x)[0]; if (it) { grab(c, it); S.selBin = 0; } }
      } else if (/^[1-3]$/.test(k) && S.bins[+k - 1]) {
        if (!S.hold) { const it = S.items[S.sel] && S.items[S.sel].state === 'belt' ? S.items[S.sel] : live.sort((a, b) => b.x - a.x)[0]; if (it) grab(c, it, true); }
        if (S.hold) release(c, +k - 1);
      }
    },
    frame(c, dt, t) {
      if (!S || !S.lv) return;
      S.t += dt;
      const sp = S.lv.speed;
      // 輸送帶：滾軸轉、紋路往右跑；東西被帶著走，盡頭掉下去再從左邊出來
      S.rollers.forEach(r => { r.rotation.z -= sp * dt / .3; });
      S.stripes.forEach((s, k) => { const L = BX1 - BX0; s.position.x = BX0 + ((k / S.stripes.length * L + S.t * sp) % L); });
      S.items.forEach(it => {
        if (it.state === 'belt') {
          it.x += sp * dt;
          if (it.x > BX1 + .1) { it.state = 'fall'; it.vy = 0; }
        } else if (it.state === 'fall') {
          it.vy -= 14 * dt; it.y += it.vy * dt; it.x += sp * dt;
          if (it.y < -1.5) { it.state = 'belt'; it.x = BX0 - .2; it.y = BY; S3.poke(it.g.userData.j, .3); c.SFX.land(); }
        } else if (it.state === 'bounce') {
          it.vy -= 14 * dt; it.y += it.vy * dt; it.x += it.vx * dt; it.z += it.vz * dt;
          if (it.vy < 0 && it.y <= BY && Math.abs(it.z - BZ) < .8) { it.y = BY; it.z = BZ; it.state = 'belt'; S3.poke(it.g.userData.j, .4); c.SFX.land(); }
          if (it.y < -2) { it.state = 'belt'; it.x = BX0; it.y = BY; it.z = BZ; }
        }
        // 帶子上別疊在一起
        if (it.state === 'belt') S.items.forEach(o => { if (o !== it && o.state === 'belt' && Math.abs(o.x - it.x) < .7 && o.x > it.x) it.x = Math.min(it.x, o.x - .7); });
        if (it.state !== 'held' && it.state !== 'in') it.g.position.set(it.x, it.y, it.z);
        S3.wobble(it.g.userData.j, dt);
      });
      // 夾子：跟手（lerp .3）；夾著的東西掛在夾子下面
      const h = S.head;
      const k = 1 - Math.pow(.7, dt * 60);
      if (S.grab) { h.x += (S.grab.x - h.x) * .35; h.z += (S.grab.z - h.z) * .35; }
      else { h.x += (S.want.x - h.x) * k; h.z += (S.want.z - h.z) * k; }
      const wantY = S.grab ? (S.grab.y + .95) : HY;
      h.y += (wantY - h.y) * (1 - Math.pow(.002, dt));
      S.car.position.set(h.x, 0, h.z); S.beam.position.z = h.z;
      S.rod.position.y = (3.45 + h.y + .3) / 2; S.rod.scale.y = Math.max(.1, 3.45 - (h.y + .3));
      S.claw.position.y = h.y;
      const open = S.hold ? .05 : .35;
      S.claw.userData.fingers.forEach((f, i) => { f.rotation.z = S3.lerp(f.rotation.z, (i ? 1 : -1) * open, .25); });
      if (S.hold) {
        const it = S.hold, sw = Math.max(-.1, Math.min(.1, (S.want.x - h.x) * .08));
        it.g.position.set(h.x, h.y - .95, h.z); it.g.rotation.z = S3.lerp(it.g.rotation.z, -sw, .2);
      }
      S.bins.forEach(b => S3.wobble(b.g.userData.j, dt));
    },
    glow(c) {
      if (!S || !S.lv) return [];
      if (S.hold) {
        const r = rightBin(S.hold);
        return S.bins.map((b, i) => ({ pos: new T.Vector3(b.x, 1, BINZ), size: 2.6, op: i === r && c.strong ? .45 : .08, strong: i === r && c.strong }));
      }
      const it = S.items[S.sel] && S.items[S.sel].state === 'belt' ? S.items[S.sel] : S.items.find(q => q.state === 'belt');
      return it ? [{ pos: new T.Vector3(it.x, BY + .4, it.z), size: 1.4 }] : [];
    },
    caps(c) {
      if (!S || !S.lv) return [];
      if (S.hold) return S.bins.map((b, i) => ({ pos: new T.Vector3(b.x, 1.5, BINZ), text: String(i + 1), cur: i === S.selBin }));
      const it = S.items[S.sel] && S.items[S.sel].state === 'belt' ? S.items[S.sel] : null;
      return it ? [{ pos: new T.Vector3(it.x, BY + 1, it.z), text: '␣', cur: true }] : [];
    },
    demo(c) {
      const it = S.hold || S.items.find(q => q.state === 'belt');
      if (!it) return null;
      const b = S.bins[rightBin(it)];
      return { kind: 'drag', pts: [new T.Vector3(it.x, BY + .3, it.z), new T.Vector3(b.x, 1, BINZ)], dur: 2.4 };
    },
    assist(c) {
      const lv = S.lv;
      setTimeout(() => {
        if (!S || S.lv !== lv) return;
        const it = S.hold || S.items.find(q => q.state === 'belt');
        if (!it) return;
        if (!S.hold) grab(c, it, true);
        setTimeout(() => { if (S && S.lv === lv && S.hold) release(c, rightBin(S.hold), true); }, 900);
      }, 2600);
    },
    probe(c) {
      const sc = v => { const q = c.screen(v); return [Math.round(q.x), Math.round(q.y)]; };
      return {
        items: S.items.map(it => ({ color: it.color, shape: it.shape, state: it.state, scr: sc(new T.Vector3(it.x, it.y + .3, it.z)), x: it.x, right: rightBin(it) })),
        bins: S.bins.map(b => sc(new T.Vector3(b.x, .9, BINZ))), hold: S.hold ? S.items.indexOf(S.hold) : -1, sel: S.sel,
      };
    },
    exit() { S = null; },
  };

  function pickItem(c, p) {
    const live = S.items.filter(it => it.state === 'belt' || it.state === 'bounce');
    const o = c.pick(p, live.map(it => it.g));
    return o ? live.find(it => it.g === o) : c.nearest(p, live, it => new T.Vector3(it.x, it.y + .3, it.z), 56);
  }
  function binAt(c, p) {
    const o = c.pick(p, S.bins.map(b => b.g));
    if (o) return S.bins.findIndex(b => b.g === o);
    const n = c.nearest(p, S.bins, b => new T.Vector3(b.x, .8, BINZ), 90);
    return n ? S.bins.indexOf(n) : -1;
  }
  // 夾起來：夾子先下去（跟著東西），夾住後往上
  function grab(c, it, quick) {
    if (S.hold) return;
    S.grab = { x: it.x, z: it.z, y: it.y };
    it.state = 'grab';
    c.SFX.tap();
    c.tween(quick || c.FAST ? .05 : .22, () => {}).then(() => {
      if (!S || it.state !== 'grab') return;
      it.state = 'held'; S.hold = it; S.grab = null;
      S.want.x = it.x; S.want.z = it.z; S.head.x = it.x; S.head.z = it.z;
      S3.poke(it.g.userData.j, .35); c.SFX.pick();
    });
  }
  // 放開：對的箱子＝掉進去；錯的箱子＝彈出來、滾回帶子；空的地方＝掉回帶子
  function release(c, b, auto) {
    const it = S.hold;
    if (!it) { if (S.grab) setTimeout(() => { if (S && S.hold) release(c, b, auto); }, 260); return; }
    S.hold = null;
    it.g.rotation.z = 0;
    const from = it.g.position.clone();
    if (b < 0) {
      it.state = 'bounce'; it.x = from.x; it.y = from.y; it.z = from.z; it.vy = 1; it.vx = 0; it.vz = (BZ - from.z) * 1.6;
      if (Math.abs(from.z - BZ) > 1.2) { it.vx = (Math.max(BX0 + .5, Math.min(BX1 - .5, from.x)) - from.x) * 1.2; }
      return;
    }
    const bn = S.bins[b];
    S.want.x = bn.x; S.want.z = BINZ;
    const to = new T.Vector3(bn.x, .35, BINZ);
    it.state = 'in';
    c.tween(c.FAST ? .05 : .35, k => { it.g.position.lerpVectors(from, new T.Vector3(bn.x, from.y, BINZ), Math.min(1, k * 1.6)); it.g.position.y = S3.lerp(from.y, to.y, k * k); }).then(() => {
      if (!S) return;
      if (b === rightBin(it)) {
        S3.poke(bn.g.userData.j, .4); S3.poke(it.g.userData.j, .3); c.SFX.ok();
        it.g.position.set(bn.x + (Math.random() - .5) * .9, .35, BINZ + (Math.random() - .5) * .6);
        it.done = true;
        if (S.items.every(q => q.done)) setTimeout(() => { if (S) c.win(); }, c.FAST ? 20 : 400);
      } else {
        S3.poke(bn.g.userData.j, .3);
        it.state = 'bounce'; it.x = bn.x; it.y = 1.0; it.z = BINZ; it.vy = 5.2; it.vz = (BZ - BINZ) / .8; it.vx = (Math.max(BX0 + .6, Math.min(BX1 - 1.4, bn.x - 1)) - bn.x) / 1.0;
        if (!auto) c.fail(S.lv.by === 'shape' ? 'm3.wrong2' : 'm3.wrong');
      }
    });
  }
})();
