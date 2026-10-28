// 手繪風 SVG 插圖：種子、果實、樹、種子長大的剖面圖
window.A = (function () {
  const INK = '#5b3a1e';
  const L = `stroke="${INK}" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"`;
  let uid = 0;
  const svg = (inner, vb = '0 0 100 100') =>
    `<svg viewBox="${vb}" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">${inner}</svg>`;

  // ---------- 種子 ----------
  function acorn() {
    const dots = [[34, 40], [46, 34], [58, 40], [68, 46], [40, 48], [53, 47], [30, 50], [62, 52]]
      .map(([x, y]) => `<circle cx="${x}" cy="${y}" r="2.2" fill="#6b4421"/>`).join('');
    return svg(`
      <path d="M50 94 C36 84 29 68 30 53 H70 C71 68 64 84 50 94Z" fill="#e0a65e" ${L}/>
      <path d="M41 62 C41 72 45 80 50 86" fill="none" stroke="#fff" stroke-opacity=".5" stroke-width="4" stroke-linecap="round"/>
      <path d="M23 54 C21 32 35 22 50 22 C65 22 79 32 77 54Z" fill="#9a6a35" ${L}/>
      ${dots}
      <path d="M50 22 C50 16 52 12 56 10" fill="none" ${L}/>`);
  }

  function pinecone() {
    const id = 'pc' + (++uid);
    const shape = 'M50 8 C68 12 78 38 72 66 C69 84 60 95 50 95 C40 95 31 84 28 66 C22 38 32 12 50 8Z';
    let sc = '';
    for (let r = 0; r < 8; r++) {
      const y = 20 + r * 10;
      for (let i = -3; i <= 3; i++) {
        const x = 50 + (i + (r % 2 ? 0.5 : 0)) * 12;
        sc += `<path d="M${x - 6.5} ${y - 6} L${x - 6.5} ${y + 2} Q${x} ${y + 11} ${x + 6.5} ${y + 2} L${x + 6.5} ${y - 6}Z" fill="${r % 2 ? '#c98a4e' : '#d89a5c'}" stroke="#6b3f1d" stroke-width="1.6" stroke-linejoin="round"/>`;
      }
    }
    return svg(`
      <defs><clipPath id="${id}"><path d="${shape}"/></clipPath></defs>
      <path d="${shape}" fill="#8a5a2e"/>
      <g clip-path="url(#${id})">${sc}</g>
      <path d="${shape}" fill="none" ${L}/>
      <path d="M50 8 L50 3" ${L}/>`);
  }

  function samara() {
    return svg(`
      <g ${L}>
        <path d="M42 68 C25 52 23 28 33 9 C48 22 53 48 49 68Z" fill="#ecd48a"/>
        <path d="M58 68 C75 52 77 28 67 9 C52 22 47 48 51 68Z" fill="#ecd48a"/>
        <ellipse cx="44" cy="77" rx="8" ry="10" fill="#b98b3e"/>
        <ellipse cx="56" cy="77" rx="8" ry="10" fill="#c9994a"/>
      </g>
      <path d="M44 66 C36 50 34 34 35 22 M56 66 C64 50 66 34 65 22" fill="none" stroke="#b9983c" stroke-width="1.8" stroke-linecap="round"/>`);
  }

  function coconut() {
    let fib = '';
    for (let a = 0; a < 360; a += 24) {
      const r = a * Math.PI / 180, x1 = 50 + Math.cos(r) * 30, y1 = 54 + Math.sin(r) * 30,
            x2 = 50 + Math.cos(r + .18) * 37, y2 = 54 + Math.sin(r + .18) * 37;
      fib += `<path d="M${x1.toFixed(1)} ${y1.toFixed(1)} L${x2.toFixed(1)} ${y2.toFixed(1)}" stroke="#5f3b1c" stroke-width="2" stroke-linecap="round"/>`;
    }
    return svg(`
      <circle cx="50" cy="54" r="38" fill="#8a5a2e" ${L}/>
      ${fib}
      <path d="M26 40 C30 28 40 22 50 21" fill="none" stroke="#fff" stroke-opacity=".3" stroke-width="5" stroke-linecap="round"/>
      <circle cx="40" cy="48" r="5.5" fill="#3b2210"/><circle cx="60" cy="48" r="5.5" fill="#3b2210"/><circle cx="50" cy="63" r="5.5" fill="#3b2210"/>
      <circle cx="38.5" cy="46.5" r="1.6" fill="#fff" opacity=".7"/><circle cx="58.5" cy="46.5" r="1.6" fill="#fff" opacity=".7"/><circle cx="48.5" cy="61.5" r="1.6" fill="#fff" opacity=".7"/>`);
  }

  function mangoPit() {
    let fib = '';
    for (let i = -3; i <= 3; i++) {
      fib += `<path d="M18 ${52 + i * 5.5} Q50 ${46 + i * 7} 82 ${52 + i * 5.5}" fill="none" stroke="#b99a58" stroke-width="1.6" stroke-linecap="round"/>`;
    }
    return svg(`
      <g transform="rotate(-28 50 52)">
        <ellipse cx="50" cy="52" rx="38" ry="23" fill="#ecd9a8" ${L}/>
        ${fib}
        <path d="M14 52 L8 50 M86 52 L92 50" ${L}/>
      </g>`);
  }

  // 切開的蘋果（紅皮、白肉、中間有黑種子）
  function appleHalf() {
    let seeds = '';
    [-90, -18, 54, 126, 198].forEach(a => {
      const r = a * Math.PI / 180, x = 50 + Math.cos(r) * 10, y = 56 + Math.sin(r) * 10;
      seeds += `<ellipse cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" rx="3" ry="5.2" transform="rotate(${a + 90} ${x.toFixed(1)} ${y.toFixed(1)})" fill="#3b2210"/>`;
    });
    return svg(`
      <path d="M50 22 C62 8 90 16 90 52 C90 80 70 95 50 91 C30 95 10 80 10 52 C10 16 38 8 50 22Z" fill="#e63946" ${L}/>
      <path d="M50 28 C60 18 82 25 82 52 C82 74 66 86 50 83 C34 86 18 74 18 52 C18 25 40 18 50 28Z" fill="#fff4d6"/>
      <path d="M50 40 C60 40 67 48 67 56 C67 66 59 72 50 72 C41 72 33 66 33 56 C33 48 40 40 50 40Z" fill="#f3e2b0" stroke="#d4b86a" stroke-width="1.5"/>
      ${seeds}
      <path d="M50 22 C50 14 52 9 57 6" fill="none" ${L}/>`);
  }

  function appleWhole() {
    return svg(`
      <path d="M50 24 C62 10 90 18 90 54 C90 82 70 96 50 92 C30 96 10 82 10 54 C10 18 38 10 50 24Z" fill="#e63946" ${L}/>
      <path d="M24 38 C26 30 32 26 38 25" fill="none" stroke="#fff" stroke-opacity=".5" stroke-width="5" stroke-linecap="round"/>
      <path d="M50 24 C50 16 52 11 57 8" fill="none" ${L}/>
      <path d="M56 14 C62 4 76 4 82 10 C76 20 64 20 56 14Z" fill="#58b947" ${L}/>`);
  }

  const MANGO = 'M20 60 C18 34 44 16 68 24 C90 32 92 62 70 80 C50 96 22 88 20 60Z';
  function mangoWhole() {
    return svg(`
      <path d="${MANGO}" fill="#ffb627" ${L}/>
      <path d="M68 24 C90 32 92 62 70 80 C84 66 84 40 68 24Z" fill="#ff7b2e" opacity=".55"/>
      <path d="M30 44 C34 36 42 30 50 28" fill="none" stroke="#fff" stroke-opacity=".5" stroke-width="5" stroke-linecap="round"/>
      <path d="M64 22 C62 14 66 9 72 7" fill="none" ${L}/>
      <path d="M70 14 C76 4 90 6 94 14 C86 22 76 22 70 14Z" fill="#58b947" ${L}/>`);
  }
  function mangoHalf() {
    return svg(`
      <path d="${MANGO}" fill="#ffb627" ${L}/>
      <path d="M26 60 C25 40 46 25 66 31 C84 38 86 60 68 74 C50 88 28 82 26 60Z" fill="#ffd45e"/>
      <g transform="rotate(-30 52 56)"><ellipse cx="52" cy="56" rx="22" ry="12" fill="#ecd9a8" stroke="#a88a45" stroke-width="2.5"/>
      <path d="M34 52 Q52 48 70 52 M34 58 Q52 54 70 58" fill="none" stroke="#b99a58" stroke-width="1.4"/></g>`);
  }

  function pineOpen() {
    return svg(`
      <g transform="translate(-12 4) scale(.82)">${pinecone().replace(/<\/?svg[^>]*>/g, '')}</g>
      <g transform="translate(46 8)">
        <path d="M6 30 C20 14 38 8 46 12 C42 30 24 42 10 46Z" fill="#f1e5c4" stroke="${INK}" stroke-width="2.4" stroke-linejoin="round"/>
        <ellipse cx="10" cy="40" rx="8" ry="10" transform="rotate(30 10 40)" fill="#7a5530" stroke="${INK}" stroke-width="2.4"/>
      </g>`);
  }

  // ---------- 樹 ----------
  const FRUIT_POS = [[34, 44], [64, 38], [48, 58], [72, 56], [26, 58], [52, 30], [40, 66], [62, 66]];
  function broad(fill, fruitFn, n) {
    const cr = [[32, 50, 20], [68, 50, 20], [50, 32, 24], [50, 54, 22]];
    const dark = cr.map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${INK}" stroke="${INK}" stroke-width="3"/>`).join('');
    const lite = cr.map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${fill}"/>`).join('');
    const fr = fruitFn ? FRUIT_POS.slice(0, n || 6).map(([x, y]) => fruitFn(x, y)).join('') : '';
    return svg(`
      <path d="M43 94 L45 60 L55 60 L57 94Z" fill="#8b5a2b" ${L}/>
      ${dark}${lite}
      <path d="M30 40 C34 32 42 28 50 27" fill="none" stroke="#fff" stroke-opacity=".28" stroke-width="5" stroke-linecap="round"/>
      ${fr}`);
  }
  const dotFruit = (c, r) => (x, y) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${c}" stroke="${INK}" stroke-width="1.6"/>`;
  const ovalFruit = c => (x, y) => `<ellipse cx="${x}" cy="${y}" rx="4.2" ry="5.4" fill="${c}" stroke="${INK}" stroke-width="1.6" transform="rotate(25 ${x} ${y})"/>`;
  const blossom = (x, y) => `<circle cx="${x}" cy="${y}" r="3.6" fill="#ffb3d1"/><circle cx="${x}" cy="${y}" r="1.2" fill="#ffe27a"/>`;

  function pineTree() {
    const t = (pts, c) => `<polygon points="${pts}" fill="${c}" ${L}/>`;
    return svg(`
      <rect x="44" y="78" width="12" height="16" rx="2" fill="#8b5a2b" ${L}/>
      ${t('50,34 90,82 10,82', '#2d8a4a')}
      ${t('50,20 84,62 16,62', '#35a158')}
      ${t('50,4 76,42 24,42', '#3fb868')}`);
  }

  function palm() {
    const frond = (d) => `<path d="${d}" fill="#4cc069" ${L}/>`;
    return svg(`
      <path d="M48 95 C46 74 54 56 58 38" fill="none" stroke="${INK}" stroke-width="13" stroke-linecap="round"/>
      <path d="M48 95 C46 74 54 56 58 38" fill="none" stroke="#b07a42" stroke-width="8" stroke-linecap="round"/>
      ${frond('M58 38 C44 20 24 22 10 38 C26 32 42 34 58 38Z')}
      ${frond('M58 38 C72 20 92 22 94 40 C78 32 68 34 58 38Z')}
      ${frond('M58 38 C50 18 36 8 22 10 C34 18 46 26 58 38Z')}
      ${frond('M58 38 C64 16 78 6 92 10 C80 18 68 26 58 38Z')}
      ${frond('M58 38 C58 20 60 10 66 4 C66 16 62 26 58 38Z')}
      <circle cx="52" cy="44" r="5.5" fill="#8a5a2e" ${L}/><circle cx="62" cy="46" r="5.5" fill="#8a5a2e" ${L}/>`);
  }

  // 各種樹（配對關卡用）
  const TREES = {
    oak: () => broad('#6fb04f', dotFruit('#c58a4a', 3.4), 6),
    pine: pineTree,
    maple: () => broad('#ef7d32', null),
    coconut: palm,
    mango: () => broad('#4fae52', ovalFruit('#ffb627'), 6),
    apple: () => broad('#5cb85c', dotFruit('#e63946', 4.6), 6),
  };
  const SEED_ART = {
    oak: acorn, pine: pinecone, maple: samara, coconut: coconut, mango: mangoPit, apple: appleHalf,
  };

  // ---------- 第二關：種子怎麼來 ----------
  function treeBlossom() { return broad('#86cf62', blossom, 8); }

  function flowerBee() {
    let petals = '';
    for (let i = 0; i < 5; i++) {
      petals += `<ellipse cx="50" cy="40" rx="9" ry="15" transform="rotate(${i * 72} 50 54)" fill="#ff8fbf" ${L.replace('3', '2.4')}/>`;
    }
    return svg(`
      <path d="M50 58 C50 72 48 84 48 96" fill="none" stroke="#3f9a3a" stroke-width="5" stroke-linecap="round"/>
      <path d="M49 82 C38 76 30 80 26 88 C38 90 44 88 49 82Z" fill="#58b947" ${L.replace('3', '2.2')}/>
      ${petals}
      <circle cx="50" cy="54" r="9" fill="#ffd23f" ${L.replace('3', '2.4')}/>
      <path d="M72 22 C62 26 70 36 60 38" fill="none" stroke="#8a7a60" stroke-width="2" stroke-dasharray="3 4" stroke-linecap="round"/>
      <text x="64" y="24" font-size="26">🐝</text>`);
  }

  function tinyFruit() {
    return svg(`
      <path d="M8 18 C30 20 44 14 58 24" fill="none" stroke="#7a5230" stroke-width="5" stroke-linecap="round"/>
      <path d="M26 20 C20 8 32 4 38 10 C38 16 32 20 26 20Z" fill="#58b947" ${L.replace('3', '2.2')}/>
      <path d="M58 24 L58 38" stroke="#7a5230" stroke-width="3" stroke-linecap="round"/>
      <circle cx="58" cy="52" r="15" fill="#a4d65e" ${L}/>
      <path d="M50 46 C52 42 55 40 58 40" fill="none" stroke="#fff" stroke-opacity=".5" stroke-width="3" stroke-linecap="round"/>
      <ellipse cx="30" cy="72" rx="4" ry="2.4" fill="#ffb3d1" transform="rotate(30 30 72)"/>
      <ellipse cx="82" cy="78" rx="4" ry="2.4" fill="#ffb3d1" transform="rotate(-20 82 78)"/>
      <ellipse cx="44" cy="88" rx="4" ry="2.4" fill="#ffb3d1" transform="rotate(10 44 88)"/>`);
  }

  // ---------- 第七關 ----------
  function sprout() {
    return svg(`
      <path d="M10 94 C14 74 34 66 50 66 C66 66 86 74 90 94Z" fill="#9b6b3f" ${L}/>
      <path d="M50 68 C50 54 50 46 50 36" fill="none" stroke="#4aa83f" stroke-width="5" stroke-linecap="round"/>
      <path d="M50 44 C36 44 28 36 28 26 C40 26 50 32 50 44Z" fill="#6fcf4f" ${L.replace('3', '2.4')}/>
      <path d="M50 38 C62 38 72 30 72 20 C60 20 50 26 50 38Z" fill="#6fcf4f" ${L.replace('3', '2.4')}/>`);
  }
  function bigTree() { return broad('#4fae52', null); }
  function floweringTree() { return broad('#7fcb5d', blossom, 8); }
  function fruitTree() { return broad('#5cb85c', dotFruit('#e63946', 4.6), 6); }

  // ---------- 小圖示 ----------
  function root() {
    return svg(`
      <path d="M14 22 C30 16 70 16 86 22" fill="none" stroke="#8b5a2b" stroke-width="6" stroke-linecap="round"/>
      <g fill="none" stroke="#b07a42" stroke-width="5" stroke-linecap="round">
        <path d="M50 22 C50 40 48 62 46 88"/><path d="M50 36 C38 44 30 56 26 72"/><path d="M49 48 C62 54 70 66 72 80"/>
        <path d="M47 66 C40 72 36 80 34 90"/><path d="M30 60 C24 62 20 66 18 72"/>
      </g>`);
  }

  // ---------- 第三關：種子長大的剖面圖 ----------
  // 每個 <g data-from data-to> 在 stage 落在範圍內時顯示
  function growScene() {
    const seedC = '#c28a46';
    let tex = '';
    [[22, 150], [48, 182], [80, 172], [150, 176], [176, 150], [130, 190], [30, 196], [168, 190]].forEach(([x, y]) => {
      tex += `<circle cx="${x}" cy="${y}" r="3" fill="#85582f"/>`;
    });
    return svg(`
      <rect width="200" height="126" fill="#eef5f7"/>
      <rect y="126" width="200" height="74" fill="#a67c52"/>
      ${tex}
      <rect y="120" width="200" height="9" fill="#86b26a"/>
      <g data-from="1" data-to="1"><ellipse cx="100" cy="160" rx="9" ry="6.5" fill="${seedC}" stroke="${INK}" stroke-width="2.4"/></g>
      <g data-from="2" data-to="2"><ellipse cx="100" cy="160" rx="13" ry="9.5" fill="#d9a65f" stroke="${INK}" stroke-width="2.4"/>
        <path d="M92 156 C95 153 99 152 103 153" fill="none" stroke="#fff" stroke-opacity=".7" stroke-width="2.4" stroke-linecap="round"/></g>
      <g data-from="3" data-to="9"><ellipse cx="100" cy="160" rx="13" ry="9.5" fill="#d9a65f" stroke="${INK}" stroke-width="2.4"/>
        <path d="M89 160 L96 157 L101 162 L107 158 L112 161" fill="none" stroke="${INK}" stroke-width="2" stroke-linejoin="round"/></g>
      <g data-from="3" data-to="4" fill="none" stroke="#f6ead0" stroke-width="3.4" stroke-linecap="round">
        <path d="M100 168 C100 176 99 184 98 192"/><path d="M100 172 C94 176 90 182 88 188"/></g>
      <g data-from="5" data-to="9" fill="none" stroke="#f6ead0" stroke-width="3.4" stroke-linecap="round">
        <path d="M100 160 C100 172 98 184 96 198"/><path d="M99 168 C88 174 80 184 76 196"/><path d="M101 170 C112 176 120 186 122 198"/>
        <path d="M98 184 C92 188 88 192 86 198"/><path d="M82 180 C76 182 70 186 66 192"/></g>
      <g data-from="4" data-to="4" fill="none" stroke-linecap="round">
        <path d="M100 154 C100 138 100 124 108 116" stroke="${INK}" stroke-width="7"/>
        <path d="M100 154 C100 138 100 124 108 116" stroke="#7ccd4b" stroke-width="4"/></g>
      <g data-from="5" data-to="5">
        <path d="M100 156 L100 98" stroke="${INK}" stroke-width="7" stroke-linecap="round"/><path d="M100 156 L100 98" stroke="#7ccd4b" stroke-width="4" stroke-linecap="round"/>
        <ellipse cx="89" cy="98" rx="13" ry="6.5" transform="rotate(-28 89 98)" fill="#5cc03f" stroke="${INK}" stroke-width="2.4"/>
        <ellipse cx="111" cy="98" rx="13" ry="6.5" transform="rotate(28 111 98)" fill="#5cc03f" stroke="${INK}" stroke-width="2.4"/></g>
      <g data-from="6" data-to="6">
        <path d="M100 156 L100 62" stroke="${INK}" stroke-width="8" stroke-linecap="round"/><path d="M100 156 L100 62" stroke="#a47a45" stroke-width="5" stroke-linecap="round"/>
        <g fill="#5cc03f" stroke="${INK}" stroke-width="2.4">
          <ellipse cx="86" cy="92" rx="14" ry="7" transform="rotate(-25 86 92)"/><ellipse cx="114" cy="84" rx="14" ry="7" transform="rotate(25 114 84)"/>
          <ellipse cx="86" cy="72" rx="13" ry="6.5" transform="rotate(-30 86 72)"/><ellipse cx="114" cy="66" rx="13" ry="6.5" transform="rotate(30 114 66)"/>
          <ellipse cx="100" cy="56" rx="7" ry="12"/></g></g>
      <g data-from="7" data-to="9">
        <path d="M90 126 L93 74 L107 74 L110 126Z" fill="#8b5a2b" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>
        <g stroke="${INK}" stroke-width="3">
          <circle cx="72" cy="62" r="24" fill="${INK}"/><circle cx="128" cy="62" r="24" fill="${INK}"/><circle cx="100" cy="42" r="30" fill="${INK}"/><circle cx="100" cy="68" r="26" fill="${INK}"/></g>
        <g fill="#4fae52"><circle cx="72" cy="62" r="24"/><circle cx="128" cy="62" r="24"/><circle cx="100" cy="42" r="30"/><circle cx="100" cy="68" r="26"/></g>
        <path d="M72 44 C78 34 88 28 98 26" fill="none" stroke="#fff" stroke-opacity=".28" stroke-width="6" stroke-linecap="round"/></g>`, '0 0 200 200');
  }


  // ---------- 小圖示（取代 emoji，同一套線條與配色） ----------
  const S2 = `stroke="${INK}" stroke-width="2.6" stroke-linejoin="round" stroke-linecap="round"`;
  const bee = () => svg(`
    <ellipse cx="38" cy="34" rx="13" ry="19" transform="rotate(-25 38 34)" fill="#e3f1f6" ${S2}/>
    <ellipse cx="56" cy="30" rx="13" ry="19" transform="rotate(15 56 30)" fill="#e3f1f6" ${S2}/>
    <ellipse cx="46" cy="62" rx="27" ry="18" fill="#f2c14e" ${S2}/>
    <circle cx="76" cy="58" r="11" fill="#f2c14e" ${S2}/>
    <path d="M38 46 Q34 62 38 78 M52 45 Q48 62 52 79" fill="none" stroke="${INK}" stroke-width="6" stroke-linecap="round"/>
    <circle cx="80" cy="55" r="2.4" fill="${INK}"/><path d="M19 62 L10 64" ${S2}/>`);
  const fish = () => svg(`
    <path d="M72 52 L94 34 Q89 52 94 70Z" fill="#4aa9c9" ${S2}/>
    <ellipse cx="45" cy="52" rx="30" ry="18" fill="#6EC3DD" ${S2}/>
    <path d="M38 36 Q46 26 56 36" fill="#4aa9c9" ${S2}/>
    <path d="M54 40 Q60 52 54 64" fill="none" stroke="#fff" stroke-opacity=".7" stroke-width="3" stroke-linecap="round"/>
    <circle cx="27" cy="47" r="3.2" fill="${INK}"/>`);
  const turtle = () => svg(`
    <rect x="22" y="66" width="13" height="16" rx="5" fill="#9ccc7a" ${S2}/><rect x="52" y="66" width="13" height="16" rx="5" fill="#9ccc7a" ${S2}/>
    <ellipse cx="84" cy="58" rx="10" ry="9" fill="#9ccc7a" ${S2}/>
    <path d="M12 70 C12 34 76 34 76 70Z" fill="#6f9f4f" ${S2}/>
    <path d="M28 70 C28 54 38 46 44 44 M44 70 L44 44 M60 70 C60 54 50 46 44 44" fill="none" stroke="${INK}" stroke-width="2" stroke-linecap="round"/>
    <circle cx="88" cy="55" r="2" fill="${INK}"/>`);
  const rock = () => svg(`
    <path d="M10 76 L20 46 L40 28 L66 32 L88 54 L92 76Z" fill="#b8aea3" ${S2}/>
    <path d="M40 28 L46 52 L66 32 M20 46 L46 52 L92 76" fill="none" stroke="#8c8278" stroke-width="2.2" stroke-linejoin="round"/>`);
  const cloud = () => {
    const c = [[32, 58, 16], [52, 46, 20], [72, 58, 15], [50, 66, 17]];
    return svg(c.map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${INK}" stroke="${INK}" stroke-width="3"/>`).join('') +
      c.map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="#eaf3f7"/>`).join(''));
  };
  const leaf = () => svg(`
    <path d="M18 80 C12 40 44 14 86 18 C90 60 62 90 18 80Z" fill="#6fae4f" ${S2}/>
    <path d="M18 80 C38 58 56 40 78 24" fill="none" stroke="${INK}" stroke-width="2.4" stroke-linecap="round"/>`);
  const flower = () => {
    let petals = '';
    for (let i = 0; i < 5; i++) petals += `<ellipse cx="50" cy="34" rx="9" ry="15" transform="rotate(${i * 72} 50 48)" fill="#f29bb8" ${S2}/>`;
    return svg(`
      <path d="M50 58 C50 72 48 84 48 96" fill="none" stroke="#5f9a45" stroke-width="5" stroke-linecap="round"/>
      <path d="M49 82 C38 76 30 80 26 88 C38 90 44 88 49 82Z" fill="#6fae4f" ${S2}/>
      ${petals}<circle cx="50" cy="48" r="9" fill="#f2c14e" ${S2}/>`);
  };
  const wind = () => svg(`<g fill="none" stroke="#5a9db6" stroke-width="5" stroke-linecap="round">
    <path d="M10 38 H62 C78 38 78 18 62 20"/><path d="M10 54 H80 C96 54 96 74 80 72"/><path d="M10 70 H48 C60 70 60 86 48 84"/></g>`);
  const wave = () => svg(`<g fill="none" stroke="#3d9fdc" stroke-width="5" stroke-linecap="round">
    <path d="M8 38 Q22 22 36 38 T64 38 T92 38"/><path d="M8 56 Q22 40 36 56 T64 56 T92 56"/><path d="M8 74 Q22 58 36 74 T64 74 T92 74"/></g>`);
  const squirrel = () => svg(`
    <path d="M62 82 C98 80 100 30 70 20 C86 40 76 56 58 62Z" fill="#c8844a" ${S2}/>
    <ellipse cx="46" cy="68" rx="18" ry="22" fill="#d99a5e" ${S2}/>
    <ellipse cx="42" cy="72" rx="8" ry="13" fill="#f3dcbd"/>
    <circle cx="36" cy="38" r="15" fill="#d99a5e" ${S2}/>
    <path d="M27 27 L24 12 L38 23Z" fill="#c8844a" ${S2}/>
    <circle cx="30" cy="36" r="2.4" fill="${INK}"/><circle cx="22" cy="42" r="2.2" fill="${INK}"/>`);
  const drop = () => svg(`
    <path d="M50 10 C66 36 78 50 78 64 C78 80 66 90 50 90 C34 90 22 80 22 64 C22 50 34 36 50 10Z" fill="#6EC3DD" ${S2}/>
    <path d="M36 64 C36 72 40 78 46 80" fill="none" stroke="#fff" stroke-opacity=".75" stroke-width="3.4" stroke-linecap="round"/>`);
  const sun = () => {
    let r = '';
    for (let a = 0; a < 360; a += 45) {
      const t = a * Math.PI / 180;
      r += `<path d="M${(50 + Math.cos(t) * 28).toFixed(1)} ${(50 + Math.sin(t) * 28).toFixed(1)} L${(50 + Math.cos(t) * 40).toFixed(1)} ${(50 + Math.sin(t) * 40).toFixed(1)}" stroke="#e0a21f" stroke-width="5" stroke-linecap="round"/>`;
    }
    return svg(r + `<circle cx="50" cy="50" r="19" fill="#ffc83d" ${S2}/>`);
  };
  const cycle = () => svg(`<g fill="none" stroke="#6C2024" stroke-width="6" stroke-linecap="round" stroke-linejoin="round">
    <path d="M20 52 A30 30 0 0 1 74 30"/><path d="M80 48 A30 30 0 0 1 26 70"/>
    <path d="M62 16 L76 30 L58 38"/><path d="M38 84 L24 70 L42 62"/></g>`);
  const speaker = () => svg(`<path d="M10 38 H28 L50 18 V82 L28 62 H10Z" fill="currentColor"/>
    <g fill="none" stroke="currentColor" stroke-width="6" stroke-linecap="round"><path d="M62 36 Q74 50 62 64"/><path d="M72 24 Q94 50 72 76"/></g>`);

  // ---------- 第二關、加碼關用的圖 ----------
  // 花的剖面：底部鼓起的子房裡，有很小的種子寶寶
  const flowerCut = () => svg(`
    <path d="M50 98 L50 74" fill="none" stroke="#5f9a45" stroke-width="5" stroke-linecap="round"/>
    <ellipse cx="29" cy="46" rx="11" ry="25" transform="rotate(-24 29 52)" fill="#f29bb8" ${S2}/>
    <ellipse cx="71" cy="46" rx="11" ry="25" transform="rotate(24 71 52)" fill="#f29bb8" ${S2}/>
    <path d="M40 58 L34 28 M60 58 L66 28" fill="none" stroke="${INK}" stroke-width="2.4" stroke-linecap="round"/>
    <circle cx="34" cy="26" r="4.4" fill="#f2c14e" ${S2}/><circle cx="66" cy="26" r="4.4" fill="#f2c14e" ${S2}/>
    <path d="M50 54 L50 26" fill="none" stroke="#6f9f4f" stroke-width="4.4" stroke-linecap="round"/>
    <circle cx="50" cy="23" r="5" fill="#f2c14e" ${S2}/>
    <ellipse cx="50" cy="66" rx="19" ry="16" fill="#9ccc7a" ${S2}/>
    <ellipse cx="43" cy="64" rx="3.6" ry="5" transform="rotate(-20 43 64)" fill="#d9a65f" stroke="${INK}" stroke-width="1.6"/>
    <ellipse cx="57" cy="64" rx="3.6" ry="5" transform="rotate(20 57 64)" fill="#d9a65f" stroke="${INK}" stroke-width="1.6"/>
    <ellipse cx="50" cy="72" rx="3.6" ry="5" fill="#d9a65f" stroke="${INK}" stroke-width="1.6"/>`);

  // 切開的小果實：種子已經在裡面一起長
  const tinyFruitCut = () => svg(`
    <path d="M50 22 C50 14 52 10 57 8" fill="none" ${L}/>
    <path d="M54 14 C58 4 70 4 76 10 C70 18 60 18 54 14Z" fill="#6fae4f" ${S2}/>
    <circle cx="50" cy="56" r="33" fill="#a4d65e" ${L}/>
    <circle cx="50" cy="56" r="25" fill="#eef5cf"/>
    <ellipse cx="42" cy="54" rx="3.6" ry="5.4" transform="rotate(-20 42 54)" fill="#b98b3e" stroke="${INK}" stroke-width="1.6"/>
    <ellipse cx="58" cy="54" rx="3.6" ry="5.4" transform="rotate(20 58 54)" fill="#b98b3e" stroke="${INK}" stroke-width="1.6"/>
    <ellipse cx="50" cy="64" rx="3.6" ry="5.4" fill="#b98b3e" stroke="${INK}" stroke-width="1.6"/>`);

  // 蕨類（用孢子繁殖的老植物）
  const fern = () => {
    let l = '';
    for (let i = 0; i < 7; i++) {
      const y = 84 - i * 10, w = 25 - i * 2.8, x = 50 - w / 2 - 2;
      l += `<ellipse cx="${x.toFixed(1)}" cy="${y}" rx="${(w / 2).toFixed(1)}" ry="4.4" transform="rotate(-20 ${x.toFixed(1)} ${y})" fill="#6fae4f" stroke="${INK}" stroke-width="2"/>`;
      l += `<ellipse cx="${(100 - x).toFixed(1)}" cy="${y}" rx="${(w / 2).toFixed(1)}" ry="4.4" transform="rotate(20 ${(100 - x).toFixed(1)} ${y})" fill="#6fae4f" stroke="${INK}" stroke-width="2"/>`;
    }
    return svg(`<path d="M50 96 L50 12" fill="none" stroke="${INK}" stroke-width="3.4" stroke-linecap="round"/>` + l +
      `<ellipse cx="50" cy="12" rx="3.6" ry="5.4" fill="#6fae4f" stroke="${INK}" stroke-width="2"/>`);
  };

  return {
    flowerCut, tinyFruitCut, fern,
    bee, fish, turtle, rock, cloud, leaf, flower, wind, wave, squirrel, drop, sun, cycle, speaker,
    svg, acorn, pinecone, samara, coconut, mangoPit, appleHalf, appleWhole, mangoWhole, mangoHalf, pineOpen,
    treeBlossom, flowerBee, tinyFruit, sprout, bigTree, floweringTree, fruitTree, root, growScene,
    TREES, SEED_ART,
  };
})();
