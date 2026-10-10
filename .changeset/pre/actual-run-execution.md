---
'@nocobase/app-plugin-agents': minor
'@nocobase/app-plugin-projects': minor
'@nocobase/agent-runner': patch
---

Preserve each run attempt's runtime, owner, tool version, requested model and reasoning effort, and expose primary-tool models reported during execution in run lists and details. Retain execution history when a retry releases its holder. Existing runs expose known usage models without inventing historical runtime snapshots.

Allow applications to attach execution snapshots to agent activity traces and return the originating run and attempt on comments. Applications must wire these facts into their run views, CLI projections and activity badges; installed UI Library component copies require an explicit update.

Separate requested settings from tool-reported effort, retaining report provenance and change times. Codex reports resolved thread settings and explicitly marks per-turn overrides unreported when the tool returns no resolved value. Apply reader machine permissions to execution history and action sources, skip unchanged snapshot writes, and filter/deduplicate legacy model queries in the database. Custom application outputs must apply the provided machine projections, and projects hosts can supply the same rights through `Viewer.seesExecutionMachine`.
