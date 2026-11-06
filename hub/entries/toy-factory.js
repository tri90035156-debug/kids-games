/* 首頁入口：玩偶怎麼來？（2026-11-07 做的，遊戲本體在 lab/toy-factory/）。3D 小物件＝一隻黏土小熊坐在紙箱上。 */
HUB.register({
  dir: 'lab/toy-factory', name: '玩偶怎麼來？', zy: ['ㄨㄢˊ', 'ㄡˇ', 'ㄗㄣˇ', '˙ㄇㄜ', 'ㄌㄞˊ', ''], sub: '原料、工廠、貿易，到你手上',
  acc: '#C98A4B',
  icon: `<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="14" cy="14" r="5"/><circle cx="34" cy="14" r="5"/><ellipse cx="24" cy="26" rx="14" ry="13"/><circle cx="19" cy="23" r="1.8" fill="currentColor"/><circle cx="29" cy="23" r="1.8" fill="currentColor"/><path d="M21 30q3 2.5 6 0"/></svg>`,
  build({ THREE, mat }) {
    const g = new THREE.Group();
    const fur = mat(0xD9A66B, { roughness: .95 }), dark = mat(0x4A3328, { roughness: .8 }), card = mat(0xC9A478, { roughness: .9 }), tape = mat(0xEADFD3, { roughness: .9 });
    const box = new THREE.Mesh(new THREE.BoxGeometry(1.5, .7, 1.1), card); box.position.y = .35; g.add(box);
    const tp = new THREE.Mesh(new THREE.BoxGeometry(.3, .72, 1.12), tape); tp.position.y = .35; g.add(tp);
    const bear = new THREE.Group(); bear.position.set(0, .7, .1); g.add(bear);
    const body = new THREE.Mesh(new THREE.SphereGeometry(.34, 20, 14), fur); body.scale.set(1, 1.1, .9); body.position.y = .34; bear.add(body);
    const head = new THREE.Mesh(new THREE.SphereGeometry(.28, 20, 14), fur); head.position.y = .86; bear.add(head);
    [-1, 1].forEach(s => {
      const ear = new THREE.Mesh(new THREE.SphereGeometry(.1, 12, 8), fur); ear.position.set(s * .22, 1.08, 0); bear.add(ear);
      const eye = new THREE.Mesh(new THREE.SphereGeometry(.035, 8, 6), dark); eye.position.set(s * .1, .9, .26); bear.add(eye);
      const arm = new THREE.Mesh(new THREE.SphereGeometry(.11, 12, 8), fur); arm.scale.set(1, 1.6, 1); arm.position.set(s * .36, .4, .05); arm.rotation.z = -s * .5; bear.add(arm);
      const leg = new THREE.Mesh(new THREE.SphereGeometry(.13, 12, 8), fur); leg.scale.set(1, 1, 1.5); leg.position.set(s * .2, .1, .3); bear.add(leg);
    });
    const nose = new THREE.Mesh(new THREE.SphereGeometry(.045, 8, 6), dark); nose.position.set(0, .82, .28); bear.add(nose);
    g.userData.anim = (t, e) => { bear.rotation.z = Math.sin(t * 1.4) * .06 * (1 + e); bear.position.y = .7 + Math.abs(Math.sin(t * 2.6)) * .06 * e; };
    return g;
  },
});
