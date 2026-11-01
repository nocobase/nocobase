---
name: Preserve legacy email construction without new arguments
description: Shared mailer adoption must keep standalone Auth, legacy Provider factories and hand-composed hosts working without caller migration.
type: feedback
modified: 2026-11-01
---

The owner confirmed that adding the shared mailer service must preserve old public calls, including `new Auth({ email, ... })`, old Provider factory contexts without `container`, and manually composed plugin Providers without the new token. Documenting a new required injection does not authorize a compatibility break. Test those calls without adding new fields in fixture helpers.

Keep transport creation and ownership in app-server's common service implementation. Compatibility scopes may supply the service automatically; connection-bound Auth instances share their parent's service and cannot close that scope. Drain complete invitation bookkeeping before database shutdown, and distinguish the bounded cancellation wait from original native work completion. Custom Auth callbacks retain their existing bounded shutdown contract.
