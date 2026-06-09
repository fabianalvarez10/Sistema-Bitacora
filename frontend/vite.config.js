import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'icons.svg', 'logo-192x192.png', 'logo-512x512.png', 'apple-touch-icon.png'],
      manifest: {
        name: 'Inventario de Hardware CTSI VPDS',
        short_name: 'Inv CTSI',
        description: 'Sistema de Inventario y Bitácora para el departamento de CTSI',
        theme_color: '#1e3a8a',
        background_color: '#F0F4F8',
        display: 'standalone',
        icons: [
          {
            src: 'logo-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'logo-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ]
})
