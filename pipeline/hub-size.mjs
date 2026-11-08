#!/usr/bin/env node
// 首頁擴大驗收（2026-11-08）：入口數 8（真的清單）與 16（?n=16 假清單），手機直式 375×812 與桌機 1280×800。
// 量：相鄰入口間距、車子出生點到最近入口、車子停在每個入口前面時畫面裡看得到幾個入口、console 錯誤；每種一張截圖。
// 用法：node pipeline/hub-size.mjs [--port 8770] [--out pipeline/shots/2026-11-08/hub]
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const argv = process.argv.slice(2);
const arg = (k, d) => { const i = argv.indexOf(k); return i >= 0 ? argv[i + 1] : d; };
const PORT = +arg('--port', 8770);
const OUT = path.resolve(ROOT, arg('--out', 'pipeline/shots/' + new Date().toISOString().slice(0, 10) + '/hub'));
fs.mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
const rows = [];
const CAMS = (arg('--camk', '') || '').split(',').filter(Boolean);
for (const [vw, vh, dev] of (arg('--phone-only') ? [[375, 812, 'phone']] : [[375, 812, 'phone'], [1280, 800, 'desktop']])) {
  for (const n of [0, 16]) for (const ck of (CAMS.length ? CAMS : [''])) {
    const ctx = await browser.newContext({ viewport: { width: vw, height: vh }, deviceScaleFactor: dev === 'phone' ? 2 : 1, isMobile: dev === 'phone', hasTouch: dev === 'phone' });
    const page = await ctx.newPage();
    const errs = [];
    page.on('pageerror', e => errs.push(e.message));
    page.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
    await page.goto('http://localhost:' + PORT + '/?t=0.45' + (n ? '&n=' + n : '') + (ck ? '&camk=' + ck : ''));
    await page.waitForFunction(() => window.__hub, null, { timeout: 15000 });
    await page.waitForTimeout(1500);
    const size = await page.evaluate(() => __hub.size());
    const label = dev + '-n' + size.n + (ck ? '-k' + ck : '');
    await page.screenshot({ path: path.join(OUT, label + '-start.png') });
    // 車子停在每個入口前面（往圓心退 5 單位，在路上），數畫面裡的入口
    const gates = await page.evaluate(() => __hub.gates());
    const seen = [];
    for (let i = 0; i < gates.length; i++) {
      const [x, z] = gates[i], r = Math.hypot(x, z), k = (r - 5) / r;
      const vis = await page.evaluate(([x, z]) => { __hub.place(x, z); return __hub.onScreen(); }, [x * k, z * k]);
      seen.push(vis.length);
      if (i === 0 || i === Math.floor(gates.length / 4)) { await page.waitForTimeout(400); await page.screenshot({ path: path.join(OUT, label + '-at' + (i + 1) + '.png') }); }
    }
    rows.push({ label, ...size, seenMin: Math.min(...seen), seenMax: Math.max(...seen), seenAvg: +(seen.reduce((a, b) => a + b, 0) / seen.length).toFixed(1), seen, errors: errs });
    await ctx.close();
  }
}
await browser.close();
fs.writeFileSync(path.join(OUT, 'results.json'), JSON.stringify(rows, null, 2));
for (const r of rows) console.log(r.label, 'R', r.GATE_R, 'WORLD', r.WORLD, 'gap', r.gap, 'spawn→gate', r.spawnToGate, 'cam', r.camH, r.camBack, '看得到入口 min/avg/max', r.seenMin, r.seenAvg, r.seenMax, JSON.stringify(r.seen), 'errors', r.errors.length, r.errors.slice(0, 2).join(' / '));
