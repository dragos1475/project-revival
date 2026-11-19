"""Build public/data/eunis-legends.json: legends of the EEA Ecosystem Type Map v3.1, EUNIS level 1 and level 2.

Swatches and English names come from the EEA legend service. Only classes that occur in the map view of
Romania (with the Black Sea shelf) are kept, found by exporting that view and matching pixel colours to the
swatches. Romanian names are below.
Usage: python3 scripts/eunis_legends.py   (needs network access and Pillow)
"""
import base64, collections, io, json, math, urllib.request
from PIL import Image

SERVICE = "https://bio.discomap.eea.europa.eu/arcgis/rest/services/Ecosystem/EcosystemTypeMap_v3_1_FullMap/MapServer"
WEST, SOUTH, EAST, NORTH = 20.2, 43.55, 31.0, 48.3
MIN_SHARE = 0.00001  # drop classes under 0.001 % of the view (stray pixels)

L1_RO = {
    "A": "Habitate marine", "B": "Habitate costiere", "C": "Ape interioare de suprafață", "D": "Mlaștini, turbării și smârcuri",
    "E": "Pajiști și terenuri dominate de ierburi, mușchi sau licheni", "F": "Landă, tufărișuri și tundră",
    "G": "Păduri și alte terenuri împădurite", "H": "Habitate interioare fără vegetație sau cu vegetație rară",
    "I": "Teren arabil și grădini de legume", "J": "Habitate construite, industriale și artificiale",
}
L2_RO = {
    "B1": "Dune costiere și țărmuri nisipoase", "B2": "Țărmuri cu prundiș", "B3": "Faleze, terase și țărmuri stâncoase, inclusiv zona supralitorală",
    "C1": "Ape stătătoare de suprafață", "C2": "Ape curgătoare de suprafață", "C3": "Zona litorală a corpurilor de apă interioare",
    "D1": "Turbării înalte și turbării de pătură", "D2": "Mlaștini de vale, turbării sărace și de tranziție", "D3": "Mlaștini aapa, palsa și poligonale",
    "D4": "Mlaștini bazice și izvoare calcaroase", "D5": "Rogozuri și stufărișuri, de obicei fără apă liberă", "D6": "Mlaștini și stufărișuri salmastre interioare",
    "E1": "Pajiști uscate", "E2": "Pajiști mezofile", "E3": "Pajiști umede și inundate sezonier", "E4": "Pajiști alpine și subalpine",
    "E6": "Stepe sărăturate interioare", "E7": "Pajiști cu arbori răzleți",
    "F1": "Tundră", "F2": "Tufărișuri arctice, alpine și subalpine", "F3": "Tufărișuri temperate și mediteraneene montane", "F4": "Lande temperate",
    "F5": "Maquis, matorral arborescent și tufărișuri termomediteraneene", "F6": "Garigă", "F7": "Lande spinoase mediteraneene (frigana)",
    "F8": "Tufărișuri xerofile termo-atlantice", "F9": "Tufărișuri ripariene și de mlaștină", "FB": "Plantații de arbuști",
    "G1": "Păduri de foioase", "G2": "Păduri de foioase sempervirescente", "G3": "Păduri de conifere", "G4": "Păduri mixte de foioase și conifere",
    "G5": "Aliniamente de arbori, pâlcuri antropice, tăieri recente și păduri tinere",
    "H2": "Grohotișuri", "H3": "Stâncării, abrupturi și aflorimente interioare", "H4": "Habitate dominate de zăpadă sau gheață",
    "H5": "Alte habitate interioare cu vegetație foarte rară sau absentă",
    "I1": "Teren arabil și grădini de legume", "I2": "Grădini și parcuri cultivate",
    "J1": "Clădiri din orașe și sate", "J2": "Zone construite cu densitate redusă", "J3": "Situri industriale de extracție",
    "J4": "Rețele de transport și alte suprafețe construite", "J5": "Ape artificiale și structurile asociate", "J6": "Depozite de deșeuri",
    "X1": "Estuare", "X2_3": "Lagune costiere",
}
# Marine level 2 codes read A<zone><ice><substrate>, for example A404 = offshore circalittoral, no sea ice, mixed sediment.
ZONE = {"1": "Litoral", "2": "Infralitoral", "3": "Circalitoral", "4": "Circalitoral de larg", "5": "Batial superior", "6": "Batial inferior", "7": "Abisal"}
ICE = {"0": "fără gheață", "1": "cu gheață sezonieră", "2": "cu gheață permanentă"}
SUBSTRATE = {"0": "substrat nedeterminat", "1": "rocă și substrat biogen", "3": "sediment grosier", "4": "sediment mixt", "5": "nisip", "6": "mâl"}


def ro_name(code: str) -> str:
    if code in L2_RO:
        return L2_RO[code]
    if len(code) == 4 and code[0] == "A":
        return f"{ZONE[code[1]]}, {SUBSTRATE[code[3]]}, {ICE[code[2]]}"
    raise KeyError(f"no Romanian name for EUNIS {code}")


def merc(lon, lat):
    return lon * 20037508.34 / 180, math.log(math.tan((90 + lat) * math.pi / 360)) * 20037508.34 / math.pi


def get(url):
    return urllib.request.urlopen(url, timeout=180).read()


legend = json.loads(get(f"{SERVICE}/legend?f=json"))
x0, y0 = merc(WEST, SOUTH)
x1, y1 = merc(EAST, NORTH)
W = 2400
H = int(W * (y1 - y0) / (x1 - x0))
out = {}
for layer, key in ((0, "eunis1"), (1, "eunis2")):
    view = Image.open(io.BytesIO(get(
        f"{SERVICE}/export?bbox={x0:.0f},{y0:.0f},{x1:.0f},{y1:.0f}&bboxSR=3857&imageSR=3857&size={W},{H}"
        f"&format=png32&transparent=true&layers=show:{layer}&f=image"
    ))).convert("RGBA")
    counts = collections.Counter(p[:3] for p in view.getdata() if p[3] > 200)
    total = sum(counts.values())
    entries = []
    for e in next(x for x in legend["layers"] if x["layerId"] == layer)["legend"]:
        swatch = Image.open(io.BytesIO(base64.b64decode(e["imageData"]))).convert("RGBA")
        share = counts.get(swatch.getpixel((swatch.width // 2, swatch.height // 2))[:3], 0) / total
        if share < MIN_SHARE:
            continue
        label = e["label"].strip()
        code, en = label.split(" - ", 1)
        en = en.split(code + " - ")[0].strip()  # the EEA service repeats a few labels
        en = en[0].upper() + en[1:]
        img = f"data:{e['contentType']};base64,{e['imageData']}"
        if layer == 0:
            entries.append({"l": f"{code} · {L1_RO[code]}", "l_en": f"{code} · {en}", "img": img})
        else:
            g = "A" if code.startswith("X") else code[0]
            l1_en = next(x["label"].split(" - ", 1)[1] for x in legend["layers"][0]["legend"] if x["label"].startswith(g + " "))
            entries.append({"l": f"{code} · {ro_name(code)}", "l_en": f"{code} · {en}", "img": img,
                            "g": f"{g} · {L1_RO[g]}", "g_en": f"{g} · {l1_en[0].upper() + l1_en[1:]}"})
    if layer == 1:  # group by level 1 class; marine classes (A, with estuaries and lagoons) last, most sites are inland
        entries.sort(key=lambda x: (x["g"].startswith("A"), x["g"], x["l"]))
    out[key] = entries
    print(key, len(entries), "classes")

with open("public/data/eunis-legends.json", "w") as f:
    json.dump(out, f, ensure_ascii=False, separators=(",", ":"))
