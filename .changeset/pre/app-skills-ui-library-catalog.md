---
'@nocobase/app-skills': patch
---

`nocobase-app-development` ships the NocoBase UI Library catalog, `references/frontend/references/ui-library.md`, generated from `ui-library/registry` by `scripts/gen-ui-library-catalog.mjs`: every item with its kind, install command and location, description, plugin dependencies and its `@nocobase/<item>-demo` example, including the agents items (`agent-chat`, `agent-composer`, `agent-picker`, `agent-queue`, `agent-run-history`), the projects items (`project-detail`, `issue-detail`, `issue-table`, `issue-card`, `plan-card`) and the inbox. Agents look an item up live first and read this list when the registry cannot be reached.
