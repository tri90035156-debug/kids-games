# 評審報告 2026-10-31：《小水滴變變變》（lab/water-game）

phase = polish（打磨第 1 晚，進來時 polishNights = 0）。今晚跑在**家長的 MacBook** 上，不是 Mac mini，所有子代理都用 **Opus**。
評審沒有參與建置，照 `pipeline/PRINCIPLES.md` 13 條打分；water-game 是 3D 規定之前做的平面遊戲，家長同意維持平面，第 13 條照實打分，「打磨完成」只看前 12 條。

## 給家長的三句話

1. **今晚做了什麼**：這晚改在您的 MacBook 上、全部用 Opus 跑。打磨的是《小水滴變變變》，修了昨晚報告點名的兩項，也照查核清單改了 12 處文字和注音。昨晚的兩項：第 2、4 關加了圖示，不看字也知道要找什麼、要放哪裡；拖曳改成會慢半拍跟手，還會往甩的方向歪一點。12 處裡包括「衣服」「誰」「露出」的讀音，還有第 10 關那句雲，現在寫成「變冷變成小水珠，聚成雲」。另外，第 6 關前兩次沒滑到不算錯；第 7 關擦過的鍵帽改成縮小加打勾，不再變淡。改前改後各 22 個畫面零錯誤；首頁和四個正式遊戲回歸 44 個畫面全部正常。
2. **哪裡最好**：內容現在經得起追問。每張「給家長」小卡都有數字和來源，破音字我逐字掃過，沒有發現錯的（只有「哪一個」的「個」想請查核員再確認）。音效也統一了：「點一下」只剩一種木頭聲，成功是往上走的三個音。前 12 條全部 ≥ 4 分，所以**打磨完成：是**，流水線可以開始做下一個新遊戲。
3. **哪裡還不好／需要家長決定**：孩子答錯時，「它會流動嗎？再想想」這類提示句其實沒有出現在畫面上，也沒有聲音，孩子只看到東西搖一下。這是原本就有的問題，不影響玩完，但很可惜。另外，拖曳還缺「放手滑一下」和「盆子被碰到會動」。照規則接下來要做新遊戲；**要不要先花一晚把答錯提示修好，請您決定**。它會出現在每個用同一份引擎的遊戲裡，新遊戲起手時也應該一起帶上。

## 回歸測試

`pipeline/shots/2026-10-31/regress/summary.md`：首頁（日／夜）、seed-game、ai-game、bowl-game、space-game、lab/water-game，手機＋平板 **44 / 44 ok**，沒有 console error、沒有橫向捲動。

- 首頁入口：`regress/hub/tablet-day.png`、`regress/hub/mobile-night.png` 都看得到水滴入口（編號 5），`hub/entries.json` 已含 `water-game`，`hub/entries/water-game.js` 存在。今晚沒有動首頁。
- space-game 的 world 畫面載入 2,063／2,470 ms，和昨晚一樣是全站最慢（沒超過 3 秒門檻），維持記錄就好。
- 正式四個遊戲沒有任何檔案被改（`git status` 只有 `lab/water-game/` 六個檔和 `pipeline/ideas/2026-10-31-polish-check.md`）。

## 自己玩一遍：每關的手在做什麼

| 關 | 動作 | 鍵盤 | 和前一關不同？ | 今晚的變化 |
|---|---|---|---|---|
| 1 | 按住加熱，冰塊塌成一灘水 | 按住 H | — | 無 |
| 2 | 看題目圖示，點三個放大鏡 | A B C | 是 | 新增題目圖示（`app.js` `ch2` 的 `#ask`，每題換圖＋squash） |
| 3 | 按住「變冷」，再把冰塊拖進杯子 | 按住 C、F | 是 | 按鈕字「冷卻」→「變冷」；拖曳有 lerp＋傾斜 |
| 4 | 拖放分類到兩個盆子 | A～F、J L | 是 | 盆子加冰塊／水滴圖示；第一次拖對後說明框淡成 0.5 |
| 5 | 手指繞圈轉旋鈕 | K | 是 | 無 |
| 6 | 左右拖溫度條，停在 0 與 100 | A D ← → | 是 | 前兩次沒對準只 squash 小旗、不算錯；玉山說明字不再直排 |
| 7 | 畫線擦霧 | A S D F | 是 | 擦過的鍵帽縮小＋打勾 |
| 8 | 依序點四張冰棒圖 | A～D | 是 | 無 |
| 9 | 從左拖線到右 | A～E、J K L | 是 | 「衣服」「涼涼的鏡子」文字 |
| 10 | 節奏敲亮起的點，三圈 | S U R | 是 | 「變冷變成小水珠，聚成雲」 |

九種動作，相鄰兩關不重複，鍵盤每關都有對應，達標。

## 評分（1～5；3＝普通）

| # | 原則 | 分 | 證據 |
|---|---|---|---|
| 1 | 互動戲 | 4（昨 3） | `game.css` `.wg-touch:hover` 改成 `wg-sway` 晃一下（-2°→1.5°→0），有光暈的物件晃動時光暈照樣呼吸（`.wg-touch.wg-glow:hover` 兩個動畫並存）；拖曳有慣性（見第 4 條）。升了一階到「拖曳慣性」。不到 5 的原因：「環境會回應」還沒做。卡片拖到盆子上方，盆子只變色（`style.css` `.zone.over`），不會動；瓶子、鍋子、海、山這些場景物件碰了也沒反應。 |
| 2 | 美感 | 4 | 新圖示做法和印章一致，都是紙底圓＋金邊＋軟影（`tablet-ch4.png`、`mobile-ch2.png` 改後），配色沒有變多。扣分：平板第 2、4、7 關上下各空 150～270px（`water-after/.../tablet-ch2.png`）；題目圖示平板只有 96px，比放大鏡小很多；`c10.u` 變長，手機泡泡變成四行（`scratchpad/shots/mobile-ch10-u.png`），而且第 10 關下半畫面仍是空的（`game.css` 手機 `.wg-cycle{margin-bottom:auto}`）；手機頂部進度點貼著「首頁」按鈕（改前就這樣，`water-before/.../mobile-ch2.png`）。 |
| 3 | 聲音 | 5（昨 4） | 昨晚唯一的扣分已經修掉：`engine.js` 第 143 行，引擎內部的 `sfx` 有 `G.sfx` 時就改走 `sound.js`，所以 `waitAction`、`dragPick.pick` 的「點一下」都是同一聲 `wood(900)`，不會再出現純正弦 520／660Hz。聲音升級階梯五階全部做到：材質對（木琴／木魚／水滴／三角波和弦）、音高隨進度升高（`drip` 隨進度、第 4 關 `note(4 + n++)`、第 10 關 `note(3 + r*2 + s)`）、和弦收尾（`win`、`chord`）、連點會自動變小聲（`duck`）。全部是 WebAudio 合成，五聲音階，可以當範例。 |
| 4 | 手感 | 4（昨 3） | `engine.js` `dragPick`：拖曳改成 rAF 迴圈，lerp 0.3，傾斜 `clamp((tx - cx) * .15, -6, 6)`，正好落在 PRINCIPLES 寫的 0.25～0.35 與 ≤ 6° 範圍；被鍵盤完成時用 `closed` 停掉迴圈；彈回的 0.25 秒加 `.homing`，不會被 hover 動畫蓋掉。`scratchpad/shots/tablet-ch4-dragging.png` 可以看到卡片歪著跟在手後面。不到 5：放手沒有滑行；拖到盆子上方，盆子沒有先 squash；彈回用的是 `ease`，沒有回彈；第 9 關的連線仍然完全跟手。 |
| 5 | 直覺 | 4（昨 3） | 把字遮掉也能玩了：第 2 關每題換題目圖示（`water-after/.../mobile-ch2.png`），第 4 關兩個盆子掛冰塊／水滴圖示（`tablet-ch4.png`），第 4 關第一次拖對以後說明框淡成 0.5（`scratchpad/shots/mobile-ch4-after1.png`）。5 秒光暈變亮、15 秒小手示範，每關都有。不到 5：答錯後的提示句（`c2.wrong`、`c4.wrong`、`c6.near`、`c6.wrong`、`c8.wrong`、`c9.wrong`、`g.no2`、`g.demo`）都走 `speak()`。這個遊戲沒有音檔（`content.js` 沒有任何 `"v"`），`speak()` 只會等一段時間，不會改泡泡裡的字，所以這些提示孩子**看不到也聽不到**。第 6 關新加的「前兩次只提示」實際上只有小旗壓一下。「第一次互動後說明淡出」也只做了第 4 關。 |
| 6 | 關卡多樣 | 5 | 十關九種動作，相鄰不重複（上表）。同一套粒子放大鏡撐起五關，主題不換，換的是手的動作，是這類遊戲的範例做法。 |
| 7 | 溫柔的失敗 | 5（昨 4） | 昨晚的扣分修掉了：`app.js` 第 6 關 `check()` 加了 `tries`，前兩次放手離目標超過 12 度只 `squash(flag)`，不出錯聲、不算錯，好奇滑來滑去不會被當成失敗。十關都照同一個梯子：答錯＝搖一下＋300Hz 低木魚；錯兩次 `wg-hint` 光暈；錯三次 `demo()` 小手示範。沒有紅叉、倒數、扣分。（答錯的提示句看不見，這筆算在第 5 條。） |
| 8 | 內容正確 | 5（昨 4） | 查核清單 4 條必改、8 條建議全部照做，`content.js` 已重新產生（我逐條對過）：`c10.u` 補上「變冷變成小水珠」；`服` 4 處改成 `ㄈㄨˊ`；`誰` 改成 `ㄕㄟˊ`；`c3.float`、`p3` 的 `露` 改成 `ㄌㄡˋ`；`p3` 的 `這個` 改成 `˙ㄍㄜ`；`p6` 改成「水不到 100°C 就會滾……所以山上煮東西反而比較慢」；`c6.flag` 改成「玉山頂大約 87 度就滾」；`c9.r3` 改成「涼涼的鏡子」；`c5.done` 拆成兩句；`c3.cold` 改成「變冷」；出處改成「國小三下自然『水的三態』單元」；`p5` 加了大泡泡裡是水蒸氣。README「給家長」第 3、4、5、6、9 條同步改了。我把全部破音字掃了一遍（了、著、得、重、乾、空、轉、散、都、和、為、長、中、種、露、誰、服、還、約……），沒有錯的。每張小卡都有數字和來源，可以當範例。待確認一點（不算錯）：第 2 關「哪一個」的「個」標 `ㄍㄜˋ`，請查核員下次對一下簡編本，看要不要改成輕聲。 |
| 9 | 效能穩定 | 5 | `water-after/summary.md` 22/22 ok，載入最慢 409ms；回歸 44/44 ok；沒有橫向捲動、沒有 console error；`node --check` 四支 JS 都通過；`?ch=N` 可以直接跳關。外部資源只有 Google Fonts；打勾圖示是寫在 CSS 裡的自畫 SVG data URI。小瑕疵沿用：第 7 關 canvas 只量一次尺寸，旋轉螢幕時霧會對不準。 |
| 10 | 完成感 | 4 | 每關結尾都有印章＋上行四音＋和弦，再接一張「給家長」小卡；進度點看得見；最後有六張貼紙的結尾場景。第 7 關的打勾讓「擦完一條」有了小完成感。扣分沿用：十關都是同一顆水滴印章，沒有和那一關內容有關的收尾，例如冰塊歸位、雲下雨。 |
| 11 | 原創 | 5 | `art.js` 全部自畫 SVG，`sound.js` 全部合成；今晚新增的打勾也是自畫的 path，沒有外部圖片或音檔。 |
| 12 | 家長看懂 | 5 | `README.md` 有十關表和十條「給家長」，每條都有來源，今晚也和 `content.py` 同步；`engine.js` 開頭註明這是 lab 的副本、不要回寫到正式遊戲；本報告開頭三句話。 |
| 13 | 立體與物理 | 2 | 平面 SVG，照規則最多 2 分（家長同意 water-game 維持平面，不用這條擋它）。平面裡做得到的物理大多有了：拖曳慣性＋傾斜、落點 squash、第 3 關冰塊用彈簧 `spring(k=90,d=8)` 沉下去再浮起來。沒有 3D、沒有重力、沒有碰撞，也沒有物件互相推。 |

**前 12 條總分 55 / 60**（昨 49）；含第 13 條 57 / 65。
最低三項：**13 立體與物理（2）**；前 12 條裡最該補的是 **5 直覺（4）**、**4 手感（4）**。同為 4 分的還有 1 互動戲、2 美感、10 完成感。

**打磨完成：是**（前 12 條全部 ≥ 4；water-game 是改版前的平面遊戲，只看 12 條）。

## 阻擋

**無。**

- 錯誤／空白：無（改後 22/22、回歸 44/44）。
- 橫向捲動：無。手機第 6 關的玉山說明字往左長到 x≈18px，還在畫面內（`scratchpad/shots/mobile-ch6-yu.png`）。
- 內容錯：無。查核清單全部照做，`content.js` 已重建。
- 外部素材：無（只有字型）。
- 碰了 lab/pipeline 以外的檔案：無。
- `.env`：只有空範本 `lab/water-game/.env.example`，沒有 `.env`。

## 改前改後對照

改前：`/Users/yenwen/Documents/兒童互動遊戲/pipeline/shots/2026-10-31/water-before/lab_water-game/`
改後：`/Users/yenwen/Documents/兒童互動遊戲/pipeline/shots/2026-10-31/water-after/lab_water-game/`
互動中：`/private/tmp/claude-501/-Users-yenwen-Documents-------/00d2ba75-d4e3-42c2-9acc-b32316e21788/scratchpad/shots/`（暫存資料夾，重開機會消失）

1. **第 4 關盆子（直覺）**：`water-before/lab_water-game/tablet-ch4.png` 兩個盆子只差一點藍，要讀「硬硬的／會流動」才知道放哪。`water-after/lab_water-game/tablet-ch4.png` 左盆掛冰塊、右盆掛水滴。互動中：`scratchpad/shots/tablet-ch4-dragging.png` 卡片拖曳時歪著跟手；`scratchpad/shots/mobile-ch4-after1.png` 第一次放對後說明框變淡。
2. **第 2 關題目（直覺）**：`water-before/lab_water-game/mobile-ch2.png` 只有一行字「哪一個是水蒸氣？」。`water-after/lab_water-game/mobile-ch2.png` 放大鏡上方多了一個題目圖示（冰塊）；平板 `water-after/lab_water-game/tablet-ch2.png` 是水蒸氣圖示，但只有 96px，偏小。
3. **第 7 關鍵帽（溫柔／完成感）**：`water-before/lab_water-game/tablet-ch7.png` 擦過的 A 變成淡淡的，像壞掉。`scratchpad/shots/tablet-ch7-used.png` 擦過的 A、S 縮小，右上角加了綠色打勾。
4. **第 3 關按鈕字（內容）**：`water-before/lab_water-game/tablet-ch3.png`「冷卻」→ `scratchpad/shots/tablet-ch3-btn.png`「變冷」。
5. **第 10 關雲（內容）**：`scratchpad/shots/mobile-ch10-u.png` 寫成「水蒸氣往上飛，變冷變成小水珠，聚成雲。」事實對了，但手機上泡泡變四行、下半畫面空著（明晚以後的美感題）。
6. **第 6 關玉山（排版）**：`scratchpad/shots/tablet-ch6-yu.png`、`mobile-ch6-yu.png` 說明字在 87 小旗左邊排成一行，不再直排。

## 明晚要改的兩項

照規則，打磨完成以後流水線會開始做新遊戲，所以這兩項是 water-game 的**待辦**：家長決定再打磨一晚，或之後回頭修時照做。第一項是 `engine.js` 的修法，新遊戲從 space-game 起手時，答錯提示也要照這個原則做（提示要看得到）。

### 一、第 5 條「直覺」（連帶第 7 條）：答錯提示要看得到

**問題**：這個遊戲沒有配音檔，`speak(key)` 只會 `setTimeout` 等一下，泡泡裡的字不會換。所以 `c4.wrong`「它會流動嗎？再想想。」這類為孩子寫的提示，孩子從來看不到。

**改什麼**
1. `lab/water-game/engine.js`，在 `function say(key)`（約第 196 行）後面加一個 `tip(key)`：先記住 `const back = lastKey`；`clearTimeout(tipT)`；`sayBox.classList.remove('wg-faded')`；`bubble.classList.add('tip')`；把 `bubble.innerHTML` 換成 `key` 的內容（和 `say` 同一個寫法，但**不要**改 `lastKey`）；再 `tipT = setTimeout(() => { bubble.classList.remove('tip'); if (lastKey === back && back) bubble.innerHTML = '<span class="spk">' + speakerIcon + '</span><span class="bt">' + Z(back) + '</span>'; }, FAST ? 30 : Math.max(1800, TX[key].t.length * 220))`；最後 `return speak(key)`。`say()` 的第一行加 `clearTimeout(tipT); bubble.classList.remove('tip');`。`let tipT = 0;` 宣告在 `let lastKey` 旁邊。底下的 `return { ... }` 加上 `tip`。
2. `lab/water-game/app.js` 第 6 行的解構加上 `tip`，然後把這幾處的 `speak(` 換成 `tip(`：第 45 行 `g.demo`、第 144 行（第 2 關）、第 237 行（第 4 關）、第 375 行（第 6 關差 12 度以內，`c6.near`）、第 379 行（`c6.wrong`）、第 530 行（第 8 關）、第 587 行（第 9 關）。
3. 第 377 行（第 6 關前兩次離目標還很遠）改成 `tip('c6.wrong')`，不要用 `c6.near`。「快到了」只有差 12 度以內才是真的；`squash(flag)` 留著，不要加 `sfx('no')`。
4. `lab/water-game/game.css` 加 `#bubble.tip{background:#FFF6E6;box-shadow:0 0 0 4px rgba(242,163,58,.35)}`，用同一個琥珀色當「提示」的顏色，不要紅色。

**怎麼驗證**：`index.html?ch=4`，把「牛奶」拖進左盆，泡泡要換成「它會流動嗎？再想想。」，大約 2 秒後回到「硬硬的放 J……」；再錯一次，換成「沒關係，看看亮亮的地方。」，右盆亮起來。`?ch=6`，把拇指拖到 50 放手，泡泡要顯示「還沒到喔，看看亮亮的小旗子。」；拖到 8 放手，顯示「快到了，停在小旗子那裡。」。手機 375 和平板 768 各截一張提示出現時的畫面放進報告，確認泡泡變高時下面的關卡不會被擠到出現捲軸，也沒有 console error。

**再上一階**（直覺升級階梯最後一階「第一次互動後提示自動淡出」）：把第 4 關的 `wg-faded` 做成共用的 `fadeAfterFirst()`，用在第 2、6、8、9 關。

### 二、第 4 條「手感」（連帶第 1 條）：補上放手滑行、目標迎接、回彈

**改什麼**（只改 `lab/water-game/engine.js`、`game.css`）
1. **拖到目標上方，目標先迎一下**：`dragPick` 的 `pointermove` 在 `const t = hit(...)` 之後，加上 `if (t !== st.over) { st.over = t; if (t >= 0) nudge(targets[t]); }`（`st` 初始化時加 `over: -1`）。`nudge(el)` 寫在 engine 裡：`el.classList.remove('wg-nudge'); void el.offsetWidth; el.classList.add('wg-nudge'); setTimeout(() => el.classList.remove('wg-nudge'), 260)`。`game.css` 加 `.wg-nudge{animation:wg-nudge .24s var(--wg-back)}` 和 `@keyframes wg-nudge{0%{transform:scale(1)}40%{transform:scale(1.04,.95)}100%{transform:scale(1)}}`。用小幅度的就好，不要用 `wg-squash` 的 0.85，盆子會跳太大。
2. **彈回要有一點回彈**：`home(el)` 的 `transition` 從 `'transform .25s ease'` 改成 `'transform .32s cubic-bezier(.34,1.56,.64,1)'`，`setTimeout` 改 330ms。
3. **放手滑行**：`up` 裡面 `t < 0`（沒放到任何目標）的分支，不要馬上 `home(el)`。先用最後一幀的速度 `vx = (was.tx - was.cx) * .3 * 60`、`vy` 同理，跑一個 rAF：`x += vx*dt; vx *= Math.pow(.05, dt)`（y 一樣），畫面照樣帶傾斜；跑 160ms 或速度小於 30px/s 就停，再 `home(el)`。放到目標上的分支（`finish`）照舊，不要滑。
4. 觸控裝置上 hover 會一直黏著：把 `.wg-touch:hover` 那三條規則包進 `@media (hover:hover){ ... }`。

**怎麼驗證**：`?ch=4` 平板，拖一張卡片慢慢經過兩個盆子上方，每經過一個，盆子要輕輕壓一下（只壓一次，不會連續抖）；把卡片甩到空白處放手，要先滑一小段再彈回原位，彈回時略過頭一點再停；放進盆子仍然正常。`?ch=3` 拖冰塊進杯子，確認還會觸發。手機 375 拖曳時頁面不能被拉動。改前改後各截一張「拖到盆子上方」的畫面放進報告。

**再上一階**（互動戲階梯「物件互相影響」）：卡片放進盆子時，盆子裡已經有的小圖（`.wg-pile .wg-mini`）依序晚 40ms 各抖一下，像被擠到。

### 順手可修（不算這兩項）
- 美感：平板第 2 關 `.wg-ask` 從 96px 改成 `min(140px,16vh)`；手機第 10 關把 `game.css` 手機區 `.wg-cycle{margin-bottom:auto}` 拿掉，或把場景改大，補滿下半畫面空著的地方。
- 手機頂部進度點貼著「首頁」按鈕（`style.css` 頂列，改前就有）。改這個會動到共用的 `style.css`，要先確認只改 lab 的副本。
- 第 2 關「哪一個」的「個」讀音，請查核員確認。

## 截圖

- 改前：`/Users/yenwen/Documents/兒童互動遊戲/pipeline/shots/2026-10-31/water-before/lab_water-game/`（mobile／tablet 各 11 張；昨晚的截圖不在這台 MacBook 上）
- 改後：`/Users/yenwen/Documents/兒童互動遊戲/pipeline/shots/2026-10-31/water-after/lab_water-game/`（22 張），摘要 `water-after/summary.md`
- 互動中：`/private/tmp/claude-501/-Users-yenwen-Documents-------/00d2ba75-d4e3-42c2-9acc-b32316e21788/scratchpad/shots/`（ch2-q1、ch3-btn、ch3-float、ch4-dragging、ch4-after1、ch6-yu、ch6-end、ch7-used、ch10-u，手機與平板各一份；暫存資料夾，重要的請搬進 `pipeline/shots/2026-10-31/`）
- 回歸：`/Users/yenwen/Documents/兒童互動遊戲/pipeline/shots/2026-10-31/regress/`，摘要 `regress/summary.md`

評審親自打開看過的：改前 `tablet-ch4`、`mobile-ch2`、`tablet-ch7`、`tablet-ch3`；改後 `tablet-ch4`、`mobile-ch4`、`mobile-ch2`、`tablet-ch2`、`tablet-ch9`、`mobile-ch6`；互動中 `tablet-ch4-dragging`、`mobile-ch4-after1`、`tablet-ch7-used`、`mobile-ch6-yu`、`tablet-ch6-yu`、`mobile-ch6-end`、`mobile-ch10-u`、`tablet-ch3-btn`；回歸 `hub/tablet-day`、`hub/mobile-night`。

## 改動的檔案

建置者今晚改的（`git diff --stat -- lab/water-game`：6 個檔，+85／-43）：
- `lab/water-game/engine.js`：拖曳 lerp＋傾斜、`closed` 停迴圈、`.homing`、內部 `sfx` 改走 `G.sfx`
- `lab/water-game/app.js`：第 2 關題目圖示、第 4 關盆子圖示與說明框淡出、第 6 關前兩次不算錯
- `lab/water-game/game.css`：`wg-sway` hover、`.wg-ask`、`.wg-bi`、`#say.wg-faded`、玉山說明改成橫排（選擇器改用 `>b`、`>span`）、第 7 關鍵帽打勾
- `lab/water-game/tools/content.py`、`lab/water-game/content.js`（重新產生）：查核清單 12 條
- `lab/water-game/README.md`：「給家長」第 3、4、5、6、9 條同步

評審今晚改的：
- `pipeline/reports/2026-10-31.md`、`pipeline/reports/latest.md`（本報告）
- `lab/games.json`：water-game 的 `status`、`summary`、`nights`、`updated`

另有查核員新增的 `pipeline/ideas/2026-10-31-polish-check.md`。沒有碰正式四個遊戲、首頁、`.env`、`pipeline/state.json`；沒有 commit、沒有 push。

## 閘門：home

**可上首頁（維持在首頁上）。** 沒有阻擋；第 8 條內容正確 5（≥ 4），第 9 條效能穩定 5（= 5）。water-game 是 2026-10-30 規定前做的平面遊戲，不用第 13 條卡它。首頁入口 `hub/entries/water-game.js` 已經存在，回歸截圖也看得到，今晚不需要再加。

**打磨完成：是**（前 12 條全部 ≥ 4，最低是 1、2、4、5、10 各 4 分）。

## 追加（同日，家長要求「現在修」）：答錯提示看得到了

明晚第一項已先做完：`engine.js` 加 `tip(key)`，泡泡暫時換成提示句（琥珀底、外圈淡金），約 2 秒後換回這關說明；`app.js` 8 處答錯提示（`g.demo`、`g.no2`、`c2/c4/c8/c9.wrong`、`c6.near`、`c6.wrong`）改用 `tip()`；第 6 關前兩次離目標還遠時改說 `c6.wrong`，「快到了」只在差 12 度以內出現。
驗證：第 4 關用鍵盤放錯，手機與平板泡泡都出現「它會流動嗎？再想想。」並在 2 秒後換回，零錯誤、零橫向捲動（`pipeline/shots/2026-10-31/water-tip/mobile-ch4-tip.png`、`tablet-ch4-tip.png`）；全遊戲重跑 22/22 ok。
明晚剩下的待辦只有第二項「手感」（放手滑行、盆子迎接、回彈）。
