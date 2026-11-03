/* 首頁入口：機器人出任務（2026-11-03 做的，遊戲本體在 lab/robot-town/）。3D 小物件＝主角開著小底盤＋一個三角錐。 */
HUB.register({
  dir: 'lab/robot-town', name: '機器人出任務', zy: ['ㄐㄧ', 'ㄑㄧˋ', 'ㄖㄣˊ', 'ㄔㄨ', 'ㄖㄣˋ', 'ㄨˋ'], sub: '十個任務、十種真實機器人',
  acc: '#F2A33A',
  icon: `<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="20" cy="12" r="6.5" class="f" fill="#D9E6D2"/><circle cx="17.5" cy="12" r="1.3"/><circle cx="22.5" cy="12" r="1.3"/><rect x="11" y="20" width="18" height="12" rx="3" class="f" fill="#D9E6D2"/><rect x="8" y="32" width="24" height="5" rx="2"/><circle cx="12" cy="40" r="3"/><circle cx="28" cy="40" r="3"/><path d="M38 40l4-14 4 14z" class="f" fill="#F2A33A"/></svg>`,
  build({ THREE, mat }) {
    const g = new THREE.Group();
    const cream = mat(0xF1E4CF, { roughness: .78 }), cream2 = mat(0xD9C8AF, { roughness: .8 }), coral = mat(0xF05A3C, { roughness: .78 });
    const sky = mat(0x3C9BE0, { roughness: .78 }), amber = mat(0xF2A33A, { roughness: .78 }), ink = mat(0x3B3430, { roughness: .6 });
    const bot = new THREE.Group(); g.add(bot);
    // 底盤＋四個輪子
    const base = new THREE.Mesh(new THREE.BoxGeometry(.95, .2, .8), cream2); base.position.y = .28; bot.add(base);
    const wheels = [[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([sx, sz]) => { const w = new THREE.Mesh(new THREE.CylinderGeometry(.15, .15, .12, 14), ink); w.rotation.z = Math.PI / 2; w.position.set(sx * .5, .15, sz * .28); bot.add(w); return w; });
    // 身體、胸口探照燈（琥珀）、頭、眼睛、頭頂小電腦、背上螺旋槳
    const body = new THREE.Mesh(new THREE.BoxGeometry(.8, .62, .5), cream); body.position.y = .7; bot.add(body);
    const lamp = new THREE.Mesh(new THREE.CylinderGeometry(.13, .13, .08, 16), amber); lamp.rotation.x = Math.PI / 2; lamp.position.set(0, .72, .28); bot.add(lamp);
    const head = new THREE.Group(); head.position.y = 1.32; bot.add(head);
    head.add(new THREE.Mesh(new THREE.SphereGeometry(.36, 22, 16), cream));
    const eyes = [-1, 1].map(sx => { const e = new THREE.Group(); e.position.set(sx * .14, .02, .32); e.rotation.y = sx * .38; e.add(new THREE.Mesh(new THREE.TorusGeometry(.085, .03, 8, 16), coral)); const p = new THREE.Mesh(new THREE.SphereGeometry(.035, 10, 8), ink); p.position.z = .02; e.add(p); head.add(e); return e; });
    const comp = new THREE.Mesh(new THREE.BoxGeometry(.3, .12, .22), coral); comp.position.y = .41; head.add(comp);
    [-1, 1].forEach(sx => { const m = new THREE.Mesh(new THREE.SphereGeometry(.1, 12, 10), sky); m.position.set(sx * .48, .9, 0); bot.add(m); });
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(.025, .025, 1.1, 8), cream2); pole.position.set(0, 1.25, -.28); bot.add(pole);
    const rotor = new THREE.Group(); rotor.position.set(0, 1.82, -.28); bot.add(rotor);
    [0, Math.PI].forEach(a => { const b = new THREE.Mesh(new THREE.BoxGeometry(.5, .03, .1), amber); b.position.set(Math.cos(a) * .25, 0, Math.sin(a) * .25); rotor.add(b); });
    // 旁邊一個小三角錐
    const cone = new THREE.Group(); cone.position.set(.95, 0, .35); g.add(cone);
    const cb = new THREE.Mesh(new THREE.BoxGeometry(.36, .05, .36), coral); cb.position.y = .025; cone.add(cb);
    const cc = new THREE.Mesh(new THREE.ConeGeometry(.16, .45, 16), coral); cc.position.y = .27; cone.add(cc);
    g.userData.anim = (t, e) => {
      const b = Math.sin(t * 2.2);
      body.scale.set(1 - b * .015, 1 + b * .03, 1 - b * .015);
      head.position.y = 1.32 + b * .03; head.rotation.z = Math.sin(t * 1.3) * .05;
      rotor.rotation.y = t * (2 + e * 10);
      wheels.forEach(w => { w.rotation.x = t * e * 6; });
      bot.position.x = Math.sin(t * 1.6) * .06 * e; bot.rotation.y = Math.sin(t * .9) * .25;
      cone.rotation.z = e * Math.sin(t * 6) * .15;
      const blink = ((t * (1 + e)) % 3.6) < .12 ? .15 : 1;
      eyes.forEach(o => { o.scale.y = blink; });
    };
    return g;
  },
});
