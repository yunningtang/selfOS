import { storeToRefs } from 'pinia'
import { useUiStore } from '@/stores/ui'

/** Reactive reduced-motion flag (system preference or user override). */
export function useReducedMotion() {
  return storeToRefs(useUiStore()).reducedMotion
}
