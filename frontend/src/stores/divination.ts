import { defineStore } from 'pinia'
import { ref } from 'vue'
import { divinationApi, graphApi } from '@/api'
import type { BaziChart, BaziRequest, ShadbalaResult, VedicChart, VedicRequest } from '@/types'

export interface BirthData {
  date: string
  time: string
  calendar: 'solar' | 'lunar'
  gender: 'M' | 'F'
  latitude: number
  longitude: number
  timezone: number
  place: string
  ayanamsa: string
}

export const useDivinationStore = defineStore('divination', () => {
  const birth = ref<BirthData>({
    date: '1990-05-15',
    time: '12:00',
    calendar: 'solar',
    gender: 'F',
    latitude: 39.9042,
    longitude: 116.4074,
    timezone: 8,
    place: 'Beijing',
    ayanamsa: 'LAHIRI',
  })
  const bazi = ref<BaziChart | null>(null)
  const vedic = ref<VedicChart | null>(null)
  const shadbala = ref<ShadbalaResult | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)
  const injected = ref<number | null>(null)

  function baziRequest(): BaziRequest {
    const [year, month, day] = birth.value.date.split('-').map(Number)
    const [hour] = birth.value.time.split(':').map(Number)
    return { year, month, day, hour, calendar: birth.value.calendar, gender: birth.value.gender }
  }
  function vedicRequest(): VedicRequest {
    const [year, month, day] = birth.value.date.split('-').map(Number)
    const [hour, minute] = birth.value.time.split(':').map(Number)
    const { latitude, longitude, timezone, ayanamsa } = birth.value
    return { year, month, day, hour, minute, latitude, longitude, timezone, ayanamsa }
  }

  async function cast() {
    loading.value = true
    error.value = null
    try {
      const vreq = vedicRequest()
      const [b, v, s] = await Promise.all([
        divinationApi.baziChart(baziRequest()),
        divinationApi.vedicChart(vreq),
        divinationApi.shadbala(vreq),
      ])
      bazi.value = b
      vedic.value = v
      shadbala.value = s
    } catch (e) {
      error.value = (e as Error).message
    } finally {
      loading.value = false
    }
  }

  async function injectAsMemory() {
    const res = await graphApi.injectMemory({ bazi: baziRequest(), vedic: vedicRequest() })
    injected.value = res.anchors
    return res
  }

  return { birth, bazi, vedic, shadbala, loading, error, injected, cast, injectAsMemory }
})
