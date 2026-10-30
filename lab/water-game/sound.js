// 柔和音效：木琴、木魚、水滴、輕柔和弦，全部 WebAudio 現場合成，走五聲音階。
// 沒有音檔、沒有方波、沒有白噪音。取代共用引擎的 G.sfx（engine.js 之後、app.js 之前載入）。
(() => {
  'use strict';
  let AC = null, lastT = 0, burst = 0, VM = 1;
  const ac = () => {
    if (!AC) AC = new (window.AudioContext || window.webkitAudioContext)();
    if (AC.state === 'suspended') AC.resume();
    return AC;
  };
  const out = (lp = 2600) => {
    const a = ac(), g = a.createGain(), f = a.createBiquadFilter();
    f.type = 'lowpass'; f.frequency.value = lp; g.connect(f).connect(a.destination);
    return g;
  };
  // 連續觸發時自動變小聲（音量避讓）
  const duck = () => {
    const now = performance.now();
    burst = now - lastT < 180 ? Math.min(burst + 1, 6) : 0;
    lastT = now;
    return 1 / (1 + burst * .35);
  };
  // 五聲音階：C D E G A（兩個八度）
  const PENTA = [261.6, 293.7, 329.6, 392, 440, 523.3, 587.3, 659.3, 784, 880, 1046.5];
  const pick = i => PENTA[Math.max(0, Math.min(PENTA.length - 1, i))];
  function mallet(f, t0 = 0, vol = .18, dur = .9) {
    const a = ac(), t = a.currentTime + t0, o0 = out();
    [[1, 1, dur], [3.98, .16, dur * .25], [9.8, .035, dur * .08]].forEach(([r, g, d]) => {
      const o = a.createOscillator(), gg = a.createGain();
      o.frequency.value = f * r;
      gg.gain.setValueAtTime(0, t); gg.gain.linearRampToValueAtTime(vol * g * VM, t + .006); gg.gain.exponentialRampToValueAtTime(.0005, t + d);
      o.connect(gg).connect(o0); o.start(t); o.stop(t + d + .05);
    });
  }
  function wood(f = 820, t0 = 0, vol = .14) {
    const a = ac(), t = a.currentTime + t0, o0 = out(3200), o = a.createOscillator(), g = a.createGain();
    o.frequency.setValueAtTime(f * 1.25, t); o.frequency.exponentialRampToValueAtTime(f, t + .03);
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol * VM, t + .003); g.gain.exponentialRampToValueAtTime(.0005, t + .16);
    o.connect(g).connect(o0); o.start(t); o.stop(t + .2);
  }
  function drop(t0 = 0, vol = .12, hi = 1400, lo = 520) {
    const a = ac(), t = a.currentTime + t0, o0 = out(), o = a.createOscillator(), g = a.createGain();
    o.frequency.setValueAtTime(hi, t); o.frequency.exponentialRampToValueAtTime(lo, t + .09);
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol * VM, t + .01); g.gain.exponentialRampToValueAtTime(.0005, t + .22);
    o.connect(g).connect(o0); o.start(t); o.stop(t + .27);
  }
  function pad(fs, t0 = 0, vol = .045, dur = 1.8) {
    const a = ac(), t = a.currentTime + t0, o0 = out(1800);
    fs.forEach(f => {
      const o = a.createOscillator(), g = a.createGain();
      o.type = 'triangle'; o.frequency.value = f;
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + .25); g.gain.exponentialRampToValueAtTime(.0005, t + dur);
      o.connect(g).connect(o0); o.start(t); o.stop(t + dur + .05);
    });
  }
  function glide(f0 = 600, f1 = 300, dur = .8, vol = .04) {
    const a = ac(), t = a.currentTime, o0 = out(1200), o = a.createOscillator(), g = a.createGain();
    o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(f1, t + dur);
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + .08); g.gain.exponentialRampToValueAtTime(.0005, t + dur);
    o.connect(g).connect(o0); o.start(t); o.stop(t + dur + .05);
  }
  const MAP = {
    ok: () => { mallet(pick(5)); mallet(pick(7), .09); mallet(pick(9), .18); },     // 上行三音
    no: () => wood(300, 0, .1),                                                  // 低一點的木魚一聲
    tap: () => wood(900, 0, .08),
    knock: () => { wood(1250, 0, .12); },                                        // 冰塊「叩」
    pop: () => drop(),
    drip: v => drop(0, .1, 1100 + (v || 0) * 700, 480 + (v || 0) * 260),           // 水滴，越接近完成越高
    bubble: () => drop(0, .05, 700, 300),
    land: () => mallet(pick(2) / 2, 0, .16, .45),                                  // 放下的「咚」
    win: () => { [5, 7, 8, 10].forEach((n, i) => mallet(pick(n), i * .11, .15)); pad([261.6, 329.6, 392], .1); },
    chord: () => pad([261.6, 329.6, 392, 523.3], 0, .05, 2.2),
    steam: () => glide(900, 420, 1, .03),
    cold: () => mallet(pick(9), 0, .07, .5),
    warm: () => mallet(pick(2), 0, .08, .6),
  };
  const sfx = (name, v) => {
    if (!G.S.sound) return;
    const f = MAP[name];
    if (!f) return;
    try { VM = (name === 'win' || name === 'ok') ? 1 : duck(); f(v); VM = 1; } catch (e) { /* 沒有 WebAudio 就算了 */ }
  };
  // 依序敲第 i 個音（節奏關用）
  const note = (i, vol = .16) => { if (!G.S.sound) return; try { mallet(pick(i), 0, vol, .8); } catch (e) { /* ignore */ } };
  G.sfx = sfx;
  G.note = note;
})();
