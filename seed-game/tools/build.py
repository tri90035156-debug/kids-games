# -*- coding: utf-8 -*-
"""把 tools/content.py 轉成遊戲用的 content.js（自動加注音），並列出配音清單。

用法：
    pip install pypinyin      # 第一次需要
    python3 tools/build.py

輸出：
    content.js              遊戲讀取的文字（含注音）
    tools/narration.json    要請 VoAI 配音的句子清單
"""
import hashlib
import json
import os
import re
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
sys.path.insert(0, HERE)

try:
    from pypinyin import Style, pinyin
except ImportError:
    sys.exit('請先安裝：pip install pypinyin')

from content import SAY, UI  # noqa: E402

HAN = re.compile(r'[㐀-鿿]')
TOKEN = re.compile(r'\{([A-Za-z0-9])\}|([㐀-鿿])(?:\[([^\]]+)\])?|(.)', re.S)


def fix_tone(zy):
    """pypinyin 把輕聲放在後面（ㄗ˙），課本是放在前面（˙ㄗ）。"""
    if zy.endswith('˙'):
        return '˙' + zy[:-1]
    return zy


def annotate(text):
    """回傳 (z 清單, 配音用純文字)。"""
    items = []     # ('k', 鍵) / ('h', 字, 注音或None) / ('o', 其他字元)
    for m in TOKEN.finditer(text):
        if m.group(1):
            items.append(('k', m.group(1)))
        elif m.group(2):
            items.append(('h', m.group(2), m.group(3)))
        else:
            items.append(('o', m.group(4)))

    # 連續的漢字一起送去注音，才抓得到詞語的讀音（例如「種子」）
    i = 0
    while i < len(items):
        if items[i][0] == 'h':
            j = i
            while j < len(items) and items[j][0] == 'h':
                j += 1
            run = ''.join(x[1] for x in items[i:j])
            zys = pinyin(run, style=Style.BOPOMOFO, errors=lambda c: [c])
            for k in range(i, j):
                forced = items[k][2]
                auto = zys[k - i][0] if k - i < len(zys) else None
                zy = fix_tone(forced if forced else auto)
                if not forced and items[k][1] == '一':
                    zy = 'ㄧ'          # 一、不 一律用原調（跟「怎麼做成的」一致）
                elif not forced and items[k][1] == '不':
                    zy = 'ㄅㄨˋ'
                items[k] = ('h', items[k][1], zy)
            i = j
        else:
            i += 1

    z, plain = [], []
    for it in items:
        if it[0] == 'k':
            z.append({'k': it[1]})
            plain.append(it[1])
        elif it[0] == 'h':
            z.append([it[1], it[2]])
            plain.append(it[1])
        else:
            z.append(it[1])
            plain.append(it[1])
    return z, ''.join(plain)


def vid(text):
    return hashlib.sha1(text.encode('utf-8')).hexdigest()[:12]


def main():
    tx, narr, poly = {}, [], {}
    for key, text in list(SAY.items()) + list(UI.items()):
        z, plain = annotate(text)
        voiced = key in SAY
        tx[key] = {'t': plain, 'z': z}
        if voiced:
            tx[key]['v'] = vid(plain)
            narr.append({'key': key, 'id': tx[key]['v'], 'text': plain})
        for it in z:
            if isinstance(it, list):
                poly.setdefault(it[0], set()).add(it[1])

    with open(os.path.join(ROOT, 'content.js'), 'w', encoding='utf-8') as f:
        f.write('// 由 tools/build.py 產生，請不要直接修改（改 tools/content.py）\n')
        f.write('window.TX = ' + json.dumps(tx, ensure_ascii=False, separators=(',', ':')) + ';\n')

    with open(os.path.join(HERE, 'narration.json'), 'w', encoding='utf-8') as f:
        json.dump(narr, f, ensure_ascii=False, indent=1)

    chars = sum(len(n['text']) for n in narr)
    print('文字 %d 則（配音 %d 句、共 %d 字，約 %d 點）' % (len(tx), len(narr), chars, chars))

    # 列出「同一個字被標了不同注音」的字，方便人工檢查破音字
    multi = {c: sorted(v) for c, v in poly.items() if len(v) > 1}
    if multi:
        print('\n以下的字在不同句子有不同注音，請確認是否正確：')
        for c, v in multi.items():
            print('  ', c, ' / '.join(v))


if __name__ == '__main__':
    main()
