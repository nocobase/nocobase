---
'@nocobase/app-plugin-users': patch
'@nocobase/app-plugin-projects': patch
'@nocobase/app-plugin-notification': patch
---

Allow original inviters with user creation permission to explicitly generate a manual delivery link when email is unavailable. Recheck domain permissions, rotate the invitation and invalidate its old links and mailbox proofs. Manual acceptance creates an unverified email account and never bypasses authentication for an existing account. Ordinary invitation links continue to require mailbox verification.

Send invitation credentials through a transient notification service that never stores message bodies, recipients, provider diagnostics, or job payloads. Transient delivery is a single synchronous attempt without automatic retry or durable idempotency; failed or uncertain submissions are reported without echoing credentials. Existing notification history is not rewritten.

Bound invitation batches to five concurrent sends sharing a 30-second mail-delivery budget. Preserve per-recipient results when delivery is slow or another request closes or rotates a queued invitation; omit invalidated links and continue adding existing accounts to their projects. Record manual-delivery security events through the Projects endpoint as well.

Keep verification resend progress and success instructions visible when an invitee requests a fresh email from an expired verification link. Simplify invitation dialog state and transient delivery inputs, and consolidate the unreleased invitation schema additions into one migration.
