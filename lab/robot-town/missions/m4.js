// 第 4 關 火星探路（火星車：六個輪子、離地球很遠）——手勢：畫路。
// 先用手指在沙地上畫一條路（珊瑚紅虛線），放開後按播放，火星車才沿線慢慢走（六輪各自轉）。
// 撞到石頭：卡住、後退一點、停下來，從那裡再畫一段（路留著的部分不用重畫）。到旗子：相機桿轉一圈拍照（畫面閃一下白）。
// 三小關：繞 1 顆大石 → 繞 3 顆、路要長 → 先經過三個樣本小石頭（撿起來）再到旗子。
// 三條路：手指畫線；點地上＝直線接到那裡（一點一點點出路）；鍵盤方向鍵＝路往那邊長一格、Backspace 擦掉一格、Enter 播放。
(window.MISSIONS = window.MISSIONS || [])[4] = (() => {
  'use strict';
  const T = THREE;
  const START = [-4.2, 2.6], FLAG = [4.0, -2.4], RR = .45;
  const LV = [
    { rocks: [[0, 0, 1.25]], samples: [], good: [[-1, 2.7], [2, 1.9], [3.4, -.6], FLAG] },
    { rocks: [[-1.8, .4, 1.0], [1.0, -1.3, 1.0], [1.8, 1.4, .9]], samples: [], good: [[-4.2, -1.6], [-1, -3.1], [2.6, -3.2], FLAG] },
    { rocks: [[-.6, -1.6, 1.0], [1.6, 1.0, .9]], samples: [[-3.0, -1.6], [.2, 2.8], [3.5, -.3]], good: [[-3.0, -1.6], [-1.4, .6], [.2, 2.8], [2.9, 2.8], [3.6, -.3], FLAG] },
  ];
  let S = null;
  const _m = new T.Matrix4(), _q = new T.Quaternion(), _p = new T.Vector3(), _s = new T.Vector3(1, 1, 1), _up = new T.Vector3(0, 1, 0);

  function rover(A) {
    const g = new T.Group(), j = new T.Group(); g.add(j);
    j.add(A.mesh(A.rbox(1.1, .32, .8, .12, .04), A.M.cream, 0, .5, 0));
    j.add(A.mesh(A.rbox(.7, .1, .6, .08, .02), A.M.sky, -.05, .7, 0));
    const wheels = [];
    [-.42, 0, .42].forEach(x => [-1, 1].forEach(sz => {
      const w = A.mesh(new T.CylinderGeometry(.18, .18, .14, 14).rotateX(Math.PI / 2), A.M.ink, x, .18, sz * .5);
      j.add(w); wheels.push(w);
      j.add(A.mesh(new T.BoxGeometry(.06, .3, .06), A.M.cream2, x, .34, sz * .42));
    }));
    const mast = A.gear(4); mast.scale.setScalar(.9); mast.position.set(.32, .66, 0); j.add(mast);
    S3.jelly(j, 150, 7);
    g.userData = { j, wheels, mast };
    return g;
  }
  function flag(A) {
    const g = new T.Group(), j = new T.Group(); g.add(j);
    j.add(A.mesh(new T.CylinderGeometry(.05, .06, 1.8, 8), A.M.wood, 0, .9, 0));
    const s = new T.Shape(); s.moveTo(0, 0); s.lineTo(.75, -.24); s.lineTo(0, -.5); s.closePath();
    j.add(A.mesh(new T.ExtrudeGeometry(s, { depth: .04, bevelEnabled: false }), A.M.coral, .04, 1.75, -.02));
    j.add(A.mesh(new T.SphereGeometry(.08, 10, 8), A.M.woodDark, 0, 1.82, 0));
    S3.jelly(j, 120, 5); g.userData.j = j;
    return g;
  }

  return {
    say: { intro: 'm4.intro', subs: ['m4.s1', 'm4.s2', 'm4.s3'], ok: 'm4.ok', aha: 'm4.aha' },
    build(c) {
      const A = c.A, root = c.root;
      S = { c, A, rocks: [], samples: [], path: [], kbd: [], playing: false, rv: null, flagG: flag(A), dash: null, t: 0, down: null, saidShort: 0 };
      root.add(A.slab(11.8, 8.8, A.clay(0xE6A47A), .12));
      // 遠處的小沙丘
      [[-5, -3.6, .9], [5.2, 3.3, .8], [-5.2, 3.6, .6], [1.2, -3.9, .5]].forEach(([x, z, r]) => root.add(A.mesh(new T.SphereGeometry(r, 16, 10).scale(1.4, .3, 1), A.clay(0xD98A5A), x, .12, z)));
      S.flagG.position.set(FLAG[0], .12, FLAG[1]); root.add(S.flagG);
      S.rv = rover(A); root.add(S.rv);
      S.dash = new T.InstancedMesh(new T.BoxGeometry(.22, .03, .09), new T.MeshBasicMaterial({ color: A.C.coral }), 500);
      S.dash.count = 0; S.dash.frustumCulled = false; root.add(S.dash);
      S.cur = A.mesh(new T.CylinderGeometry(.16, .16, .04, 16), new T.MeshBasicMaterial({ color: A.C.coral, transparent: true, opacity: .8 }), 0, .15, 0); root.add(S.cur);
      S.erase = c.button({ icon: 'erase', key: '⌫', label: '擦掉', down: () => clearPath(c, true) });
      S.play = c.button({ icon: 'play', key: '⏎', cls: 'coral rt-big', label: '出發', down: () => play(c) });
      c.ctlH = 110;
      c.view([new T.Vector3(-6, 0, -4.5), new T.Vector3(6, 0, -4.5), new T.Vector3(-6, 0, 4.5), new T.Vector3(6, 0, 4.5), new T.Vector3(FLAG[0], 2, FLAG[1])], { elev: 58, elevPt: 76 });
    },
    start(c, sub) {
      const A = c.A, L = LV[sub];
      S.sub = sub; S.playing = false; S.got = 0;
      S.rocks.forEach(r => c.root.remove(r.g)); S.samples.forEach(s => s.g.parent && s.g.parent.remove(s.g));
      S.rocks = L.rocks.map(([x, z, r]) => {
        const g = new T.Group(), j = new T.Group(); g.add(j);
        j.add(A.mesh(new T.SphereGeometry(r, 20, 14).scale(1, .62, .9), A.clay(0xB7653F), 0, r * .4, 0));
        j.add(A.mesh(new T.SphereGeometry(r * .45, 14, 10).scale(1, .6, 1), A.clay(0xC97A50), r * .5, r * .3, r * .35));
        g.position.set(x, .12, z); c.root.add(g); S3.jelly(j, 160, 8);
        g.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
        return { g, j, x, z, r };
      });
      S.samples = L.samples.map(([x, z], i) => {
        const g = new T.Group(); g.add(A.mesh(new T.DodecahedronGeometry(.22, 0), A.M[['amber', 'sky', 'green'][i]], 0, .22, 0));
        g.position.set(x, .12, z); c.root.add(g); S3.jelly(g, 160, 7);
        const ring = A.floorRing(.32, .44, A.C.amber, .7); ring.position.y = .02; g.add(ring);
        return { g, x, z, got: false };
      });
      S.pos = { x: START[0], z: START[1], h: Math.atan2(FLAG[0] - START[0], FLAG[1] - START[1]) };
      clearPath(c);
      S.rv.position.set(S.pos.x, .12, S.pos.z);
    },
    // ---------- 輸入 ----------
    down(c, p) { if (S.playing) return; S.down = { x: p.x, y: p.y, moved: false }; },
    move(c, p) {
      const d = S.down; if (!d || S.playing) return;
      if (!d.moved && Math.hypot(p.x - d.x, p.y - d.y) < 8) return;
      if (!d.moved) {
        d.moved = true;
        // 從遠處開始畫：先直線接過去（路一定從火星車／路的尾巴開始）
        const g = c.ground({ x: d.x, y: d.y }, .12); if (g) addTo(c, g.x, g.z, true);
      }
      const g = c.ground(p, .12); if (g) addTo(c, g.x, g.z, false);
    },
    up(c, p) {
      const d = S.down; S.down = null;
      if (!d || S.playing) return;
      if (!d.moved) {
        // 點火星車＝擦掉；點地上＝直線接過去
        const q = c.screen(new T.Vector3(S.pos.x, .4, S.pos.z));
        if (Math.hypot(q.x - p.x, q.y - p.y) < 34 && S.path.length > 1) { clearPath(c, true); return; }
        const g = c.ground(p, .12); if (g) { addTo(c, g.x, g.z, true); c.SFX.tap(); }
      } else c.SFX.tap();
    },
    key(c, k, down, rep) {
      if (!down || S.playing) return;
      const dir = { up: [0, -1], w: [0, -1], down: [0, 1], s: [0, 1], left: [-1, 0], a: [-1, 0], right: [1, 0], d: [1, 0] }[k];
      if (dir) { const e = S.path[S.path.length - 1]; S.kbd.push(S.path.length); addTo(c, e.x + dir[0] * .7, e.z + dir[1] * .7, true); c.SFX.step(S.path.length); return; }
      if (k === 'back') { if (S.kbd.length) { S.path.length = Math.max(1, S.kbd.pop()); drawPath(c); c.SFX.tap(); } else clearPath(c, true); return; }
      if (k === 'enter' || k === 'space') play(c);
    },
    frame(c, dt, t) {
      if (!S || !S.pos) return;
      S.t += dt;
      const rv = S.rv, u = rv.userData;
      if (S.playing) step(c, dt);
      rv.position.set(S.pos.x, .12, S.pos.z);
      rv.rotation.y = S3.lerp(rv.rotation.y, rv.rotation.y + DRIVE.wrapA(S.pos.h - rv.rotation.y), .2);
      S3.wobble(u.j, dt); S3.wobble(S.flagG.userData.j, dt);
      S.rocks.forEach(r => S3.wobble(r.j, dt));
      S.samples.forEach((s, i) => { if (!s.got) { s.g.rotation.y += dt; s.g.position.y = .12 + Math.sin(t * 2 + i) * .04; } S3.wobble(s.g, dt); });
      u.mast.userData.cam.rotation.y = S.spin != null ? S.spin : Math.sin(t * .7) * .6;
      const e = S.path[S.path.length - 1];
      S.cur.visible = !S.playing; if (e) S.cur.position.set(e.x, .15, e.z);
      S.cur.scale.setScalar(1 + .15 * Math.sin(t * 4));
      S.play.classList.toggle('dim', S.playing || S.path.length < 2);
      S.play.classList.toggle('glow', !S.playing && S.path.length > 3);
      S.erase.classList.toggle('dim', S.playing || S.path.length < 2);
    },
    glow(c) {
      if (!S || !S.pos) return [];
      const out = [{ pos: new T.Vector3(FLAG[0], .5, FLAG[1]), size: 2.2, strong: c.strong }];
      S.samples.forEach(s => { if (!s.got) out.push({ pos: new T.Vector3(s.x, .4, s.z), size: 1.3, color: c.A.C.amber }); });
      if (S.path.length < 2 && !S.playing) out.push({ pos: new T.Vector3(S.pos.x, .5, S.pos.z), size: 1.6, color: c.A.C.sky });
      return out;
    },
    demo(c) {
      const pts = [new T.Vector3(S.pos.x, .2, S.pos.z)].concat(goodFrom(c).map(([x, z]) => new T.Vector3(x, .2, z)));
      return { kind: 'draw', pts, dur: 3.2 };
    },
    assist(c) {
      const sub = S.sub;
      setTimeout(() => {
        if (!S || S.playing || S.sub !== sub || c.sub !== sub) return;
        clearPath(c);
        goodFrom(c).forEach(([x, z]) => addTo(c, x, z, true));
        setTimeout(() => { if (S && S.sub === sub) play(c); }, 700);
      }, 3600);
    },
    probe(c) {
      const sc = v => { const q = c.screen(v); return [Math.round(q.x), Math.round(q.y)]; };
      return { playing: S.playing, pos: { x: S.pos.x, z: S.pos.z }, rover: sc(new T.Vector3(S.pos.x, .3, S.pos.z)), path: S.path.length, good: goodFrom(c).map(([x, z]) => sc(new T.Vector3(x, .12, z))), goodW: goodFrom(c), samples: S.samples.filter(s => !s.got).length };
    },
    exit() { S = null; },
  };

  // 從火星車現在的位置開始、照「好走的路」剩下的部分（給示範、自動示範、測試用）
  function goodFrom(c) {
    const g = LV[S.sub].good;
    const clear = (ax, az, bx, bz) => S.rocks.every(r => {
      const vx = bx - ax, vz = bz - az, l2 = vx * vx + vz * vz || 1, t = Math.max(0, Math.min(1, ((r.x - ax) * vx + (r.z - az) * vz) / l2));
      return Math.hypot(ax + vx * t - r.x, az + vz * t - r.z) > r.r + RR + .12;
    });
    // 不能跳過還沒撿的樣本：最遠只能直接接到第一個還沒撿的樣本
    let hi = g.length - 1;
    const k = g.findIndex(([x, z]) => S.samples.some(s => !s.got && Math.hypot(s.x - x, s.z - z) < .1));
    if (k >= 0) hi = k;
    for (let i = hi; i >= 0; i--) if (clear(S.pos.x, S.pos.z, g[i][0], g[i][1])) return g.slice(i);
    return g.slice(0);
  }
  function clamp2(x, z) { return [Math.max(-5.6, Math.min(5.6, x)), Math.max(-4.1, Math.min(4.1, z))]; }
  function addTo(c, x, z, straight) {
    [x, z] = clamp2(x, z);
    if (!S.path.length) S.path.push({ x: S.pos.x, z: S.pos.z });
    const e = S.path[S.path.length - 1], d = Math.hypot(x - e.x, z - e.z);
    if (d < .18) return;
    if (S.path.length > 450) return;
    if (straight) { const n = Math.ceil(d / .3); for (let k = 1; k <= n; k++) S.path.push({ x: e.x + (x - e.x) * k / n, z: e.z + (z - e.z) * k / n }); }
    else S.path.push({ x, z });
    drawPath(c);
  }
  function clearPath(c, snd) { S.path = [{ x: S.pos.x, z: S.pos.z }]; S.kbd = []; drawPath(c); if (snd) c.SFX.tap(); }
  function drawPath(c) {
    let n = 0, carry = 0;
    for (let i = 1; i < S.path.length && n < 500; i++) {
      const a = S.path[i - 1], b = S.path[i], len = Math.hypot(b.x - a.x, b.z - a.z);
      if (len < 1e-4) continue;
      const ang = Math.atan2(-(b.z - a.z), b.x - a.x);
      let d = carry;
      while (d < len && n < 500) {
        const k = d / len; _p.set(a.x + (b.x - a.x) * k, .14, a.z + (b.z - a.z) * k); _q.setFromAxisAngle(_up, ang);
        _m.compose(_p, _q, _s); S.dash.setMatrixAt(n++, _m); d += .36;
      }
      carry = d - len;
    }
    S.dash.count = n; S.dash.instanceMatrix.needsUpdate = true;
  }
  function play(c) {
    if (S.playing || S.path.length < 2) return;
    S.playing = true; S.idx = 1; c.SFX.ok(); S3.poke(S.rv.userData.j, .3);
  }
  // 沿著線走；撞到石頭就退一點停下；撿樣本；到旗子拍照
  function step(c, dt) {
    const tgt = S.path[S.idx];
    if (!tgt) { stopAt(c, 'end'); return; }
    const dx = tgt.x - S.pos.x, dz = tgt.z - S.pos.z, d = Math.hypot(dx, dz), sp = 1.7 * dt;
    if (d < sp) { S.pos.x = tgt.x; S.pos.z = tgt.z; S.idx++; }
    else { S.pos.x += dx / d * sp; S.pos.z += dz / d * sp; }
    if (d > .02) S.pos.h = Math.atan2(dx, dz);
    S.rv.userData.wheels.forEach(w => { w.rotation.z -= sp / .18; });
    if (Math.floor(S.t * 3) !== Math.floor((S.t - dt) * 3)) c.SFX.step(S.idx);
    for (const r of S.rocks) {
      const ex = S.pos.x - r.x, ez = S.pos.z - r.z, ed = Math.hypot(ex, ez);
      if (ed < r.r + RR) {
        S.playing = false; S3.poke(r.j, .3); S3.poke(S.rv.userData.j, .45); c.SFX.bump();
        const bx = ex / ed, bz = ez / ed;
        c.tween(.4, k => { S.pos.x = r.x + bx * (r.r + RR + .35 * k); S.pos.z = r.z + bz * (r.r + RR + .35 * k); }).then(() => { if (S) clearPath(c); });
        c.fail('m4.bump');
        return;
      }
    }
    S.samples.forEach(s => {
      if (s.got || Math.hypot(s.x - S.pos.x, s.z - S.pos.z) > .7) return;
      s.got = true; c.SFX.pick(); S3.poke(S.rv.userData.j, .2);
      const from = s.g.position.clone();
      c.tween(.4, k => { s.g.position.lerpVectors(from, new T.Vector3(S.pos.x, .9, S.pos.z), k); s.g.scale.setScalar(1 - k * .7); }).then(() => { s.g.visible = false; });
    });
    if (Math.hypot(FLAG[0] - S.pos.x, FLAG[1] - S.pos.z) < .9) {
      if (S.samples.some(s => !s.got)) { if (!S.flagSaid) { S.flagSaid = true; c.say('m4.sample'); } }
      else { stopAt(c, 'flag'); return; }
    } else S.flagSaid = false;
  }
  function stopAt(c, why) {
    S.playing = false;
    if (why === 'flag') {
      S3.poke(S.flagG.userData.j, .4);
      c.tween(c.FAST ? .05 : .9, k => { S.spin = k * Math.PI * 2; }).then(() => {
        S.spin = null;
        flash(); c.SFX.flash();
        setTimeout(() => { if (S) c.win(); }, c.FAST ? 20 : 500);
      });
      return;
    }
    clearPath(c);
    c.fail(S.samples.some(s => !s.got) && Math.hypot(FLAG[0] - S.pos.x, FLAG[1] - S.pos.z) < 1.2 ? 'm4.sample' : 'm4.short');
  }
  function flash() {
    const f = document.createElement('div'); f.className = 'rt-flash'; document.getElementById('rt').appendChild(f);
    setTimeout(() => f.remove(), 700);
  }
})();
