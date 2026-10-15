/**
 * Tree of Life topology — ten sephiroth and the 22 traditional paths (Golden Dawn / Kircher).
 * This is structure, not data: the backend supplies energies and flows on top of it.
 */
import type { SephirahId } from '@/types'

export interface SephirahMeta {
  id: SephirahId
  index: number
  name: string
  hebrew: string
  meaning: string
  zh: string
  pillar: 'severity' | 'balance' | 'mercy'
  /** Layout in tree units: x ∈ {-1, 0, 1}, y grows downward */
  x: number
  y: number
  /** Psychological reading used by selfOS */
  psyche: string
  /** CSS colour token for the node body */
  tone: string
}

export const SEPHIROTH: SephirahMeta[] = [
  { id: 'kether', index: 1, name: 'Kether', hebrew: 'כתר', meaning: 'Crown', zh: '王冠', pillar: 'balance', x: 0, y: 0, psyche: 'Core intent · the witnessing Self', tone: 'var(--c-pearl)' },
  { id: 'chokmah', index: 2, name: 'Chokmah', hebrew: 'חכמה', meaning: 'Wisdom', zh: '智慧', pillar: 'mercy', x: 1, y: 1, psyche: 'Raw impulse · first insight', tone: 'var(--c-mist)' },
  { id: 'binah', index: 3, name: 'Binah', hebrew: 'בינה', meaning: 'Understanding', zh: '理解', pillar: 'severity', x: -1, y: 1, psyche: 'Form-giving · inner structure', tone: 'var(--c-lavender)' },
  { id: 'chesed', index: 4, name: 'Chesed', hebrew: 'חסד', meaning: 'Mercy', zh: '慈悲', pillar: 'mercy', x: 1, y: 2.85, psyche: 'Expansion · generosity', tone: 'var(--c-mist)' },
  { id: 'geburah', index: 5, name: 'Geburah', hebrew: 'גבורה', meaning: 'Severity', zh: '严厉', pillar: 'severity', x: -1, y: 2.85, psyche: 'Limits · the Limiter', tone: 'var(--c-clay)' },
  { id: 'tiphereth', index: 6, name: 'Tiphereth', hebrew: 'תפארת', meaning: 'Beauty', zh: '美', pillar: 'balance', x: 0, y: 3.9, psyche: 'Meaning · integration centre', tone: 'var(--c-pearl)' },
  { id: 'netzach', index: 7, name: 'Netzach', hebrew: 'נצח', meaning: 'Victory', zh: '胜利', pillar: 'mercy', x: 1, y: 5.35, psyche: 'Desire · the Creator (fire)', tone: 'var(--c-sage)' },
  { id: 'hod', index: 8, name: 'Hod', hebrew: 'הוד', meaning: 'Splendour', zh: '荣耀', pillar: 'severity', x: -1, y: 5.35, psyche: 'Reason · the Sage (water)', tone: 'var(--c-lavender)' },
  { id: 'yesod', index: 9, name: 'Yesod', hebrew: 'יסוד', meaning: 'Foundation', zh: '根基', pillar: 'balance', x: 0, y: 6.45, psyche: 'The unconscious · shadow field', tone: 'var(--c-slate)' },
  { id: 'malkuth', index: 10, name: 'Malkuth', hebrew: 'מלכות', meaning: 'Kingdom', zh: '王国', pillar: 'balance', x: 0, y: 8.1, psyche: 'Embodied life · manifestation', tone: 'var(--c-sage)' },
]

export const SEPHIRAH_BY_ID = Object.fromEntries(SEPHIROTH.map((s) => [s.id, s])) as Record<
  SephirahId,
  SephirahMeta
>

export interface PathMeta {
  id: number
  from: SephirahId
  to: SephirahId
  letter: string
  letterName: string
}

export const PATHS: PathMeta[] = [
  { id: 11, from: 'kether', to: 'chokmah', letter: 'א', letterName: 'Aleph' },
  { id: 12, from: 'kether', to: 'binah', letter: 'ב', letterName: 'Beth' },
  { id: 13, from: 'kether', to: 'tiphereth', letter: 'ג', letterName: 'Gimel' },
  { id: 14, from: 'chokmah', to: 'binah', letter: 'ד', letterName: 'Daleth' },
  { id: 15, from: 'chokmah', to: 'tiphereth', letter: 'ה', letterName: 'Heh' },
  { id: 16, from: 'chokmah', to: 'chesed', letter: 'ו', letterName: 'Vav' },
  { id: 17, from: 'binah', to: 'tiphereth', letter: 'ז', letterName: 'Zayin' },
  { id: 18, from: 'binah', to: 'geburah', letter: 'ח', letterName: 'Cheth' },
  { id: 19, from: 'chesed', to: 'geburah', letter: 'ט', letterName: 'Teth' },
  { id: 20, from: 'chesed', to: 'tiphereth', letter: 'י', letterName: 'Yod' },
  { id: 21, from: 'chesed', to: 'netzach', letter: 'כ', letterName: 'Kaph' },
  { id: 22, from: 'geburah', to: 'tiphereth', letter: 'ל', letterName: 'Lamed' },
  { id: 23, from: 'geburah', to: 'hod', letter: 'מ', letterName: 'Mem' },
  { id: 24, from: 'tiphereth', to: 'netzach', letter: 'נ', letterName: 'Nun' },
  { id: 25, from: 'tiphereth', to: 'yesod', letter: 'ס', letterName: 'Samekh' },
  { id: 26, from: 'tiphereth', to: 'hod', letter: 'ע', letterName: 'Ayin' },
  { id: 27, from: 'netzach', to: 'hod', letter: 'פ', letterName: 'Peh' },
  { id: 28, from: 'netzach', to: 'yesod', letter: 'צ', letterName: 'Tzaddi' },
  { id: 29, from: 'netzach', to: 'malkuth', letter: 'ק', letterName: 'Qoph' },
  { id: 30, from: 'hod', to: 'yesod', letter: 'ר', letterName: 'Resh' },
  { id: 31, from: 'hod', to: 'malkuth', letter: 'ש', letterName: 'Shin' },
  { id: 32, from: 'yesod', to: 'malkuth', letter: 'ת', letterName: 'Tav' },
]

export const PATH_BY_ID = Object.fromEntries(PATHS.map((p) => [p.id, p])) as Record<number, PathMeta>

export function pathsOf(id: SephirahId): PathMeta[] {
  return PATHS.filter((p) => p.from === id || p.to === id)
}

export function otherEnd(path: PathMeta, id: SephirahId): SephirahId {
  return path.from === id ? path.to : path.from
}
