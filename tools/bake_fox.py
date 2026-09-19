# -*- coding: utf-8 -*-
"""Pixelize Zhihu Liu Kanshan: white arctic fox, black snout, stick limbs."""
from collections import deque
from PIL import Image

REF = r"C:\Users\wangx\.cursor\projects\c-moonexplorer\assets\c__Users_wangx_AppData_Roaming_Cursor_User_workspaceStorage_9561ec3409ebec152a1d5ecd0c52f344_images_zhihu-1a8c8ea4-cd80-478c-8602-2bc0f223d7dc.jpg"
PREVIEW = r"C:\moonexplorer\assets\liukanshan.png"
SHEET = r"C:\moonexplorer\assets\chars.png"

WHITE = (255, 255, 255, 255)
SOFT = (240, 244, 248, 255)
INK = (16, 18, 22, 255)
NOTE = (90, 168, 240, 255)
NOTE_D = (48, 118, 210, 255)
RIM = (150, 160, 172, 255)
CLEAR = (0, 0, 0, 0)

FOX_W, FOX_H = 52, 60


def is_blue_bg(r, g, b):
    mx = max(r, g, b)
    if mx < 30:
        return False
    if b >= mx and b - r >= 20 and b - g >= 6 and r < 190:
        return True
    if b > 130 and r < 120 and g < 180:
        return True
    return False


def extract_fox():
    src = Image.open(REF).convert("RGBA")
    w, h = src.size
    # fox stands on the right; drop the monitor
    crop = src.crop((int(w * 0.34), int(h * 0.06), int(w * 0.99), int(h * 0.99)))
    px = crop.load()
    cw, ch = crop.size
    for y in range(ch):
        for x in range(cw):
            r, g, b, a = px[x, y]
            if is_blue_bg(r, g, b):
                px[x, y] = CLEAR

    # flood remaining bg from every edge
    seen = set()
    q = deque()
    for x in range(cw):
        q.append((x, 0))
        q.append((x, ch - 1))
    for y in range(ch):
        q.append((0, y))
        q.append((cw - 1, y))
    while q:
        x, y = q.popleft()
        if (x, y) in seen or not (0 <= x < cw and 0 <= y < ch):
            continue
        seen.add((x, y))
        r, g, b, a = px[x, y]
        if a == 0 or is_blue_bg(r, g, b) or (b > 100 and r < 160 and b >= g):
            px[x, y] = CLEAR
            for dx, dy in ((-1, 0), (1, 0), (0, -1), (0, 1)):
                q.append((x + dx, y + dy))

    bbox = crop.getbbox()
    fox = crop.crop(bbox).transpose(Image.Transpose.FLIP_LEFT_RIGHT)
    pad = 12
    canvas = Image.new("RGBA", (fox.size[0] + pad * 2, fox.size[1] + pad * 2), CLEAR)
    canvas.paste(fox, (pad, pad), fox)
    return canvas


def quantize_pixel(im, tw, th):
    small = im.resize((tw, th), Image.Resampling.BOX)
    px = small.load()
    for y in range(th):
        for x in range(tw):
            r, g, b, a = px[x, y]
            if a < 50:
                px[x, y] = CLEAR
                continue
            if is_blue_bg(r, g, b) and y < int(th * 0.28):
                px[x, y] = CLEAR
                continue
            if r < 78 and g < 78 and b < 88:
                px[x, y] = INK
            elif b > r + 18 and b > 150 and 80 < r < 210 and y > int(th * 0.32):
                px[x, y] = NOTE_D if r < 90 else NOTE
            elif r > 200 and g > 200 and b > 200:
                px[x, y] = WHITE
            else:
                px[x, y] = SOFT if a > 180 else WHITE
    return small


def clear_face_specks(im):
    px = im.load()
    w, h = im.size
    for y in range(int(h * 0.08), int(h * 0.38)):
        for x in range(int(w * 0.28), int(w * 0.72)):
            if px[x, y][:3] != INK[:3]:
                continue
            n = 0
            for dy in range(-2, 3):
                for dx in range(-2, 3):
                    nx, ny = x + dx, y + dy
                    if 0 <= nx < w and 0 <= ny < h and px[nx, ny][:3] == INK[:3]:
                        n += 1
            if n <= 6:
                px[x, y] = WHITE
    return im


def fat_snout(im):
    """Right-facing black capsule snout — the 刘看山 tell."""
    px = im.load()
    w, h = im.size
    cy = int(h * 0.22)
    right = 0
    for x in range(w):
        if px[x, cy][3] > 0 and px[x, cy][:3] != INK[:3]:
            right = x
    cx = max(int(w * 0.62), right - 1)
    for y in range(cy - 4, cy + 5):
        for x in range(cx - 1, min(w, cx + 12)):
            dx = (x - (cx + 4)) / 7.2
            dy = (y - cy) / 3.6
            if dx * dx + dy * dy <= 1.0 and 0 <= x < w and 0 <= y < h:
                px[x, y] = INK
    glint = min(w - 2, cx + 8)
    if px[glint, cy][:3] == INK[:3]:
        px[glint, cy] = WHITE
    return im


def paint_notebook(im):
    px = im.load()
    w, h = im.size
    x0, y0, nw, nh = int(w * 0.40), int(h * 0.40), 14, 13
    for y in range(y0, y0 + nh):
        for x in range(x0, x0 + nw):
            if not (0 <= x < w and 0 <= y < h):
                continue
            if px[x, y][:3] == INK[:3]:
                continue
            if px[x, y][3] == 0:
                continue
            if x == x0 or y == y0 or x == x0 + nw - 1 or y == y0 + nh - 1:
                px[x, y] = NOTE_D
            else:
                px[x, y] = NOTE
    return im


def soft_rim(im):
    px = im.load()
    w, h = im.size
    extra = []
    for y in range(h):
        for x in range(w):
            if px[x, y][3] == 0 or px[x, y][:3] == INK[:3]:
                continue
            for dx, dy in ((-1, 0), (1, 0), (0, -1), (0, 1)):
                nx, ny = x + dx, y + dy
                if 0 <= nx < w and 0 <= ny < h and px[nx, ny][3] == 0:
                    extra.append((nx, ny))
    for x, y in extra:
        px[x, y] = RIM
    return im


def shift_legs(im, dx):
    out = im.copy()
    px, op = im.load(), out.load()
    w, h = im.size
    y0 = int(h * 0.74)
    for y in range(y0, h):
        for x in range(w):
            op[x, y] = CLEAR
    for y in range(y0, h):
        for x in range(w):
            if px[x, y][3] == 0:
                continue
            nx = x + (dx if x < w * 0.52 else -dx)
            if 0 <= nx < w:
                op[nx, y] = px[x, y]
    return out


def arm_down(im):
    out = im.copy()
    px, op = im.load(), out.load()
    w, h = im.size
    for y in range(0, int(h * 0.36)):
        for x in range(0, int(w * 0.40)):
            if px[x, y][:3] == INK[:3]:
                op[x, y] = CLEAR
    ax, ay = int(w * 0.16), int(h * 0.40)
    for i in range(13):
        x, y = ax, ay + i
        if 0 <= x < w and 0 <= y < h:
            op[x, y] = INK
            if x + 1 < w:
                op[x + 1, y] = INK
    for i in range(5):
        x, y = ax + i, ay + 12
        if 0 <= x < w and 0 <= y < h:
            op[x, y] = INK
    return out


def main():
    raw = extract_fox()
    raw.save(r"C:\moonexplorer\assets\liukanshan-extract.png")
    def finish(im, idle=False):
        im = quantize_pixel(im, FOX_W, FOX_H)
        if idle:
            im = arm_down(im)
        im = clear_face_specks(im)
        im = fat_snout(im)
        im = paint_notebook(im)
        return soft_rim(im)

    point = finish(raw, idle=False)
    idle = finish(raw, idle=True)
    frames = [idle, shift_legs(idle, 2), shift_legs(idle, -2), point]

    preview = Image.new("RGBA", (FOX_W * 4 + 16, FOX_H + 8), (12, 28, 48, 255))
    for i, fr in enumerate(frames):
        preview.paste(fr, (4 + i * (FOX_W + 2), 4), fr)
    # also a large readable still
    big = frames[0].resize((FOX_W * 6, FOX_H * 6), Image.Resampling.NEAREST)
    big.save(PREVIEW, "PNG")
    preview.save(r"C:\moonexplorer\assets\liukanshan-frames.png", "PNG")

    from bake_chars import draw_astro

    step = FOX_W + 4
    sheet = Image.new("RGBA", (max(176, 2 + step * 4), 2 + 56 + 4 + FOX_H + 2), CLEAR)
    for i in range(4):
        draw_astro(sheet, 2 + i * 42, 2, i)
        sheet.paste(frames[i], (2 + i * step, 64), frames[i])
    sheet.save(SHEET, "PNG", optimize=True)
    print("hero", PREVIEW)
    print("frames", r"C:\moonexplorer\assets\liukanshan-frames.png")
    print("sheet", SHEET, sheet.size)
    print("AT.girl = [2, 64, %d, %d, %d]" % (FOX_W, FOX_H, step))


if __name__ == "__main__":
    main()
