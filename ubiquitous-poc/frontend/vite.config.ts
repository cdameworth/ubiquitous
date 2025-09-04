import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  css: {
    modules: {
      localsConvention: 'camelCase'
    }
  },
  server: {
    host: '0.0.0.0',
    port: 3000,
    strictPort: true,
    proxy: {
      '/api': {
        target: 'http://api:8000',
        changeOrigin: true,
        secure: false
      },
      '/ws': {
        target: 'ws://api:8000',
        ws: true,
        changeOrigin: true
      }
    }
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: true
  },
  define: {
    global: 'globalThis'
  },
  optimizeDeps: {
    include: ['d3']
  }
})