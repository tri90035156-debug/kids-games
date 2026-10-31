# -*- coding: utf-8 -*-
"""流水線的錄音步驟：把 lab/<遊戲>/tools/narration.json 裡還沒錄的句子錄成 audio/<id>.mp3。

- 中文句子用 VoAI（照該遊戲 tools/voai.config.json，沒有就用雅琪／聊天／0.9）。
- 英文句子用 ElevenLabs：句子的 key 以 "en." 開頭，或該筆寫 "voice": "en"。
- 金鑰只從 KIDS_KEYS_FILE（預設 ~/.kids-games/keys.env）讀，絕不印出、不寫進 repo。
  檔案裡兩行：VOAI_API_KEY=…、ELEVENLABS_API_KEY=…
- 每次執行有點數上限（VoAI 字數、ElevenLabs 字元數），超過就停，剩下的下次再錄。
- 這支由外面的腳本（不是 claude）執行，所以 AI 本身碰不到金鑰。

    python3 pipeline/record_voice.py --dry-run     只算要用幾點
    python3 pipeline/record_voice.py               錄（已經有的跳過）
"""
import argparse
import glob
import json
import os
import sys
import time
import urllib.error
import urllib.request

REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
KEYS = os.path.expanduser(os.environ.get('KIDS_KEYS_FILE', '~/.kids-games/keys.env'))
VOAI_BASE = 'https://connect.voai.ai'
VOAI_DEFAULT = {'version': 'Sota+', 'speaker': '雅琪', 'style': '聊天', 'speed': 0.9}
# Matilda：美式、清楚、教學用女聲（和中文的雅琪一樣是女聲）
EL_VOICE = os.environ.get('ELEVENLABS_VOICE_ID', 'XrExE9yKIg1WjnnlVkGX')
EL_MODEL = os.environ.get('ELEVENLABS_MODEL', 'eleven_multilingual_v2')


def load_keys():
    keys = {}
    if os.path.exists(KEYS):
        for line in open(KEYS, encoding='utf-8'):
            line = line.strip()
            if line and not line.startswith('#') and '=' in line:
                k, v = line.split('=', 1)
                keys[k.strip()] = v.strip().strip('"').strip("'")
    return keys


def post(url, headers, body, tries=6):
    data = json.dumps(body, ensure_ascii=False).encode('utf-8')
    req = urllib.request.Request(url, data=data, headers=dict(headers, **{'Content-Type': 'application/json'}), method='POST')
    for _ in range(tries):
        try:
            with urllib.request.urlopen(req, timeout=90) as r:
                return r.read(), r.headers.get('Content-Type', '')
        except urllib.error.HTTPError as e:
            if e.code in (429, 529):
                time.sleep(float(e.headers.get('Retry-After') or 3))
                continue
            raise SystemExit('錄音服務回應 HTTP %d：%s' % (e.code, e.read().decode('utf-8', 'replace')[:200]))
        except urllib.error.URLError as e:
            raise SystemExit('連不上錄音服務：%s' % e.reason)
    raise SystemExit('重試多次仍失敗')


def voai(key, cfg, text):
    body = {k: cfg[k] for k in ('version', 'speaker', 'style', 'speed') if k in cfg}
    body['text'] = text
    data, ctype = post(VOAI_BASE + '/TTS/Speech', {'x-api-key': key, 'x-output-format': 'mp3'}, body)
    if 'json' in ctype.lower() or data[:1] == b'{':
        raise SystemExit('VoAI 回傳的不是音檔：%s' % data[:200].decode('utf-8', 'replace'))
    return data


def eleven(key, text):
    url = 'https://api.elevenlabs.io/v1/text-to-speech/%s?output_format=mp3_44100_128' % EL_VOICE
    data, ctype = post(url, {'xi-api-key': key, 'Accept': 'audio/mpeg'}, {'text': text, 'model_id': EL_MODEL})
    if 'json' in ctype.lower():
        raise SystemExit('ElevenLabs 回傳的不是音檔：%s' % data[:200].decode('utf-8', 'replace'))
    return data


def is_en(n):
    return n.get('voice') == 'en' or str(n.get('key', '')).startswith('en.')


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--dry-run', action='store_true')
    ap.add_argument('--max-voai', type=int, default=int(os.environ.get('VOICE_MAX_VOAI', 1000)), help='這次最多用幾個 VoAI 字')
    ap.add_argument('--max-el', type=int, default=int(os.environ.get('VOICE_MAX_EL', 300)), help='這次最多用幾個 ElevenLabs 字元')
    ap.add_argument('--games', nargs='*', help='只錄這幾個資料夾（預設 lab/*）')
    a = ap.parse_args()

    dirs = a.games or sorted(glob.glob(os.path.join(REPO, 'lab', '*')))
    jobs = []
    for d in dirs:
        d = os.path.join(REPO, d) if not os.path.isabs(d) else d
        narr_path = os.path.join(d, 'tools', 'narration.json')
        if not os.path.exists(narr_path):
            continue
        narr = json.load(open(narr_path, encoding='utf-8'))
        cfg_path = os.path.join(d, 'tools', 'voai.config.json')
        cfg = dict(VOAI_DEFAULT, **(json.load(open(cfg_path, encoding='utf-8')) if os.path.exists(cfg_path) else {}))
        for n in narr:
            out = os.path.join(d, 'audio', n['id'] + '.mp3')
            if not os.path.exists(out) and n.get('text', '').strip():
                jobs.append((d, n, cfg, out))

    zh = [j for j in jobs if not is_en(j[1])]
    en = [j for j in jobs if is_en(j[1])]
    zc = sum(len(j[1]['text']) for j in zh)
    ec = sum(len(j[1]['text']) for j in en)
    print('要錄：中文 %d 句 %d 字（VoAI 約 %d 點，上限 %d）；英文 %d 句 %d 字元（ElevenLabs，上限 %d）'
          % (len(zh), zc, zc, a.max_voai, len(en), ec, a.max_el))
    if a.dry_run or not jobs:
        return

    keys = load_keys()
    used_z = used_e = done = 0
    left = []
    for d, n, cfg, out in jobs:
        t = n['text']
        if is_en(n):
            k = keys.get('ELEVENLABS_API_KEY')
            if not k or used_e + len(t) > a.max_el:
                left.append(n); continue
            data = eleven(k, t); used_e += len(t)
        else:
            k = keys.get('VOAI_API_KEY')
            if not k or used_z + len(t) > a.max_voai:
                left.append(n); continue
            data = voai(k, cfg, t); used_z += len(t)
        os.makedirs(os.path.dirname(out), exist_ok=True)
        with open(out + '.part', 'wb') as f:
            f.write(data)
        os.replace(out + '.part', out)
        done += 1
        print('  錄好 %s：%s' % (os.path.relpath(out, REPO), t[:30]))
    print('完成：錄了 %d 句（VoAI %d 字、ElevenLabs %d 字元）。' % (done, used_z, used_e))
    if left:
        why = '沒有金鑰檔 %s' % KEYS if not keys else '超過這次的點數上限或缺某一把金鑰'
        print('還有 %d 句沒錄（%s），下次再錄。' % (len(left), why))


if __name__ == '__main__':
    main()
