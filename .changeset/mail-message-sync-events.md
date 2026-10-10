---
'@nocobase/app-plugin-mail': minor
---

Add Server-only subscriptions for committed synchronization inserts and persistent account-level event-log reads with local-time positioning and stable incremental checkpoints. Keep existing Mail synchronization, sending and frontend invalidation semantics unchanged; listener failures do not retry committed synchronization.

Apply the new Mail database migration before starting synchronization after upgrading. Existing messages are not automatically backfilled into the event log: integrations needing pre-upgrade history must perform an explicit idempotent backfill. Notifications are best effort within one process, with durable incremental compensation rather than exactly-once business delivery. Event logs have no automatic expiry and are removed when their account is finally deleted.

Cross-dialect validation also hardens legacy localized-draft attachment lookup: external Provider part IDs are no longer compared with a native UUID upload column. Database test fixtures now use valid deterministic UUIDs on every dialect.

This release also edits the released `202609030001_create_mail_tables` migration because its outbound-attachment and push-subscription unique indexes have never succeeded on MySQL with utf8mb4 and prevent every later migration from running. Limit the generated storage-key column to 668 characters and the Provider push-subscription identifier to 413 characters so both existing composite unique indexes fit MySQL's 3072-byte limit without prefixing or weakening uniqueness. Existing installations that already applied this migration should expect a checksum warning on the next `nocobase db apply` and clear it with `nocobase db repair`; repair updates the recorded checksum and does not shrink their existing columns or remove attachment data.
