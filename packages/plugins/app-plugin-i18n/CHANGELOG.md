# @nocobase/app-plugin-i18n

## 1.0.0-beta.13

### Patch Changes

- e123790: Move `@nocobase/app-server`, `@nocobase/app-client`, `@nocobase/app-plugin-authentication`, `@nocobase/app-plugin-users`, `@nocobase/app-plugin-hub`, `@nocobase/app-plugin-workflow` and `@nocobase/app-plugin-ai-employee` to the 2.0.0 prerelease line. The HTTP API migration released in 1.0.0-beta.N changed every route and the error body, but in prerelease mode a `major` changeset on a version that is already a `1.0.0` prerelease only increments the prerelease number, so nothing in the version said the change was breaking. These packages now release as `2.0.0-beta.0`, and every package that depends on or peers with one of them is released again so that its published range is `^2.0.0-beta.0` rather than a `^1.0.0-beta` range the new versions do not satisfy. An application upgrading to these versions upgrades all of them together.
- Updated dependencies [e123790]
  - @nocobase/app-client@2.0.0-beta.0
  - @nocobase/app-server@2.0.0-beta.0

## 1.0.0-beta.12

### Major Changes

- 21d274c: Workflow, scheduler, i18n and notification routes follow the HTTP API specification: every success is `{ data }` (lists `{ data, meta }`), every failure is the standard error body, and every input is validated, with unknown JSON body fields rejected as 400 `INVALID_INPUT`.

  **Workflow** (domain `workflows`). Runs move under the workflow namespace: `/api/workflow-runs` -> `/api/workflows/runs`, `/api/workflow-runs/{id}` -> `/api/workflows/runs/{runId}`, `/api/workflow-runs/{id}/node-runs[/{nodeRunId}/payload]` -> `/api/workflows/runs/{runId}/nodeRuns[/{nodeRunId}/payload]`. Source previews move from `/api/workflows/by-key/{key}/source[/revisions]` to `/api/workflows/sources/{key}[/revisions]`. `PATCH /api/workflows/{id}/status` is removed (use `POST .../enable` and `.../disable`), and `GET /api/workflows/{id}/runs` is removed (use `GET /api/workflows/runs?workflowId=`). Revision and node-run lists answer `{ data, meta: { page, pageSize, total } }`. `POST /api/workflows/{id}/run` requires `{ input }` and validates the `Event-Key` header; `PUT /api/workflows/{id}/parameters` requires `{ parameterValues }`. A workflow, source, run or node run named by the path that does not exist is 404 (was 400); permission denial is 403 `WORKFLOW_MANAGEMENT_REQUIRED`; an unconfigured service is 503 `WORKFLOW_SERVICE_NOT_CONFIGURED`. Invocation codes are kept as reasons: `WORKFLOW_NOT_FOUND` is 404, `WORKFLOW_DISABLED`, `PARENT_RUN_NOT_FOUND` and `STACK_LIMIT_EXCEEDED` are `FAILED_PRECONDITION`, `INVALID_INPUT` is `INVALID_ARGUMENT` with field violations, and `INPUT_TOO_LARGE` answers 413. Translated text is in `localizedMessage`.

  **Scheduler** (domain `scheduler`). `/api/schedules` -> `/api/scheduler/schedules`, paged by `page` and `pageSize` with `meta: { page, pageSize, total }`. New `GET /api/scheduler/schedules/{scheduleId}`. `GET /api/scheduler/schedules/{scheduleId}/occurrences` is cursor-paged by `pageSize` and `pageToken` with `meta: { nextPageToken }`, replacing the fixed latest-100 list. `POST .../enable` and `.../disable` keep their shape under the new prefix. A caller without access gets 403 `SCHEDULE_ACCESS_REQUIRED` (was `{ error: 'Schedule access is required.' }`), and an unknown schedule id gets 404 `SCHEDULE_NOT_FOUND` (was 500, or an empty occurrence list).

  **i18n** (domain `i18n`). `GET /api/i18n/locales` answers `{ data: { defaultLocale, locales } }`. `POST /api/i18n/locale` -> `PUT /api/i18n/locale`, answering `{ data: { locale, requestedLocale, fallback } }`; an unsupported language still falls back to English successfully. A missing or invalid `locale` is 400 `INVALID_INPUT` with a field violation (was `{ error: 'A locale is required.' }`), in the standard error body even when the router is mounted on its own.

  **Notification** (domain `notifications`). `GET /api/notifications/logs` is cursor-paged (`pageSize`, `pageToken`) and answers `{ data, meta: { nextPageToken } }`; `/api/notifications/logs/:id` is `/api/notifications/logs/{logId}`. `GET /api/notifications/test/targets` -> `GET /api/notifications/testTargets`, `POST /api/notifications/test/send` -> `POST /api/notifications/testSends` (strict `{ channel, values }`, 202), `GET /api/notifications/test/{id}/status` -> `GET /api/notifications/testSends/{testSendId}`. The `{ error: { code, message, ns, key, params } }` body is gone: `reason` carries the former code, `localizedMessage` the translated text and `metadata` its parameters; invalid test fields report `fieldViolations`, and `NOTIFICATION_TEST_FAILED` is 503 `UNAVAILABLE` only when the Channel's transport cannot be reached (the new exported `NotificationTransportUnavailableError`); any other failure of a test send is no longer reported as `NOTIFICATION_TEST_FAILED`. `GET /api/notifications/testTargets` answers `{ data, meta: { total } }`. `NotificationTestApiError` exposes `reason` instead of `code`, `ns`, `key` and `params`, and `NotificationStore.listLogs()` accepts an optional cursor.

  **In-app notification** (domain `notificationInApp`). The inbox moves from `/api/notifications/in-app` to `/api/notificationInApp`: `GET /messages` (`pageSize`, `pageToken`, `unreadOnly` -> `{ data, meta: { nextPageToken } }`, replacing `limit`, `cursor` and `nextCursor`), `GET /messages/unreadCount` -> `{ data: { count } }`, `POST /messages/markAllRead` (was `/read-all`), `POST /messages/{messageId}/markRead` and `/markUnread` and `DELETE /messages/{messageId}` (204), replacing `POST /:id { action }`. Every inbox route runs behind the authentication plugin's `auth.required()` and reads the user only from the Better Auth session: it no longer falls back to, or writes, a `userId` in the NocoBase session, so an inbox request after sign-out or without a session is 401 `UNAUTHENTICATED` with reason `AUTHENTICATION_REQUIRED` in the `authentication` domain. `createInAppRouter(store, options)` requires `options.authenticate`, a middleware that sets `auth`, and `resolveUserId` and `InAppUserIdResolver` are removed. An anonymous request reaching `createInAppRouter` without `auth` is 401 `UNAUTHENTICATED` with reason `IN_APP_NOTIFICATION_AUTHENTICATION_REQUIRED`, `IN_APP_NOTIFICATION_INVALID_CURSOR` is now `IN_APP_NOTIFICATION_INVALID_PAGE_TOKEN`, and the limit, body and action errors are gone. The client helpers take `pageSize` and `pageToken`, return `nextPageToken`, and `mutateInboxItem` deletes with `DELETE`.

  The application templates' tests follow the new locale and inbox response shapes.

### Patch Changes

- 0b933b3: The user management routes under `/api/users`, every authorization route under `/api/authorization` (the permission snapshot, Permission Sets, the inspector, and the default-access, sharing-rule and restriction-rule settings) and `GET /api/i18n/locales` are now described in the application's OpenAPI document, with their parameters, response schemas and error statuses, and listed in Swagger UI at `/api/swagger/docs` under the `Users`, `Authorization` and `I18n` tags. `GET /api/i18n/locales` declares `security: []`, because the sign-in page reads it before anyone is signed in. `PUT /api/i18n/locale` is hidden from the document because it only changes the browser's session. Input validation answers exactly as before. Each route lists `403` only where it checks a permission, so `GET /api/authorization/permissions` lists `401` and `500`; the `400` for invalid input comes from the input validators, and a route that can answer `400` for another reason declares it with its reasons, such as `INVALID_AUTHORIZATION_INPUT` on rule create and update, `PROTECTED_PERMISSION_SET` on Permission Set changes, and the password and role-scope reasons on user routes.

  The settings routes behind the `/api/authorization` dispatcher are forwarded at request time, where the document generator cannot see them, so at boot the authorization plugin registers every `authz.routes` registration with the application's API documentation through app-server's generic `addApiRouter()` and `addUndeclaredApiRoute()`. Routes registered through `authz.routes.add(path, createRouteHandler(router))` are documented automatically at their full `/api/authorization/...` path and checked like any other route; declare each route of the router with `describeRoute()`. A handler that is a plain function rather than a `createRouteHandler` router keeps working but cannot be described: the plugin logs a warning naming its path and registers it as an undeclared route, so `findUndeclaredApiRoutes(app)` and `pnpm openapi:check` report it like any route that declares nothing. A route a router declares outside the path its handler is registered under, which the dispatcher never forwards to, is left out of the document, logged, and reported the same way. `documentAuthorizationRoutes(apiDocs, authz.routes, onWarning?)` performs that registration, for a plugin's tests to assert on with `findUndeclaredApiRoutes` and the generated document without starting an application. `createRuleSupportRoutes` accepts an optional `name` for its operation ids, and the extension exports `AUTHORIZATION_API_TAGS`, `documentAuthorizationRoutes` and response schemas such as `SubjectRuleSchema` and `TotalMetaSchema`.

  `AuthorizationRouteRegistry` in `@nocobase/authorization/core` gains `entries()`, which lists every registration with its handler, sorted by path like `list()`.

  The default-access, sharing-rule and restriction-rule plugins no longer declare `hono`, which none of their code imports. The authorization plugin's README describes the rule request bodies as validated through `apiValidator()`.

- Updated dependencies [21d274c]
- Updated dependencies [21d274c]
- Updated dependencies [299b35a]
- Updated dependencies [463a7a8]
- Updated dependencies [7dbc54b]
- Updated dependencies [7dbc54b]
- Updated dependencies [3f01f61]
- Updated dependencies [21d274c]
- Updated dependencies [0b933b3]
- Updated dependencies [21d274c]
  - @nocobase/app-server@1.0.0-beta.33
  - @nocobase/app-client@1.0.0-beta.25
  - @nocobase/i18n@1.0.0-beta.5

## 0.1.0-beta.11

### Patch Changes

- ec4b764: Recommend testing components against the real i18n runtime from `@nocobase/i18n/testing` instead of mocking `@nocobase/i18n/client`, and add a minimal runnable component test to the frontend testing reference.
- 9291dbb: Correct the i18n documentation and extend the `nocobase-app-plugin-i18n` Skill

  The `@nocobase/i18n` README called `getFixedT` with the locale first; it takes the namespace first, `getFixedT(namespace, locale)`, and the other order silently returns an unusable translator. It also no longer describes `@nocobase/i18n` as shipping built-in common terms: `BASE_NAMESPACE` stays in the fallback chain but carries no resources. The `nocobase-app-plugin-i18n` Skill drops the `refine.addResources` `meta.i18nNs` menu labels, which nothing reads any more, in favour of `navigation.title` and `breadcrumb.title` keys on `defineAppRoutes`; fixes the language switcher path and the name of `createAppI18nRuntime`; and adds how to wire a package's locales for the first time, how to translate on the server inside and outside a request, and how to throw an `AppI18nError`. Its description now says which work belongs to `nocobase-app-development` and `nocobase-plugin-development`. The `nocobase-app-development` Skill states that its examples use `actions.create`, `actions.saving` and `actions.discard`, which the templates do not define, so they must be added before an example is copied.

- e77641b: Point plugin guidance at `@nocobase/jobs` for background work, and at the rebuilt `@nocobase/queue` only for what jobs cannot do

  The Scheduler Skill now hands a target's lengthy work to a `JobExecutor` owned by the target's Provider, with the occurrence's own execution record as the reference, so a repeated start of the same occurrence returns the same reference; the job decides and reports its terminal outcome itself, because it cannot tell which executor attempt is the last. Recurring work without administrator visibility goes to a `ScheduleExecutor`, and only a one-time delay goes to a queue. Its description of Scheduler's own backend now names the jobs service and `scheduler.jobs` instead of the removed `queue.queues.schedule` connection. The Notification Skill's diagnostics check the jobs configuration Deliveries run on instead of a queue manager.

  The plugins' `AGENTS.md` list `@nocobase/queue` as a host-owned contract rather than a job registry. The jobs README states that background work goes there by default, the i18n Skill speaks of background jobs rather than queue jobs, and the departments example no longer composes the removed `QueueProvider` in its tests.

- Updated dependencies [9291dbb]
- Updated dependencies [9291dbb]
- Updated dependencies [ec4b764]
- Updated dependencies [e77641b]
  - @nocobase/i18n@1.0.0-beta.5
  - @nocobase/app-client@1.0.0-beta.24
  - @nocobase/app-server@1.0.0-beta.32

## 0.1.0-beta.10

### Patch Changes

- 46ce11f: `@nocobase/app-portal-sdk` is removed; nothing in an application depends on it any more. The presets named after it are renamed: `@nocobase/dev-config/vite/portal` and `createPortalViteConfig` are `@nocobase/dev-config/vite/app` and `createAppViteConfig`, and `createPortalConfig` is `createApplicationConfig`. The application ESLint preset now reports any `import.meta.env` read other than `PROD`, `DEV` and `MODE`, since browser code takes runtime values from the client configuration. The i18n and file plugin Skills no longer refer to the Portal SDK.
- Updated dependencies [46ce11f]
- Updated dependencies [46ce11f]
  - @nocobase/app-client@1.0.0-beta.22
  - @nocobase/app-server@1.0.0-beta.29
  - @nocobase/i18n@1.0.0-beta.4

## 0.1.0-beta.9

### Patch Changes

- 02d5402: `@nocobase/app-cli` is now the whole application command line: it provides the `nocobase` bin and absorbs `@nocobase/nb3-cli` (command assembly, the plugin contract, plugin and Skill management) and `@nocobase/app-tools` (`dev`, `build`, `start`, `server-deps`). Neither of those two packages is published any more, and there is no compatibility period.

  - **Commands.** Standard commands leave the `app` topic: `nocobase db apply`, `nocobase config init`, `nocobase collections generate`. `app db doctor` is now `collections doctor`, `app i18n:check` is now `locales check`, and `app upload`/`app deploy` are `release upload`/`release deploy`, registered only when `package.json` sets `nocobase.cli.publishing: true`. New commands `dev`, `build`, `start`, `dist retarget` and `dist check` replace the application's `scripts/*.mjs`. `plugin skills sync` and `plugin cli-hooks` are removed; use `skills sync`. `app` now holds only an application's own commands.
  - **Discovery.** Commands are found by path: an application's `cli/commands/orders/sync.ts` answers to `nocobase app orders sync`, with no index to maintain. The bin finds the application from the nearest `package.json` (`nocobase.templateKind` for a source checkout, `nocobase.buildTarget` for a built `dist/`), or from `NOCOBASE_APP_ROOT`; applications no longer have a `cli/index.ts`. A built-in command runs without importing the application's plugins.
  - **Plugins.** A plugin's topic is its package name without the scope and `app-plugin-` prefix, so the scheduler's commands move from `schedule` to `scheduler` and the CLI example's from `demo` to `cli-example`. `defineCliPlugin` accepts `devCommands`, which a built `dist/` leaves out; the workflow plugin's `check` and `build` are development commands. Plugins declare `@nocobase/app-cli` as their peer instead of `@nocobase/nb3-cli`.
  - **Deployment.** `nocobase build` writes `dist/cli/index.js`, so `node dist/cli/index.js db apply` runs from any directory without pnpm; `dist/package.json` keeps only the `start` and `nocobase` scripts. The `migrate` and `seed` scripts it used to generate pointed at commands that no longer existed and are gone. Development tooling (`typescript`, `tsx`, `vite`, `prettier`, `tar`, `@nocobase/dev-config`) is an optional peer, so a deployment installs none of it.
  - **Templates.** Scripts are reduced to `postinstall`, `dev`, `build`, `start` and the quality checks; every other command is `pnpm nocobase <topic> <command>`. `scripts/`, `cli/index.ts` and `cli/commands/index.ts` are removed.

  Upgrading an existing application requires moving to the new layout in one step: see "Shared application scripts and commands" in the `nocobase-app-upgrade` Skill (`packages/app/app-skills/skills/nocobase-app-upgrade/references/edge-cases.md`) for the full procedure. Messages that named `nocobase app db repair` and similar commands now name the new ids.

- dbf5631: Replace guidance that named removed commands and layouts. The Hub's development page names the archive `nocobase build --tar` actually writes, `storage/exports/dist.tar.gz`. The scheduler Skill synchronizes with `pnpm nocobase scheduler sync` instead of `nb3 schedule:sync` and gives the deployed form, `node dist/cli/index.js scheduler sync --finalize`. The repository example applies its migrations and seeds with `nocobase db apply`, the CLI example's Skill matches its manifest and the stdout-only `--json` contract, and the i18n Skill no longer presents `pnpm i18n:check` as the monorepo form of `locales check`. Plugin `AGENTS.md` files carry the current dependency rules from the plugin template.
- Updated dependencies [02d5402]
- Updated dependencies [dbf5631]
- Updated dependencies [05af1d4]
- Updated dependencies [4adcf24]
- Updated dependencies [ec92b20]
- Updated dependencies [ec92b20]
- Updated dependencies [757eedf]
  - @nocobase/app-server@1.0.0-beta.27
  - @nocobase/app-client@1.0.0-beta.21
  - @nocobase/i18n@1.0.0-beta.4

## 0.1.0-beta.8

### Patch Changes

- 21d3ed4: Use the current application's API client for locale switching and startup synchronization so requests respect its configuration and remain isolated between applications.
- 365a9fe: Document semantic translation key naming, grouping, interpolation, and rename guidance with examples for application and plugin development.
- Updated dependencies [d4ca00e]
- Updated dependencies [26ac480]
  - @nocobase/app-client@1.0.0-beta.18
  - @nocobase/app-server@1.0.0-beta.18
  - @nocobase/i18n@1.0.0-beta.4

## 0.1.0-beta.7

### Patch Changes

- a60decd: Require an explicit absolute baseDir for Server plugins and resolve migrations, seeds, jobs, and package metadata from the loaded plugin copy. Generate and validate database task manifests during builds so TypeScript and JavaScript share source checksums, with verified legacy JavaScript history conversion and synchronized plugin scaffolding and application templates.
- Updated dependencies [63db898]
- Updated dependencies [63db898]
- Updated dependencies [63db898]
- Updated dependencies [a60decd]
- Updated dependencies [1a85a86]
- Updated dependencies [63db898]
  - @nocobase/app-server@1.0.0-beta.15
  - @nocobase/app-client@1.0.0-beta.16
  - @nocobase/i18n@1.0.0-beta.4
  - @nocobase/service-provider@0.0.2-beta.1

## 0.1.0-beta.6

### Patch Changes

- c01baf6: Resolve application namespace aliases in React translations, synchronize the document language at startup and on changes, and inject the configured default language into served HTML. Allow client-only language selections with an English server fallback and an informational toast, and standardize documented locale checks on `pnpm nocobase app i18n:check`.
- Updated dependencies [c01baf6]
  - @nocobase/i18n@1.0.0-beta.4
  - @nocobase/app-client@1.0.0-beta.15
  - @nocobase/app-server@1.0.0-beta.13

## 0.1.0-beta.5

### Minor Changes

- a009e2d: Derive the languages an application offers from its own locale files, and configure the default language in one place.

  `i18n.defaultLocale` in `config.yml` now names the language the application starts in, for the browser and the server alike. The `i18n.locales` setting and its `APP_LOCALES` environment variable are removed, along with `client.app.defaultLocale`: an application offers whichever languages its own `client/locales/index.ts` and `server/locales/index.ts` declare loaders for, so adding a language means adding its file rather than editing a second list. A plugin's locale file supplies translations for those languages and no longer adds one, which keeps an installed plugin from putting an unexpected language in the picker.

  The browser resolves its startup language as the visitor's stored choice, then `i18n.defaultLocale`, then `en-US`. `navigator.language` is no longer consulted. Switching language in the interface remains a user-level choice and does not change the configured default.

  An untranslated key now falls back through `i18n.defaultLocale` and then `en-US`, rather than through the default alone. An application that defaults to Chinese and adds Spanish leaves its plugins translated in neither, and English is the language they are most likely to ship; the fallback languages are loaded alongside the one in use so the fallback has resources to read. `pnpm nocobase app i18n:check` reports a language declared in `client/locales/` but not `server/locales/`, or the reverse — the case where the interface offers a language the server then rejects.

  `LocaleResource` and `PartialLocaleResource` now accept an `overrides` block at the top level. The shape is derived from the source locale, which never declares that key, so annotating a locale file with it and adding the block documented for rewording a plugin's copy was a compile error — the documented example did not compile.

  To migrate, replace `i18n.locales` and `client.app.defaultLocale` with `i18n.defaultLocale`, and make sure every language the application offers has a file in its own `client/locales/` and `server/locales/`.

### Patch Changes

- Updated dependencies [a009e2d]
  - @nocobase/app-server@1.0.0-beta.10
  - @nocobase/app-client@1.0.0-beta.13
  - @nocobase/i18n@1.0.0-beta.3

## 0.1.0-beta.4

### Patch Changes

- 52d1107: Resolve the shared UI packages through the workspace catalog: `@base-ui/react`, `class-variance-authority`, `clsx`, `lucide-react`, `shadcn`, `tailwind-merge`, and `tw-animate-css`.

  Every package already agreed on one version for each of these — the catalog is what keeps them agreeing. A range edited in one manifest and not the others would otherwise put two copies of a UI primitive into an application's bundle, which is the kind of drift nothing reports until a component behaves differently depending on which plugin rendered it.

  Peer dependencies use `catalog:` too. `pnpm pack` resolves it before publishing, so a consumer still reads an ordinary range.

- 52d1107: Declare each peer dependency once, dropping the devDependency that used to accompany it.

  The pairing was required on the grounds that a peer range is wide enough for development to drift off this repository's copy. It is not: pnpm installs a peer and links it into the plugin's own `node_modules`, resolving `workspace:^` to the same package `workspace:*` would. A plugin with the devDependency removed still links, typechecks, builds, and tests against it — verified against a clean install with every plugin's `node_modules` deleted first.

  What remained was a second declaration that changed nothing and had to be kept in step with the first. `pnpm peers:check` no longer asks for it, and `create-plugin` no longer emits it.

## 0.1.0-beta.3

### Patch Changes

- 90a4903: Replace the composite application transport with application-owned `ApiClient` and `RealtimeClient` services. Client plugins, examples, and application templates now use object-style HTTP request options through the shared API client, while realtime subscriptions resolve their dedicated WebSocket client.
- Updated dependencies [90a4903]
- Updated dependencies [90a4903]
- Updated dependencies [90a4903]
- Updated dependencies [90a4903]
- Updated dependencies [90a4903]
- Updated dependencies [90a4903]
- Updated dependencies [a864497]
- Updated dependencies [a864497]
- Updated dependencies [90a4903]
- Updated dependencies [90a4903]
- Updated dependencies [90a4903]
- Updated dependencies [90a4903]
- Updated dependencies [90a4903]
- Updated dependencies [90a4903]
  - @nocobase/app-server@1.0.0-beta.7
  - @nocobase/app-client@1.0.0-beta.10

## 0.1.0-beta.2

### Minor Changes

- 174eab5: Consolidate the browser packages into `@nocobase/app-client`.

  `@nocobase/app-sdk` is gone; its API client now lives in `@nocobase/app-client` and is imported from there. `@nocobase/app-portal-sdk` is deprecated and keeps only what still has consumers: `NocoBaseClient` and the runtime configuration it reads, which exist to reach a v2 NocoBase server, and the route surface containers under `/routing`. Its ACL, auth, data, extension, i18n, and system-settings modules are removed, as is the route tree that `/routing` used to export alongside the surfaces.

  `@nocobase/app-client` gains `resolveAppBase()`, which reports the path the application is mounted at.

  Four plugins built their API client at import time instead of resolving it from the application's service container, so they could not see `api.baseURL` from the application configuration. They now resolve it, which means an application that configures a base URL gets one client rather than two that disagree.

  The injected browser global `NOCOBASE_PORTAL_BASE` is renamed to `APP_BASE_PATH`. Its value has always been the `APP_BASE_PATH` environment variable, and the old name grouped it with the settings that address a v2 NocoBase server. Those keep their names. A client and the server that serves it must be upgraded together.

  `@nocobase/app-plugin-data-provider` is removed. It forwarded the Portal data provider, and applications built on the current client runtime do not use it.

  The Hub template is rebuilt from the default template and now runs the same client and server stack as every other v3 application. Its `/api/apps` endpoint and its v2 API proxy are gone, so a hub's `.env` no longer configures them.

  The Portal SDK's template compatibility check is removed with the rest: it had been disabled behind a constant, and its install script cost every generated project a `pnpm-workspace.yaml` `allowBuilds` entry it did not need. `createPortalViteConfig` no longer takes the plugin that injected it.

- 1527426: Declare identity-sensitive runtime packages as peer dependencies of every plugin.

  A plugin used to list `@nocobase/app-server`, `@nocobase/db`, `@nocobase/service-provider`, `@nocobase/i18n`, `@nocobase/queue`, `@nocobase/app-portal-sdk`, and the plugins it builds on among its `dependencies`. Each of these carries state that only works while exactly one copy of the module exists in the process: `ServiceContainer` keys its bindings by the token object itself, React contexts match only the provider created from the same module, and `@nocobase/queue` registers job classes into a global `Locator`. A `dependencies` range lets a package manager install a second copy to satisfy it, which splits that state.

  The monorepo could never show the problem, because `workspace:` links every consumer to one directory. It appears once a plugin is installed from a registry into an application, and it appears at runtime rather than at install time: a service that is registered reports `Service "..." is not registered`, or a context reads `undefined` under a mounted provider.

  Each of these packages is now a peer dependency paired with a devDependency. The peer is the published contract that makes the installing application provide the single copy; the devDependency pins this repository's copy for development and tests, which the deliberately wide peer range does not. Applications built from the templates are unaffected — they already install every one of these packages directly, which is what satisfies the new peer ranges.

  `pnpm plugin:create` generates the same shape, and `pnpm peers:check` enforces it in CI.

### Patch Changes

- Updated dependencies [174eab5]
- Updated dependencies [ab7b341]
- Updated dependencies [174eab5]
  - @nocobase/app-client@1.0.0-beta.6
  - @nocobase/app-server@1.0.0-beta.4
  - @nocobase/i18n@1.0.0-beta.1
  - @nocobase/service-provider@0.0.2-beta.1

## 0.1.0-beta.1

### Minor Changes

- ac3f033: Export every server plugin from its package's `./server` entry point, and update application composition, plugin discovery, and generated plugins to use the unified entry point.

### Patch Changes

- fb1a752: Unify Client and Server application composition around the explicit `serviceProviders` contribution and rename Client React tree contributions to `reactProviders`.

  Replace Client bootstrap modules with application-owned ServiceProvider lifecycle hooks, make the default Client start through `ClientApplication` and render through the Browser host, and update built-in plugins and runtime inspection to the new static contribution protocol.

- Updated dependencies [fb1a752]
- Updated dependencies [948304d]
- Updated dependencies [ac3f033]
- Updated dependencies [fb1a752]
- Updated dependencies [78cf0a2]
- Updated dependencies [fb1a752]
  - @nocobase/app-client@1.0.0-beta.5
  - @nocobase/app-server-kit@0.1.0-beta.3
  - @nocobase/app-sdk@0.0.1-beta.0

## 0.0.2-beta.0

### Patch Changes

- b049266: Add language switching on top of `@nocobase/app-i18n`. Applications and plugins declare their locales the same way on both sides, the browser loads only the language it is showing, and the chosen one is kept in storage and mirrored to the server session.
- b049266: Request the locale endpoint under the application's base path. It was hard-coded to the origin root, so switching language on an app served from a base path posted to a URL that did not exist.
- Updated dependencies [b049266]
- Updated dependencies [b049266]
- Updated dependencies [7cdffbd]
- Updated dependencies [7cdffbd]
- Updated dependencies [7cdffbd]
- Updated dependencies [ce4eab8]
- Updated dependencies [7cdffbd]
- Updated dependencies [b049266]
- Updated dependencies [7cdffbd]
- Updated dependencies [7cdffbd]
- Updated dependencies [7cdffbd]
- Updated dependencies [7cdffbd]
  - @nocobase/app-i18n@0.0.2-beta.0
  - @nocobase/app-client@1.0.0-beta.4
  - @nocobase/app-server-kit@0.1.0-beta.2
  - @nocobase/app-sdk@0.0.1-beta.0

## 0.0.1

### Patch Changes

- Add language switching on top of `@nocobase/app-i18n`. Applications and plugins declare their locales the same way on both sides, the browser loads only the language it is showing, and the chosen one is kept in storage and mirrored to the server session.
