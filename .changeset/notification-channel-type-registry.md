---
'@nocobase/app-plugin-notification': minor
'@nocobase/app-server': minor
---

Add class-based notification channel registration with `registerChannelType`, per-channel lifecycle management, and container access. Accept `type` in channel configuration while preserving the `provider` alias and legacy extension factories. Keep the provider-based `NotificationChannelConfig` and legacy callback types compatible, and expose `NotificationChannelConfigInput` for configuration accepting either discriminator. Mark legacy registration methods and definition types as deprecated with migration guidance. Keep send contracts and persisted delivery identities compatible, including custom type names matching JavaScript prototype properties, and drain active requests before closing channels. Support the same configuration aliases in the host mailer.
