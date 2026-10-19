/** Types for /api/graph — GraphRAG narrative graph and Tree of Life topology. */

export type SephirahId =
  | 'kether'
  | 'chokmah'
  | 'binah'
  | 'chesed'
  | 'geburah'
  | 'tiphereth'
  | 'netzach'
  | 'hod'
  | 'yesod'
  | 'malkuth'

export interface SephirahState {
  id: SephirahId
  /** Normalised energy 0–1 */
  energy: number
  /** Short narrative reading produced by the graph engine */
  narrative?: string
  beliefs?: string[]
  memoryIds?: string[]
}

export interface PathState {
  /** Traditional path number 11–32 */
  id: number
  from: SephirahId
  to: SephirahId
  /** Communication weight 0–1 */
  weight: number
  /** Net flow −1…1; sign gives direction (positive = from → to) */
  flow: number
  /** Flagged as an energy retention point */
  stagnant?: boolean
}

export interface SephirothState {
  nodes: SephirahState[]
  paths: PathState[]
  updatedAt: string
}

export type SeedKind = 'diary' | 'dream' | 'social' | 'chat' | 'note'

export interface GraphBuildResult {
  graphId: string
  entities: number
  relations: number
  beliefClusters: { id: string; label: string; weight: number }[]
  emotionalAnchors: { id: string; label: string; valence: number }[]
}

export interface InjectMemoryResult {
  anchors: number
  message?: string
}
