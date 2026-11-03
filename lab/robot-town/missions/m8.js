// 第 8 關 倉庫搬架子（倉庫機器人：鑽到架子底下抬起來走）——手勢：推開讓路（一格一格）。
// 俯視 5×5 格子。沒載東西時可以鑽過任何架子底下；鑽到有珊瑚紅記號的架子底下＝升降盤升起、把它抬起來。
// 載著架子往別的架子走＝把它推開一格（後面卡住就推不動，溫柔地彈回）。把紅記號架子送到右邊出口。
// 三小關：搬 1 個 → 有別的架子擋路（要推開）→ 第二台藍色機器人跟著你的路走（你往回走會被它擋住）。
// 三條路：鍵盤方向鍵；手指往上下左右滑（滑一格走一格）；點格子／架子／出口＝它自己找路走過去。
(window.MISSIONS = window.MISSIONS || [])[8] = (() => {
  'use strict';
  const T = THREE;
  const CS = 1.3, N = 5, EXIT = [5, 2];
  const LV = [
    { me: [0, 2], target: [2, 2], shelves: [[1, 0], [3, 4], [4, 0]], two: null },
    { me: [0, 0], target: [1, 2], shelves: [[3, 2], [4, 2], [2, 0], [0, 4], [3, 4]], two: null },
    { me: [1, 2], target: [2, 3], shelves: [[3, 2], [4, 1], [1, 4], [3, 0]], two: [0, 2] },
  ];
  const W = ([i, j], y = 0) => new T.Vector3((i - 2) * CS, y, (j - 2) * CS);
  const eq = (a, b) => a && b && a[0] === b[0] && a[1] === b[1];
  let S = null;
  const inGrid = p => p[0] >= 0 && p[0] < N && p[1] >= 0 && p[1] < N;
  const shelfAt = p => S.shelves.find(s => !s.gone && s !== S.carry && eq(s.cell, p));

  function shelf(A, target) {
    const g = new T.Group(), j = new T.Group(); g.add(j);
    [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([sx, sz]) => j.add(A.mesh(new T.BoxGeometry(.1, .62, .1), A.M.woodDark, sx * .46, .31, sz * .46)));
    [.62, .98].forEach(y => j.add(A.mesh(A.rbox(1.06, .08, 1.06, .06, .02), A.M.yellow, 0, y, 0)));
    j.add(A.mesh(A.rbox(.9, .28, .5, .06, .02), A.M.wood, -.08, .8, 0));
    j.add(A.mesh(A.rbox(.4, .2, .36, .05, .02), A.M.cream2, .2, 1.12, .1));
    if (target) { j.add(A.mesh(new T.BoxGeometry(1.08, .1, 1.08), A.M.coral, 0, 1.03, 0)); j.add(A.mesh(new T.CylinderGeometry(.18, .18, .04, 18), A.M.coral, 0, 1.2, 0)); }
    S3.jelly(j, 150, 7);
    g.userData.j = j;
    return g;
  }
  function kiva(A, color) {
    const g = new T.Group(), j = new T.Group(); g.add(j);
    j.add(A.mesh(A.rbox(.82, .26, .82, .3, .06), A.M[color], 0, .17, 0));
    const plate = A.mesh(new T.CylinderGeometry(.3, .3, .06, 24), A.M.amber, 0, .32, 0); j.add(plate);
    [-1, 1].forEach(s => j.add(A.mesh(new T.SphereGeometry(.05, 8, 6), A.M.ink, s * .14, .22, .41)));
    S3.jelly(j, 160, 7);
    g.userData = { j, plate };
    return g;
  }

  return {
    say: { intro: 'm8.intro', subs: ['m8.s1', 'm8.s2', 'm8.s3'], ok: 'm8.ok', aha: 'm8.aha' },
    build(c) {
      const A = c.A, root = c.root;
      root.add(A.slab(N * CS + 2.4, N * CS + 1.4, A.M.paper, .1));
      // 地上的格子線＋每格一個記號點（機器人靠地上的記號認路）
      const lm = A.std(0xE6D5B8, { roughness: 1 });
      for (let k = 0; k <= N; k++) {
        const a = A.mesh(new T.BoxGeometry(N * CS, .015, .05), lm, 0, .11, (k - N / 2) * CS); a.castShadow = false; root.add(a);
        const b = A.mesh(new T.BoxGeometry(.05, .015, N * CS), lm, (k - N / 2) * CS, .11, 0); b.castShadow = false; root.add(b);
      }
      for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) { const d = A.mesh(new T.CylinderGeometry(.06, .06, .02, 10), A.M.cream2, (i - 2) * CS, .115, (j - 2) * CS); d.castShadow = false; root.add(d); }
      // 出口：右邊一個門口（地上琥珀色條紋）
      const ex = W(EXIT);
      root.add(A.mesh(A.rbox(CS * .95, .04, CS * .95, .2, .01), A.std(A.C.amber, { roughness: .9, transparent: true, opacity: .55 }), ex.x, .12, ex.z));
      [-1, 1].forEach(s => root.add(A.mesh(A.rbox(.22, .9, .22, .06, .02), A.M.cream2, ex.x + .6, .55, ex.z + s * .72)));
      root.add(A.mesh(A.rbox(.22, .2, 1.66, .06, .02), A.M.cream2, ex.x + .6, 1.08, ex.z));
      const me = kiva(A, 'cream'); root.add(me);
      const two = kiva(A, 'sky'); root.add(two);
      S = { c, A, me, two, shelves: [], pos: null, pos2: null, carry: null, trail: [], path: null, stepT: 0, busy: false, swipe: null, t: 0 };
      c.view([W([-.6, -.6]), W([5.8, -.6]), W([-.6, 4.6]), W([5.8, 4.6]), W([2, -.6], 1.4)], { elev: 60, elevPt: 76 });
    },
    start(c, sub) {
      const A = c.A, L = LV[sub];
      S.sub = sub; S.L = L; S.carry = null; S.path = null; S.busy = false; S.delivered = false;
      S.shelves.forEach(s => c.root.remove(s.g));
      S.shelves = [{ cell: L.target.slice(), target: true }].concat(L.shelves.map(p => ({ cell: p.slice(), target: false })));
      S.shelves.forEach(s => { s.g = shelf(A, s.target); s.y = 0; c.root.add(s.g); s.g.position.copy(W(s.cell, .1)); s.g.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } }); });
      S.pos = L.me.slice(); S.pos2 = L.two ? L.two.slice() : null;
      S.me.position.copy(W(S.pos, .1)); S.two.visible = !!S.pos2; if (S.pos2) S.two.position.copy(W(S.pos2, .1));
      S.me.userData.plate.position.y = .32;
    },
    // ---------- 輸入 ----------
    down(c, p) { S.swipe = { x: p.x, y: p.y, moved: false }; },
    move(c, p) {
      const s = S.swipe; if (!s) return;
      const dx = p.x - s.x, dy = p.y - s.y;
      if (Math.max(Math.abs(dx), Math.abs(dy)) < 34) return;
      s.moved = true;
      // 畫面方向＝世界方向（鏡頭朝北）；滑一段走一格，繼續滑繼續走
      const d = Math.abs(dx) > Math.abs(dy) ? [Math.sign(dx), 0] : [0, Math.sign(dy)];
      step(c, d); s.x = p.x; s.y = p.y;
    },
    up(c, p) {
      const s = S.swipe; S.swipe = null;
      if (!s || s.moved || p.cancel) return;
      // 點：出口／架子／格子 → 自己找路
      const g = c.ground(p, .1); if (!g) return;
      const cell = [Math.round(g.x / CS + 2), Math.round(g.z / CS + 2)];
      if (cell[0] >= 5 && Math.abs(cell[1] - EXIT[1]) <= 1) goTo(c, EXIT);
      else if (cell[0] >= 0 && cell[0] < N && cell[1] >= 0 && cell[1] < N) goTo(c, cell);
    },
    key(c, k, down, rep) {
      if (!down) return;
      const d = { up: [0, -1], w: [0, -1], down: [0, 1], s: [0, 1], left: [-1, 0], a: [-1, 0], right: [1, 0], d: [1, 0] }[k];
      if (d) { S.path = null; step(c, d); }
      else if ((k === 'enter' || k === 'space') && !rep) goTo(c, S.carry ? EXIT : S.shelves[0].cell);
    },
    frame(c, dt, t) {
      if (!S || !S.L) return;
      S.t += dt;
      if (S.path && !S.busy) { S.stepT -= dt; if (S.stepT <= 0) { const nx = S.path.shift(); if (!nx) S.path = null; else { S.stepT = .28; step(c, [nx[0] - S.pos[0], nx[1] - S.pos[1]], true); } } }
      const k = 1 - Math.pow(.0006, dt);
      S.me.position.lerp(W(S.pos, .1), k);
      if (S.pos2) S.two.position.lerp(W(S.pos2, .1), 1 - Math.pow(.003, dt));
      S.me.userData.plate.position.y = S3.lerp(S.me.userData.plate.position.y, S.carry ? .44 : .32, .2);
      S.shelves.forEach(s => {
        if (s.gone) return;
        const want = s === S.carry ? S.me.position.clone().setY(.1 + .14) : W(s.cell, .1);
        s.g.position.lerp(want, s === S.carry ? 1 - Math.pow(.002, dt) : k);
        s.g.rotation.z = s === S.carry ? S3.lerp(s.g.rotation.z, -(want.x - s.g.position.x) * .3, .2) : S3.lerp(s.g.rotation.z, 0, .2);
        S3.wobble(s.g.userData.j, dt);
      });
      S3.wobble(S.me.userData.j, dt); S3.wobble(S.two.userData.j, dt);
    },
    glow(c) {
      if (!S || !S.L) return [];
      if (!S.carry) return [{ pos: W(S.shelves[0].cell, .6), size: 1.8, strong: c.strong }];
      return [{ pos: W(EXIT, .4), size: 1.9, color: c.A.C.amber, strong: c.strong }];
    },
    caps(c) {
      if (!S || !S.L) return [];
      return [{ pos: W(S.pos, 1.5), text: '↔', cur: true }];
    },
    demo(c) {
      const to = S.carry ? EXIT : S.shelves[0].cell;
      const path = bfs(S.pos, to, !!S.carry) || [to];
      return { kind: 'drag', pts: [W(S.pos, .3)].concat(path.slice(0, 3).map(p => W(p, .3))), dur: 2.4 };
    },
    assist(c) { goTo(c, S.carry ? EXIT : S.shelves[0].cell, true); },
    probe(c) {
      const sc = v => { const q = c.screen(v); return [Math.round(q.x), Math.round(q.y)]; };
      return { pos: S.pos, pos2: S.pos2, carry: !!S.carry, target: S.shelves[0].cell, exitScr: sc(W(EXIT, .1)), targetScr: sc(W(S.shelves[0].cell, .1)), meScr: sc(W(S.pos, .1)), busy: S.busy, path: !!S.path, shelves: S.shelves.map(s => s.cell), route: bfs(S.pos, S.carry ? EXIT : S.shelves[0].cell, !!S.carry) };
    },
    exit() { S = null; },
  };

  // 走一格（必要時推開架子）
  function step(c, d, auto) {
    if (S.busy || S.delivered || !d || (!d[0] && !d[1])) return;
    const to = [S.pos[0] + d[0], S.pos[1] + d[1]];
    c.act();
    // 出口：只有載著紅記號架子才出得去
    if (eq(to, EXIT)) {
      if (S.carry && S.carry.target) { move(c, to); deliver(c); return; }
      bump(c, d, auto ? null : 'm8.block'); return;
    }
    if (!inGrid(to)) { bump(c, d, null); return; }
    if (eq(to, S.pos2)) { bump(c, d, 'm8.wait'); return; }
    const sh = shelfAt(to);
    if (S.carry && sh) {
      const beyond = [to[0] + d[0], to[1] + d[1]];
      if (!inGrid(beyond) || shelfAt(beyond) || eq(beyond, S.pos2)) { bump(c, d, 'm8.block'); S3.poke(sh.g.userData.j, .3); return; }
      sh.cell = beyond; S3.poke(sh.g.userData.j, .4); c.SFX.bump();
    }
    move(c, to);
    // 鑽到紅記號架子底下：抬起來
    if (!S.carry && sh && sh.target) { S.carry = sh; S3.poke(sh.g.userData.j, .4); S3.poke(S.me.userData.j, .3); c.SFX.snap(); }
  }
  function move(c, to) {
    const from = S.pos.slice();
    S.pos = to.slice();
    if (S.pos2) { S.pos2 = from; S3.poke(S.two.userData.j, .15); }
    S.me.rotation.y = Math.atan2(to[0] - from[0], to[1] - from[1]);
    if (S.pos2) S.two.rotation.y = S.me.rotation.y;
    S3.poke(S.me.userData.j, .12); c.SFX.step(to[0] + to[1]);
  }
  function bump(c, d, key) {
    S.path = null; S.busy = true;
    const base = W(S.pos, .1);
    c.tween(.22, k => { const s = Math.sin(k * Math.PI) * .25; S.me.position.set(base.x + d[0] * s, .1, base.z + d[1] * s); }).then(() => { if (S) S.busy = false; });
    S3.poke(S.me.userData.j, .35); c.SFX.no();
    if (key) c.fail(key);
  }
  function deliver(c) {
    S.delivered = true;
    const sh = S.carry; S.carry = null;
    c.SFX.ok();
    const from = W(EXIT, .24);
    c.tween(c.FAST ? .05 : .8, k => { sh.g.position.copy(from).add(new T.Vector3(k * 2.2, 0, 0)); sh.g.scale.setScalar(1 - k * .6); }).then(() => {
      if (!S) return;
      sh.gone = true; sh.g.visible = false;
      setTimeout(() => { if (S) c.win(); }, c.FAST ? 20 : 300);
    });
  }
  // 找路：沒載東西可以鑽過架子底下；載著的時候只走空格（出口也算）
  function bfs(from, to, carrying) {
    const key = p => p[0] + ',' + p[1], prev = {}, q = [from], seen = { [key(from)]: true };
    while (q.length) {
      const p = q.shift();
      if (eq(p, to)) { const path = []; let k = key(p); while (k !== key(from)) { const [x, y] = k.split(',').map(Number); path.unshift([x, y]); k = prev[k]; } return path; }
      for (const d of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const n = [p[0] + d[0], p[1] + d[1]];
        if (seen[key(n)]) continue;
        const b = [n[0] + d[0], n[1] + d[1]];
        const ok = eq(n, EXIT) ? carrying : inGrid(n) && !eq(n, S.pos2) && (!carrying || !shelfAt(n) || (inGrid(b) && !shelfAt(b) && !eq(b, S.pos2)));
        if (!ok) continue;
        seen[key(n)] = true; prev[key(n)] = key(p); q.push(n);
      }
    }
    return null;
  }
  function goTo(c, cell, quiet) {
    if (S.busy || S.delivered) return;
    const path = bfs(S.pos, cell, !!S.carry);
    if (!path) { if (!quiet) bump(c, [Math.sign(cell[0] - S.pos[0]) || 1, 0], 'm8.block'); return; }
    S.path = path; S.stepT = 0; c.SFX.tap();
  }
})();
