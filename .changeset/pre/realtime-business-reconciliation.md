---
"@nocobase/app-client": minor
"@nocobase/app-plugin-mail": patch
"@nocobase/app-plugin-knowledge": minor
"@nocobase/app-plugin-projects": patch
"@nocobase/app-plugin-agents": patch
"@nocobase/app-plugin-agent-sessions": patch
"@nocobase/app-plugin-office-flows-example": minor
"@nocobase/app-testing": patch
---

Make mail synchronization and office workflow views refresh from committed state notifications, including empty sync results, failures, cancellation and lifecycle transitions. Add optional periodic reconciliation to the shared refresh scheduler, pause hidden views, and retain one-minute reconciliation for transient announcements and out-of-band changes. Reduce existing task, run, session and chat fallback reads to one minute while retaining time-based computer status checks, external indexing status reads, deployment health probes and bounded initialization waits.

Announce knowledge rechunking start and completion even when no chunks change, and support optional committed status notifications from external indexers. Continue tracking pending index work when some sections have already failed.

Preserve application providers when `renderWithApp` rerenders its page. Exercise mail refresh through real application services and fix the mail account navigation translation key exposed by those checks.
