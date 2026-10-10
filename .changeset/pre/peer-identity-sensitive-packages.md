---
'@nocobase/app-plugin-authentication': minor
'@nocobase/app-plugin-authorization': minor
'@nocobase/app-plugin-file': minor
'@nocobase/app-plugin-i18n': minor
'@nocobase/app-plugin-notification': minor
'@nocobase/app-plugin-notification-in-app': minor
'@nocobase/app-plugin-notification-providers': minor
'@nocobase/app-plugin-workflow': minor
'@nocobase/app-plugin-database-example': minor
'@nocobase/app-plugin-queue-example': minor
'@nocobase/app-plugin-realtime-example': minor
'@nocobase/app-plugin-routes-example': minor
'@nocobase/app-plugin-service-provider-example': minor
'@nocobase/app-plugin-skills-example': minor
'@nocobase/create-plugin': minor
---

Declare identity-sensitive runtime packages as peer dependencies of every plugin.

A plugin used to list `@nocobase/app-server`, `@nocobase/db`, `@nocobase/service-provider`, `@nocobase/i18n`, `@nocobase/queue`, `@nocobase/app-portal-sdk`, and the plugins it builds on among its `dependencies`. Each of these carries state that only works while exactly one copy of the module exists in the process: `ServiceContainer` keys its bindings by the token object itself, React contexts match only the provider created from the same module, and `@nocobase/queue` registers job classes into a global `Locator`. A `dependencies` range lets a package manager install a second copy to satisfy it, which splits that state.

The monorepo could never show the problem, because `workspace:` links every consumer to one directory. It appears once a plugin is installed from a registry into an application, and it appears at runtime rather than at install time: a service that is registered reports `Service "..." is not registered`, or a context reads `undefined` under a mounted provider.

Each of these packages is now a peer dependency paired with a devDependency. The peer is the published contract that makes the installing application provide the single copy; the devDependency pins this repository's copy for development and tests, which the deliberately wide peer range does not. Applications built from the templates are unaffected — they already install every one of these packages directly, which is what satisfies the new peer ranges.

`pnpm plugin:create` generates the same shape, and `pnpm peers:check` enforces it in CI.
