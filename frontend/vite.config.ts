import { defineConfig } from '@lovable.dev/vite-tanstack-config'
import path from 'path'

export default defineConfig({
  cloudflare: false,
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    outDir: 'dist',
  },
})



