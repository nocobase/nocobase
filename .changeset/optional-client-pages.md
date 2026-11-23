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

Applications opt into system and personal settings with `systemSettingsRoutes` and `personalSettingsRoutes` in the client runtime. Enable `agents({ chatRoutes: true })`, `notificationInApp({ inboxRoute: true })` and `mail({ workspaceRoutes: true })` to register the built-in business pages. Existing applications using those pages should enable the corresponding options when upgrading. Both templates enable all five options.
