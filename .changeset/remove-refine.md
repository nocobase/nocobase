---
'@nocobase/app-client': major
'@nocobase/i18n': major
'@nocobase/app-plugin-repository-example': major
'@nocobase/app-cli': patch
'@nocobase/app-plugin-agent-sessions': patch
'@nocobase/app-plugin-agents': patch
'@nocobase/app-plugin-api-keys': patch
'@nocobase/app-plugin-authentication': patch
'@nocobase/app-plugin-authorization': patch
'@nocobase/app-plugin-authorization-example': patch
'@nocobase/app-plugin-authz-default-access': patch
'@nocobase/app-plugin-authz-restriction-rules': patch
'@nocobase/app-plugin-authz-sharing-rules': patch
'@nocobase/app-plugin-database-explorer': patch
'@nocobase/app-plugin-file': patch
'@nocobase/app-plugin-file-example': patch
'@nocobase/app-plugin-i18n': patch
'@nocobase/app-plugin-jobs-example': patch
'@nocobase/app-plugin-knowledge': patch
'@nocobase/app-plugin-lifecycle-example': patch
'@nocobase/app-plugin-mail': patch
'@nocobase/app-plugin-mail-example': patch
'@nocobase/app-plugin-notification': patch
'@nocobase/app-plugin-notification-example': patch
'@nocobase/app-plugin-notification-in-app': patch
'@nocobase/app-plugin-notification-providers': patch
'@nocobase/app-plugin-office-flows-example': patch
'@nocobase/app-plugin-projects': patch
'@nocobase/app-plugin-registry-example': patch
'@nocobase/app-plugin-releases': patch
'@nocobase/app-plugin-routes-example': patch
'@nocobase/app-plugin-scheduler': patch
'@nocobase/app-plugin-template-print-example': patch
'@nocobase/app-plugin-users': patch
'@nocobase/app-server': patch
'@nocobase/app-skills': patch
'@nocobase/app-template-default': patch
'@nocobase/app-template-examples': patch
'@nocobase/app-testing': patch
'@nocobase/create-plugin': patch
'@nocobase/dev-config': patch
---

Remove Refine from the client runtime

The application shell no longer mounts Refine. `@nocobase/app-client` drops `app.refine`, `app.refineConfig`, `AppClientRefineConfig`, `AppClientRefineRegistry`, `AppClientRefineSetters`, `AppClientRefineSetterValue` and the provider-context methods `runWithProviderContext` and `runWithProviderContextAsync`, which existed only to attribute Refine settings to the provider that made them. Nothing in the repository read what was registered there: a title set through `app.refine.setOptions` never reached the page, and Refine resources never produced a menu entry.

Refine also created the TanStack Query cache that pages and plugins read through `useQueryClient()`. `ClientApplication` now owns it as `app.queryClient`, registers it under the new `queryClientToken`, and `AppClientProviders` provides it where Refine did, directly around the routes and inside every React provider, so pages keep reading it even under a provider that mounts a cache of its own; it keeps the defaults Refine gave it: no refetch when the window regains focus, and the previous data kept while a query's key changes. `app.shutdown()` clears it. `@tanstack/react-query` becomes a peer dependency of `@nocobase/app-client` and joins the identity-sensitive packages that plugins must declare as peers.

`@nocobase/i18n/client` drops `createRefineI18nProvider`, `CreateRefineI18nProviderOptions` and `RefineI18nProvider`. `@nocobase/app-plugin-repository-example` drops its Client ServiceProvider and the `./client/providers` export, which only registered Refine resources.

`nocobase build` builds the client with `vite build` instead of `refine build`, and `@nocobase/app-cli` no longer lists `@refinedev/cli` as an optional peer. The Default and Examples templates remove every `@refinedev/*` development dependency, and the React Vitest preset of `@nocobase/dev-config` no longer inlines `@refinedev/react-router`. The development and plugin Skills no longer mention Refine, and the upgrade Skill explains how an existing application removes its `this.app.refine` calls and Refine packages.
