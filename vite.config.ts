import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  // Set to "/<repo-name>/" when deploying to GitHub Pages project sites
  // (the CI workflow sets this automatically via the BASE_PATH env var).
  base: process.env.BASE_PATH ?? '/',
  plugins: [react(), tailwindcss()],
})
