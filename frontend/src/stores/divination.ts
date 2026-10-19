import { defineStore } from 'pinia'
import { computed, ref, shallowRef, watch } from 'vue'
import { graphApi } from '@/api'
import { getSwe, getMitSolar, type SolarSource } from '@selfos/destiny-core/ephemeris'
import { DEFAULT_BAZI_OPTIONS, annualPillars, computeBazi, monthlyPillars } from '@selfos/destiny-core/bazi'
import { DEFAULT_WESTERN_SETTINGS, computeWestern, SIGNS } from '@selfos/destiny-core/western'
import { DEFAULT_VEDIC_SETTINGS, computeVedic, GRAHA_IDS, RASHI } from '@selfos/destiny-core/vedic'
import { computeZiwei, type ZiweiChart } from '@selfos/destiny-core/ziwei'
import type { AnnualPillar, BaziChart, BaziOptions, BirthProfile, InnateSummary, MonthlyPillar, VedicChart, VedicSettings, WesternChart, WesternSettings } from '@/types'

const KEY = 'selfos.birth.v2'

const DEFAULT_PROFILE: BirthProfile = {
  name: '',
  year: 2000, month: 1, day: 1, hour: 12, minute: 0,
  calendar: 'solar', lunarLeap: false, gender: 'F',
  place: '北京', latitude: 39.9042, longitude: 116.4074, timeZone: 'Asia/Shanghai', dst: 'auto',
  context: { cityTier: 'unknown', family: 'unknown', education: 'unknown', occupation: 'unknown' },
}

function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw ? { ...fallback, ...JSON.parse(raw) } : fallback
  } catch {
    return fallback
  }
}
function save(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    /* storage unavailable */
  }
}

export const useDivinationStore = defineStore('divination', () => {
  const birth = ref<BirthProfile>(load(KEY, DEFAULT_PROFILE))
  const baziOptions = ref<BaziOptions>(load(`${KEY}.bazi`, DEFAULT_BAZI_OPTIONS))
  const westernSettings = ref<WesternSettings>(load(`${KEY}.western`, DEFAULT_WESTERN_SETTINGS))
  const vedicSettings = ref<VedicSettings>(load(`${KEY}.vedic`, DEFAULT_VEDIC_SETTINGS))
  /** True once the user has confirmed a profile; nothing is cast before that. */
  const ready = ref<boolean>(load(`${KEY}.ready`, { ok: false }).ok)
  watch(ready, (v) => save(`${KEY}.ready`, { ok: v }))
  watch(birth, (v) => save(KEY, v), { deep: true })
  watch(baziOptions, (v) => save(`${KEY}.bazi`, v), { deep: true })
  watch(westernSettings, (v) => save(`${KEY}.western`, v), { deep: true })
  watch(vedicSettings, (v) => save(`${KEY}.vedic`, v), { deep: true })

  /**
   * Which systems to cast and which solar backend to use for 八字. The selfOS site casts all
   * four on the Swiss Ephemeris; the standalone 八字 product casts 八字 + 紫微 on the MIT backend
   * so it never loads (or depends on) Swiss Ephemeris.
   */
  const config = ref<{ systems: ('bazi' | 'ziwei' | 'western' | 'vedic')[]; solar: 'swiss' | 'mit' }>({ systems: ['bazi', 'ziwei', 'western', 'vedic'], solar: 'swiss' })
  function configure(c: Partial<typeof config.value>) {
    config.value = { ...config.value, ...c }
  }
  async function solarSource(): Promise<SolarSource> {
    return config.value.solar === 'mit' ? getMitSolar() : getSwe()
  }

  const bazi = shallowRef<BaziChart | null>(null)
  const western = shallowRef<WesternChart | null>(null)
  const vedic = shallowRef<VedicChart | null>(null)
  const ziwei = shallowRef<ZiweiChart | null>(null)
  const loading = ref(false)
  const engineReady = ref(false)
  const error = ref<string | null>(null)
  const injected = ref<number | null>(null)

  // BaZi navigation state
  const luckIndex = ref<number | null>(null)
  const annualYear = ref<number | null>(null)
  const annual = shallowRef<AnnualPillar[]>([])
  const monthly = shallowRef<MonthlyPillar[]>([])

  const inputCore = computed(() => {
    const b = birth.value
    return { year: b.year, month: b.month, day: b.day, hour: b.hour, minute: b.minute, timeZone: b.timeZone, longitude: b.longitude, latitude: b.latitude, place: b.place, ignoreDst: b.dst === 'ignore' }
  })

  // Recompute live once a chart exists: edits to the profile or settings re-cast after a short pause.
  let recastTimer: number | undefined
  watch(
    [birth, baziOptions, westernSettings, vedicSettings],
    () => {
      if (!bazi.value || !ready.value) return
      window.clearTimeout(recastTimer)
      recastTimer = window.setTimeout(() => cast(), 350)
    },
    { deep: true },
  )

  async function cast() {
    loading.value = true
    error.value = null
    try {
      const solar = await solarSource()
      engineReady.value = true
      const b = birth.value
      const baziChart = computeBazi(solar, { ...inputCore.value, calendar: b.calendar, lunarLeap: b.lunarLeap, gender: b.gender }, baziOptions.value)
      // Western and Vedic always take the civil solar date; convert lunar input through the BaZi result.
      const civil = baziChart.time.civil
      const solarInput = { ...inputCore.value, year: civil.year, month: civil.month, day: civil.day, hour: civil.hour, minute: civil.minute }
      bazi.value = baziChart
      const sys = config.value.systems
      if (sys.includes('western') || sys.includes('vedic')) {
        const swe = await getSwe()
        western.value = sys.includes('western') ? computeWestern(swe, solarInput, westernSettings.value) : null
        vedic.value = sys.includes('vedic') ? computeVedic(swe, solarInput, vedicSettings.value) : null
      } else {
        western.value = null
        vedic.value = null
      }
      ziwei.value = sys.includes('ziwei') ? await computeZiwei({ year: civil.year, month: civil.month, day: civil.day, hour: civil.hour, minute: civil.minute, gender: b.gender }) : null
      // Default 大运 selection: the one running now
      const now = new Date().getFullYear()
      const cur = baziChart.luck.pillars.find((l) => l.startYear <= now && now <= l.endYear) ?? baziChart.luck.pillars[0]
      selectLuck(cur.index)
    } catch (e) {
      error.value = (e as Error).message
    } finally {
      loading.value = false
    }
  }

  /** Confirm the profile from the wizard and cast. */
  async function commitProfile() {
    ready.value = true
    await cast()
  }

  function selectLuck(index: number) {
    if (!bazi.value) return
    luckIndex.value = index
    const lp = bazi.value.luck.pillars.find((l) => l.index === index)!
    annual.value = annualPillars(bazi.value, lp)
    const now = new Date().getFullYear()
    const y = annual.value.find((a) => a.year === now)?.year ?? annual.value[0].year
    selectYear(y)
  }

  async function selectYear(year: number) {
    if (!bazi.value) return
    annualYear.value = year
    monthly.value = monthlyPillars(await solarSource(), bazi.value, year)
  }

  const summary = computed<InnateSummary | null>(() => {
    if (!bazi.value) return null
    const b = bazi.value
    const w = western.value
    const v = vedic.value
    const z = ziwei.value
    const wb = (id: string) => w?.bodies.find((x) => x.id === id)
    return {
      birth: birth.value,
      bazi: {
        pillars: b.pillars.map((p) => p.stemChar + p.branchChar), dayMaster: b.dayMaster.stemChar,
        fiveElements: b.fiveElements, strength: b.strength.verdict, pattern: b.strength.pattern, favourable: b.strength.favourable,
      },
      western: w
        ? {
            sun: SIGNS[wb('sun')!.sign].en, moon: SIGNS[wb('moon')!.sign].en, ascendant: SIGNS[wb('asc')!.sign].en,
            elements: Object.fromEntries(Object.entries(w.tally.elements).map(([k, v]) => [k, v.length])),
          }
        : undefined,
      vedic: v
        ? {
            lagna: RASHI[v.lagna.sign].en, moonNakshatra: v.panchanga.nakshatra.name,
            currentDasha: v.dasha.current.map((p) => GRAHA_IDS[p.lord]),
            shadbala: Object.fromEntries(v.shadbala.map((s) => [GRAHA_IDS[s.graha], Math.round(s.rupas * 100) / 100])),
          }
        : undefined,
      ziwei: z
        ? {
            soulPalace: z.soulBranch, bodyPalace: z.bodyBranch, fiveElementsClass: z.fiveElementsClass, soul: z.soul, body: z.body,
            soulStars: z.palaces.find((p) => p.isSoul)?.majorStars.map((s) => s.name) ?? [],
          }
        : undefined,
    }
  })

  async function injectAsMemory() {
    if (!summary.value) return null
    const res = await graphApi.injectMemory(summary.value)
    injected.value = res.anchors
    return res
  }

  return {
    birth, baziOptions, westernSettings, vedicSettings,
    config, configure, ready, bazi, western, vedic, ziwei, loading, engineReady, error, injected,
    luckIndex, annualYear, annual, monthly, summary,
    cast, commitProfile, selectLuck, selectYear, injectAsMemory,
  }
})
