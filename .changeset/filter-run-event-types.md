---
"@nocobase/app-plugin-agents": minor
---

Add optional raw event type filtering to run event queries and the generated CLI. Apply filters before sequence pagination while preserving the default unfiltered history and existing access checks.

Add a reversible run/type/sequence index so following a sparse event type does not repeatedly scan unrelated events in long runs. Pagination cursors retain their existing meaning.
