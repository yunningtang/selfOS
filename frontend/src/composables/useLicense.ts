/**
 * Pro license for the standalone 八字 product. The paywall service (services/paywall) issues an
 * ES256-signed token after a Stripe Checkout succeeds; the browser verifies the signature with the
 * public key baked into the build and keeps the token in localStorage. No account, no server round
 * trip on later visits. Charts are still computed locally; only the "unlocked" flag is signed.
 */
import { computed, ref } from 'vue'

export interface LicenseConfig {
  /** Base URL of the paywall worker, e.g. https://pay.example.workers.dev */
  apiBase: string
  /** Public JWK (ES256) matching the worker's signing key */
  publicJwk: JsonWebKey | null
  /** Shown on the paywall card, e.g. '¥68 · 一次付费，永久使用' */
  priceLabel: string
}

const KEY = 'destiny.license.v1'
const config = ref<LicenseConfig>({ apiBase: '', publicJwk: null, priceLabel: '' })
const token = ref<string | null>(readToken())
const claims = ref<{ sub?: string; plan?: string; exp?: number; iat?: number } | null>(null)
const verified = ref(false)
const busy = ref(false)
const message = ref<string | null>(null)

function readToken() {
  try {
    return localStorage.getItem(KEY)
  } catch {
    return null
  }
}
function writeToken(t: string | null) {
  try {
    if (t) localStorage.setItem(KEY, t)
    else localStorage.removeItem(KEY)
  } catch {
    /* ignore */
  }
}
const b64url = (s: string) => Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(s.length / 4) * 4, '=')), (c) => c.charCodeAt(0))

async function verify(t: string): Promise<boolean> {
  const jwk = config.value.publicJwk
  if (!jwk) return false
  const [h, p, sig] = t.split('.')
  if (!h || !p || !sig) return false
  try {
    const key = await crypto.subtle.importKey('jwk', jwk, { name: 'ECDSA', namedCurve: 'P-256' }, false, ['verify'])
    const ok = await crypto.subtle.verify({ name: 'ECDSA', hash: 'SHA-256' }, key, b64url(sig), new TextEncoder().encode(`${h}.${p}`))
    if (!ok) return false
    const c = JSON.parse(new TextDecoder().decode(b64url(p)))
    if (c.exp && c.exp * 1000 < Date.now()) return false
    if (c.plan !== 'pro') return false
    claims.value = c
    return true
  } catch {
    return false
  }
}

async function refresh() {
  verified.value = token.value ? await verify(token.value) : false
  if (!verified.value) claims.value = null
}

async function call(path: string, init?: RequestInit) {
  const r = await fetch(`${config.value.apiBase.replace(/\/$/, '')}${path}`, { ...init, headers: { 'content-type': 'application/json', ...(init?.headers ?? {}) } })
  const data = (await r.json().catch(() => ({}))) as { error?: string; url?: string; token?: string }
  if (!r.ok) throw new Error(data.error || `HTTP ${r.status}`)
  return data
}

export function configureLicense(c: Partial<LicenseConfig>) {
  config.value = { ...config.value, ...c }
  void refresh()
}

export function useLicense() {
  const enabled = computed(() => !!config.value.apiBase && !!config.value.publicJwk)
  const pro = computed(() => verified.value)

  /** Send the visitor to Stripe Checkout; they come back to `returnUrl` with ?session_id=… */
  async function startCheckout(returnUrl = location.href) {
    busy.value = true
    message.value = null
    try {
      const { url } = await call('/checkout', { method: 'POST', body: JSON.stringify({ returnUrl }) })
      if (!url) throw new Error('no checkout url')
      location.assign(url)
    } catch (e) {
      message.value = (e as Error).message
    } finally {
      busy.value = false
    }
  }
  /** After Stripe redirects back, exchange the session id for a license token. */
  async function completeCheckout(sessionId: string) {
    busy.value = true
    message.value = null
    try {
      const { token: t } = await call(`/verify?session_id=${encodeURIComponent(sessionId)}`)
      if (!t) throw new Error('no token')
      token.value = t
      writeToken(t)
      await refresh()
      message.value = verified.value ? 'ok' : 'invalid'
    } catch (e) {
      message.value = (e as Error).message
    } finally {
      busy.value = false
    }
  }
  /** Re-issue the token on another device from the purchase email. */
  async function restore(email: string) {
    busy.value = true
    message.value = null
    try {
      const { token: t } = await call('/restore', { method: 'POST', body: JSON.stringify({ email }) })
      if (!t) throw new Error('no token')
      token.value = t
      writeToken(t)
      await refresh()
      message.value = verified.value ? 'ok' : 'invalid'
    } catch (e) {
      message.value = (e as Error).message
    } finally {
      busy.value = false
    }
  }
  function clear() {
    token.value = null
    writeToken(null)
    verified.value = false
    claims.value = null
  }
  /** Pick up ?session_id=… from a Stripe return and clean the URL. */
  async function handleReturn() {
    const u = new URL(location.href)
    const sid = u.searchParams.get('session_id')
    if (!sid) return false
    await completeCheckout(sid)
    u.searchParams.delete('session_id')
    history.replaceState(null, '', u.toString())
    return true
  }

  return { config, enabled, pro, claims, busy, message, startCheckout, completeCheckout, restore, clear, handleReturn, refresh }
}
