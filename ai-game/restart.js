// 每關「重來」鈕（九個遊戲共用，每個遊戲資料夾一份一模一樣的複本；改了要全部同步，用 diff 檢查）。
// 右上角、聲音鈕旁邊一顆圓箭頭圖示鈕（不寫字，自動套用聲音鈕的樣式）。
// 按下去：木魚一聲 → 停掉旁白 → 呼叫遊戲給的 fn（通常是 RESTART.reload({ ch: 3 })：重新載入到本關，進度不丟）。
// 重新載入後網址上的 rst 參數會被 history.replaceState 清掉，網址保持乾淨（?fast=1 測試參數會留著）。
// 加分：同一關 90 秒沒有進展（沒答對、沒完成一步），鈕輕輕呼吸提醒；孩子一動手就停，15 秒內不再呼吸。
// 用法：
//   RESTART.init({ sound: () => 聲音開著嗎, stop: () => 停旁白 })   ← engine.js 會自己呼叫；沒用引擎的遊戲自己呼叫
//   RESTART.set(fn | null)    ← 進到一關時給 fn（鈕出現），封面、結尾給 null（鈕藏起來）
//   RESTART.set(fn, { hint: false }) ← 自由探索（開車逛小鎮、在太陽系飛）：鈕在，但不做 90 秒呼吸提醒
//   RESTART.progress()        ← 有進展時呼叫（答對、完成一步）；engine.js 的 sfx('ok'|'win') 與 next() 會自動呼叫
//   RESTART.reload({ ch: 3 }) ← 帶這些參數重新載入（自動加 rst=1；?fast=1 會保留）
window.RESTART = (() => {
  'use strict';
  const QS0 = location.search;
  const FAST = /[?&]fast=1/.test(QS0);
  let btn = null, fn = null, busy = false, hint = true;
  let soundOn = () => true, stopVoice = () => {};
  let idleMs = 90000, lastProg = performance.now(), calmUntil = 0, breathing = false;
  let AC = null;

  const ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
    '<path d="M4.5 12a7.5 7.5 0 1 0 2.2-5.3"/><path d="M4 4.5v4h4"/></svg>';

  function mount() {
    if (btn) return btn;
    btn = document.getElementById('rstBtn');
    if (!btn) {
      const snd = document.getElementById('sndBtn');
      btn = document.createElement('button');
      btn.id = 'rstBtn'; btn.type = 'button';
      btn.className = snd ? snd.className.replace(/\boff\b/g, '').trim() : 'pill';
      if (snd && snd.parentNode) snd.parentNode.insertBefore(btn, snd); else document.body.appendChild(btn);
    }
    btn.setAttribute('aria-label', '這一關重來');
    btn.innerHTML = ICON;
    btn.hidden = true;
    btn.addEventListener('click', go);
    return btn;
  }

  // 木魚：短短的「叩」（兩個很快消失的正弦泛音）
  function knock() {
    if (!soundOn()) return;
    try {
      if (!AC) AC = new (window.AudioContext || window.webkitAudioContext)();
      if (AC.state === 'suspended') AC.resume();
      const t = AC.currentTime;
      [[820, .22, .12], [1630, .07, .06]].forEach(([f, v, d]) => {
        const o = AC.createOscillator(), g = AC.createGain();
        o.type = 'sine';
        o.frequency.setValueAtTime(f, t); o.frequency.exponentialRampToValueAtTime(f * .92, t + d);
        g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(v, t + .004);
        g.gain.exponentialRampToValueAtTime(.001, t + d);
        o.connect(g).connect(AC.destination); o.start(t); o.stop(t + d + .03);
      });
    } catch (e) { /* 沒有 WebAudio 就算了 */ }
  }

  function go() {
    if (!fn || busy) return;
    busy = true;
    breathe(false);
    knock();
    try { stopVoice(); } catch (e) { /* ignore */ }
    btn.classList.add('spin');
    const f = fn;
    setTimeout(() => { try { f(); } finally { busy = false; } }, FAST ? 0 : 280);   // 讓木魚聲先出來
  }

  function breathe(on) {
    breathing = on;
    if (btn) btn.classList.toggle('breathe', on);
  }

  function set(f, o) {
    mount();
    fn = typeof f === 'function' ? f : null;
    hint = !(o && o.hint === false);
    btn.hidden = !fn;
    btn.classList.remove('spin');
    progress();
  }

  function progress() {
    lastProg = performance.now();
    if (breathing) breathe(false);
  }

  // 孩子一動手：呼吸停下來，15 秒內不再提醒（真的有進展才會重新算 90 秒）
  const calm = () => { calmUntil = performance.now() + 15000; if (breathing) breathe(false); };
  addEventListener('pointerdown', calm, true);
  addEventListener('keydown', calm, true);
  setInterval(() => {
    if (!btn || !fn || !hint || btn.hidden || breathing) return;
    const now = performance.now();
    if (now - lastProg > idleMs && now > calmUntil) breathe(true);
  }, 1000);

  function url(params) {
    const q = new URLSearchParams();
    if (FAST) q.set('fast', '1');
    Object.keys(params || {}).forEach(k => { if (params[k] !== null && params[k] !== undefined) q.set(k, String(params[k])); });
    q.set('rst', '1');
    return location.pathname + '?' + q.toString();
  }
  function reload(params) { location.replace(url(params)); }

  // 重新載入後：遊戲已經讀完網址參數，再把網址清乾淨
  const fromRestart = /[?&]rst=/.test(QS0);
  if (fromRestart) {
    const clean = () => {
      const q = FAST ? '?fast=1' : '';
      try { history.replaceState(history.state, '', location.pathname + q + location.hash); } catch (e) { /* ignore */ }
    };
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => setTimeout(clean, 0));
    else setTimeout(clean, 0);
  }

  function init(o) {
    if (o && o.sound) soundOn = o.sound;
    if (o && o.stop) stopVoice = o.stop;
    mount();
  }

  return {
    init, set, progress, reload, url, fromRestart,
    get active() { return !!fn; },
    // 測試用：把 90 秒改短
    set idle(ms) { idleMs = ms; },
    get idle() { return idleMs; },
  };
})();
