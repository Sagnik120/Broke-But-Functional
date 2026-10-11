import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import type { Plugin } from 'vite';
import { defineConfig } from 'vitest/config';

/** Absolute path to `src`, decoded so folders with spaces resolve correctly. */
const SRC_DIR = decodeURIComponent(new URL('./src', import.meta.url).pathname);

const CONTENT_SECURITY_POLICY = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self'",
  "img-src 'self' data:",
  "connect-src 'self'",
  "worker-src 'self'",
  "manifest-src 'self'",
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

/**
 * Splits long-lived vendor code from app code, so a deploy that only changes
 * the app does not invalidate the cached React and icon bundles.
 */
function manualChunks(id: string): string | undefined {
  // Stylesheets stay with the app CSS, so there is a single render-blocking request.
  if (!id.includes('node_modules') || id.endsWith('.css')) return undefined;
  if (id.includes('lucide-react')) return 'vendor-icons';
  if (id.includes('web-vitals')) return 'vendor-vitals';
  if (/[\\/]node_modules[\\/](react|react-dom|scheduler)[\\/]/.test(id)) return 'vendor-react';
  return 'vendor';
}

export default defineConfig({
  plugins: [tailwindcss(), react(), contentSecurityPolicy(), preloadCriticalFont()],
  resolve: {
    alias: { '@': SRC_DIR },
  },
  build: {
    target: 'es2022',
    sourcemap: false,
    cssCodeSplit: true,
    cssMinify: true,
    minify: true,
    reportCompressedSize: true,
    chunkSizeWarningLimit: 250,
    rollupOptions: {
      output: { manualChunks },
    },
  },
  test: {
    environment: 'jsdom',
    globals: false,
    setupFiles: ['./src/test/setup.ts'],
    css: false,
    coverage: {
      provider: 'v8',
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['src/main.tsx', 'src/test/**', 'src/**/*.test.{ts,tsx}', 'src/vite-env.d.ts', 'src/types/**'],
      thresholds: { statements: 90, branches: 85, functions: 90, lines: 90 },
    },
  },
});
