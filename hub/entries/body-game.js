/* 首頁入口：我的身體裡面（2026-11-08 新遊戲，遊戲本體在 lab/body-game/）。
   3D 小物件＝一個黏土大頭小人，肚子上一扇琥珀色的小門慢慢開關，旁邊一顆會咚咚跳的小心臟。 */
HUB.register({
  dir: 'lab/body-game', name: '我的身體裡面', zy: ['ㄨㄛˇ', '˙ㄉㄜ', 'ㄕㄣ', 'ㄊㄧˇ', 'ㄌㄧˇ', 'ㄇㄧㄢˋ'], sub: '打開十扇小門，看身體怎麼動',
  acc: '#E0533C',
  icon: `<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="24" cy="15" r="9"/><path d="M14 44c0-10 4-16 10-16s10 6 10 16"/><circle cx="24" cy="36" r="3" fill="currentColor"/></svg>`,
  build({ THREE, mat }) {
    const g = new THREE.Group();
    const skin = mat(0xF6CDA8), shirt = mat(0x8FB38A), dark = mat(0x3B3430), door = mat(0xF2A23A), red = mat(0xE0533C);
    const body = new THREE.Mesh(new THREE.SphereGeometry(.42, 20, 14), shirt); body.scale.set(1, 1.2, .8); body.position.y = .55; g.add(body);
    const head = new THREE.Mesh(new THREE.SphereGeometry(.55, 22, 16), skin); head.position.y = 1.45; g.add(head);
    [-1, 1].forEach(s => { const e = new THREE.Mesh(new THREE.SphereGeometry(.06, 8, 6), dark); e.position.set(s * .17, 1.52, .5); g.add(e); });
    const d = new THREE.Group(); d.position.set(0, .6, .34); g.add(d);
    const disc = new THREE.Mesh(new THREE.CylinderGeometry(.13, .13, .04, 16), door); disc.rotation.x = Math.PI / 2; d.add(disc);
    const heart = new THREE.Group(); heart.position.set(.8, .55, .2); g.add(heart);
    [-1, 1].forEach(s => { const b = new THREE.Mesh(new THREE.SphereGeometry(.13, 12, 8), red); b.position.set(s * .08, .05, 0); heart.add(b); });
    const tip = new THREE.Mesh(new THREE.ConeGeometry(.18, .22, 12), red); tip.rotation.z = Math.PI; tip.position.y = -.1; heart.add(tip);
    g.userData.anim = (t, e) => { d.rotation.y = (Math.sin(t * 1.2) * .5 + .5) * 1.4 * (1 + e); const b = 1 + Math.max(0, Math.sin(t * 6)) * .15 * (1 + e); heart.scale.setScalar(b); };
    return g;
  },
});
