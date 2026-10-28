// 柔和的音效：木琴（marimba）、木魚、水滴、輕柔和弦，全部走五聲音階（怎麼撞都好聽）。
// 沒有尖銳的電子音、沒有白噪音。取代共用引擎裡的 G.sfx；另外提供 G.engine(level) 很低很小的引擎嗡嗡聲。
// 要在 engine.js 之後、world.js／app.js 之前載入。
(() => {
  'use strict';
  let AC = null, eng = null;
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
  // 五聲音階：C D E G A（兩個八度）
  const PENTA = [261.6, 293.7, 329.6, 392, 440, 523.3, 587.3, 659.3, 784, 880];
  const pick = i => PENTA[((i % PENTA.length) + PENTA.length) % PENTA.length];
  let step = 0;
  // 木琴：正弦基音＋一點點三倍、十倍泛音，快速衰減
  function mallet(f, t0 = 0, vol = .2, dur = .9) {
    const a = ac(), t = a.currentTime + t0, o0 = out();
    [[1, 1, dur], [3.98, .18, dur * .25], [9.8, .04, dur * .08]].forEach(([r, g, d]) => {
      const o = a.createOscillator(), gg = a.createGain();
      o.frequency.value = f * r;
      gg.gain.setValueAtTime(0, t); gg.gain.linearRampToValueAtTime(vol * g, t + .006); gg.gain.exponentialRampToValueAtTime(.0005, t + d);
      o.connect(gg).connect(o0); o.start(t); o.stop(t + d + .05);
    });
  }
  // 木魚：短短的「叩」
  function wood(f = 820, t0 = 0, vol = .16) {
    const a = ac(), t = a.currentTime + t0, o0 = out(3200), o = a.createOscillator(), g = a.createGain();
    o.frequency.setValueAtTime(f * 1.25, t); o.frequency.exponentialRampToValueAtTime(f, t + .03);
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + .003); g.gain.exponentialRampToValueAtTime(.0005, t + .16);
    o.connect(g).connect(o0); o.start(t); o.stop(t + .2);
  }
  // 水滴：高音快速下滑的「啵」
  function drop(t0 = 0, vol = .14) {
    const a = ac(), t = a.currentTime + t0, o0 = out(), o = a.createOscillator(), g = a.createGain();
    o.frequency.setValueAtTime(1400, t); o.frequency.exponentialRampToValueAtTime(520, t + .09);
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + .01); g.gain.exponentialRampToValueAtTime(.0005, t + .22);
    o.connect(g).connect(o0); o.start(t); o.stop(t + .27);
  }
  // 輕柔的大三和弦
  function pad(fs, t0 = 0, vol = .05, dur = 1.8) {
    const a = ac(), t = a.currentTime + t0, o0 = out(1800);
    fs.forEach(f => {
      const o = a.createOscillator(), g = a.createGain();
      o.type = 'triangle'; o.frequency.value = f;
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + .3); g.gain.exponentialRampToValueAtTime(.0005, t + dur);
      o.connect(g).connect(o0); o.start(t); o.stop(t + dur + .05);
    });
  }
  // 低音滑過去（取代風聲）
  function glide(f0 = 180, f1 = 90, dur = .5, vol = .07) {
    const a = ac(), t = a.currentTime, o0 = out(900), o = a.createOscillator(), g = a.createGain();
    o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(f1, t + dur);
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + .05); g.gain.exponentialRampToValueAtTime(.0005, t + dur);
    o.connect(g).connect(o0); o.start(t); o.stop(t + dur + .05);
  }
  const MAP = {
    ok: () => { mallet(pick(5)); mallet(pick(8), .09); },
    no: () => { wood(330, 0, .1); wood(262, .12, .09); },
    tap: () => wood(900, 0, .09),
    win: () => { [5, 7, 8, 10].forEach((n, i) => mallet(pick(n), i * .11, .17)); pad([261.6, 329.6, 392], .1); },
    door: () => pad([261.6, 329.6, 392, 523.3], 0, .06, 2.2),
    near: () => mallet(pick(9), 0, .12, .7),
    hover: () => wood(1100, 0, .05),
    edge: () => wood(700, 0, .08),
    pop: () => drop(),
    whoosh: () => glide(220, 110, .6),
    bump: () => { mallet(pick(step++), 0, .2, .7); },
    thud: () => { mallet(pick(step++) / 2, 0, .18, .5); },
    beep: () => mallet(pick(9), 0, .1, .4),
    step: () => wood(620, 0, .08),
    crack: () => { mallet(pick(8), 0, .1, .5); mallet(pick(9), .07, .08, .5); },
    steam: () => glide(900, 300, 1.2, .04),
    pour: () => drop(0, .08),
    scrub: () => wood(1200, 0, .04),
    clang: () => mallet(392, 0, .18, 1.2),
  };
  G.sfx = name => {
    if (!G.S.sound) return;
    try { (MAP[name] || MAP.tap)(); } catch (e) { /* 沒有 WebAudio 就算了 */ }
  };
  // 引擎：很低很小的正弦嗡嗡，level 0～1
  G.engine = level => {
    try {
      if (!eng) {
        if (!level) return;
        const a = ac(), o = a.createOscillator(), o2 = a.createOscillator(), g = a.createGain(), f = a.createBiquadFilter();
        o.frequency.value = 55; o2.frequency.value = 55.7; f.type = 'lowpass'; f.frequency.value = 160;
        g.gain.value = 0; o.connect(g); o2.connect(g); g.connect(f).connect(a.destination); o.start(); o2.start();
        eng = { g };
      }
      eng.g.gain.setTargetAtTime(G.S.sound ? Math.min(1, level) * .05 : 0, AC.currentTime, .15);
    } catch (e) { /* ignore */ }
  };
})();
