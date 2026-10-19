/**
 * Paywall for the standalone 八字 product — a Cloudflare Worker that talks to Stripe with plain
 * fetch and signs ES256 license tokens the browser can verify offline.
 *
 *   POST /checkout   { returnUrl }      → { url }      Stripe Checkout session for the one-time price
 *   GET  /verify?session_id=…           → { token }    after a paid session, issue a license token
 *   POST /restore    { email }          → { token }    re-issue for a paid customer by email
 *   GET  /health                        → { ok: true }
 *
 * Secrets (wrangler secret put …): STRIPE_SECRET_KEY, SIGNING_JWK (ES256 private JWK JSON)
 * Vars (wrangler.toml): STRIPE_PRICE_ID, ALLOWED_ORIGINS (comma-separated), TOKEN_YEARS
 */
export interface Env {
  STRIPE_SECRET_KEY: string
  STRIPE_PRICE_ID: string
  SIGNING_JWK: string
  ALLOWED_ORIGINS: string
  TOKEN_YEARS?: string
}

const json = (data: unknown, status = 200, headers: Record<string, string> = {}) =>
  new Response(JSON.stringify(data), { status, headers: { 'content-type': 'application/json', ...headers } })

function cors(req: Request, env: Env) {
  const origin = req.headers.get('origin') ?? ''
  const allowed = env.ALLOWED_ORIGINS.split(',').map((s) => s.trim()).filter(Boolean)
  const ok = allowed.includes('*') || allowed.includes(origin)
  return {
    'access-control-allow-origin': ok ? origin : 'null',
    'access-control-allow-methods': 'GET,POST,OPTIONS',
    'access-control-allow-headers': 'content-type',
    vary: 'origin',
  }
}

async function stripe(env: Env, path: string, init: { method?: string; form?: Record<string, string> } = {}) {
  const r = await fetch(`https://api.stripe.com/v1${path}`, {
    method: init.method ?? (init.form ? 'POST' : 'GET'),
    headers: { authorization: `Bearer ${env.STRIPE_SECRET_KEY}`, ...(init.form ? { 'content-type': 'application/x-www-form-urlencoded' } : {}) },
    body: init.form ? new URLSearchParams(init.form).toString() : undefined,
  })
  const data = (await r.json()) as Record<string, unknown> & { error?: { message?: string } }
  if (!r.ok) throw new Error(data.error?.message ?? `stripe ${r.status}`)
  return data
}

const b64url = (buf: ArrayBuffer | Uint8Array | string) => {
  const bytes = typeof buf === 'string' ? new TextEncoder().encode(buf) : new Uint8Array(buf)
  let s = ''
  for (const b of bytes) s += String.fromCharCode(b)
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

async function sign(env: Env, claims: Record<string, unknown>) {
  const jwk = JSON.parse(env.SIGNING_JWK) as JsonWebKey
  const key = await crypto.subtle.importKey('jwk', jwk, { name: 'ECDSA', namedCurve: 'P-256' }, false, ['sign'])
  const header = b64url(JSON.stringify({ alg: 'ES256', typ: 'JWT' }))
  const payload = b64url(JSON.stringify(claims))
  const sig = await crypto.subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, key, new TextEncoder().encode(`${header}.${payload}`))
  return `${header}.${payload}.${b64url(sig)}`
}

async function issue(env: Env, email: string) {
  const years = Number(env.TOKEN_YEARS ?? '10')
  const now = Math.floor(Date.now() / 1000)
  const sub = b64url(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(email.toLowerCase())))
  return sign(env, { sub, plan: 'pro', iat: now, exp: now + years * 365 * 86400 })
}

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    const h = cors(req, env)
    if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: h })
    const url = new URL(req.url)
    try {
      if (url.pathname === '/health') return json({ ok: true }, 200, h)

      if (url.pathname === '/checkout' && req.method === 'POST') {
        const { returnUrl } = (await req.json()) as { returnUrl?: string }
        const back = new URL(returnUrl || env.ALLOWED_ORIGINS.split(',')[0])
        back.searchParams.set('session_id', '{CHECKOUT_SESSION_ID}')
        const session = await stripe(env, '/checkout/sessions', {
          form: {
            mode: 'payment',
            'line_items[0][price]': env.STRIPE_PRICE_ID,
            'line_items[0][quantity]': '1',
            success_url: decodeURIComponent(back.toString()),
            cancel_url: returnUrl || back.origin,
            'payment_method_types[0]': 'card',
            'payment_method_types[1]': 'alipay',
            'payment_method_types[2]': 'wechat_pay',
            'payment_method_options[wechat_pay][client]': 'web',
            allow_promotion_codes: 'true',
          },
        })
        return json({ url: session.url }, 200, h)
      }

      if (url.pathname === '/verify' && req.method === 'GET') {
        const id = url.searchParams.get('session_id')
        if (!id) return json({ error: 'session_id required' }, 400, h)
        const s = (await stripe(env, `/checkout/sessions/${encodeURIComponent(id)}`)) as { payment_status?: string; customer_details?: { email?: string } }
        if (s.payment_status !== 'paid') return json({ error: 'not paid' }, 402, h)
        const email = s.customer_details?.email
        if (!email) return json({ error: 'no email on session' }, 400, h)
        return json({ token: await issue(env, email) }, 200, h)
      }

      if (url.pathname === '/restore' && req.method === 'POST') {
        const { email } = (await req.json()) as { email?: string }
        if (!email) return json({ error: 'email required' }, 400, h)
        const list = (await stripe(env, `/checkout/sessions?customer_details[email]=${encodeURIComponent(email)}&status=complete&limit=20`)) as { data?: { payment_status?: string }[] }
        if (!(list.data ?? []).some((s) => s.payment_status === 'paid')) return json({ error: 'no paid purchase for this email' }, 404, h)
        return json({ token: await issue(env, email) }, 200, h)
      }

      return json({ error: 'not found' }, 404, h)
    } catch (e) {
      return json({ error: (e as Error).message }, 500, h)
    }
  },
}
