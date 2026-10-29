---
'@nocobase/app-plugin-agents': patch
---

Paginate runtime run history in groups of twenty with an explicit Load more action and a capped 20+ count. Align runtime status and quota badge sizes and spacing, and show quota hints in a warning color.

Adds a reversible index on runtime, start time and run id. Building the index during an upgrade scans existing run history and can briefly block run writes.
