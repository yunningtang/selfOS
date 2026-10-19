# selfOS — Liquid Consciousness Design System

> A clear interface surrounding a fluid inner world.

The interface is quiet, opaque and structured where you read or decide; it becomes
liquid, translucent and alive only where it represents the psyche itself.
Every value below lives in `src/styles/tokens.css`; components never use raw hex.

## 1. Principles

| Principle | In practice |
|---|---|
| Clear frame, fluid content | Navigation, forms, tables and reports are calm and opaque. Orbs, filaments and atmosphere carry the "inner world". |
| Motion is identity, not decoration | Ambient motion is slow (7 s breathing, 22 s morph, 60 s drift). Responses are immediate (90–260 ms, spring). |
| Usable when still | With motion off, every view still works; direction on paths switches from flowing motes to static chevrons. |
| Glass is a material, used sparingly | Only floating layers (nav rail, inspectors, HUD, tab bar) are glass. Long-form reading is never on glass. |
| Precision over ornament | Charts are strict grids with tabular numerals and real glyphs. No gold, no tarot, no HUD chrome. |

## 2. Colour

| Token | Dark | Light | Use |
|---|---|---|---|
| `--bg` | `#0B0D12` | `#F5F6F8` | Page |
| `--surface` | `#151821` | `#FFFFFF` | Opaque panels |
| `--text` | `#F1F2F4` | `#20232B` | Primary text |
| `--text-2` | `#959AA8` | `#777D89` | Secondary text |
| `--c-lavender` | `#B5A9E8` | — | Primary accent, Binah/Hod, Anima |
| `--c-mist` | `#A8C8E0` | — | Flow, Chokmah/Chesed, Ego |
| `--c-pearl` | `#E7EAF3` | `#C4C9DA` | Kether/Tiphereth, Self |
| `--c-sage` | `#A2CDBB` | — | Harmony, Netzach/Malkuth, Observer |
| `--c-clay` | `#D9B2A6` | — | Tension / fire (supporting, sparing) |
| `--c-sand` | `#D3C6A6` | `#C7B68C` | Earth, innate memory (supporting) |

Gradients appear only inside liquid objects and the atmosphere. Hues are low-chroma by
design, so **colour is never the only carrier of meaning**: five-element bars, memory
kinds, event types and agents are always labelled in text beside their colour.

## 3. Typography

Inter Variable (self-hosted via `@fontsource-variable/inter`) for everything — headings,
body, buttons, numbers, charts. Fallbacks: `system-ui`, SF Pro, then system CJK sans
(PingFang SC, Noto Sans SC, Microsoft YaHei) for Chinese, and Noto Sans Hebrew for path letters.

- Scale: 11 / 12 / 13 / 15 (base) / 17 / 20 / 24 / 30 px.
- Weights: 400 body, 500 labels and headings, 600 only for the wordmark.
- `.t-num` applies `tabular-nums` to all live or aligned numbers (meters, tables, rounds, dates).
- No serif, mono, uppercase headings or wide tracking.

## 4. Materials

| Class | What it is |
|---|---|
| `.lq-glass` | Frosted membrane: vertical tint gradient, 22px blur, 1px conic iridescent rim (masked gradient border), caustic sheen pooled at the top edge, soft float shadow. Falls back to opaque surface without `backdrop-filter`. |
| `.lq-surface` | Opaque panel with a hairline. Forms, charts, reports. |
| `.lq-well` | Sunken area for data grids and inputs. |
| `LiquidOrb` | Psyche entity. Layered radial gradients (subsurface body, internal caustic, specular), a slowly turning iridescent film, border-radius morph. Variants: `liquid`, `clear` (glass bead — Persona), `diffuse` (density without surface — Shadow field), `ring` (membrane with nothing inside — Observer). |

## 5. Motion

| Token | Value | Use |
|---|---|---|
| `--dur-fast` / `--dur-base` | 160 / 260 ms | Hover, press, colour |
| `--dur-slow` | 520 ms | Panels, meters, thumbs |
| `--ease-spring` | `linear()` spring (≈ stiffness 170, damping 22) | Micro-interactions |
| `--dur-breathe` | 7 s | Orb halos |
| `--dur-morph` | 22 s | Orb deformation |
| `--dur-drift` | 60 s | Atmosphere |

- `v-ripple` emits a soft ripple from the pointer on buttons.
- `<html data-motion="full|reduced">` is set from `prefers-reduced-motion` and the user's
  own toggle (top bar or nav rail). Every ambient animation carries `.ambient-anim` and is
  disabled under `reduced`; JS-driven motion (d3 transitions, Three.js) checks the same flag.

## 6. Layout

- Desktop: floating glass nav rail (232px) grouped by the four worlds; content max 1360px.
- 761–1100px: icon-only rail.
- ≤760px: rail becomes a slide-in sheet; five core interfaces in a glass tab bar; inspectors
  become bottom sheets.
- Radii: 6 / 10 / 14 / 20 / 28 / pill. Separators are 1px hairlines, never heavy borders.

## 7. Core interfaces

| Interface | Route | Visual strategy |
|---|---|---|
| Threshold | `/` | Breathing Self orb with three orbiting bodies; the four-world pipeline as entry cards. |
| Seed (Atzilut) | `/seed` | Calm form; a clear liquid bead in the drop zone that brightens while dragging. |
| Inner Atlas | `/atlas` | Full-bleed SVG Tree of Life (10 nodes, 22 paths). Luminous nodes sized by energy; light motes travel paths at speed ∝ flow; retention points marked. d3-zoom pan/zoom/pinch; arrow keys walk connected nodes. Inspector + full path table. |
| Memory Chamber | `/memory` | Three.js helix of iridescent, transmissive spheres (only Three.js use). List and timeline views, search and kind filters alongside; opaque reading pane. |
| Celestial Engine | `/celestial` | Strict BaZi four-pillar grid with CJK glyphs; South/North Indian charts (D1/D9/D10), graha table, Vimshottari timeline, Shadbala bars with table view. Atmosphere only behind the header. |
| Inner Council | `/council` | Agents as differentiated liquid materials on a ring around the Self; alliance/opposition filaments; individuation steps; event stream with filters; per-agent interview. |
| Reflection | `/reflection` | Opaque editorial page, 68ch measure. Each section expands to its supporting memories, model assumptions and simulation events. ReportAgent chat below. |

## 8. Accessibility

- Skip link, landmark regions, visible `:focus-visible` rings on every control.
- Segmented controls are radio groups with arrow-key navigation.
- The Atlas map is `role="application"` with roving focus; every node has a full label; a
  tabular path list provides the same information without the map.
- The 3D Memory space is decorative to assistive tech; the List view carries the same archive.
- Charts have text labels and table equivalents; colour is never the only signal.
