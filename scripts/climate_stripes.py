"""Build public/data/climate-stripes.json: the climate since 1961 of every point of our network, from the ANM grid.

Source: the homogenised daily grid of ANM (Administrația Națională de Meteorologie), dataset
ro.anm.grid.daily.geozarr (CC BY 4.0), https://opendata.geo.meteoromania.ro/catalog/ro.anm.grid.daily.geozarr/
  - Points (stations, weather and flux stations): the 3 × 3 cells of the 1 km grid around the point, read from
    the time-series store (ro_grid_daily_ts.zarr), whose chunks hold 512 days of 8 × 8 cells.
  - Large areas with a boundary (LTSER Neajlov, the Danube Delta, Brăila Islands): every 4 km cell of the map
    pyramid (ro_grid_daily.zarr, level 2) whose centre lies inside the boundary.
  - The warming map: the same 4 km level, mean temperature 1996–2025 minus 1961–1990 in every cell.
Mean temperature is (max + min) / 2 of each day. A year counts when at most 10 of its days are missing.

Usage: python3 scripts/climate_stripes.py [cache folder]
Needs numpy and zstandard. Downloads about 800 MB (the 4 km level for 1961 to now, three variables) and
about 5 000 small ranges of the 1 km store; with a cache folder a second run reads them from disk.
"""
import base64, json, math, os, struct, sys, tempfile, threading, urllib.request, warnings
from concurrent.futures import ThreadPoolExecutor
from datetime import date

import numpy as np
import zstandard

# Cells outside the country and days without data are NaN; their means are expected to be empty.
warnings.filterwarnings("ignore", "Mean of empty slice", RuntimeWarning)
np.seterr(invalid="ignore", divide="ignore")

PORTAL = "https://opendata.geo.meteoromania.ro"
TS = f"{PORTAL}/data/grid/ro_grid_daily_ts.zarr"
PYR = f"{PORTAL}/data/grid/ro_grid_daily.zarr"
DATA = "src/site/content/lw-data.json"
BOUNDS = "public/data/lw-boundaries.json"
OUT = "public/data/climate-stripes.json"
FIRST, LAST = 1961, 2025
REF, NOW = (1961, 1990), (1996, 2025)
VARS = ("tmax", "tmin", "precip")
CACHE = sys.argv[1] if len(sys.argv) > 1 else tempfile.mkdtemp()
os.makedirs(CACHE, exist_ok=True)
EMPTY = 2**64 - 1
dctx = threading.local()


def get(url, rng=None, timeout=180):
    headers = {"User-Agent": "lifewatch-romania-site"}
    if rng:
        headers["Range"] = rng
    for attempt in range(4):
        try:
            return urllib.request.urlopen(urllib.request.Request(url, headers=headers), timeout=timeout).read()
        except Exception:
            if attempt == 3:
                raise


def cached(name, fetch):
    path = os.path.join(CACHE, name.replace("/", "_"))
    if os.path.exists(path):
        return open(path, "rb").read()
    data = fetch()
    part = f"{path}.{threading.get_ident()}.part"  # two threads may fetch the same shard index
    with open(part, "wb") as f:
        f.write(data)
    os.replace(part, path)
    return data


def unzstd(b):
    if not hasattr(dctx, "d"):
        dctx.d = zstandard.ZstdDecompressor()
    return dctx.d.decompress(b, max_output_size=64 * 2**20)


def meta(store):
    return json.loads(get(f"{store}/zarr.json"))["consolidated_metadata"]["metadata"]


def coord(store, name, dtype="<f8"):
    return np.frombuffer(unzstd(get(f"{store}/{name}/c/0")), dtype=dtype)


def shard_index(blob_tail, n):
    """Offsets and sizes of the n inner chunks, from the index at the end of a shard (16 bytes each, then a CRC)."""
    return [struct.unpack_from("<QQ", blob_tail, 16 * i) for i in range(n)]


def inside(lon, lat, rings):
    hit = False
    for ring in rings:
        j = len(ring) - 1
        for i in range(len(ring)):
            (xi, yi), (xj, yj) = ring[i], ring[j]
            if (yi > lat) != (yj > lat) and lon < (xj - xi) * (lat - yi) / (yj - yi) + xi:
                hit = not hit
            j = i
    return hit


def years_of(days):
    """Index of the year of every day since 1961-01-01, and the number of days of each year."""
    d0 = date(FIRST, 1, 1).toordinal()
    yrs = np.array([date.fromordinal(d0 + i).year for i in range(days)])
    return yrs


points = [p for p in json.load(open(DATA))["points"] if p.get("ours")]
bounds = json.load(open(BOUNDS))
big = {p["key"]: bounds[p["key"]] for p in points if p.get("area_ha") and p["key"] in bounds}

# ---------------------------------------------------------------- 1 km points
tsm = meta(TS)
ndays = tsm["tmax"]["shape"][0]
lat1, lon1 = coord(TS, "lat"), coord(TS, "lon")
assert lat1[0] > lat1[-1], "latitude is expected to run from north to south"
year_of_day = years_of(ndays)
nyears = LAST - FIRST + 1
day_year = year_of_day - FIRST
scale = {v: tsm[v]["attributes"].get("scale_factor", 1) for v in VARS}
fill = {v: tsm[v]["fill_value"] for v in VARS}
dtype = {v: "<i2" if tsm[v]["data_type"] == "int16" else "<u2" for v in VARS}


def cell_of(lat, lon):
    return int(np.abs(lat1 - lat).argmin()), int(np.abs(lon1 - lon).argmin())


index_lock = threading.Lock()
indexes = {}


def ts_index(var, t, sy, sx):
    key = f"ts/{var}/{t}/{sy}/{sx}/index"
    with index_lock:
        if key in indexes:
            return indexes[key]
    tail = cached(key, lambda: get(f"{TS}/{var}/c/{t}/{sy}/{sx}", rng=f"bytes=-{64 * 16 + 4}"))
    idx = shard_index(tail, 64)
    with index_lock:
        indexes[key] = idx
    return idx


def ts_chunk(var, t, cy, cx):
    """One inner chunk of 512 days × 8 × 8 cells, as floats with NaN for missing values."""
    sy, sx, iy, ix = cy // 8, cx // 8, cy % 8, cx % 8
    off, size = ts_index(var, t, sy, sx)[iy * 8 + ix]
    if off == EMPTY:
        return np.full((512, 8, 8), np.nan)
    raw = cached(f"ts/{var}/{t}/{cy}/{cx}", lambda: get(f"{TS}/{var}/c/{t}/{sy}/{sx}", rng=f"bytes={off}-{off + size - 1}"))
    a = np.frombuffer(unzstd(raw), dtype=dtype[var]).reshape(512, 8, 8).astype(float)
    a[a == fill[var]] = np.nan
    return a * scale[var]


def point_series(lat, lon):
    r, c = cell_of(lat, lon)
    rows, cols = range(r - 1, r + 2), range(c - 1, c + 2)
    chunks = sorted({(y // 8, x // 8) for y in rows for x in cols})
    out, cells = {}, 0
    for var in VARS:
        series = np.full((ndays, 9), np.nan)
        for t in range(math.ceil(ndays / 512)):
            parts = {k: ts_chunk(var, t, *k) for k in chunks}
            n = min(512, ndays - t * 512)
            for k, (y, x) in enumerate((y, x) for y in rows for x in cols):
                series[t * 512 : t * 512 + n, k] = parts[(y // 8, x // 8)][:n, y % 8, x % 8]
        out[var] = np.nanmean(series, axis=1)
        if var == "tmax":
            cells = int(np.isfinite(series).any(axis=0).sum())
    return out, cells


def annual(daily_t, daily_p):
    t, p = [], []
    for k in range(nyears):
        sel = day_year == k
        n = sel.sum()
        dt, dp = daily_t[sel], daily_p[sel]
        t.append(round(float(np.nanmean(dt)), 2) if np.isfinite(dt).sum() >= n - 10 else None)
        p.append(round(float(np.nansum(dp))) if np.isfinite(dp).sum() >= n - 10 else None)
    return t, p


result_points, by_cell = {}, {}
small = [p for p in points if p["key"] not in big]


def do_point(p):
    cell = cell_of(p["lat"], p["lon"])
    if cell in by_cell:
        return p, by_cell[cell]
    s, n = point_series(p["lat"], p["lon"])
    t, pr = annual((s["tmax"] + s["tmin"]) / 2, s["precip"])
    res = {"t": t, "p": pr, "cells": n, "km": 1}
    by_cell[cell] = res
    return p, res


with ThreadPoolExecutor(6) as pool:
    for p, res in pool.map(do_point, small):
        result_points[p["key"]] = res
        print(f"{p['key']:14} {(p.get('short') or p['name'])[:30]:30} 1 km, {res['cells']} cells, {res['t'][0]} -> {res['t'][-1]} °C")

# ---------------------------------------------------------------- 4 km level: large areas and the warming map
pm = meta(PYR)
lat4, lon4 = coord(PYR, "2/lat"), coord(PYR, "2/lon")
h4, w4 = len(lat4), len(lon4)
n4 = pm["2/tmax"]["shape"][0]
inner = pm["2/tmax"]["codecs"][0]["configuration"]["chunk_shape"][0]
sums = {v: np.zeros((nyears, h4, w4)) for v in VARS}
counts = {v: np.zeros((nyears, h4, w4)) for v in VARS}
year4 = years_of(n4) - FIRST
sum_lock = threading.Lock()
progress = [0]


def level2(var, t):
    """Adds one shard (512 days of the whole country) to the yearly sums of every cell."""
    blob = cached(f"l2/{var}/{t}", lambda: get(f"{PYR}/2/{var}/c/{t}/0/0"))
    n = 512 // inner
    idx = shard_index(blob[-(n * 16 + 4):], n)
    for i, (off, size) in enumerate(idx):
        d0 = t * 512 + i * inner
        if off == EMPTY or d0 >= n4:
            continue
        a = np.frombuffer(unzstd(blob[off : off + size]), dtype=dtype[var]).reshape(inner, h4, w4).astype(np.float32)
        a[a == fill[var]] = np.nan
        a *= scale[var]
        m = min(inner, n4 - d0)
        yrs = year4[d0 : d0 + m]
        with sum_lock:
            for k in np.unique(yrs):
                if 0 <= k < nyears:
                    sel = a[:m][yrs == k]
                    sums[var][k] += np.nansum(sel, axis=0)
                    counts[var][k] += np.isfinite(sel).sum(axis=0)
    with sum_lock:
        progress[0] += 1
        if progress[0] % 10 == 0:
            print(f"4 km level: {progress[0]}/{len(jobs)} shards", flush=True)


jobs = [(v, t) for v in VARS for t in range(math.ceil(n4 / 512))]
with ThreadPoolExecutor(4) as pool:
    list(pool.map(lambda j: level2(*j), jobs))

days_in_year = np.array([366 if (y % 4 == 0 and y % 100) or y % 400 == 0 else 365 for y in range(FIRST, LAST + 1)])
full = {v: counts[v] >= (days_in_year - 10)[:, None, None] for v in VARS}
tmean = np.where(full["tmax"] & full["tmin"], (sums["tmax"] / counts["tmax"] + sums["tmin"] / counts["tmin"]) / 2, np.nan)
prec = np.where(full["precip"], sums["precip"], np.nan)

for p in points:
    if p["key"] not in big:
        continue
    g = big[p["key"]]
    rings = g["coordinates"] if g["type"] == "Polygon" else [r for poly in g["coordinates"] for r in poly]
    mask = np.array([[inside(lon4[j], lat4[i], rings) for j in range(w4)] for i in range(h4)])
    mask &= np.isfinite(tmean).all(axis=0)
    t = [round(float(tmean[k][mask].mean()), 2) for k in range(nyears)]
    pr = [round(float(np.nanmean(prec[k][mask]))) if np.isfinite(prec[k][mask]).any() else None for k in range(nyears)]
    result_points[p["key"]] = {"t": t, "p": pr, "cells": int(mask.sum()), "km": 4}
    print(f"{p['key']:14} {p['name'][:30]:30} 4 km, {int(mask.sum())} cells, {t[0]} -> {t[-1]} °C")

ref = np.nanmean(tmean[REF[0] - FIRST : REF[1] - FIRST + 1], axis=0)
now = np.nanmean(tmean[NOW[0] - FIRST : NOW[1] - FIRST + 1], axis=0)
diff = now - ref
codes = np.where(np.isfinite(diff), np.clip(np.round(diff * 10), -127, 127), -128).astype(np.int8)
d4 = abs(float(lat4[0] - lat4[1]))
result = {
    "source": "ANM, date climatice gridate zilnice omogenizate (ro.anm.grid.daily.geozarr), CC BY 4.0",
    "url": f"{PORTAL}/catalog/ro.anm.grid.daily.geozarr/",
    "years": [FIRST, LAST],
    "ref": list(REF),
    "now": list(NOW),
    "points": result_points,
    "map": {
        # Cell edges: west, south, east, north; rows run from north to south.
        "bbox": [round(float(lon4[0]) - d4 / 2, 4), round(float(lat4[-1]) - d4 / 2, 4), round(float(lon4[-1]) + d4 / 2, 4), round(float(lat4[0]) + d4 / 2, 4)],
        "w": w4,
        "h": h4,
        "diff": base64.b64encode(codes.tobytes()).decode(),
        "mean": round(float(np.nanmean(diff)), 2),
    },
}
with open(OUT, "w") as f:
    json.dump(result, f, ensure_ascii=False, separators=(",", ":"))
print(len(result_points), "points,", os.path.getsize(OUT) // 1024, "KB, mean warming", result["map"]["mean"], "°C")
