// 颱風的 SVG 小工具（從 ~/Projects/臺南遊戲/颱風教室-薔琵/index.html 搬過來）：畫圖元素、黏土雲颱風、地圖（示意，不是真實比例）、
// 圖上的標籤（注音從 content.js 的 TX 拿）、動畫迴圈。第 5 批改成 3D 以前先用這個 2D 畫面。
window.SV = (() => {
  'use strict';
  const NS = 'http://www.w3.org/2000/svg';
  const HAN = /\p{Script=Han}/u;
  let svg = null, loops = [], timers = [], LABELS = [], last = 0;
  function S(tag, a, parent) { const e = document.createElementNS(NS, tag); for (const k in a) e.setAttribute(k, a[k]); if (parent !== null) (parent || svg).appendChild(e); return e; }
  function tick(t) { const dt = Math.min(.05, (t - last) / 1000 || 0); last = t; for (const f of loops.slice()) f(dt); requestAnimationFrame(tick); }
  requestAnimationFrame(tick);
  // 預覽分頁在背景時 requestAnimationFrame 會停：用計時器補
  setInterval(() => { const now = performance.now(); if (now - last > 200) tick(now); }, 120);
  const loop = f => { loops.push(f); return f; };
  const unloop = f => { const i = loops.indexOf(f); if (i >= 0) loops.splice(i, 1); };
  const later = (ms, f) => { timers.push(setTimeout(f, G.FAST ? Math.min(ms, 40) : ms)); };
  const ease = k => k < .5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
  function tween(dur, fn, done) { let t = 0; if (G.FAST) dur = Math.min(dur, .05); const f = loop(dt => { t += dt; const k = Math.min(1, t / dur); fn(ease(k)); if (k >= 1) { unloop(f); if (done) done(); } }); }
  function pt(e) { const p = svg.createSVGPoint(); p.x = e.clientX; p.y = e.clientY; return p.matrixTransform(svg.getScreenCTM().inverse()); }
  function reset(el) {
    loops = []; timers.forEach(clearTimeout); timers = []; LABELS = [];
    svg = el; svg.innerHTML = ''; defs();
  }
  function defs() {
    const d = S('defs', {});
    const g = S('radialGradient', { id: 'glow' }, d);
    S('stop', { offset: '0', style: 'stop-color:var(--cloudc);stop-opacity:.7' }, g);
    S('stop', { offset: '1', style: 'stop-color:var(--cloudc);stop-opacity:0' }, g);
    const f = S('filter', { id: 'soft', x: '-20%', y: '-20%', width: '140%', height: '140%' }, d);
    S('feGaussianBlur', { stdDeviation: '1.6' }, f);
    const w = S('linearGradient', { id: 'warmg', x1: 0, y1: 0, x2: 0, y2: 1 }, d);
    S('stop', { offset: '0', style: 'stop-color:var(--warmsea);stop-opacity:.95' }, w);
    S('stop', { offset: '1', style: 'stop-color:var(--warmsea);stop-opacity:0' }, w);
    const wr = S('radialGradient', { id: 'warmr', cx: .6, cy: .6, r: .7 }, d);
    S('stop', { offset: '0', style: 'stop-color:var(--warmsea);stop-opacity:.85' }, wr);
    S('stop', { offset: '1', style: 'stop-color:var(--warmsea);stop-opacity:.15' }, wr);
  }
  // 圖上的標籤：TX 的 key（有注音），或直接一段字（沒有注音）
  function cells(key) {
    const e = window.TX[key];
    if (!e) return Array.from(String(key)).map(c => ({ c, z: '' }));
    return e.z.map(it => Array.isArray(it) ? { c: it[0], z: it[1] } : { c: typeof it === 'string' ? it : it.k, z: '' });
  }
  function split(z) { let lt = false, tn = ''; if (z[0] === '˙') { lt = true; z = z.slice(1); } const m = z.match(/[ˊˇˋ]$/); if (m) { tn = m[0]; z = z.slice(0, -1); } return { sy: z, tn, lt }; }
  function lab(key, x, y, size, o = {}) { const g = S('g', { class: 'lab' }, o.parent); const L = { g, key, x, y, size: size || 16, o }; LABELS.push(L); drawLab(L); return L; }
  function drawLab(L) {
    const { g, key, x, y, size, o } = L; g.innerHTML = '';
    const ps = cells(key);
    const wH = size * 1.4, wO = size * .6;
    let W = 0; for (const p of ps) W += HAN.test(p.c) ? wH : wO;
    W -= size * .1;
    const an = o.anchor || 'middle'; const x0 = an === 'middle' ? x - W / 2 : an === 'end' ? x - W : x;
    if (o.bg !== false) S('rect', { x: x0 - 7, y: y - size * 1.0, width: W + 14, height: size * 1.36, rx: size * .68, class: 's-labbg' }, g);
    let cx = x0;
    for (const p of ps) {
      if (HAN.test(p.c)) {
        S('text', { x: cx + size * .5, y, 'font-size': size, 'text-anchor': 'middle', class: 't' }, g).textContent = p.c;
        if (p.z) {
          const { sy, tn, lt } = split(p.z); const arr = (lt ? ['˙'] : []).concat([...sy]);
          const fs = size * .3, lh = size * .3, colx = cx + size * 1.1, mid = y - size * .36;
          let yy = mid - arr.length * lh / 2 + lh * .8;
          for (const s of arr) { S('text', { x: colx, y: yy, 'font-size': fs, 'text-anchor': 'middle', class: 'z' }, g).textContent = s; yy += lh; }
          if (tn) S('text', { x: colx + fs * .8, y: mid + fs * .2, 'font-size': fs, 'text-anchor': 'middle', class: 'z' }, g).textContent = tn;
        }
        cx += wH;
      } else { S('text', { x: cx + wO / 2, y, 'font-size': size, 'text-anchor': 'middle', class: 't' }, g).textContent = p.c; cx += wO; }
    }
  }
  /* 颱風：螺旋雲臂往外是順時針，所以整個看起來是逆時針轉（北半球） */
function armPath(R,ph0){
  const N=36,A=[],B=[];
  for(let i=0;i<=N;i++){const t=i/N,r=R*(0.2+0.82*t),ph=ph0+2.5*t,w=R*(0.26*(1-t)+0.025);
    const c=Math.cos(ph),s=Math.sin(ph);A.push([c*(r+w/2),s*(r+w/2)]);B.push([c*(r-w/2),s*(r-w/2)])}
  const f=p=>p[0].toFixed(1)+','+p[1].toFixed(1);
  return 'M'+A.map(f).join('L')+'L'+B.reverse().map(f).join('L')+'Z';
}
function makeTy(parent,R,o={}){
  const g=S('g',{},parent),rot=S('g',{},g);
  S('circle',{r:R*1.08,style:'fill:url(#glow)'},rot);
  const arms=o.arms||4;
  for(let a=0;a<arms;a++)S('path',{d:armPath(R,a*2*Math.PI/arms),class:'s-cloud',opacity:.93,filter:o.soft===false?'':'url(#soft)'},rot);
  S('circle',{r:R*0.3,class:'s-cloud'},rot);
  S('circle',{r:R*0.1,class:'s-eye'},rot);
  const ty={g,rot,ang:0,x:0,y:0,s:1,spin:o.spin==null?80:o.spin,
    set(x,y,s){this.x=x;this.y=y;if(s!=null)this.s=s;g.setAttribute('transform',`translate(${x.toFixed(1)},${y.toFixed(1)}) scale(${this.s.toFixed(3)})`)},
    step(dt){this.ang-=this.spin*dt*MOT;rot.setAttribute('transform',`rotate(${this.ang.toFixed(1)})`)}};
  return ty;
}

  function makeTy(parent, R, o = {}) {
    const g = S('g', {}, parent), rot = S('g', {}, g);
    S('circle', { r: R * 1.08, style: 'fill:url(#glow)' }, rot);
    const arms = o.arms || 4;
    for (let a = 0; a < arms; a++) S('path', { d: armPath(R, a * 2 * Math.PI / arms), class: 's-cloud', opacity: .93, filter: o.soft === false ? '' : 'url(#soft)' }, rot);
    S('circle', { r: R * .3, class: 's-cloud' }, rot);
    S('circle', { r: R * .1, class: 's-eye' }, rot);
    return {
      g, rot, ang: 0, x: 0, y: 0, s: 1, spin: o.spin == null ? 80 : o.spin,
      set(x, y, s) { this.x = x; this.y = y; if (s != null) this.s = s; g.setAttribute('transform', `translate(${x.toFixed(1)},${y.toFixed(1)}) scale(${this.s.toFixed(3)})`); },
      step(dt) { this.ang -= this.spin * dt; rot.setAttribute('transform', `rotate(${this.ang.toFixed(1)})`); },
    };
  }
  function waves(n, y0, y1, parent) { for (let i = 0; i < n; i++) { const x = 20 + Math.random() * 340, y = y0 + Math.random() * (y1 - y0); S('path', { d: `M${x},${y} q8,-6 16,0 t16,0`, class: 's-wave' }, parent); } }
function smooth(pts){
  let d=`M${pts[0][0].toFixed(1)},${pts[0][1].toFixed(1)}`;
  for(let i=0;i<pts.length-1;i++){const p0=pts[i-1]||pts[i],p1=pts[i],p2=pts[i+1],p3=pts[i+2]||p2;
    d+=`C${(p1[0]+(p2[0]-p0[0])/6).toFixed(1)},${(p1[1]+(p2[1]-p0[1])/6).toFixed(1)} ${(p2[0]-(p3[0]-p1[0])/6).toFixed(1)},${(p2[1]-(p3[1]-p1[1])/6).toFixed(1)} ${p2[0].toFixed(1)},${p2[1].toFixed(1)}`}
  return d;
}


  /* ---------- 地圖（經緯度 → 圖上的點；示意，不是真實比例） ---------- */
const LAND={
  cn:[[113,40],[113,22.2],[113.5,22.2],[114.3,22.4],[115.5,22.7],[116.5,23],[117.5,23.7],[118.2,24.5],[119,25.3],[119.6,26],[119.9,26.8],[120.5,27.5],[121,28.2],[121.6,29],[122,29.8],[121.5,30.6],[121.9,31.2],[121.3,32],[120.8,32.6],[120.3,34],[119.3,34.8],[120,35.9],[121,36.6],[122.5,37.1],[121.5,37.6],[120.5,37.6],[119,37.2],[118.5,38.1],[117.7,38.8],[118.3,39.2],[119.3,39.4],[120,40]],
  kr:[[124.6,40],[124.4,39.6],[125.2,39],[125,38.3],[126.1,37.7],[126.6,37],[126.2,36],[126.5,35],[126.4,34.4],[127.4,34.6],[128.5,34.9],[129.2,35.2],[129.5,36],[129.4,37],[128.6,38.2],[128.4,38.8],[127.6,39.7],[128.2,40]],
  kyu:[[130.9,33.95],[130.4,33.6],[129.8,33.4],[129.6,32.8],[130,32.4],[130.2,31.4],[130.7,31],[131.1,31.4],[131.4,31.9],[131.7,32.6],[131.9,33.2],[131.5,33.6]],
  shi:[[132.5,33.2],[133,32.75],[133.4,33.4],[134.2,33.3],[134.7,33.8],[134.3,34.2],[133.2,34.1],[132.6,33.9]],
  hon:[[130.9,34.1],[131.8,34.7],[132.6,35.4],[133.3,35.55],[134.4,35.65],[135.2,35.7],[135.9,35.8],[136.1,36.3],[136.8,37.2],[137.4,37.5],[137.3,36.8],[138.3,37.2],[139,37.9],[139.6,38.6],[139.9,39.6],[140,40.2],[141.7,40.2],[141.9,39],[141.5,38.3],[141,38],[141,37],[140.8,36.3],[140.8,35.7],[140.4,35.1],[139.8,35],[139.6,35.3],[139.1,35.2],[138.8,34.6],[138.2,34.6],[137.3,34.6],[136.9,34.3],[136.3,34.2],[135.9,33.5],[135.4,33.7],[135.1,34.2],[135.3,34.6],[134.5,34.7],[133.5,34.5],[132.4,34.3],[131.3,33.95]],
  luz:[[120.6,18.5],[121.2,18.6],[122.2,18.5],[122.3,17.2],[122,16.2],[121.6,15.7],[121.6,14.6],[122.2,14.2],[123,13.8],[124.1,13],[123.9,12.6],[123.2,13],[122.6,13.4],[121.8,13.9],[121,13.8],[120.6,14.3],[120.6,14.8],[119.9,15.4],[119.8,16.3],[120.4,16.6],[120.4,17.6]],
  min:[[120.3,13.5],[121.5,13.2],[121.2,12.2],[120.4,12.6]],
  sam:[[124.3,12.5],[125.6,12.2],[125.5,11],[124.9,10.3],[124.3,11.2]],
  pan:[[122,11.8],[123.1,11.5],[122.6,10.5],[121.9,10.7]],
  neg:[[122.6,10.9],[123.4,10.9],[123.2,9.2],[122.4,9.6]],
  mnd:[[123.5,8],[123.8,8.7],[125.3,9.6],[126.3,9.3],[126.6,8]],
  tw:[[121.55,25.3],[121.95,25.0],[121.85,24.6],[121.6,24.0],[121.5,23.4],[121.2,22.8],[120.9,22.3],[120.85,21.9],[120.7,22.0],[120.6,22.5],[120.25,22.6],[120.1,23.0],[120.15,23.6],[120.4,24.2],[120.75,24.7],[121.05,25.05]]
};
const ISLE=[[127.9,26.5,5,2],[125.3,24.8,2,1.5],[124.2,24.4,2.4,1.6],[123,24.45,1.4,1.2],[129.4,28.3,3,1.8],[130.6,30.4,2,1.6],[144.8,13.45,2.2,2.6]];
const P=(lon,lat)=>[(lon-113)*11.111,(39-lat)*12.26];
const PZ=(lon,lat)=>[(lon-118.6)*57.1,(26.75-lat)*62.4+8];

  function drawLand(proj, keys) { const g = S('g', {}); for (const k of keys) S('path', { d: 'M' + LAND[k].map(p => proj(...p).map(v => v.toFixed(1)).join(',')).join('L') + 'Z', class: 's-land' }, g); return g; }
  function bigMap() {
    S('rect', { x: 0, y: 0, width: 400, height: 370, class: 's-ocean' }); waves(16, 20, 360);
    drawLand(P, ['cn', 'kr', 'kyu', 'shi', 'hon', 'luz', 'min', 'sam', 'pan', 'neg', 'mnd', 'tw']);
    for (const [lo, la, a, b] of ISLE) { const [x, y] = P(lo, la); S('ellipse', { cx: x, cy: y, rx: a, ry: b, class: 's-land' }); }
    const twp = P(121, 23.6); S('circle', { cx: twp[0], cy: twp[1], r: 24, fill: 'none', 'stroke-width': 2.5, style: 'stroke:var(--sun)' });
    lab('lab.tw', P(116.4, 23.4)[0], P(116.4, 23.4)[1], 15);
    lab('lab.jp', P(136.5, 36.6)[0], P(136.5, 36.6)[1], 15);
    lab('lab.ph', P(122.6, 16.4)[0], P(122.6, 16.4)[1], 14);
    const gm = P(144.8, 13.45); lab('lab.guam', gm[0] - 4, gm[1] + 24, 14);
  }
  function pathOn(pts, cls) { return S('path', { d: smooth(pts), class: cls || 's-path' }); }
  function drawAlong(path, dur, ty, dots, done) {
    const len = path.getTotalLength();
    if (dots) path.setAttribute('opacity', 0); else { path.setAttribute('stroke-dasharray', len); path.setAttribute('stroke-dashoffset', len); }
    const dg = S('g', {}); let lastD = 0;
    tween(dur, k => {
      const L = len * k, p = path.getPointAtLength(L);
      if (dots) { while (lastD <= L) { const q = path.getPointAtLength(lastD); S('circle', { cx: q.x, cy: q.y, r: 2.6, class: 's-dot' }, dg); lastD += 9; } }
      else path.setAttribute('stroke-dashoffset', len - L);
      if (ty) ty.set(p.x, p.y);
    }, done);
    return dg;
  }
  /* ---------- 小圖示 ---------- */
const ICON=[
 '<path d="M12 4a8 8 0 1 0 8 8M12 8a4 4 0 1 0 4 4" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/>',
 '<circle cx="12" cy="12" r="4.5" fill="none" stroke="currentColor" stroke-width="2.2"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M19 5l-2 2M5 19l2-2" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
 '<path d="M19 12a7 7 0 1 1-2.5-5.4" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/><path d="M17.5 2.5l-.8 4.4-4.4-.6" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>',
 '<circle cx="12" cy="12" r="8.5" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="12" cy="12" r="3" fill="currentColor"/>',
 '<path d="M5 19C5 10 11 5 20 4c-1 9-6 15-15 15zM5 19l8-8" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>',
 '<path d="M3 19c4-1 5-6 9-8s6-5 9-7" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-dasharray="3 3"/><circle cx="20" cy="4.5" r="2" fill="currentColor"/>',
 '<path d="M4 11l8-7 8 7M6 10v10h12V10" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round"/><path d="M10 20v-5h4v5" fill="none" stroke="currentColor" stroke-width="2"/>',
 '<path d="M2.5 13.5l19-6-2-2.5-6 1.5-6-4-2 .8 4 4.6-4 1.3-2.4-1.6-1.6.6 2 3.3z" fill="currentColor"/>',
 '<path d="M7 18h10a4 4 0 0 0 0-8 5.5 5.5 0 0 0-10.5 1.5A3.3 3.3 0 0 0 7 18z" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round"/>'
];
const ARW=a=>`<svg viewBox="0 0 24 24" aria-hidden="true" style="transform:rotate(${a}deg)"><path d="M12 20V5M5 11l7-7 7 7" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
const CARDPIC=[
 '<path d="M10 34L32 14l22 20" fill="none" stroke="var(--alert)" stroke-width="4" stroke-linejoin="round"/><rect x="16" y="32" width="32" height="22" rx="3" fill="var(--sun)"/><rect x="28" y="40" width="8" height="14" fill="var(--chip)"/>',
 '<path d="M4 44c6-8 12-8 18 0s12 8 18 0 12-8 18 0" fill="none" stroke="var(--ocean)" stroke-width="5" stroke-linecap="round"/><path d="M10 30c6-14 22-20 30-8-8-2-12 4-8 8" fill="var(--ocean2)" stroke="var(--ocean)" stroke-width="3"/>',
 '<rect x="8" y="24" width="24" height="12" rx="3" fill="var(--ink2)"/><path d="M32 22l14-8v32l-14-8z" fill="var(--sun)"/><rect x="40" y="30" width="14" height="26" rx="4" fill="var(--ocean2)" stroke="var(--ocean)" stroke-width="2"/><rect x="43" y="25" width="8" height="6" rx="2" fill="var(--ocean)"/>',
 '<path d="M18 36h28l-4 20H22z" fill="#C2693C"/><path d="M32 36V18M32 26c-6-8-12-6-12-6s2 8 12 8M32 22c6-8 12-6 12-6s-2 8-12 8" fill="#4E9A3C" stroke="#2F6B24" stroke-width="2"/>',
 '<path d="M4 50L24 16l12 18 6-8 18 24z" fill="var(--mount)"/><path d="M14 56c8-6 14 2 22-4s14-2 22-6" fill="none" stroke="var(--ocean)" stroke-width="5" stroke-linecap="round"/>',
 '<rect x="12" y="10" width="40" height="44" rx="3" fill="var(--ocean2)" stroke="var(--ink2)" stroke-width="4"/><path d="M32 10v44M12 32h40" stroke="var(--ink2)" stroke-width="3"/><path d="M38 16l6 8-4 4 6 6" fill="none" stroke="var(--chip)" stroke-width="2.5"/>'
];


  return { S, loop, unloop, later, tween, ease, pt, reset, lab, drawLab, makeTy, waves, smooth, LAND, ISLE, P, PZ, drawLand, bigMap, pathOn, drawAlong, ICON, ARW, CARDPIC, get svg() { return svg; } };
})();
