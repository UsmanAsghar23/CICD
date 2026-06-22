import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [
    react(),
    {
      name: "health-check",
      configureServer(server) {
        server.middlewares.use("/health", (_req, res) => {
          res.statusCode = 200;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({ status: "ok", service: "dashboard" }));
        });
      },
      configurePreviewServer(server) {
        server.middlewares.use("/health", (_req, res) => {
          res.statusCode = 200;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({ status: "ok", service: "dashboard" }));
        });
      },
    },
  ],
  server: {
    host: "0.0.0.0",
    port: 5173,
  },
  preview: {
    host: "0.0.0.0",
    port: 5173,
  },
});
