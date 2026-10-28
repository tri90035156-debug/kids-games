// 《頌缽工坊》的手繪風 SVG 插圖（和種子遊戲同一套線條與配色）
window.A = (function () {
  const INK = '#5b3a1e';
  const L = `stroke="${INK}" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"`;
  const S2 = `stroke="${INK}" stroke-width="2.6" stroke-linejoin="round" stroke-linecap="round"`;
  let uid = 0;
  const svg = (inner, vb = '0 0 100 100') =>
    `<svg viewBox="${vb}" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">${inner}</svg>`;

  // 顏色在冷（暗青銅）和熱（燒紅）之間漸變；heat 0..1
  function mix(a, b, t) {
    const p = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
    const [x, y] = [p(a), p(b)];
    return '#' + x.map((v, i) => Math.round(v + (y[i] - v) * t).toString(16).padStart(2, '0')).join('');
  }
  const heatColor = h => h < .5 ? mix('#5e4630', '#b8402a', h * 2) : mix('#b8402a', '#f08a3c', (h - .5) * 2);

  // ---------- 頌缽：側面 ----------
  function bowlSide({ body = '#c9a24a', inner = '#8f6d2c', marks = true, shine = true, water = false } = {}) {
    let mk = '';
    if (marks) [[26, 40], [40, 52], [58, 58], [78, 52], [92, 40], [48, 40], [70, 42], [34, 30], [86, 30]].forEach(([x, y]) => {
      mk += `<ellipse cx="${x}" cy="${y}" rx="4" ry="2.6" fill="#fff" opacity=".18"/>`;
    });
    return svg(`
      <path d="M10 26 C12 58 34 74 60 74 C86 74 108 58 110 26Z" fill="${body}" ${L}/>
      ${mk}
      ${shine ? '<path d="M22 34 C26 50 36 60 48 64" fill="none" stroke="#fff" stroke-opacity=".55" stroke-width="4" stroke-linecap="round"/>' : ''}
      <ellipse cx="60" cy="26" rx="50" ry="11" fill="${body}" ${L}/>
      <ellipse cx="60" cy="27" rx="43" ry="7.5" fill="${water ? '#7fc3dd' : inner}"/>`, '0 0 120 80');
  }
  // 木棒（包著麂皮的那一頭朝下）
  const mallet = () => svg(`
    <rect x="44" y="6" width="12" height="70" rx="6" fill="#c9965a" ${S2}/>
    <rect x="42" y="66" width="16" height="28" rx="8" fill="#8a5a2e" ${S2}/>
    <path d="M47 14 L47 60" stroke="#fff" stroke-opacity=".4" stroke-width="3" stroke-linecap="round"/>`);
  // 頌缽：從上面看（磨缽、裝水用）
  function bowlTop() {
    const g = 'bt' + (++uid);
    return svg(`<defs><radialGradient id="${g}" cx=".42" cy=".38" r=".7">
        <stop offset="0" stop-color="#e9cf87"/><stop offset=".55" stop-color="#b98d36"/><stop offset="1" stop-color="#7a5a22"/></radialGradient></defs>
      <circle cx="100" cy="100" r="94" fill="#d4b062" ${L}/>
      <circle cx="100" cy="100" r="82" fill="url(#${g})" stroke="#8f6d2c" stroke-width="3"/>
      <circle cx="100" cy="100" r="46" fill="none" stroke="#8f6d2c" stroke-width="1.6" stroke-opacity=".6"/>
      <path d="M48 62 A62 62 0 0 1 96 36" fill="none" stroke="#fff" stroke-opacity=".55" stroke-width="6" stroke-linecap="round"/>`, '0 0 200 200');
  }

  // ---------- 第二關：缶、木頭、塑膠 ----------
  const jar = () => svg(`
    <path d="M36 14 H64 L62 24 C80 30 86 48 82 66 C78 84 66 92 50 92 C34 92 22 84 18 66 C14 48 20 30 38 24Z" fill="#c4774a" ${L}/>
    <path d="M24 52 C38 58 62 58 76 52" fill="none" stroke="#8a4a26" stroke-width="3"/>
    <path d="M34 14 H66" ${L}/>
    <path d="M28 44 C30 36 36 30 42 28" fill="none" stroke="#fff" stroke-opacity=".4" stroke-width="4" stroke-linecap="round"/>`);
  const log = () => svg(`
    <rect x="12" y="34" width="70" height="34" rx="6" fill="#c9965a" ${L}/>
    <ellipse cx="82" cy="51" rx="10" ry="17" fill="#e6c48f" ${L}/>
    <ellipse cx="82" cy="51" rx="4.6" ry="8" fill="none" stroke="#a87a44" stroke-width="2"/>
    <path d="M22 44 H56 M30 58 H68" stroke="#a87a44" stroke-width="2.4" stroke-linecap="round"/>`);
  const plastic = () => svg(`
    <rect x="40" y="8" width="20" height="12" rx="3" fill="#6EC3DD" ${S2}/>
    <path d="M40 20 H60 L66 34 V86 C66 90 62 92 58 92 H42 C38 92 34 90 34 86 V34Z" fill="#e3f1f6" ${L}/>
    <path d="M34 50 H66" stroke="#6EC3DD" stroke-width="5"/>
    <path d="M42 40 V80" stroke="#fff" stroke-width="3" stroke-linecap="round"/>`);

  // ---------- 第三關：石頭與礦石 ----------
  const ROCK = 'M10 76 L18 44 L38 24 L66 26 L88 48 L92 78 L70 90 L28 90Z';
  function rock(cracks = 0) {
    const C = ['M50 26 L46 44 L54 52', 'M54 52 L44 66 L48 80', 'M54 52 L70 60 L80 56', 'M46 44 L30 50 L24 62', 'M48 80 L60 88'];
    return svg(`<path d="${ROCK}" fill="#b8aea3" ${L}/>
      <path d="M24 46 L36 34 M74 40 L82 52" stroke="#d6cfc6" stroke-width="4" stroke-linecap="round"/>
      ${C.slice(0, cracks).map(c => `<path d="${c}" fill="none" stroke="${INK}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>`).join('')}`);
  }
  const pebbles = () => svg(`<g ${S2}><path d="M10 80 L18 60 L36 56 L44 74 L34 88Z" fill="#b8aea3"/>
    <path d="M52 86 L56 62 L74 54 L90 70 L84 88Z" fill="#a9a095"/><path d="M34 52 L40 34 L58 30 L64 48 L50 54Z" fill="#c4bcb2"/></g>`);
  const oreCu = () => svg(`<path d="${ROCK}" fill="#b8aea3" ${L}/>
    <path d="M28 52 C30 40 44 34 56 38 C70 42 74 56 66 66 C56 76 36 72 28 52Z" fill="#3fa36b" ${S2}/>
    <path d="M36 50 C42 46 50 46 56 50 M40 60 C46 56 54 58 60 62" fill="none" stroke="#9fe0b8" stroke-width="3" stroke-linecap="round"/>
    <circle cx="62" cy="48" r="4" fill="#d07a4a" ${S2}/>`);
  const oreSn = () => svg(`<path d="${ROCK}" fill="#b8aea3" ${L}/>
    <path d="M30 56 L38 40 L56 36 L70 48 L64 68 L42 72Z" fill="#3a3029" ${S2}/>
    <path d="M42 46 L50 44 M48 58 L60 54" stroke="#9a8f86" stroke-width="3" stroke-linecap="round"/>`);
  const ingot = c => svg(`<path d="M14 66 L26 40 H74 L86 66Z" fill="${c}" ${L}/>
    <path d="M26 40 L30 32 H70 L74 40" fill="${c}" ${S2} opacity=".85"/>
    <path d="M30 52 H56" stroke="#fff" stroke-opacity=".5" stroke-width="4" stroke-linecap="round"/>`);
  const copper = () => ingot('#d07a4a');
  const tin = () => ingot('#c9ccd0');

  // ---------- 第四～六關：鍋子、火、風箱、模子 ----------
  // 坩堝（裝金屬的耐火鍋子）。fill：裡面金屬的顏色；level 0..1
  function crucible(fill = '', level = 0) {
    const id = 'cr' + (++uid);
    const top = 86 - level * 52;
    return svg(`<defs><clipPath id="${id}"><path d="M22 24 L30 86 C32 92 68 92 70 86 L78 24Z"/></clipPath></defs>
      <path d="M22 24 L30 86 C32 92 68 92 70 86 L78 24Z" fill="#e2d6c6"/>
      ${fill ? `<rect x="10" y="${top}" width="80" height="80" fill="${fill}" clip-path="url(#${id})"/>` : ''}
      <path d="M22 24 L30 86 C32 92 68 92 70 86 L78 24Z" fill="none" ${L}/>
      <path d="M16 24 H84" ${L} stroke-width="4"/>`);
  }
  function flames(size = 1) {
    const s = .45 + size * .75;
    return svg(`<g transform="translate(50 96) scale(${s.toFixed(2)}) translate(-50 -96)">
      <path d="M20 96 C10 74 26 62 28 44 C38 58 40 66 44 70 C44 52 52 36 50 14 C66 32 76 52 72 72 C78 66 80 58 80 50 C92 66 92 84 80 96Z" fill="#f08a3c" ${S2}/>
      <path d="M34 96 C30 84 38 76 40 68 C46 76 50 82 52 84 C54 74 58 66 58 56 C68 68 70 84 64 96Z" fill="#ffc83d"/></g>`);
  }
  const bellows = () => svg(`
    <path d="M14 30 L70 42 L70 58 L14 70Z" fill="#9a6a35" ${L}/>
    <path d="M24 34 L28 66 M36 36 L40 64 M48 39 L52 61" stroke="#6b4421" stroke-width="2.6"/>
    <rect x="70" y="44" width="22" height="12" rx="3" fill="#7a7f86" ${S2}/>
    <rect x="2" y="44" width="14" height="12" rx="3" fill="#c9965a" ${S2}/>`, '0 0 100 100');

  // ---------- 第七關：槌子 ----------
  const hammer = () => svg(`
    <rect x="45" y="34" width="10" height="58" rx="4" fill="#c9965a" ${S2} transform="rotate(30 50 60)"/>
    <path d="M18 22 L58 22 L64 30 L64 42 L58 46 L18 46Z" fill="#7a7f86" ${S2} transform="rotate(30 40 34)"/>`);
  // 槌頭朝下的槌子（第七關圍著金屬餅轉向用）
  const hammerDown = () => svg(`
    <rect x="44" y="4" width="12" height="62" rx="5" fill="#c9965a" ${S2}/>
    <rect x="20" y="62" width="60" height="30" rx="5" fill="#7a7f86" ${S2}/>
    <path d="M26 70 H50" stroke="#fff" stroke-opacity=".45" stroke-width="4" stroke-linecap="round"/>`);
  // 金屬餅慢慢敲成碗的剖面；depth 0..1、heat 0..1
  function forge(depth = 0, heat = 1) {
    const w = 72 - 16 * depth, s = 46 * depth, t = 16 - 6 * depth, y = 46;
    const c = heatColor(heat);
    return svg(`
      <path d="M${100 - w} ${y} Q100 ${y + 2 * s} ${100 + w} ${y} L${100 + w} ${y + t} Q100 ${y + 2 * s + t} ${100 - w} ${y + t}Z" fill="${c}" ${L}/>
      ${heat > .4 ? `<path d="M${100 - w + 10} ${y + 4} Q100 ${y + 2 * s + 2} ${100 + w - 10} ${y + 4}" fill="none" stroke="#ffd27a" stroke-opacity="${(heat - .4).toFixed(2)}" stroke-width="3" stroke-linecap="round"/>` : ''}
      <rect x="40" y="${y + s + t + 6}" width="120" height="22" rx="4" fill="#5a6470" ${S2}/>
      <rect x="64" y="${y + s + t + 28}" width="72" height="16" fill="#4a535c" ${S2}/>`, '0 0 200 150');
  }

  // ---------- 第八關：火爐、水桶、白煙 ----------
  const furnace = () => svg(`
    <path d="M10 92 V40 C10 22 28 12 50 12 C72 12 90 22 90 40 V92Z" fill="#a8604a" ${L}/>
    <path d="M24 92 V52 C24 40 36 32 50 32 C64 32 76 40 76 52 V92Z" fill="#3a2a22" ${S2}/>
    <path d="M30 92 C26 80 36 74 38 64 C44 72 46 78 48 80 C48 68 54 58 52 48 C64 60 70 76 66 92Z" fill="#f08a3c"/>
    <path d="M40 92 C38 84 44 80 46 74 C50 80 54 86 54 92Z" fill="#ffc83d"/>
    ${[[18, 30], [34, 20], [66, 20], [82, 30]].map(([x, y]) => `<path d="M${x - 6} ${y} H${x + 6}" stroke="#7d4434" stroke-width="2.4"/>`).join('')}`);
  const bucket = () => svg(`
    <path d="M14 34 L24 92 H76 L86 34Z" fill="#9aa3a8" ${L}/>
    <ellipse cx="50" cy="34" rx="36" ry="9" fill="#6EC3DD" ${L}/>
    <path d="M18 52 H82 M21 72 H79" stroke="#7a8288" stroke-width="2.4"/>
    <path d="M30 32 C34 30 40 30 44 32" stroke="#fff" stroke-width="2.4" stroke-linecap="round"/>`);
  const puff = () => {
    const c = [[30, 60, 18], [50, 46, 22], [70, 60, 17], [50, 66, 18]];
    return svg(c.map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="#fff" opacity=".9"/>`).join(''));
  };

  // ---------- 第十關：水壺 ----------
  const pitcher = () => svg(`
    <path d="M28 24 H66 L70 34 C84 36 90 50 84 62 C80 70 74 72 70 70 L70 86 C70 90 66 92 62 92 H32 C28 92 24 90 24 86 V34Z" fill="#e3f1f6" ${L}/>
    <path d="M70 46 C78 46 80 56 74 62" fill="none" ${S2}/>
    <path d="M24 34 L10 26 L14 38 L24 40" fill="#e3f1f6" ${S2}/>
    <path d="M26 60 H68 V86 C68 88 66 90 62 90 H32 C29 90 26 88 26 86Z" fill="#6EC3DD"/>`);

  return { svg, mix, heatColor, bowlSide, bowlTop, mallet, jar, log, plastic, rock, pebbles, oreCu, oreSn, copper, tin, crucible, flames, bellows, hammer, hammerDown, forge, furnace, bucket, puff, pitcher };
})();
