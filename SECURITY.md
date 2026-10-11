# Security

## Threat model

Broke But Functional is a static, client-only application. There is no server, no database, no account system and no network API. All data lives in the visitor's own browser (`localStorage`). The realistic threats are therefore hostile input, tampered stored data, script injection, clickjacking, vulnerable dependencies and abuse that freezes the page.

## Controls in this codebase

| Threat | Control | Where |
| --- | --- | --- |
| Cross-site scripting (XSS) | React escapes all output; no `dangerouslySetInnerHTML`, `eval` or inline scripts/styles. Labels are stripped of markup delimiters, control, zero-width and bidi-override characters | `src/domain/sanitize.ts` |
| Injection through numbers | Amounts and days must match strict whole-number patterns and ranges | `parseAmount`, `parseDay` |
| Tampered or corrupt stored data | Every stored field is re-validated and rebuilt into fresh objects; malformed entries are dropped; unknown keys (including `__proto__`) are ignored | `src/domain/storage.ts` |
| Client-side denial of service | Sliding-window rate limiter on every state change (30 per 10 s); hard caps on transactions (500), scheduled payments (50), goals (20), label length (40) and amount (₹1,00,000); stored payloads over 200,000 characters are refused before parsing | `src/domain/rateLimit.ts`, `src/domain/constants.ts`, `src/domain/reducer.ts` |
| Script and style injection, data exfiltration | Strict Content Security Policy: `default-src 'self'; script-src 'self'; style-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'` | `vite.config.ts`, `vercel.json`, `public/_headers` |
| Clickjacking | `X-Frame-Options: DENY` and `frame-ancestors 'none'` | `vercel.json`, `public/_headers` |
| MIME sniffing, referrer leaks, downgrade | `X-Content-Type-Options: nosniff`, `Referrer-Policy: no-referrer`, HSTS, restrictive `Permissions-Policy` | `vercel.json`, `public/_headers` |
| Supply chain | Two runtime dependencies (React, React DOM) plus self-hosted fonts; `npm audit` runs in CI; versions pinned by `package-lock.json` | `.github/workflows/ci.yml` |
| Error detail leaks | Error boundary shows a generic message; nothing is logged to the console in production code (`no-console` lint rule) | `src/components/ErrorBoundary.tsx` |
| Unpredictable IDs and randomness | `crypto.randomUUID` / `crypto.getRandomValues`, never `Math.random` | `src/domain/id.ts`, `src/domain/curveballs.ts` |

## What does not apply, and why

- **SQL injection:** there is no database and no query language anywhere in the app, so there is nothing to inject into. If a backend is added, use parameterised queries and validate on the server with the same rules as `sanitize.ts`.
- **Server-side rate limiting and DDoS:** the app is static files. Volumetric attacks are absorbed by the hosting CDN (Vercel, Netlify, Cloudflare), not by application code. The in-app rate limiter protects the page itself, not a server.
- **Authentication, sessions, CSRF:** no accounts, cookies or state-changing requests exist.

## Tests

Sanitising, storage validation, prototype-pollution resistance, oversized payloads, hostile input rendering and rate limiting are all covered in `src/domain/*.test.ts` and `src/components/views.test.tsx`.
