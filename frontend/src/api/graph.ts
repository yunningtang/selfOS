import { api } from './client'
import type {
  GraphBuildResult,
  InjectMemoryRequest,
  InjectMemoryResult,
  MemoryRecord,
  SeedKind,
  SephirothState,
} from '@/types'

const demo = () => import('./mock/graph')

export interface SeedFile {
  file: File
  kind: SeedKind
}

export const graphApi = {
  /** POST /api/graph/build — multipart: files[], kinds[], intent */
  build: (files: SeedFile[], intent: string, text?: string) => {
    const form = new FormData()
    files.forEach(({ file, kind }) => {
      form.append('files', file)
      form.append('kinds', kind)
    })
    form.append('intent', intent)
    if (text) form.append('text', text)
    return api.post<GraphBuildResult>('/graph/build', form, {
      demo: async () => (await demo()).demoBuild(files.length, Boolean(text)),
    })
  },

  /** GET /api/graph/sephiroth */
  sephiroth: () => api.get<SephirothState>('/graph/sephiroth', { demo: async () => (await demo()).demoSephiroth() }),

  /** POST /api/graph/inject-memory */
  injectMemory: (body: InjectMemoryRequest) =>
    api.post<InjectMemoryResult>('/graph/inject-memory', body, {
      demo: async () => ({ anchors: (body.bazi ? 8 : 0) + (body.vedic ? 12 : 0), message: 'Innate memory anchored.' }),
    }),

  /**
   * GET /api/graph/memories — memory records for the Memory Chamber.
   * Not yet listed in the backend README; served from the demo fixture until it exists.
   */
  memories: () => api.get<MemoryRecord[]>('/graph/memories', { demo: async () => (await demo()).demoMemories() }),
}
