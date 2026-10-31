#!/bin/bash
# 在「有金鑰的電腦」（家長的 MacBook）裝早上的錄音班：每天 08:30 跑 voice_morning.sh。
# 那時 Mac 若在睡覺，launchd 會在醒來後補跑一次。
#   安裝／改時間：bash pipeline/install_voice.sh [時] [分]
#   移除：        bash pipeline/install_voice.sh --uninstall
set -eu
LABEL=com.kidsgames.voice
PLIST="$HOME/Library/LaunchAgents/$LABEL.plist"
HOMEDIR="$HOME/.kids-games"
if [ "${1:-}" = "--uninstall" ]; then
  launchctl bootout "gui/$(id -u)/$LABEL" 2>/dev/null || true
  rm -f "$PLIST"; echo "已移除錄音班"; exit 0
fi
H="${1:-8}"; M="${2:-30}"
# 金鑰：macOS 不讓排程讀「文件」資料夾，所以由家長親手執行這支時，
# 把 seed-game/.env 裡的兩把金鑰（VOAI_API_KEY、ELEVENLABS_API_KEY）存一份到 ~/.kids-games/keys.env（只有自己讀得到）。
# 不會印出金鑰內容。已經有這個檔就不動它。
mkdir -p "$HOMEDIR" "$HOME/Library/LaunchAgents"; chmod 700 "$HOMEDIR"
KEYS="${KIDS_KEYS_FILE:-$HOMEDIR/keys.env}"
SRC="$(cd "$(dirname "$0")/.." && pwd)/seed-game/.env"
if [ ! -s "$KEYS" ]; then
  [ -r "$SRC" ] || { echo "找不到 ${SRC}，沒辦法建立金鑰檔"; exit 1; }
  ( umask 077; grep -E '^(VOAI_API_KEY|ELEVENLABS_API_KEY)=' "$SRC" > "$KEYS" )
  echo "已建立金鑰檔 ${KEYS}（只有你的帳號讀得到），裡面有：$(cut -d= -f1 "$KEYS" | tr '\n' ' ')"
fi
chmod 600 "$KEYS"
# 腳本複製一份到 ~/.kids-games（launchd 讀不到「文件」資料夾裡的檔案）
cp "$(cd "$(dirname "$0")" && pwd)/voice_morning.sh" "$HOMEDIR/voice_morning.sh"
cat >"$PLIST" <<EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0"><dict>
  <key>Label</key><string>$LABEL</string>
  <key>ProgramArguments</key><array><string>/bin/bash</string><string>$HOMEDIR/voice_morning.sh</string></array>
  <key>EnvironmentVariables</key><dict><key>KIDS_KEYS_FILE</key><string>$KEYS</string></dict>
  <key>StartCalendarInterval</key><dict><key>Hour</key><integer>$H</integer><key>Minute</key><integer>$M</integer></dict>
  <key>StandardOutPath</key><string>$HOMEDIR/logs/launchd.out</string>
  <key>StandardErrorPath</key><string>$HOMEDIR/logs/launchd.err</string>
</dict></plist>
EOF
mkdir -p "$HOMEDIR/logs"
launchctl bootout "gui/$(id -u)/$LABEL" 2>/dev/null || true
launchctl bootstrap "gui/$(id -u)" "$PLIST"
launchctl kickstart "gui/$(id -u)/$LABEL" 2>/dev/null || true   # 裝好先試跑一次
echo "錄音班已排好：每天 $(printf %02d:%02d "$H" "$M")（log 在 $HOMEDIR/logs/）"
