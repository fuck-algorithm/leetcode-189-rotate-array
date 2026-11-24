import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 56018,
    strictPort: true
  },
  preview: {
    port: 56018
  },
  base: process.env.VITE_APP_BASE || '/leetcode-189-rotate-array/'
})
