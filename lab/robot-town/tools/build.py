# -*- coding: utf-8 -*-
"""把 tools/content.py 轉成遊戲用的 content.js，並列出配音清單（照 water-game 的 build.py）。

用法：
    python3 tools/build.py

輸出：
    content.js              遊戲讀取的文字
    tools/narration.json    要請 VoAI 配音的句子清單

這個遊戲 ZHUYIN = False（有配音、畫面不放注音），所以不需要 pypinyin；
如果哪天要打開注音，裝 pypinyin（pip install pypinyin）再把 content.py 的 ZHUYIN 改成 True。
"""
import hashlib
import json
import os
import re
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
sys.path.insert(0, HERE)

import content  # noqa: E402
from content import SAY, UI  # noqa: E402

ZHUYIN = getattr(content, 'ZHUYIN', True)
if ZHUYIN:
    try:
        from pypinyin import Style, pinyin
    except ImportError:
        sys.exit('ZHUYIN = True 需要 pypinyin：pip install pypinyin')

TOKEN = re.compile(r'\{([A-Za-z0-9])\}|([㐀-鿿])(?:\[([^\]]+)\])?|(.)', re.S)


def annotate(text):
    """回傳 (z 清單, 純文字)。{S} → 鍵帽；字[注音] → 手動注音（ZHUYIN = False 時只留字）。"""
    items = []
    for m in TOKEN.finditer(text):
        if m.group(1):
            items.append(('k', m.group(1)))
        elif m.group(2):
            items.append(('h', m.group(2), m.group(3)))
        else:
            items.append(('o', m.group(4)))
    if ZHUYIN:
        i = 0
        while i < len(items):
            if items[i][0] == 'h':
                j = i
                while j < len(items) and items[j][0] == 'h':
                    j += 1
                zys = pinyin(''.join(x[1] for x in items[i:j]), style=Style.BOPOMOFO, errors=lambda c: [c])
                for k in range(i, j):
                    items[k] = ('h', items[k][1], items[k][2] or (zys[k - i][0] if k - i < len(zys) else ''))
                i = j
            else:
                i += 1
    z, plain = [], []
    for it in items:
        if it[0] == 'k':
            z.append({'k': it[1]})
        elif it[0] == 'h':
            z.append([it[1], it[2]] if ZHUYIN else it[1])
        else:
            z.append(it[1])
        plain.append(it[1])
    return z, ''.join(plain)


def vid(text):
    return hashlib.sha1(text.encode('utf-8')).hexdigest()[:12]


def main():
    tx, narr = {}, []
    for key, text in list(SAY.items()) + list(UI.items()):
        # SAY 可以寫成 (顯示, 唸的)：畫面有字母鍵帽，聲音不唸字母、改說按哪個東西
        text, spoken = text if isinstance(text, tuple) else (text, None)
        z, plain = annotate(text)
        if spoken is not None:
            spoken = annotate(spoken)[1]
        tx[key] = {'t': plain, 'z': z}
        if key in SAY:
            said = spoken or plain
            tx[key]['v'] = vid(said)
            narr.append({'key': key, 'id': tx[key]['v'], 'text': said})

    with open(os.path.join(ROOT, 'content.js'), 'w', encoding='utf-8') as f:
        f.write('// 由 tools/build.py 產生，請不要直接修改（改 tools/content.py）\n')
        f.write('window.TX = ' + json.dumps(tx, ensure_ascii=False, separators=(',', ':')) + ';\n')
    with open(os.path.join(HERE, 'narration.json'), 'w', encoding='utf-8') as f:
        json.dump(narr, f, ensure_ascii=False, indent=1)

    chars = sum(len(n['text']) for n in narr)
    print('文字 %d 則（配音 %d 句、共 %d 字，VoAI 約 %d 點）' % (len(tx), len(narr), chars, chars))


if __name__ == '__main__':
    main()
