---
name: Preserve legacy Auth construction and inject named senders
description: Keep no-sender Auth and Provider composition working; independent callers create and inject named senders, with one owner per sender.
type: feedback
modified: 2026-11-05
---

Preserve the existing `new Auth({ email, ... })` no-sender behavior and Provider composition without requiring callers to add a Factory argument. For a named application mailer, the application Provider or an independent caller creates the sender at its assembly boundary and injects the send-only view into Auth. Auth does not accept a `MailSenderFactory` through `PasswordResetServices`, or revalidate an injected sender. Keep explicit-reference validation in `defineAuthConfig` and `MailSenderFactory.create()`. A direct Auth caller that creates a named sender keeps its `MailSender` handle and closes it after stopping Auth. This does not preserve the deprecated host mailer TypeScript module: the owner explicitly authorized its removal as a breaking API change while keeping legacy YAML and environment mappings compatible.

The owner rejected a shared application mailer with leases, reference counts and global shutdown coordination: app-server keeps only the configuration snapshot and `MailSenderFactory`; each consumer creates an exclusive sender at its assembly boundary and the creator closes it after stopping its own work. Legacy standalone Auth still owns a sender only when it creates one through its existing no-sender path; injected senders stay with their caller. Connection-bound Auth borrows the existing owner’s sender. Drain complete invitation bookkeeping before database shutdown, and distinguish the bounded cancellation wait from original native work completion. Custom Auth callbacks retain their existing bounded shutdown contract.
