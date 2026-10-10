---
'@nocobase/app-plugin-ai-employee': patch
'@nocobase/app-plugin-authentication': patch
'@nocobase/app-plugin-authorization': patch
'@nocobase/app-plugin-file': patch
'@nocobase/app-plugin-i18n': patch
'@nocobase/app-plugin-notification': patch
'@nocobase/app-plugin-notification-in-app': patch
'@nocobase/app-plugin-notification-providers': patch
'@nocobase/app-plugin-workflow': patch
'@nocobase/app-plugin-cli-example': patch
'@nocobase/app-plugin-database-example': patch
'@nocobase/app-plugin-file-example': patch
'@nocobase/app-plugin-queue-example': patch
'@nocobase/app-plugin-realtime-example': patch
'@nocobase/app-plugin-registry-example': patch
'@nocobase/app-plugin-repository-example': patch
'@nocobase/app-plugin-routes-example': patch
'@nocobase/app-plugin-service-provider-example': patch
'@nocobase/app-plugin-skills-example': patch
'@nocobase/create-plugin': patch
---

Declare each peer dependency once, dropping the devDependency that used to accompany it.

The pairing was required on the grounds that a peer range is wide enough for development to drift off this repository's copy. It is not: pnpm installs a peer and links it into the plugin's own `node_modules`, resolving `workspace:^` to the same package `workspace:*` would. A plugin with the devDependency removed still links, typechecks, builds, and tests against it — verified against a clean install with every plugin's `node_modules` deleted first.

What remained was a second declaration that changed nothing and had to be kept in step with the first. `pnpm peers:check` no longer asks for it, and `create-plugin` no longer emits it.
