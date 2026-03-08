import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      devOptions: {
        enabled: true
      },
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'mask-icon.svg'],
      manifest: {
        name: 'Khai Htoo Lay VC',
        short_name: 'KHLVC',
        description: 'A simple P2P video and voice calling app',
        theme_color: '#ffffff',
        icons: [
          {
            src: 'pwa-icon.png',
            sizes: '192x192 512x512',
            type: 'image/svg+xml'
          },
          {
            src: 'pwa-icon.png',
            sizes: '192x192 512x512',
            type: 'image/svg+xml',
            purpose: 'any maskable'
          }
        ]
      }
    })
  ],
})
