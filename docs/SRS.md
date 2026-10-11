# Software Requirements Specification

**Product:** Broke But Functional
**Version:** 1.0

## 1. Introduction

### 1.1 Purpose

This document specifies what Broke But Functional must do and how well it must do it. It is the reference for checking the implementation against the hackathon problem statement.

### 1.2 Scope

A browser application that helps a Gen Z user make a ₹10,000 budget last 30 days. It connects income, balance, spending, commitments, subscriptions, savings goals, unexpected expenses, risk and financial health, and lets the user simulate a decision before making it.

Out of scope: real bank connections, payments, accounts, multi-device sync, multi-month history.

### 1.3 Definitions

| Term | Meaning |
| --- | --- |
| Ledger | The stored state: transactions, scheduled payments, goals and the current day |
| Snapshot | Every figure derived from the ledger at a point in time |
| Scheduled payment | A commitment or subscription with an amount and a due day |
| Safe to spend | Balance minus scheduled payments still to come |
| Daily allowance | Safe to spend divided by days left, including today |
| Burn rate | Average everyday (non-unexpected) spend per elapsed day |
| Decision | A change the user is considering: spend, subscribe, cancel, save, earn, or absorb an unexpected expense |

## 2. Overall description

### 2.1 Users

Students and early earners aged roughly 16–25 managing a small monthly amount on a phone. They want a direct answer to "can I afford this?" and are not finance experts.

### 2.2 Operating environment

Current versions of Chrome, Edge, Firefox and Safari, on phone and desktop. No server.

### 2.3 Constraints

- Must be built with a modern framework (React with TypeScript).
- Budget is fixed at ₹10,000; the period is 30 days.
- All data stays on the user's device.

## 3. Functional requirements

| ID | Requirement |
| --- | --- |
| FR-1 | The system shall start each month with a ₹10,000 budget and a 30-day period. |
| FR-2 | The user shall be able to record an expense with a description, amount and category. |
| FR-3 | The user shall be able to record extra income. |
| FR-4 | The user shall be able to mark an expense as unexpected; unexpected expenses shall not change the burn rate. |
| FR-5 | The user shall be able to remove a recorded transaction. |
| FR-6 | The user shall be able to add commitments and subscriptions with an amount and due day. |
| FR-7 | A scheduled payment shall be deducted from the balance when its due day arrives. |
| FR-8 | The user shall be able to cancel and resume a subscription. A cancellation before the due day shall prevent the charge; one on or after it shall not refund it. |
| FR-9 | The user shall be able to create savings goals and move money to them. A goal shall not accept more than its target. |
| FR-10 | Removing a goal shall return its saved money to the balance. |
| FR-11 | The system shall show the remaining balance, daily allowance, upcoming commitments, savings and month-end forecast. |
| FR-12 | The system shall forecast the balance for each remaining day and state the day money runs out, if any. |
| FR-13 | The system shall compute a financial risk score (0–100) with a level and plain-language reasons. |
| FR-14 | The system shall compute a financial health score (0–100) with a grade. |
| FR-15 | The user shall be able to simulate any decision type without changing stored data. |
| FR-16 | A simulation shall show the before, after and change for balance, daily allowance, month-end forecast, goal progress, risk and health, plus a verdict. |
| FR-17 | The user shall be able to apply a simulated decision; the result shall equal the simulated outcome. |
| FR-18 | The system shall be able to generate a random unexpected expense for simulation. |
| FR-19 | The user shall be able to advance the day, and go back as far as the latest recorded activity. |
| FR-20 | The system shall offer suggestions whose quoted figures come from the simulator. |
| FR-21 | The system shall show spending by category. |
| FR-22 | The system shall persist the ledger on the device and restore it on the next visit. |
| FR-23 | The user shall be able to reset to a fresh month or load demo data, after confirmation. |

## 4. Non-functional requirements

| ID | Category | Requirement |
| --- | --- | --- |
| NFR-1 | Performance | Largest Contentful Paint under 2.5 s, Cumulative Layout Shift under 0.1 and Total Blocking Time under 200 ms on Lighthouse mobile emulation. |
| NFR-2 | Performance | First-load JavaScript under 100 kB gzipped; secondary views loaded on demand. |
| NFR-3 | Security | All user text shall be sanitised; all numeric input shall be validated against a pattern and range. |
| NFR-4 | Security | Stored data shall be re-validated on load; invalid entries shall be discarded. |
| NFR-5 | Security | Production builds shall ship a Content Security Policy without `unsafe-inline` or `unsafe-eval`. |
| NFR-6 | Security | State changes shall be rate limited and all collections size-capped. |
| NFR-7 | Accessibility | WCAG 2.2 AA: keyboard operable, labelled controls, announced changes, no colour-only meaning. |
| NFR-8 | Accessibility | All motion shall stop under `prefers-reduced-motion`. |
| NFR-9 | Reliability | A rendering error shall show a recovery message, not a blank page. Storage failure shall not break the app. |
| NFR-10 | Maintainability | Business logic shall be pure functions, independent of the UI, with unit tests. Statement coverage at least 90%. |
| NFR-11 | Privacy | No data shall leave the device; no third-party requests. |
| NFR-12 | Responsiveness | Usable from 320 px width upward with no horizontal page scrolling. |

## 5. Traceability matrix

| Problem statement clause | Requirements | Implementation | Tests |
| --- | --- | --- | --- |
| Manage a limited ₹10,000 budget over 30 days | FR-1, FR-11, FR-19 | `domain/ledger.ts`, `dashboard/Dashboard.tsx`, `dashboard/DayControl.tsx` | `ledger.test.ts`, `App.test.tsx` |
| Connect income, balance, spending | FR-2, FR-3, FR-5 | `domain/reducer.ts`, `activity/Activity.tsx` | `reducer.test.ts`, `views.test.tsx` |
| Commitments and subscriptions | FR-6, FR-7, FR-8 | `domain/ledger.ts`, `plans/ScheduledPanel.tsx` | `ledger.test.ts`, `views.test.tsx` |
| Savings goals | FR-9, FR-10 | `domain/reducer.ts`, `plans/GoalsPanel.tsx` | `reducer.test.ts`, `views.test.tsx` |
| Unexpected expenses | FR-4, FR-18 | `domain/curveballs.ts`, `simulator/Simulator.tsx` | `simulate.test.ts`, `views.test.tsx` |
| Financial risk and health | FR-13, FR-14 | `domain/ledger.ts` (`assessRisk`), `dashboard/HealthGauge.tsx` | `ledger.test.ts`, `dashboard.test.tsx` |
| Simulate decisions before taking them | FR-15, FR-17 | `domain/simulate.ts`, `simulator/Simulator.tsx` | `simulate.test.ts`, `views.test.tsx` |
| Understand the effect on balance, allowance, goals, forecast, risk, health | FR-16 | `simulator/ImpactTable.tsx` | `dashboard.test.tsx`, `views.test.tsx` |
| Monthly forecast | FR-12 | `domain/ledger.ts` (`buildForecast`), `dashboard/ForecastChart.tsx` | `ledger.test.ts`, `dashboard.test.tsx` |
| Visible, interconnected consequences | FR-20, FR-21 | `domain/insights.ts`, animated figures | `insights.test.ts`, `useAnimatedNumber.test.tsx` |
| Feels like a real consumer product | FR-22, FR-23, NFR-1, NFR-7, NFR-12 | Persistence, design system, loading states | `storage.test.ts`, `App.test.tsx`, `ui.test.tsx` |

## 6. Verification status

| Requirement | Evidence |
| --- | --- |
| NFR-1 | Lighthouse mobile, local preview: LCP 2.1 s, CLS 0, TBT 0 ms, performance 98 |
| NFR-2 | Build output: about 79 kB gzipped first load |
| NFR-3 to NFR-6 | Unit tests in `sanitize.test.ts`, `storage.test.ts`, `rateLimit.test.ts`; built `index.html` contains the CSP |
| NFR-7 | Lighthouse accessibility 100; axe-core on every view in tests. Not tested with a screen reader by a person |
| NFR-10 | Coverage report: about 98% statements |
| NFR-12 | Visually checked at 500 px and 1280 px; narrower widths rely on fluid layout and were not screenshotted |
