import { createApp } from 'vue'
import { createPinia } from 'pinia'
import '@fontsource-variable/inter'
import '@/styles/tokens.css'
import '@/styles/base.css'
import '@/styles/materials.css'
import '@/styles/motion.css'
import '@/components/ui/lq-input.css'
import App from '~/App.vue'
import { router } from '~/router'
import { useDivinationStore } from '@/stores/divination'
import { configureLicense } from '@/composables/useLicense'

const app = createApp(App)
const pinia = createPinia()
app.use(pinia).use(router)

// The standalone product casts 八字 + 紫微 on the MIT solar backend: no Swiss Ephemeris in this build.
useDivinationStore(pinia).configure({ systems: ['bazi', 'ziwei'], solar: 'mit' })

let jwk: JsonWebKey | null = null
try {
  jwk = import.meta.env.VITE_LICENSE_JWK ? (JSON.parse(import.meta.env.VITE_LICENSE_JWK) as JsonWebKey) : null
} catch {
  jwk = null
}
configureLicense({ apiBase: import.meta.env.VITE_PAYWALL_URL ?? '', publicJwk: jwk, priceLabel: import.meta.env.VITE_PRICE_LABEL ?? '' })

app.mount('#app')
