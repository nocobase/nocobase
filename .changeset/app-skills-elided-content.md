---
'@nocobase/app-skills': patch
---

Guideline T1.11 requires a table cell that is too narrow for its content to end in an ellipsis and show the full content on hover, and only then. `table.md` gives the patterns: text, or a link such as the name column, in a `Tooltip` that stays closed when the value fits and leaves the link a link; a `Badge` or other styled content in a `Popover` that opens on hover, since a badge is unreadable on the inverted tooltip; `truncate` on a block element rather than on a flex one such as `Badge`; and no `line-clamp` in a cell, where text cannot wrap.
