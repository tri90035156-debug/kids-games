/* 首頁入口：颱風怎麼來？（2026-11-08 從 ~/Projects/臺南遊戲/颱風教室-薔琵 搬進來，遊戲本體在 lab/typhoon-game/）。
   3D 小物件＝一團逆時針旋轉的黏土雲（四條雲臂＋中間的颱風眼）飄在一座綠色小島上方。 */
HUB.register({
  dir: 'lab/typhoon-game', name: '颱風怎麼來？', zy: ['ㄊㄞˊ', 'ㄈㄥ', 'ㄗㄣˇ', '˙ㄇㄜ', 'ㄌㄞˊ', ''], sub: '出生、轉圈圈、走路、消失',
  acc: '#4D97CB',
  icon: `<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M24 10c9 0 15 6 14 14"/><path d="M38 24c0 9-6 15-14 14"/><path d="M24 38c-9 0-15-6-14-14"/><path d="M10 24c0-9 6-15 14-14"/><circle cx="24" cy="24" r="4" fill="currentColor"/></svg>`,
  build({ THREE, mat }) {
    const g = new THREE.Group();
    const cloud = mat(0xFFFFFF, { roughness: .95 }), eye = mat(0x2E6A98), sea = mat(0x4D97CB, { roughness: .6 }), land = mat(0xA5CB8C), hill = mat(0x7E9C68);
    // 小島：一塊扁扁的綠色黏土＋一座小山，旁邊一圈淺淺的海
    const water = new THREE.Mesh(new THREE.CylinderGeometry(1.05, 1.05, .08, 32), sea); water.position.y = .04; g.add(water);
    const isle = new THREE.Mesh(new THREE.SphereGeometry(.42, 20, 12), land); isle.scale.set(.75, .32, 1.25); isle.position.set(-.25, .1, .1); g.add(isle);
    const mt = new THREE.Mesh(new THREE.ConeGeometry(.2, .32, 14), hill); mt.position.set(-.25, .3, .1); g.add(mt);
    // 颱風：中間一顆扁球＋四條彎彎的雲臂（每條是幾顆越來越小的雲球），整團逆時針轉
    const ty = new THREE.Group(); ty.position.set(.25, 1.35, 0); g.add(ty);
    const core = new THREE.Mesh(new THREE.SphereGeometry(.34, 20, 14), cloud); core.scale.set(1, .42, 1); ty.add(core);
    const e = new THREE.Mesh(new THREE.CylinderGeometry(.08, .08, .3, 14), eye); ty.add(e);
    for (let a = 0; a < 4; a++) {
      for (let i = 1; i <= 4; i++) {
        const t = i / 4, ang = a * Math.PI / 2 - t * 2.2, r = .3 + t * .55;
        const b = new THREE.Mesh(new THREE.SphereGeometry(.2 * (1 - t * .6), 14, 10), cloud);
        b.scale.y = .5; b.position.set(Math.cos(ang) * r, -t * .05, Math.sin(ang) * r); ty.add(b);
      }
    }
    g.userData.anim = (t, ex) => { ty.rotation.y = t * (1.2 + ex * 2.5); ty.position.y = 1.35 + Math.sin(t * 1.6) * .06; };
    return g;
  },
});
