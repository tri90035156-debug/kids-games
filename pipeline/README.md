# 夜間自動流水線（給家長看的說明）

每天清晨 05:00，Mac mini 上的 Claude Code 自己跑一輪：
**研究（Sonnet）→ 查核（Opus）→ 建置（Opus）→ 試玩（Sonnet＋Playwright）→ 最後評審（Fable）→ 上傳**。
通過評審的新遊戲**當晚就出現在首頁**（https://wanwan.tw/ 多一個 3D 小物件入口），隔天晚上再照評審的清單修正、優化。
遊戲檔案放在 `lab/`，首頁只多一個入口檔；首頁主程式與四個正式遊戲不會被動到。

## 一、Mac mini 第一次安裝（一步一步）

最快的方法：在 Mac mini 的「終端機」貼這一行，照畫面提示登入三次（Mac 密碼、GitHub、Claude）就好：
```bash
bash <(curl -fsSL https://wanwan.tw/pipeline/bootstrap.sh)
```
它會做完下面 1～5 步。想手動做的話：


1. 裝好 Homebrew、`git`、`node`、`python3`（沒有的話：`brew install git node python`）。
2. 裝 Claude Code 並登入：
   ```bash
   curl -fsSL https://claude.ai/install.sh | bash
   ```
   然後在終端機打 `claude`，照畫面用你的帳號登入一次（之後無人值守就靠這次登入）。
3. 把專案抓下來，並手動推一次讓 GitHub 登入存進鑰匙圈：
   ```bash
   git clone https://github.com/tri90035156-debug/kids-games.git ~/kids-games
   cd ~/kids-games && git push
   ```
4. 一鍵安裝（會裝 Playwright、注音工具，並排每天清晨 05:00）：
   ```bash
   bash ~/kids-games/pipeline/install.sh
   ```
   想改時間：`bash pipeline/install.sh 23 00`。停掉：`bash pipeline/install.sh --uninstall`。
5. 不讓 Mac mini 睡著：系統設定 → 能源 → 關掉自動睡眠；或照 install.sh 最後印出的 `pmset` 指令讓它每天 04:55 自動喚醒。
6. 現在就試跑一次看看（不用等到清晨）：
   ```bash
   launchctl kickstart gui/$(id -u)/com.kidsgames.nightly
   ```
   看進度：`tail -f ~/kids-games/pipeline/logs/$(date +%F).log`。

## 二、每天早上看什麼

- **直接玩**：開 https://wanwan.tw/ ，首頁多了一個入口就是昨晚的新遊戲（數字鍵 5、6、7… 也能進）。
- **一句話版**：https://wanwan.tw/lab/ 每張卡片有狀態與評審的一句話。
- **完整報告**：`pipeline/reports/latest.md`（GitHub 上直接看得到），第一段就是「給家長的三句話」。

## 二之一、指定今晚要做什麼（家長點題）

孩子有想學的主題，就寫進 `pipeline/requests.md`（照裡面的格式，狀態寫「待做」）再 `git push`。
下一個「建新遊戲」的晚上會先做這一題、不另外找點子；做完狀態會自動改成「已做」。

## 三、不想要某個遊戲出現在首頁

把 `hub/entries.json` 裡那一行（例如 `"water-game"`）刪掉、`git push` 就好；遊戲檔案與入口檔都還在，想放回來再加回那一行。
首頁入口的順序＝這個檔案的順序＝數字鍵的順序。

## 四、流水線怎麼運作

| 檔案 | 做什麼 |
|---|---|
| `pipeline/NIGHTLY.md` | 總指揮（Fable）的任務書：流程、鐵律、閘門 |
| `pipeline/PRINCIPLES.md` | 設計語彙＋3D 黏土遊戲做法＋13 條檢查原則＋升級階梯＋閘門 |
| `.claude/agents/*.md` | 五個角色：scout（Sonnet）、verifier（Opus）、builder（Opus）、tester（Sonnet）、judge（Fable） |
| `pipeline/playtest.mjs` | Playwright 試玩：每關手機／平板截圖、抓錯誤與橫向捲動 |
| `pipeline/run_nightly.sh` | launchd 呼叫的腳本：pull → claude → 掃金鑰 → push → log |
| `pipeline/install.sh`、`com.kidsgames.nightly.plist` | 安裝與排程（預設每天 05:00） |
| `pipeline/state.json` | 今晚是「建新遊戲」還是「打磨」；目前在做哪一個 |
| `pipeline/ideas/`、`pipeline/reports/` | 每晚的點子檔與報告（會上 GitHub） |
| `pipeline/shots/`、`pipeline/logs/` | 截圖與 log（只留在 Mac mini） |
| `lab/` | 新遊戲的檔案與 `games.json` 清單（實驗室頁） |
| `hub/entries/`、`hub/entries.json` | 首頁入口：一個遊戲一個檔（名字、顏色、徽章、3D 小物件），清單決定順序 |

**新遊戲長什麼樣**：2026-10-30 起一律像首頁那樣的 3D 黏土小世界（three.js）：東西有重量、會被推、會倒、會彈，孩子的手在推、疊、滾、倒，而不是點平面的圖。之前做的四個正式遊戲與《小水滴變變變》是平面的，維持原樣。

**兩晚一循環**：第一晚建新遊戲 → 通過閘門當晚就上首頁；之後每晚只修評審挑出的「兩項＋阻擋」；13 項全部 ≥ 4 分（或打磨滿三晚）就算打磨完成，開始下一個新遊戲。

## 五、安全設計

- Claude 只拿到白名單指令，`rm`、`git push`、`git reset`、`curl`、`sudo` 一律擋掉；push 由外面的腳本做，推之前掃金鑰、確認只動到 `lab/`、`pipeline/`、`hub/entries/`。
- 不錄配音（VoAI 要錢）、不碰 `.env`、不改正式遊戲與首頁主程式（首頁只能多一個入口檔）。
- 每晚最多 3 小時，時間到強制結束；工作區不乾淨就不跑。
- 用量：一晚大約是 Fable 總指揮＋Opus 建置 1～2 小時的用量。如果方案額度吃緊，`NIGHTLY_MODEL=opus` 可以把總指揮換成 Opus（在 plist 的 EnvironmentVariables 加一行）。

## 六、本機先試試試玩腳本

```bash
cd pipeline && npm install && npx playwright install chromium && cd ..
node pipeline/playtest.mjs --all --levels 3
```

## 七、接自訂網域（買好網域後做一次）

網站叫「玩玩」，網域 `wanwan.tw`。GitHub Pages 本來就支援自訂網域，不用換主機：

1. 在網域商的 DNS 設定加這幾筆（照抄）：
   | 類型 | 名稱 | 值 |
   |---|---|---|
   | A | `@` | `185.199.108.153` |
   | A | `@` | `185.199.109.153` |
   | A | `@` | `185.199.110.153` |
   | A | `@` | `185.199.111.153` |
   | CNAME | `www` | `tri90035156-debug.github.io` |
2. 專案根目錄的 `CNAME` 檔（內容一行 `wanwan.tw`）已經準備好，DNS 填完再 push 上去。
3. GitHub 網頁 → repo `kids-games` → Settings → Pages → Custom domain 填 `wanwan.tw` → Save；等 DNS 檢查打勾後勾 **Enforce HTTPS**（通常 10 分鐘到 1 小時）。
4. 之後網址就是 https://wanwan.tw/ ，實驗室是 https://wanwan.tw/lab/ 。舊網址會自動轉過來。

注意：接了自訂網域後，網站從「網域根目錄」出，所有遊戲用的都是相對路徑，不用改程式。
