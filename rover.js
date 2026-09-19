(() => {
"use strict";
if (typeof THREE === "undefined") {
  document.body.innerHTML = "<p style='padding:2rem;color:#6fe8df'>未能加载 Three.js。<a href='./index.html' style='color:#f4ca78'>返回首页</a></p>";
  return;
}

const G = 1.62;
const CELL = 0.5;
const GRID = 240;
const HALF = GRID * CELL * 0.5;
const STEP = 1 / 120;
const MAX_SPD = 7.2;
const CAM_Q = 4.6;
const ART = window.RoverArt;
const CODEX = window.RoverCodex;
const $ = (id) => document.getElementById(id);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;

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

const cvs = $("view");
const keys = new Set();
const holds = {};
let renderer, scene, camera, world, rover, groundMesh, sun, dashGlow, earthMesh, skyRoot;
let cameraMode = 0, photoMode = false, tracks, trackIndex = 0, trackCount = 0, trackDistance = 0;
let frameMs = 16, hudTimer = 0;
let observationPoint;
let mission = 0, visited = [false, false, false], toastT = 0;
let accu = 0, last = 0;
const car = {
  x: 0, y: 2, z: 0, yaw: 0,
  vx: 0, vz: 0, vy: 0, yawRate: 0,
  roll: 0, pitch: 0
};
const cam = { x: 0, y: 8, z: 12 };
const markers = [];
const wheels = [];

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
  scene.add(g);
}

function addStars() {
  skyRoot = ART.sky(); scene.add(skyRoot);
}

function addEarth() {
  earthMesh = ART.earth();
  earthMesh.position.set(73,43,182);
  skyRoot.add(earthMesh);
}

function clearWorld() {
  if (world) {
    scene.remove(world);
    const shared=new Set(Object.values(box.geo)), geos=new Set(), mats=new Set();
    world.traverse(o=>{
      if(o.geometry&&!shared.has(o.geometry))geos.add(o.geometry);
      if(o.material) (Array.isArray(o.material)?o.material:[o.material]).forEach(m=>mats.add(m));
    });
    geos.forEach(g=>g.dispose()); mats.forEach(m=>m.dispose());
  }
  world=new THREE.Group();scene.add(world);markers.length=0;
}

function groundColor(x, z, h) {
  if (mission === 2 && Math.hypot(x - 4, z - 4) < 4.2) return 0xae7950;
  const n=hash(Math.floor(x*1.7),Math.floor(z*1.7));
  if(h<.25) return n>.5?0xb2aaa0:0xbdb4a6;
  return n>.9?0xb2ada2:n>.65?0xc8bfae:n>.25?0xd3cbbd:0xc0b9aa;
}

function buildGround() {
  groundMesh=ART.terrain(voxelY,groundColor,CELL,GRID);
  world.add(groundMesh);
  tracks=new THREE.InstancedMesh(new THREE.PlaneGeometry(.16,.24),
    new THREE.MeshBasicMaterial({color:0x564c3e,transparent:true,opacity:.23,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-2}),1600);
  tracks.instanceMatrix.setUsage(THREE.DynamicDrawUsage);tracks.count=0;tracks.frustumCulled=false;
  world.add(tracks);trackIndex=trackCount=trackDistance=0;
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

function updateNearbyCodex() {
  let nearest=null,best=4.5;
  const distance=Math.hypot(car.x-observationPoint.x,car.z-observationPoint.z);
  if(distance<best){nearest='star-colors';best=distance;}
  MISSIONS[mission].spots.forEach((p,i)=>{
    const d=Math.hypot(car.x-p.x,car.z-p.z);
    if(visited[i]&&d<best){nearest=CODEX.forSpot(MISSIONS[mission].id,i).id;best=d;}
  });
  CODEX.setNearby(nearest);
}

function snapCam() {
  const fwdX=Math.sin(car.yaw),fwdZ=Math.cos(car.yaw),rx=Math.cos(car.yaw),rz=-Math.sin(car.yaw);
  const far=cameraMode===1,back=far?6.5:CAM_Q,side=far?-2.3:-1.8;
  cam.x=car.x-fwdX*back+rx*side;cam.z=car.z-fwdZ*back+rz*side;cam.y=car.y+(far?4.1:2.35);
  updateCamera(1);
}
function updateCamera(blend) {
  const fx=Math.sin(car.yaw),fz=Math.cos(car.yaw),rx=Math.cos(car.yaw),rz=-Math.sin(car.yaw);
  const far=cameraMode===1,portrait=camera.aspect<1,back=far?6.5:(portrait?5.6:CAM_Q),side=far?-2.3:(portrait?-.5:-1.8);
  cam.x=lerp(cam.x,car.x-fx*back+rx*side,blend);
  cam.z=lerp(cam.z,car.z-fz*back+rz*side,blend);
  const floor=voxelY(cam.x,cam.z)+.8;
  cam.y=lerp(cam.y,Math.max(car.y+(far?4.1:2.35),floor),blend);
  camera.position.set(cam.x,cam.y,cam.z);
  const ahead=far?2:8,offset=0;
  camera.lookAt(car.x+fx*ahead+rx*offset,car.y+(far?.6:1.0),car.z+fz*ahead+rz*offset);
}
function updateTracks(distance) {
  trackDistance+=distance;if(trackDistance<.19)return;trackDistance=0;
  const d=new THREE.Object3D(),fx=Math.sin(car.yaw),fz=Math.cos(car.yaw),rx=Math.cos(car.yaw),rz=-Math.sin(car.yaw);
  for(const side of [-.69,.69]){
    const x=car.x-fx*.9+rx*side,z=car.z-fz*.9+rz*side;
    d.position.set(x,voxelY(x,z)+.016,z);d.rotation.set(-Math.PI/2,0,-car.yaw);d.updateMatrix();
    tracks.setMatrixAt(trackIndex,d.matrix);trackIndex=(trackIndex+1)%1600;trackCount=Math.min(1600,trackCount+1);
  }
  tracks.count=trackCount;tracks.instanceMatrix.needsUpdate=true;
}
function toggleCamera() {
  cameraMode=1-cameraMode;$("cameraBtn").textContent=cameraMode?'近景视角':'全景视角';
}
function togglePhoto() {
  photoMode=!photoMode;document.documentElement.classList.toggle('photo-mode',photoMode);
  $("photoBtn").setAttribute('aria-pressed',String(photoMode));
}

function loadMission(idx) {
  mission = idx;
  visited = [false, false, false];
  const m = MISSIONS[mission];
  $("hiLine").textContent = m.name + " · " + m.sub.split(" / ")[0];
  $("m15").classList.toggle("on", idx === 0);
  $("m16").classList.toggle("on", idx === 1);
  $("m17").classList.toggle("on", idx === 2);
  car.x = m.spawn.x; car.z = m.spawn.z; car.yaw = m.spawn.yaw;
  car.vx = car.vz = car.vy = car.yawRate = 0;
  car.pitch = car.roll = 0;
  car.y = voxelY(car.x, car.z) + 0.12;
  snapCam();
  clearWorld();
  buildGround();
  addDressing();
  updateNearbyCodex();
  updateHud();
  toast(m.name + "：" + m.spots[0].title + "。WASD 驾驶。", 3.4);
}

function toast(text, t) {
  const el = $("toast");
  el.textContent = text;
  el.classList.add("show");
  toastT = t || 2.4;
}
function updateHud() {
  const n = visited.filter(Boolean).length;
  $("samp").textContent = n + "/3";
  const next = MISSIONS[mission].spots.find(function (s, i) { return !visited[i]; });
  if (n >= 3) {
    $("spotTitle").textContent = "巡视完成";
    $("spotText").textContent = MISSIONS[mission].name + " 三处采样点已全部抵达。可切换 15 / 16 / 17。";
  } else if (next) {
    $("spotTitle").textContent = "前往 " + next.title;
    $("spotText").textContent = next.text;
  }
}

function held(k) {
  return holds[k] || keys.has(k) || keys.has(k.toUpperCase());
}
function physics(dt) {
  const throttle = (held("w") || held("arrowup") ? 1 : 0) - (held("s") || held("arrowdown") ? 0.7 : 0);
  const steer = (held("a") || held("arrowleft") ? 1 : 0) - (held("d") || held("arrowright") ? 1 : 0);
  const spd = Math.hypot(car.vx, car.vz);
  const fwdX = Math.sin(car.yaw), fwdZ = Math.cos(car.yaw);
  const rightX = Math.cos(car.yaw), rightZ = -Math.sin(car.yaw);
  const acc = throttle * 9.5;
  car.vx += fwdX * acc * dt;
  car.vz += fwdZ * acc * dt;
  const targetYaw = steer * 1.15 * (0.35 + Math.min(1, spd / 4));
  car.yawRate = lerp(car.yawRate, targetYaw, 1 - Math.pow(0.001, dt));
  car.yaw += car.yawRate * dt;
  const drag = 1.6 + (throttle < 0 ? 3.2 : 0);
  car.vx *= Math.max(0, 1 - drag * dt);
  car.vz *= Math.max(0, 1 - drag * dt);
  const cap = MAX_SPD;
  const s = Math.hypot(car.vx, car.vz);
  if (s > cap) { car.vx *= cap / s; car.vz *= cap / s; }
  car.x += car.vx * dt;
  car.z += car.vz * dt;
  car.x = clamp(car.x, -HALF + 4, HALF - 4);
  car.z = clamp(car.z, -HALF + 4, HALF - 4);

  const sample = [
    [0.9, 0.66], [0.9, -0.66], [-0.9, 0.66], [-0.9, -0.66]
  ].map(function (p) {
    const wx = car.x + p[0] * fwdX - p[1] * rightX;
    const wz = car.z + p[0] * fwdZ - p[1] * rightZ;
    return voxelY(wx, wz);
  });
  const fl = sample[0], fr = sample[1], bl = sample[2], br = sample[3];
  const ground = (fl + fr + bl + br) * 0.25;
  const wantY = ground + 0.12;
  const spring = (wantY - car.y) * 18 - car.vy * 6.5;
  car.vy += (spring - G * 0.35) * dt;
  car.y += car.vy * dt;
  if (car.y < wantY) { car.y = wantY; car.vy = Math.max(0, car.vy); }
  car.pitch = lerp(car.pitch, ((bl + br) - (fl + fr)) * 0.1, 0.12);
  car.roll = lerp(car.roll, ((fl + bl) - (fr + br)) * 0.1, 0.12);

  rover.position.set(car.x, car.y, car.z);
  rover.rotation.order = "YXZ";
  rover.rotation.y = car.yaw - Math.PI / 2;
  rover.rotation.x = car.roll;
  rover.rotation.z = -car.pitch;
  const spin = s * dt * 3.4;
  wheels.forEach(function (w) {
    w.mesh.rotation.z -= spin * (throttle < 0 ? -1 : 1);
    if (w.front) w.hub.rotation.y = steer * 0.45;
  });

  updateTracks(s*dt);
  updateCamera(1-Math.exp(-7*dt));
  if(sun){
    sun.position.set(car.x-28,car.y+35,car.z-18);
    sun.target.position.set(car.x,car.y,car.z);sun.target.updateMatrixWorld();
  }

  MISSIONS[mission].spots.forEach(function (spot, i) {
    if (visited[i]) return;
    if (Math.hypot(car.x - spot.x, car.z - spot.z) < 4.2) {
      visited[i] = true;
      const flag = markers[i];
      if (flag && flag.mesh.children[1] && flag.mesh.children[1].material) {
        flag.mesh.children[1].material.color.setHex(0x6fe8df);
        flag.mesh.children[1].material.emissive.setHex(0x17606b);
      }
      const card=CODEX.forSpot(MISSIONS[mission].id,i);
      const fresh=CODEX.unlock(card.id);
      toast((fresh?'新图鉴已收录：':'采样完成：')+card.title+' · 停车按 E 阅读',4.2);
      updateHud();
      if (visited.every(Boolean)) toast(MISSIONS[mission].name + " 巡视完成。", 3);
    }
  });
  hudTimer+=dt;
  if(hudTimer>.12){
    hudTimer=0;updateNearbyCodex();$("spd").textContent=String(Math.round(s*3.6)).padStart(2,'0');
    const next=MISSIONS[mission].spots.find((p,i)=>!visited[i]);
    if(next){
      $("distance").textContent=Math.round(Math.hypot(car.x-next.x,car.z-next.z))+' m';
      const a=Math.atan2(next.x-car.x,next.z-car.z)-car.yaw;
      $("bearing").style.transform='rotate('+(-a)+'rad)';
    }else{$("distance").textContent='完成';}
  }
}

function resize() {
  const stage = $("stage");
  const w = stage.clientWidth, h = stage.clientHeight;
  if (!w || !h) return;
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  if(earthMesh){
    const portrait=w<h;
    earthMesh.scale.setScalar(portrait?.62:1);
    earthMesh.position.set(portrait?104:73,43,portrait?155:182);
  }
  renderer.setSize(w, h, false);
  renderer.setPixelRatio(Math.min(1.5, window.devicePixelRatio || 1));
}
function layout() {
  const touch = window.matchMedia("(pointer: coarse)").matches || "ontouchstart" in window;
  document.documentElement.classList.toggle("is-touch", touch);
  document.documentElement.classList.toggle("is-portrait", window.innerHeight > window.innerWidth);
  resize();
}
function bindHold(el, name) {
  if (!el) return;
  const down = function (e) { e.preventDefault(); if(CODEX.isOpen())return; el.setPointerCapture(e.pointerId); holds[name] = true; };
  const up = function (e) { e.preventDefault(); holds[name] = false; };
  el.addEventListener("pointerdown", down);
  el.addEventListener("pointerup", up);
  el.addEventListener("lostpointercapture", up);
  el.addEventListener("pointercancel", up);
}
function bind() {
  window.addEventListener("keydown", function (e) {
    const k = e.key.toLowerCase();
    if(CODEX.isOpen())return;
    if(k==='j'&&!e.repeat){e.preventDefault();CODEX.openGallery();return;}
    if(k==='e'&&!e.repeat){e.preventDefault();CODEX.activateNearby();return;}
    keys.add(k);
    if (k === "w" || k === "a" || k === "s" || k === "d" || k.indexOf("arrow") === 0) e.preventDefault();
    if (e.key === "1") loadMission(0);
    if (e.key === "2") loadMission(1);
    if (e.key === "3") loadMission(2);
    if (e.key === "r" || e.key === "R") loadMission(mission);
    if(k==='c'&&!e.repeat)toggleCamera();
    if(k==='h'&&!e.repeat)togglePhoto();
    if(e.key==='Escape'){if(photoMode)togglePhoto();else location.href='./index.html';}
  });
  window.addEventListener("keyup", function (e) { keys.delete(e.key.toLowerCase()); });
  $("m15").onclick = function () { loadMission(0); };
  $("m16").onclick = function () { loadMission(1); };
  $("m17").onclick = function () { loadMission(2); };
  $("restartBtn").onclick = function () { loadMission(mission); };
  $("cameraBtn").onclick=toggleCamera;
  $("photoBtn").onclick=togglePhoto;
  $("photoExit").onclick=togglePhoto;
  const clearInput=()=>{keys.clear();holds.w=holds.a=holds.s=holds.d=false;};
  CODEX.init(()=>{clearInput();car.vx=car.vz=car.vy=car.yawRate=0;accu=0;});
  window.addEventListener('blur',clearInput);
  document.addEventListener('visibilitychange',()=>{if(document.hidden)clearInput();last=performance.now();accu=0;});
  Array.prototype.forEach.call(document.querySelectorAll("[data-hold]"), function (el) {
    bindHold(el, el.getAttribute("data-hold"));
  });

  window.addEventListener("resize", layout);
}

function tick(now) {
  const dt = Math.min(0.05, (now - last) / 1000 || 0.016);
  last = now;
  if(document.hidden){requestAnimationFrame(tick);return;}
  frameMs=lerp(frameMs,dt*1000,.025);
  if(CODEX.isOpen())accu=0;
  else accu += dt;
  if (accu > 0.2) accu = 0.2;
  while (accu >= STEP) {
    physics(STEP);
    accu -= STEP;
  }
  if (toastT > 0) {
    toastT -= dt;
    if (toastT <= 0) $("toast").classList.remove("show");
  }
  skyRoot.position.copy(camera.position);
  earthMesh.rotation.y+=dt*.008;
  renderer.render(scene, camera);
  requestAnimationFrame(tick);
}

function boot() {
  scene=new THREE.Scene();scene.background=new THREE.Color(0x020710);
  camera=new THREE.PerspectiveCamera(54,16/9,.08,600);scene.add(camera);
  try {
    renderer=new THREE.WebGLRenderer({canvas:cvs,antialias:true,alpha:false,powerPreference:'high-performance'});
  }catch(error){
    $("stage").innerHTML="<div class='webgl-error'><h2>暂时无法开启 3D 画面</h2><p>请启用浏览器硬件加速后重试。</p><a href='./index.html'>返回 2D 探索</a></div>";
    return;
  }
  renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
  renderer.outputColorSpace=THREE.SRGBColorSpace;
  renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.15;
  scene.add(new THREE.HemisphereLight(0xb9cde8,0x8f7d61,.85));
  sun=new THREE.DirectionalLight(0xffefd5,3.0);sun.position.set(-28,35,-18);sun.castShadow=true;
  sun.shadow.mapSize.set(2048,2048);sun.shadow.camera.near=.5;sun.shadow.camera.far=110;
  sun.shadow.camera.left=-22;sun.shadow.camera.right=22;sun.shadow.camera.top=22;sun.shadow.camera.bottom=-22;
  sun.shadow.bias=-.00015;sun.shadow.normalBias=.035;sun.shadow.radius=2;
  scene.add(sun,sun.target);
  const fill=new THREE.DirectionalLight(0x96bbeb,.36);fill.position.set(14,9,-22);scene.add(fill);
  addStars();addEarth();makeRover();bind();layout();loadMission(0);
  // Read-only diagnostics used by local browser verification.
  window.__roverDiagnostics=()=>({mission:MISSIONS[mission].id,visited:visited.slice(),
    position:{x:car.x,y:car.y,z:car.z,yaw:car.yaw},cameraMode,photoMode,tracks:trackCount,
    frameMs:Math.round(frameMs),calls:renderer.info.render.calls,triangles:renderer.info.render.triangles,
    geometries:renderer.info.memory.geometries,textures:renderer.info.memory.textures,codex:CODEX.stats(),codexOpen:CODEX.isOpen()});
  cvs.addEventListener('webglcontextlost',e=>{e.preventDefault();toast('画面连接中断，请刷新页面重试。',60);});
  last=performance.now();requestAnimationFrame(tick);
}

boot();
})();
