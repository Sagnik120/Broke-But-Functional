# Design system: Pocket Ledger

A paper notebook for your money. Cream pages by day, a "night ledger" after dark, navy ink, one ballpoint-blue accent, a marigold highlighter and a coral margin line.

## Principles

1. **One number first.** Each screen leads with the figure that answers the user's question.
2. **Consequences are visible.** When something changes, the figures that depend on it move.
3. **Calm, not jumpy.** Money UI uses short, purposeful motion.
4. **Never colour alone.** Every status also has words.

## Tokens

All tokens are CSS custom properties in `src/styles/tokens.css`. They are redefined for the dark theme and exposed to Tailwind through `@theme` in `src/styles/index.css`, so `bg-paper`, `text-ink-2`, `border-line` and `font-display` are real utilities.

| Group     | Tokens                                                                                 | Use                                         |
| --------- | -------------------------------------------------------------------------------------- | ------------------------------------------- |
| Paper     | `--paper`, `--paper-2`, `--paper-3`, `--surface`                                       | Page, subtle fills, tracks, cards           |
| Ink       | `--ink`, `--ink-2`, `--ink-3`                                                          | Primary, secondary and tertiary text        |
| Lines     | `--line`, `--line-2`, `--rule`, `--margin`                                             | Borders, ruled paper, the margin line       |
| Accent    | `--pen`, `--pen-strong`, `--pen-50`, `--pen-100`, `--on-pen`                           | Actions, links, active states               |
| Highlight | `--marker`, `--marker-50`                                                              | The key figure, earned badges               |
| Status    | `--good`, `--warn`, `--bad` and their `-bg` pairs                                      | Risk, verdicts, validation                  |
| Shape     | `--r-card` (22px), `--r-md` (16px), `--r-sm` (12px)                                    | Cards, tiles, controls                      |
| Depth     | `--elev-soft`, `--elev-lift`, `--elev-press`                                           | Resting, raised and pressed surfaces        |
| Motion    | `--fast` (150ms), `--medium` (300ms), `--slow` (700ms), `--ease-soft`, `--ease-spring` | Feedback, arrivals, drawing                 |
| Type      | `--ff-display`, `--ff-sans`, `--ff-hand`                                               | Headings, UI and figures, handwritten notes |

Text colours pass WCAG AA on their backgrounds in both themes.

## Typography

| Role             | Face             | Notes                                                          |
| ---------------- | ---------------- | -------------------------------------------------------------- |
| Headings         | Instrument Serif | Card and section titles                                        |
| UI and figures   | Figtree          | Figures use the sans face because its numerals are unambiguous |
| Handwritten note | Kalam            | Margin notes, the verdict stamp, the health label              |

The hero figure scales fluidly with `clamp()`. Figures use tabular numerals so they do not jitter while counting.

## Breakpoints

Mobile-first. The same values are used in CSS media queries and Tailwind utilities.

| Name | Min width | What changes                                         |
| ---- | --------- | ---------------------------------------------------- |
| base | 0         | Single column; top bar; fixed bottom tab bar         |
| xs   | 480 px    | Larger tab labels                                    |
| sm   | 640 px    | Roomier padding; three-column stats; tagline appears |
| md   | 768 px    | Six-column bento grid; floating dock                 |
| lg   | 1024 px   | Sticky sidebar with vertical navigation              |
| xl   | 1280 px   | Twelve-column bento grid; wider sidebar              |
| 2xl  | 1536 px   | Wider content column                                 |

Container queries (`.cq`) let the impulse check and month map respond to their own width. Other queries handle landscape phones, coarse pointers, hover capability, high contrast, reduced motion, forced colours and print.

## Components

| Component      | File                                 | Notes                                                  |
| -------------- | ------------------------------------ | ------------------------------------------------------ |
| Button         | `.button` in `styles/components.css` | Primary, ghost, small and danger; 44 px minimum height |
| Field          | `components/ui/Field.tsx`            | Label, hint and error wired with `aria-describedby`    |
| Tabs           | `components/ui/Tabs.tsx`             | WAI-ARIA tabs, roving tabindex, horizontal or vertical |
| Badge          | `components/ui/Badge.tsx`            | Status pill; text carries the meaning                  |
| ProgressBar    | `components/ui/ProgressBar.tsx`      | Native `progress` element                              |
| ConfirmButton  | `components/ui/ConfirmButton.tsx`    | Two-step destructive action                            |
| AnimatedNumber | `components/ui/AnimatedNumber.tsx`   | Counts between values; instant under reduced motion    |
| EmptyState     | `components/ui/EmptyState.tsx`       | Illustration and message                               |
| PanelSkeleton  | `components/ui/PanelSkeleton.tsx`    | Loading placeholder for lazy views                     |
| Card           | `.card`                              | Surface for every widget                               |
| Chip           | `.chip`                              | Scenario presets                                       |
| Slider         | `.slider`                            | Native range input with a custom track and thumb       |

## Textures

- `.ruled`: ruled notebook paper with a coral margin line (the hero card).
- `.dotted`: dot-grid graph paper (behind the forecast chart).
- `.highlight`: a marigold highlighter stroke behind the key figure.

## Motion

Each animation explains a change. See the table in the [README](../README.md#design-system-and-motion). Rules:

- Balance and figure updates take about 300 ms; button feedback about 150 ms.
- Only transform, opacity and paint-only properties animate, so layout never shifts.
- Everything stops under `prefers-reduced-motion`.

## Voice

Plain and a little playful. Errors say what is wrong and how to fix it. Health grades have a one-line mood ("Main character energy.", "Ramen week incoming.").
