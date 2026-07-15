import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { VitePWA } from 'vite-plugin-pwa'

const isMobile = process.env.CAPACITOR_BUILD === 'true'
const base = isMobile ? '/' : '/Breyne.Wallet/'

export default defineConfig({
  base,

  plugins: [
    vue(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'favicon.ico', 'apple-touch-icon.png', 'icons/*.png'],
      manifest: {
        name: 'BreyneWallet',
        short_name: 'Breyne',
        description: 'Controle financeiro pessoal com Selic e liberdade financeira.',
        start_url: base,
        display: 'standalone',
        background_color: '#f5f0e6',
        theme_color: '#1e3a5f',
        orientation: 'portrait-primary',
        icons: [
          {
            src: `${base}icons/icon-192.png`,
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any maskable'
          },
          {
            src: `${base}icons/icon-512.png`,
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/economia\.awesomeapi\.com\.br\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'exchange-rate-cache',
              expiration: {
                maxAgeSeconds: 3600
              }
            }
          },
          {
            urlPattern: /^https:\/\/api\.bcb\.gov\.br\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'bcb-api-cache',
              expiration: {
                maxAgeSeconds: 3600
              }
            }
          }
        ]
      }
    })
  ]
})