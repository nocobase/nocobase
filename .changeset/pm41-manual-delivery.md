---
'@nocobase/app-plugin-users': patch
'@nocobase/app-plugin-projects': patch
'@nocobase/app-plugin-notification': patch
---

Allow original inviters with user creation permission to explicitly generate a manual delivery link when email is unavailable. Recheck domain permissions, rotate the invitation and invalidate its old links and mailbox proofs. Manual acceptance creates an unverified email account and never bypasses authentication for an existing account. Ordinary invitation links continue to require mailbox verification.

Send invitation credentials through a transient notification service that never stores message bodies, recipients, provider diagnostics, or job payloads. Transient delivery is a single synchronous attempt without automatic retry or durable idempotency; failed or uncertain submissions are reported without echoing credentials. Existing notification history is not rewritten.

Bound invitation batches to five concurrent sends sharing a 30-second mail-delivery budget. Return all invitation links when delivery is slow or uncertain, and record manual-delivery security events through the Projects endpoint as well.
