// 小水滴變變變：十關。文字在 content.js（由 tools/build.py 產生）、插圖在 art.js、
// 粒子放大鏡在 particles.js（window.P）、柔和音效在 sound.js（覆寫 G.sfx、加上 G.note）、共用引擎在 engine.js。
(() => {
  'use strict';
  const A = window.A, P = window.P;
  const { $, stage, foot, sayBox, sleep, shuffle, shake, Z, speak, say, tip, waitAction, next, dragPick, home, holdLoop, track, onKeys, clamp } = G;
  const sfx = (n, v) => G.sfx(n, v);
  const note = (i, v) => G.note && G.note(i, v);
  const FAST = /[?&]fast=1/.test(location.search);
  const kc = k => '<kbd class="kc">' + k + '</kbd>';
  const show = () => { sayBox.hidden = false; sayBox.classList.remove('wg-faded'); foot.innerHTML = ''; };
  const all = s => [...stage.querySelectorAll(s)];

  // ---------- 提示：同色呼吸光暈；5 秒沒動作變亮；15 秒出現手勢示範 ----------
  let lastAct = performance.now();
  const act = () => { lastAct = performance.now(); };
  addEventListener('pointerdown', act, true);
  addEventListener('pointermove', ev => { if (ev.buttons) act(); }, true);
  addEventListener('keydown', act, true);
  function handAt(el, motion = 'tap') {
    const h = document.createElement('div');
    h.className = 'wg-hand ' + motion;
    h.innerHTML = A.hand();
    const r = el.getBoundingClientRect(), s = stage.getBoundingClientRect();
    h.style.left = (r.left - s.left + r.width / 2) + 'px';
    h.style.top = (r.top - s.top + r.height / 2) + 'px';
    stage.appendChild(h);
    return h;
  }
  function guide(els, motion = 'tap') {
    els = [].concat(els).filter(Boolean);
    const t0 = performance.now();
    els.forEach(e => e.classList.add('wg-glow'));
    let hand = null;
    const iv = setInterval(() => {
      const idle = performance.now() - Math.max(lastAct, t0);
      els.forEach(e => e.classList.toggle('wg-glow-hi', idle > 5000));
      if (idle > 15000 && !hand && els[0] && els[0].isConnected) hand = handAt(els[0], motion);
      if (idle < 15000 && hand) { hand.remove(); hand = null; }
    }, 250);
    return () => { clearInterval(iv); els.forEach(e => e.classList.remove('wg-glow', 'wg-glow-hi')); if (hand) hand.remove(); };
  }
  // 錯三次：手出來示範一次
  async function demo(el, motion = 'tap') {
    tip('g.demo');
    const h = handAt(el, motion);
    await sleep(FAST ? 60 : 1100);
    h.remove();
  }
  // 落點的果凍回彈
  function squash(el) {
    if (!el) return;
    el.classList.remove('wg-squash'); void el.offsetWidth; el.classList.add('wg-squash');
    setTimeout(() => el.classList.remove('wg-squash'), 300);
  }
  // 彈簧＋阻尼（setInterval，背景分頁也會跑完）
  function spring(set, from, to, { k = 140, d = 9 } = {}) {
    return new Promise(res => {
      let x = from, v = 0;
      const iv = setInterval(() => {
        for (let i = 0; i < 2; i++) { const dt = 1 / 120; v += (k * (to - x) - d * v) * dt; x += v * dt; }
        set(x);
        if (Math.abs(to - x) < .2 && Math.abs(v) < .8) { clearInterval(iv); set(to); res(); }
      }, 16);
    });
  }
  const mix = (a, b, t) => '#' + [0, 2, 4].map(i => Math.round(parseInt(a.substr(1 + i, 2), 16) * (1 - t) + parseInt(b.substr(1 + i, 2), 16) * t).toString(16).padStart(2, '0')).join('');

  // ---------- 每關結尾：印章＋和弦，然後一張「給家長」小卡 ----------
  async function ritual() {
    sfx('win');
    const s = document.createElement('div');
    s.className = 'wg-seal pop';
    s.innerHTML = A.drop();
    stage.appendChild(s);
    await sleep(FAST ? 60 : 1300);
  }
  async function endCard(n, art) {
    stage.innerHTML = '<div class="wg-end"><div class="wg-seal">' + art + '</div>' +
      '<div class="wg-pcard"><b class="wg-pl">' + Z('ui.parent') + '</b><div class="wg-pt">' + Z('p' + n) + '</div></div></div>';
    sfx('chord');
    await next();
  }

  // ---------- 第一關：融化（按住加熱） ----------
  async function ch1() {
    show();
    stage.innerHTML = '<div class="wg-g13"><div class="wg-row wg-stack"><div class="wg-scene wg-melt">' + A.meltScene() + '</div><div class="wg-lens" id="lens"></div></div>' +
      '<div class="wg-ctl"><button class="wg-hold warm" id="hold">' + kc('H') + '<span class="wg-hi">' + A.sun() + '</span><span class="wg-hl">' + Z('c1.heat') + '</span></button>' +
      '<div class="wg-meter"><i id="mt"></i></div></div></div>';
    const ps = P.create($('#lens'), { n: 30, solid: 1, energy: .12 });
    const cube = $('#wgCube'), pud = $('#wgPuddle'), shine = $('#wgShine'), hb = $('#hold'), mt = $('#mt');
    say('c1.goal');
    const stop = guide(hb, 'press');
    let p = 0, tk = 0, mid = false;
    await holdLoop(hb, ['h'], (dt, down) => {
      if (down) {
        p = Math.min(1, p + dt / 5);
        tk += dt;
        if (tk > .5) { tk = 0; sfx('drip', p); }
      }
      const sy = 1 - .86 * p, sx = 1 - .34 * p;
      cube.setAttribute('transform', 'translate(120 146) scale(' + sx.toFixed(3) + ' ' + sy.toFixed(3) + ') translate(-120 -146)');
      cube.setAttribute('opacity', (p > .85 ? 1 - (p - .85) / .15 : 1).toFixed(2));
      pud.setAttribute('rx', (p ? 24 + 58 * p : 0).toFixed(1)); pud.setAttribute('ry', (p ? 4 + 7 * p : 0).toFixed(1));
      shine.setAttribute('rx', (p ? 8 + 16 * p : 0).toFixed(1)); shine.setAttribute('ry', (p ? 2 + 2 * p : 0).toFixed(1));
      mt.style.width = (p * 100) + '%';
      ps.set({ solid: 1 - 1.1 * p, energy: .12 + (down ? .45 : .3) * p });
      if (!mid && p > .45) { mid = true; say('c1.mid'); }
      return p >= 1 ? 1 : 0;
    });
    stop();
    hb.disabled = true;
    sfx('ok');
    squash($('.wg-melt'));
    await say('c1.done');
    await ritual();
    await endCard(1, A.drop());
  }

  // ---------- 第二關：三種樣子（點選 A／B／C） ----------
  async function ch2() {
    show();
    const kinds = shuffle(['ice', 'water', 'steam']);
    const CFG = { ice: { solid: 1, energy: .1 }, water: { solid: 0, energy: .5 }, steam: { solid: 0, gas: 1, energy: .6 } };
    stage.innerHTML = '<div class="wg-ask" id="ask"></div><div class="wg-picks">' + kinds.map((k, i) => '<button class="wg-pick wg-touch" data-k="' + k + '">' + kc('ABC'[i]) +
      '<span class="wg-lens"></span><span class="wg-name">' + Z('w.' + k) + '</span></button>').join('') + '</div>';
    const btns = all('.wg-pick');
    const sims = btns.map(b => P.create(b.querySelector('.wg-lens'), { n: 18, ...CFG[b.dataset.k] }));
    const QS = [['c2.q1', 'ice', 'c2.ice'], ['c2.q2', 'water', 'c2.water'], ['c2.q3', 'steam', 'c2.steam']];
    const ASK = { ice: A.iceCube, water: A.drop, steam: A.evapIcon };
    for (const [q, k, msg] of QS) {
      say(q);
      $('#ask').innerHTML = ASK[k]();        // 題目也畫成圖：不看字也知道現在要找哪一種
      squash($('#ask'));
      const right = btns.findIndex(b => b.dataset.k === k);
      const stop = guide(btns.filter(b => !b.classList.contains('wg-done')));
      let miss = 0;
      for (;;) {
        const i = await waitAction(btns.map((b, j) => ({ el: b, keys: ['abc'[j]] })));
        if (i === right) break;
        miss++;
        shake(btns[i]); sfx('no');
        tip(miss >= 2 ? 'g.no2' : 'c2.wrong');
        if (miss >= 2) btns[right].classList.add('wg-hint');
        if (miss >= 3) { await demo(btns[right]); break; }
      }
      stop();
      btns[right].classList.remove('wg-hint');
      btns[right].classList.add('wg-done');
      squash(btns[right]); sfx('ok');
      await say(msg);
    }
    // 真的水蒸氣看不見：小點點淡掉，再回來
    const st = sims[btns.findIndex(b => b.dataset.k === 'steam')];
    st.set({ ghost: 1 });
    await say('c2.see');
    await sleep(FAST ? 30 : 600);
    st.set({ ghost: 0 });
    await ritual();
    await endCard(2, A.drop(A.C.blue2));
  }

  // ---------- 第三關：凝固（按住冷卻），再把冰放進水裡 ----------
  async function ch3() {
    show();
    stage.innerHTML = '<div class="wg-g13"><div class="wg-row wg-stack"><div class="wg-scene wg-bottle">' + A.bottleScene() + '</div><div class="wg-side" id="side"><div class="wg-lens" id="lens"></div></div></div>' +
      '<div class="wg-ctl" id="ctl"><button class="wg-hold cool" id="hold">' + kc('C') + '<span class="wg-hi">' + A.snowflake() + '</span><span class="wg-hl">' + Z('c3.cold') + '</span></button>' +
      '<div class="wg-meter cool"><i id="mt"></i></div></div></div>';
    const ps = P.create($('#lens'), { n: 30, solid: 0, energy: .5 });
    const bw = $('#wgBw'), dome = $('#wgDome'), hb = $('#hold'), mt = $('#mt');
    say('c3.goal');
    const stop = guide(hb, 'press');
    let p = 0, tk = 0, mid = false;
    await holdLoop(hb, ['c'], (dt, down) => {
      if (down) { p = Math.min(1, p + dt / 5); tk += dt; if (tk > .5) { tk = 0; sfx('cold'); } }
      bw.setAttribute('fill', mix('#7FBCE8', '#CFE6F2', p));
      dome.setAttribute('ry', (p > .6 ? (p - .6) / .4 * 13 : 0).toFixed(1));
      mt.style.width = (p * 100) + '%';
      ps.set({ solid: p * 1.1, energy: .5 - .4 * p });
      if (!mid && p > .45) { mid = true; say('c3.mid'); }
      return p >= 1 ? 1 : 0;
    });
    stop();
    sfx('knock');
    squash($('.wg-bottle'));
    await say('c3.done');
    dome.classList.add('wg-blink');
    await say('c3.big');
    dome.classList.remove('wg-blink');
    // 第二步：把冰放進水裡
    ps.stop();
    $('#side').innerHTML = '<div class="wg-scene wg-cup zone" id="cup">' + A.floatScene() + '</div>';
    $('#ctl').innerHTML = '<div class="drag wg-chip wg-touch" id="cube">' + kc('F') + '<span class="wg-ci">' + A.iceCube() + '</span></div>';
    const cup = $('#cup'), chip = $('#cube'), fl = $('#wgFloat');
    fl.setAttribute('opacity', '0');
    say('c3.drop');
    const stop2 = guide(chip, 'drag');
    await dragPick([chip], [cup], { itemKeys: [['f']] });
    stop2();
    chip.classList.add('gone'); home(chip);
    fl.setAttribute('opacity', '1');
    sfx('pop');
    // 落進水裡，沉一下再浮起來：大約 1/10 露出水面（水面 y=100，冰高 42）
    await spring(y => fl.setAttribute('transform', 'translate(0 ' + y.toFixed(1) + ')'), 20, 95.8, { k: 90, d: 8 });
    sfx('land');
    squash(cup);
    await say('c3.float');
    await ritual();
    await endCard(3, A.iceCube());
  }

  // ---------- 第四關：硬硬的、會流動的（拖放分類） ----------
  async function ch4() {
    show();
    const ITEMS = [['ice', A.iceCube(), 0], ['pop', A.popsicle(0), 0], ['snow', A.snow(), 0],
      ['rain', A.rain(), 1], ['soup', A.soup(false), 1], ['milk', A.milk(), 1]];
    const order = shuffle(ITEMS);
    stage.innerHTML = '<div class="wg-basins">' + [0, 1].map(b => '<div class="zone wg-basin" data-b="' + b + '">' + kc(b ? 'L' : 'J') +
      '<div class="wg-bart">' + A.basin(b ? A.C.blue2 : A.C.ice) + '<span class="wg-bi">' + (b ? A.drop() : A.iceCube()) + '</span><div class="wg-pile"></div></div>' +
      '<span class="wg-bl">' + Z(b ? 'c4.liquid' : 'c4.solid') + '</span><span class="wg-bs">' + Z(b ? 'c4.liquidS' : 'c4.solidS') + '</span></div>').join('') + '</div>' +
      '<div class="wg-items">' + order.map((it, i) => '<div class="drag wg-chip wg-touch" data-g="' + it[2] + '">' + kc('ABCDEF'[i]) +
        '<span class="wg-ci">' + it[1] + '</span><span class="wg-cn">' + Z('it.' + it[0]) + '</span></div>').join('') + '</div>';
    const basins = all('.wg-basin'), items = all('.wg-items .wg-chip');
    say('c4.goal');
    const miss = items.map(() => 0);
    let left = items.length, n = 0;
    while (left) {
      const first = items.find(Boolean);
      const stop = guide(first, 'drag');
      let { i, t } = await dragPick(items, basins, { itemKeys: 'abcdef'.split('').map(k => [k]), targetKeys: [['j'], ['l']] });
      stop();
      const g = +items[i].dataset.g;
      if (t !== g) {
        home(items[i]); shake(basins[t]); sfx('no');
        miss[i]++;
        tip(miss[i] >= 2 ? 'g.no2' : 'c4.wrong');
        if (miss[i] >= 2) basins[g].classList.add('wg-hint');
        if (miss[i] < 3) continue;
        await sleep(300);
        await demo(basins[g]);
        t = g;
      }
      basins.forEach(b => b.classList.remove('wg-hint'));
      const el = items[i];
      basins[t].querySelector('.wg-pile').insertAdjacentHTML('beforeend', '<span class="wg-mini">' + el.querySelector('.wg-ci').innerHTML + '</span>');
      squash(basins[t].querySelector('.wg-pile').lastChild);
      squash(basins[t]);
      el.classList.add('gone'); home(el);
      items[i] = null; left--;
      sfx('land'); note(4 + n++);
      if (n === 1) sayBox.classList.add('wg-faded');     // 會玩了：說明退到旁邊
    }
    sfx('ok');
    sayBox.classList.remove('wg-faded');
    basins.forEach(b => b.classList.add('named'));
    await say('c4.done');
    await ritual();
    await endCard(4, A.snow());
  }

  // ---------- 第五關：繞圈轉旋鈕，把火轉大 ----------
  async function ch5() {
    show();
    stage.innerHTML = '<div class="wg-row"><div class="wg-scene wg-pot">' + A.potScene() + '</div><div class="wg-lens sm" id="lens"></div></div>' +
      '<div class="wg-knob wg-touch" id="knob">' + A.knob() + kc('K') + '<i class="wg-orbit"></i></div>';
    const ps = P.create($('#lens'), { n: 22, solid: 0, energy: .3 });
    const knob = $('#knob'), kg = $('#wgKnob'), flame = $('#wgFlame'), bub = $('#wgBub'), smoke = $('#wgSmoke');
    let lv = 0, rot = 0, tick = 0, mid = false;
    const paint = () => {
      kg.setAttribute('transform', 'rotate(' + rot.toFixed(1) + ' 100 100)');
      flame.style.transform = 'scale(' + (.35 + .75 * lv).toFixed(3) + ')';
      ps.set({ energy: .3 + .6 * lv, gas: lv >= 1 ? .4 : lv * .12 });
    };
    paint();
    // 鍋裡的泡泡：火越大越多、越大顆
    const biv = setInterval(() => {
      if (!bub.isConnected) { clearInterval(biv); return; }
      if (Math.random() > lv * .9 + (lv >= 1 ? .3 : 0)) return;
      const c = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      const r = (lv >= 1 ? 4 + Math.random() * 5 : 2 + Math.random() * 2.5);
      c.setAttribute('cx', (62 + Math.random() * 116).toFixed(1));
      c.setAttribute('cy', (93 + Math.random() * 6).toFixed(1));
      c.setAttribute('r', r.toFixed(1));
      c.setAttribute('class', 'wg-bubble');
      bub.appendChild(c);
      setTimeout(() => c.remove(), 700);
      if (lv >= 1 && Math.random() < .25) sfx('bubble');
    }, 110);
    say('c5.goal');
    const stop = guide(knob, 'circle');
    await new Promise(res => {
      let last = null, finished = false;
      const add = d => {
        if (finished) return;
        lv = Math.min(1, lv + d);
        if (lv > .995) lv = 1;
        tick += d;
        if (tick > 1 / 12) { tick = 0; sfx('tap'); }
        paint();
        if (!mid && lv >= .5) { mid = true; say('c5.mid'); }
        if (lv >= 1) { finished = true; offT(); offK(); res(); }
      };
      const ang = p => Math.atan2(p.y - p.h / 2, p.x - p.w / 2);
      const offT = track(knob, {
        down(p) { last = ang(p); },
        move(p) {
          if (last === null) return;
          const a = ang(p);
          let d = a - last;
          if (d > Math.PI) d -= 2 * Math.PI;
          if (d < -Math.PI) d += 2 * Math.PI;
          last = a;
          rot += d * 180 / Math.PI;
          add(Math.abs(d) / (3 * Math.PI));     // 大約繞一圈半就滾
        },
        up() { last = null; },
      });
      const offK = onKeys(['k'], () => { rot += 45; squash(knob); add(1 / 6); });
    });
    stop();
    sfx('ok');
    await say('c5.boil');
    smoke.style.opacity = '1';
    sfx('steam');
    await say('c5.smoke');
    await say('c5.done');
    await ritual();
    clearInterval(biv);
    await endCard(5, A.soup(true));
  }

  // ---------- 第六關：左右拖溫度條，找 0 度與 100 度 ----------
  async function ch6() {
    show();
    const LO = -20, HI = 120, pct = t => (t - LO) / (HI - LO) * 100;
    stage.innerHTML = '<div class="wg-lens lg" id="lens"></div>' +
      '<div class="wg-read"><b id="tv">30</b><span>°C</span></div>' +
      '<div class="wg-thermo" id="th"><div class="wg-track"><i class="wg-fill" id="fill"></i></div>' +
      '<div class="wg-flag" id="f0" style="left:' + pct(0) + '%"><b>0</b></div>' +
      '<div class="wg-flag" id="f100" style="left:' + pct(100) + '%"><b>100</b></div>' +
      '<div class="wg-flag yu" id="fy" style="left:' + pct(87) + '%" hidden><b>87</b><span>' + Z('c6.flag') + '</span></div>' +
      '<div class="wg-thumb" id="thumb"></div></div>' +
      '<div class="wg-ad"><button class="wg-step wg-touch" id="bA">' + kc('A') + '<span class="wg-arw l"></span></button>' +
      '<button class="wg-step wg-touch" id="bD"><span class="wg-arw r"></span>' + kc('D') + '</button></div>';
    const ps = P.create($('#lens'), { n: 30, solid: 0, energy: .3 });
    const th = $('#th'), thumb = $('#thumb'), fill = $('#fill'), tv = $('#tv'), f0 = $('#f0'), f100 = $('#f100');
    let T = 30, lastB = null;
    const apply = () => {
      T = clamp(Math.round(T), LO, HI);
      thumb.style.left = pct(T) + '%';
      fill.style.width = pct(T) + '%';
      tv.textContent = T;
      const solid = clamp(1 - T / 2, 0, 1);
      const e = clamp((T - LO) / (HI - LO), 0, 1);
      const bg = T <= 0 ? '#E6F1F8' : T >= 100 ? '#FBEFE6' : mix('#EEF5F7', '#FBF1E8', T / 100);
      ps.set({ solid, energy: .05 + e * .8, gas: T >= 100 ? .75 : T > 0 ? T / 100 * .12 : 0, bg });
      const b = Math.floor((T - LO) / 10);
      if (b !== lastB) { if (lastB !== null) note(clamp(b - 1, 0, 10), .08); lastB = b; }
    };
    apply();
    const goals = [[0, 'c6.goal0', 'c6.ok0', f0], [100, 'c6.goal100', 'c6.ok100', f100]];
    for (const [goal, gk, ok, flag] of goals) {
      say(gk);
      const stop = guide(flag);
      let miss = 0, tries = 0;
      await new Promise(res => {
        let kt = 0, done = false;
        const check = async () => {
          if (done) return;
          if (Math.abs(T - goal) <= 4) {
            done = true; offT(); offK(); offB.forEach(f => f());
            T = goal; apply(); res(); return;
          }
          if (Math.abs(T - goal) <= 12) { tip('c6.near'); return; }
          // 前兩次只提示（好奇滑滑看不算錯），第三次起才算一次 miss
          if (++tries <= 2) { tip('c6.wrong'); squash(flag); return; }
          miss++;
          shake(flag); sfx('no'); tip('c6.wrong');
          if (miss >= 2) flag.classList.add('wg-hint');
          if (miss >= 3) {
            done = true; offT(); offK(); offB.forEach(f => f());
            await demo(thumb, 'swipe');
            await spring(x => { T = x; apply(); }, T, goal, { k: 60, d: 12 });
            res();
          }
        };
        const fromX = p => { T = LO + clamp(p.x / p.w, 0, 1) * (HI - LO); apply(); };
        const offT = track(th, { down(p) { thumb.classList.add('held'); fromX(p); }, move: fromX, up() { thumb.classList.remove('held'); squash(thumb); check(); } });
        const step = d => { T += d; apply(); clearTimeout(kt); kt = setTimeout(check, 700); };
        const offK = onKeys(['a', 'd', 'left', 'right'], k => step(k === 'a' || k === 'left' ? -5 : 5));
        const bA = $('#bA'), bD = $('#bD');
        const ca = () => step(-5), cd = () => step(5);
        bA.addEventListener('click', ca); bD.addEventListener('click', cd);
        const offB = [() => bA.removeEventListener('click', ca), () => bD.removeEventListener('click', cd), () => clearTimeout(kt)];
      });
      stop();
      flag.classList.remove('wg-hint');
      flag.classList.add('got');
      squash(flag); sfx('ok');
      await say(ok);
    }
    $('#fy').hidden = false;
    squash($('#fy'));
    await say('c6.done');
    await ritual();
    await endCard(6, A.sun());
  }

  // ---------- 第七關：畫線擦玻璃（凝結） ----------
  async function ch7() {
    show();
    stage.innerHTML = '<div class="wg-cupw" id="cw">' + A.coldCup() + '<canvas class="wg-fog" id="fog"></canvas><div class="wg-drops" id="drops"></div>' +
      // 四個鍵帽各放在自己那一條擦拭區的正上方（欄中心 x = 50 + 35×(i+.5)，SVG 寬 240）
      '<div class="wg-cols">' + 'ASDF'.split('').map((k, i) => '<span id="col' + i + '" style="left:' + ((50 + 35 * (i + .5)) / 240 * 100).toFixed(2) + '%">' + kc(k) + '</span>').join('') + '</div></div>';
    const cw = $('#cw'), cv = $('#fog'), drops = $('#drops');
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const W = cw.clientWidth, H = cw.clientHeight;
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
    const ctx = cv.getContext('2d');
    const sx = W / 240, sy = H / 260;
    ctx.setTransform(dpr * sx, 0, 0, dpr * sy, 0, 0);       // 之後都用 SVG 的 240×260 座標
    // 霧：杯子玻璃的形狀
    ctx.beginPath();
    ctx.moveTo(44, 30); ctx.lineTo(196, 30); ctx.lineTo(180, 236);
    ctx.quadraticCurveTo(178, 250, 164, 250); ctx.lineTo(76, 250); ctx.quadraticCurveTo(62, 250, 60, 236); ctx.closePath();
    // 霧半透明：底下整杯飲料隱約看得到，擦過的地方才變清楚
    ctx.fillStyle = 'rgba(246,250,252,.62)'; ctx.fill();
    // 四條擦拭區之間的淡淡分隔線（也會被擦掉）
    ctx.strokeStyle = 'rgba(255,255,255,.75)'; ctx.lineWidth = 2; ctx.setLineDash([4, 8]);
    for (let i = 1; i < 4; i++) { const x = 50 + 35 * i; ctx.beginPath(); ctx.moveTo(x, 40); ctx.lineTo(x, 240); ctx.stroke(); }
    ctx.setLineDash([]);
    ctx.fillStyle = 'rgba(200,222,236,.75)';
    for (let i = 0; i < 90; i++) {
      const y = 38 + Math.random() * 205, half = 74 - (y - 30) / 220 * 16, x = 120 + (Math.random() * 2 - 1) * (half - 8);
      ctx.beginPath(); ctx.arc(x, y, 1.6 + Math.random() * 2.4, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalCompositeOperation = 'destination-out';
    // 擦過的格子（8 欄 × 10 列）
    const GX = 8, GY = 10, X0 = 50, X1 = 190, Y0 = 32, Y1 = 248;
    const grid = new Array(GX * GY).fill(0);
    const R = 15;
    const mark = (x, y) => {
      for (let gy = 0; gy < GY; gy++) for (let gx = 0; gx < GX; gx++) {
        const cx = X0 + (gx + .5) * (X1 - X0) / GX, cy = Y0 + (gy + .5) * (Y1 - Y0) / GY;
        if (Math.hypot(cx - x, cy - y) < R + 6) grid[gy * GX + gx] = 1;
      }
    };
    const cover = () => grid.reduce((a, b) => a + b, 0) / grid.length;
    let lastP = null, lastDrop = 0, said = 0;
    const dropAt = (x, y) => {
      const now = performance.now();
      if (now - lastDrop < 140) return;
      lastDrop = now;
      const d = document.createElement('i');
      d.className = 'wg-run';
      d.style.left = (x / 240 * 100) + '%'; d.style.top = (y / 260 * 100) + '%';
      d.style.setProperty('--fall', (40 + Math.random() * 70).toFixed(0) + 'px');
      drops.appendChild(d);
      setTimeout(() => d.remove(), 1800);
      sfx('drip', cover());
    };
    const wipe = (x, y) => {
      ctx.lineCap = 'round'; ctx.lineWidth = R * 2;
      ctx.beginPath();
      if (lastP) { ctx.moveTo(lastP[0], lastP[1]); ctx.lineTo(x, y); ctx.stroke(); }
      ctx.beginPath(); ctx.arc(x, y, R, 0, Math.PI * 2); ctx.fill();
      if (lastP) { const n = Math.ceil(Math.hypot(x - lastP[0], y - lastP[1]) / 8); for (let i = 1; i <= n; i++) mark(lastP[0] + (x - lastP[0]) * i / n, lastP[1] + (y - lastP[1]) * i / n); }
      mark(x, y);
      lastP = [x, y];
      dropAt(x, y + 6);
    };
    say('c7.goal');
    const stop = guide(cw, 'wipe');
    await new Promise(res => {
      let done = false;
      const progress = () => {
        const c = cover();
        if (!said) { said = 1; say('c7.mid'); }
        else if (said === 1 && c > .3) { said = 2; say('c7.why'); }
        if (!done && c >= .6) { done = true; offT(); offK(); setTimeout(res, 500); }
      };
      const toV = p => [p.x / p.w * 240, p.y / p.h * 260];
      const offT = track(cw, {
        down(p) { lastP = null; wipe(...toV(p)); progress(); },
        move(p) { wipe(...toV(p)); progress(); },
        up() { lastP = null; },
      });
      // 鍵盤：A S D F 各擦一條直線（從上往下）
      const used = new Set();
      const offK = onKeys(['a', 's', 'd', 'f'], async k => {
        const c = 'asdf'.indexOf(k);
        if (used.has(c)) return;
        used.add(c);
        $('#col' + c).classList.add('used');
        const x = X0 + (c + .5) * (X1 - X0) / 4;
        lastP = null;
        for (let y = 40; y <= 244; y += 12) { wipe(x - 9, y); wipe(x + 9, y); await sleep(18); lastP = [x + 9, y]; }
        lastP = null;
        progress();
      });
    });
    stop();
    sfx('ok');
    squash(cw);
    await say('c7.done');
    await ritual();
    await endCard(7, A.cupDrops());
  }

  // ---------- 第八關：冰棒慢慢變軟（排順序） ----------
  async function ch8() {
    show();
    let order;
    do { order = shuffle([0, 1, 2, 3]); } while (order.every((v, i) => v === i));
    stage.innerHTML = '<div class="wg-sunrow">' + A.sun() + '</div>' +
      '<div class="wg-slots">' + [0, 1, 2, 3].map(i => '<div class="zone wg-slot"><b>' + (i + 1) + '</b></div>').join('<span class="wg-arrow"></span>') + '</div>' +
      '<div class="wg-cards">' + order.map((s, i) => '<button class="wg-card wg-touch" data-s="' + s + '">' + kc('ABCD'[i]) + A.popsicle(s) + '</button>').join('') + '</div>';
    const slots = all('.wg-slot'), cards = all('.wg-card');
    say('c8.goal');
    for (let k = 0; k < 4; k++) {
      const stop = guide(slots[k]);
      const right = cards.findIndex(c => c && +c.dataset.s === k);
      let miss = 0, pick;
      for (;;) {
        pick = await waitAction(cards.map((c, i) => c ? { el: c, keys: ['abcd'[i]] } : null));
        if (pick === right) break;
        miss++;
        shake(cards[pick]); sfx('no');
        tip(miss >= 2 ? 'g.no2' : 'c8.wrong');
        if (miss >= 2) cards[right].classList.add('wg-hint');
        if (miss >= 3) { await demo(cards[right]); pick = right; break; }
      }
      stop();
      const c = cards[pick];
      c.classList.remove('wg-hint');
      slots[k].insertAdjacentHTML('beforeend', '<span class="wg-sart">' + A.popsicle(k) + '</span>');
      slots[k].classList.add('done');
      squash(slots[k]);
      c.classList.add('gone');
      cards[pick] = null;
      sfx('land'); note(7 - k * 2);         // 越融化音越低，像慢慢變軟
    }
    sfx('ok');
    await say('c8.done');
    await ritual();
    await endCard(8, A.popsicle(1));
  }

  // ---------- 第九關：生活裡的變身（連線） ----------
  async function ch9() {
    show();
    const SITS = [['c9.s1', A.clothes(), 0, 'c9.r1'], ['c9.s2', A.cupDrops(), 1, 'c9.r2'], ['c9.s3', A.mirror(), 1, 'c9.r3'],
      ['c9.s4', A.soupSmoke(), 1, 'c9.r4'], ['c9.s5', A.freezer(), 2, 'c9.r5']];
    const ANS = [['c9.evap', A.evapIcon()], ['c9.cond', A.condIcon()], ['c9.frz', A.freezeIcon()]];
    const sits = shuffle(SITS);
    stage.innerHTML = '<div class="wg-match" id="mx"><svg class="wg-lines" id="lines"><g id="perm"></g><line id="tmp" visibility="hidden"/></svg>' +
      '<div class="wg-left">' + sits.map((s, i) => '<button class="wg-sit wg-touch" data-i="' + i + '">' + kc('ABCDE'[i]) + '<span class="wg-si">' + s[1] + '</span><span class="wg-sl">' + Z(s[0]) + '</span><i class="wg-dot"></i></button>').join('') + '</div>' +
      '<div class="wg-right">' + ANS.map((a, i) => '<button class="wg-ans wg-touch" data-a="' + i + '"><i class="wg-dot"></i>' + kc('JKL'[i]) + '<span class="wg-ai">' + a[1] + '</span><span class="wg-al">' + Z(a[0]) + '</span></button>').join('') + '</div></div>';
    const mx = $('#mx'), svgL = $('#lines'), perm = $('#perm'), tmp = $('#tmp');
    const sEls = all('.wg-sit'), aEls = all('.wg-ans');
    const pairs = [], miss = sits.map(() => 0);
    let from = -1, left = sits.length;
    const pt = (el, side) => {
      const r = el.querySelector('.wg-dot').getBoundingClientRect(), m = mx.getBoundingClientRect();
      return [r.left - m.left + r.width / 2, r.top - m.top + r.height / 2];
    };
    const redraw = () => {
      const m = mx.getBoundingClientRect();
      svgL.setAttribute('viewBox', '0 0 ' + m.width + ' ' + m.height);
      perm.innerHTML = pairs.map(([i, a]) => { const p = pt(sEls[i]), q = pt(aEls[a]); return '<line x1="' + p[0] + '" y1="' + p[1] + '" x2="' + q[0] + '" y2="' + q[1] + '"/>'; }).join('');
    };
    redraw();
    addEventListener('resize', redraw);
    const select = i => { from = i; sEls.forEach((e, k) => e.classList.toggle('sel', k === i)); if (i >= 0) sfx('tap'); };
    say('c9.goal');
    await new Promise(res => {
      let stop = guide(sEls[0], 'swipe');
      const regl = () => { stop(); const f = sEls.find(e => !e.classList.contains('done')); stop = f ? guide(f, 'swipe') : () => {}; };
      const finish = () => { stop(); offT(); offK(); removeEventListener('resize', redraw); res(); };
      const attempt = async (i, a) => {
        tmp.setAttribute('visibility', 'hidden');
        if (i < 0 || sEls[i].classList.contains('done')) return;
        if (sits[i][2] !== a) {
          shake(aEls[a]); sfx('no');
          miss[i]++;
          tip(miss[i] >= 2 ? 'g.no2' : 'c9.wrong');
          if (miss[i] >= 2) aEls[sits[i][2]].classList.add('wg-hint');
          if (miss[i] < 3) return;
          await demo(aEls[sits[i][2]]);
          a = sits[i][2];
        }
        aEls.forEach(e => e.classList.remove('wg-hint'));
        pairs.push([i, a]); redraw();
        sEls[i].classList.add('done'); squash(sEls[i]); squash(aEls[a]);
        select(-1);
        sfx('ok'); left--;
        if (!left) { await say(sits[i][3]); finish(); return; }
        say(sits[i][3]);
        regl();
      };
      const under = ev => {
        const e = document.elementFromPoint(ev.clientX, ev.clientY);
        return e ? [e.closest('.wg-sit'), e.closest('.wg-ans')] : [null, null];
      };
      let moved = false, startI = -1;
      const offT = track(mx, {
        down(p, ev) {
          const [s, a] = under(ev);
          moved = false;
          if (a && from >= 0) { attempt(from, +a.dataset.a); startI = -1; return; }
          if (s && !s.classList.contains('done')) { startI = +s.dataset.i; select(startI); } else startI = -1;
        },
        move(p) {
          if (startI < 0) return;
          moved = true;
          const q = pt(sEls[startI]);
          tmp.setAttribute('x1', q[0]); tmp.setAttribute('y1', q[1]); tmp.setAttribute('x2', p.x); tmp.setAttribute('y2', p.y);
          tmp.setAttribute('visibility', 'visible');
        },
        up(p, ev) {
          tmp.setAttribute('visibility', 'hidden');
          if (startI < 0) return;
          const [, a] = under(ev);
          if (a) attempt(startI, +a.dataset.a);
          else if (moved) select(-1);
          startI = -1;
        },
      });
      const offK = onKeys(['a', 'b', 'c', 'd', 'e', 'j', 'k', 'l'], k => {
        const li = 'abcde'.indexOf(k);
        if (li >= 0) { if (!sEls[li].classList.contains('done')) select(li); return; }
        if (from >= 0) attempt(from, 'jkl'.indexOf(k));
        else { shake(sEls.find(e => !e.classList.contains('done'))); }
      });
    });
    await say('c9.done');
    await ritual();
    await endCard(9, A.clothes());
  }

  // ---------- 第十關：水循環（節奏敲 S → U → R，三圈） ----------
  async function ch10() {
    show();
    stage.innerHTML = '<div class="wg-cycle" id="cy">' + A.cycleScene() +
      '<button class="wg-spot" id="spS" style="left:21.5%;top:26%">' + kc('S') + '</button>' +
      '<button class="wg-spot" id="spU" style="left:37%;top:56%">' + kc('U') + '</button>' +
      '<button class="wg-spot" id="spR" style="left:50%;top:22%">' + kc('R') + '</button></div>';
    const spots = [$('#spS'), $('#spU'), $('#spR')], keys = ['s', 'u', 'r'];
    const sun = $('#wgSun'), cloud = $('#wgCloud'), vap = $('#wgVapor'), rain = $('#wgRain');
    // 雲在 game.css 裡先往左移到海的上方（#wgCloud 的 transform）
    const NS = 'http://www.w3.org/2000/svg';
    const puff = (g, cls, x, y, r, life) => {
      const c = document.createElementNS(NS, 'circle');
      c.setAttribute('cx', x); c.setAttribute('cy', y); c.setAttribute('r', r); c.setAttribute('class', cls);
      c.style.animationDelay = (Math.random() * .4).toFixed(2) + 's';
      g.appendChild(c); setTimeout(() => c.remove(), life);
    };
    const ACT = [
      () => { sun.classList.add('on'); setTimeout(() => sun.classList.remove('on'), 1400); for (let i = 0; i < 6; i++) puff(vap, 'wg-vsea', 110 + Math.random() * 120, 198, 3, 1600); },
      () => { for (let i = 0; i < 12; i++) puff(vap, 'wg-vup', 120 + Math.random() * 110, 190, 3 + Math.random() * 2, 2200); cloud.classList.add('grow'); },
      () => { cloud.classList.remove('grow'); for (let i = 0; i < 16; i++) puff(rain, 'wg-drop', 150 + Math.random() * 110, 96, 2.6, 1800); },
    ];
    const EXPL = ['c10.s', 'c10.u', 'c10.r'];
    say('c10.goal');
    await sleep(FAST ? 30 : 900);
    for (let r = 0; r < 3; r++) {
      if (r === 1) say('c10.again');
      if (r === 2) say('c10.last');
      for (let s = 0; s < 3; s++) {
        spots.forEach((e, k) => e.classList.toggle('lit', k === s));
        const stop = guide(spots[s]);
        let miss = 0;
        for (;;) {
          const k = await waitAction(spots.map((e, j) => ({ el: e, keys: [keys[j]] })));
          if (k === s) break;
          miss++;
          shake(spots[s]); sfx('no');
          if (miss >= 2) spots[s].classList.add('wg-hint');
          if (miss >= 3) { await demo(spots[s]); break; }
        }
        stop();
        spots[s].classList.remove('lit', 'wg-hint');
        squash(spots[s]);
        note(3 + r * 2 + s, .17);
        ACT[s]();
        if (r === 0) await say(EXPL[s]); else await sleep(FAST ? 30 : 650);
      }
    }
    spots.forEach(e => e.classList.add('rest'));
    sfx('ok');
    await sleep(FAST ? 30 : 400);
    await say('c10.done');
    await ritual();
    await endCard(10, A.rain());
  }

  // ---------- 結尾 ----------
  async function finale() {
    show();
    stage.innerHTML = '<div class="wg-end"><div class="wg-seal hero">' + A.hero() + '</div><div class="chtitle">' + Z('fin.title') + '</div>' +
      '<div class="wg-stickers">' + [A.iceCube(), A.drop(), A.soup(true), A.cupDrops(), A.snowflake(), A.rain()].map(s => '<span class="wg-stk wg-touch">' + s + '</span>').join('') + '</div>' +
      '<div class="wg-pcard"><b class="wg-pl">' + Z('ui.parent') + '</b><div class="wg-pt">' + Z('fin.parent') + '</div></div></div>';
    all('.wg-stk').forEach((e, i) => e.addEventListener('click', () => { squash(e); note(3 + i); }));
    sfx('win');
    await say('fin.hi');
    await say('fin.task');
  }

  G.run({ saveKey: 'water-game-v1', stamp: '水', heroArt: A.hero(), chapters: [ch1, ch2, ch3, ch4, ch5, ch6, ch7, ch8, ch9, ch10], finale });
})();
