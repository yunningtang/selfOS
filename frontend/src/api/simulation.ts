import { api } from './client'
import type {
  AgentsResponse,
  InterviewRequest,
  InterviewResponse,
  SimulationInjectRequest,
  SimulationStartRequest,
  SimulationStatus,
} from '@/types'

const demo = () => import('./mock/simulation')

export const simulationApi = {
  /** POST /api/simulation/start */
  start: (body: SimulationStartRequest) =>
    api.post<SimulationStatus>('/simulation/start', body, { demo: async () => (await demo()).demoStart(body) }),

  /** GET /api/simulation/status */
  status: () => api.get<SimulationStatus>('/simulation/status', { demo: async () => (await demo()).demoStatus() }),

  /** POST /api/simulation/inject */
  inject: (body: SimulationInjectRequest) =>
    api.post<SimulationStatus>('/simulation/inject', body, { demo: async () => (await demo()).demoInject(body) }),

  /** GET /api/simulation/agents */
  agents: () => api.get<AgentsResponse>('/simulation/agents', { demo: async () => (await demo()).demoAgents() }),

  /** POST /api/simulation/interview */
  interview: (body: InterviewRequest) =>
    api.post<InterviewResponse>('/simulation/interview', body, {
      demo: async () => (await demo()).demoInterview(body),
    }),
}
