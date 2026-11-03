import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// GitHub Pages serwuje projekt pod /<repo>/, lokalnie chcemy po prostu /.
export default defineConfig({
  base: process.env.VITE_BASE ?? "/",
  plugins: [react()],
  build: {
    outDir: "dist",
    sourcemap: false,
    chunkSizeWarningLimit: 900,
  },
});
