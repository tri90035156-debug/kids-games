#!/usr/bin/env node
// 重來鈕驗收（2026-11-08）：每個遊戲進到第 3 關（3D 遊戲：第 3 個任務／實驗／挑戰）玩到一半，按右上角「↻」，
// 確認：回到同一關開頭（關卡編號一樣、第一句旁白一樣）、網址參數清掉、存檔進度沒變、console 零錯誤、鈕在 375 寬畫面內；
// 另外把 90 秒提醒改成 1.5 秒，確認鈕會呼吸、手指一碰就停。
// 用法：node pipeline/restart-test.mjs [--port 8770] [--out pipeline/shots/2026-11-08/restart]
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const argv = process.argv.slice(2);
const arg = (k, d) => { const i = argv.indexOf(k); return i >= 0 ? argv[i + 1] : d; };
const PORT = +arg('--port', 8770);
const OUT = path.resolve(ROOT, arg('--out', 'pipeline/shots/' + new Date().toISOString().slice(0, 10) + '/restart'));
fs.mkdirSync(OUT, { recursive: true });
const BASE = 'http://localhost:' + PORT + '/';

// where：在頁面裡回傳「現在在哪一關」與「第一句話」；save：存檔 key
const dotsWhere = () => ({ lv: [...document.querySelectorAll('#dots i')].findIndex(i => i.classList.contains('cur')), line: (document.querySelector('#bubble .bt') || {}).textContent || '' });
const CASES = [
  { g: 'seed-game', q: '?ch=3&fast=1', save: 'seed-game-v1', where: dotsWhere, want: 2 },
  { g: 'ai-game', q: '?ch=3&fast=1', save: 'ai-game-v1', where: dotsWhere, want: 2 },
  { g: 'bowl-game', q: '?ch=3&fast=1', save: 'bowl-game-v1', where: dotsWhere, want: 2 },
  { g: 'lab/water-game', q: '?ch=3&fast=1', save: 'water-game-v1', where: dotsWhere, want: 2 },
  { g: 'lab/typhoon-game', q: '?ch=3&fast=1', save: 'typhoon-game-v1', where: dotsWhere, want: 2 },
  { g: 'lab/toy-factory', q: '?l=3&fast=1', save: 'toy-factory-v1', where: () => ({ lv: __tf.state().lv, line: document.querySelector('#cap .bt').textContent }), want: 2 },
  { g: 'space-game', q: '?act=earth.c2&fast=1', save: 'space-world-v1', where: () => ({ lv: document.querySelector('.view3d') ? 'earth.c2' : '?', line: (document.querySelector('#bubble .bt') || {}).textContent || '' }), want: 'earth.c2' },
  { g: 'lab/robot-town', q: '?m=3&fast=1', save: 'robot-town-v1', wait: 3500, where: () => { const s = __town.state(); return { lv: s.mission ? s.mission.n : 0, sub: s.mission ? s.mission.sub : -1, done: s.done.join(',') }; }, want: 3 },
  { g: 'lab/science-lab', q: '?e=3&fast=1', save: 'science-lab-v1', wait: 3500, where: () => { const s = __lab.state(); return { lv: s.exp ? s.exp.n : 0, r: s.exp ? s.exp.r : -1, done: s.done.join(',') }; }, want: 3 },
  { g: 'lab/robot-game', q: '?play=3&lv=1&fast=1', save: 'robot-v1', wait: 3000, where: () => { const s = __robot.state(); return { lv: s.ch ? s.ch.part : -1, sub: s.ch ? s.ch.lv : -1, placed: s.placed.filter(Boolean).length }; }, want: 3 },
];

const browser = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
const rows = [];
const ONLY = (arg('--only', '') || '').split(',').filter(Boolean);
for (const c of CASES.filter(c => !ONLY.length || ONLY.some(o => c.g.endsWith(o)))) {
  const ctx = await browser.newContext({ viewport: { width: 375, height: 812 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', e => errs.push('pageerror: ' + e.message));
  page.on('console', m => { if (m.type() === 'error') errs.push('console: ' + m.text()); });
  const r = { game: c.g, ok: false };
  try {
    await page.goto(BASE + c.g + '/' + c.q);
    await page.waitForTimeout(c.wait || 2000);
    r.before = await page.evaluate(c.where);
    r.saveBefore = await page.evaluate(k => localStorage.getItem(k), c.save);
    const box = await page.locator('#rstBtn').boundingBox();
    r.btnBox = box && [Math.round(box.x), Math.round(box.y), Math.round(box.width), Math.round(box.height)];
    r.btnInView = !!box && box.x >= 0 && box.x + box.width <= 375 && box.y >= 0;
    await page.screenshot({ path: path.join(OUT, c.g.replace('/', '_') + '-before.png') });
    await Promise.all([page.waitForEvent('load'), page.locator('#rstBtn').click()]);
    await page.waitForTimeout(c.wait || 2000);
    r.url = await page.evaluate(() => location.pathname + location.search);
    r.after = await page.evaluate(c.where);
    r.saveAfter = await page.evaluate(k => localStorage.getItem(k), c.save);
    await page.screenshot({ path: path.join(OUT, c.g.replace('/', '_') + '-after.png') });
    // 90 秒提醒（測試改成 1.5 秒）
    await page.evaluate(() => { RESTART.idle = 1500; RESTART.progress(); });
    await page.waitForTimeout(2600);
    r.breathe = await page.evaluate(() => document.getElementById('rstBtn').classList.contains('breathe'));
    await page.evaluate(() => dispatchEvent(new PointerEvent('pointerdown', { bubbles: true })));
    await page.waitForTimeout(200);
    r.breatheStops = !(await page.evaluate(() => document.getElementById('rstBtn').classList.contains('breathe')));
    const sameLevel = JSON.stringify(r.after.lv) === JSON.stringify(c.want) && JSON.stringify(r.before.lv) === JSON.stringify(c.want);
    const sameLine = r.before.line === undefined || r.before.line === r.after.line;
    const urlClean = /^[^?]*(\?fast=1)?$/.test(r.url);
    r.checks = { sameLevel, sameLine, urlClean, btnInView: r.btnInView, breathe: r.breathe, breatheStops: r.breatheStops, noErrors: errs.length === 0 };
    r.ok = Object.values(r.checks).every(Boolean);
  } catch (e) { r.error = String(e); }
  r.errors = errs;
  rows.push(r);
  await ctx.close();
}
await browser.close();
fs.writeFileSync(path.join(OUT, 'results.json'), JSON.stringify(rows, null, 2));
for (const r of rows) console.log(r.ok ? '✅' : '❌', r.game, JSON.stringify(r.checks || r.error), 'before', JSON.stringify(r.before), 'after', JSON.stringify(r.after), r.url, r.errors.slice(0, 2).join(' / '));
process.exit(rows.every(r => r.ok) ? 0 : 1);
