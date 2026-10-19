/**
 * Minimal bilingual layer. Chinese is the source language: every UI string is written in
 * Chinese and `t()` looks up its English rendering in `en.ts`. Missing entries fall back to
 * the Chinese text, so nothing ever renders blank.
 */
import { computed, ref, watch } from 'vue'
import { EN } from './en'

export type Locale = 'zh' | 'en'
const KEY = 'selfos.lang'

function detect(): Locale {
  try {
    const saved = localStorage.getItem(KEY)
    if (saved === 'zh' || saved === 'en') return saved
  } catch {
    /* ignore */
  }
  return typeof navigator !== 'undefined' && /^zh/i.test(navigator.language) ? 'zh' : 'en'
}

export const locale = ref<Locale>(detect())
export const isEn = computed(() => locale.value === 'en')

watch(
  locale,
  (v) => {
    try {
      localStorage.setItem(KEY, v)
    } catch {
      /* ignore */
    }
    document.documentElement.lang = v === 'zh' ? 'zh-CN' : 'en'
  },
  { immediate: true },
)

/** Translate a Chinese source string. Reactive: templates re-render when the locale changes. */
export function t(zh: string): string {
  if (locale.value === 'zh') return zh
  return EN[zh] ?? zh
}

/** Pick one of two values by locale. */
export const pick = <T,>(zh: T, en: T): T => (locale.value === 'zh' ? zh : en)

export function useI18n() {
  return { locale, isEn, t, pick, setLocale: (l: Locale) => (locale.value = l) }
}
