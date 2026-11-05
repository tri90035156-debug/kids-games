// 第 7 關 豆子要不要光？——手勢：澆水（拖澆水壺到盆子上）、掀箱子看一眼、撕日曆（往上滑）。
// 第一圈：兩盆綠豆，一盆蓋黑箱子。「箱子裡的會不發芽／長得一樣／長得更高？」→ 每天澆水、掀開看一眼、撕日曆，七天 →
//         每天自動拍一張小照片貼到下面一排格子 → 第七天並排比：有光的矮、綠、葉子打開；黑箱的高、黃白、莖細、葉子小而合著 → 更高。
// 第二圈：「拿掉箱子放窗邊，會變綠嗎？」→ 把箱子拿走（盆子移到窗邊）→ 再澆水撕日曆三天 → 慢慢變綠、葉子打開。
// 綠豆在暗處 6～7 天明顯又高又黃（黃化）；照光後幾小時就開始做葉綠素，一兩天看得出轉綠（見 README 給家長）。
(window.EXPS = window.EXPS || [])[7] = (() => {
  'use strict';
  const T = THREE;
  let S = null;
  const HL = [0, .04, .2, .38, .52, .62, .7, .76, .8, .84, .88];        // 有光那盆的高度（天）
  const HD = [0, .05, .32, .65, 1.0, 1.3, 1.55, 1.75, 1.82, 1.88, 1.92]; // 黑箱那盆
  const YEL = new T.Color(0xEFE6B8), GRN = new T.Color(0x6FA060), LEAF = new T.Color(0x4CB05A), LEAFY = new T.Color(0xE6DC9C);

  function plant(c, x) {
    const A = c.A, g = new T.Group(); g.position.set(x, 0, 0); c.root.add(g);
    const pj = new T.Group(); g.add(pj); pj.add(A.pot()); c.jel(pj);
    const sp = [];
    [[-.15, -.1], [.15, .08], [0, .2]].forEach(([dx, dz], i) => { const s = A.sprout(); s.position.set(dx, .55, dz); s.rotation.y = i * 2; g.add(s); sp.push(s); });
    return { g, pj, sp, h: 0, green: 1, open: 1, curl: 0 };
  }
  function shape(p) {
    p.sp.forEach((s, i) => {
      const u = s.userData, h = Math.max(.001, p.h * (1 - i * .08));
      u.stem.scale.set(p.thin ? .55 : 1.1, h, p.thin ? .55 : 1.1); u.stem.position.y = h / 2;
      u.stem.material.color.copy(YEL).lerp(GRN, p.green);
      u.leaves.forEach((l, k) => {
        l.position.set((k ? 1 : -1) * (.06 + .06 * p.open), h + .02, 0);
        const sz = p.h < .03 ? .001 : (p.thin ? .55 : 1) * (.6 + .5 * p.open);
        l.scale.set(1.4 * sz, .35 * sz, .9 * sz);
        l.rotation.z = (k ? -1 : 1) * (1 - p.open) * 1.1;
        l.material.color.copy(LEAFY).lerp(LEAF, p.green);
      });
      s.rotation.z = p.curl * (i % 2 ? .25 : -.2);
      u.bean.visible = p.h < .5;
    });
  }

  return {
    say: { end: 'e7.end' },
    build(c) {
      const A = c.A, root = c.root;
      root.add(A.box(7.4, .1, 4.6, A.M.paper, 0, .05, 0, .5));
      // 窗戶（第二圈把盆子移過去）
      const win = new T.Group(); win.position.set(2.6, 0, -1.6); root.add(win);
      win.add(A.box(1.9, 2.4, .12, A.M.wood, 0, 1.4, 0, .05));
      win.add(A.box(1.6, 2.1, .14, A.std(0xCFE7F3, { roughness: .4, emissive: new T.Color(0xFFF4D8), emissiveIntensity: .25 }), 0, 1.4, .01, .04));
      win.add(A.box(.08, 2.1, .16, A.M.wood, 0, 1.4, .02, .02)); win.add(A.box(1.6, .08, .16, A.M.wood, 0, 1.4, .02, .02));
      const lit = plant(c, -1.2), dark = plant(c, .9);
      dark.thin = false;
      // 黑箱
      const box = new T.Group(), bj = new T.Group(); box.add(bj); bj.add(A.box(1.4, 1.9, 1.4, A.std(0x3B3430, { roughness: .9 }), 0, .95, 0, .1)); c.jel(bj);
      box.position.set(.9, 0, 0); root.add(box);
      // 澆水壺
      const can = new T.Group(), cj = new T.Group(); can.add(cj);
      cj.add(A.cyl(.32, .36, .55, A.M.sky, 0, .28, 0, 20));
      const sp = A.mesh(new T.CylinderGeometry(.05, .08, .7, 10), A.M.sky, .45, .5, 0); sp.rotation.z = -1.0; cj.add(sp);
      cj.add(A.mesh(new T.TorusGeometry(.2, .05, 8, 16, Math.PI), A.M.sky, -.1, .6, 0));
      c.jel(cj); root.add(can);
      // 日曆
      const cal = new T.Group(), calJ = new T.Group(); cal.add(calJ); calJ.add(A.calendar());
      const page = new T.Mesh(new T.PlaneGeometry(.75, .75), new T.MeshStandardMaterial({ map: A.numberTex(1), roughness: .9 })); page.position.set(0, .5, .07); calJ.add(page);
      const flap = new T.Mesh(new T.PlaneGeometry(.8, .8), new T.MeshStandardMaterial({ color: 0xFFFFFF, roughness: .9, side: T.DoubleSide, transparent: true })); flap.position.set(0, .5, .09); flap.visible = false; calJ.add(flap);
      c.jel(calJ); cal.position.set(-2.9, 0, -1.4); root.add(cal);
      S = { c, A, lit, dark, box, bj, can, cj, cal, calJ, page, flap, win, day: 0, ph: 'idle', watered: [false, false], peeked: false, drag: null, t: 0, drops: [], canHome: new T.Vector3(-2.7, 0, 1.3), boxOn: true };
      can.position.copy(S.canHome);
      shape(lit); shape(dark);
      // 下面一排照片格子
      const strip = document.createElement('div'); strip.className = 'sl-strip'; strip.innerHTML = Array.from({ length: 7 }, () => '<i></i>').join(''); document.querySelector('#ov').appendChild(strip); S.strip = strip;
      c.view([new T.Vector3(-3.6, 0, 2.2), new T.Vector3(3.6, 0, 2.2), new T.Vector3(-3.6, 2.6, -2), new T.Vector3(3.6, 2.6, -2)], { elev: 30, elevPt: 40 });
    },
    async play(c, r0) {
      const A = c.A;
      if (r0 === 0) {
        c.setRound(0);
        await c.say('e7.q');
        const CH = { opts: [{ svg: A.icon('beanNone'), say: 'o.none' }, { svg: A.icon('beanSame'), say: 'o.equal' }, { svg: A.icon('beanTall'), say: 'o.tall' }] };
        const g = await c.guessChoice(CH);
        await c.step(1);
        c.say('e7.x1');
        c.hint = 'e7.x1';
        for (let d = 1; d <= 7; d++) await oneDay(c, true);
        // 第七天：拿掉箱子並排比
        await liftBox(c, false);
        await c.say('e7.r1');
        await c.checkChoice(CH, g, 2);
        await c.lap();
      } else { S.day = 7; grow(c, true); }
      c.setRound(1);
      if (S.boxOn) { S.box.position.y = 0; }
      await c.say('e7.q2');
      const CH2 = { opts: [{ svg: A.icon('beanGreen'), label: 'c.green', say: 'o.green' }, { svg: A.icon('beanYellow'), label: 'c.nogreen', say: 'o.nogreen' }] };
      const g2 = await c.guessChoice(CH2);
      await c.step(1);
      // 箱子拿走、盆子搬到窗邊
      if (!S.boxOn) { S.boxOn = true; S.box.position.set(.9, 0, 0); S.bj.visible = true; }
      S.ph = 'unbox';
      c.say('e7.x2');
      await c.until('e7.x2');
      for (let d = 0; d < 3; d++) await oneDay(c, false);
      S.ph = 'idle';
      await c.say('e7.r2');
      await c.checkChoice(CH2, g2, 0);
      await c.lap();
    },
    down(c, p) {
      const cq = c.screen(S.can.position.clone().setY(.4));
      if (S.ph === 'water' && Math.hypot(cq.x - p.x, cq.y - p.y) < 90) { S.drag = { k: 'can', x: p.x, y: p.y, moved: false }; c.poke(S.cj, .2); c.SFX.tap(); return; }
      const kq = c.screen(S.cal.position.clone().setY(.6));
      if (S.ph === 'tear' && Math.hypot(kq.x - p.x, kq.y - p.y) < 100) { S.drag = { k: 'cal', x: p.x, y: p.y }; return; }
      S.tap = { x: p.x, y: p.y };
    },
    move(c, p) {
      const d = S.drag; if (!d) return;
      if (d.k === 'can') { if (Math.hypot(p.x - d.x, p.y - d.y) > 10) d.moved = true; const g = c.ground(p, 1.2); if (g) S.can.position.set(Math.max(-3.4, Math.min(3.4, g.x)), 1.2, Math.max(-1.8, Math.min(2, g.z))); }
      if (d.k === 'cal' && d.y - p.y > 40) { S.drag = null; tear(c); }
    },
    up(c, p) {
      const d = S.drag; S.drag = null;
      if (d && d.k === 'can') { if (!d.moved || S.watered.some(Boolean)) { if (S.ph === 'water') autoWater(c); } else canHome(c); return; }
      if (d && d.k === 'cal') { if (Math.hypot(p.x - d.x, p.y - d.y) < 14) tear(c); return; }
      const t = S.tap; S.tap = null;
      if (!t || Math.hypot(p.x - t.x, p.y - t.y) > 14) return;
      const bq = c.screen(S.box.position.clone().setY(1));
      if ((S.ph === 'peek' || S.ph === 'unbox') && Math.hypot(bq.x - p.x, bq.y - p.y) < 120) { S.ph === 'peek' ? peek(c) : unbox(c); return; }
      const lq = c.screen(S.lit.g.position.clone().setY(.6));
      if (S.ph === 'water' && (Math.hypot(lq.x - p.x, lq.y - p.y) < 100 || Math.hypot(bq.x - p.x, bq.y - p.y) < 100)) autoWater(c);
    },
    key(c, k, down, rep) {
      if (!down || rep) return;
      if (S.ph === 'water' && (k === 'w' || k === 'space' || k === 'enter')) autoWater(c);
      else if (S.ph === 'peek' && (k === 'b' || k === 'space' || k === 'enter')) peek(c);
      else if (S.ph === 'tear' && (k === 'up' || k === 'space' || k === 'enter')) tear(c);
      else if (S.ph === 'unbox' && (k === 'b' || k === 'space' || k === 'enter')) unbox(c);
    },
    frame(c, dt) {
      if (!S) return;
      S.t += dt;
      if (S.ph === 'water') {
        [S.lit, S.dark].forEach((pl, i) => {
          const a = c.screen(S.can.position.clone().add(new T.Vector3(.6, 0, 0))), b = c.screen(pl.g.position.clone().setY(1.0));
          if (S.drag && S.drag.k === 'can' && S.drag.moved && Math.hypot(a.x - b.x, a.y - b.y) < 90) pour(c, i);
        });
      }
      const tilt = S.pouring > 0 ? .7 : 0; S.pouring = Math.max(0, (S.pouring || 0) - dt);
      S.cj.rotation.z = c.lerp(S.cj.rotation.z, -tilt, .2);
      S.drops = S.drops.filter(dr => { dr.t += dt; dr.m.position.y -= dt * 3; if (dr.m.position.y < .6) { c.root.remove(dr.m); return false; } return true; });
    },
    glow(c) {
      if (S.ph === 'water') return [{ pos: S.can.position.clone().setY(.3), size: 1.4, strong: c.strong }];
      if (S.ph === 'peek' || S.ph === 'unbox') return [{ pos: S.box.position.clone().setY(.1), size: 2, strong: c.strong }];
      if (S.ph === 'tear') return [{ pos: S.cal.position.clone().setY(.2), size: 1.4, strong: c.strong }];
      return [];
    },
    caps(c) {
      if (S.ph === 'water') return [{ pos: S.can.position.clone().setY(1.4), text: 'W', cur: true }];
      if (S.ph === 'peek' || S.ph === 'unbox') return [{ pos: S.box.position.clone().setY(2.3), text: 'B', cur: true }];
      if (S.ph === 'tear') return [{ pos: S.cal.position.clone().setY(1.5), text: '↑', cur: true }];
      return [];
    },
    demo(c) {
      if (S.ph === 'water') return { kind: 'drag', pts: [S.can.position.clone().setY(.4), S.lit.g.position.clone().setY(1.2), S.dark.g.position.clone().setY(1.2)] };
      if (S.ph === 'peek' || S.ph === 'unbox') return { kind: 'tap', pts: [S.box.position.clone().setY(1)] };
      if (S.ph === 'tear') return { kind: 'drag', pts: [S.cal.position.clone().setY(.5), S.cal.position.clone().setY(1.6)] };
      return null;
    },
    assist(c) { if (S.ph === 'water') autoWater(c); else if (S.ph === 'peek') peek(c); else if (S.ph === 'tear') tear(c); else if (S.ph === 'unbox') unbox(c); },
    probe(c) {
      const sc = v => { const q = c.screen(v); return [Math.round(q.x), Math.round(q.y)]; };
      return { ph: S.ph, day: S.day, hl: +S.lit.h.toFixed(2), hd: +S.dark.h.toFixed(2), green: +S.dark.green.toFixed(2), can: sc(S.can.position.clone().setY(.4)), cal: sc(S.cal.position.clone().setY(.6)), box: sc(S.box.position.clone().setY(1)), pots: [sc(S.lit.g.position.clone().setY(.6)), sc(S.dark.g.position.clone().setY(.6))], boxOn: S.boxOn };
    },
    exit() { if (S && S.strip) S.strip.remove(); S = null; },
  };

  // 一天：澆水 →（第一圈）掀箱子看一眼 → 撕日曆 → 長大、拍照
  async function oneDay(c, withBox) {
    S.watered = [false, false];
    S.ph = 'water'; await c.until(S.day === 0 ? (withBox ? 'e7.x1' : 'e7.x2') : null);
    if (withBox) { S.ph = 'peek'; await c.until(); }
    S.ph = 'tear'; await c.until();
    S.ph = 'grow';
    S.day++;
    grow(c, withBox);
    if (withBox) photo(c);
    await c.wait(.5);
  }
  function grow(c, inDark) {
    const d = S.day, L = S.lit, D = S.dark;
    c.tween(.6, k => {
      L.h = c.lerp(HL[Math.max(0, d - 1)], HL[d], k); L.green = 1; L.open = Math.min(1, d / 4);
      if (inDark) { D.h = c.lerp(HD[Math.max(0, d - 1)], HD[d], k); D.green = 0; D.open = 0; D.thin = true; D.curl = Math.min(1, d / 5); }
      else { const g = Math.min(1, (d - 7) / 3); D.h = c.lerp(HD[Math.max(0, d - 1)], HD[Math.min(10, d)], k); D.green = c.lerp(Math.max(0, (d - 8) / 3), g, k); D.open = D.green; D.curl = 1 - D.green * .7; }
      shape(L); shape(D);
    });
    c.SFX.note(2 + d % 8);
  }
  function photo(c) {
    const cell = S.strip.children[S.day - 1]; if (!cell) return;
    const hl = HL[S.day] * 22, hd = HD[S.day] * 22;
    cell.innerHTML = S.A.sv('<rect x="0" y="0" width="64" height="64" rx="8" fill="#FFF8EE"/><path d="M8 50h20l-3 10H11zM36 50h20l-3 10H39z" fill="#C97B55"/>' +
      (hl > 1 ? '<path d="M18 50V' + (50 - hl) + '" stroke="#6FA060" stroke-width="3"/><ellipse cx="18" cy="' + (50 - hl) + '" rx="' + (3 + S.day * .5) + '" ry="2" fill="#4CB05A"/>' : '') +
      (hd > 1 ? '<path d="M46 50V' + (50 - hd) + '" stroke="#E6DC9C" stroke-width="2"/><ellipse cx="46" cy="' + (50 - hd) + '" rx="2.5" ry="1.5" fill="#E6DC9C"/>' : ''));
    cell.classList.add('on');
    c.SFX.page();
  }
  function pour(c, i) {
    S.pouring = .3;
    if (Math.random() < .5) { const m = S.A.ball(.04, S.A.M.sky, S.can.position.x + .75, S.can.position.y + .3, S.can.position.z, 6); m.castShadow = false; c.root.add(m); S.drops.push({ m, t: 0 }); }
    if (!S.watered[i]) { S.watered[i] = true; c.SFX.drop(); c.poke([S.lit, S.dark][i].pj, .2); if (S.watered.every(Boolean)) { S.ph = 'watered'; setTimeout(() => { if (!S) return; canHome(c); c.win(); }, c.FAST ? 10 : 500); } }
  }
  function autoWater(c) {
    if (S.ph !== 'water') return;
    S.ph = 'autowater'; c.act();
    const from = S.can.position.clone(), a = S.lit.g.position.clone().add(new T.Vector3(-.5, 1.2, 0)), b = S.dark.g.position.clone().add(new T.Vector3(-.5, 1.2, 0));
    c.tween(1.2, k => { if (k < .5) S.can.position.lerpVectors(from, a, k * 2); else S.can.position.lerpVectors(a, b, (k - .5) * 2); S.pouring = .2; if (k > .3 && !S.watered[0]) { S.watered[0] = true; c.SFX.drop(); } if (k > .9 && !S.watered[1]) { S.watered[1] = true; c.SFX.drop(); } }).then(() => { if (!S) return; canHome(c); c.win(); });
  }
  function canHome(c) { const from = S.can.position.clone(); c.tween(.4, k => S.can.position.lerpVectors(from, S.canHome, c.ease(k))).then(() => { if (S) c.poke(S.cj, .3); }); }
  function peek(c) {
    if (S.ph !== 'peek') return;
    S.ph = 'peeking'; c.act();
    c.tween(1.1, k => { S.box.position.y = Math.sin(k * Math.PI) * 2.2; }).then(() => { if (!S) return; c.poke(S.bj, .3); c.SFX.land(); c.win(); });
  }
  function liftBox(c) { S.boxOn = false; return c.tween(.6, k => { S.box.position.y = k * 2.6; S.box.position.x = .9 + k * 2.5; }).then(() => { if (S) S.bj.visible = false; }); }
  function unbox(c) {
    if (S.ph !== 'unbox') return;
    S.ph = 'moving'; c.act();
    S.bj.visible = true;
    c.tween(.6, k => { S.box.position.set(.9 + k * 3, k * 2, 0); }).then(() => {
      if (!S) return; S.bj.visible = false; S.boxOn = false;
      const from = S.dark.g.position.clone(), to = new T.Vector3(2.4, 0, -.9);
      return c.tween(.7, k => { S.dark.g.position.lerpVectors(from, to, c.ease(k)); S.dark.g.position.y = Math.sin(k * Math.PI) * .5; });
    }).then(() => { if (!S) return; c.poke(S.dark.pj, .3); c.SFX.land(); c.win(); });
  }
  function tear(c) {
    if (S.ph !== 'tear') return;
    S.ph = 'tearing'; c.act();
    S.flap.visible = true; S.flap.material.map = S.page.material.map; S.flap.material.needsUpdate = true;
    S.page.material.map = S.A.numberTex(S.day + 2); S.page.material.needsUpdate = true;
    c.SFX.page();
    c.tween(.4, k => { S.flap.position.y = .5 + k * 1.2; S.flap.rotation.x = -k * 1.2; S.flap.material.opacity = 1 - k; }).then(() => { if (!S) return; S.flap.visible = false; S.flap.position.y = .5; S.flap.rotation.x = 0; c.poke(S.calJ, .25); c.win(); });
  }
})();
