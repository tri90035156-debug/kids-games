// 《颱風怎麼來？》十關。共用引擎（engine.js）管流程、配音（VoAI 預錄）、注音字幕、重來鈕；畫面是 svg.js 的 2D SVG（第 5 批換成 3D）。
// 每關：故事（一句一句唸）→ 要做的事 → 互動 → 做完（ok）→ 「為什麼？」（按了才唸）＋「繼續」。
// 鍵盤：多數關卡空白鍵／Enter 等於點主要的東西；第 5 關方向鍵；第 7、10 關 A／B。測試：?ch=N&fast=1、?fin=1；console：__ty.win() 直接過這一關。
(() => {
  'use strict';
  const { $, stage, foot, Z, sfx, say, speak, sleep, waitAction, stopVoice, FAST, keyName } = G;
  const { S, loop, later, tween, pt, lab, drawLab, makeTy, waves, P, PZ, LAND, bigMap, pathOn, drawAlong, ICON, ARW, CARDPIC } = SV;

  let winNow = null;
  // 一關的骨架：先畫圖（build），唸故事，再開放互動；互動做完呼叫 c.finish()
  async function chapter(n, build) {
    const k = s => 'c' + n + '.' + s;
    stage.innerHTML = '<div class="ty"><svg class="ty-sv" viewBox="0 0 400 370" role="img" aria-label="互動圖"></svg><div class="ty-ctrl" id="ctrl"></div></div>';
    foot.innerHTML = '';
    const svg = $('.ty-sv'), ctrl = $('#ctrl');
    SV.reset(svg);
    let fin;
    const finished = new Promise(r => { fin = r; });
    const c = {
      n, svg, ctrl, live: false, done: false,
      key: k,
      say: s => say(k(s)),
      finish() { if (c.done) return; c.done = true; c.live = false; sfx('win'); fin(); },
      btn(uiKey, fn, cls = '') {
        const b = document.createElement('button'); b.className = 'ty-pill ' + cls; b.innerHTML = Z(uiKey.includes('.') ? uiKey : k(uiKey));
        b.addEventListener('click', ev => { if (!c.live) return; sfx('tap'); fn.call(b, ev); }); ctrl.appendChild(b); return b;
      },
      onKey: null,
    };
    winNow = () => { if (c.test) c.test(); else c.finish(); };
    const kh = ev => { if (!c.live || !c.onKey || ev.repeat || ev.ctrlKey || ev.metaKey || ev.altKey) return; const kk = keyName(ev); if (kk && c.onKey(kk) !== false) ev.preventDefault(); };
    addEventListener('keydown', kh);
    build(c);
    const story = Object.keys(TX).filter(x => new RegExp('^c' + n + '\\.s\\d$').test(x));
    for (const s of story) await say(s);
    c.live = true;
    say(k('task'));
    await finished;
    removeEventListener('keydown', kh);
    await say(k('ok'));
    await outro(n);
  }
  // 做完：「為什麼？」（一句一句唸）＋「繼續」
  async function outro(n) {
    const why = Object.keys(TX).filter(x => new RegExp('^c' + n + '\\.w\\d$').test(x));
    foot.innerHTML = (why.length ? '<button class="big alt ty-why" id="why">' + Z('ui.why') + '</button>' : '') + '<button class="big" id="nx">' + Z('ui.next') + ' ▶</button>';
    let tok = 0;
    if (why.length) $('#why').addEventListener('click', async () => {
      const my = ++tok; sfx('tap');
      for (const w of why) { if (my !== tok) return; await say(w); }
    });
    await waitAction([{ el: $('#nx'), keys: ['enter', 'space'] }]);
    tok++; stopVoice(); sfx('tap'); foot.innerHTML = '';
  }

  // ========== 1 嗨！這是颱風：點颱風叫醒它 ==========
  const ch1 = () => chapter(1, c => {
    S('rect', { x: 0, y: 0, width: 400, height: 370, class: 's-ocean' }); waves(18, 20, 360);
    const ty = makeTy(null, 92, { spin: 6 }); ty.set(205, 190); ty.g.style.opacity = .45;
    lab('lab.name', 205, 330, 18); lab('lab.sea', 330, 46, 15);
    let n = 0; loop(dt => ty.step(dt));
    const poke = () => {
      if (!c.live || n >= 3) return;
      n++; ty.spin = 6 + n * 40; ty.g.style.opacity = .45 + n * .18; sfx('pop');
      const s0 = ty.s; tween(.25, k => ty.set(205, 190, s0 + Math.sin(k * Math.PI) * .08));
      if (n < 3) c.say('more'); else c.finish();
    };
    c.svg.addEventListener('pointerdown', e => { const p = pt(e); if (Math.hypot(p.x - 205, p.y - 190) < 130) poke(); });
    c.onKey = k => { if (k === 'space' || k === 'enter') poke(); else return false; };
    c.test = () => { while (n < 3) { c.live = true; poke(); } };
  });

  // ========== 2 颱風怎麼生出來：點太陽把海水曬熱 ==========
  const ch2 = () => chapter(2, c => {
    S('rect', { x: 0, y: 0, width: 400, height: 215, class: 's-sky' });
    S('rect', { x: -2, y: 212, width: 404, height: 160, class: 's-ocean' });
    const warm = S('rect', { x: -2, y: 212, width: 404, height: 160, style: 'fill:url(#warmg)', opacity: 0 });
    waves(8, 230, 360);
    const sunG = S('g', { transform: 'translate(70,70)' });
    const ring = S('circle', { r: 46, fill: 'none', style: 'stroke:var(--sun)', 'stroke-width': 3, opacity: .6 }, sunG);
    for (let i = 0; i < 10; i++) { const a = i * Math.PI / 5; S('line', { x1: Math.cos(a) * 40, y1: Math.sin(a) * 40, x2: Math.cos(a) * 52, y2: Math.sin(a) * 52, style: 'stroke:var(--sun)', 'stroke-width': 4, 'stroke-linecap': 'round' }, sunG); }
    S('circle', { r: 32, class: 's-sun' }, sunG);
    S('rect', { x: 344, y: 40, width: 18, height: 140, rx: 9, class: 's-labbg' });
    const merc = S('rect', { x: 349, y: 150, width: 8, height: 20, rx: 4, class: 's-barf' });
    S('circle', { cx: 353, cy: 184, r: 13, class: 's-barf' });
    const tt = S('text', { x: 336, y: 110, 'font-size': 20, 'text-anchor': 'end', class: 't' });
    const clouds = S('g', { transform: 'translate(200,140) scale(0)' });
    [[-46, 8, 26], [-18, -8, 32], [16, -14, 34], [46, 4, 26], [0, 14, 30], [-30, -34, 22], [24, -44, 24], [0, -62, 22]].forEach(([x, y, r]) => S('circle', { cx: x, cy: y, r, class: 's-cloud' }, clouds));
    let temp = 24, cs = 0, vap = [], formed = null;
    const show = () => { tt.textContent = temp + '°C'; const h = 20 + (temp - 24) * 28; merc.setAttribute('y', 170 - h); merc.setAttribute('height', h); warm.setAttribute('opacity', Math.max(0, (temp - 24) * .25)); }; show();
    loop(dt => {
      ring.setAttribute('r', 46 * (1 + Math.sin(performance.now() / 300) * .06));
      if (temp >= 26 && !formed && Math.random() < dt * (temp - 25) * 5) { const x = 40 + Math.random() * 320; vap.push({ e: S('circle', { cx: x, cy: 214, r: 3 + Math.random() * 3, class: 's-cloud', opacity: .8 }), x, y: 214, t: 0 }); }
      for (const v of vap) { v.t += dt; v.y -= dt * 55; v.x += Math.sin(v.t * 4) * .6 + (200 - v.x) * dt * .5; v.e.setAttribute('cx', v.x); v.e.setAttribute('cy', v.y); v.e.setAttribute('opacity', Math.max(0, .8 - v.t * .4)); }
      vap = vap.filter(v => { if (v.y < 150) { v.e.remove(); return false; } return true; });
      const target = temp < 26 ? 0 : (temp - 25) / 3; cs += (target - cs) * dt * 1.5;
      if (!formed) clouds.setAttribute('transform', `translate(200,140) scale(${cs.toFixed(3)})`); else formed.step(dt);
    });
    const heat = () => {
      if (!c.live || temp >= 28) return;
      temp++; show(); sfx('pop');
      if (temp < 27) c.say('hot');
      else if (temp === 27) c.say('cloud');
      else {
        c.live = false;
        later(1400, () => {
          formed = makeTy(null, 62, { spin: 70 }); formed.set(200, 120, .2);
          tween(1.2, k => { clouds.setAttribute('opacity', 1 - k); formed.set(200, 120, .2 + .8 * k); }, () => { c.live = true; c.finish(); });
        });
      }
    };
    c.svg.addEventListener('pointerdown', e => { const p = pt(e); if (Math.hypot(p.x - 70, p.y - 70) < 70) heat(); });
    c.onKey = k => { if (k === 'space' || k === 'enter') heat(); else return false; };
    c.test = () => { while (temp < 28) { c.live = true; heat(); } };
  });

  // ========== 3 為什麼會轉：地球轉，風就往右彎；換你逆時針畫圈 ==========
  const ch3 = () => chapter(3, c => {
    const C = [200, 190];
    S('rect', { x: 0, y: 0, width: 400, height: 370, class: 's-deep' });
    S('circle', { cx: C[0], cy: C[1], r: 22, fill: 'none', style: 'stroke:var(--sun)', 'stroke-width': 3, 'stroke-dasharray': '4 5' });
    const emptyL = lab('lab.empty', C[0], C[1] + 48, 15);
    const eg = S('g', { transform: 'translate(52,52)' });
    S('circle', { r: 28, class: 's-ocean2' }, eg); S('path', { d: 'M-14,-18c8,2 10,10 4,16s2,14 8,14M6,-24c4,8 14,6 18,14', fill: 'none', style: 'stroke:var(--land)', 'stroke-width': 6, 'stroke-linecap': 'round' }, eg);
    const egR = S('path', { d: 'M-34,10a36,14 0 0 0 68,0', fill: 'none', style: 'stroke:var(--sun)', 'stroke-width': 3, 'stroke-linecap': 'round', opacity: 0 }, eg);
    lab('lab.earth', 52, 106, 14);
    const pg = S('g', {}); let P_ = [];
    const spawn = q => { const a = Math.random() * Math.PI * 2, r = 175; q.x = C[0] + Math.cos(a) * r; q.y = C[1] + Math.sin(a) * r; q.vx = -Math.cos(a) * 50; q.vy = -Math.sin(a) * 50; q.tr = []; };
    for (let i = 0; i < 34; i++) { const q = { e: S('polyline', { fill: 'none', style: 'stroke:var(--cloudc)', 'stroke-width': 3, 'stroke-linecap': 'round', opacity: .8 }, pg) }; spawn(q); const kk = Math.random() * 3; for (let j = 0; j < kk * 20; j++) { q.x += q.vx * .05; q.y += q.vy * .05; } P_.push(q); }
    let spinOn = false, phase = 1, ty = null, acc = 0, lastA = null, dragging = false, hint = null;
    loop(dt => {
      if (P_.length) {
        const f = spinOn ? 2.2 : 0;
        for (const q of P_) {
          const dx = C[0] - q.x, dy = C[1] - q.y, d = Math.hypot(dx, dy) || 1;
          q.vx += (dx / d * 40 + f * (-q.vy)) * dt; q.vy += (dy / d * 40 + f * (q.vx)) * dt;
          const sp = Math.hypot(q.vx, q.vy); if (sp > 95) { q.vx *= 95 / sp; q.vy *= 95 / sp; }
          q.x += q.vx * dt; q.y += q.vy * dt; q.tr.push(q.x.toFixed(1) + ',' + q.y.toFixed(1)); if (q.tr.length > 9) q.tr.shift();
          q.e.setAttribute('points', q.tr.join(' '));
          if (d < 26 || d > 230) spawn(q);
        }
      }
      if (spinOn) egR.setAttribute('transform', `rotate(${(performance.now() / 20) % 360} 0 0)`);
      if (ty && !dragging) ty.step(dt);
    });
    const toggle = () => {
      if (phase !== 1) return;
      spinOn = !spinOn; btn.innerHTML = Z(spinOn ? 'c3.btnOff' : 'c3.btnOn'); egR.setAttribute('opacity', spinOn ? 1 : 0);
      c.say(spinOn ? 'curve' : 'straight');
      if (spinOn) { phase = 1.5; later(3800, startSpin); }
    };
    const btn = c.btn('c3.btnOn', toggle, 'go');
    c.onKey = k => { if ((k === 'space' || k === 'enter') && phase === 1) toggle(); else if (phase === 2 && (k === 'left' || k === 'a')) turn(-.5); else if (phase === 2 && (k === 'right' || k === 'd')) turn(.5); else return false; };
    function turn(da) {
      acc += da; ty.ang += da * 180 / Math.PI; ty.rot.setAttribute('transform', `rotate(${ty.ang.toFixed(1)})`);
      if (acc > Math.PI * 1.2) { acc = 0; sfx('no'); c.say('wrong'); }
      if (acc < -Math.PI * 3.6) { dragging = false; ty.spin = 90; if (hint) hint.remove(); phase = 3; c.finish(); }
    }
    function startSpin() {
      phase = 2; btn.remove();
      tween(.8, k => pg.setAttribute('opacity', 1 - k), () => { pg.remove(); P_ = []; });
      emptyL.g.remove();
      ty = makeTy(null, 120, { spin: 0 }); ty.set(C[0], C[1], .1); tween(.8, k => ty.set(C[0], C[1], .1 + .9 * k));
      hint = S('g', { opacity: .9 });
      S('path', { d: `M${C[0] + 150},${C[1]} A150,150 0 0 0 ${C[0]},${C[1] - 150}`, fill: 'none', style: 'stroke:var(--sun)', 'stroke-width': 5, 'stroke-linecap': 'round', 'stroke-dasharray': '2 12' }, hint);
      S('path', { d: `M${C[0] + 12},${C[1] - 160} L${C[0] - 4},${C[1] - 150} L${C[0] + 12},${C[1] - 139}`, fill: 'none', style: 'stroke:var(--sun)', 'stroke-width': 5, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, hint);
      c.say('task2');
      c.svg.classList.add('drag');
    }
    c.svg.addEventListener('pointerdown', e => { if (phase !== 2 || !c.live) return; dragging = true; const p = pt(e); lastA = Math.atan2(p.y - C[1], p.x - C[0]); try { c.svg.setPointerCapture(e.pointerId); } catch (_) { /* ignore */ } });
    c.svg.addEventListener('pointermove', e => {
      if (!dragging || phase !== 2) return; const p = pt(e); const a = Math.atan2(p.y - C[1], p.x - C[0]); let da = a - lastA;
      if (da > Math.PI) da -= 2 * Math.PI; if (da < -Math.PI) da += 2 * Math.PI; lastA = a;
      if (Math.hypot(p.x - C[0], p.y - C[1]) < 14) return;
      turn(da);
    });
    const up = () => { dragging = false; };
    c.svg.addEventListener('pointerup', up); c.svg.addEventListener('pointercancel', up);
    c.test = () => { if (phase === 1) { toggle(); } setTimeout(() => { if (phase === 1.5) startSpin(); turn(-Math.PI * 4); }, 80); };
  });

  // ========== 4 長什麼樣子：點颱風眼、眼牆、雨帶 ==========
  const ch4 = () => chapter(4, c => {
    const C = [200, 185];
    S('rect', { x: 0, y: 0, width: 400, height: 370, class: 's-deep' }); waves(14, 10, 360);
    const ty = makeTy(null, 150, { spin: 14 }); ty.set(C[0], C[1]);
    const hl = S('g', {});
    const tw = S('g', { opacity: 0 });
    S('circle', { cx: C[0], cy: C[1], r: 140, class: 's-ring' }, tw);
    S('path', { d: 'M' + LAND.tw.map(([lo, la]) => [(C[0] + (lo - 121) * 50.9).toFixed(1), (C[1] + (23.6 - la) * 55.5).toFixed(1)].join(',')).join('L') + 'Z', class: 's-tw' }, tw);
    lab('lab.storm', C[0] + 80, C[1] - 118, 14, { parent: tw }); lab('lab.tw', C[0] - 74, C[1] + 30, 15, { parent: tw });
    const found = new Set();
    loop(dt => ty.step(dt));
    const mark = k => {
      if (k === 'eye') { S('circle', { cx: C[0], cy: C[1], r: 15, class: 's-hl' }, hl); lab('lab.eye', C[0], C[1] + 48, 15, { parent: hl }); }
      if (k === 'wall') { S('circle', { cx: C[0], cy: C[1], r: 34, class: 's-hl', 'stroke-width': 14, opacity: .45 }, hl); lab('lab.wall', C[0] + 92, C[1] - 52, 15, { parent: hl }); }
      if (k === 'band') { S('circle', { cx: C[0], cy: C[1], r: 105, class: 's-hl', 'stroke-dasharray': '8 8' }, hl); lab('lab.band', C[0] - 112, C[1] + 128, 15, { parent: hl }); }
    };
    const hit = k => {
      if (!c.live) return;
      if (!found.has(k)) { found.add(k); mark(k); sfx('ok'); } else sfx('tap');
      if (found.size === 3) { c.live = false; say(c.key(k)).then(() => { c.live = true; c.finish(); }); }
      else c.say(k);
    };
    c.svg.addEventListener('pointerdown', e => { const p = pt(e), d = Math.hypot(p.x - C[0], p.y - C[1]); const k = d < 22 ? 'eye' : d < 52 ? 'wall' : d < 165 ? 'band' : null; if (k) hit(k); });
    c.btn('c4.btnTw', function () { const on = tw.getAttribute('opacity') === '0'; tw.setAttribute('opacity', on ? 1 : 0); this.classList.toggle('on', on); if (on) c.say('tw'); });
    const order = ['eye', 'wall', 'band'];
    c.onKey = k => { if (k === 'space' || k === 'enter') { const nx = order.find(x => !found.has(x)); if (nx) hit(nx); } else return false; };
    c.test = () => { order.forEach(k => { found.add(k); mark(k); }); c.finish(); };
  });

  // ========== 5 為什麼會走：水流帶著樹葉走 ==========
  const ch5 = () => chapter(5, c => {
    S('rect', { x: 0, y: 0, width: 400, height: 370, class: 's-ocean2' });
    const sg = S('g', {}); const ST = [];
    for (let i = 0; i < 34; i++) ST.push({ e: S('line', { class: 's-rain', opacity: .5 }, sg), x: Math.random() * 400, y: Math.random() * 370, l: 10 + Math.random() * 16 });
    const stars = [[92, 290], [92, 64], [306, 52]].map(([x, y]) => { const g = S('g', { transform: `translate(${x},${y})` }); S('path', { d: 'M0,-20L5.9,-8.1L19,-6.2L9.5,3.1L11.8,16.2L0,10L-11.8,16.2L-9.5,3.1L-19,-6.2L-5.9,-8.1Z', class: 's-star' }, g); return { g, x, y, got: false }; });
    const leaf = S('g', {}); S('path', { d: 'M-20,0C-10,-12 10,-12 22,0C10,12 -10,12 -20,0Z', class: 's-leaf' }, leaf); S('path', { d: 'M-20,0L22,0', stroke: '#2F6B24', 'stroke-width': 1.5 }, leaf);
    const L = { x: 318, y: 290 }; let dir = [-1, 0], got = 0, ang = 180;
    const box = document.createElement('div'); box.className = 'ty-arrows';
    const btns = [];
    const setDir = (dx, dy) => { const d = Math.hypot(dx, dy) || 1; dir = [dx / d, dy / d]; btns.forEach(b => b.classList.toggle('on', b.dataset.d === dx + ',' + dy)); };
    loop(dt => {
      const go = c.live || c.done;
      for (const s of ST) {
        s.x += dir[0] * 90 * dt; s.y += dir[1] * 90 * dt; if (s.x < -20) s.x = 420; if (s.x > 420) s.x = -20; if (s.y < -20) s.y = 390; if (s.y > 390) s.y = -20;
        s.e.setAttribute('x1', s.x); s.e.setAttribute('y1', s.y); s.e.setAttribute('x2', s.x - dir[0] * s.l); s.e.setAttribute('y2', s.y - dir[1] * s.l);
      }
      if (got < 3 && go) { L.x = Math.min(360, Math.max(40, L.x + dir[0] * 70 * dt)); L.y = Math.min(330, Math.max(40, L.y + dir[1] * 70 * dt)); }
      const ta = Math.atan2(dir[1], dir[0]) * 180 / Math.PI; const da = ((ta - ang + 540) % 360) - 180; ang += da * Math.min(1, dt * 5);
      leaf.setAttribute('transform', `translate(${L.x.toFixed(1)},${L.y.toFixed(1)}) rotate(${ang.toFixed(1)})`);
      for (const s of stars) {
        if (!s.got && Math.hypot(s.x - L.x, s.y - L.y) < 30) {
          s.got = true; got++; sfx('ok');
          tween(.4, k => s.g.setAttribute('transform', `translate(${s.x},${s.y}) scale(${1 + k})`), () => s.g.remove());
          if (got < 3) c.say('star'); else c.finish();
        }
      }
    });
    [[0, -1, 0, '1/2', 'up'], [-1, 0, -90, '2/1', 'left'], [1, 0, 90, '2/3', 'right'], [0, 1, 180, '3/2', 'down']].forEach(([dx, dy, a, area, k]) => {
      const b = document.createElement('button'); b.innerHTML = ARW(a); b.dataset.d = dx + ',' + dy; b.setAttribute('aria-label', { up: '上', left: '左', right: '右', down: '下' }[k]);
      b.style.gridArea = area; b.addEventListener('click', () => { if (c.live) { sfx('tap'); setDir(dx, dy); } }); box.appendChild(b); btns.push(b);
    });
    c.ctrl.appendChild(box); setDir(-1, 0);
    c.svg.addEventListener('pointerdown', e => { if (!c.live) return; const p = pt(e); const dx = p.x - L.x, dy = p.y - L.y; if (Math.hypot(dx, dy) < 8) return; const d = Math.hypot(dx, dy); dir = [dx / d, dy / d]; btns.forEach(b => b.classList.remove('on')); });
    c.onKey = k => { const m = { up: [0, -1], w: [0, -1], left: [-1, 0], a: [-1, 0], right: [1, 0], d: [1, 0], down: [0, 1], s: [0, 1] }[k]; if (m) setDir(...m); else return false; };
    c.test = () => { stars.forEach(s => { L.x = s.x; L.y = s.y; }); stars.forEach(s => { if (!s.got) { s.got = true; got++; } }); c.finish(); };
  });

  // ========== 6 颱風通常怎麼走：太平洋高氣壓推著走 ==========
  // 「常走的路」：從關島附近的大海往西北，到臺灣東邊，再往北轉（示意）
  const TYPICAL = [[146, 12.5], [139, 15], [131.6, 18.5], [126, 21.6], [123.4, 23.8], [124.3, 26.4], [126.8, 30], [129.8, 33.8]];
  const ch6 = () => chapter(6, c => {
    bigMap();
    lab('lab.pac', P(141, 19.5)[0], P(141, 19.5)[1], 14, { bg: false });
    const hp = S('ellipse', { class: 's-hp' });
    const hpL = lab('lab.hp', 0, 0, 14);
    const SZ = { big: [140, 25.5, 15, 9.5], mid: [143, 27.5, 10.5, 6.6], small: [146.5, 30, 6.5, 4.6] };
    let hs = SZ.mid.slice();
    const drawHp = () => { const [x, y] = P(hs[0], hs[1]); hp.setAttribute('cx', x); hp.setAttribute('cy', y); hp.setAttribute('rx', hs[2] * 11.1); hp.setAttribute('ry', hs[3] * 12.3); hpL.x = x; hpL.y = y + 5; drawLab(hpL); }; drawHp();
    const ROUTE = {
      big: [[131.6, 17.7], [126.5, 20.4], [122.3, 22.4], [119.2, 23.8], [116.3, 24.8]],
      mid: [[131.6, 17.7], [123.6, 23.6], [124.3, 25.6], [126.6, 29.6], [129.6, 34]],
      small: [[131.6, 17.7], [130.6, 21.5], [131.6, 25.6], [134.6, 29.8], [138.4, 33.6]],
    };
    const start = P(131.6, 17.7);
    const ty = makeTy(null, 16, { spin: 120, soft: false }); ty.set(...start); loop(dt => ty.step(dt));
    let prev = null, trail = null, busy = false, realBtn = null;
    const tried = new Set();
    const tryIt = (k, b) => {
      if (busy) return; busy = true; tried.add(k);
      [...c.ctrl.querySelectorAll('.ty-pill')].forEach(x => x.classList.toggle('on', x === b));
      if (prev) prev.remove(); if (trail) trail.remove();
      const from = hs.slice(), to = SZ[k];
      tween(.6, q => { hs = from.map((v, i) => v + (to[i] - v) * q); drawHp(); }, () => {
        prev = pathOn(ROUTE[k].map(p => P(...p))); prev.setAttribute('opacity', .85);
        trail = drawAlong(prev, 2.2, ty, false, () => {
          busy = false;
          if (tried.size >= 2 && !realBtn) { realBtn = c.btn('c6.btnReal', real, 'go'); c.say('task2'); }
        });
        c.say(k);
      });
    };
    const bB = c.btn('c6.btnBig', function () { tryIt('big', this); });
    const bM = c.btn('c6.btnMid', function () { tryIt('mid', this); });
    const bS = c.btn('c6.btnSmall', function () { tryIt('small', this); });
    function real() {
      if (busy) return; busy = true; if (prev) prev.remove(); if (trail) trail.remove();
      const from = hs.slice(), to = SZ.mid; tween(.5, q => { hs = from.map((v, i) => v + (to[i] - v) * q); drawHp(); });
      const pts = TYPICAL.map(([lo, la]) => P(lo, la)); ty.set(...pts[0]);
      drawAlong(pathOn(pts), 3.6, ty, false, () => { busy = false; c.finish(); });
    }
    c.onKey = k => { if (k === '1') tryIt('big', bB); else if (k === '2') tryIt('mid', bM); else if (k === '3') tryIt('small', bS); else if ((k === 'enter' || k === 'space') && realBtn) real(); else return false; };
    c.test = () => { c.finish(); };
  });

  // ========== 7 颱風來了，怎麼辦：防颱小任務 ==========
  const ch7 = () => chapter(7, c => {
    S('rect', { x: 0, y: 0, width: 400, height: 370, class: 's-ocean' }); waves(12, 10, 360);
    S('path', { d: 'M' + LAND.tw.map(p => PZ(...p).map(v => v.toFixed(1)).join(',')).join('L') + 'Z', class: 's-land' });
    S('path', { d: 'M' + [[121.45, 24.9], [121.25, 24.2], [121.1, 23.5], [120.95, 22.9], [120.85, 22.4]].map(p => PZ(...p).map(v => v.toFixed(1)).join(',')).join('L'), fill: 'none', style: 'stroke:var(--mount)', 'stroke-width': 9, 'stroke-linecap': 'round' });
    const [tx, ty0] = PZ(123.6, 23.6);
    S('circle', { cx: tx, cy: ty0, r: 157, class: 's-ring' });
    const ty = makeTy(null, 62, { spin: 70 }); ty.set(tx, ty0);
    const rg = S('g', {}); const R = [];
    for (let i = 0; i < 40; i++) { const [a, b] = PZ(121.2 + Math.random() * 1.2, 23.6 + Math.random() * 1.7); R.push({ e: S('line', { class: 's-rain' }, rg), x: a, y: b, y0: b - 30, t: Math.random() }); }
    [[121.56, 25.04, 'lab.tpe', -30, 4], [121.75, 24.75, 'lab.yl', 32, 10], [121.6, 23.98, 'lab.hl', 30, 12], [120.2, 23.0, 'lab.tn', -30, 4]].forEach(([lo, la, s, dx, dy]) => { const [x, y] = PZ(lo, la); S('circle', { cx: x, cy: y, r: 4, class: 's-ink' }); lab(s, x + dx, y + dy, 14); });
    loop(dt => { ty.step(dt); for (const r of R) { r.t += dt * 1.6; if (r.t > 1) r.t -= 1; const y = r.y0 + r.t * 40, x = r.x - r.t * 10; r.e.setAttribute('x1', x); r.e.setAttribute('y1', y); r.e.setAttribute('x2', x - 3); r.e.setAttribute('y2', y + 9); r.e.setAttribute('opacity', (1 - r.t) * .9); } });
    const GOOD = [1, 0, 1, 1, 0, 0];
    let i = 0, lock = false, shown = false;
    const show = () => {
      c.ctrl.innerHTML = '';
      const tc = document.createElement('div'); tc.className = 'ty-tcard';
      tc.innerHTML = `<svg viewBox="0 0 64 64" aria-hidden="true">${CARDPIC[i]}</svg><div class="tt">${Z('c7.k' + (i + 1))}</div>`;
      c.ctrl.appendChild(tc);
      const yes = c.btn('c7.good', () => answer(1), 'yes'); yes.insertAdjacentHTML('afterbegin', '<kbd class="kc">A</kbd>');
      const no = c.btn('c7.bad', () => answer(0), 'no'); no.insertAdjacentHTML('afterbegin', '<kbd class="kc">B</kbd>');
      if (shown) say('c7.k' + (i + 1));
      shown = true;
    };
    const answer = g => {
      if (lock || !c.live) return;
      if (g === GOOD[i]) {
        sfx('ok'); lock = true;
        say('c7.a' + (i + 1)).then(() => { lock = false; i++; if (i < 6) show(); else { c.ctrl.innerHTML = ''; c.finish(); } });
      } else { sfx('no'); say('g.again'); }
    };
    show();
    // 故事唸完、說完任務後，唸第一張卡
    const t0 = setInterval(() => { if (c.live) { clearInterval(t0); setTimeout(() => { if (i === 0 && !lock) say('c7.k1'); }, FAST ? 0 : 2600); } }, 100);
    c.onKey = k => { if (k === 'a') answer(1); else if (k === 'b') answer(0); else return false; };
    c.test = () => { i = 6; c.finish(); };
  });

  // ========== 8 經過臺灣以後：往北轉去日本（示意） ==========
  const ch8 = () => chapter(8, c => {
    bigMap();
    const back = TYPICAL.slice(0, 5).map(([lo, la]) => P(lo, la));
    pathOn(back);
    const NEXT = [[123.4, 23.8], [124.6, 26.2], [126.8, 30], [130.2, 33.6]];
    const ty = makeTy(null, 16, { spin: 120, soft: false }); ty.set(...back[4]); loop(dt => ty.step(dt));
    let step = 0, busy = false;
    const place = [['lab.oki', P(129.3, 26.0), 14], ['lab.ecs', P(124.2, 30.8), 14], ['lab.kyu', P(132.6, 31.6), 14]];
    const go = () => {
      if (busy || step >= 3 || !c.live) return; busy = true;
      const a = NEXT[step], z = NEXT[step + 1];
      const seg = pathOn([P(a[0], a[1]), P(z[0], z[1])]);
      sfx('tap');
      drawAlong(seg, 1.6, ty, true, () => {
        busy = false;
        const [s, pp, sz] = place[step]; lab(s, pp[0], pp[1], sz);
        step++; c.say('p' + step);
        if (step === 2) { const [px, py] = P(134.5, 33.2); const pg = S('g', { transform: `translate(${px},${py}) scale(1.3)` }); S('g', {}, pg).innerHTML = ICON[7].replace('currentColor', 'var(--ink)'); S('line', { x1: 0, y1: 22, x2: 24, y2: 0, style: 'stroke:var(--alert)', 'stroke-width': 3 }, pg); lab('lab.plane', px + 48, py + 38, 12); }
        if (step === 3) { const [x, y] = P(z[0], z[1]); tween(1, k => { ty.set(x, y, 1 - k * .35); ty.g.style.opacity = 1 - k * .4; }); b.remove(); c.live = false; say(c.key('p3')).then(() => { c.live = true; c.finish(); }); }
      });
    };
    const b = c.btn('c8.btn', go, 'go');
    c.onKey = k => { if (k === 'space' || k === 'enter') go(); else return false; };
    c.test = () => { c.finish(); };
  });

  // ========== 9 颱風怎麼會消失：拖去冷海或陸地 ==========
  const ch9 = () => chapter(9, c => {
    S('rect', { x: 0, y: 0, width: 400, height: 370, class: 's-ocean' });
    S('rect', { x: 150, y: 115, width: 250, height: 255, style: 'fill:url(#warmr)' });
    S('rect', { x: 0, y: 0, width: 400, height: 115, class: 's-cold' });
    waves(10, 130, 360);
    S('path', { d: 'M0,115H150V370H0Z', class: 's-land' });
    [[30, 230, 40], [78, 190, 52], [118, 250, 36], [54, 300, 34]].forEach(([x, y, h]) => S('path', { d: `M${x - h * .8},${y + h * .4}L${x},${y - h * .6}L${x + h * .8},${y + h * .4}Z`, class: 's-mount' }));
    lab('lab.cold', 200, 62, 16); lab('lab.land', 75, 152, 16); lab('lab.warm', 290, 150, 16);
    lab('lab.power', 190, 352, 14, { bg: false });
    S('rect', { x: 222, y: 336, width: 162, height: 20, rx: 10, class: 's-bar' });
    const bar = S('rect', { x: 225, y: 339, width: 100, height: 14, rx: 7, class: 's-barf' });
    let E = 70, pos = [290, 250], drag = false, zone = 'warm', off = [0, 0], ended = false;
    const ty = makeTy(null, 60, { spin: 90 });
    const keys = {};
    c.svg.classList.add('drag');
    const zoneOf = ([x, y]) => y < 115 ? 'cold' : x < 150 ? 'land' : 'warm';
    loop(dt => {
      if (ended) return;
      const kx = (keys.right || keys.d ? 1 : 0) - (keys.left || keys.a ? 1 : 0), ky = (keys.down || keys.s ? 1 : 0) - (keys.up || keys.w ? 1 : 0);
      if (c.live && (kx || ky)) pos = [Math.min(372, Math.max(28, pos[0] + kx * 140 * dt)), Math.min(320, Math.max(28, pos[1] + ky * 140 * dt))];
      const z = zoneOf(pos);
      if (z !== zone) { zone = z; if (c.live) { sfx(z === 'warm' ? 'pop' : 'tap'); c.say(z); } }
      if (c.live) { E += (z === 'warm' ? 16 : z === 'cold' ? -22 : -30) * dt; E = Math.max(0, Math.min(100, E)); }
      bar.setAttribute('width', Math.max(0, E / 100 * 156));
      ty.spin = 30 + E * 1.2; ty.step(dt); ty.set(pos[0], pos[1], .3 + E / 100 * .75); ty.g.style.opacity = .35 + E / 100 * .65;
      if (E <= 0) {
        ended = true; c.svg.classList.remove('drag');
        const cg = S('g', { transform: `translate(${pos[0]},${pos[1]})`, opacity: 0 });
        S('path', { d: 'M-30,12h60a14,14 0 0 0 0-28a22,22 0 0 0-42,4a14,14 0 0 0-18,24z', class: 's-cloud', opacity: .85 }, cg);
        tween(1, k => { ty.g.style.opacity = (1 - k) * .35; cg.setAttribute('opacity', k); }, () => c.finish());
      }
    });
    c.svg.addEventListener('pointerdown', e => { if (ended || !c.live) return; const p = pt(e); const r = 20 + E * .45; if (Math.hypot(p.x - pos[0], p.y - pos[1]) > r + 30) return; drag = true; off = [pos[0] - p.x, pos[1] - p.y]; try { c.svg.setPointerCapture(e.pointerId); } catch (_) { /* ignore */ } });
    c.svg.addEventListener('pointermove', e => { if (!drag) return; const p = pt(e); pos = [Math.min(372, Math.max(28, p.x + off[0])), Math.min(320, Math.max(28, p.y + off[1]))]; });
    const up = () => { drag = false; };
    c.svg.addEventListener('pointerup', up); c.svg.addEventListener('pointercancel', up);
    const kd = ev => { const k = keyName(ev); if (['up', 'down', 'left', 'right', 'w', 'a', 's', 'd'].includes(k)) { keys[k] = true; ev.preventDefault(); } };
    const ku = ev => { const k = keyName(ev); if (k) keys[k] = false; };
    addEventListener('keydown', kd); addEventListener('keyup', ku);
    c.test = () => { pos = [200, 60]; E = 0; };
  });

  // ========== 10 颱風小博士：考考你（選 A／B） ==========
  async function ch10() {
    stage.innerHTML = '<div class="ty"><svg class="ty-sv" viewBox="0 0 400 370"></svg></div>';
    const svg = $('.ty-sv'); SV.reset(svg);
    S('rect', { x: 0, y: 0, width: 400, height: 370, class: 's-sky' });
    const ring = S('g', { transform: 'translate(200,185)' });
    for (let i = 0; i < 9; i++) {
      const a = -Math.PI / 2 + i * 2 * Math.PI / 9, x = Math.cos(a) * 138, y = Math.sin(a) * 138;
      const g = S('g', { transform: `translate(${x.toFixed(1)},${y.toFixed(1)})` }, ring);
      S('circle', { r: 22, style: 'fill:var(--alert)' }, g);
      const ig = S('g', { transform: 'translate(-12,-12)', style: 'color:#fff' }, g); ig.innerHTML = ICON[i];
    }
    const ty = makeTy(null, 62, { spin: 50 }); ty.set(200, 170); loop(dt => ty.step(dt));
    lab('lab.dr', 200, 272, 22);
    for (const s of ['c10.s1', 'c10.s2', 'c10.s3']) await say(s);
    const QS = [['c10.q1', 'c10.a1a', 'c10.a1b', 0], ['c10.q2', 'c10.a2a', 'c10.a2b', 1], ['c10.q3', 'c10.a3a', 'c10.a3b', 1], ['c10.q4', 'c10.a4a', 'c10.a4b', 1]];
    const tyArt = '<svg viewBox="-60 -60 120 120"><circle r="54" fill="#CFE5F4"/><g fill="#fff" opacity=".95"><path d="M0-40C24-40 40-20 36 4 30-18 14-26 0-24z"/><path d="M40 0C40 24 20 40-4 36 18 30 26 14 24 0z"/><path d="M0 40C-24 40-40 20-36-4-30 18-14 26 0 24z"/><path d="M-40 0C-40-24-20-40 4-36-18-30-26-14-24 0z"/></g><circle r="14" fill="#fff"/><circle r="5" fill="#2E6A98"/></svg>';
    for (const [q, a, b, right] of QS) {
      await G.quiz({ q, show: tyArt, noShuffle: true, opts: [{ text: a, ok: right === 0 }, { text: b, ok: right === 1 }], ok: 'c10.right' });
    }
    await say('c10.ok');
  }

  // ---------- 結尾 ----------
  async function finale() {
    G.sayBox.hidden = false;
    stage.innerHTML = '<div class="center"><div class="stamp">颱風<br>博士</div><div class="chtitle">' + G.Zs('fin.title') + '</div>' +
      '<div class="ftxt">' + Z('fin.task') + '</div></div>';
    G.parent('這個遊戲講一般的颱風：在熱熱的海上生成、北半球逆時針轉、颱風眼與眼牆、被駛流與太平洋高氣壓推著走、秋天容易在臺灣東邊轉向、遇到冷海或陸地就減弱。第 1 關的「薔琵」（2026 年，名字由寮國提供，一種香花）只是當例子。地圖是示意，不是真實比例；颱風的實際路線請看中央氣象署。資料來源：中央氣象署〈颱風百科〉與颱風警報說明、香港天文台〈熱帶氣旋名字的意思〉。');
    sfx('win');
    await say('fin.hi');
    await speak('fin.task');
  }

  G.run({
    saveKey: 'typhoon-game-v1',
    stamp: '颱風',
    heroArt: '<svg viewBox="-60 -60 120 120"><circle r="56" fill="#4D97CB"/><g fill="#fff" opacity=".95"><path d="M0-40C24-40 40-20 36 4 30-18 14-26 0-24z"/><path d="M40 0C40 24 20 40-4 36 18 30 26 14 24 0z"/><path d="M0 40C-24 40-40 20-36-4-30 18-14 26 0 24z"/><path d="M-40 0C-40-24-20-40 4-36-18-30-26-14-24 0z"/></g><circle r="14" fill="#fff"/><circle r="5" fill="#2E6A98"/></svg>',
    chapters: [ch1, ch2, ch3, ch4, ch5, ch6, ch7, ch8, ch9, ch10],
    finale,
  });

  window.__ty = { win: () => { if (winNow) winNow(); } };
})();
