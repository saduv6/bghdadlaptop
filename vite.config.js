import { defineConfig } from "vite";
import { resolve } from "path";

export default defineConfig({
  root: ".",
  build: {
    outDir: "dist",
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: resolve(__dirname, "index.html"),
        checkout: resolve(__dirname, "checkout.html"),
        dashboard: resolve(__dirname, "dashboard.html"),
      },
    },
  },
  server: {
    port: 5173,
  },
});
