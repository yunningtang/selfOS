/** Shared labels and visual identities for archetypes, elements and astrological entities. */
import type { ArchetypeKind, FiveElement, MemoryKind, SimEventType } from '@/types'

type GrahaId = 'Su' | 'Mo' | 'Ma' | 'Me' | 'Ju' | 'Ve' | 'Sa' | 'Ra' | 'Ke'

export interface OrbMaterial {
  /** Base hue of the liquid body */
  base: string
  /** Secondary hue blended into the depth of the body */
  depth: string
  /** Rendering variant */
  variant: 'liquid' | 'clear' | 'diffuse' | 'ring'
}

export const ARCHETYPES: Record<ArchetypeKind, { label: string; zh: string; role: string; material: OrbMaterial }> = {
  self: { label: 'Self', zh: '自性', role: 'Global integrating centre', material: { base: '#E7EAF3', depth: '#B5A9E8', variant: 'liquid' } },
  ego: { label: 'Ego', zh: '自我', role: 'Execution and decision', material: { base: '#A8C8E0', depth: '#5D7A95', variant: 'liquid' } },
  persona: { label: 'Persona', zh: '人格面具', role: 'Social adaptation', material: { base: '#E7EAF3', depth: '#A8C8E0', variant: 'clear' } },
  shadow: { label: 'Shadow', zh: '阴影', role: 'Repressed, unintegrated content', material: { base: '#6E6790', depth: '#1C1A2A', variant: 'diffuse' } },
  anima: { label: 'Anima / Animus', zh: '阿尼玛', role: 'Contrasexual inner other', material: { base: '#B5A9E8', depth: '#6A5FA8', variant: 'liquid' } },
  creator: { label: 'Creator', zh: '创造者', role: 'Desire and making (Netzach · fire)', material: { base: '#D9B2A6', depth: '#9C6C60', variant: 'liquid' } },
  limiter: { label: 'Limiter', zh: '限制者', role: 'Boundaries and defence (Geburah)', material: { base: '#8FA0B8', depth: '#3E4A60', variant: 'liquid' } },
  observer: { label: 'Observer', zh: '观察者', role: 'Meta-cognition; annotates, never decides', material: { base: '#A2CDBB', depth: '#A8C8E0', variant: 'ring' } },
}

export const ELEMENTS: Record<FiveElement, { zh: string; label: string; token: string }> = {
  wood: { zh: '木', label: 'Wood', token: 'var(--wx-wood)' },
  fire: { zh: '火', label: 'Fire', token: 'var(--wx-fire)' },
  earth: { zh: '土', label: 'Earth', token: 'var(--wx-earth)' },
  metal: { zh: '金', label: 'Metal', token: 'var(--wx-metal)' },
  water: { zh: '水', label: 'Water', token: 'var(--wx-water)' },
}

export const ELEMENT_ORDER: FiveElement[] = ['wood', 'fire', 'earth', 'metal', 'water']

export const SIGNS = [
  { abbr: 'Ar', name: 'Aries', sk: 'Mesha' },
  { abbr: 'Ta', name: 'Taurus', sk: 'Vrishabha' },
  { abbr: 'Ge', name: 'Gemini', sk: 'Mithuna' },
  { abbr: 'Cn', name: 'Cancer', sk: 'Karka' },
  { abbr: 'Le', name: 'Leo', sk: 'Simha' },
  { abbr: 'Vi', name: 'Virgo', sk: 'Kanya' },
  { abbr: 'Li', name: 'Libra', sk: 'Tula' },
  { abbr: 'Sc', name: 'Scorpio', sk: 'Vrischika' },
  { abbr: 'Sg', name: 'Sagittarius', sk: 'Dhanu' },
  { abbr: 'Cp', name: 'Capricorn', sk: 'Makara' },
  { abbr: 'Aq', name: 'Aquarius', sk: 'Kumbha' },
  { abbr: 'Pi', name: 'Pisces', sk: 'Meena' },
] as const

export const GRAHAS: Record<GrahaId, { name: string; sk: string }> = {
  Su: { name: 'Sun', sk: 'Surya' },
  Mo: { name: 'Moon', sk: 'Chandra' },
  Ma: { name: 'Mars', sk: 'Mangala' },
  Me: { name: 'Mercury', sk: 'Budha' },
  Ju: { name: 'Jupiter', sk: 'Guru' },
  Ve: { name: 'Venus', sk: 'Shukra' },
  Sa: { name: 'Saturn', sk: 'Shani' },
  Ra: { name: 'Rahu', sk: 'Rahu' },
  Ke: { name: 'Ketu', sk: 'Ketu' },
}

export const GRAHA_ORDER: GrahaId[] = ['Su', 'Mo', 'Ma', 'Me', 'Ju', 'Ve', 'Sa', 'Ra', 'Ke']

export const PILLAR_LABELS = {
  year: { zh: '年柱', en: 'Year' },
  month: { zh: '月柱', en: 'Month' },
  day: { zh: '日柱', en: 'Day' },
  hour: { zh: '时柱', en: 'Hour' },
} as const

export const MEMORY_KINDS: Record<MemoryKind, { label: string; tone: string }> = {
  diary: { label: 'Diary', tone: 'var(--c-mist)' },
  dream: { label: 'Dream', tone: 'var(--c-lavender)' },
  event: { label: 'Life event', tone: 'var(--c-sage)' },
  conversation: { label: 'Conversation', tone: 'var(--c-pearl)' },
  innate: { label: 'Innate (chart)', tone: 'var(--c-sand)' },
}

export const EVENT_TYPES: Record<SimEventType, { label: string; tone: string }> = {
  dialogue: { label: 'Dialogue', tone: 'var(--c-mist)' },
  conflict: { label: 'Conflict', tone: 'var(--c-clay)' },
  shadow_activation: { label: 'Shadow activation', tone: 'var(--c-lavender)' },
  observation: { label: 'Observation', tone: 'var(--c-sage)' },
  integration: { label: 'Integration', tone: 'var(--c-pearl)' },
  injection: { label: 'Injected variable', tone: 'var(--c-sand)' },
  state_change: { label: 'State change', tone: 'var(--c-slate)' },
}

export const INDIVIDUATION_STEPS = [
  { n: 1, label: 'Conflict detection', zh: '冲突检测' },
  { n: 2, label: 'Becoming conscious', zh: '意识化' },
  { n: 3, label: 'Meaning', zh: '意义生成' },
  { n: 4, label: 'Integration', zh: '整合' },
  { n: 5, label: 'Update', zh: '更新' },
]

export const FOUR_WORLDS = [
  { key: 'atzilut', name: 'Atzilut', zh: '神性界', theme: '意志', action: '设定核心意图，提供生命素材', route: '/seed' },
  { key: 'beria', name: 'Beria', zh: '创造界', theme: '结构', action: '排出命盘，构建叙事图谱与先天记忆', route: '/celestial' },
  { key: 'yetzirah', name: 'Yetzirah', zh: '形成界', theme: '形成', action: '让内在议会推演与辩论', route: '/council' },
  { key: 'assiya', name: 'Assiya', zh: '物质界', theme: '显化', action: '阅读、追问、反思报告', route: '/reflection' },
] as const
