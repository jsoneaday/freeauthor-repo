/// <reference types="vitest" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import { config } from "dotenv";

config({ path: ".env" });

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  test: {
    environment: "node",
    testTimeout: 30000,
  },
});
