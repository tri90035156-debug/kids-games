#!/bin/bash
# 「玩玩」夜間流水線：Mac mini 一鍵安裝。
# 在 Mac mini 的終端機貼這一行：
#   bash <(curl -fsSL https://wanwan.tw/pipeline/bootstrap.sh)
# 會做：裝 Homebrew/git/node/python/gh → 裝 Claude Code → 抓專案到 ~/kids-games → 登入 GitHub 與 Claude → 排每天 05:00。
# 可以重複執行，已經裝好的會跳過。
set -u
export PATH="$HOME/.local/bin:/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:$PATH"
REPO_URL="https://github.com/tri90035156-debug/kids-games.git"
DIR="$HOME/kids-games"
say() { printf '\n\033[1;32m==> %s\033[0m\n' "$*"; }
warn() { printf '\n\033[1;33m!! %s\033[0m\n' "$*"; }

say "1/7 檢查 Homebrew（第一次會要你輸入這台 Mac 的開機密碼，打字時不會顯示，打完按 Enter）"
if ! command -v brew >/dev/null; then
  /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)" || { warn "Homebrew 沒裝成功"; exit 1; }
  [ -x /opt/homebrew/bin/brew ] && eval "$(/opt/homebrew/bin/brew shellenv)"
  grep -q 'brew shellenv' "$HOME/.zprofile" 2>/dev/null || echo 'eval "$(/opt/homebrew/bin/brew shellenv)"' >> "$HOME/.zprofile"
fi
echo "   ✔ brew"

say "2/7 裝 git、node、python、gh（已有的會跳過）"
for pkg in git node python gh; do
  case $pkg in python) bin=python3;; *) bin=$pkg;; esac
  command -v "$bin" >/dev/null && echo "   ✔ $pkg" || brew install "$pkg" || { warn "$pkg 沒裝成功"; exit 1; }
done

say "3/7 裝 Claude Code"
if ! command -v claude >/dev/null; then
  curl -fsSL https://claude.ai/install.sh | bash || { warn "Claude Code 沒裝成功"; exit 1; }
  export PATH="$HOME/.local/bin:$PATH"
fi
command -v claude >/dev/null && echo "   ✔ claude $(claude --version 2>/dev/null | head -1)" || { warn "找不到 claude，請關掉終端機重開再跑一次"; exit 1; }

say "4/7 抓專案到 $DIR"
if [ -d "$DIR/.git" ]; then ( cd "$DIR" && git pull --ff-only ) && echo "   ✔ 已更新"; else git clone "$REPO_URL" "$DIR" || { warn "clone 失敗"; exit 1; }; echo "   ✔ 已下載"; fi

say "5/7 登入 GitHub（讓 Mac mini 晚上能自動 push）"
if gh auth status >/dev/null 2>&1; then echo "   ✔ 已登入 GitHub"; else
  echo "   接下來會問你幾題：GitHub.com → HTTPS → Yes（用 GitHub 登入 git）→ Login with a web browser。"
  echo "   它會給你一組八碼代碼，按 Enter 開瀏覽器，貼上代碼，登入 tri90035156-debug 這個帳號。"
  gh auth login -h github.com -p https -w || { warn "GitHub 登入沒完成，之後可再跑一次這支腳本"; }
fi
gh auth setup-git >/dev/null 2>&1 || true

say "6/7 登入 Claude（會開瀏覽器，用你平常用 Claude 的帳號登入）"
if claude -p "回答兩個字：可以" --model sonnet --max-turns 1 --output-format text 2>/dev/null | grep -q "可以"; then echo "   ✔ Claude 已登入可用"; else
  echo "   接下來畫面會進入 Claude Code。看到登入提示就照做；登入成功回到對話畫面後，打 /exit 再按 Enter 回來這裡。"
  read -r -p "   準備好按 Enter 繼續…" _
  claude --model sonnet "你好，回答兩個字：可以" || true
  claude -p "回答兩個字：可以" --model sonnet --max-turns 1 --output-format text 2>/dev/null | grep -q "可以" && echo "   ✔ Claude 已登入可用" || warn "Claude 還沒登入成功，之後在終端機打 claude 登入，再跑一次這支腳本"
fi

say "7/7 排每天 05:00 自動執行"
bash "$DIR/pipeline/install.sh" 5 0 || { warn "排程沒裝成功，看上面的錯誤訊息"; exit 1; }

say "全部完成。"
echo "   - 每天 05:00 會自動跑，報告在 $DIR/pipeline/reports/latest.md，實驗室在 https://wanwan.tw/lab/"
echo "   - 記得：系統設定 → 能源 → 關掉自動睡眠（或照上面印的 pmset 指令）。"
echo "   - 想現在就試跑一次：launchctl kickstart gui/$(id -u)/com.kidsgames.nightly"
echo "     看進度：tail -f $DIR/pipeline/logs/\$(date +%F).log"
