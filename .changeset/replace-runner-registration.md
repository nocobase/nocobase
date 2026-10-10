---
'@nocobase/app-plugin-agents': patch
---

Revoke prior runner registrations and keys when the same owner registers the same name and host again, including concurrent registrations. Add a paginated runtime token list that exposes only usable token metadata within the caller's permissions, provide executable revoke/delete guidance, and require an explicit server for runner installation before any files are installed.
