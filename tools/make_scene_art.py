#!/usr/bin/env python3
"""
Painterly backdrops for the Mimbleton walk-in scenes.

For each habitat this writes two wide images into assets/world/scenes/:
  <id>-far.webp  opaque sky + distant land (parallax 0.28)
  <id>-mid.webp  transparent middle ground  (parallax 0.60)
The scene engine (assets/js/mimbleton-scenes.js) swaps them in over its drawn layers.
They are made with a brush-stroke renderer (layered dabs, rim light, canvas grain), so any of them can be
replaced later by hand-painted or illustrated art of the same size and name, with no code changes.

Run:  python3 tools/make_scene_art.py [scene-id ...]
"""
import math, random, sys, os
import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageChops

K = 1.5                       # pixels per scene unit
FW, MW, H = 2200, 2800, 900   # far width, mid width, height (scene units)
OUT = os.path.join(os.path.dirname(__file__), '..', 'assets', 'world', 'scenes')


def hexc(h):
    h = h.lstrip('#'); return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4))


def mix(a, b, t):
    return tuple(int(a[i] + (b[i] - a[i]) * t) for i in range(3))


class Layer:
    def __init__(self, wu, seed=1):
        self.w, self.h = int(wu * K), int(H * K)
        self.im = Image.new('RGBA', (self.w, self.h), (0, 0, 0, 0))
        self.rng = random.Random(seed)
        self.np = np.random.default_rng(seed)

    # ----- masks (scene units in, pixels out)
    def mask(self):
        return Image.new('L', (self.w, self.h), 0)

    def poly(self, pts, blur=0):
        m = self.mask(); ImageDraw.Draw(m).polygon([(x * K, y * K) for x, y in pts], fill=255)
        return m.filter(ImageFilter.GaussianBlur(blur * K)) if blur else m

    def shapes(self, items, blur=0):
        m = self.mask(); d = ImageDraw.Draw(m)
        for it in items:
            if it[0] == 'c': _, x, y, r = it; d.ellipse([(x - r) * K, (y - r) * K, (x + r) * K, (y + r) * K], fill=255)
            elif it[0] == 'e': _, x, y, rx, ry = it; d.ellipse([(x - rx) * K, (y - ry) * K, (x + rx) * K, (y + ry) * K], fill=255)
            elif it[0] == 'r': _, x0, y0, x1, y1 = it; d.rounded_rectangle([x0 * K, y0 * K, x1 * K, y1 * K], radius=min(x1 - x0, y1 - y0) * K / 2.5, fill=255)
            elif it[0] == 'p': d.polygon([(x * K, y * K) for x, y in it[1]], fill=255)
        return m.filter(ImageFilter.GaussianBlur(blur * K)) if blur else m

    def ridge(self, base, amp, seed, width, bottom=H + 20, phase=0.0, scale=1.0):
        r = random.Random(seed); fr = [(r.uniform(.0016, .0032) * scale, r.uniform(.5, 1) * amp, r.uniform(0, 6.28)) for _ in range(3)]
        pts = [(0, bottom)]
        for x in range(0, int(width) + 24, 24):
            y = base + sum(a * math.sin(x * f + p + phase) for f, a, p in fr); pts.append((x, y))
        pts.append((width, bottom)); return self.poly(pts)

    # ----- painting
    def fill(self, mask, col, alpha=1.0):
        m = mask.point(lambda v: int(v * alpha)) if alpha < 1 else mask
        self.im.alpha_composite(Image.merge('RGBA', (*[Image.new('L', mask.size, c) for c in col], m)))

    def paint(self, mask, base, pal, size=14, dens=1.0, alpha=(70, 140), soft=0.8, angle=(-.4, .4), seg=1.8):
        self.fill(mask.filter(ImageFilter.GaussianBlur(soft * K)) if soft else mask, base)
        arr = np.array(mask)[::6, ::6] > 128; ys, xs = np.nonzero(arr)
        if len(xs) == 0: return
        n = int(len(xs) * 36 / (size * K) ** 2 * 1.6 * dens)
        dab = Image.new('RGBA', mask.size, (0, 0, 0, 0)); d = ImageDraw.Draw(dab); r = self.rng
        idx = self.np.integers(0, len(xs), n)
        for i in idx:
            x = xs[i] * 6 + r.random() * 6; y = ys[i] * 6 + r.random() * 6
            c = pal[r.randrange(len(pal))]; j = r.uniform(-14, 14); c = tuple(max(0, min(255, int(v + j))) for v in c)
            a = r.uniform(*angle); ln = size * K * r.uniform(.7, seg) / 2; wd = size * K * r.uniform(.28, .5)
            ca, sa = math.cos(a), math.sin(a); pts = []
            for t in range(10):
                th = t * math.pi / 5; ex, ey = math.cos(th) * ln, math.sin(th) * wd
                pts.append((x + ex * ca - ey * sa, y + ex * sa + ey * ca))
            d.polygon(pts, fill=c + (r.randint(*alpha),))
        dab = dab.filter(ImageFilter.GaussianBlur(.5 * K))
        al = ImageChops.multiply(dab.getchannel('A'), mask); dab.putalpha(al); self.im.alpha_composite(dab)

    def rim(self, mask, col, dx=-6, dy=-8, blur=3, alpha=.8):
        sh = ImageChops.offset(mask, int(dx * K), int(dy * K)); edge = ImageChops.subtract(mask, sh)
        edge = edge.filter(ImageFilter.GaussianBlur(blur * K)); edge = ImageChops.multiply(edge, mask.filter(ImageFilter.GaussianBlur(1)))
        self.fill(edge, col, alpha)

    def shade(self, mask, col, dx=10, dy=14, blur=5, alpha=.5):
        sh = ImageChops.offset(mask, int(dx * K), int(dy * K)); edge = ImageChops.subtract(mask, sh)
        edge = ImageChops.multiply(edge.filter(ImageFilter.GaussianBlur(blur * K)), mask)
        self.fill(edge, col, alpha)

    def glow(self, x, y, r, col, alpha=.5):
        m = self.shapes([('c', x, y, r * .45)], blur=r * .5); self.fill(m, col, alpha)

    def haze(self, y0, y1, col, a0=0, a1=.7):
        g = np.zeros((self.h, self.w), np.uint8); ys = np.arange(self.h)
        t = np.clip((ys / K - y0) / max(1, (y1 - y0)), 0, 1); g[:] = ((a0 + (a1 - a0) * t) * 255)[:, None]
        self.fill(Image.fromarray(g, 'L'), col)

    def gradient(self, stops):
        g = np.zeros((self.h, self.w, 3), np.float32); ys = np.linspace(0, 1, self.h)
        cols = [hexc(c) for _, c in stops]; pos = [p for p, _ in stops]
        for ch in range(3): g[:, :, ch] = np.interp(ys, pos, [c[ch] for c in cols])[:, None]
        self.im = Image.fromarray(g.astype(np.uint8), 'RGB').convert('RGBA')

    def rays(self, xs, col, alpha=.18, wtop=60, wbot=200, y1=820, lean=160):
        for x in xs:
            m = self.poly([(x, -20), (x + wtop, -20), (x + wtop + lean + wbot, y1), (x + lean, y1)], blur=14)
            self.fill(m, col, alpha)

    def stars(self, n, y1, col=(255, 255, 255)):
        d = ImageDraw.Draw(self.im, 'RGBA'); r = self.rng
        for _ in range(n):
            x, y = r.uniform(0, self.w), r.uniform(0, y1 * K); s = r.uniform(1.2, 3.4) * K / 1.5
            d.ellipse([x - s, y - s, x + s, y + s], fill=col + (r.randint(120, 255),))

    def finish(self, grain=6, vignette=0.0):
        a = np.array(self.im).astype(np.float32); h, w = a.shape[:2]
        n = self.np.normal(0, grain, (h, w, 1)).astype(np.float32)
        yy, xx = np.mgrid[0:h, 0:w]; weave = (np.sin(xx / 1.7) + np.sin(yy / 1.9)) * 1.6
        a[:, :, :3] += n + weave[:, :, None]
        if vignette:
            v = 1 - vignette * (((xx / w - .5) ** 2 + (yy / h - .5) ** 2) ** .8)
            a[:, :, :3] *= v[:, :, None]
        self.im = Image.fromarray(np.clip(a, 0, 255).astype(np.uint8), 'RGBA')

    def save(self, name, opaque=False):
        im = self.im.convert('RGB') if opaque else self.im
        os.makedirs(OUT, exist_ok=True); p = os.path.join(OUT, name)
        im.save(p, 'WEBP', quality=80, method=5); return os.path.getsize(p) // 1024


def cloud_puffs(L, x, y, s, col=(255, 255, 255), shade=(210, 225, 245), n=7):
    items = []
    for i in range(n):
        items.append(('e', x + (i - n / 2) * 34 * s + L.rng.uniform(-8, 8), y + L.rng.uniform(-14, 10) * s, 56 * s * L.rng.uniform(.7, 1.1), 40 * s * L.rng.uniform(.7, 1.1)))
    items.append(('e', x, y + 16 * s, n * 26 * s, 24 * s)); m = L.shapes(items, blur=2)
    L.paint(m, col, [col, mix(col, shade, .35), mix(col, (255, 255, 255), .4)], size=18, dens=.7, alpha=(70, 130)); L.shade(m, shade, dy=12, dx=4, alpha=.45); L.rim(m, (255, 255, 255), alpha=.6)


def tree(L, x, base, s, trunk, c1, c2, c3, rim=None, shade=(0, 0, 0)):
    r = L.rng
    tm = L.poly([(x - 14 * s, base), (x - 9 * s, base - 140 * s), (x + 9 * s, base - 140 * s), (x + 14 * s, base)])
    L.paint(tm, trunk, [trunk, mix(trunk, (0, 0, 0), .25), mix(trunk, (255, 255, 255), .15)], size=8, angle=(1.3, 1.8), seg=2.4)
    cr = [('c', x - 54 * s, base - 160 * s, 66 * s), ('c', x + 52 * s, base - 168 * s, 72 * s), ('c', x, base - 216 * s, 80 * s), ('c', x - 20 * s, base - 176 * s, 54 * s), ('c', x + 62 * s, base - 120 * s, 40 * s)]
    cm = L.shapes(cr, blur=1.5)
    L.paint(cm, c1, [c1, c2, c3, mix(c1, c3, .5)], size=15, dens=1.0, alpha=(80, 150))
    # darker belly and bright top
    L.shade(cm, mix(c2, (0, 0, 0), .35), dx=14, dy=20, blur=9, alpha=.55)
    hl = L.shapes([('c', x - 34 * s, base - 236 * s, 40 * s), ('c', x + 30 * s, base - 200 * s, 34 * s), ('c', x - 70 * s, base - 176 * s, 30 * s)], blur=10 * s)
    L.paint(ImageChops.multiply(hl, cm), mix(c3, (255, 255, 255), .1), [c3, mix(c3, (255, 255, 230), .4)], size=11, dens=.8, alpha=(60, 120), soft=6)
    if rim: L.rim(cm, rim, dx=-10, dy=-14, blur=5, alpha=.8)
    return cm


# ───────────────────────── scenes ─────────────────────────
def nesting_tree():
    far = Layer(FW, 11); far.gradient([(0, '#ffcf98'), (.5, '#ffeec2'), (1, '#dff2bd')])
    far.glow(1050, 230, 520, (255, 246, 196), .8); far.glow(1050, 230, 220, (255, 252, 226), .9)
    for i in range(9):
        x = 60 + i * 250 + far.rng.uniform(-40, 40); w = far.rng.uniform(70, 120)
        m = far.shapes([('r', x, 20, x + w, 940)], blur=3)
        far.paint(m, (172, 202, 146), [(165, 196, 138), (182, 210, 156), (150, 184, 128)], size=16, angle=(1.4, 1.7), seg=3, alpha=(60, 120)); far.fill(m, (255, 240, 200), .35)
    far.paint(far.ridge(560, 70, 5, FW), (186, 218, 156), [(176, 210, 146), (198, 226, 168), (160, 196, 130)], size=18)
    far.haze(300, 760, (255, 238, 196), 0, .55); far.rays([200, 700, 1250, 1750], (255, 244, 190), .16, lean=140)
    far.finish(5, .15)
    mid = Layer(MW, 12)
    mid.paint(mid.ridge(610, 70, 8, MW), (112, 168, 98), [(104, 160, 92), (128, 182, 108), (92, 148, 86)], size=16)
    for i in range(11):
        x = 90 + i * 270 + mid.rng.uniform(-40, 40); s = mid.rng.uniform(1.0, 1.5)
        cm = tree(mid, x, 700 + mid.rng.uniform(-10, 24), s, (110, 78, 54), (100, 164, 104), (78, 140, 96), (140, 196, 118), rim=(255, 240, 170))
    mid.rays([300, 1000, 1700, 2300], (255, 244, 188), .14, lean=170)
    for x in (400, 1200, 2000, 2600):  # hanging vines
        for k in range(3):
            xx = x + k * 26; m = mid.poly([(xx, 0), (xx + 4, 0), (xx + 12, 330 - k * 40), (xx + 4, 340 - k * 40)]); mid.paint(m, (66, 128, 86), [(58, 120, 78), (78, 142, 96)], size=6, angle=(1.4, 1.7))
    ground = mid.ridge(724, 16, 3, MW); mid.paint(ground, (108, 150, 78), [(98, 142, 70), (124, 168, 88), (88, 130, 64)], size=14, dens=1.2)
    mid.haze(560, 780, (255, 240, 196), 0, .22); mid.finish(5)
    return far, mid


def feelings_forest():
    far = Layer(FW, 21); far.gradient([(0, '#a9e2ef'), (.55, '#dccfff'), (1, '#ffdfee')])
    far.glow(420, 220, 460, (255, 255, 255), .55)
    for x, y, s in [(250, 190, 1.6), (900, 130, 1.2), (1500, 230, 1.7), (1950, 150, 1.1)]: cloud_puffs(far, x, y, s)
    far.paint(far.ridge(500, 110, 2, FW), (196, 208, 240), [(186, 200, 236), (206, 214, 246), (176, 192, 230)], size=20)
    far.paint(far.ridge(580, 80, 4, FW), (170, 214, 210), [(162, 208, 204), (182, 222, 216), (150, 198, 196)], size=18)
    far.haze(380, 780, (255, 240, 250), 0, .5); far.finish(5, .12)
    mid = Layer(MW, 22); cols = [((255, 158, 194), (255, 122, 168), (255, 200, 224)), ((255, 210, 122), (245, 178, 61), (255, 232, 168)), ((143, 214, 255), (90, 184, 240), (190, 232, 255)), ((183, 155, 255), (146, 114, 232), (214, 198, 255)), ((141, 230, 181), (88, 201, 140), (186, 245, 212))]
    mid.paint(mid.ridge(630, 60, 6, MW), (150, 206, 168), [(142, 200, 160), (166, 216, 180)], size=16)
    for i in range(12):
        c = cols[i % 5]; x = 100 + i * 235 + mid.rng.uniform(-30, 30); s = mid.rng.uniform(.8, 1.2)
        tree(mid, x, 690 + mid.rng.uniform(-8, 18), s, (126, 94, 112), c[0], c[1], c[2], rim=(255, 255, 255))
    for x in range(120, MW, 330):
        m = mid.shapes([('e', x, 706, 70, 20)], blur=2); mid.paint(m, (255, 255, 255), [(255, 240, 250), (255, 220, 240)], size=8, alpha=(50, 90))
    g = mid.ridge(726, 14, 9, MW); mid.paint(g, (120, 196, 140), [(108, 188, 130), (140, 208, 150), (96, 176, 122)], size=14, dens=1.2)
    mid.haze(560, 780, (255, 244, 252), 0, .2); mid.finish(5)
    return far, mid


def quiet_caves():
    far = Layer(FW, 31); far.gradient([(0, '#171843'), (.6, '#2f3a78'), (1, '#4a5a9a')])
    far.stars(90, 520); far.glow(1100, 560, 520, (150, 130, 255), .5)
    for i in range(14):
        x = i * 165 + far.rng.uniform(-30, 30); hgt = far.rng.uniform(130, 340)
        m = far.poly([(x - 50, -20), (x + 50, -20), (x + far.rng.uniform(-8, 8), hgt)], blur=1.5)
        far.paint(m, (28, 30, 82), [(24, 26, 74), (36, 38, 96), (20, 22, 64)], size=14, angle=(1.3, 1.8), seg=3); far.rim(m, (120, 110, 220), dx=-4, dy=0, blur=2, alpha=.5)
    far.paint(far.ridge(540, 110, 3, FW), (46, 54, 118), [(40, 48, 110), (56, 66, 134), (34, 42, 98)], size=18)
    far.haze(380, 800, (130, 110, 240), 0, .35); far.finish(6, .25)
    mid = Layer(MW, 32)
    mid.paint(mid.ridge(600, 90, 5, MW), (54, 62, 132), [(48, 56, 124), (66, 76, 148), (40, 48, 110)], size=16)
    for x in (480, 1350, 2150):  # arches
        m = mid.shapes([('r', x - 170, 330, x + 170, 800), ('e', x, 380, 170, 140)], blur=1); inner = mid.shapes([('r', x - 120, 380, x + 120, 800), ('e', x, 420, 120, 110)], blur=1)
        mid.paint(m, (22, 24, 70), [(20, 22, 64), (30, 32, 84)], size=14); mid.rim(m, (150, 130, 255), dx=-8, dy=-10, alpha=.8)
        mid.paint(inner, (96, 84, 190), [(86, 76, 178), (112, 98, 210), (74, 64, 160)], size=12, alpha=(60, 110)); mid.glow(x, 600, 260, (170, 150, 255), .45)
    cc = [(260, '#ff9ee6'), (900, '#9ee6ff'), (1750, '#b79bff'), (2500, '#8fffd0'), (2680, '#ffe27a')]
    for x, c in cc:
        col = hexc(c)
        for k in range(3):
            xx = x + k * 36 - 36; h = 120 + k * 40 - abs(k - 1) * 30
            m = mid.poly([(xx - 26, 730), (xx - 12, 730 - h * .65), (xx + 2, 730 - h), (xx + 18, 730 - h * .62), (xx + 30, 730)], blur=.5)
            mid.paint(m, col, [col, mix(col, (255, 255, 255), .4), mix(col, (60, 40, 120), .3)], size=8, angle=(1.3, 1.8)); mid.rim(m, (255, 255, 255), alpha=.85)
        mid.glow(x, 640, 220, col, .45)
    g = mid.ridge(736, 14, 8, MW); mid.paint(g, (40, 46, 108), [(34, 40, 98), (50, 58, 124)], size=14)
    mid.haze(520, 790, (110, 100, 220), 0, .25); mid.finish(6)
    return far, mid


def firefly_meadow():
    far = Layer(FW, 41); far.gradient([(0, '#322f6e'), (.4, '#c9709c'), (.78, '#ffb97e'), (1, '#ffe7a6')])
    far.stars(40, 300); far.glow(1050, 520, 640, (255, 232, 160), .8); far.glow(1050, 520, 190, (255, 248, 214), .95)
    for x, y, w in [(300, 300, 520), (1500, 380, 460), (850, 230, 380)]:
        m = far.shapes([('e', x, y, w / 2, 20), ('e', x + 60, y + 18, w / 2.6, 16)], blur=6); far.paint(m, (255, 168, 150), [(255, 150, 150), (255, 190, 160), (232, 130, 160)], size=12, alpha=(50, 100), angle=(-.05, .05), seg=3)
    far.paint(far.ridge(580, 80, 2, FW), (126, 106, 168), [(118, 98, 160), (138, 118, 178), (108, 90, 150)], size=18)
    far.paint(far.ridge(640, 70, 7, FW), (104, 90, 152), [(96, 82, 144), (116, 100, 164)], size=18)
    far.haze(480, 800, (255, 200, 150), 0, .45); far.finish(5, .15)
    mid = Layer(MW, 42)
    h1 = mid.ridge(650, 60, 5, MW); mid.paint(h1, (84, 138, 120), [(76, 130, 112), (96, 152, 130), (68, 120, 104)], size=16); mid.rim(h1, (255, 200, 130), dx=8, dy=-8, alpha=.7)
    for x in range(160, MW, 420):
        tree(mid, x + mid.rng.uniform(-60, 60), 668, mid.rng.uniform(.6, .9), (74, 58, 70), (64, 112, 104), (50, 96, 94), (90, 140, 120), rim=(255, 196, 120))
    h2 = mid.ridge(716, 40, 9, MW); mid.paint(h2, (74, 138, 96), [(68, 130, 90), (92, 156, 106), (60, 118, 82)], size=14, dens=1.2); mid.rim(h2, (255, 214, 140), dx=10, dy=-10, alpha=.6)
    mid.haze(560, 780, (255, 190, 140), 0, .28); mid.finish(5)
    return far, mid


def sky_bridge():
    far = Layer(FW, 51); far.gradient([(0, '#4fa9f4'), (.6, '#b8e2ff'), (1, '#fff0d0')])
    far.glow(1500, 200, 560, (255, 250, 214), .9); far.glow(1500, 200, 160, (255, 255, 240), .95)
    far.rays([400, 900, 1500, 1900], (255, 250, 214), .12, lean=-150)
    for x, y, s in [(240, 220, 1.7), (800, 130, 1.3), (1250, 280, 1.9), (1800, 170, 1.4), (2150, 300, 1.5)]: cloud_puffs(far, x, y, s)
    far.paint(far.ridge(700, 90, 3, FW), (150, 188, 232), [(142, 180, 226), (160, 198, 240), (130, 168, 218)], size=20)
    far.haze(480, 860, (255, 240, 220), 0, .5); far.finish(5, .1)
    mid = Layer(MW, 52)
    for x, y, s in [(300, 300, 1.0), (1500, 420, 1.3), (2500, 280, .9)]:  # floating islands
        m = mid.poly([(x - 150 * s, y), (x + 150 * s, y), (x + 90 * s, y + 70 * s), (x + 20 * s, y + 180 * s), (x - 30 * s, y + 90 * s)], blur=1)
        mid.paint(m, (126, 112, 150), [(118, 104, 142), (138, 124, 164), (104, 92, 128)], size=12, angle=(1.0, 1.8)); mid.rim(m, (255, 236, 200), alpha=.7)
        top = mid.shapes([('e', x, y - 6 * s, 160 * s, 26 * s)], blur=1); mid.paint(top, (118, 200, 122), [(108, 192, 114), (134, 214, 134)], size=10)
        tree(mid, x - 40 * s, y - 14 * s, .45 * s, (120, 90, 66), (96, 180, 108), (76, 154, 96), (132, 208, 124), rim=(255, 244, 190))
    for x in (400, 1300, 2200):
        m = mid.poly([(x - 230, 900), (x, 600), (x + 230, 900)], blur=3); mid.paint(m, (132, 160, 214), [(124, 152, 206), (144, 172, 226), (112, 140, 196)], size=18, angle=(1.0, 2.0)); mid.rim(m, (255, 240, 220), alpha=.7)
    for i in range(14):
        x = i * 210 + mid.rng.uniform(-40, 40); cloud_puffs(mid, x, 780 + mid.rng.uniform(-30, 70), mid.rng.uniform(1.4, 2.1), shade=(190, 208, 240))
    mid.finish(4)
    return far, mid


def sparkle_stream():
    far = Layer(FW, 61); far.gradient([(0, '#8fdcff'), (.7, '#e6f6ff'), (1, '#fff5d6')])
    far.glow(520, 230, 480, (255, 255, 255), .6)
    for x, y, s in [(300, 170, 1.4), (1200, 230, 1.1), (1850, 150, 1.5)]: cloud_puffs(far, x, y, s)
    far.paint(far.ridge(500, 110, 3, FW), (164, 208, 232), [(156, 200, 226), (176, 218, 240), (146, 192, 220)], size=20)
    far.paint(far.ridge(580, 80, 6, FW), (132, 200, 192), [(124, 192, 184), (144, 210, 202), (116, 184, 176)], size=18)
    far.haze(400, 780, (240, 250, 255), 0, .45); far.finish(5, .1)
    mid = Layer(MW, 62)
    h = mid.ridge(640, 60, 8, MW); mid.paint(h, (104, 190, 150), [(96, 184, 142), (120, 202, 160), (86, 172, 132)], size=16); mid.rim(h, (255, 250, 200), alpha=.5)
    rock = mid.poly([(560, 700), (610, 400), (900, 380), (960, 700)], blur=2)
    mid.paint(rock, (116, 136, 168), [(108, 128, 160), (128, 148, 180), (98, 118, 150)], size=14, angle=(1.0, 1.9)); mid.rim(rock, (220, 240, 255), alpha=.6)
    fall = mid.poly([(690, 392), (820, 392), (840, 704), (676, 704)], blur=3)
    mid.paint(fall, (200, 242, 255), [(220, 250, 255), (176, 230, 250), (255, 255, 255)], size=10, angle=(1.4, 1.8), seg=3, alpha=(90, 170)); mid.glow(760, 700, 260, (255, 255, 255), .5)
    for i in range(10):
        x = 80 + i * 300 + mid.rng.uniform(-40, 40)
        if 520 < x < 1000: continue
        tree(mid, x, 690 + mid.rng.uniform(-8, 16), mid.rng.uniform(.75, 1.1), (122, 91, 78), (123, 208, 154), (79, 174, 122), (164, 232, 176), rim=(255, 250, 200))
    g = mid.ridge(716, 14, 4, MW); mid.paint(g, (140, 208, 154), [(130, 200, 146), (154, 218, 164)], size=14)
    mid.haze(560, 780, (245, 252, 255), 0, .22); mid.finish(5)
    return far, mid


def tools_shed():
    far = Layer(FW, 71); far.gradient([(0, '#efca94'), (1, '#c99a5f')])
    for i in range(0, FW, 110):  # painted planks
        m = far.shapes([('r', i + 3, -10, i + 107, 940)], blur=.6)
        t = far.rng.uniform(-10, 10); base = (int(222 + t), int(176 + t), int(112 + t))
        far.paint(m, base, [base, mix(base, (150, 100, 56), .3), mix(base, (255, 224, 170), .3)], size=10, angle=(1.45, 1.7), seg=3.5, alpha=(50, 110), soft=0)
        far.shade(m, (120, 80, 44), dx=5, dy=0, alpha=.35)
    for x in (400, 1700):  # windows with a sunny view
        fr = far.shapes([('r', x - 14, 106, x + 374, 434)], blur=1); far.paint(fr, (140, 94, 52), [(132, 88, 48), (152, 104, 60)], size=10, angle=(1.4, 1.7))
        gl = far.shapes([('r', x, 120, x + 360, 420)], blur=.5); far.paint(gl, (196, 232, 252), [(186, 226, 250), (214, 240, 255), (255, 244, 200)], size=14, alpha=(50, 110))
        far.glow(x + 180, 270, 340, (255, 244, 190), .6)
        far.fill(far.poly([(x + 175, 120), (x + 185, 120), (x + 185, 420), (x + 175, 420)]), (140, 94, 52)); far.fill(far.poly([(x, 265), (x + 360, 265), (x + 360, 275), (x, 275)]), (140, 94, 52))
        far.rays([x + 40], (255, 240, 190), .2, wtop=240, wbot=260, y1=900, lean=120)
    far.haze(0, 900, (255, 224, 160), .0, .18); far.finish(5, .3)
    mid = Layer(MW, 72)
    for x in range(200, MW, 520):  # hanging herbs and lanterns
        for k in range(4):
            xx = x + k * 36; m = mid.poly([(xx, 0), (xx + 4, 0), (xx + 6, 170 + k * 26), (xx + 2, 170 + k * 26)]); mid.fill(m, (110, 76, 44))
            leaf = mid.shapes([('e', xx + 2, 200 + k * 26, 16, 40)], blur=1); col = [(104, 164, 90), (128, 182, 100), (150, 120, 70), (112, 150, 84)][k]
            mid.paint(leaf, col, [col, mix(col, (255, 255, 255), .2)], size=6, angle=(1.4, 1.8)); mid.rim(leaf, (255, 240, 180), alpha=.6)
    for x in (900, 2000):
        m = mid.shapes([('r', x - 22, 120, x + 22, 190)], blur=1); mid.paint(m, (255, 214, 120), [(255, 200, 100), (255, 226, 150)], size=8); mid.glow(x, 160, 200, (255, 226, 140), .6)
    for x in (300, 1500, 2600):  # plants on the floor line
        for k in range(5):
            m = mid.poly([(x + k * 14 - 30, 740), (x + k * 24 - 40, 640 - k * 12), (x + k * 20 - 20, 740)], blur=.5); mid.paint(m, (92, 164, 96), [(84, 156, 90), (112, 184, 108)], size=7, angle=(1.2, 1.8))
        pot = mid.shapes([('r', x - 46, 700, x + 46, 760)], blur=1); mid.paint(pot, (190, 100, 70), [(180, 92, 62), (206, 118, 84)], size=9); mid.rim(pot, (255, 210, 160), alpha=.6)
    mid.finish(5)
    return far, mid


def reward_tracker():
    far = Layer(FW, 81); far.gradient([(0, '#9fd8ff'), (.6, '#e3f4ff'), (1, '#fff3d4')])
    far.glow(1100, 220, 520, (255, 252, 220), .7)
    for i, c in enumerate(['#ff8a8a', '#ffb870', '#ffe27a', '#9be6a0', '#8ecbff', '#b79bff']):  # painted rainbow
        r = 640 - i * 26; m = far.shapes([('e', 700, 700, r, r)]); inner = far.shapes([('e', 700, 700, r - 28, r - 28)])
        band = ImageChops.subtract(m, inner); band = ImageChops.multiply(band, far.poly([(0, 0), (FW, 0), (FW, 700), (0, 700)]))
        far.paint(band.filter(ImageFilter.GaussianBlur(3)), hexc(c), [hexc(c), mix(hexc(c), (255, 255, 255), .3)], size=12, alpha=(60, 110), angle=(-.3, .3), soft=0)
    for x, y, s in [(240, 200, 1.5), (1000, 120, 1.3), (1700, 250, 1.6), (2050, 130, 1.1)]: cloud_puffs(far, x, y, s)
    far.paint(far.ridge(540, 100, 3, FW), (176, 214, 238), [(168, 208, 232), (188, 224, 244)], size=20)
    far.haze(400, 800, (245, 252, 255), 0, .4); far.finish(5, .1)
    mid = Layer(MW, 82)
    h = mid.ridge(640, 60, 7, MW); mid.paint(h, (118, 200, 150), [(108, 192, 142), (132, 212, 160), (98, 180, 132)], size=16); mid.rim(h, (255, 250, 200), alpha=.5)
    for i in range(9):
        x = 100 + i * 330 + mid.rng.uniform(-40, 40); tree(mid, x, 690 + mid.rng.uniform(-8, 16), mid.rng.uniform(.7, 1.0), (122, 91, 78), (123, 208, 154), (79, 174, 122), (164, 232, 176), rim=(255, 250, 200))
    for x0 in range(0, MW, 700):  # bunting
        pts = [(x0 + t * 7, 120 + 70 * math.sin(t / 100 * math.pi)) for t in range(0, 101)]
        for k in range(0, 100, 8):
            x, y = pts[k]; col = hexc(['#ff8a8a', '#ffe27a', '#8ecbff', '#9be6a0', '#ffb8d9'][(k // 8) % 5])
            tri = mid.poly([(x, y), (x + 30, y + 4), (x + 14, y + 44)]); mid.paint(tri, col, [col, mix(col, (255, 255, 255), .3)], size=6)
        mid.fill(mid.poly([(x0 + t * 7, 118 + 70 * math.sin(t / 100 * math.pi)) for t in range(0, 101)] + [(x0 + t * 7, 122 + 70 * math.sin(t / 100 * math.pi)) for t in range(100, -1, -1)]), (120, 90, 60))
    g = mid.ridge(716, 14, 4, MW); mid.paint(g, (140, 208, 154), [(130, 200, 146), (154, 218, 164)], size=14)
    mid.haze(560, 780, (245, 252, 255), 0, .22); mid.finish(5)
    return far, mid


BUILD = {'nesting-tree': nesting_tree, 'feelings-forest': feelings_forest, 'quiet-caves': quiet_caves,
         'firefly-meadow': firefly_meadow, 'sky-bridge': sky_bridge, 'sparkle-stream': sparkle_stream, 'tools-shed': tools_shed, 'reward-tracker': reward_tracker}

if __name__ == '__main__':
    ids = sys.argv[1:] or list(BUILD)
    for i in ids:
        far, mid = BUILD[i]()
        print(i, 'far', far.save(i + '-far.webp', opaque=True), 'KB  mid', mid.save(i + '-mid.webp'), 'KB', flush=True)
