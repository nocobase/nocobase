---
'@nocobase/app-plugin-mail': minor
---

Add Server-only subscriptions for committed synchronization inserts and persistent account-level event-log reads with local-time positioning and stable incremental checkpoints. Keep existing Mail synchronization, sending and frontend invalidation semantics unchanged; listener failures do not retry committed synchronization.

Apply the new Mail database migration before starting synchronization after upgrading. Existing messages are not automatically backfilled into the event log: integrations needing pre-upgrade history must perform an explicit idempotent backfill. Notifications are best effort within one process, with durable incremental compensation rather than exactly-once business delivery. Event logs have no automatic expiry and are removed when their account is finally deleted.

Cross-dialect validation also hardens legacy localized-draft attachment lookup: external Provider part IDs are no longer compared with a native UUID upload column. Database test fixtures now use valid deterministic UUIDs on every dialect.

