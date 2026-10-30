/* 首頁入口：小水滴變變變（夜間流水線 2026-10-30 做的，遊戲本體在 lab/water-game/）。 */
HUB.register({
  dir: 'lab/water-game', name: '小水滴變變變', zy: ['ㄒㄧㄠˇ', 'ㄕㄨㄟˇ', 'ㄉㄧ', 'ㄅㄧㄢˋ', 'ㄅㄧㄢˋ', 'ㄅㄧㄢˋ'], sub: '冰、水、水蒸氣',
  acc: '#2BB3A3',
  icon: `<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path class="f" d="M24 6c8 10 12 16 12 23a12 12 0 01-24 0c0-7 4-13 12-23z" fill="#D9E6D2"/><path d="M17 30a7 7 0 007 7"/></svg>`,
  build({ THREE, mat }) {
    const g = new THREE.Group();
    const blue = mat(0x5CC3E8), deep = mat(0x2FA6D6), ice = mat(0xE2F4FA, { roughness: .35 }), white = mat(0xFFFFFF);
    // 一顆大水滴：球＋圓錐尖，一點白色亮光
    const drop = new THREE.Group();
    const ball = new THREE.Mesh(new THREE.SphereGeometry(.5, 24, 18), blue); drop.add(ball);
    const tip = new THREE.Mesh(new THREE.ConeGeometry(.5, .8, 24), blue); tip.position.y = .55; drop.add(tip);
    const shine = new THREE.Mesh(new THREE.SphereGeometry(.09, 10, 8), white); shine.position.set(-.2, .15, .4); drop.add(shine);
    drop.position.y = 1.15; g.add(drop);
    // 旁邊一顆冰塊、上面一朵小雲、底下一灘水
    const cube = new THREE.Mesh(new THREE.BoxGeometry(.62, .62, .62), ice); cube.position.set(-.9, .31, .25); cube.rotation.y = .5; g.add(cube);
    const cloud = new THREE.Group();
    [[0, 0, 0, .3], [.3, .04, .04, .24], [-.28, .02, .03, .22]].forEach(([x, y, z, r]) => { const m = new THREE.Mesh(new THREE.SphereGeometry(r, 16, 12), white); m.position.set(x, y, z); cloud.add(m); });
    cloud.position.set(.95, 2.0, -.1); g.add(cloud);
    const pool = new THREE.Mesh(new THREE.CylinderGeometry(.55, .55, .08, 28), deep); pool.position.y = .04; pool.scale.set(1.35, 1, 1); g.add(pool);
    g.userData.anim = (t, e) => {
      const b = Math.sin(t * 2.4);
      drop.position.y = 1.15 + b * .08 + e * .4; drop.scale.set(1 - b * .03, 1 + b * .05, 1 - b * .03);
      cloud.position.x = .95 + Math.sin(t * .8) * .12; cloud.position.y = 2.0 + Math.sin(t * 1.1) * .05;
      cube.rotation.z = Math.sin(t * 1.5) * .06 * (1 + e * 3);
    };
    return g;
  },
});
