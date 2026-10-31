/* 首頁入口：做一台機器人（夜間流水線 2026-11-01 做的，遊戲本體在 lab/robot-game/）。 */
HUB.register({
  dir: 'lab/robot-game', name: '做一台機器人', zy: ['ㄗㄨㄛˋ', 'ㄧ', 'ㄊㄞˊ', 'ㄐㄧ', 'ㄑㄧˋ', 'ㄖㄣˊ'], sub: 'r-o-b-o-t 五個零件',
  acc: '#F05A3C',
  icon: `<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M24 4v4"/><circle cx="24" cy="16" r="8" class="f" fill="#D9E6D2"/><circle cx="20.5" cy="15.5" r="1.6"/><circle cx="27.5" cy="15.5" r="1.6"/><rect x="13" y="25" width="22" height="16" rx="4" class="f" fill="#D9E6D2"/><circle cx="24" cy="33" r="3.5"/><path d="M13 29l-5 7M35 29l5 7"/><path d="M19 41v3M29 41v3"/></svg>`,
  build({ THREE, mat }) {
    const g = new THREE.Group();
    const cream = mat(0xF1E4CF, { roughness: .78 }), coral = mat(0xF05A3C, { roughness: .78 }), sky = mat(0x3C9BE0, { roughness: .78 });
    const ink = mat(0x3B3430, { roughness: .6 });
    // 方身體（米白）＋胸口珊瑚紅齒輪窗
    const bodyGeo = new THREE.BoxGeometry(.9, .78, .62);
    const body = new THREE.Mesh(bodyGeo, cream); body.position.y = .5; g.add(body);
    const gear = new THREE.Mesh(new THREE.TorusGeometry(.16, .06, 10, 8), coral); gear.position.set(0, .54, .32); g.add(gear);
    // 天藍肩膀馬達＋珊瑚紅手臂（掛在肩膀上，可以揮）
    const arms = [-1, 1].map(sx => {
      const sh = new THREE.Group(); sh.position.set(sx * .56, .78, 0);
      sh.add(new THREE.Mesh(new THREE.SphereGeometry(.14, 16, 12), sky));
      const arm = new THREE.Mesh(new THREE.CylinderGeometry(.07, .07, .5, 10), coral); arm.position.y = -.3; sh.add(arm);
      g.add(sh); return sh;
    });
    // 米白圓頭，兩顆珊瑚紅眼框藍眼
    const head = new THREE.Group(); head.position.y = 1.28; g.add(head);
    head.add(new THREE.Mesh(new THREE.SphereGeometry(.42, 24, 18), cream));
    const eyes = [-1, 1].map(sx => {
      const e = new THREE.Group(); e.position.set(sx * .16, .03, .38); e.rotation.y = sx * .38;
      e.add(new THREE.Mesh(new THREE.TorusGeometry(.1, .035, 8, 18), coral));
      const lens = new THREE.Mesh(new THREE.SphereGeometry(.085, 14, 10), sky); lens.scale.z = .5; e.add(lens);
      const p = new THREE.Mesh(new THREE.SphereGeometry(.035, 10, 8), ink); p.position.z = .04; e.add(p);
      head.add(e); return e;
    });
    // 頭頂珊瑚紅小電腦
    const comp = new THREE.Mesh(new THREE.BoxGeometry(.36, .14, .28), coral); comp.position.y = .48; head.add(comp);
    g.userData.anim = (t, e) => {
      const b = Math.sin(t * 2.2);
      body.scale.set(1 - b * .015, 1 + b * .03, 1 - b * .015);
      head.position.y = 1.28 + b * .03; head.rotation.z = Math.sin(t * 1.3) * .05;
      // 興奮時右手揮一揮、左手輕晃
      arms[1].rotation.z = .1 + e * (1.9 + Math.sin(t * 9) * .45);
      arms[0].rotation.z = -.1 - Math.sin(t * 1.7) * .05 * (1 + e * 3);
      gear.rotation.z = t * (.6 + e * 4);
      // 眨眼：平常每 3.4 秒一次，靠近時眨得勤一點
      const blink = ((t * (1 + e)) % 3.4) < .12 ? .15 : 1;
      eyes.forEach(o => { o.scale.y = blink; });
    };
    return g;
  },
});
