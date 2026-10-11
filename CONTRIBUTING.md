# Contributing

Thanks for helping improve Broke But Functional. This guide covers setup, conventions and what a pull request needs before review.

## Setup

```bash
git clone https://github.com/Sagnik120/Broke-But-Functional.git
cd Broke-But-Functional
npm install
npm run dev
```

Requires Node.js 20 or newer. No environment variables are needed.

## Before you open a pull request

Run the full check. CI runs the same command.

```bash
npm run check
```

It runs, in order: typecheck, ESLint, Prettier check, all tests, and a production build. Fix formatting with `npm run format`.

## Where code goes

| You are adding                              | Put it in                                  | Rule                                                         |
| ------------------------------------------- | ------------------------------------------ | ------------------------------------------------------------ |
| A calculation or state transition           | `src/engine/`                              | Pure functions only. No React, no DOM. Add unit tests        |
| Parsing, formatting or another small helper | `src/utils/`                               | No dependencies on the engine or UI                          |
| Something that touches a browser API        | `src/services/`                            | Fail soft when the API is missing or blocked                 |
| A limit, label or preset                    | `src/constants/`                           | No magic numbers in components                               |
| Reusable behaviour                          | `src/hooks/`                               | One hook, one job                                            |
| A building block with no finance knowledge  | `src/components/ui/`                       | Must be accessible on its own                                |
| A dashboard, simulator or plans widget      | `src/components/<feature>/`                | Read state through `useFinance`; never store derived numbers |
| A new view                                  | `src/pages/` and `src/constants/routes.ts` | Lazy-load it in `App.tsx`                                    |

See [ARCHITECTURE.md](ARCHITECTURE.md) for the layering rules.

## Conventions

- **TypeScript:** strict mode. No `any`. Prefer discriminated unions to flags.
- **Imports:** use the `@/` alias for anything under `src/`.
- **Styling:** Tailwind utilities for layout and responsive behaviour; design-system classes from `src/styles/` for component visuals. Use tokens, never raw colour values, in components.
- **Responsive:** design mobile-first. Check 320, 390, 820 and 1440 px.
- **State:** `FinanceState` is the only stored data. If a number can be derived, derive it in `engine/ledger.ts`.
- **Input:** every user-supplied string goes through `utils/sanitize.ts`. Treat stored data as untrusted.
- **Comments:** explain why, not what. Exported functions and components get a one-line TSDoc comment.

## Accessibility checklist

- Every control is a native `button`, `input`, `select` or `a`, and has a visible label.
- The feature works with the keyboard alone, and focus is always visible.
- Meaning does not rely on colour. Charts and maps have a text alternative.
- New animation respects `prefers-reduced-motion` (the global rule in `styles/motion.css` handles CSS; JavaScript animation must check `prefersMotion()`).
- A view-level test runs axe-core against the new UI.

## Tests

- Engine changes need unit tests.
- UI changes need a test that drives the feature the way a user would, querying by role or label.
- Keep tests deterministic: inject clocks and randomness, use fake timers.

See [TESTING.md](TESTING.md).

## Commits and pull requests

- Use [Conventional Commits](https://www.conventionalcommits.org/): `feat:`, `fix:`, `docs:`, `refactor:`, `test:`, `chore:`.
- Keep a pull request to one change. Say what changed, why, and how you verified it.
- Add a line to [CHANGELOG.md](CHANGELOG.md) under "Unreleased".

## Reporting bugs and security issues

Open an issue with steps to reproduce, what you expected and what happened. For anything security-related, follow [SECURITY.md](SECURITY.md) instead of opening a public issue.

By contributing you agree to follow the [Code of Conduct](CODE_OF_CONDUCT.md) and to license your work under the [MIT License](LICENSE).
