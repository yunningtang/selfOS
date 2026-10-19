/** Demo-mode individuation report and ReportAgent replies. */
import type { Report, ReportChatRequest, ReportChatResponse, ReportGenerateRequest } from '@/types'

export function demoReport(body: ReportGenerateRequest, id?: string): Promise<Report> {
  const report: Report = {
    id: id ?? `r_demo_${Date.now().toString(36)}`,
    title: body.focus?.trim() ? body.focus.trim() : 'The Limiter and the unpainted Saturday',
    createdAt: new Date().toISOString(),
    summary:
      'Across ten rounds the council returned to one pattern: desire is voiced, then immediately reframed as risk. The tension is not between work and rest but between two ideas of safety. A bounded experiment was agreed, and grip on the “rest must be earned” belief loosened measurably.',
    parameters: { before: { grip: 0.68, resistance: 0.57 }, after: { grip: 0.54, resistance: 0.46 } },
    sections: [
      {
        id: 's1',
        heading: 'What the council kept returning to',
        paragraphs: [
          'In eight of ten rounds, the first response to the Creator came from the Limiter, usually within the same exchange. The objection was rarely about the specific activity. It was about exposure — the possibility of wanting something visibly and being judged for it.',
          'The Persona reinforced this by tying preparedness to belonging. Neither agent is wrong about what it protects; both overestimate how much protection is needed.',
        ],
        evidence: {
          memoryIds: ['m03', 'm07', 'm12'],
          assumptions: [
            'Limiter initial weight raised by the strong metal (金) count in the innate chart.',
            'Exam-year memory treated as an emotional anchor with valence −0.6.',
          ],
          simulationEventIds: ['ev0', 'ev2', 'ev3'],
        },
      },
      {
        id: 's2',
        heading: 'Where the shadow surfaced',
        paragraphs: [
          'The shadow field did not appear as an adversary. It arrived through the recurring green-door dreams and carried the Creator’s unlived life — the painter in the studio. Its resistance fell once the Persona’s fear was named directly.',
          'This matches the energy retention seen on the Tree of Life paths between Netzach and Hod (Peh, path 27), where flow ran backward for most of the run.',
        ],
        evidence: {
          memoryIds: ['m02', 'm06', 'm10', 'm16'],
          assumptions: ['Dream imagery weighted as Yesod content.', 'Path 27 retention threshold: |flow| > 0.4 against expected direction.'],
          simulationEventIds: ['ev4', 'ev9'],
        },
      },
      {
        id: 's3',
        heading: 'The integration the Self proposed',
        paragraphs: [
          'Tiphereth identified the deeper need as “safety that does not require self-erasure.” The Self did not override the Limiter; it gave it a boundary to guard — three hours on Saturday morning — which the Limiter accepted.',
          'Small agreements like this one are the unit of change selfOS looks for. It is worth watching whether the agreement holds, and what the Persona says afterwards.',
        ],
        evidence: {
          memoryIds: ['m13', 'm18'],
          assumptions: ['Current Vimshottari antardasha treated as a mild amplifier of structure-seeking.'],
          simulationEventIds: ['ev8', 'ev10'],
        },
      },
      {
        id: 's4',
        heading: 'Questions to carry',
        paragraphs: [
          'What would the Limiter need to hear to trust rest as much as it trusts effort?',
          'When the painting exists, who is it for?',
        ],
        evidence: { memoryIds: ['m14'], assumptions: [], simulationEventIds: [] },
      },
    ],
  }
  return new Promise((r) => setTimeout(() => r(report), 900))
}

export function demoChat(body: ReportChatRequest): Promise<ReportChatResponse> {
  const q = body.message.toLowerCase()
  const reply = q.includes('shadow')
    ? 'The shadow content in this run was mostly creative and image-based rather than aggressive. It surfaced through the recurring green-door dreams (2009, 2017, 2025) and lost resistance once the Persona’s fear of judgement was named.'
    : q.includes('limiter') || q.includes('why')
      ? 'The Limiter’s strength has two sources in the model: the innate chart (a metal-heavy BaZi weighting) and the narrative graph, where the exam-year memory is a strong negative anchor. Together they give it the highest starting activation in the council.'
      : 'I can trace any claim in the report back to the memories, assumptions and simulation events behind it. Try asking about the Limiter, the shadow, or the agreement the Self proposed.'
  return new Promise((r) => setTimeout(() => r({ reply, citations: [{ sectionId: 's1' }] }), 800))
}
