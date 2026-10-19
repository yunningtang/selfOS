import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  return {
    // Served from a sub-path on GitHub Pages; '/' everywhere else.
    base: env.VITE_BASE || '/',
    plugins: [vue()],
    resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
    server: {
      port: 3000,
      proxy: {
        '/api': { target: env.VITE_BACKEND_URL || 'http://localhost:5001', changeOrigin: true },
      },
    },
    preview: { port: 3000 },
    build: {
      target: 'es2022',
      // three (Memory Chamber only) and the demo-mode chart engines are lazy chunks, never on the initial path.
      chunkSizeWarningLimit: 600,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules/three')) return 'three'
            if (id.includes('node_modules/d3')) return 'd3'
          },
        },
      },
    },
  }
})
