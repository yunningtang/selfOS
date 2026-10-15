import { defineStore } from 'pinia'
import { ref } from 'vue'
import { reportApi, type ApiError } from '@/api'
import type { Report } from '@/types'

export interface ChatTurn {
  role: 'user' | 'agent'
  text: string
}

export const useReportStore = defineStore('report', () => {
  const reports = ref<Report[]>([])
  const activeId = ref<string | null>(null)
  const generating = ref(false)
  const error = ref<string | null>(null)
  const chats = ref<Record<string, ChatTurn[]>>({})
  const chatting = ref(false)

  async function generate(simulationId: string | null, focus?: string) {
    generating.value = true
    error.value = null
    try {
      const r = await reportApi.generate({ simulationId, focus })
      reports.value = [r, ...reports.value.filter((x) => x.id !== r.id)]
      activeId.value = r.id
    } catch (e) {
      error.value = (e as ApiError).message
    } finally {
      generating.value = false
    }
  }

  async function open(id: string) {
    const existing = reports.value.find((r) => r.id === id)
    if (existing) {
      activeId.value = id
      return
    }
    error.value = null
    try {
      const r = await reportApi.get(id)
      reports.value = [r, ...reports.value]
      activeId.value = r.id
    } catch (e) {
      error.value = (e as ApiError).message
    }
  }

  async function ask(reportId: string, message: string) {
    const log = (chats.value[reportId] ??= [])
    log.push({ role: 'user', text: message })
    chatting.value = true
    try {
      const res = await reportApi.chat({ reportId, message })
      log.push({ role: 'agent', text: res.reply })
    } catch (e) {
      log.push({ role: 'agent', text: `⚠ ${(e as ApiError).message}` })
    } finally {
      chatting.value = false
    }
  }

  return { reports, activeId, generating, error, chats, chatting, generate, open, ask }
})
