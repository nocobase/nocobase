---
'@nocobase/logging': patch
'@nocobase/agent-protocol': minor
'@nocobase/agent-runner': minor
'@nocobase/app-cli-client': minor
'@nocobase/app-client': patch
'@nocobase/app-plugin-agents': minor
'@nocobase/app-plugin-projects': patch
'@nocobase/app-plugin-knowledge': patch
'@nocobase/app-plugin-releases': patch
'@nocobase/app-plugin-agent-sessions': patch
---

Collect bounded, sanitized runner diagnostics through heartbeat requests, retain UTC-dated runner journals with configurable cleanup, merge downloaded archives into local timelines, and propagate request IDs to application error toasts.

Apply one credential-key rule in structured and text logs, hiding numeric credentials while preserving token-count field names.

Stream runner diagnostics one temporary file at a time with abort cleanup, per-runner export queues, progress and file-consumption callbacks. Intersect up to 500 selected runs with the requested dates, remove selected-run priority and file-count preferences, and provide `logs export` plus local `logs timeline` commands.
