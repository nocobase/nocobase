---
'@nocobase/app-plugin-agents': minor
'@nocobase/app-plugin-projects': minor
---

Preserve each run attempt's runtime, owner, tool version, requested model and reasoning effort, and expose primary-tool models reported during execution in run lists and details. Retain execution history when a retry releases its holder. Existing runs expose known usage models without inventing historical runtime snapshots.

Allow applications to attach execution snapshots to agent activity traces and return the originating run and attempt on comments. Applications must wire these facts into their run views, CLI projections and activity badges; installed UI Library component copies require an explicit update.
