# -*- coding: utf-8 -*-
"""Pragmata-accurate pixel protagonists from player.jpg."""
from PIL import Image

OUT = r"C:\moonexplorer\assets\chars.png"

P = {
    "k": (14, 16, 20, 255),
    "n": (38, 44, 52, 255),
    "b": (88, 98, 108, 255),
    "m": (164, 174, 182, 255),
    "a": (210, 218, 224, 255),
    "w": (246, 248, 250, 255),
    "v": (16, 22, 30, 255),
    "u": (48, 70, 92, 255),
    "j": (110, 140, 160, 255),
    "o": (232, 142, 52, 255),
    "p": (176, 90, 28, 255),
    "y": (238, 214, 160, 255),
    "h": (196, 164, 108, 255),
    "d": (142, 112, 70, 255),
    "s": (244, 214, 192, 255),
    "t": (216, 172, 150, 255),
    "c": (32, 78, 172, 255),
    "l": (70, 122, 214, 255),
    "f": (16, 42, 104, 255),
    "i": (36, 42, 50, 255),
    "e": (198, 118, 124, 255),
    "g": (44, 48, 54, 255),
    "z": (252, 240, 200, 255),
    "q": (118, 158, 228, 255),
    "x": (252, 252, 252, 255),
}


def put(im, x, y, c):
    if 0 <= x < im.size[0] and 0 <= y < im.size[1]:
        im.putpixel((x, y), P[c])


def rect(im, x, y, w, h, c):
    for yy in range(h):
        for xx in range(w):
            put(im, x + xx, y + yy, c)


def disc(im, cx, cy, rx, ry, c):
    rx2, ry2 = max(rx, 1) ** 2, max(ry, 1) ** 2
    for y in range(-ry, ry + 1):
        for x in range(-rx, rx + 1):
            if x * x * ry2 + y * y * rx2 <= rx2 * ry2:
                put(im, cx + x, cy + y, c)


def outline_expand(im, x0, y0, w, h):
    px = im.load()
    extra = []
    for y in range(y0, y0 + h):
        for x in range(x0, x0 + w):
            if px[x, y][3] == 0:
                continue
            for dx, dy in ((-1, 0), (1, 0), (0, -1), (0, 1)):
                nx, ny = x + dx, y + dy
                if x0 <= nx < x0 + w and y0 <= ny < y0 + h and px[nx, ny][3] == 0:
                    extra.append((nx, ny))
    ink = P["k"]
    for x, y in extra:
        px[x, y] = ink


def draw_astro(im, ox, oy, frame):
    # Hugh: bulky white EVA, dark visor, orange hardware
    leg = {0: 0, 1: -2, 2: 2, 3: 0}[frame]
    jump = frame == 3

    # backpack
    rect(im, ox + 3, oy + 20, 8, 18, "n")
    rect(im, ox + 4, oy + 21, 6, 16, "b")
    rect(im, ox + 5, oy + 23, 4, 3, "o")
    rect(im, ox + 5, oy + 30, 4, 5, "m")
    rect(im, ox + 6, oy + 32, 2, 2, "a")

    # helmet
    disc(im, ox + 20, oy + 12, 12, 11, "a")
    disc(im, ox + 20, oy + 11, 11, 10, "w")
    rect(im, ox + 12, oy + 4, 16, 6, "w")
    # visor glass
    disc(im, ox + 21, oy + 13, 8, 6, "v")
    rect(im, ox + 16, oy + 10, 12, 8, "v")
    put(im, ox + 18, oy + 11, "u")
    put(im, ox + 19, oy + 11, "j")
    put(im, ox + 20, oy + 12, "u")
    rect(im, ox + 22, oy + 11, 4, 2, "u")
    put(im, ox + 24, oy + 13, "j")
    # helmet plates
    rect(im, ox + 14, oy + 5, 4, 2, "m")
    rect(im, ox + 22, oy + 5, 4, 2, "m")
    # orange latches
    rect(im, ox + 8, oy + 11, 4, 5, "p")
    rect(im, ox + 8, oy + 12, 4, 3, "o")
    rect(im, ox + 28, oy + 11, 4, 5, "p")
    rect(im, ox + 28, oy + 12, 4, 3, "o")
    # neck
    rect(im, ox + 14, oy + 21, 14, 4, "m")
    rect(im, ox + 15, oy + 22, 12, 2, "a")

    # torso
    rect(im, ox + 10, oy + 24, 20, 16, "a")
    rect(im, ox + 11, oy + 25, 18, 14, "w")
    rect(im, ox + 12, oy + 26, 7, 10, "a")
    rect(im, ox + 21, oy + 26, 7, 10, "m")
    rect(im, ox + 16, oy + 28, 8, 5, "p")
    rect(im, ox + 17, oy + 29, 6, 3, "o")
    rect(im, ox + 13, oy + 36, 14, 1, "b")
    put(im, ox + 19, oy + 30, "x")

    # arms
    if jump:
        rect(im, ox + 6, oy + 24, 5, 8, "a")
        rect(im, ox + 29, oy + 23, 5, 8, "a")
        rect(im, ox + 5, oy + 20, 5, 5, "m")
        rect(im, ox + 30, oy + 20, 5, 5, "o")
    else:
        rect(im, ox + 6, oy + 26, 5, 12, "a")
        rect(im, ox + 29, oy + 26, 5, 12, "a")
        rect(im, ox + 6, oy + 37, 5, 3, "m")
        rect(im, ox + 29, oy + 36, 5, 3, "o")

    # legs
    ly = 40 if not jump else 39
    lh = 9 if not jump else 7
    rect(im, ox + 13 + leg, oy + ly, 6, lh, "a")
    rect(im, ox + 21 - leg, oy + ly, 6, lh, "a")
    rect(im, ox + 13 + leg, oy + ly + lh - 3, 7, 4, "g")
    rect(im, ox + 21 - leg, oy + ly + lh - 3, 7, 4, "g")
    rect(im, ox + 13 + leg, oy + ly + lh, 7, 2, "n")
    rect(im, ox + 21 - leg, oy + ly + lh, 7, 2, "n")

    outline_expand(im, ox, oy, 40, 56)


def draw_girl(im, ox, oy, frame):
    # Liu Kanshan: Zhihu arctic fox, white blob, black snout, stick limbs, blue notebook
    leg = {0: 0, 1: -2, 2: 2, 3: 0}[frame]
    point = frame == 3

    disc(im, ox + 18, oy + 20, 13, 15, "a")
    disc(im, ox + 18, oy + 19, 12, 14, "w")
    disc(im, ox + 18, oy + 18, 11, 13, "x")
    disc(im, ox + 16, oy + 24, 7, 8, "a")

    disc(im, ox + 29, oy + 15, 6, 4, "k")
    disc(im, ox + 30, oy + 15, 5, 3, "i")
    put(im, ox + 33, oy + 15, "x")

    rect(im, ox + 20, oy + 22, 9, 12, "c")
    rect(im, ox + 21, oy + 23, 7, 10, "q")
    rect(im, ox + 22, oy + 24, 5, 2, "x")
    rect(im, ox + 21, oy + 27, 7, 1, "l")
    rect(im, ox + 21, oy + 30, 7, 1, "l")
    rect(im, ox + 28, oy + 22, 2, 12, "f")

    if point:
        rect(im, ox + 6, oy + 8, 2, 12, "k")
        rect(im, ox + 4, oy + 7, 8, 2, "k")
        rect(im, ox + 28, oy + 22, 2, 6, "k")
    else:
        rect(im, ox + 5, oy + 20, 2, 10, "k")
        rect(im, ox + 4, oy + 29, 4, 2, "k")
        rect(im, ox + 28, oy + 21, 2, 8, "k")
        rect(im, ox + 28, oy + 28, 4, 2, "k")

    ly = 35
    rect(im, ox + 13 + leg, oy + ly, 2, 10, "k")
    rect(im, ox + 22 - leg, oy + ly, 2, 10, "k")
    rect(im, ox + 12 + leg, oy + ly + 9, 5, 2, "k")
    rect(im, ox + 21 - leg, oy + ly + 9, 5, 2, "k")

    outline_expand(im, ox, oy, 40, 48)


def main():
    im = Image.new("RGBA", (176, 112), (0, 0, 0, 0))
    for i in range(4):
        draw_astro(im, 2 + i * 42, 2, i)
        draw_girl(im, 2 + i * 42, 60, i)
    im.save(OUT, "PNG", optimize=True)
    print("wrote", OUT, im.size)


if __name__ == "__main__":
    main()
