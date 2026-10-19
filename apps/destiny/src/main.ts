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

createApp(App).use(createPinia()).use(router).mount('#app')
