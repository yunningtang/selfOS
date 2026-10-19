import type { Directive } from 'vue'

/**
 * v-ripple — a soft liquid ripple from the pointer position.
 * Purely decorative; the element's own :active / focus styles carry the real feedback.
 */
function spawn(el: HTMLElement, e: PointerEvent) {
  if (e.button !== 0) return
  const rect = el.getBoundingClientRect()
  const size = Math.hypot(rect.width, rect.height) * 2
  const dot = document.createElement('span')
  dot.className = 'lq-ripple'
  dot.style.setProperty('--ripple-size', `${size}px`)
  dot.style.left = `${e.clientX - rect.left}px`
  dot.style.top = `${e.clientY - rect.top}px`
  dot.addEventListener('animationend', () => dot.remove(), { once: true })
  el.appendChild(dot)
}

type RippleEl = HTMLElement & { __ripple?: (e: PointerEvent) => void }

export const ripple: Directive<RippleEl> = {
  mounted(el) {
    el.classList.add('lq-ripple-host')
    el.__ripple = (e) => spawn(el, e)
    el.addEventListener('pointerdown', el.__ripple)
  },
  unmounted(el) {
    if (el.__ripple) el.removeEventListener('pointerdown', el.__ripple)
  },
}
