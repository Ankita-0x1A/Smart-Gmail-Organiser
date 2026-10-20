import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [
    react(),
    {
      name: "oauth-redirect-handler",
      configureServer(server) {
        // Development middleware to safely capture backend 302 redirect for Gmail OAuth
        server.middlewares.use("/api/gmail/connect", async (req, res) => {
          try {
            const authHeader = req.headers["authorization"];

            // Forward the authenticated request with JWT to the Express backend (server-to-server)
            const backendRes = await fetch("http://localhost:5000/api/gmail/connect", {
              headers: authHeader ? { Authorization: authHeader } : {},
              redirect: "manual",
            });

            // Extract the Google OAuth URL from the backend's 302 Location header
            const location = backendRes.headers.get("location");
            if (location) {
              res.writeHead(200, { "Content-Type": "application/json" });
              res.end(JSON.stringify({ authUrl: location }));
              return;
            }

            // Forward backend error response if unauthorized or failed
            const body = await backendRes.text();
            res.writeHead(backendRes.status, { "Content-Type": "application/json" });
            res.end(body);
          } catch (error) {
            res.writeHead(500, { "Content-Type": "application/json" });
            res.end(
              JSON.stringify({ message: "Failed to initiate Google authorization." })
            );
          }
        });
      },
    },
  ],
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "http://localhost:5000",
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
