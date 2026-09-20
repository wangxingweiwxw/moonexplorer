/* Shared original Apollo terrain, props and observations for both game modes. */
window.RoverRegions = (() => {
'use strict';
const ART=window.RoverArt,CELL=.5,GRID=240,HALF=60;
const lerp=(a,b,t)=>a+(b-a)*t;
const PAL = {
  dust: 0xc6c2b8,
  dustHi: 0xd4d0c6,
  dustLo: 0xb2aea4,
  dustMid: 0xbbb7ad,
  rock: 0xa7a39a,
  orange: 0xc46a28
};

const MISSIONS = [
  {
    id: 15,
    name: "阿波罗 15",
    sub: "HADLEY–APENNINE / 1971",
    spawn: { x: -16, z: 8, yaw: 0.72 },
    ground: PAL.dust,
    spots: [
      { x: -6, z: 8, title: "哈德利月溪", text: "一条蜿蜒的熔岩渠，深约 300 米。斯科特与欧文沿溪沿取样，是月球车第一次真正的长途巡视。" },
      { x: 18, z: -28, title: "哈德利山", text: "亚平宁山脉前缘，相对高差超过 4000 米。车载电视把登山取样传回地球。" },
      { x: -22, z: 36, title: "第一辆月球车", text: "LRV-1 最大时速约 13 km/h。15 号任务累计行驶 27.9 公里，比步行时代远得多。" }
    ]
  },
  {
    id: 16,
    name: "阿波罗 16",
    sub: "DESCARTES HIGHLANDS / 1972",
    spawn: { x: -24, z: -10, yaw: 0.18 },
    ground: PAL.dustHi,
    spots: [
      { x: 8, z: 6, title: "北射电坑", text: "年轻撞击坑，溅射毯把高地基岩翻到表面。杨和杜克在坑缘采集了大块角砾岩。" },
      { x: -24, z: 32, title: "笛卡尔高地", text: "曾以为是火山高原，采样后更像撞击堆积。改写了月陆成因判断。" },
      { x: 26, z: -26, title: "石山", text: "笛卡尔南侧高地。LRV-2 把他们送到步行到不了的陡坡取样点。" }
    ]
  },
  {
    id: 17,
    name: "阿波罗 17",
    sub: "TAURUS–LITTROW / 1972",
    spawn: { x: -28, z: -2, yaw: 0.08 },
    ground: PAL.dustMid,
    spots: [
      { x: 4, z: 4, title: "短坑橙土", text: "施密特在 Shorty 坑发现橙色火山玻璃。那是月幔喷发的痕迹，不是锈。" },
      { x: -8, z: -30, title: "陶拉斯–利特罗谷", text: "南北高地夹着的深谷。最后一次载人登月把地质学家送上了月面。" },
      { x: 28, z: 24, title: "最后一辆月球车", text: "LRV-3 累计 35.9 公里。离开前他们关掉相机，镜头里留下渐行渐远的车辙。" }
    ]
  }
];


const contexts=[];
function context(mission) {
  if(contexts[mission])return contexts[mission];
  let world,observationPoint,markers=[],visited=[false,false,false];
function hash(ix, iz) {
  const s = Math.sin(ix * 127.1 + iz * 311.7 + mission * 19.3) * 43758.5453;
  return s - Math.floor(s);
}
function noise(x, z) {
  const xi = Math.floor(x), zi = Math.floor(z);
  const xf = x - xi, zf = z - zi;
  const u = xf * xf * (3 - 2 * xf), v = zf * zf * (3 - 2 * zf);
  const a = hash(xi, zi), b = hash(xi + 1, zi), c = hash(xi, zi + 1), d = hash(xi + 1, zi + 1);
  return lerp(lerp(a, b, u), lerp(c, d, u), v);
}
function fbm(x, z) {
  return noise(x, z) * 0.55 + noise(x * 2.17, z * 2.17) * 0.28 + noise(x * 5.3, z * 5.3) * 0.12 + noise(x * 11.1, z * 11.1) * 0.05;
}
function crater(x, z, cx, cz, r, depth) {
  const d = Math.hypot(x - cx, z - cz);
  if (d >= r) return 0;
  const t = d / r;
  if (t > 0.74) {
    const rim = 1 - Math.abs(t - 0.87) / 0.13;
    return rim * rim * depth * 0.16;
  }
  return -depth * Math.pow(1 - t / 0.74, 1.35);
}
function heightAt(x, z) {
  let h = 1.7 + fbm(x * .055, z * .055) * 1.5;
  h += crater(x, z, -4, 29, 10.5, 3.2);
  h += crater(x, z, -23, -15, 8.5, 2.6);
  if (mission === 0) {
    const rille = Math.abs(x + 4 - Math.sin(z * .07) * 4);
    if (z < 8 && rille < 3.5) h -= Math.pow(1-rille/3.5,2)*1.9;
    h += crater(x, z, 24, -8, 7, 2.2);
  } else if (mission === 1) {
    h += crater(x, z, 8, 6, 12, 3.8);
  } else {
    h += crater(x, z, 4, 4, 6.2, 1.8);
  }
  // Rounded massifs with terraced faces, rather than a vertical perimeter wall.
  [[-29,29,9,7],[33,31,11,8],[-35,-32,12,9],[23,48,10,6],[48,-15,13,8],[-49,8,11,7],[5,-49,12,8]].forEach(p=>{
    const d=Math.hypot(x-p[0],z-p[1])/p[2];
    if(d<1)h+=Math.pow(1-d,0.7)*p[3]*(.8+noise(x*.16,z*.16)*.4);
  });
  const edge=Math.max(Math.abs(x),Math.abs(z));
  if(edge>49)h+=(edge-49)*.08+noise(x*.045,z*.045)*Math.min(9,(edge-49)*1.2);
  return h;
}
function voxelY(x, z) {
  // Query the same cell center used by the visible terrain and tire contacts.
  const sx=(Math.floor((x+HALF)/CELL)+.5)*CELL-HALF;
  const sz=(Math.floor((z+HALF)/CELL)+.5)*CELL-HALF;
  return Math.max(-3, Math.round(heightAt(sx, sz) / .25) * .25);
}
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

function groundColor(x, z, h) {
  if (mission === 2 && Math.hypot(x - 4, z - 4) < 4.2) return 0xae7950;
  const n=hash(Math.floor(x*1.7),Math.floor(z*1.7));
  if(h<.25) return n>.5?0xb2aaa0:0xbdb4a6;
  return n>.9?0xb2ada2:n>.65?0xc8bfae:n>.25?0xd3cbbd:0xc0b9aa;
}

function addRubble() {
  const mesh=new THREE.InstancedMesh(new THREE.BoxGeometry(1,1,1),
    new THREE.MeshStandardMaterial({color:0xffffff,map:ART.texture('rock'),roughness:1}),3600);
  mesh.castShadow=mesh.receiveShadow=true;
  const d=new THREE.Object3D(),color=new THREE.Color();
  for(let i=0;i<3600;i++){
    const x=(hash(i,21)-.5)*HALF*1.94,z=(hash(i,44)-.5)*HALF*1.94;
    const a=.045+Math.pow(hash(i,9),3)*.32;
    d.position.set(x,voxelY(x,z)+a*.3,z);d.rotation.set(0,hash(i,3)*6,0);
    d.scale.set(a,a*(.4+hash(i,5)*.7),a*(.7+hash(i,8)*.4));d.updateMatrix();mesh.setMatrixAt(i,d.matrix);
    mesh.setColorAt(i,color.setHex(hash(i,12)>.5?0xb9b2a6:0x8c887f));
  }
  world.add(mesh);
}

function addBoulder(x, z, s) {
  const g = new THREE.Group();
  const stone = mat(PAL.rock);
  const dust = mat(PAL.dustMid);
  const u = 0.14 * (s || 1);
  const p = bricks(g, u);
  p(stone, 0, 1.6, 0, 3.4, 3.2, 3.4);
  p(dust, 1.4, 1.1, 0.8, 2.2, 2.2, 2.2);
  p(stone, -1.1, 0.9, -0.7, 2.0, 1.8, 2.0);
  p(dust, 0.3, 2.8, 0.2, 1.6, 1.4, 1.6);
  g.position.set(x, voxelY(x, z), z);
  world.add(g);
}

function addCrystal(x, z, scale) {
  const g=ART.crystal(),s=scale||1;g.scale.set(s*1.05,s*.72,s*1.05);g.position.set(x,voxelY(x,z),z);world.add(g);
}

function addFlag(spot, i) {
  const g = new THREE.Group();
  const pole = mat(0xcfd8dc);
  const cloth = mat(visited[i] ? 0x6fe8df : 0xe07a32, { emissive: visited[i] ? 0x17606b : 0x6a2208, emissiveIntensity: 0.4 });
  const h = voxelY(spot.x, spot.z);
  box(g, 0.08, 2.2, 0.08, pole, 0, 1.1, 0);
  box(g, 0.7, 0.38, 0.06, cloth, 0.38, 1.85, 0);
  g.position.set(spot.x, h, spot.z);
  world.add(g);
  markers.push({ mesh: g, spot: spot, i: i });
}

function addDressing() {
  for(let i=0;i<18;i++){
    const x=(hash(i+2,5)-.5)*HALF*1.6,z=(hash(i+2,11)-.5)*HALF*1.6;
    addCrystal(x,z,.65+hash(i,17)*.75);
  }
  [[-20,13,1.25],[-16,20,1.05],[6,37,1.25],[17,15,1.1],[-26,33,1],[30,31,1.4]].forEach(p=>addCrystal(...p));
  addRubble();
  for(let i=0;i<38;i++)addBoulder((hash(i,71)-.5)*98,(hash(i,72)-.5)*98,.7+hash(i,73)*2.2);
  // Suspended voxel outcrops are a deliberate fantasy detail from the art reference.
  [[-27,14,35,2.4],[17,17,49,1.2],[39,20,34,1.8],[-42,23,-8,1.6]].forEach((p,i)=>{
    const g=new THREE.Group(),stone=new THREE.MeshStandardMaterial({color:0xd0c3a9,map:ART.texture('rock'),roughness:1});
    for(let x=-3;x<=3;x++)for(let z=-2;z<=2;z++){
      if(hash(x+i*7,z+42)<.2)continue;
      const h=.3+hash(x+5,z+17)*.7;
      box(g,.65,h,.65,stone,x*.64,h*.25,z*.64);
    }
    ART.batch(g);const ice=ART.crystal();ice.rotation.z=Math.PI;ice.scale.setScalar(.3);ice.position.y=-.2;g.add(ice);
    g.position.set(p[0],p[1],p[2]);g.scale.setScalar(p[3]);world.add(g);
  });
  MISSIONS[mission].spots.forEach(addFlag);
  addObservationPoint();
}

function addObservationPoint() {
  const spawn=MISSIONS[mission].spawn;
  observationPoint={x:spawn.x-2.8,z:spawn.z+1.7};
  const g=new THREE.Group(),metal=mat(0x9cabb2),dark=mat(0x283440);
  for(let i=0;i<3;i++){
    const a=i*Math.PI*2/3;
    const leg=box(g,.07,.85,.07,dark,Math.cos(a)*.2,.42,Math.sin(a)*.2);
    leg.rotation.z=-Math.cos(a)*.25;leg.rotation.x=Math.sin(a)*.25;
  }
  box(g,.45,.12,.4,metal,0,.88,0);
  const barrel=new THREE.Group();barrel.position.set(0,1.12,0);barrel.rotation.z=-.6;
  const tube=new THREE.Mesh(new THREE.CylinderGeometry(.16,.19,.7,8),metal);
  tube.castShadow=true;barrel.add(tube);
  const lens=new THREE.Mesh(new THREE.CylinderGeometry(.145,.145,.025,8),mat(0x58c9ee,{emissive:0x227aaf,emissiveIntensity:.7}));
  lens.position.y=.36;barrel.add(lens);g.add(barrel);
  box(g,.32,.26,.07,mat(0xa6daee,{emissive:0x205b77,emissiveIntensity:.4}),.42,.65,0);
  g.position.set(observationPoint.x,voxelY(observationPoint.x,observationPoint.z),observationPoint.z);
  world.add(g);
}


  function dressing(options={}) {
    world=new THREE.Group();markers=[];visited=options.visited||[false,false,false];
    addDressing();const result={group:world,markers,observationPoint};
    world=null;return result;
  }
  return contexts[mission]={heightAt,voxelY,groundColor,hash,dressing};
}
return {MISSIONS,PAL,context};
})();
