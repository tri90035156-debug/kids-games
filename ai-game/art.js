// 《AI 從哪裡來》的手繪風 SVG 插圖（和種子遊戲同一套線條與配色）
window.A = (function () {
  const INK = '#5b3a1e';
  const L = `stroke="${INK}" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"`;
  const S2 = `stroke="${INK}" stroke-width="2.6" stroke-linejoin="round" stroke-linecap="round"`;
  const T = `stroke="${INK}" stroke-width="1.8" stroke-linecap="round" fill="none"`;
  const svg = (inner, vb = '0 0 100 100') =>
    `<svg viewBox="${vb}" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">${inner}</svg>`;

  // ---------- 第一關：身體 ----------
  const hand = () => svg(`
    <path d="M30 92 L30 58 C30 52 24 44 18 40 C14 37 16 31 22 33 C28 35 32 42 34 46 L34 20 C34 14 42 14 42 20 L42 42 L42 12 C42 6 50 6 50 12 L50 42 L50 16 C50 10 58 10 58 16 L58 44 L58 24 C58 18 66 18 66 24 L66 62 C66 76 60 84 58 92Z" fill="#f2c9a0" ${S2}/>`);
  const foot = () => svg(`
    <path d="M30 14 L56 14 L58 58 C74 62 88 68 88 80 C88 88 82 90 74 90 L30 90 C24 90 22 84 24 76Z" fill="#f2c9a0" ${S2}/>
    ${[[64, 70], [72, 72], [80, 76]].map(([x, y]) => `<path d="M${x} ${y} L${x} ${y + 6}" ${T}/>`).join('')}`);
  const eye = () => svg(`
    <path d="M8 50 C26 24 74 24 92 50 C74 76 26 76 8 50Z" fill="#fff" ${S2}/>
    <circle cx="50" cy="50" r="17" fill="#6b9fc4" ${S2}/><circle cx="50" cy="50" r="8" fill="${INK}"/>
    <circle cx="44" cy="44" r="3.4" fill="#fff"/>`);
  const ear = () => svg(`
    <path d="M38 88 C30 88 28 78 34 72 C40 66 36 60 32 54 C22 40 28 12 54 12 C76 12 84 32 78 48 C74 58 64 62 62 74 C60 84 52 90 38 88Z" fill="#f2c9a0" ${S2}/>
    <path d="M44 56 C40 44 44 30 56 30 C66 30 68 42 62 48 C58 52 52 50 52 44" ${T} stroke-width="2.6"/>`);
  const head = () => svg(`
    <circle cx="50" cy="52" r="38" fill="#f2c9a0" ${S2}/>
    <path d="M14 46 C14 18 40 8 60 12 C80 16 90 32 86 48 C78 34 62 30 50 32 C36 34 22 38 14 46Z" fill="#4a3428" ${S2}/>
    <circle cx="38" cy="56" r="3.6" fill="${INK}"/><circle cx="62" cy="56" r="3.6" fill="${INK}"/>
    <path d="M40 72 Q50 80 60 72" ${T} stroke-width="2.6"/>
    <circle cx="29" cy="66" r="5" fill="#f29bb8" opacity=".6"/><circle cx="71" cy="66" r="5" fill="#f29bb8" opacity=".6"/>`);

  // ---------- 第一關：工具 ----------
  const hammer = () => svg(`
    <rect x="45" y="34" width="10" height="58" rx="4" fill="#c9965a" ${S2} transform="rotate(30 50 60)"/>
    <path d="M18 22 L58 22 L64 30 L64 42 L58 46 L18 46Z" fill="#9aa3a8" ${S2} transform="rotate(30 40 34)"/>`);
  const bike = () => svg(`
    <circle cx="24" cy="66" r="17" fill="none" ${L}/><circle cx="76" cy="66" r="17" fill="none" ${L}/>
    <circle cx="24" cy="66" r="3" fill="${INK}"/><circle cx="76" cy="66" r="3" fill="${INK}"/>
    <path d="M24 66 L42 40 L66 40 L76 66 M42 40 L50 66 L66 40 M50 66 L24 66" fill="none" stroke="#DB2E27" stroke-width="4" stroke-linejoin="round" stroke-linecap="round"/>
    <path d="M36 32 L48 32 M66 40 L62 26 L70 24" fill="none" ${L}/>`);
  const glasses = () => svg(`
    <circle cx="28" cy="54" r="17" fill="#e3f1f6" ${L}/><circle cx="72" cy="54" r="17" fill="#e3f1f6" ${L}/>
    <path d="M45 52 Q50 46 55 52 M11 50 L4 40 M89 50 L96 40" fill="none" ${L}/>
    <path d="M20 48 L28 42 M64 48 L72 42" stroke="#fff" stroke-width="3" stroke-linecap="round"/>`);
  const phone = () => svg(`
    <rect x="28" y="8" width="44" height="84" rx="9" fill="#5a6470" ${L}/>
    <rect x="33" y="18" width="34" height="58" rx="3" fill="#cfe6ef"/>
    <circle cx="50" cy="84" r="3.4" fill="#cfe6ef"/>
    <path d="M78 30 Q86 40 78 50 M84 22 Q98 40 84 58" fill="none" stroke="#BD9558" stroke-width="3.4" stroke-linecap="round"/>`);
  const chip = () => {
    let pins = '';
    for (let i = 0; i < 4; i++) {
      const p = 30 + i * 13;
      pins += `<path d="M${p} 14 L${p} 22 M${p} 78 L${p} 86 M14 ${p} L22 ${p} M78 ${p} L86 ${p}" stroke="${INK}" stroke-width="3.4" stroke-linecap="round"/>`;
    }
    return svg(pins + `<rect x="22" y="22" width="56" height="56" rx="8" fill="#6C2024" ${S2}/>
      <rect x="30" y="30" width="40" height="40" rx="4" fill="none" stroke="#BD9558" stroke-width="2"/>
      <text x="50" y="59" text-anchor="middle" font-family="ui-monospace,Menlo,monospace" font-weight="900" font-size="22" fill="#fff">AI</text>`);
  };

  // ---------- 第二關：機器人、星星、牆 ----------
  const robot = () => svg(`
    <path d="M50 8 L50 20" ${L}/><circle cx="50" cy="8" r="5" fill="#DB2E27" ${S2}/>
    <rect x="18" y="20" width="64" height="50" rx="14" fill="#cfd8dc" ${L}/>
    <rect x="28" y="32" width="44" height="24" rx="10" fill="#2f3b44"/>
    <circle cx="40" cy="44" r="5" fill="#7fe0ff"/><circle cx="60" cy="44" r="5" fill="#7fe0ff"/>
    <rect x="30" y="72" width="40" height="18" rx="6" fill="#9aa3a8" ${S2}/>
    <rect x="8" y="38" width="10" height="20" rx="5" fill="#9aa3a8" ${S2}/><rect x="82" y="38" width="10" height="20" rx="5" fill="#9aa3a8" ${S2}/>`);
  const star = () => svg(`<path d="M50 8 L61 36 L91 38 L68 57 L76 87 L50 70 L24 87 L32 57 L9 38 L39 36Z" fill="#f2c14e" ${L}/>`);
  const wall = () => svg(`<rect x="6" y="6" width="88" height="88" rx="6" fill="#b8aea3" ${S2}/>
    <path d="M6 36 H94 M6 64 H94 M40 6 V36 M70 36 V64 M30 64 V94 M64 64 V94" stroke="#8c8278" stroke-width="2.4"/>`);
  const arrow = dir => {
    const rot = { up: 0, right: 90, down: 180, left: 270 }[dir];
    return svg(`<path d="M50 14 L82 50 L62 50 L62 86 L38 86 L38 50 L18 50Z" fill="#6C2024" transform="rotate(${rot} 50 50)"/>`);
  };

  // ---------- 動物（第三～七關） ----------
  const whisk = (x, y, s) => `<path d="M${x} ${y} L${x + 20 * s} ${y - 4} M${x} ${y + 4} L${x + 21 * s} ${y + 5}" ${T}/>`;
  function cat(fur = '#f0a54a', { fold = false, stripes = '#d27f2c', eyeC = '#9bc53d' } = {}) {
    const ears = fold
      ? `<path d="M24 40 C24 26 36 24 42 32 C36 34 30 38 24 40Z" fill="${fur}" ${S2}/><path d="M76 40 C76 26 64 24 58 32 C64 34 70 38 76 40Z" fill="${fur}" ${S2}/>`
      : `<path d="M22 46 L20 12 L46 32Z" fill="${fur}" ${S2}/><path d="M78 46 L80 12 L54 32Z" fill="${fur}" ${S2}/>
         <path d="M25 38 L24 20 L38 31Z" fill="#f4b6c2"/><path d="M75 38 L76 20 L62 31Z" fill="#f4b6c2"/>`;
    const st = stripes ? `<path d="M50 32 L50 42 M40 33 L42 41 M60 33 L58 41" stroke="${stripes}" stroke-width="3.4" stroke-linecap="round"/>` : '';
    return svg(`${ears}
      <ellipse cx="50" cy="58" rx="33" ry="28" fill="${fur}" ${S2}/>${st}
      <ellipse cx="38" cy="56" rx="5" ry="6.4" fill="${eyeC}" ${S2}/><ellipse cx="62" cy="56" rx="5" ry="6.4" fill="${eyeC}" ${S2}/>
      <ellipse cx="38" cy="56" rx="1.6" ry="4.4" fill="${INK}"/><ellipse cx="62" cy="56" rx="1.6" ry="4.4" fill="${INK}"/>
      <path d="M46 66 L54 66 L50 71Z" fill="#e88a9a" ${S2}/>
      <path d="M50 71 Q46 77 42 75 M50 71 Q54 77 58 75" ${T}/>
      ${whisk(34, 68, -1)}${whisk(66, 68, 1)}`);
  }
  const catOrange = () => cat();
  const catBlack = () => cat('#3b3434', { stripes: '', eyeC: '#f2c14e' });
  const catFold = () => cat('#d9d4cc', { fold: true, stripes: '#a9a39a', eyeC: '#e0a21f' });
  const catSleep = () => svg(`
    <path d="M14 76 C10 50 34 38 58 40 C82 42 92 58 88 74 C84 88 30 92 14 76Z" fill="#f0a54a" ${S2}/>
    <path d="M86 70 C96 82 76 92 52 88" fill="none" stroke="${INK}" stroke-width="9" stroke-linecap="round"/>
    <path d="M86 70 C96 82 76 92 52 88" fill="none" stroke="#f0a54a" stroke-width="5" stroke-linecap="round"/>
    <path d="M22 50 L20 30 L34 42Z" fill="#f0a54a" ${S2}/><path d="M44 42 L50 24 L56 42Z" fill="#f0a54a" ${S2}/>
    <ellipse cx="36" cy="58" rx="20" ry="15" fill="#f0a54a" ${S2}/>
    <path d="M26 58 Q30 62 34 58 M40 58 Q44 62 48 58" ${T} stroke-width="2.2"/>
    <path d="M60 50 L64 60 M70 50 L72 60" stroke="#d27f2c" stroke-width="3.4" stroke-linecap="round"/>
    <text x="70" y="30" font-family="ui-monospace,Menlo,monospace" font-weight="700" font-size="14" fill="#8A7A70">z z</text>`);
  const fox = () => svg(`
    <path d="M18 50 L14 8 L44 30Z" fill="#e0762f" ${S2}/><path d="M82 50 L86 8 L56 30Z" fill="#e0762f" ${S2}/>
    <path d="M17 26 L15 9 L27 18Z" fill="${INK}"/><path d="M83 26 L85 9 L73 18Z" fill="${INK}"/>
    <path d="M14 46 C16 30 36 26 50 26 C64 26 84 30 86 46 C86 60 70 70 58 84 L50 92 L42 84 C30 70 14 60 14 46Z" fill="#e0762f" ${S2}/>
    <path d="M14 48 C24 56 38 62 46 82 L50 92 L54 82 C62 62 76 56 86 48 C80 70 64 76 54 90 L50 94 L46 90 C36 76 20 70 14 48Z" fill="#fff6ea"/>
    <ellipse cx="36" cy="50" rx="4" ry="5" fill="${INK}"/><ellipse cx="64" cy="50" rx="4" ry="5" fill="${INK}"/>
    <ellipse cx="50" cy="86" rx="5" ry="4" fill="${INK}"/>
    ${whisk(42, 78, -1)}${whisk(58, 78, 1)}`);
  const dog = () => svg(`
    <ellipse cx="50" cy="54" rx="30" ry="30" fill="#d9a066" ${S2}/>
    <path d="M24 30 C10 34 8 62 18 74 C26 70 28 52 28 40Z" fill="#8a5a2e" ${S2}/>
    <path d="M76 30 C90 34 92 62 82 74 C74 70 72 52 72 40Z" fill="#8a5a2e" ${S2}/>
    <ellipse cx="50" cy="70" rx="16" ry="12" fill="#f3dcbd" ${S2}/>
    <circle cx="39" cy="50" r="4" fill="${INK}"/><circle cx="61" cy="50" r="4" fill="${INK}"/>
    <ellipse cx="50" cy="63" rx="7" ry="5" fill="${INK}"/>
    <path d="M46 75 Q50 86 54 75Z" fill="#e88a9a" ${S2}/>
    ${whisk(42, 66, -1)}${whisk(58, 66, 1)}`);
  const rabbit = () => svg(`
    <ellipse cx="36" cy="26" rx="9" ry="22" fill="#eee9e2" ${S2}/><ellipse cx="64" cy="26" rx="9" ry="22" fill="#eee9e2" ${S2}/>
    <ellipse cx="36" cy="28" rx="4" ry="15" fill="#f4b6c2"/><ellipse cx="64" cy="28" rx="4" ry="15" fill="#f4b6c2"/>
    <ellipse cx="50" cy="66" rx="30" ry="26" fill="#eee9e2" ${S2}/>
    <circle cx="39" cy="62" r="4" fill="${INK}"/><circle cx="61" cy="62" r="4" fill="${INK}"/>
    <path d="M46 72 L54 72 L50 76Z" fill="#e88a9a"/>
    <path d="M50 76 L50 80 M46 82 Q50 84 54 82" ${T}/>`);
  const owl = () => svg(`
    <path d="M24 36 L20 12 L40 26Z" fill="#9a6a35" ${S2}/><path d="M76 36 L80 12 L60 26Z" fill="#9a6a35" ${S2}/>
    <ellipse cx="50" cy="56" rx="32" ry="38" fill="#9a6a35" ${S2}/>
    <ellipse cx="50" cy="68" rx="20" ry="22" fill="#e8cfa6"/>
    ${[[42, 62], [50, 70], [58, 62], [44, 78], [56, 78]].map(([x, y]) => `<path d="M${x - 4} ${y} Q${x} ${y + 4} ${x + 4} ${y}" ${T}/>`).join('')}
    <circle cx="36" cy="40" r="12" fill="#fff" ${S2}/><circle cx="64" cy="40" r="12" fill="#fff" ${S2}/>
    <circle cx="36" cy="40" r="6" fill="${INK}"/><circle cx="64" cy="40" r="6" fill="${INK}"/>
    <path d="M45 50 L55 50 L50 60Z" fill="#e0a21f" ${S2}/>`);
  const ANIMALS = { catOrange, catBlack, catFold, catSleep, fox, dog, rabbit, owl };

  // ---------- 籃子、電腦、旋鈕 ----------
  const basket = (yes) => svg(`
    <path d="M10 40 L90 40 L80 88 L20 88Z" fill="#e6c48f" ${L}/>
    <path d="M14 56 H86 M17 72 H83 M34 40 L36 88 M50 40 V88 M66 40 L64 88" stroke="#b08a52" stroke-width="2.4"/>
    <path d="M24 40 C24 12 76 12 76 40" fill="none" ${L}/>
    ${yes ? `<path d="M36 60 L46 70 L66 50" fill="none" stroke="#3F6B2E" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>`
          : `<path d="M38 50 L62 74 M62 50 L38 74" stroke="#DB2E27" stroke-width="7" stroke-linecap="round"/>`}`);
  const computer = (face = 'think') => svg(`
    <rect x="10" y="12" width="80" height="58" rx="8" fill="#5a6470" ${L}/>
    <rect x="17" y="19" width="66" height="44" rx="4" fill="#cfe6ef"/>
    ${face === 'happy'
      ? `<path d="M34 36 Q38 32 42 36 M58 36 Q62 32 66 36" ${T} stroke-width="3"/><path d="M38 48 Q50 58 62 48" ${T} stroke-width="3"/>`
      : `<circle cx="38" cy="38" r="4" fill="${INK}"/><circle cx="62" cy="38" r="4" fill="${INK}"/><path d="M42 52 H58" ${T} stroke-width="3"/>`}
    <path d="M40 70 L36 84 H64 L60 70Z" fill="#9aa3a8" ${S2}/><rect x="26" y="84" width="48" height="8" rx="4" fill="#9aa3a8" ${S2}/>`);
  const knob = () => svg(`<circle cx="50" cy="50" r="34" fill="#f3e8d6" ${L}/>
    <circle cx="50" cy="50" r="24" fill="#fff" stroke="#BD9558" stroke-width="3"/>
    <path d="M50 50 L50 24" stroke="#6C2024" stroke-width="6" stroke-linecap="round"/>`);
  const photo = () => svg(`<rect x="12" y="18" width="76" height="64" rx="6" fill="#fff" ${L}/>
    <path d="M18 74 L40 48 L56 64 L66 54 L82 74Z" fill="#9ccc7a"/><circle cx="68" cy="36" r="7" fill="#f2c14e"/>`);

  // ---------- 第六關的小圖示 ----------
  const earIcon = () => svg(`<path d="M20 86 L30 12 L80 70Z" fill="#f0a54a" ${L}/><path d="M32 70 L37 34 L62 64Z" fill="#f4b6c2"/>`);
  const whiskerIcon = () => svg(`<circle cx="50" cy="50" r="8" fill="#e88a9a" ${S2}/>
    <path d="M40 46 L8 34 M40 52 L6 54 M40 58 L10 72 M60 46 L92 34 M60 52 L94 54 M60 58 L90 72" stroke="${INK}" stroke-width="3" stroke-linecap="round"/>`);
  const furIcon = () => svg(`<g fill="none" stroke="#d27f2c" stroke-width="5" stroke-linecap="round">
    ${[20, 36, 52, 68, 84].map((x, i) => `<path d="M${x} 86 C${x - 10} 66 ${x + 8} 46 ${x - 2} ${20 + (i % 2) * 8}"/>`).join('')}</g>`);

  // ---------- 第八關：電腦的歷史 ----------
  const bigComputer = () => svg(`
    <rect x="4" y="18" width="92" height="70" rx="4" fill="#cfd8dc" ${S2}/>
    ${[12, 40, 68].map(x => `<rect x="${x}" y="24" width="22" height="58" rx="2" fill="#e8eef0" ${T}/>
      <circle cx="${x + 11}" cy="36" r="7" fill="#fff" ${T}/><circle cx="${x + 11}" cy="36" r="2" fill="${INK}"/>
      ${[50, 58, 66, 74].map((y, k) => `<circle cx="${x + 6 + (k % 2) * 10}" cy="${y}" r="2.6" fill="${k % 3 ? '#f2c14e' : '#DB2E27'}"/>`).join('')}`).join('')}
    <circle cx="86" cy="80" r="4" fill="#5b3a1e"/><path d="M84 92 L84 84 M88 92 L88 84" ${T}/>
    <circle cx="86" cy="74" r="3.6" fill="#f2c9a0" ${T}/>`);
  const people = () => {
    const p = (x, c) => `<circle cx="${x}" cy="40" r="9" fill="#f2c9a0" ${S2}/><path d="M${x - 12} 74 C${x - 12} 54 ${x + 12} 54 ${x + 12} 74Z" fill="${c}" ${S2}/>`;
    return svg(`<path d="M50 6 C40 6 36 14 36 20 C36 26 42 28 42 34 H58 C58 28 64 26 64 20 C64 14 60 6 50 6Z" fill="#f2c14e" ${S2}/>
      <path d="M44 38 H56" ${L}/>
      ${p(20, '#6C2024')}${p(50, '#5a6470')}${p(80, '#BD9558')}
      <rect x="6" y="72" width="88" height="10" rx="3" fill="#c9965a" ${S2}/>
      <path d="M14 82 L14 94 M86 82 L86 94" ${L}/>`);
  };
  const desktop = () => svg(`
    <rect x="16" y="14" width="68" height="50" rx="5" fill="#e8e2d6" ${L}/>
    <rect x="23" y="21" width="54" height="36" rx="2" fill="#2f5d50"/>
    <path d="M28 30 H50 M28 38 H62 M28 46 H44" stroke="#9fe0a8" stroke-width="3" stroke-linecap="round"/>
    <path d="M42 64 L40 72 H60 L58 64Z" fill="#cfc6b6" ${S2}/>
    <rect x="18" y="76" width="64" height="14" rx="3" fill="#e8e2d6" ${S2}/>
    <path d="M24 83 H76" stroke="#b8aea3" stroke-width="3" stroke-dasharray="4 3"/>`);
  const chatPhone = () => svg(`
    <rect x="22" y="6" width="56" height="88" rx="10" fill="#5a6470" ${L}/>
    <rect x="28" y="16" width="44" height="66" rx="4" fill="#fff"/>
    <rect x="32" y="22" width="26" height="12" rx="6" fill="#e3f1f6"/>
    <rect x="42" y="40" width="26" height="12" rx="6" fill="#f3e8d6"/>
    <rect x="32" y="58" width="30" height="12" rx="6" fill="#e3f1f6"/>
    <text x="60" y="68" font-family="ui-monospace,Menlo,monospace" font-weight="900" font-size="9" fill="#6C2024">AI</text>
    <circle cx="50" cy="88" r="2.6" fill="#cfe6ef"/>`);

  // ---------- 第十關：AI 畫錯的圖（三個錯誤可以點） ----------
  // 回傳整張圖；data-bug="1/2/3" 的 <g> 是可以點的錯誤
  const oddScene = () => svg(`
    <rect width="400" height="260" fill="#eef5f7"/>
    <rect y="200" width="400" height="60" fill="#cfe3b4"/>
    <circle cx="350" cy="44" r="22" fill="#ffc83d" ${S2}/>
    <!-- 房子：門開在屋頂上 -->
    <rect x="34" y="120" width="110" height="84" fill="#f3e8d6" ${L}/>
    <path d="M24 124 L89 66 L154 124Z" fill="#DB2E27" ${L}/>
    <rect x="56" y="140" width="26" height="24" fill="#cfe6ef" ${S2}/><rect x="100" y="140" width="26" height="24" fill="#cfe6ef" ${S2}/>
    <g data-bug="3"><rect x="76" y="40" width="26" height="40" rx="3" fill="#9a6a35" ${S2}/>
      <circle cx="96" cy="62" r="2.6" fill="#f2c14e"/><rect x="60" y="30" width="58" height="62" fill="transparent"/></g>
    <!-- 樹：長出魚 -->
    <rect x="236" y="120" width="18" height="84" fill="#8a5a2e" ${S2}/>
    <g fill="#4fae52" ${S2}><circle cx="222" cy="104" r="30"/><circle cx="268" cy="104" r="30"/><circle cx="245" cy="78" r="34"/></g>
    <g fill="#4fae52"><circle cx="222" cy="104" r="28"/><circle cx="268" cy="104" r="28"/><circle cx="245" cy="78" r="32"/></g>
    <g data-bug="2">
      ${[[224, 92], [262, 104], [246, 66]].map(([x, y]) => `<path d="M${x + 10} ${y} L${x + 20} ${y - 7} L${x + 20} ${y + 7}Z" fill="#4aa9c9" ${S2}/>
        <ellipse cx="${x}" cy="${y}" rx="12" ry="7" fill="#6EC3DD" ${S2}/><circle cx="${x - 6}" cy="${y - 2}" r="1.6" fill="${INK}"/>`).join('')}
      <rect x="206" y="50" width="80" height="70" fill="transparent"/></g>
    <!-- 貓：兩條尾巴 -->
    <ellipse cx="330" cy="196" rx="34" ry="20" fill="#f0a54a" ${S2}/>
    <g data-bug="1"><path d="M362 190 C380 176 376 150 362 146" fill="none" stroke="${INK}" stroke-width="9" stroke-linecap="round"/>
      <path d="M362 190 C380 176 376 150 362 146" fill="none" stroke="#f0a54a" stroke-width="5" stroke-linecap="round"/>
      <path d="M364 198 C388 196 394 172 386 160" fill="none" stroke="${INK}" stroke-width="9" stroke-linecap="round"/>
      <path d="M364 198 C388 196 394 172 386 160" fill="none" stroke="#f0a54a" stroke-width="5" stroke-linecap="round"/>
      <rect x="352" y="138" width="46" height="66" fill="transparent"/></g>
    <path d="M300 206 L300 220 M314 210 L314 222 M344 210 L344 222 M356 206 L356 220" stroke="${INK}" stroke-width="7" stroke-linecap="round"/>
    <path d="M300 206 L300 220 M314 210 L314 222 M344 210 L344 222 M356 206 L356 220" stroke="#f0a54a" stroke-width="3.4" stroke-linecap="round"/>
    <path d="M286 178 L284 152 L300 168Z M312 172 L318 150 L322 172Z" fill="#f0a54a" ${S2}/>
    <circle cx="302" cy="182" r="20" fill="#f0a54a" ${S2}/>
    <circle cx="295" cy="180" r="2.6" fill="${INK}"/><circle cx="309" cy="180" r="2.6" fill="${INK}"/>
    <path d="M300 188 L304 188 L302 191Z" fill="#e88a9a"/>`, '0 0 400 260');

  // ---------- 第十關：願望 ----------
  const translate = () => svg(`
    <path d="M8 16 H54 V50 H30 L18 60 V50 H8Z" fill="#e3f1f6" ${S2}/>
    <text x="31" y="42" text-anchor="middle" font-family="Noto Serif TC,serif" font-weight="900" font-size="24" fill="#6C2024">文</text>
    <path d="M46 44 H92 V78 H82 V88 L70 78 H46Z" fill="#f3e8d6" ${S2}/>
    <text x="69" y="70" text-anchor="middle" font-family="Georgia,serif" font-weight="700" font-size="24" fill="#6C2024">A</text>`);
  const doctor = () => svg(`
    <rect x="18" y="12" width="64" height="76" rx="6" fill="#2f3b44" ${L}/>
    <path d="M50 22 V78 M50 30 C40 30 30 34 30 44 M50 30 C60 30 70 34 70 44 M50 42 C40 42 32 48 32 56 M50 42 C60 42 68 48 68 56 M50 54 C42 54 36 60 36 66 M50 54 C58 54 64 60 64 66" fill="none" stroke="#e8eef0" stroke-width="3" stroke-linecap="round"/>
    <circle cx="62" cy="58" r="9" fill="none" stroke="#f2c14e" stroke-width="3.4"/>`);
  const earth = () => svg(`
    <circle cx="50" cy="52" r="38" fill="#6EC3DD" ${L}/>
    <path d="M26 30 C34 26 44 32 40 42 C36 50 24 48 20 58 C16 48 18 36 26 30Z M54 22 C64 20 76 28 80 38 C72 40 64 36 60 44 C58 52 66 58 62 68 C54 72 50 62 50 54 C50 44 46 30 54 22Z M34 72 C42 70 48 76 44 84 C38 84 32 80 34 72Z" fill="#7cbf5a" ${S2}/>`);
  const book = () => svg(`
    <path d="M50 26 C40 18 22 16 8 20 V82 C22 78 40 80 50 88Z" fill="#fff" ${L}/>
    <path d="M50 26 C60 18 78 16 92 20 V82 C78 78 60 80 50 88Z" fill="#f3e8d6" ${L}/>
    <path d="M18 34 H40 M18 44 H40 M18 54 H36" stroke="#b8aea3" stroke-width="3" stroke-linecap="round"/>
    <path d="M71 30 L75 41 L86 41 L77 48 L80 59 L71 52 L62 59 L65 48 L56 41 L67 41Z" fill="#f2c14e" ${S2}/>`);

  return {
    svg, hand, foot, eye, ear, head, hammer, bike, glasses, phone, chip,
    robot, star, wall, arrow, ANIMALS, basket, computer, knob, photo,
    earIcon, whiskerIcon, furIcon, bigComputer, people, desktop, chatPhone,
    oddScene, translate, doctor, earth, book,
  };
})();
