---
'@nocobase/app-plugin-agents': patch
'@nocobase/app-server': patch
'@nocobase/app-cli-client': patch
---

Explain run action refusals with the required permission, authenticated run identity, and evidence-based denial reason. Carry optional evidence through CLI manifests and JSON failures while preserving existing status, reason, action and manifest compatibility. Report unknown causes neutrally and guide agents and project managers to request authorization before continuing, without bypassing restrictions.

For intake reads, distinguish missing identity grants and agent configuration from read-only restrictions. Put the complete authorization summary before the blocked notification truncation boundary.
