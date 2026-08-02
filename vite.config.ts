import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

const sourceDirectory = decodeURIComponent(
  new URL("./src", import.meta.url).pathname,
).replace(/^\/([A-Za-z]:)/, "$1");

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": sourceDirectory,
    },
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: "./src/test/setup.ts",
  },
});
