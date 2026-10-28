// 種子小偵探：七關、約 15 分鐘。文字在 content.js（由 tools/build.py 產生）、插圖在 art.js。
(() => {
  'use strict';
  const TX = window.TX, A = window.A;
  const $ = s => document.querySelector(s);
  const stage = $('#stage'), foot = $('#foot'), sayBox = $('#say'), bubble = $('#bubble'), dots = $('#dots');
  const SAVE_KEY = 'seed-game-v1';
  const N_CH = 8;

  // ---------- 存檔 ----------
  let S = { done: 0, sound: true };
  try { Object.assign(S, JSON.parse(localStorage.getItem(SAVE_KEY)) || {}); } catch (e) { /* 無痕模式等 */ }
  const save = () => { try { localStorage.setItem(SAVE_KEY, JSON.stringify(S)); } catch (e) { /* ignore */ } };

  // ---------- 小工具 ----------
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const esc = s => s.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  function shuffle(a) {
    a = a.slice();
    for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
    return a;
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

  // ---------- 音效 ----------
  let AC;
  function tone(f, t0, dur, type = 'sine', vol = .16) {
    const o = AC.createOscillator(), g = AC.createGain();
    o.type = type; o.frequency.value = f;
    g.gain.setValueAtTime(0, AC.currentTime + t0);
    g.gain.linearRampToValueAtTime(vol, AC.currentTime + t0 + .02);
    g.gain.exponentialRampToValueAtTime(.001, AC.currentTime + t0 + dur);
    o.connect(g).connect(AC.destination); o.start(AC.currentTime + t0); o.stop(AC.currentTime + t0 + dur + .05);
  }
  function sfx(name) {
    if (!S.sound) return;
    try {
      AC = AC || new (window.AudioContext || window.webkitAudioContext)();
      if (name === 'ok') { tone(660, 0, .14); tone(880, .1, .22); }
      else if (name === 'no') { tone(240, 0, .22, 'triangle'); }
      else if (name === 'tap') { tone(520, 0, .07); }
      else if (name === 'win') { [523, 659, 784, 1047].forEach((f, i) => tone(f, i * .13, .3)); }
      else if (name === 'water') { tone(900, 0, .08); tone(700, .09, .1); }
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
        timer = setTimeout(fin, Math.max(1200, e.t.length * 260));
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
    bubble.innerHTML = '<span class="spk">' + A.speaker() + '</span><span class="bt">' + Z(key) + '</span>';
    return speak(key);
  }
  bubble.addEventListener('click', () => { if (lastKey) speak(lastKey); });

  // ---------- 等待點擊或鍵盤 ----------
  function keyName(ev) {
    const c = ev.code || '';
    let m;
    if ((m = /^Key([A-Z])$/.exec(c))) return m[1].toLowerCase();
    if ((m = /^(?:Digit|Numpad)(\d)$/.exec(c))) return m[1];
    if (c === 'Enter' || c === 'NumpadEnter') return 'enter';
    if (c === 'Space') return 'space';
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

  function setDots(cur) {
    dots.innerHTML = Array.from({ length: N_CH }, (_, i) => '<i class="' + (i < cur ? 'on' : i === cur ? 'cur' : '') + '"></i>').join('');
  }

  const ring = (svg, size = 'md') => '<div class="ring ' + size + '">' + svg + '</div>';

  // ---------- 共用關卡元件 ----------
  // 選擇題：選項標 A B C，可點也可按鍵盤
  async function quiz({ q, show, showRaw, opts, ok, after }) {
    sayBox.hidden = false;
    const ord = shuffle(opts.map((_, i) => i));
    stage.innerHTML = '<div class="qshow">' + (showRaw || (show ? ring(show, 'lg') : '')) + '</div><div class="opts n' + opts.length + '">' +
      ord.map((oi, p) => {
        const o = opts[oi];
        return '<button class="opt"><kbd class="kc">' + 'ABC'[p] + '</kbd><span class="oa">' + (o.art ? ring(o.art, 'sm') : '') +
          '</span><span class="ot">' + (o.text ? Z(o.text) : '') + '</span></button>';
      }).join('') + '</div>';
    foot.innerHTML = '';
    const btns = [...stage.querySelectorAll('.opt')];
    const right = ord.findIndex(oi => opts[oi].ok);
    const alive = btns.map((b, p) => ({ el: b, keys: ['abc'[p]] }));
    say(q);
    let tries = 0;
    for (;;) {
      const p = await waitAction(alive);
      if (p === right) {
        btns[p].classList.add('right');
        btns.forEach((b, k) => { if (k !== p) b.classList.add('dim'); });
        btns.forEach(b => b.classList.remove('hint'));
        sfx('ok'); if (after) after();
        say(ok);
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

  // 排順序：把亂掉的卡片，照正確順序一張一張點
  async function order({ intro, items, done }) {
    const n = items.length;
    const ord = shuffle(items.map((_, i) => i));
    stage.innerHTML = '<div class="slots">' + items.map((_, i) => '<div class="slot">' + (i + 1) + '</div>').join('') + '</div>' +
      '<div class="cards">' + ord.map(i => '<button class="card">' + ring(items[i].art) + '<span>' + Z(items[i].label) + '</span></button>').join('') + '</div>';
    foot.innerHTML = '';
    const slots = [...stage.querySelectorAll('.slot')];
    const cards = [...stage.querySelectorAll('.card')];
    const alive = cards.map((c, k) => ({ el: c, keys: [String(k + 1)] }));
    say(intro);
    let exp = 0, wrong = 0;
    while (exp < n) {
      const k = await waitAction(alive);
      if (ord[k] === exp) {
        const s = slots[exp];
        s.classList.add('f');
        s.innerHTML = items[exp].art + '<b>' + (exp + 1) + '</b>';
        cards[k].classList.add('gone');
        cards.forEach(c => c.classList.remove('hint'));
        alive[k] = null;
        sfx('ok');
        exp++; wrong = 0;
        const p = say(items[exp - 1].say);
        if (exp === n) await p;
      } else {
        cards[k].classList.remove('wrong'); void cards[k].offsetWidth; cards[k].classList.add('wrong');
        sfx('no');
        speak('g.order');
        if (++wrong >= 2) cards[ord.indexOf(exp)].classList.add('hint');
      }
    }
    sfx('win');
    await say(done);
  }

  // ---------- 開場 ----------
  async function intro() {
    setDots(-1);
    sayBox.hidden = true;
    stage.innerHTML = '<div class="hero"><div class="stamp">種子</div><div class="t"><div class="logo">' + Z('ui.title') + '</div><div class="sub">' + Z('ui.sub') + '</div></div></div>';
    if (S.done > 0 && S.done < N_CH) {
      foot.innerHTML = '<button class="big" id="b1">' + Z('ui.cont') + '</button><button class="big alt" id="b2" style="margin-left:14px">' + Z('ui.restart') + '</button>';
      const i = await waitAction([{ el: $('#b1'), keys: ['enter', 'space'] }, { el: $('#b2'), keys: [] }]);
      foot.innerHTML = '';
      if (i === 1) { S.done = 0; save(); }
      return S.done;
    }
    S.done = 0;
    foot.innerHTML = '<button class="big" id="go"><kbd class="kc">S</kbd> ' + Z('ui.go') + '</button>';
    let started = false;
    (async () => {
      await say('intro.hi'); if (started) return;
      await say('intro.found'); if (started) return;
      await say('intro.press');
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
    await Promise.all([speak('c' + (i + 1) + '.title'), sleep(1600)]);
  }

  // ---------- 第一關：找種子 ----------
  async function ch1() {
    say('c1.intro');
    const items = [
      { whole: A.appleWhole(), open: A.appleHalf(), say: 'c1.apple', lab: 'c1.apple.l' },
      { whole: A.mangoWhole(), open: A.mangoHalf(), say: 'c1.mango', lab: 'c1.mango.l' },
      { whole: A.pinecone(), open: A.pineOpen(), say: 'c1.pine', lab: 'c1.pine.l' },
    ];
    stage.innerHTML = '<div class="reveal">' + items.map(it =>
      '<button class="rv todo">' + ring(it.whole, 'lg') + '<span>' + Z(it.lab) + '</span></button>').join('') + '</div>';
    foot.innerHTML = '';
    const btns = [...stage.querySelectorAll('.rv')];
    const alive = btns.map((b, i) => ({ el: b, keys: [String(i + 1)] }));
    let opened = 0;
    while (opened < 3) {
      const i = await waitAction(alive);
      alive[i] = null;
      const b = btns[i];
      b.classList.remove('todo'); b.classList.add('open');
      b.querySelector('svg').outerHTML = items[i].open;
      sfx('ok');
      opened++;
      const p = say(items[i].say);
      if (opened === 3) await p;
    }
    await say('c1.done');
    await quiz({
      q: 'c1.q', ok: 'c1.ok',
      opts: [{ text: 'c1.o1', art: A.appleHalf(), ok: true }, { text: 'c1.o2', art: A.rock() }, { text: 'c1.o3', art: A.cloud() }],
    });
  }

  // ---------- 第二關：種子怎麼來 ----------
  async function ch2() {
    await order({
      intro: 'c2.intro', done: 'c2.done',
      items: [
        { art: A.flowerCut(), label: 'c2.l1', say: 'c2.n1' },
        { art: A.flowerBee(), label: 'c2.l2', say: 'c2.n2' },
        { art: A.tinyFruitCut(), label: 'c2.l3', say: 'c2.n3' },
        { art: A.appleHalf(), label: 'c2.l4', say: 'c2.n4' },
      ],
    });
    await next();
    await quiz({
      q: 'c2.q', show: A.flowerBee(), ok: 'c2.ok',
      opts: [{ text: 'c2.o1', art: A.flowerCut(), ok: true }, { text: 'c2.o2', art: A.appleWhole() }, { text: 'c2.o3', art: A.sprout() }],
    });
  }

  // ---------- 第三關：種子變成樹（按 W 澆水、按 S 曬太陽） ----------
  async function ch3() {
    sayBox.hidden = false;
    stage.innerHTML = '<div class="grow todo" id="gr">' + A.growScene() + '<div class="sun" id="sun">' + A.sun() + '</div></div>' +
      '<div class="keys"><button class="keybtn" id="kw"><kbd class="kc">W</kbd>' + A.drop() + '</button><button class="keybtn" id="ks"><kbd class="kc">S</kbd>' + A.sun() + '</button></div>';
    foot.innerHTML = '';
    const gr = $('#gr'), kw = $('#kw'), ks = $('#ks'), sun = $('#sun');
    const groups = [...gr.querySelectorAll('g[data-from]')];
    const setStage = n => groups.forEach(g => { g.style.opacity = (n >= +g.dataset.from && n <= +g.dataset.to) ? 1 : 0; });
    const mark = want => { kw.classList.toggle('want', want === 'w'); ks.classList.toggle('want', want === 's'); };
    const drops = () => {
      for (let i = 0; i < 6; i++) {
        const d = document.createElement('span');
        d.className = 'fx'; d.innerHTML = A.drop();
        d.style.left = (30 + Math.random() * 40) + '%'; d.style.top = (6 + Math.random() * 12) + '%';
        d.style.animationDelay = (i * .12) + 's';
        gr.appendChild(d); setTimeout(() => d.remove(), 2200);
      }
    };
    setStage(0); mark('');
    say('c3.intro');
    await waitAction([{ el: gr, keys: ['space', 'enter'] }]);
    gr.classList.remove('todo');
    sfx('ok'); setStage(1);
    await say('c3.s1');

    const want = ['w', 'w', 's', 's', 'w', 's'];
    for (let k = 1; k <= 6; k++) {
      mark(want[k - 1]);
      say('c3.k' + k);
      for (;;) {
        const i = await waitAction([{ el: kw, keys: ['w'] }, { el: ks, keys: ['s'] }]);
        if ('ws'[i] === want[k - 1]) break;
        const b = i ? ks : kw;
        b.classList.remove('wrong'); void b.offsetWidth; b.classList.add('wrong');
        sfx('no');
      }
      mark('');
      if (want[k - 1] === 'w') { sfx('water'); drops(); }
      else { sfx('ok'); sun.classList.add('on'); setTimeout(() => sun.classList.remove('on'), 2600); }
      setStage(k + 1);
      const p = say('c3.s' + (k + 1));
      if (k === 6) { sfx('win'); await p; } else await p;
    }
    await say('c3.done');
    await quiz({
      q: 'c3.q', show: A.sprout(), ok: 'c3.ok',
      opts: [{ text: 'c3.o1', art: A.root(), ok: true }, { text: 'c3.o2', art: A.leaf() }, { text: 'c3.o3', art: A.flower() }],
    });
  }

  // ---------- 第四關：認識六種樹的種子 ----------
  const IDS = ['oak', 'pine', 'maple', 'coconut', 'mango', 'apple'];
  async function ch4() {
    sayBox.hidden = false;
    stage.innerHTML = '<div class="focus empty" id="fc">' + Z('c4.tap') + '</div>' +
      '<div class="grid6">' + IDS.map((id, i) =>
        '<button class="sd"><span class="num">' + (i + 1) + '</span>' + ring(A.SEED_ART[id]()) + '<span>' + Z('seed.' + id) + '</span></button>').join('') + '</div>';
    foot.innerHTML = '';
    const btns = [...stage.querySelectorAll('.sd')];
    const alive = btns.map((b, i) => ({ el: b, keys: [String(i + 1)] }));
    const fc = $('#fc');
    say('c4.intro');
    const seen = new Set();
    while (seen.size < IDS.length) {
      const i = await waitAction(alive);
      const id = IDS[i];
      btns.forEach(b => b.classList.remove('sel'));
      btns[i].classList.add('seen', 'sel');
      fc.className = 'focus';
      fc.innerHTML = ring(A.SEED_ART[id](), 'md') + '<div><div class="nm">' + Z('seed.' + id) + '</div><div class="tr">→ ' + Z('tree.' + id) + '</div></div>';
      sfx('tap');
      seen.add(id);
      const p = say('info.' + id);
      if (seen.size === IDS.length) await p;
    }
    await say('c4.done');
    await next();
  }

  // ---------- 第五關：種子配對 ----------
  async function ch5() {
    await say('c5.intro');
    for (const id of shuffle(IDS).slice(0, 4)) {
      const others = shuffle(IDS.filter(x => x !== id)).slice(0, 2);
      await quiz({
        q: 'q5.' + id, show: A.SEED_ART[id](), ok: 'ok5.' + id,
        opts: [{ text: 'tree.' + id, art: A.TREES[id](), ok: true }].concat(others.map(o => ({ text: 'tree.' + o, art: A.TREES[o]() }))),
      });
    }
  }

  // ---------- 第六關：種子去旅行 ----------
  async function ch6() {
    await say('c6.intro');
    const rounds = [
      { n: 1, seed: A.samara(), who: 'wind' },
      { n: 2, seed: A.coconut(), who: 'water' },
      { n: 3, seed: A.acorn(), who: 'animal' },
    ];
    const helper = { wind: [A.wind(), 'h.wind'], water: [A.wave(), 'h.water'], animal: [A.squirrel(), 'h.animal'] };
    for (const r of rounds) {
      await quiz({
        q: 'c6.q' + r.n, ok: 'c6.ok' + r.n,
        showRaw: '<div class="travel ' + r.who + '" id="tv"><div class="tseed" id="ts">' + r.seed + '</div></div>',
        opts: ['wind', 'water', 'animal'].map(w => ({ text: helper[w][1], art: helper[w][0], ok: w === r.who })),
        after: () => {
          const tv = $('#tv'), ts = $('#ts');
          const who = document.createElement('div');
          who.className = 'twho'; who.innerHTML = helper[r.who][0];
          tv.appendChild(who);
          void tv.offsetWidth;                       // 先讓瀏覽器排版一次，transition 才會動
          ts.style.left = '78%';
          ts.style.bottom = r.who === 'wind' ? '52%' : r.who === 'water' ? '34%' : '12%';
          who.style.transition = 'left 2.4s ease-in-out'; who.style.left = '70%';
          if (r.who === 'animal') setTimeout(() => { const s = document.createElement('div'); s.className = 'twho'; s.style.left = '80%'; s.style.top = '38%'; s.innerHTML = A.sprout(); tv.appendChild(s); }, 2500);
        },
      });
    }
    await say('c6.done');
    await next();
  }

  // ---------- 第七關：種子的一生 ----------
  async function ch7() {
    await order({
      intro: 'c7.intro', done: 'c7.done',
      items: [
        { art: A.acorn(), label: 'c7.l1', say: 'c7.n1' },
        { art: A.sprout(), label: 'c7.l2', say: 'c7.n2' },
        { art: A.bigTree(), label: 'c7.l3', say: 'c7.n3' },
        { art: A.floweringTree(), label: 'c7.l4', say: 'c7.n4' },
        { art: A.fruitTree(), label: 'c7.l5', say: 'c7.n5' },
      ],
    });
    const cy = document.createElement('div');
    cy.className = 'cycle'; cy.innerHTML = A.cycle();
    stage.appendChild(cy);
    await next();
  }

  // ---------- 加碼關：最早的種子 ----------
  async function ch8() {
    await order({
      intro: 'c8.intro', done: 'c8.done',
      items: [
        { art: A.fern(), label: 'c8.l1', say: 'c8.n1' },
        { art: A.pinecone(), label: 'c8.l2', say: 'c8.n2' },
        { art: A.flowerCut(), label: 'c8.l3', say: 'c8.n3' },
      ],
    });
    const note = document.createElement('div');
    note.className = 'parent';
    note.innerHTML = '<b>給家長：</b>化石證據顯示，種子植物約在 3.6 億年前（泥盆紀晚期）出現，最早的開花植物約在 1.3 億年前（白堊紀早期，確切時間仍有討論）。' +
      '孢子通常是單一細胞，沒有儲存養分；種子裡有胚、養分和種皮。第一顆種子不是某一天突然出現，是很多代慢慢演變出來的。';
    stage.appendChild(note);
    await next();
    await quiz({
      q: 'c8.q', ok: 'c8.ok',
      opts: [{ text: 'c8.o1', art: A.acorn(), ok: true }, { text: 'c8.o2', art: A.flowerCut() }],
    });
  }

  // ---------- 結尾 ----------
  async function finale() {
    S.done = N_CH; save();
    setDots(N_CH);
    sayBox.hidden = false;
    stage.innerHTML = '<div class="center"><div class="stamp">種子<br>博士</div><div class="chtitle">' + Z('fin.title') + '</div>' +
      '<div class="stickers">' + IDS.map(id => ring(A.SEED_ART[id](), 'md')).join('') + '</div>' +
      '<div style="font-size:24px">' + Z('fin.got') + '</div>' +
      '<div class="parent"><b>給家長：</b>回家後可以一起做兩件事 —— ①把一顆綠豆或黃豆放在濕紙巾上，每天看牠怎麼長根、長芽；②散步時撿橡實、松果、楓香果，比一比哪些種子長得像今天認識的。</div></div>';
    foot.innerHTML = '';
    sfx('win');
    (async () => { await say('fin.hi'); await say('fin.task'); })();
    foot.innerHTML = '<button class="big" id="again">' + Z('ui.again') + '</button>';
    await waitAction([{ el: $('#again'), keys: ['enter', 'space'] }]);
    S.done = 0; save(); location.reload();
  }

  // ---------- 主流程 ----------
  const CH = [ch1, ch2, ch3, ch4, ch5, ch6, ch7, ch8];
  async function main() {
    const qs = new URLSearchParams(location.search);
    let from;
    if (qs.has('ch')) from = Math.max(0, Math.min(N_CH - 1, (+qs.get('ch') || 1) - 1));   // 測試用：?ch=3 直接跳到第三關
    else from = await intro();
    for (let i = from; i < N_CH; i++) {
      setDots(i);
      await titleCard(i);
      await CH[i]();
      S.done = i + 1; save();
    }
    await finale();
  }

  // ---------- 上方按鈕 ----------
  $('#homeBtn').addEventListener('click', () => { stopVoice(); location.href = location.pathname; });
  const sndBtn = $('#sndBtn');
  const paintSnd = () => { sndBtn.innerHTML = A.speaker() + '聲音 ' + (S.sound ? '開' : '關'); };
  sndBtn.addEventListener('click', () => { S.sound = !S.sound; save(); paintSnd(); if (!S.sound) stopVoice(); });
  paintSnd();

  main();
})();
