# LTSER API contract

The web interface talks to two HTTP services.

1. **LifeWatch API**, already implemented in
   [GabrielMajeri/lifewatch-romania](https://github.com/GabrielMajeri/lifewatch-romania)
   (`src/lifewatch/api/main.py`). It serves raw station measurements from TimescaleDB.
   The frontend uses it as is. See "LifeWatch API: what the frontend needs" at the end.
2. **LTSER API**, described in this document. It replaces the server side of the R Shiny
   application [alexdum/ltser](https://github.com/alexdum/ltser), which today reads NetCDF,
   Parquet and image files from its own disk. **This service does not exist yet.** Until it
   does, the frontend generates demonstration data with exactly these shapes
   (`src/api/mock/ltser-mock.ts` is a working, typed reference implementation;
   the response types are in `src/api/types.ts`).

All endpoints are `GET`, return JSON (`application/json`) unless stated otherwise, and live
under a base URL such as `https://ltser.example.ro/api/v1`. Errors use the FastAPI shape
`{"detail": "message"}` with a 4xx or 5xx status; the frontend shows `detail` to the user.

The frontend reaches the service through a same-origin reverse proxy at `/ltser-api/`
(see "Same-origin proxy" below), so the service itself needs no CORS headers.

## Conventions

| Item | Rule |
| --- | --- |
| Month dates | `YYYY-MM-01`, first day of the month (`date` column of the monthly products). |
| Weather times, hourly | ISO 8601 in UTC with `Z`, for example `2024-05-01T12:00:00Z`. Source column `time`. |
| Weather times, daily | `YYYY-MM-DD`. |
| Eddy covariance times | Naive EET wall clock, `YYYY-MM-DDTHH:MM:SS`, half-hour steps. Source column `time_eet`. |
| Missing values | `null`. Rows with `null` may also be omitted. |
| Station ids | The ids used in the data files: `IF-Cor`, `IF-Ste`, `enisala`, and so on. The frontend applies the renames from `global.R` (`IF-Cor` shown as `GR-Mih`, `IF-Ste` shown as `IL-Lil`). |
| Administrative ids | `natcode` from `ltser.topojson` (LTSER areas, `1` to `6`) and `uat_ltser.topojson` (SIRUTA code of each UAT). Send them as strings. |

## Health

`GET /health` returns `{"status": "healthy"}`. The frontend probes it once per page load
(timeout 2.5 s) when its mode is `auto`, and falls back to demo data if it fails.

## 1. Remote sensing (Shiny tab "Remote sensing / National level")

Source in the Shiny app: `www/data/ncs/{ssm,ndvi,fapar}_ltser_mon*.nc` read with `terra`,
values extracted with `utils/extract_point.py`.

### `GET /remote-sensing/indicators`

```json
[
  { "id": "ssm", "dates": ["2015-04-01", "2015-05-01", "...", "2024-03-01"] },
  { "id": "ndvi", "dates": ["2014-01-01", "..."] },
  { "id": "fapar", "dates": ["2014-01-01", "..."] }
]
```

Dates are ascending. The Shiny app cut SSM before `2024-04-01`; apply the same filter here.

### `GET /remote-sensing/{indicator}/grid?date=YYYY-MM-01`

One monthly layer as a regular lon/lat grid (EPSG:4326), row 0 being the northern row.

```json
{
  "indicator": "ssm",
  "date": "2024-03-01",
  "west": 22.35, "south": 43.9, "east": 29.85, "north": 47.77,
  "width": 500, "height": 258,
  "values": [null, null, 41.2, 43.0, "... width * height numbers or null ..."]
}
```

For large grids, send `values_b64` instead of `values`: the base64 encoding of a
little-endian `Float32` array of `width * height` cells, `NaN` for missing data.
The client accepts either field.

The cell `(i, j)` covers longitudes `west + j*dx` to `west + (j+1)*dx`, with
`dx = (east - west) / width`, and latitudes `north - i*dy` down to `north - (i+1)*dy`.
The frontend colours the grid itself (same classes as `map_fun_cols_ws.R`), answers the
"Display current values on popup" click from it, and builds the GeoTIFF download from it.

### `GET /remote-sensing/{indicator}/point?lon=..&lat=..`

Time series of the nearest grid cell (`xarray.Dataset.sel(..., method="nearest")`),
for every date of the indicator.

```json
{
  "indicator": "ssm",
  "lon": 27.9525, "lat": 45.1525,
  "series": [ { "date": "2015-04-01", "value": 61.3 }, { "date": "2015-05-01", "value": null } ]
}
```

`lon` and `lat` are the centre of the selected cell. A cell outside the LTSER areas returns
all values `null`; the frontend then shows "click on an area with indicator values available".

## 2. Administrative level (Shiny tab "Remote sensing / Admin level")

Source: `www/data/parquet/{ltser,nut}/{indicator}_mon.parquet` with columns `ID`, `date`, `value`.

### `GET /admin/{unit}/{indicator}?date=YYYY-MM-01`

`unit` is `ltser` or `nut`.

```json
[ { "id": "1", "value": 64.2 }, { "id": "180046", "value": 58.9 } ]
```

### `GET /admin/{unit}/{indicator}/series?id=..`

```json
[ { "date": "2015-04-01", "value": 60.1 }, { "date": "2015-05-01", "value": 57.4 } ]
```

The frontend cuts the series at the selected month, as the Shiny app did.

## 3. Weather stations (Shiny tab "Lifewatch networks / Data / Weather stations")

Source: `www/data/parquet/meteo/{hourly,daily}/` with columns `id`, `time`, `variable`, `values`.
`resolution` is `hourly` or `daily`. Variable ids follow `www/data/tabs/select_input_meteo_*.csv`:
`tmin_01h`, `tmean_01h`, `tmax_01h`, `psmin_01h`, `psmean_01h`, `psmax_01h`, `hurmin_01h`,
`hurmean_01h`, `hurmax_01h`, `wsmax_01h`, `wsavg_01h`, `irrmean_01h`, `tsmean_01h`,
`shmean_01h`, `trsum_01h`, and the same names with `_24h` for daily data.

### `GET /meteo/{resolution}/range?variable=..`

```json
{ "min": "2023-08-22T01:00:00Z", "max": "2024-11-03T23:00:00Z", "latest": "2024-11-03T23:00:00Z" }
```

`latest` is the last time at which at least two stations have a value for the variable
(the `observeEvent` in `server_data_ws.R`). The time picker opens there.

### `GET /meteo/{resolution}/snapshot?variable=..&time=..`

```json
[ { "id": "BR-Mar", "value": 8.6 }, { "id": "IF-Cor", "value": 9.1 } ]
```

### `GET /meteo/{resolution}/series?station=..&groups=tm,ws&since=..&until=..`

Long format, every variable whose first two letters are in `groups`, `since <= time <= until`.
The frontend asks for 7 days (hourly) or 31 days (daily) ending at the selected time and
pairs the groups like `utils/subset_param.R` (`tm`+`ws`, `ps`+`hu`, `ts`+`ir`, `tr`+`sh`).

```json
[
  { "time": "2024-11-03T12:00:00Z", "variable": "tmean_01h", "value": 8.6 },
  { "time": "2024-11-03T12:00:00Z", "variable": "wsavg_01h", "value": 3.1 }
]
```

## 4. Eddy covariance (Shiny tab "Lifewatch networks / Data / Eddy covariance")

Source: `www/data/parquet/ec/` with columns `id`, `time_eet`, `variable`, `values`.
Variables follow `select_input_ec_halfhourly.csv`: `co2_flux`, `LE`, `H`, `ET`,
`RN_1_1_1`, `RH_1_1_1`, `PPFD_1_1_1`.

### `GET /eddy-covariance/halfhourly/range?variable=..`

```json
{ "min": "2024-03-15T00:00:00", "max": "2024-11-03T23:30:00", "latest": "2024-11-03T23:30:00" }
```

`latest` is the last time with at least two stations. The picker opens at 12:00 that day.

### `GET /eddy-covariance/halfhourly/snapshot?variable=..&time=..`

```json
[ { "id": "enisala", "value": -0.74 }, { "id": "imb", "value": -0.28 } ]
```

### `GET /eddy-covariance/halfhourly/series?station=..&variable=..&since=..&until=..`

`since < time_eet <= until`, 7 days ending at the selected time.

```json
[ { "time": "2024-11-03T12:00:00", "value": -0.74 } ]
```

### Camera images (static files)

`GET /media/ec/{id}/{YYYY}/{MM}/{DD}/{id}_{YYYY-MM-DD-HHMM}.jpg`, the same tree as
`www/data/img/ec/` in the Shiny app. A 404 makes the frontend show "no image available".
The media base URL is configurable (`mediaBaseUrl`) if images live on another host.

## 5. Station metadata (Shiny tab "Lifewatch networks / Metadata")

Station positions and attributes ship with the frontend (`public/data/networks.json`,
built from the `*.geojson` files of the Shiny app). Only the photos come from the backend:

`GET /media/meta/{network}/{Name}.png`, the same tree as `www/data/img/meta/`.
`network` is one of `ws`, `ec`, `cu`, `ra`, `co`, `bu`; `Name` is the displayed station code.

## 6. Social indicators (Shiny tab "Social indicators")

Source: `www/data/parquet/socio/pop108d.parquet` (columns `uat`, `an`, `sex`, `varsta`, `value`)
and `pop309e.parquet` (columns `uat`, `an`, `value`). Years come from `socio_years.rds`
(pop108d: 1992 to 2022, pop309e: 1994 to 2021) and are bundled with the frontend.

### `GET /social/{indicator}?year=..&sex=..&age=..`

`sex`: `3` all, `1` females, `2` males. `age`: `-1` all ages, `0` newborns, `1` to `85`,
`86` for 85 and over. `sex` and `age` apply to `pop108d` only.

```json
[ { "uat": "180046", "value": 2661 } ]
```

UATs without a row are shown as `0`, like the Shiny app.

### `GET /social/{indicator}/series?uat=..&sex=..&age=..`

```json
[ { "year": 1992, "value": 3120 }, { "year": 1993, "value": 3088 } ]
```

## Same-origin proxy

The browser never calls the services directly. The page requests `/lifewatch-api/...` and
`/ltser-api/...` on its own origin, and a reverse proxy forwards them:

| Prefix | Forwarded to | Development | Production |
| --- | --- | --- | --- |
| `/lifewatch-api/` | LifeWatch FastAPI root | Vite, `LIFEWATCH_API_URL` in `.env.local` | `deploy/nginx.conf.example` |
| `/ltser-api/` | LTSER API base (`/api/v1`) | Vite, `LTSER_API_URL` in `.env.local` | `deploy/nginx.conf.example` |

This mirrors the original applications, where the Shiny server and the Next.js server made
the data requests on behalf of the browser. Neither API needs CORS settings.

If the services must instead be called on another origin, set absolute URLs in
`public/runtime-config.js` and add CORS to each service. For the LifeWatch FastAPI app:

```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://ltser.example.ro"],  # the origin serving the frontend
    allow_methods=["GET"],
    allow_headers=["*"],
)
```

## LifeWatch API: what the frontend needs

The frontend calls these existing routes unchanged: `GET /health`, `GET /stations`,
`GET /stations/{id}`, `GET /stations/{id}/measurements` (repeated `variables`, optional
`since` and `until` as ISO 8601 with offset), `GET /variables` and `GET /stations/snapshot`.
It respects the limits of the API: windows shorter than 7 days, and a warning when a series
reaches the 50 000 row cap.

Two details in `main.py` worth fixing on the backend side:

1. In `GET /measurements`, the meteorological branch filters `table.timestamp >= until`
   instead of `<= until`, so it returns no rows for a normal window. The frontend does not
   use this route; it uses the per-station route instead.
2. In `GET /stations/snapshot`, the list comprehension that builds `stations` sits inside the
   `for row in results` loop, so it runs once per row. The result is correct but the work is
   quadratic; moving it out of the loop is enough.
