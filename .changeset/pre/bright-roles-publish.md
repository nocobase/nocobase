---
'@nocobase/authorization': patch
'@nocobase/app-client': patch
'@nocobase/app-plugin-authorization': patch
'@nocobase/app-template-default': patch
---

Introduce the plugin-based authorization core and permission management UI. Replace the previous authorization API with composable core, database, permission-set, default-access, sharing-rule, restriction-rule, and page plugins; add route access metadata to the application client; publish and enable the authorization app plugin in the default template; and correct the Hub documentation to use the v3 Portal SDK package name.
