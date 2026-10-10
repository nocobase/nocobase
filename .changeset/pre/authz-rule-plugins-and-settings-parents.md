---
'@nocobase/app-client': minor
'@nocobase/authorization': minor
'@nocobase/app-plugin-authorization': minor
'@nocobase/app-plugin-authz-default-access': minor
'@nocobase/app-plugin-authz-sharing-rules': minor
'@nocobase/app-plugin-authz-restriction-rules': minor
'@nocobase/app-template-default': patch
'@nocobase/app-template-examples': patch
---

Support entry-level parent references for settings routes contributed by different plugins. Preserve route ownership and localization while resolving nested groups independently of plugin order.

Split default access, sharing rules and restriction rules into application plugins that own management endpoints, stores, migrations and UI. Keep pure authorization rules and Store contracts in the authorization library and move permission-set management HTTP handlers to the application plugin. Update all application templates to explicitly compose the new plugins. The migration ownership change assumes a fresh installation.
