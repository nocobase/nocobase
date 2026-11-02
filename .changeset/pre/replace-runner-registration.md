---
'@nocobase/app-plugin-agents': patch
---

Revoke all prior runner registrations and keys when the same owner registers the same name and host again, without a registration lock or new table. Simultaneous registrations may temporarily leave multiple active records, which the next registration revokes. Add a paginated runtime token list that exposes only usable token metadata within the caller's permissions, provide executable revoke/delete guidance, and require an explicit server for runner installation before any files are installed.
