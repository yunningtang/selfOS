/** Memory records surfaced from the long-term memory layer (Zep / Neo4j). */
import type { SephirahId } from './graph'

export type MemoryKind = 'diary' | 'dream' | 'event' | 'conversation' | 'innate'

export interface MemoryRecord {
  id: string
  title: string
  /** ISO date */
  date: string
  kind: MemoryKind
  excerpt: string
  body: string
  tags: string[]
  sephirah?: SephirahId
  /** −1…1 */
  valence: number
  /** 0–1 */
  intensity: number
  links: string[]
}
