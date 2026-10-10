---
'@nocobase/app-server': minor
'@nocobase/create-app': patch
'@nocobase/app-client': patch
'@nocobase/app-plugin-notification': minor
'@nocobase/app-plugin-workflow': minor
'@nocobase/app-plugin-hub': minor
'@nocobase/app-plugin-service-provider-example': patch
'@nocobase/app-template-default': patch
'@nocobase/app-template-examples': patch
'@nocobase/app-template-hub': patch
---

Provide editable TypeScript defaults for application modules, assembled by the runtime before services start. Module factories receive the runtime with application paths and plugin metadata; deployment files and environment variables override defaults, and configuration reload preserves code defaults.

Keep deployment settings in YAML examples and reserve explicit environment overrides for secrets and startup integration. Simplify application configuration loading, merging and reload subscriptions.

Align client configuration assembly with the server: runtime merges application TypeScript defaults beneath public configuration before services start. Client inspection reports the application configuration entry.
