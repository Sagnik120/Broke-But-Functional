# Testing

## Run

```bash
npm test                 # all tests, once
npm run test:watch       # watch mode
npm run test:coverage    # with a coverage report in coverage/
```

## Strategy

| Level | What | Tooling | Files |
| --- | --- | --- | --- |
| Unit | Pure domain logic: calculations, state transitions, validation, persistence, rate limiting | Vitest | `src/domain/*.test.ts` |
| Component | Each primitive and chart in isolation: roles, labels, states, keyboard | Testing Library | `src/components/ui/ui.test.tsx`, `src/components/dashboard/dashboard.test.tsx`, `src/hooks/useAnimatedNumber.test.tsx` |
| Integration | Whole views driven the way a user would: type, click, tab, read | Testing Library, user-event | `src/App.test.tsx`, `src/components/views.test.tsx` |
| Accessibility | axe-core against every view and the high-risk state | axe-core | `src/App.test.tsx`, `src/components/views.test.tsx` |
| Static | Types and lint, including accessibility lint rules | TypeScript, ESLint | `npm run typecheck`, `npm run lint` |

Tests query by role and label, not by class name or test id, so a test that passes also demonstrates the element is reachable by assistive technology.

## What is covered

| Area | Examples |
| --- | --- |
| Calculations | Balance, allowance, burn rate, forecast length and switch-over day, shortfall day, risk levels, health grades |
| Scheduled payments | Charged on the due day; not charged if cancelled before; kept if cancelled after |
| Reducer invariants | Immutability, collection caps, savings clamped to the goal, day cannot rewind past activity |
| Simulation | Never mutates real state; every decision type; applying equals the preview |
| Sanitising | Markup, control characters, bidi overrides, length cap, non-string input, malformed numbers |
| Storage | Round trip, corrupt JSON, tampered labels, malformed entries dropped, oversized payloads, prototype pollution, storage that throws |
| Rate limiting | Limit, sliding window recovery, blocked attempts not counted, blocked action not announced |
| Keyboard | Arrow, Home and End on tabs; Enter on confirm; focus moves to the simulator tab |
| Forms | Required fields, range errors, errors linked to inputs, form reset on success |
| Hostile input | `<img onerror>` rendered as inert text with no element created |
| Persistence | State saved on change and restored on remount; corrupt data falls back to the demo |
| Motion | Count-up progresses and lands exactly on target; instant under reduced motion; cancels on unmount |
| Resilience | Error boundary fallback; empty states for every list |

## Determinism

Time and randomness are injected (`createRateLimiter({ now })`, `drawCurveball(random)`, `<Simulator random>`), and animation tests use fake timers, so no test depends on the wall clock or on chance.

## Not covered

- Real-browser end-to-end tests. Layout was checked visually in headless Chrome, not asserted.
- Colour contrast in the unit suite (jsdom has no layout engine); Lighthouse checks it instead.
- Manual screen-reader testing.
