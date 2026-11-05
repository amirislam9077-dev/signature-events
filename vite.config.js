import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    open: true,
    // API_PORT: agar 5000 par koi aur program chal raha ho
    proxy: { "/api": `http://localhost:${process.env.API_PORT || 5000}` },
  },
});
