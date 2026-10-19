import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'


export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  return {
    base: env.VITE_BASE || '/',
    // 八字 + 紫微 only: the MIT solar backend, no Swiss Ephemeris assets in this build.
    plugins: [vue()],
    resolve: {
      alias: {
        // The standalone site reuses the selfOS component library and stores directly.
        '@': fileURLToPath(new URL('../../frontend/src', import.meta.url)),
        '~': fileURLToPath(new URL('./src', import.meta.url)),
        // Keep the AGPL Swiss Ephemeris out of this build entirely (only the MIT solar backend is used).
        'swisseph-wasm': fileURLToPath(new URL('./src/stubs/swisseph.ts', import.meta.url)),
      },
    },
    server: { port: 3100, fs: { allow: ['../..'] } },
    preview: { port: 3100 },
    build: {
      target: 'es2022',
      chunkSizeWarningLimit: 600,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules/astronomy-engine')) return 'astro'
            if (/node_modules\/(iztro|lunar-lite|lunar-typescript|i18next|dayjs)\//.test(id)) return 'ziwei'
          },
        },
      },
    },
  }
})
