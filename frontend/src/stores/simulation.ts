import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { simulationApi, type ApiError } from '@/api'
import type { Agent, AgentRelation, SimulationInjectRequest, SimulationStatus } from '@/types'

export interface InterviewTurn {
  role: 'user' | 'agent'
  text: string
  at: string
}

export const useSimulationStore = defineStore('simulation', () => {
  const status = ref<SimulationStatus | null>(null)
  const agents = ref<Agent[]>([])
  const relations = ref<AgentRelation[]>([])
  const error = ref<string | null>(null)
  const starting = ref(false)
  const interviews = ref<Record<string, InterviewTurn[]>>({})
  const interviewing = ref(false)
  let timer: number | null = null

  const running = computed(() => status.value?.state === 'running')
  const agentById = computed(() => new Map(agents.value.map((a) => [a.id, a])))

  async function refresh() {
    try {
      const [s, a] = await Promise.all([simulationApi.status(), simulationApi.agents()])
      status.value = s
      agents.value = a.agents
      relations.value = a.relations
      error.value = null
      if (s.state !== 'running') stopPolling()
    } catch (e) {
      error.value = (e as ApiError).message
      stopPolling()
    }
  }

  function startPolling() {
    stopPolling()
    timer = window.setInterval(refresh, 2000)
  }
  function stopPolling() {
    if (timer !== null) window.clearInterval(timer)
    timer = null
  }

  async function start(rounds: number, intent?: string, graphId?: string) {
    starting.value = true
    try {
      status.value = await simulationApi.start({ rounds, intent, graphId })
      await refresh()
      startPolling()
    } catch (e) {
      error.value = (e as ApiError).message
    } finally {
      starting.value = false
    }
  }

  async function inject(body: SimulationInjectRequest) {
    try {
      status.value = await simulationApi.inject(body)
    } catch (e) {
      error.value = (e as ApiError).message
    }
  }

  async function interview(agentId: string, message: string) {
    const log = (interviews.value[agentId] ??= [])
    log.push({ role: 'user', text: message, at: new Date().toISOString() })
    interviewing.value = true
    try {
      const res = await simulationApi.interview({ agentId, message })
      log.push({ role: 'agent', text: res.reply, at: new Date().toISOString() })
    } catch (e) {
      log.push({ role: 'agent', text: `⚠ ${(e as ApiError).message}`, at: new Date().toISOString() })
    } finally {
      interviewing.value = false
    }
  }

  return {
    status, agents, relations, error, starting, running, agentById, interviews, interviewing,
    refresh, start, inject, interview, startPolling, stopPolling,
  }
})
