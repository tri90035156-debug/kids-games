// AI 從哪裡來：十關。文字在 content.js（由 tools/build.py 產生）、插圖在 art.js、共用引擎在 engine.js。
(() => {
  'use strict';
  const A = window.A, TX = window.TX;
  const { $, stage, foot, sayBox, sleep, shuffle, shake, ring, parent, Z, sfx, speak, say, waitAction, next,
    dragPick, home, dropInto, holdLoop, track, onKeys, quiz } = G;
  const show = () => { sayBox.hidden = false; foot.innerHTML = ''; };

  // ---------- 第一關：人愛做工具 ----------
  async function ch1() {
    show();
    const parts = ['hand', 'foot', 'eye', 'ear', 'head'];
    const tools = ['hammer', 'bike', 'glasses', 'phone'];
    stage.innerHTML = '<div class="bodyrow">' + parts.map((p, i) =>
      '<div class="zone bp"><span class="num">' + (i + 1) + '</span>' + ring(A[p](), 'sm') + '<span class="bl">' + Z('p.' + p) + '</span><span class="slot1"></span></div>').join('') + '</div>' +
      '<div class="toolrow">' + tools.map((t, i) =>
        '<div class="chip drag"><kbd class="kc">' + 'ABCD'[i] + '</kbd>' + ring(A[t](), 'sm') + '<span class="cl">' + Z('t.' + t) + '</span></div>').join('') +
      '<div class="chip drag" id="aiChip" hidden><kbd class="kc">E</kbd>' + ring(A.chip(), 'sm') + '<span class="cl">' + Z('t.ai') + '</span></div></div>' +
      '<div class="tip">' + Z('ui.drag') + '</div>';
    const zones = [...stage.querySelectorAll('.bp')];
    const chips = [...stage.querySelectorAll('.toolrow .chip')];
    const items = chips.slice(0, 4), targets = zones.slice(0, 4).concat([null]);
    const keyT = parts.map((_, i) => [String(i + 1)]), keyI = ['a', 'b', 'c', 'd'].map(k => [k]);
    say('c1.intro');
    let left = 4;
    while (left) {
      const { i, t } = await dragPick(items, targets, { itemKeys: keyI, targetKeys: keyT });
      if (i !== t) { home(items[i]); shake(zones[t]); sfx('no'); speak('c1.wrong'); continue; }
      sfx('ok');
      zones[t].classList.add('done');
      zones[t].querySelector('.slot1').innerHTML = ring(A[tools[i]](), 'xs');
      items[i].classList.add('gone'); home(items[i]);
      items[i] = null; targets[t] = null; left--;
      const p = say('c1.' + tools[i]);
      if (!left) await p;
    }
    const ai = $('#aiChip');
    ai.hidden = false;
    zones[4].classList.add('ask');
    await say('c1.ask');
    for (;;) {
      const its = [null, null, null, null, ai], tgs = [null, null, null, null, zones[4]];
      const r = await dragPick(its, tgs, { itemKeys: [[], [], [], [], ['e']], targetKeys: keyT });
      if (r.t === 4) break;
    }
    sfx('win');
    zones[4].classList.remove('ask'); zones[4].classList.add('done');
    zones[4].querySelector('.slot1').innerHTML = ring(A.chip(), 'xs');
    stage.querySelector('.toolrow').remove(); stage.querySelector('.tip').remove();
    await say('c1.ai');
    await say('c1.why');
    parent('人類一直在做「延伸身體」的工具。電腦是延伸計算的工具；AI 則想延伸「認東西、聽懂話、做判斷」這類原本要靠人腦的事。');
    await next();
  }

  // ---------- 第二關：電腦照著做（排程式） ----------
  const PUZ = [
    { w: 5, h: 3, start: [0, 1], goal: [3, 1], walls: [] },
    { w: 5, h: 3, start: [0, 2], goal: [3, 0], walls: [[1, 1], [1, 2]] },
  ];
  const DIR = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };
  async function ch2() {
    show();
    await say('c2.intro');
    for (let n = 0; n < PUZ.length; n++) {
      const P = PUZ[n];
      const cellPos = ([x, y]) => 'left:' + (x * 100 / P.w) + '%;top:' + (y * 100 / P.h) + '%';
      let cells = '';
      for (let y = 0; y < P.h; y++) for (let x = 0; x < P.w; x++) cells += '<i style="' + cellPos([x, y]) + '"></i>';
      stage.innerHTML = '<div class="board" style="aspect-ratio:' + P.w + '/' + P.h + '">' + cells +
        P.walls.map(w => '<div class="piece" style="' + cellPos(w) + '">' + A.wall() + '</div>').join('') +
        '<div class="piece" style="' + cellPos(P.goal) + '">' + A.star() + '</div>' +
        '<div class="piece bot" id="bot" style="' + cellPos(P.start) + '">' + A.robot() + '</div></div>' +
        '<div class="prog"><span class="pl">' + Z('c2.prog') + '</span><div class="steps" id="steps"></div></div>' +
        '<div class="pad">' + ['left', 'up', 'down', 'right'].map(d => '<button class="arr" data-d="' + d + '">' + A.arrow(d) + '</button>').join('') +
        '<button class="pill2" id="del"><kbd class="kc">X</kbd>' + Z('c2.del') + '</button>' +
        '<button class="pill2 go" id="run"><kbd class="kc">G</kbd>' + Z('c2.run') + '</button></div>';
      const bot = $('#bot'), steps = $('#steps');
      const prog = [];
      const paint = () => { steps.innerHTML = prog.map(d => '<span class="st">' + A.arrow(d) + '</span>').join('') || '<span class="ph">？</span>'; };
      paint();
      if (n === 0) { await say('c2.how'); say('c2.erase'); } else say('c2.next');
      const arrows = [...stage.querySelectorAll('.arr')];
      for (;;) {
        const targets = arrows.map(b => ({ el: b, keys: [b.dataset.d] }))
          .concat([{ el: $('#del'), keys: ['x', 'back'] }, { el: $('#run'), keys: ['g', 'enter'] }]);
        const k = await waitAction(targets);
        if (k < 4) { if (prog.length < 10) { prog.push(arrows[k].dataset.d); sfx('beep'); paint(); } continue; }
        if (k === 4) { prog.pop(); sfx('tap'); paint(); continue; }
        if (!prog.length) { shake($('#run')); continue; }
        // 執行程式
        let [x, y] = P.start, bad = false;
        const stEls = [...steps.children];
        for (let s = 0; s < prog.length; s++) {
          stEls.forEach((e, j) => e.classList.toggle('now', j === s));
          const [dx, dy] = DIR[prog[s]];
          const nx = x + dx, ny = y + dy;
          if (nx < 0 || ny < 0 || nx >= P.w || ny >= P.h || P.walls.some(w => w[0] === nx && w[1] === ny)) { bad = true; break; }
          x = nx; y = ny;
          bot.style.cssText = cellPos([x, y]);
          sfx('step');
          await sleep(480);
        }
        stEls.forEach(e => e.classList.remove('now'));
        if (!bad && x === P.goal[0] && y === P.goal[1]) { sfx('win'); bot.classList.add('happy'); await say('c2.ok'); break; }
        sfx('bump'); shake(bot);
        await say('c2.bump');
        bot.style.cssText = cellPos(P.start);
      }
    }
    stage.querySelector('.pad').remove();
    await say('c2.done');
    parent('第一批電子計算機出現在 1940 年代。傳統程式是人把每一步都寫清楚，電腦照做；這一關就是在「寫程式」。可以在家玩「機器人遊戲」：孩子當機器人，家長說「向前兩步、左轉」。');
    await next();
  }

  // ---------- 第三關：規則不夠用 ----------
  const RULE_PICS = [['catOrange', true], ['fox', false], ['catFold', true], ['dog', false]];
  const RULES = { a: [true, true, false, false], b: [true, true, true, true] };   // 電腦照規則的判斷
  async function ch3() {
    show();
    await say('c3.intro');
    stage.innerHTML = '<div class="rules"><button class="rule" data-r="a"><kbd class="kc">A</kbd><span class="rt">' + Z('c3.ra') + '</span></button>' +
      '<button class="rule" data-r="b"><kbd class="kc">B</kbd><span class="rt">' + Z('c3.rb') + '</span></button></div>' +
      '<div class="belt">' + RULE_PICS.map(([id]) => '<div class="pic">' + ring(A.ANIMALS[id](), 'md') + '<div class="stampv"></div></div>').join('') + '</div>';
    const rules = [...stage.querySelectorAll('.rule')], pics = [...stage.querySelectorAll('.pic')];
    say('c3.pick');
    const tried = new Set();
    while (tried.size < 2) {
      const alive = rules.map(b => tried.has(b.dataset.r) ? null : { el: b, keys: [b.dataset.r] });
      const k = await waitAction(alive);
      const r = rules[k].dataset.r;
      tried.add(r);
      sfx('tap');
      rules.forEach(b => b.classList.toggle('on', b === rules[k]));
      pics.forEach(p => { p.className = 'pic'; p.querySelector('.stampv').innerHTML = ''; });
      for (let i = 0; i < pics.length; i++) {
        await sleep(650);
        const guess = RULES[r][i], right = guess === RULE_PICS[i][1];
        pics[i].classList.add(right ? 'ok' : 'bad');
        pics[i].querySelector('.stampv').innerHTML = Z(guess ? 'c3.cat' : 'c3.not');
        sfx(right ? 'pop' : 'no');
      }
      rules[k].classList.add('used');
      await sleep(400);
      await say(r === 'a' ? 'c3.failA' : 'c3.failB');
      if (tried.size < 2) say('c3.other');
    }
    await say('c3.done');
    parent('1970–80 年代流行的「專家系統」就是請專家寫大量規則。規則很難涵蓋所有例外（折耳貓、狐狸），這是後來改走「從例子學習」的重要原因。');
    await next();
  }

  // ---------- 第四關：你來當老師（分類） ----------
  const TRUTH = { catOrange: true, catBlack: true, catFold: true, catSleep: true, fox: false, dog: false, rabbit: false, owl: false };
  async function ch4() {
    show();
    await say('c4.intro');
    stage.innerHTML = '<div class="sorter"><div class="zone bin" id="bYes"><span class="num">←</span>' + ring(A.basket(true), 'sm') + '<span class="cl">' + Z('c4.yes') + '</span>' + '<div class="pile"></div></div>' +
      '<div class="deck" id="deck"></div>' +
      '<div class="zone bin" id="bNo"><span class="num">→</span>' + ring(A.basket(false), 'sm') + '<span class="cl">' + Z('c4.no') + '</span>' + '<div class="pile"></div></div></div>' +
      '<div class="mlabel">' + ring(A.computer(), 'xs') + Z('c4.learn') + '</div><div class="meter"><i id="mt"></i></div>';
    const bYes = $('#bYes'), bNo = $('#bNo'), deck = $('#deck'), mt = $('#mt');
    say('c4.how');
    const order = shuffle(Object.keys(TRUTH));
    for (let n = 0; n < order.length; n++) {
      const id = order[n];
      deck.innerHTML = '<div class="card1 drag">' + ring(A.ANIMALS[id](), 'lg') + '</div>';
      const card = deck.firstChild;
      for (;;) {
        const { t } = await dragPick([card], [bYes, bNo], { targetKeys: [['left', 'a'], ['right', 'b']] });
        if ((t === 0) === TRUTH[id]) break;
        home(card); shake(t ? bNo : bYes); sfx('no'); speak('c4.wrong');
      }
      sfx('ok');
      const bin = TRUTH[id] ? bYes : bNo;
      bin.querySelector('.pile').insertAdjacentHTML('beforeend', '<span class="th">' + A.ANIMALS[id]() + '</span>');
      deck.innerHTML = '';
      mt.style.width = ((n + 1) / order.length * 100) + '%';
      if (id === 'owl') await say('c4.owl');
    }
    sfx('win');
    await say('c4.done');
    parent('這就是「監督式學習」：人先替資料貼上答案（標註），電腦從大量例子裡自己找出規律。真正的 AI 要看成千上萬張照片。');
    await next();
  }

  // ---------- 第五關：猜錯了再改 ----------
  const GUESS = [['catBlack', true], ['fox', true], ['dog', false], ['owl', true], ['catFold', true]];
  async function ch5() {
    show();
    stage.innerHTML = '<div class="judge"><div class="jpic" id="jp"></div><div class="jcomp">' + ring(A.computer(), 'md') +
      '<div class="guess" id="gs"></div></div></div>' +
      '<div class="knobs" id="kb">' + [0, 1, 2].map(() => '<span class="kn">' + A.knob() + '</span>').join('') + '</div>' +
      '<div class="ox"><button class="circlebtn" id="bO"><kbd class="kc">O</kbd>○</button><button class="circlebtn" id="bX"><kbd class="kc">X</kbd>✕</button></div>';
    const jp = $('#jp'), gs = $('#gs'), bO = $('#bO'), bX = $('#bX');
    const kn = [...stage.querySelectorAll('.kn')];
    let angle = [0, 0, 0];
    await say('c5.intro');
    for (const [id, guess0] of GUESS) {
      let guess = guess0;
      jp.innerHTML = ring(A.ANIMALS[id](), 'lg');
      for (;;) {
        gs.innerHTML = Z(guess ? 'c5.yes' : 'c5.no');
        gs.className = 'guess';
        sfx('beep');
        const k = await waitAction([{ el: bO, keys: ['o'] }, { el: bX, keys: ['x'] }]);
        const right = guess === TRUTH[id];
        if ((k === 0) !== right) { shake(k ? bX : bO); sfx('no'); await say('c5.look'); continue; }
        if (right) { gs.classList.add('ok'); sfx('ok'); await say('c5.right'); break; }
        gs.classList.add('bad'); sfx('no');
        await say('c5.fix');
        angle = angle.map(a => a + 60 + Math.random() * 120);
        kn.forEach((e, j) => { e.style.transform = 'rotate(' + angle[j] + 'deg)'; });
        sfx('tap'); await sleep(900);
        guess = !guess;
        await say('c5.again');
      }
    }
    await say('c5.done');
    parent('訓練時，電腦每猜錯一次，就把內部數以百萬計的「參數」（旋鈕）往能猜對的方向微調一點；重複非常多次，就是「訓練」。');
    await next();
  }

  // ---------- 第六關：學大腦連一連 ----------
  async function ch6() {
    show();
    await say('c6.intro');
    const N = [
      { x: 80, y: 60, l: 0, icon: A.earIcon(), lab: 'c6.ear' }, { x: 80, y: 150, l: 0, icon: A.whiskerIcon(), lab: 'c6.whisker' },
      { x: 80, y: 240, l: 0, icon: A.furIcon(), lab: 'c6.fur' },
      { x: 250, y: 100, l: 1 }, { x: 250, y: 200, l: 1 },
      { x: 420, y: 150, l: 2, icon: A.ANIMALS.catOrange(), lab: 'c6.cat' },
    ];
    stage.innerHTML = '<div class="net" id="net"><svg viewBox="0 0 500 300" id="nsvg"><g id="lines"></g><line id="tmp" stroke="#BD9558" stroke-width="6" stroke-linecap="round" stroke-dasharray="2 10" visibility="hidden"/><g id="pulses"></g></svg>' +
      N.map((n, i) => '<div class="node l' + n.l + '" data-i="' + i + '" style="left:' + (n.x / 5) + '%;top:' + (n.y / 3) + '%">' +
        (n.icon ? '<div class="ni">' + n.icon + '</div><div class="nl">' + Z(n.lab) + '</div>' : '') + '</div>').join('') + '</div>';
    const net = $('#net'), lines = $('#lines'), tmp = $('#tmp'), pulses = $('#pulses');
    const nodes = [...net.querySelectorAll('.node')];
    const conn = [];
    const has = (a, b) => conn.some(c => c[0] === a && c[1] === b);
    const toV = p => [p.x / p.w * 500, p.y / p.h * 300];
    const near = p => { const [vx, vy] = toV(p); let best = -1, bd = 1e9; N.forEach((n, i) => { const d = Math.hypot(n.x - vx, n.y - vy); if (d < bd) { bd = d; best = i; } }); return bd < 46 ? best : -1; };
    const complete = () => [0, 1, 2].every(a => [3, 4].some(h => has(a, h) && has(h, 5)));
    let from = -1, saidMore = false;
    const mark = () => nodes.forEach((e, i) => e.classList.toggle('from', i === from));
    await say('c6.ai');
    say('c6.how');
    await new Promise(res => {
      const connect = (a, b) => {
        if (N[a].l > N[b].l) [a, b] = [b, a];
        if (N[b].l !== N[a].l + 1 || has(a, b)) return false;
        conn.push([a, b]);
        lines.insertAdjacentHTML('beforeend', '<line x1="' + N[a].x + '" y1="' + N[a].y + '" x2="' + N[b].x + '" y2="' + N[b].y + '" stroke="#6C2024" stroke-width="6" stroke-linecap="round"/>');
        nodes[a].classList.add('used'); nodes[b].classList.add('used');
        sfx('pop');
        if (complete()) { off(); res(); }
        else if (!saidMore && conn.some(c => c[1] === 5)) { saidMore = true; say('c6.more'); }
        return true;
      };
      const off = track(net, {
        down(p) { const i = near(p); if (i < 0) return; if (from >= 0 && from !== i && connect(from, i)) { from = -1; mark(); return; } from = i; mark(); },
        move(p) {
          if (from < 0) return;
          const [vx, vy] = toV(p);
          tmp.setAttribute('x1', N[from].x); tmp.setAttribute('y1', N[from].y); tmp.setAttribute('x2', vx); tmp.setAttribute('y2', vy);
          tmp.setAttribute('visibility', 'visible');
        },
        up(p) {
          tmp.setAttribute('visibility', 'hidden');
          const i = near(p);
          if (from >= 0 && i >= 0 && i !== from && connect(from, i)) { from = -1; }
          mark();
        },
      });
    });
    from = -1; mark();
    // 消息傳過去：小光點沿著線跑
    sfx('win');
    const dotsP = conn.map(c => { const d = document.createElementNS('http://www.w3.org/2000/svg', 'circle'); d.setAttribute('r', 9); d.setAttribute('fill', '#f2c14e'); d.setAttribute('stroke', '#5b3a1e'); d.setAttribute('stroke-width', 2); pulses.appendChild(d); return [c, d]; });
    for (let t = 0; t <= 1.001; t += .05) {
      dotsP.forEach(([c, d]) => {
        const tt = N[c[0]].l === 0 ? Math.min(1, t * 2) : Math.max(0, t * 2 - 1);
        d.setAttribute('cx', N[c[0]].x + (N[c[1]].x - N[c[0]].x) * tt); d.setAttribute('cy', N[c[0]].y + (N[c[1]].y - N[c[0]].y) * tt);
      });
      await sleep(60);
    }
    pulses.innerHTML = '';
    nodes[5].classList.add('lit');
    await say('c6.go');
    const ls = [...lines.children];
    ls.forEach(l => l.setAttribute('stroke-width', Math.random() < .5 ? 12 : 3));
    await say('c6.done');
    parent('人工神經網路（1958 年的「感知器」是早期代表）受大腦啟發，但非常簡化。每條連線有個數字叫「權重」，學習就是調整這些數字——像這關最後線條變粗變細。');
    await next();
  }

  // ---------- 第七關：例子要很多（按住倒照片） ----------
  async function ch7() {
    show();
    await say('c7.intro');
    stage.innerHTML = '<div class="feed"><div class="fcomp" id="fc">' + ring(A.computer(), 'lg') + '</div>' +
      '<div class="fcount"><div class="mlabel">' + Z('c7.count') + '</div><div class="big0" id="cnt">0</div></div></div>' +
      '<div class="meter gold"><i id="mt"></i></div>' +
      '<div class="tests" id="tests"></div>';
    foot.innerHTML = '<button class="holdbtn" id="hold">' + ring(A.photo(), 'xs') + Z('c7.feed') + '</button>';
    const cnt = $('#cnt'), mt = $('#mt'), fc = $('#fc'), tests = $('#tests'), hb = $('#hold');
    say('c7.how');
    let p = 0, wasDown = false, spawn = 0;
    for (;;) {
      await holdLoop(hb, ['space'], (dt, down) => {
        if (down) {
          wasDown = true;
          p = Math.min(1, p + dt / 4.5);
          spawn += dt;
          if (spawn > .14) {
            spawn = 0; sfx('pop');
            const f = document.createElement('span');
            f.className = 'fly'; f.innerHTML = A.photo();
            f.style.left = (10 + Math.random() * 70) + '%';
            fc.appendChild(f); setTimeout(() => f.remove(), 900);
          }
          cnt.textContent = Math.round(Math.pow(10, p * 6.3)).toLocaleString('en-US');
          mt.style.width = (p * 100) + '%';
        }
        return (wasDown && !down) || p >= 1 ? 'go' : false;
      });
      wasDown = false;
      // 考試：越多例子，猜錯越少
      const wrong = p >= .95 ? 0 : p >= .6 ? 1 : p >= .3 ? 2 : 3;
      const ids = shuffle(Object.keys(TRUTH)).slice(0, 6);
      const bad = new Set(shuffle([0, 1, 2, 3, 4, 5]).slice(0, wrong));
      tests.innerHTML = ids.map(id => '<span class="tst">' + A.ANIMALS[id]() + '<b></b></span>').join('');
      const ts = [...tests.children];
      for (let i = 0; i < ts.length; i++) {
        await sleep(260);
        ts[i].classList.add(bad.has(i) ? 'bad' : 'ok');
        sfx(bad.has(i) ? 'no' : 'pop');
      }
      if (!wrong) { sfx('win'); foot.innerHTML = ''; await say('c7.ok'); break; }
      await say('c7.few');
    }
    await say('c7.done');
    parent('2009 年的 ImageNet 資料集約有 1400 萬張標註過的照片；2012 年，研究者用顯示卡（GPU）訓練深層神經網路，辨識正確率大躍進，這是「深度學習」熱潮的起點。');
    await next();
  }

  // ---------- 第八關：電腦長大了（時間線） ----------
  async function ch8() {
    show();
    const arts = [A.bigComputer(), A.people(), A.desktop(), A.phone(), A.chatPhone()];
    stage.innerHTML = '<div class="tl"><div class="tlends"><span>' + Z('c8.old') + '</span><span>' + Z('c8.now') + ' →</span></div>' +
      '<div class="tslots">' + arts.map((_, i) => '<div class="zone tslot"><b>' + (i + 1) + '</b></div>').join('') + '</div></div>' +
      '<div class="tcards">' + shuffle([0, 1, 2, 3, 4]).map(i => '<div class="chip drag" data-i="' + i + '">' + ring(arts[i], 'sm') + '<span class="cl">' + Z('c8.l' + (i + 1)) + '</span></div>').join('') + '</div>';
    const slots = [...stage.querySelectorAll('.tslot')], cards = [...stage.querySelectorAll('.tcards .chip')];
    say('c8.intro');
    let left = 5, wrong = 0;
    while (left) {
      const { i, t } = await dragPick(cards, slots, { itemKeys: cards.map((_, k) => ['abcde'[k]]), targetKeys: slots.map((_, k) => [String(k + 1)]) });
      const ci = +cards[i].dataset.i;
      if (ci !== t) {
        home(cards[i]); shake(cards[i]); sfx('no'); speak('g.order');
        if (++wrong >= 2) slots[ci].classList.add('hintz');
        continue;
      }
      wrong = 0;
      slots.forEach(s => s && s.classList.remove('hintz'));
      sfx('ok');
      slots[t].classList.add('done');
      dropInto(cards[i], slots[t]);
      cards[i].classList.remove('drag');
      cards[i] = null; slots[t] = null; left--;
      await say('c8.n' + (ci + 1));
    }
    sfx('win');
    await say('c8.done');
    parent('約 1945 年：ENIAC 等早期電腦佔滿整個房間。1956 年：達特茅斯會議，「人工智慧」這個名詞正式出現。1980 年代：個人電腦進入家庭。2007 年前後：智慧型手機普及。2010 年代起：深度學習；2022 年：聊天機器人 ChatGPT 公開。');
    await next();
  }

  // ---------- 第九關：猜下一個字 ----------
  async function ch9() {
    show();
    await say('c9.intro');
    for (let r = 1; r <= 3; r++) {
      stage.innerHTML = '<div class="sent">' + Z('c9.s' + r) + '<span class="zone blank" id="blank"></span></div>' +
        '<div class="words">' + shuffle(['a', 'b', 'c']).map(x => '<div class="chip drag word" data-ok="' + (x === 'a' ? 1 : 0) + '"><span class="cl">' + Z('c9.' + x + r) + '</span></div>').join('') + '</div>';
      const words = [...stage.querySelectorAll('.word')], blank = $('#blank');
      words.forEach((w, k) => w.insertAdjacentHTML('afterbegin', '<kbd class="kc">' + 'ABC'[k] + '</kbd>'));
      if (r === 1) { await say('c9.you'); }
      say('c9.q' + r);
      for (;;) {
        const { i } = await dragPick(words, [blank], { itemKeys: [['a'], ['b'], ['c']] });
        if (words[i].dataset.ok === '1') { sfx('ok'); dropInto(words[i], blank); blank.classList.add('done'); await say('c9.ok'); break; }
        home(words[i]); shake(words[i]); sfx('no'); speak('g.no1');
        words[i].classList.add('gone'); words[i] = null;
      }
      await sleep(300);
    }
    // AI 說故事：每按一下，猜下一個詞
    let NW = 0; while (TX['st.' + NW + '.0']) NW++;
    stage.innerHTML = '<div class="cands" id="cands"></div><div class="story" id="story">' + ring(A.chatPhone(), 'xs') + '<div class="stw"><span id="stx"></span><span class="caret"></span></div></div>' +
      '<button class="tapzone" id="tap">' + Z('c9.tap') + '</button>';
    const cands = $('#cands'), stx = $('#stx'), tap = $('#tap');
    await say('c9.gen');
    for (let n = 0; n < NW; n++) {
      await waitAction([{ el: tap, keys: ['space', 'enter'] }]);
      cands.innerHTML = shuffle([0, 1, 2]).map(j => '<span class="cand' + (j === 0 ? ' pick' : '') + '">' + Z('st.' + n + '.' + j) + '</span>').join('');
      sfx('beep');
      await sleep(380);
      stx.insertAdjacentHTML('beforeend', Z('st.' + n + '.0'));
      sfx('pop');
    }
    tap.hidden = true;
    cands.innerHTML = '';
    await say('c9.story');
    await say('c9.done');
    parent('大型語言模型（例如 ChatGPT）讀過大量文字，核心任務是預測「下一個詞」最可能是什麼，一個接一個產生句子；之後再用人類的回饋訓練，讓回答更有用。它沒有真的理解或經驗，所以會說出聽起來很對、其實錯的話。');
    await next();
  }

  // ---------- 第十關：AI 也會出錯 ----------
  async function ch10() {
    show();
    stage.innerHTML = '<div class="scene odd" id="odd">' + A.oddScene() + '</div><div class="mlabel" id="left"></div>';
    const odd = $('#odd'), left = $('#left');
    const found = new Set();
    const paintLeft = () => { left.innerHTML = Z('c10.left') + ' <b class="bignum">' + (3 - found.size) + '</b>'; };
    paintLeft();
    say('c10.intro');
    await new Promise(res => {
      const h = ev => {
        const g = ev.target.closest('[data-bug]');
        if (!g) { sfx('tap'); return; }
        const n = g.getAttribute('data-bug');
        if (found.has(n)) return;
        found.add(n);
        const bb = g.getBBox();
        g.insertAdjacentHTML('beforeend', '<ellipse cx="' + (bb.x + bb.width / 2) + '" cy="' + (bb.y + bb.height / 2) + '" rx="' + (bb.width / 2 + 8) + '" ry="' + (bb.height / 2 + 8) + '" fill="none" stroke="#DB2E27" stroke-width="5"/>');
        sfx('ok'); paintLeft();
        say('c10.f' + n).then(() => { if (found.size === 3) { odd.removeEventListener('click', h); res(); } });
      };
      odd.addEventListener('click', h);
    });
    sfx('win');
    await say('c10.why');
    await say('c10.you');
    const wish = [A.translate(), A.doctor(), A.earth(), A.book()];
    stage.innerHTML = '<div class="opts n4">' + wish.map((w, i) => '<button class="opt"><kbd class="kc">' + 'ABCD'[i] + '</kbd><span class="oa">' + ring(w, 'sm') + '</span><span class="ot">' + Z('c10.w' + (i + 1)) + '</span></button>').join('') + '</div>';
    const btns = [...stage.querySelectorAll('.opt')];
    say('c10.wish');
    const k = await waitAction(btns.map((b, i) => ({ el: b, keys: ['abcd'[i]] })));
    btns[k].classList.add('right'); btns.forEach((b, j) => { if (j !== k) b.classList.add('dim'); });
    sfx('ok');
    await say('c10.r' + (k + 1));
    await say('c10.done');
    parent('AI 會「一本正經地說錯話」或畫出不合理的細節（研究者稱為「幻覺」），也可能學到資料裡的偏見。可以和孩子約定：AI 說的事，重要的要再查證；不把名字、住址告訴 AI。');
    await next();
  }

  // ---------- 結尾 ----------
  async function finale() {
    show();
    stage.innerHTML = '<div class="center"><div class="stamp">AI<br>學者</div><div class="chtitle">' + Z('fin.title') + '</div>' +
      '<div class="stickers">' + [A.hammer(), A.robot(), A.ANIMALS.catOrange(), A.knob(), A.chatPhone(), A.book()].map(s => ring(s, 'md')).join('') + '</div>' +
      '<div class="parent"><b>給家長：</b>可以接著聊：①家裡哪些東西用到 AI（地圖導航、相簿搜尋「貓」、語音助理）？②哪些事情適合請 AI 幫忙，哪些應該自己想？③玩「下一個字」接龍，體驗 AI 怎麼說話。</div></div>';
    sfx('win');
    await say('fin.hi');
    await say('fin.task');
  }

  G.run({ saveKey: 'ai-game-v1', stamp: 'AI', heroArt: A.robot(), chapters: [ch1, ch2, ch3, ch4, ch5, ch6, ch7, ch8, ch9, ch10], finale });
})();
