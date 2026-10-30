/* 首頁入口：AI 從哪裡來。主角是電腦（不是機器人：機器人是另一個遊戲的身體）。 */
HUB.register({
  dir: 'ai-game', name: 'AI 從哪裡來', zy: [null, null, null, 'ㄘㄨㄥˊ', 'ㄋㄚˇ', 'ㄌㄧˇ', 'ㄌㄞˊ'], sub: '電腦怎麼學會',
  acc: '#3C9BE0',
  icon: `<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><rect class="f" x="8" y="9" width="32" height="23" rx="4" fill="#D9E6D2"/><circle cx="19" cy="19" r="2.2" fill="currentColor" stroke="none"/><circle cx="29" cy="19" r="2.2" fill="currentColor" stroke="none"/><path d="M19 25q5 4 10 0M24 32v6m-7 0h14"/></svg>`,
  build({ THREE, M, C }) {
    const g = new THREE.Group();
    const tv = new THREE.Group(); tv.position.y = 1.25; g.add(tv);
    const box = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.15, .4), M.paper); tv.add(box);
    const screen = new THREE.Mesh(new THREE.BoxGeometry(1.3, .85, .06), M.sea); screen.position.z = .2; tv.add(screen);
    const eyes = [-.27, .27].map(x => { const e = new THREE.Mesh(new THREE.SphereGeometry(.09, 12, 10), M.ink); e.position.set(x, .1, .25); tv.add(e); return e; });
    const smile = new THREE.Mesh(new THREE.TorusGeometry(.2, .04, 8, 20, Math.PI), M.ink); smile.rotation.z = Math.PI; smile.position.set(0, -.08, .25); tv.add(smile);
    const neck = new THREE.Mesh(new THREE.CylinderGeometry(.13, .17, .5, 16), M.goldsoft); neck.position.y = .45; g.add(neck);
    const base = new THREE.Mesh(new THREE.CylinderGeometry(.5, .55, .14, 32), M.goldsoft); base.position.y = .1; g.add(base);
    const led = new THREE.Mesh(new THREE.SphereGeometry(.05, 10, 8), new THREE.MeshStandardMaterial({ color: C.red, emissive: C.red, emissiveIntensity: .6 })); led.position.set(.62, -.45, .21); tv.add(led);
    g.userData.anim = (t, e) => { const blink = (Math.sin(t * 3) > .96 || e > .5) ? .15 : 1; eyes.forEach(ey => ey.scale.y = blink); tv.rotation.y = Math.sin(t * .7) * .12; tv.rotation.x = Math.sin(t * 1.1) * .03; };
    return g;
  },
});
