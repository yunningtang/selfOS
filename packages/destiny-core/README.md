# @selfos/destiny-core

命盘引擎与分析层，无界面。四柱八字、紫微斗数、西方占星与 Jyotish 全部在本地计算，天文部分基于 Swiss Ephemeris（WASM）。

Chart engines and analysis with no UI. BaZi, Zi Wei Dou Shu, Western astrology and Jyotish, computed locally on the Swiss Ephemeris (WASM).

```ts
import { getSwe } from '@selfos/destiny-core/ephemeris/swe'
import { computeBazi } from '@selfos/destiny-core/bazi/chart'
import { analyseBazi } from '@selfos/destiny-core/bazi/analysis'
import { computeVerdicts } from '@selfos/destiny-core/bazi/verdicts'

const swe = await getSwe()
const chart = computeBazi(swe, { year: 2003, month: 7, day: 27, hour: 8, minute: 0, calendar: 'solar', timeZone: 'Asia/Shanghai', longitude: 116.4074, latitude: 39.9042, gender: 'F' }, { trueSolarTime: true, lateZi: 'next-day' })
const analysis = analyseBazi(chart)
const readings = computeVerdicts(chart, analysis)
```

模块 / Modules

- `ephemeris` — 儒略日、时区（含历史夏令时）、真太阳时、行星位置、宫位、岁差、节气
- `bazi` — 四柱、大运流年流月、藏干十神、旺衰模型、神煞、调候 / 金不换 / 格局选用、命局评分、断语规则
- `ziwei` — 十二宫、主辅杂曜、四化、大限流年（基于 iztro）
- `western` — 回归黄道、九种宫位制、相位与容许度、庙旺
- `vedic` — 恒星黄道、十六分盘、五要素、Vimshottari、Shadbala、Ashtakavarga

许可 / License: AGPL-3.0-or-later（Swiss Ephemeris 为 AGPL）。
