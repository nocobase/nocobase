---
'@nocobase/app-plugin-api-keys': patch
'@nocobase/app-template-default': minor
---

Add streamed, checksum-verified Hub release uploads, persistent upload and deployment retry identities, explicit upload-and-deploy requests, and App CLI upload/deploy commands. Reuse existing upload-release and deploy authorization actions and expose minimal deployment status for CI. Preserve historical releases during canonical checksum migration. Normalize permissions returned by the generic API key service.

Support optional runtime configuration files for deploy and upload-with-deploy, with bounded streaming transport, existing configuration reuse, and configuration-aware retry checks.

Reject upload-and-deploy requests that cannot return a publishing deployment, including CLI calls without waiting. Correct the unmerged publishing migration rollback.
