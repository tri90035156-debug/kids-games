/* 首頁入口：試試看實驗室（2026-11-05 做的，遊戲本體在 lab/science-lab/）。3D 小物件＝一個水缸裡浮著蘋果＋旁邊一塊磁鐵。 */
HUB.register({
  dir: 'lab/science-lab', name: '試試看實驗室', zy: ['ㄕˋ', 'ㄕˋ', 'ㄎㄢˋ', 'ㄕˊ', 'ㄧㄢˋ', 'ㄕˋ'], sub: '十個實驗：假設、實驗、結果',
  acc: '#3C9BE0',
  icon: `<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><rect x="6" y="14" width="26" height="26" rx="3"/><path d="M6 24q6.5-3 13 0t13 0" /><circle cx="15" cy="23" r="4.5" class="f" fill="#F05A3C"/><path d="M36 18v10a5 5 0 0 0 10 0V18h-3.5v10a1.5 1.5 0 0 1-3 0V18z" class="f" fill="#3C9BE0"/></svg>`,
  build({ THREE, mat }) {
    const g = new THREE.Group();
    const glass = new THREE.MeshStandardMaterial({ color: 0xDCEFF5, roughness: .2, transparent: true, opacity: .28, depthWrite: false });
    const water = new THREE.MeshStandardMaterial({ color: 0x7FC0E2, roughness: .35, transparent: true, opacity: .55, depthWrite: false });
    const wood = mat(0xD9B27A, { roughness: .85 }), apple = mat(0xE0533C, { roughness: .78 }), leaf = mat(0x8DB487, { roughness: .8 });
    const coral = mat(0xF05A3C, { roughness: .78 }), white = mat(0xFFF8EE, { roughness: .8 }), stem = mat(0xB98E5A, { roughness: .8 });
    // 水缸＋水
    const base = new THREE.Mesh(new THREE.BoxGeometry(1.5, .08, .9), wood); base.position.y = .04; g.add(base);
    const tank = new THREE.Mesh(new THREE.BoxGeometry(1.4, .95, .8), glass); tank.position.y = .55; g.add(tank);
    const wat = new THREE.Mesh(new THREE.BoxGeometry(1.34, .62, .74), water); wat.position.y = .39; g.add(wat);
    // 浮著的蘋果
    const ap = new THREE.Group(); g.add(ap);
    const body = new THREE.Mesh(new THREE.SphereGeometry(.24, 20, 14), apple); body.scale.y = .9; ap.add(body);
    const st = new THREE.Mesh(new THREE.CylinderGeometry(.018, .022, .12, 6), stem); st.position.y = .24; ap.add(st);
    const lf = new THREE.Mesh(new THREE.SphereGeometry(.06, 8, 6), leaf); lf.scale.set(1.6, .4, 1); lf.position.set(.06, .26, 0); ap.add(lf);
    ap.position.set(-.15, .7, 0);
    // 旁邊一塊馬蹄形磁鐵
    const mg = new THREE.Group(); mg.position.set(1.15, .15, .2); g.add(mg);
    const arc = new THREE.Mesh(new THREE.TorusGeometry(.22, .085, 10, 20, Math.PI), coral); arc.rotation.x = -Math.PI / 2; arc.rotation.z = Math.PI; mg.add(arc);
    [-1, 1].forEach(s => {
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(.085, .085, .22, 12), coral); leg.rotation.x = Math.PI / 2; leg.position.set(s * .22, 0, .11); mg.add(leg);
      const tip = new THREE.Mesh(new THREE.CylinderGeometry(.087, .087, .1, 12), white); tip.rotation.x = Math.PI / 2; tip.position.set(s * .22, 0, .26); mg.add(tip);
    });
    mg.rotation.y = -.6;
    g.userData.anim = (t, e) => {
      ap.position.y = .7 + Math.sin(t * 1.8) * .025 * (1 + e);
      ap.rotation.z = Math.sin(t * 1.3) * .08;
      wat.scale.y = 1 + Math.sin(t * 2.2) * .01;
      mg.rotation.y = -.6 + Math.sin(t * .9) * .15 * (.3 + e);
      mg.position.y = .15 + Math.abs(Math.sin(t * 2.4)) * .05 * e;
    };
    return g;
  },
});
