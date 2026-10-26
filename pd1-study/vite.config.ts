/// <reference types="vitest/config" />
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  base: './',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon.svg'],
      manifest: {
        name: 'PD1 Study – Salesforce Platform Developer I',
        short_name: 'PD1 Study',
        description: 'Practice and exam simulator for the Salesforce Platform Developer I certification.',
        theme_color: '#0b5cab',
        background_color: '#f4f7fb',
        display: 'standalone',
        start_url: './',
        scope: './',
        lang: 'es',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
        ]
      },
      workbox: { globPatterns: ['**/*.{js,css,html,svg,png,webmanifest}'] }
    })
  ],
  test: { environment: 'node', include: ['src/**/*.test.ts'] }
});
