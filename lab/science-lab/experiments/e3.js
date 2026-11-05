// 第 3 關 斜坡賽車——手勢：抬高斜坡（上下拖）、放車、積木自己排出來量距離（側看）。
// 第一圈：「坡高一點，跑比較遠還是比較近？」→ 低坡放一次、高坡放一次 → 遠。
// 第二圈：「換大車會跑比較遠嗎？」→ 遊戲故意換大車又抬高（不公平）→ 跑完配音提醒兩件事都變了 →
//         孩子點一個「改回來」（車改回小車，或坡改回低）→ 再放 → 差不多遠（車子大小影響很小）。
// 第三圈：「鋪毛巾呢？」→ 把毛巾拖到地上 → 放 → 近很多。
// 距離（積木塊數）：低 4、中 6、高 8；毛巾：低 2、中 2、高 3；大車小車一樣。
(window.EXPS = window.EXPS || [])[3] = (() => {
  'use strict';
  const T = THREE;
  let X0 = -4.1, XB = -1.7, BW = .5;
  const HS = [.7, 1.35, 2.0], DIST = [4, 6, 8], TOW = [2, 2, 3];
  let S = null;
  const rampTop = h => new T.Vector3(X0, HS[h], 0);

  return {
    say: { end: 'e3.end' },
    build(c) {
      const A = c.A, root = c.root;
      if (c.portrait) { X0 = -2.9; XB = -1.3; BW = .38; } else { X0 = -4.1; XB = -1.7; BW = .5; }
      root.add(A.box(c.portrait ? 5.8 : 8.4, .1, 2.6, A.M.paper, c.portrait ? -.4 : -.1, .05, 0, .4));
      // 斜坡：一塊板子，一端在地上（XB），一端掛在柱子上（X0，三段高度）
      const ramp = new T.Group(); root.add(ramp);
      const board = A.box(1, .12, 1.1, A.M.wood, 0, 0, 0, .04); ramp.add(board);
      const post = A.box(.22, 2.3, .3, A.M.woodDark, X0 - .2, 1.15, -.55); root.add(post);
      const pegs = HS.map((h, i) => { const m = A.ball(.13, i ? A.M.cream2 : A.M.cream2, X0 - .2, h, -.32, 10); root.add(m); return m; });
      const knob = new T.Group(); const kj = new T.Group(); knob.add(kj); kj.add(A.ball(.2, A.M.coral, 0, 0, 0, 14)); c.jel(kj); root.add(knob);
      // 車子（小、大）
      const small = A.car(false), big = A.car(true); root.add(small); root.add(big); big.visible = false;
      const carJ = new T.Group(); root.add(carJ);
      // 毛巾：放在桌子後面右邊，拖到地上
      const towel = A.towel(3.6, .9, 0xA9C4A3); towel.position.set(XB + 8 * BW - .8, .1, -1.0); towel.scale.setScalar(.4); root.add(towel);
      S = { c, A, ramp, board, knob, kj, pegs, small, big, towel, h: 0, hy: HS[0], big0: false, run: null, rows: [], runs: [], ph: 'idle', drag: null, towelOn: false, lockH: false, t: 0 };
      setRamp(0, true);
      parkCar();
      const xr = XB + 8 * BW + .3;
      c.view([new T.Vector3(X0 - 1, 0, 1.3), new T.Vector3(xr, 0, 1.3), new T.Vector3(X0 - 1, 2.9, -.8), new T.Vector3(xr, 2.9, -.8)], { elev: 16, elevPt: 24 });
    },
    async play(c, r0) {
      const A = c.A;
      const CH1 = { opts: [{ svg: A.icon('far'), label: 'c.far', say: 'o.far' }, { svg: A.icon('near'), label: 'c.near', say: 'o.near' }] };
      if (r0 === 0) {
        c.setRound(0);
        await c.say('e3.q');
        const g = await c.guessChoice(CH1);
        await c.step(1);
        S.ph = 'run'; S.need = 'lowhigh';
        c.say('e3.x1');
        await c.until('e3.x1');
        S.ph = 'idle';
        await c.say('e3.r1');
        await c.checkChoice(CH1, g, 0);
        await c.lap();
      }
      if (r0 <= 1) {
        c.setRound(1);
        const CH2 = { opts: [{ svg: A.icon('bigcar'), say: 'o.bigcar' }, { svg: A.icon('same'), label: 'c.same', say: 'o.same' }, { svg: A.icon('smallcar'), say: 'o.smallcar' }] };
        await c.say('e3.q2');
        const g = await c.guessChoice(CH2);
        await c.step(1);
        // 不公平的比賽：換大車，坡也抬高
        clearRows(c, 1);
        setBig(c, true); setRamp(2);
        c.SFX.snap();
        S.ph = 'run'; S.need = 'one'; S.lockH = true;
        c.say('e3.x2');
        await c.until('e3.x2');
        S.ph = 'idle';
        await c.say('e3.u2');
        S.ph = 'fixvar';
        const b1 = c.button({ icon: A.sv(A.SVG.smallcar), key: 'A', label: '車子改回來', down: () => revert(c, 'car') });
        const b2 = c.button({ icon: A.sv('<path d="M6 54L54 40v14z" fill="#D9B27A"/><path d="M50 16v18M44 28l6 6 6-6" stroke="#3B3430" stroke-width="3" fill="none" stroke-linecap="round"/>'), key: 'B', label: '坡改回來', down: () => revert(c, 'ramp') });
        b1.classList.add('glow'); b2.classList.add('glow');
        await c.until('e3.u2');
        c.clearButtons();
        S.ph = 'run'; S.need = 'one';
        c.say('e3.x2b');
        await c.until('e3.x2b');
        S.ph = 'idle';
        await c.say('e3.r2');
        await c.checkChoice(CH2, g, 1);
        await c.lap();
      }
      c.setRound(2);
      if (r0 === 2) { setRamp(2); }
      S.lockH = true;
      const CH3 = { opts: [{ svg: A.icon('far'), label: 'c.far', say: 'o.far' }, { svg: A.icon('near'), label: 'c.near', say: 'o.near' }] };
      await c.say('e3.q3');
      const g3 = await c.guessChoice(CH3);
      await c.step(1);
      S.ph = 'towel';
      c.say('e3.x3');
      await c.until('e3.x3');
      S.ph = 'run'; S.need = 'one';
      c.hint = 'e3.x2b';
      await c.until('e3.x2b');
      S.ph = 'idle';
      await c.say('e3.r3');
      await c.checkChoice(CH3, g3, 1);
      await c.lap();
    },
    down(c, p) {
      if (S.run) return;
      const kq = c.screen(S.knob.position), cq = c.screen(carPos());
      const dk = Math.hypot(kq.x - p.x, kq.y - p.y), dc = Math.hypot(cq.x - p.x, cq.y - p.y);
      if ((S.ph === 'run') && !S.lockH && dk < 70 && dk < dc) { S.drag = { k: 'ramp', x: p.x, y: p.y, moved: false }; c.poke(S.kj, .3); c.SFX.tap(); return; }
      if (S.ph === 'towel') { const tq = c.screen(S.towel.position); if (Math.hypot(tq.x - p.x, tq.y - p.y) < 90) { S.drag = { k: 'towel', x: p.x, y: p.y, moved: false }; c.SFX.tap(); return; } }
      S.tap = { x: p.x, y: p.y, car: Math.hypot(cq.x - p.x, cq.y - p.y) < 80 };
    },
    move(c, p) {
      const d = S.drag; if (!d) return;
      if (d.k === 'ramp' && Math.hypot(p.x - d.x, p.y - d.y) > 8) d.moved = true;
      if (d.k === 'ramp' && d.moved) { const q = c.planeZ(p, 0); if (q) { S.hy = Math.max(HS[0], Math.min(HS[2], q.y)); placeRamp(); const n = nearestH(S.hy); if (n !== S.h) { S.h = n; c.SFX.note(2 + n * 3); c.poke(S.kj, .2); } } }
      if (d.k === 'towel') { if (Math.hypot(p.x - d.x, p.y - d.y) > 10) d.moved = true; const g = c.ground(p, .1); if (g) S.towel.position.set(Math.max(XB, Math.min(XB + 8 * BW, g.x)), .1, Math.max(-1.2, Math.min(1, g.z))); }
    },
    up(c, p) {
      const d = S.drag; S.drag = null;
      if (d && d.k === 'ramp' && d.moved) { setRamp(S.h); return; }
      if (d && d.k === 'ramp') S.tap = { x: d.x, y: d.y, car: false };
      if (d && d.k === 'towel') { if (!d.moved || (S.towel.position.x > XB + .3 && Math.abs(S.towel.position.z) < .8)) layTowel(c); else { c.fail(); S.towel.position.set(XB + 8 * BW - .8, .1, -1.0); } return; }
      const t = S.tap; S.tap = null;
      if (!t || Math.hypot(p.x - t.x, p.y - t.y) > 14) return;
      if (S.ph === 'run' && t.car) { go(c); return; }
      if (S.ph === 'run' && !S.lockH) { const pi = S.pegs.findIndex(m => { const q = c.screen(m.position); return Math.hypot(q.x - p.x, q.y - p.y) < 50; }); if (pi >= 0) { setRamp(pi); c.SFX.note(2 + pi * 3); return; } }
      if (S.ph === 'run') { const cq = c.screen(carPos()); if (Math.hypot(cq.x - p.x, cq.y - p.y) < 130) go(c); }
    },
    key(c, k, down, rep) {
      if (!down || rep) return;
      if (S.ph === 'run' && !S.run) {
        if ((k === 'up' || k === 'w') && !S.lockH && S.h < 2) { setRamp(S.h + 1); c.SFX.note(2 + S.h * 3); c.poke(S.kj, .25); }
        else if ((k === 'down' || k === 's') && !S.lockH && S.h > 0) { setRamp(S.h - 1); c.SFX.note(2 + S.h * 3); c.poke(S.kj, .25); }
        else if (k === 'space' || k === 'enter') go(c);
      } else if (S.ph === 'fixvar' && (k === 'a' || k === 'b')) revert(c, k === 'a' ? 'car' : 'ramp');
      else if (S.ph === 'towel' && (k === 't' || k === 'space' || k === 'enter')) layTowel(c);
    },
    frame(c, dt) {
      if (!S) return;
      S.t += dt;
      const car = S.big0 ? S.big : S.small;
      if (S.run) {
        const r = S.run; r.t += dt;
        if (r.phase === 'ramp') {
          r.s = Math.min(1, r.s + dt * (.5 + r.s * 2.4));
          const a = rampTop(S.h), b = new T.Vector3(XB, 0, 0);
          car.position.lerpVectors(a, b, r.s); car.position.y += .12;
          car.rotation.z = -Math.atan2(HS[S.h], XB - X0);
          if (r.s >= 1) { r.phase = 'floor'; r.x = XB; r.v = 1; car.rotation.z = 0; c.SFX.land(); }
        } else if (r.phase === 'floor') {
          const left = r.end - r.x;
          r.x += Math.max(.06, Math.min(4, left * 2.2)) * dt;
          if (r.x >= r.end) { r.x = r.end; r.phase = 'blocks'; r.k = 0; r.bt = 0; }
          car.position.set(r.x + .4, .02, 0);
        } else if (r.phase === 'blocks') {
          r.bt -= dt;
          if (r.bt <= 0) {
            if (r.k < r.n) { addBlock(c, r.k); c.SFX.note(r.k + 1); r.k++; r.bt = c.FAST ? 0 : .22; }
            else { const fin = S.run; S.run = null; S.runs.push({ h: S.h, big: S.big0, towel: S.towelOn, n: fin.n }); afterRun(c); }
          }
        }
        car.userData.wh.forEach(w => { w.rotation.z -= dt * 12; });
      }
      // 把手：跟著坡頂
      S.knob.position.copy(rampTop(S.h)).setY(S.hy).add(new T.Vector3(-.05, .25, .6));
      S.pegs.forEach((m, i) => m.material = i === S.h ? S.A.M.coral : S.A.M.cream2);
    },
    glow(c) {
      if (S.run) return [];
      if (S.ph === 'towel') return [{ pos: S.towel.position.clone(), size: 2, strong: c.strong }, { pos: new T.Vector3(.5, .1, 0), size: 2.4, color: c.A.C.sage, op: .2 }];
      if (S.ph !== 'run') return [];
      if (S.need === 'lowhigh' && S.runs.length && S.runs.every(r => r.h === S.h) && !S.lockH) return [{ pos: S.knob.position.clone(), size: 1.2, strong: c.strong }];
      return [{ pos: carPos(), size: 1.5, strong: c.strong }];
    },
    caps(c) {
      if (S.run) return [];
      if (S.ph === 'run') { const out = [{ pos: carPos().add(new T.Vector3(0, .9, 0)), text: '␣', cur: true }]; if (!S.lockH) out.push({ pos: S.knob.position.clone().add(new T.Vector3(0, .5, 0)), text: '↑↓' }); return out; }
      if (S.ph === 'towel') return [{ pos: S.towel.position.clone().add(new T.Vector3(0, .6, 0)), text: 'T', cur: true }];
      return [];
    },
    demo(c) {
      if (S.ph === 'towel') return { kind: 'drag', pts: [S.towel.position.clone(), new T.Vector3(.6, .1, 0)] };
      if (S.ph !== 'run') return null;
      if (S.need === 'lowhigh' && S.runs.length && S.runs.every(r => r.h === S.h)) return { kind: 'drag', pts: [S.knob.position.clone(), rampTop(2).add(new T.Vector3(0, .3, .6))] };
      return { kind: 'tap', pts: [carPos()] };
    },
    assist(c) {
      if (S.ph === 'towel') { layTowel(c); return; }
      if (S.ph === 'run' && S.need === 'lowhigh' && S.runs.length && S.runs.every(r => r.h === S.h)) setRamp(S.h === 2 ? 0 : 2);
    },
    probe(c) {
      const sc = v => { const q = c.screen(v); return [Math.round(q.x), Math.round(q.y)]; };
      return { ph: S.ph, h: S.h, big: S.big0, towel: S.towelOn, runs: S.runs.slice(), running: !!S.run, car: sc(carPos()), knob: sc(S.knob.position), pegs: S.pegs.map(m => sc(m.position)), towelScr: sc(S.towel.position), need: S.need, lock: S.lockH };
    },
    exit() { S = null; },
  };

  function carPos() { const car = S.big0 ? S.big : S.small; return car.position.clone().add(new T.Vector3(0, .3, 0)); }
  function nearestH(y) { let b = 0; HS.forEach((h, i) => { if (Math.abs(h - y) < Math.abs(HS[b] - y)) b = i; }); return b; }
  function placeRamp() {
    const a = new T.Vector3(X0, S.hy, 0), b = new T.Vector3(XB, 0, 0);
    const L = a.distanceTo(b);
    S.board.scale.set(L, 1, 1);
    S.ramp.position.copy(a).add(b).multiplyScalar(.5).setY(S.hy / 2 + .05);
    S.ramp.rotation.z = -Math.atan2(S.hy, XB - X0);
    if (!S.run) parkCar();
  }
  function setRamp(h, snap) {
    S.h = h;
    if (snap) { S.hy = HS[h]; placeRamp(); return; }
    const y0 = S.hy;
    S.c.tween(.3, k => { S.hy = S.c.lerp(y0, HS[h], S.c.outBack(k)); placeRamp(); });
  }
  function parkCar() {
    [S.small, S.big].forEach(car => {
      car.position.copy(rampTop(S.h)).setY(S.hy + .1).add(new T.Vector3(.35, 0, 0));
      car.rotation.z = -Math.atan2(S.hy, XB - X0);
    });
  }
  function setBig(c, on) { S.big0 = on; S.small.visible = !on; S.big.visible = on; parkCar(); }
  function go(c) {
    if (S.run || S.ph !== 'run') return;
    if (S.need === 'lowhigh' && S.runs.length && S.runs.every(r => r.h === S.h)) { c.fail('e3.x1b'); return; }
    c.act();
    const n = S.towelOn ? TOW[S.h] : DIST[S.h];
    S.run = { phase: 'ramp', s: 0, t: 0, n, end: XB + n * BW - .4 };
    S.rowZ = .75 - (S.rows.length % 3) * .55;
    S.row = [];
    S.rows.push(S.row);
    if (S.rows.length > 3) { S.rows.shift().forEach(b => c.root.remove(b)); }
    c.SFX.glide();
  }
  function addBlock(c, k) {
    const b = c.A.block(); b.position.set(XB + k * BW + BW / 2, .02, S.rowZ); b.scale.set(1.15 * BW / .5, 1, 1);
    if (S.big0) b.children ? null : null;
    c.root.add(b); S.row.push(b);
    S3.jelly(b, 160, 7); S3.poke(b, .3); c._jels.add(b);
  }
  function clearRows(c, keep) { while (S.rows.length > keep) S.rows.shift().forEach(b => c.root.remove(b)); }
  function afterRun(c) {
    const R = S.runs;
    if (S.need === 'lowhigh') {
      if (R.length && new Set(R.map(r => r.h)).size >= 2) { S.ph = 'done'; setTimeout(() => S && c.win(), c.FAST ? 10 : 600); }
      else { setTimeout(() => { if (S) { parkCar(); c.say('e3.x1b'); } }, c.FAST ? 10 : 500); }
      parkCarLater(c);
      return;
    }
    parkCarLater(c);
    S.ph = 'done'; setTimeout(() => S && c.win(), c.FAST ? 10 : 600);
  }
  function parkCarLater(c) { setTimeout(() => { if (S && !S.run) parkCar(); }, c.FAST ? 20 : 900); }
  function revert(c, what) {
    if (S.ph !== 'fixvar') return;
    S.ph = 'idle'; c.act();
    if (what === 'car') { setBig(c, false); c.SFX.snap(); }
    else { setRamp(0); c.SFX.note(2); setTimeout(() => S && parkCar(), 350); }
    c.win();
  }
  function layTowel(c) {
    if (S.ph !== 'towel') return;
    S.ph = 'idle';
    const from = S.towel.position.clone(), s0 = S.towel.scale.x;
    c.tween(.5, k => { S.towel.position.lerpVectors(from, new T.Vector3(XB + 1.9 * BW / .5, .02, 0), c.ease(k)); S.towel.scale.set(c.lerp(s0, BW / .5, c.ease(k)), c.lerp(s0, 1, c.ease(k)), c.lerp(s0, 1, c.ease(k))); }).then(() => {
      if (!S) return; S.towelOn = true; c.SFX.land(); clearRows(c, 1);
      setTimeout(() => S && c.win(), c.FAST ? 10 : 300);
    });
  }
})();
