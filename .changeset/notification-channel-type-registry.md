---
'@nocobase/app-plugin-notification': minor
'@nocobase/app-server': minor
---

Add class-based notification channel registration with `registerChannelType`, per-channel lifecycle management, and container access. Accept `type` in channel configuration while preserving the `provider` alias and legacy extension factories. Keep send contracts and persisted delivery identities compatible, and drain active requests before closing channels. Support the same configuration aliases in the host mailer.
