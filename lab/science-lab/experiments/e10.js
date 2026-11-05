// 第 10 關 我的實驗——手勢：捏鋁箔船（在鋁箔上拖兩下）、一顆一顆放彈珠。
// 旁白只在開頭和結論講話；中間孩子自己按圓環的三段（假設 → 實驗 → 結果），沒有旁白帶步驟。
// 每一圈：按「假設」→ 選一種船（一團／窄窄的／寬寬平平的）→ 捏兩下折成那個形狀 → 在 0～12 的彈珠格放標記（我覺得能載幾顆）
//        → 按「實驗」→ 船放進水，一顆一顆放彈珠，船越來越低，載不動就進水沉下去 → 按「結果」→ 跟標記比，不一樣就自己把標記改成真的數字。
// 第二圈換一種船（只改形狀）；如果還沒試過寬平的船，第三圈一定試它；之後可以選「再一圈」或「完成」。
// 參考結果（示意）：一團 0、窄船 4、寬平船 10（實際數字看鋁箔大小與彈珠重量，順序在家做會一樣）。
(window.EXPS = window.EXPS || [])[10] = (() => {
  'use strict';
  const T = THREE;
  const CAP = [0, 4, 10], SURF = 1.2;
  let S = null;

  return {
    say: { end: 'e10.end' },
    build(c) {
      const A = c.A, root = c.root;
      root.add(A.box(7, .1, 3.6, A.M.paper, 0, .05, 0, .4));
      // 淺水盆
      root.add(A.box(4.6, .12, 2.8, A.M.wood, .6, .1, 0, .1));
      const basin = A.mesh(new T.BoxGeometry(4.4, 1.1, 2.6), A.M.glass, .6, .7, 0); basin.castShadow = false; root.add(basin);
      const water = A.mesh(new T.BoxGeometry(4.3, SURF - .15, 2.5), A.M.water, .6, .15 + (SURF - .15) / 2, 0); water.castShadow = false; water.renderOrder = 2; root.add(water);
      // 鋁箔（攤開的一張）
      const foil = new T.Group(), fj = new T.Group(); foil.add(fj); fj.add(A.box(1.5, .03, 1.5, A.std(0xD6DADF, { roughness: .45 }), 0, .02, 0, .02)); c.jel(fj);
      foil.position.set(-2.5, .1, .3); root.add(foil);
      // 彈珠罐
      const jar = A.cyl(.45, .45, .7, A.M.glass, -2.6, .35, -1.1, 20); jar.castShadow = false; root.add(jar);
      [[0, 0], [.15, .1], [-.15, .08], [0, -.15]].forEach(([x, z], i) => root.add(A.ball(.12, A.M.sky, -2.6 + x, .15 + (i % 2) * .15, -1.1 + z, 10)));
      S = { c, A, foil, fj, boat: null, ph: 'idle', kind: -1, fold: 0, marbles: [], count: 0, sunk: false, mark: -1, tried: [], t: 0, bob: 0 };
      c.view([new T.Vector3(-3.4, 0, 1.8), new T.Vector3(3, 0, 1.8), new T.Vector3(-3.4, 1.6, -1.6), new T.Vector3(3, 1.6, -1.6)], { elev: 30, elevPt: 40 });
    },
    async play(c, r0) {
      const A = c.A;
      await c.say('e10.q');
      c.say('e10.how');
      c.hint = 'e10.how';
      let r = 0;
      for (;;) {
        c.setRound(r);
        resetFoil(c);
        // ---- 假設：按圓環的「假設」→ 選船 → 捏 → 放標記 ----
        await c.ring.waitTap(0); c.SFX.tap();
        S.ph = 'shape';
        const pick = await pickShape(c);
        S.kind = pick;
        S.ph = 'fold';
        await c.until();
        S.ph = 'mark';
        showCells(c);
        await c.until();
        c.mine('<span class="sl-mn-r one">' + A.UI[['ball', 'narrow', 'wide'][S.kind]] + '</span><span class="sl-mn-n">' + S.mark + '</span>');
        // ---- 實驗 ----
        S.ph = 'wait';
        await c.ring.waitTap(1); c.SFX.tap();
        await launch(c);
        S.ph = 'load';
        await c.until();
        S.ph = 'idle';
        await c.wait(.6);
        // ---- 結果 ----
        await c.ring.waitTap(2); c.SFX.tap();
        S.tried.push(S.kind);
        const got = CAP[S.kind];
        S.cells.forEach((b, i) => b.classList.toggle('got', i >= 1 && i <= got));
        if (S.mark === got) { c.markMine(true); await c.wait(.8); }
        else {
          c.markMine(false);
          S.ph = 'fixmark';
          await c.until();
          c.mine('<span class="sl-mn-r one">' + A.UI[['ball', 'narrow', 'wide'][S.kind]] + '</span><span class="sl-mn-n">' + got + '</span>');
          c.markMine(true);
        }
        hideCells();
        await c.lap();
        r++;
        if (r >= 2 && S.tried.includes(2)) {
          // 再一圈，還是完成？
          const more = await askMore(c);
          if (!more) break;
        }
        if (r >= 4) break;
      }
    },
    down(c, p) {
      if (S.ph === 'fold') { S.drag = { x: p.x, y: p.y, dist: 0 }; return; }
      if (S.ph === 'load') { addMarble(c); }
    },
    move(c, p) {
      const d = S.drag; if (!d || S.ph !== 'fold') return;
      d.dist += Math.hypot(p.x - d.x, p.y - d.y); d.x = p.x; d.y = p.y;
      const f = Math.min(1, S.fold0 + d.dist / 120 * .5);
      setFold(c, f);
    },
    up(c, p) {
      const d = S.drag; S.drag = null;
      if (S.ph === 'fold' && d) { if (d.dist < 12) setFold(c, Math.min(1, S.fold + .5)); S.fold0 = S.fold >= .5 && S.fold < 1 ? .5 : S.fold; if (S.fold >= 1) foldDone(c); }
    },
    key(c, k, down, rep) {
      if (!down || rep) return;
      if (S.ph === 'shape' && /^[123]$/.test(k)) { S.pickRes && S.pickRes(+k - 1); return; }
      if (S.ph === 'fold' && (k === 'space' || k === 'enter')) { setFold(c, Math.min(1, S.fold + .5)); S.fold0 = S.fold; if (S.fold >= 1) foldDone(c); return; }
      if (S.ph === 'mark' || S.ph === 'fixmark') {
        if (k === 'left' || k === 'right') { const m = Math.max(0, Math.min(12, (S.cur || 0) + (k === 'left' ? -1 : 1))); S.cur = m; paintCells(); c.SFX.note(m % 11); return; }
        if (k === 'enter' || k === 'space') { cellPick(c, S.cur || 0); return; }
        if (/^\d$/.test(k)) { const v = +k; S.cur = v; cellPick(c, v); return; }
      }
      if (S.ph === 'load' && (k === 'space' || k === 'enter')) addMarble(c);
      if (S.ph === 'more' && (k === 'enter' || k === 'n')) S.moreRes && S.moreRes(false);
      if (S.ph === 'more' && (k === 'r' || k === 'space')) S.moreRes && S.moreRes(true);
    },
    frame(c, dt) {
      if (!S) return;
      S.t += dt;
      if (S.boat && S.boat.parent && S.inWater) {
        const cap = CAP[S.kind];
        const sinkK = S.sunk ? 1 : cap ? S.count / (cap + 1) : 0;
        const yEq = S.sunk ? .2 : SURF - .02 - sinkK * .22 - (S.kind === 0 ? .1 : 0);
        S.boatY += (yEq - S.boatY) * Math.min(1, dt * (S.sunk ? 1.5 : 4));
        S.boat.position.y = S.boatY + (S.sunk ? 0 : Math.sin(S.t * 2) * .02);
        S.boat.rotation.z = S.sunk ? Math.min(.35, (S.boat.rotation.z + dt * .3)) : Math.sin(S.t * 1.6) * .03;
      }
    },
    glow(c) {
      if (S.ph === 'fold') return [{ pos: S.foil.position.clone(), size: 2, strong: c.strong }];
      if (S.ph === 'load' && S.boat) return [{ pos: S.boat.position.clone().setY(SURF + .2), size: 2, strong: c.strong }];
      return [];
    },
    caps(c) {
      if (S.ph === 'fold') return [{ pos: S.foil.position.clone().setY(.9), text: '␣', cur: true }];
      if (S.ph === 'load' && S.boat) return [{ pos: S.boat.position.clone().setY(SURF + 1.0), text: '␣', cur: true }];
      return [];
    },
    demo(c) {
      if (S.ph === 'fold') return { kind: 'drag', pts: [S.foil.position.clone().add(new T.Vector3(-.6, 0, 0)), S.foil.position.clone().add(new T.Vector3(.6, 0, 0)), S.foil.position.clone().add(new T.Vector3(-.6, 0, 0))] };
      if (S.ph === 'load' && S.boat) return { kind: 'tap', pts: [S.boat.position.clone().setY(SURF + .3)] };
      if (S.ph === 'wait' || c.ring.waiting) { const n = c.ring.node(c.ring.step); if (n) { const r = n.getBoundingClientRect(); return { kind: 'tap', pts: [{ x: r.left + r.width / 2, y: r.top + r.height / 2 }] }; } }
      if ((S.ph === 'mark' || S.ph === 'fixmark') && S.cells) { const b = S.cells[S.ph === 'fixmark' ? CAP[S.kind] : 5] || S.cells[0]; const r = b.getBoundingClientRect(); return { kind: 'tap', pts: [{ x: r.left + r.width / 2, y: r.top + r.height / 2 }] }; }
      if (S.ph === 'shape') { const b = document.querySelector('.sl-btn'); if (b) { const r = b.getBoundingClientRect(); return { kind: 'tap', pts: [{ x: r.left + 38, y: r.top + 38 }] }; } }
      return null;
    },
    assist(c) {
      if (S.ph === 'fold') { setFold(c, 1); foldDone(c); }
      else if (S.ph === 'load') addMarble(c);
      else if (S.ph === 'fixmark') cellPick(c, CAP[S.kind]);
    },
    probe(c) {
      const sc = v => { const q = c.screen(v); return [Math.round(q.x), Math.round(q.y)]; };
      const cells = S.cells ? S.cells.map(b => { const r = b.getBoundingClientRect(); return [Math.round(r.left + r.width / 2), Math.round(r.top + r.height / 2)]; }) : null;
      const btns = [...document.querySelectorAll('#ctl .sl-btn')].map(b => { const r = b.getBoundingClientRect(); return [Math.round(r.left + r.width / 2), Math.round(r.top + r.height / 2)]; });
      const nodes = [0, 1, 2].map(k => { const r = c.ring.node(k).getBoundingClientRect(); return [Math.round(r.left + r.width / 2), Math.round(r.top + r.height / 2)]; });
      return { ph: S.ph, kind: S.kind, fold: S.fold, mark: S.mark, count: S.count, sunk: S.sunk, tried: S.tried, foil: sc(S.foil.position), boat: S.boat ? sc(S.boat.position.clone().setY(SURF + .3)) : null, cells, btns, nodes, ringWait: c.ring.waiting };
    },
    exit() { hideCells(); S = null; },
  };

  function resetFoil(c) {
    if (S.boat) { c.root.remove(S.boat); S.boat = null; }
    S.marbles.forEach(m => c.root.remove(m)); S.marbles = [];
    S.foil.visible = true; S.fj.scale.set(1, 1, 1); S.fj.children.forEach(ch => ch.visible = true);
    S.fold = 0; S.fold0 = 0; S.count = 0; S.sunk = false; S.inWater = false; S.mark = -1; S.cur = 5;
    if (S.preview) { S.fj.remove(S.preview); S.preview = null; }
  }
  function pickShape(c) {
    const A = S.A;
    return new Promise(res => {
      const done = i => { if (S.tried.length >= 1 && i === S.tried[S.tried.length - 1]) { c.fail(); return; } S.pickRes = null; c.clearButtons(); c.SFX.ok(); res(i); };
      S.pickRes = done;
      ['ball', 'narrow', 'wide'].forEach((k, i) => {
        const b = c.button({ icon: A.UI[k], key: String(i + 1), label: k, cls: 'wide', down: () => done(i) });
        if (S.tried.length && i === S.tried[S.tried.length - 1]) b.classList.add('dim');
        else if (S.tried.length >= 2 && !S.tried.includes(2) && i !== 2) b.classList.add('dim');
      });
    });
  }
  function setFold(c, f) {
    const prev = S.fold; S.fold = f;
    if (Math.floor(prev * 2) !== Math.floor(f * 2)) { c.poke(S.fj, .4); c.SFX.note(4 + Math.floor(f * 2) * 2); }
    // 兩步的折法動畫：鋁箔慢慢縮成那個形狀
    const k = S.kind;
    const sx = k === 0 ? 1 - f * .7 : k === 1 ? 1 : 1 - f * .1, sz = k === 0 ? 1 - f * .7 : k === 1 ? 1 - f * .7 : 1 - f * .1, sy = k === 0 ? 1 + f * 8 : 1 + f * 2;
    S.fj.scale.set(sx, sy, sz);
  }
  function foldDone(c) {
    if (S.ph !== 'fold') return;
    S.ph = 'folded';
    S.fj.children.forEach(ch => ch.visible = false);
    S.fj.scale.set(1, 1, 1);
    const b = S.A.boatFoil(S.kind); b.scale.setScalar(S.kind === 1 ? .9 : .8);
    S.preview = b; S.fj.add(b);
    c.SFX.ok();
    setTimeout(() => S && c.win(), c.FAST ? 10 : 300);
  }
  function showCells(c) {
    const el = document.createElement('div'); el.className = 'sl-cells10';
    el.innerHTML = Array.from({ length: 13 }, (_, i) => '<button type="button" data-n="' + i + '">' + i + '</button>').join('');
    document.querySelector('#sl').appendChild(el); S.cellsEl = el; S.cells = [...el.children];
    S.cells.forEach(b => b.addEventListener('click', () => cellPick(c, +b.dataset.n)));
    paintCells();
  }
  function paintCells() { if (!S.cells) return; S.cells.forEach((b, i) => { b.classList.toggle('mk', i === S.mark); b.classList.toggle('hint', i === S.cur && S.mark !== i); }); }
  function cellPick(c, n) {
    c.act();
    if (S.ph === 'mark') { S.mark = n; S.cur = n; paintCells(); c.SFX.ok(); S.ph = 'marked'; setTimeout(() => S && c.win(), c.FAST ? 10 : 350); return; }
    if (S.ph === 'fixmark') {
      const got = CAP[S.kind];
      if (n !== got) { const b = S.cells[n]; b.classList.remove('sl-shake'); void b.offsetWidth; b.classList.add('sl-shake'); c.fail(); return; }
      S.mark = n; paintCells(); c.SFX.ok(); S.ph = 'fixed'; setTimeout(() => S && c.win(), c.FAST ? 10 : 400);
    }
  }
  function hideCells() { if (S && S.cellsEl) { S.cellsEl.remove(); S.cellsEl = null; S.cells = null; } }
  async function launch(c) {
    const b = S.A.boatFoil(S.kind); b.scale.setScalar(S.kind === 1 ? 1.2 : 1.1);
    S.foil.visible = false;
    if (S.preview) { S.fj.remove(S.preview); S.preview = null; }
    c.root.add(b); S.boat = b;
    const from = S.foil.position.clone(), to = new T.Vector3(.6, SURF, 0);
    await c.tween(.6, k => { b.position.lerpVectors(from, to, c.ease(k)); b.position.y += Math.sin(k * Math.PI) * 1; });
    if (!S) return;
    S.inWater = true; S.boatY = SURF; c.SFX.drop();
  }
  function addMarble(c) {
    if (S.ph !== 'load' || S.sunk || !S.boat) return;
    c.act();
    S.count++;
    const m = S.A.ball(.085, S.A.M.sky, 0, 0, 0, 10);
    const n = S.count - 1, w = S.kind === 2 ? 4 : S.kind === 1 ? 6 : 1;
    const lx = (n % w - (w - 1) / 2) * .2, lz = S.kind === 2 ? (Math.floor(n / w) - 1) * .2 : 0;
    m.position.set(lx, .9, lz); S.boat.add(m); S.marbles.push(m);
    c.tween(.3, k => { m.position.y = .9 - k * .7; }).then(() => {
      if (!S) return;
      c.SFX.note(Math.min(10, S.count));
      if (S.count > CAP[S.kind]) {
        S.sunk = true; S.count = CAP[S.kind];
        c.SFX.splash();
        setTimeout(() => { if (S) { c.SFX.land(); c.win(); } }, c.FAST ? 10 : 1400);
      }
    });
  }
  function askMore(c) {
    return new Promise(res => {
      S.ph = 'more';
      const fin = v => { S.moreRes = null; c.clearButtons(); S.ph = 'idle'; res(v); };
      S.moreRes = fin;
      const b1 = c.button({ icon: 'redo', key: 'R', label: '再一圈', down: () => fin(true) });
      const b2 = c.button({ icon: 'check', key: 'Enter', label: '完成', cls: 'lit', down: () => fin(false) });
      b2.classList.add('glow'); void b1;
    });
  }
})();
