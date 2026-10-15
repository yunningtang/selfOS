/** Number and date formatting — one place, so numerals stay consistent across the app. */

const pct = new Intl.NumberFormat(undefined, { style: 'percent', maximumFractionDigits: 0 })
const dec2 = new Intl.NumberFormat(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const dec1 = new Intl.NumberFormat(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })
const dateFmt = new Intl.DateTimeFormat(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
const timeFmt = new Intl.DateTimeFormat(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit' })

export const fmtPct = (v: number) => pct.format(v)
export const fmt2 = (v: number) => dec2.format(v)
export const fmt1 = (v: number) => dec1.format(v)
export const fmtSigned = (v: number) => (v > 0 ? '+' : v < 0 ? '−' : '') + dec2.format(Math.abs(v))
export const fmtDate = (iso: string) => dateFmt.format(new Date(iso.length === 10 ? `${iso}T00:00:00` : iso))
export const fmtTime = (iso: string) => timeFmt.format(new Date(iso))

/** 23.456 → 23°27′ */
export function fmtDeg(deg: number) {
  const d = Math.floor(deg)
  const m = Math.floor((deg - d) * 60)
  return `${d}°${String(m).padStart(2, '0')}′`
}
