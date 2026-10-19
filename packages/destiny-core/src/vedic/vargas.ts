/** Parashara divisional charts: sign index (0–11) of a sidereal longitude in each varga. */
import type { VargaD } from './tables'

const movable = (s: number) => s % 3 === 0
const fixed = (s: number) => s % 3 === 1
const odd = (s: number) => s % 2 === 0 // Aries (0) is an odd sign

export function vargaSign(lon: number, d: VargaD): number {
  const sign = Math.floor(lon / 30) % 12
  const deg = lon - Math.floor(lon / 30) * 30
  const part = (n: number) => Math.floor((deg * n) / 30)
  switch (d) {
    case 1:
      return sign
    case 2:
      // Hora: odd signs 0–15 Leo, 15–30 Cancer; even signs the reverse
      return odd(sign) ? (deg < 15 ? 4 : 3) : deg < 15 ? 3 : 4
    case 3:
      return (sign + 4 * part(3)) % 12
    case 4:
      return (sign + 3 * part(4)) % 12
    case 7:
      return (sign + (odd(sign) ? 0 : 6) + part(7)) % 12
    case 9:
      return Math.floor(lon / (30 / 9)) % 12
    case 10:
      return (sign + (odd(sign) ? 0 : 8) + part(10)) % 12
    case 12:
      return (sign + part(12)) % 12
    case 16:
      return ((movable(sign) ? 0 : fixed(sign) ? 4 : 8) + part(16)) % 12
    case 20:
      return ((movable(sign) ? 0 : fixed(sign) ? 8 : 4) + part(20)) % 12
    case 24:
      return ((odd(sign) ? 4 : 3) + part(24)) % 12
    case 27: {
      const start = [0, 3, 6, 9][sign % 4] // fiery Aries, earthy Cancer, airy Libra, watery Capricorn
      return (start + part(27)) % 12
    }
    case 30: {
      // Trimshamsa by planetary lordship ranges
      if (odd(sign)) return deg < 5 ? 0 : deg < 10 ? 10 : deg < 18 ? 8 : deg < 25 ? 2 : 6
      return deg < 5 ? 1 : deg < 12 ? 5 : deg < 20 ? 11 : deg < 25 ? 9 : 7
    }
    case 40:
      return ((odd(sign) ? 0 : 6) + part(40)) % 12
    case 45:
      return ((movable(sign) ? 0 : fixed(sign) ? 4 : 8) + part(45)) % 12
    case 60:
      return (sign + part(60)) % 12
  }
}
