/** Jyotish reference tables. Grahas indexed Su=0 Mo=1 Ma=2 Me=3 Ju=4 Ve=5 Sa=6 Ra=7 Ke=8; signs Aries=0. */

export const GRAHA_IDS = ['Su', 'Mo', 'Ma', 'Me', 'Ju', 'Ve', 'Sa', 'Ra', 'Ke'] as const
export type GrahaIdx = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8
export const GRAHA_NAMES = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn', 'Rahu', 'Ketu']
export const GRAHA_SANSKRIT = ['Surya', 'Chandra', 'Mangala', 'Budha', 'Guru', 'Shukra', 'Shani', 'Rahu', 'Ketu']
export const GRAHA_ZH = ['太阳', '月亮', '火星', '水星', '木星', '金星', '土星', '罗睺', '计都']

export const RASHI = [
  { en: 'Aries', sk: 'Mesha', zh: '白羊', abbr: 'Ar' }, { en: 'Taurus', sk: 'Vrishabha', zh: '金牛', abbr: 'Ta' },
  { en: 'Gemini', sk: 'Mithuna', zh: '双子', abbr: 'Ge' }, { en: 'Cancer', sk: 'Karka', zh: '巨蟹', abbr: 'Cn' },
  { en: 'Leo', sk: 'Simha', zh: '狮子', abbr: 'Le' }, { en: 'Virgo', sk: 'Kanya', zh: '处女', abbr: 'Vi' },
  { en: 'Libra', sk: 'Tula', zh: '天秤', abbr: 'Li' }, { en: 'Scorpio', sk: 'Vrischika', zh: '天蝎', abbr: 'Sc' },
  { en: 'Sagittarius', sk: 'Dhanu', zh: '射手', abbr: 'Sg' }, { en: 'Capricorn', sk: 'Makara', zh: '摩羯', abbr: 'Cp' },
  { en: 'Aquarius', sk: 'Kumbha', zh: '水瓶', abbr: 'Aq' }, { en: 'Pisces', sk: 'Meena', zh: '双鱼', abbr: 'Pi' },
]
/** Sign lords as graha indices */
export const SIGN_LORD: GrahaIdx[] = [2, 5, 3, 1, 0, 3, 5, 2, 4, 6, 6, 4]

export const NAKSHATRAS = [
  'Ashwini', 'Bharani', 'Krittika', 'Rohini', 'Mrigashira', 'Ardra', 'Punarvasu', 'Pushya', 'Ashlesha',
  'Magha', 'Purva Phalguni', 'Uttara Phalguni', 'Hasta', 'Chitra', 'Swati', 'Vishakha', 'Anuradha', 'Jyeshtha',
  'Mula', 'Purva Ashadha', 'Uttara Ashadha', 'Shravana', 'Dhanishta', 'Shatabhisha', 'Purva Bhadrapada',
  'Uttara Bhadrapada', 'Revati',
]
/** Vimshottari lords in nakshatra order (Ke Ve Su Mo Ma Ra Ju Sa Me, repeating) */
export const NAK_LORD: GrahaIdx[] = [8, 5, 0, 1, 2, 7, 4, 6, 3, 8, 5, 0, 1, 2, 7, 4, 6, 3, 8, 5, 0, 1, 2, 7, 4, 6, 3]
export const DASHA_YEARS: Record<number, number> = { 8: 7, 5: 20, 0: 6, 1: 10, 2: 7, 7: 18, 4: 16, 6: 19, 3: 17 }
export const DASHA_ORDER: GrahaIdx[] = [8, 5, 0, 1, 2, 7, 4, 6, 3]

export const TITHI_NAMES = ['Pratipada', 'Dwitiya', 'Tritiya', 'Chaturthi', 'Panchami', 'Shashthi', 'Saptami', 'Ashtami', 'Navami', 'Dashami', 'Ekadashi', 'Dwadashi', 'Trayodashi', 'Chaturdashi', 'Purnima/Amavasya']
export const YOGA_NAMES = ['Vishkambha', 'Priti', 'Ayushman', 'Saubhagya', 'Shobhana', 'Atiganda', 'Sukarma', 'Dhriti', 'Shula', 'Ganda', 'Vriddhi', 'Dhruva', 'Vyaghata', 'Harshana', 'Vajra', 'Siddhi', 'Vyatipata', 'Variyan', 'Parigha', 'Shiva', 'Siddha', 'Sadhya', 'Shubha', 'Shukla', 'Brahma', 'Indra', 'Vaidhriti']
export const KARANA_CYCLE = ['Bava', 'Balava', 'Kaulava', 'Taitila', 'Garaja', 'Vanija', 'Vishti']
export const VARA_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
export const VARA_SK = ['Ravivara', 'Somavara', 'Mangalavara', 'Budhavara', 'Guruvara', 'Shukravara', 'Shanivara']
/** Weekday lords Sun…Sat as graha indices */
export const VARA_LORD: GrahaIdx[] = [0, 1, 2, 3, 4, 5, 6]

// ── Dignities ─────────────────────────────────────────────────────
/** [sign, degree] of exaltation */
export const EXALTATION: Partial<Record<number, [number, number]>> = { 0: [0, 10], 1: [1, 3], 2: [9, 28], 3: [5, 15], 4: [3, 5], 5: [11, 27], 6: [6, 20], 7: [1, 20], 8: [7, 20] }
/** [sign, fromDeg, toDeg] moolatrikona */
export const MOOLATRIKONA: Partial<Record<number, [number, number, number]>> = { 0: [4, 0, 20], 1: [1, 3, 30], 2: [0, 0, 12], 3: [5, 15, 20], 4: [8, 0, 10], 5: [6, 0, 15], 6: [10, 0, 20] }
export const OWN_SIGNS: Partial<Record<number, number[]>> = { 0: [4], 1: [3], 2: [0, 7], 3: [2, 5], 4: [8, 11], 5: [1, 6], 6: [9, 10], 7: [10], 8: [7] }

/** Naisargika (natural) relationships: 1 friend, 0 neutral, −1 enemy; [from][to] over Su…Sa */
export const NATURAL_RELATION: number[][] = [
  [0, 1, 1, 0, 1, -1, -1], // Sun
  [1, 0, 0, 1, 0, 0, 0], // Moon
  [1, 1, 0, -1, 1, 0, 0], // Mars
  [1, -1, 0, 0, 0, 1, 0], // Mercury
  [1, 1, 1, -1, 0, -1, 0], // Jupiter
  [-1, -1, 0, 1, 0, 0, 1], // Venus
  [-1, -1, -1, 1, 0, 1, 0], // Saturn
]
export const RELATION_NAMES = ['Adhisatru', 'Satru', 'Sama', 'Mitra', 'Adhimitra']
/** Saptavargaja bala by relationship index (0 Adhisatru … 4 Adhimitra) */
export const RELATION_BALA = [1.875, 3.75, 7.5, 15, 22.5]

export const NAISARGIKA_BALA = [60, 51.43, 17.14, 25.7, 34.28, 42.85, 8.57]
/** Required minimum Shadbala in rupas (BPHS) */
export const REQUIRED_RUPAS = [6.5, 6.0, 5.0, 7.0, 6.5, 5.5, 5.0]

/** Houses (from each reference, 1-based) in which each contributor gives a bindu, per planet's Ashtakavarga. Order of contributors: Su Mo Ma Me Ju Ve Sa Lagna */
export const BAV_TABLE: number[][][] = [
  [[1, 2, 4, 7, 8, 9, 10, 11], [3, 6, 10, 11], [1, 2, 4, 7, 8, 9, 10, 11], [3, 5, 6, 9, 10, 11, 12], [5, 6, 9, 11], [6, 7, 12], [1, 2, 4, 7, 8, 9, 10, 11], [3, 4, 6, 10, 11, 12]], // Sun 48
  [[3, 6, 7, 8, 10, 11], [1, 3, 6, 7, 10, 11], [2, 3, 5, 6, 9, 10, 11], [1, 3, 4, 5, 7, 8, 10, 11], [1, 4, 7, 8, 10, 11, 12], [3, 4, 5, 7, 9, 10, 11], [3, 5, 6, 11], [3, 6, 10, 11]], // Moon 49
  [[3, 5, 6, 10, 11], [3, 6, 11], [1, 2, 4, 7, 8, 10, 11], [3, 5, 6, 11], [6, 10, 11, 12], [6, 8, 11, 12], [1, 4, 7, 8, 9, 10, 11], [1, 3, 6, 10, 11]], // Mars 39
  [[5, 6, 9, 11, 12], [2, 4, 6, 8, 10, 11], [1, 2, 4, 7, 8, 9, 10, 11], [1, 3, 5, 6, 9, 10, 11, 12], [6, 8, 11, 12], [1, 2, 3, 4, 5, 8, 9, 11], [1, 2, 4, 7, 8, 9, 10, 11], [1, 2, 4, 6, 8, 10, 11]], // Mercury 54
  [[1, 2, 3, 4, 7, 8, 9, 10, 11], [2, 5, 7, 9, 11], [1, 2, 4, 7, 8, 10, 11], [1, 2, 4, 5, 6, 9, 10, 11], [1, 2, 3, 4, 7, 8, 10, 11], [2, 5, 6, 9, 10, 11], [3, 5, 6, 12], [1, 2, 4, 5, 6, 7, 9, 10, 11]], // Jupiter 56
  [[8, 11, 12], [1, 2, 3, 4, 5, 8, 9, 11, 12], [3, 5, 6, 9, 11, 12], [3, 5, 6, 9, 11], [5, 8, 9, 10, 11], [1, 2, 3, 4, 5, 8, 9, 10, 11], [3, 4, 5, 8, 9, 10, 11], [1, 2, 3, 4, 5, 8, 9, 11]], // Venus 52
  [[1, 2, 4, 7, 8, 10, 11], [3, 6, 11], [3, 5, 6, 10, 11, 12], [6, 8, 9, 10, 11, 12], [5, 6, 11, 12], [6, 11, 12], [3, 5, 6, 11], [1, 3, 4, 6, 10, 11]], // Saturn 39
]

export const VARGA_LIST = [
  { d: 1, name: 'Rashi', sk: 'Rasi', about: 'Body, self' },
  { d: 2, name: 'Hora', sk: 'Hora', about: 'Wealth' },
  { d: 3, name: 'Drekkana', sk: 'Drekkana', about: 'Siblings, courage' },
  { d: 4, name: 'Chaturthamsa', sk: 'Chaturthamsa', about: 'Property, fortune' },
  { d: 7, name: 'Saptamsa', sk: 'Saptamsa', about: 'Children' },
  { d: 9, name: 'Navamsa', sk: 'Navamsa', about: 'Spouse, dharma' },
  { d: 10, name: 'Dashamsa', sk: 'Dasamsa', about: 'Career' },
  { d: 12, name: 'Dwadashamsa', sk: 'Dvadasamsa', about: 'Parents' },
  { d: 16, name: 'Shodashamsa', sk: 'Shodasamsa', about: 'Vehicles, comforts' },
  { d: 20, name: 'Vimshamsa', sk: 'Vimsamsa', about: 'Spiritual practice' },
  { d: 24, name: 'Chaturvimshamsa', sk: 'Siddhamsa', about: 'Learning' },
  { d: 27, name: 'Bhamsa', sk: 'Nakshatramsa', about: 'Strengths, weaknesses' },
  { d: 30, name: 'Trimshamsa', sk: 'Trimsamsa', about: 'Misfortunes' },
  { d: 40, name: 'Khavedamsa', sk: 'Khavedamsa', about: 'Auspicious effects' },
  { d: 45, name: 'Akshavedamsa', sk: 'Akshavedamsa', about: 'General' },
  { d: 60, name: 'Shashtiamsa', sk: 'Shashtiamsa', about: 'Past karma' },
] as const
export type VargaD = (typeof VARGA_LIST)[number]['d']
