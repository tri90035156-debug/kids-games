#!/bin/bash
# 在 Mac mini 上一鍵安裝夜間流水線。用法：
#   bash pipeline/install.sh              （預設每天清晨 05:00）
#   bash pipeline/install.sh 23 00        （改成 23:00）
#   bash pipeline/install.sh --uninstall  （停掉排程）
set -u
REPO="$(cd "$(dirname "$0")/.." && pwd)"
LABEL="com.kidsgames.nightly"
PLIST="$HOME/Library/LaunchAgents/$LABEL.plist"
export PATH="$HOME/.local/bin:/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:$PATH"

if [ "${1:-}" = "--uninstall" ]; then
  launchctl bootout "gui/$(id -u)/$LABEL" 2>/dev/null
  rm -f "$PLIST"
  echo "已停掉每晚排程。"; exit 0
fi
HOUR="${1:-5}"; MINUTE="${2:-0}"

echo "1) 檢查工具"
for t in git node npm python3; do command -v "$t" >/dev/null && echo "   ✔ $t" || { echo "   ✘ 缺 ${t}，請先安裝（建議 brew install ${t}）"; exit 1; }; done
CLAUDE_BIN="$(command -v claude 2>/dev/null || true)"
case "$CLAUDE_BIN" in alias*|"") CLAUDE_BIN="$(type -P claude 2>/dev/null || true)";; esac
if [ -z "$CLAUDE_BIN" ]; then for c in "$HOME/.local/bin/claude" "$HOME/.claude/local/claude" /opt/homebrew/bin/claude /usr/local/bin/claude; do [ -x "$c" ] && { CLAUDE_BIN="$c"; break; }; done; fi
if [ -n "$CLAUDE_BIN" ]; then echo "   ✔ claude ($("$CLAUDE_BIN" --version 2>/dev/null | head -1)) 位置 $CLAUDE_BIN"; else
  echo "   ✘ 缺 claude。請先裝 Claude Code："; echo "      curl -fsSL https://claude.ai/install.sh | bash"; echo "      然後執行一次 claude，照畫面登入。"; exit 1; fi

echo "2) 裝試玩工具（playwright + chromium）"
( cd "$REPO/pipeline" && npm install --no-audit --no-fund >/dev/null && npx playwright install chromium >/dev/null ) && echo "   ✔ playwright" || { echo "   ✘ playwright 裝不起來"; exit 1; }

echo "3) 裝注音工具（pypinyin）"
python3 -c "import pypinyin" 2>/dev/null || python3 -m pip install --user --quiet pypinyin || python3 -m pip install --user --quiet --break-system-packages pypinyin
python3 -c "import pypinyin" 2>/dev/null && echo "   ✔ pypinyin" || echo "   △ pypinyin 沒裝成功，建置者產注音會失敗（可手動：python3 -m pip install --user pypinyin）"

echo "4) 檢查 GitHub 推送權限"
( cd "$REPO" && git ls-remote --exit-code origin >/dev/null 2>&1 ) && echo "   ✔ 連得到 origin" || echo "   △ 連不到 GitHub，晚上會推不上去（先手動 git push 一次把登入存進鑰匙圈）"

echo "5) 檢查 claude 能無人值守跑"
( cd "$REPO" && claude -p "回答兩個字：可以" --model sonnet --max-turns 1 --output-format text 2>&1 | tail -1 ) || echo "   △ claude -p 沒回應，請先在終端機跑一次 claude 登入"

echo "6) 排程 launchd：每天 $(printf '%02d:%02d' "$HOUR" "$MINUTE")"
mkdir -p "$HOME/Library/LaunchAgents" "$REPO/pipeline/logs"
sed -e "s#__REPO__#$REPO#g" -e "s#__HOME__#$HOME#g" -e "s#__HOUR__#$HOUR#g" -e "s#__MINUTE__#$MINUTE#g" -e "s#__CLAUDE_BIN__#$CLAUDE_BIN#g" "$REPO/pipeline/com.kidsgames.nightly.plist" > "$PLIST"
launchctl bootout "gui/$(id -u)/$LABEL" 2>/dev/null
launchctl bootstrap "gui/$(id -u)" "$PLIST" && echo "   ✔ 已排程 $PLIST" || { echo "   ✘ launchctl 失敗"; exit 1; }
echo "7) 用排程的環境演練一次（不跑 claude，只檢查找不找得到）"
( env -i HOME="$HOME" PATH="$HOME/.local/bin:/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin" CLAUDE_BIN="$CLAUDE_BIN" NIGHTLY_DRY=1 bash "$REPO/pipeline/run_nightly.sh" ) && tail -3 "$REPO/pipeline/logs/$(date +%F).log" | sed 's/^/   /' || { echo "   ✘ 演練失敗，看 pipeline/logs/$(date +%F).log"; tail -5 "$REPO/pipeline/logs/$(date +%F).log" | sed 's/^/   /'; }

echo
echo "完成。建議再做兩件事："
echo "  - 系統設定 → 能源：關掉「自動睡眠」，或在終端機執行："
WAKE=$(( (10#$HOUR * 60 + 10#$MINUTE - 5 + 1440) % 1440 ))
echo "      sudo pmset repeat wakeorpoweron MTWRFSU $(printf '%02d:%02d:00' $(( WAKE / 60 )) $(( WAKE % 60 )))    （每天提前 5 分鐘喚醒）"
echo "  - 現在就試跑一次（看 pipeline/logs/ 的 log）："
echo "      launchctl kickstart gui/$(id -u)/$LABEL"
