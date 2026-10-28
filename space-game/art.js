// 《太陽系大探險》的小圖示（和其他遊戲同一套線條與配色）。行星的圖是 space.js 用程式畫的。
window.A = (function () {
  const INK = '#5b3a1e';
  const S2 = `stroke="${INK}" stroke-width="2.6" stroke-linejoin="round" stroke-linecap="round"`;
  const T = `stroke="${INK}" stroke-width="2.4" stroke-linecap="round" fill="none"`;
  const svg = (inner, vb = '0 0 100 100') =>
    `<svg viewBox="${vb}" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">${inner}</svg>`;

  // 提示用的手（食指往上指，指尖在左上角附近）
  const hand = () => svg(`
    <path d="M34 8 C40 8 42 12 42 18 L42 46 L46 44 C50 40 58 42 58 48 L62 46 C66 43 72 46 72 52 L76 51 C81 50 86 54 86 60 L86 76 C86 88 78 96 66 96 L52 96 C44 96 38 92 34 86 L18 62 C14 56 20 50 26 54 L26 18 C26 12 28 8 34 8Z" fill="#fff" ${S2}/>
    <path d="M42 46 L42 62 M58 48 L58 62 M72 52 L72 64" ${T}/>`);

  const sunIcon = () => svg(`
    <g ${T} stroke="#BD9558" stroke-width="5">${Array.from({ length: 8 }, (_, i) => {
      const a = i * Math.PI / 4, c = Math.cos(a), s = Math.sin(a);
      return `<path d="M${50 + c * 30} ${50 + s * 30} L${50 + c * 42} ${50 + s * 42}"/>`;
    }).join('')}</g>
    <circle cx="50" cy="50" r="22" fill="#F5B83D" ${S2}/>`);
  const moonIcon = () => svg(`<path d="M62 14 C40 18 28 36 30 56 C32 76 50 90 72 86 C58 80 50 66 50 50 C50 34 56 22 62 14Z" fill="#F3E8D6" ${S2}/>
    <circle cx="80" cy="24" r="3" fill="#BD9558"/><circle cx="84" cy="56" r="2.4" fill="#BD9558"/>`);

  // 月相（從地球看）：full 滿月、half 上弦（右半邊亮）、new 新月（看不見）
  const phase = kind => {
    const dark = '#3a3140', lit = '#f4efe2';
    if (kind === 'full') return svg(`<circle cx="50" cy="50" r="38" fill="${lit}" stroke="#BD9558" stroke-width="3"/>`);
    if (kind === 'half') return svg(`<circle cx="50" cy="50" r="38" fill="${dark}" stroke="#BD9558" stroke-width="3"/><path d="M50 12 A38 38 0 0 1 50 88Z" fill="${lit}"/>`);
    return svg(`<circle cx="50" cy="50" r="38" fill="${dark}" stroke="#BD9558" stroke-width="3" stroke-dasharray="6 6"/>`);
  };

  const cake = () => svg(`
    <rect x="18" y="50" width="64" height="34" rx="6" fill="#F3E8D6" ${S2}/>
    <path d="M18 62 C26 70 34 56 42 64 C50 72 58 56 66 64 C72 70 78 62 82 62" ${T}/>
    <rect x="46" y="28" width="8" height="22" fill="#DB2E27" ${S2}/>
    <path d="M50 12 C56 18 56 24 50 26 C44 24 44 18 50 12Z" fill="#F5B83D" ${S2}/>`);

  const house = () => svg(`<path d="M18 50 L50 20 L82 50Z" fill="#DB2E27" ${S2}/><rect x="28" y="48" width="44" height="34" fill="#fff" ${S2}/>
    <rect x="44" y="60" width="12" height="22" fill="#BD9558" ${S2}/>`);

  // 太空船（降落船）
  const ship = () => svg(`
    <path d="M50 8 C62 20 66 38 66 56 L34 56 C34 38 38 20 50 8Z" fill="#fff" ${S2}/>
    <circle cx="50" cy="34" r="8" fill="#A9D8E6" ${S2}/>
    <path d="M34 46 L20 66 L34 62Z M66 46 L80 66 L66 62Z" fill="#DB2E27" ${S2}/>
    <path d="M40 56 L34 84 M60 56 L66 84 M28 84 L40 84 M60 84 L72 84" ${T}/>`);
  const rocket = () => svg(`
    <path d="M50 6 C64 20 68 40 66 66 L34 66 C32 40 36 20 50 6Z" fill="#fff" ${S2}/>
    <circle cx="50" cy="36" r="9" fill="#A9D8E6" ${S2}/>
    <path d="M34 50 L20 76 L36 70Z M66 50 L80 76 L64 70Z" fill="#DB2E27" ${S2}/>
    <path d="M42 66 L50 92 L58 66Z" fill="#F5B83D" ${S2}/>`);

  // 有地面（太空船站在岩石地上）／沒有地面（一團團的氣體）
  const ground = () => svg(`
    <path d="M6 74 C20 66 30 70 42 66 C56 62 70 68 94 64 L94 94 L6 94Z" fill="#c9a27a" ${S2}/>
    <circle cx="28" cy="82" r="4" fill="#a8825c"/><circle cx="70" cy="80" r="5" fill="#a8825c"/>
    <g transform="translate(30 4) scale(.62)">${ship().replace(/<\/?svg[^>]*>/g, '')}</g>`);
  const gas = () => svg(`
    <path d="M10 44 C24 34 40 54 56 44 C70 36 80 42 92 38" ${T} stroke="#BD9558" stroke-width="7"/>
    <path d="M8 62 C22 54 36 72 54 62 C68 54 80 60 92 56" ${T} stroke="#c39c74" stroke-width="7"/>
    <path d="M14 80 C28 72 42 88 58 80 C72 72 82 78 90 74" ${T} stroke="#BD9558" stroke-width="7"/>
    <g transform="translate(36 2) scale(.4)" opacity=".75">${ship().replace(/<\/?svg[^>]*>/g, '')}</g>`);

  return { hand, sunIcon, moonIcon, phase, cake, house, ship, rocket, ground, gas };
})();
