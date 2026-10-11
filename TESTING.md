# Testing

## Run

```bash
npm test                 # all tests, once
npm run test:watch       # watch mode
npm run test:coverage    # coverage report in coverage/, with thresholds
```

Coverage thresholds (statements 90, branches 85, functions 90, lines 90) are enforced in `vite.config.ts`; the run fails below them.

## Strategy

| Level         | What                                                                                           | Tooling                      | Files                                                                                                                                                          |
| ------------- | ---------------------------------------------------------------------------------------------- | ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Unit          | Pure logic: calculations, state transitions, month map, achievements, validation               | Vitest                       | `src/engine/*.test.ts`, `src/utils/*.test.ts`                                                                                                                  |
| Service       | The browser edge: storage, preferences, web vitals, service worker registration                | Vitest with stubs            | `src/services/*.test.ts`                                                                                                                                       |
| Hook          | Routing, media queries, online status, prefetching, animated numbers                           | Testing Library              | `src/hooks/*.test.tsx`                                                                                                                                         |
| Component     | Each primitive, chart and widget in isolation: roles, labels, states, keyboard                 | Testing Library              | `src/components/ui/ui.test.tsx`, `src/components/charts/charts.test.tsx`, `src/components/dashboard/widgets.test.tsx`, `src/components/layout/layout.test.tsx` |
| Integration   | Whole views driven the way a user would: type, click, tab, drag, read                          | Testing Library, user-event  | `src/App.test.tsx`, `src/pages/pages.test.tsx`                                                                                                                 |
| Accessibility | axe-core against every view, the high-risk state and the dark theme                            | axe-core                     | `src/App.test.tsx`, `src/pages/pages.test.tsx`, `src/components/layout/layout.test.tsx`                                                                        |
| Static        | Types, lint (including accessibility rules) and formatting                                     | TypeScript, ESLint, Prettier | `npm run typecheck`, `npm run lint`, `npm run format:check`                                                                                                    |
| Visual        | Every view at 320, 390, 820 and 1440 px in both themes; checks for console errors and overflow | Headless Chrome              | Run manually before release                                                                                                                                    |

Tests query by role and label, not by class name or test id, so a passing test also shows the element is reachable by assistive technology.

## What is covered

| Area               | Examples                                                                                                      |
| ------------------ | ------------------------------------------------------------------------------------------------------------- |
| Calculations       | Balance, allowance, burn rate, forecast length and switch-over day, shortfall day, risk levels, health grades |
| Scheduled payments | Charged on the due day; not charged if cancelled before; kept if cancelled after                              |
| Reducer invariants | Immutability, collection caps, savings clamped to the goal, day cannot rewind past activity                   |
| Simulation         | Never mutates real state; every decision type; applying equals the preview                                    |
| Month map          | Thirty cells, spend levels, bills on their due day, cancelled subscriptions removed, shortfall flagged        |
| Achievements       | Streak counting, each badge's rule, edge cases such as cancelling after the bill                              |
| Sanitising         | Markup, control characters, bidi overrides, length cap, non-string input, malformed numbers                   |
| Storage            | Round trip, corrupt JSON, tampered labels, malformed entries, oversized payloads, prototype pollution         |
| Rate limiting      | Limit, sliding-window recovery, blocked attempts not counted, blocked action not announced                    |
| Routing            | Deep links, unknown hashes, history entries, back button, document title                                      |
| Theming            | Toggle, `aria-pressed`, persistence, system preference, blocked storage                                       |
| Keyboard           | Arrow, Home and End on tabs in both orientations; Enter on confirm; focus moves to the simulator tab          |
| Forms              | Required fields, range errors, errors linked to inputs, form reset on success                                 |
| Hostile input      | `<img onerror>` rendered as inert text with no element created                                                |
| Persistence        | State saved on change and restored on remount; corrupt data falls back to the demo                            |
| Motion             | Count-up progresses and lands exactly on target; instant under reduced motion; cancels on unmount             |
| Resilience         | Error boundary fallback; empty states; offline notice; service worker registration failure                    |

## Determinism

Time and randomness are injected (`createRateLimiter({ now })`, `drawCurveball(random)`, `<SimulatorPage random>`), animation and prefetch tests use fake timers, and the route and storage are reset after every test, so no test depends on the wall clock, on chance or on another test.

## Not covered

- Automated end-to-end tests in a real browser. Layout is checked visually in headless Chrome, not asserted.
- Colour contrast in the unit suite (jsdom has no layout engine); Lighthouse checks it instead.
- Manual screen-reader testing.
- The service worker's own fetch handling, which needs a real browser.
