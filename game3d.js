(() => {
"use strict";
const W = 960, H = 540, SCALE = 4, CHAR_S = 2, FOX_S = 1, SAVE_KEY = "moonexplorer-v3", STEP = 1 / 60;
const S3 = 1 / 40, DEPTH = 2.4;
const cvs = document.getElementById("view");
let renderer, scene3, camera3, worldRoot, playerRig, foxRig, beamMesh, hintSprite;
let platMeshes = [], moverMeshes = [], nodeMeshes = [], crystalMeshes = [], enemyMeshes = [];
let particle3 = [];
let sunLight, sunTarget;
let texCache = {};
const wx = (x) => x * S3;
const wy = (y) => (468 - y) * S3;
const $ = (id) => document.getElementById(id);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const now = () => performance.now();
const PHYS = {acc:1700, fric:2100, max:220, grav:740, jump:-490, cut:0.55, coyote:0.14, buffer:0.18, djump:-420, dash:440, dashT:0.16, cutAfter:0.2};

const CARDS = [
  {id:"diameter", title:"月球有多大？", scene:"月面荒野", text:"月球直径约 3474 千米，相当于地球的四分之一多一点。站在月面看，地平线比地球上近很多。", zhihu:"https://www.zhihu.com/question/616528835/answer/1958511749943763878", zhihuAuthor:"旁听的老何"},
  {id:"mass", title:"质量和引力", scene:"月面荒野", text:"月球质量约为地球的 1/81，表面重力约是地球的 1/6。所以你会跳得更高、落得更慢。", zhihu:"https://zhuanlan.zhihu.com/p/687610178", zhihuAuthor:"寂寞如雪"},
  {id:"maria", title:"月海不是海", scene:"月面荒野", text:"“月海”是古老火山熔岩冷却形成的深色平原，里面没有水。肉眼看到的暗斑，多半就是月海。", zhihu:"https://www.zhihu.com/question/322273067/answer/2242865463", zhihuAuthor:"谢寅"},
  {id:"highlands", title:"明亮的月陆", scene:"月面荒野", text:"月陆是更古老、更亮的高地，布满撞击坑。它比月海更“苍老”，记录了太阳系早期的轰击历史。", zhihu:"https://www.zhihu.com/question/35697587/answer/565590780", zhihuAuthor:"《科学世界》杂志"},
  {id:"crater", title:"环形山", scene:"月面荒野", text:"环形山多由陨石撞击形成。没有大气保护，撞击坑能保存很久，成为天然的地质档案。", zhihu:"https://www.zhihu.com/question/1955656720522118238/answer/2064383118690326331", zhihuAuthor:"七小七"},
  {id:"soil", title:"月壤的秘密", scene:"月面荒野", text:"月壤由碎石、玻璃微珠和太阳风粒子组成。没有风雨搬运，它会在原地保存极长时间。", zhihu:"https://zhuanlan.zhihu.com/p/627825072", zhihuAuthor:"中科院物理所"},
  {id:"vacuum", title:"没有大气的世界", scene:"摇篮基地", text:"月球几乎没有大气，声音无法传播，天空永远是黑的。基地必须密封，并循环氧气与水。", zhihu:"https://www.zhihu.com/question/7003574290/answer/103339236746", zhihuAuthor:"赵泠"},
  {id:"temperature", title:"极端昼夜", scene:"摇篮基地", text:"月面白天可超过 100℃，夜晚可降到约 -170℃。没有大气保温，昼夜温差才会如此巨大。", zhihu:"https://www.zhihu.com/question/1947038737952383155/answer/2065735607628862790", zhihuAuthor:"七小七"},
  {id:"moonquake", title:"月震", scene:"摇篮基地", text:"月球也会“地震”：潮汐力、陨石撞击和内部冷却收缩都会引发月震。月震仪能帮助探测月球内部。", zhihu:"https://zhuanlan.zhihu.com/p/717961421", zhihuAuthor:"EnterpriseH"},
  {id:"basebuild", title:"基地建设难点", scene:"摇篮基地", text:"月尘会磨损密封件，辐射需要屏蔽，温差要靠隔热与热控。摇篮基地把实验室放在模块化舱体里，正是为了应对这些。", zhihu:"https://www.zhihu.com/question/2014665673561830063/answer/2016136762506884455", zhihuAuthor:"文暮"},
  {id:"survival", title:"月面怎么活", scene:"摇篮基地", text:"生存三件套：氧气循环、水温再生、辐射与微陨石防护。短途巡检还要盯着氧气余量和返回气闸的距离。", zhihu:"https://www.zhihu.com/question/2078908717966307409/answer/2079303137257698598", zhihuAuthor:"蓝千宸日记本"},
  {id:"instruments", title:"探测设备原理", scene:"摇篮基地", text:"光谱仪读矿物，测距仪用激光打地月距离，月震仪听内部“回声”。校准它们，科学数据才可靠。", zhihu:"https://www.zhihu.com/question/304160517/answer/574137705", zhihuAuthor:"中国科普博览"},
  {id:"locking", title:"潮汐锁定", scene:"天文观测站", text:"月球自转一周和绕地球公转一周的时间相同，所以地球上总看到同一面。这叫潮汐锁定。", zhihu:"https://www.zhihu.com/question/1928239825699446888/answer/1957057137265080168", zhihuAuthor:"Archimon"},
  {id:"phases", title:"月相变化", scene:"天文观测站", text:"月相是太阳照亮月球的部分随相对位置改变而产生的视觉效果。月球本身不发光，只反射阳光。", zhihu:"https://www.zhihu.com/question/322224895/answer/1671326664", zhihuAuthor:"Fidelio"},
  {id:"gravity", title:"地月引力", scene:"天文观测站", text:"地球拉着月球，月球也拉着地球。这对舞伴让月球轨道稳定，并在地球上掀起潮汐。", zhihu:"https://www.zhihu.com/question/1904894077847188868/answer/2029480794347827985", zhihuAuthor:"赵泠"},
  {id:"tides", title:"潮汐现象", scene:"天文观测站", text:"海水被月球（和太阳）引力牵动，形成潮起潮落。高潮不只出现在朝向月球的一侧，背侧也会有。", zhihu:"https://www.zhihu.com/question/660464087/answer/3610352142", zhihuAuthor:"杜老师"},
  {id:"shield", title:"月球的保护", scene:"天文观测站", text:"月球能“搅动”地球自转轴，让它不至于剧烈摇摆，有助于气候相对稳定。它也分担了一部分撞击风险。", zhihu:"https://www.zhihu.com/question/2063194455591728482/answer/2063551982368039837", zhihuAuthor:"诗与星空"},
  {id:"distance", title:"地月有多远", scene:"天文观测站", text:"地月平均距离约 38.4 万千米。光走一趟大约 1.3 秒。对讲会有轻微延迟，巡检时要预留通信时间。", zhihu:"https://www.zhihu.com/question/2044437722253742432/answer/2045180694586980273", zhihuAuthor:"旁听的老何"}
];

const SCENES = [
  {
    id:"surface", name:"月面荒野", sub:"SURFACE / 01", sky:"#0a141f", accent:"#9bb7be",
    width:4400, spawn:[90, 396], unlock:"free",
    platforms:[
      [0,468,820,72],[1040,468,720,72],[1960,468,780,72],[2960,468,1440,72],
      [260,390,150,16],[480,330,140,16],[700,280,160,16],
      [1180,400,180,16],[1380,340,150,16],[1580,280,190,16],
      [2140,390,160,16],[2360,320,170,16],[2580,250,200,16],
      [3180,390,160,16],[3400,320,180,16],[3640,260,220,16],[3920,340,160,16]
    ],
    movers:[{x:860,y:400,w:150,h:16,axis:"x",min:830,max:1010,spd:55}],
    hazards:[{x:820,y:500,w:220,h:40,type:"rad"},{x:1760,y:500,w:200,h:40,type:"rad"},{x:2740,y:500,w:220,h:40,type:"rad"}],
    nodes:[
      {x:90,y:430,type:"oxygen",label:"便携补氧柱"},
      {x:320,y:350,type:"card",card:"diameter",label:"直径测绘桩"},
      {x:760,y:240,type:"card",card:"mass",label:"重力演示器"},
      {x:1480,y:300,type:"puzzle",puzzle:"pipes",label:"月壤管路台"},
      {x:1680,y:240,type:"card",card:"soil",label:"月壤样本舱"},
      {x:2100,y:430,type:"checkpoint",label:"荒野检查点"},
      {x:2460,y:280,type:"card",card:"maria",label:"月海成像仪"},
      {x:2680,y:210,type:"card",card:"highlands",label:"月陆光谱仪"},
      {x:3720,y:220,type:"card",card:"crater",label:"环形山标尺"},
      {x:4260,y:420,type:"exit",to:1,need:"surface",label:"进入摇篮基地"}
    ],
    crystals:[[200,448],[430,310],[720,258],[1120,448],[1600,258],[2280,300],[2600,228],[3320,368],[3680,238],[4100,448],[3900,318]],
    enemies:[
      {x:560,y:430,patrol:90,kind:"patrol"},
      {x:1500,y:250,patrol:70,kind:"hover"},
      {x:2500,y:430,patrol:110,kind:"patrol"},
      {x:3500,y:230,patrol:60,kind:"hover"}
    ],
    decor:[{t:"rover",x:180,y:430},{t:"rock",x:500,y:448},{t:"crystal",x:2300,y:430},{t:"dome",x:3100,y:300}]
  },
  {
    id:"base", name:"摇篮基地走廊", sub:"CRADLE / 02", sky:"#101a2a", accent:"#79bce0",
    width:4000, spawn:[100, 396], unlock:"surface",
    platforms:[
      [0,468,700,72],[900,468,640,72],[1740,468,700,72],[2660,468,1340,72],
      [220,380,180,16],[480,310,170,16],[820,360,180,16],
      [1100,300,200,16],[1380,240,180,16],[1640,320,190,16],
      [1980,380,170,16],[2220,300,190,16],[2480,230,210,16],
      [2860,360,170,16],[3120,280,200,16],[3400,210,220,16],[3680,300,160,16]
    ],
    movers:[{x:740,y:390,w:140,h:16,axis:"y",min:300,max:430,spd:42},{x:2580,y:340,w:140,h:16,axis:"x",min:2520,max:2720,spd:50}],
    hazards:[{x:700,y:500,w:200,h:40,type:"rad"},{x:1540,y:500,w:200,h:40,type:"rad"},{x:2440,y:500,w:220,h:40,type:"rad"}],
    nodes:[
      {x:80,y:430,type:"oxygen",label:"氧气补给柱"},
      {x:280,y:340,type:"card",card:"vacuum",label:"气闸铭牌"},
      {x:560,y:270,type:"card",card:"temperature",label:"热控观测窗"},
      {x:1200,y:260,type:"puzzle",puzzle:"airlock",label:"气闸均压台"},
      {x:1460,y:200,type:"card",card:"moonquake",label:"月震仪"},
      {x:1900,y:430,type:"checkpoint",label:"走廊检查点"},
      {x:2300,y:260,type:"card",card:"basebuild",label:"结构应力屏"},
      {x:2580,y:190,type:"card",card:"survival",label:"生命保障手册"},
      {x:3500,y:170,type:"card",card:"instruments",label:"设备原理板"},
      {x:3860,y:420,type:"exit",to:2,need:"base",label:"前往观测站"}
    ],
    crystals:[[240,448],[500,288],[860,338],[1160,278],[1700,298],[2140,278],[2520,208],[3000,338],[3440,188],[3760,278]],
    enemies:[
      {x:980,y:430,patrol:80,kind:"patrol"},
      {x:1700,y:230,patrol:80,kind:"hover"},
      {x:3000,y:430,patrol:100,kind:"patrol"}
    ],
    decor:[{t:"tank",x:60,y:410},{t:"door",x:1800,y:360},{t:"console",x:2700,y:400}]
  },
  {
    id:"observatory", name:"天文观测站台", sub:"OBSERVATORY / 03", sky:"#070c1a", accent:"#b9a7ff",
    width:4000, spawn:[100, 396], unlock:"base",
    platforms:[
      [0,468,640,72],[860,468,700,72],[1760,468,720,72],[2700,468,1300,72],
      [240,390,160,16],[460,320,150,16],[680,250,170,16],
      [980,380,170,16],[1220,300,180,16],[1480,230,200,16],
      [1960,360,180,16],[2220,280,190,16],[2480,200,210,16],
      [2920,360,170,16],[3180,270,200,16],[3480,190,230,16]
    ],
    movers:[{x:700,y:360,w:140,h:16,axis:"x",min:650,max:840,spd:48},{x:1640,y:300,w:140,h:16,axis:"y",min:220,max:400,spd:40}],
    hazards:[{x:640,y:500,w:220,h:40,type:"rad"},{x:1560,y:500,w:200,h:40,type:"rad"},{x:2480,y:500,w:220,h:40,type:"rad"}],
    nodes:[
      {x:70,y:430,type:"oxygen",label:"观测站补氧柱"},
      {x:300,y:350,type:"card",card:"locking",label:"潮汐演示仪"},
      {x:520,y:280,type:"card",card:"phases",label:"月相投影器"},
      {x:1320,y:260,type:"puzzle",puzzle:"phase",label:"月相对准仪"},
      {x:1580,y:190,type:"card",card:"gravity",label:"引力模型台"},
      {x:2000,y:430,type:"checkpoint",label:"站台检查点"},
      {x:2320,y:240,type:"card",card:"tides",label:"潮汐模拟池"},
      {x:2580,y:160,type:"card",card:"shield",label:"地轴稳定档案"},
      {x:3580,y:150,type:"card",card:"distance",label:"激光测距台"},
      {x:3860,y:420,type:"exit",to:0,need:"",label:"返回月面荒野"}
    ],
    crystals:[[220,448],[480,298],[700,228],[1100,358],[1520,208],[2100,258],[2460,178],[3040,338],[3520,168],[3760,278]],
    enemies:[
      {x:900,y:430,patrol:90,kind:"patrol"},
      {x:1500,y:180,patrol:70,kind:"hover"},
      {x:2400,y:160,patrol:80,kind:"hover"},
      {x:3100,y:430,patrol:110,kind:"boss"}
    ],
    decor:[{t:"scope",x:1400,y:250},{t:"crystal",x:600,y:430},{t:"rock",x:2800,y:448}]
  }
];

const AT = {
  astro:[2,2,40,56,42], girl:[2,64,52,60,56],
  droneOn:[2,40,14,8], droneOff:[22,40,14,8],
  crystal:[48,40,8,10], term:[60,40,10,9], tank:[74,40,8,8], rover:[86,40,24,9]
};

let save, sceneIndex, scene, keys, last, running, paused, modalOpen, toastTimer, talkTimer;
let player, companion, cam, camN, shake, beam, particles, floats, stars, imgs, enemies, movers, combo, comboT, accu, hintTick, jumpHeld;

function defaultSave() {
  return {cards:[], solved:[], enemies:[], collected:[], checks:[], volume:0.4, scene:0, crystals:0, score:0, oxygen:100, muted:false, intro:false, abilities:{djump:false,dash:false,scan:false}, spawn:null};
}
function persist() { try { localStorage.setItem(SAVE_KEY, JSON.stringify(save)); } catch (e) {} }
function loadSave() {
  save = defaultSave();
  try {
    const s = JSON.parse(localStorage.getItem(SAVE_KEY) || "null");
    if (s) save = Object.assign(save, s);
    save.collected = save.collected || [];
    save.crystals = save.collected.length;
    save.enemies = save.enemies || [];
    save.checks = save.checks || [];
    save.abilities = Object.assign({djump:false,dash:false,scan:false}, save.abilities || {});
  } catch (e) {}
}
function loadImg(src) {
  return new Promise((res) => { const i = new Image(); i.onload = () => res(i); i.onerror = () => res(null); i.src = src; });
}
let bgmNodes = null, bgmName = "";
function getAC() {
  const A = window.AudioContext || window.webkitAudioContext;
  if (!A) return null;
  if (!getAC.ac) getAC.ac = new A();
  return getAC.ac;
}
function resumeAC() {
  const ac = getAC();
  if (ac && ac.state === "suspended" && ac.resume) {
    const p = ac.resume();
    if (p && p.catch) p.catch(function () {});
  }
  return ac;
}
function stopBgm() {
  if (bgmNodes) {
    try { bgmNodes.osc1.stop(); } catch (e) {}
    try { bgmNodes.osc2.stop(); } catch (e) {}
    try { bgmNodes.gain.disconnect(); } catch (e) {}
    bgmNodes = null;
  }
  bgmName = "";
}
function playBgm(name) {
  if (save.muted || !save.volume) { stopBgm(); return; }
  const ac = resumeAC();
  if (!ac) return;
  if (bgmName === name && bgmNodes) {
    bgmNodes.gain.gain.value = 0.035 * save.volume;
    return;
  }
  stopBgm();
  const freqs = { title: [196, 247], explore: [165, 220], base: [131, 196] };
  const f = freqs[name] || freqs.explore;
  const g = ac.createGain();
  g.gain.value = 0.035 * save.volume;
  const o1 = ac.createOscillator();
  const o2 = ac.createOscillator();
  o1.type = "sine";
  o2.type = "triangle";
  o1.frequency.value = f[0];
  o2.frequency.value = f[1];
  o1.connect(g);
  o2.connect(g);
  g.connect(ac.destination);
  o1.start();
  o2.start();
  bgmNodes = { osc1: o1, osc2: o2, gain: g };
  bgmName = name;
}
function setVol() {
  if (bgmNodes) bgmNodes.gain.gain.value = (save.muted ? 0 : 0.035 * save.volume);
  if (save.muted) stopBgm();
}
function sfx(name) {
  if (save.muted || !save.volume) return;
  beep(name);
}
function beep(kind) {
  try {
    const ac = resumeAC();
    if (!ac) return;
    const o = ac.createOscillator(), g = ac.createGain();
    const map = {jump:320, pickup:880, beam:720, ok:540, win:660, dash:200};
    o.frequency.value = map[kind] || 500; o.type = "square";
    g.gain.setValueAtTime(0.03 * save.volume, ac.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.08);
    o.connect(g);
    g.connect(ac.destination);
    o.start();
    o.stop(ac.currentTime + 0.09);
  } catch (e) {}
}

function burst(x, y, c, n) {
  for (let i = 0; i < n; i++) particles.push({x, y, vx:(Math.random()-0.5)*80, vy:-20-Math.random()*70, a:1, c, life:0.35+Math.random()*0.35});
  if (!worldRoot) return;
  const col = new THREE.Color(c);
  for (let i = 0; i < n; i++) {
    const m = new THREE.Mesh(new THREE.SphereGeometry(0.045, 6, 6), new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 1 }));
    m.position.set(wx(x) + (Math.random() - 0.5) * 0.2, wy(y) + 0.2, (Math.random() - 0.5) * 0.35);
    m.userData.vx = (Math.random() - 0.5) * 4;
    m.userData.vy = 1.4 + Math.random() * 2.4;
    m.userData.life = 0.45 + Math.random() * 0.25;
    worldRoot.add(m);
    particle3.push(m);
  }
}
function pop(x, y, text) { floats.push({x, y, text, t:1}); }
function shakeCam(n) { shake = Math.max(shake, n); }

function makeStars() {
  stars = [];
  for (let i = 0; i < 90; i++) stars.push({x:Math.random()*5000, y:8+Math.random()*250, s:i%6===0?2:1, tw:Math.random()*6});
}

function groundTopAt(x, w) {
  let top = null;
  const plats = scene.platforms;
  for (let i = 0; i < plats.length; i++) {
    const p = plats[i];
    if (x + w > p[0] + 8 && x < p[0] + p[2] - 8) {
      if (top === null || p[1] > top) top = p[1];
    }
  }
  return top;
}
function standOnFloor(x) {
  const pw = 40 * CHAR_S, ph = 56 * CHAR_S;
  let sx = clamp(x, 0, scene.width - pw);
  let top = groundTopAt(sx, pw);
  if (top === null) {
    let best = scene.platforms[0], bestDist = 1e9;
    for (let i = 0; i < scene.platforms.length; i++) {
      const p = scene.platforms[i];
      if (p[1] < 440) continue;
      const d = Math.abs(p[0] + p[2] / 2 - sx);
      if (d < bestDist) { bestDist = d; best = p; }
    }
    sx = clamp(best[0] + 24, 0, scene.width - pw);
    top = best[1];
  }
  return {x: sx, y: top - ph, w: pw, h: ph};
}
function resetActors(useCheck) {
  const sp = (useCheck && save.spawn && save.spawn.scene === scene.id) ? save.spawn : {x:scene.spawn[0], y:scene.spawn[1]};
  const placed = standOnFloor(sp.x);
  const fox = foxSize();
  player = {x:placed.x, y:placed.y, w:placed.w, h:placed.h, vx:0, vy:0, onGround:true, face:1, walk:0, coyote:PHYS.coyote, buffer:0, jumps:0, dash:0, dashCd:0, inv:0.4, airT:0, respawnLock:0};
  companion = {x:player.x - fox.w - 12, y:player.y + placed.h - fox.h, face:1, walk:0};
  beam = {on:false, t:0};
  particles = []; floats = []; combo = 1; comboT = 0; shake = 0; camN = player.x - 360; cam = camN;
  movers = (scene.movers || []).map((m) => Object.assign({t:0, dx:0, dy:0}, m));
  enemies = scene.enemies.map((e, i) => ({
    id: scene.id + ":" + i, x:e.x, y:e.y, w:14*SCALE, h:8*SCALE+10,
    dir:1, origin:e.x, oy:e.y, patrol:e.patrol, kind:e.kind || "patrol",
    armor: !save.enemies.includes(scene.id + ":" + i),
    dead: save.enemies.includes(scene.id + ":" + i), hp: e.kind === "boss" ? 3 : 1
  }));
}

function sceneUnlocked(id) {
  if (id === "surface") return true;
  if (id === "base") return save.solved.includes("surface");
  if (id === "observatory") return save.solved.includes("base");
  return true;
}

function switchScene(i, fromMap) {
  const next = SCENES[(i + SCENES.length) % SCENES.length];
  if (!fromMap && next.unlock && next.unlock !== "free" && !save.solved.includes(next.unlock)) {
    speak("刘看山", "气闸还锁着。先完成本区设备校准。");
    toast("需要先修复当前区域设备");
    return;
  }
  if (fromMap && !sceneUnlocked(next.id)) {
    toast("航线未开通：先完成上一区校准");
    return;
  }
  sceneIndex = (i + SCENES.length) % SCENES.length;
  scene = SCENES[sceneIndex];
  save.scene = sceneIndex;
  if (!fromMap) save.spawn = {scene:scene.id, x:scene.spawn[0], y:scene.spawn[1]};
  persist();
  resetActors(false);
  buildWorld();
  updateHUD();
  toast("已抵达：" + scene.name);
  sfx("ok");
  playBgm(sceneIndex === 0 ? "explore" : "base");
}

function goHome() {
  closeModal();
  location.href = "./index.html";
}

function startGame() {
  $("start").classList.add("hidden");
  $("game").classList.remove("hidden");
  $("pad").classList.remove("hidden");
  running = true; paused = false; last = performance.now(); accu = 0;
  scene = SCENES[sceneIndex];
  resetActors(true);
  buildWorld();
  resizeRenderer();
  updateHUD();
  playBgm(sceneIndex === 0 ? "explore" : "base");
  if (!save.intro) {
    save.intro = true; persist();
    speak("刘看山", "巡检开始。坑洞有辐射，落点要准。空中再按一次跳跃可二段跳——校准月壤台后我会帮你解锁。");
  }
  requestAnimationFrame(loop);
}

function toast(t) {
  const el = $("toast"); el.textContent = t; el.classList.add("toast-show");
  clearTimeout(toastTimer); toastTimer = setTimeout(() => el.classList.remove("toast-show"), 2000);
}
function speak(who, text) {
  const el = $("talk"); el.innerHTML = "<em>" + who + "</em>　" + text; el.classList.remove("hidden");
  clearTimeout(talkTimer); talkTimer = setTimeout(() => el.classList.add("hidden"), 4200);
}

function abilityLabel() {
  const a = [];
  if (save.abilities.djump) a.push("连跳");
  if (save.abilities.dash) a.push("喷气");
  if (save.abilities.scan) a.push("扫描");
  return a.length ? a.join(" · ") : "校准设备解锁能力";
}

function updateHUD() {
  $("sceneName").textContent = scene.name;
  $("sceneSub").textContent = scene.sub;
  $("count").textContent = save.cards.length + "/" + CARDS.length;
  $("statusLine").textContent = save.solved.length + "/3 设备  ·  " + save.enemies.length + "/" + totalEnemies() + " 干扰体";
  $("score").textContent = String(save.score).padStart(6, "0");
  $("crystalText").textContent = document.documentElement.classList.contains("is-portrait")
    ? ("档案 " + save.cards.length + "/" + CARDS.length + " · 晶体 " + save.crystals)
    : ("晶体 " + save.crystals);
  $("oxygenText").textContent = Math.round(save.oxygen) + "%";
  $("oxygenBar").style.width = save.oxygen + "%";
  $("comboText").textContent = "x" + combo;
  $("abilityText").textContent = abilityLabel();
  const leftP = 3 - save.solved.length;
  const leftC = CARDS.length - save.cards.length;
  if (leftC <= 0 && leftP <= 0) $("missionText").textContent = "巡检完成。你可以继续刷隐藏晶体，或在航线图回看三区。";
  else if (leftP > 0) $("missionText").textContent = "优先校准闪光设备（+" + (leftP) + "），途中收集档案。连击会提高得分。";
  else $("missionText").textContent = "设备已在线。还差 " + leftC + " 张档案，高台和移动平台上还有漏网的。";
  const hint = $("hint3d");
  if (hint && running && player) {
    const e = nearEnemy();
    const n = nearby(120);
    if (e && e.armor) { hint.textContent = "[E] 解开护甲锁"; hint.classList.remove("hidden"); }
    else if (e && !e.armor) { hint.textContent = "踩头或 [R] 射线"; hint.classList.remove("hidden"); }
    else if (n) { hint.textContent = "[E] " + n.label; hint.classList.remove("hidden"); }
    else hint.classList.add("hidden");
  }
}
function totalEnemies() { return SCENES.reduce((n, s) => n + s.enemies.length, 0); }

function nearby(extra) {
  const r = extra || 110;
  let best = null, bd = Infinity;
  for (const n of scene.nodes) {
    const d = Math.hypot(player.x + player.w/2 - n.x, player.y + player.h/2 - n.y);
    const lim = n.type === "exit" ? 150 : r;
    if (d < bd && d < lim) { bd = d; best = n; }
  }
  return best;
}
function nearEnemy() {
  for (const e of enemies) {
    if (e.dead) continue;
    if (Math.abs(player.x - e.x) < 120 && Math.abs(player.y - e.y) < 90) return e;
  }
  return null;
}

function hitCombo(base) {
  comboT = 2.4;
  const gain = Math.round(base * combo);
  save.score += gain;
  combo = Math.min(8, combo + 1);
  persist(); updateHUD();
  return gain;
}

function unlockCard(id, bonus) {
  if (save.cards.includes(id)) return false;
  save.cards.push(id);
  const g = hitCombo(bonus || 500);
  persist(); updateHUD();
  const c = CARDS.find((x) => x.id === id);
  toast("档案解锁：" + c.title + "  +" + g);
  sfx("pickup"); burst(player.x+20, player.y, "#f4ca78", 10);
  if (save.cards.length === CARDS.length) { sfx("win"); speak("刘看山", "图鉴齐了。这些数据会替月球讲很久。"); }
  return true;
}

function grantAbility(key, title, line) {
  if (save.abilities[key]) return;
  save.abilities[key] = true; persist(); updateHUD();
  toast("能力解锁：" + title);
  speak("刘看山", line);
  sfx("win"); shakeCam(8);
}

function interact() {
  const e = nearEnemy();
  if (e && e.armor) { openArmor(e); return; }
  if (e && !e.armor) { speak("刘看山", "护甲已开。踩到它头顶，或按 R 发射射线。"); return; }
  const n = nearby();
  if (!n) { speak("刘看山", "往闪光点和移动平台走。高台常藏着档案。"); return; }
  if (n.type === "exit") { switchScene(n.to, false); return; }
  if (n.type === "oxygen") {
    save.oxygen = 100; persist(); updateHUD(); toast("氧气已补满"); sfx("ok");
    speak("刘看山", "补满了。辐射裂隙会加快消耗，尽量跳过去。");
    return;
  }
  if (n.type === "checkpoint") {
    const placed = standOnFloor(n.x - 20);
    save.spawn = {scene:scene.id, x:placed.x, y:placed.y};
    if (!save.checks.includes(scene.id)) save.checks.push(scene.id);
    persist(); toast("检查点已同步"); sfx("ok");
    speak("刘看山", "坐标已记下。掉下去我会把你拉回这里。");
    return;
  }
  if (n.type === "card") {
    const c = CARDS.find((x) => x.id === n.card);
    if (!save.cards.includes(n.card)) unlockCard(n.card, 500);
    openCard(c); return;
  }
  if (n.type === "puzzle") openPuzzle(n);
}

function closeModal() { modalOpen = false; $("modal").classList.add("hidden"); }
function openModal(html) { modalOpen = true; $("modal").classList.remove("hidden"); $("modalBody").innerHTML = html; }
function openCard(c) {
  openModal("<h2>"+c.title+"</h2>"+cardPhotoHtml(c,"hero")+"<p>"+c.text+"</p><p>收录场景："+c.scene+"</p>"+zhihuLinkHtml(c)+"<div class='foot'><button class='primary' id='closeM'>收好档案</button></div>");
  $("closeM").onclick = closeModal;
}

function finishPuzzle(node, msg) {
  if (!save.solved.includes(scene.id)) save.solved.push(scene.id);
  hitCombo(800); persist(); updateHUD(); sfx("win"); shakeCam(10);
  if (scene.id === "surface") grantAbility("djump", "低重力连跳", "空中再按 SPACE，第二次起跳。月球重力只有地球六分之一。");
  if (scene.id === "base") grantAbility("dash", "喷气短突", "按 SHIFT 向前喷气，用来过裂隙。月尘里燃料很金贵，有冷却。");
  if (scene.id === "observatory") grantAbility("scan", "广域扫描", "射线变长，隐藏晶体会闪。刘看山也能标出下一处目标。");
  openModal("<h2>校准完成</h2><p>"+msg+"</p><p>新能力已写入你的舱外装。</p><div class='foot'><button class='primary' id='closeM'>继续巡检</button></div>");
  $("closeM").onclick = closeModal;
}

function openPuzzle(node) {
  if (save.solved.includes(scene.id)) {
    openModal("<h2>设备已在线</h2><p>"+node.label+" 指示灯稳定。</p><div class='foot'><button class='primary' id='closeM'>离开</button></div>");
    $("closeM").onclick = closeModal; return;
  }
  if (node.puzzle === "pipes") renderPipes(node);
  if (node.puzzle === "airlock") renderAirlock(node);
  if (node.puzzle === "phase") renderPhase(node);
}
function renderPipes(node) {
  const glyph = ["═","║","╗","╚"];
  let rot = [1, 3, 2];
  openModal("<h2>月壤管路台 · 接通管路</h2><div class='help'>左边是电源，右边是分析仪。点击每段管道会旋转 90°。<strong>三根都转成横线「═」</strong>，电流就能从左流到右。不用记组合，看着形状转即可。</div><p>电源 ── <span id='pipeRow'></span> ── 分析仪</p><p id='pstat'>已接通 0 / 3</p><div class='foot'><button id='cancelM'>取消</button></div>");
  $("cancelM").onclick = closeModal;
  const row = $("pipeRow");
  function paint() {
    row.innerHTML = rot.map((r,i)=>"<button class='pipe' data-i='"+i+"'>"+glyph[r]+"</button>").join("");
    const n = rot.filter(r=>r===0).length;
    $("pstat").textContent = "已接通 "+n+" / 3　"+(n===3?"通路完成":"继续把弯管转直");
    row.querySelectorAll("button").forEach((b)=>{
      b.onclick = () => { rot[+b.dataset.i] = (rot[+b.dataset.i]+1)%4; sfx("ok"); paint(); if (rot.every(r=>r===0)) finishPuzzle(node, "管路接通。月壤里的玻璃微珠，是微陨石把岩石瞬间熔化又冷却留下的。"); };
    });
  }
  paint();
}
function renderAirlock(node) {
  let kpa = 90;
  const lo = 40, hi = 60;
  openModal("<h2>气闸均压台</h2><div class='help'><strong>为什么要均压？</strong>门外是真空。如果舱内还是高气压就强行开门，空气会被一下子抽走，人很危险。<br>把舱压调进黄线之间的安全区（40–60 kPa），再点「开启气闸」。左边泄压、右边补压，每次 10 kPa，慢慢调。</div><div class='gauges'><div class='gauge'>舱内气压　<strong id='kpaTxt'>90 kPa</strong><div class='bar'><i class='fill' id='kpaFill' style='width:90%'></i><i class='zone' style='left:40%;width:20%'></i></div><small>黄区 = 可开门</small></div></div><div class='seq'><button id='vent'>泄压 −10</button><button id='pump'>补压 +10</button><button class='primary' id='openGate'>开启气闸</button></div><p id='pstat'>现在气压偏高，先点「泄压」。</p><div class='foot'><button id='cancelM'>取消</button></div>");
  $("cancelM").onclick = closeModal;
  function paint() {
    $("kpaTxt").textContent = kpa + " kPa";
    $("kpaFill").style.width = kpa + "%";
    const ok = kpa >= lo && kpa <= hi;
    $("pstat").textContent = ok ? "已进入黄区，可以开门。" : (kpa > hi ? "气压偏高：点「泄压」，让指针走进黄线。" : "气压偏低：点「补压」，回到黄区。");
  }
  $("vent").onclick = () => { kpa = Math.max(0, kpa-10); sfx("ok"); paint(); };
  $("pump").onclick = () => { kpa = Math.min(100, kpa+10); sfx("ok"); paint(); };
  $("openGate").onclick = () => {
    if (kpa>=lo && kpa<=hi) finishPuzzle(node, "气闸均压完成。月面没有大气，生命保障舱必须先平衡压力再开门。");
    else { sfx("jump"); $("pstat").textContent = "压差太大，强行开闸会把空气抽进真空。请先把指针调进黄区。"; }
  };
  paint();
}
function renderPhase(node) {
  openModal("<h2>月相对准仪</h2><div class='help'>月球本身不发光，只反射阳光。地球上看到的月相，取决于太阳、地球、月球的相对位置。<br><strong>上弦月</strong>：右半边亮、左半边暗（北半球常见画法）。请点选正确的那一张。</div><div class='phases'><button data-ok='0'><span class='moon'>🌕</span>满月</button><button data-ok='1'><span class='moon'>🌓</span>上弦月</button><button data-ok='0'><span class='moon'>🌑</span>新月</button><button data-ok='0'><span class='moon'>🌗</span>下弦月</button></div><p id='pstat'>刘看山：亮面在右边的是上弦。</p><div class='foot'><button id='cancelM'>取消</button></div>");
  $("cancelM").onclick = closeModal;
  document.querySelectorAll(".phases button").forEach((b)=>{
    b.onclick = () => {
      if (b.dataset.ok === "1") finishPuzzle(node, "月相对准完成。潮汐锁定让我们总看见月球的同一面，但月相仍会随日照方向改变。");
      else { sfx("jump"); $("pstat").textContent = "不是这张。满月整面亮，新月几乎全暗，下弦是左边亮。再看一眼提示。"; }
    };
  });
}
function hashId(s) { let h = 2166136261; for (let i=0;i<s.length;i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return Math.abs(h); }
function armorDone(en) {
  en.armor = false; toast("护甲已断开"); speak("刘看山", "踩它头顶，或按 R 发射科学射线。"); sfx("win"); closeModal();
}
function openArmor(en) {
  const kinds = ["colors","breach","pipes","memory","pairs"];
  const kind = kinds[hashId(en.id) % kinds.length];
  if (kind === "colors") armorColors(en);
  else if (kind === "breach") armorBreach(en);
  else if (kind === "pipes") armorPipes(en);
  else if (kind === "memory") armorMemory(en);
  else armorPairs(en);
}
function armorColors(en) {
  const names = ["关","青","橙","紫"];
  const h = hashId(en.id+":c");
  const goal = [1+(h%3), 1+((h>>2)%3), 1+((h>>4)%3)];
  if (goal[0]===goal[1] && goal[1]===goal[2]) goal[1] = goal[1]===1?2:1;
  let st = [0,0,0];
  const show = goal.map(v=>names[v]).join(" · ");
  openModal("<h2>干扰体能量锁 · 色码</h2><div class='help'>每台机器的色码都不同。把三枚锁点到：<strong>"+show+"</strong>。点一下换一种颜色。</div><div class='locks' id='locks'></div><div class='foot'><button id='cancelM'>取消</button></div>");
  $("cancelM").onclick = closeModal;
  const box = $("locks");
  function paint() {
    box.innerHTML = st.map((v,i)=>"<button class='lock c"+v+"' data-i='"+i+"'>"+names[v]+"</button>").join("");
    box.querySelectorAll("button").forEach((b)=>{
      b.onclick = () => { st[+b.dataset.i] = (st[+b.dataset.i]+1)%4; sfx("ok"); paint(); if (st.every((v,j)=>v===goal[j])) armorDone(en); };
    });
  }
  paint();
}
function armorBreach(en) {
  const grid = [
    ["1C","BD","55","E9"],
    ["7A","1C","FF","BD"],
    ["E9","7A","55","E9"],
    ["FF","BD","E9","55"]
  ];
  const seq = ["BD","7A","E9"];
  let buf = [], lastR = -1, lastC = -1;
  openModal("<h2>干扰体能量锁 · 入侵协议</h2><div class='help'>类似《赛博朋克 2077》的矩阵破解：<br>1）第一次可点任意格；2）下一次必须沿<strong>同一列</strong>；3）再下一次沿<strong>同一行</strong>，横竖交替。<br>目标代码：<span class='seq-target'>BD → 7A → E9</span><br>发亮的格子是当前能走的位置。点错代码不会爆炸，只会重置。</div><p id='pstat'>已捕获：无</p><div class='breach' id='breach'></div><div class='foot'><button id='cancelM'>取消</button></div>");
  $("cancelM").onclick = closeModal;
  const box = $("breach");
  function legal(r,c) {
    if (buf.length === 0) return true;
    if (buf.length % 2 === 1) return c === lastC && r !== lastR;
    return r === lastR && c !== lastC;
  }
  function paint() {
    box.innerHTML = "";
    for (let r=0;r<4;r++) for (let c=0;c<4;c++) {
      const b = document.createElement("button");
      b.textContent = grid[r][c];
      if (legal(r,c)) b.classList.add("legal");
      b.onclick = () => {
        if (!legal(r,c)) { $("pstat").textContent = "这一格不在当前行列上。请点发亮的格子。"; sfx("jump"); return; }
        if (grid[r][c] !== seq[buf.length]) { buf=[]; lastR=-1; lastC=-1; $("pstat").textContent = "代码不对，矩阵已重置。目标仍是 BD → 7A → E9。"; sfx("jump"); paint(); return; }
        buf.push(grid[r][c]); lastR=r; lastC=c; sfx("ok");
        $("pstat").textContent = "已捕获："+buf.join(" → ")+(buf.length===seq.length?"":"　下一步找 "+seq[buf.length]);
        if (buf.length === seq.length) armorDone(en);
        else paint();
      };
      box.appendChild(b);
    }
  }
  paint();
}
function armorPipes(en) {
  const glyph = ["═","║","╗","╚"];
  let rot = [2, 1];
  openModal("<h2>干扰体能量锁 · 能源弯管</h2><div class='help'>点管道旋转。两段都变成横线 <strong>═</strong> 就通电。</div><div class='pipes' id='ap'></div><p id='pstat'>还没接通</p><div class='foot'><button id='cancelM'>取消</button></div>");
  $("cancelM").onclick = closeModal;
  const box = $("ap");
  function paint() {
    box.innerHTML = rot.map((r,i)=>"<button class='pipe' data-i='"+i+"'>"+glyph[r]+"</button>").join("");
    $("pstat").textContent = rot.every(r=>r===0) ? "通路完成" : "继续旋转";
    box.querySelectorAll("button").forEach((b)=>{
      b.onclick = () => { rot[+b.dataset.i]=(rot[+b.dataset.i]+1)%4; sfx("ok"); paint(); if (rot.every(r=>r===0)) armorDone(en); };
    });
  }
  paint();
}
function armorMemory(en) {
  const h = hashId(en.id);
  const seq = [h%3, (h>>3)%3, (h>>6)%3];
  const names = ["青","橙","紫"];
  let playing = false, picked = [];
  openModal("<h2>干扰体能量锁 · 闪光记忆</h2><div class='help'>灯会按顺序闪三次。看完后，用同样的顺序点按。可以点「再看一遍」。</div><div class='mem' id='pads'></div><p id='pstat'>先看演示</p><div class='foot'><button id='replay'>再看一遍</button><button id='cancelM'>取消</button></div>");
  $("cancelM").onclick = closeModal;
  const pads = $("pads");
  pads.innerHTML = names.map((n,i)=>"<button class='lock c"+(i+1)+"' data-i='"+i+"'>"+n+"</button>").join("");
  function flash(i, on) { pads.querySelectorAll("button")[i].style.outline = on ? "3px solid #fff" : ""; }
  function demo() {
    playing = true; picked = []; $("pstat").textContent = "演示中…";
    let t = 0;
    seq.forEach((v, k) => {
      setTimeout(() => flash(v, true), 400+k*700);
      setTimeout(() => flash(v, false), 700+k*700);
      t = 700+k*700;
    });
    setTimeout(() => { playing = false; $("pstat").textContent = "按刚才的顺序点。"; }, t+200);
  }
  pads.querySelectorAll("button").forEach((b)=>{
    b.onclick = () => {
      if (playing) return;
      const v = +b.dataset.i;
      if (v !== seq[picked.length]) { picked=[]; sfx("jump"); $("pstat").textContent = "顺序错了，点「再看一遍」。"; return; }
      picked.push(v); sfx("ok");
      $("pstat").textContent = "正确 "+picked.length+" / 3";
      if (picked.length === 3) armorDone(en);
    };
  });
  $("replay").onclick = demo;
  demo();
}
function armorPairs(en) {
  const face = ["▲","●","■","▲","●","■"];
  const order = [0,1,2,3,4,5];
  const h = hashId(en.id);
  for (let i=5;i>0;i--) { const j = (h+i*3)%(i+1); const t=order[i]; order[i]=order[j]; order[j]=t; }
  let open = [], matched = [];
  openModal("<h2>干扰体能量锁 · 配对核心</h2><div class='help'>翻开两张，符号相同就锁定。三对都配上即解除护甲。</div><div class='pairs' id='pairs'></div><p id='pstat'>翻开任意一张</p><div class='foot'><button id='cancelM'>取消</button></div>");
  $("cancelM").onclick = closeModal;
  const box = $("pairs");
  function paint() {
    box.innerHTML = order.map((fi,i)=>{
      const show = matched.includes(i) || open.includes(i);
      return "<button data-i='"+i+"'>"+(show?face[fi]:"?")+"</button>";
    }).join("");
    box.querySelectorAll("button").forEach((b)=>{
      b.onclick = () => {
        const i = +b.dataset.i;
        if (matched.includes(i) || open.includes(i)) return;
        open.push(i); sfx("ok"); paint();
        if (open.length === 2) {
          const a = order[open[0]], c = order[open[1]];
          if (face[a]===face[c]) { matched.push(open[0], open[1]); open=[]; $("pstat").textContent = "配对 "+(matched.length/2)+" / 3"; if (matched.length===6) armorDone(en); paint(); }
          else { $("pstat").textContent = "不一样，再试。"; setTimeout(()=>{ open=[]; paint(); }, 450); }
        }
      };
    });
  }
  paint();
}

function zhihuLinkHtml(c) {
  if (!c.zhihu) return "";
  const kind = /\/answer\//.test(c.zhihu) ? "回答" : "文章";
  const who = c.zhihuAuthor ? " · " + c.zhihuAuthor : "";
  return "<p><a class='zhihu-link' href='"+c.zhihu+"' target='_blank' rel='noopener noreferrer'>知乎热门"+kind+who+"</a></p>";
}

function cardPhotoHtml(c, kind) {
  const cls = kind === "hero" ? "card-hero" : "card-thumb";
  return "<img class='"+cls+"' src='assets/codex/"+c.id+".jpg' alt='"+c.title+"' loading='lazy'>";
}

function openCodex() {
  const html = CARDS.map((c) => {
    const got = save.cards.includes(c.id);
    return "<article class='card "+(got?"":"locked")+"'>"+cardPhotoHtml(c,"thumb")+"<h3>"+(got?"✦ ":"▧ ")+c.title+"</h3><p>"+(got?c.text:"靠近场景中的档案终端以解锁。解锁后可阅读对应知乎热门回答。")+"</p>"+(got?zhihuLinkHtml(c):"")+"</article>";
  }).join("");
  openModal("<h2>月球科普图鉴</h2><p>档案 "+save.cards.length+"/"+CARDS.length+"　设备 "+save.solved.length+"/3　干扰体 "+save.enemies.length+"/"+totalEnemies()+"　晶体 "+save.crystals+"</p><div class='meter'><i style='width:"+(save.cards.length/CARDS.length*100)+"%'></i></div><div class='card-grid'>"+html+"</div><div class='foot'><button class='primary' id='closeM'>返回</button></div>");
  $("closeM").onclick = closeModal;
}

function openBriefing() {
  openModal(
    "<div class='brief'>" +
    "<h2>作品简介</h2>" +
    "<h3>技术细节</h3>" +
    "<p>本作是一款可离线打开的网页科考游戏：整包只有 HTML、CSS、JavaScript 和图片，不装客户端、不连服务器、不登录账号，也没有广告和内购，双击本地页面或挂到静态托管就能玩。操作是键盘 WASD 移动、空格跳跃、SHIFT 喷气、E 交互、R 发射科学射线，手机用底部虚拟键。主画面是 WebGL 第三人称 3D：碰撞、氧气、存档和谜题仍按原横板关卡结算，镜头斜后方跟随，看得见你和刘看山。手感带土狼时间、跳跃缓冲、按住可跳得更高，校准设备后才会写入二段跳与短突。角色用简单几何体贴像素图，场景由平台挤出的月壤方块搭成。背景音乐和音效全部由 Web Audio 在设备里合成。探索进度写入浏览器 localStorage。默认入口是 2D 像素主页 index.html，本页为 3D 选项。</p>" +
    "<h3>三大关卡</h3>" +
    "<p>近未来，人类在月球建起模块化「摇篮科研基地」。你是新晋科考队员，刘看山与你同行，三条航线必须按顺序校准：当前区设备未修好，下一区气闸保持锁定；已经开通的航线可以随时从航线图快速转移。第一关月面荒野是开阔的巡检带，地面裂开三处辐射坑，中间有横向移动平台，沿途有便携补氧柱、荒野检查点和巡视车残骸；你要先在月壤管路台接通管路，气闸才会放行进入基地，并解锁低重力连跳——空中再按一次空格，才能上到直径测绘桩、重力演示器、月海成像仪和更远处的环形山标尺。第二关摇篮基地走廊改在密封舱段里行进，既有上下升降台也有左右滑台，热控窗和气闸铭牌夹在辐射缝之间；把气闸均压台的舱压稳定在大约四十到六十千帕的安全区间后，观测站航线才会打开，同时解锁喷气短突，按 SHIFT 向前短促推进，用来越过裂隙，月尘里燃料金贵，因此带冷却。第三关天文观测站台架在高台与望远镜之间，悬停干扰体更多，末段还有一具更硬的主干扰体；对准月相对准仪上的上弦月后，科学射线变长，隐藏晶体会发亮，刘看山也会标出下一处目标，收齐站台上的潮汐、地轴和测距档案后，可以从气闸返回月面，开始下一轮巡检。</p>" +
    "<h3>揭秘设置</h3>" +
    "<p>揭秘分成两条线，一条是发给地球的真实月学档案，一条是关掉失控探测单元的护甲锁。沿途十八张图鉴全部对应真实常识，靠近终端按 E 收录：月面荒野讲月球直径约三千四百七十四千米、质量约为地球八十一分之一、表面重力约六分之一，以及月海其实是冷却熔岩平原、月陆是更古老的高地、环形山由撞击留下、月壤里有碎石玻璃微珠和太阳风粒子；摇篮基地讲真空里声音无法传播、白天可超过一百摄氏度而夜晚可到零下约一百七十度、潮汐力与内部冷却都会引发月震，还有月尘磨损、辐射屏蔽、氧气循环与光谱仪测距仪月震仪的工作原理；天文观测站讲潮汐锁定让地球总看见同一面、月相是阳光反射的视觉效果、地月互拉形成潮汐、背对月球的一侧也会有高潮、月球稳住地球自转轴并分担撞击，以及地月平均约三十八万四千千米、光走一趟大约一点三秒。另一条线是干扰体：它们或沿地面巡逻或在高台悬停，默认带着护甲，必须先靠近按 E，按个体揭开不同的锁——色码排列、入侵协议指令序列、管路接通、记忆翻牌或两两配对——锁解开后才能踩头或按 R 发射科学射线将其关闭；观测站校准后射线更长，主干扰体还要打多次核心。晶体散落在平台与高台上，扫描能力开启后会闪，检查点会记下你的落点，氧气不足或落入辐射坑会回到最近的安全位置，刘看山会在护甲、校准和跳台处给出简短提示。</p>" +
    "<div class='foot'><button class='primary' id='closeM'>返回</button></div></div>"
  );
  $("closeM").onclick = closeModal;
}

function openMap() {
  const cells = SCENES.map((s, i) => {
    const open = sceneUnlocked(s.id);
    const done = save.solved.includes(s.id);
    return "<button "+(open?"":"disabled ")+"data-i='"+i+"'>"+(done?"✦ ":"")+s.name+"<small>"+s.sub+(open?(done?" · 已校准":" · 可前往"):" · 未开通")+"</small></button>";
  }).join("");
  openModal("<h2>摇篮基地航线</h2><p>三条航线依次开通。月面修好管路，解锁低重力连跳；基地完成气闸均压，解锁喷气短突；观测站对准月相，射线变长、隐藏晶体会亮。也可从已开通航线快速转移。</p><div class='route'>"+cells+"</div><div class='foot'><button class='primary' id='closeM'>返回</button></div>");
  $("closeM").onclick = closeModal;
  document.querySelectorAll(".route button").forEach((b) => {
    b.onclick = () => { const i = +b.dataset.i; closeModal(); if (!running) { sceneIndex = i; scene = SCENES[i]; startGame(); } else switchScene(i, true); };
  });
}

function openSettings() {
  openModal("<h2>系统设置</h2><p>音量 <input id='volume' type='range' min='0' max='100' value='"+Math.round(save.volume*100)+"'></p><p><button type='button' class='small' id='muteBtn'>"+(save.muted?"开启声音":"静音")+"</button> <button type='button' class='small' id='briefBtn'>作品简介</button></p><p>手感复用开源平台跳跃惯例：土狼时间 / 跳跃缓冲 / 变高跳跃 / 固定步长（参考 MIT 项目 Pixel Quest Deluxe、Pootal Rift、Solstice；关卡密度与连击参考 HTML5_Platformer）。未引入其代码与素材。</p><div class='artrow'><img src='./assets/cover.jpg' alt='封面'><img src='./assets/bg-surface.png' alt='月面'><img src='./assets/bg-base.png' alt='基地'><img src='./assets/bg-observatory.png' alt='观测站'></div><p>本地离线，无联网、无登录、无广告、无内购。声音由设备内合成，不依赖外置音频文件。完整航线、图鉴与技术说明见「作品简介」。</p><div class='foot'><button type='button' id='homeBtn'>回到首页</button><button type='button' id='reset'>重置存档</button><button type='button' class='primary' id='closeM'>返回</button></div>");
  $("volume").oninput = (e) => { save.volume = +e.target.value/100; persist(); setVol(); if (!save.muted) playBgm(running ? (sceneIndex===0?"explore":"base") : "title"); };
  $("muteBtn").onclick = () => { save.muted = !save.muted; persist(); setVol(); if (!save.muted) playBgm(running ? (sceneIndex===0?"explore":"base") : "title"); openSettings(); };
  $("briefBtn").onclick = openBriefing;
  $("homeBtn").onclick = goHome;
  $("closeM").onclick = closeModal;
  $("reset").onclick = () => {
    if (confirm("确定清除全部探索记录？")) {
      const vol = save.volume, muted = save.muted;
      save = defaultSave(); save.volume = vol; save.muted = muted;
      sceneIndex = 0; scene = SCENES[0]; persist();
      if (running) { resetActors(false); buildWorld(); }
      updateHUD(); toast("记录已重置"); closeModal();
    }
  };
}

function foxSize() {
  return {w: AT.girl[2] * FOX_S, h: AT.girl[3] * FOX_S};
}
function companionHome() {
  const f = foxSize();
  const gap = 12;
  return {
    x: player.face > 0 ? player.x - f.w - gap : player.x + player.w + gap,
    y: player.y + player.h - f.h
  };
}
function hexColor(hex) {
  return new THREE.Color(hex);
}
function setColorSpace(t) {
  if (THREE.SRGBColorSpace) t.colorSpace = THREE.SRGBColorSpace;
  else if (THREE.sRGBEncoding) t.encoding = THREE.sRGBEncoding;
}
function canvasTex(id, w, h, paint) {
  if (texCache[id]) return texCache[id];
  const c = document.createElement("canvas");
  c.width = w; c.height = h;
  paint(c.getContext("2d"), w, h);
  const t = new THREE.CanvasTexture(c);
  setColorSpace(t);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.magFilter = THREE.NearestFilter;
  t.minFilter = THREE.NearestFilter;
  t.generateMipmaps = false;
  t.needsUpdate = true;
  texCache[id] = t;
  return t;
}
function tiled(tex, rx, ry) {
  const t = tex.clone();
  t.repeat.set(rx || 1, ry || 1);
  t.needsUpdate = true;
  return t;
}
function imgTex(key, rx, ry) {
  const id = key + ":" + (rx || 1) + ":" + (ry || 1);
  if (texCache[id]) return texCache[id];
  const img = imgs[key];
  if (!img) return null;
  const t = new THREE.Texture(img);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(rx || 1, ry || 1);
  t.magFilter = THREE.NearestFilter;
  t.minFilter = THREE.NearestFilter;
  t.generateMipmaps = false;
  setColorSpace(t);
  t.needsUpdate = true;
  texCache[id] = t;
  return t;
}
function moonTex() {
  return canvasTex("moon", 16, 16, (g, w, h) => {
    const pal = ["#c8c2b0", "#b3ad9b", "#9e9886", "#d4cebc", "#8c8676", "#bbb5a4"];
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      g.fillStyle = pal[(x * 13 + y * 7 + (x ^ y)) % pal.length];
      g.fillRect(x, y, 1, 1);
    }
    g.fillStyle = "#6e685c";
    [[2, 3, 4], [9, 10, 5], [12, 2, 3], [5, 11, 4]].forEach((c) => {
      g.fillRect(c[0], c[1], c[2], c[2]);
      g.fillStyle = "#5a544a";
      g.fillRect(c[0] + 1, c[1] + 1, Math.max(1, c[2] - 2), Math.max(1, c[2] - 2));
      g.fillStyle = "#6e685c";
    });
  });
}
function metalTex() {
  return canvasTex("metal", 16, 16, (g, w, h) => {
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const panel = (Math.floor(x / 4) + Math.floor(y / 4)) % 2;
      g.fillStyle = panel ? "#8aa4b0" : "#6f8794";
      g.fillRect(x, y, 1, 1);
    }
    g.fillStyle = "#4ad4e0";
    for (let i = 0; i < 4; i++) g.fillRect(i * 4 + 1, 1, 2, 1);
  });
}
function tileTex() {
  return canvasTex("tile", 8, 8, (g, w, h) => {
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      g.fillStyle = (x + y) % 2 ? "#8b879c" : "#b0acc0";
      g.fillRect(x, y, 1, 1);
    }
  });
}
function makeEarthTex() {
  return canvasTex("earth", 32, 16, (g, w, h) => {
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      g.fillStyle = y < 6 ? "#163a88" : "#0c1c4a";
      g.fillRect(x, y, 1, 1);
    }
    g.fillStyle = "#2f7a3c";
    [[4, 5, 8, 4], [12, 3, 5, 3], [18, 6, 8, 4], [26, 4, 4, 3]].forEach((r) => g.fillRect(r[0], r[1], r[2], r[3]));
    g.fillStyle = "#c8a06a";
    g.fillRect(13, 9, 5, 2);
    g.fillStyle = "#e8f0ff";
    [[5, 2, 6, 1], [16, 3, 7, 1], [22, 11, 6, 1]].forEach((r) => g.fillRect(r[0], r[1], r[2], r[3]));
  });
}
function stdMat(opts) {
  return new THREE.MeshStandardMaterial(Object.assign({
    roughness: 0.92,
    metalness: 0.04,
    flatShading: true
  }, opts));
}
function pixMat(color, extra) {
  return stdMat(Object.assign({ color: color }, extra || {}));
}
function vox(parent, unit, w, h, d, mat, x, y, z) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w * unit, h * unit, d * unit), mat);
  m.position.set(x * unit, y * unit, z * unit);
  m.castShadow = true;
  m.receiveShadow = true;
  parent.add(m);
  return m;
}
function boxMesh(w, h, d, color, y) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), stdMat({ color: color }));
  m.position.y = y || 0;
  m.castShadow = true;
  m.receiveShadow = true;
  return m;
}
function addPart(parent, geo, mat, x, y, z, rx, ry, rz) {
  const m = new THREE.Mesh(geo, mat);
  m.position.set(x || 0, y || 0, z || 0);
  if (rx) m.rotation.x = rx;
  if (ry) m.rotation.y = ry;
  if (rz) m.rotation.z = rz;
  m.castShadow = true;
  parent.add(m);
  return m;
}
function makeAstronaut() {
  const U = 0.08;
  const g = new THREE.Group();
  const suit = pixMat(0xf3f6f8);
  const shade = pixMat(0xd8dee4);
  const dark = pixMat(0x2a333c);
  const orange = pixMat(0xe8843a, { emissive: 0x4a2208, emissiveIntensity: 0.22 });
  const visor = pixMat(0xff9a3c, { emissive: 0x7a3a10, emissiveIntensity: 0.45 });
  const glass = pixMat(0xffc078, { emissive: 0x402010, emissiveIntensity: 0.2 });
  vox(g, U, 4, 12, 8, suit, 0, 18, 0);
  vox(g, U, 4.2, 2, 8.2, orange, 0.1, 14, 0);
  vox(g, U, 3.2, 2, 6, shade, 0.2, 20, 0);
  vox(g, U, 3, 8, 6, dark, -3.6, 19, 0);
  vox(g, U, 2, 3, 4, dark, -4.2, 22, 0);
  vox(g, U, 1.4, 1.4, 1.4, orange, -4.2, 24.2, 0);
  vox(g, U, 8, 8, 8, suit, 0.4, 28, 0);
  vox(g, U, 8.4, 1.2, 8.4, dark, 0.4, 24.2, 0);
  vox(g, U, 1.4, 3.4, 6, visor, 4.6, 28.2, 0);
  vox(g, U, 0.7, 2.2, 4.4, glass, 5.4, 28.2, 0);
  vox(g, U, 2, 1.2, 2, orange, -1.2, 32.4, 0);
  vox(g, U, 1.2, 1.2, 1.2, orange, -1.2, 33.4, 0);
  vox(g, U, 2.2, 2.2, 2.2, orange, 0, 23.2, 5);
  vox(g, U, 2.2, 2.2, 2.2, orange, 0, 23.2, -5);
  const armL = new THREE.Group();
  armL.position.set(0, 24 * U, 6 * U);
  vox(armL, U, 4, 12, 4, suit, 0, -6, 0);
  vox(armL, U, 4.2, 2, 4.2, orange, 0, -1.2, 0);
  vox(armL, U, 4.3, 2.2, 4.3, dark, 0.1, -11, 0);
  const armR = new THREE.Group();
  armR.position.set(0, 24 * U, -6 * U);
  vox(armR, U, 4, 12, 4, suit, 0, -6, 0);
  vox(armR, U, 4.2, 2, 4.2, orange, 0, -1.2, 0);
  vox(armR, U, 4.3, 2.2, 4.3, dark, 0.1, -11, 0);
  const legL = new THREE.Group();
  legL.position.set(0, 12 * U, 2 * U);
  vox(legL, U, 4, 12, 4, suit, 0, -6, 0);
  vox(legL, U, 4.4, 2.2, 4.4, dark, 0.2, -11, 0);
  const legR = new THREE.Group();
  legR.position.set(0, 12 * U, -2 * U);
  vox(legR, U, 4, 12, 4, suit, 0, -6, 0);
  vox(legR, U, 4.4, 2.2, 4.4, dark, 0.2, -11, 0);
  g.add(armL, armR, legL, legR);
  g.userData = { armL, armR, legL, legR };
  return g;
}
function makeFox() {
  const U = 0.075;
  const g = new THREE.Group();
  const fur = pixMat(0xfff7ef);
  const cream = pixMat(0xf0e6d6);
  const ink = pixMat(0x1a1a1a);
  const pink = pixMat(0xf0b8b0);
  const blue = pixMat(0x6aa6ff, { emissive: 0x1a3a80, emissiveIntensity: 0.25 });
  vox(g, U, 10, 6, 6, fur, 0, 7, 0);
  vox(g, U, 4, 5, 6.4, cream, -3.6, 7.4, 0);
  vox(g, U, 3, 4, 5, fur, 4.2, 7.6, 0);
  vox(g, U, 5, 5, 5, fur, 6.4, 9.2, 0);
  vox(g, U, 2, 3, 6, fur, 6.8, 8.2, 0);
  vox(g, U, 3.2, 2.4, 3.2, cream, 9.2, 7.8, 0);
  vox(g, U, 1.1, 1.1, 1.6, ink, 10.9, 7.8, 0);
  vox(g, U, 1, 1, 1, ink, 8.4, 10, 1.7);
  vox(g, U, 1, 1, 1, ink, 8.4, 10, -1.7);
  vox(g, U, 1.6, 2.2, 2, fur, 5.4, 12.4, 2.1);
  vox(g, U, 1.2, 1.6, 1.4, fur, 5.4, 14, 2.1);
  vox(g, U, 0.7, 1.2, 0.7, pink, 5.8, 12.6, 2.1);
  vox(g, U, 1.6, 2.2, 2, fur, 5.4, 12.4, -2.1);
  vox(g, U, 1.2, 1.6, 1.4, fur, 5.4, 14, -2.1);
  vox(g, U, 0.7, 1.2, 0.7, pink, 5.8, 12.6, -2.1);
  vox(g, U, 1.4, 1.4, 2.2, blue, 3.4, 8.6, 0);
  const mkLeg = (x, z) => {
    const lg = new THREE.Group();
    lg.position.set(x * U, 4.2 * U, z * U);
    vox(lg, U, 2, 4.2, 2, fur, 0, -2.1, 0);
    vox(lg, U, 2.3, 1, 2.3, cream, 0.15, -4.1, 0);
    return lg;
  };
  const legFL = mkLeg(3.2, 2);
  const legFR = mkLeg(3.2, -2);
  const legBL = mkLeg(-3.2, 2);
  const legBR = mkLeg(-3.2, -2);
  const tail = new THREE.Group();
  tail.position.set(-5.4 * U, 8.2 * U, 0);
  vox(tail, U, 4, 3, 3, fur, -2, 0.4, 0);
  vox(tail, U, 4.2, 3.6, 3.6, cream, -5.6, 1.2, 0);
  vox(tail, U, 3.4, 3.2, 3.2, fur, -8.8, 1.8, 0);
  vox(tail, U, 2.4, 2.2, 2.2, cream, -11.2, 2.1, 0);
  g.add(legFL, legFR, legBL, legBR, tail);
  g.userData = { tail, legFL, legFR, legBL, legBR };
  return g;
}
function clearGroup(g) {
  if (!g) return;
  g.traverse((o) => {
    if (o.geometry) o.geometry.dispose();
    if (o.material) {
      if (Array.isArray(o.material)) o.material.forEach((m) => m.dispose());
      else o.material.dispose();
    }
  });
  while (g.children.length) g.remove(g.children[0]);
}
function platColor() {
  return sceneIndex === 0 ? 0xc2beaf : sceneIndex === 1 ? 0x8aa4b2 : 0x9a96ae;
}
function platMap(w, d) {
  const src = sceneIndex === 0 ? moonTex() : sceneIndex === 1 ? metalTex() : tileTex();
  return tiled(src, Math.max(1, w / 2.2), Math.max(1, d / 1.6));
}
function makePlatform(p) {
  const w = wx(p[2]), h = Math.max(wy(p[1]) - wy(p[1] + p[3]), 0.2), d = DEPTH;
  const g = new THREE.Group();
  const body = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), stdMat({
    color: platColor(),
    map: platMap(w, d),
    roughness: sceneIndex === 0 ? 0.96 : 0.55,
    metalness: sceneIndex === 0 ? 0.02 : 0.28
  }));
  body.receiveShadow = true;
  body.castShadow = true;
  const top = new THREE.Mesh(new THREE.BoxGeometry(w + 0.05, 0.05, d + 0.05), stdMat({
    color: sceneIndex === 0 ? 0xddd8c8 : sceneIndex === 1 ? 0xb8c8d2 : 0xb4b0c4,
    map: tiled(sceneIndex === 0 ? moonTex() : sceneIndex === 1 ? metalTex() : tileTex(), Math.max(1, w / 1.8), 1.4),
    roughness: 0.78,
    metalness: sceneIndex === 0 ? 0.04 : 0.22
  }));
  top.position.y = h / 2 + 0.025;
  top.receiveShadow = true;
  const lip = new THREE.Mesh(new THREE.BoxGeometry(w + 0.02, 0.07, 0.08), stdMat({
    color: sceneIndex === 0 ? 0x8a8678 : scene.accent,
    roughness: 0.5,
    metalness: 0.2
  }));
  lip.position.set(0, h / 2 + 0.01, d / 2 + 0.02);
  g.add(body, top, lip);
  if (p[2] > 180) {
    const count = p[2] > 600 ? 5 : 3;
    for (let i = 0; i < count; i++) {
      const crater = new THREE.Mesh(
        new THREE.CylinderGeometry(0.14 + (i % 3) * 0.06, 0.2 + (i % 3) * 0.07, 0.035, 12),
        stdMat({ color: 0x8f8a7c, roughness: 1 })
      );
      crater.position.set((i - (count - 1) / 2) * Math.min(w * 0.16, 1.4), h / 2 + 0.045, (i % 2 ? 0.38 : -0.32));
      g.add(crater);
    }
  }
  if (p[3] > 40) {
    const face = new THREE.Mesh(new THREE.BoxGeometry(w * 0.98, h * 0.7, 0.04), stdMat({
      color: 0x7a766a,
      map: tiled(moonTex(), Math.max(1, w / 2), 2),
      roughness: 1
    }));
    face.position.set(0, -h * 0.08, d / 2 + 0.03);
    g.add(face);
  }
  g.position.set(wx(p[0] + p[2] / 2), (wy(p[1]) + wy(p[1] + p[3])) / 2, 0);
  return g;
}
function makeNode(n) {
  const g = new THREE.Group();
  const accent = n.type === "exit" ? 0xf4ca78 : n.type === "puzzle" ? 0x6fe8df : n.type === "card" ? 0x8affd7 : n.type === "oxygen" ? 0x35e7a1 : 0x79bce0;
  if (n.type === "oxygen") {
    addPart(g, new THREE.CylinderGeometry(0.2, 0.22, 1.05, 12), stdMat({ color: 0xd4ece8, metalness: 0.42, roughness: 0.28 }), 0, 0.55, 0);
    addPart(g, new THREE.TorusGeometry(0.21, 0.03, 8, 14), stdMat({ color: 0x4a7e93, metalness: 0.5 }), 0, 0.28, 0, Math.PI / 2);
    addPart(g, new THREE.TorusGeometry(0.21, 0.03, 8, 14), stdMat({ color: 0x4a7e93, metalness: 0.5 }), 0, 0.82, 0, Math.PI / 2);
    addPart(g, new THREE.CylinderGeometry(0.22, 0.22, 0.09, 12), stdMat({ color: accent, emissive: accent, emissiveIntensity: 0.7 }), 0, 1.1, 0);
    addPart(g, new THREE.CylinderGeometry(0.035, 0.035, 0.36, 8), stdMat({ color: 0x4a7e93, metalness: 0.4 }), 0.18, 0.78, 0);
    addPart(g, new THREE.SphereGeometry(0.05, 8, 8), stdMat({ color: accent, emissive: accent, emissiveIntensity: 0.8 }), 0.18, 0.98, 0);
  } else if (n.type === "exit") {
    addPart(g, new THREE.BoxGeometry(0.18, 2.05, 1.35), stdMat({ color: 0x2a4556, metalness: 0.38, roughness: 0.4 }), -0.48, 1.02, 0);
    addPart(g, new THREE.BoxGeometry(0.18, 2.05, 1.35), stdMat({ color: 0x2a4556, metalness: 0.38, roughness: 0.4 }), 0.48, 1.02, 0);
    addPart(g, new THREE.BoxGeometry(1.15, 0.16, 1.35), stdMat({ color: accent, emissive: accent, emissiveIntensity: 0.45 }), 0, 2.0, 0);
    addPart(g, new THREE.BoxGeometry(0.78, 1.7, 0.06), stdMat({ color: 0x081018, emissive: 0x123044, emissiveIntensity: 0.55 }), 0, 0.95, 0);
    addPart(g, new THREE.BoxGeometry(0.12, 1.5, 0.08), stdMat({ color: accent, emissive: accent, emissiveIntensity: 0.6 }), -0.28, 0.95, 0.04);
    addPart(g, new THREE.BoxGeometry(0.12, 1.5, 0.08), stdMat({ color: accent, emissive: accent, emissiveIntensity: 0.6 }), 0.28, 0.95, 0.04);
  } else if (n.type === "checkpoint") {
    addPart(g, new THREE.CylinderGeometry(0.055, 0.07, 1.35, 10), stdMat({ color: 0x8aa8ad, metalness: 0.48 }), 0, 0.68, 0);
    addPart(g, new THREE.BoxGeometry(0.42, 0.26, 0.05), stdMat({ color: accent, emissive: accent, emissiveIntensity: 0.7 }), 0.2, 1.22, 0);
    addPart(g, new THREE.BoxGeometry(0.18, 0.04, 0.04), stdMat({ color: 0xffffff, emissive: 0xffffff, emissiveIntensity: 0.4 }), 0.2, 1.22, 0.03);
  } else {
    addPart(g, new THREE.BoxGeometry(0.62, 0.95, 0.4), stdMat({ color: 0x1b3340, metalness: 0.32, roughness: 0.4 }), 0, 0.5, 0);
    addPart(g, new THREE.BoxGeometry(0.48, 0.32, 0.05), stdMat({ color: accent, emissive: accent, emissiveIntensity: 0.75 }), 0.02, 0.68, 0.22);
    addPart(g, new THREE.BoxGeometry(0.7, 0.1, 0.46), stdMat({ color: 0x0d202c }), 0, 0.08, 0);
    addPart(g, new THREE.BoxGeometry(0.1, 0.08, 0.08), orangeJoint(), -0.2, 0.38, 0.22);
    addPart(g, new THREE.BoxGeometry(0.1, 0.08, 0.08), orangeJoint(), 0.2, 0.38, 0.22);
  }
  const glow = new THREE.PointLight(accent, 0.7, 5.2);
  glow.position.set(0, 0.9, 0.35);
  g.add(glow);
  g.position.set(wx(n.x), wy(n.y), 0.15);
  return g;
}
function orangeJoint() {
  return stdMat({ color: 0xe8843a, emissive: 0x4a2208, emissiveIntensity: 0.25, metalness: 0.3 });
}
function makeCrystal() {
  const g = new THREE.Group();
  const U = 0.08;
  const mat = pixMat(0x7de8ff, { emissive: 0x2ad0ff, emissiveIntensity: 0.7, transparent: true, opacity: 0.92 });
  vox(g, U, 2, 4, 2, mat, 0, 3, 0);
  vox(g, U, 1.4, 3, 1.4, mat, 1.4, 4, 0.4);
  vox(g, U, 1, 2.2, 1, mat, -1.2, 3.6, -0.5);
  return g;
}
function makeDrone(kind) {
  const g = new THREE.Group();
  const sc = kind === "boss" ? 1.45 : 1;
  const U = 0.08 * sc;
  const body = vox(g, U, 5, 5, 5, pixMat(0x2a3540), 0, 0, 0);
  const eye = vox(g, U, 2, 2, 2, pixMat(0xe8843a, { emissive: 0xff6a1a, emissiveIntensity: 0.85 }), 3, 0.4, 1.2);
  const shell = vox(g, U, 8, 1.2, 8, pixMat(0xe8843a, { emissive: 0xe8843a, emissiveIntensity: 0.4 }), 0, 0.2, 0);
  vox(g, U, 1.2, 1, 7, pixMat(0x8aa8ad), 0, 0.2, 0);
  vox(g, U, 7, 1, 1.2, pixMat(0x8aa8ad), 0, 0.2, 0);
  g.userData = { body, eye, shell };
  return g;
}
function makeDecor(d) {
  const g = new THREE.Group();
  if (d.t === "rover") {
    addPart(g, new THREE.BoxGeometry(1.25, 0.24, 0.62), stdMat({ color: 0x6d767c, metalness: 0.45, roughness: 0.4 }), 0, 0.32, 0);
    addPart(g, new THREE.BoxGeometry(0.4, 0.2, 0.42), stdMat({ color: 0x2a3338, metalness: 0.3 }), 0.3, 0.48, 0);
    addPart(g, new THREE.BoxGeometry(0.16, 0.1, 0.2), stdMat({ color: 0xe8843a, emissive: 0x4a2208, emissiveIntensity: 0.3 }), 0.48, 0.4, 0);
    [[0.42, 0.32], [-0.42, 0.32], [0.42, -0.32], [-0.42, -0.32]].forEach((p) => {
      addPart(g, new THREE.BoxGeometry(0.22, 0.22, 0.12), pixMat(0x1a1a1a), p[0], 0.14, p[1]);
    });
    addPart(g, new THREE.CylinderGeometry(0.02, 0.02, 0.52, 6), stdMat({ color: 0x8aa8ad }), 0.08, 0.68, 0);
    addPart(g, new THREE.BoxGeometry(0.12, 0.04, 0.08), stdMat({ color: 0x8aa8ad }), 0.08, 0.94, 0);
  } else if (d.t === "dome") {
    addPart(g, new THREE.SphereGeometry(1.65, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2), stdMat({ color: 0xd5e4ea, transparent: true, opacity: 0.42, roughness: 0.15, metalness: 0.22 }), 0, 0, 0);
    addPart(g, new THREE.CylinderGeometry(1.7, 1.7, 0.1, 20), stdMat({ color: 0xe8843a, emissive: 0x5a2a10, emissiveIntensity: 0.35 }), 0, 0.04, 0);
    addPart(g, new THREE.CylinderGeometry(0.06, 0.06, 0.7, 8), stdMat({ color: 0xcfd8dc }), 0, 1.55, 0);
    addPart(g, new THREE.SphereGeometry(0.08, 8, 8), stdMat({ color: 0xf4ca78, emissive: 0xf4ca78, emissiveIntensity: 0.6 }), 0, 1.92, 0);
  } else if (d.t === "tank") {
    addPart(g, new THREE.CylinderGeometry(0.34, 0.34, 1.2, 12), stdMat({ color: 0x8fe8df, metalness: 0.45, roughness: 0.3 }), 0, 0.6, 0);
    addPart(g, new THREE.TorusGeometry(0.34, 0.03, 6, 12), stdMat({ color: 0x4a7e93 }), 0, 0.3, 0, Math.PI / 2);
    addPart(g, new THREE.TorusGeometry(0.34, 0.03, 6, 12), stdMat({ color: 0x4a7e93 }), 0, 0.9, 0, Math.PI / 2);
  } else if (d.t === "door") {
    addPart(g, new THREE.BoxGeometry(0.2, 2.2, 1.4), stdMat({ color: scene.accent, metalness: 0.35 }), 0, 1.1, 0);
    addPart(g, new THREE.BoxGeometry(0.08, 1.8, 0.95), stdMat({ color: 0x0c1a24, emissive: 0x102030, emissiveIntensity: 0.3 }), 0.1, 1.05, 0);
  } else if (d.t === "console") {
    addPart(g, new THREE.BoxGeometry(0.78, 0.78, 0.5), stdMat({ color: 0x17606b, metalness: 0.25 }), 0, 0.4, 0);
    addPart(g, new THREE.BoxGeometry(0.55, 0.24, 0.05), stdMat({ color: 0x6fe8df, emissive: 0x6fe8df, emissiveIntensity: 0.6 }), 0.02, 0.58, 0.26);
  } else if (d.t === "scope") {
    addPart(g, new THREE.CylinderGeometry(0.14, 0.18, 1.9, 10), stdMat({ color: 0x4a5578, metalness: 0.4 }), 0, 0.95, 0);
    addPart(g, new THREE.CylinderGeometry(0.3, 0.36, 0.85, 12), stdMat({ color: 0x8b9ad0, metalness: 0.3 }), 0.42, 1.42, 0, 0, 0, Math.PI / 2);
    addPart(g, new THREE.CylinderGeometry(0.38, 0.38, 0.08, 12), stdMat({ color: 0x1a1a28 }), 0.86, 1.42, 0, 0, 0, Math.PI / 2);
  } else {
    addPart(g, new THREE.BoxGeometry(0.42, 0.36, 0.4), pixMat(0x9aa39a), 0, 0.2, 0);
    addPart(g, new THREE.BoxGeometry(0.24, 0.2, 0.22), pixMat(0x7d8278), 0.2, 0.12, 0.12);
  }
  g.position.set(wx(d.x), wy(d.y), 0.85);
  return g;
}
function seeded(n) {
  const x = Math.sin(n * 127.1 + sceneIndex * 19.7) * 43758.5453;
  return x - Math.floor(x);
}
function addSceneDressing(root) {
  const starPos = [];
  const nStars = sceneIndex === 2 ? 1100 : 800;
  for (let i = 0; i < nStars; i++) {
    starPos.push((Math.random() - 0.15) * 220, 4 + Math.random() * 58, -16 - Math.random() * 80);
  }
  const starsGeo = new THREE.BufferGeometry();
  starsGeo.setAttribute("position", new THREE.Float32BufferAttribute(starPos, 3));
  root.add(new THREE.Points(starsGeo, new THREE.PointsMaterial({ color: 0xffffff, size: sceneIndex === 2 ? 0.11 : 0.08, sizeAttenuation: true })));

  const earth = new THREE.Mesh(new THREE.SphereGeometry(3.8, 14, 10), stdMat({
    map: makeEarthTex(), roughness: 0.48, metalness: 0.04, emissive: 0x102040, emissiveIntensity: 0.18
  }));
  earth.position.set(-10, 17, -38);
  const atmo = new THREE.Mesh(new THREE.SphereGeometry(4.05, 32, 24), stdMat({
    color: 0x7ec8ff, transparent: true, opacity: 0.16, roughness: 0.2, emissive: 0x1a4a80, emissiveIntensity: 0.2
  }));
  atmo.position.copy(earth.position);
  const sunDisc = new THREE.Mesh(new THREE.SphereGeometry(0.9, 16, 16), new THREE.MeshBasicMaterial({ color: 0xfff4c8 }));
  sunDisc.position.set(28, 22, -30);
  root.add(earth, atmo, sunDisc);

  const bgKey = sceneIndex === 0 ? "surface" : sceneIndex === 1 ? "base" : "obs";
  const bgMap = imgTex(bgKey, 1, 1);
  if (bgMap) {
    const bg = new THREE.Mesh(new THREE.PlaneGeometry(56, 20), new THREE.MeshBasicMaterial({ map: bgMap, transparent: true, opacity: sceneIndex === 1 ? 0.55 : 0.38, depthWrite: false }));
    bg.position.set(wx(scene.width * 0.32), 8.8, -18);
    root.add(bg);
  }

  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(wx(scene.width) + 20, 36),
    stdMat({
      color: sceneIndex === 0 ? 0xaaa698 : sceneIndex === 1 ? 0x6d8290 : 0x86829a,
      map: tiled(sceneIndex === 0 ? moonTex() : sceneIndex === 1 ? metalTex() : tileTex(), 28, 6),
      roughness: 0.95
    })
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.set(wx(scene.width / 2), -0.42, -6);
  floor.receiveShadow = true;
  root.add(floor);

  if (sceneIndex !== 1) {
    for (let i = 0; i < 14; i++) {
      const bw = 4.8 + (i % 3) * 1.2, bh = 1.6 + (i % 2) * 0.8, bd = 3.2;
      const ridge = new THREE.Mesh(new THREE.BoxGeometry(bw, bh, bd), stdMat({ color: 0x7a766c, map: tiled(moonTex(), 3, 2), roughness: 1 }));
      ridge.position.set(wx(140 + i * 300), bh / 2 - 0.4, -11 - (i % 3) * 1.4);
      root.add(ridge);
    }
    for (let i = 0; i < 22; i++) {
      const r = 0.22 + seeded(i) * 0.3;
      const rock = new THREE.Mesh(new THREE.BoxGeometry(r * 2, r * 2, r * 2), stdMat({ color: 0x8d897c, roughness: 1 }));
      rock.position.set(wx(80 + i * 190 + seeded(i + 3) * 80), r, 1.1 + seeded(i + 9) * 1.4);
      rock.castShadow = true;
      root.add(rock);
    }
  } else {
    const wallMat = stdMat({ color: 0x8ea6b2, map: tiled(metalTex(), 18, 4), metalness: 0.28, roughness: 0.48 });
    const wall = new THREE.Mesh(new THREE.BoxGeometry(wx(scene.width) + 4, 8.5, 0.35), wallMat);
    wall.position.set(wx(scene.width / 2), 3.8, -2.35);
    wall.receiveShadow = true;
    root.add(wall);
    for (let i = 0; i < 8; i++) {
      const win = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.15, 0.08), stdMat({ color: 0x081018, emissive: 0x123044, emissiveIntensity: 0.45 }));
      win.position.set(wx(220 + i * 460), 4.4, -2.12);
      const frame = new THREE.Mesh(new THREE.BoxGeometry(1.78, 1.32, 0.1), stdMat({ color: 0xcfd8dc, metalness: 0.4 }));
      frame.position.copy(win.position);
      frame.position.z -= 0.04;
      const strip = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.06, 0.08), stdMat({ color: 0x6fe8df, emissive: 0x6fe8df, emissiveIntensity: 0.7 }));
      strip.position.set(wx(220 + i * 460), 7.6, -2.1);
      root.add(frame, win, strip);
    }
  }
  if (sceneIndex === 2) {
    const aurora = canvasTex("aurora", 256, 128, (ctx, w, h) => {
      const gr = ctx.createLinearGradient(0, 0, 0, h);
      gr.addColorStop(0, "rgba(80,220,255,0)");
      gr.addColorStop(0.45, "rgba(80,220,255,0.45)");
      gr.addColorStop(1, "rgba(80,220,255,0)");
      ctx.fillStyle = gr;
      ctx.fillRect(0, 0, w, h);
    });
    const ap = new THREE.Mesh(new THREE.PlaneGeometry(70, 14), new THREE.MeshBasicMaterial({ map: aurora, transparent: true, opacity: 0.42, depthWrite: false, side: THREE.DoubleSide }));
    ap.position.set(wx(scene.width * 0.45), 14, -28);
    ap.rotation.x = -0.18;
    root.add(ap);
  }
}
function buildWorld() {
  if (!scene3) return;
  if (worldRoot) {
    scene3.remove(worldRoot);
    clearGroup(worldRoot);
  }
  particle3 = [];
  worldRoot = new THREE.Group();
  platMeshes = []; moverMeshes = []; nodeMeshes = []; crystalMeshes = []; enemyMeshes = [];
  scene3.background = hexColor(scene.sky);
  scene3.fog = new THREE.FogExp2(scene.sky, sceneIndex === 1 ? 0.018 : 0.01);
  const hemi = new THREE.HemisphereLight(0xe8f4ff, 0x6a5a40, 1.12);
  sunLight = new THREE.DirectionalLight(0xfff3d6, 1.7);
  sunLight.position.set(14, 24, 18);
  sunLight.castShadow = true;
  sunLight.shadow.mapSize.set(1536, 1536);
  sunLight.shadow.bias = -0.0006;
  sunLight.shadow.camera.near = 2;
  sunLight.shadow.camera.far = 70;
  sunLight.shadow.camera.left = -22;
  sunLight.shadow.camera.right = 22;
  sunLight.shadow.camera.top = 16;
  sunLight.shadow.camera.bottom = -10;
  sunTarget = new THREE.Object3D();
  sunLight.target = sunTarget;
  const fill = new THREE.DirectionalLight(0x88aacc, 0.42);
  fill.position.set(-12, 10, 8);
  const rim = new THREE.DirectionalLight(0xffc080, 0.22);
  rim.position.set(-8, 6, -10);
  worldRoot.add(new THREE.AmbientLight(0xffffff, 0.26), hemi, sunLight, sunTarget, fill, rim);
  addSceneDressing(worldRoot);

  scene.platforms.forEach((p) => {
    const mesh = makePlatform(p);
    worldRoot.add(mesh);
    platMeshes.push(mesh);
  });
  (scene.movers || []).forEach(() => {
    const mesh = new THREE.Group();
    const slab = boxMesh(wx(150), 0.16, DEPTH, 0x3a5a6a);
    const rimM = boxMesh(wx(150), 0.045, DEPTH + 0.1, 0x8affd7);
    rimM.position.y = 0.11;
    mesh.add(slab, rimM);
    worldRoot.add(mesh);
    moverMeshes.push(mesh);
  });
  (scene.hazards || []).forEach((h) => {
    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(wx(h.w), 0.3, DEPTH + 0.4),
      stdMat({ color: 0xe8843a, transparent: true, opacity: 0.4, emissive: 0xe8843a, emissiveIntensity: 0.42 })
    );
    mesh.position.set(wx(h.x + h.w / 2), wy(h.y) + 0.08, 0);
    const haze = new THREE.PointLight(0xe8843a, 0.75, 5.5);
    haze.position.copy(mesh.position);
    haze.position.y += 0.45;
    worldRoot.add(mesh, haze);
  });
  scene.nodes.forEach((n) => {
    const mesh = makeNode(n);
    worldRoot.add(mesh);
    nodeMeshes.push(mesh);
  });
  scene.crystals.forEach((c) => {
    const mesh = makeCrystal();
    mesh.position.set(wx(c[0]), wy(c[1]), 0);
    worldRoot.add(mesh);
    crystalMeshes.push({ mesh, id: scene.id + ":c" + c[0] });
  });
  enemies.forEach((e) => {
    const mesh = makeDrone(e.kind);
    worldRoot.add(mesh);
    enemyMeshes.push(mesh);
  });
  (scene.decor || []).forEach((d) => worldRoot.add(makeDecor(d)));

  playerRig = makeAstronaut();
  foxRig = makeFox();
  beamMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.012, 1, 10), new THREE.MeshBasicMaterial({ color: 0x8affd7, transparent: true, opacity: 0.88 }));
  beamMesh.rotation.z = Math.PI / 2;
  beamMesh.visible = false;
  worldRoot.add(playerRig, foxRig, beamMesh);
  scene3.add(worldRoot);
  syncActors();
}
function syncActors() {
  if (!playerRig || !player) return;
  const px = wx(player.x + player.w / 2);
  const py = wy(player.y + player.h);
  playerRig.position.set(px, py, 0);
  playerRig.rotation.y = player.face > 0 ? -0.55 : Math.PI + 0.55;
  playerRig.scale.setScalar(player.dash > 0 ? 0.96 : 1);
  const swing = player.onGround ? Math.sin(player.walk * 2.5) * 0.7 : 0.2;
  if (playerRig.userData.legL) {
    playerRig.userData.legL.rotation.z = swing;
    playerRig.userData.legR.rotation.z = -swing;
    playerRig.userData.armL.rotation.z = -swing;
    playerRig.userData.armR.rotation.z = swing;
  }
  if (companion && foxRig) {
    const fh = foxSize();
    foxRig.position.set(wx(companion.x + fh.w / 2), wy(companion.y + fh.h), 0.4);
    foxRig.rotation.y = companion.face > 0 ? -0.45 : Math.PI + 0.45;
    const trot = Math.sin(now() / 140) * 0.55;
    if (foxRig.userData.legFL) {
      foxRig.userData.legFL.rotation.z = trot;
      foxRig.userData.legBR.rotation.z = trot;
      foxRig.userData.legFR.rotation.z = -trot;
      foxRig.userData.legBL.rotation.z = -trot;
    }
    if (foxRig.userData.tail) {
      foxRig.userData.tail.rotation.y = Math.sin(now() / 180) * 0.4;
      foxRig.userData.tail.rotation.z = 0.2 + Math.sin(now() / 220) * 0.12;
    }
  }
  if (sunLight && sunTarget) {
    sunTarget.position.set(px, py, 0);
    sunLight.position.set(px + 12, py + 20, 15);
    sunLight.target.updateMatrixWorld();
  }
  for (let i = particle3.length - 1; i >= 0; i--) {
    const m = particle3[i];
    m.position.x += m.userData.vx * 0.016;
    m.position.y += m.userData.vy * 0.016;
    m.userData.vy -= 0.04;
    m.userData.life -= 0.016;
    if (m.material) m.material.opacity = Math.max(0, m.userData.life * 2);
    if (m.userData.life <= 0) {
      if (worldRoot) worldRoot.remove(m);
      particle3.splice(i, 1);
    }
  }
  movers.forEach((m, i) => {
    if (!moverMeshes[i]) return;
    moverMeshes[i].position.set(wx(m.x + m.w / 2), (wy(m.y) + wy(m.y + m.h)) / 2, 0);
    moverMeshes[i].scale.set(wx(m.w) / wx(150), 1, 1);
  });
  crystalMeshes.forEach((c, i) => {
    const gone = save.collected.includes(c.id);
    c.mesh.visible = !gone;
    if (!gone) {
      c.mesh.rotation.y += 0.04;
      c.mesh.position.y = wy(scene.crystals[i][1]) + Math.sin(now() / 280 + i) * 0.08;
      if (save.abilities.scan) {
        const dx = wx(player.x + 20) - c.mesh.position.x;
        c.mesh.position.x += dx * 0.012;
      }
    }
  });
  enemies.forEach((e, i) => {
    const mesh = enemyMeshes[i];
    if (!mesh) return;
    mesh.position.set(wx(e.x + e.w / 2), wy(e.y) + 0.28, 0);
    mesh.rotation.y += 0.02;
    const col = e.dead ? 0x44555c : e.armor ? 0xe8843a : 0x8affd7;
    if (mesh.userData.shell) {
      mesh.userData.shell.visible = !e.dead && e.armor;
      mesh.userData.shell.material.color.setHex(col);
      mesh.userData.shell.material.emissive.setHex(col);
    }
    if (mesh.userData.eye) {
      mesh.userData.eye.material.color.setHex(e.dead ? 0x33444c : col);
      mesh.userData.eye.material.emissive.setHex(e.dead ? 0x000000 : col);
    }
  });
  if (beam.on) {
    const len = (save.abilities.scan ? 240 : 160) * S3;
    beamMesh.visible = true;
    beamMesh.scale.x = len;
    beamMesh.position.set(px + player.face * len / 2, py + 0.85, 0.12);
  } else if (beamMesh) beamMesh.visible = false;

  const tx = px - player.face * 5.6;
  const ty = py + 3.2;
  const tz = 6.8;
  camera3.position.x += (tx - camera3.position.x) * 0.1;
  camera3.position.y += (ty - camera3.position.y) * 0.12;
  camera3.position.z += (tz - camera3.position.z) * 0.1;
  if (shake) {
    camera3.position.x += (Math.random() - 0.5) * shake * 0.02;
    camera3.position.y += (Math.random() - 0.5) * shake * 0.02;
  }
  camera3.lookAt(px + player.face * 2.4, py + 1.15, 0);
}
function resizeRenderer() {
  if (!renderer || !cvs) return;
  const stage = document.getElementById("stage") || cvs.parentElement;
  const w = Math.max(320, stage.clientWidth || window.innerWidth);
  const h = Math.max(180, stage.clientHeight || window.innerHeight);
  renderer.setSize(w, h, false);
  camera3.aspect = w / h;
  camera3.updateProjectionMatrix();
}
function initThree() {
  renderer = new THREE.WebGLRenderer({ canvas: cvs, antialias: false, alpha: false, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(1.35, window.devicePixelRatio || 1));
  renderer.setClearColor(0x05080e, 1);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.12;
  if (THREE.SRGBColorSpace) renderer.outputColorSpace = THREE.SRGBColorSpace;
  scene3 = new THREE.Scene();
  camera3 = new THREE.PerspectiveCamera(48, 16 / 9, 0.1, 220);
  camera3.position.set(4, 6, 10);
  window.addEventListener("resize", resizeRenderer);
  resizeRenderer();
}
function spr() { /* 3D 不再使用 2D 精灵 */ }
function draw() {
  if (!renderer) return;
  syncActors();
  renderer.render(scene3, camera3);
}

function platBoxes() {
  const list = scene.platforms.map((p) => ({x:p[0], y:p[1], w:p[2], h:p[3], vx:0, vy:0}));
  movers.forEach((m) => list.push({x:m.x, y:m.y, w:m.w, h:m.h, vx:m.dx, vy:m.dy}));
  return list;
}

function disableEnemy(e) {
  if (e.dead) return;
  e.hp -= 1;
  burst(e.x+10, e.y, "#8affd7", 8);
  if (e.hp > 0) { toast("核心还在线 "+e.hp); shakeCam(5); return; }
  e.dead = true;
  if (!save.enemies.includes(e.id)) {
    save.enemies.push(e.id);
    const g = hitCombo(e.kind==="boss"?900:400);
    persist(); updateHUD();
    pop(e.x, e.y, "+"+g); toast((e.kind==="boss"?"主干扰体":"干扰体")+"已关闭  +"+g);
    speak("刘看山", e.kind==="boss"?"主单元关闭。观测站可以安静下来了。":"关闭完成。它只是失控探测单元。");
  }
}

function shoot() {
  beam.on = true; beam.t = 0.18; sfx("beam");
  const reach = save.abilities.scan ? 250 : 170;
  for (const e of enemies) {
    if (e.dead) continue;
    const along = (e.x - player.x) * player.face;
    if (along > 0 && along < reach && Math.abs(e.y - player.y) < 70) {
      if (e.armor) { speak("刘看山", "护甲还在。先按 E。"); return; }
      disableEnemy(e); return;
    }
  }
}

function wantJump() {
  return keys.has("ArrowUp") || keys.has("w") || keys.has("W") || keys.has(" ") || keys.has("Space");
}
function wantDash() {
  return keys.has("Shift") || keys.has("ShiftLeft") || keys.has("ShiftRight") || keys.has("l") || keys.has("L");
}

function respawn(msg) {
  if (player && player.respawnLock > 0) return;
  const sp = (save.spawn && save.spawn.scene === scene.id) ? save.spawn : {x:scene.spawn[0]};
  const placed = standOnFloor(sp.x);
  player.x = placed.x;
  player.y = placed.y;
  player.vx = 0;
  player.vy = 0;
  player.onGround = true;
  player.jumps = 0;
  player.dash = 0;
  player.coyote = PHYS.coyote;
  player.buffer = 0;
  player.airT = 0;
  player.inv = 1.1;
  player.respawnLock = 0.45;
  jumpHeld = false;
  save.oxygen = Math.max(save.oxygen, 40); persist();
  toast(msg); burst(player.x, player.y, "#6fe8df", 12);
}

function updateMovers(dt) {
  for (const m of movers) {
    const prevx = m.x, prevy = m.y;
    m.t += dt;
    if (m.axis === "x") m.x = m.min + (Math.sin(m.t * (m.spd/40)) * 0.5 + 0.5) * (m.max - m.min);
    else m.y = m.min + (Math.sin(m.t * (m.spd/40)) * 0.5 + 0.5) * (m.max - m.min);
    m.dx = m.x - prevx; m.dy = m.y - prevy;
  }
}

function move(dt) {
  updateMovers(dt);
  const left = keys.has("ArrowLeft") || keys.has("a") || keys.has("A");
  const right = keys.has("ArrowRight") || keys.has("d") || keys.has("D");
  const input = (right?1:0) - (left?1:0);
  if (player.dash <= 0) {
    if (input) { player.vx += input * PHYS.acc * dt; player.face = input; player.walk += dt * 10; }
    else {
      const dec = Math.sign(player.vx) * PHYS.fric * dt;
      if (Math.abs(dec) > Math.abs(player.vx)) player.vx = 0; else player.vx -= dec;
    }
    player.vx = clamp(player.vx, -PHYS.max, PHYS.max);
  }
  if (wantJump()) player.buffer = PHYS.buffer;
  else {
    if (player.vy < 0 && jumpHeld && (player.airT || 0) > PHYS.cutAfter) player.vy *= PHYS.cut;
    jumpHeld = false;
  }
  player.buffer = Math.max(0, player.buffer - dt);
  if (player.onGround) { player.coyote = PHYS.coyote; player.jumps = 0; player.airT = 0; }
  else {
    player.coyote = Math.max(0, player.coyote - dt);
    player.airT = (player.airT || 0) + dt;
  }
  const canFirst = player.onGround || player.coyote > 0;
  if (player.buffer > 0 && canFirst) {
    player.vy = PHYS.jump; player.onGround = false; player.coyote = 0; player.buffer = 0; player.jumps = 1; jumpHeld = true; player.airT = 0;
    sfx("jump"); burst(player.x+20, player.y+player.h, "#cfe7ea", 6);
  } else if (player.buffer > 0 && save.abilities.djump && player.jumps === 1 && !player.onGround) {
    player.vy = PHYS.djump; player.buffer = 0; player.jumps = 2; jumpHeld = true; player.airT = 0;
    sfx("jump"); burst(player.x+20, player.y+player.h, "#8affd7", 8);
  }
  if (wantDash() && save.abilities.dash && player.dash <= 0 && player.dashCd <= 0) {
    player.dash = PHYS.dashT; player.dashCd = 0.55; player.vx = player.face * PHYS.dash; player.vy = 0;
    sfx("dash"); burst(player.x, player.y+20, "#8affd7", 10);
  }
  if (player.dash > 0) { player.dash -= dt; player.vy = 0; }
  else player.vy += PHYS.grav * dt;
  player.dashCd = Math.max(0, player.dashCd - dt);
  player.inv = Math.max(0, player.inv - dt);

  let nx = clamp(player.x + player.vx * dt, 0, scene.width - player.w);
  let ny = player.y + player.vy * dt;
  const wasGround = player.onGround;
  player.onGround = false;
  let ride = null;
  const boxes = platBoxes();
  for (const p of boxes) {
    if (player.y + player.h <= p.y + 3 || player.y >= p.y + p.h - 1) continue;
    if (nx + player.w <= p.x || nx >= p.x + p.w) continue;
    if (player.x + player.w <= p.x + 1) nx = p.x - player.w;
    else if (player.x >= p.x + p.w - 1) nx = p.x + p.w;
    else nx = (nx + player.w / 2 < p.x + p.w / 2) ? p.x - player.w : p.x + p.w;
    player.vx = 0;
  }
  nx = clamp(nx, 0, scene.width - player.w);
  for (const p of boxes) {
    if (nx + player.w <= p.x || nx >= p.x + p.w) continue;
    if (player.y + player.h <= p.y + 14 && ny + player.h >= p.y && player.vy >= -20) {
      ny = p.y - player.h; player.vy = 0; player.onGround = true; ride = p;
    } else if (player.vy < 0 && player.y >= p.y + p.h - 6 && ny < p.y + p.h) {
      ny = p.y + p.h; player.vy = 0;
    }
  }
  if (ride) { nx = clamp(nx + (ride.vx||0), 0, scene.width-player.w); }
  if (player.onGround && !wasGround) burst(player.x+16, ny+player.h, "#9bb7be", 5);
  player.x = nx; player.y = ny;
  player.respawnLock = Math.max(0, (player.respawnLock || 0) - dt);
  if (player.y > H + 20) respawn("掉进裂隙了，已拉回检查点");

  companion.face = player.face;
  const home = companionHome();
  companion.x += (home.x - companion.x) * Math.min(1, dt*6);
  companion.y += (home.y - companion.y) * Math.min(1, dt*8);
  companion.walk += dt*9;

  let drain = 0.16;
  for (const h of scene.hazards || []) {
    if (player.x+player.w>h.x && player.x<h.x+h.w && player.y+player.h>h.y-20) drain += 1.1;
  }
  save.oxygen = clamp(save.oxygen - drain*dt, 0, 100);
  if (save.oxygen <= 0) { save.oxygen = 50; respawn("氧气耗尽，已返回补给点"); speak("刘看山", "第一课：永远给返回留余量。"); }

  for (const c of scene.crystals) {
    const id = scene.id+":c"+c[0];
    if (save.collected.includes(id)) continue;
    if (Math.hypot(player.x+20-c[0], player.y+30-c[1]) < 30) {
      save.collected.push(id); save.crystals++;
      const g = hitCombo(200); persist(); updateHUD();
      pop(c[0], c[1], "+"+g); burst(c[0], c[1], "#7de8ff", 8); sfx("pickup");
    }
  }

  for (const e of enemies) {
    if (e.dead) continue;
    if (e.kind === "hover" || e.kind === "boss") {
      e.y = e.oy + Math.sin(now()/280 + e.origin)*18;
      e.x += e.dir * (e.kind==="boss"?40:32) * dt;
    } else e.x += e.dir * 34 * dt;
    if (Math.abs(e.x - e.origin) > e.patrol) e.dir *= -1;
    const hit = player.x+player.w>e.x+4 && player.x<e.x+e.w-4 && player.y+player.h>e.y && player.y<e.y+e.h;
    if (hit && player.vy > 80 && !e.armor && player.y+player.h < e.y+18) {
      player.vy = PHYS.jump * 0.55; disableEnemy(e); continue;
    }
    if (hit && e.armor && player.inv <= 0) {
      save.oxygen = clamp(save.oxygen - 14, 0, 100); player.inv = 0.7; player.vx = -player.face*160; player.vy = -120;
      shakeCam(6); toast("护甲刮蹭，氧气 -14%");
    }
  }

  if (beam.on) { beam.t -= dt; if (beam.t <= 0) beam.on = false; }
  if (comboT > 0) { comboT -= dt; if (comboT <= 0) { combo = 1; updateHUD(); } }
  shake *= 0.86; if (shake < 0.2) shake = 0;
  for (let i = particles.length-1; i >= 0; i--) {
    const p = particles[i]; p.x += p.vx*dt; p.y += p.vy*dt; p.vy += 80*dt; p.life -= dt; p.a = p.life*2;
    if (p.life <= 0) particles.splice(i,1);
  }
  for (let i = floats.length-1; i >= 0; i--) { floats[i].y -= 22*dt; floats[i].t -= dt; if (floats[i].t<=0) floats.splice(i,1); }

  const look = player.face * 90;
  camN = clamp(player.x - 360 + look, 0, scene.width - W);
  cam += (camN - cam) * Math.min(1, dt * 5);

  if (Math.floor(hintTick * 5) !== Math.floor((hintTick + dt) * 5)) updateHUD();
  hintTick += dt;
  if (hintTick > 7) {
    hintTick = 0;
    const e = nearEnemy();
    const n = nearby(120);
    if (e && e.armor) speak("刘看山", "先解护甲锁，再踩头或射击。");
    else if (n && n.type === "puzzle" && !save.solved.includes(scene.id)) speak("刘看山", "校准这台，能解锁新机动。");
    else if (!save.abilities.djump) speak("刘看山", "高台够不着就找移动平台，或先去修月壤分析台。");
  }
}

function loop(t) {
  if (!running) return;
  if (typeof document !== "undefined" && document.hidden) {
    last = t;
    requestAnimationFrame(loop);
    return;
  }
  const dt = Math.min(0.05, (t - last) / 1000 || STEP);
  last = t;
  if (!paused && !modalOpen) {
    accu += dt;
    let n = 0;
    while (accu >= STEP && n < 5) { move(STEP); accu -= STEP; n++; }
    draw();
  } else accu = 0;
  requestAnimationFrame(loop);
}

function layoutMode() {
  let w = window.innerWidth, h = window.innerHeight;
  if (window.visualViewport) {
    if (window.visualViewport.width) w = window.visualViewport.width;
    if (window.visualViewport.height) h = window.visualViewport.height;
  }
  const root = document.documentElement;
  if (h >= w) {
    root.classList.add("is-portrait");
    root.classList.remove("is-landscape");
  } else {
    root.classList.add("is-landscape");
    root.classList.remove("is-portrait");
  }
  root.style.setProperty("--app-height", h + "px");
  resizeRenderer();
}
function bindPad() {
  const pad = $("pad");
  if (!pad) return;
  function hold(key, on) {
    if (on) keys.add(key); else keys.delete(key);
  }
  const holds = pad.querySelectorAll("[data-hold]");
  for (let i = 0; i < holds.length; i++) {
    (function (btn) {
      const key = btn.getAttribute("data-hold");
      btn.addEventListener("pointerdown", function (e) {
        e.preventDefault();
        if (modalOpen || !running) return;
        if (btn.setPointerCapture) btn.setPointerCapture(e.pointerId);
        hold(key, true);
        if (key === " " && player) {
          player.buffer = PHYS.buffer;
          jumpHeld = true;
        }
      });
      btn.addEventListener("pointerup", function () { hold(key, false); });
      btn.addEventListener("pointercancel", function () { hold(key, false); });
      btn.addEventListener("lostpointercapture", function () { hold(key, false); });
    })(holds[i]);
  }
  $("padAct").addEventListener("pointerdown", function (e) {
    e.preventDefault();
    if (modalOpen || !running) return;
    interact();
  });
  $("padShot").addEventListener("pointerdown", function (e) {
    e.preventDefault();
    if (running && !modalOpen) shoot();
  });
}
function bind() {
  keys = new Set();
  layoutMode();
  window.addEventListener("resize", layoutMode);
  if (window.visualViewport) window.visualViewport.addEventListener("resize", layoutMode);
  window.addEventListener("keydown", (e) => {
    if (["ArrowUp","ArrowDown","ArrowLeft","ArrowRight"," "].includes(e.key)) e.preventDefault();
    keys.add(e.key);
    if (e.key === "e" || e.key === "E") interact();
    if (e.key === "r" || e.key === "R") { if (running && !modalOpen) shoot(); }
    if (e.key === "Escape") { if (modalOpen) closeModal(); else openSettings(); }
  });
  window.addEventListener("keyup", (e) => keys.delete(e.key));
  if ($("startBtn")) $("startBtn").onclick = startGame;
  if ($("mode2dBtn")) $("mode2dBtn").onclick = function () { location.href = "./index.html"; };
  if ($("codexStartBtn")) $("codexStartBtn").onclick = openCodex;
  if ($("settingsStartBtn")) $("settingsStartBtn").onclick = openSettings;
  if ($("briefStartBtn")) $("briefStartBtn").onclick = openBriefing;
  if ($("mapStartBtn")) $("mapStartBtn").onclick = openMap;
  $("mapBtn").onclick = openMap;
  $("codexBtn").onclick = openCodex;
  $("pauseBtn").onclick = openSettings;
  $("app").addEventListener("click", (e) => {
    if (!running || modalOpen) return;
    if (e.target.id === "pad" || (e.target.closest && (e.target.closest("button") || e.target.closest("#pad")))) return;
    shoot();
  });
  $("start").addEventListener("click", function () { resumeAC(); playBgm("title"); }, {once:true});
  document.addEventListener("visibilitychange", function () {
    if (document.hidden) {
      last = performance.now();
      stopBgm();
    } else if (running) {
      last = performance.now();
      if (!save.muted) playBgm(sceneIndex === 0 ? "explore" : "base");
    }
  });
  document.addEventListener("touchmove", function (e) {
    if (e.target && e.target.id === "view") e.preventDefault();
  }, {passive: false});
  bindPad();
}

async function boot() {
  if (typeof THREE === "undefined") {
    $("boot").innerHTML = "<div>缺少 vendor/three.min.js，无法启动 WebGL 3D。</div><p><a href='index.html' style='color:#6fe8df'>返回 2D 主界面</a></p>";
    return;
  }
  loadSave();
  sceneIndex = save.scene || 0;
  scene = SCENES[sceneIndex];
  makeStars(); bind(); accu = 0; hintTick = 2; combo = 1; comboT = 0; shake = 0; cam = 0; camN = 0; jumpHeld = false;
  const bar = $("bootBar");
  const pack = [["sprites","./assets/sprites.png"],["chars","./assets/chars.png"],["surface","./assets/bg-surface.png"],["base","./assets/bg-base.png"],["obs","./assets/bg-observatory.png"],["stars","./assets/bg-stars.png"],["ridges","./assets/bg-ridges.png"],["cover","./assets/cover.jpg"]];
  imgs = {};
  for (let i = 0; i < pack.length; i++) { imgs[pack[i][0]] = await loadImg(pack[i][1]); bar.style.width = Math.round((i+1)/pack.length*100)+"%"; }
  if (imgs.cover && $("coverArt")) $("coverArt").src = "./assets/cover.jpg";
  initThree();
  setVol();
  $("boot").classList.add("hidden");
  player = {x:200,y:350,w:80,h:112,vx:0,vy:0,onGround:true,face:1,walk:0};
  companion = {x:150,y:366,face:1,walk:0};
  enemies = []; particles = []; floats = []; movers = [];
  startGame();
}

boot();
})();
