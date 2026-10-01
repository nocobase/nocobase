---
'@nocobase/app-skills': patch
---

The NocoBase UI Library's `DataTable` lines up with a card by itself: inside a `CardContent` it drops its own frame, reaches the card's edges and pads its first and last cells with the card's spacing, so its text lines up with the card's title. A `CardContent` still given `px-0` keeps working. The frontend handbook builds a card's short list from `DataTable` too, with plain headers and no pagination, instead of a hand-written `Table`, and guideline T1 now says it applies to list pages while a list in a card follows T5.3.
