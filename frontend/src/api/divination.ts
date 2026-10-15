import { api } from './client'
import type {
  BaziChart,
  BaziRequest,
  PlanetPosition,
  ShadbalaResult,
  VedicChart,
  VedicRequest,
} from '@/types'

const demo = () => import('./mock/divination')

export const divinationApi = {
  /** POST /api/divination/bazi/chart */
  baziChart: (body: BaziRequest) =>
    api.post<BaziChart>('/divination/bazi/chart', body, { demo: async () => (await demo()).demoBazi(body) }),

  /** POST /api/divination/vedic/chart */
  vedicChart: (body: VedicRequest) =>
    api.post<VedicChart>('/divination/vedic/chart', body, { demo: async () => (await demo()).demoVedic(body) }),

  /** POST /api/divination/vedic/shadbala */
  shadbala: (body: VedicRequest) =>
    api.post<ShadbalaResult>('/divination/vedic/shadbala', body, {
      demo: async () => (await demo()).demoShadbala(body),
    }),

  /** GET /api/divination/ephemeris/planet */
  planet: (params: { jd: number; planet: string; flags?: number }) =>
    api.get<PlanetPosition>('/divination/ephemeris/planet', { query: params }),
}
