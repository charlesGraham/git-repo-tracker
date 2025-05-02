import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Check if we should force host binding
const forceServerHost = process.env.VITE_FORCE_SERVER_HOST === "true";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: forceServerHost ? "0.0.0.0" : false,
    port: 5173,
    strictPort: true,
    proxy: {
      "/graphql": {
        target: "http://localhost:3000",
        changeOrigin: true,
      },
      "/api": {
        target: "http://localhost:3000",
        changeOrigin: true,
      },
    },
  },
});
