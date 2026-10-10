---
'@nocobase/config': minor
'@nocobase/app-server': minor
'@nocobase/app-client': minor
'@nocobase/app-plugin-authentication': minor
'@nocobase/create-app': patch
'@nocobase/app-template-default': patch
'@nocobase/app-template-examples': patch
---

Support TypeScript authentication options in application templates and use the native authentication client. Keep authentication plugins and callbacks in editable server and client configuration, with YAML as the default format for deployment settings.

Runtime assembly now prepares complete configuration before application creation. Module configuration factories use defineAppConfig and defaultAppConfigs, receive the runtime once, and retain their defaults when environment configuration reloads.
