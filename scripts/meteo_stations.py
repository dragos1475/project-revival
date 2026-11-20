"""Build public/data/anm-hourly-stations.json: the ANM stations whose hourly observations are published through
EUMETNET MeteoGate (OGC API EDR), with name and elevation from the ANM station list, and the station chosen for
every point of our network.

The site sheets show the last 24 hours of that station in the "Vremea" (weather) tab, read straight from
MeteoGate in the browser. As in scripts/climate_anm.py, stations are ranked by distance plus 1 km for every 10 m
of elevation difference (point elevations from public/data/climate-anm.json), so a valley site does not get a
summit station. Places outside our network take the closest station.
Sources: https://api.meteogate.eu/eu-eumetnet-surface-observations and
https://opendata.geo.meteoromania.ro/data/stations/stations.geojson (ANM, CC BY 4.0).

Usage: python3 scripts/meteo_stations.py (after scripts/climate_anm.py)
"""
import json, math, os, urllib.request

EDR = "https://api.meteogate.eu/eu-eumetnet-surface-observations/collections/observations/locations?bbox=20.2,43.6,29.9,48.4"
ANM = "https://opendata.geo.meteoromania.ro/data/stations/stations.geojson"
DATA = "src/site/content/lw-data.json"
CLIMATE = "public/data/climate-anm.json"
OUT = "public/data/anm-hourly-stations.json"
MAX_KM = 60
KM_PER_M = 0.1


def get(url):
    return json.loads(urllib.request.urlopen(urllib.request.Request(url, headers={"User-Agent": "lifewatch-romania-site"}), timeout=120).read())


def km(lat1, lon1, lat2, lon2):
    p = math.pi / 180
    return 6371 * math.hypot((lon2 - lon1) * p * math.cos((lat1 + lat2) / 2 * p), (lat2 - lat1) * p)


anm = {f["properties"]["wsi"]: f["properties"] for f in get(ANM)["features"]}
out = []
for f in get(EDR)["features"]:
    wsi, params = f["id"], f["properties"].get("parameter-name", [])
    if wsi not in anm or not any(p.startswith("air_temperature:") for p in params):
        continue
    s = anm[wsi]
    lon, lat = f["geometry"]["coordinates"][:2]
    out.append([wsi, s["name_display"], round(lat, 4), round(lon, 4), round(s["elevation_m"])])
out.sort(key=lambda r: r[1])

elev = {k: v["elev"] for k, v in json.load(open(CLIMATE))["points"].items()}
chosen = {}
for p in json.load(open(DATA))["points"]:
    if not p.get("ours") or p["key"] not in elev:
        continue
    ranked = sorted((km(p["lat"], p["lon"], s[2], s[3]) + KM_PER_M * abs(s[4] - elev[p["key"]]), s) for s in out)
    score, s = ranked[0]
    d = km(p["lat"], p["lon"], s[2], s[3])
    if d <= MAX_KM:
        chosen[p["key"]] = s[0]
        print(f"{p['key']:14} {(p.get('short') or p['name'])[:28]:28} -> {s[1]:22} {d:5.1f} km, {s[4] - elev[p['key']]:+5.0f} m")

with open(OUT, "w") as fh:
    json.dump({"source": "ANM prin EUMETNET MeteoGate", "fields": ["wsi", "name", "lat", "lon", "elev"], "stations": out, "points": chosen}, fh, ensure_ascii=False, separators=(",", ":"))
print(len(out), "stations,", len(chosen), "points,", os.path.getsize(OUT), "bytes")
