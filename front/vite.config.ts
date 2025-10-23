import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  const proxyTargets = {
    catalog: env.VITE_API_CATALOG || "http://localhost:4101",
    users: env.VITE_API_USERS || "http://localhost:4102",
    orders: env.VITE_API_ORDERS || "http://localhost:4103",
    recommendations: env.VITE_API_RECOMMENDATIONS || "http://localhost:4104",
  };

  const proxy = {
    "/api/catalog": {
      target: proxyTargets.catalog,
      changeOrigin: true,
      rewrite: (p: string) => p.replace(/^\/api\/catalog/, ""),
    },
    "/api/users": {
      target: proxyTargets.users,
      changeOrigin: true,
      rewrite: (p: string) => p.replace(/^\/api\/users/, ""),
    },
    "/api/orders": {
      target: proxyTargets.orders,
      changeOrigin: true,
      rewrite: (p: string) => p.replace(/^\/api\/orders/, ""),
    },
    "/api/recommendations": {
      target: proxyTargets.recommendations,
      changeOrigin: true,
      rewrite: (p: string) => p.replace(/^\/api\/recommendations/, ""),
    },
  };

  return {
    server: {
      host: "::",
      port: 8080,
      proxy,
    },
    plugins: [react()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
  };
});
