# selfOS frontend

Vue 3 + TypeScript + Vite implementation of the selfOS interface, designed with the
**Liquid Consciousness** design system (see [`DESIGN.md`](./DESIGN.md)).

```bash
cd frontend
npm install
npm run dev        # http://localhost:3000, proxies /api → http://localhost:5001
npm run build      # type-check + production build
```

## Chart engines (in the browser)

All three chart systems are computed client-side in `src/engines/` on top of the **Swiss Ephemeris**
(`swisseph-wasm`, Swiss Ephemeris 2.10 with the 1800–2400 AD planetary, lunar and asteroid files bundled,
~2.7 MB loaded only on the Celestial Engine page). Results match desktop programmes built on the same
ephemeris to the arc-second; `scripts/verify/*.mts` cross-check against the native `swetest` tool and
lunar-javascript (`npx tsx scripts/verify/bazi.mts`).

| Engine | What it computes |
|---|---|
| `engines/ephemeris` | Julian day ↔ civil time with IANA zones (historical DST, e.g. China 1986–1991), true solar time, positions, houses, ayanamsa, solar-term crossings |
| `engines/bazi` | 四柱 from exact 节气 (立春/节 moments from the ephemeris), 真太阳时 and 早晚子时 options, 十神 / 藏干 / 星运 / 自坐 / 空亡 / 纳音, 命宫 身宫 胎元 胎息, 大运 (起运 to the day) / 流年 / 流月, 五行旺衰 + 日主强弱 + 格局, 刑冲合会害, 40+ 神煞 |
| `engines/western` | Tropical positions for Sun…Pluto, Chiron, nodes, Lilith, asteroids, ASC/MC/Vertex/Fortune; 9 house systems (Placidus default); aspects with orbs and applying/separating; dignities; element/modality tallies |
| `engines/vedic` | Sidereal positions (Lahiri, True Chitra, Raman, KP, Yukteshwar…), lagna, nakshatra/pada, 16 Parashara vargas, panchanga (sunrise-based vara), Vimshottari to pratyantar, full Shadbala with every component, Ashtakavarga (BAV/SAV), compound relationships, bhava chalit |

The backend remains optional for charts; the graph, simulation and report APIs are unchanged.

## Backend contract

All calls go through `src/api/*` and follow the endpoints documented in the root README:

| Module | Endpoints |
|---|---|
| `graph.ts` | `POST /api/graph/build` (multipart), `GET /api/graph/sephiroth`, `POST /api/graph/inject-memory`, `GET /api/graph/memories` *(proposed — not yet in the backend README)* |
| `simulation.ts` | `POST /api/simulation/start`, `GET /api/simulation/status`, `POST /api/simulation/inject`, `GET /api/simulation/agents`, `POST /api/simulation/interview` |
| `report.ts` | `POST /api/report/generate`, `GET /api/report/{id}`, `POST /api/report/chat` |

Response shapes are defined in `src/types/`. Responses wrapped as `{ success, data }` are unwrapped automatically.

## Data mode

`VITE_DATA_MODE` (see `.env.example`):

- `auto` *(default)* — use the backend; if it is unreachable, fall back to bundled demo data and show a **Demo data** badge in the top bar. The backend is retried every 30 s.
- `live` — backend only.
- `demo` — never call the backend.

Charts are never demo data — they are always computed locally with the Swiss Ephemeris. The demo
fallback covers only the narrative graph, memories, council run and reports, which are fictional
samples labelled as such.

## Structure

```
src/
├── api/            # typed clients + mock/ (demo fixtures, lazy)
├── components/
│   ├── ambient/    # AmbientField, LiquidOrb
│   ├── layout/     # AppShell, NavRail, TopBar, TabBar, PipelineTrack
│   ├── ui/         # LqButton, LqSegmented, LqMeter, LqTag, LqField, PageHeader, Notice
│   ├── SephirothMap/  EnergyFlow/  BaZiChart/  VedicChart/  Council/  Memory/
├── data/           # Tree of Life topology, lexicon, city gazetteer
├── engines/        # ephemeris (Swiss Ephemeris WASM), bazi, western, vedic
├── stores/         # Pinia: ui, graph, divination, simulation, report
├── styles/         # tokens, base, materials, motion
└── views/          # Threshold, SeedUpload, GraphBuilder (Inner Atlas), MemoryChamber,
                    # ChartCasting (Celestial Engine), Simulation (Inner Council), Report (Reflection)
```
