/* 首頁入口：種子小偵探。一個遊戲一個檔，首頁照 hub/entries.json 的順序載入。 */
HUB.register({
  dir: 'seed-game', name: '種子小偵探', zy: ['ㄓㄨㄥˇ', 'ㄗˇ', 'ㄒㄧㄠˇ', 'ㄓㄣ', 'ㄊㄢˋ'], sub: '種子從哪裡來',
  acc: '#4CB05A',
  icon: `<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M24 40V22"/><path class="f" d="M24 30c-9 1-14-4-14-12 9-1 14 4 14 12z" fill="#D9E6D2"/><path class="f" d="M24 24c9 1 14-4 14-12-9-1-14 4-14 12z" fill="#D9E6D2"/><ellipse cx="24" cy="41" rx="9" ry="3"/></svg>`,
  build({ THREE, M }) {
    const g = new THREE.Group();
    const seed = new THREE.Mesh(new THREE.SphereGeometry(.42, 24, 18), M.maroon); seed.scale.set(1, .8, .75); seed.position.y = .32; g.add(seed);
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(.06, .09, 1.3, 10), M.green); stem.position.y = 1.1; stem.rotation.z = .12; g.add(stem);
    const leafGeo = new THREE.SphereGeometry(.5, 20, 12); leafGeo.scale(1, .22, .55);
    const l1 = new THREE.Mesh(leafGeo, M.leaf); l1.position.set(-.5, 1.65, 0); l1.rotation.z = .5; g.add(l1);
    const l2 = new THREE.Mesh(leafGeo, M.leaf); l2.position.set(.5, 1.75, 0); l2.rotation.z = -.5; g.add(l2);
    const bud = new THREE.Mesh(new THREE.SphereGeometry(.12, 12, 10), M.green); bud.position.set(.08, 1.78, 0); g.add(bud);
    g.userData.anim = (t, e) => { stem.rotation.z = .12 + Math.sin(t * 1.6) * .06 * (1 + e * 4); l1.rotation.z = .5 + Math.sin(t * 2.1) * .08; l2.rotation.z = -.5 - Math.sin(t * 1.9) * .08; };
    return g;
  },
});
