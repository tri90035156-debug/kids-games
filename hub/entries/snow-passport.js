/* 首頁入口：雪國探險護照（2026-11-26 上線，遊戲本體在 lab/snow-passport/，由 Codex 製作）。
   3D 小物件＝一座白色小雪丘，上面一棵圓圓的樹冰，旁邊一台紅色小纜車掛在藍色吊臂上輕輕晃。 */
HUB.register({
  dir: 'lab/snow-passport', name: '雪國探險護照', zy: ['ㄒㄩㄝˇ', 'ㄍㄨㄛˊ', 'ㄊㄢˋ', 'ㄒㄧㄢˇ', 'ㄏㄨˋ', 'ㄓㄠˋ'], sub: '去新潟、長野、山形、秋田玩雪',
  acc: '#5A7C96',
  icon: `<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M24 6v36M8 15l32 18M40 15L8 33"/><path d="M19 9l5 4 5-4M19 39l5-4 5 4"/></svg>`,
  build({ THREE, mat }) {
    const g = new THREE.Group();
    const snow = mat(0xF4F1EC), shade = mat(0x5A7C96), red = mat(0xD9573F), cream = mat(0xF7EFE2), wood = mat(0xC89B62);
    const hill = new THREE.Mesh(new THREE.SphereGeometry(.85, 24, 14, 0, Math.PI * 2, 0, Math.PI / 2), snow); hill.scale.set(1.15, .55, 1); g.add(hill);
    const skirt = new THREE.Mesh(new THREE.CylinderGeometry(.99, 1.02, .08, 24), shade); skirt.position.y = .02; g.add(skirt);
    const tree = new THREE.Group(); tree.position.set(-.35, .38, 0); g.add(tree);
    [[.36, .25], [.29, .55], [.21, .8], [.12, 1.0]].forEach(([r, y]) => { const b = new THREE.Mesh(new THREE.SphereGeometry(r, 16, 10), snow); b.position.y = y; tree.add(b); });
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(.04, .04, 1.5, 10), shade); pole.position.set(.75, .9, 0); g.add(pole);
    const arm = new THREE.Mesh(new THREE.CylinderGeometry(.035, .035, .75, 10), shade); arm.rotation.z = Math.PI / 2; arm.position.set(.4, 1.62, 0); g.add(arm);
    [.03, .78].forEach(x => { const cap = new THREE.Mesh(new THREE.SphereGeometry(.07, 10, 8), wood); cap.position.set(x, 1.62, 0); g.add(cap); });
    const swing = new THREE.Group(); swing.position.set(.2, 1.62, 0); g.add(swing);
    const hook = new THREE.Mesh(new THREE.CylinderGeometry(.025, .025, .3, 8), shade); hook.position.y = -.15; swing.add(hook);
    const car = new THREE.Mesh(new THREE.BoxGeometry(.42, .32, .34), red); car.position.y = -.45; swing.add(car);
    const roof = new THREE.Mesh(new THREE.BoxGeometry(.48, .07, .4), cream); roof.position.y = -.27; swing.add(roof);
    const win = new THREE.Mesh(new THREE.BoxGeometry(.3, .12, .02), mat(0xA9C4D6)); win.position.set(0, -.4, .18); swing.add(win);
    g.userData.anim = (t, e) => { swing.rotation.z = Math.sin(t * 1.6) * .12 * (1 + e); tree.scale.y = 1 + Math.sin(t * 2.2) * .03 * (1 + e); };
    return g;
  },
});
