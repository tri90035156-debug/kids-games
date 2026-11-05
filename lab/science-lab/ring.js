// 學習圈：畫面上方正中央的圓環，三段「假設 → 實驗 → 結果」順時針，段與段之間有箭頭。
// 現在這一步＝珊瑚紅、微微呼吸；做完的一步＝墨色實心。走完一圈：整個圓環轉一圈（果凍回彈），下面多一顆小圓點。
// 第 10 關：三段變成按鈕，孩子自己按（waitTap）。
window.RING = (() => {
  'use strict';
  const { $, Z } = G;
  const el = () => $('#ring');
  let laps = 0, step = -1, tapRes = null, tapStep = -1, onTap = null;
  const NODES = [['h', 'ui.h'], ['x', 'ui.x'], ['r', 'ui.r']];
  function build() {
    const r = el();
    // 圓心 (90,70)、半徑 52；三個節點在 -90°、30°、150°；箭頭是節點之間的圓弧
    const C = [100, 74], R = 60, ang = [-90, 30, 150];
    const P = a => [C[0] + R * Math.cos(a * Math.PI / 180), C[1] + R * Math.sin(a * Math.PI / 180)];
    let arcs = '';
    for (let k = 0; k < 3; k++) {
      const a0 = ang[k] + 30, a1 = ang[k] + 120 - 30;
      const p0 = P(a0), p1 = P(a1), p2 = P(a1 - 9);
      arcs += '<path class="arc a' + k + '" d="M' + p0[0].toFixed(1) + ' ' + p0[1].toFixed(1) + ' A' + R + ' ' + R + ' 0 0 1 ' + p1[0].toFixed(1) + ' ' + p1[1].toFixed(1) + '"/>';
      // 箭頭：在終點朝切線方向
      const t = (a1 + 90) * Math.PI / 180, n = a1 * Math.PI / 180;
      const tip = [p1[0] + Math.cos(t) * 2, p1[1] + Math.sin(t) * 2];
      const b1 = [p1[0] - Math.cos(t) * 8 + Math.cos(n) * 5, p1[1] - Math.sin(t) * 8 + Math.sin(n) * 5];
      const b2 = [p1[0] - Math.cos(t) * 8 - Math.cos(n) * 5, p1[1] - Math.sin(t) * 8 - Math.sin(n) * 5];
      arcs += '<path class="hd a' + k + '" d="M' + b1.map(v => v.toFixed(1)).join(' ') + ' L' + tip.map(v => v.toFixed(1)).join(' ') + ' L' + b2.map(v => v.toFixed(1)).join(' ') + '"/>';
      void p2;
    }
    r.innerHTML = '<div class="sl-rg"><svg viewBox="0 0 200 140" aria-hidden="true">' + arcs + '</svg>' +
      NODES.map(([id, key], k) => { const p = P(ang[k]); return '<button type="button" class="sl-node n' + id + '" data-k="' + k + '" style="left:' + (p[0] / 200 * 100).toFixed(2) + '%;top:' + (p[1] / 140 * 100).toFixed(2) + '%"><span class="bt">' + Z(key) + '</span></button>'; }).join('') +
      '</div><div class="sl-laps" id="laps"></div>';
    r.querySelectorAll('.sl-node').forEach(b => b.addEventListener('click', ev => {
      ev.stopPropagation();
      const k = +b.dataset.k;
      if (onTap) onTap(k);
      if (tapRes && k === tapStep) { const f = tapRes; tapRes = null; b.classList.remove('tap'); f(); }
    }));
  }
  function paint() {
    const r = el();
    r.querySelectorAll('.sl-node').forEach((b, k) => {
      b.classList.toggle('cur', k === step);
      b.classList.toggle('done', step > k || step === 3);
    });
    r.querySelectorAll('.arc,.hd').forEach(a => { const k = +a.getAttribute('class').match(/a(\d)/)[1]; a.classList.toggle('on', step > k || step === 3); });
    const L = $('#laps');
    if (L) { const n = L.children.length; if (n !== laps) L.innerHTML = Array.from({ length: laps }, (_, i) => '<i' + (i >= n ? ' class="new"' : '') + '></i>').join(''); }
  }
  return {
    build,
    show(on) { el().hidden = !on; },
    reset(n = 0) { laps = n; step = -1; paint(); },
    go(s) { step = s; paint(); },
    // 走完一圈：全部變墨色 → 轉一圈 → 多一顆點 → 三段清空
    lap(sfx) {
      step = 3; paint();
      const g = el().querySelector('.sl-rg');
      g.classList.remove('spin'); void g.offsetWidth; g.classList.add('spin');
      if (sfx) sfx();
      return new Promise(res => setTimeout(() => { laps++; step = -1; paint(); g.classList.remove('spin'); res(laps); }, G.FAST ? 30 : 950));
    },
    // 總結：連轉 n 圈，點點一顆一顆排出來
    async spinMany(n, total, sfx) {
      laps = 0; paint();
      const g = el().querySelector('.sl-rg');
      for (let i = 0; i < n; i++) {
        g.classList.remove('spin2'); void g.offsetWidth; g.classList.add('spin2');
        if (sfx) sfx(i);
        await new Promise(r => setTimeout(r, G.FAST ? 10 : 360));
        laps = Math.round((i + 1) / n * total); paint();
      }
      g.classList.remove('spin2');
    },
    get laps() { return laps; },
    set laps(v) { laps = v; paint(); },
    get step() { return step; },
    // 第 10 關：等孩子按這一段（Enter 也可以）
    waitTap(k) {
      step = k; paint();
      const b = el().querySelectorAll('.sl-node')[k];
      b.classList.add('tap');
      tapStep = k;
      return new Promise(res => { tapRes = res; });
    },
    tapKey() { if (tapRes) { const b = el().querySelectorAll('.sl-node')[tapStep]; b.classList.remove('tap'); const f = tapRes; tapRes = null; f(); return true; } return false; },
    get waiting() { return !!tapRes; },
    node(k) { return el().querySelectorAll('.sl-node')[k]; },
    onTap(f) { onTap = f; },
  };
})();
