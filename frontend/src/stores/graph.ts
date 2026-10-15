import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { graphApi, type ApiError } from '@/api'
import type { SeedFile } from '@/api/graph'
import type { GraphBuildResult, MemoryRecord, SephirothState } from '@/types'

export const useGraphStore = defineStore('graph', () => {
  const intent = ref('')
  const seeds = ref<SeedFile[]>([])
  const pastedText = ref('')
  const build = ref<GraphBuildResult | null>(null)
  const building = ref(false)
  const buildError = ref<string | null>(null)

  const sephiroth = ref<SephirothState | null>(null)
  const memories = ref<MemoryRecord[]>([])
  const loadingAtlas = ref(false)
  const loadingMemories = ref(false)
  const error = ref<string | null>(null)

  const memoryById = computed(() => new Map(memories.value.map((m) => [m.id, m])))

  async function buildGraph() {
    building.value = true
    buildError.value = null
    try {
      build.value = await graphApi.build(seeds.value, intent.value, pastedText.value || undefined)
      sephiroth.value = null
    } catch (e) {
      buildError.value = (e as ApiError).message
    } finally {
      building.value = false
    }
  }

  async function loadSephiroth(force = false) {
    if (sephiroth.value && !force) return
    loadingAtlas.value = true
    error.value = null
    try {
      sephiroth.value = await graphApi.sephiroth()
    } catch (e) {
      error.value = (e as ApiError).message
    } finally {
      loadingAtlas.value = false
    }
  }

  async function loadMemories(force = false) {
    if (memories.value.length && !force) return
    loadingMemories.value = true
    try {
      memories.value = await graphApi.memories()
    } catch (e) {
      error.value = (e as ApiError).message
    } finally {
      loadingMemories.value = false
    }
  }

  return {
    intent, seeds, pastedText, build, building, buildError,
    sephiroth, memories, memoryById, loadingAtlas, loadingMemories, error,
    buildGraph, loadSephiroth, loadMemories,
  }
})
