---
'@nocobase/agent-runner': patch
---

Persist revoked runner registrations and stop serving them until successful registration. Add optional revocation details to status JSON, stop system services on authentication failure while preserving self-update restarts, bound rapid startup retries, and rotate daemon logs at 5 MiB with two backups. Manual updates explicitly restart installed services. Existing installations must run `nocobase-runner service install` with the new version to replace their old unconditional restart definitions; service definitions are not migrated automatically.
