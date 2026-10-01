---
'@nocobase/app-skills': patch
---

The frontend handbook says the worked example shows the rules, not the feature to build: take the rule an example illustrates, write the code from the current requirement, and decide again every value that belongs to the projects domain. `example.md` no longer tells an agent to copy each file a task depends on; only `session-expired-alert.tsx` and `use-url-search.ts`, which are shared infrastructure, are still copied unchanged. The acceptance review reports what the example left behind as a design mismatch: its projects names and copy keys, fields, columns, filters or actions the design does not declare, and example values that do not fit the feature's data.
