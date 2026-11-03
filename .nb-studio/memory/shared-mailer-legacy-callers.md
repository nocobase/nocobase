---
name: Preserve legacy email construction without new arguments
description: Mailer adoption must keep standalone Auth, legacy Provider factories and hand-composed hosts working without caller migration, with one owner per sender.
type: feedback
modified: 2026-11-02
---

The owner confirmed that adopting application mailers must preserve old business and configuration calls, including `new Auth({ email, ... })`, old Provider factory contexts without `container`, and manually composed plugin Providers without the factory token. Documenting a new required injection does not authorize a compatibility break. Test those calls without adding new fields in fixture helpers. This does not preserve the deprecated host mailer TypeScript module: the owner later explicitly authorized its removal as a breaking API change, while keeping legacy YAML and environment mappings compatible.

The owner later rejected a shared application mailer with leases, reference counts and global shutdown coordination: app-server keeps only the configuration snapshot and `MailSenderFactory`; each consumer creates an exclusive sender at its assembly boundary and the creator closes it after stopping its own work. Compatibility is per entry point (a standalone Auth owns what it creates, connection-bound Auth borrows, injected senders stay with the caller), not a reason to share instances. Drain complete invitation bookkeeping before database shutdown, and distinguish the bounded cancellation wait from original native work completion. Custom Auth callbacks retain their existing bounded shutdown contract.
