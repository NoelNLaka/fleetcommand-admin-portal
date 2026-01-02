import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    server: {
      port: 3000,
      host: '0.0.0.0',
    },
    plugins: [
      react(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: [
          'favicon.ico',
          'icon-192x192.jpg',
          'icon-512x512.jpg',
          'actuon-logo.svg',
          'actuon-logo.png',
          'apple-touch-icon.png',
          'apple-touch-icon-120x120.png',
          'apple-touch-icon-ipad.png',
          'apple-touch-icon-ipad-retina.png',
          'apple-splash-*.png'
        ],
        manifest: {
          name: "Actuon Fleet Command",
          short_name: "Actuon",
          theme_color: "#137fec",
          background_color: "#FFFFFF",
          display: "standalone",
          orientation: "portrait",
          start_url: "/",
          icons: [
            {
              src: "/icon-192x192.jpg",
              sizes: "192x192",
              type: "image/jpeg"
            },
            {
              src: "/icon-512x512.jpg",
              sizes: "512x512",
              type: "image/jpeg"
            },
            {
              src: "/apple-touch-icon.png",
              sizes: "180x180",
              type: "image/png",
              purpose: "any maskable"
            }
          ]
        }
      })
    ],
    define: {
      'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      }
    }
  };
});
