# Accessibility

Target: WCAG 2.2 level AA.

## Evidence

- Lighthouse accessibility score 100 on the production build (includes colour contrast).
- axe-core reports no violations on any of the four views or the high-risk dashboard state (run in the test suite).
- `eslint-plugin-jsx-a11y` recommended rules pass.
- Not yet done: manual testing with a screen reader by a person.

## Keyboard

| Element             | Keys                                                                                                                                                                                |
| ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Skip link           | First Tab stop; jumps to main content                                                                                                                                               |
| Tabs                | Tab enters the tab list on the selected tab; Left/Right move and activate (Up/Down too when the list is vertical on desktop); Home/End jump to first/last; Tab moves into the panel |
| Impulse slider      | Native range input: arrow keys, Page Up/Down, Home/End; its meaning is read from `aria-valuetext`                                                                                   |
| Theme toggle        | A toggle button with `aria-pressed`                                                                                                                                                 |
| Tab panel           | Focusable, so content with no controls can still be reached and scrolled                                                                                                            |
| Forms               | Native inputs, selects, checkbox and buttons; Enter submits                                                                                                                         |
| Destructive actions | Two-step confirm; focus moves to the confirm button; "Keep my data" cancels                                                                                                         |

Every interactive element is a native `button`, `input`, `select` or `a`. There are no click handlers on non-interactive elements and no keyboard traps.

## Structure and semantics

- Landmarks: `banner`, `navigation` ("Primary"), `main`, `contentinfo`. One `h1`; each card is a `section` labelled by its `h2`.
- Tabs follow the WAI-ARIA Authoring Practices pattern: `tablist`, `tab` with `aria-selected` and `aria-controls`, `tabpanel` with `aria-labelledby`, roving `tabindex`.
- Statistics use a description list; the impact comparison is a real table with a caption and row and column headers.
- Progress uses the native `progress` element with an accessible name.

## Forms

- Every control has a visible, programmatically associated label.
- Errors appear next to the field, are linked by `aria-describedby`, set `aria-invalid`, and are announced.
- Errors say what is wrong and how to fix it ("Use whole rupees only, like 450.").
- Hints are linked the same way.

## Announcements

- A polite live region announces the result of each action ("Expense added: Pizza night, ₹500.").
- A blocked (rate-limited) action raises an alert and its success message is suppressed.
- The simulator verdict is a status region.
- Lazy views show a busy state with "Loading view…".

## Non-text content

- The forecast chart has a title and a text description of today's balance, the month-end forecast and the shortfall day; the same text is visible as the caption.
- The health gauge has a label stating the score and grade.
- The month map has a full sentence per day for screen readers ("Day 4, spent ₹120, ₹130 in bills due.").
- Decorative graphics (logo, stamp, dots, arrows, emoji) are hidden from assistive technology.

## Colour and contrast

- Text colours were chosen for at least 4.5:1 on their backgrounds; input borders for at least 3:1.
- Meaning never relies on colour alone: risk has a text label and score, impact changes say "Better" or "Worse", payment status is written out.
- Focus is a 3 px ring with offset on every focusable element.
- `forced-colors` mode keeps card and button boundaries visible; `prefers-contrast: more` firms up borders.
- Light and dark themes both meet the contrast targets; axe-core runs in each.

## Motion

All animation and transition is removed under `prefers-reduced-motion: reduce`, including the JavaScript number count-up, which checks the same preference. No content flashes, and nothing moves for more than five seconds except loading indicators.

## Layout

Fluid grid with no fixed widths; no horizontal page scrolling; targets are at least 44 px high (36 px for compact row buttons, which have adequate spacing); text can be zoomed to 200%.
