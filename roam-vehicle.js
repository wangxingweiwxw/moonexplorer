/* Existing Apollo rover artwork, isolated for the global mode. */
window.createRoamVehicle = function () {
const ART=window.RoverArt, wheels=[]; let rover,dashGlow;
const hash=(x,y)=>{const n=Math.sin(x*127.1+y*311.7)*43758.5453;return n-Math.floor(n);};
function mat(color, extra) {
  return new THREE.MeshStandardMaterial(Object.assign({ color: color, map:ART.texture('panel'), roughness:.88, metalness:.08, flatShading: true }, extra || {}));
}
function box(parent, w, h, d, material, x, y, z, shadow) {
  const key = w.toFixed(2) + ":" + h.toFixed(2) + ":" + d.toFixed(2);
  let geo = box.geo[key];
  if (!geo) geo = box.geo[key] = new THREE.BoxGeometry(w, h, d);
  const m = new THREE.Mesh(geo, material);
  m.position.set(x || 0, y || 0, z || 0);
  m.castShadow = shadow !== false;
  m.receiveShadow = true;
  parent.add(m);
  return m;
}
box.geo = {};
function bricks(parent, u) {
  return function (material, x, y, z, sx, sy, sz) {
    return box(parent, sx * u, sy * u, sz * u, material, x * u, y * u, z * u);
  };
}

function makeAstronaut() {
  const g = new THREE.Group();
  const u = 0.032;
  const p = bricks(g, u);
  const white = mat(0xf4f6f2);
  const suit = mat(0xe8ebe6);
  const mid = mat(0xd4d8d2);
  const shade = mat(0x8b918b);
  const plate = mat(0xc8cdc7);
  const orange = mat(0xe07028);
  const visor = mat(0x4eb0f0, { emissive: 0x1a5a9a, emissiveIntensity: 0.85 });
  const dark = mat(0x2e363c);
  const pack = mat(0xdde1dc);
  for (let y = 0; y < 9; y++) {
    for (let x = -4; x <= 4; x++) {
      for (let z = -4; z <= 4; z++) {
        const ax = Math.abs(x), az = Math.abs(z);
        const shell = ax === 4 || az === 4 || y === 0 || y === 8;
        if (!shell || (ax === 4 && az === 4)) continue;
        if (x === 4 && y >= 2 && y <= 6 && az <= 2) continue;
        p(white, x, 18 + y, z, 1.04, 1.04, 1.04);
      }
    }
  }
  p(plate, 0, 21.6, 0, 7.2, 7.2, 7.2);
  p(mid, 0, 20.8, 0, 6.2, 6.0, 6.2);
  p(visor, 4.55, 22.6, 0, 1.5, 4.6, 6.4);
  p(dark, 5.15, 22.6, 0, 0.55, 3.6, 5.2);
  p(white, 4.2, 25.4, 0, 1.6, 1.2, 7.2);
  p(white, 4.2, 20.0, 0, 1.6, 1.2, 7.2);
  p(suit, 0.2, 16.6, 0, 4.6, 2.2, 4.6);
  p(plate, 0.2, 17.5, 0, 5.4, 1.2, 5.4);
  p(suit, 0.5, 12.0, 0, 8.8, 8.6, 9.2);
  p(plate, 0.9, 13.8, 0, 7.6, 4.2, 8.2);
  p(white, 1.3, 14.6, 0, 6.4, 2.2, 7.0);
  p(mid, 0.6, 11.2, 0, 7.4, 2.4, 8.0);
  p(orange, 0.55, 8.4, 0, 9.0, 1.5, 9.4);
  p(orange, 1.15, 12.4, 3.85, 2.2, 5.6, 1.35);
  p(orange, 1.15, 12.4, -3.85, 2.2, 5.6, 1.35);
  p(shade, -5.7, 12.6, 0, 4.6, 10.4, 8.4);
  p(pack, -6.15, 14.8, 0, 3.5, 4.4, 6.2);
  p(dark, -8.1, 13.8, 0, .4, 6.8, 5.9);
  p(mid, -8.4, 15.8, 0, .35, 1.4, 4.6);
  p(mid, -8.4, 10.8, 0, .35, 1.4, 4.6);
  p(orange, -8.4, 9.2, 0, .4, 1.0, 7.2);
  p(dark, -6.3, 8.8, 2.5, 2.5, 2.5, 2.5);
  p(dark, -6.3, 8.8, -2.5, 2.5, 2.5, 2.5);
  p(suit, -5.3, 12.4, 4.3, 1.8, 1.8, 2.0);
  p(white, -5.9, 17.4, 0, 2.8, 1.2, 5.0);
  p(suit, 0.85, 12.4, -6.7, 3.5, 6.8, 3.5);
  p(suit, 2.7, 8.6, -6.7, 3.3, 4.2, 3.3);
  p(white, 4.2, 6.2, -6.6, 3.3, 2.5, 3.3);
  p(suit, 1.25, 12.2, 6.7, 3.5, 6.6, 3.5);
  p(suit, 4.4, 9.2, 5.5, 5.2, 3.1, 3.3);
  p(white, 7.4, 7.8, 3.5, 3.5, 2.5, 3.3);
  p(dark, 8.5, 7.6, 3.5, 1.2, 1.2, 2.2);
  p(suit, 0.45, 5.0, 3.05, 5.8, 4.2, 4.1);
  p(suit, 0.45, 5.0, -3.05, 5.8, 4.2, 4.1);
  p(suit, 2.7, 2.1, 3.05, 5.2, 3.3, 3.9);
  p(suit, 2.7, 2.1, -3.05, 5.2, 3.3, 3.9);
  p(dark, 5.15, 0.9, 3.05, 2.5, 1.45, 3.5);
  p(dark, 5.15, 0.9, -3.05, 2.5, 1.45, 3.5);
  // Subtle square suit patches catch light like the reference's voxel shell.
  for(let i=0;i<24;i++) {
    const z=(hash(i,112)-.5)*7, y=19+hash(i,118)*6;
    p(i%3 ? mid : plate,-4.55,y,z,.08,.65+hash(i,113),.7+hash(i,114));
  }
  return g;
}
function makeFox() {
  const g = new THREE.Group();
  const u = 0.03;
  const p = bricks(g, u);
  const fur = mat(0xf7f4ee);
  const cream = mat(0xfffcf7);
  const shade = mat(0xe6e0d6);
  const dark = mat(0x1c1814);
  const blue = mat(0x3c78d4, { emissive: 0x163a80, emissiveIntensity: 0.55 });
  p(fur, -0.6, 8.6, 0, 9.2, 9.4, 7.8);
  p(shade, -1.0, 5.2, 0, 7.8, 4.2, 7.0);
  p(fur, -0.2, 10.6, 0.45, 7.4, 5.2, 8.2);
  p(cream, 0.5, 7.8, 0, 6.6, 6.2, 6.4);
  p(cream, 4.5, 12.2, 0, 7.2, 6.8, 7.2);
  p(cream, 5.1, 12.8, 0.45, 6.0, 5.6, 8.2);
  p(cream, 8.2, 11.0, 0, 4.4, 4.0, 5.2);
  p(cream, 9.9, 10.35, 0, 2.5, 2.7, 3.5);
  p(dark, 11.15, 10.15, 0.75, 1.55, 1.55, 1.9);
  p(cream, 2.65, 17.1, 2.7, 2.5, 4.8, 2.5);
  p(cream, 2.65, 17.1, -2.7, 2.5, 4.8, 2.5);
  p(dark, 2.65, 19.8, 2.7, 1.65, 1.9, 1.65);
  p(dark, 2.65, 19.8, -2.7, 1.65, 1.9, 1.65);
  p(cream, 2.55, 16.4, 2.7, 1.15, 2.5, 1.15);
  p(cream, 2.55, 16.4, -2.7, 1.15, 2.5, 1.15);
  p(fur, -6.4, 7.1, 0, 4.4, 3.4, 3.4);
  p(fur, -8.2, 8.4, 0, 2.9, 2.5, 2.5);
  p(cream, 1.85, 2.55, 2.7, 2.9, 4.2, 2.9);
  p(cream, 1.85, 2.55, -2.7, 2.9, 4.2, 2.9);
  p(dark, 2.05, 0.65, 2.7, 2.5, 1.25, 2.5);
  p(dark, 2.05, 0.65, -2.7, 2.5, 1.25, 2.5);
  p(blue, 0.5, 9.6, 3.9, 2.1, 2.1, 1.85);
  p(dark, 6.15, 13.05, 2.85, 1.35, 1.35, 1.15);
  p(dark, 6.15, 13.05, -2.85, 1.35, 1.35, 1.15);
  p(cream, 7.8, 11.8, 0, 2.3, 1.9, 3.1);
  return g;
}
function makeWheel() {
  const hub=new THREE.Group(),tire=new THREE.Group();
  const rubber=[mat(0x2b2a28),mat(0x3b3934),mat(0x49473f)];
  const rim=mat(0x858b88),dark=mat(0x343a3b);
  // Individual squared tread blocks keep the tires visibly voxel-built.
  for(let x=-4;x<=4;x++)for(let y=-4;y<=4;y++){
    const r=Math.hypot(x,y);if(r>4.25||r<2.1)continue;
    for(let z=0;z<4;z++){
      const m=rubber[(Math.abs(x)+Math.abs(y)+z)%3];
      box(tire,.077,.077,.099,m,x*.08,y*.08,(z-1.5)*.104);
    }
  }
  box(tire,.31,.31,.32,dark,0,0,0);
  box(tire,.2,.2,.44,rim,0,0,0);
  for(let i=0;i<4;i++){
    const a=i*Math.PI/2;
    box(tire,.07,.07,.42,rim,Math.cos(a)*.15,Math.sin(a)*.15,0);
  }
  ART.batch(tire);hub.add(tire);return {hub,mesh:tire};
}

function makeRover() {
  const g = new THREE.Group();
  const u = 0.07;
  const p = bricks(g, u);
  const hull = mat(0xd3d6d8);
  const panel = mat(0xb6bcc1);
  const light = mat(0xe4e7e9);
  const dark = mat(0x3a4248);
  const darker = mat(0x22282c);
  const frame = mat(0x4c545c);
  const orange = mat(0xdc6f28);
  const glow = mat(0xfff1b0, { emissive: 0xffc14a, emissiveIntensity: 1.45 });
  const lamp = mat(0xffe08a, { emissive: 0xffc14a, emissiveIntensity: 1.2 });
  const screen = mat(0x3aa6ff, { emissive: 0x1a7adf, emissiveIntensity: 1.25 });
  const mast = mat(0x2a3034);

  p(hull, 0.2, 3.8, 0, 30, 2.4, 17.2);
  p(panel, 1.0, 5.5, 0, 22, 1.9, 14.8);
  p(light, 2.4, 5.15, 0, 11, 1.25, 13.0);
  p(hull, -2.2, 4.6, 0, 16, 1.6, 15.4);
  for (let i = -5; i <= 5; i++) {
    p(i % 2 ? hull : panel, -15.2, 4.15, i * 1.55, 2.6, 2.7, 1.45);
  }
  p(frame, -16.4, 6.25, 0, 2.4, 1.35, 16.2);
  p(darker, -17.6, 4.35, 4.8, 2.8, 2.6, 2.8);
  p(darker, -17.6, 4.35, -4.8, 2.8, 2.6, 2.8);
  p(glow, -18.2, 4.5, 4.8, 2.35, 2.2, 2.35);
  p(glow, -18.2, 4.5, -4.8, 2.35, 2.2, 2.35);
  p(lamp, -18.45, 4.5, 4.8, 1.15, 1.25, 1.25);
  p(lamp, -18.45, 4.5, -4.8, 1.15, 1.25, 1.25);
  p(orange, 7.4, 5.8, 9.15, 2.6, 6.0, 1.9);
  p(orange, 7.4, 4.2, 9.35, 4.2, 2.2, 1.4);
  p(hull, 7.2, 3.4, 9.3, 5.0, 1.5, 2.8);
  p(hull, 7.2, 3.4, -9.3, 5.0, 1.5, 2.8);
  p(panel, 8.0, 5.2, 8.9, 9.2, 2.1, 1.7);
  p(hull, 0.4, 4.9, 9.05, 14, 1.8, 2.0);
  p(panel, 5.2, 6.0, 8.7, 11.2, 2.6, 1.5);
  p(frame, 10.2, 4.5, 8.2, 3.6, 2.4, 2.6);
  p(darker, 10.2, 3.3, 7.8, 2.6, 1.3, 3.2);
  p(hull, -3.6, 4.8, 8.85, 7.0, 2.2, 1.7);
  p(darker, 5.6, 7.35, 0, 12.4, 1.6, 9.2);
  p(screen, 6.9, 8.4, 0.25, 5.2, 0.6, 6.0);
  p(screen, 6.55, 8.75, 1.6, 2.2, 0.45, 2.0);
  p(screen, 6.55, 8.75, -1.4, 2.2, 0.45, 2.0);
  p(dark, 0.5, 8.05, -4.5, 6.6, 1.3, 5.2);
  p(dark, 1.5, 8.05, 4.3, 6.6, 1.3, 5.2);
  p(frame, 3.6, 9.1, -2.8, 1.9, 1.0, 1.9);
  p(darker, 3.6, 10.5, -2.8, 1.2, 2.2, 1.2);
  p(mast, -8.4, 6.6, -9.6, 1.15, 2.8, 1.15);
  p(mast, -8.4, 9.6, -9.6, 1.15, 3.4, 1.15);
  p(mast, -8.4, 13.0, -9.6, 1.15, 3.4, 1.15);
  p(mast, -8.4, 16.0, -9.6, 1.15, 2.6, 1.15);
  p(darker, -8.4, 17.6, -9.6, 1.85, 1.0, 1.85);
  p(lamp, -8.4, 19.15, -9.6, 2.15, 2.5, 2.15);
  p(darker, -8.4, 20.55, -9.6, 1.6, 0.55, 1.6);
  p(hull, 2.8, 11.6, 7.8, 1.1, 4.6, 1.1);
  p(hull, 2.8, 11.6, -7.8, 1.1, 4.6, 1.1);
  p(hull, 15.0, 5.0, 0, 4.0, 1.8, 12.0);
  p(frame, 15.8, 5.9, 3.4, 1.7, 1.3, 2.6);
  p(frame, 15.8, 5.9, -3.4, 1.7, 1.3, 2.6);
  p(dark, -11.2, 5.0, 7.4, 3.4, 1.7, 2.4);
  p(dark, -11.2, 5.0, -7.4, 3.4, 1.7, 2.4);
  p(panel, -14.0, 5.6, 6.2, 2.0, 1.4, 2.2);
  p(panel, -14.0, 5.6, -6.2, 2.0, 1.4, 2.2);

  // Rear chassis, seat backs, fenders and equipment give the vehicle a solid silhouette.
  p(darker,-11,5.2,0,7,5.2,15.4);
  p(panel,-13.2,4.1,0,3,3.8,12.2);
  p(frame,-16.7,2.2,0,2.6,2.2,20);
  for(const z of [-4.6,4.6]) {
    p(dark,-5.3,8.9,z,2.4,7.4,7.0);
    p(frame,-5.6,12.8,z,2.6,1.4,7.8);
    p(darker,-6.7,8.8,z,.6,4.8,5.6);
  }
  for(const x of [-12,12])for(const z of [-9.8,9.8]) {
    p(panel,x,7,z,8.4,1.5,4.5);
    p(hull,x,6,z*1.13,8.6,3.4,1.2);
    p(orange,x,6.3,z*1.2,3.5,1.4,.4);
  }
  for(let i=0;i<7;i++)p(darker,-18,3.9,(i-3)*.95,.7,1.7,.45);
  const screenCanvas=document.createElement('canvas');screenCanvas.width=256;screenCanvas.height=128;
  const sc=screenCanvas.getContext('2d');sc.fillStyle='#03223b';sc.fillRect(0,0,256,128);
  sc.strokeStyle='#14628a';sc.lineWidth=1;
  for(let x=0;x<256;x+=16){sc.beginPath();sc.moveTo(x,0);sc.lineTo(x,128);sc.stroke();}
  for(let y=0;y<128;y+=16){sc.beginPath();sc.moveTo(0,y);sc.lineTo(256,y);sc.stroke();}
  sc.strokeStyle='#57d9ff';sc.lineWidth=3;sc.beginPath();
  for(let x=0;x<256;x+=8){const y=64+Math.sin(x*.043)*24+Math.sin(x*.1)*9;x?sc.lineTo(x,y):sc.moveTo(x,y);}sc.stroke();
  sc.fillStyle='#a7eeff';sc.font='13px monospace';sc.fillText('LRV / TELEMETRY',12,20);sc.fillText('O2  100%   NAV  ONLINE',12,113);
  const screenTex=new THREE.CanvasTexture(screenCanvas);screenTex.colorSpace=THREE.SRGBColorSpace;
  const display=new THREE.Mesh(new THREE.PlaneGeometry(.45,.32),new THREE.MeshBasicMaterial({map:screenTex}));
  display.rotation.x=-Math.PI/2;display.rotation.z=-Math.PI/2;display.position.set(.48,.635,0);g.add(display);

  const astro = makeAstronaut();
  astro.position.set(-0.18, 0.56, -0.38);
  astro.scale.setScalar(1.65);
  const fox = makeFox();
  fox.position.set(-0.08, 0.6, 0.36);
  fox.rotation.y = 0.08;
  fox.scale.setScalar(1.55);
  g.add(astro, fox);
  ART.batch(g);
  ART.glow(g,0xffbf55,-1.38,.315,.336,.85,.42);
  ART.glow(g,0xffbf55,-1.38,.315,-.336,.85,.42);
  ART.glow(g,0xffd07d,-.588,1.34,-.672,.65,.27);

  dashGlow = new THREE.PointLight(0x4aa8ff, .7, 2, 2);
  dashGlow.position.set(0.5, 0.72, 0);
  g.add(dashGlow);
  const lampLight = new THREE.PointLight(0xffd27a, 0.34, 5.2, 2);
  lampLight.position.set(-0.59, 1.48, -0.67);
  g.add(lampLight);
  const headL = new THREE.SpotLight(0xffe6b0, 2.1, 34, 0.62, 0.45, 1.1);
  headL.position.set(1.15, 0.62, 0.22);
  headL.target.position.set(8, 0.2, 0.2);
  g.add(headL, headL.target);
  const headR = new THREE.SpotLight(0xffe6b0, 2.1, 34, 0.62, 0.45, 1.1);
  headR.position.set(1.15, 0.62, -0.22);
  headR.target.position.set(8, 0.2, -0.2);
  g.add(headR, headR.target);

  const offsets = [
    [0.9, 0.66], [0.9, -0.66], [-0.9, 0.66], [-0.9, -0.66]
  ];
  offsets.forEach(function (p, i) {
    const w = makeWheel();
    w.hub.position.set(p[0], 0.28, p[1]);
    g.add(w.hub);
    wheels.push({ mesh: w.mesh, hub: w.hub, front: i < 2 });
  });
  rover = g;

}


makeRover(); return {mesh:rover,wheels};
};
