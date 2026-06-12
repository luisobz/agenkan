import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // In development the API runs separately; proxy avoids CORS friction.
    proxy: {
      '/api': 'http://localhost:3210'
    }
  }
})
