---
'@nocobase/app-plugin-projects': patch
---

Limit comment positioning to the nearest vertical content scroller and expose the same positioning helper for task summaries and selected rows. Preserve horizontal scrolling and once-per-target comment navigation.

Positioning requires content inside a vertically overflowing `overflow-y: auto` or `scroll` container. When none exists the helper returns false without scrolling the document. Horizontal-only containers are skipped; callers can request smooth positioning.
