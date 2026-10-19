# selfOS frontend

Vue 3 + TypeScript + Vite implementation of the selfOS interface, designed with the
**Liquid Consciousness** design system (see [`DESIGN.md`](./DESIGN.md)).

```bash
cd frontend
npm install
npm run dev        # http://localhost:3000, proxies /api → http://localhost:5001
npm run build      # type-check + production build
```

## Backend contract

All calls go through `src/api/*` and follow the endpoints documented in the root README:

| Module | Endpoints |
|---|---|
| `divination.ts` | `POST /api/divination/bazi/chart`, `POST /api/divination/vedic/chart`, `POST /api/divination/vedic/shadbala`, `GET /api/divination/ephemeris/planet` |
| `graph.ts` | `POST /api/graph/build` (multipart), `GET /api/graph/sephiroth`, `POST /api/graph/inject-memory`, `GET /api/graph/memories` *(proposed — not yet in the backend README)* |
| `simulation.ts` | `POST /api/simulation/start`, `GET /api/simulation/status`, `POST /api/simulation/inject`, `GET /api/simulation/agents`, `POST /api/simulation/interview` |
| `report.ts` | `POST /api/report/generate`, `GET /api/report/{id}`, `POST /api/report/chat` |

Response shapes are defined in `src/types/`. Responses wrapped as `{ success, data }` are unwrapped automatically.

## Data mode

`VITE_DATA_MODE` (see `.env.example`):

- `auto` *(default)* — use the backend; if it is unreachable, fall back to bundled demo data and show a **Demo data** badge in the top bar. The backend is retried every 30 s.
- `live` — backend only.
- `demo` — never call the backend.

Demo BaZi charts are computed for real with `lunar-javascript`; demo Vedic positions use
`astronomy-engine` with a linear Lahiri ayanamsa. Demo Shadbala, narrative graph, memories,
council run and reports are fictional samples and are labelled as such. All demo code is
lazy-loaded and never ships on the live path.

## Structure

```
src/
├── api/            # typed clients + mock/ (demo fixtures, lazy)
├── components/
│   ├── ambient/    # AmbientField, LiquidOrb
│   ├── layout/     # AppShell, NavRail, TopBar, TabBar, PipelineTrack
│   ├── ui/         # LqButton, LqSegmented, LqMeter, LqTag, LqField, PageHeader, Notice
│   ├── SephirothMap/  EnergyFlow/  BaZiChart/  VedicChart/  Council/  Memory/
├── data/           # Tree of Life topology, lexicon (archetypes, elements, grahas)
├── stores/         # Pinia: ui, graph, divination, simulation, report
├── styles/         # tokens, base, materials, motion
└── views/          # Threshold, SeedUpload, GraphBuilder (Inner Atlas), MemoryChamber,
                    # ChartCasting (Celestial Engine), Simulation (Inner Council), Report (Reflection)
```
