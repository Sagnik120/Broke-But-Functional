# Architecture diagram prompt

Paste the prompt below into an AI diagram tool or assistant (for example Claude, ChatGPT, Eraser, Excalidraw AI, Whimsical AI or Mermaid Chart) to generate the architecture diagram for this project. It is self-contained: the tool needs nothing else.

To change the output format, edit the "Output" section at the end of the prompt.

---

## Prompt

```text
Draw a software architecture diagram for a client-only web application called
"Broke But Functional". It is a personal finance simulator: a user makes a
₹10,000 budget last 30 days and can simulate a money decision before making it.
There is NO backend, NO database and NO external API. Everything runs in the
browser. Do not invent servers, auth services, queues or cloud databases.

TECH STACK
React 19, TypeScript, Vite. Tests: Vitest and Testing Library. Hosting: static
files on a CDN.

LAYOUT
Top-to-bottom, four horizontal bands, each a labelled container. Inside the
browser boundary, from top to bottom:

BAND 1 — "Views (src/components)"
  - Dashboard (Overview): balance, daily allowance, forecast chart, health
    gauge, risk badge, smart suggestions, day control
  - Simulator (What if?): decision form, impact table, verdict
  - Activity: transaction form, transaction list, spending by category
  - Plans: savings goals panel, subscriptions and commitments panel
  - UI primitives (shared by all four): Field, Tabs, Badge, ProgressBar,
    ConfirmButton, AnimatedNumber, PanelSkeleton
  Mark Simulator, Activity and Plans as "lazy-loaded".

BAND 2 — "State (src/state)"
  - FinanceProvider (React context + useReducer)
  - Rate limiter (30 changes per 10 seconds)
  - Live-region announcer (screen-reader messages)

BAND 3 — "Domain (src/domain) — pure TypeScript, no React"
  - sanitize.ts: cleans text, validates amounts and days
  - reducer.ts: all state transitions and limits
  - ledger.ts: computeSnapshot → balance, safe to spend, daily allowance,
    burn rate, 30-day forecast, risk score, health score
  - simulate.ts: decision → action, before/after comparison, verdict
  - insights.ts: suggestions and category breakdown
  - storage.ts: validates and loads/saves state

BAND 4 — "Browser platform"
  - localStorage (the only persistence)
  - Web Crypto (ids and random surprise expenses)

OUTSIDE THE BROWSER BOUNDARY
  - "Static host / CDN": serves index.html, hashed JS and CSS chunks,
    self-hosted fonts. Sends security headers: Content-Security-Policy,
    X-Frame-Options, HSTS, nosniff.
  - "User" actor on the left.

ARROWS (label every arrow)
  1. User → Views: "types, clicks, keyboard"
  2. Views → sanitize.ts: "raw form values"
  3. sanitize.ts → Views: "typed value or error"
  4. Views → FinanceProvider: "dispatch(action)"
  5. FinanceProvider → Rate limiter: "tryAcquire"
  6. Rate limiter → reducer.ts: "allowed action"
  7. reducer.ts → FinanceProvider: "next FinanceState"
  8. FinanceProvider → ledger.ts: "computeSnapshot(state)"
  9. ledger.ts → Views: "Snapshot (derived, never stored)"
  10. FinanceProvider ↔ storage.ts: "load on start, save on change"
  11. storage.ts ↔ localStorage: "validated JSON"
  12. Simulator → simulate.ts: "decision"
  13. simulate.ts → reducer.ts: "same action on a COPY of state" (dashed line)
  14. simulate.ts → ledger.ts: "snapshot before and after" (dashed line)
  15. Dashboard → insights.ts → simulate.ts: "suggestions use the simulator"
  16. CDN → Browser: "static assets over HTTPS"

EMPHASIS
  - Show clearly that the single source of truth is FinanceState, and that
    everything on screen is derived from it by computeSnapshot.
  - Show clearly that the simulator and the real app share reducer.ts.
  - Draw a dashed "trust boundary" around localStorage with the note
    "untrusted: re-validated on load".

STYLE
  Clean and minimal. One accent colour for the Domain band so it reads as the
  core. Dashed lines for simulation paths, solid lines for real state changes.
  Rounded rectangles for modules, a cylinder for localStorage, a person icon
  for the user. No decorative icons. Include a small legend.

OUTPUT
  Produce the diagram as Mermaid `flowchart TB` code with subgraphs for each
  band. Then, below it, give a five-sentence caption explaining the data flow.
```

---

## Variations

Replace the OUTPUT section with one of these to get a different artefact.

| Goal | Replace OUTPUT with |
| --- | --- |
| Sequence diagram of one action | `Produce a Mermaid sequenceDiagram of the user adding an expense, from keypress to the updated dashboard, including the rate-limiter branch.` |
| C4 container diagram | `Produce a C4 container diagram in PlantUML (C4-PlantUML).` |
| Image | `Produce a 16:9 image of the diagram on a cream background with navy text and one blue accent.` |
| Data model | `Ignore the bands. Produce a Mermaid classDiagram of FinanceState, Transaction, ScheduledPayment, Goal and the derived Snapshot.` |

A hand-maintained version of the diagram is in [ARCHITECTURE.md](ARCHITECTURE.md) and the project [README](../README.md).
