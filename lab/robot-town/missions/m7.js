// 第 7 關 爬樓梯（四腳機器狗）——手勢：節奏踩（左右交替）。
// 側面看。按 A（左腳）、L（右腳），或點畫面下方的兩隻腳；每踩一下走半階。節拍器是踏面前緣一盞一盞亮的燈。
// 踩錯順序（連按同一邊）或太快：趴一下再站起來，不會掉下去。壞掉的那一階：同一隻腳「快快按兩下」＝跳過去。
// 三小關：3 階 → 5 階（節拍變快）→ 6 階、中間一階壞了要跳。
// 三條路：鍵盤 A／L（或 ← →）；點兩隻腳；點樓梯上的某一階＝它自己照節拍走到那裡（壞的那階也會自己跳）。
(window.MISSIONS = window.MISSIONS || [])[7] = (() => {
  'use strict';
  const T = THREE;
  const X0 = -3.6, SX = -3, SH = .45, SW = 1;
  const LV = [{ n: 3, beat: .7, gap: -1 }, { n: 5, beat: .5, gap: -1 }, { n: 6, beat: .6, gap: 3 }];
  let S = null;

  function dog(A) {
    const g = new T.Group(), j = new T.Group(), body = new T.Group(); g.add(j); j.add(body);
    body.add(A.mesh(A.rbox(1.15, .38, .5, .16, .06), A.M.cream, 0, .78, 0));
    body.add(A.mesh(A.rbox(.4, .3, .36, .1, .04), A.M.cream, .66, .9, 0));
    body.add(A.mesh(new T.CylinderGeometry(.07, .07, .06, 12).rotateZ(Math.PI / 2), A.M.light, .87, .92, 0));
    body.add(A.mesh(A.rbox(.5, .1, .4, .06, .02), A.M.sky, -.05, 1.0, 0));
    const legs = [];
    [[.42, 1], [.42, -1], [-.42, 1], [-.42, -1]].forEach(([x, sz], i) => {
      const hip = new T.Group(); hip.position.set(x, .66, sz * .22); body.add(hip);
      hip.add(A.mesh(new T.SphereGeometry(.09, 10, 8), A.M.cream2));
      hip.add(A.mesh(new T.CapsuleGeometry(.065, .18, 3, 8), A.M.amber, 0, -.15, 0));
      const knee = new T.Group(); knee.position.y = -.3; hip.add(knee);
      knee.add(A.mesh(new T.CapsuleGeometry(.055, .16, 3, 8), A.M.amber, 0, -.12, 0));
      knee.add(A.mesh(new T.SphereGeometry(.08, 10, 6).scale(1.3, .6, 1), A.M.ink, .02, -.24, 0));
      legs.push({ hip, knee, side: sz > 0 ? 'L' : 'R', front: x > 0 });
    });
    S3.jelly(j, 150, 7);
    g.userData = { j, body, legs };
    return g;
  }
  const treadY = x => {
    const L = S.lv;
    if (x < SX) return 0;
    const k = Math.floor((x - SX) / SW);
    if (k >= L.n) return L.n * SH;
    if (k === L.gap) return null;
    return (k + 1) * SH;
  };
  const posX = p => X0 + p * .5;
  const topP = () => Math.ceil((S.lv.n + .6) / .5);

  return {
    say: { intro: 'm7.intro', subs: ['m7.s1', 'm7.s2', 'm7.s3'], ok: 'm7.ok', aha: 'm7.aha' },
    build(c) {
      const A = c.A, root = c.root;
      root.add(A.mesh(A.rbox(11.6, .16, 3, .4, .05), A.M.paper, .2, .08, 0));
      const stairs = new T.Group(); root.add(stairs);
      const d = dog(A); root.add(d);
      const flag = new T.Group(), fj = new T.Group(); flag.add(fj);
      fj.add(A.mesh(new T.CylinderGeometry(.04, .05, 1.5, 8), A.M.wood, 0, .75, 0));
      const s = new T.Shape(); s.moveTo(0, 0); s.lineTo(.6, -.2); s.lineTo(0, -.4); s.closePath();
      fj.add(A.mesh(new T.ExtrudeGeometry(s, { depth: .03, bevelEnabled: false }), A.M.coral, .03, 1.45, -.015));
      S3.jelly(fj, 120, 5); root.add(flag);
      S = { c, A, stairs, d, flag, fj, lamps: [], p: 0, y: .16, foot: 'L', last: 0, busy: false, prep: null, auto: null, t: 0, beatT: 0, beatN: 0, stumble: 0 };
      S.btnL = c.button({ icon: 'foot', key: 'A', cls: 'rt-big', label: '左腳', down: () => press(c, 'L') });
      S.btnR = c.button({ icon: 'foot', key: 'L', cls: 'rt-big', label: '右腳', down: () => press(c, 'R') });
      S.btnL.querySelector('svg').style.transform = 'scaleX(-1)';
      c.ctlH = 110;
    },
    start(c, sub) {
      const A = c.A, L = LV[sub];
      S.lv = L; S.sub = sub; S.p = 0; S.foot = 'L'; S.busy = false; S.prep = null; S.auto = null; S.last = 0; S.beatN = 0;
      S.stairs.clear(); S.lamps = [];
      S.stairs.add(A.mesh(A.rbox(2.2, .3, 2, .1, .04), A.M.wood, SX - 1.1, .15, 0));
      for (let k = 0; k < L.n; k++) {
        if (k === L.gap) {   // 壞掉的一階：只剩兩根斷掉的木條
          S.stairs.add(A.mesh(new T.BoxGeometry(.18, (k + 1) * SH - .2, .2), A.M.woodDark, SX + k * SW + .1, ((k + 1) * SH - .2) / 2, -.85));
          S.stairs.add(A.mesh(new T.BoxGeometry(.4, .08, .3), A.M.woodDark, SX + k * SW + .5, (k + 1) * SH - .5, .7));
          continue;
        }
        const h = (k + 1) * SH;
        S.stairs.add(A.mesh(A.rbox(SW + .02, h, 2, .06, .03), k % 2 ? A.M.wood : A.std(0xE2BE88, { roughness: .9 }), SX + k * SW + SW / 2, h / 2 + .16, 0));
        [.25, .75].forEach(f => { const m = A.mesh(new T.CylinderGeometry(.09, .09, .04, 14), A.std(0xFFF1C2, { emissive: new T.Color(A.C.amber), emissiveIntensity: 0, roughness: .6 }), SX + k * SW + f * SW, h + .18, .75); S.stairs.add(m); S.lamps.push({ m, x: SX + k * SW + f * SW }); });
      }
      const top = L.n * SH;
      S.stairs.add(A.mesh(A.rbox(2, top, 2, .06, .03), A.M.wood, SX + L.n * SW + 1, top / 2 + .16, 0));
      S.stairs.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
      S.flag.position.set(SX + L.n * SW + 1.3, top + .16, -.5);
      S.y = .16 + .3;
      S.d.position.set(posX(0), S.y, 0);
      const xr = SX + L.n * SW + 2.2;
      c.view([new T.Vector3(X0 - 1.6, 0, 1.1), new T.Vector3(xr, 0, 1.1), new T.Vector3(X0 - 1.6, top + 2.3, 0), new T.Vector3(xr, top + 2.3, 0), new T.Vector3(X0 - 1.6, 0, -1), new T.Vector3(xr, 0, -1)], { elev: 14, elevPt: 18 });
    },
    // ---------- 輸入 ----------
    key(c, k, down, rep) {
      if (!down || rep) return;
      if (k === 'a' || k === 'left') press(c, 'L');
      else if (k === 'l' || k === 'right' || k === 'd') press(c, 'R');
    },
    up(c, p) {
      // 點樓梯：自己照節拍走到那一階（壞的那階自己跳）
      const g = c.planeZ(p, 0);
      if (!g) return;
      const tx = Math.max(posX(S.p + 1), Math.min(posX(topP()), g.x));
      if (g.x > posX(S.p) + .2) { S.auto = { x: tx }; c.SFX.tap(); }
    },
    frame(c, dt, t) {
      if (!S || !S.lv) return;
      S.t += dt;
      const L = S.lv;
      // 節拍：下一步的燈一亮一亮；有一個很輕的木魚
      S.beatT += dt;
      if (S.beatT >= L.beat) { S.beatT -= L.beat; S.beatN++; c.SFX.beat(S.beatN % 2); }
      const k = 1 - S.beatT / L.beat, nx = posX(S.p + 1) + .25;
      S.lamps.forEach(l => { const near = Math.abs(l.x - nx) < .3; l.m.material.emissiveIntensity = S3.lerp(l.m.material.emissiveIntensity, near ? .3 + 1.2 * k * k : 0, .3); });
      // 自己走：照節拍一步一步（遇到壞的那階就連按兩下）
      if (S.auto && !S.busy && S.t - S.last > L.beat * .9) {
        if (posX(S.p) >= S.auto.x - .1) S.auto = null;
        else { const nxt = posX(S.p + 1); if (treadY(nxt) == null) { press(c, S.foot, true); setTimeout(() => { if (S) press(c, S.prep ? S.prep.foot : S.foot, true); }, 150); } else press(c, S.foot, true); }
      }
      if (S.prep && S.t - S.prep.t > .5) { S.prep = null; gapFail(c); }
      // 狗：跟著位置走，身體壓扁回彈；腿擺
      const u = S.d.userData;
      S.d.position.x = S3.lerp(S.d.position.x, posX(S.p), .2);
      const ty = (treadY(posX(S.p)) ?? 0) + .16 + (S.p === 0 ? .3 : 0);
      S.y = S3.lerp(S.y, ty + (S.p === 0 ? 0 : 0), .2);
      S.d.position.y = S.y + (S.hop || 0);
      u.body.rotation.z = S3.lerp(u.body.rotation.z, (S.stumble > 0 ? -.35 * Math.sin(S.stumble * Math.PI) : 0) + (S.prep ? .12 : 0), .25);
      u.body.position.y = S3.lerp(u.body.position.y, S.stumble > 0 ? -.25 * Math.sin(S.stumble * Math.PI) : S.prep ? -.12 : 0, .25);
      if (S.stumble > 0) S.stumble = Math.max(0, S.stumble - dt * 1.4);
      u.legs.forEach(l => { l.hip.rotation.z = S3.lerp(l.hip.rotation.z, l.swing || 0, .3); l.knee.rotation.z = S3.lerp(l.knee.rotation.z, -(l.swing || 0) * 1.2, .3); l.swing = S3.lerp(l.swing || 0, 0, .08); });
      S3.wobble(u.j, dt); S3.wobble(S.fj, dt);
      S.btnL.classList.toggle('glow', S.foot === 'L' && !S.prep);
      S.btnR.classList.toggle('glow', S.foot === 'R' && !S.prep);
    },
    glow(c) {
      if (!S || !S.lv) return [];
      const nx = posX(S.p + 1);
      return [{ pos: new T.Vector3(nx + .25, (treadY(nx) ?? treadY(posX(S.p))) + .3, .4), size: 1.1, color: c.A.C.amber, strong: c.strong }];
    },
    caps(c) {
      if (!S || !S.lv) return [];
      return [{ pos: new T.Vector3(posX(S.p), S.y + 1.5, 0), text: S.foot === 'L' ? 'A' : 'L', cur: true }];
    },
    demo(c) {
      const nx = posX(S.p + 2);
      return { kind: 'tap', pts: [new T.Vector3(nx + .2, (treadY(nx) ?? 0) + .3, 0)] };
    },
    assist(c) { S.auto = { x: posX(Math.min(topP(), S.p + 4)) }; },
    probe(c) {
      const nx = posX(S.p + 1);
      return { p: S.p, top: topP(), foot: S.foot, gapNext: treadY(nx) == null, beat: S.lv.beat, busy: S.busy, prep: !!S.prep, btnL: rect(S.btnL), btnR: rect(S.btnR), stair: (() => { const q = c.screen(new T.Vector3(posX(topP()), S.lv.n * SH + .2, 0)); return [Math.round(q.x), Math.round(q.y)]; })() };
    },
    exit() { S = null; },
  };

  function rect(b) { const r = b.getBoundingClientRect(); return [Math.round(r.x + r.width / 2), Math.round(r.y + r.height / 2)]; }
  // 按一隻腳
  function press(c, foot, auto) {
    if (!S || !S.lv || S.busy) return;
    c.act();
    const L = S.lv, nx = posX(S.p + 1);
    (foot === 'L' ? S.btnL : S.btnR).classList.add('pk');
    setTimeout(() => { if (S) (foot === 'L' ? S.btnL : S.btnR).classList.remove('pk'); }, 300);
    // 壞掉的那一階：同一隻腳快快按兩下＝跳
    if (treadY(nx) == null) {
      if (S.prep && S.prep.foot === foot) { S.prep = null; jump(c); return; }
      if (S.prep) { S.prep = null; gapFail(c); return; }
      S.prep = { foot, t: S.t }; c.SFX.step(1); swing(foot, .5);
      return;
    }
    if (!auto && S.last && S.t - S.last < L.beat * .32) { stumble(c, 'm7.fast'); return; }
    if (foot !== S.foot) { stumble(c, 'm7.same'); return; }
    S.p++; S.last = S.t; S.foot = foot === 'L' ? 'R' : 'L';
    swing(foot, .6);
    c.SFX.step(S.p); S3.poke(S.d.userData.j, .12);
    if (S.p >= topP()) finish(c);
  }
  function swing(foot, a) { S.d.userData.legs.forEach(l => { if (l.side === foot) l.swing = (l.front ? a : -a); }); }
  function stumble(c, key) {
    S.busy = true; S.stumble = 1; S3.poke(S.d.userData.j, .45);
    c.fail(key);
    setTimeout(() => { if (S) { S.busy = false; S.last = 0; } }, c.FAST ? 30 : 650);
  }
  function gapFail(c) { S.busy = true; S.stumble = 1; S3.poke(S.d.userData.j, .4); c.fail('m7.gap'); setTimeout(() => { if (S) S.busy = false; }, c.FAST ? 30 : 650); }
  function jump(c) {
    S.busy = true;
    const p0 = S.p, p1 = S.p + 3;
    c.SFX.near(); S3.poke(S.d.userData.j, .4);
    c.tween(c.FAST ? .05 : .55, k => { S.hop = Math.sin(k * Math.PI) * 1.0; S.p = k < .5 ? p0 : p1; }).then(() => {
      if (!S) return;
      S.hop = 0; S.p = p1; S.busy = false; S.last = S.t; S.foot = 'L';
      S3.poke(S.d.userData.j, .45); c.SFX.land();
      if (S.p >= topP()) finish(c);
    });
  }
  function finish(c) {
    S.busy = true; S.auto = null;
    S3.poke(S.fj, .5); c.SFX.ok();
    setTimeout(() => { if (S) c.win(); }, c.FAST ? 20 : 600);
  }
})();
