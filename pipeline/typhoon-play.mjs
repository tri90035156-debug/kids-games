#!/usr/bin/env node
// 《颱風怎麼來？》自動試玩（2D 版，第 2 批）：從封面按 S 開始，十關一路玩到結尾；每關用 __ty.win() 跳過互動、點「繼續」，
// 第 10 關的選擇題照順序點選項。記錄 console 錯誤、每關一張 375 寬截圖。用法：node pipeline/typhoon-play.mjs [--port 8770]
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const argv = process.argv.slice(2);
const PORT = +(argv[argv.indexOf('--port') + 1] || 8770) || 8770;
const OUT = path.join(ROOT, 'pipeline/shots/typhoon-game/2d');
fs.mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 375, height: 812 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
const page = await ctx.newPage();
const errs = [];
page.on('pageerror', e => errs.push('pageerror: ' + e.message));
page.on('console', m => { if (m.type() === 'error') errs.push('console: ' + m.text()); });
await page.goto('http://localhost:' + PORT + '/lab/typhoon-game/?fast=1');
await page.evaluate(() => localStorage.clear());
await page.reload();
await page.waitForSelector('#go');
await page.screenshot({ path: path.join(OUT, '00-cover.png') });
await page.keyboard.press('KeyS');
let lastCh = -1, t0 = Date.now(), shots = new Set();
while (Date.now() - t0 < 120000) {
  await page.waitForTimeout(150);
  const st = await page.evaluate(() => ({
    ch: [...document.querySelectorAll('#dots i')].findIndex(i => i.classList.contains('cur')),
    nx: !!document.querySelector('#nx'), again: !!document.querySelector('#again'),
    opts: document.querySelectorAll('.opt:not(.wrong):not(.dim)').length, right: !!document.querySelector('.opt.right'),
    sv: !!document.querySelector('.ty-sv'), wide: document.documentElement.scrollWidth,
  }));
  if (st.wide > 375) errs.push('ch' + st.ch + ' scrollWidth ' + st.wide);
  if (st.again) break;
  if (st.ch !== lastCh) { lastCh = st.ch; await page.waitForTimeout(300); }
  if (st.sv && !shots.has(st.ch) && !st.nx) { shots.add(st.ch); await page.screenshot({ path: path.join(OUT, 'L' + String(st.ch + 1).padStart(2, '0') + '.png') }); }
  if (st.nx) { await page.click('#nx'); continue; }
  if (st.opts && !st.right) { await page.locator('.opt:not(.wrong):not(.dim)').first().click(); continue; }
  await page.evaluate(() => window.__ty && __ty.win());
}
await page.screenshot({ path: path.join(OUT, '99-end.png') });
const end = await page.evaluate(() => !!document.querySelector('#again'));
console.log(JSON.stringify({ reachedEnd: end, levels: [...shots].sort((a, b) => a - b), errors: errs }, null, 1));
await browser.close();
