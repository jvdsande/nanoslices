import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/nanoslices/',
  test: {
    environment: 'jsdom',
    setupFiles: ['src/__test__/setup.js']
  }
})
