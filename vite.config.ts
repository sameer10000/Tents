import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    // Same-origin in development, so the session cookie behaves exactly as it
    // will in production behind a single host.
    // Imagery is served from Cloudinary, so only the API is proxied now.
    proxy: {
      '/api': { target: 'http://localhost:4000', changeOrigin: true },
    },
  },
  build: {
    // Route-level lazy imports in App.tsx already produce the split we want;
    // rolldown handles vendor grouping on its own.
    target: 'es2022',
    cssMinify: 'lightningcss',
  },
})
