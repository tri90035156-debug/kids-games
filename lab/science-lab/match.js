// 假設板：連連看（match）與選一個（choice）。疊在 3D 畫面上（DOM），用完收起來。
// 連連看的做法照 lab/water-game 第 9 關（README「連連看形式」）：
//   點左再點右、點右再點左、從任一邊拖到另一邊、字母鍵 A～E／J K L；手指移動超過 14px 才算拖（否則一律當點）；
//   放開時沒剛好在卡上，吸到 56px 內最近的卡；同一張再點＝取消；點空白＝取消；多對一不鎖右卡；點卡片唸卡片。
// 三種模式：
//   guess  （假設）怎麼連都可以；全部連好就收起來。連好的線還沒全部連完前可以改。
//   fix    （結果不一樣時）跟假設一樣的線留著，不一樣的線先輕搖再拿掉，孩子把它改接到真的結果；
//          接錯：右卡輕搖＋低木魚（不收）；錯兩次右邊對的卡亮；錯三次小手示範後自己接上。
//   review （總結）每一條都要接對，接錯一樣溫柔。
window.HYP = (() => {
  'use strict';
  const { $, Z, track, onKeys } = G;
  const MOVE = 14, SNAP = 56;
  const board = () => $('#hyp');
  let cur = null;     // 目前打開的板子：{ demo(), close() }
  const kc = k => '<kbd class="kc sl-kk">' + k + '</kbd>';
  function shake(el) { el.classList.remove('sl-shake'); void el.offsetWidth; el.classList.add('sl-shake'); }
  function squash(el) { el.classList.remove('sl-sq'); void el.offsetWidth; el.classList.add('sl-sq'); }

  function open(html, cls) {
    const b = board();
    b.className = 'sl-hyp ' + cls;
    b.innerHTML = html;
    b.hidden = false;
    b.classList.remove('out'); void b.offsetWidth; b.classList.add('in');
    return b;
  }
  function close() {
    const b = board();
    if (b.hidden) return Promise.resolve();
    b.classList.remove('in'); b.classList.add('out');
    cur = null;
    return new Promise(r => setTimeout(() => { if (b.classList.contains('out')) { b.hidden = true; b.innerHTML = ''; } r(); }, 260));
  }

  // ---------- 連連看 ----------
  // spec: { left:[{svg, say}], right:[{svg, label, say}], mode, truth:[右卡索引…], guess:[…], env:{ voice, sfx, act, nope, hint } }
  function match(spec) {
    const { left, right, mode = 'guess', truth = [], guess = [], env } = spec;
    const LK = 'ABCDE', RK = (spec.rkeys || 'JKL').toUpperCase(), rk = RK.toLowerCase();
    const html = '<div class="sl-match" id="mx"><svg class="sl-lines" id="lines"><g id="perm"></g><g id="ghost"></g><line id="tmp" visibility="hidden"/></svg>' +
      '<div class="sl-left">' + left.map((s, i) => '<button class="sl-mc sl-ml" data-i="' + i + '" type="button">' + kc(LK[i]) + '<span class="sl-mi">' + s.svg + '</span><i class="sl-dot"></i></button>').join('') + '</div>' +
      '<div class="sl-right">' + right.map((a, i) => '<button class="sl-mc sl-mr" data-a="' + i + '" type="button"><i class="sl-dot"></i>' + kc(RK[i]) + '<span class="sl-mi">' + a.svg + '</span>' + (a.label ? '<span class="sl-ml-t">' + Z(a.label) + '</span>' : '') + '</button>').join('') + '</div></div>';
    const b = open(html, 'sl-hyp-m' + (right.length > 2 ? ' r3' : '') + (left.length > 4 ? ' l5' : ''));
    const mx = b.querySelector('#mx'), svgL = b.querySelector('#lines'), perm = b.querySelector('#perm'), ghost = b.querySelector('#ghost'), tmp = b.querySelector('#tmp');
    const sEls = [...b.querySelectorAll('.sl-ml')], aEls = [...b.querySelectorAll('.sl-mr')];
    const EL = { s: sEls, a: aEls };
    const pairs = left.map(() => -1), miss = left.map(() => 0);
    const sel = { s: -1, a: -1 };
    let busy = false, finished = false;
    const pt = el => {
      const r = el.querySelector('.sl-dot').getBoundingClientRect(), m = mx.getBoundingClientRect();
      return [r.left - m.left + r.width / 2, r.top - m.top + r.height / 2];
    };
    const line = (i, a, cls = '') => { const p = pt(sEls[i]), q = pt(aEls[a]); return '<line class="' + cls + '" x1="' + p[0] + '" y1="' + p[1] + '" x2="' + q[0] + '" y2="' + q[1] + '"/>'; };
    const redraw = () => {
      const m = mx.getBoundingClientRect();
      svgL.setAttribute('viewBox', '0 0 ' + m.width + ' ' + m.height);
      perm.innerHTML = pairs.map((a, i) => a >= 0 ? line(i, a) : '').join('');
    };
    const paint = () => {
      sEls.forEach((e, k) => { e.classList.toggle('sel', k === sel.s); e.classList.toggle('done', pairs[k] >= 0); e.classList.toggle('redo', mode !== 'guess' && pairs[k] < 0); });
      aEls.forEach((e, k) => e.classList.toggle('sel', k === sel.a));
    };
    const clear = () => { sel.s = sel.a = -1; paint(); };
    const ro = new ResizeObserver(redraw); ro.observe(mx);
    // fix 模式：一樣的線先留著；不一樣的線畫成虛線、搖一下再拿掉
    if (mode === 'fix') {
      guess.forEach((a, i) => { if (a === truth[i]) pairs[i] = a; });
      requestAnimationFrame(() => {
        redraw();
        ghost.innerHTML = guess.map((a, i) => a !== truth[i] && a >= 0 ? line(i, a, 'bad') : '').join('');
        guess.forEach((a, i) => { if (a !== truth[i]) { shake(sEls[i]); } });
        setTimeout(() => { ghost.innerHTML = ''; paint(); }, 1300);
      });
    }
    requestAnimationFrame(() => { redraw(); paint(); });
    return new Promise(res => {
      const finish = () => {
        if (finished) return; finished = true;
        offT(); offK(); ro.disconnect(); document.removeEventListener('pointerdown', outside, true);
        setTimeout(() => { res(pairs.slice()); }, mode === 'guess' ? 450 : 700);
      };
      const outside = ev => { if (!busy && !ev.target.closest('#hyp,#cap,.sl-ico')) clear(); };
      document.addEventListener('pointerdown', outside, true);
      const allDone = () => pairs.every(a => a >= 0);
      const link = (i, a) => {
        pairs[i] = a; redraw();
        squash(sEls[i]); squash(aEls[a]);
        clear();
        env.sfx('ok');
        if (spec.onLink) spec.onLink(i, a);
        if (allDone()) finish();
      };
      const attempt = async (i, a) => {
        if (busy || finished) return;
        env.act();
        tmp.setAttribute('visibility', 'hidden');
        if (mode === 'guess') { link(i, a); return; }
        if (pairs[i] >= 0) { clear(); return; }
        if (truth[i] !== a) {
          shake(aEls[a]); env.sfx('no');
          miss[i]++;
          sel.s = i; sel.a = -1; paint();
          env.nope(miss[i]);
          if (miss[i] >= 2) aEls[truth[i]].classList.add('hint');
          if (miss[i] < 3) return;
          busy = true;
          cur.handTo = [sEls[i], aEls[truth[i]]];
          if (env.demo) await env.demo();
          busy = false;
          a = truth[i];
        }
        aEls.forEach(e => e.classList.remove('hint'));
        link(i, a);
      };
      const pick = (side, k) => {
        if (busy || finished) return;
        env.act();
        const el = EL[side][k];
        const other = side === 's' ? 'a' : 's';
        if (side === 's' && pairs[k] >= 0 && mode !== 'guess') { env.voice(left[k].say); return; }
        if (sel[other] >= 0) { const i = side === 's' ? k : sel.s, a = side === 'a' ? k : sel.a; attempt(i, a); return; }
        if (sel[side] === k) { clear(); env.sfx('tap'); return; }
        sel[side] = k; paint(); env.sfx('tap'); squash(el);
        env.voice(side === 's' ? left[k].say : right[k].say);
      };
      const cardAt = (x, y) => {
        const e = document.elementFromPoint(x, y);
        const s = e && e.closest('.sl-ml'), a = e && e.closest('.sl-mr');
        return s ? ['s', +s.dataset.i] : a ? ['a', +a.dataset.a] : null;
      };
      const nearest = (side, x, y) => {
        let best = -1, bd = SNAP;
        EL[side].forEach((e, k) => {
          const r = e.getBoundingClientRect();
          const d = Math.hypot(Math.max(r.left - x, 0, x - r.right), Math.max(r.top - y, 0, y - r.bottom));
          if (d < bd) { bd = d; best = k; }
        });
        return best;
      };
      let start = null, moved = false, x0 = 0, y0 = 0;
      const offT = track(mx, {
        down(p, ev) { start = cardAt(ev.clientX, ev.clientY); moved = false; x0 = ev.clientX; y0 = ev.clientY; env.act(); },
        move(p, ev) {
          if (!start || busy || finished) return;
          if (!moved && Math.hypot(ev.clientX - x0, ev.clientY - y0) < MOVE) return;
          moved = true;
          const q = pt(EL[start[0]][start[1]]);
          tmp.setAttribute('x1', q[0]); tmp.setAttribute('y1', q[1]); tmp.setAttribute('x2', p.x); tmp.setAttribute('y2', p.y);
          tmp.setAttribute('visibility', 'visible');
        },
        up(p, ev) {
          tmp.setAttribute('visibility', 'hidden');
          const st = start; start = null;
          if (ev.type === 'pointercancel') return;
          if (!st) { if (!moved) clear(); return; }
          if (!moved) { pick(st[0], st[1]); return; }
          const other = st[0] === 's' ? 'a' : 's';
          const hit = cardAt(ev.clientX, ev.clientY);
          const k = hit && hit[0] === other ? hit[1] : nearest(other, ev.clientX, ev.clientY);
          if (k < 0) { if (sel[st[0]] !== st[1]) pick(st[0], st[1]); return; }
          sel.s = sel.a = -1; sel[st[0]] = st[1];
          if (st[0] === 's') attempt(st[1], k); else attempt(k, st[1]);
        },
      });
      const offK = onKeys(['a', 'b', 'c', 'd', 'e', ...rk.split('')], k => {
        const li = 'abcde'.indexOf(k);
        if (li >= 0) { if (li < left.length) pick('s', li); }
        else { const ri = rk.indexOf(k); if (ri >= 0 && ri < right.length) pick('a', ri); }
      });
      cur = {
        el: b, handTo: null,
        // 小手示範：從第一張還沒連的左卡拖到（對的或第一張）右卡
        demo() {
          if (cur.handTo) { const h = cur.handTo; cur.handTo = null; return [center(h[0]), center(h[1])]; }
          const i = pairs.findIndex(a => a < 0);
          if (i < 0) return null;
          const a = mode === 'guess' ? 0 : truth[i];
          return [center(sEls[i]), center(aEls[a])];
        },
        probe() { return { mode, pairs: pairs.slice(), left: sEls.map(center), right: aEls.map(center), sel: { ...sel } }; },
      };
    });
  }
  const center = el => { const r = el.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; };

  // ---------- 選一個 ----------
  // spec: { opts:[{svg, label, say}], mode:'guess'|'fix', truth, guess, env }
  function choice(spec) {
    const { opts, mode = 'guess', truth = -1, guess = -1, env } = spec;
    const html = '<div class="sl-choice n' + opts.length + '">' + opts.map((o, i) =>
      '<button class="sl-opt" type="button" data-i="' + i + '">' + kc('ABC'[i]) + '<span class="sl-oi">' + o.svg + '</span>' + (o.label ? '<span class="sl-ot">' + Z(o.label) + '</span>' : '') + '</button>').join('') + '</div>';
    const b = open(html, 'sl-hyp-c');
    const els = [...b.querySelectorAll('.sl-opt')];
    if (mode === 'fix' && guess >= 0) { els[guess].classList.add('was'); requestAnimationFrame(() => shake(els[guess])); }
    let miss = 0, busy = false, done = false;
    return new Promise(res => {
      const end = i => { done = true; offK(); els.forEach(e => e.removeEventListener('click', e._h)); setTimeout(() => res(i), mode === 'guess' ? 420 : 650); };
      const pick = async i => {
        if (busy || done) return;
        env.act();
        if (mode === 'guess') { els.forEach((e, k) => e.classList.toggle('sel', k === i)); squash(els[i]); env.sfx('ok'); env.voice(opts[i].say); end(i); return; }
        if (i !== truth) {
          shake(els[i]); env.sfx('no'); miss++; env.nope(miss);
          if (miss >= 2) els[truth].classList.add('hint');
          if (miss < 3) return;
          busy = true; cur.handTo = [els[truth]];
          if (env.demo) await env.demo();
          busy = false; i = truth;
        }
        els.forEach((e, k) => { e.classList.toggle('sel', k === i); e.classList.remove('hint', 'was'); });
        squash(els[i]); env.sfx('ok'); env.voice(opts[i].say);
        end(i);
      };
      els.forEach((e, i) => { e._h = () => pick(i); e.addEventListener('click', e._h); });
      const offK = onKeys(['a', 'b', 'c'], k => { const i = 'abc'.indexOf(k); if (i < opts.length) pick(i); });
      cur = {
        el: b, handTo: null,
        demo() { if (cur.handTo) { const h = cur.handTo; cur.handTo = null; return [center(h[0])]; } return [center(els[mode === 'fix' ? truth : 0])]; },
        probe() { return { mode, opts: els.map(center) }; },
      };
    });
  }

  return { match, choice, close, get cur() { return cur; }, get open() { return !board().hidden && !!cur; } };
})();
