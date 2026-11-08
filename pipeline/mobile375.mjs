#!/usr/bin/env node
// 手機直式驗收（2026-11-08）：用 iPhone 375×812 開每個遊戲的封面、每關（標題卡＋主畫面）、結尾，
// 任何看得到的元素 getBoundingClientRect().right > 375（或 left < 0），或 document.documentElement.scrollWidth > 375 都算失敗。
// 檢查在頁面裡持續跑（每 120 毫秒＋畫面一變就查），所以標題卡一閃而過也抓得到。
// 用法：node pipeline/mobile375.mjs [--port 8770] [--only ai-game,bowl-game] [--out pipeline/shots/2026-11-08/m375]
// 需要先開著根目錄的靜態伺服器（.claude/launch.json 的 hub，port 8770）。
// 結果：<out>/results.json、<out>/summary.md；每個畫面一張截圖（封面、標題卡、主畫面、結尾）。
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const argv = process.argv.slice(2);
const arg = (k, d) => { const i = argv.indexOf(k); return i >= 0 ? argv[i + 1] : d; };
const PORT = +arg('--port', 8770);
const ONLY = (arg('--only', '') || '').split(',').filter(Boolean);
const OUT = path.resolve(ROOT, arg('--out', 'pipeline/shots/' + new Date().toISOString().slice(0, 10) + '/m375'));
fs.mkdirSync(OUT, { recursive: true });
const BASE = 'http://localhost:' + PORT + '/';

const range = (a, b) => Array.from({ length: b - a + 1 }, (_, i) => a + i);
const SPACE_TASKS = ['sun.c1', 'mercury.visit', 'venus.visit', 'earth.visit', 'earth.c2', 'earth.c3', 'earth.c9', 'moon.c4', 'mars.visit', 'mars.c10',
  'jupiter.visit', 'jupiter.c6', 'saturn.visit', 'saturn.c8', 'uranus.visit', 'neptune.visit'];
// 每個遊戲要開的網址：{ label, q, ls（先放進 localStorage 的存檔）, wait（毫秒）, title（要不要等標題卡截圖） }
const lvl = (n, q) => ({ label: 'L' + String(n).padStart(2, '0'), q, title: true });
const GAMES = {
  'seed-game': [{ label: 'cover', q: '' }, { label: 'cover-cont', q: '', ls: { 'seed-game-v1': { done: 3, sound: true } } },
    ...range(1, 8).map(n => lvl(n, '?ch=' + n)), { label: 'end', q: '?fin=1' }],
  'ai-game': [{ label: 'cover', q: '' }, { label: 'cover-cont', q: '', ls: { 'ai-game-v1': { done: 3, sound: true } } },
    ...range(1, 10).map(n => lvl(n, '?ch=' + n)), { label: 'end', q: '?fin=1' }],
  'bowl-game': [{ label: 'cover', q: '' }, { label: 'cover-cont', q: '', ls: { 'bowl-game-v1': { done: 3, sound: true } } },
    ...range(1, 10).map(n => lvl(n, '?ch=' + n)), { label: 'end', q: '?fin=1' }],
  'lab/water-game': [{ label: 'cover', q: '' }, { label: 'cover-cont', q: '', ls: { 'water-game-v1': { done: 3, sound: true } } },
    ...range(1, 10).map(n => lvl(n, '?ch=' + n)), { label: 'end', q: '?fin=1' }],
  'lab/toy-factory': [{ label: 'cover', q: '' }, { label: 'cover-cont', q: '', ls: { 'toy-factory-v2': { done: 3, sound: true } } },
    ...range(1, 10).map(n => lvl(n, '?ch=' + n)), { label: 'end', q: '?fin=1' }],
  'space-game': [{ label: 'cover', q: '' }, { label: 'cover-cont', q: '', ls: { 'space-world-v1': ['sun.c1', 'mercury.visit'] } }, { label: 'world', q: '?world' },
    ...SPACE_TASKS.map((t, i) => ({ label: 'T' + String(i + 1).padStart(2, '0') + '-' + t, q: '?act=' + t, title: true })),
    { label: 'end', q: '?world', ls: { 'space-world-v1': SPACE_TASKS } }],
  'lab/robot-town': [{ label: 'cover', q: '' }, ...range(1, 10).map(n => ({ label: 'M' + String(n).padStart(2, '0'), q: '?m=' + n, wait: 6000 })), { label: 'end', q: '?end=1', wait: 9000 }],
  'lab/science-lab': [{ label: 'cover', q: '' }, ...range(1, 10).map(n => ({ label: 'E' + String(n).padStart(2, '0'), q: '?e=' + n, wait: 6000 })), { label: 'end', q: '?end=1', wait: 9000 }],
  'lab/typhoon-game': [{ label: 'cover', q: '' }, { label: 'cover-cont', q: '', ls: { 'typhoon-game-v1': { done: 3, sound: true } } },
    ...range(1, 10).map(n => lvl(n, '?ch=' + n)), { label: 'end', q: '?fin=1' }],
  'lab/body-game': [{ label: 'cover', q: '' }, { label: 'cover-cont', q: '', ls: { 'body-game-v1': { done: 3, sound: true } } },
    ...range(1, 10).map(n => lvl(n, '?ch=' + n)), { label: 'end', q: '?fin=1' }],
  'lab/robot-game': [{ label: 'cover', q: '' }, ...range(1, 4).map(n => ({ label: 'step' + n, q: '?step=' + n })), ...range(1, 4).map(n => ({ label: 'play' + n, q: '?play=' + n + '&lv=0', wait: 6000 })), { label: 'end', q: '?end=1', wait: 9000 }],
};

// 頁面裡持續檢查：看得到、沒被「在畫面內、overflow 不是 visible」的祖先裁掉、卻超出 0～375 的元素
const PROBE = () => {
  const found = new Map();
  let maxSW = 0, swBy = [];
  const desc = el => {
    let s = el.tagName.toLowerCase() + (el.id ? '#' + el.id : '') + (typeof el.className === 'string' && el.className ? '.' + el.className.trim().split(/\s+/).slice(0, 3).join('.') : '');
    const p = el.parentElement;
    if (p && p !== document.body) s = (p.id ? '#' + p.id : p.tagName.toLowerCase() + (typeof p.className === 'string' && p.className ? '.' + p.className.trim().split(/\s+/)[0] : '')) + ' > ' + s;
    return s;
  };
  function scan() {
    const vw = document.documentElement.clientWidth || innerWidth;
    const sw = document.documentElement.scrollWidth;
    if (sw > vw && sw > maxSW) {      // 有橫向捲動：記下是誰撐出去的（不管有沒有被裁掉、透明）
      swBy = [];
      for (const el of document.body.querySelectorAll('*')) { const r = el.getBoundingClientRect(); if (r.right > vw + .5 && swBy.length < 6) swBy.push(desc(el) + ' →' + Math.round(r.right)); }
    }
    maxSW = Math.max(maxSW, sw);
    for (const el of document.body.querySelectorAll('*')) {
      const r = el.getBoundingClientRect();
      if (!r.width || !r.height) continue;
      if (r.right <= vw + .5 && r.left >= -.5) continue;
      if (r.right <= 0 || r.left >= vw) continue;      // 整個在畫面外（還沒擺好位置的提示手勢等）：看不到，不算
      const cs = getComputedStyle(el);
      if (cs.visibility === 'hidden' || cs.display === 'none' || +cs.opacity === 0) continue;
      let a = el.parentElement, clipped = false, faded = false;
      while (a && a !== document.body) {
        const s = getComputedStyle(a);
        if (+s.opacity === 0 || s.visibility === 'hidden') { faded = true; break; }
        if (s.overflowX !== 'visible' || s.overflow !== 'visible') { const ar = a.getBoundingClientRect(); if (ar.right <= vw + .5 && ar.left >= -.5) { clipped = true; break; } }
        a = a.parentElement;
      }
      if (clipped || faded) continue;
      const k = desc(el);
      const txt = (el.innerText || el.textContent || '').replace(/\s+/g, '').slice(0, 24);
      const o = found.get(k) || { el: k, txt, left: 0, right: 0, n: 0 };
      o.left = Math.min(o.left, Math.round(r.left)); o.right = Math.max(o.right, Math.round(r.right)); o.n++;
      found.set(k, o);
    }
  }
  const tick = () => { try { scan(); } catch (e) { /* ignore */ } };
  setInterval(tick, 120);
  addEventListener('DOMContentLoaded', () => { new MutationObserver(tick).observe(document.body, { childList: true, subtree: true }); tick(); });
  window.__m375 = () => ({ items: [...found.values()], scrollWidth: maxSW, swBy, vw: document.documentElement.clientWidth });
};

const results = [];
const browser = await chromium.launch();
const games = Object.keys(GAMES).filter(g => !ONLY.length || ONLY.includes(g) || ONLY.includes(g.replace('lab/', '')));
// 一次跑 3 個遊戲（python http.server 同時太多連線會 reset）
const queue = games.slice();
const worker = async () => { for (let g; (g = queue.shift());) await runGame(g); };
async function runGame(g) {
  const ctx = await browser.newContext({ viewport: { width: 375, height: 812 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  for (const u of GAMES[g]) {
    const page = await ctx.newPage();
    const errs = [];
    page.on('pageerror', e => errs.push('pageerror: ' + e.message));
    page.on('console', m => { if (m.type() === 'error') errs.push('console: ' + m.text() + (m.location().url ? ' @' + m.location().url.replace(BASE, '') : '')); });
    page.on('requestfailed', q => { if (q.url().startsWith(BASE)) errs.push('requestfailed: ' + q.url().replace(BASE, '') + ' ' + (q.failure() || {}).errorText); });
    await page.addInitScript(ls => { try { localStorage.clear(); for (const k in ls) localStorage.setItem(k, JSON.stringify(ls[k])); } catch (e) { /* ignore */ } }, u.ls || {});
    await page.addInitScript(PROBE);
    const dir = path.join(OUT, g.replace('/', '_'));
    fs.mkdirSync(dir, { recursive: true });
    const shots = [];
    try {
      await page.goto(BASE + g + '/' + u.q, { waitUntil: 'load' });
      if (u.title) {
        try {
          await page.waitForSelector('.chtitle', { timeout: 4000 });
          await page.waitForTimeout(250);
          const f = path.join(dir, u.label + '-title.png'); await page.screenshot({ path: f }); shots.push(path.relative(ROOT, f));
        } catch (e) { /* 沒有標題卡 */ }
      }
      await page.waitForTimeout(u.wait || (u.title ? 4200 : 3000));
      const f = path.join(dir, u.label + '.png'); await page.screenshot({ path: f }); shots.push(path.relative(ROOT, f));
      const m = await page.evaluate(() => window.__m375());
      const bad = m.items.length > 0 || m.scrollWidth > 375;
      results.push({ game: g, label: u.label, url: g + '/' + u.q, ok: !bad, scrollWidth: m.scrollWidth, swBy: m.swBy, items: m.items, errors: errs, shots });
    } catch (e) {
      results.push({ game: g, label: u.label, url: g + '/' + u.q, ok: false, error: String(e), errors: errs, shots });
    }
    await page.close();
  }
  await ctx.close();
}
await Promise.all([worker(), worker(), worker()]);
await browser.close();

results.sort((a, b) => (a.game + a.label).localeCompare(b.game + b.label));
fs.writeFileSync(path.join(OUT, 'results.json'), JSON.stringify(results, null, 2));
const lines = ['# 手機 375×812 驗收', '', '| 遊戲 | 畫面 | 結果 | scrollWidth | 超出的元素 | console 錯誤 |', '|---|---|---|---|---|---|'];
for (const r of results) {
  lines.push('| ' + r.game + ' | ' + r.label + ' | ' + (r.ok ? '✅' : '❌') + ' | ' + (r.scrollWidth || '') + ' | ' +
    (r.items || []).map(i => '`' + i.el + '` ' + i.left + '～' + i.right + (i.txt ? '「' + i.txt + '」' : '')).join('<br>') + (r.error ? r.error : '') + ' | ' + r.errors.length + ' |');
}
const nBad = results.filter(r => !r.ok).length, nErr = results.filter(r => r.errors.length).length;
lines.push('', `共 ${results.length} 個畫面，超出 ${nBad} 個，有 console 錯誤 ${nErr} 個。`);
fs.writeFileSync(path.join(OUT, 'summary.md'), lines.join('\n') + '\n');
console.log(lines.slice(-1)[0]);
for (const r of results.filter(r => !r.ok || r.errors.length)) console.log(r.ok ? '⚠' : '❌', r.game, r.label, r.scrollWidth, JSON.stringify(r.items || r.error), JSON.stringify(r.swBy || []), r.errors.slice(0, 3).join(' / '));
process.exit(nBad ? 1 : 0);
