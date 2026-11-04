"""Builds src/geo.js: simplified SVG paths for the Poland map and the Europe map."""
import json, math, sys

SRC = sys.argv[1]
OUT = sys.argv[2]
feats = json.load(open(SRC))['features']
by_iso = {f['properties']['ISO3166-1-Alpha-2']: f for f in feats}


def polys(f):
    g = f['geometry']
    return [g['coordinates']] if g['type'] == 'Polygon' else g['coordinates']


def dp(pts, tol):
    if len(pts) < 3:
        return pts
    keep = [False] * len(pts)
    keep[0] = keep[-1] = True
    stack = [(0, len(pts) - 1)]
    while stack:
        a, b = stack.pop()
        ax, ay = pts[a]; bx, by = pts[b]
        dx, dy = bx - ax, by - ay
        L = math.hypot(dx, dy)
        best, bi = -1, -1
        for i in range(a + 1, b):
            px, py = pts[i]
            d = (abs(dy * px - dx * py + bx * ay - by * ax) / L) if L > 1e-6 else math.hypot(px - ax, py - ay)
            if d > best:
                best, bi = d, i
        if best > tol:
            keep[bi] = True
            stack += [(a, bi), (bi, b)]
    return [p for p, k in zip(pts, keep) if k]


class Proj:
    def __init__(self, lat0, lon_min, lat_max, k, ox, oy):
        self.c = math.cos(math.radians(lat0)); self.lon_min = lon_min
        self.lat_max = lat_max; self.k = k; self.ox = ox; self.oy = oy

    def __call__(self, lon, lat):
        # simple Mercator-ish y for nicer shapes
        y = math.log(math.tan(math.pi / 4 + math.radians(lat) / 2))
        y0 = math.log(math.tan(math.pi / 4 + math.radians(self.lat_max) / 2))
        return (self.ox + (lon - self.lon_min) * self.c * self.k,
                self.oy + (y0 - y) * math.degrees(1) * self.k * self.c)


def clip(pts, x0, y0, x1, y1):
    def cl(pts, inside, inter):
        out = []
        for i in range(len(pts)):
            cur, prev = pts[i], pts[i - 1]
            if inside(cur):
                if not inside(prev): out.append(inter(prev, cur))
                out.append(cur)
            elif inside(prev):
                out.append(inter(prev, cur))
        return out
    def ix(x):
        return lambda p, q: (x, p[1] + (q[1] - p[1]) * (x - p[0]) / (q[0] - p[0]))
    def iy(y):
        return lambda p, q: (p[0] + (q[0] - p[0]) * (y - p[1]) / (q[1] - p[1]), y)
    for ins, it in ((lambda p: p[0] >= x0, ix(x0)), (lambda p: p[0] <= x1, ix(x1)),
                    (lambda p: p[1] >= y0, iy(y0)), (lambda p: p[1] <= y1, iy(y1))):
        if not pts: break
        pts = cl(pts, ins, it)
    return pts


def path_of(rings, pr, tol, bbox=None, box=None):
    out = []
    for poly in rings:
        ring = poly[0]
        if bbox:
            lons = [p[0] for p in ring]; lats = [p[1] for p in ring]
            if max(lons) < bbox[0] or min(lons) > bbox[2] or max(lats) < bbox[1] or min(lats) > bbox[3]:
                continue
        pts = [pr(*p) for p in ring]
        if box:
            pts = clip(pts, *box)
        pts = dp(pts + pts[:1], tol)[:-1] if pts else pts
        if len(pts) < 4:
            continue
        out.append('M' + 'L'.join(f'{x:.1f},{y:.1f}' for x, y in pts) + 'Z')
    return ''.join(out)


# ---------- Poland ----------
W, H = 400, 400
pr = Proj(52, 14.07, 55.35, 1, 0, 0)
# fit: compute scale so Poland fits width 370
ring = polys(by_iso['PL'])[0][0]
raw = [pr(*p) for p in ring]
minx = min(p[0] for p in raw); maxx = max(p[0] for p in raw)
k = 372 / (maxx - minx)
pr = Proj(52, 14.07, 55.35, k, 14, 12)
raw = [pr(*p) for p in ring]
miny = min(p[1] for p in raw); maxy = max(p[1] for p in raw)
H = int(maxy + 14)
pl_path = path_of(polys(by_iso['PL']), pr, 0.6)
bbox = (11, 47, 28, 58)
neigh = ''.join(path_of(polys(by_iso[c]), pr, 1.2, bbox, (-5, -5, 405, H + 5)) for c in by_iso
                if c not in ('PL',) and by_iso[c])

P = {
    'warszawa': (52.23, 21.01), 'krakow': (50.06, 19.94), 'gdansk': (54.35, 18.65),
    'wroclaw': (51.11, 17.03), 'poznan': (52.41, 16.93), 'szczecin': (53.43, 14.55),
    'bialystok': (53.13, 23.16), 'lublin': (51.25, 22.57), 'torun': (53.01, 18.60),
    'gniezno': (52.53, 17.60), 'zakopane': (49.30, 19.95), 'lodz': (51.76, 19.46),
    'tatry': (49.23, 20.0), 'baltyk': (54.95, 17.2), 'mazury': (53.8, 21.6),
    'srodek': (52.05, 19.2), 'bialowieza': (52.70, 23.85), 'malbork': (54.04, 19.03),
    'wieliczka': (49.99, 20.06), 'zachod': (52.3, 15.3),
}
points = {n: [round(v, 1) for v in pr(lon, lat)] for n, (lat, lon) in P.items()}
wisla = [(49.61, 19.0), (49.95, 19.45), (50.06, 19.94), (50.25, 20.8), (50.68, 21.75), (51.0, 21.8),
         (51.42, 21.97), (51.9, 21.4), (52.23, 21.03), (52.4, 20.6), (52.55, 19.70), (52.65, 19.07),
         (53.01, 18.60), (53.15, 18.17), (53.48, 18.75), (53.75, 18.85), (54.09, 18.78), (54.36, 18.95)]
odra = [(49.95, 18.30), (50.09, 18.22), (50.40, 18.05), (50.67, 17.93), (50.85, 17.5), (51.11, 17.03),
        (51.25, 16.6), (51.66, 16.08), (51.80, 15.71), (52.05, 15.10), (52.35, 14.56), (52.59, 14.65),
        (52.9, 14.15), (53.2, 14.4), (53.43, 14.55), (53.70, 14.5)]
rivers = {n: 'M' + 'L'.join(f'{x:.1f},{y:.1f}' for x, y in (pr(lon, lat) for lat, lon in r))
          for n, r in (('wisla', wisla), ('odra', odra))}

# ---------- Europe ----------
pe = Proj(52, -11, 71, 1, 0, 0)
xs = [pe(-11, 50)[0], pe(42, 50)[0]]
ke = 400 / (xs[1] - xs[0])
pe = Proj(52, -11, 71, ke, 0, 0)
EH = int(pe(0, 34.5)[1])
ebbox = (-12, 34, 43, 72)
cand = ['PL', 'FR', 'ES', 'IT']
eu_other = ''.join(path_of(polys(f), pe, 1.3, ebbox, (-5, -5, 405, EH + 5)) for c, f in by_iso.items() if c not in cand)
eu_c = {c: path_of(polys(by_iso[c]), pe, 0.8, ebbox, (-5, -5, 405, EH + 5)) for c in cand}

geo = {'pl': {'w': W, 'h': H, 'path': pl_path, 'neigh': neigh, 'points': points, 'rivers': rivers},
       'eu': {'w': 400, 'h': EH, 'other': eu_other, 'cand': eu_c}}
js = 'const GEO=' + json.dumps(geo, separators=(',', ':')) + ';\n'
open(OUT, 'w').write(js)
print('PL size', W, H, 'EU', 400, EH, 'bytes', len(js))
print(points)
