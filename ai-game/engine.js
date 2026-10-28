// 共用引擎（ai-game、bowl-game 用同一份，改的時候兩邊一起改）：
// 注音排版、VoAI 預錄配音、音效、點擊／鍵盤／拖拉／按住、選擇題、關卡流程。
window.G = (() => {
  'use strict';
  const TX = window.TX;
  const $ = s => document.querySelector(s);
  const stage = $('#stage'), foot = $('#foot'), sayBox = $('#say'), bubble = $('#bubble'), dots = $('#dots');
  let SAVE_KEY = 'kids-game', N_CH = 10;
  const FAST = /[?&]fast=1/.test(location.search);    // 測試用：旁白不等待

  // ---------- 存檔 ----------
  const S = { done: 0, sound: true };
  const load = () => { try { Object.assign(S, JSON.parse(localStorage.getItem(SAVE_KEY)) || {}); } catch (e) { /* 無痕模式等 */ } };
  const save = () => { try { localStorage.setItem(SAVE_KEY, JSON.stringify(S)); } catch (e) { /* ignore */ } };

  // ---------- 小工具 ----------
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  function shuffle(a) {
    a = a.slice();
    for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
    return a;
  }
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  function shake(el) { el.classList.remove('wrong'); void el.offsetWidth; el.classList.add('wrong'); }
  const ring = (svg, size = 'md') => '<div class="ring ' + size + '">' + svg + '</div>';
  function parent(html, where = stage) {
    const d = document.createElement('div');
    d.className = 'parent'; d.innerHTML = '<b>給家長：</b>' + html;
    where.appendChild(d);
    return d;
  }

  // ---------- 注音排版：注音直排在字的右邊 ----------
  const CLOSE = '，。！？、：；」』）', OPEN = '「『（';
  function cell(ch, zy) {
    let h = '<span class="zc"><span class="zh">' + esc(ch) + '</span>';
    if (zy) {
      const light = zy.charAt(0) === '˙';
      let s = light ? zy.slice(1) : zy, tn = '';
      const last = s.charAt(s.length - 1);
      if ('ˊˇˋ'.indexOf(last) >= 0) { tn = last; s = s.slice(0, -1); }
      h += '<span class="zy' + (tn ? ' has-t' : '') + '">' + (light ? '<b class="tl">˙</b>' : '') +
        '<span class="zs">' + Array.from(s).map(c => '<i>' + c + '</i>').join('') + '</span>' +
        (tn ? '<b class="tn">' + tn + '</b>' : '') + '</span>';
    }
    return h + '</span>';
  }
  function Z(key) {
    const e = TX[key];
    if (!e) return esc(String(key));
    const cells = [];
    let pend = '';
    for (const it of e.z) {
      let h;
      if (typeof it === 'string') {
        if (it === ' ') { cells.push({ sp: 1 }); continue; }
        h = cell(it, '');
        if (CLOSE.includes(it) && cells.length && !cells[cells.length - 1].sp) { cells[cells.length - 1].h += h; continue; }
        if (OPEN.includes(it)) { pend = h; continue; }
      } else if (Array.isArray(it)) {
        h = cell(it[0], it[1]);
      } else {
        h = '<kbd class="kc">' + esc(it.k) + '</kbd>';
      }
      if (pend) { h = pend + h; pend = ''; }
      cells.push({ h });
    }
    return cells.map(c => c.sp ? ' ' : '<span class="nb">' + c.h + '</span>').join('');
  }

  // ---------- 音效（WebAudio 合成；不是語音） ----------
  let AC = null, NOISE = null;
  function ac() {
    if (!AC) AC = new (window.AudioContext || window.webkitAudioContext)();
    if (AC.state === 'suspended') AC.resume();
    return AC;
  }
  function tone(f, t0, dur, type = 'sine', vol = .16) {
    const o = AC.createOscillator(), g = AC.createGain();
    o.type = type; o.frequency.value = f;
    g.gain.setValueAtTime(0, AC.currentTime + t0);
    g.gain.linearRampToValueAtTime(vol, AC.currentTime + t0 + .02);
    g.gain.exponentialRampToValueAtTime(.001, AC.currentTime + t0 + dur);
    o.connect(g).connect(AC.destination); o.start(AC.currentTime + t0); o.stop(AC.currentTime + t0 + dur + .05);
  }
  function noise(t0, dur, freq = 1200, q = 1, vol = .15, type = 'bandpass') {
    if (!NOISE) {
      NOISE = AC.createBuffer(1, AC.sampleRate, AC.sampleRate);
      const d = NOISE.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    }
    const s = AC.createBufferSource(), f = AC.createBiquadFilter(), g = AC.createGain();
    s.buffer = NOISE; s.loop = true;
    f.type = type; f.frequency.value = freq; f.Q.value = q;
    const t = AC.currentTime + t0;
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(vol, t + Math.min(.05, dur / 4));
    g.gain.exponentialRampToValueAtTime(.001, t + dur);
    s.connect(f).connect(g).connect(AC.destination); s.start(t); s.stop(t + dur + .05);
  }
  // 金屬碗的泛音（比例取自頌缽的量測：大約 1 : 2.7 : 5.2 : 8.4）
  const BOWL = [[1, 1], [2.71, .42], [5.18, .17], [8.4, .06]];
  function strike(f0 = 220, vol = .22, len = 5) {
    if (!S.sound) return;
    try {
      ac();
      BOWL.forEach(([r, g], k) => {
        tone(f0 * r, 0, len / (1 + k * 1.3), 'sine', vol * g);
        tone(f0 * r + 1.3, 0, len / (1 + k * 1.3), 'sine', vol * g * .5);   // 微微的「嗡嗡」起伏
      });
    } catch (e) { /* 沒有 WebAudio 就算了 */ }
  }
  // 持續的磨缽聲：set(0..1) 控制大小
  function hum(f0 = 220) {
    let out = null, oscs = [];
    try {
      ac();
      out = AC.createGain(); out.gain.value = 0; out.connect(AC.destination);
      BOWL.forEach(([r, g]) => [0, 1.1].forEach(dt => {
        const o = AC.createOscillator(), gg = AC.createGain();
        o.frequency.value = f0 * r + dt; gg.gain.value = g * (dt ? .5 : 1);
        o.connect(gg).connect(out); o.start(); oscs.push(o);
      }));
    } catch (e) { out = null; }
    return {
      set(v) { if (out) out.gain.setTargetAtTime(S.sound ? clamp(v, 0, 1) * .2 : 0, AC.currentTime, .12); },
      pitch(f) { if (out) oscs.forEach((o, i) => o.frequency.setTargetAtTime(f * BOWL[i >> 1][0] + (i & 1 ? 1.1 : 0), AC.currentTime, .3)); },
      stop() {
        if (!out) return;
        out.gain.setTargetAtTime(0, AC.currentTime, .35);
        const os = oscs; oscs = [];
        setTimeout(() => os.forEach(o => { try { o.stop(); } catch (e) { /* ignore */ } }), 2500);
      },
    };
  }
  function sfx(name) {
    if (!S.sound) return;
    try {
      ac();
      if (name === 'ok') { tone(660, 0, .14); tone(880, .1, .22); }
      else if (name === 'no') { tone(240, 0, .22, 'triangle'); }
      else if (name === 'tap') { tone(520, 0, .07); }
      else if (name === 'win') { [523, 659, 784, 1047].forEach((f, i) => tone(f, i * .13, .3)); }
      else if (name === 'pop') { tone(700, 0, .08); tone(1050, .05, .08); }
      else if (name === 'step') { tone(330, 0, .08, 'square', .06); }
      else if (name === 'bump') { tone(150, 0, .2, 'square', .08); }
      else if (name === 'beep') { tone(988, 0, .09, 'square', .05); }
      else if (name === 'crack') { noise(0, .12, 2400, 1.5, .25); tone(180, 0, .1, 'triangle', .12); }
      else if (name === 'whoosh') { noise(0, .45, 500, .7, .2); }
      else if (name === 'pour') { noise(0, .25, 900, .8, .08); }
      else if (name === 'steam') { noise(0, 1.8, 3200, .6, .22, 'highpass'); }
      else if (name === 'scrub') { noise(0, .09, 2600, 1, .05); }
      else if (name === 'clang') { BOWL.forEach(([r, g]) => tone(520 * r, 0, .5, 'sine', .14 * g)); noise(0, .05, 3000, 1, .12); }
      else if (name === 'thud') { tone(110, 0, .18, 'triangle', .2); }
    } catch (e) { /* 沒有 WebAudio 就算了 */ }
  }

  // ---------- 配音：只播 VoAI 預錄的 audio/<id>.mp3（不使用瀏覽器內建的聲音） ----------
  // 還沒錄好的句子會安靜地顯示文字，停一小段「閱讀時間」再繼續。
  let audioEl = null, finishCur = null;
  const missing = new Set();
  function stopVoice() {
    if (audioEl) { try { audioEl.pause(); } catch (e) { /* ignore */ } audioEl = null; }
    if (finishCur) { const f = finishCur; finishCur = null; f(); }
  }
  function speak(key) {
    return new Promise(res => {
      stopVoice();
      const e = TX[key];
      if (!e) { res(); return; }
      let done = false, timer = 0;
      const fin = () => { if (done) return; done = true; clearTimeout(timer); if (finishCur === fin) finishCur = null; res(); };
      finishCur = fin;
      const quiet = () => {                       // 沒聲音時，給小朋友讀注音的時間
        if (e.v && !missing.has(key)) { missing.add(key); console.info('[配音] 找不到 audio/' + e.v + '.mp3 →', e.t); }
        timer = setTimeout(fin, FAST ? 30 : Math.max(1200, e.t.length * 220));
      };
      if (!S.sound || !e.v) { quiet(); return; }
      const a = new Audio('audio/' + e.v + '.mp3');
      audioEl = a;
      a.onended = fin;
      a.onerror = () => { if (audioEl === a) quiet(); };
      const p = a.play();
      if (p && p.catch) p.catch(() => { if (audioEl === a) quiet(); });
    });
  }
  let lastKey = null;
  function say(key) {
    lastKey = key;
    sayBox.hidden = false;
    bubble.innerHTML = '<span class="spk">' + speakerIcon + '</span><span class="bt">' + Z(key) + '</span>';
    return speak(key);
  }
  bubble.addEventListener('click', () => { if (lastKey) speak(lastKey); });
  const speakerIcon = '<svg viewBox="0 0 100 100" aria-hidden="true"><path d="M10 38 H28 L50 18 V82 L28 62 H10Z" fill="currentColor"/>' +
    '<g fill="none" stroke="currentColor" stroke-width="6" stroke-linecap="round"><path d="M62 36 Q74 50 62 64"/><path d="M72 24 Q94 50 72 76"/></g></svg>';

  // ---------- 等待點擊或鍵盤（用 ev.code，注音輸入法開著也收得到） ----------
  function keyName(ev) {
    const c = ev.code || '';
    let m;
    if ((m = /^Key([A-Z])$/.exec(c))) return m[1].toLowerCase();
    if ((m = /^(?:Digit|Numpad)(\d)$/.exec(c))) return m[1];
    if (c === 'Enter' || c === 'NumpadEnter') return 'enter';
    if (c === 'Space') return 'space';
    if (c === 'Backspace' || c === 'Delete') return 'back';
    if ((m = /^Arrow(Up|Down|Left|Right)$/.exec(c))) return m[1].toLowerCase();
    return '';
  }
  // targets: [{ el, keys:[…] } | null]，回傳被選到的索引
  function waitAction(targets) {
    return new Promise(res => {
      const offs = [];
      const done = i => { offs.forEach(f => f()); res(i); };
      targets.forEach((t, i) => {
        if (!t || !t.el) return;
        const h = () => done(i);
        t.el.addEventListener('click', h);
        offs.push(() => t.el.removeEventListener('click', h));
      });
      const kh = ev => {
        if (ev.ctrlKey || ev.metaKey || ev.altKey || ev.repeat) return;
        const k = keyName(ev);
        if (!k) return;
        const i = targets.findIndex(t => t && t.keys && t.keys.includes(k));
        if (i >= 0) { ev.preventDefault(); done(i); }
      };
      addEventListener('keydown', kh);
      offs.push(() => removeEventListener('keydown', kh));
    });
  }
  async function next(label = 'ui.next') {
    foot.innerHTML = '<button class="big" id="nx">' + Z(label) + ' ▶</button>';
    await waitAction([{ el: $('#nx'), keys: ['enter', 'space'] }]);
    sfx('tap');
    foot.innerHTML = '';
  }

  // ---------- 拖拉：把 items[i] 拖到 targets[t] 上；也可以「先點東西、再點位置」，或按鍵盤 ----------
  // items / targets 可以有 null（已經用掉的）。回傳 { i, t }；放到空白處會自己彈回去，不會回傳。
  // 放下之後東西停在放開的位置，呼叫端再決定 home(el)（彈回）或 dropInto(el, target)。
  function home(el) {
    el.classList.remove('dragging');
    el.style.transition = 'transform .25s ease';
    el.style.transform = '';
    setTimeout(() => { el.style.transition = ''; }, 260);
  }
  function dropInto(el, target) {
    el.classList.remove('dragging', 'picked');
    el.style.transition = ''; el.style.transform = '';
    target.appendChild(el);
  }
  const inside = (r, x, y, pad = 0) => x >= r.left - pad && x <= r.right + pad && y >= r.top - pad && y <= r.bottom + pad;
  function dragPick(items, targets, { itemKeys = [], targetKeys = [] } = {}) {
    return new Promise(res => {
      const offs = [];
      let picked = -1;
      const on = (el, ev, f, o) => { el.addEventListener(ev, f, o); offs.push(() => el.removeEventListener(ev, f, o)); };
      const finish = (i, t) => {
        offs.forEach(f => f());
        items.forEach(el => el && el.classList.remove('picked'));
        targets.forEach(el => el && el.classList.remove('over', 'ready'));
        res({ i, t });
      };
      const only = arr => { const k = arr.map((el, j) => el ? j : -1).filter(j => j >= 0); return k.length === 1 ? k[0] : -1; };
      const pick = i => {
        const t1 = only(targets);
        if (i >= 0 && t1 >= 0) { finish(i, t1); return; }   // 只剩一個位置：點一下就放進去
        picked = i;
        items.forEach((el, k) => el && el.classList.toggle('picked', k === i));
        targets.forEach(el => el && el.classList.toggle('ready', i >= 0));
        sfx('tap');
      };
      const hit = (x, y) => targets.findIndex(el => el && inside(el.getBoundingClientRect(), x, y, 6));
      items.forEach((el, i) => {
        if (!el) return;
        let st = null;
        on(el, 'pointerdown', ev => {
          if (ev.button > 0) return;
          ev.preventDefault();
          st = { x: ev.clientX, y: ev.clientY, moved: false, id: ev.pointerId };
          try { el.setPointerCapture(ev.pointerId); } catch (e) { /* ignore */ }
        });
        on(el, 'pointermove', ev => {
          if (!st || ev.pointerId !== st.id) return;
          const dx = ev.clientX - st.x, dy = ev.clientY - st.y;
          if (!st.moved && Math.hypot(dx, dy) < 8) return;
          if (!st.moved) { st.moved = true; el.classList.add('dragging'); el.style.transition = ''; }
          el.style.transform = 'translate(' + dx + 'px,' + dy + 'px)';
          const t = hit(ev.clientX, ev.clientY);
          targets.forEach((tg, k) => tg && tg.classList.toggle('over', k === t));
        });
        const up = ev => {
          if (!st || ev.pointerId !== st.id) return;
          const was = st; st = null;
          if (!was.moved) { pick(picked === i ? -1 : i); return; }
          const t = ev.type === 'pointercancel' ? -1 : hit(ev.clientX, ev.clientY);
          el.classList.remove('dragging');
          if (t >= 0) finish(i, t); else { home(el); targets.forEach(tg => tg && tg.classList.remove('over')); }
        };
        on(el, 'pointerup', up); on(el, 'pointercancel', up);
      });
      targets.forEach((el, t) => {
        if (!el) return;
        on(el, 'click', () => {
          const i = picked >= 0 ? picked : only(items);     // 只剩一個東西：直接點位置就好
          if (i >= 0 && items[i]) finish(i, t);
        });
      });
      on(window, 'keydown', ev => {
        if (ev.ctrlKey || ev.metaKey || ev.altKey || ev.repeat) return;
        const k = keyName(ev);
        if (!k) return;
        const i = itemKeys.findIndex((ks, j) => items[j] && ks && ks.includes(k));
        if (i >= 0) { ev.preventDefault(); pick(i); return; }
        const t = targetKeys.findIndex((ks, j) => targets[j] && ks && ks.includes(k));
        const i2 = picked >= 0 ? picked : only(items);
        if (t >= 0 && i2 >= 0) { ev.preventDefault(); finish(i2, t); }
      });
    });
  }

  // ---------- 按住：滑鼠／手指按住 el，或按住鍵盤上的 keys ----------
  // 每 30 毫秒呼叫一次 tick(dt秒, 是否按著)；tick 回傳真值就結束，並回傳那個值。
  // （不用 requestAnimationFrame：預覽分頁在背景時它會停。）
  function holdLoop(el, keys, tick) {
    return new Promise(res => {
      let down = false, last = performance.now();
      const set = v => { down = v; if (el) el.classList.toggle('down', v); };
      const pd = ev => { ev.preventDefault(); set(true); try { el.setPointerCapture(ev.pointerId); } catch (e) { /* ignore */ } };
      const pu = () => set(false);
      const kd = ev => { if (keys.includes(keyName(ev))) { ev.preventDefault(); if (!ev.repeat) set(true); } };
      const ku = ev => { if (keys.includes(keyName(ev))) set(false); };
      if (el) { el.addEventListener('pointerdown', pd); el.addEventListener('pointerup', pu); el.addEventListener('pointercancel', pu); }
      addEventListener('keydown', kd); addEventListener('keyup', ku);
      const iv = setInterval(() => {
        const now = performance.now(), dt = Math.min(.1, (now - last) / 1000); last = now;
        const r = tick(dt, down);
        if (r) {
          clearInterval(iv);
          if (el) { el.removeEventListener('pointerdown', pd); el.removeEventListener('pointerup', pu); el.removeEventListener('pointercancel', pu); el.classList.remove('down'); }
          removeEventListener('keydown', kd); removeEventListener('keyup', ku);
          res(r);
        }
      }, 30);
    });
  }

  // ---------- 追蹤手指／滑鼠在 el 上的移動（磨缽、擦亮、畫線用） ----------
  // cb.down/move/up 收到 { x, y }（el 裡的像素座標）與 ev；回傳取消函式
  function track(el, cb) {
    let id = null;
    const pos = ev => { const r = el.getBoundingClientRect(); return { x: ev.clientX - r.left, y: ev.clientY - r.top, w: r.width, h: r.height }; };
    const d = ev => { if (ev.button > 0) return; ev.preventDefault(); id = ev.pointerId; try { el.setPointerCapture(id); } catch (e) { /* ignore */ } cb.down && cb.down(pos(ev), ev); };
    const m = ev => { if (id === null || ev.pointerId !== id) return; cb.move && cb.move(pos(ev), ev); };
    const u = ev => { if (id === null || ev.pointerId !== id) return; id = null; cb.up && cb.up(pos(ev), ev); };
    el.addEventListener('pointerdown', d); el.addEventListener('pointermove', m);
    el.addEventListener('pointerup', u); el.addEventListener('pointercancel', u);
    return () => { el.removeEventListener('pointerdown', d); el.removeEventListener('pointermove', m); el.removeEventListener('pointerup', u); el.removeEventListener('pointercancel', u); };
  }
  // 一直按某些鍵：每按一下呼叫 f(key)；回傳取消函式
  function onKeys(keys, f) {
    const h = ev => {
      if (ev.ctrlKey || ev.metaKey || ev.altKey || ev.repeat) return;
      const k = keyName(ev);
      if (keys.includes(k)) { ev.preventDefault(); f(k); }
    };
    addEventListener('keydown', h);
    return () => removeEventListener('keydown', h);
  }

  function setDots(cur) {
    dots.innerHTML = Array.from({ length: N_CH }, (_, i) => '<i class="' + (i < cur ? 'on' : i === cur ? 'cur' : '') + '"></i>').join('');
  }

  // ---------- 選擇題：選項標 A B C，可點也可按鍵盤 ----------
  async function quiz({ q, show, showRaw, opts, ok, after, noShuffle, onPick }) {
    sayBox.hidden = false;
    const ord = noShuffle ? opts.map((_, i) => i) : shuffle(opts.map((_, i) => i));
    stage.innerHTML = '<div class="qshow">' + (showRaw || (show ? ring(show, 'lg') : '')) + '</div><div class="opts n' + opts.length + '">' +
      ord.map((oi, p) => {
        const o = opts[oi];
        return '<button class="opt"><kbd class="kc">' + 'ABCD'[p] + '</kbd><span class="oa">' + (o.art ? ring(o.art, 'sm') : '') +
          '</span><span class="ot">' + (o.text ? Z(o.text) : '') + '</span></button>';
      }).join('') + '</div>';
    foot.innerHTML = '';
    const btns = [...stage.querySelectorAll('.opt')];
    const right = ord.findIndex(oi => opts[oi].ok);
    const alive = btns.map((b, p) => ({ el: b, keys: ['abcd'[p]] }));
    say(q);
    let tries = 0;
    for (;;) {
      const p = await waitAction(alive);
      if (onPick) onPick(ord[p]);
      if (p === right) {
        btns[p].classList.add('right');
        btns.forEach((b, k) => { if (k !== p) b.classList.add('dim'); });
        btns.forEach(b => b.classList.remove('hint'));
        sfx('ok'); if (after) after();
        await say(ok);
        break;
      }
      btns[p].classList.add('wrong');
      alive[p] = null;
      sfx('no');
      tries++;
      speak(tries === 1 ? 'g.no1' : 'g.no2');
      if (tries >= 2) btns[right].classList.add('hint');
    }
    await next();
  }

  // ---------- 開場、標題卡、結尾、主流程 ----------
  async function intro(cfg) {
    setDots(-1);
    sayBox.hidden = true;
    stage.innerHTML = '<div class="hero">' + (cfg.heroArt ? ring(cfg.heroArt, 'lg') : '<div class="stamp">' + cfg.stamp + '</div>') +
      '<div class="t"><div class="logo">' + Z('ui.title') + '</div><div class="sub">' + Z('ui.sub') + '</div></div></div>';
    if (S.done > 0 && S.done < N_CH) {
      foot.innerHTML = '<button class="big" id="b1">' + Z('ui.cont') + '</button><button class="big alt" id="b2">' + Z('ui.restart') + '</button>';
      const i = await waitAction([{ el: $('#b1'), keys: ['enter', 'space'] }, { el: $('#b2'), keys: [] }]);
      sfx('tap');
      foot.innerHTML = '';
      if (i === 1) { S.done = 0; save(); }
      return S.done;
    }
    S.done = 0;
    foot.innerHTML = '<button class="big" id="go"><kbd class="kc">S</kbd> ' + Z('ui.go') + '</button>';
    let started = false;
    (async () => {
      for (const k of ['intro.hi', 'intro.found', 'intro.press']) { if (started) return; await say(k); }
    })();
    await waitAction([{ el: $('#go'), keys: ['s'] }]);
    started = true;
    sfx('ok'); stopVoice();
    foot.innerHTML = '';
    return 0;
  }

  async function titleCard(i) {
    sayBox.hidden = true;
    foot.innerHTML = '';
    stage.innerHTML = '<div class="center"><div class="chnum">' + (i + 1) + '</div><div class="chtitle">' + Z('c' + (i + 1) + '.title') + '</div></div>';
    await Promise.all([speak('c' + (i + 1) + '.title'), sleep(FAST ? 50 : 1600)]);
  }

  async function run(cfg) {
    SAVE_KEY = cfg.saveKey; N_CH = cfg.chapters.length;
    load();
    const qs = new URLSearchParams(location.search);
    let from;
    if (qs.has('ch')) from = clamp((+qs.get('ch') || 1) - 1, 0, N_CH - 1);   // 測試用：?ch=3 直接跳到第三關
    else from = await intro(cfg);
    for (let i = from; i < N_CH; i++) {
      setDots(i);
      await titleCard(i);
      stage.innerHTML = ''; foot.innerHTML = '';
      await cfg.chapters[i]();
      stopVoice();
      S.done = i + 1; save();
    }
    S.done = N_CH; save();
    setDots(N_CH);
    await cfg.finale();
    foot.innerHTML = '<button class="big" id="again">' + Z('ui.again') + '</button>';
    await waitAction([{ el: $('#again'), keys: ['enter', 'space'] }]);
    S.done = 0; save(); location.href = location.pathname;
  }

  // ---------- 上方按鈕 ----------
  $('#homeBtn').addEventListener('click', () => { stopVoice(); location.href = location.pathname; });
  const sndBtn = $('#sndBtn');
  const paintSnd = () => { sndBtn.innerHTML = speakerIcon + '聲音 ' + (S.sound ? '開' : '關'); };
  sndBtn.addEventListener('click', () => { S.sound = !S.sound; save(); paintSnd(); if (!S.sound) stopVoice(); });
  // 存檔 key 要等 run() 才知道，所以聲音開關先畫一次，run() 讀檔後再畫
  paintSnd();
  const run0 = run;

  return {
    $, stage, foot, sayBox, S, save, sleep, shuffle, clamp, shake, ring, parent, esc,
    Z, sfx, strike, hum, speak, say, stopVoice, waitAction, next, keyName,
    dragPick, home, dropInto, holdLoop, track, onKeys, quiz, setDots,
    run: cfg => { SAVE_KEY = cfg.saveKey; load(); paintSnd(); return run0(cfg); },
  };
})();
