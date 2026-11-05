// 記錄本：每做完一關貼上一頁（三格小圖：假設／實驗／結果，無字）＋一個印章。
// 平常點實驗桌右邊的記錄本（或右上角的書本圖示）可以翻看；點一頁＝重聽那關的結論。
window.BOOK = (() => {
  'use strict';
  const { $ } = G;
  const A = ART;
  let env = null, idx = 0, list = () => [], openRes = null;
  const el = () => $('#book');
  function pageHtml(n, laps, stamped = true) {
    const cells = A.page(n);
    return '<div class="sl-pg" data-n="' + n + '"><div class="sl-pgn">' + n + '</div>' +
      '<div class="sl-cells">' + cells.map((c, k) => '<div class="sl-cell c' + k + '">' + c + '</div>').join('<i class="sl-ar"></i>') + '</div>' +
      '<div class="sl-pgl">' + Array.from({ length: laps || 0 }, () => '<i></i>').join('') + '</div>' +
      '<div class="sl-stamp' + (stamped ? ' on' : '') + '">' + A.expIcon(n) + '</div></div>';
  }
  function render() {
    const L = list();
    const b = el();
    if (!L.length) { b.querySelector('.sl-bkp').innerHTML = '<div class="sl-pg empty"></div>'; return; }
    idx = Math.max(0, Math.min(L.length - 1, idx));
    const it = L[idx];
    b.querySelector('.sl-bkp').innerHTML = pageHtml(it.n, it.laps);
    b.querySelector('.sl-bk-prev').disabled = idx === 0;
    b.querySelector('.sl-bk-next').disabled = idx >= L.length - 1;
  }
  function init(e) {
    env = e; list = e.list;
    const b = el();
    b.innerHTML = '<div class="sl-bkw"><button class="sl-bk-x" type="button" aria-label="關上">' + A.UI.back + '</button>' +
      '<button class="sl-bk-prev sl-bk-nav" type="button" aria-label="上一頁">' + A.UI.left + '<kbd class="kc sl-kk">←</kbd></button>' +
      '<div class="sl-bkp"></div>' +
      '<button class="sl-bk-next sl-bk-nav" type="button" aria-label="下一頁">' + A.UI.right + '<kbd class="kc sl-kk">→</kbd></button></div>';
    b.querySelector('.sl-bk-x').addEventListener('click', () => { env.sfx('tap'); close(); });
    b.querySelector('.sl-bk-prev').addEventListener('click', () => flip(-1));
    b.querySelector('.sl-bk-next').addEventListener('click', () => flip(1));
    b.querySelector('.sl-bkp').addEventListener('click', () => { const L = list(); if (L[idx]) { env.sfx('tap'); env.replay(L[idx].n); } });
    b.addEventListener('pointerdown', ev => { if (ev.target === b) close(); });
  }
  function flip(d) {
    const L = list(); const j = idx + d;
    if (j < 0 || j >= L.length) { env.sfx('no'); return; }
    idx = j; env.sfx('page'); render();
    const p = el().querySelector('.sl-pg'); p.classList.add(d > 0 ? 'fl' : 'fr');
  }
  function open(n) {
    const L = list();
    const k = L.findIndex(it => it.n === n);
    idx = k >= 0 ? k : L.length - 1;
    el().hidden = false; el().classList.remove('browse'); void el().offsetWidth; el().classList.add('browse');
    render();
    return new Promise(r => { openRes = r; });
  }
  function close() {
    const b = el(); if (b.hidden) return;
    b.classList.remove('browse', 'show'); b.hidden = true;
    if (openRes) { const r = openRes; openRes = null; r(); }
    if (env.onClose) env.onClose();
  }
  // 一關做完：記錄本飛進來、翻到新的一頁，三格一格一格出現，最後蓋印（木魚＋和弦）
  async function stamp(n, laps) {
    const b = el();
    b.hidden = false; b.classList.remove('browse'); b.classList.add('show', 'fly');
    b.querySelector('.sl-bkp').innerHTML = pageHtml(n, laps, false);
    b.querySelector('.sl-bk-prev').disabled = b.querySelector('.sl-bk-next').disabled = true;
    const w = s => new Promise(r => setTimeout(r, G.FAST ? 15 : s * 1000));
    await w(.5);
    for (const c of b.querySelectorAll('.sl-cell')) { c.classList.add('in'); env.sfx('tap'); await w(.45); }
    const st = b.querySelector('.sl-stamp'); st.classList.add('on', 'hit'); env.sfx('stamp');
    await w(1.4);
    b.classList.remove('show', 'fly'); b.hidden = true;
  }
  // 總結：十頁快速翻過，每頁的印章亮一下
  async function flipAll(pages) {
    const b = el();
    b.hidden = false; b.classList.remove('browse'); b.classList.add('show');
    b.querySelector('.sl-bk-prev').disabled = b.querySelector('.sl-bk-next').disabled = true;
    for (const it of pages) {
      b.querySelector('.sl-bkp').innerHTML = pageHtml(it.n, it.laps);
      const p = b.querySelector('.sl-pg'); p.classList.add('fl');
      const st = b.querySelector('.sl-stamp'); st.classList.add('hit');
      env.sfx('page');
      await new Promise(r => setTimeout(r, G.FAST ? 15 : 520));
    }
    await new Promise(r => setTimeout(r, G.FAST ? 15 : 600));
    b.classList.remove('show'); b.hidden = true;
  }
  return { init, open, close, stamp, flipAll, get isOpen() { return !el().hidden; }, key(k) { if (el().hidden || !el().classList.contains('browse')) return false; if (k === 'left') flip(-1); else if (k === 'right') flip(1); else if (k === 'enter' || k === 'space' || k === 'back') close(); return true; } };
})();
