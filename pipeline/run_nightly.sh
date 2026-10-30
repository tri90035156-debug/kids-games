#!/bin/bash
# 夜間流水線：launchd 每晚呼叫這支。拉最新、跑 claude 總指揮、掃金鑰、推上線、留 log。
# 手動試跑：bash pipeline/run_nightly.sh            （完整一輪）
#           NIGHTLY_DRY=1 bash pipeline/run_nightly.sh （只檢查環境，不跑 claude）
set -u
REPO="$(cd "$(dirname "$0")/.." && pwd)"
cd "$REPO" || exit 1
export PATH="$HOME/.local/bin:/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:$PATH"
export LANG="${LANG:-zh_TW.UTF-8}"
mkdir -p pipeline/logs
DATE="$(date +%F)"
LOG="pipeline/logs/$DATE.log"
exec >>"$LOG" 2>&1
echo "=== $(date '+%F %T') 夜間流水線開始 ==="

fail() { echo "!! $*"; echo "=== $(date '+%F %T') 中止 ==="; exit 1; }

# claude 的位置：安裝時 install.sh 會把它寫進 plist 的 CLAUDE_BIN；找不到再翻常見位置
CLAUDE="${CLAUDE_BIN:-}"
[ -n "$CLAUDE" ] && [ -x "$CLAUDE" ] || CLAUDE="$(command -v claude 2>/dev/null || true)"
if [ -z "$CLAUDE" ]; then
  for c in "$HOME/.local/bin/claude" "$HOME/.claude/local/claude" "$HOME/.claude/local/node_modules/.bin/claude" \
           /opt/homebrew/bin/claude /usr/local/bin/claude "$HOME/.npm-global/bin/claude" "$HOME/.volta/bin/claude" \
           "$(ls -d "$HOME"/.nvm/versions/node/*/bin/claude 2>/dev/null | tail -1)"; do
    [ -n "$c" ] && [ -x "$c" ] && { CLAUDE="$c"; break; }
  done
fi
[ -n "$CLAUDE" ] || fail "找不到 claude 指令（在終端機打 which claude 看它在哪，再重跑 pipeline/install.sh）"
echo "claude 位置：$CLAUDE"
command -v node >/dev/null || fail "找不到 node"
command -v python3 >/dev/null || fail "找不到 python3"
[ -d pipeline/node_modules/playwright ] || fail "pipeline/node_modules 沒有 playwright（先跑 pipeline/install.sh）"

# 工作區要乾淨，才不會把半成品或別人的改動混進去。
# 例外：昨晚沒做完、留在 lab/ 或 pipeline/ 的「未追蹤」檔案，搬到 pipeline/_abandoned/ 收著（不上線），今晚照跑。
LEFT="$(git status --porcelain -uall | grep -E '^\?\? (lab/|pipeline/)' | cut -c4- || true)"
if [ -n "$LEFT" ]; then
  KEEP="pipeline/_abandoned/${DATE}-殘留"; mkdir -p "$KEEP"
  echo "昨晚的半成品搬到 $KEEP："
  while IFS= read -r f; do
    [ -n "$f" ] || continue
    echo "  $f"
    mkdir -p "$KEEP/$(dirname "$f")"
    mv "$f" "$KEEP/$(dirname "$f")/"
  done <<<"$LEFT"
  find lab pipeline/ideas -mindepth 1 -type d -empty -delete 2>/dev/null || true
fi
if [ -n "$(git status --porcelain)" ]; then
  git status --porcelain | head -20
  fail "工作區不乾淨，今晚不跑（請先 commit 或還原）"
fi
git pull --ff-only || fail "git pull 失敗（網路或分支分岔）"
BEFORE="$(git rev-parse HEAD)"

if [ "${NIGHTLY_DRY:-0}" = "1" ]; then echo "環境都在，DRY 模式結束"; exit 0; fi

MODEL="${NIGHTLY_MODEL:-fable}"
MAX_HOURS="${NIGHTLY_MAX_HOURS:-3}"
PROMPT="$(cat pipeline/NIGHTLY.md)"

# 無人模式下，claude 預設只等背景子代理 10 分鐘就砍掉（第一晚 builder 就是這樣被中斷的）。
# 設成 0 = 一直等；真正的上限交給下面的 watchdog。
export CLAUDE_CODE_PRINT_BG_WAIT_CEILING_MS=0

echo "--- claude 開始（model=${MODEL}，上限 ${MAX_HOURS} 小時）"
# caffeinate：跑的時候不讓 Mac 睡著。後面的 watchdog 時間到就殺掉，避免卡一整夜。
caffeinate -i "$CLAUDE" -p "$PROMPT" \
  --model "$MODEL" \
  --permission-mode acceptEdits \
  --max-turns 600 \
  --output-format text \
  --allowedTools \
    "Read" "Write" "Edit" "MultiEdit" "Glob" "Grep" "Agent" "WebSearch" "WebFetch" "TodoWrite" \
    "Bash(date*)" "Bash(ls*)" "Bash(cat *)" "Bash(head *)" "Bash(tail *)" "Bash(wc *)" "Bash(grep *)" \
    "Bash(find *)" "Bash(diff *)" "Bash(mkdir *)" "Bash(cp *)" "Bash(mv *)" "Bash(touch *)" \
    "Bash(python3 *)" "Bash(node *)" "Bash(npm run *)" \
    "Bash(git status*)" "Bash(git log*)" "Bash(git diff*)" "Bash(git show*)" "Bash(git add *)" "Bash(git commit *)" \
  --disallowedTools \
    "Bash(rm *)" "Bash(sudo *)" "Bash(curl *)" "Bash(wget *)" \
    "Bash(git push*)" "Bash(git reset*)" "Bash(git checkout *)" "Bash(git clean*)" "Bash(git stash*)" "Bash(git rebase*)" \
  &
CPID=$!
( sleep $(( MAX_HOURS * 3600 )); if kill -0 "$CPID" 2>/dev/null; then echo "!! 超過 ${MAX_HOURS} 小時，強制結束"; kill "$CPID"; fi ) &
WPID=$!
wait "$CPID"; RC=$?
kill "$WPID" 2>/dev/null
echo "--- claude 結束（exit ${RC}）"

# 收尾：沒 commit 的殘留一律不推（但保留在硬碟給人看）
if [ -n "$(git status --porcelain)" ]; then
  echo "注意：有未 commit 的檔案（保留在硬碟，不會上線）："; git status --porcelain | head -30
fi

AFTER="$(git rev-parse HEAD)"
if [ "$BEFORE" = "$AFTER" ]; then echo "今晚沒有新的 commit，不推。"; echo "=== $(date '+%F %T') 結束 ==="; exit 0; fi

# 推之前：只允許 lab/ 與 pipeline/ 的變動；掃金鑰；.env 絕不能在裡面
CHANGED="$(git diff --name-only "$BEFORE" "$AFTER")"
echo "$CHANGED"
if echo "$CHANGED" | grep -vE '^(lab/|pipeline/)' | grep -q .; then
  echo "$CHANGED" | grep -vE '^(lab/|pipeline/)'
  fail "有 lab/、pipeline/ 以外的檔案被改到，不推。請人工檢查後自己 push 或 reset。"
fi
if echo "$CHANGED" | grep -qE '(^|/)\.env($|\.)' ; then fail "有 .env 被 commit，不推！請人工處理。"; fi
if git diff "$BEFORE" "$AFTER" | grep -E '^\+' | grep -qiE 'sk-[A-Za-z0-9]{10,}|api[_-]?key["'"'"' ]*[:=]["'"'"' ]*[A-Za-z0-9_-]{16,}|x-api-key:'; then
  fail "新增的內容裡疑似有金鑰，不推。請人工檢查。"
fi

git push origin HEAD || fail "git push 失敗（Mac mini 的 GitHub 登入可能過期）"
echo "已推上線：$BEFORE -> $AFTER"
echo "--- 給家長的報告："
sed -n '1,12p' pipeline/reports/latest.md 2>/dev/null
echo "=== $(date '+%F %T') 結束 ==="
