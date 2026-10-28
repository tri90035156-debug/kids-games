# -*- coding: utf-8 -*-
"""用 VoAI API 把遊戲裡的每一句旁白錄成 mp3，放進 audio/ 資料夾。

金鑰只放在你電腦上的 .env（或環境變數 VOAI_API_KEY），不會被放進網頁。
遊戲播放的是錄好的 mp3，所以玩的時候不會再扣點，也不用連網。

常用指令（都在 seed-game 資料夾裡執行）：
    python3 tools/make_voice.py --list-speakers      看有哪些配音員、風格
    python3 tools/make_voice.py --sample "嗨！我是松鼠果果。"    先試聽一句（存成 audio/_sample.mp3）
    python3 tools/make_voice.py --dry-run            只估算要用幾點，不呼叫 API
    python3 tools/make_voice.py                      錄全部（已經有的會跳過）
    python3 tools/make_voice.py --force              全部重錄（換配音員之後用）

配音員、風格、速度寫在 tools/voai.config.json。
"""
import argparse
import json
import os
import sys
import time
import urllib.error
import urllib.request

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
AUDIO = os.environ.get('VOAI_AUDIO_DIR') or os.path.join(ROOT, 'audio')
BASE = os.environ.get('VOAI_BASE_URL', 'https://connect.voai.ai').rstrip('/')


def load_env():
    """讀 seed-game/.env（KEY=VALUE 每行一個）。"""
    path = os.path.join(ROOT, '.env')
    if not os.path.exists(path):
        return
    with open(path, encoding='utf-8') as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith('#') or '=' not in line:
                continue
            k, v = line.split('=', 1)
            os.environ.setdefault(k.strip(), v.strip().strip('"').strip("'"))


def load_config():
    path = os.path.join(HERE, 'voai.config.json')
    with open(path, encoding='utf-8') as f:
        return json.load(f)


def call(method, path, key, body=None, accept_audio=False):
    data = json.dumps(body, ensure_ascii=False).encode('utf-8') if body is not None else None
    headers = {'x-api-key': key}
    if body is not None:
        headers['Content-Type'] = 'application/json'
    if accept_audio:
        headers['x-output-format'] = 'mp3'
    req = urllib.request.Request(BASE + path, data=data, headers=headers, method=method)
    for attempt in range(6):
        try:
            with urllib.request.urlopen(req, timeout=90) as r:
                return r.read(), r.headers.get('Content-Type', '')
        except urllib.error.HTTPError as e:
            msg = e.read().decode('utf-8', 'replace')[:300]
            if e.code == 529:                        # 同時請求太多，照 Retry-After 等一下再試
                wait = float(e.headers.get('Retry-After') or 2)
                print('   請求太多，等 %.0f 秒再試…' % wait)
                time.sleep(wait)
                continue
            if e.code == 401:
                sys.exit('API Key 不正確或已過期（HTTP 401）。請檢查 .env 裡的 VOAI_API_KEY。')
            sys.exit('VoAI 回應錯誤 HTTP %d：%s' % (e.code, msg))
        except urllib.error.URLError as e:
            sys.exit('連不上 VoAI：%s' % e.reason)
    sys.exit('重試多次仍失敗（HTTP 529），請稍後再試。')


def need_key():
    key = os.environ.get('VOAI_API_KEY', '').strip()
    if not key:
        sys.exit('找不到 API Key。請在 seed-game/.env 寫一行：\n    VOAI_API_KEY=你的金鑰\n'
                 '（金鑰在 app.voai.ai 右上角帳號 → API Key 管理）')
    return key


def tts(key, cfg, text):
    body = {
        'version': cfg.get('version', 'Sota+'),
        'text': text,
        'speaker': cfg['speaker'],
        'style': cfg['style'],
        'speed': cfg.get('speed', 1.0),
    }
    if cfg.get('pitch_shift'):
        body['pitch_shift'] = cfg['pitch_shift']
    if cfg.get('breath_pause'):
        body['breath_pause'] = cfg['breath_pause']
    data, ctype = call('POST', '/TTS/Speech', key, body, accept_audio=True)
    if 'json' in ctype.lower() or data[:1] == b'{':
        sys.exit('VoAI 回傳的不是音檔：%s' % data[:300].decode('utf-8', 'replace'))
    return data


def write_atomic(path, data):
    tmp = path + '.part'
    with open(tmp, 'wb') as f:
        f.write(data)
    os.replace(tmp, path)


def main():
    ap = argparse.ArgumentParser(description='用 VoAI 錄製遊戲旁白')
    ap.add_argument('--list-speakers', action='store_true')
    ap.add_argument('--sample', metavar='文字')
    ap.add_argument('--dry-run', action='store_true')
    ap.add_argument('--force', action='store_true')
    ap.add_argument('--style', metavar='風格', help='暫時改用這個風格（試聽比較用）')
    args = ap.parse_args()

    load_env()
    cfg = load_config()
    if args.style:
        cfg['style'] = args.style

    narr_path = os.path.join(HERE, 'narration.json')
    if not os.path.exists(narr_path):
        sys.exit('找不到 tools/narration.json，請先執行：python3 tools/build.py')
    with open(narr_path, encoding='utf-8') as f:
        narr = json.load(f)

    if args.dry_run:
        todo = [n for n in narr if args.force or not os.path.exists(os.path.join(AUDIO, n['id'] + '.mp3'))]
        chars = sum(len(n['text']) for n in todo)
        print('共 %d 句，還需要錄 %d 句、%d 字，約用 %d 點。' % (len(narr), len(todo), chars, chars))
        print('配音員：%s／風格：%s／模型：%s／速度：%s' % (cfg['speaker'], cfg['style'], cfg.get('version', 'Sota+'), cfg.get('speed', 1.0)))
        return

    key = need_key()

    if args.list_speakers:
        data, _ = call('GET', '/TTS/GetSpeaker', key)
        info = json.loads(data.decode('utf-8'))
        for m in (info.get('data') or info).get('models', []):
            print('== 模型 %s %s' % ((m.get('info') or {}).get('version', ''), (m.get('info') or {}).get('remark') or ''))
            for s in m.get('speakers') or []:
                print('  %-6s %s %s歲  聲線:%s  風格:%s' % (s.get('name'), s.get('gender') or '', s.get('age') or '?',
                                                          s.get('category') or '', '、'.join(s.get('styles') or [])))
        return

    os.makedirs(AUDIO, exist_ok=True)

    if args.sample:
        out = os.path.join(AUDIO, '_sample_%s.mp3' % cfg['style'])
        write_atomic(out, tts(key, cfg, args.sample))
        print('已存成', out, '（用 %s／%s）' % (cfg['speaker'], cfg['style']))
        return

    done = skipped = 0
    for i, n in enumerate(narr, 1):
        out = os.path.join(AUDIO, n['id'] + '.mp3')
        if os.path.exists(out) and not args.force:
            skipped += 1
            continue
        print('[%d/%d] %s' % (i, len(narr), n['text']))
        write_atomic(out, tts(key, cfg, n['text']))
        done += 1
    print('\n完成：新錄 %d 句，跳過 %d 句（已存在）。檔案在 %s' % (done, skipped, AUDIO))


if __name__ == '__main__':
    main()
