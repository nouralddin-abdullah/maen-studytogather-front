import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";
import path from "path";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: "autoUpdate",
      devOptions: {
        enabled: true,
      },
      includeAssets: ["pwa/**/*"],
      manifest: {
        name: "Shell — ادرس مع أصدقائك",
        short_name: "Shell",
        description: "منصة للدراسة الجماعية — تواصل، تعاون، تفوّق",
        dir: "rtl",
        lang: "ar",
        theme_color: "#1d6ef1",
        background_color: "#fafbfc",
        display: "standalone",
        start_url: "/",
        scope: "/",
        icons: [
          {
            src: "/pwa/android/launchericon-48x48.png",
            sizes: "48x48",
            type: "image/png",
          },
          {
            src: "/pwa/android/launchericon-72x72.png",
            sizes: "72x72",
            type: "image/png",
          },
          {
            src: "/pwa/android/launchericon-96x96.png",
            sizes: "96x96",
            type: "image/png",
          },
          {
            src: "/pwa/android/launchericon-144x144.png",
            sizes: "144x144",
            type: "image/png",
          },
          {
            src: "/pwa/android/launchericon-192x192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "/pwa/android/launchericon-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any",
          },
          { src: "/pwa/ios/180.png", sizes: "180x180", type: "image/png" },
          { src: "/pwa/ios/1024.png", sizes: "1024x1024", type: "image/png" },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 3000,
    open: true,
  },
});
