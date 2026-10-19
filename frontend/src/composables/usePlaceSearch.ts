import { computed, ref, watch } from 'vue'
import { CITIES } from '@/data/cities'

export interface Place {
  name: string
  detail: string
  lat: number
  lon: number
  tz: string
}

/** City search: bundled Chinese city list first, then any place in the world via the Open-Meteo geocoder (free, no key, returns the IANA zone). */
export function usePlaceSearch() {
  const query = ref('')
  const remote = ref<Place[]>([])
  const searching = ref(false)
  let timer: number | undefined
  let seq = 0
  const local = computed<Place[]>(() => {
    const q = query.value.trim().toLowerCase()
    if (!q) return []
    return CITIES.filter((c) => c.name.includes(q) || c.en.toLowerCase().includes(q)).slice(0, 6).map((c) => ({ name: c.name, detail: c.en, lat: c.lat, lon: c.lon, tz: c.tz }))
  })
  watch(query, (q) => {
    window.clearTimeout(timer)
    const term = q.trim()
    if (term.length < 2) {
      remote.value = []
      return
    }
    timer = window.setTimeout(async () => {
      const my = ++seq
      searching.value = true
      try {
        const lang = /[一-鿿]/.test(term) ? 'zh' : 'en'
        const r = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(term)}&count=8&language=${lang}&format=json`)
        const data = (await r.json()) as { results?: { name: string; latitude: number; longitude: number; country?: string; admin1?: string; timezone?: string }[] }
        if (my !== seq) return
        remote.value = (data.results ?? []).map((x) => ({
          name: x.name, detail: [x.admin1, x.country].filter(Boolean).join(' · '),
          lat: Math.round(x.latitude * 10000) / 10000, lon: Math.round(x.longitude * 10000) / 10000, tz: x.timezone || 'UTC',
        }))
      } catch {
        remote.value = []
      } finally {
        if (my === seq) searching.value = false
      }
    }, 300)
  })
  const matches = computed<Place[]>(() => {
    const seen = new Set<string>()
    return [...local.value, ...remote.value].filter((p) => {
      const k = `${p.lat.toFixed(2)},${p.lon.toFixed(2)}`
      if (seen.has(k)) return false
      seen.add(k)
      return true
    }).slice(0, 8)
  })
  function clear() {
    query.value = ''
    remote.value = []
  }
  return { query, matches, searching, clear }
}
