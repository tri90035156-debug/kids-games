/* 首頁入口：太陽系大探險。 */
HUB.register({
  dir: 'space-game', name: '太陽系大探險', zy: ['ㄊㄞˋ', 'ㄧㄤˊ', 'ㄒㄧˋ', 'ㄉㄚˋ', 'ㄊㄢˋ', 'ㄒㄧㄢˇ'], sub: '八顆行星轉著看',
  acc: '#8B6FD6',
  icon: `<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><circle class="f" cx="24" cy="24" r="9" fill="#D9E6D2"/><path d="M12 20c-7 2-9 5-8 7 2 4 13 4 25 0s17-9 13-11c-1-1-4-1-7 0"/></svg>`,
  build({ THREE, M, C }) {
    const g = new THREE.Group();
    const p = new THREE.Mesh(new THREE.SphereGeometry(.72, 32, 24), M.gold); p.position.y = 1.1; g.add(p);
    const band = new THREE.Mesh(new THREE.TorusGeometry(.72, .05, 8, 48), M.goldsoft); band.position.y = 1.1; band.rotation.x = Math.PI / 2; band.scale.set(1, 1, .3); g.add(band);
    const ring = new THREE.Mesh(new THREE.RingGeometry(.95, 1.45, 64), new THREE.MeshStandardMaterial({ color: C.goldsoft, roughness: .6, side: THREE.DoubleSide })); ring.position.y = 1.1; ring.rotation.x = Math.PI / 2 + .45; g.add(ring);
    const ring2 = new THREE.Mesh(new THREE.RingGeometry(1.0, 1.05, 64), new THREE.MeshStandardMaterial({ color: C.red, side: THREE.DoubleSide })); ring2.position.copy(ring.position); ring2.rotation.copy(ring.rotation); ring2.position.y += .001; g.add(ring2);
    const moon = new THREE.Mesh(new THREE.SphereGeometry(.14, 14, 12), M.sea); g.add(moon);
    g.userData.anim = (t, e) => { p.rotation.y = t * .4; ring.rotation.z = t * .15; ring2.rotation.z = -t * .15; const a = t * (1.2 + e * 6); moon.position.set(Math.cos(a) * 1.7, 1.1 + Math.sin(a) * .5, Math.sin(a) * 1.7); };
    return g;
  },
});
