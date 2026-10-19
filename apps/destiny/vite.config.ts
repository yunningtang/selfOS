import { defineConfig, loadEnv, type Plugin } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'

const require = createRequire(import.meta.url)

/** swisseph-wasm loads its .wasm/.data from <base>/wasm/; emit them there. */
function swissEphemerisAssets(): Plugin {
  const dir = join(dirname(require.resolve('swisseph-wasm/package.json')), 'wasm')
  return {
    name: 'swiss-ephemeris-assets',
    apply: 'build',
    generateBundle() {
      for (const f of ['swisseph.wasm', 'swisseph.data'])
        this.emitFile({ type: 'asset', fileName: `wasm/${f}`, source: readFileSync(join(dir, f)) })
    },
  }
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  return {
    base: env.VITE_BASE || '/',
    plugins: [vue(), swissEphemerisAssets()],
    optimizeDeps: { exclude: ['swisseph-wasm'] },
    resolve: {
      alias: {
        // The standalone site reuses the selfOS component library and stores directly.
        '@': fileURLToPath(new URL('../../frontend/src', import.meta.url)),
        '~': fileURLToPath(new URL('./src', import.meta.url)),
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
            if (id.includes('node_modules/swisseph-wasm')) return 'swisseph'
            if (/node_modules\/(iztro|lunar-lite|lunar-typescript|i18next|dayjs)\//.test(id)) return 'ziwei'
          },
        },
      },
    },
  }
})
