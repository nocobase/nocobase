---
"@nocobase/app-client": minor
"@nocobase/app-plugin-projects": patch
"@nocobase/app-plugin-knowledge": patch
"@nocobase/app-plugin-agents": patch
"@nocobase/app-plugin-agent-sessions": patch
"@nocobase/app-plugin-notification-in-app": patch
"@nocobase/app-skills": patch
---

Add `refreshRealtimeQueries` to refresh active TanStack Query snapshots after pre-event requests settle, including initial loads, prefixes and predicates. Keep inactive snapshots invalid, expose refresh failures, and stop queued follow-ups when their owner is disposed. The application client now declares its TanStack Query peer contract.

Use the shared catch-up behavior in Projects, Knowledge, Agents, Agent Sessions and the inbox. Refresh additional inbox topics after subscription readiness and preserve refresh promises so concurrent events coalesce correctly. Update application guidance to avoid reusing stale in-flight responses.
