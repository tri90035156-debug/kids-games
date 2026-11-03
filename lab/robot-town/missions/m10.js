// 第 10 關 自己選裝備闖關（沒有一台機器人什麼都會）——手勢：組裝＋選擇。
// 前面架子上擺著九個裝備：拖到機器人身上（或點一下）就裝上，每次只能帶兩樣（第三樣裝上去，最早的那樣自己跳回架子）。
// 三段路：碎石路（要大輪子或腳）→ 樓梯（要腳）→ 小河（要螺旋槳）。每段起點有一個換裝備的圓圈，選好再點前面的路出發。
// 裝錯會溫柔失敗：小輪子卡在碎石裡、輪子爬不上樓梯滑下來、沒螺旋槳就停在河邊（腿碰到水會縮起來），然後回到圓圈。
// 三條路：手指把裝備拖到機器人身上；點裝備（自己飛上去）、點前面的路（出發）；鍵盤 1～9 裝上／拿下、Enter 出發。
(window.MISSIONS = window.MISSIONS || [])[10] = (() => {
  'use strict';
  const T = THREE;
  const CP = [-5.4, -1.5, 2.3, 6.2];      // 三個換裝備圓圈＋終點
  const SEG = [{ need: [1, 7], key: 'm10.gravel' }, { need: [7], key: 'm10.stairs' }, { need: [5], key: 'm10.river' }];
  const SX0 = -1.0, SN = 4, SW = .7, SH = .4, PLY = .16 + SN * SH;     // 樓梯
  const RX0 = 3.1, RX1 = 5.3;                                           // 小河
  const RACK_Z = 3.1;
  const SLOT = n => [((n - 1) % 3 - 1) * 1.1, Math.floor((n - 1) / 3) * 1.0 - 1.0];   // 托盤上 3×3 的位置
  let S = null;

  const groundY = x => {
    if (x < SX0) return .16;
    if (x < SX0 + SN * SW) return .16 + (Math.floor((x - SX0) / SW) + 1) * SH;
    if (x > RX0 && x < RX1) return .1;
    return PLY;
  };

  return {
    say: { intro: 'm10.intro', subs: ['m10.s1', 'm10.s2', 'm10.s3'], extra: 'm10.rule', ok: 'm10.ok', aha: 'm10.aha' },
    build(c) {
      const A = c.A, root = c.root;
      root.add(A.mesh(A.rbox(13.6, .16, 7.2, .5, .05), A.M.paper, .3, .08, .4));
      // 碎石路：一堆小石頭
      const gv = new T.InstancedMesh(new T.DodecahedronGeometry(.13, 0), A.clay(0xB8AA98), 70);
      const m4 = new T.Matrix4(), rr = S3.rng(10);
      for (let i = 0; i < 70; i++) { m4.compose(new T.Vector3(-4.5 + rr() * 2.7, .2, -1 + rr() * 2), new T.Quaternion().setFromEuler(new T.Euler(rr() * 3, rr() * 3, 0)), new T.Vector3(1, .6 + rr() * .6, 1)); gv.setMatrixAt(i, m4); }
      gv.castShadow = true; gv.receiveShadow = true; root.add(gv);
      root.add(A.mesh(A.rbox(2.9, .06, 2.3, .3, .02), A.clay(0xD9CDBB), -3.15, .17, 0));
      // 樓梯＋高台
      for (let k = 0; k < SN; k++) root.add(A.mesh(A.rbox(SW + .02, (k + 1) * SH, 2.2, .05, .02), k % 2 ? A.M.wood : A.std(0xE2BE88, { roughness: .9 }), SX0 + k * SW + SW / 2, .16 + (k + 1) * SH / 2, 0));
      root.add(A.mesh(A.rbox(RX0 - (SX0 + SN * SW), PLY - .16, 2.2, .06, .02), A.M.wood, (RX0 + SX0 + SN * SW) / 2, .16 + (PLY - .16) / 2, 0));
      root.add(A.mesh(A.rbox(7.0 - RX1, PLY - .16, 2.2, .06, .02), A.M.wood, (RX1 + 7.0) / 2, .16 + (PLY - .16) / 2, 0));
      root.add(A.mesh(new T.BoxGeometry(RX1 - RX0, .2, 2.2), A.std(0x9CCFE6, { roughness: .45 }), (RX0 + RX1) / 2, .2, 0));
      // 換裝備圓圈、終點旗子
      S = { c, A, rings: [], rack: [], on: [], bot: null, x: CP[0], y: .16, busy: false, drag: null, seg: 0, t: 0, flyT: 0 };
      CP.slice(0, 3).forEach((x, i) => { const r = A.floorRing(.55, .72, A.C.sky, .7); r.position.set(x, groundY(x) + .02, 0); root.add(r); S.rings.push(r); });
      const flag = new T.Group(), fj = new T.Group(); flag.add(fj);
      fj.add(A.mesh(new T.CylinderGeometry(.04, .05, 1.4, 8), A.M.wood, 0, .7, 0));
      const fs = new T.Shape(); fs.moveTo(0, 0); fs.lineTo(.6, -.2); fs.lineTo(0, -.4); fs.closePath();
      fj.add(A.mesh(new T.ExtrudeGeometry(fs, { depth: .03, bevelEnabled: false }), A.M.coral, .03, 1.35, -.015));
      flag.position.set(CP[3] + .5, PLY, -.6); S3.jelly(fj, 120, 5); root.add(flag); S.fj = fj;
      // 裝備托盤（3×3，跟著機器人走到每一段的前面）
      const tray = new T.Group(); root.add(tray); S.tray = tray;
      tray.add(A.mesh(A.rbox(3.7, .5, 3.3, .3, .05), A.M.wood, 0, .25, 0));
      tray.add(A.mesh(A.rbox(3.5, .06, 3.1, .25, .02), A.M.woodDark, 0, .52, 0));
      tray.position.set(-3.4, 0, RACK_Z);
      const have = c.gearList();
      for (let n = 1; n <= 9; n++) {
        if (!have.includes(n) && ![1, 5, 7].includes(n)) continue;
        const g = A.gearShow(n); const s0 = g.scale.x * .7; g.scale.setScalar(s0);
        root.add(g); S3.jelly(g, 150, 7);
        const [ox, oz] = SLOT(n);
        S.rack.push({ n, g, s0, ox, oz, home: new T.Vector3(), on: false });
      }
      placeRack(true);
      // 機器人（自己的一台，裝備從架子上來）
      const b = A.bot(); b.scale.setScalar(.55); root.add(b); S3.jelly(b.userData.jel, 150, 8);
      S.bot = b; S.car = DRIVE.car(CP[0], 0, Math.PI / 2);
      S.go = c.button({ icon: 'go', key: '⏎', cls: 'coral', label: '出發', down: () => go(c) });
      c.ctlH = 96;
    },
    start(c, sub) {
      S.seg = sub; S.x = CP[sub]; S.y = groundY(S.x); S.busy = false;
      S.car.x = S.x; S.car.v = 0;
      dress(c);
      // 托盤滑到這一段的前面；相機只看這一段
      const tx = Math.max(-3.6, Math.min(4.6, (CP[sub] + CP[sub + 1]) / 2 - .4)), x0 = S.tray.position.x;
      c.tween(c.FAST ? .05 : .7, k => { S.tray.position.x = S3.lerp(x0, tx, S3.ease(k)); placeRack(); });
      const xa = CP[sub] - 1.4, xb = CP[sub + 1] + 1.0, top = sub === 0 ? 1.6 : PLY + 1.6;
      c.view([new T.Vector3(xa, 0, -1.4), new T.Vector3(xb, 0, -1.4), new T.Vector3(Math.min(xa, tx - 2), 0, RACK_Z + 1.9), new T.Vector3(Math.max(xb, tx + 2), 0, RACK_Z + 1.9), new T.Vector3((xa + xb) / 2, top, -1)], { elev: 40, elevPt: 52 });
    },
    // ---------- 輸入 ----------
    down(c, p) {
      if (S.busy) return;
      const it = pickRack(c, p);
      S.drag = { it, x: p.x, y: p.y, moved: false };
      if (it) { S3.poke(it.g, .3); c.SFX.pick(); }
    },
    move(c, p) {
      const d = S.drag; if (!d || !d.it) return;
      if (!d.moved && Math.hypot(p.x - d.x, p.y - d.y) < 8) return;
      d.moved = true;
      const g = c.ground(p, 1.2); if (g) d.it.want = g;
      const bq = c.screen(new T.Vector3(S.x, S.y + 1, 0)), near = Math.hypot(bq.x - p.x, bq.y - p.y) < 100;
      if (near && !d.near) { S3.poke(S.bot.userData.jel, .15); c.SFX.hover(); }
      d.near = near;
    },
    up(c, p) {
      const d = S.drag; S.drag = null;
      if (!d || S.busy) return;
      if (d.it) {
        d.it.want = null;
        const bq = c.screen(new T.Vector3(S.x, S.y + 1, 0));
        if (!d.moved || Math.hypot(bq.x - p.x, bq.y - p.y) < 100) equip(c, d.it.n); else c.SFX.drop();
        return;
      }
      if (d.moved || p.cancel) return;
      // 點機器人＝拿下最後裝的那樣；點前面的路＝出發
      const bq = c.screen(new T.Vector3(S.x, S.y + .8, 0));
      if (Math.hypot(bq.x - p.x, bq.y - p.y) < 55) { if (S.on.length) unequip(c, S.on[S.on.length - 1]); return; }
      const g = c.planeZ(p, 0) || c.ground(p, .2);
      if (g && g.x > S.x + .4 && g.z < RACK_Z - 1.8) go(c);
    },
    key(c, k, down, rep) {
      if (!down || rep || S.busy) return;
      if (/^[1-9]$/.test(k)) { const n = +k; if (S.on.includes(n)) unequip(c, n); else if (S.rack.some(r => r.n === n)) equip(c, n); }
      else if (k === 'enter' || k === 'space' || k === 'right' || k === 'd') go(c);
    },
    frame(c, dt, t) {
      if (!S) return;
      S.t += dt;
      // 架子上的裝備：慢慢轉；被拖的跟手；裝上身的藏起來
      S.rack.forEach(r => {
        S3.wobble(r.g, dt);
        if (r.on) { r.g.visible = false; return; }
        r.g.visible = true;
        const want = r.want || r.home;
        r.g.position.lerp(want, r.want ? .3 : .15);
        r.g.rotation.y = r.want ? 0 : Math.sin(S.t * .8 + r.n) * .5;
      });
      // 機器人
      const b = S.bot;
      S.car.x = S.x; DRIVE.pose(S.car, b, dt, t);
      b.position.y = S.y;
      if (b.userData.gears[5].visible) b.userData.gears[5].userData.rotor.rotation.y += dt * (S.fly ? 30 : 0);
      S.car.v *= Math.pow(.02, dt);
      S.rings.forEach((r, i) => { r.visible = i === S.seg; r.scale.setScalar(1 + .06 * Math.sin(S.t * 3)); });
      S3.wobble(S.fj, dt);
      S.go.classList.toggle('dim', S.busy);
      S.go.classList.toggle('glow', !S.busy && S.on.length > 0);
    },
    glow(c) {
      if (!S || S.busy) return [];
      const out = [{ pos: new T.Vector3((CP[S.seg] + CP[S.seg + 1]) / 2, groundY((CP[S.seg] + CP[S.seg + 1]) / 2) + .4, 0), size: 2.4, op: .18, color: c.A.C.sky }];
      if (c.strong) SEG[S.seg].need.slice(0, 1).forEach(n => { const r = S.rack.find(q => q.n === n); if (r && !r.on) out.push({ pos: r.home.clone().setY(1.1), size: 1.2, color: c.A.C.amber, strong: true }); });
      return out;
    },
    caps(c) {
      if (!S || S.busy) return [];
      return S.rack.filter(r => !r.on).map(r => ({ pos: r.home.clone().setY(1.35), text: String(r.n), cur: c.strong && SEG[S.seg].need.includes(r.n) }));
    },
    demo(c) {
      const n = SEG[S.seg].need[0], r = S.rack.find(q => q.n === n);
      if (r && !r.on) return { kind: 'drag', pts: [r.home.clone().setY(.9), new T.Vector3(S.x, S.y + 1, 0)], dur: 2.2 };
      return { kind: 'tap', pts: [new T.Vector3(CP[S.seg] + 1.5, groundY(CP[S.seg] + 1.5) + .3, 0)] };
    },
    assist(c) {
      const n = SEG[S.seg].need[0];
      if (!S.on.includes(n)) equip(c, n);
      setTimeout(() => { if (S && !S.busy) go(c); }, 900);
    },
    probe(c) {
      const sc = v => { const q = c.screen(v); return [Math.round(q.x), Math.round(q.y)]; };
      return { seg: S.seg, on: S.on.slice(), busy: S.busy, need: SEG[S.seg].need, rack: S.rack.filter(r => !r.on).map(r => ({ n: r.n, scr: sc(r.home.clone().setY(.8)) })), botScr: sc(new T.Vector3(S.x, S.y + 1, 0)), ahead: sc(new T.Vector3(CP[S.seg] + 1.6, groundY(CP[S.seg] + 1.6) + .2, 0)) };
    },
    exit() { S = null; },
  };

  function placeRack(snap) {
    S.rack.forEach(r => { r.home.set(S.tray.position.x + r.ox, .6, S.tray.position.z + r.oz); if (snap) r.g.position.copy(r.home); });
  }
  function pickRack(c, p) {
    const live = S.rack.filter(r => !r.on);
    const o = c.pick(p, live.map(r => r.g));
    return o ? live.find(r => r.g === o) : c.nearest(p, live, r => r.home.clone().setY(.8), 50);
  }
  function dress(c) { c.A.setGear(S.bot, S.on, S.on.includes(7)); }
  // 裝上：從架子飛到身上；已經有兩樣就讓最早那樣跳回去
  function equip(c, n) {
    const r = S.rack.find(q => q.n === n); if (!r || r.on) return;
    if (S.on.length >= 2) unequip(c, S.on[0], true);
    const from = r.g.position.clone(), to = new T.Vector3(S.x, S.y + 1.2, 0);
    S.on.push(n);
    c.tween(c.FAST ? .05 : .35, k => { r.g.position.lerpVectors(from, to, k); r.g.position.y += Math.sin(k * Math.PI) * .8; }).then(() => {
      if (!S) return;
      r.on = true; r.g.position.copy(r.home); dress(c);
      c.SFX.snap(); S3.poke(S.bot.userData.jel, .35);
    });
  }
  function unequip(c, n, quiet) {
    const r = S.rack.find(q => q.n === n); if (!r) return;
    S.on = S.on.filter(q => q !== n); r.on = false; dress(c);
    r.g.position.set(S.x, S.y + 1.2, 0); S3.poke(r.g, .4);
    if (!quiet) c.SFX.tap(); else c.SFX.drop();
  }
  // 出發：裝對了就過、裝錯了溫柔地退回來
  function go(c) {
    if (S.busy) return;
    S.busy = true; c.act();
    const seg = S.seg, need = SEG[seg].need, ok = need.some(n => S.on.includes(n));
    const legs = S.on.includes(7), x0 = CP[seg], x1 = CP[seg + 1];
    const walk = (xa, xb, dur, hop = 0) => c.tween(c.FAST ? .05 : dur, k => { S.x = S3.lerp(xa, xb, k); S.y = groundY(S.x) + (hop ? Math.sin(k * Math.PI) * hop : 0); S.car.v = (xb - xa) / dur; });
    c.SFX.tap();
    let p;
    if (ok) {
      if (seg === 2) {      // 飛過河
        S.fly = true; c.SFX.rotor();
        p = c.tween(c.FAST ? .05 : 1.8, k => { S.x = S3.lerp(x0, x1, k); S.y = PLY + Math.sin(k * Math.PI) * 1.6; if (Math.floor(k * 6) !== Math.floor((k - .02) * 6)) c.SFX.rotor(); });
      } else p = walk(x0, x1, seg === 1 ? 2.0 : 1.6);
      p.then(() => {
        if (!S) return;
        S.fly = false; S.y = groundY(S.x); S3.poke(S.bot.userData.jel, .3); c.SFX.land();
        if (seg === 2) S3.poke(S.fj, .5);
        setTimeout(() => { if (S) { S.busy = false; c.win(); } }, c.FAST ? 20 : 300);
      });
      return;
    }
    // 溫柔的失敗：卡住／滑下來／停在河邊，再回到圓圈
    const stop = seg === 0 ? x0 + 1.1 : seg === 1 ? SX0 + .25 : RX0 - .25;
    walk(x0, stop, .8).then(() => {
      if (!S) return;
      S3.poke(S.bot.userData.jel, .4); c.SFX.bump(1);
      const shake = c.tween(c.FAST ? .05 : .7, k => {
        S.bot.userData.lean.rotation.z = Math.sin(k * 30) * .08 * (1 - k);
        if (seg === 1) S.y = groundY(S.x) + Math.sin(k * Math.PI) * .25;
        if (seg === 2 && legs) S.bot.userData.lean.position.y = .16 - Math.sin(k * Math.PI) * .12;
      });
      c.fail(SEG[seg].key);
      return shake.then(() => walk(stop, x0, .7));
    }).then(() => { if (S) { S.busy = false; S.bot.userData.lean.rotation.z = 0; } });
  }
})();
