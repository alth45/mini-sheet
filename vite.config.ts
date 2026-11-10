import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],

  resolve: {
    alias: {
      // import '@/...' → src/...
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },

  server: {
    port: 5173,
    open: true, // auto-open browser saat `npm run dev`
    strictPort: false, // kalau 5173 dipakai, Vite cari port lain
  },

  build: {
    target: "es2022", // modern baseline (Node 20+)
    sourcemap: false, // ganti ke true kalau butuh debug production
    outDir: "dist",
    chunkSizeWarningLimit: 800, // hindari warning karena bundle Vue ~ 200kb
  },
});
