---
"@nocobase/app-server": minor
"@nocobase/audit": minor
"@nocobase/secrets": patch
"@nocobase/app-template-default": patch
"@nocobase/app-template-examples": patch
"@nocobase/authorization": patch
"@nocobase/db": patch
"@nocobase/app-plugin-authentication": patch
"@nocobase/app-plugin-api-keys": patch
"@nocobase/app-plugin-authorization": patch
"@nocobase/app-plugin-authz-default-access": patch
"@nocobase/app-plugin-authz-restriction-rules": patch
"@nocobase/app-plugin-authz-sharing-rules": patch
"@nocobase/app-plugin-users": patch
"@nocobase/app-skills": patch
---

Configure audit capture for application operations and send events to multiple named destinations, including JSON Lines files. Configuring a destination enables explicitly declared audit operations by default. Audit uses the application authentication settings for its trusted proxies and forwarded IP headers.

The official templates assemble auditing with `AuditProvider` and ship the file driver. Custom application composition roots can add the provider and the audit configuration factory when they use audit routes or transports. Applications using only `@nocobase/app-server` can start without the audit package.
