/** Demo-mode Inner Council. A scripted, time-driven run so the interface can be explored offline. */
import type {
  Agent,
  AgentsResponse,
  InterviewRequest,
  InterviewResponse,
  SimEvent,
  SimulationInjectRequest,
  SimulationStartRequest,
  SimulationStatus,
} from '@/types'

const ROUND_MS = 2600

const BASE_AGENTS: Agent[] = [
  { id: 'self', name: 'Self', archetype: 'self', sephirah: 'tiphereth', description: 'Integrates the council’s outputs and holds long-term coherence.', activation: 0.48, grip: 0.12, resistance: 0.1, valence: 0.3, state: 'active' },
  { id: 'ego', name: 'Ego', archetype: 'ego', sephirah: 'malkuth', description: 'Executes and decides; carries the day-to-day narrative.', activation: 0.74, grip: 0.62, resistance: 0.4, valence: 0.05, state: 'active' },
  { id: 'persona', name: 'Persona', archetype: 'persona', sephirah: 'hod', description: 'Social adaptation — the competent, reliable face.', activation: 0.69, grip: 0.71, resistance: 0.52, valence: 0.1, state: 'active' },
  { id: 'shadow', name: 'Shadow field', archetype: 'shadow', sephirah: 'yesod', description: 'Latent field of repressed desire and unlived life. Not a fixed agent; it surfaces through perturbation.', activation: 0.41, grip: 0.3, resistance: 0.78, valence: -0.4, state: 'dormant' },
  { id: 'anima', name: 'Anima', archetype: 'anima', sephirah: 'binah', description: 'The inner other; carries feeling and image.', activation: 0.37, grip: 0.2, resistance: 0.35, valence: 0.35, state: 'active' },
  { id: 'creator', name: 'Creator', archetype: 'creator', sephirah: 'netzach', description: 'Desire to make. Starts low: fire is weak in the innate chart.', activation: 0.28, grip: 0.18, resistance: 0.6, valence: 0.2, state: 'dormant' },
  { id: 'limiter', name: 'Limiter', archetype: 'limiter', sephirah: 'geburah', description: 'Boundaries, discipline, defence. Strong metal emphasis lifts its initial weight.', activation: 0.82, grip: 0.77, resistance: 0.3, valence: -0.15, state: 'active' },
  { id: 'observer', name: 'Observer', archetype: 'observer', sephirah: 'kether', description: 'Meta-cognitive monitor. Annotates conflicts; never votes.', activation: 0.55, grip: 0, resistance: 0, valence: 0, state: 'active' },
]

const RELATIONS = [
  { source: 'limiter', target: 'creator', tension: -0.78 },
  { source: 'persona', target: 'shadow', tension: -0.7 },
  { source: 'ego', target: 'limiter', tension: 0.55 },
  { source: 'ego', target: 'persona', tension: 0.6 },
  { source: 'anima', target: 'creator', tension: 0.52 },
  { source: 'shadow', target: 'creator', tension: 0.34 },
  { source: 'self', target: 'ego', tension: 0.2 },
  { source: 'self', target: 'anima', tension: 0.4 },
  { source: 'observer', target: 'self', tension: 0.3 },
  { source: 'ego', target: 'shadow', tension: -0.35 },
]

type Scripted = Omit<SimEvent, 'id' | 'at'> & { effect?: Partial<Record<string, Partial<Agent>>> }

const SCRIPT: Scripted[] = [
  { round: 1, type: 'dialogue', agents: ['ego', 'limiter'], path: 32, text: 'Ego: “Saturday is free. I could finally start the painting.” Limiter: “The quarterly review is in nine days.”' },
  { round: 1, type: 'observation', agents: ['observer'], text: 'Observer notes a familiar sequence: desire voiced, immediately met with an obligation.' },
  { round: 2, type: 'conflict', agents: ['limiter', 'creator'], path: 27, text: 'Creator presses for unstructured time; Limiter classifies it as risk. Path 27 (Peh) shows reverse flow.', effect: { creator: { state: 'conflict', activation: 0.36 }, limiter: { state: 'conflict' } } },
  { round: 3, type: 'dialogue', agents: ['persona', 'ego'], path: 26, text: 'Persona: “People rely on you being prepared.” Ego agrees, but its valence drops slightly.' },
  { round: 3, type: 'shadow_activation', agents: ['shadow'], path: 30, text: 'Shadow field activates — the recurring green-door imagery is retrieved from memory (2017, 2025).', effect: { shadow: { state: 'active', activation: 0.58 } } },
  { round: 4, type: 'observation', agents: ['observer'], text: 'Conflict made conscious: “The fear isn’t of wasting a Saturday. It’s of wanting something that could be judged.”' },
  { round: 5, type: 'dialogue', agents: ['anima', 'creator'], path: 24, text: 'Anima offers an image: the studio from the dream, wet canvases, no audience. Creator’s activation rises.', effect: { creator: { activation: 0.52 }, anima: { activation: 0.5 } } },
  { round: 6, type: 'state_change', agents: ['limiter'], text: 'Limiter’s grip softens after the Observer separates the review deadline (real) from the imagined judgement (projected).', effect: { limiter: { grip: 0.58, state: 'active' } } },
  { round: 7, type: 'integration', agents: ['self', 'creator', 'limiter'], path: 22, text: 'Tiphereth extracts the core need: safety that does not require self-erasure. Self proposes a bounded experiment — three hours, Saturday morning.', effect: { self: { activation: 0.66, state: 'integrating' }, creator: { state: 'integrating' } } },
  { round: 8, type: 'dialogue', agents: ['persona', 'shadow'], path: 30, text: 'Persona asks what happens if the painting is bad. Shadow: “Then it will be yours.”', effect: { persona: { grip: 0.6 }, shadow: { resistance: 0.6 } } },
  { round: 9, type: 'integration', agents: ['self'], text: 'Self redistributes weights: Creator +0.14, Limiter −0.09. Memory updated with the agreement.', effect: { self: { activation: 0.7 }, limiter: { activation: 0.7 }, creator: { activation: 0.6, state: 'active' } } },
  { round: 10, type: 'observation', agents: ['observer'], text: 'Run complete. Grip fell from 0.68 to 0.54; resistance from 0.57 to 0.46.' },
]

const STEP_BY_ROUND = [1, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5]

let startedAt: number | null = null
let totalRounds = 10
let injected: SimEvent[] = []
let runId: string | null = null

function currentRound() {
  if (startedAt === null) return 0
  return Math.min(totalRounds, Math.floor((Date.now() - startedAt) / ROUND_MS) + 1)
}

function scriptedEvents(round: number): SimEvent[] {
  const base = startedAt ?? Date.now()
  return SCRIPT.filter((e) => e.round <= Math.min(round, 10)).map((e, i) => ({
    id: `ev${i}`,
    round: e.round,
    at: new Date(base + (e.round - 1) * ROUND_MS + i * 120).toISOString(),
    type: e.type,
    agents: e.agents,
    text: e.text,
    path: e.path,
  }))
}

function status(): SimulationStatus {
  const round = currentRound()
  const done = startedAt !== null && round >= totalRounds && Date.now() - startedAt >= totalRounds * ROUND_MS
  const progress = round / totalRounds
  return {
    id: runId,
    state: startedAt === null ? 'idle' : done ? 'complete' : 'running',
    round,
    totalRounds,
    step: startedAt === null ? 0 : STEP_BY_ROUND[Math.min(10, Math.round(progress * 10))],
    events: [...scriptedEvents(Math.round(progress * 10)), ...injected].sort((a, b) => a.at.localeCompare(b.at)),
    parameters: {
      grip: Math.round((0.68 - 0.14 * progress) * 100) / 100,
      resistance: Math.round((0.57 - 0.11 * progress) * 100) / 100,
    },
  }
}

export function demoStart(body: SimulationStartRequest): SimulationStatus {
  startedAt = Date.now()
  totalRounds = Math.max(1, Math.min(50, body.rounds))
  injected = []
  runId = `sim_demo_${startedAt.toString(36)}`
  return status()
}

export function demoStatus(): SimulationStatus {
  return status()
}

export function demoInject(body: SimulationInjectRequest): SimulationStatus {
  injected.push({
    id: `inj${injected.length}`,
    round: currentRound(),
    at: new Date().toISOString(),
    type: 'injection',
    agents: body.kind === 'event' ? ['ego'] : ['limiter', 'shadow'],
    text: `${body.kind === 'liunian' ? 'Annual pillar' : body.kind === 'dasha' ? 'Dasha period' : 'Life event'} injected: ${body.label} (intensity ${body.intensity.toFixed(2)}).`,
  })
  return status()
}

export function demoAgents(): AgentsResponse {
  const progress = startedAt === null ? 0 : currentRound() / totalRounds
  const reached = SCRIPT.filter((e) => e.round <= Math.round(progress * 10))
  const agents = BASE_AGENTS.map((a) => {
    const merged = { ...a }
    for (const e of reached) Object.assign(merged, e.effect?.[a.id] ?? {})
    return merged
  })
  return {
    agents,
    relations: RELATIONS.map((r) =>
      r.source === 'limiter' && r.target === 'creator' ? { ...r, tension: r.tension + 0.5 * progress } : r,
    ),
  }
}

const VOICES: Record<string, string[]> = {
  self: ['Both of them are trying to keep you safe. Only one of them knows what safety is for.', 'Hold the question a little longer before answering it.'],
  ego: ['I can schedule it. What I can’t do is make it feel allowed.', 'Honestly? I’m tired of being the one who decides.'],
  persona: ['People see someone dependable. I’d rather not find out what they’d see otherwise.', 'I can adapt to almost anything. That’s the problem.'],
  shadow: ['You keep leaving the door half-open and calling it caution.', 'I’m not the mess you think I am. I’m the part that still wants things.'],
  anima: ['Notice the colour in the dreams. Green is always where the feeling is.', 'You don’t have to explain the image. Let it stay an image.'],
  creator: ['Three hours. No plan. That’s all I’m asking for.', 'I don’t need it to be good. I need it to be mine.'],
  limiter: ['I’m not against joy. I’m against being caught unprepared.', 'Give me a boundary and I’ll guard it — even a boundary around rest.'],
  observer: ['Noted: the conversation shifted to the past tense when desire came up.', 'I don’t take sides. I can tell you that the Limiter spoke first four times out of five.'],
}

export function demoInterview(body: InterviewRequest): Promise<InterviewResponse> {
  const lines = VOICES[body.agentId] ?? ['…']
  const reply = lines[(body.message.length + Math.floor(Date.now() / 1000)) % lines.length]
  return new Promise((r) => setTimeout(() => r({ agentId: body.agentId, reply }), 700))
}
