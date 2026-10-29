---
'@nocobase/app-plugin-agents': patch
---

Paginate runtime run history in groups of twenty with an explicit Load more action and a capped 20+ count. Align runtime status and quota badge sizes and spacing, and show quota hints in a warning color.

Adds a reversible index on runtime, start time and run id. Building the index during an upgrade scans existing run history and can briefly block run writes.

Show owned conversations by title with their native entry in runtime history. Hide other conversations behind a localized label without exposing their title or link, using current ownership.

Place the runtime history loading action below the table with the number of displayed runs, and keep dates on older runs readable.
