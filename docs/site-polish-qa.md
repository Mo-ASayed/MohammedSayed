# Site polish QA, 16 October 2026

The ten-commit improvement series begins at `8afd2d9`. Its first commit also
records the previously deployed Apricot integration and existing portfolio
updates, which were still uncommitted. Unrelated local writing drafts are excluded.

## Reproduced and fixed

- Hero social links and actions overlapped the absolute stats strip at desktop
  and mobile sizes. The hero now grows with its content.
- The story grid clipped copy at 768px. Flexible tracks and an earlier single
  column breakpoint keep text within its container.
- Mobile navigation hid destinations. All five are now available in a native
  disclosure menu with Escape handling and comfortable touch targets.
- Theme toggling threw when storage writes were denied. The visible preference
  now updates independently of persistence.
- Apricot's fixed sidebar hid its return link on short screens. It now scrolls.
- Apricot primary button contrast increased from 3.42:1 to 5.72:1.
- Replacing lesson markup lost keyboard focus. Transitions now focus main;
  stage selectors use ordinary buttons rather than incomplete ARIA tabs.

## Visual changes

More consistent heading sizes and section spacing; clearer project evidence and
repository actions; one existing outcome per career role; warm light and dark
Apricot treatments; larger workshop supporting text and controls. Project metadata
now declares its own canonical URL.

## Verification

Two independent QA agents audited production before the changes and retested the
local production build afterwards. Portfolio inspection covered widths 320, 390,
768, 1024 and 1440px, light/dark themes, blocked storage and keyboard navigation.
Workshop inspection covered short-screen scrolling, focus, six base games,
twelve mastery rounds and review persistence/reset. Both agents reported no
blocking regressions. Build, 15 unit checks and browser suites passed locally.

`tests/site-polish.mjs` checks actual content bounds, not only document overflow:
the original clipping bug was hidden by `overflow-x: clip`. CI runs these checks
alongside workshop flows and stores browser evidence for seven days.

This is a targeted browser and visual review, not a full accessibility audit.
