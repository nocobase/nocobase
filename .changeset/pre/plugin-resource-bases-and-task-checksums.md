---
'@nocobase/app-plugin-api-keys': patch
'@nocobase/app-plugin-authentication': patch
'@nocobase/app-plugin-authorization': patch
'@nocobase/app-plugin-database-example': patch
'@nocobase/app-plugin-database-explorer': patch
'@nocobase/app-plugin-file': patch
'@nocobase/app-plugin-file-example': patch
'@nocobase/app-plugin-i18n': patch
'@nocobase/app-plugin-notification': patch
'@nocobase/app-plugin-notification-in-app': patch
'@nocobase/app-plugin-notification-providers': patch
'@nocobase/app-plugin-queue-example': patch
'@nocobase/app-plugin-realtime-example': patch
'@nocobase/app-plugin-repository-example': patch
'@nocobase/app-plugin-routes-example': patch
'@nocobase/app-plugin-service-provider-example': patch
'@nocobase/app-plugin-skills-example': patch
'@nocobase/app-plugin-users': patch
'@nocobase/app-server': major
'@nocobase/app-template-default': patch
'@nocobase/app-template-examples': patch
'@nocobase/create-plugin': patch
'@nocobase/db': minor
'@nocobase/dev-config': minor
---

Require an explicit absolute baseDir for Server plugins and resolve migrations, seeds, jobs, and package metadata from the loaded plugin copy. Generate and validate database task manifests during builds so TypeScript and JavaScript share source checksums, with verified legacy JavaScript history conversion and synchronized plugin scaffolding and application templates.
