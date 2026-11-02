---
'@nocobase/app-plugin-agents': minor
---

Allow workflow Run agent rules to start a fresh session on every stage entry while preserving working directories and other agents' sessions. Preserve the choice across queued run merges, confirmation requests and retries, and expose it in run responses.

New software development workflows enable fresh sessions for proposal review and code review. Existing workflows are unchanged: workflow owners can enable “Start a new session every time” in the rule editor. The agents database migration adds `freshSession` columns to runs and run requests with a default of false; no existing workflow configuration is migrated.
