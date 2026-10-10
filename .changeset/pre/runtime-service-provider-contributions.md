---
'@nocobase/app-server': minor
'@nocobase/app-template-default': patch
'@nocobase/app-plugin-authentication': patch
'@nocobase/app-plugin-authorization': patch
'@nocobase/app-plugin-file': patch
'@nocobase/app-plugin-i18n': patch
'@nocobase/app-plugin-notification-in-app': patch
'@nocobase/app-plugin-notification-providers': patch
'@nocobase/app-plugin-notification': patch
'@nocobase/app-plugin-realtime-example': patch
'@nocobase/app-plugin-routes-example': patch
'@nocobase/app-plugin-service-provider-example': patch
'@nocobase/app-plugin-skills-example': patch
---

Unify Client and Server application composition around the explicit `serviceProviders` contribution and rename Client React tree contributions to `reactProviders`.

Replace Client bootstrap modules with application-owned ServiceProvider lifecycle hooks, make the default Client start through `ClientApplication` and render through the Browser host, and update built-in plugins and runtime inspection to the new static contribution protocol.
