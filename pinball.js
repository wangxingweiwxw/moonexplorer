(() => {
"use strict";
const W = 960, H = 540, STEP = 1 / 120, SUB = 3;
const cvs = document.getElementById("view");
const ctx = cvs.getContext("2d");
ctx.imageSmoothingEnabled = true;
ctx.imageSmoothingQuality = "high";
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const hypot = Math.hypot;
const TAU = Math.PI * 2;
const HS_KEY = "moonexplorer-pinball-best";
const TABLE = { x: 8, y: 10, w: 520, h: 520 };
const GRAV = 1520;
const MAX_SPD = 900;
const BALL_R = 7.4;
const RANK = [
  { name: "蓝", hue: "#3d9eff", score: 160, kick: 430 },
  { name: "绿", hue: "#3dff8a", score: 280, kick: 470 },
  { name: "黄", hue: "#f4ca78", score: 420, kick: 510 },
  { name: "红", hue: "#ff5a4a", score: 640, kick: 560 }
];

const tableImg = new Image();
tableImg.src = "./assets/pinball-playfield.png?v=pits3";

let keys = new Set();
let holds = { left: false, right: false, launch: false };
let last = 0, accu = 0, clock = 0;
let score = 0, balls = 3, combo = 1, comboT = 0, best = 0, bumperRank = 0;
let state = "ready";
let charge = 0, shake = 0, flashAll = 0, nudgeCool = 0;
let msg = "按住空格蓄力，松开发射", msgT = 3.2;
let particles = [], trail = [];
let ball, bumpers, walls, flipL, flipR, targets, slings, rolls, inserts, lane, skillOnce;

try { best = Math.max(0, +localStorage.getItem(HS_KEY) || 0); } catch (e) { best = 0; }

function U(u, v) {
  return { x: TABLE.x + u * TABLE.w, y: TABLE.y + v * TABLE.h };
}
function uw(u1, v1, u2, v2, bounce, kick, kind) {
  const a = U(u1, v1), b = U(u2, v2);
  return { x1: a.x, y1: a.y, x2: b.x, y2: b.y, bounce: bounce == null ? 0.55 : bounce, kick: kick || 0, kind: kind || "rail" };
}

function setHi() {
  const el = document.getElementById("hiScore");
  if (el) el.textContent = "最高 " + ("0000000" + best).slice(-7);
}

function sfx(kind) {
  try {
    const A = window.AudioContext || window.webkitAudioContext;
    if (!A) return;
    if (!sfx.ac) sfx.ac = new A();
    const ac = sfx.ac;
    if (ac.state === "suspended") ac.resume();
    const beep = function (type, freq, dur, vol, delay) {
      const o = ac.createOscillator();
      const g = ac.createGain();
      o.type = type;
      o.frequency.setValueAtTime(freq, ac.currentTime + (delay || 0));
      g.gain.value = vol || 0.045;
      o.connect(g); g.connect(ac.destination);
      const t0 = ac.currentTime + (delay || 0);
      o.start(t0);
      g.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
      o.stop(t0 + dur + 0.02);
    };
    if (kind === "bumper") { beep("square", 340 + bumperRank * 70, 0.08, 0.05); beep("sine", 520 + bumperRank * 80, 0.12, 0.03, 0.02); }
    else if (kind === "flip") beep("triangle", 196, 0.07, 0.04);
    else if (kind === "drain") { beep("sine", 130, 0.2, 0.05); beep("sine", 82, 0.28, 0.04, 0.06); }
    else if (kind === "target") { beep("square", 540, 0.07, 0.035); beep("sine", 810, 0.12, 0.03, 0.04); }
    else if (kind === "bonus") { beep("sine", 392, 0.1, 0.05); beep("sine", 523, 0.14, 0.04, 0.08); beep("sine", 784, 0.18, 0.04, 0.16); }
    else if (kind === "nudge") { beep("sine", 90, 0.16, 0.05); beep("triangle", 140, 0.1, 0.03, 0.03); }
    else beep("sine", 180, 0.08, 0.04);
  } catch (e) {}
}

function spark(x, y, hue, n) {
  for (let i = 0; i < (n || 7); i++) {
    const a = Math.random() * TAU, s = 50 + Math.random() * 150;
    particles.push({ x: x, y: y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, t: 0.25 + Math.random() * 0.2, hue: hue || "#f4ca78", r: 1.1 + Math.random() * 1.8 });
  }
}
function pop(x, y, text) {
  particles.push({ x: x, y: y, vx: 0, vy: -50, t: 0.8, text: text, hue: "#f4ca78" });
}

function buildTable() {
  const p = [
    [0.14, 0.17], [0.22, 0.09], [0.40, 0.06], [0.60, 0.07], [0.74, 0.13], [0.80, 0.20],
    [0.82, 0.34], [0.80, 0.52], [0.76, 0.68], [0.70, 0.80], [0.64, 0.90]
  ];
  const q = [
    [0.12, 0.20], [0.10, 0.38], [0.11, 0.56], [0.16, 0.72], [0.22, 0.84], [0.28, 0.91]
  ];
  walls = [];
  for (let i = 0; i < p.length - 1; i++) walls.push(uw(p[i][0], p[i][1], p[i + 1][0], p[i + 1][1], 0.52));
  for (let i = 0; i < q.length - 1; i++) walls.push(uw(q[i][0], q[i][1], q[i + 1][0], q[i + 1][1], 0.52));
  walls.push(uw(0.28, 0.91, 0.34, 0.94, 0.3, 0, "rubber"));
  walls.push(uw(0.64, 0.90, 0.58, 0.94, 0.3, 0, "rubber"));
  lane = { L: U(0.855, 0).x, R: U(0.938, 0).x, top: U(0, 0.22).y };
  walls.push(uw(0.855, 0.18, 0.855, 0.90, 0.48, 0, "lane"));
  walls.push(uw(0.938, 0.16, 0.938, 0.92, 0.5, 0, "lane"));
  walls.push(uw(0.855, 0.17, 0.938, 0.15, 0.62, 90, "lane"));
  walls.push(uw(0.855, 0.91, 0.938, 0.91, 0.12, 0, "lane"));
  walls.push(uw(0.16, 0.66, 0.30, 0.80, 1.05, 50, "rubber"));
  walls.push(uw(0.72, 0.62, 0.82, 0.76, 1.05, 50, "rubber"));

  const pads = [[0.50, 0.368], [0.418, 0.445], [0.582, 0.445], [0.50, 0.518]];
  bumpers = pads.map(function (pv, i) {
    const pt = U(pv[0], pv[1]);
    return { x: pt.x, y: pt.y, r: 21 - (i === 3 ? 1 : 0), flash: 0, cool: 0, name: ["月尘", "氦-3", "月冰", "基站"][i] };
  });
  const t0 = U(0.145, 0.46);
  targets = [0, 1, 2].map(function (i) {
    return { x: t0.x, y: t0.y + i * 28, w: 14, h: 24, hit: false, name: ["A", "B", "C"][i], score: 300 };
  });
  rolls = [
    { p: U(0.425, 0.195), r: 10, on: false, ch: "C" },
    { p: U(0.50, 0.175), r: 10, on: false, ch: "R" },
    { p: U(0.575, 0.195), r: 10, on: false, ch: "A" }
  ];
  const sl = U(0.22, 0.72), sr = U(0.76, 0.70);
  slings = [
    { x: sl.x, y: sl.y, r: 12, kx: 360, ky: -260, flash: 0 },
    { x: sr.x, y: sr.y, r: 12, kx: -360, ky: -260, flash: 0 }
  ];
  const fl = U(0.30, 0.885), fr = U(0.62, 0.875);
  flipL = { x: fl.x, y: fl.y, len: 68, rest: 0.48, active: -0.40, ang: 0.48, spd: 0 };
  flipR = { x: fr.x, y: fr.y, len: 68, rest: Math.PI - 0.48, active: Math.PI + 0.40, ang: Math.PI - 0.48, spd: 0 };
  inserts = [
    [0.20, 0.62, "#3d9eff"], [0.24, 0.74, "#f4ca78"], [0.18, 0.78, "#3d9eff"],
    [0.76, 0.58, "#f4ca78"], [0.80, 0.70, "#3d9eff"], [0.72, 0.76, "#3d9eff"],
    [0.50, 0.62, "#f4ca78"], [0.36, 0.28, "#6fe8df"], [0.64, 0.30, "#e8843a"]
  ].map(function (a) { return { p: U(a[0], a[1]), hue: a[2], r: 5 }; });
}

function spawnBall(inLane) {
  trail = [];
  skillOnce = false;
  if (inLane) {
    const p = U(0.896, 0.84);
    ball = { x: p.x, y: p.y, vx: 0, vy: 0, r: BALL_R, live: true };
    state = "ready";
    charge = 0;
    msg = "按住空格蓄力，松开发射";
    msgT = 2.2;
  } else {
    const p = U(0.50, 0.22);
    ball = { x: p.x, y: p.y, vx: 30, vy: 40, r: BALL_R, live: true };
    state = "play";
  }
}

function addScore(n, x, y, label) {
  const got = Math.round(n * combo);
  score += got;
  combo = Math.min(6, combo + 0.18);
  comboT = 1.2;
  if (score > best) {
    best = score;
    setHi();
    try { localStorage.setItem(HS_KEY, String(best)); } catch (e) {}
  }
  if (x != null) pop(x, y, (label ? label + " " : "") + "+" + got);
}

function capBall() {
  const s = hypot(ball.vx, ball.vy);
  if (s > MAX_SPD) { ball.vx *= MAX_SPD / s; ball.vy *= MAX_SPD / s; }
}
function bounceN(nx, ny, rest, extra) {
  const vn = ball.vx * nx + ball.vy * ny;
  if (vn < 0) {
    ball.vx -= (1 + rest) * vn * nx;
    ball.vy -= (1 + rest) * vn * ny;
  }
  if (extra) { ball.vx += nx * extra; ball.vy += ny * extra; }
  capBall();
}
function hitSeg(seg) {
  const dx = seg.x2 - seg.x1, dy = seg.y2 - seg.y1;
  const len2 = dx * dx + dy * dy || 1;
  let t = ((ball.x - seg.x1) * dx + (ball.y - seg.y1) * dy) / len2;
  t = clamp(t, 0, 1);
  const px = seg.x1 + t * dx, py = seg.y1 + t * dy;
  const nx0 = ball.x - px, ny0 = ball.y - py;
  const d = hypot(nx0, ny0);
  if (d >= ball.r || d < 1e-5) return false;
  const nx = nx0 / d, ny = ny0 / d;
  ball.x = px + nx * (ball.r + 0.08);
  ball.y = py + ny * (ball.r + 0.08);
  bounceN(nx, ny, seg.bounce, seg.kick);
  if (seg.kind === "rubber") spark(px, py, "#6fe8df", 3);
  return true;
}
function hitCircle(cx, cy, r, rest, extra) {
  const nx0 = ball.x - cx, ny0 = ball.y - cy;
  const d = hypot(nx0, ny0);
  const lim = ball.r + r;
  if (d >= lim || d < 1e-5) return false;
  const nx = nx0 / d, ny = ny0 / d;
  ball.x = cx + nx * (lim + 0.08);
  ball.y = cy + ny * (lim + 0.08);
  bounceN(nx, ny, rest, extra);
  return true;
}
function flipperTip(f) {
  return { x: f.x + Math.cos(f.ang) * f.len, y: f.y + Math.sin(f.ang) * f.len };
}
function hitFlipper(f, pressed) {
  const tip = flipperTip(f);
  const dx = tip.x - f.x, dy = tip.y - f.y;
  const len2 = dx * dx + dy * dy || 1;
  let t = ((ball.x - f.x) * dx + (ball.y - f.y) * dy) / len2;
  t = clamp(t, 0, 1);
  const px = f.x + t * dx, py = f.y + t * dy;
  const nx0 = ball.x - px, ny0 = ball.y - py;
  const d = hypot(nx0, ny0);
  const thick = ball.r + 5.2;
  if (d >= thick || d < 1e-5) return false;
  const nx = nx0 / d, ny = ny0 / d;
  ball.x = px + nx * (thick + 0.08);
  ball.y = py + ny * (thick + 0.08);
  const swinging = pressed && Math.abs(f.spd) > 10;
  bounceN(nx, ny, swinging ? 0.16 : 0.12, swinging ? Math.abs(f.spd) * (24 + t * f.len) * 0.055 : 0);
  if (swinging) {
    ball.vx += -Math.sin(f.ang) * f.spd * t * 22;
    ball.vy += Math.cos(f.ang) * f.spd * t * 22;
    spark(px, py, "#f4ca78", 5);
  } else if (t < 0.22) {
    const away = f.x < TABLE.x + TABLE.w * 0.45 ? 1 : -1;
    ball.vx += away * 110;
    ball.vy -= 90;
  } else {
    ball.vy += 12;
    ball.vx += f.x < TABLE.x + TABLE.w * 0.45 ? 8 : -8;
    ball.vx *= 0.9; ball.vy *= 0.9;
  }
  capBall();
  return true;
}
function updateFlipper(f, pressed, dt) {
  const prev = f.ang;
  if (pressed) {
    const dir = f.active > f.rest ? 1 : -1;
    f.ang += dir * 52 * dt;
    f.ang = dir > 0 ? Math.min(f.ang, f.active) : Math.max(f.ang, f.active);
  } else {
    const dir = f.rest > f.active ? 1 : -1;
    f.ang += dir * 34 * dt;
    f.ang = dir > 0 ? Math.min(f.ang, f.rest) : Math.max(f.ang, f.rest);
  }
  f.spd = (f.ang - prev) / dt;
}

function drainCheck() {
  if (ball.x > lane.L - 6) return false;
  return ball.y > TABLE.y + TABLE.h * 0.955;
}
function leftHeld() {
  return holds.left || keys.has("z") || keys.has("Z") || keys.has("ArrowLeft") || keys.has("a") || keys.has("A");
}
function rightHeld() {
  return holds.right || keys.has("c") || keys.has("C") || keys.has("/") || keys.has("ArrowRight") || keys.has("d") || keys.has("D");
}
function launchHeld() {
  return holds.launch || keys.has(" ") || keys.has("Space") || keys.has("Spacebar");
}
function applyNudge() {
  if (state !== "play" || !ball || !ball.live) return false;
  if (nudgeCool > 0) {
    msg = "摇晃冷却中";
    msgT = 0.7;
    return false;
  }
  nudgeCool = 0.42;
  shake = Math.min(18, shake + 12);
  const nearR = hypot(ball.x - flipR.x, ball.y - flipR.y) < 58;
  const nearL = hypot(ball.x - flipL.x, ball.y - flipL.y) < 58;
  if (nearR) {
    ball.vx -= 380;
    ball.vy -= 520;
    ball.x = Math.min(ball.x, flipR.x - 12);
    ball.y -= 8;
  } else if (nearL) {
    ball.vx += 380;
    ball.vy -= 520;
    ball.x = Math.max(ball.x, flipL.x + 12);
    ball.y -= 8;
  } else {
    ball.vx += (ball.x < TABLE.x + TABLE.w * 0.5 ? 260 : -260);
    ball.vy -= 340;
  }
  capBall();
  spark(ball.x, ball.y, "#f4ca78", 10);
  sfx("nudge");
  msg = "摇晃台面";
  msgT = 1.4;
  return true;
}

function upgradeBumpers() {
  if (bumperRank < 3) {
    bumperRank += 1;
    msg = "缓冲器升至" + RANK[bumperRank].name + "级";
    msgT = 2.4;
    flashAll = 0.5;
    addScore(800 + bumperRank * 400, U(0.5, 0.4).x, U(0.5, 0.4).y, "升级");
    sfx("bonus");
  } else {
    addScore(2000, U(0.5, 0.4).x, U(0.5, 0.4).y, "满级");
    flashAll = 0.5;
    sfx("bonus");
    msg = "红级缓冲器火力全开";
    msgT = 2.2;
  }
}

function physics(dt) {
  const left = leftHeld(), right = rightHeld(), launch = launchHeld();
  if (nudgeCool > 0) nudgeCool = Math.max(0, nudgeCool - dt);
  const wasL = flipL.ang, wasR = flipR.ang;
  updateFlipper(flipL, left, dt);
  updateFlipper(flipR, right, dt);
  if ((left && flipL.ang !== wasL && Math.abs(flipL.spd) > 8) || (right && flipR.ang !== wasR && Math.abs(flipR.spd) > 8)) sfx("flip");

  const rest = U(0.896, 0.84);
  if (state === "ready") {
    ball.x = rest.x; ball.vx = 0;
    if (launch) {
      charge = Math.min(1, charge + dt * 1.2);
      const back = TABLE.y + TABLE.h * 0.905 - ball.r;
      ball.y = rest.y + charge * Math.max(24, back - rest.y);
      if (ball.y > back) ball.y = back;
      ball.vy = 0;
      return;
    }
    if (charge > 0) {
      if (charge < 0.16) {
        charge = 0;
        ball.y = rest.y;
        ball.vy = 0;
        msg = "再按住空格，向后拉到位再松开";
        msgT = 1.8;
        return;
      }
      const p = Math.max(charge, 0.42);
      ball.vy = -1100 - p * 620;
      ball.vx = 0;
      state = "play";
      charge = 0;
      sfx("target");
      msg = p > 0.85 ? "满力发射" : "";
      msgT = p > 0.85 ? 1.1 : 0;
    } else {
      ball.y = rest.y; ball.vy = 0;
      return;
    }
  }
  if (state !== "play" || !ball.live) return;
  if (!isFinite(ball.x) || !isFinite(ball.y) || !isFinite(ball.vx) || !isFinite(ball.vy)) {
    spawnBall(true);
    return;
  }

  ball.vy += GRAV * dt;
  ball.vx *= 0.9994;
  ball.vy *= 0.9994;
  ball.x += ball.vx * dt;
  ball.y += ball.vy * dt;

  if (ball.x > lane.L - 2 && ball.y > lane.top) {
    ball.x = clamp(ball.x, lane.L + ball.r + 1, lane.R - ball.r - 1);
    if (ball.vx < 0) ball.vx = 0;
  }
  if (ball.x > lane.L && ball.y < TABLE.y + TABLE.h * 0.22 && ball.vy <= 50) {
    const exit = U(0.80, 0.20);
    ball.x = exit.x;
    ball.y = Math.max(ball.y, exit.y);
    ball.vx = -300;
    ball.vy = 70;
    if (!skillOnce) {
      skillOnce = true;
      rolls[2].on = true;
      addScore(120, ball.x, ball.y, "技能球");
    }
  }

  for (let i = 0; i < walls.length; i++) hitSeg(walls[i]);

  const rk = RANK[bumperRank];
  for (let i = 0; i < bumpers.length; i++) {
    const b = bumpers[i];
    if (b.cool > 0) continue;
    if (hitCircle(b.x, b.y, b.r, 1.2, rk.kick)) {
      addScore(rk.score, b.x, b.y - 12, b.name);
      b.flash = 0.22; b.cool = 0.11;
      shake = Math.min(8, shake + 2.2);
      spark(b.x, b.y, rk.hue, 11);
      sfx("bumper");
    }
  }
  for (let i = 0; i < slings.length; i++) {
    const s = slings[i];
    if (hitCircle(s.x, s.y, s.r + 2, 0.3, 0)) {
      ball.vx += s.kx; ball.vy += s.ky; capBall();
      s.flash = 0.16;
      addScore(30, s.x, s.y);
      spark(s.x, s.y, "#6fe8df", 6);
      sfx("flip");
    }
  }
  hitFlipper(flipL, left);
  hitFlipper(flipR, right);

  for (let i = 0; i < targets.length; i++) {
    const t = targets[i];
    if (t.hit) continue;
    if (ball.x + ball.r > t.x && ball.x - ball.r < t.x + t.w && ball.y + ball.r > t.y && ball.y - ball.r < t.y + t.h) {
      t.hit = true;
      addScore(t.score, t.x + 22, t.y + 8, "舱" + t.name);
      bounceN(-1, 0, 0.7, 230);
      spark(t.x + 6, t.y + 10, "#e8843a", 8);
      sfx("target");
      if (targets.every(function (g) { return g.hit; })) {
        addScore(1500, U(0.5, 0.28).x, U(0.5, 0.28).y, "全舱");
        flashAll = 0.4;
        msg = "摇篮三舱点亮";
        msgT = 2.2;
        sfx("bonus");
        for (let k = 0; k < targets.length; k++) targets[k].hit = false;
      }
    }
  }
  for (let i = 0; i < rolls.length; i++) {
    const r = rolls[i];
    if (hypot(ball.x - r.p.x, ball.y - r.p.y) < r.r + ball.r + 7 && !r.on) {
      r.on = true;
      addScore(70, r.p.x, r.p.y - 10, r.ch);
      sfx("target");
      if (rolls.every(function (g) { return g.on; })) {
        for (let k = 0; k < rolls.length; k++) rolls[k].on = false;
        upgradeBumpers();
      }
    }
  }

  if (ball.x < TABLE.x + 12) { ball.x = TABLE.x + 12; ball.vx = Math.abs(ball.vx) * 0.4; }
  if (ball.x > TABLE.x + TABLE.w - 8) { ball.x = TABLE.x + TABLE.w - 8; ball.vx = -Math.abs(ball.vx) * 0.4; }
  if (ball.y < TABLE.y + 10) { ball.y = TABLE.y + 10; ball.vy = Math.abs(ball.vy) * 0.4; }

  const spd = hypot(ball.vx, ball.vy);
  if (spd < 24 && ball.x < lane.L - 8 && ball.y < TABLE.y + TABLE.h - 40) {
    ball.vx += (ball.x < TABLE.x + TABLE.w * 0.5 ? 100 : -100) * dt * 10;
    ball.vy -= 240 * dt;
  }

  if (ball.x > lane.L - 2 && ball.y > rest.y - 6 && ball.vy > 80) {
    state = "ready";
    charge = 0;
    ball.x = rest.x;
    ball.y = rest.y;
    ball.vx = 0;
    ball.vy = 0;
    trail = [];
    msg = "蓄力不足，按住空格向后拉再松开";
    msgT = 2.2;
    return;
  }

  if (drainCheck()) {
    ball.live = false;
    state = "drain";
    sfx("drain");
    balls -= 1;
    combo = 1;
    msg = balls > 0 ? "弹珠落入月尘，还剩 " + balls + " 球" : "本局探测结束";
    msgT = 1.8;
    spark(ball.x, TABLE.y + TABLE.h - 16, "#8aa8ad", 12);
    setTimeout(function () {
      if (balls > 0) spawnBall(true);
      else { state = "over"; msg = "再来一局 或按 R"; msgT = 10; }
    }, 900);
  }
}

function restart() {
  score = 0; balls = 3; combo = 1; bumperRank = 0; flashAll = 0; nudgeCool = 0;
  buildTable();
  spawnBall(true);
}

function roundRect(x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawMushroom(b) {
  const rk = RANK[bumperRank];
  const glow = b.flash > 0;
  ctx.save();
  ctx.beginPath();
  ctx.ellipse(b.x + 1, b.y + b.r * 0.55, b.r * 0.85, b.r * 0.28, 0, 0, TAU);
  ctx.fillStyle = "rgba(0,0,0,0.35)";
  ctx.fill();
  const body = ctx.createRadialGradient(b.x - b.r * 0.25, b.y - b.r * 0.45, 2, b.x, b.y, b.r);
  body.addColorStop(0, glow ? "#ffffff" : "#f4f7fb");
  body.addColorStop(0.45, "#c8d2dc");
  body.addColorStop(1, "#4a5a66");
  ctx.beginPath();
  ctx.arc(b.x, b.y, b.r, 0, TAU);
  ctx.fillStyle = body;
  ctx.fill();
  ctx.strokeStyle = "rgba(10,20,28,0.55)";
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.shadowColor = rk.hue;
  ctx.shadowBlur = glow ? 16 : 6;
  ctx.beginPath();
  ctx.arc(b.x, b.y - b.r * 0.08, b.r * 0.52, 0, TAU);
  ctx.fillStyle = glow ? "#fff" : rk.hue;
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.beginPath();
  ctx.arc(b.x - b.r * 0.22, b.y - b.r * 0.42, b.r * 0.16, 0, TAU);
  ctx.fillStyle = "rgba(255,255,255,0.75)";
  ctx.fill();
  ctx.restore();
}

function drawFlipper(f) {
  const tip = flipperTip(f);
  ctx.lineCap = "round";
  ctx.strokeStyle = "#1a140c";
  ctx.lineWidth = 15;
  ctx.beginPath(); ctx.moveTo(f.x, f.y); ctx.lineTo(tip.x, tip.y); ctx.stroke();
  const g = ctx.createLinearGradient(f.x, f.y, tip.x, tip.y);
  g.addColorStop(0, "#fff6e8");
  g.addColorStop(0.5, "#e0c48a");
  g.addColorStop(1, "#9a7438");
  ctx.strokeStyle = g;
  ctx.lineWidth = 11;
  ctx.beginPath(); ctx.moveTo(f.x, f.y); ctx.lineTo(tip.x, tip.y); ctx.stroke();
  ctx.strokeStyle = "#c45a28";
  ctx.lineWidth = 3.5;
  const ox = -Math.sin(f.ang) * 3, oy = Math.cos(f.ang) * 3;
  ctx.beginPath(); ctx.moveTo(f.x + ox, f.y + oy); ctx.lineTo(tip.x + ox, tip.y + oy); ctx.stroke();
  const rg = ctx.createRadialGradient(f.x - 2, f.y - 2, 1, f.x, f.y, 8);
  rg.addColorStop(0, "#fffaf0");
  rg.addColorStop(1, "#b88940");
  ctx.fillStyle = rg;
  ctx.beginPath(); ctx.arc(f.x, f.y, 7.2, 0, TAU); ctx.fill();
}

function drawBall() {
  if (!ball || !ball.live) return;
  for (let i = 0; i < trail.length; i++) {
    const t = trail[i];
    ctx.globalAlpha = 0.08 + i / trail.length * 0.25;
    ctx.beginPath();
    ctx.arc(t.x, t.y, ball.r * (0.5 + i / trail.length * 0.4), 0, TAU);
    ctx.fillStyle = "#c9f6ff";
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  ctx.beginPath();
  ctx.arc(ball.x + 1.4, ball.y + 2.4, ball.r, 0, TAU);
  ctx.fillStyle = "rgba(0,0,0,0.32)";
  ctx.fill();
  const g = ctx.createRadialGradient(ball.x - 2.4, ball.y - 2.8, 0.8, ball.x, ball.y, ball.r);
  g.addColorStop(0, "#ffffff");
  g.addColorStop(0.22, "#e7eef4");
  g.addColorStop(0.55, "#8aa0b0");
  g.addColorStop(1, "#243040");
  ctx.beginPath();
  ctx.arc(ball.x, ball.y, ball.r, 0, TAU);
  ctx.fillStyle = g;
  ctx.fill();
  ctx.beginPath();
  ctx.arc(ball.x - 2.2, ball.y - 2.6, 1.8, 0, TAU);
  ctx.fillStyle = "rgba(255,255,255,0.9)";
  ctx.fill();
}

function drawHud() {
  const px = 548, py = 12;
  roundRect(px, py, 396, 516, 12);
  ctx.fillStyle = "rgba(6,16,24,0.92)";
  ctx.fill();
  ctx.strokeStyle = "#2c5c70";
  ctx.lineWidth = 2;
  ctx.stroke();

  roundRect(px + 14, py + 14, 368, 86, 8);
  ctx.fillStyle = "#071018";
  ctx.fill();
  ctx.strokeStyle = RANK[bumperRank].hue;
  ctx.stroke();
  ctx.fillStyle = "#6fe8df";
  ctx.font = "11px sans-serif";
  ctx.textAlign = "left";
  ctx.fillText("CRADLE BASE  ·  LUNAR TABLE", px + 28, py + 36);
  ctx.fillStyle = "#f3fffb";
  ctx.font = "bold 36px sans-serif";
  ctx.fillText(("0000000" + score).slice(-7), px + 28, py + 78);

  ctx.font = "12px sans-serif";
  ctx.fillStyle = "#8aa8ad";
  ctx.fillText("BALL", px + 28, py + 128);
  for (let i = 0; i < 3; i++) {
    ctx.beginPath();
    ctx.arc(px + 78 + i * 22, py + 124, 7, 0, TAU);
    const g = ctx.createRadialGradient(px + 76 + i * 22, py + 122, 1, px + 78 + i * 22, py + 124, 7);
    if (i < balls) { g.addColorStop(0, "#fff"); g.addColorStop(1, "#7ec8c4"); }
    else { g.addColorStop(0, "#1a3038"); g.addColorStop(1, "#0a1820"); }
    ctx.fillStyle = g;
    ctx.fill();
  }
  ctx.fillStyle = RANK[bumperRank].hue;
  ctx.fillText("武器  " + RANK[bumperRank].name + "级", px + 230, py + 128);
  ctx.fillStyle = "#f4ca78";
  ctx.fillText("连击 ×" + combo.toFixed(2), px + 28, py + 156);
  ctx.fillStyle = "#0d1c24";
  ctx.fillRect(px + 110, py + 148, 250, 8);
  ctx.fillStyle = "#6fe8df";
  ctx.fillRect(px + 110, py + 148, 250 * clamp((combo - 1) / 5, 0, 1), 8);

  ctx.fillStyle = "#6fe8df";
  ctx.font = "11px sans-serif";
  ctx.fillText("任务 / 月球基地作战升级", px + 28, py + 188);
  const tasks = [
    "点亮穹顶 C·R·A 灯，提升蘑菇缓冲器颜色与分值",
    "蓝 → 绿 → 黄 → 红，红级单次得分最高"
  ];
  ctx.fillStyle = "#c2d9d5";
  ctx.font = "12px sans-serif";
  for (let i = 0; i < tasks.length; i++) ctx.fillText("·  " + tasks[i], px + 28, py + 214 + i * 22);

  ctx.fillStyle = "#8aa8ad";
  ctx.fillText("空格发射   Z / ← 左挡板   C / → 右挡板   X 摇晃", px + 28, py + 270);

  const lit = rolls.filter(function (r) { return r.on; }).length;
  const cab = targets.filter(function (t) { return t.hit; }).length;
  ctx.fillStyle = "#e7fbf6";
  ctx.fillText("航线  " + lit + "/3      三舱  " + cab + "/3      缓冲器等级  " + (bumperRank + 1) + "/4", px + 28, py + 296);

  if (msgT > 0) {
    roundRect(px + 18, py + 316, 360, 40, 6);
    ctx.fillStyle = "rgba(23,96,107,0.55)";
    ctx.fill();
    ctx.fillStyle = "#f4ca78";
    ctx.font = "bold 14px sans-serif";
    ctx.fillText(msg, px + 32, py + 342);
  }
  if (state === "over") {
    ctx.fillStyle = "#6fe8df";
    ctx.font = "bold 20px sans-serif";
    ctx.textAlign = "right";
    ctx.fillText("探测结束", px + 382, py + 342);
    ctx.textAlign = "left";
  }
}

function draw() {
  ctx.fillStyle = "#05080e";
  ctx.fillRect(0, 0, W, H);
  const ox = (Math.random() * 2 - 1) * shake;
  const oy = (Math.random() * 2 - 1) * shake;
  ctx.save();
  ctx.translate(ox, oy);

  if (tableImg.complete && tableImg.naturalWidth) {
    ctx.drawImage(tableImg, TABLE.x, TABLE.y, TABLE.w, TABLE.h);
  } else {
    ctx.fillStyle = "#13242e";
    ctx.fillRect(TABLE.x, TABLE.y, TABLE.w, TABLE.h);
  }
  if (flashAll > 0) {
    ctx.fillStyle = "rgba(111,232,223," + (flashAll * 0.22) + ")";
    ctx.fillRect(TABLE.x, TABLE.y, TABLE.w, TABLE.h);
  }

  for (let i = 0; i < inserts.length; i++) {
    const n = inserts[i];
    const pulse = 0.45 + 0.55 * Math.abs(Math.sin(clock * 3 + i));
    ctx.globalAlpha = pulse;
    ctx.beginPath();
    ctx.arc(n.p.x, n.p.y, n.r + 2, 0, TAU);
    ctx.fillStyle = n.hue;
    ctx.shadowColor = n.hue;
    ctx.shadowBlur = 8;
    ctx.fill();
    ctx.shadowBlur = 0;
  }
  ctx.globalAlpha = 1;

  for (let i = 0; i < rolls.length; i++) {
    const r = rolls[i];
    ctx.beginPath();
    ctx.arc(r.p.x, r.p.y, r.r + 2, 0, TAU);
    ctx.fillStyle = r.on ? "rgba(111,232,223,0.45)" : "rgba(0,0,0,0.25)";
    ctx.fill();
    ctx.beginPath();
    ctx.arc(r.p.x, r.p.y, r.r, 0, TAU);
    ctx.fillStyle = r.on ? "#6fe8df" : "#1b333c";
    ctx.fill();
    ctx.fillStyle = r.on ? "#082018" : "#e7fbf6";
    ctx.font = "bold 10px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(r.ch, r.p.x, r.p.y + 3);
  }

  for (let i = 0; i < targets.length; i++) {
    const t = targets[i];
    ctx.fillStyle = t.hit ? "rgba(42,74,82,0.55)" : "#e8843a";
    ctx.fillRect(t.x, t.y, t.w, t.h);
    ctx.strokeStyle = "#f4ca78";
    ctx.strokeRect(t.x, t.y, t.w, t.h);
    ctx.fillStyle = "#fff6e8";
    ctx.font = "bold 9px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(t.name, t.x + t.w / 2, t.y + 16);
  }

  for (let i = 0; i < slings.length; i++) {
    if (slings[i].flash > 0) {
      ctx.beginPath();
      ctx.arc(slings[i].x, slings[i].y, 22, 0, TAU);
      ctx.fillStyle = "rgba(255,255,255,0.28)";
      ctx.fill();
    }
  }
  for (let i = 0; i < bumpers.length; i++) drawMushroom(bumpers[i]);
  drawFlipper(flipL);
  drawFlipper(flipR);
  drawBall();

  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.t -= 0.016;
    p.x += (p.vx || 0) * 0.016;
    p.y += (p.vy || 0) * 0.016;
    if (p.vx) { p.vx *= 0.96; p.vy *= 0.96; }
    if (p.t <= 0) { particles.splice(i, 1); continue; }
    ctx.globalAlpha = Math.max(0, p.t * 1.4);
    if (p.text) {
      ctx.fillStyle = p.hue;
      ctx.font = "bold 12px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(p.text, p.x, p.y);
    } else {
      ctx.fillStyle = p.hue;
      ctx.fillRect(p.x, p.y, p.r, p.r);
    }
    ctx.globalAlpha = 1;
  }
  ctx.restore();
  drawHud();
}

function tick(now) {
  const dt = Math.min(0.05, (now - last) / 1000 || STEP);
  last = now;
  clock += dt;
  accu += dt;
  if (accu > 0.2) accu = 0.2;
  while (accu >= STEP) {
    for (let i = 0; i < SUB; i++) physics(STEP / SUB);
    accu -= STEP;
  }
  shake *= 0.86;
  flashAll = Math.max(0, flashAll - dt);
  comboT -= dt;
  if (comboT <= 0) combo = Math.max(1, combo - dt * 0.7);
  msgT -= dt;
  for (let i = 0; i < bumpers.length; i++) {
    if (bumpers[i].flash > 0) bumpers[i].flash -= dt;
    if (bumpers[i].cool > 0) bumpers[i].cool -= dt;
  }
  for (let i = 0; i < slings.length; i++) if (slings[i].flash > 0) slings[i].flash -= dt;
  if (ball && ball.live) {
    trail.push({ x: ball.x, y: ball.y });
    if (trail.length > 9) trail.shift();
  }
  draw();
  requestAnimationFrame(tick);
}

function placeZhihuCard() {
  const card = document.getElementById("hudZhihu");
  const stage = document.getElementById("stage");
  if (!card || !cvs || !stage) return;
  const s = stage.getBoundingClientRect();
  const r = cvs.getBoundingClientRect();
  const sx = r.width / W;
  const sy = r.height / H;
  const compact = document.documentElement.classList.contains("is-touch") || document.documentElement.classList.contains("is-portrait") || window.innerWidth <= 720;
  if (compact) {
    const width = Math.min(368 * sx, Math.max(120, s.width - 16));
    let left = r.left - s.left + 562 * sx;
    let top = r.top - s.top + 372 * sy;
    left = Math.max(8, Math.min(left, s.width - width - 8));
    top = Math.max(8, Math.min(top, s.height - 56));
    card.style.left = left + "px";
    card.style.top = top + "px";
    card.style.width = width + "px";
    card.style.height = "auto";
    return;
  }
  card.style.left = (r.left - s.left + 562 * sx) + "px";
  card.style.top = (r.top - s.top + 372 * sy) + "px";
  card.style.width = (368 * sx) + "px";
  card.style.height = (148 * sy) + "px";
}

function bindHold(el, name) {
  if (!el) return;
  const down = function (e) { e.preventDefault(); holds[name] = true; };
  const up = function (e) { e.preventDefault(); holds[name] = false; };
  el.addEventListener("pointerdown", down);
  el.addEventListener("pointerup", up);
  el.addEventListener("pointerleave", up);
  el.addEventListener("pointercancel", up);
}
function layout() {
  const touch = window.matchMedia("(any-pointer: coarse)").matches || navigator.maxTouchPoints > 0 || "ontouchstart" in window;
  const viewport = window.visualViewport;
  const width = viewport && viewport.width || window.innerWidth;
  const height = viewport && viewport.height || window.innerHeight;
  const root = document.documentElement;
  root.classList.toggle("is-touch", touch);
  root.classList.toggle("is-portrait", height > width);
  root.style.setProperty("--app-height", height + "px");
  placeZhihuCard();
}
function bind() {
  layout();
  window.addEventListener("resize", layout);
  if (window.visualViewport) window.visualViewport.addEventListener("resize", layout);
  requestAnimationFrame(placeZhihuCard);
  window.addEventListener("keydown", function (e) {
    if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", " "].includes(e.key)) e.preventDefault();
    keys.add(e.key);
    if (e.key === "r" || e.key === "R") restart();
    if (e.code === "KeyX" || e.key === "x" || e.key === "X") { e.preventDefault(); applyNudge(); }
    if (e.key === "Escape") location.href = "./index.html";
  });
  window.addEventListener("keyup", function (e) { keys.delete(e.key); });
  document.getElementById("restartBtn").onclick = restart;
  bindHold(document.getElementById("padLeft"), "left");
  bindHold(document.getElementById("padRight"), "right");
  bindHold(document.getElementById("padLaunch"), "launch");
  const padNudge = document.getElementById("padNudge");
  if (padNudge) {
    padNudge.addEventListener("pointerdown", function (e) {
      e.preventDefault();
      applyNudge();
    });
  }
  cvs.addEventListener("pointerdown", function (e) {
    const rect = cvs.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width * W;
    if (x > 540) return;
    if (x > TABLE.x + TABLE.w * 0.82) holds.launch = true;
    else if (x < TABLE.x + TABLE.w * 0.48) holds.left = true;
    else holds.right = true;
  });
  const clearH = function () { holds.left = holds.right = holds.launch = false; };
  window.addEventListener("pointerup", clearH);
  window.addEventListener("pointercancel", clearH);
}

buildTable();
spawnBall(true);
setHi();
bind();
last = performance.now();
requestAnimationFrame(tick);
})();
