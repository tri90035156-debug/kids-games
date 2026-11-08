#!/usr/bin/env node
// 3D 化遊戲的自動試玩（2026-11-08 第 3 批起）：從封面按 S 開始，十關一路玩到結尾，全部用「真的輸入」：
//   --mode kb   只用鍵盤（照遊戲的 __<hook>.aid().kb：要按的鍵，或 { hold: 'h' } 按住）
//   --mode ptr  只用手指／滑鼠（照 aid().ptr：tap / hold / drag [from,to] / circle / wipe，頁面座標）
// 每關記：有沒有過、花幾秒、同畫面物件數（__k.meshes()，要 ≤ 60）、console 錯誤、375 寬有沒有橫向捲動；每關一張截圖。
// 用法：node pipeline/play3d.mjs --game lab/water-game --hook __wg [--mode kb|ptr] [--port 8770] [--w 375 --h 812]
// 截圖：pipeline/shots/<slug>/<mode>-L01.png …；結果：pipeline/shots/<slug>/<mode>-results.json
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const argv = process.argv.slice(2);
const arg = (k, d) => { const i = argv.indexOf(k); return i >= 0 ? argv[i + 1] : d; };
const GAME = arg('--game', 'lab/water-game'), HOOK = arg('--hook', '__wg'), MODE = arg('--mode', 'kb');
const PORT = +arg('--port', 8770), W = +arg('--w', 375), H = +arg('--h', 812), N = +arg('--n', 10);
const SLUG = GAME.split('/').pop();
const OUT = path.join(ROOT, 'pipeline/shots', SLUG); fs.mkdirSync(OUT, { recursive: true });
const KEY = k => k.length === 1 ? (/[a-z]/.test(k) ? 'Key' + k.toUpperCase() : 'Digit' + k) : { enter: 'Enter', space: 'Space', left: 'ArrowLeft', right: 'ArrowRight', up: 'ArrowUp', down: 'ArrowDown' }[k] || k;

const browser = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const ctx = await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 2, hasTouch: MODE === 'ptr' });
const page = await ctx.newPage();
const errs = [];
page.on('pageerror', e => errs.push('pageerror: ' + e.message));
page.on('console', m => { if (m.type() === 'error' && !/favicon/.test(m.text())) errs.push('console: ' + m.text()); });
await page.goto(`http://localhost:${PORT}/${GAME}/?fast=1`);
await page.evaluate(() => localStorage.clear());
await page.reload();
await page.waitForSelector('#go', { timeout: 15000 });
await page.screenshot({ path: path.join(OUT, MODE + '-L00-cover.png') });
await page.keyboard.press('KeyS');
const lv = [];
let cur = -1, t0 = Date.now(), tl = Date.now(), shot = new Set(), maxMesh = {}, wide = 0;
const state = () => page.evaluate(h => ({
  ch: [...document.querySelectorAll('#dots i')].findIndex(i => i.classList.contains('cur')),
  nx: !!document.querySelector('#nx'), again: !!document.querySelector('#again'),
  aid: window[h] && window[h].aid ? window[h].aid() : null,
  mesh: window.__k ? window.__k.meshes() : 0, sw: document.documentElement.scrollWidth,
  k3: !!document.querySelector('#stage .k3'),
}), HOOK);
const sleep = ms => new Promise(r => setTimeout(r, ms));
async function doPtr(p) {
  const m = page.mouse;
  if (p.tapEl) { await page.click(p.tapEl); }
  else if (p.tap) { await m.move(p.tap.x, p.tap.y); await m.down(); await sleep(40); await m.up(); }
  else if (p.hold) { await m.move(p.hold.x, p.hold.y); await m.down(); await sleep(p.ms || 700); await m.up(); }
  else if (p.drag) { const [a, b] = p.drag; await m.move(a.x, a.y); await m.down(); for (let i = 1; i <= 12; i++) { await m.move(a.x + (b.x - a.x) * i / 12, a.y + (b.y - a.y) * i / 12); await sleep(16); } await sleep(150); await m.up(); }
  else if (p.circle) { const c = p.circle; await m.move(c.x + 60, c.y); await m.down(); for (let i = 0; i <= 48; i++) { const a = (p.ccw ? -1 : 1) * i / 48 * Math.PI * 4; await m.move(c.x + Math.cos(a) * 60, c.y + Math.sin(a) * 60); await sleep(8); } await m.up(); }
  else if (p.wipe) { const c = p.wipe, w = c.w || 55, hh = c.h || 60; await m.move(c.x - w, c.y - hh); await m.down(); for (let i = 0; i <= 40; i++) { await m.move(c.x + Math.sin(i * .6) * w, c.y - hh + i * hh / 20); await sleep(8); } await m.up(); }
}
async function doKb(k) {
  if (!k) return;
  if (Array.isArray(k)) { for (const x of k) { await page.keyboard.press(KEY(x)); await sleep(60); } }
  else if (k.hold) { await page.keyboard.down(KEY(k.hold)); await sleep(k.ms || 700); await page.keyboard.up(KEY(k.hold)); }
}
while (Date.now() - t0 < 300000) {
  await sleep(120);
  let st;
  try { st = await state(); } catch (e) { continue; }
  if (st.sw > W) wide = Math.max(wide, st.sw);
  if (st.again) break;
  if (st.ch !== cur) { if (cur >= 0) lv.push({ L: cur + 1, sec: +((Date.now() - tl) / 1000).toFixed(1), maxMesh: maxMesh[cur] || 0 }); cur = st.ch; tl = Date.now(); }
  if (st.aid) maxMesh[cur] = Math.max(maxMesh[cur] || 0, st.mesh);     // 只算這關互動進行中（上一關的道具在標題卡時還沒清）
  if (st.k3 && st.aid && !shot.has(cur)) { shot.add(cur); await sleep(1500); await page.screenshot({ path: path.join(OUT, MODE + '-L' + String(cur + 1).padStart(2, '0') + '.png') }); }
  if (st.nx) { if (MODE === 'kb') await page.keyboard.press('Enter'); else await page.click('#nx'); continue; }
  if (!st.aid) continue;
  if (MODE === 'kb') await doKb(st.aid.kb); else await doPtr(st.aid.ptr || {});
  if (Date.now() - tl > 90000) { errs.push('L' + (cur + 1) + ' 卡住超過 90 秒'); break; }
}
const end = await page.evaluate(() => !!document.querySelector('#again'));
if (cur >= 0 && end) lv.push({ L: cur + 1, sec: +((Date.now() - tl) / 1000).toFixed(1), maxMesh: maxMesh[cur] || 0 });
await page.screenshot({ path: path.join(OUT, MODE + '-L99-end.png') });
const res = { game: GAME, mode: MODE, reachedEnd: end, levels: lv, wide, errors: errs, over60: lv.filter(l => l.maxMesh > 60).map(l => l.L) };
fs.writeFileSync(path.join(OUT, MODE + '-results.json'), JSON.stringify(res, null, 1));
console.log(JSON.stringify(res));
await browser.close();
process.exit(end && !errs.length && !wide ? 0 : 1);
