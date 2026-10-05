---
'@nocobase/app-client': major
'@nocobase/app-plugin-ai-employee': major
'@nocobase/app-plugin-authentication': major
'@nocobase/app-plugin-hub': major
'@nocobase/app-plugin-users': major
'@nocobase/app-plugin-workflow': major
'@nocobase/app-server': major
'@nocobase/app-cli': patch
'@nocobase/app-host': patch
'@nocobase/app-plugin-api-keys': patch
'@nocobase/app-plugin-authorization': patch
'@nocobase/app-plugin-authorization-example': patch
'@nocobase/app-plugin-authz-default-access': patch
'@nocobase/app-plugin-authz-restriction-rules': patch
'@nocobase/app-plugin-authz-sharing-rules': patch
'@nocobase/app-plugin-database-example': patch
'@nocobase/app-plugin-database-explorer': patch
'@nocobase/app-plugin-departments-example': patch
'@nocobase/app-plugin-file': patch
'@nocobase/app-plugin-file-example': patch
'@nocobase/app-plugin-i18n': patch
'@nocobase/app-plugin-jobs-example': patch
'@nocobase/app-plugin-notification': patch
'@nocobase/app-plugin-notification-example': patch
'@nocobase/app-plugin-notification-in-app': patch
'@nocobase/app-plugin-notification-providers': patch
'@nocobase/app-plugin-queue-example': patch
'@nocobase/app-plugin-realtime-example': patch
'@nocobase/app-plugin-registry-example': patch
'@nocobase/app-plugin-repository-example': patch
'@nocobase/app-plugin-routes-example': patch
'@nocobase/app-plugin-scheduler': patch
'@nocobase/app-plugin-service-provider-example': patch
'@nocobase/app-plugin-skills-example': patch
'@nocobase/app-plugin-template-print-example': patch
'@nocobase/app-template-default': patch
'@nocobase/app-template-examples': patch
'@nocobase/app-template-hub': patch
'@nocobase/app-testing': patch
---

Move `@nocobase/app-server`, `@nocobase/app-client`, `@nocobase/app-plugin-authentication`, `@nocobase/app-plugin-users`, `@nocobase/app-plugin-hub`, `@nocobase/app-plugin-workflow` and `@nocobase/app-plugin-ai-employee` to the 2.0.0 prerelease line. The HTTP API migration released in 1.0.0-beta.N changed every route and the error body, but in prerelease mode a `major` changeset on a version that is already a `1.0.0` prerelease only increments the prerelease number, so nothing in the version said the change was breaking. These packages now release as `2.0.0-beta.0`, and every package that depends on or peers with one of them is released again so that its published range is `^2.0.0-beta.0` rather than a `^1.0.0-beta` range the new versions do not satisfy. An application upgrading to these versions upgrades all of them together.
