# Broke But Functional

**₹10,000. 30 days. See the consequences before you spend.**

A personal finance experience for Gen Z that goes beyond expense tracking. Income, balance, spending, commitments, subscriptions, savings goals, unexpected expenses, risk and financial health are all derived from one ledger, so every decision visibly moves everything else.

## What it does

| Problem statement | Where it lives |
| --- | --- |
| Manage a limited ₹10,000 budget over 30 days | Overview: balance, "safe to spend today", day stepper |
| Income, spending, unexpected expenses | Activity: log expenses, income and one-off shocks |
| Commitments and subscriptions | Plans: scheduled payments are reserved before the allowance is calculated and charged on their due day; subscriptions can be cancelled and resumed |
| Savings goals | Plans: money moved to a goal leaves the spendable balance |
| Simulate decisions before taking them | What if?: preview a purchase, new subscription, cancellation, goal transfer, extra income or surprise expense, with a before/after table |
| Effect on balance, daily allowance, goals, forecast, risk, health | The impact table shows all six, with a verdict (Go for it / Think twice / Not a good idea) |
| Monthly forecast | Overview: actual vs projected balance chart and the day money runs out |
| Financial risk and health | Overview: 0–100 risk score with plain-language reasons, 0–100 health gauge |
| Unexpected expenses | "Throw me a curveball" draws a surprise expense into the simulator |

## How the numbers connect

- **Balance** = ₹10,000 + extra income − expenses − money moved to goals − scheduled payments already charged
- **Safe to spend** = balance − scheduled payments still to come
- **Daily allowance** = safe to spend ÷ days left (including today)
- **Burn rate** = everyday spending ÷ days elapsed (unexpected expenses are excluded so one shock doesn't distort the pace)
- **Forecast** = today's balance, minus the burn rate each remaining day, minus each scheduled payment on its due day
- **Risk (0–100)** = spending pace vs allowance (35) + running out or a thin month-end cushion (40) + balance not covering promised payments (20) + unfunded goals (10) + shock exposure (5)
- **Health (0–100)** = 90% from low risk + 10% from savings-goal progress

The simulator runs a decision through the **same reducer** the app uses, on a copy of the state, then compares the two snapshots. A preview can therefore never disagree with what applying the decision does.

## Tech stack

React 19, TypeScript (strict), Vite 8, Vitest + Testing Library + axe-core, ESLint (typescript-eslint, react-hooks, jsx-a11y). No UI or chart libraries: charts are hand-written SVG.

## Run it

```bash
npm install
npm run dev        # local development
npm run build      # typecheck + production build into dist/
npm run preview    # serve the production build
npm test           # 118 unit and component tests
npm run test:coverage
npm run lint
npm run check      # typecheck + lint + test + build
```

## Architecture

```
src/
  domain/        Pure TypeScript, no React. Fully unit tested.
    types.ts       Data model
    ledger.ts      computeSnapshot(): every derived number, risk and health
    reducer.ts     All state transitions and invariants
    simulate.ts    Decision → action, before/after comparison, verdict
    sanitize.ts    Input sanitising and parsing
    storage.ts     Validated localStorage persistence
  state/         React context: reducer + memoised snapshot + live-region announcer
  components/    One folder per view (dashboard, simulator, activity, plans) + ui primitives
  styles/        Design tokens and component styles (light and dark)
```

The UI holds only raw form values. Everything shown is derived from `FinanceState` by `computeSnapshot`, so views cannot drift out of sync.

## Security and data sanitisation

- All free text goes through `sanitizeText`: Unicode normalisation, removal of control, zero-width and bidi-override characters and markup delimiters, whitespace collapsing and a length cap.
- Amounts and days are parsed with strict whole-number patterns and range limits.
- Data read from `localStorage` is treated as untrusted: every field is re-validated and malformed entries are dropped.
- No `dangerouslySetInnerHTML`, no `eval`, no inline styles or scripts.
- Production builds ship a strict Content Security Policy (`script-src 'self'; style-src 'self'`); `vercel.json` and `public/_headers` add `frame-ancestors`, `nosniff`, HSTS and a referrer policy.
- No backend, accounts, analytics or third-party requests. Data never leaves the browser.

## Performance

- About 78 kB gzipped JavaScript for first paint; Simulator, Activity and Plans are lazy-loaded chunks.
- 3 kB gzipped CSS, system fonts, no images, no web fonts, no layout-shifting assets.
- The snapshot is memoised on state; chart and gauge are `memo`ised.
- Respects `prefers-reduced-motion`.

## Accessibility

- Skip link, landmarks, one `h1` and ordered headings.
- WAI-ARIA tabs with roving tabindex (arrow keys, Home, End).
- Every input has a visible label; errors are linked with `aria-describedby` and `aria-invalid`.
- State changes are announced through a polite live region.
- Charts have text alternatives; progress uses native `<progress>`.
- Status is never conveyed by colour alone; 44px touch targets; visible focus rings; light and dark themes; forced-colours support.
- axe-core runs against every view in the test suite.

## Testing

118 tests, about 98% statement coverage: the domain engine, reducer, simulator, sanitiser and storage validation are unit tested, and each view is tested through user interactions, including keyboard navigation, validation, hostile input, persistence and automated accessibility checks.
