import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [
      react(), 
      tailwindcss(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg', 'logo-icon.png', 'horizontal-logo.png'],
        manifest: {
          name: 'AutoMotive Buddy',
          short_name: 'AutoBuddy',
          description: 'Premium AI-powered automotive diagnostic and maintenance platform.',
          theme_color: '#f97316',
          background_color: '#0f172a',
          display: 'standalone',
          orientation: 'portrait',
          categories: ['tools', 'productivity', 'education'],
          icons: [
            {
              src: 'logo-icon.png',
              sizes: '192x192',
              type: 'image/png'
            },
            {
              src: 'logo-icon.png',
              sizes: '512x512',
              type: 'image/png'
            },
            {
              src: 'logo-icon.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any maskable'
            }
          ],
          shortcuts: [
            {
              name: 'DTC Lookup',
              short_name: 'DTC',
              description: 'Quick diagnostic code lookup',
              url: '/#dtc',
              icons: [{ src: 'logo-icon.png', sizes: '192x192' }]
            },
            {
              name: 'OpenClaw AI',
              short_name: 'AI',
              description: 'Talk to diagnostic AI',
              url: '/#claw',
              icons: [{ src: 'logo-icon.png', sizes: '192x192' }]
            }
          ]
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
          runtimeCaching: [
            {
              urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'google-fonts-cache',
                expiration: {
                  maxEntries: 10,
                  maxAgeSeconds: 60 * 60 * 24 * 365 // <== 365 days
                },
                cacheableResponse: {
                  statuses: [0, 200]
                }
              }
            }
          ]
        }
      })
    ],
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    build: {
      chunkSizeWarningLimit: 1000,
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
    },
  };
});
