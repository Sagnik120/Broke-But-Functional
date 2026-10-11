# Changelog

All notable changes to this project are documented here. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project uses [Semantic Versioning](https://semver.org/).

## [Unreleased]

Nothing yet.

## [2.0.0] - 2026-10-11

### Added

- Responsive app shell: bottom tab bar on phones, floating dock on tablets, sticky sidebar on desktops, built from a single navigation element.
- Dark "night ledger" theme that follows the system and remembers the user's choice.
- Bento dashboard: one column on phones, six on tablets, twelve on desktops.
- Impulse check: a slider that recalculates allowance, forecast and health as it moves.
- Month map: a 30-day calendar heatmap with bills and shortfall days marked.
- Achievements: six badges derived from the ledger, including an on-pace streak.
- One-tap scenario presets in the simulator.
- Deep links: every view has a URL hash and the back button works.
- Offline support through a service worker, and an offline notice.
- Core Web Vitals field measurement with `web-vitals`.
- Icons (Lucide), an empty-state illustration, and a health "vibe" line.
- Tailwind CSS 4 for layout and responsive utilities, mapped to the design tokens.
- Container queries, print styles, and support for `prefers-contrast` and coarse pointers.
- Prettier, EditorConfig, coverage thresholds, and a format check in CI.
- `LICENSE`, `CONTRIBUTING.md`, `CODE_OF_CONDUCT.md`, `CHANGELOG.md`, design-system and user-guide documents, and README screenshots.

### Changed

- Source restructured into conventional folders: `engine`, `context`, `hooks`, `services`, `utils`, `constants`, `types`, `pages`, `components`, `assets`, `styles`.
- Imports use the `@/` alias.
- The dashboard is split into focused widgets.
- Vendor code is split into separate chunks with `manualChunks`.
- The simulator preview uses `useDeferredValue`.
- `ARCHITECTURE.md` and `TESTING.md` moved to the repository root.

### Fixed

- The forecast chart now exposes its description through `aria-describedby`.

## [1.1.0] - 2026-10-11

### Added

- "Pocket Ledger" design system: paper palette, serif headings, handwritten notes, ruled and dot-grid textures.
- Meaningful motion: count-up figures, highlighter sweep, chart draw-in, verdict stamp, day flip.
- Smart moves (simulator-backed suggestions) and spending by category.
- Rate limiting of state changes, oversized-payload and prototype-pollution guards.
- Loading shell, skeletons, font preload, web manifest.
- SRS, architecture, testing, accessibility and security documents; CI workflow.

## [1.0.0] - 2026-10-11

### Added

- Budget engine: balance, safe-to-spend, daily allowance, burn rate, 30-day forecast, risk and health scores.
- What-if simulator for six decision types with a before/after impact table and verdict.
- Activity log, savings goals, subscriptions and commitments.
- Input sanitising, validated local persistence, strict Content Security Policy.
- Accessible tabs, forms and live announcements; unit and component tests.

[Unreleased]: https://github.com/Sagnik120/Broke-But-Functional/compare/v2.0.0...HEAD
[2.0.0]: https://github.com/Sagnik120/Broke-But-Functional/releases/tag/v2.0.0
[1.1.0]: https://github.com/Sagnik120/Broke-But-Functional/releases/tag/v1.1.0
[1.0.0]: https://github.com/Sagnik120/Broke-But-Functional/releases/tag/v1.0.0
