import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // VITE_BASE_PATH is injected by CI (e.g. GitHub Pages sub-path).
  // Defaults to '/' for local dev and Render.com deployments.
  base: process.env.VITE_BASE_PATH || '/',
  server: {
    host: true, // expose on 0.0.0.0 so mobile devices on the same network can connect
  },
})
