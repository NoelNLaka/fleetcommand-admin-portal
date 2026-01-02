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
        includeAssets: ['favicon.ico', 'icon-192x192.jpg', 'icon-512x512.jpg'],
        manifest: {
          name: "Fleet Command Admin Portal",
          short_name: "FleetAdmin",
          theme_color: "#137fec",
          background_color: "#101922",
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
