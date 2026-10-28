// 頌缽工坊：十關。文字在 content.js（由 tools/build.py 產生）、插圖在 art.js、共用引擎在 engine.js。
(() => {
  'use strict';
  const A = window.A;
  const { $, stage, foot, sayBox, sleep, shuffle, shake, ring, parent, Z, sfx, strike, hum, speak, say, waitAction, next,
    dragPick, home, dropInto, holdLoop, track, onKeys, quiz } = G;
  const show = () => { sayBox.hidden = false; foot.innerHTML = ''; };

  // ---------- 共用：從上面看的頌缽，可以敲、可以繞圈磨 ----------
  const bowlBox = (water = false) => '<div class="btop">' + A.bowlTop() + (water ? '<div class="water" hidden><i></i></div>' : '') +
    '<div class="waves"><i></i><i></i><i></i></div><div class="stick">' + A.mallet() + '</div></div>';
  function stickAt(top, a) {
    const s = top.querySelector('.stick');
    s.style.left = (50 + Math.cos(a) * 44) + '%';
    s.style.top = (50 + Math.sin(a) * 44) + '%';
  }
  function ding(top) {
    const w = top.querySelector('.waves');
    w.style.transition = 'none'; w.style.opacity = 1; void w.offsetWidth;
    w.style.transition = 'opacity 3.5s ease-out'; w.style.opacity = 0;
  }
  // 繞著缽畫圓圈（或按住空白鍵）。能量滿了、再唱一下子才結束；回傳還在響的聲音，呼叫端自己 stop()
  async function rubBowl(top, { f0 = 220, onLevel } = {}) {
    const waves = top.querySelector('.waves');
    const h = hum(f0);
    let ang = null, acc = 0, speed = 0, energy = 0, full = 0, auto = -Math.PI / 2;
    const off = track(top, {
      down(p) { ang = Math.atan2(p.y - p.h / 2, p.x - p.w / 2); stickAt(top, ang); },
      move(p) {
        const a = Math.atan2(p.y - p.h / 2, p.x - p.w / 2);
        if (ang !== null) { let d = a - ang; if (d > Math.PI) d -= 2 * Math.PI; if (d < -Math.PI) d += 2 * Math.PI; acc += Math.abs(d); }
        ang = a; stickAt(top, a);
      },
      up() { ang = null; },
    });
    waves.style.transition = 'opacity .2s';
    await holdLoop(null, ['space'], (dt, down) => {
      if (down) { auto += dt * 4.2; acc += dt * 4.2; stickAt(top, auto); }
      speed = speed * .85 + (acc / dt) * .15; acc = 0;          // 滑鼠事件不規則，速度取平均
      energy = speed > 1.8 ? Math.min(1, energy + dt * .42) : Math.max(0, energy - dt * .3);
      h.set(energy);
      waves.style.opacity = energy.toFixed(2);
      top.classList.toggle('singing', energy > .6);
      if (onLevel) onLevel(energy);
      full = energy >= 1 ? full + dt : 0;
      return full >= 1;
    });
    off();
    return h;
  }

  // ---------- 第一關：聽頌缽唱歌 ----------
  async function ch1() {
    show();
    stage.innerHTML = bowlBox() + '<div class="tip" id="tip"></div>';
    const top = stage.querySelector('.btop');
    stickAt(top, -Math.PI / 4);
    say('c1.hit');
    await waitAction([{ el: top, keys: ['d'] }]);
    strike(220); ding(top);
    await say('c1.hitok');
    $('#tip').innerHTML = Z('ui.rubtip');
    say('c1.rub');
    const h = await rubBowl(top, { f0: 220 });
    await say('c1.sing');
    h.stop();
    top.classList.remove('singing'); top.querySelector('.waves').style.opacity = 0;
    await say('c1.why');
    await say('c1.done');
    parent('木棒磨著缽口時，會「黏住、滑開、黏住、滑開」，一直推著缽振動（和濕手指磨玻璃杯口是同一個道理）。可以讓孩子在缽唱歌時輕摸缽身，感覺它在抖。');
    await next();
  }

  // ---------- 第二關：缽這個字 ----------
  async function ch2() {
    show();
    await say('c2.intro');
    stage.innerHTML = '<div class="charbox" id="cb"><div class="zone half l"></div><div class="zone half r"></div></div>' +
      '<div class="parts">' + shuffle([['fou', A.jar()], ['ben', '']]).map(([k, art]) =>
        '<div class="chip drag part" data-k="' + k + '">' + (art ? ring(art, 'xs') : '') + '<span class="cl kbig">' + Z('k.' + k) + '</span></div>').join('') + '</div>' +
      '<div class="tip">' + Z('ui.drag') + '</div>';
    const halves = [...stage.querySelectorAll('.half')], parts = [...stage.querySelectorAll('.part')];
    say('c2.how');
    let left = 2;
    while (left) {
      const { i, t } = await dragPick(parts, halves, { itemKeys: parts.map((_, k) => ['ab'[k]]), targetKeys: [['left', '1'], ['right', '2']] });
      const k = parts[i].dataset.k;
      if ((k === 'fou') !== (t === 0)) { home(parts[i]); shake(parts[i]); sfx('no'); speak('g.no1'); continue; }
      sfx('ok');
      halves[t].innerHTML = (k === 'fou' ? ring(A.jar(), 'sm') : '') + '<span class="cl kbig">' + Z('k.' + k) + '</span>';
      halves[t].classList.add('done');
      parts[i].classList.add('gone'); home(parts[i]);
      parts[i] = null; halves[t] = null; left--;
      await say(k === 'fou' ? 'c2.fou' : 'c2.ben');
    }
    sfx('win');
    stage.innerHTML = '<div class="charbox whole"><span class="cl khuge">' + Z('k.bo') + '</span></div>';
    await say('c2.made');
    stage.insertAdjacentHTML('beforeend', '<div class="eq"><span class="ek">' + Z('k.jin') + '</span>＋<span class="ek">' + Z('k.ben') + '</span>＝<span class="ek on">' + Z('k.bo2') + '</span></div>');
    await say('c2.metal');
    parent('「缽」是形聲字：「缶」表示陶器，「本」表聲。這個字最早用來翻譯梵文 pātra（缽多羅），指僧人用的食器，多半是陶或鐵做的；異體字「鉢」改用金字旁。');
    await next();
    await quiz({
      q: 'c2.q', ok: 'c2.ok',
      opts: [{ text: 'c2.o1', art: A.bowlSide(), ok: true }, { text: 'c2.o2', art: A.log() }, { text: 'c2.o3', art: A.plastic() }],
    });
  }

  // ---------- 第三關：找金屬（一直敲石頭） ----------
  async function ch3() {
    show();
    await say('c3.intro');
    const kinds = shuffle(['plain', 'cu', 'sn']);
    stage.innerHTML = '<div class="rocks">' + kinds.map((_, i) => '<button class="rk"><span class="num">' + (i + 1) + '</span><div class="rkart">' + A.rock(0) + '</div><div class="rkl"></div></button>').join('') + '</div>' +
      '<div class="ingots" id="ing"></div>';
    const btns = [...stage.querySelectorAll('.rk')];
    const hits = [0, 0, 0], opened = new Set();
    const art = { plain: A.pebbles, cu: A.oreCu, sn: A.oreSn };
    say('c3.how');
    const has = k => [...opened].some(j => kinds[j] === k);
    while (!(has('cu') && has('sn'))) {
      const targets = btns.map((b, j) => opened.has(j) ? null : { el: b, keys: [String(j + 1)] }).concat([{ el: null, keys: ['k'] }]);
      let i = await waitAction(targets);
      if (i === 3) i = [0, 1, 2].find(j => !opened.has(j));
      hits[i]++;
      sfx('crack'); shake(btns[i]);
      if (hits[i] < 5) { btns[i].querySelector('.rkart').innerHTML = A.rock(hits[i]); continue; }
      opened.add(i);
      const k = kinds[i];
      btns[i].classList.add('open', k);
      btns[i].querySelector('.rkart').innerHTML = art[k]();
      if (k === 'plain') { say('c3.plain'); continue; }
      sfx('ok');
      btns[i].querySelector('.rkl').innerHTML = Z(k === 'cu' ? 'c3.cul' : 'c3.snl');
      await say(k === 'cu' ? 'c3.cu' : 'c3.sn');
    }
    sfx('win');
    $('#ing').innerHTML = '<div class="chip">' + ring(A.copper(), 'sm') + '<span class="cl">' + Z('c3.cul') + '</span></div><div class="chip">' + ring(A.tin(), 'sm') + '<span class="cl">' + Z('c3.snl') + '</span></div>';
    await say('c3.done');
    parent('銅礦常見的有綠色的孔雀石；錫礦主要是黑褐色的錫石。礦石要在高溫下「冶煉」，金屬才會分離出來。這一關把冶煉簡化成「燒一燒」。');
    await next();
  }

  // ---------- 第四關：調配方（四塊銅、一塊錫） ----------
  async function ch4() {
    show();
    await say('c4.intro');
    const chip = (k, n) => '<div class="chip drag mt" data-k="' + k + '">' + ring(k === 'cu' ? A.copper() : A.tin(), 'xs') + '<span class="cl">' + Z('c4.' + k) + '</span></div>';
    stage.innerHTML = '<div class="mix"><div class="pile2">' + [0, 1, 2, 3, 4].map(n => chip('cu', n)).join('') + '</div>' +
      '<div class="zone pot" id="pot"><div class="potart" id="pa">' + A.crucible() + '</div><div class="cnt" id="cnt"></div></div>' +
      '<div class="pile2">' + [0, 1].map(n => chip('sn', n)).join('') + '</div></div>' +
      '<div class="tip">' + Z('ui.drag') + '</div>';
    const pot = $('#pot'), cnt = $('#cnt'), pa = $('#pa');
    const items = [...stage.querySelectorAll('.mt')];
    let cu = 0, sn = 0;
    const dots = (n, have, cls) => Array.from({ length: n }, (_, j) => '<i class="d ' + cls + (j < have ? ' on' : '') + '"></i>').join('');
    const paint = () => {
      cnt.innerHTML = '<span>' + Z('c4.cu') + dots(4, cu, 'cu') + '</span><span>' + Z('c4.sn') + dots(1, sn, 'sn') + '</span>';
      pa.innerHTML = A.crucible(cu + sn ? A.mix('#c9ccd0', '#d07a4a', cu / Math.max(1, cu + sn)) : '', (cu + sn) / 5 * .55);
    };
    paint();
    say('c4.how');
    while (cu < 4 || sn < 1) {
      const fcu = items.findIndex(e => e && e.dataset.k === 'cu'), fsn = items.findIndex(e => e && e.dataset.k === 'sn');
      const keys = items.map((_, j) => j === fcu ? ['a'] : j === fsn ? ['b'] : []);
      const { i } = await dragPick(items, [pot], { itemKeys: keys });
      const k = items[i].dataset.k;
      if (k === 'cu' && cu >= 4) { home(items[i]); sfx('no'); speak('c4.toomuchcu'); continue; }
      if (k === 'sn' && sn >= 1) { home(items[i]); shake(pot); sfx('crack'); speak('c4.toomuchsn'); continue; }
      items[i].classList.add('gone'); home(items[i]); items[i] = null;
      if (k === 'cu') cu++; else sn++;
      sfx('thud'); paint();
    }
    sfx('win');
    await say('c4.done');
    parent('傳統手工頌缽多半是「高錫青銅」（響銅），大約 78% 銅、22% 錫，差不多就是四比一。錫太多會又硬又脆；錫太少聲音不夠亮。常聽到的「七種金屬」說法，成分分析多半找不到根據。');
    await next();
  }

  // ---------- 第五關：生火（拉風箱） ----------
  async function ch5() {
    show();
    stage.innerHTML = '<div class="kiln"><div class="furn"><div class="cru" id="cru">' + A.crucible('#8a7a6a', .3) + '</div><div class="fl" id="fl">' + A.flames(0) + '</div></div>' +
      '<div class="thermo"><i id="th"></i></div>' +
      '<div class="bel" id="bel"><div class="belart" id="ba">' + A.bellows() + '</div><div class="belk"><kbd class="kc">W</kbd><span>↕</span><kbd class="kc">S</kbd></div></div></div>';
    const bel = $('#bel'), ba = $('#ba'), th = $('#th'), cru = $('#cru'), fl = $('#fl');
    await say('c5.intro');
    say('c5.how');
    let temp = 0, saidRed = false, lastKey = '', lastY = null, dir = 0, travel = 0, drawn = -1;
    const pump = () => {
      temp = Math.min(1, temp + .075);
      sfx('whoosh');
      ba.classList.remove('squeeze'); void ba.offsetWidth; ba.classList.add('squeeze');
    };
    const offK = onKeys(['w', 's'], k => { if (k !== lastKey) { lastKey = k; pump(); } });
    const offT = track(bel, {
      down(p) { lastY = p.y; dir = 0; travel = 0; },
      move(p) {
        if (lastY === null) return;
        const dy = p.y - lastY; lastY = p.y;
        const d = Math.sign(dy);
        if (!d) return;
        if (d !== dir) { if (travel > 24) pump(); dir = d; travel = 0; }
        travel += Math.abs(dy);
      },
      up() { if (travel > 24) pump(); lastY = null; },
    });
    await holdLoop(null, [], dt => {
      if (temp < 1) temp = Math.max(0, temp - dt * .03);
      th.style.height = (temp * 100) + '%';
      const q = Math.round(temp * 20);
      if (q !== drawn) {
        drawn = q;
        fl.innerHTML = A.flames(temp);
        cru.innerHTML = temp >= 1 ? A.crucible('#ffb347', .42) : A.crucible(A.heatColor(temp * .9), .3);
      }
      if (temp >= .5 && !saidRed) { saidRed = true; say('c5.red'); }
      return temp >= 1;
    });
    offK(); offT();
    sfx('win');
    await say('c5.melt');
    parent('高錫青銅大約在 900°C 上下熔化（實際溫度依銅錫比例而定）；家用烤箱最高約 250°C。風箱把空氣（氧氣）送進爐子，火就燒得更旺、更熱。');
    await next();
  }

  // ---------- 第六關：倒進模子（按住、到線放開） ----------
  async function ch6() {
    show();
    stage.innerHTML = '<div class="pour"><div class="pourer" id="pr">' + A.crucible('#ffb347', .45) + '</div><div class="stream" id="st"></div>' +
      '<div class="mold"><div class="liq" id="lq"></div><div class="mline"></div></div></div>';
    foot.innerHTML = '<button class="holdbtn" id="hold"><kbd class="kc">␣</kbd>' + Z('c6.pour') + '</button>';
    const pr = $('#pr'), st = $('#st'), lq = $('#lq'), hb = $('#hold');
    await say('c6.intro');
    say('c6.how');
    for (let round = 0; round < 2; round++) {
      let level = 0, was = false, pt = 0;
      lq.className = 'liq'; lq.style.height = '0%';
      for (;;) {
        const r = await holdLoop(hb, ['space'], (dt, down) => {
          pr.classList.toggle('tilt', down); st.classList.toggle('on', down);
          if (down) {
            was = true; level += dt * .3;
            pt += dt; if (pt > .25) { pt = 0; sfx('pour'); }
            lq.style.height = Math.min(100, level * 100) + '%';
            if (level >= 1) return 'over';
          }
          return was && !down ? 'rel' : false;
        });
        pr.classList.remove('tilt'); st.classList.remove('on');
        was = false;
        if (r === 'over') {
          lq.classList.add('over'); sfx('no');
          await say('c6.over');
          level = 0; lq.className = 'liq'; lq.style.height = '0%';
          continue;
        }
        if (level >= .72) break;
        say('c6.less');
      }
      sfx('ok'); lq.classList.add('ok');
      await say('c6.ok');
      if (round === 0) await say('c6.again');
    }
    foot.innerHTML = '';
    lq.classList.add('cool');
    await say('c6.done');
    parent('尼泊爾的手工頌缽，通常先把熔好的青銅倒進小模子，鑄成一塊厚厚的圓餅（坯），之後再一邊加熱一邊敲成碗。也有工廠直接鑄造成形，再用車床修整。');
    await next();
  }

  // ---------- 第七關：趁熱敲打（跟著節奏輪流敲） ----------
  async function ch7() {
    show();
    stage.innerHTML = '<div class="anvil" id="av">' + [0, 1, 2, 3].map(j => '<div class="hm h' + j + '"><div class="hmi">' + A.hammerDown() + '</div>' + (j === 3 ? '<span class="you">' + Z('c7.you') + '</span>' : '') + '</div>').join('') +
      '<div class="disc drag" id="disc">' + A.forge(0, 1) + '</div></div>' +
      '<div class="zone fire" id="fire" hidden>' + A.flames(1) + '<span class="cl">' + Z('c7.fire') + '</span></div>' +
      '<div class="meter gold"><i id="mt"></i></div>';
    const disc = $('#disc'), fire = $('#fire'), mt = $('#mt');
    const hms = [...stage.querySelectorAll('.hm')];
    let depth = 0, heat = 1, good = 0;
    const paint = () => { disc.innerHTML = A.forge(depth, heat); mt.style.width = (good / 8 * 100) + '%'; };
    await say('c7.intro');
    await say('c7.team');
    say('c7.how');
    const swing = j => { hms[j].classList.remove('swing'); void hms[j].offsetWidth; hms[j].classList.add('swing'); };
    while (good < 8) {
      // 一輪節奏：師傅三下，然後換你
      await new Promise(res => {
        let b = -1, mine = false, lastMiss = 0;
        const tickBeat = () => {
          b = (b + 1) % 4; mine = false;
          hms.forEach((h, j) => h.classList.toggle('on', j === b));
          if (b < 3) { swing(b); strike(560, .05, .45); }
        };
        const hit = () => {
          if (b === 3 && !mine) {
            mine = true; swing(3); sfx('clang');
            good++; depth = good / 8; heat = Math.max(0, heat - .25);
            paint(); shake(disc);
            if (good % 4 === 0) { clearInterval(iv); off(); disc.removeEventListener('click', hit); hms.forEach(h => h.classList.remove('on')); res(); }
          } else if (performance.now() - lastMiss > 4000) { lastMiss = performance.now(); sfx('tap'); speak('c7.miss'); }
        };
        const off = onKeys(['space', 'enter'], hit);
        disc.addEventListener('click', hit);
        tickBeat();
        const iv = setInterval(tickBeat, 720);
      });
      if (good >= 8) break;
      // 冷掉了：拖回火裡
      await say('c7.cool');
      fire.hidden = false;
      await dragPick([disc], [fire]);
      home(disc);
      sfx('whoosh');
      for (let h = 0; h <= 1.001; h += .1) { heat = h; paint(); await sleep(120); }
      fire.hidden = true;
      await say('c7.hot');
    }
    sfx('win');
    await say('c7.shape');
    await say('c7.done');
    parent('高錫青銅冷的時候很脆，必須加熱到暗紅色才能鍛打，敲一陣子就要回爐。尼泊爾的工坊常由三、四位師傅圍著輪流下槌，一個缽要敲上千次。');
    await next();
  }

  // ---------- 第八關：泡冷水（拖進火裡、再拖進水桶） ----------
  async function ch8() {
    show();
    stage.innerHTML = '<div class="quench"><div class="zone qz" id="qf">' + A.furnace() + '<span class="cl">' + Z('c8.fire') + '</span><div class="qslot"></div></div>' +
      '<div class="qmid" id="qm"><div class="drag qb" id="qb">' + A.bowlSide({ body: '#6b5236', inner: '#4a3826', marks: false, shine: false }) + '</div></div>' +
      '<div class="zone qz" id="qw">' + A.bucket() + '<span class="cl">' + Z('c8.water') + '</span><div class="qslot"></div><div class="steam" id="sm"></div></div></div>';
    const qf = $('#qf'), qw = $('#qw'), qb = $('#qb'), sm = $('#sm');
    const paintBowl = h => { qb.innerHTML = A.bowlSide({ body: A.heatColor(h), inner: A.mix('#4a3826', '#c2452c', h), marks: false, shine: false }); };
    await say('c8.intro');
    say('c8.how');
    let heat = 0;
    for (;;) {
      const { t } = await dragPick([qb], heat >= 1 ? [null, qw] : [qf, qw]);
      if (t === 1 && heat < 1) { home(qb); sfx('no'); speak('c8.notyet'); continue; }
      if (t === 0) {
        dropInto(qb, qf.querySelector('.qslot'));
        sfx('whoosh');
        say('c8.wait');
        for (; heat < 1; heat = Math.min(1, heat + .08)) { paintBowl(heat); await sleep(180); }
        paintBowl(1);
        continue;
      }
      dropInto(qb, qw.querySelector('.qslot'));
      break;
    }
    sfx('steam');
    sm.innerHTML = [0, 1, 2].map(j => '<span style="animation-delay:' + (j * .3) + 's">' + A.puff() + '</span>').join('');
    for (let h = 1; h >= 0; h -= .2) { paintBowl(h); await sleep(150); }
    qb.innerHTML = A.bowlSide({ body: '#3e342c', inner: '#2c241e', marks: false, shine: false });
    await say('c8.zz');
    await say('c8.why');
    parent('含錫約 22% 的青銅若慢慢冷卻會變得很脆；從高溫直接淬火，可以保留比較有韌性的組織。印度、韓國的傳統響銅器也用同樣的方法。');
    await next();
  }

  // ---------- 第九關：磨亮亮（來回擦） ----------
  async function ch9() {
    show();
    stage.innerHTML = '<div class="polish" id="pl">' + A.bowlSide() + '<canvas id="cv"></canvas></div>' +
      '<div class="tip">' + Z('ui.scrubtip') + '</div><div class="meter"><i id="mt"></i></div>';
    const pl = $('#pl'), cv = $('#cv'), mt = $('#mt');
    const r = pl.getBoundingClientRect(), dpr = window.devicePixelRatio || 1;
    cv.width = Math.round(r.width * dpr); cv.height = Math.round(r.height * dpr);
    const ctx = cv.getContext('2d');
    const sx = cv.width / 120, sy = cv.height / 80;
    // 只把缽的形狀塗黑（座標跟 bowlSide 的 viewBox 120×80 一樣）
    ctx.setTransform(sx, 0, 0, sy, 0, 0);
    ctx.fillStyle = '#3e342c';
    const shape = new Path2D('M10 26 C12 58 34 74 60 74 C86 74 108 58 110 26Z');
    shape.ellipse(60, 26, 51.5, 12.5, 0, 0, Math.PI * 2);
    ctx.fill(shape);
    ctx.save(); ctx.clip(shape);
    ctx.fillStyle = '#2c241e';
    for (let k = 0; k < 160; k++) { ctx.beginPath(); ctx.arc(14 + Math.random() * 92, 18 + Math.random() * 54, .6 + Math.random() * 1.2, 0, 7); ctx.fill(); }
    ctx.restore();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    const count = () => { const d = ctx.getImageData(0, 0, cv.width, cv.height).data; let n = 0; for (let k = 3; k < d.length; k += 4 * 9) if (d[k] > 40) n++; return n; };
    const total = count();
    ctx.globalCompositeOperation = 'destination-out';
    ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.lineWidth = 46 * dpr;
    let last = null, st = 0;
    const rub = (a, b) => { ctx.beginPath(); ctx.moveTo(a.x * dpr, a.y * dpr); ctx.lineTo(b.x * dpr, b.y * dpr); ctx.stroke(); };
    const off = track(pl, {
      down(p) { last = p; rub(p, { x: p.x + .1, y: p.y }); },
      move(p) { if (last) { rub(last, p); last = p; const now = performance.now(); if (now - st > 90) { st = now; sfx('scrub'); } } },
      up() { last = null; },
    });
    const offK = onKeys(['a', 'd'], () => {
      const y = r.height * (.3 + Math.random() * .6);
      rub({ x: r.width * .08, y }, { x: r.width * .92, y: y + (Math.random() - .5) * 30 }); sfx('scrub');
    });
    await say('c9.intro');
    say('c9.how');
    let saidHalf = false, acc = 0;
    await holdLoop(null, [], dt => {
      acc += dt; if (acc < .3) return false; acc = 0;
      const done = 1 - count() / total;
      mt.style.width = Math.min(100, done / .88 * 100) + '%';
      if (done >= .5 && !saidHalf) { saidHalf = true; say('c9.half'); }
      return done >= .88;
    });
    off(); offK();
    cv.classList.add('fade');
    sfx('win');
    await say('c9.done');
    parent('淬火後的缽表面有一層黑色氧化皮，師傅會用車床或刮刀刮掉、再打磨。有些缽會保留外面的槌痕，看得出是手工敲出來的。');
    await next();
  }

  // ---------- 第十關：大缽小缽、缽裡的水會跳舞 ----------
  async function ch10() {
    show();
    const B = [{ k: 'big', w: 250, f: 140 }, { k: 'mid', w: 180, f: 230 }, { k: 'small', w: 120, f: 370 }];
    const ord = shuffle([0, 1, 2]);
    stage.innerHTML = '<div class="trio">' + ord.map((bi, p) => '<button class="bw" style="--w:' + B[bi].w + 'px"><kbd class="kc">' + (p + 1) + '</kbd>' +
      '<div class="bwa">' + A.bowlSide() + '</div><span class="cl">' + Z('c10.' + B[bi].k) + '</span></button>').join('') + '</div>';
    const bws = [...stage.querySelectorAll('.bw')];
    const play = p => { strike(B[ord[p]].f, .22, 3.5); bws[p].classList.remove('ring2'); void bws[p].offsetWidth; bws[p].classList.add('ring2'); };
    say('c10.intro');
    const heard = new Set();
    const targets = () => bws.map((b, p) => ({ el: b, keys: [String(p + 1)] }));
    while (heard.size < 3) { const p = await waitAction(targets()); play(p); heard.add(p); bws[p].classList.add('heard'); }
    await sleep(1200);
    say('c10.q');
    for (;;) {
      const p = await waitAction(targets());
      play(p);
      if (B[ord[p]].k === 'big') { bws[p].classList.add('right'); sfx('ok'); await say('c10.ok'); break; }
      shake(bws[p]); speak('g.no1');
    }
    await next();
    // 裝水，再磨磨看
    stage.innerHTML = '<div class="wrow">' + bowlBox(true) + '<div class="drag jug" id="jug">' + A.pitcher() + '</div></div><div class="tip" id="tip"></div>';
    const top = stage.querySelector('.btop'), jug = $('#jug'), water = top.querySelector('.water');
    stickAt(top, -Math.PI / 4);
    say('c10.water');
    await dragPick([jug], [top]);
    jug.classList.add('gone'); home(jug);
    sfx('pour'); setTimeout(() => sfx('pour'), 250);
    water.hidden = false;
    $('#tip').innerHTML = Z('ui.rubtip');
    say('c10.rub');
    const h = await rubBowl(top, { f0: 196, onLevel: e => { water.style.setProperty('--e', e.toFixed(2)); water.classList.toggle('splash', e > .85); } });
    await say('c10.dance');
    h.stop();
    water.classList.remove('splash'); water.style.setProperty('--e', 0); top.querySelector('.waves').style.opacity = 0;
    await say('c10.low');
    sfx('win');
    await say('c10.done');
    parent('缽越大、壁越薄，聲音越低。缽振動時把水面推出規律的波紋（稱為法拉第波），磨得夠用力，水珠甚至會跳起來；加水也讓缽振動得慢一點，所以音變低。');
    await next();
  }

  // ---------- 結尾 ----------
  async function finale() {
    show();
    stage.innerHTML = '<div class="center"><div class="stamp">頌缽<br>師傅</div><div class="chtitle">' + Z('fin.title') + '</div>' +
      '<div class="stickers">' + [A.oreCu(), A.copper(), A.tin(), A.flames(1), A.hammer(), A.bowlSide()].map(s => ring(s, 'md')).join('') + '</div>' +
      '<div class="parent"><b>給家長：</b>回家可以做「水杯樂器」：幾個玻璃杯裝不同高度的水，用筷子輕敲——水越多，聲音越低，和頌缽加水是同一個道理。也可以找找家裡的鍋子、湯匙，比比看哪個聲音最長。</div></div>';
    sfx('win');
    await say('fin.hi');
    await say('fin.task');
  }

  G.run({ saveKey: 'bowl-game-v1', stamp: '缽', heroArt: A.bowlSide(), chapters: [ch1, ch2, ch3, ch4, ch5, ch6, ch7, ch8, ch9, ch10], finale });
})();
