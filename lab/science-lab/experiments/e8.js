// 第 8 關 誰先落地？——手勢：兩手同時放開（A、L 兩鍵一起按；或兩指同時點兩個夾子；或點中間的「一起放」拉桿）。
// 第一圈：大鐵球、小木球：「誰先到？」→ 放三次（每次一樣：差不多一起到）→ 下面三格各貼一張結果。
// 第二圈：兩張一樣的紙，按住一張把它捏成紙團 →「誰先到？」→ 一起放 → 紙團先到，攤開的左右飄著慢慢下來。
// 落下是慢動作（看得清楚一起到）；落地各一聲木琴，同時落地＝一個和音。只放一邊：那一邊掉下去，配音提醒要一起放。
(window.EXPS = window.EXPS || [])[8] = (() => {
  'use strict';
  const T = THREE;
  const TOP = 3.3, XS = [-1.1, 1.1], G = 2.6, WIN = .22;
  let S = null;

  function clamp3(c, x) {
    const A = c.A, g = new T.Group(); g.position.set(x, TOP, 0);
    const jaws = [-1, 1].map(s => { const j = A.box(.12, .4, .3, A.M.coral, s * .16, -.15, 0, .04); g.add(j); return j; });
    g.add(A.box(.5, .12, .34, A.M.coral, 0, .08, 0, .04));
    return { g, jaws };
  }
  function makeObj(c, kind) {
    const A = c.A, g = new T.Group(), j = new T.Group(); g.add(j);
    if (kind === 'iron') j.add(A.ball(.36, A.M.iron, 0, 0, 0, 22));
    else if (kind === 'wood') j.add(A.ball(.2, A.M.wood, 0, 0, 0, 18));
    else { const p = A.box(1.0, .03, .8, A.M.paper, 0, 0, 0, .01); j.add(p); const b = A.ball(.26, A.M.paper, 0, 0, 0, 12); b.visible = false; j.add(b); g.userData = { flat: p, ball: b }; }
    c.jel(j); c.root.add(g);
    return { kind, g, j, r: kind === 'iron' ? .36 : kind === 'wood' ? .2 : .26, crumple: 0 };
  }

  return {
    say: { end: 'e8.end' },
    multi: true,
    build(c) {
      const A = c.A, root = c.root;
      root.add(A.box(5.6, .1, 2.6, A.M.paper, 0, .05, 0, .4));
      root.add(A.box(.24, TOP + .3, .3, A.M.woodDark, -2.2, (TOP + .3) / 2, -.6, .05));
      root.add(A.box(.24, TOP + .3, .3, A.M.woodDark, 2.2, (TOP + .3) / 2, -.6, .05));
      root.add(A.box(4.7, .16, .4, A.M.wood, 0, TOP + .32, -.4, .05));
      const clamps = XS.map(x => { const k = clamp3(c, x); root.add(k.g); return k; });
      // 中間的「一起放」拉桿
      const lever = new T.Group(), lj = new T.Group(); lever.add(lj); lj.add(A.cyl(.05, .05, .8, A.M.ink, 0, .4, 0, 8)); lj.add(A.ball(.17, A.M.coral, 0, .85, 0, 14)); c.jel(lj);
      lever.position.set(0, TOP + .4, -.1); root.add(lever);
      S = { c, A, clamps, lever, lj, objs: [], ph: 'idle', t: 0, rel: [null, null], trials: 0, landed: [], keys: {}, holdT: 0 };
      c.view([new T.Vector3(-2.6, 0, 1.3), new T.Vector3(2.6, 0, 1.3), new T.Vector3(-2.6, TOP + 1, -.6), new T.Vector3(2.6, TOP + 1, -.6)], { elev: 12, elevPt: 16 });
      const strip = document.createElement('div'); strip.className = 'sl-strip'; strip.innerHTML = '<i></i><i></i><i></i>'; strip.hidden = true; document.querySelector('#ov').appendChild(strip); S.strip = strip;
    },
    async play(c, r0) {
      const A = c.A;
      if (r0 === 0) {
        c.setRound(0);
        S.objs = [makeObj(c, 'iron'), makeObj(c, 'wood')]; hang(c);
        await c.say('e8.q');
        const CH = { opts: [{ svg: A.icon('ironFirst'), say: 'o.iron' }, { svg: A.icon('woodFirst'), say: 'o.woodb' }, { svg: A.icon('together'), say: 'o.both' }] };
        const g = await c.guessChoice(CH);
        await c.step(1);
        S.strip.hidden = false;
        c.say('e8.x1');
        for (S.trials = 0; S.trials < 3;) {
          S.ph = 'drop';
          await c.until(S.trials ? 'e8.more' : 'e8.x1');
          if (S.trials < 3) { await c.wait(.5); hang(c, true); await c.wait(.5); if (S.trials < 3) c.say('e8.more'); }
        }
        S.ph = 'idle';
        await c.say('e8.r1');
        await c.checkChoice(CH, g, 2);
        await c.lap();
        S.objs.forEach(o => c.root.remove(o.g));
        S.strip.hidden = true;
      }
      c.setRound(1);
      S.objs = [makeObj(c, 'paper'), makeObj(c, 'paper')]; hang(c);
      await c.say('e8.q2');
      const CH2 = { opts: [{ svg: A.icon('flatFirst'), say: 'o.flat' }, { svg: A.icon('ballFirst'), say: 'o.ball' }, { svg: A.icon('together'), say: 'o.both' }] };
      const g2 = await c.guessChoice(CH2);
      await c.step(1);
      S.ph = 'crumple';
      c.say('e8.x2');
      await c.until('e8.x2');
      S.ph = 'drop'; S.paper = true;
      c.hint = 'e8.x1';
      await c.until('e8.x1');
      S.ph = 'idle';
      await c.say('e8.r2');
      await c.checkChoice(CH2, g2, 1);
      await c.lap();
    },
    down(c, p) {
      const k = clampAt(c, p);
      if (S.ph === 'crumple') { const o = S.objs[1], q = c.screen(o.g.position); if (Math.hypot(q.x - p.x, q.y - p.y) < 110 || k === 1) { S.holding = true; c.poke(o.j, .2); } else if (k === 0) { S.holding = true; S.crumpleIdx = 0; } return; }
      if (S.ph !== 'drop') return;
      const lq = c.screen(S.lever.position.clone().setY(TOP + 1.2));
      if (Math.hypot(lq.x - p.x, lq.y - p.y) < 60) { releaseBoth(c); c.poke(S.lj, .4); return; }
      if (k >= 0) release(c, k);
    },
    up(c) { S.holding = false; },
    key(c, k, down, rep) {
      if (k === 'c' || k === 'space') { if (S.ph === 'crumple') S.holding = down; if (k === 'c') return; }
      if (!down || rep) return;
      if (S.ph !== 'drop') return;
      if (k === 'a') release(c, 0);
      else if (k === 'l') release(c, 1);
      else if (k === 'space' || k === 'enter') { releaseBoth(c); c.poke(S.lj, .4); }
    },
    frame(c, dt) {
      if (!S) return;
      S.t += dt;
      if (S.ph === 'crumple' && S.holding) {
        const o = S.objs[S.crumpleIdx || 1];
        o.crumple = Math.min(1, o.crumple + dt / (c.FAST ? .1 : 1.2));
        const u = o.g.userData; u.flat.scale.set(1 - o.crumple * .7, 1, 1 - o.crumple * .7); u.flat.rotation.z = o.crumple * .6;
        if (Math.random() < .2) c.SFX.stir();
        if (o.crumple >= 1) { u.flat.visible = false; u.ball.visible = true; o.ball = true; c.poke(o.j, .5); c.SFX.ok(); S.ph = 'crumpled'; S.holding = false; if (S.crumpleIdx === 0) { const t = S.objs[0]; S.objs[0] = S.objs[1]; S.objs[1] = t; } setTimeout(() => S && c.win(), c.FAST ? 10 : 400); }
      }
      S.objs.forEach((o, i) => {
        if (o.fall) {
          const f = o.fall; f.t += dt;
          const flat = o.kind === 'paper' && !o.ball;
          if (flat) { f.y -= .55 * dt; o.g.position.x = XS[i] + Math.sin(f.t * 2.4) * .6; o.g.rotation.z = Math.sin(f.t * 2.4 + 1) * .5; }
          else { f.v += G * dt; f.y -= f.v * dt; }
          if (f.y <= o.r + .1) { f.y = o.r + .1; o.fall = null; o.down = true; o.g.rotation.z = 0; c.poke(o.j, .4); landed(c, i); }
          o.g.position.y = f.y;
        }
      });
      S.clamps.forEach((k, i) => { const open = S.objs[i] && (S.objs[i].fall || S.objs[i].down) ? .12 : 0; k.jaws[0].position.x = -.16 - open; k.jaws[1].position.x = .16 + open; });
    },
    glow(c) {
      if (S.ph === 'drop') return [{ pos: S.lever.position.clone().setY(TOP + 1.25), size: .9, strong: c.strong }].concat(S.clamps.map((k, i) => S.objs[i] && !S.objs[i].fall && !S.objs[i].down ? { pos: k.g.position.clone(), size: 1, color: c.A.C.amber, op: .2 } : null).filter(Boolean));
      if (S.ph === 'crumple') return [{ pos: S.objs[1].g.position.clone(), size: 1.6, strong: c.strong }];
      return [];
    },
    caps(c) {
      if (S.ph === 'drop') return [{ pos: S.clamps[0].g.position.clone().setY(TOP + .7), text: 'A', cur: true }, { pos: S.clamps[1].g.position.clone().setY(TOP + .7), text: 'L', cur: true }, { pos: S.lever.position.clone().setY(TOP + 1.6), text: '␣' }];
      if (S.ph === 'crumple') return [{ pos: S.objs[1].g.position.clone().setY(TOP + .7), text: 'C', cur: true }];
      return [];
    },
    demo(c) {
      if (S.ph === 'crumple') return { kind: 'hold', pts: [S.objs[1].g.position.clone()], dur: 2 };
      if (S.ph === 'drop') return { kind: 'tap', pts: [S.lever.position.clone().setY(TOP + 1.2)] };
      return null;
    },
    assist(c) { if (S.ph === 'drop') releaseBoth(c); if (S.ph === 'crumple') { S.objs[1].crumple = .99; S.holding = true; } },
    probe(c) {
      const sc = v => { const q = c.screen(v); return [Math.round(q.x), Math.round(q.y)]; };
      return { ph: S.ph, trials: S.trials, clamps: S.clamps.map(k => sc(k.g.position)), lever: sc(S.lever.position.clone().setY(TOP + 1.2)), objs: S.objs.map(o => ({ kind: o.kind, ball: !!o.ball, y: +o.g.position.y.toFixed(2), down: !!o.down, falling: !!o.fall, scr: sc(o.g.position) })), landed: S.landed.slice() };
    },
    exit() { if (S && S.strip) S.strip.remove(); S = null; },
  };

  function clampAt(c, p) { let b = -1, bd = 85; S.clamps.forEach((k, i) => { const q = c.screen(k.g.position.clone().setY(TOP - .3)); const d = Math.hypot(q.x - p.x, q.y - p.y); if (d < bd) { bd = d; b = i; } }); return b; }
  function hang(c, anim) {
    S.objs.forEach((o, i) => {
      o.fall = null; o.down = false;
      const to = new T.Vector3(XS[i], TOP - .35 - (o.kind === 'paper' ? .05 : o.r), 0);
      if (anim) { const from = o.g.position.clone(); c.tween(.45, k => { o.g.position.lerpVectors(from, to, c.ease(k)); o.g.position.y += Math.sin(k * Math.PI) * .6; }); }
      else o.g.position.copy(to);
      o.g.rotation.z = 0;
    });
    S.rel = [null, null]; S.landed = [];
  }
  function release(c, i) {
    const o = S.objs[i]; if (!o || o.fall || o.down || S.ph !== 'drop') return;
    c.act();
    const now = performance.now();
    S.rel[i] = now;
    o.fall = { t: 0, v: 0, y: o.g.position.y };
    c.poke(o.j, .2); c.SFX.tap();
    const other = S.rel[1 - i];
    if (other == null) setTimeout(() => { if (!S || S.rel[1 - i] != null) return; S.lonely = true; c.say('e8.one'); }, WIN * 1000 + 20);
  }
  function releaseBoth(c) { release(c, 0); release(c, 1); }
  function landed(c, i) {
    S.landed.push({ i, t: performance.now() });
    if (S.landed.length === 1) c.SFX.note(i ? 7 : 4);
    if (S.landed.length < 2) return;
    const [a, b] = S.landed, gap = Math.abs(b.t - a.t);
    if (gap < 90) c.SFX.chord2(392, 523.3); else c.SFX.note(b.i ? 7 : 4);
    const fair = S.rel[0] != null && S.rel[1] != null && Math.abs(S.rel[0] - S.rel[1]) < WIN * 1000;
    if (!fair) { S.lonely = false; setTimeout(() => { if (!S) return; hang(c, true); }, c.FAST ? 30 : 700); return; }
    if (!S.paper) {
      const cell = S.strip.children[S.trials]; if (cell) { cell.innerHTML = S.A.icon('together'); cell.classList.add('on'); }
      S.trials++;
    }
    S.ph = 'landed';
    setTimeout(() => S && c.win(), c.FAST ? 10 : 600);
  }
})();
