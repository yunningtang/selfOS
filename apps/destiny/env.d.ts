/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Base path for API calls. Defaults to `/api` (proxied to the Flask backend in dev). */
  readonly VITE_API_BASE?: string
  /** `auto` (default): use the backend, fall back to demo data when it is unreachable. `live`: backend only. `demo`: demo data only. */
  readonly VITE_DATA_MODE?: 'auto' | 'live' | 'demo'
  readonly VITE_BACKEND_URL?: string
  /** Public base path for builds served from a sub-path (e.g. `/selfOS/` on GitHub Pages). */
  readonly VITE_BASE?: string
  /** Paywall worker base URL (services/paywall) */
  readonly VITE_PAYWALL_URL?: string
  /** Public ES256 JWK matching the worker's signing key */
  readonly VITE_LICENSE_JWK?: string
  /** Price text shown on the paywall card */
  readonly VITE_PRICE_LABEL?: string
}

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<object, object, unknown>
  export default component
}

declare module 'lunar-javascript' {
  // The library ships without types; only the entry points used by the demo fixture are declared.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export const Solar: any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export const Lunar: any
}
