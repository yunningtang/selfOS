/**
 * Thin fetch wrapper for the Flask backend.
 *
 * Data mode (VITE_DATA_MODE):
 *   auto — call the backend; if it is unreachable, serve the bundled demo fixture and flag it.
 *   live — backend only; errors surface to the UI.
 *   demo — never call the backend.
 *
 * The UI shows a "Demo data" indicator whenever any response came from a fixture,
 * so demo content is never mistaken for a real reading.
 */
import { reactive } from 'vue'

const BASE = (import.meta.env.VITE_API_BASE ?? '/api').replace(/\/$/, '')
const MODE = import.meta.env.VITE_DATA_MODE ?? 'auto'

export const dataSource = reactive({
  mode: MODE,
  /** True once any response in this session has come from a demo fixture. */
  usingDemo: MODE === 'demo',
  /** Last time the backend answered successfully. */
  lastLiveAt: null as string | null,
})

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public detail?: unknown,
  ) {
    super(message)
  }
}

class BackendUnavailable extends Error {}

type Query = Record<string, string | number | boolean | undefined>

interface RequestOptions<T> {
  body?: unknown
  query?: Query
  /** Produces the demo fixture for this call. */
  demo?: () => T | Promise<T>
  signal?: AbortSignal
}

function buildUrl(path: string, query?: Query) {
  const url = `${BASE}${path}`
  if (!query) return url
  const qs = new URLSearchParams()
  for (const [k, v] of Object.entries(query)) if (v !== undefined) qs.set(k, String(v))
  const s = qs.toString()
  return s ? `${url}?${s}` : url
}

async function callBackend<T>(method: string, path: string, opts: RequestOptions<T>): Promise<T> {
  const isForm = typeof FormData !== 'undefined' && opts.body instanceof FormData
  let res: Response
  try {
    res = await fetch(buildUrl(path, opts.query), {
      method,
      headers: isForm || opts.body === undefined ? undefined : { 'Content-Type': 'application/json' },
      body: isForm ? (opts.body as FormData) : opts.body === undefined ? undefined : JSON.stringify(opts.body),
      signal: opts.signal,
    })
  } catch (err) {
    if ((err as Error).name === 'AbortError') throw err
    throw new BackendUnavailable(String(err))
  }

  const isJson = (res.headers.get('content-type') ?? '').includes('application/json')
  // A dev-proxy failure (backend not running) answers with a non-JSON 5xx.
  if (!res.ok && !isJson && res.status >= 500) throw new BackendUnavailable(`HTTP ${res.status}`)
  const payload = isJson ? await res.json() : await res.text()
  if (!res.ok) {
    const msg = (isJson && (payload?.error || payload?.message)) || `Request failed (${res.status})`
    throw new ApiError(String(msg), res.status, payload)
  }
  dataSource.lastLiveAt = new Date().toISOString()
  // Flask blueprints commonly wrap results as { success, data }.
  if (isJson && payload && typeof payload === 'object' && 'data' in payload && 'success' in payload) {
    return payload.data as T
  }
  return payload as T
}

/** After the backend is found unreachable in auto mode, skip it for a while instead of retrying every poll. */
const RETRY_BACKEND_MS = 30_000
let backendDownUntil = 0

export async function request<T>(method: string, path: string, opts: RequestOptions<T> = {}): Promise<T> {
  const skipBackend = dataSource.mode === 'demo' || (dataSource.mode === 'auto' && Date.now() < backendDownUntil)
  if (skipBackend && opts.demo) {
    dataSource.usingDemo = true
    return opts.demo()
  }
  try {
    return await callBackend(method, path, opts)
  } catch (err) {
    if (err instanceof BackendUnavailable && dataSource.mode === 'auto' && opts.demo) {
      backendDownUntil = Date.now() + RETRY_BACKEND_MS
      dataSource.usingDemo = true
      return opts.demo()
    }
    if (err instanceof BackendUnavailable) throw new ApiError('The selfOS backend is not reachable.', 0)
    throw err
  }
}

export const api = {
  get: <T>(path: string, opts?: RequestOptions<T>) => request<T>('GET', path, opts),
  post: <T>(path: string, body?: unknown, opts?: Omit<RequestOptions<T>, 'body'>) =>
    request<T>('POST', path, { ...opts, body }),
}
