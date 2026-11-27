---
'@nocobase/app-skills': patch
'@nocobase/app-client': minor
'@nocobase/app-plugin-agents': minor
'@nocobase/app-plugin-mail': minor
'@nocobase/app-plugin-notification-in-app': minor
'@nocobase/app-testing': patch
'@nocobase/app-template-default': patch
'@nocobase/app-template-examples': patch
---

Applications can disable system settings, personal settings, chat, inbox and mail workspace routes independently. All five are enabled by default, so existing applications keep their pages when upgrading. Plugins can turn off their own pages with `{ disabled: true }` on `defineAppRoutes()` and the settings route helpers; disabled routes behave like `excludedRouteIds`, so overrides and header actions that target them no longer fail.
