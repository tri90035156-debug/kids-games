// 第 4 關 影子變大變小——手勢：拖手電筒近、遠（側看）。
// 第一圈：「燈靠近，影子變大還是變小？」→ 把手電筒往人偶拖 → 變大。
// 第二圈起：牆上一顆星星（高度三選一）。先把「燈的記號」放在軌道上（假設），再按開燈（實驗），
//          看影子的頭有沒有碰到星星（結果）。差一點就再猜一次——每試一次圓環轉一圈。
// 影子用相似三角形算：牆上的高度 = 燈高 + (人偶上的高度 − 燈高) × (牆−燈)/(人偶−燈)。畫在牆上的 canvas。
(window.EXPS = window.EXPS || [])[4] = (() => {
  'use strict';
  const T = THREE;
  const PX = 0, WX = 3.0, LY = .6, HEAD = 1.25, LMIN = -4.4, LMAX = -1.25, WH = 4.2, WD = 3.0;
  let S = null;
  const ROT = .62, YA = new THREE.Vector3(0, 1, 0);
  const W = v => v.clone().applyAxisAngle(YA, ROT), Lo = v => v.clone().applyAxisAngle(YA, -ROT);
  const kOf = L => (WX - L) / (PX - L);
  const headAt = L => LY + (HEAD - LY) * kOf(L);
  const LforHead = h => { const k = (h - LY) / (HEAD - LY); return WX / (1 - k); };

  function drawWall() {
    const x = S.ctx, W = S.cv.width, H = S.cv.height;
    x.fillStyle = '#F3EAD9'; x.fillRect(0, 0, W, H);
    const py = y => H - y / WH * H, pz = z => W / 2 + z / WD * W;
    if (S.on) {
      // 光圈
      const k = kOf(S.L), g = x.createRadialGradient(W / 2, py(LY), 0, W / 2, py(LY), H * .9 / Math.max(1, 3.6 - k * .5));
      g.addColorStop(0, 'rgba(255,240,190,.95)'); g.addColorStop(1, 'rgba(255,240,190,0)');
      x.fillStyle = g; x.fillRect(0, 0, W, H);
      // 影子：頭（圓）＋身體（膠囊），從人偶的形狀放大 k 倍（以燈的高度為中心）
      const map = y => LY + (y - LY) * k;
      x.fillStyle = 'rgba(88,80,76,.82)';
      const hr = .2 * k, hy = map(1.05);
      x.beginPath(); x.arc(pz(0), py(hy), hr / WD * W, 0, 7); x.fill();
      const bw = .22 * k, b0 = map(.08), b1 = map(.86);
      const rr = bw / WD * W;
      x.beginPath(); x.moveTo(pz(-bw), py(b1)); x.arc(pz(0), py(b1), rr, Math.PI, 0); x.lineTo(pz(bw), py(b0)); x.lineTo(pz(-bw), py(b0)); x.closePath(); x.fill();
      x.fillRect(pz(-.3 * k), py(map(.1)), .6 * k / WD * W, Math.max(0, py(0) - py(map(.1))));
    }
    if (S.star != null) {
      const cx = pz(0), cy = py(S.star), r = 26;
      x.fillStyle = S.hit ? '#F05A3C' : '#F2A33A';
      x.beginPath();
      for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rad = i % 2 ? r * .45 : r; x.lineTo(cx + Math.cos(a) * rad, cy + Math.sin(a) * rad); }
      x.closePath(); x.fill();
    }
    S.tex.needsUpdate = true;
  }

  return {
    say: { end: 'e4.end' },
    build(c) {
      const A = c.A, root = c.root;
      root.add(A.box(9, .1, 6, A.M.paper, -.3, .05, .2, .5));
      const rig = new T.Group(); rig.rotation.y = ROT; root.add(rig);
      // 軌道
      rig.add(A.box(LMAX - LMIN + .9, .06, .5, A.M.woodDark, (LMIN + LMAX) / 2, .13, .2, .03));
      // 牆（canvas 貼圖）
      const cv = document.createElement('canvas'); cv.width = 256; cv.height = Math.round(256 * WH / WD);
      const tex = new T.CanvasTexture(cv); tex.colorSpace = T.SRGBColorSpace;
      const wall = new T.Mesh(new T.PlaneGeometry(WD, WH), new T.MeshBasicMaterial({ map: tex, side: T.DoubleSide }));
      wall.position.set(WX, WH / 2 + .1, 0); wall.rotation.y = -Math.PI / 2; wall.receiveShadow = true; rig.add(wall);
      rig.add(A.box(.16, WH + .2, WD + .2, A.M.wood, WX + .2, WH / 2 + .1, 0, .05));
      const pup = new T.Group(), pj = new T.Group(); pup.add(pj); pj.add(A.puppet()); pup.position.set(PX, .1, 0); c.jel(pj); rig.add(pup);
      const fl = new T.Group(), fj = new T.Group(); fl.add(fj); fj.add(A.flashlight()); c.jel(fj); rig.add(fl);
      // 光束（淡淡的圓錐）
      const beam = new T.Mesh(new T.ConeGeometry(1, 1, 24, 1, true), new T.MeshBasicMaterial({ color: 0xFFF1C8, transparent: true, opacity: .16, depthWrite: false, side: T.DoubleSide }));
      beam.rotation.z = Math.PI / 2; beam.castShadow = false; rig.add(beam);
      // 標記（假設）
      const mk = new T.Group(), mj = new T.Group(); mk.add(mj); mj.add(A.mesh(new T.ConeGeometry(.16, .4, 14), A.M.amber, 0, .38, 0)); mj.children[0].rotation.x = Math.PI; c.jel(mj); mk.visible = false; rig.add(mk);
      S = { c, A, cv, ctx: cv.getContext('2d'), tex, fl, fj, pj, beam, mk, mj, L: LMIN, want: LMIN, on: true, star: null, hit: false, ph: 'idle', drag: null, M: -2.8, keys: {}, slide: null, tries: 0, near0: LMIN };
      c.view([W(new T.Vector3(LMIN - .8, 0, 1)), W(new T.Vector3(WX + .3, 0, 1.6)), W(new T.Vector3(LMIN - .8, 1.5, -1)), W(new T.Vector3(WX + .3, WH, -1.6)), W(new T.Vector3(WX + .3, WH, 1.6))], { elev: 22, elevPt: 26 });
      drawWall();
    },
    async play(c, r0) {
      const A = c.A;
      if (r0 === 0) {
        c.setRound(0);
        const CH = { opts: [{ svg: A.icon('shadowBig'), label: 'c.big', say: 'o.big' }, { svg: A.icon('shadowSmall'), label: 'c.small', say: 'o.small' }] };
        await c.say('e4.q');
        const g = await c.guessChoice(CH);
        await c.step(1);
        S.ph = 'move'; S.near0 = S.L;
        c.say('e4.x1');
        await c.until('e4.x1');
        S.ph = 'idle';
        await c.wait(.4);
        await c.say('e4.r1');
        await c.checkChoice(CH, g, 0);
        await c.lap();
      }
      // 第二圈起：星星
      S.star = [2.0, 2.4, 2.75][Math.floor(Math.random() * 3)];
      S.on = false; S.want = LMIN; slideTo(c, LMIN);
      drawWall();
      await c.say('e4.q2');
      let r = Math.max(1, r0);
      for (;;) {
        c.setRound(r);
        await c.step(0);
        S.ph = 'mark'; S.mk.visible = true; c.poke(S.mj, .4);
        c.say('e4.h2');
        const ok = c.button({ icon: 'check', key: 'Enter', label: '放好了', down: () => confirmMark(c) });
        ok.classList.add('glow');
        await c.until('e4.h2');
        c.clearButtons();
        c.mine(miniTrack(S.M));
        await c.step(1);
        S.ph = 'light';
        const lb = c.button({ icon: 'light', key: '␣', label: '開燈', cls: 'lit', down: () => lightOn(c) });
        lb.classList.add('glow');
        c.say('e4.x2');
        await c.until('e4.x2');
        c.clearButtons();
        S.ph = 'idle';
        await c.wait(.3);
        await c.step(2);
        const h = headAt(S.L), d = h - S.star;
        if (Math.abs(d) < .13) {
          S.hit = true; drawWall(); c.markMine(true);
          await c.say('e4.hit');
          await c.lap();
          break;
        }
        S.tries++;
        c.markMine(false);
        await c.say(d < 0 ? 'e4.low' : 'e4.high');
        await c.lap();
        S.on = false; drawWall();
        r++;
      }
    },
    down(c, p) {
      const fq = c.screen(W(S.fl.position)), mq = c.screen(W(S.mk.position.clone().setY(.4)));
      if (S.ph === 'move' && Math.hypot(fq.x - p.x, fq.y - p.y) < 90) { S.drag = 'fl'; c.poke(S.fj, .2); c.SFX.tap(); return; }
      if (S.ph === 'mark') { S.drag = 'mk'; const q = trackAt(c, p); if (q && Math.hypot(mq.x - p.x, mq.y - p.y) > 60) setMark(c, q.x); c.poke(S.mj, .2); return; }
      S.tap = { x: p.x, y: p.y };
    },
    move(c, p) {
      if (!S.drag) return;
      const q = trackAt(c, p); if (!q) return;
      if (S.drag === 'fl') S.want = Math.max(LMIN, Math.min(LMAX, q.x));
      else setMark(c, q.x);
    },
    up(c, p) {
      const dr = S.drag; S.drag = null;
      if (dr === 'fl') { check(c); return; }
      if (dr) return;
      const t = S.tap; S.tap = null;
      if (!t || Math.hypot(p.x - t.x, p.y - t.y) > 14) return;
      if (S.ph === 'move') { const pq = c.screen(W(new T.Vector3(PX, .8, 0))); if (Math.hypot(pq.x - p.x, pq.y - p.y) < 110) { slideTo(c, LMAX + .2); } }
      else if (S.ph === 'light') lightOn(c);
    },
    key(c, k, down, rep) {
      if (k === 'left' || k === 'right' || k === 'a' || k === 'd') { S.keys[k] = down; if (!down && S.ph === 'move') check(c); return; }
      if (!down || rep) return;
      if (S.ph === 'mark' && k === 'enter') confirmMark(c);
      else if (S.ph === 'light' && (k === 'space' || k === 'enter' || k === 'l')) lightOn(c);
    },
    frame(c, dt) {
      if (!S) return;
      const K = S.keys, kx = (K.right || K.d ? 1 : 0) - (K.left || K.a ? 1 : 0);
      if (kx && S.ph === 'move') S.want = Math.max(LMIN, Math.min(LMAX, S.want + kx * 2.2 * dt));
      if (kx && S.ph === 'mark') setMark(c, S.M + kx * 1.6 * dt);
      const L0 = S.L;
      S.L += (S.want - S.L) * Math.min(1, dt * 9);
      S.fl.position.set(S.L - .35, LY, 0);
      S.fl.rotation.z = (S.want - S.L) * -.1;
      const len = WX - S.L - .3;
      S.beam.visible = S.on;
      S.beam.scale.set(1.25 * kOf(S.L) * .5 + .3, len, 1.25 * kOf(S.L) * .5 + .3);
      S.beam.position.set(S.L + .3 + len / 2, LY, 0);
      if (Math.abs(L0 - S.L) > .0005 || S.dirty) { S.dirty = false; drawWall(); }
      S.mk.position.set(S.M, .16, .2);
    },
    glow(c) {
      if (S.ph === 'move') return [{ pos: W(S.fl.position.clone()), size: 1.3, strong: c.strong }, { pos: W(new T.Vector3(LMAX, .2, .2)), size: 1, color: c.A.C.amber, op: .15 }];
      if (S.ph === 'mark') { const out = [{ pos: W(S.mk.position.clone().setY(.4)), size: 1, color: c.A.C.amber }]; if (S.tries >= 2) out.push({ pos: W(new T.Vector3(LforHead(S.star)), .2, .2), size: .9, strong: true }); return out; }
      if (S.ph === 'light') return [{ pos: W(S.fl.position.clone()), size: 1.3 }];
      return [];
    },
    caps(c) {
      if (S.ph === 'move') return [{ pos: W(S.fl.position.clone().setY(1.3)), text: '←→', cur: true }];
      if (S.ph === 'mark') return [{ pos: W(S.mk.position.clone().setY(.95)), text: '←→', cur: true }];
      return [];
    },
    demo(c) {
      if (S.ph === 'move') return { kind: 'drag', pts: [W(S.fl.position), W(new T.Vector3(LMAX, LY, 0))] };
      if (S.ph === 'mark') return { kind: 'drag', pts: [W(S.mk.position.clone().setY(.3)), W(new T.Vector3(S.tries >= 2 ? LforHead(S.star) : -2.4, .3, .2))] };
      if (S.ph === 'light') return { kind: 'tap', pts: [W(S.fl.position)] };
      return null;
    },
    assist(c) { if (S.ph === 'move') slideTo(c, LMAX); if (S.ph === 'mark') setMark(c, LforHead(S.star)); },
    probe(c) {
      const sc = v => { const q = c.screen(v); return [Math.round(q.x), Math.round(q.y)]; };
      return { wallPix: [...S.ctx.getImageData(128, 150, 1, 1).data], cvh: S.cv.height, ph: S.ph, L: +S.L.toFixed(2), M: +S.M.toFixed(2), star: S.star, best: S.star ? +LforHead(S.star).toFixed(2) : null, head: +headAt(S.L).toFixed(2), on: S.on, fl: sc(W(S.fl.position)), pup: sc(W(new T.Vector3(PX, .8, 0))), mk: sc(W(S.mk.position.clone().setY(.3))), track: [sc(W(new T.Vector3(LMIN, .2, .2))), sc(W(new T.Vector3(LMAX, .2, .2)))], tries: S.tries };
    },
    exit() { S = null; },
  };

  function trackAt(c, p) { const g = c.ground(p, .2); return g ? Lo(g) : null; }
  function check(c) { if (S.ph === 'move' && S.L > S.near0 + 1.6) { S.ph = 'done'; c.SFX.ok(); setTimeout(() => S && c.win(), c.FAST ? 10 : 500); } }
  function slideTo(c, x) { S.want = x; if (S.ph === 'move') setTimeout(() => S && check(c), c.FAST ? 50 : 600); }
  function setMark(c, x) { const n = Math.max(LMIN, Math.min(LMAX, x)); if (Math.abs(n - S.M) > .3) c.SFX.note(Math.round((n - LMIN) * 2)); S.M = n; S.marked = true; }
  function confirmMark(c) { if (S.ph !== 'mark') return; S.ph = 'marked'; c.poke(S.mj, .4); c.SFX.ok(); c.win(); }
  function lightOn(c) {
    if (S.ph !== 'light') return;
    S.ph = 'sliding'; c.act();
    S.want = S.M;
    setTimeout(() => { if (!S) return; S.L = S.want = S.M; S.on = true; S.dirty = true; c.SFX.chord2(523.3, 659.3); setTimeout(() => S && c.win(), c.FAST ? 10 : 900); }, c.FAST ? 30 : 700);
  }
  function miniTrack(M) {
    const x = 8 + (M - LMIN) / (LMAX - LMIN) * 36;
    return '<span class="sl-mn-r one">' + S.A.sv('<rect x="4" y="44" width="48" height="5" rx="2" fill="#B98E5A"/><path d="M' + x + ' 42l-5-10h10z" fill="#F2A33A"/><rect x="54" y="8" width="6" height="44" fill="#E8DDCB"/><path d="M57 18l2 4 4 .5-3 3 1 4-4-2-4 2 1-4-3-3 4-.5z" fill="#F2A33A"/>') + '</span>';
  }
})();
