#!/usr/bin/env node
// 夜間試玩腳本：開每個遊戲的每一關，手機與平板各截一張圖，收集 console 錯誤、載入失敗、橫向捲動。
// 用法：
//   node pipeline/playtest.mjs --dir lab/xx-game [--dir ai-game ...] [--levels 10] [--out pipeline/shots/2026-10-30/xx]
//   node pipeline/playtest.mjs --all --levels 3        （首頁＋四個正式遊戲＋lab 全部）
// 每個遊戲資料夾可放 playtest.json 覆寫要開的網址：
//   {"urls":[{"label":"world","q":"?world&fast=1"}], "poke": false}
// 結束碼：0 全部正常；1 有壞掉的畫面。結果在 <out>/results.json 與 <out>/summary.md。
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import net from 'node:net';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const argv = process.argv.slice(2);
const opt = { dirs: [], levels: 10, out: null, all: false, port: 0 };
for (let i = 0; i < argv.length; i++) {
  const a = argv[i];
  if (a === '--dir') opt.dirs.push(argv[++i]);
  else if (a === '--levels') opt.levels = +argv[++i];
  else if (a === '--out') opt.out = argv[++i];
  else if (a === '--all') opt.all = true;
  else if (a === '--port') opt.port = +argv[++i];
}
if (opt.all) {
  opt.dirs.push('.', 'seed-game', 'ai-game', 'bowl-game', 'space-game');
  const lab = path.join(ROOT, 'lab');
  if (fs.existsSync(lab)) for (const d of fs.readdirSync(lab).sort()) if (fs.existsSync(path.join(lab, d, 'index.html'))) opt.dirs.push('lab/' + d);
}
opt.dirs = opt.dirs.map(d => d.replace(/\/+$/, '') || '.');
if (!opt.dirs.length) { console.error('請給 --dir <遊戲資料夾> 或 --all'); process.exit(2); }
const today = (d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`)(new Date()); // 本地日期，不用 UTC
const OUT = path.resolve(ROOT, opt.out || path.join('pipeline', 'shots', today));
fs.mkdirSync(OUT, { recursive: true });

const freePort = () => new Promise(r => { const s = net.createServer(); s.listen(0, '127.0.0.1', () => { const p = s.address().port; s.close(() => r(p)); }); });
const waitPort = (port, ms = 10000) => new Promise((res, rej) => {
  const t0 = Date.now();
  (function tryIt() {
    const c = net.connect(port, '127.0.0.1');
    c.once('connect', () => { c.end(); res(); });
    c.once('error', () => { if (Date.now() - t0 > ms) rej(new Error('本機伺服器沒起來')); else setTimeout(tryIt, 150); });
  })();
});

const port = opt.port || await freePort();
const server = spawn('python3', ['-m', 'http.server', String(port), '--bind', '127.0.0.1', '--directory', ROOT], { stdio: 'ignore' });
try { await waitPort(port); } catch (e) { console.error(String(e.message)); server.kill(); process.exit(2); }

const VIEWS = [
  { name: 'mobile', w: 375, h: 812, mobile: true },
  { name: 'tablet', w: 768, h: 1024, mobile: false },
];
const IGNORE = /fonts\.googleapis|fonts\.gstatic|favicon\.ico/;

function planFor(dir) {
  const cfg = path.join(ROOT, dir, 'playtest.json');
  let poke = true, urls = null;
  if (fs.existsSync(cfg)) {
    try {
      const j = JSON.parse(fs.readFileSync(cfg, 'utf8'));
      if (j.poke === false) poke = false;
      if (Array.isArray(j.urls) && j.urls.length) urls = j.urls.map(u => typeof u === 'string' ? { label: u, q: u } : { label: u.label || u.q, q: u.q });
    } catch (e) { console.error(`${dir}/playtest.json 讀不懂：${e.message}`); }
  }
  if (!urls) {
    urls = [{ label: 'start', q: '?fast=1' }];
    for (let i = 1; i <= opt.levels; i++) urls.push({ label: 'ch' + i, q: `?ch=${i}&fast=1` });
  }
  urls = urls.map(u => ({ ...u, label: String(u.label).replace(/[^\w.-]+/g, '_') }));
  return { poke, urls };
}

const browser = await chromium.launch();
const results = [];
for (const dir of opt.dirs) {
  const base = `http://127.0.0.1:${port}/` + (dir === '.' ? '' : dir + '/');
  const tag = dir === '.' ? 'hub' : dir.replace(/\//g, '_');
  fs.mkdirSync(path.join(OUT, tag), { recursive: true });
  const { poke, urls } = planFor(dir);
  for (const v of VIEWS) {
    const ctx = await browser.newContext({ viewport: { width: v.w, height: v.h }, deviceScaleFactor: 1, isMobile: v.mobile, hasTouch: v.mobile, locale: 'zh-TW' });
    for (const u of urls) {
      const page = await ctx.newPage();
      const rec = { dir, view: v.name, label: u.label, url: base + u.q, ms: 0, elements: 0, text: 0, overflow: false, errors: [], failed: [], shot: null };
      page.on('console', m => { if (m.type() === 'error') rec.errors.push(m.text().slice(0, 300)); });
      page.on('pageerror', e => rec.errors.push(String(e.message || e).slice(0, 300)));
      page.on('requestfailed', r => { if (!IGNORE.test(r.url())) rec.failed.push(r.url().replace(base, '')); });
      const t0 = Date.now();
      try {
        await page.goto(rec.url, { waitUntil: 'load', timeout: 20000 });
        rec.ms = Date.now() - t0;
        await page.waitForTimeout(1500);
        if (poke) {
          // 戳一下：點畫面中央、按幾個常用鍵，看會不會壞（間隔 80ms，讓 waitAction 來得及重掛）
          await page.mouse.click(v.w / 2, v.h / 2).catch(() => {});
          for (const k of ['Digit1', 'KeyA', 'Space', 'Enter']) { await page.keyboard.press(k).catch(() => {}); await page.waitForTimeout(80); }
          await page.waitForTimeout(700);
        }
        const m = await page.evaluate(() => {
          const de = document.documentElement;
          const vis = [...document.querySelectorAll('body *')].filter(e => { const r = e.getBoundingClientRect(); return r.width > 2 && r.height > 2; }).length;
          return { overflow: de.scrollWidth > window.innerWidth + 1, elements: vis, text: (document.body.innerText || '').trim().length };
        });
        Object.assign(rec, m);
        rec.shot = path.join(tag, `${v.name}-${u.label}.png`);
        await page.screenshot({ path: path.join(OUT, rec.shot) });
      } catch (e) { rec.errors.push('載入失敗：' + String(e.message || e).slice(0, 200)); }
      await page.close();
      results.push(rec);
      process.stderr.write(`${dir} ${v.name} ${u.label}: ${rec.errors.length ? '錯誤 ' + rec.errors.length : 'ok'}${rec.overflow ? ' 橫向捲動' : ''}\n`);
    }
    await ctx.close();
  }
}
await browser.close();
server.kill();

const isBad = r => r.errors.length > 0 || r.overflow || r.elements < 5;
const bad = results.filter(isBad);
fs.writeFileSync(path.join(OUT, 'results.json'), JSON.stringify({ date: today, out: OUT, total: results.length, bad: bad.length, results }, null, 2));
let md = `# 試玩結果 ${today}\n\n截圖資料夾：${OUT}\n\n| 遊戲 | 畫面 | 關 | 載入ms | 可見元素 | 狀態 |\n|---|---|---|---|---|---|\n`;
for (const r of results) {
  const st = r.errors.length ? '錯誤：' + r.errors[0] : r.overflow ? '橫向捲動' : r.elements < 5 ? '幾乎空白' : r.failed.length ? '載入失敗：' + r.failed[0] : 'ok';
  md += `| ${r.dir} | ${r.view} | ${r.label} | ${r.ms} | ${r.elements} | ${st.replace(/\|/g, '/')} |\n`;
}
md += `\n有問題的畫面：${bad.length} / ${results.length}\n`;
if (bad.length) { md += '\n## 問題明細\n'; for (const r of bad) md += `- ${r.dir} ${r.view} ${r.label}（${r.url}）\n` + r.errors.map(e => `  - ${e}`).join('\n') + (r.overflow ? '\n  - 橫向捲動' : '') + (r.elements < 5 ? '\n  - 幾乎空白' : '') + '\n'; }
fs.writeFileSync(path.join(OUT, 'summary.md'), md);
console.log(md);
process.exit(bad.length ? 1 : 0);
