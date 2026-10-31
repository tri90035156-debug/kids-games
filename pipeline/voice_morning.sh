#!/bin/bash
# 早上的錄音班（跑在有金鑰的那台電腦，目前是家長的 MacBook）。
# Mac mini 清晨 05:00 做好遊戲、推上 GitHub 之後，這支把還沒錄的旁白錄起來、commit、推上線。
# 用獨立的一份 repo（~/.kids-games/repo），不碰家長平常在改的資料夾。
# 手動試跑：bash pipeline/voice_morning.sh     只算點數：VOICE_DRY=1 bash pipeline/voice_morning.sh
set -u
export PATH="/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:$PATH"
export LANG="${LANG:-zh_TW.UTF-8}"
HOMEDIR="$HOME/.kids-games"
REPO="$HOMEDIR/repo"
mkdir -p "$HOMEDIR/logs"
LOG="$HOMEDIR/logs/$(date +%F).log"
exec >>"$LOG" 2>&1
echo "=== $(date '+%F %T') 錄音班開始 ==="
fail() { echo "!! $*"; echo "=== $(date '+%F %T') 中止 ==="; exit 1; }

# 金鑰檔：plist 會設 KIDS_KEYS_FILE（家長 MacBook 上就是原本放 VoAI／ElevenLabs 金鑰的那個 .env），不另外複製
KEYS="${KIDS_KEYS_FILE:-$HOMEDIR/keys.env}"
head -c1 "$KEYS" >/dev/null 2>&1 || fail "讀不到金鑰檔 ${KEYS}（不存在，或 macOS 不讓排程讀「文件」資料夾）"
if [ ! -d "$REPO/.git" ]; then
  git clone -q https://github.com/tri90035156-debug/kids-games.git "$REPO" || fail "git clone 失敗"
fi
cd "$REPO" || fail "進不去 $REPO"
git checkout -q main 2>/dev/null
[ -z "$(git status --porcelain)" ] || { git status --porcelain | head; fail "錄音用的 repo 不乾淨"; }
git pull -q --ff-only || fail "git pull 失敗"
[ -f pipeline/PAUSED ] && { echo "流水線暫停中（pipeline/PAUSED），不錄。"; echo "=== $(date '+%F %T') 結束 ==="; exit 0; }

if [ "${VOICE_DRY:-0}" = "1" ]; then python3 -I pipeline/record_voice.py --dry-run; exit 0; fi
KIDS_KEYS_FILE="$KEYS" python3 -I pipeline/record_voice.py || fail "錄音失敗"

NEW="$(git -c core.quotePath=false status --porcelain -uall | grep -E '^\?\? lab/[^/]+/audio/[0-9a-f]+\.mp3$' | cut -c4-)"
if [ -z "$NEW" ]; then echo "沒有新錄的音檔，不推。"; echo "=== $(date '+%F %T') 結束 ==="; exit 0; fi
# 只加音檔，其他任何改動都不碰
while IFS= read -r f; do git add -- "$f"; done <<<"$NEW"
GAMES="$(echo "$NEW" | cut -d/ -f2 | sort -u | tr '\n' ' ')"
git commit -q -m "錄音：${GAMES}補上旁白（VoAI 中文、ElevenLabs 英文）" || fail "commit 失敗"
git fetch -q origin main && git rebase -q origin/main || { git rebase --abort 2>/dev/null; fail "rebase 衝突，沒推"; }
git push -q origin HEAD:main || fail "git push 失敗"
echo "已推上線：$(git log --oneline -1)"
echo "=== $(date '+%F %T') 結束 ==="
