/*
 * Vite configuration for Linux Lab.
 * Copyright (c) 2026 Fedaa Mohamed. All rights reserved.
 */

import { defineConfig, type Plugin } from "vitest/config";
import { loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { parseDemoFlag } from "./src/demo/demoMode.ts";

const CONTENT_SECURITY_POLICY = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "script-src 'self' 'wasm-unsafe-eval'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self'",
  "connect-src 'self'",
  "worker-src 'self' blob:",
  "media-src 'self'",
  "form-action 'self'",
].join("; ");

/**
 * A meta CSP in production works on any static host. It is added only to the
 * built HTML: the Vite dev server injects an inline React refresh preamble that
 * a strict script-src would block, and development should stay debuggable.
 */
function productionCsp(): Plugin {
  return {
    name: "linuxlab-production-csp",
    apply: "build",
    transformIndexHtml(html) {
      const meta = `<meta http-equiv="Content-Security-Policy" content="${CONTENT_SECURITY_POLICY}" />`;
      return html.replace(
        '<meta charset="UTF-8" />',
        `<meta charset="UTF-8" />\n    ${meta}`,
      );
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, ".", "");
  const demoMode = parseDemoFlag(env.DEMO_MODE ?? env.VITE_DEMO_MODE);

  return {
    plugins: [react(), tailwindcss(), productionCsp()],
    define: {
      __DEMO_MODE__: JSON.stringify(demoMode),
    },
    server: {
      port: 5176,
      strictPort: true,
    },
    preview: {
      port: 5176,
      strictPort: true,
    },
    build: {
      target: "es2022",
      chunkSizeWarningLimit: 1200,
    },
    test: {
      environment: "jsdom",
      include: ["tests/**/*.test.ts"],
      reporters: ["default"],
      restoreMocks: true,
    },
  };
});
