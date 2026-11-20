"""Build public/data/climate-anm.json: the climate context of our network points from ANM weather stations.

For every point of our network (ours = true in src/site/content/lw-data.json) the script picks a reference
station of the national network run by ANM (Administrația Națională de Meteorologie), among the stations with
at least 90 % of the days of 1991–2020. It ranks them by distance plus 1 km for every 10 m of elevation
difference, so a valley site does not get a summit station. For each chosen station it keeps:
  - the monthly normals 1991–2020 of mean, maximum and minimum temperature and of precipitation,
  - every complete year since the series began (mean temperature, precipitation),
  - the last 24 months, the current one up to the last day with data.
Source: ANM open data portal, dataset ro.anm.obs.climate.daily (CC BY 4.0), https://opendata.geo.meteoromania.ro/
Point elevations come from the Open-Meteo elevation API (Copernicus DEM).

Usage: python3 scripts/climate_anm.py [climate_daily.parquet]
Needs pandas and pyarrow 21 or newer (older pyarrow cannot read the ANM file). Without an argument it downloads
the 53 MB file to a temporary folder.
"""
import json, math, os, sys, tempfile, urllib.request
from datetime import date

import pandas as pd
import pyarrow.parquet as pq

PORTAL = "https://opendata.geo.meteoromania.ro"
DATA = "src/site/content/lw-data.json"
OUT = "public/data/climate-anm.json"
NORMAL = (1991, 2020)
MAX_KM = 60
KM_PER_M = 0.1  # 10 m of elevation difference weigh as 1 km of distance
RECENT = 24


def get(url, timeout=120):
    req = urllib.request.Request(url, headers={"User-Agent": "lifewatch-romania-site"})
    return urllib.request.urlopen(req, timeout=timeout).read()


def km(lat1, lon1, lat2, lon2):
    p = math.pi / 180
    return 6371 * math.hypot((lon2 - lon1) * p * math.cos((lat1 + lat2) / 2 * p), (lat2 - lat1) * p)


def r1(v):
    return None if v is None or pd.isna(v) else round(float(v), 1)


points = [p for p in json.load(open(DATA))["points"] if p.get("ours")]
stations = {f["properties"]["wsi"]: f["properties"] for f in json.loads(get(f"{PORTAL}/data/stations/stations.geojson"))["features"]}
elev = json.loads(get("https://api.open-meteo.com/v1/elevation?latitude=" + ",".join(str(p["lat"]) for p in points)
                      + "&longitude=" + ",".join(str(p["lon"]) for p in points)))["elevation"]

if len(sys.argv) > 1:
    parquet = sys.argv[1]
else:
    parquet = os.path.join(tempfile.mkdtemp(), "climate_daily.parquet")
    with open(parquet, "wb") as f:
        f.write(get(f"{PORTAL}/data/stations/climate_daily.parquet", timeout=600))

df = pq.read_table(parquet, columns=["wsi", "date", "ta", "tx", "tn", "r", "qc"]).to_pandas()
df["wsi"] = df["wsi"].astype(str)
df["date"] = pd.to_datetime(df["date"])
# QC bits 1 and 2 flag inconsistent temperatures, bit 16 impossible precipitation; -999 marks a missing value.
bad_t = (df["qc"] & 3) > 0
for c in ("ta", "tx", "tn"):
    df.loc[bad_t | (df[c] < -60), c] = None
df.loc[((df["qc"] & 16) > 0) | (df["r"] < 0), "r"] = None
end = df["date"].max()

# Months: a temperature month needs at most 6 missing days, a precipitation month at most 2.
df["y"], df["m"] = df["date"].dt.year, df["date"].dt.month
g = df.groupby(["wsi", "y", "m"])
mon = g.agg(ta=("ta", "mean"), tx=("tx", "mean"), tn=("tn", "mean"), nt=("ta", "count"), r=("r", "sum"), nr=("r", "count")).reset_index()
mon["days"] = pd.to_datetime(dict(year=mon.y, month=mon.m, day=1)).dt.days_in_month
mon["okt"] = mon.nt >= mon.days - 6
mon["okr"] = mon.nr >= mon.days - 2

in_normal = mon[(mon.y >= NORMAL[0]) & (mon.y <= NORMAL[1])]
cover = in_normal.groupby("wsi").agg(t=("nt", "sum"), r=("nr", "sum"))
days_normal = (date(NORMAL[1], 12, 31) - date(NORMAL[0], 1, 1)).days + 1
eligible = set(cover[(cover.t >= 0.9 * days_normal) & (cover.r >= 0.9 * days_normal)].index) & set(stations)

out_points, chosen = {}, set()
for p, z in zip(points, elev):
    best = None
    for w in eligible:
        s = stations[w]
        d = km(p["lat"], p["lon"], s["lat"], s["lon"])
        if d > MAX_KM:
            continue
        score = d + KM_PER_M * abs(s["elevation_m"] - z)
        if best is None or score < best[0]:
            best = (score, w, d)
    if best is None:
        print("no ANM station for", p["key"])
        continue
    _, w, d = best
    chosen.add(w)
    out_points[p["key"]] = {"wsi": w, "km": round(d, 1), "elev": round(z)}
    print(f"{p['key']:14} {p.get('short') or p['name'][:28]:28} -> {stations[w]['name_display']:24} {d:5.1f} km, {stations[w]['elevation_m'] - z:+5.0f} m")

out_stations = {}
for w in sorted(chosen):
    s = stations[w]
    m = mon[mon.wsi == w]
    nm = in_normal[in_normal.wsi == w]
    normals = {}
    for key, col, ok in (("t", "ta", "okt"), ("tx", "tx", "okt"), ("tn", "tn", "okt"), ("p", "r", "okr")):
        vals = []
        for month in range(1, 13):
            sel = nm[(nm.m == month) & nm[ok]][col]
            vals.append(r1(sel.mean()) if len(sel) >= 24 else None)
        normals[key] = vals
    full = m[m.y < end.year].groupby("y").agg(t=("ta", "mean"), nt=("okt", "sum"), p=("r", "sum"), np=("okr", "sum"))
    y0 = int(full.index.min())
    years_t = [r1(full.t[y]) if y in full.index and full.nt[y] == 12 else None for y in range(y0, end.year)]
    years_p = [round(float(full.p[y])) if y in full.index and full.np[y] == 12 else None for y in range(y0, end.year)]
    first = next(i for i, v in enumerate(years_t) if v is not None)
    recent = []
    for k in range(RECENT - 1, -1, -1):
        mi = end.year * 12 + end.month - 1 - k
        y, mo = divmod(mi, 12)
        row = m[(m.y == y) & (m.m == mo + 1)]
        if row.empty:
            recent.append({"m": f"{y}-{mo + 1:02d}", "t": None, "p": None, "d": 0})
            continue
        row = row.iloc[0]
        partial = y == end.year and mo + 1 == end.month
        recent.append({
            "m": f"{y}-{mo + 1:02d}",
            "t": r1(row.ta) if partial or row.okt else None,
            "p": r1(row.r) if partial or row.okr else None,
            "d": int(min(row.nt, row.nr)) if partial else int(row.days),
        })
    out_stations[w] = {
        "name": s["name_display"], "county": s.get("county"), "elev": round(s["elevation_m"]),
        "lat": round(s["lat"], 4), "lon": round(s["lon"], 4), "since": s["first_date"][:4],
        "normal": normals, "y0": y0 + first, "years": {"t": years_t[first:], "p": years_p[first:]}, "recent": recent,
    }

result = {
    "source": "ANM, date climatice zilnice la stațiile meteorologice (ro.anm.obs.climate.daily), CC BY 4.0",
    "url": f"{PORTAL}/catalog/ro.anm.obs.climate.daily/",
    "end": end.strftime("%Y-%m-%d"),
    "normal": list(NORMAL),
    "stations": out_stations,
    "points": out_points,
}
with open(OUT, "w") as f:
    json.dump(result, f, ensure_ascii=False, separators=(",", ":"))
print(len(out_points), "points,", len(out_stations), "stations,", os.path.getsize(OUT) // 1024, "KB")
