/// <reference types="vitest" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import { nodePolyfills } from "vite-plugin-node-polyfills";
import { config } from "dotenv";

config({ path: ".env" });

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    nodePolyfills({
      include: ["crypto", "stream", "util"],
    }),
  ],
  test: {
    environment: "node",
    testTimeout: 30000,
  },
  // resolve: {
  //   alias: {
  //     stream: "rollup-plugin-node-polyfills/polyfills/stream",
  //     crypto: "crypto-browserify",
  //   },
  // },
});
