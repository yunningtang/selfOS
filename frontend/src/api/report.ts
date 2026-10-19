import { api } from './client'
import type { Report, ReportChatRequest, ReportChatResponse, ReportGenerateRequest } from '@/types'

const demo = () => import('./mock/report')

export const reportApi = {
  /** POST /api/report/generate */
  generate: (body: ReportGenerateRequest) =>
    api.post<Report>('/report/generate', body, { demo: async () => (await demo()).demoReport(body) }),

  /** GET /api/report/{id} */
  get: (id: string) =>
    api.get<Report>(`/report/${encodeURIComponent(id)}`, { demo: async () => (await demo()).demoReport({}, id) }),

  /** POST /api/report/chat */
  chat: (body: ReportChatRequest) =>
    api.post<ReportChatResponse>('/report/chat', body, { demo: async () => (await demo()).demoChat(body) }),
}
