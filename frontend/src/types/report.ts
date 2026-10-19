/** Types for /api/report — individuation reports and ReportAgent chat. */

export interface ReportEvidence {
  memoryIds: string[]
  assumptions: string[]
  simulationEventIds: string[]
}

export interface ReportSection {
  id: string
  heading: string
  paragraphs: string[]
  evidence: ReportEvidence
}

export interface Report {
  id: string
  title: string
  createdAt: string
  summary: string
  parameters: {
    before: { grip: number; resistance: number }
    after: { grip: number; resistance: number }
  }
  sections: ReportSection[]
}

export interface ReportGenerateRequest {
  simulationId?: string | null
  focus?: string
}

export interface ReportChatRequest {
  reportId: string
  message: string
}

export interface ReportChatResponse {
  reply: string
  citations?: { memoryId?: string; sectionId?: string }[]
}
