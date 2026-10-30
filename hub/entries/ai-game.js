/* 首頁入口：AI 從哪裡來。 */
HUB.register({
  dir: 'ai-game', name: 'AI 從哪裡來', zy: [null, null, null, 'ㄘㄨㄥˊ', 'ㄋㄚˇ', 'ㄌㄧˇ', 'ㄌㄞˊ'], sub: '電腦怎麼學會',
  acc: '#3C9BE0',
  icon: `<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><rect class="f" x="11" y="14" width="26" height="22" rx="5" fill="#D9E6D2"/><path d="M24 14V7m-3 0h6"/><circle cx="19" cy="24" r="2.2" fill="currentColor" stroke="none"/><circle cx="29" cy="24" r="2.2" fill="currentColor" stroke="none"/><path d="M19 31h10"/></svg>`,
  build({ THREE, M, C }) {
    const g = new THREE.Group();
    const head = new THREE.Mesh(new THREE.BoxGeometry(1.4, 1.2, 1.1), M.paper); head.position.y = .95; g.add(head);
    const face = new THREE.Mesh(new THREE.BoxGeometry(1.0, .7, .06), M.ink); face.position.set(0, 1.0, .57); g.add(face);
    const eyes = [-.25, .25].map(x => { const e = new THREE.Mesh(new THREE.SphereGeometry(.09, 12, 10), new THREE.MeshStandardMaterial({ color: C.red, emissive: C.red, emissiveIntensity: .6 })); e.position.set(x, 1.05, .62); g.add(e); return e; });
    const mouth = new THREE.Mesh(new THREE.BoxGeometry(.4, .05, .04), M.goldsoft); mouth.position.set(0, .8, .62); g.add(mouth);
    const ant = new THREE.Mesh(new THREE.CylinderGeometry(.03, .03, .5, 8), M.gold); ant.position.y = 1.8; g.add(ant);
    const tip = new THREE.Mesh(new THREE.SphereGeometry(.1, 12, 10), M.red); tip.position.y = 2.08; g.add(tip);
    const body = new THREE.Mesh(new THREE.BoxGeometry(.9, .4, .7), M.goldsoft); body.position.y = .2; g.add(body);
    g.userData.anim = (t, e) => { const blink = (Math.sin(t * 3) > .96 || e > .5) ? .15 : 1; eyes.forEach(ey => ey.scale.y = blink); tip.position.y = 2.08 + Math.sin(t * 4) * .03; head.rotation.y = Math.sin(t * .7) * .12; };
    return g;
  },
});
