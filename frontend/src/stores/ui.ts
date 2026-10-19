import { defineStore } from 'pinia'
import { computed, ref, watch } from 'vue'

export type ThemePref = 'system' | 'dark' | 'light'
export type MotionPref = 'system' | 'full' | 'reduced'

function read<T extends string>(key: string, fallback: T): T {
  try {
    return (localStorage.getItem(key) as T) ?? fallback
  } catch {
    return fallback
  }
}
function write(key: string, value: string) {
  try {
    localStorage.setItem(key, value)
  } catch {
    /* storage unavailable — preference lasts for this session only */
  }
}

export const useUiStore = defineStore('ui', () => {
  const themePref = ref<ThemePref>(read('selfos.theme', 'system'))
  const motionPref = ref<MotionPref>(read('selfos.motion', 'system'))

  const darkQuery = window.matchMedia('(prefers-color-scheme: dark)')
  const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
  const systemDark = ref(darkQuery.matches)
  const systemReduced = ref(motionQuery.matches)
  darkQuery.addEventListener('change', (e) => (systemDark.value = e.matches))
  motionQuery.addEventListener('change', (e) => (systemReduced.value = e.matches))

  const theme = computed<'dark' | 'light'>(() =>
    themePref.value === 'system' ? (systemDark.value ? 'dark' : 'light') : themePref.value,
  )
  const reducedMotion = computed(() =>
    motionPref.value === 'system' ? systemReduced.value : motionPref.value === 'reduced',
  )

  watch(
    [theme, reducedMotion],
    ([t, r]) => {
      const el = document.documentElement
      el.dataset.theme = t
      el.dataset.motion = r ? 'reduced' : 'full'
      document.querySelector('meta[name="theme-color"]')?.setAttribute('content', t === 'dark' ? '#0B0D12' : '#F5F6F8')
    },
    { immediate: true },
  )
  watch(themePref, (v) => write('selfos.theme', v))
  watch(motionPref, (v) => write('selfos.motion', v))

  return { themePref, motionPref, theme, reducedMotion }
})
