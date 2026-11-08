"""Build SVG paths of Romania and its neighbours for the site atlas (same projection as atlas.tsx)."""
import json, math, sys

src, dst = sys.argv[1], sys.argv[2]
BOX = dict(w=20.1, e=29.9, s=43.5, n=48.4)
COS = math.cos(math.radians(46))
W = 600
SCALE = W / ((BOX["e"] - BOX["w"]) * COS)
H = round((BOX["n"] - BOX["s"]) * SCALE)
CLIP = (17.0, 41.5, 33.0, 50.5)  # lon/lat window, larger than the view so edges stay clean
KEEP = {"ROU": "romania", "MDA": "moldova", "UKR": "ucraina", "HUN": "ungaria", "SRB": "serbia", "BGR": "bulgaria", "SVK": "slovacia", "MKD": "macedonia", "BIH": "bosnia", "HRV": "croatia", "MNE": "muntenegru", "KOS": "kosovo", "TUR": "turcia", "GRC": "grecia", "POL": "polonia", "AUT": "austria", "ALB": "albania", "BLR": "belarus"}

def project(lon, lat):
    return ((lon - BOX["w"]) * COS * SCALE, (BOX["n"] - lat) * SCALE)

def clip(poly, xmin, ymin, xmax, ymax):
    def inside(p, edge):
        x, y = p
        return {"l": x >= xmin, "r": x <= xmax, "b": y >= ymin, "t": y <= ymax}[edge]
    def cut(p, q, edge):
        (x1, y1), (x2, y2) = p, q
        if edge in "lr":
            x = xmin if edge == "l" else xmax
            t = (x - x1) / (x2 - x1)
            return (x, y1 + t * (y2 - y1))
        y = ymin if edge == "b" else ymax
        t = (y - y1) / (y2 - y1)
        return (x1 + t * (x2 - x1), y)
    out = poly
    for edge in "lrbt":
        if not out:
            break
        inp, out = out, []
        for i, q in enumerate(inp):
            p = inp[i - 1]
            if inside(q, edge):
                if not inside(p, edge):
                    out.append(cut(p, q, edge))
                out.append(q)
            elif inside(p, edge):
                out.append(cut(p, q, edge))
    return out

def simplify(pts, tol):
    if len(pts) < 3:
        return pts
    def rdp(a, b):
        (x1, y1), (x2, y2) = pts[a], pts[b]
        dx, dy = x2 - x1, y2 - y1
        norm = math.hypot(dx, dy)
        best, idx = 0, None
        for i in range(a + 1, b):
            x, y = pts[i]
            # Closed rings start and end on the same point: fall back to the distance from it.
            d = abs(dy * x - dx * y + x2 * y1 - y2 * x1) / norm if norm > 1e-6 else math.hypot(x - x1, y - y1)
            if d > best:
                best, idx = d, i
        if idx is not None and best > tol:
            return rdp(a, idx)[:-1] + rdp(idx, b)
        return [pts[a], pts[b]]
    return rdp(0, len(pts) - 1)

def path_of(geom, tol):
    polys = geom["coordinates"] if geom["type"] == "MultiPolygon" else [geom["coordinates"]]
    parts = []
    for poly in polys:
        for ring in poly:
            ring = clip([tuple(p) for p in ring], *CLIP)
            if len(ring) < 3:
                continue
            xy = simplify([project(*p) for p in ring] + [project(*ring[0])], tol)
            if len(xy) < 4:
                continue
            parts.append("M" + "L".join(f"{x:.1f} {y:.1f}" for x, y in xy[:-1]) + "Z")
    return "".join(parts)

data = json.load(open(src))
paths = {}
for f in data["features"]:
    code = f["properties"].get("ADM0_A3")
    if code in KEEP:
        d = path_of(f["geometry"], 0.45 if code == "ROU" else 0.8)
        if d:
            paths[KEEP[code]] = d

romania = paths.pop("romania")
labels = [
    ("ROMÂNIA", 24.15, 46.55, "middle", "country"),
    ("UCRAINA", 26.6, 48.22, "middle", "neighbour"),
    ("MOLDOVA", 28.55, 47.25, "middle", "neighbour"),
    ("UNGARIA", 20.75, 47.55, "middle", "neighbour"),
    ("SERBIA", 20.75, 44.35, "middle", "neighbour"),
    ("BULGARIA", 25.6, 43.7, "middle", "neighbour"),
    ("Marea Neagră", 29.75, 44.05, "end", "sea"),
]
lines = [
    "// Generated from Natural Earth 1:50m Admin 0 countries (public domain, naturalearthdata.com).",
    "// Projected for the 600 px wide site atlas (equirectangular, scaled by cos 46°N), same as atlas.tsx.",
    "// Regenerate with scripts/make_basemap.py if the atlas frame changes.",
    f"export const BASEMAP_SIZE = {{ width: {W}, height: {H} }};",
    f"export const ROMANIA_PATH = {json.dumps(romania)};",
    "export const NEIGHBOUR_PATHS: { id: string; d: string }[] = [",
    *[f"  {{ id: {json.dumps(k)}, d: {json.dumps(v)} }}," for k, v in sorted(paths.items())],
    "];",
    "export const BASEMAP_LABELS: { text: string; x: number; y: number; anchor: \"start\" | \"middle\" | \"end\"; kind: \"country\" | \"neighbour\" | \"sea\" }[] = [",
    *[f"  {{ text: {json.dumps(t, ensure_ascii=False)}, x: {project(lo, la)[0]:.1f}, y: {project(lo, la)[1]:.1f}, anchor: \"{a}\", kind: \"{k}\" }}," for t, lo, la, a, k in labels],
    "];",
    "",
]
open(dst, "w").write("\n".join(lines))
print("height", H, "romania chars", len(romania), "neighbours", {k: len(v) for k, v in paths.items()})
