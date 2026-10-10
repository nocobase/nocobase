---
'@nocobase/app-client': major
'@nocobase/app-template-default': minor
'@nocobase/app-template-examples': minor
'@nocobase/create-plugin': minor
'@nocobase/app-skills': minor
'@nocobase/app-plugin-routes-example': minor
'@nocobase/app-plugin-authorization-example': minor
'@nocobase/app-plugin-file-example': minor
'@nocobase/app-plugin-jobs-example': minor
'@nocobase/app-plugin-lifecycle-example': minor
'@nocobase/app-plugin-mail-example': minor
'@nocobase/app-plugin-notification-example': minor
'@nocobase/app-plugin-office-flows-example': minor
'@nocobase/app-plugin-registry-example': minor
'@nocobase/app-plugin-repository-example': minor
'@nocobase/app-plugin-template-print-example': minor
'@nocobase/app-plugin-agents': minor
'@nocobase/app-plugin-api-keys': minor
'@nocobase/app-plugin-authentication': minor
'@nocobase/app-plugin-authorization': minor
'@nocobase/app-plugin-authz-default-access': minor
'@nocobase/app-plugin-authz-restriction-rules': minor
'@nocobase/app-plugin-authz-sharing-rules': minor
'@nocobase/app-plugin-database-explorer': minor
'@nocobase/app-plugin-file': minor
'@nocobase/app-plugin-i18n': minor
'@nocobase/app-plugin-knowledge': minor
'@nocobase/app-plugin-mail': minor
'@nocobase/app-plugin-notification-in-app': minor
'@nocobase/app-plugin-notification': minor
'@nocobase/app-plugin-projects': minor
'@nocobase/app-plugin-releases': minor
'@nocobase/app-plugin-scheduler': minor
'@nocobase/app-plugin-users': minor
'@nocobase/app-plugin-workflow': minor
'@nocobase/app-testing': patch
---

Remove the Settings and Dev route surfaces. `@nocobase/app-client` no longer exports `defineSettingsRoutes()`, `defineDevRoutes()`, `isAppClientSettingsRouteGroup()`, `isAppClientDevRouteGroup()` or their definition, contribution and registered-route types, and the resolved runtime no longer carries `settingsRouteTree`, `devRouteTree`, `settings`, `settingGroups`, `devRoutes` or `devRouteGroups`. `AppClientSettingsRouteNavigation` is renamed `AppClientRouteNavigation` and `AppClientSettingIcon` is renamed `AppClientRouteIcon`. A contribution to any parent other than `app` now fails registration with a message that names `defineAppRoutes()`. Plugins contribute no settings or dev pages; an application that wants a configuration page declares it with `defineAppRoutes()` in its own navigation, for example under a Settings group.

The default and examples templates drop the settings layout, the `/settings/*` route, the dev route plumbing, and the Settings and Inbox buttons in the header; the `/inbox` page and the inbox block stay. The examples template no longer registers `@nocobase/app-plugin-departments-example`, which is removed. Upgrading an application means removing `defineSettingsRoutes([])` from `client/routes.ts`, the `settingsRouteTree` and `devRouteTree` props passed to `AppRouter`, and any settings layout it kept, and moving its own settings pages to `defineAppRoutes()`. Every package that depends on or peers with `@nocobase/app-client` is released again so that its published range accepts `3.0.0-beta.0`.
