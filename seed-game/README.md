# 種子小偵探

給 6 歲小朋友的種子互動遊戲，約 15 分鐘玩完 7 關，再加 1 個加碼關：

1. 找種子（蘋果、芒果、松果裡面都有種子）
2. 種子怎麼來（花裡有種子寶寶 → 蜜蜂送花粉 → 種子和果實一起長 → 一起熟）
3. 種子變成樹（按 `W` 澆水、按 `S` 曬太陽）
4. 認識種子（橡實、松果、楓樹、椰子、芒果、蘋果）
5. 種子配對（這個種子會長成哪種樹？）
6. 種子去旅行（風、水、小動物）
7. 種子的一生（排順序）
8. 加碼關：最早的種子（孢子 → 種子 → 花和果實，種子比花還早出現）

**給孩子的設計**：所有字都標注音（注音在字的右邊）、答案用鍵盤 `A` `B` `C`（也可以點）、種樹用 `W` `S`、答錯不扣分只會提示。

## 開始玩

雙擊 `index.html` 就能玩（用 Chrome 或 Safari）。測試時可以用網址 `index.html?ch=3` 直接跳到第 3 關。
進度會存在瀏覽器裡，中途離開再開會問要不要「繼續上次」。

## 配音：用 VoAI（雅琪）

遊戲**只會播 VoAI 錄好的 mp3**，不會用瀏覽器內建的聲音。還沒錄配音之前，遊戲是安靜的，文字照常顯示。
金鑰只放在你電腦的 `.env`，不會進到網頁；錄好之後玩的時候不再扣點、也不用連網。

```bash
cd seed-game
cp .env.example .env            # 然後打開 .env，貼上 VOAI_API_KEY=你的金鑰
python3 tools/make_voice.py --list-speakers     # 查雅琪有哪些「風格」
```

配音員、風格、速度在 `tools/voai.config.json`（目前：雅琪／預設／速度 0.9）。如果「預設」不是雅琪的風格，
用上面指令查到的名稱改掉 `style`。然後：

```bash
python3 tools/make_voice.py --sample "嗨！我是松鼠果果。"   # 先試聽一句 → audio/_sample.mp3
python3 tools/make_voice.py --dry-run                        # 估算點數（1 字 = 1 點）
python3 tools/make_voice.py                                  # 錄全部旁白到 audio/（已錄過的會跳過）
```

- 已經錄過的句子會自動跳過；改了某一句文字，重跑只會錄那一句。
- 換配音員或風格後，用 `--force` 全部重錄。
- 試用金鑰錄出來的音檔會有浮水印／背景音樂，要用付費點數錄才乾淨。

## 修改文字

所有旁白、題目都在 `tools/content.py`。改完執行：

```bash
pip install pypinyin      # 第一次需要
python3 tools/build.py    # 自動加注音、更新 content.js 和配音清單
python3 tools/make_voice.py
```

破音字若自動注音錯了，在字後面手動指定，例如 `種[ㄓㄨㄥˋ]樹`。`{W}` 會顯示成鍵盤上的 W 鍵。
注音一律用原調（「一」「不」不變調），跟 `怎麼做成的.html` 一致。

## 檔案

| 檔案 | 用途 |
|---|---|
| `index.html` `style.css` `app.js` | 遊戲本體（七關流程、鍵盤、配音播放） |
| `art.js` | 所有插圖（手繪 SVG：種子、果實、樹、種子長大剖面圖） |
| `content.js` | 由 `build.py` 產生，不要手改 |
| `tools/` | 文字（`content.py`）、注音轉換、VoAI 配音腳本 |
| `audio/` | VoAI 錄好的 mp3 |
