// 「放大鏡」裡的水分子小點點：一個圓形 canvas，最多幾十顆圓。
// 冰：排成整齊的格子，但格子比水「鬆」（結冰後體積大約多 9%）；水：擠在底下滑來滑去；水蒸氣：散開飛來飛去。
// 用法：const s = P.create(hostEl, { n: 30, solid: 1 }); s.set({ solid, energy, gas, ghost }); s.stop();
// 參數：solid 0..1（越大越多顆綁在格子上）、energy 0..1（抖得多快）、gas 0..1（變成水蒸氣的比例）、ghost 0..1（水蒸氣變透明＝看不見）
window.P = (() => {
  'use strict';
  const W = 240, CX = 120, CY = 120, RB = 112;          // 邏輯座標：240×240，圓形邊界半徑
  const live = new Set();
  let raf = 0;

  function loop() {
    raf = 0;
    for (const s of live) { if (!s.cv.isConnected) { live.delete(s); continue; } s.step(); s.step(); s.draw(); }
    if (live.size) raf = requestAnimationFrame(loop);
  }
  const kick = () => { if (!raf && live.size) raf = requestAnimationFrame(loop); };

  function create(host, opt = {}) {
    const n = Math.min(opt.n || 30, 40);
    const r = opt.r || (n > 24 ? 9 : 10.5);
    const cv = document.createElement('canvas');
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    cv.width = cv.height = Math.round(W * dpr);
    cv.className = 'wg-pcv';
    host.appendChild(cv);
    const ctx = cv.getContext('2d');
    const st = { solid: 1, energy: .15, gas: 0, ghost: 0, ...opt };

    // 冰的格子（六角排列），間距比水的接觸距離大 12%，看得出「比較鬆」
    const sp = 2 * r * 1.12;
    const cols = Math.max(3, Math.round(Math.sqrt(n / .6)));
    const rows = Math.ceil(n / cols);
    const rowH = sp * .866;
    const bottom = CY + RB * .72;
    const homes = [];
    for (let k = 0; k < n; k++) {
      const row = Math.floor(k / cols), col = k % cols;
      const inRow = row === rows - 1 ? n - row * cols : cols;
      const off = (cols - inRow) * sp / 2 + (row % 2 ? sp / 4 : -sp / 4);
      homes.push({ x: CX - (cols - 1) * sp / 2 + off + col * sp, y: bottom - row * rowH });
    }
    // 外圈先融化、裡面最後（門檻越大越早鬆開）
    const mx = homes.reduce((a, h) => a + h.x, 0) / n, my = homes.reduce((a, h) => a + h.y, 0) / n;
    let dmax = 0; homes.forEach(h => { h.d = Math.hypot((h.x - mx) * .9, (h.y - my) * 1.3); dmax = Math.max(dmax, h.d); });
    const ps = homes.map((h, k) => ({ x: h.x, y: h.y, vx: 0, vy: 0, hx: h.x, hy: h.y, th: .08 + .84 * (h.d / dmax), gas: 0, a: 1, bond: 1, k }));
    // 鄰居（畫冰的「手牽手」短線）
    const links = [];
    for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) if (Math.hypot(homes[i].x - homes[j].x, homes[i].y - homes[j].y) < sp * 1.08) links.push([i, j]);

    let gasT = 0;
    const s = {
      cv, st,
      set(o) { Object.assign(st, o); kick(); },
      stop() { live.delete(s); },
      step() {
        const dt = 1 / 120, E = st.energy;
        // 相變：bond 跟著 solid 走；gas 依目標比例一顆一顆換
        for (const p of ps) {
          const want = st.solid > p.th ? 1 : 0;
          p.bond += (want - p.bond) * .08;
          if (want && p.gas) p.gas = 0;
        }
        gasT += dt;
        if (gasT > .07) {
          gasT = 0;
          const nGas = ps.reduce((a, p) => a + p.gas, 0), target = Math.round(st.gas * n);
          if (nGas < target) {
            // 水面上的那幾顆先飛走
            let best = null;
            for (const p of ps) if (!p.gas && p.bond < .5 && (!best || p.y < best.y)) best = p;
            if (best) { best.gas = 1; best.vy = -120 - 80 * E; best.vx = (Math.random() - .5) * 120; }
          } else if (nGas > target) {
            const p = ps.find(q => q.gas);
            if (p) p.gas = 0;
          }
        }
        for (const p of ps) {
          if (p.gas) {
            const kick = 900 * (.4 + E);
            p.vx += (Math.random() - .5) * kick * dt; p.vy += (Math.random() - .5) * kick * dt - 30 * dt;
            p.vx *= .997; p.vy *= .997;
            const sp2 = Math.hypot(p.vx, p.vy), cap = 90 + 160 * E;
            if (sp2 > cap) { p.vx *= cap / sp2; p.vy *= cap / sp2; }
            if (sp2 < 50) { p.vx *= 1.05; p.vy *= 1.05; }
          } else {
            const b = p.bond;
            p.vy += 520 * (1 - b) * dt;                                   // 重力
            p.vx += (p.hx - p.x) * 90 * b * dt; p.vy += (p.hy - p.y) * 90 * b * dt;   // 拉回格子
            const j = (b ? 60 : 260) * (.15 + E);
            p.vx += (Math.random() - .5) * j * dt * 8; p.vy += (Math.random() - .5) * j * dt * 8;
            const damp = b > .5 ? .9 : .985;
            p.vx *= damp; p.vy *= damp;
          }
          p.x += p.vx * dt; p.y += p.vy * dt;
          p.a += ((p.gas ? 1 - st.ghost * .88 : 1) - p.a) * .06;
        }
        // 互相推開（不重疊）
        const d2 = (2 * r) * (2 * r);
        for (let i = 0; i < n; i++) {
          const a = ps[i];
          for (let k = i + 1; k < n; k++) {
            const b = ps[k], dx = b.x - a.x, dy = b.y - a.y, dd = dx * dx + dy * dy;
            if (dd >= d2 || dd < 1e-6) continue;
            const d = Math.sqrt(dd), push = (2 * r - d) / 2, ux = dx / d, uy = dy / d;
            const wa = a.bond > .5 ? .2 : 1, wb = b.bond > .5 ? .2 : 1;
            a.x -= ux * push * wa; a.y -= uy * push * wa; b.x += ux * push * wb; b.y += uy * push * wb;
            const rv = (b.vx - a.vx) * ux + (b.vy - a.vy) * uy;
            if (rv < 0) { const im = rv * .5; a.vx += ux * im; a.vy += uy * im; b.vx -= ux * im; b.vy -= uy * im; }
          }
        }
        // 圓形邊界
        for (const p of ps) {
          const dx = p.x - CX, dy = p.y - CY, d = Math.hypot(dx, dy), lim = RB - r;
          if (d > lim) {
            const ux = dx / d, uy = dy / d;
            p.x = CX + ux * lim; p.y = CY + uy * lim;
            const vn = p.vx * ux + p.vy * uy;
            if (vn > 0) { const e = p.gas ? 1.9 : 1.4; p.vx -= ux * vn * e; p.vy -= uy * vn * e; }
          }
        }
      },
      draw() {
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.clearRect(0, 0, W, W);
        ctx.fillStyle = st.bg || '#EEF5F7';
        ctx.beginPath(); ctx.arc(CX, CY, RB + 6, 0, Math.PI * 2); ctx.fill();
        // 冰的「手牽手」
        ctx.lineWidth = 3; ctx.lineCap = 'round';
        for (const [i, j] of links) {
          const a = ps[i], b = ps[j], w = Math.min(a.bond, b.bond);
          if (w < .2 || a.gas || b.gas) continue;
          const dl = Math.hypot(a.x - b.x, a.y - b.y);
          if (dl > sp * 1.3) continue;
          ctx.strokeStyle = 'rgba(122,170,200,' + (w * .55).toFixed(3) + ')';
          ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
        }
        for (const p of ps) {
          const ice = p.bond;
          let col;
          if (p.gas) col = [150, 196, 230];
          else col = [Math.round(60 + 110 * ice), Math.round(155 + 60 * ice), Math.round(224 + 14 * ice)];
          ctx.globalAlpha = p.a;
          ctx.fillStyle = 'rgb(' + col.join(',') + ')';
          ctx.beginPath(); ctx.arc(p.x, p.y, r, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = 'rgba(255,255,255,.55)';
          ctx.beginPath(); ctx.arc(p.x - r * .32, p.y - r * .34, r * .3, 0, Math.PI * 2); ctx.fill();
        }
        ctx.globalAlpha = 1;
      },
    };
    // 依起始狀態先擺好：冰在格子上；水先沉到底；水蒸氣先散開
    if (st.solid < .5) ps.forEach(p => { p.bond = 0; p.x = CX + (Math.random() - .5) * 150; p.y = CY + 30 + Math.random() * 60; });
    if (st.gas > .5) ps.forEach(p => { p.gas = 1; p.bond = 0; const a = Math.random() * 6.28, d = Math.random() * 80; p.x = CX + Math.cos(a) * d; p.y = CY + Math.sin(a) * d; p.vx = Math.cos(a * 3) * 80; p.vy = Math.sin(a * 3) * 80; });
    for (let i = 0; i < 160; i++) s.step();
    s.draw();
    live.add(s); kick();
    return s;
  }
  return { create };
})();
