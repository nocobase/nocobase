---
'@nocobase/app-plugin-agents': patch
---

Return only workspace totals from the runner list API and `runtime list`, and fetch directory diagnostics when opening a runner's details. Scripts reading `workspaceUsage.workspaces` from the list must use `runtime get` or the single-runner API instead. The CLI table now includes directory counts, unpushed counts and free disk bytes.
