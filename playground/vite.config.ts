import path from "node:path";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig, loadEnv } from "vite";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const usePkg = env.VITE_USE_PKG === "1";

  return {
    plugins: [tailwindcss()],
    resolve: {
      alias: usePkg
        ? {}
        : {
            "@eetr/json-2-md": path.resolve(__dirname, "../src/index.ts"),
          },
    },
    server: {
      port: 5173,
    },
    build: {
      outDir: "dist",
    },
  };
});
