/** Types for /api/simulation — the Inner Council. */
import type { SephirahId } from './graph'

export type ArchetypeKind =
  | 'self'
  | 'ego'
  | 'persona'
  | 'shadow'
  | 'anima'
  | 'creator'
  | 'limiter'
  | 'observer'

export type AgentState = 'dormant' | 'active' | 'conflict' | 'integrating'

export interface Agent {
  id: string
  name: string
  archetype: ArchetypeKind
  sephirah?: SephirahId
  description?: string
  /** 0–1 */
  activation: number
  /** Grip — attachment / clinging, 0–1 */
  grip: number
  /** Resistance, 0–1 */
  resistance: number
  /** Emotional valence −1…1 */
  valence: number
  state: AgentState
}

export interface AgentRelation {
  source: string
  target: string
  /** −1 (opposition) … 1 (alliance) */
  tension: number
}

export interface AgentsResponse {
  agents: Agent[]
  relations: AgentRelation[]
}

export type SimEventType =
  | 'dialogue'
  | 'conflict'
  | 'shadow_activation'
  | 'observation'
  | 'integration'
  | 'injection'
  | 'state_change'

export interface SimEvent {
  id: string
  round: number
  at: string
  type: SimEventType
  agents: string[]
  text: string
  /** Tree of Life path number the exchange travelled along, if any */
  path?: number
}

export type SimState = 'idle' | 'running' | 'complete' | 'error'

export interface SimulationStatus {
  id: string | null
  state: SimState
  round: number
  totalRounds: number
  /** Individuation Engine step 1–5 */
  step: number
  events: SimEvent[]
  parameters: { grip: number; resistance: number }
}

export interface SimulationStartRequest {
  rounds: number
  intent?: string
  graphId?: string
}

export interface SimulationInjectRequest {
  kind: 'liunian' | 'dasha' | 'event'
  label: string
  intensity: number
}

export interface InterviewRequest {
  agentId: string
  message: string
}

export interface InterviewResponse {
  agentId: string
  reply: string
}
