/* 首頁共用：遊戲清單、注音排版、WebAudio 合成音效、3D 模型、金色小點。各風格只寫自己的場景與互動。 */
window.HUB = (() => {
'use strict';
const $ = s => document.querySelector(s);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;
const C = { bg:0xFBF7F1, paper:0xFFFDF8, ink:0x2A2020, red:0xDB2E27, maroon:0x6C2024, gold:0xBD9558, goldsoft:0xF3E8D6, green:0x3F6B2E, leaf:0x7FA866, sea:0xA9D8E6, line:0xEADFD3 };

// ---------- 遊戲清單：新遊戲做好就加一筆 ----------
const GAMES = [
  { dir:'seed-game',  name:'種子小偵探',  zy:['ㄓㄨㄥˇ','ㄗˇ','ㄒㄧㄠˇ','ㄓㄣ','ㄊㄢˋ'], sub:'種子從哪裡來' },
  { dir:'ai-game',    name:'AI 從哪裡來', zy:[null,null,null,'ㄘㄨㄥˊ','ㄋㄚˇ','ㄌㄧˇ','ㄌㄞˊ'], sub:'電腦怎麼學會' },
  { dir:'bowl-game',  name:'頌缽工坊',    zy:['ㄙㄨㄥˋ','ㄅㄛ','ㄍㄨㄥ','ㄈㄤ'], sub:'會唱歌的銅缽' },
  { dir:'space-game', name:'太陽系大探險', zy:['ㄊㄞˋ','ㄧㄤˊ','ㄒㄧˋ','ㄉㄚˋ','ㄊㄢˋ','ㄒㄧㄢˇ'], sub:'八顆行星轉著看' },
];
const ROOT = location.pathname.includes('/首頁草稿/') || location.pathname.includes('/%E9%A6%96%E9%A0%81%E8%8D%89%E7%A8%BF/') ? '../' : '';
const href = g => ROOT + g.dir + '/';

// ---------- 注音排版（聲調在右、輕聲在上、原調） ----------
function Z(text, zys) {
  return Array.from(text).map((ch, i) => {
    const z = zys[i];
    if (!z) return ch === ' ' ? ' ' : `<span class="zh">${ch}</span>`;
    let tone = '', light = false, body = z;
    if (body.startsWith('˙')) { light = true; body = body.slice(1); }
    if (/[ˊˇˋ]$/.test(body)) { tone = body.slice(-1); body = body.slice(0, -1); }
    const letters = Array.from(body).map(c => `<i>${c}</i>`).join('');
    return `<span class="zc"><span class="zh">${ch}</span><span class="zy${tone ? ' has-t' : ''}"><span class="zs">${letters}</span>${tone ? `<span class="tn">${tone}</span>` : ''}${light ? `<span class="tl">˙</span>` : ''}</span></span>`;
  }).join('');
}

// ---------- 聲音：全部 WebAudio 現場合成，沒有系統朗讀 ----------
let AC = null, master = null, soundOn = localStorage.getItem('hub-sound') !== '0';
function ac() {
  if (!AC) { AC = new (window.AudioContext || window.webkitAudioContext)(); master = AC.createGain(); master.gain.value = soundOn ? 1 : 0; master.connect(AC.destination); }
  if (AC.state === 'suspended') AC.resume();
  return AC;
}
function tone(f, t0, len, type = 'sine', vol = .2, f1 = f) {
  const o = AC.createOscillator(), g = AC.createGain(), t = AC.currentTime + t0;
  o.type = type; o.frequency.setValueAtTime(f, t); if (f1 !== f) o.frequency.exponentialRampToValueAtTime(f1, t + len);
  g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + .012); g.gain.exponentialRampToValueAtTime(.0001, t + len);
  o.connect(g).connect(master); o.start(t); o.stop(t + len + .05);
}
let noiseBuf = null;
function noise(t0, len, f0, f1, vol = .2, q = 1.2) {
  if (!noiseBuf) { noiseBuf = AC.createBuffer(1, AC.sampleRate * 2, AC.sampleRate); const d = noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; }
  const s = AC.createBufferSource(), bp = AC.createBiquadFilter(), g = AC.createGain(), t = AC.currentTime + t0;
  s.buffer = noiseBuf; s.loop = true; bp.type = 'bandpass'; bp.Q.value = q;
  bp.frequency.setValueAtTime(f0, t); bp.frequency.exponentialRampToValueAtTime(f1, t + len);
  g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + len * .25); g.gain.exponentialRampToValueAtTime(.0001, t + len);
  s.connect(bp).connect(g).connect(master); s.start(t); s.stop(t + len + .05);
}
const safe = fn => (...a) => { try { ac(); fn(...a); } catch (e) { /* 沒有 WebAudio 就算了 */ } };
const PENTA = [262, 294, 330, 392, 440, 523, 587, 659];
const BOWL = [[1, .6], [2.76, .3], [5.4, .12], [8.9, .05]];
const SFX = {
  seed:  safe(k => { const f = PENTA[(k + 2) % PENTA.length]; tone(f, 0, .9, 'triangle', .22); tone(f * 2, 0, .4, 'sine', .06); noise(0, .35, 1800, 900, .05, 2); }),
  robot: safe(k => { const f = 520 + 40 * (k % 5); tone(f, 0, .12, 'square', .07); tone(f * 1.5, .14, .16, 'square', .07); tone(f * 2, .3, .25, 'triangle', .06); }),
  bowl:  safe(k => { const f0 = 196 * (k % 2 ? 1 : 1.5); BOWL.forEach(([r, g], i) => { tone(f0 * r, 0, 4 / (1 + i * 1.2), 'sine', .2 * g); tone(f0 * r + 1.3, 0, 4 / (1 + i * 1.2), 'sine', .1 * g); }); }),
  space: safe(k => { noise(0, 1.1, 300, 1600, .12, 1); tone(880 + 80 * (k % 4), .1, .7, 'sine', .08, 330); tone(110, 0, 1.2, 'sine', .12); }),
  whoosh: safe(v => noise(0, .45, 400, 1400 + v * 1200, clamp(v, .05, .6) * .25, .8)),
  tick:  safe(() => { tone(1200, 0, .06, 'sine', .08); tone(600, 0, .09, 'triangle', .05); }),
  go:    safe(() => { [0, .09, .18].forEach((t, i) => tone(PENTA[i * 2 + 1], t, .35, 'triangle', .14)); }),
  creak: safe(() => { tone(180, 0, .5, 'sawtooth', .04, 240); noise(0, .5, 300, 700, .06, 3); }),
  pop:   safe(k => { tone(PENTA[k % 8] * 2, 0, .15, 'sine', .12, PENTA[k % 8] * 1.2); }),
};
const KIND = ['seed', 'robot', 'bowl', 'space'];
function wireSound(btn) {
  const word = btn.classList.contains('icon') ? ['', ''] : ['聲音', '關了'];
  const paint = () => { btn.innerHTML = soundOn
    ? `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9v6h4l5 4V5L8 9H4z"/><path d="M16 9a4 4 0 010 6M18.5 6.5a8 8 0 010 11"/></svg>${word[0]}`
    : `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9v6h4l5 4V5L8 9H4z"/><path d="M17 9l5 6M22 9l-5 6"/></svg>${word[1]}`; };
  btn.addEventListener('click', ev => { ev.stopPropagation(); soundOn = !soundOn; localStorage.setItem('hub-sound', soundOn ? '1' : '0'); try { ac(); master.gain.setTargetAtTime(soundOn ? 1 : 0, AC.currentTime, .05); } catch (e) {} paint(); if (soundOn) SFX.tick(); });
  paint();
}

// ---------- 3D：材質、圖釘底座、四個模型 ----------
const mat = (color, o = {}) => new THREE.MeshStandardMaterial(Object.assign({ color, roughness: .78, metalness: .05 }, o));
const M = { gold: mat(C.gold, { roughness: .45, metalness: .35 }), red: mat(C.red), maroon: mat(C.maroon), ink: mat(C.ink), green: mat(C.green), leaf: mat(C.leaf), paper: mat(C.paper), goldsoft: mat(C.goldsoft), sea: mat(C.sea, { roughness: .5 }), white: mat(0xFFFFFF), line: mat(C.line) };

function pedestal(r = 1.25) {
  const g = new THREE.Group();
  const disc = new THREE.Mesh(new THREE.CylinderGeometry(r, r, .12, 48), M.goldsoft); disc.position.y = -.06; g.add(disc);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(r + .07, .045, 12, 64), M.red); ring.rotation.x = Math.PI / 2; ring.position.y = .02; g.add(ring);
  return g;
}
function buildSeed() {
  const g = new THREE.Group();
  const seed = new THREE.Mesh(new THREE.SphereGeometry(.42, 24, 18), M.maroon); seed.scale.set(1, .8, .75); seed.position.y = .32; g.add(seed);
  const stem = new THREE.Mesh(new THREE.CylinderGeometry(.06, .09, 1.3, 10), M.green); stem.position.y = 1.1; stem.rotation.z = .12; g.add(stem);
  const leafGeo = new THREE.SphereGeometry(.5, 20, 12); leafGeo.scale(1, .22, .55);
  const l1 = new THREE.Mesh(leafGeo, M.leaf); l1.position.set(-.5, 1.65, 0); l1.rotation.z = .5; g.add(l1);
  const l2 = new THREE.Mesh(leafGeo, M.leaf); l2.position.set(.5, 1.75, 0); l2.rotation.z = -.5; g.add(l2);
  const bud = new THREE.Mesh(new THREE.SphereGeometry(.12, 12, 10), M.green); bud.position.set(.08, 1.78, 0); g.add(bud);
  g.userData.anim = (t, e) => { stem.rotation.z = .12 + Math.sin(t * 1.6) * .06 * (1 + e * 4); l1.rotation.z = .5 + Math.sin(t * 2.1) * .08; l2.rotation.z = -.5 - Math.sin(t * 1.9) * .08; };
  return g;
}
function buildRobot() {
  const g = new THREE.Group();
  const head = new THREE.Mesh(new THREE.BoxGeometry(1.4, 1.2, 1.1), M.paper); head.position.y = .95; g.add(head);
  const face = new THREE.Mesh(new THREE.BoxGeometry(1.0, .7, .06), M.ink); face.position.set(0, 1.0, .57); g.add(face);
  const eyes = [-.25, .25].map(x => { const e = new THREE.Mesh(new THREE.SphereGeometry(.09, 12, 10), new THREE.MeshStandardMaterial({ color: C.red, emissive: C.red, emissiveIntensity: .6 })); e.position.set(x, 1.05, .62); g.add(e); return e; });
  const mouth = new THREE.Mesh(new THREE.BoxGeometry(.4, .05, .04), M.goldsoft); mouth.position.set(0, .8, .62); g.add(mouth);
  const ant = new THREE.Mesh(new THREE.CylinderGeometry(.03, .03, .5, 8), M.gold); ant.position.y = 1.8; g.add(ant);
  const tip = new THREE.Mesh(new THREE.SphereGeometry(.1, 12, 10), M.red); tip.position.y = 2.08; g.add(tip);
  const body = new THREE.Mesh(new THREE.BoxGeometry(.9, .4, .7), M.goldsoft); body.position.y = .2; g.add(body);
  g.userData.anim = (t, e) => { const blink = (Math.sin(t * 3) > .96 || e > .5) ? .15 : 1; eyes.forEach(ey => ey.scale.y = blink); tip.position.y = 2.08 + Math.sin(t * 4) * .03; head.rotation.y = Math.sin(t * .7) * .12; };
  return g;
}
function buildBowl() {
  const g = new THREE.Group();
  const pts = []; for (let i = 0; i <= 14; i++) { const a = i / 14; pts.push(new THREE.Vector2(.25 + Math.sin(a * Math.PI * .5) * .85, a * .95)); }
  const bowl = new THREE.Mesh(new THREE.LatheGeometry(pts, 48), new THREE.MeshStandardMaterial({ color: C.gold, roughness: .35, metalness: .55, side: THREE.DoubleSide })); g.add(bowl);
  const base = new THREE.Mesh(new THREE.CylinderGeometry(.3, .32, .06, 24), M.maroon); base.position.y = .03; g.add(base);
  const stick = new THREE.Mesh(new THREE.CylinderGeometry(.05, .05, 1.2, 10), M.maroon); stick.position.set(1.0, .95, .2); stick.rotation.z = -.9; g.add(stick);
  const felt = new THREE.Mesh(new THREE.SphereGeometry(.13, 12, 10), M.red); felt.position.set(.55, 1.32, .2); g.add(felt);
  g.userData.anim = (t, e) => { const s = 1 + Math.sin(t * 40) * .035 * e; bowl.scale.set(s, 1, 2 - s); stick.rotation.z = -.9 + Math.sin(t * 1.3) * .08 + e * .5; felt.position.x = .55 + e * .3; felt.position.y = 1.32 + e * .1; };
  return g;
}
function buildSaturn() {
  const g = new THREE.Group();
  const p = new THREE.Mesh(new THREE.SphereGeometry(.72, 32, 24), M.gold); p.position.y = 1.1; g.add(p);
  const band = new THREE.Mesh(new THREE.TorusGeometry(.72, .05, 8, 48), M.goldsoft); band.position.y = 1.1; band.rotation.x = Math.PI / 2; band.scale.set(1, 1, .3); g.add(band);
  const ring = new THREE.Mesh(new THREE.RingGeometry(.95, 1.45, 64), new THREE.MeshStandardMaterial({ color: C.goldsoft, roughness: .6, side: THREE.DoubleSide })); ring.position.y = 1.1; ring.rotation.x = Math.PI / 2 + .45; g.add(ring);
  const ring2 = new THREE.Mesh(new THREE.RingGeometry(1.0, 1.05, 64), new THREE.MeshStandardMaterial({ color: C.red, side: THREE.DoubleSide })); ring2.position.copy(ring.position); ring2.rotation.copy(ring.rotation); ring2.position.y += .001; g.add(ring2);
  const moon = new THREE.Mesh(new THREE.SphereGeometry(.14, 14, 12), M.sea); g.add(moon);
  g.userData.anim = (t, e) => { p.rotation.y = t * .4; ring.rotation.z = t * .15; ring2.rotation.z = -t * .15; const a = t * (1.2 + e * 6); moon.position.set(Math.cos(a) * 1.7, 1.1 + Math.sin(a) * .5, Math.sin(a) * 1.7); };
  return g;
}
const BUILD = [buildSeed, buildRobot, buildBowl, buildSaturn];

// 標準場景：米白底、淡霧、暖光
function scene3d(canvas) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(C.bg);
  scene.fog = new THREE.Fog(C.bg, 10, 22);
  const camera = new THREE.PerspectiveCamera(38, 1, .1, 80);
  scene.add(new THREE.HemisphereLight(0xFFFFFF, 0xE9DCC8, 2.0));
  const sun = new THREE.DirectionalLight(0xFFF4E4, 2.2); sun.position.set(4, 7, 6); scene.add(sun);
  const fill = new THREE.DirectionalLight(0xA9D8E6, .7); fill.position.set(-6, 2, -3); scene.add(fill);
  return { renderer, scene, camera };
}

// 金色小點：平常慢慢飄，手指滑過會被推開
function particles(scene, camera, n = 220, box = { x: 10, y: [-1.5, 6.5], z: [-9, 5] }) {
  const pos = new Float32Array(n * 3), vel = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) { pos[i * 3] = (Math.random() - .5) * box.x * 2; pos[i * 3 + 1] = lerp(box.y[0], box.y[1], Math.random()); pos[i * 3 + 2] = lerp(box.z[0], box.z[1], Math.random()); }
  const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  scene.add(new THREE.Points(geo, new THREE.PointsMaterial({ color: C.gold, size: .09, transparent: true, opacity: .75 })));
  const ray = new THREE.Raycaster(), v2 = new THREE.Vector2();
  return {
    push(x, y, dx, dy, depth = 10) {
      v2.set(x / innerWidth * 2 - 1, -(y / innerHeight) * 2 + 1); ray.setFromCamera(v2, camera);
      const p = ray.ray.origin.clone().add(ray.ray.direction.clone().multiplyScalar(depth));
      const f = Math.min(1.2, Math.hypot(dx, dy) * .02);
      for (let i = 0; i < n; i++) {
        const ox = pos[i * 3] - p.x, oy = pos[i * 3 + 1] - p.y, oz = pos[i * 3 + 2] - p.z;
        const d2 = ox * ox + oy * oy + oz * oz; if (d2 > 9) continue;
        const k = (1 - d2 / 9) * f;
        vel[i * 3] += dx * .004 * k + ox * .02 * k; vel[i * 3 + 1] += -dy * .004 * k + oy * .02 * k;
      }
    },
    step(t) {
      for (let i = 0; i < n; i++) {
        vel[i * 3 + 1] += Math.sin(t * .6 + i) * .0004; vel[i * 3] += Math.cos(t * .4 + i * .3) * .0003;
        pos[i * 3] += vel[i * 3]; pos[i * 3 + 1] += vel[i * 3 + 1]; pos[i * 3 + 2] += vel[i * 3 + 2];
        vel[i * 3] *= .96; vel[i * 3 + 1] *= .96; vel[i * 3 + 2] *= .96;
        if (pos[i * 3] > box.x) pos[i * 3] = -box.x; if (pos[i * 3] < -box.x) pos[i * 3] = box.x;
        if (pos[i * 3 + 1] > box.y[1]) pos[i * 3 + 1] = box.y[0]; if (pos[i * 3 + 1] < box.y[0]) pos[i * 3 + 1] = box.y[1];
      }
      geo.attributes.position.needsUpdate = true;
    }
  };
}

// 把 3D 座標投到螢幕（給 HTML 標籤跟著模型走）
const _v = new THREE.Vector3();
function toScreen(obj, camera, offY = 0) {
  obj.getWorldPosition(_v); _v.y += offY; _v.project(camera);
  return { x: (_v.x + 1) / 2 * innerWidth, y: (1 - _v.y) / 2 * innerHeight, z: _v.z };
}

// 數字鍵 1–4 直接進去（用 ev.code，注音輸入法開著也能用）
function numberKeys(enter) {
  addEventListener('keydown', ev => { const m = /^(?:Digit|Numpad)([1-9])$/.exec(ev.code); if (m && GAMES[+m[1] - 1]) { ac(); enter(+m[1] - 1); } });
}
function goTo(i, delay = 350) { SFX.go(); setTimeout(() => { location.href = href(GAMES[i]); }, delay); }

return { $, clamp, lerp, C, M, GAMES, href, Z, ac, SFX, KIND, wireSound, pedestal, BUILD, scene3d, particles, toScreen, numberKeys, goTo,
  title: () => Z('小朋友的遊戲', ['ㄒㄧㄠˇ','ㄆㄥˊ','ㄧㄡˇ','˙ㄉㄜ','ㄧㄡˊ','ㄒㄧˋ']) };
})();
