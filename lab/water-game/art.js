// 《小水滴變變變》的 SVG：圓潤幾何、無描邊、霧面配色、軟影子。每個物件一個函式。
window.A = (function () {
  const C = {
    ink: '#3B3430', paper: '#FFF8EE', wood: '#D9B27A', wood2: '#B98E5A', sage: '#6F9A72', sage2: '#A9C4A3',
    blue: '#3C9BE0', blue2: '#7FBCE8', blue3: '#B9DCF2', ice: '#CFE6F2', ice2: '#EAF5FA', coral: '#F05A3C',
    amber: '#F2A33A', yel: '#F7C948', cream: '#F3E8D6', glass: '#E3EFF3', shade: 'rgba(59,52,48,.12)', white: '#FFFFFF',
  };
  const svg = (inner, vb = '0 0 200 200', extra = '') =>
    `<svg viewBox="${vb}" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" ${extra}>${inner}</svg>`;
  const shadow = (cx, cy, rx, ry = rx * .18) => `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${C.shade}"/>`;

  // ---------- 主角：小水滴 ----------
  const dropShape = (cx, cy, s, fill) => `<path d="M${cx} ${cy - 60 * s} C${cx + 18 * s} ${cy - 30 * s} ${cx + 44 * s} ${cy - 6 * s} ${cx + 44 * s} ${cy + 20 * s} C${cx + 44 * s} ${cy + 46 * s} ${cx + 24 * s} ${cy + 62 * s} ${cx} ${cy + 62 * s} C${cx - 24 * s} ${cy + 62 * s} ${cx - 44 * s} ${cy + 46 * s} ${cx - 44 * s} ${cy + 20 * s} C${cx - 44 * s} ${cy - 6 * s} ${cx - 18 * s} ${cy - 30 * s} ${cx} ${cy - 60 * s}Z" fill="${fill}"/>`;
  const hero = () => svg(`
    ${shadow(100, 176, 50, 8)}
    ${dropShape(100, 104, 1.1, C.blue)}
    <path d="M70 104 C70 86 80 72 90 64" stroke="${C.white}" stroke-opacity=".55" stroke-width="9" stroke-linecap="round" fill="none"/>
    <circle cx="86" cy="126" r="5.5" fill="${C.ink}"/><circle cx="116" cy="126" r="5.5" fill="${C.ink}"/>
    <circle cx="76" cy="140" r="7" fill="${C.coral}" opacity=".35"/><circle cx="126" cy="140" r="7" fill="${C.coral}" opacity=".35"/>
    <path d="M93 142 Q101 149 109 142" stroke="${C.ink}" stroke-width="4" stroke-linecap="round" fill="none"/>`);
  const drop = (fill = C.blue) => svg(`${dropShape(100, 96, 1.1, fill)}<path d="M72 100 C72 84 80 72 90 64" stroke="#fff" stroke-opacity=".5" stroke-width="8" stroke-linecap="round" fill="none"/>`);

  // ---------- 太陽、雪花、手 ----------
  const sunInner = (cx, cy, r, id = '') => {
    let rays = '';
    for (let i = 0; i < 8; i++) {
      const a = i * Math.PI / 4, x1 = cx + Math.cos(a) * (r + 10), y1 = cy + Math.sin(a) * (r + 10), x2 = cx + Math.cos(a) * (r + 26), y2 = cy + Math.sin(a) * (r + 26);
      rays += `<path d="M${x1.toFixed(1)} ${y1.toFixed(1)} L${x2.toFixed(1)} ${y2.toFixed(1)}" stroke="${C.amber}" stroke-width="10" stroke-linecap="round"/>`;
    }
    return `<g ${id ? 'id="' + id + '"' : ''} class="wg-rays">${rays}</g><circle cx="${cx}" cy="${cy}" r="${r}" fill="${C.yel}"/><circle cx="${cx - r * .3}" cy="${cy - r * .3}" r="${r * .28}" fill="#fff" opacity=".35"/>`;
  };
  const sun = () => svg(sunInner(100, 100, 46));
  const snowflake = (col = C.blue2) => {
    let arms = '';
    for (let i = 0; i < 6; i++) {
      const a = i * 60;
      arms += `<g transform="rotate(${a} 100 100)"><rect x="93" y="30" width="14" height="70" rx="7" fill="${col}"/>
        <rect x="93" y="44" width="12" height="30" rx="6" fill="${col}" transform="rotate(40 100 58)"/>
        <rect x="95" y="44" width="12" height="30" rx="6" fill="${col}" transform="rotate(-40 100 58)"/></g>`;
    }
    return svg(arms + `<circle cx="100" cy="100" r="16" fill="${C.ice2}"/>`);
  };
  const hand = () => svg(`
    <path d="M70 196 C58 170 46 150 40 132 C36 120 48 112 58 122 L72 138 L72 54 C72 42 92 42 92 54 L92 108 L92 96 C92 86 110 86 110 96 L110 112 L110 102 C110 92 128 92 128 102 L128 116 L128 110 C128 100 146 100 146 112 L146 150 C146 172 136 186 130 196Z" fill="#F4D3B4"/>
    <path d="M78 64 L86 64" stroke="#fff" stroke-opacity=".6" stroke-width="5" stroke-linecap="round"/>`, '0 0 200 200');

  // ---------- 冰塊 ----------
  const cubeG = (x, y, w, h, extra = '') => `<g ${extra}>
    <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${w * .2}" fill="${C.ice}"/>
    <rect x="${x + w * .1}" y="${y + h * .08}" width="${w * .8}" height="${h * .34}" rx="${w * .14}" fill="${C.ice2}"/>
    <rect x="${x + w * .16}" y="${y + h * .2}" width="${w * .16}" height="${h * .48}" rx="${w * .08}" fill="#fff" opacity=".7"/></g>`;
  const iceCube = () => svg(shadow(100, 160, 56, 9) + cubeG(46, 50, 108, 104));

  // ---------- 第一關：盤子上的冰塊（會融化） ----------
  const meltScene = () => svg(`
    ${shadow(120, 168, 96, 10)}
    <ellipse cx="120" cy="150" rx="100" ry="20" fill="${C.cream}"/>
    <ellipse cx="120" cy="146" rx="84" ry="14" fill="#fff"/>
    <ellipse id="wgPuddle" cx="120" cy="147" rx="0" ry="0" fill="${C.blue2}" opacity=".85"/>
    <ellipse id="wgShine" cx="100" cy="144" rx="0" ry="0" fill="#fff" opacity=".6"/>
    <g id="wgCube">${cubeG(58, 24, 124, 122)}</g>`, '14 14 212 168');

  // ---------- 第三關：瓶子（水結冰，冒出瓶口）、杯子（冰浮起來） ----------
  const bottleScene = () => svg(`
    ${shadow(100, 200, 52, 8)}
    <defs><clipPath id="wgBclip"><path d="M80 34 L120 34 L120 62 C142 70 150 84 150 104 L150 182 C150 192 142 198 132 198 L68 198 C58 198 50 192 50 182 L50 104 C50 84 58 70 80 62Z"/></clipPath></defs>
    <path d="M80 34 L120 34 L120 62 C142 70 150 84 150 104 L150 182 C150 192 142 198 132 198 L68 198 C58 198 50 192 50 182 L50 104 C50 84 58 70 80 62Z" fill="${C.glass}"/>
    <rect x="74" y="26" width="52" height="12" rx="6" fill="${C.glass}"/>
    <g clip-path="url(#wgBclip)"><rect id="wgBw" x="40" y="46" width="120" height="170" fill="${C.blue2}"/></g>
    <ellipse id="wgDome" cx="100" cy="34" rx="19" ry="0" fill="${C.ice}"/>
    <rect x="62" y="96" width="10" height="70" rx="5" fill="#fff" opacity=".55"/>`, '40 16 120 194');
  const floatScene = () => svg(`
    ${shadow(100, 200, 62, 8)}
    <path d="M40 60 L160 60 L150 190 C149 196 144 200 138 200 L62 200 C56 200 51 196 50 190Z" fill="${C.glass}"/>
    <path d="M44 100 L156 100 L150 190 C149 196 144 200 138 200 L62 200 C56 200 51 196 50 190Z" fill="${C.blue2}" opacity=".9"/>
    <g id="wgFloat" class="wg-floater">${cubeG(78, 0, 44, 42)}</g>
    <path d="M44 100 L156 100" stroke="#fff" stroke-opacity=".7" stroke-width="3"/>
    <rect x="56" y="112" width="8" height="64" rx="4" fill="#fff" opacity=".5"/>`, '0 0 200 210');

  // ---------- 第四關：生活物品 ----------
  const popsicle = (stage = 0) => {
    const sticks = `<rect x="92" y="128" width="16" height="52" rx="8" fill="${C.wood}"/>`;
    const puddles = ['', `<ellipse cx="100" cy="184" rx="26" ry="5" fill="${C.coral}" opacity=".35"/>`,
      `<ellipse cx="100" cy="184" rx="50" ry="8" fill="${C.coral}" opacity=".4"/>`,
      `<ellipse cx="100" cy="184" rx="70" ry="10" fill="${C.coral}" opacity=".45"/>`][stage];
    const bodies = [
      `<rect x="66" y="30" width="68" height="112" rx="30" fill="${C.coral}"/><rect x="78" y="44" width="12" height="70" rx="6" fill="#fff" opacity=".45"/>`,
      `<path d="M66 64 C66 40 80 32 100 32 C120 32 134 40 134 64 L134 136 C134 144 128 146 124 142 C120 150 112 150 110 144 C104 152 94 150 92 144 C86 150 76 148 74 140 C68 144 66 140 66 132Z" fill="${C.coral}"/><path d="M118 146 C118 154 114 160 114 166" stroke="${C.coral}" stroke-width="6" stroke-linecap="round"/><rect x="78" y="48" width="12" height="60" rx="6" fill="#fff" opacity=".4"/>`,
      `<path d="M72 92 C72 74 84 66 100 66 C116 66 128 74 128 92 L128 132 C128 140 120 144 114 138 C108 146 98 146 94 138 C86 144 76 140 72 132Z" fill="${C.coral}"/><path d="M84 142 C84 154 80 166 80 176 M118 140 C118 156 120 166 122 176" stroke="${C.coral}" stroke-width="6" stroke-linecap="round" opacity=".8"/>`,
      `<path d="M88 128 C88 118 94 114 100 114 C106 114 112 118 112 128 L112 134 C106 138 94 138 88 134Z" fill="${C.coral}" opacity=".7"/>`,
    ][stage];
    return svg(puddles + sticks + bodies);
  };
  const snow = () => svg(`
    ${shadow(100, 176, 70, 9)}
    <path d="M30 172 C30 140 52 124 72 128 C80 104 120 100 132 124 C156 120 172 142 170 172Z" fill="#fff"/>
    <path d="M44 166 C48 150 60 142 74 146" stroke="${C.ice}" stroke-width="8" stroke-linecap="round" fill="none"/>
    <g transform="translate(118 30) scale(.32)">${snowflakeRaw()}</g>
    <g transform="translate(44 52) scale(.22)">${snowflakeRaw()}</g>`);
  function snowflakeRaw() {
    let arms = '';
    for (let i = 0; i < 6; i++) arms += `<rect x="93" y="30" width="14" height="70" rx="7" fill="${C.blue2}" transform="rotate(${i * 60} 100 100)"/>`;
    return arms + `<circle cx="100" cy="100" r="14" fill="${C.ice2}"/>`;
  }
  const cloudPath = (x, y, s, fill) => `<path transform="translate(${x} ${y}) scale(${s})" d="M30 70 C10 70 4 50 18 40 C16 22 38 12 52 24 C60 6 92 6 98 28 C116 22 132 36 126 52 C140 56 138 70 124 70Z" fill="${fill}"/>`;
  const rain = () => svg(`
    ${cloudPath(28, 18, 1.08, '#D7E1E6')}
    ${[[60, 116], [96, 128], [132, 112], [78, 152], [116, 160]].map(([x, y]) => dropShape(x, y, .2, C.blue)).join('')}`);
  const soup = (smoke = false) => svg(`
    ${shadow(100, 172, 74, 9)}
    ${smoke ? `<g fill="none" stroke="#fff" stroke-width="12" stroke-linecap="round" opacity=".95"><path d="M74 92 C64 76 84 66 74 46"/><path d="M104 88 C94 70 114 60 104 36"/><path d="M134 92 C124 76 144 66 134 50"/></g>
      <g fill="none" stroke="${C.ice}" stroke-width="5" stroke-linecap="round"><path d="M74 92 C64 76 84 66 74 46"/><path d="M104 88 C94 70 114 60 104 36"/><path d="M134 92 C124 76 144 66 134 50"/></g>` : ''}
    <path d="M24 104 L176 104 C176 146 144 168 100 168 C56 168 24 146 24 104Z" fill="${C.sage}"/>
    <ellipse cx="100" cy="104" rx="76" ry="14" fill="${C.amber}"/>
    <ellipse cx="80" cy="102" rx="12" ry="4" fill="#fff" opacity=".45"/>
    <circle cx="116" cy="104" r="6" fill="${C.sage2}"/><circle cx="90" cy="108" r="4" fill="${C.coral}" opacity=".7"/>`);
  const milk = () => svg(`
    ${shadow(100, 182, 46, 8)}
    <path d="M58 40 L142 40 L134 172 C133 178 128 182 122 182 L78 182 C72 182 67 178 66 172Z" fill="${C.glass}"/>
    <path d="M61 70 L139 70 L134 172 C133 178 128 182 122 182 L78 182 C72 182 67 178 66 172Z" fill="#FFFDF7"/>
    <ellipse cx="100" cy="70" rx="39" ry="6" fill="#fff"/>
    <rect x="74" y="84" width="9" height="78" rx="4.5" fill="${C.cream}"/>`);
  const basin = (col) => svg(`
    ${shadow(100, 170, 90, 10)}
    <path d="M10 84 L190 84 C190 136 150 164 100 164 C50 164 10 136 10 84Z" fill="${col}"/>
    <ellipse cx="100" cy="84" rx="90" ry="18" fill="${col}"/>
    <ellipse cx="100" cy="86" rx="78" ry="12" fill="#000" opacity=".08"/>`, '0 30 200 145');

  // ---------- 第五關：爐子、鍋子、旋鈕 ----------
  const potScene = () => svg(`
    ${shadow(120, 214, 100, 10)}
    <rect x="30" y="182" width="180" height="26" rx="13" fill="${C.wood2}"/>
    <g id="wgFlame" class="wg-flame">
      <path d="M90 186 C82 172 92 160 96 150 C102 162 110 168 104 186Z" fill="${C.coral}"/>
      <path d="M114 186 C104 168 116 150 120 138 C128 156 138 166 128 186Z" fill="${C.amber}"/>
      <path d="M138 186 C132 172 140 162 144 152 C150 164 156 172 148 186Z" fill="${C.coral}"/>
      <path d="M110 186 C108 176 116 168 120 162 C124 170 130 176 126 186Z" fill="${C.yel}"/>
    </g>
    <g transform="translate(0 -34)">
    <rect x="44" y="92" width="152" height="84" rx="24" fill="#8A9AA2"/>
    <rect x="26" y="102" width="26" height="12" rx="6" fill="#6F7E86"/><rect x="188" y="102" width="26" height="12" rx="6" fill="#6F7E86"/>
    <ellipse cx="120" cy="94" rx="76" ry="12" fill="#6F7E86"/>
    <ellipse cx="120" cy="96" rx="68" ry="8" fill="${C.blue2}"/>
    <g id="wgBub"></g>
    <rect x="58" y="112" width="12" height="44" rx="6" fill="#fff" opacity=".25"/>
    <g id="wgSmoke" opacity="0" fill="none" stroke-linecap="round">
      <g stroke="#fff" stroke-width="14"><path class="wg-wisp" d="M86 78 C74 60 98 48 86 24"/><path class="wg-wisp d2" d="M120 74 C108 54 132 42 120 14"/><path class="wg-wisp d3" d="M154 78 C142 60 166 48 154 28"/></g>
      <g stroke="${C.ice}" stroke-width="5"><path class="wg-wisp" d="M86 78 C74 60 98 48 86 24"/><path class="wg-wisp d2" d="M120 74 C108 54 132 42 120 14"/><path class="wg-wisp d3" d="M154 78 C142 60 166 48 154 28"/></g>
    </g></g>`, '0 -24 240 248');
  const knob = () => svg(`
    ${shadow(100, 182, 70, 10)}
    <circle cx="100" cy="100" r="84" fill="${C.cream}"/>
    <g id="wgKnob"><circle cx="100" cy="100" r="62" fill="${C.wood}"/>
      <circle cx="100" cy="100" r="50" fill="${C.wood2}" opacity=".25"/>
      <rect x="92" y="40" width="16" height="44" rx="8" fill="${C.coral}"/>
      <circle cx="84" cy="80" r="10" fill="#fff" opacity=".25"/></g>
    ${[0, 1, 2, 3, 4, 5].map(i => { const a = (-90 + i * 50) * Math.PI / 180; return `<circle cx="${(100 + Math.cos(a) * 75).toFixed(1)}" cy="${(100 + Math.sin(a) * 75).toFixed(1)}" r="${3 + i * 1.1}" fill="${C.amber}" opacity="${.35 + i * .12}"/>`; }).join('')}`);

  // ---------- 第七關：冰飲料杯 ----------
  const coldCup = () => svg(`
    ${shadow(120, 252, 80, 9)}
    <path d="M44 30 L196 30 L180 236 C179 244 172 250 164 250 L76 250 C68 250 61 244 60 236Z" fill="${C.glass}"/>
    <path d="M46 42 L194 42 L180 236 C179 244 172 250 164 250 L76 250 C68 250 61 244 60 236Z" fill="#F4B860"/>
    <ellipse cx="120" cy="42" rx="74" ry="6" fill="#F8CC84"/>
    <rect x="62" y="60" width="10" height="160" rx="5" fill="#fff" opacity=".35"/>`, '0 0 240 260');

  // ---------- 第九關：生活情境、三種變化 ----------
  const clothes = () => svg(`
    ${sunInner(158, 40, 20)}
    <path d="M10 56 Q100 76 190 56" stroke="${C.wood2}" stroke-width="5" fill="none"/>
    <path d="M48 66 L62 60 L74 66 L92 64 L102 88 L88 94 L88 150 L42 150 L42 94 L28 88 L38 64Z" fill="${C.blue}"/>
    <path d="M118 66 L172 66 L176 150 L150 150 L146 108 L142 150 L116 150Z" fill="${C.sage}"/>
    <g fill="none" stroke="${C.blue3}" stroke-width="5" stroke-linecap="round"><path d="M60 182 C54 172 66 166 60 156"/><path d="M146 184 C140 174 152 168 146 158"/></g>`);
  const cupDrops = () => svg(`
    ${shadow(100, 186, 50, 8)}
    <path d="M50 30 L150 30 L140 176 C139 182 134 186 128 186 L72 186 C66 186 61 182 60 176Z" fill="${C.glass}"/>
    <path d="M54 70 L146 70 L140 176 C139 182 134 186 128 186 L72 186 C66 186 61 182 60 176Z" fill="${C.amber}" opacity=".8"/>
    ${cubeG(70, 60, 34, 32)}${cubeG(104, 66, 32, 30)}
    ${[[66, 110], [92, 140], [126, 104], [118, 150], [80, 166], [136, 132]].map(([x, y]) => dropShape(x, y, .14, C.blue)).join('')}`);
  const mirror = () => svg(`
    <rect x="34" y="18" width="132" height="164" rx="66" fill="${C.wood}"/>
    <rect x="46" y="30" width="108" height="140" rx="54" fill="${C.ice2}"/>
    <rect x="46" y="30" width="108" height="140" rx="54" fill="#fff" opacity=".75"/>
    <path d="M70 70 C90 60 104 84 128 72" stroke="${C.ice}" stroke-width="10" stroke-linecap="round" fill="none"/>
    ${[[76, 120], [110, 132], [96, 100], [126, 112]].map(([x, y]) => dropShape(x, y, .12, C.blue2)).join('')}
    <g fill="none" stroke="${C.blue3}" stroke-width="5" stroke-linecap="round"><path d="M18 196 C10 184 26 178 18 164"/><path d="M182 196 C174 184 190 178 182 164"/></g>`);
  const soupSmoke = () => soup(true);
  const freezer = () => svg(`
    ${shadow(100, 190, 66, 8)}
    <rect x="40" y="10" width="120" height="176" rx="20" fill="#D7E1E6"/>
    <rect x="50" y="22" width="100" height="72" rx="12" fill="${C.ice2}"/>
    <rect x="50" y="104" width="100" height="72" rx="12" fill="#E9EFF1"/>
    <rect x="136" y="34" width="6" height="26" rx="3" fill="#9BAAB1"/><rect x="136" y="116" width="6" height="26" rx="3" fill="#9BAAB1"/>
    ${cubeG(60, 50, 24, 24)}${cubeG(88, 50, 24, 24)}${cubeG(116, 54, 18, 20)}
    <g transform="translate(64 26) scale(.12)">${snowflakeRaw()}</g>`);
  const evapIcon = () => svg(`
    <ellipse cx="100" cy="160" rx="66" ry="16" fill="${C.blue2}"/>
    <g fill="none" stroke="${C.blue3}" stroke-width="10" stroke-linecap="round"><path d="M64 136 C54 118 74 106 64 84"/><path d="M100 132 C90 110 110 98 100 68"/><path d="M136 136 C126 118 146 106 136 84"/></g>
    <path d="M86 52 L100 34 L114 52" stroke="${C.blue}" stroke-width="10" stroke-linecap="round" stroke-linejoin="round" fill="none"/>`);
  const condIcon = () => svg(`
    <rect x="30" y="30" width="140" height="140" rx="30" fill="${C.ice2}"/>
    <g fill="${C.blue3}">${[[60, 60], [90, 76], [130, 58], [70, 104], [118, 96]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="6"/>`).join('')}</g>
    ${[[78, 140], [120, 138], [100, 120]].map(([x, y]) => dropShape(x, y, .2, C.blue)).join('')}`);
  const freezeIcon = () => svg(`${cubeG(52, 60, 96, 92)}<g transform="translate(110 22) scale(.36)">${snowflakeRaw()}</g>`);

  // ---------- 第十關：水循環 ----------
  const cycleScene = () => svg(`
    <rect x="0" y="0" width="400" height="260" fill="#EAF2F2"/>
    <path d="M220 200 L292 104 L330 150 L352 122 L400 190 L400 210 L220 210Z" fill="${C.sage2}"/>
    <path d="M292 104 L278 124 L306 124Z" fill="#fff"/>
    <rect x="0" y="196" width="400" height="64" fill="${C.blue}"/>
    <path d="M0 200 Q20 192 40 200 T80 200 T120 200 T160 200 T200 200 T240 200 T280 200 T320 200 T360 200 T400 200 L400 206 L0 206Z" fill="${C.blue2}"/>
    <g id="wgSun" class="wg-hot">${sunInner(86, 68, 30, 'wgRays')}</g>
    <g id="wgCloud" class="wg-hot">${cloudPath(236, 22, 1, '#fff')}</g>
    <g id="wgVapor"></g>
    <g id="wgRain"></g>`, '0 0 400 260');

  return {
    C, hero, drop, sun, snowflake, hand, iceCube, meltScene, bottleScene, floatScene, popsicle, snow, rain, soup, milk, basin,
    potScene, knob, coldCup, clothes, cupDrops, mirror, soupSmoke, freezer, evapIcon, condIcon, freezeIcon, cycleScene, dropShape,
  };
})();
