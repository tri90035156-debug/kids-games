/* 首頁入口：頌缽工坊。2026-11-08 3D 化後的場景是長條工作檯：入口小物件的缽放在一小段木頭工作檯上，旁邊一個紅色坐墊。 */
HUB.register({
  dir: 'bowl-game', name: '頌缽工坊', zy: ['ㄙㄨㄥˋ', 'ㄅㄛ', 'ㄍㄨㄥ', 'ㄈㄤ'], sub: '會唱歌的銅缽',
  acc: '#F2A33A',
  icon: `<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path class="f" d="M8 20h32c0 11-7 18-16 18S8 31 8 20z" fill="#D9E6D2"/><path d="M8 20c8-3 24-3 32 0"/><path d="M34 14l8-8" stroke-width="3.5"/><path d="M5 26c-2-2-2-6 0-8M43 30c2 2 2 6 0 8"/></svg>`,
  build({ THREE, M, C }) {
    const g = new THREE.Group();
    const pts = []; for (let i = 0; i <= 14; i++) { const a = i / 14; pts.push(new THREE.Vector2(.25 + Math.sin(a * Math.PI * .5) * .85, a * .95)); }
    const bowl = new THREE.Mesh(new THREE.LatheGeometry(pts, 48), new THREE.MeshStandardMaterial({ color: C.gold, roughness: .35, metalness: .55, side: THREE.DoubleSide })); g.add(bowl);
    const base = new THREE.Mesh(new THREE.CylinderGeometry(.3, .32, .06, 24), M.maroon); base.position.y = .03; g.add(base);
    const stick = new THREE.Mesh(new THREE.CylinderGeometry(.05, .05, 1.2, 10), M.maroon); stick.position.set(1.0, .95, .2); stick.rotation.z = -.9; g.add(stick);
    const felt = new THREE.Mesh(new THREE.SphereGeometry(.13, 12, 10), M.red); felt.position.set(.55, 1.32, .2); g.add(felt);
    const bench = new THREE.Mesh(new THREE.BoxGeometry(2.8, .2, 1.4), new THREE.MeshStandardMaterial({ color: 0xB98C5E, roughness: .9 })); bench.position.y = -.1; g.add(bench);
    const pad = new THREE.Mesh(new THREE.TorusGeometry(.28, .12, 8, 18), new THREE.MeshStandardMaterial({ color: 0xC0392B, roughness: .9 })); pad.rotation.x = Math.PI / 2; pad.position.set(-1, .12, .3); g.add(pad);
    g.userData.anim = (t, e) => { const s = 1 + Math.sin(t * 40) * .035 * e; bowl.scale.set(s, 1, 2 - s); stick.rotation.z = -.9 + Math.sin(t * 1.3) * .08 + e * .5; felt.position.x = .55 + e * .3; felt.position.y = 1.32 + e * .1; };
    return g;
  },
});
