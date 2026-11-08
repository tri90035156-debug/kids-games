/* 玩偶怎麼來？ 十關、三站。玩法：連連看、排順序、選一個、按住塞棉花。旁白＋注音字幕（點字幕重聽）。 */
(() => {
  const $ = s => document.querySelector(s);
  const TX = window.TX || {};
  const stage = $('#stage'), cap = $('#cap'), capT = cap.querySelector('.bt'), nextBtn = $('#nextBtn'), mapEl = $('#map');
  const FAST = /[?&]fast=1/.test(location.search);
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  // ---------- 注音排版（字右邊直排） ----------
  function cell(ch, zy) {
    let h = '<span class="zc"><span class="zh">' + esc(ch) + '</span>';
    if (zy) {
      const light = zy.charAt(0) === '˙';
      let s = light ? zy.slice(1) : zy, tn = '';
      const last = s.charAt(s.length - 1);
      if ('ˊˇˋ'.indexOf(last) >= 0) { tn = last; s = s.slice(0, -1); }
      h += '<span class="zy' + (tn ? ' has-t' : '') + '">' + (light ? '<b class="tl">˙</b>' : '') +
        '<span class="zs">' + Array.from(s).map(c => '<i>' + c + '</i>').join('') + '</span>' + (tn ? '<b class="tn">' + tn + '</b>' : '') + '</span>';
    }
    return h + '</span>';
  }
  function Z(key) {
    const e = TX[key]; if (!e) return esc(key);
    return e.z.map(it => Array.isArray(it) ? cell(it[0], it[1]) : it.k ? '<kbd class="kc">' + it.k + '</kbd>' : esc(it)).join('');
  }
  const T = key => (TX[key] || {}).t || key;

  // ---------- 音效（WebAudio 合成） ----------
  let actx, muted = localStorage.getItem('tf-mute') === '1';
  const ac = () => (actx = actx || new (window.AudioContext || window.webkitAudioContext)());
  function tone(f, t0, len, type = 'sine', vol = .18, f1 = f) {
    if (muted) return; const a = ac(), o = a.createOscillator(), g = a.createGain(); o.type = type;
    o.frequency.setValueAtTime(f, a.currentTime + t0); o.frequency.exponentialRampToValueAtTime(f1, a.currentTime + t0 + len);
    g.gain.setValueAtTime(0, a.currentTime + t0); g.gain.linearRampToValueAtTime(vol, a.currentTime + t0 + .01); g.gain.exponentialRampToValueAtTime(.001, a.currentTime + t0 + len);
    o.connect(g).connect(a.destination); o.start(a.currentTime + t0); o.stop(a.currentTime + t0 + len + .05);
  }
  const prog = () => { if (window.RESTART) RESTART.progress(); };   // 答對、過關＝有進展（重來鈕的 90 秒提醒重新計時）
  const SFX = {
    tap: () => tone(660, 0, .08, 'triangle', .12),
    ok: () => { prog(); tone(523, 0, .12, 'triangle'); tone(659, .1, .12, 'triangle'); tone(784, .2, .25, 'triangle'); },
    no: () => tone(180, 0, .25, 'sine', .15, 120),
    fly: () => tone(400, 0, .25, 'sine', .1, 900),
    done: () => prog() || [523, 659, 784, 1047].forEach((f, i) => tone(f, i * .09, .5, 'triangle', .14)),
    blow: () => tone(120, 0, .12, 'sawtooth', .04, 160),
  };
  const sndBtn = $('#sndBtn');
  const paintSnd = () => { sndBtn.innerHTML = muted ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M4 10v4h4l5 4V6L8 10z"/><path d="M17 9l4 6M21 9l-4 6"/></svg>' : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M4 10v4h4l5 4V6L8 10z"/><path d="M16 9a4 4 0 0 1 0 6"/><path d="M18.5 6.5a8 8 0 0 1 0 11"/></svg>'; };
  sndBtn.onclick = () => { muted = !muted; localStorage.setItem('tf-mute', muted ? '1' : '0'); paintSnd(); if (muted) stopVoice(); };
  paintSnd();

  // ---------- 旁白：音檔＋字幕，排隊 ----------
  let voice = null, qChain = Promise.resolve(), lastKey = null, qid = 0;
  function stopVoice() { if (voice) { voice.onended = null; voice.pause(); voice = null; } cap.classList.remove('talk'); }
  function playOne(key) {
    return new Promise(res => {
      const e = TX[key]; if (!e) return res();
      lastKey = key; capT.innerHTML = Z(key); cap.classList.add('on', 'talk');
      const ms = Math.max(900, e.t.length * 260);
      if (muted || FAST || !e.v) { cap.classList.remove('talk'); return setTimeout(res, FAST ? 60 : ms); }
      const a = new Audio('audio/' + e.v + '.mp3'); voice = a;
      let fin = false; const end = () => { if (fin) return; fin = true; if (voice === a) voice = null; cap.classList.remove('talk'); res(); };
      a.onended = end; a.onerror = () => setTimeout(end, ms);
      a.play().catch(() => setTimeout(end, ms));
    });
  }
  function say(...keys) { const id = ++qid; stopVoice(); qChain = Promise.resolve(); keys.forEach(k => { qChain = qChain.then(() => id === qid ? playOne(k) : null); }); return qChain; }
  const sayAfter = (...keys) => { keys.forEach(k => { qChain = qChain.then(() => playOne(k)); }); return qChain; };
  cap.onclick = () => { if (lastKey) say(lastKey); };

  // ---------- 圖示（簡單線條，放進紅圈） ----------
  const S = (d, extra = '') => '<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">' + d + extra + '</svg>';
  const bearSvg = (k = 1) => S('<circle cx="14" cy="14" r="5"/><circle cx="34" cy="14" r="5"/><ellipse cx="24" cy="26" rx="' + 14 * k + '" ry="' + 13 * k + '"/><circle cx="19" cy="23" r="1.6" fill="currentColor"/><circle cx="29" cy="23" r="1.6" fill="currentColor"/><path d="M21 30q3 2.5 6 0"/>');
  const I = {
    cotton: S('<path d="M24 10c4-3 9 0 9 4 4 1 5 7 1 9 1 5-5 8-9 5-4 3-10 0-9-5-4-2-3-8 1-9 0-4 5-7 7-4z"/><path d="M24 29v9"/>'),
    wool: S('<path d="M12 22c-2-6 6-8 8-4 2-5 10-3 9 2 5-1 7 6 2 8 2 5-5 8-8 4-3 4-10 2-9-3-5 0-6-6-2-7z"/>'),
    poly: S('<rect x="14" y="10" width="20" height="28" rx="4"/><path d="M14 16h20M14 22h20M14 28h20M14 34h20"/>'),
    field: S('<path d="M6 40h36M6 32q6-4 12 0t12 0 12 0"/><circle cx="12" cy="22" r="3"/><circle cx="24" cy="18" r="3"/><circle cx="36" cy="22" r="3"/><path d="M12 25v7M24 21v11M36 25v7"/>'),
    sheep: S('<path d="M12 24c-3-6 5-9 8-5 2-5 11-4 10 2 5-1 8 5 3 8 2 5-5 8-8 5-3 4-11 2-10-3-4 0-6-5-3-7z"/><circle cx="35" cy="21" r="4"/><path d="M16 34v7M30 34v7"/>'),
    oil: S('<path d="M6 42h36M16 42L22 8h4l6 34M18 30h12M20 20h8"/><path d="M30 26l10-6"/><path d="M40 20v22" stroke-dasharray="3 3"/>'),
    fur: S('<rect x="8" y="12" width="32" height="24" rx="4"/><path d="M12 12l2-4M18 12l2-4M24 12l2-4M30 12l2-4M36 12l2-4"/>'),
    fill: S('<path d="M14 18c-3-6 7-9 9-4 3-6 12-2 9 4 6 1 5 9-1 9 1 6-8 8-10 3-3 5-12 2-9-4-5-1-4-9 2-8z"/>'),
    eye: S('<circle cx="24" cy="22" r="11"/><circle cx="24" cy="22" r="5" fill="currentColor"/><path d="M24 33v8M19 41h10"/>'),
    thread: S('<path d="M10 14h28v20H10z"/><path d="M14 14v20M34 14v20"/><path d="M38 24c6 2 6 10-1 12"/><path d="M34 40l10-2"/>'),
    pump: S('<path d="M6 42h36"/><path d="M12 42l6-26h6l-2 26"/><path d="M14 22h26l-6 8"/><circle cx="36" cy="18" r="4"/>'),
    pellet: S('<circle cx="14" cy="18" r="4"/><circle cx="26" cy="14" r="4"/><circle cx="34" cy="24" r="4"/><circle cx="18" cy="30" r="4"/><circle cx="30" cy="34" r="4"/>'),
    fiber: S('<path d="M8 12h12v10H8z"/><path d="M20 15c10 0 10 18 20 18M20 18c10 0 10 14 20 14M20 21c10 0 10 10 20 10"/>'),
    weave: S('<path d="M10 10v28M18 10v28M26 10v28M34 10v28"/><path d="M8 16h32M8 24h32M8 32h32"/>'),
    dye: S('<path d="M10 20h28l-3 20H13z"/><path d="M18 12c0 6 12 6 12 0"/><path d="M14 28h20"/>'),
    design: S('<rect x="8" y="8" width="32" height="32" rx="3"/><circle cx="24" cy="24" r="8" stroke-dasharray="3 3"/><circle cx="17" cy="16" r="3"/><circle cx="31" cy="16" r="3"/>'),
    cut: S('<circle cx="14" cy="34" r="5"/><circle cx="34" cy="34" r="5"/><path d="M18 31L36 8M30 31L12 8"/>'),
    eyes: S('<circle cx="24" cy="18" r="7"/><circle cx="24" cy="18" r="3" fill="currentColor"/><path d="M24 25v10"/><rect x="18" y="35" width="12" height="4" rx="2"/>'),
    sew: S('<path d="M8 36h32"/><path d="M12 36V18h20l6 8"/><path d="M24 18v-6M20 12h8"/><path d="M14 40h8"/>'),
    flip: S('<path d="M10 24a14 14 0 0 1 24-10"/><path d="M38 24a14 14 0 0 1-24 10"/><path d="M34 8v6h-6M14 40v-6h6"/>'),
    stuff: S('<path d="M6 24h14"/><path d="M22 14h8l4 10-4 10h-8z"/><path d="M38 22q4 2 0 4M42 20q6 4 0 8" opacity=".7"/>'),
    close: S('<path d="M10 30q14-16 28 0"/><path d="M14 26l2-4M20 22l1-5M28 22l-1-5M34 26l-2-4"/><path d="M40 14l-8 2"/>'),
    box: S('<path d="M8 18l16-8 16 8v16l-16 8-16-8z"/><path d="M8 18l16 8 16-8M24 26v16"/>'),
    container: S('<rect x="6" y="14" width="36" height="22" rx="2"/><path d="M12 14v22M18 14v22M24 14v22M30 14v22M36 14v22"/>'),
    truck: S('<path d="M4 30V14h24v16"/><path d="M28 20h10l6 6v4H28"/><circle cx="12" cy="34" r="4"/><circle cx="36" cy="34" r="4"/>'),
    ship: S('<path d="M6 30l4 10h28l4-10z"/><path d="M12 30v-8h10v-6h12v14"/><path d="M4 42q4-3 8 0t8 0 8 0 8 0 8 0"/>'),
    customs: S('<path d="M8 40h32"/><path d="M12 40V16l12-8 12 8v24"/><path d="M18 26l4 4 8-8"/>'),
    shop: S('<path d="M8 20l3-8h26l3 8"/><path d="M10 20v20h28V20"/><path d="M20 40V28h8v12"/><path d="M8 20q4 4 8 0t8 0 8 0 8 0"/>'),
    factory: S('<path d="M6 40V22l10 6V22l10 6V22l10 6V12h6v28z"/><path d="M12 32h4M22 32h4M32 32h4"/>'),
    parent: S('<circle cx="16" cy="14" r="5"/><circle cx="32" cy="16" r="4"/><path d="M8 40v-10a8 8 0 0 1 16 0v10M26 40v-8a6 6 0 0 1 12 0v8"/>'),
    money: S('<rect x="6" y="14" width="36" height="20" rx="3"/><circle cx="24" cy="24" r="5"/><path d="M12 20v8M36 20v8"/>'),
    home: S('<path d="M8 24L24 10l16 14"/><path d="M12 22v18h24V22"/><path d="M20 40V30h8v10"/>'),
    bear: bearSvg(),
    check: S('<circle cx="24" cy="24" r="14"/><path d="M16 24l6 6 10-12"/>'),
  };
  I.furOf = I.fur; I.fillOf = I.fill; I.eyeOf = I.eye; I.threadOf = I.thread; I.shipco = I.ship; I.customsP = I.customs; I.shopP = I.shop;
  I.make = I.bear; I.carry = I.ship; I.sell = I.shop; I.buy = I.money; I.raw = I.oil; I.cloth = I.fur; I.fac = I.factory; I.sea = I.ship; I.toShop = I.shop;
  const icon = key => I[key.replace(/^c\./, '')] || I.bear;

  // ---------- 關卡資料 ----------
  const LV = [
    { ch: 0, intro: 'ch1', type: 'match', say: 'l1.q', pairs: [['c.cotton', 'c.field', 'l1.cotton'], ['c.wool', 'c.sheep', 'l1.wool'], ['c.poly', 'c.oil', 'l1.oil']], done: 'l1.done' },
    { ch: 0, type: 'order', say: 'l2.q', steps: [['c.pump', 'l2.s1'], ['c.pellet', 'l2.s2'], ['c.fiber', 'l2.s3'], ['c.weave', 'l2.s4'], ['c.dye', 'l2.s5']], done: 'l2.done' },
    { ch: 0, type: 'match', say: 'l3.q', pairs: [['c.furOf', 'c.fur', 'l3.fur'], ['c.fillOf', 'c.fill', 'l3.fill'], ['c.eyeOf', 'c.eye', 'l3.eye'], ['c.threadOf', 'c.thread', 'l3.thread']], done: 'l3.done' },
    { ch: 1, intro: 'ch2', type: 'pick', say: 'l4.q', opts: ['l4.a', 'l4.b', 'l4.c'], ans: 0, yes: 'l4.yes', no: 'l4.no' },
    { ch: 1, type: 'order', say: 'l5.q', steps: [['c.cut', 'l5.s1'], ['c.eyes', 'l5.s2'], ['c.sew', 'l5.s3'], ['c.flip', 'l5.s4'], ['c.stuff', 'l5.s5'], ['c.close', 'l5.s6']], done: 'l5.done' },
    { ch: 1, type: 'hold', say: 'l6.q' },
    { ch: 1, type: 'pick', say: 'l7.q', opts: ['l7.a', 'l7.b', 'l7.c'], ans: 0, yes: 'l7.yes', no: 'l7.no', done: 'l7.done' },
    { ch: 2, intro: 'ch3', type: 'order', say: 'l8.q', steps: [['c.box', 'l8.s1'], ['c.container', 'l8.s2'], ['c.truck', 'l8.s3'], ['c.ship', 'l8.s4'], ['c.customs', 'l8.s5'], ['c.shop', 'l8.s6']], done: 'l8.done' },
    { ch: 2, type: 'match', say: 'l9.q', pairs: [['c.factory', 'c.make'], ['c.shipco', 'c.carry'], ['c.customsP', 'c.check'], ['c.shopP', 'c.sell'], ['c.parent', 'c.buy']], done: 'l9.trade' },
    { ch: 3, type: 'order', say: 'l10.q', steps: [['c.raw', 'l10.s1'], ['c.cloth', 'l10.s2'], ['c.fac', 'l10.s3'], ['c.sea', 'l10.s4'], ['c.toShop', 'l10.s5'], ['c.home', 'l10.s6']], end: true },
  ];
  const STATIONS = [['map1', 'oil'], ['map2', 'factory'], ['map3', 'ship'], ['map4', 'home']];
  const KEY = 'toy-factory-v1';
  let state = { lv: 0, ended: false };
  try { state = Object.assign(state, JSON.parse(localStorage.getItem(KEY) || '{}')); } catch (e) { }
  const qs = new URLSearchParams(location.search);
  if (qs.get('l')) state.lv = Math.max(0, Math.min(LV.length - 1, +qs.get('l') - 1));
  if (qs.get('end')) { state.lv = LV.length; state.ended = true; }
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { } };

  // ---------- 旅程地圖 ----------
  function paintMap() {
    const ch = state.lv >= LV.length ? 3 : LV[state.lv].ch;
    mapEl.innerHTML = STATIONS.map(([k, ic], i) => (i ? '<i class="ln' + (i <= ch ? ' on' : '') + '"></i>' : '') +
      '<button class="st' + (i <= ch ? ' on' : '') + (i === ch ? ' cur' : '') + '" data-ch="' + i + '"><span class="ring">' + I[ic] + '</span><span class="nm">' + esc(T(k)) + '</span>' + (i === ch ? '<span class="bear">' + I.bear + '</span>' : '') + '</button>').join('');
    mapEl.querySelectorAll('.st').forEach(b => { b.onclick = () => { if (!state.ended) return; const i = LV.findIndex(l => l.ch === +b.dataset.ch); state.lv = i; start(); }; });
  }

  // ---------- 共用 ----------
  let keyHandler = null, wrong = 0;
  document.addEventListener('keydown', e => {
    if (e.repeat) return;
    if ((e.key === 'Enter' || e.key === ' ') && !nextBtn.hidden) { e.preventDefault(); nextBtn.click(); return; }
    if (keyHandler) keyHandler(e);
  });
  function cardEl(key, kc) {
    const d = document.createElement('button'); d.className = 'card'; d.dataset.key = key;
    d.innerHTML = (kc ? '<kbd class="kc">' + kc + '</kbd>' : '') + '<span class="ring">' + icon(key) + '</span><span class="nm">' + Z(key) + '</span>';
    return d;
  }
  const shake = el => { el.classList.remove('shake'); void el.offsetWidth; el.classList.add('shake'); };
  function miss(hintEl) { SFX.no(); wrong++; say(wrong >= 2 ? 'g.no2' : 'g.no1'); if (wrong >= 2 && hintEl) hintEl.classList.add('glow'); }
  const shuffle = a => { for (let i = a.length - 1; i > 0; i--) { const j = Math.random() * (i + 1) | 0;[a[i], a[j]] = [a[j], a[i]]; } return a; };
  function showNext(fn, label) {
    nextBtn.textContent = label || '繼續'; nextBtn.hidden = false; nextBtn.classList.add('glow');
    nextBtn.onclick = () => { nextBtn.hidden = true; nextBtn.classList.remove('glow'); SFX.tap(); fn(); };
  }
  function finishLevel(lv) {
    SFX.done();
    const after = () => { state.lv++; save(); if (state.lv >= LV.length) ending(); else start(); };
    if (lv.done) sayAfter(lv.done).then(() => showNext(after));
    else if (lv.end) qChain.then(after);
    else showNext(after);
  }

  // ---------- 連連看 ----------
  function match(lv) {
    const box = document.createElement('div'); box.className = 'match';
    box.innerHTML = '<div class="col L"></div><div class="col R"></div><svg class="lines"></svg>';
    stage.appendChild(box);
    const L = box.querySelector('.L'), R = box.querySelector('.R'), svg = box.querySelector('svg');
    const lefts = lv.pairs.map(p => p[0]), rights = shuffle(lv.pairs.map(p => p[1]));
    lefts.forEach((k, i) => L.appendChild(cardEl(k, 'ABCDE'[i])));
    rights.forEach((k, i) => R.appendChild(cardEl(k, String(i + 1))));
    let sel = null, left = lv.pairs.length;
    const center = el => { const b = el.getBoundingClientRect(), s = box.getBoundingClientRect(); return [b.left - s.left + (el.parentNode === L ? b.width : 0), b.top - s.top + b.height / 2]; };
    function pick(el) {
      if (el.classList.contains('ok')) return;
      SFX.tap(); say(el.dataset.key);
      if (!sel) { sel = el; el.classList.add('sel'); return; }
      if (sel === el) { sel.classList.remove('sel'); sel = null; return; }
      if (sel.parentNode === el.parentNode) { sel.classList.remove('sel'); sel = el; el.classList.add('sel'); return; }
      const a = sel.parentNode === L ? sel : el, b = a === sel ? el : sel;
      const pair = lv.pairs.find(p => p[0] === a.dataset.key);
      sel.classList.remove('sel'); sel = null;
      if (pair[1] !== b.dataset.key) { shake(b); miss(R.querySelector('[data-key="' + pair[1] + '"]')); return; }
      wrong = 0; R.querySelectorAll('.glow').forEach(x => x.classList.remove('glow'));
      a.classList.add('ok'); b.classList.add('ok');
      const [x1, y1] = center(a), [x2, y2] = center(b);
      const p = document.createElementNS('http://www.w3.org/2000/svg', 'path'); p.setAttribute('d', `M${x1} ${y1} C ${x1 + 40} ${y1}, ${x2 - 40} ${y2}, ${x2} ${y2}`); svg.appendChild(p);
      SFX.ok(); if (pair[2]) say(pair[2]); else say('g.good');
      if (--left === 0) finishLevel(lv);
    }
    box.querySelectorAll('.card').forEach(c => { c.onclick = () => pick(c); });
    keyHandler = e => {
      const k = e.key.toUpperCase(); let el = null;
      if ('ABCDE'.indexOf(k) >= 0) el = L.children['ABCDE'.indexOf(k)];
      else if ('12345'.indexOf(k) >= 0) el = R.children[+k - 1];
      if (el) pick(el);
    };
    say(lv.say, 'g.match');
  }

  // ---------- 排順序 ----------
  function order(lv) {
    const box = document.createElement('div'); box.className = 'order';
    box.innerHTML = '<div class="belt"></div><div class="pool"></div>';
    stage.appendChild(box);
    const belt = box.querySelector('.belt'), pool = box.querySelector('.pool');
    lv.steps.forEach((s, i) => { if (i) { const a = document.createElement('i'); a.className = 'arr'; belt.appendChild(a); } const d = document.createElement('div'); d.className = 'slot'; d.textContent = i + 1; belt.appendChild(d); });
    const cards = shuffle(lv.steps.map(s => s[0]));
    cards.forEach((k, i) => pool.appendChild(cardEl(k, String(i + 1))));
    let n = 0;
    function pick(el) {
      if (el.classList.contains('gone')) return;
      if (el.dataset.key !== lv.steps[n][0]) { shake(el); say(el.dataset.key); miss(pool.querySelector('[data-key="' + lv.steps[n][0] + '"]')); return; }
      wrong = 0; pool.querySelectorAll('.glow').forEach(x => x.classList.remove('glow'));
      SFX.fly(); el.classList.add('gone');
      const slot = belt.querySelectorAll('.slot')[n]; slot.innerHTML = icon(el.dataset.key); slot.classList.add('has'); slot.style.transform = 'scale(1.25)'; setTimeout(() => slot.style.transform = '', 250);
      say(lv.steps[n][1]); n++;
      if (n === lv.steps.length) finishLevel(lv);
    }
    pool.querySelectorAll('.card').forEach(c => { c.onclick = () => pick(c); });
    keyHandler = e => { const i = '123456'.indexOf(e.key); if (i >= 0 && pool.children[i]) pick(pool.children[i]); };
    say(lv.say, 'g.order');
  }

  // ---------- 選一個 ----------
  function pickOne(lv) {
    const box = document.createElement('div'); box.className = 'opts'; stage.appendChild(box);
    lv.opts.forEach((k, i) => { const b = document.createElement('button'); b.className = 'opt'; b.dataset.i = i; b.innerHTML = '<kbd class="kc">' + 'ABC'[i] + '</kbd><span class="ot">' + Z(k) + '</span>'; box.appendChild(b); });
    let over = false;
    function choose(i) {
      if (over) return; const b = box.children[i]; SFX.tap();
      if (i !== lv.ans) { shake(b); SFX.no(); wrong++; say(lv.no); if (wrong >= 2) box.children[lv.ans].classList.add('glow'); return; }
      over = true; wrong = 0; b.classList.add('ok'); box.querySelectorAll('.glow').forEach(x => x.classList.remove('glow'));
      SFX.ok(); say(lv.yes); finishLevel(lv);
    }
    box.querySelectorAll('.opt').forEach(b => { b.onclick = () => choose(+b.dataset.i); });
    keyHandler = e => { const i = 'ABC'.indexOf(e.key.toUpperCase()); if (i >= 0) choose(i); };
    say(lv.say, 'g.pick');
  }

  // ---------- 按住塞棉花 ----------
  function hold(lv) {
    const box = document.createElement('div'); box.className = 'hold';
    box.innerHTML = '<div class="bearBox"></div><div class="meter"><div class="zone"></div><div class="bar"></div></div><button class="big holdBtn"><kbd class="kc">␣</kbd> 按住</button>';
    stage.appendChild(box);
    const bb = box.querySelector('.bearBox'), bar = box.querySelector('.bar'), btn = box.querySelector('.holdBtn');
    let v = 0, down = false, over = false, raf, lastBlow = 0, last = performance.now(), downAt = 0, v0 = 0;
    const fill = () => { v = Math.min(1, v0 + (performance.now() - downAt) / 1000 * .36); };   // 按住約 2 秒到剛剛好，跟幀率無關
    const paint = () => { bb.innerHTML = bearSvg(.55 + v * .55); bar.style.width = (v * 100) + '%'; };
    function tick() {
      const now = performance.now(), dt = Math.min(.1, (now - last) / 1000); last = now;   // 以時間算，幀率快慢都一樣：按住約 2 秒到剛剛好
      if (down) { fill(); if (now - lastBlow > 180) { SFX.blow(); lastBlow = now; } }
      else if (over) { v = Math.max(0, v - dt * 1.2); if (v === 0) { over = false; say('l6.q'); } }
      paint(); raf = requestAnimationFrame(tick);
    }
    const press = e => { if (over || e.repeat) return; if (e.preventDefault) e.preventDefault(); if (!down) { down = true; downAt = performance.now(); v0 = v; btn.classList.add('down'); stopVoice(); } };
    const release = () => {
      if (!down) return; down = false; btn.classList.remove('down'); fill(); paint();
      if (v >= .62 && v <= .82) { cancelAnimationFrame(raf); paint(); box.querySelector('.bearBox').style.transform = 'scale(1.05)'; keyHandler = null; btn.disabled = true; SFX.ok(); say('l6.ok'); finishLevel(lv); }
      else if (v > .82) { over = true; SFX.no(); say('l6.over'); }
      else say('l6.more');
    };
    btn.addEventListener('pointerdown', press); box.addEventListener('pointerdown', press);
    window.addEventListener('pointerup', release); window.addEventListener('pointercancel', release);
    keyHandler = e => { if (e.key === ' ' || e.key === 'Enter') press(e); };
    document.addEventListener('keyup', e => { if (e.key === ' ' || e.key === 'Enter') release(); });
    paint(); tick();
    say(lv.say);
  }

  // ---------- 總結 ----------
  function ending() {
    RESTART.set(null);
    state.ended = true; save(); stage.innerHTML = ''; keyHandler = null; paintMap();
    const box = document.createElement('div'); box.className = 'ending';
    const trip = document.createElement('div'); trip.className = 'trip';
    LV[9].steps.forEach(s => trip.appendChild(cardEl(s[0])));
    box.appendChild(trip); stage.appendChild(box);
    trip.querySelectorAll('.card').forEach((c, i) => { c.classList.add('ok'); c.onclick = () => say(LV[9].steps[i][1]); });
    say('end.1', 'end.2', 'end.3', 'end.again').then(() => showNext(() => { state.lv = 0; state.ended = false; save(); start(); }, T('again')));
  }

  // ---------- 流程 ----------
  function start() {
    stage.innerHTML = ''; keyHandler = null; wrong = 0; nextBtn.hidden = true;
    if (state.lv >= LV.length) return ending();
    const lv = LV[state.lv]; paintMap();
    const here = state.lv + 1;
    RESTART.set(() => RESTART.reload({ l: here }));      // 重來：重新載入到這一關（?l=N），進度不丟
    const run = { match, order, pick: pickOne, hold }[lv.type];
    if (lv.intro && !FAST) { say(lv.intro).then(() => run(lv)); } else run(lv);
  }
  function intro() {
    RESTART.set(null);
    paintMap(); const box = document.createElement('div'); box.className = 'ending';
    box.innerHTML = '<div class="ring lg" style="color:var(--maroon)">' + I.bear + '</div>'; stage.appendChild(box);
    say('intro.1', 'intro.2').then(() => showNext(start, T('start')));
  }
  RESTART.init({ sound: () => !muted, stop: () => stopVoice() });
  if (state.lv === 0 && !state.ended && !qs.get('l')) intro(); else start();
  window.__tf = { LV, state: () => state, go: n => { state.lv = n - 1; start(); } };
})();
