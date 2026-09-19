# -*- coding: utf-8 -*-
"""Bake pixel sprites, copy art, and synthesize offline audio."""
import math
import os
import random
import shutil
import struct
import wave
from PIL import Image

ROOT = r"C:\moonexplorer"
SRC = r"C:\Users\wangx\.cursor\projects\c-moonexplorer\assets"
OUT = os.path.join(ROOT, "assets")
AUD = os.path.join(OUT, "audio")
os.makedirs(AUD, exist_ok=True)

PAL = {
    ".": (0, 0, 0, 0),
    "K": (12, 16, 22, 255),
    "N": (28, 38, 48, 255),
    "B": (46, 64, 78, 255),
    "M": (78, 98, 112, 255),
    "W": (236, 244, 242, 255),
    "G": (186, 204, 200, 255),
    "C": (86, 226, 220, 255),
    "D": (42, 150, 160, 255),
    "O": (232, 132, 52, 255),
    "Y": (244, 206, 112, 255),
    "S": (242, 214, 186, 255),
    "H": (42, 32, 28, 255),
    "P": (92, 64, 48, 255),
    "R": (196, 72, 68, 255),
    "L": (126, 196, 255, 255),
    "A": (18, 90, 110, 255),
    "T": (20, 28, 36, 255),
    "U": (154, 176, 180, 255),
    "F": (255, 255, 255, 255),
    "E": (64, 220, 140, 255),
    "I": (90, 110, 140, 255),
    "X": (255, 90, 70, 255),
}


def blit_str(im, px, py, rows, pal=PAL):
    rows = [r for r in rows.strip("\n").split("\n")]
    p = im.load()
    for y, row in enumerate(rows):
        for x, ch in enumerate(row):
            col = pal.get(ch, (0, 0, 0, 0))
            if col[3] == 0:
                continue
            p[px + x, py + y] = col
    return len(rows[0]), len(rows)


def bake_sprites():
    im = Image.new("RGBA", (256, 128), (0, 0, 0, 0))
    astro = [
        """
....WWWWWW....
...WWWWWWWW...
...WWCCCCWW...
...WWCCCCWW...
...WCCCCCCW...
....WWWWWW....
...WWWOOWWW...
..WWWWOOWWWW..
..WWWWWWWWWW..
..WW.WWWW.WW..
..WW.WWWW.WW..
..WW.WWWW.WW..
...W.WWWW.W...
...WWWWWWWW...
....GW..WG....
....NN..NN....
....NN..NN....
""",
        """
....WWWWWW....
...WWWWWWWW...
...WWCCCCWW...
...WWCCCCWW...
...WCCCCCCW...
....WWWWWW....
...WWWOOWWW...
..WWWWOOWWWW..
..WWWWWWWWWW..
..WW.WWWW.WW..
..WW.WWWW.WW..
...W.WWWW.WW..
...WWWWWW.W...
...WWWWWWWW...
....GW.WG.....
....NN.NN.....
.....N.N......
""",
        """
....WWWWWW....
...WWWWWWWW...
...WWCCCCWW...
...WWCCCCWW...
...WCCCCCCW...
....WWWWWW....
...WWWOOWWW...
..WWWWOOWWWW..
..WWWWWWWWWW..
..WW.WWWW.WW..
..WW.WWWW.WW..
..WW.WWWW.W...
...W.WWWWWW...
...WWWWWWWW...
.....GW.WG....
.....NN.NN....
......N.N.....
""",
        """
....WWWWWW....
...WWWWWWWW...
...WWCCCCWW...
...WWCCCCWW...
...WCCCCCCW...
....WWWWWW....
...WWWOOWWW...
..WWWWOOWWWW..
..WWWWWWWWWW..
..WW.WWWW.WW..
..WW.WWWW.WW..
..WW.WWWW.WW..
...W.WWWW.W...
...WWWWWWWW...
....GW..WG....
...NN....NN...
...N......N...
""",
    ]
    girl = [
        """
...HHHHH...
..HHHHHHH..
..HHSSSHH..
..HSSSSSH..
...SSKSS...
...WWWWW...
..WWCCCWW..
..WWWWWWW..
..W.WWW.W..
..W.WWW.W..
...WWWWW...
...CC.CC...
...NN.NN...
""",
        """
...HHHHH...
..HHHHHHH..
..HHSSSHH..
..HSSSSSH..
...SSKSS...
...WWWWW...
..WWCCCWW..
..WWWWWWW..
..W.WWW.W..
...WWWW.W..
...WWWWW...
...CC.CC...
....N.NN...
""",
        """
...HHHHH...
..HHHHHHH..
..HHSSSHH..
..HSSSSSH..
...SSKSS...
...WWWWW...
..WWCCCWW..
..WWWWWWW..
..W.WWW.W..
..W.WWWW...
...WWWWW...
...CC.CC...
...NN.N....
""",
        """
...HHHHH...
..HHHHHHH..
..HHSSSHH..
..HSSSSSH..
...SSYSS...
...WWWWW...
..WWCCCWW..
..WWWWWWW..
.YW.WWW.WY.
..W.WWW.W..
...WWWWW...
...CC.CC...
...NN.NN...
""",
    ]
    drone_on = """
..OOOOOOOOOO..
.OOBBBBBBBBOO.
OOBCCCCCCCBBO.
OBBCCLCCCLCBBO
OBBBCCCCCCBBBO
.OOBBBBBBBOO..
..O.N....N.O..
....NN..NN....
"""
    drone_off = """
..MMMMMMMMMM..
.MMBBBBBBBBMM.
MMBNNNNNNNBBM.
MBBBNNNNBNBBBM
MBBBBNNNNBBBBM
.MMBBBBBBBMM..
..M.K....K.M..
....KK..KK....
"""
    crystal = """
....L...
...LLL..
..LCCLL.
.LCCCCL.
.LCCCCC.
LLCCCCCL
.LCCCCL.
..LCCL..
...YY...
...NN...
"""
    term = """
.NNNNNNNN.
.NWWWWWW N.
.NCYC.C.CN.
.N......N.
.NCCCCCCN.
.N......N.
.NNNNNNNN.
..NNNNNN..
..N....N..
"""
    tank = """
..GGGG..
.GCCCCG.
.GWWWWG.
.GCCCCG.
.GWWWWG.
.GEEEEG.
..NNNN..
..N..N..
"""
    rover = """
..............WWW.......
...........WWWWWWW......
..........WW.CCC.WW.....
....OOOOOOOOOOOOOOOO....
...OWWWWWWWWWWWWWWWO....
...OWWCCWWWWWWCCWWWO....
....OOOOOOOOOOOOOOOO....
.....NN..........NN.....
....NNNN........NNNN....
"""
    heart = """
.RR.RR.
RRRRRRR
RRRRRRR
.RRRRR.
..RRR..
...R...
"""
    for i, s in enumerate(astro):
        blit_str(im, 2 + i * 18, 2, s)
    for i, s in enumerate(girl):
        blit_str(im, 2 + i * 14, 22, s)
    blit_str(im, 2, 40, drone_on)
    blit_str(im, 22, 40, drone_off)
    blit_str(im, 48, 40, crystal)
    blit_str(im, 60, 40, term)
    blit_str(im, 74, 40, tank)
    blit_str(im, 86, 40, rover)
    blit_str(im, 2, 58, heart)
    path = os.path.join(OUT, "sprites.png")
    im.save(path, "PNG", optimize=True)
    print("sprites", os.path.getsize(path))


def write_wav(path, samples, rate=22050):
    n = len(samples)
    with wave.open(path, "w") as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(rate)
        buf = bytearray()
        for i, s in enumerate(samples):
            delay = samples[max(0, i - 12)]
            L = int(max(-1, min(1, s)) * 28000)
            R = int(max(-1, min(1, delay * 0.85 + s * 0.15)) * 28000)
            buf += struct.pack("<hh", L, R)
        w.writeframes(bytes(buf))
    print(os.path.basename(path), os.path.getsize(path))


def env(t, dur, a=0.02, d=0.12):
    if t < 0 or t > dur:
        return 0
    if t < a:
        return t / a
    if t > dur - d:
        return max(0, (dur - t) / d)
    return 1


def sq(t, f):
    return 0.22 if math.sin(2 * math.pi * f * t) >= 0 else -0.22


def tri(t, f):
    x = (t * f) % 1
    return 0.28 * (4 * abs(x - 0.5) - 1)


def noise(rng):
    return (rng.random() * 2 - 1) * 0.04


def midi(n):
    return 440 * (2 ** ((n - 69) / 12))


def make_bgm(path, seconds, seed, kind):
    rate = 22050
    n = int(rate * seconds)
    rng = random.Random(seed)
    samples = [0.0] * n
    bpm = 86 if kind == "title" else 96 if kind == "explore" else 90
    step = 60 / bpm / 2
    if kind == "title":
        bass = [45, 45, 48, 45, 41, 41, 43, 45]
        lead = [72, 0, 76, 79, 76, 72, 69, 72, 67, 0, 69, 72, 76, 74, 72, 69]
        arp = [60, 64, 67, 72, 67, 64, 60, 67]
    elif kind == "explore":
        bass = [38, 38, 41, 43, 36, 36, 38, 41]
        lead = [66, 69, 74, 69, 66, 62, 64, 66, 69, 0, 66, 62, 57, 62, 66, 69]
        arp = [50, 57, 62, 66, 62, 57, 50, 62]
    else:
        bass = [43, 43, 46, 43, 39, 39, 41, 43]
        lead = [70, 74, 77, 74, 70, 65, 67, 70, 74, 0, 70, 65, 62, 65, 70, 74]
        arp = [58, 62, 65, 70, 65, 62, 58, 65]
    t = 0.0
    i_lead = 0
    i_bass = 0
    i_arp = 0
    while t < seconds + 1:
        b = bass[i_bass % len(bass)]
        a = arp[i_arp % len(arp)]
        l = lead[i_lead % len(lead)]
        dur_b = step * 2
        dur_l = step
        start = int(t * rate)
        for k in range(int(dur_b * rate)):
            tt = k / rate
            idx = start + k
            if idx >= n:
                break
            e = env(tt, dur_b, 0.01, 0.2)
            samples[idx] += tri(tt, midi(b)) * 0.45 * e
            samples[idx] += tri(tt, midi(b) * 2) * 0.12 * e
        start2 = int(t * rate)
        if l:
            for k in range(int(dur_l * rate)):
                tt = k / rate
                idx = start2 + k
                if idx >= n:
                    break
                e = env(tt, dur_l * 0.95, 0.005, 0.18)
                samples[idx] += sq(tt, midi(l)) * 0.28 * e
                samples[idx] += sq(tt, midi(l) * 1.005) * 0.08 * e
        for k in range(int(dur_l * rate)):
            tt = k / rate
            idx = start2 + k
            if idx >= n:
                break
            e = env(tt, dur_l * 0.6, 0.002, 0.1)
            samples[idx] += tri(tt, midi(a)) * 0.16 * e
            if k < 400:
                samples[idx] += noise(rng) * e * 0.6
        t += step
        i_lead += 1
        i_arp += 1
        if i_lead % 2 == 0:
            i_bass += 1
    # soft clip
    for i, s in enumerate(samples):
        samples[i] = math.tanh(s * 1.2) * 0.92
    write_wav(path, samples, rate)


def make_sfx(path, kind):
    rate = 22050
    dur = 0.18 if kind != "win" else 0.7
    n = int(rate * dur)
    rng = random.Random(3)
    samples = [0.0] * n
    for i in range(n):
        t = i / rate
        e = env(t, dur, 0.005, dur * 0.5)
        if kind == "jump":
            f = 420 - t * 180
            samples[i] = sq(t, f) * 0.5 * e
        elif kind == "pickup":
            f = 660 + t * 900
            samples[i] = sq(t, f) * 0.45 * e + tri(t, f * 2) * 0.2 * e
        elif kind == "beam":
            f = 880 - t * 400
            samples[i] = sq(t, f) * 0.35 * e + noise(rng) * 0.25 * e
        elif kind == "ok":
            f = 520 + (t > 0.08) * 180
            samples[i] = tri(t, f) * 0.5 * e
        else:
            f = 330 * (1 + int(t * 6) % 4 * 0.25)
            samples[i] = tri(t, f) * 0.5 * e
    write_wav(path, samples, rate)


def copy_art():
    mapping = {
        "cover.png": "cover.png",
        "bg-surface.png": "bg-surface.png",
        "bg-base.png": "bg-base.png",
        "bg-observatory.png": "bg-observatory.png",
        "bg-stars.png": "bg-stars.png",
        "bg-ridges.png": "bg-ridges.png",
        "props.png": "props.png",
        "tiles.png": "tiles.png",
        "ui-frame.png": "ui-frame.png",
        "char-astro.png": "portrait-astro.png",
        "char-girl.png": "portrait-girl.png",
    }
    for src, dst in mapping.items():
        a = os.path.join(SRC, src)
        b = os.path.join(OUT, dst)
        if os.path.exists(a):
            shutil.copy2(a, b)
            print("copy", dst, os.path.getsize(b))
    # original user cover
    for name in os.listdir(SRC):
        if name.endswith(".jpg") and "cover" in name:
            shutil.copy2(os.path.join(SRC, name), os.path.join(OUT, "cover.jpg"))
            print("copy cover.jpg", os.path.getsize(os.path.join(OUT, "cover.jpg")))
            break


def main():
    copy_art()
    bake_sprites()
    make_bgm(os.path.join(AUD, "bgm-title.wav"), 26, 11, "title")
    make_bgm(os.path.join(AUD, "bgm-explore.wav"), 28, 22, "explore")
    make_bgm(os.path.join(AUD, "bgm-base.wav"), 26, 33, "base")
    for k in ("jump", "pickup", "beam", "ok", "win"):
        make_sfx(os.path.join(AUD, "sfx-%s.wav" % k), k)
    total = 0
    for dp, _, fs in os.walk(ROOT):
        if "tools" in dp or ".git" in dp:
            continue
        for f in fs:
            if f.endswith(".zip"):
                continue
            total += os.path.getsize(os.path.join(dp, f))
    print("TOTAL_BYTES", total, "MB", round(total / 1048576, 2))


if __name__ == "__main__":
    main()
