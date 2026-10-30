# 評審報告 2026-10-30：《小水滴變變變》（lab/water-game）

phase = build（第 1 晚）。評審沒有參與建置，照 `pipeline/PRINCIPLES.md` 12 條打分。

## 給家長的三句話

1. **今晚做了什麼**：從三個點子裡選了「水的三態」，做出新遊戲《小水滴變變變》十關（冰、水、水蒸氣；融化、凝固、蒸發、凝結、水循環），試玩兩輪 22 個畫面零錯誤、零橫向捲動；四個正式遊戲與首頁回歸 36 個畫面全部正常。
2. **哪裡最好**：十關用了九種不同的手部動作（按住、點選、拖放、繞圈、左右拖、擦玻璃、排順序、連線、節奏敲），一個「放大鏡裡的小點點」貫穿五關，讓孩子親眼看冰排整齊、水滑來滑去、水蒸氣飛散；事實全部照查核表寫（白煙是小水珠、玉山約 87 度、曬衣服不用 100 度），每關結尾的「給家長」小卡有數字和來源。
3. **哪裡還不好／需要家長決定**：拖曳沒有「重量」、hover 只有微放大，手感還是第一階；第 2、4 關要看字才知道要做什麼；第 10 關孩子看的那句「水蒸氣往上飛，變成雲」少了「變冷凝結成小水珠」一步，可能讓孩子以為雲就是水蒸氣（家長小卡是對的）；「衣服」「誰」兩個注音用了大陸讀法。判定**可推實驗室**，請家長陪玩時特別看第 6 關的滑桿會不會太常被說「還沒到喔」。

## 回歸測試

`pipeline/shots/2026-10-30/regress/summary.md`：首頁（日／夜）、seed-game、ai-game、bowl-game、space-game，手機＋平板共 36 個畫面全部 ok，無 console error、無橫向捲動、無需家長看的項目。

註記（沿用今晚的紀錄）：
- space-game 的 world 畫面載入 2,304～2,460 ms（未超 3 秒門檻，但已經是全站最慢，之後打磨夜可以看看 three.js 場景能不能延後載入）。
- 今早 07:43 那輪 bowl-game mobile ch3 曾一次「audio/b655f893e344.mp3 載入失敗」，重跑未重現、檔案存在，判定偶發。

## 自己玩一遍：每關的手在做什麼

| 關 | 動作 | 鍵盤 | 和前一關不同？ |
|---|---|---|---|
| 1 | 按住（加熱按鈕），冰塊慢慢塌成一灘水 | 按住 H | — |
| 2 | 點選三個放大鏡 | A B C | 是 |
| 3 | 按住（冷卻）→ 再把冰塊拖進杯子（只剩一個目標，點一下也算） | 按住 C、F | 是 |
| 4 | 拖放分類到兩個盆子 | A～F、J L | 是（但第 3 關尾巴也是一次 dragPick，兩關交界處有一點重複） |
| 5 | 手指繞圈轉旋鈕（算角度差，約一圈半） | K 每按轉一格 | 是 |
| 6 | 左右拖溫度條，停在 0 與 100 | A D ← → | 是 |
| 7 | 畫線擦霧（canvas destination-out，8×10 格算覆蓋率 ≥ 60%） | A S D F 各擦一條 | 是 |
| 8 | 依序點四張冰棒圖 | A～D | 是 |
| 9 | 從左拖線到右（或先左字母再右字母） | A～E、J K L | 是 |
| 10 | 節奏敲亮起的點，三圈 | S U R | 是 |

九種動作、相鄰不重複，達標。鍵盤每關都有對應，字母鍵帽都畫在物件上。

## 評分（1～5；3＝普通）

| # | 原則 | 分 | 一句理由 |
|---|---|---|---|
| 1 | 互動戲 | 3 | `game.css` `.wg-touch:hover` 只有 scale(1.03)＋rotate(-1.5deg)，沒有晃動；拖曳是 `engine.js` `dragPick` 直接 `translate`，沒有慣性；背景會活的只有粒子、泡泡、火苗，盆子、鍋子、瓶子碰了都不動。停在「按下回饋」這一階。 |
| 2 | 美感 | 4 | 天藍＋琥珀＋珊瑚＋鼠尾草，收斂得好；平板主圖都 ≥ 240px（`tablet-ch1.png` 冰塊約 260、`tablet-ch7.png` 杯子 400）。扣分：手機第 10 關下半畫面空一大塊（`mobile-ch10.png`）、第 2 關放大鏡只有 190px、第 8 關說明文字在手機排成四行（`mobile-ch8.png`），離「畫面最多一行字」還有距離；手機頂部進度點太小。 |
| 3 | 聲音 | 4 | `sound.js` 全部正弦／三角合成，木琴＋木魚＋水滴＋和弦，五聲音階；成功是上行三音、答錯是 300 Hz 低木魚；有音量避讓（`duck`）、水滴音高隨進度升高。扣分：`engine.js` 裡 `next()`、`intro`、`dragPick.pick` 呼叫的是引擎自己的 `sfx`（純正弦 520／660 Hz），沒走 `sound.js` 的木質音，同一個「點一下」會聽到兩種聲音。 |
| 4 | 手感 | 3 | 落點有 `squash`（0.85→1.08→1，240ms）、答錯是 `home()` 0.25s 彈回不是瞬移、`touch-action:none` 與 `user-select:none` 都有；但拖曳完全跟手沒有 lerp、放手沒有滑行，第 9 關連線的拖線也是直線跟手。觸控目標：第 10 關手機 52px、第 6 關拇指 48px 都 ≥ 44。 |
| 5 | 直覺 | 3 | 光暈→5 秒變亮→15 秒小手示範的鏈條每關都有（`guide()`），很好。但把字遮掉：第 4 關兩個盆子只差一點藍（`tablet-ch4.png`），不看「硬硬的／會流動」不知道哪個放冰塊；第 2 關「哪一個是冰？」沒有圖示版的題目；第 9 關情境要讀字。第 1、3、5、6、7、10 關不看字也能玩。 |
| 6 | 關卡多樣 | 5 | 十關九種動作、相鄰不重複（上表），而且主題風格不換、換的只有手怎麼動；同一個粒子模組撐起第 1、2、3、5、6 關，是這類遊戲的範例做法。唯一小瑕疵是第 3 關尾巴的拖放接第 4 關的拖放。 |
| 7 | 溫柔的失敗 | 4 | 沒有紅叉、倒數、扣分；答錯＝`shake`＋低木魚，錯兩次 `wg-hint` 光暈、錯三次 `demo()` 小手，每關都照做。扣分：第 6 關每次放手離目標 > 12 度就算一次「錯」（`app.js` ch6 `check`），好奇的孩子滑三次就被自動完成，探索被當成失敗。 |
| 8 | 內容正確 | 4 | A1～A6 全部照查核表：玉山寫「約 87 度」（`c6.flag`、`p6`）、白煙寫小水珠且不進氣體盆、全文沒有「水氣」、沒有「100 度才會變水蒸氣」（grep 確認）、融化／凝固／蒸發／凝結用詞對；`p8` 用了安全版「看誰先軟」。粒子冰的格距比水大 12%（`particles.js` `sp = 2r*1.12`），第 3 關冰塊浮起露出 4.2/42 ≈ 1/10，和 A2 一致。注音查了了、著、得、種、乾、空、轉、重、散、都、和、為，全對。扣分三處：`c10.u`「水蒸氣往上飛，變成雲」少了「變冷凝結」一步，是會被孩子追問「雲是水蒸氣嗎」的簡化；`衣服` 標成 `˙ㄈㄨ`、`p8` 的 `誰` 標 `ㄕㄨㄟˊ`，台灣教育部讀法是 `ㄈㄨˊ`、`ㄕㄟˊ`（pypinyin 的大陸讀音）。 |
| 9 | 效能穩定 | 5 | `water-after/summary.md` 22/22 ok，無 console error、無橫向捲動，載入最慢 520 ms；`?ch=N`、`&fast=1` 可直達；外部資源只有 Google Fonts（允許）；沒有圖片、音檔、`speechSynthesis`、emoji（`style.css` 的 ✓ 是文字符號且本遊戲沒用到 `.opt`）；粒子同畫面最多 54 顆 < 60。小瑕疵：第 7 關 canvas 只在建立時量一次尺寸，旋轉螢幕霧會對不準（不會壞、不會報錯）。 |
| 10 | 完成感 | 4 | 每關結尾 `ritual()` 印章＋上行四音＋和弦，再一張「給家長」小卡；進度點看得見；結尾場景有六張貼紙可以點出音階。扣分：十關都是同一顆水滴印章，沒有「物件歸位」這種和那一關有關的儀式。 |
| 11 | 原創 | 5 | `art.js` 全部自畫 SVG（無描邊、霧面、軟影），`sound.js` 全部合成；只借了 Tinybop「按住加溫、粒子變快」這個機制，名字、角色、圖都是自己的。 |
| 12 | 家長看懂 | 5 | `README.md` 有十關表（動作＋鍵盤）、十條「給家長」事實各附來源、改文字的方法、檔案表；`tools/content.py` 開頭就寫了用詞規則。 |

**總分 49 / 60**；最低三項：1 互動戲、4 手感、5 直覺（各 3 分）。

## 阻擋

無。

- 錯誤／空白：無（22/22 ok）。
- 橫向捲動：無。
- 內容錯：無阻擋級錯誤（上述三處是「可以更好」，家長小卡都是對的）。
- 外部素材：無（只有字型）。
- 碰了 lab/pipeline 以外的檔案：無（git 狀態只有 `lab/games.json`、`lab/water-game/`、`pipeline/ideas/2026-10-30.md`）。
- `.env`：沒有 `.env` 檔，只有空的 `.env.example`，`.gitignore` 已含 `.env`。

另外澄清試玩員的兩個疑問：
- 「第 7 關杯中央一顆不明橘點」：是擦拭的結果不是 bug。`wipe()` 用 `destination-out` 擦出半徑 15 的圓，露出底下的橘色飲料；試玩員點一下就擦出一個圓洞。但這也說明單點就擦掉一塊，邊緣沒有柔化。
- 「擦過的鍵帽變淡像壞了」：`.wg-cols>span.used{opacity:.3}` 是故意的，但看起來像停用。建議改成打勾或縮小而不是變淡。

## 明晚要改的兩項

### 一、第 5 條「直覺」：字變圖示（第 4 關盆子、第 2 關題目）

**改什麼**
1. `lab/water-game/app.js` `ch4()`：兩個盆子的 HTML（`'<div class="zone wg-basin" ...'` 那一段）在 `.wg-bart` 裡面、`.wg-pile` 之前加一個圖示：固體盆放 `'<span class="wg-bi">' + A.iceCube() + '</span>'`，液體盆放 `'<span class="wg-bi">' + A.drop() + '</span>'`。
2. `lab/water-game/game.css` 第四關區塊加：`.wg-bi{position:absolute;right:6%;top:-6%;width:26%;aspect-ratio:1;pointer-events:none}` `.wg-bi svg{width:100%;height:100%;display:block}`；手機媒體查詢裡 `.wg-bi{width:30%}`。
3. `lab/water-game/app.js` `ch2()`：在 `.wg-picks` 上方加一個「題目圖示」：`'<div class="wg-ask" id="ask"></div>'`；每題開始時 `$('#ask').innerHTML = { ice: A.iceCube(), water: A.drop(), steam: A.evapIcon() }[k]`，並 `squash($('#ask'))`。`game.css` 加 `.wg-ask{width:96px;height:96px;border-radius:50%;background:var(--paper);box-shadow:0 0 0 6px var(--goldsoft),var(--wg-soft);display:grid;place-items:center;margin-bottom:14px}` `.wg-ask svg{width:70%;height:70%}`。

**怎麼驗證**：開 `index.html?ch=4` 與 `?ch=2`，手機 375 與平板 768 各截一張；用手把說明框遮住，問自己「冰塊要放哪個盆？」「現在要找哪一種？」兩題都能答才算過。確認沒有橫向捲動、第 4 關盆子上的圖示不蓋到 `J`／`L` 鍵帽。

**再上一階**（直覺升級階梯：字變圖示 → 光暈指路 → 第一次互動後提示自動淡出）：第一次拖對之後，把說明框淡成 0.5。

### 二、第 4 條「手感」（連帶第 1 條）：拖曳加重量、hover 加晃動

**改什麼**
1. `lab/water-game/engine.js` `dragPick()` 的 `pointermove`：不要直接寫 `el.style.transform = 'translate(dx, dy)'`。改成把目標存進 `st.tx = dx; st.ty = dy`，第一次移動時啟動一個 `requestAnimationFrame` 迴圈：`st.cx += (st.tx - st.cx) * .3; st.cy += (st.ty - st.cy) * .3;` 再寫 `el.style.transform = 'translate(' + st.cx + 'px,' + st.cy + 'px) rotate(' + clamp((st.tx - st.cx) * .15, -6, 6) + 'deg)'`。`pointerup`／`pointercancel` 時 `cancelAnimationFrame`，命中目標就 `finish`，沒命中照舊 `home(el)`（它已經是 0.25s 彈回）。這份 engine.js 是 lab 自己的副本，只改這裡，不碰正式遊戲的 `ai-game/engine.js`。
2. `lab/water-game/game.css`：`.wg-touch:hover` 改成播一次小晃動：加 `@keyframes wg-sway{0%{transform:rotate(0)}30%{transform:rotate(-2deg) scale(1.03)}70%{transform:rotate(1.5deg) scale(1.03)}100%{transform:rotate(0) scale(1.03)}}`，`.wg-touch:hover{animation:wg-sway .5s var(--wg-back) both}`。第 5 關旋鈕已有 `.wg-knob:hover{transform:none}`，要一併加 `animation:none`。
3. 順手：`sound.js` 已經覆寫 `G.sfx`，但 `engine.js` 內部的 `next()`、`intro`、`dragPick.pick` 用的是區域變數 `sfx`。在 `engine.js` 這三處改成 `G.sfx ? G.sfx(name) : sfx(name)`（或在檔尾 `return` 之前把區域 `sfx` 指到 `window.G && G.sfx`），讓「點一下」只有一種木魚聲。

**怎麼驗證**：`?ch=4` 平板，用滑鼠快速拖一張卡片畫一個圈：卡片要略慢於游標、帶一點傾斜，放開後 100 ms 內停穩；放到盆子外要彈回原位；再用 `?ch=3` 拖冰塊進杯子確認 `finish` 仍會觸發。手機 375 檢查拖曳不會拉動頁面（`touch-action:none` 已在 `.wg-chip`）。截改前改後各一張放進報告。

**再上一階**（互動戲升級階梯：拖曳慣性 → 環境會回應）：卡片拖到盆子上方（`.zone.over`）時盆子做一次 `wg-squash`，已放進去的小圖跟著抖一下。

### 順手可修（不算今晚的兩項）
- `tools/content.py`：`衣服[˙ㄈㄨ]` 全部改 `服[ㄈㄨˊ]`（c9.s1、c9.r1、c9.done、p9）；`p8` 的「誰」加 `誰[ㄕㄟˊ]`；`c10.u` 改成「水蒸氣往上飛，變冷變成小水珠，聚成雲。」改完 `python3 tools/build.py`。
- 第 6 關 `check()`：放手離目標 > 12 度時，前兩次只 `speak('c6.near')` 不計 miss，第三次之後才算。
- 第 7 關：`.wg-cols>span.used` 改成縮小＋打勾，不要變淡。

## 閘門：lab

**可推 lab。** 理由：沒有阻擋項；第 8 條內容正確 4 分（≥ 4）；第 9 條效能穩定 5 分（= 5）。距離「建議上首頁」還差第 1、4、5 條要從 3 拉到 4，且需要連續兩晚沒有新阻擋。

## 截圖

改前：`/Users/yenwenhuang/kids-games/pipeline/shots/2026-10-30/water/lab_water-game/`（mobile-*.png、tablet-*.png 各 11 張）
改後：`/Users/yenwenhuang/kids-games/pipeline/shots/2026-10-30/water-after/lab_water-game/`（同 22 張），摘要 `pipeline/shots/2026-10-30/water-after/summary.md`

最能看出差別的三組：
1. `tablet-ch5.png` 改前鍵帽畫成「0」像數字零，改後是「K」；鍋子也放大了。
2. `tablet-ch7.png`／`mobile-ch7.png` 改前杯子裡有吸管和冰塊、鍵帽浮在杯外，色塊雜；改後只剩飲料加霧，四條擦拭區用虛線分開、鍵帽直接畫在各自那一條上。
3. `mobile-ch10.png` 改前雲蓋住太陽右側光芒，改後雲移到右邊、太陽完整（平板 `tablet-ch10.png` 同）。
另 `mobile-ch1.png` 改前冰塊只有 70px，改後整排 300px。

回歸：`/Users/yenwenhuang/kids-games/pipeline/shots/2026-10-30/regress/`。

## 改動的檔案

今晚新增／修改（git 狀態）：
- `lab/water-game/`（新）：`index.html`、`app.js`、`art.js`、`game.css`、`particles.js`、`sound.js`、`engine.js`（從 ai-game 複製，只多了「英文數字連在一起不斷行」四行）、`style.css`（與 ai-game 相同）、`content.js`（產生檔）、`tools/content.py`、`tools/build.py`、`README.md`、`.env.example`、`.gitignore`
- `lab/games.json`（修改：加入 water-game；評審更新 status／summary／updated）
- `pipeline/ideas/2026-10-30.md`（新：點子＋查核與選擇）
- `pipeline/shots/2026-10-30/{regress,water,water-after}/`（新：截圖與摘要）
- `pipeline/reports/2026-10-30.md`、`pipeline/reports/latest.md`（本報告）

沒有碰正式四個遊戲、首頁、`.env`、`pipeline/state.json`。
