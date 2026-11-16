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
