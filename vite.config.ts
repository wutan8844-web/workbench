import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  base: './',
  resolve: {
    preserveSymlinks: true,
  },
  optimizeDeps: {
    esbuildOptions: {
      preserveSymlinks: true,
    },
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon.svg'],
      manifest: {
        name: '进度本 · 个人成长工作台',
        short_name: '进度本',
        description: '每天20分钟学代码，同时管理基金与收支。',
        theme_color: '#17345f',
        background_color: '#f3f6fb',
        display: 'standalone',
        orientation: 'portrait',
        start_url: './',
        scope: './',
        icons: [
          { src: 'icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any maskable' }
        ]
      },
      workbox: {
        navigateFallback: 'index.html',
        globPatterns: ['**/*.{js,css,html,svg,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/.*\.supabase\.co\//,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'supabase-read-cache',
              networkTimeoutSeconds: 5,
              expiration: { maxEntries: 60, maxAgeSeconds: 86400 }
            }
          }
        ]
      }
    })
  ]
})
