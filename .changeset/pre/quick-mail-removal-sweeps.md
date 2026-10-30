---
"@nocobase/app-plugin-mail": patch
---

Advance queued mailbox deletion through bounded, yielding sweeps so small mailboxes do not wait one relay interval per cleanup stage, while preserving per-batch leases, transactions and failure backoff.
