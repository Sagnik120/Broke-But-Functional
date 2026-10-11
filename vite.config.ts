import react from '@vitejs/plugin-react';
import type { Plugin } from 'vite';
import { defineConfig } from 'vitest/config';

const CONTENT_SECURITY_POLICY = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self'",
  "img-src 'self' data:",
  "connect-src 'self'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
].join('; ');

/** Ships a strict CSP with production builds (dev needs inline HMR scripts). */
function contentSecurityPolicy(): Plugin {
  return {
    name: 'content-security-policy',
    apply: 'build',
    transformIndexHtml: () => [
      {
        tag: 'meta',
        attrs: { 'http-equiv': 'Content-Security-Policy', content: CONTENT_SECURITY_POLICY },
        injectTo: 'head-prepend',
      },
    ],
  };
}

/** The UI font renders the largest text on screen, so fetch it alongside the CSS. */
const CRITICAL_FONT = /figtree-latin-wght-normal.*\.woff2$/;

function preloadCriticalFont(): Plugin {
  return {
    name: 'preload-critical-font',
    apply: 'build',
    transformIndexHtml(_html, context) {
      const font = Object.keys(context.bundle ?? {}).find((file) => CRITICAL_FONT.test(file));
      if (!font) return [];
      return [
        {
          tag: 'link',
          attrs: { rel: 'preload', as: 'font', type: 'font/woff2', href: `/${font}`, crossorigin: '' },
          injectTo: 'head',
        },
      ];
    },
  };
}

export default defineConfig({
  plugins: [react(), contentSecurityPolicy(), preloadCriticalFont()],
  build: {
    target: 'es2022',
    sourcemap: false,
    cssCodeSplit: true,
  },
  test: {
    environment: 'jsdom',
    globals: false,
    setupFiles: ['./src/test/setup.ts'],
    css: false,
    coverage: {
      provider: 'v8',
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['src/main.tsx', 'src/test/**', 'src/**/*.test.{ts,tsx}', 'src/vite-env.d.ts'],
    },
  },
});
