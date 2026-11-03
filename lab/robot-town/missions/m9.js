// 第 9 關 修小東西（精密機器手：人的手會抖，它不會）——手勢：穩穩描。
// 放大的音樂盒內部。用鑷子夾住小零件，沿著木頭凹槽拖到洞裡。鑷子的位置會「濾掉抖動」（指數平均 lerp .12）。
// 偏出凹槽太遠：零件掉下來、滾回起點、低木魚。右上角一個小「抖動表」：手越穩，指針越靠中間（不是分數，只是看）。
// 三小關：直線 → 彎線 → 很細的彎線、要放兩個小零件（兩條凹槽）。
// 三條路：手指按住零件拖；鍵盤按住 → 沿著凹槽慢慢前進（← 後退）；點洞口＝鑷子自己穩穩地送過去。
(window.MISSIONS = window.MISSIONS || [])[9] = (() => {
  'use strict';
  const T = THREE;
  const P = (...a) => a.map(([x, z]) => new T.Vector3(x, 0, z));
  const LV = [
    { tol: .55, paths: [P([-4, .3], [-1.3, .1], [1.3, -.1], [4, -.3])] },
    { tol: .45, paths: [P([-4.1, 1.3], [-2.2, -1.2], [0, 1.2], [2.2, -1.2], [4, .8])] },
    { tol: .34, paths: [P([-4.1, -1.5], [-2.4, .2], [-.6, -1.4], [1.4, .1], [3.8, -1.2]), P([-4.1, 1.7], [-2, .7], [0, 1.9], [2, .9], [3.9, 1.8])] },
  ];
  const NS = 220;
  let S = null;

  function part(A) {
    const g = new T.Group(), j = new T.Group(); g.add(j);
    j.add(A.mesh(new T.TorusGeometry(.16, .07, 8, 10), A.M.amber, 0, .12, 0)).rotation.x = Math.PI / 2;
    j.add(A.mesh(new T.CylinderGeometry(.06, .06, .16, 10), A.M.amber, 0, .12, 0));
    S3.jelly(j, 160, 7); g.userData.j = j;
    return g;
  }

  return {
    say: { intro: 'm9.intro', subs: ['m9.s1', 'm9.s2', 'm9.s3'], ok: 'm9.ok', aha: 'm9.aha' },
    build(c) {
      const A = c.A, root = c.root;
      // 音樂盒：木盒、裡面的滾筒（有小釘子）和梳子
      root.add(A.mesh(A.rbox(11, .5, 7.4, .5, .08), A.M.woodDark, 0, .25, 0));
      root.add(A.mesh(A.rbox(10.2, .2, 6.6, .4, .05), A.std(0xF0DDBE, { roughness: .9 }), 0, .55, 0));
      [[-5.3, 0, .3, 7.4], [5.3, 0, .3, 7.4], [0, -3.55, 10.9, .3], [0, 3.55, 10.9, .3]].forEach(([x, z, w, d]) => root.add(A.mesh(A.rbox(w, .9, d, .1, .03), A.M.wood, x, .75, z)));
      const drum = new T.Group(); drum.position.set(0, .95, -2.75); root.add(drum);
      drum.add(A.mesh(new T.CylinderGeometry(.32, .32, 6.4, 24).rotateZ(Math.PI / 2), A.M.amber));
      for (let k = 0; k < 26; k++) { const a = k * 2.4, m = A.mesh(new T.SphereGeometry(.05, 6, 4), A.M.cream2, -3 + k * .24, Math.cos(a) * .33, Math.sin(a) * .33); drum.add(m); }
      for (let k = 0; k < 14; k++) root.add(A.mesh(new T.BoxGeometry(.16, .06, .8 + (k % 3) * .1), A.M.cream, -2.8 + k * .43, .7, -2.0));
      const tw = A.gear(9); tw.scale.setScalar(3.2); root.add(tw);
      const hole = new T.Group(); root.add(hole);
      hole.add(A.mesh(new T.CylinderGeometry(.34, .34, .05, 24), A.M.ink, 0, .66, 0));
      const hr = A.floorRing(.36, .5, A.C.amber, .9); hr.position.y = .69; hole.add(hr);
      const groove = new T.Group(); root.add(groove);
      const meter = document.createElement('div'); meter.className = 'rt-meter';
      meter.innerHTML = '<svg viewBox="0 0 100 60" aria-hidden="true"><path d="M12 54 A38 38 0 0 1 88 54" fill="none" stroke="#D9C8AF" stroke-width="8" stroke-linecap="round"/><path d="M40 20 A38 38 0 0 1 60 20" fill="none" stroke="#6F9A72" stroke-width="8" stroke-linecap="round"/><line class="nd" x1="50" y1="54" x2="50" y2="22" stroke="#3B3430" stroke-width="4" stroke-linecap="round"/><circle cx="50" cy="54" r="6" fill="#3B3430"/></svg>';
      document.getElementById('rt').appendChild(meter);
      S = { c, A, tw, hole, hr, groove, meter, needle: meter.querySelector('.nd'), parts: [], pts: [], idx: 0, f: new T.Vector3(), raw: null, hold: false, auto: false, kdir: 0, jit: 0, t: 0, drop: false };
      c.view([new T.Vector3(-5.6, 0, -3.8), new T.Vector3(5.6, 0, -3.8), new T.Vector3(-5.6, 0, 3.8), new T.Vector3(5.6, 0, 3.8)], { elev: 64, elevPt: 80 });
    },
    start(c, sub) {
      S.L = LV[sub]; S.sub = sub; S.k = 0;
      S.parts.forEach(p => c.root.remove(p)); S.parts = [];
      loadPath(c);
    },
    // ---------- 輸入 ----------
    down(c, p) {
      if (S.drop || S.done) return;
      const q = c.screen(S.f.clone().setY(.75)), hq = c.screen(S.pts[S.pts.length - 1].clone().setY(.7));
      if (Math.hypot(q.x - p.x, q.y - p.y) < 64) { S.hold = true; S.auto = false; S.raw = c.ground(p, .7) || S.f.clone(); S3.poke(S.part.userData.j, .25); c.SFX.pick(); }
      else S.tapHole = Math.hypot(hq.x - p.x, hq.y - p.y) < 70;
    },
    move(c, p) { if (S.hold) { const g = c.ground(p, .7); if (g) S.raw = g; } },
    up(c, p) {
      if (S.hold) { S.hold = false; S.raw = null; return; }
      if (S.tapHole && !p.cancel) { S.auto = true; c.SFX.tap(); }
      S.tapHole = false;
    },
    key(c, k, down) {
      if (k === 'right' || k === 'd' || k === 'up' || k === 'w' || k === 'space') S.kdir = down ? 1 : (S.kdir === 1 ? 0 : S.kdir);
      else if (k === 'left' || k === 'a' || k === 'down' || k === 's') S.kdir = down ? -1 : (S.kdir === -1 ? 0 : S.kdir);
      else if (k === 'enter' && down) S.auto = true;
    },
    frame(c, dt, t) {
      if (!S || !S.L) return;
      S.t += dt;
      const pts = S.pts, n = pts.length;
      if (!S.drop && !S.done) {
        if (S.hold && S.raw) {
          // 濾掉抖動：鑷子跟著手指，但只走 12%（每 1/60 秒）
          const prev = S.f.clone();
          S.f.lerp(new T.Vector3(S.raw.x, 0, S.raw.z), 1 - Math.pow(.88, dt * 60));
          const dRaw = S.lastRaw ? Math.hypot(S.raw.x - S.lastRaw.x, S.raw.z - S.lastRaw.z) : 0, dF = Math.hypot(S.f.x - prev.x, S.f.z - prev.z);
          S.jit = S3.lerp(S.jit, Math.max(0, dRaw - dF) / Math.max(dt, 1e-3), .08);
          S.lastRaw = S.raw.clone();
          // 離凹槽多遠（只在附近找，不能一下跳到終點）
          let best = S.idx, bd = 1e9;
          for (let i = Math.max(0, S.idx - 12); i <= Math.min(n - 1, S.idx + 14); i++) { const d = Math.hypot(pts[i].x - S.f.x, pts[i].z - S.f.z); if (d < bd) { bd = d; best = i; } }
          S.idx = best;
          if (bd > S.L.tol) dropPart(c);
          else if (S.idx >= n - 3) arrive(c);
        } else if (S.kdir || S.auto) {
          // 鍵盤／自己送：沿著凹槽穩穩地走
          S.jit = S3.lerp(S.jit, 0, .1);
          const sp = (S.auto ? 1.6 : 1.4) * dt, dir = S.auto ? 1 : S.kdir;
          let rem = sp;
          while (rem > 0 && S.idx + dir >= 0 && S.idx + dir < n) { const d = pts[S.idx].distanceTo(pts[S.idx + dir]); if (d > rem && S.sub0) break; rem -= d; S.idx += dir; }
          S.f.copy(pts[S.idx]);
          if (S.idx >= n - 3) arrive(c);
          if (Math.floor(S.t * 4) !== Math.floor((S.t - dt) * 4)) c.SFX.step(S.idx);
        } else S.jit = S3.lerp(S.jit, 0, .05);
      }
      // 畫面：零件跟著鑷子尖；鑷子微微傾斜
      if (!S.drop && S.part) S.part.position.set(S.f.x, .64 + (S.hold || S.kdir || S.auto ? .12 : 0), S.f.z);
      const tp = S.part ? S.part.position : S.f;
      S.tw.position.set(tp.x + .05, tp.y + 1.75, tp.z + .05);
      S.tw.rotation.z = S3.lerp(S.tw.rotation.z, S.hold ? -.12 : 0, .2);
      S.parts.forEach(p => S3.wobble(p.userData.j, dt));
      S.hr.scale.setScalar(1 + .08 * Math.sin(S.t * 3));
      const ang = Math.max(-70, Math.min(70, S.jit * 26 * (Math.sin(S.t * 7) > 0 ? 1 : -1)));
      S.needle.setAttribute('transform', 'rotate(' + ang.toFixed(1) + ' 50 54)');
    },
    glow(c) {
      if (!S || !S.L || !S.pts.length) return [];
      const end = S.pts[S.pts.length - 1];
      const out = [{ pos: end.clone().setY(.8), size: 1.3, color: c.A.C.amber, strong: c.strong }];
      if (!S.hold && !S.auto) out.push({ pos: S.f.clone().setY(.8), size: 1.1 });
      return out;
    },
    caps(c) { return S && S.L && !S.hold ? [{ pos: S.f.clone().setY(2.6), text: '→', cur: true }] : []; },
    demo(c) {
      const pts = [];
      for (let i = S.idx; i < S.pts.length; i += 20) pts.push(S.pts[i].clone().setY(.7));
      pts.push(S.pts[S.pts.length - 1].clone().setY(.7));
      return { kind: 'drag', pts, dur: 3 };
    },
    assist(c) { if (!S.hold) S.auto = true; },
    probe(c) {
      const sc = v => { const q = c.screen(v); return [Math.round(q.x), Math.round(q.y)]; };
      return { idx: S.idx, n: S.pts.length, drop: S.drop, hold: S.hold, k: S.k, partScr: sc(S.f.clone().setY(.75)), path: S.pts.filter((_, i) => i % 10 === 0).concat([S.pts[S.pts.length - 1]]).map(p => sc(p.clone().setY(.7))), holeScr: sc(S.pts[S.pts.length - 1].clone().setY(.7)) };
    },
    exit() { if (S && S.meter) S.meter.remove(); S = null; },
  };

  function loadPath(c) {
    const A = c.A, L = S.L;
    const curve = new T.CatmullRomCurve3(L.paths[S.k], false, 'centripetal');
    S.pts = curve.getSpacedPoints(NS);
    S.groove.clear();
    const tube = new T.TubeGeometry(curve, 160, L.tol * .55, 8, false);
    const g = A.mesh(tube, A.std(0xC9A06A, { roughness: .95 }), 0, .62, 0); g.scale.y = .18; g.castShadow = false; S.groove.add(g);
    [0, 1].forEach(e => { const p = S.pts[e ? S.pts.length - 1 : 0]; S.groove.add(A.mesh(new T.CylinderGeometry(L.tol * .55, L.tol * .55, .04, 18), A.std(0xC9A06A, { roughness: .95 }), p.x, .64, p.z)); });
    const end = S.pts[S.pts.length - 1]; S.hole.position.set(end.x, 0, end.z);
    S.part = part(A); c.root.add(S.part); S.parts.push(S.part);
    S.idx = 0; S.f.copy(S.pts[0]); S.drop = false; S.done = false; S.hold = false; S.auto = false; S.raw = null; S.lastRaw = null;
  }
  // 偏出去：零件掉下來、沿著凹槽滾回起點
  function dropPart(c) {
    S.drop = true; S.hold = false; S.auto = false; S.raw = null;
    const p = S.part, from = p.position.clone(), i0 = S.idx;
    c.fail('m9.drop');
    S3.poke(p.userData.j, .4);
    c.tween(.25, k => { p.position.y = S3.lerp(from.y, .64, k); }).then(() => {
      c.SFX.land();
      return c.tween(c.FAST ? .05 : .7, k => { const i = Math.round(i0 * (1 - k)); p.position.copy(S.pts[i]).setY(.64); p.rotation.y = -k * 8; });
    }).then(() => { if (!S) return; S.idx = 0; S.f.copy(S.pts[0]); S.drop = false; S3.poke(p.userData.j, .3); });
  }
  // 到洞口：零件掉進去，音樂盒響一小段
  function arrive(c) {
    S.done = true; S.hold = false; S.auto = false; S.kdir = 0;
    const p = S.part, from = p.position.clone(), end = S.pts[S.pts.length - 1];
    c.tween(.35, k => { p.position.set(S3.lerp(from.x, end.x, k), S3.lerp(from.y, .4, k), S3.lerp(from.z, end.z, k)); }).then(() => {
      if (!S) return;
      p.visible = false; S3.poke(S.part.userData.j, .3);
      [5, 7, 8, 7, 10].forEach((n, i) => setTimeout(() => c.SFX.deep && c.A && G.snd.mallet([261.6, 293.7, 329.6, 392, 440, 523.3, 587.3, 659.3, 784, 880, 1046.5][n], 0, .1, .6), i * 140));
      if (S.k + 1 < S.L.paths.length) { S.k++; setTimeout(() => { if (S) loadPath(c); }, c.FAST ? 20 : 700); }
      else setTimeout(() => { if (S) c.win(); }, c.FAST ? 20 : 800);
    });
  }
})();
