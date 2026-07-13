/// <reference types="vitest/config" />
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['logo.jpg'],
      manifest: {
        name: 'AgenKan',
        short_name: 'AgenKan',
        description:
          'Bloc de notas con kanban integrado y planificador con IA local',
        theme_color: '#0f1117',
        background_color: '#0f1117',
        display: 'standalone',
        icons: [
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable'
          }
        ]
      },
      workbox: {
        // Precache the app shell only. The API (including the SSE stream)
        // must never be intercepted: this app is online-first.
        globPatterns: ['**/*.{js,css,html,svg,png,jpg}'],
        navigateFallbackDenylist: [/^\/api/]
      }
    })
  ],
  test: {
    environment: 'jsdom',
    // Needed for @testing-library/react's automatic DOM cleanup.
    globals: true,
    include: ['src/**/*.test.{ts,tsx}']
  },
  server: {
    port: 5173,
    // In development the API runs separately; proxy avoids CORS friction.
    proxy: {
      '/api': 'http://localhost:3210'
    }
  }
})
