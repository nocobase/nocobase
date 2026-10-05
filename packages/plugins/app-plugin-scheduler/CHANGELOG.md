# @nocobase/app-plugin-scheduler

## 1.0.0-beta.13

### Patch Changes

- e123790: Move `@nocobase/app-server`, `@nocobase/app-client`, `@nocobase/app-plugin-authentication`, `@nocobase/app-plugin-users`, `@nocobase/app-plugin-hub`, `@nocobase/app-plugin-workflow` and `@nocobase/app-plugin-ai-employee` to the 2.0.0 prerelease line. The HTTP API migration released in 1.0.0-beta.N changed every route and the error body, but in prerelease mode a `major` changeset on a version that is already a `1.0.0` prerelease only increments the prerelease number, so nothing in the version said the change was breaking. These packages now release as `2.0.0-beta.0`, and every package that depends on or peers with one of them is released again so that its published range is `^2.0.0-beta.0` rather than a `^1.0.0-beta` range the new versions do not satisfy. An application upgrading to these versions upgrades all of them together.
- Updated dependencies [e123790]
  - @nocobase/app-client@2.0.0-beta.0
  - @nocobase/app-plugin-authentication@2.0.0-beta.0
  - @nocobase/app-server@2.0.0-beta.0
  - @nocobase/app-cli@1.0.0-beta.13
  - @nocobase/app-plugin-authorization@1.0.0-beta.24

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

- 0b933b3: Declare every hand-written `/api` route of the file, notification, in-app notification, scheduler and Database Explorer plugins in the application's API document at `/api/swagger/docs`, with response schemas and the error statuses each route answers. The file plugin documents the `uploadOne` and `uploadMany` endpoints of each exposure as `multipart/form-data` beside that exposure's data endpoints, under its tag and with operationIds such as `attachmentsUploadOne`. Each file exposure declares the `contentUrl` it adds to every record as a computed field, so the record schema of its data endpoints lists it, read-only, beside the Collection's fields. Route input is now validated through `apiValidator()`, which answers invalid input exactly as before. A route lists `403` only where it checks a permission, so the in-app inbox routes list `401` and `500`; the `400` for invalid input comes from the input validators, and a route that can answer `400` for another reason, such as an invalid page token or cursor or an unavailable test target, declares it with its reasons.
- be0fbbd: Tests in these plugins and example plugins take their fixtures from `@nocobase/app-testing` alone: database fixtures such as `createDatabaseTest()`, `describeMigration()` and `expectCollection()` from `@nocobase/app-testing/server`, and the command runner from `@nocobase/app-testing/cli`. Each package replaces its `@nocobase/db-testing` development dependency with `@nocobase/app-testing`. Nothing any of them ships changes.
- be0fbbd: Database tests in these plugins and example plugins take their database from `@nocobase/db-testing` instead of configuring an in-memory SQLite database, so they run on SQLite by default and on the database `NOCOBASE_TEST_DB_DIALECT` selects otherwise. Schema assertions that read `PRAGMA` output or `sqlite_master` are written with `expectCollection()` against Field and Collection names, migration up and down tests use `describeMigration()`, and the SQLite triggers that made a write fail are replaced by spies on the write. Each package replaces its `@nocobase/db-sqlite` development dependency with `@nocobase/db-testing`; nothing any of them ships changes.
- be0fbbd: The scheduler's migration tests are written with `describeMigration()` from `@nocobase/db-testing`, so they run on whichever database `NOCOBASE_TEST_DB_DIALECT` selects rather than on SQLite alone, and check that rolling back restores the previous tables. The package declares `@nocobase/db-testing` as a development dependency; nothing it ships changes.
- Updated dependencies [21d274c]
- Updated dependencies [21d274c]
- Updated dependencies [463a7a8]
- Updated dependencies [299b35a]
- Updated dependencies [463a7a8]
- Updated dependencies [7e5b7d4]
- Updated dependencies [463a7a8]
- Updated dependencies [21d274c]
- Updated dependencies [be0fbbd]
- Updated dependencies [e44f49c]
- Updated dependencies [7f9450e]
- Updated dependencies [4403687]
- Updated dependencies [be0fbbd]
- Updated dependencies [463a7a8]
- Updated dependencies [be0fbbd]
- Updated dependencies [7dbc54b]
- Updated dependencies [463a7a8]
- Updated dependencies [be0fbbd]
- Updated dependencies [463a7a8]
- Updated dependencies [7dbc54b]
- Updated dependencies [3f01f61]
- Updated dependencies [21d274c]
- Updated dependencies [21d274c]
- Updated dependencies [7dbc54b]
- Updated dependencies [0b933b3]
- Updated dependencies [0b933b3]
- Updated dependencies [0b933b3]
- Updated dependencies [be0fbbd]
- Updated dependencies [be0fbbd]
- Updated dependencies [21d274c]
  - @nocobase/app-server@1.0.0-beta.33
  - @nocobase/app-cli@1.0.0-beta.12
  - @nocobase/app-client@1.0.0-beta.25
  - @nocobase/app-plugin-authentication@1.0.0-beta.25
  - @nocobase/db@1.0.0-beta.17
  - @nocobase/app-plugin-authorization@1.0.0-beta.23
  - @nocobase/i18n@1.0.0-beta.5
  - @nocobase/jobs@0.1.0-beta.2
  - @nocobase/service-provider@0.0.2-beta.1

## 0.1.0-beta.11

### Patch Changes

- 9291dbb: Pass `locales` the same way on the client and the server

  `defineClientPlugin`, `defineServerPlugin` and both sides' `defineAppRuntime` now accept the `locales/index.ts` module itself or a function importing it, typed as the new `LocalesContribution` from `@nocobase/i18n`, which also exports `resolveLocalesContribution` to turn either into the module. Previously the client took only the module and the server only a function, so a plugin wired the same file two different ways. The module is the recommended form on both sides: each language in it is already a separate dynamic import, so importing the map statically loads no translations early. Existing `locales: () => import('./locales/index.js')` declarations keep working unchanged. `@nocobase/app-server` exports `AppServerPluginLocales` for the widened type and keeps `AppServerPluginLocalesLoader` as a deprecated alias. The bundled plugins, the application templates' `server/runtime.ts` and plugins generated by `create-plugin` now import their server locales statically.

- e77641b: Point plugin guidance at `@nocobase/jobs` for background work, and at the rebuilt `@nocobase/queue` only for what jobs cannot do

  The Scheduler Skill now hands a target's lengthy work to a `JobExecutor` owned by the target's Provider, with the occurrence's own execution record as the reference, so a repeated start of the same occurrence returns the same reference; the job decides and reports its terminal outcome itself, because it cannot tell which executor attempt is the last. Recurring work without administrator visibility goes to a `ScheduleExecutor`, and only a one-time delay goes to a queue. Its description of Scheduler's own backend now names the jobs service and `scheduler.jobs` instead of the removed `queue.queues.schedule` connection. The Notification Skill's diagnostics check the jobs configuration Deliveries run on instead of a queue manager.

  The plugins' `AGENTS.md` list `@nocobase/queue` as a host-owned contract rather than a job registry. The jobs README states that background work goes there by default, the i18n Skill speaks of background jobs rather than queue jobs, and the departments example no longer composes the removed `QueueProvider` in its tests.

- Updated dependencies [3117923]
- Updated dependencies [9291dbb]
- Updated dependencies [9291dbb]
- Updated dependencies [ec4b764]
- Updated dependencies [a859ba1]
- Updated dependencies [e77641b]
- Updated dependencies [e77641b]
  - @nocobase/app-cli@1.0.0-beta.11
  - @nocobase/i18n@1.0.0-beta.5
  - @nocobase/app-client@1.0.0-beta.24
  - @nocobase/app-server@1.0.0-beta.32
  - @nocobase/app-plugin-authorization@0.2.0-beta.22
  - @nocobase/jobs@0.1.0-beta.2
  - @nocobase/app-plugin-authentication@1.0.0-beta.24
  - @nocobase/db@1.0.0-beta.16
  - @nocobase/service-provider@0.0.2-beta.1

## 0.1.0-beta.10

### Minor Changes

- aeff80a: Schedule through `@nocobase/jobs` instead of the queue's schedule projection

  **Breaking.** Scheduler hands each schedule's rule to its own executor from `@nocobase/app-server/jobs`, on the `@nocobase/app-plugin-scheduler` scope, with the concurrency and attempts of the `jobs` configuration it runs on. `ScheduleDispatchJob` is no longer exported, the plugin contributes no queue jobs and needs no `schedule` queue, and it depends on `@nocobase/jobs` as a peer. A new migration adds `nextRunAt`, `lastRunAt`, `runCount`, `appliedLimit` and `lastOccurrenceId` to `scheduleDefinitions` and `scheduledAt` to `scheduleOccurrences`.

  - **No migration from the queue.** Rules are not carried over from `queue_schedules`, nor pending jobs from `queue_jobs`. Each schedule's rule is written again on the next start and its run count starts from zero; its definition, enablement and occurrence history are kept.
  - **One run per firing across instances** on the `redis` jobs adapter. On `memory`, the built-in default, schedules serve one process.
  - **Every start repairs the rules.** Synchronization removes again the rule of every disabled definition and of every definition `--finalize` deactivated, so a removal that was lost — on `memory`, a running application overwrites what `nocobase scheduler sync` wrote when it stops — takes effect at the next start.
  - **Occurrences.** An occurrence's id is the firing's job id, so a firing delivered twice records and starts its target once. A target that is not ready now records a `skipped` occurrence instead of failing.
  - **Limits.** Disabling and re-enabling a schedule, or changing its definition, continues from the firings already run rather than restarting its limit.
  - **Choosing the backend.** `scheduler.jobs`, or `SCHEDULER_JOBS`, names the `jobs` configuration the schedules run on; without it they follow `jobs.default`. A name `jobs` does not define stops the application from starting. Keep `attempts` at `1` there: a failed dispatch is recorded as the occurrence's outcome, so a retry finds it recorded and runs nothing.

  Upgrading: compose `JobExecutorServiceProvider` in `server/app.ts`, declare `@nocobase/jobs` as a dependency, add a `jobs` configuration — `redis` for more than one instance — and remove the `queues.schedule` connection the queue configuration kept for Scheduler. The application templates do all of this.

### Patch Changes

- Updated dependencies [64cf25a]
- Updated dependencies [aeff80a]
- Updated dependencies [aeff80a]
  - @nocobase/app-cli@1.0.0-beta.10
  - @nocobase/jobs@0.1.0-beta.0
  - @nocobase/app-server@1.0.0-beta.30
  - @nocobase/app-plugin-authentication@1.0.0-beta.24

## 0.1.0-beta.9

### Minor Changes

- 02d5402: `@nocobase/app-cli` is now the whole application command line: it provides the `nocobase` bin and absorbs `@nocobase/nb3-cli` (command assembly, the plugin contract, plugin and Skill management) and `@nocobase/app-tools` (`dev`, `build`, `start`, `server-deps`). Neither of those two packages is published any more, and there is no compatibility period.

  - **Commands.** Standard commands leave the `app` topic: `nocobase db apply`, `nocobase config init`, `nocobase collections generate`. `app db doctor` is now `collections doctor`, `app i18n:check` is now `locales check`, and `app upload`/`app deploy` are `release upload`/`release deploy`, registered only when `package.json` sets `nocobase.cli.publishing: true`. New commands `dev`, `build`, `start`, `dist retarget` and `dist check` replace the application's `scripts/*.mjs`. `plugin skills sync` and `plugin cli-hooks` are removed; use `skills sync`. `app` now holds only an application's own commands.
  - **Discovery.** Commands are found by path: an application's `cli/commands/orders/sync.ts` answers to `nocobase app orders sync`, with no index to maintain. The bin finds the application from the nearest `package.json` (`nocobase.templateKind` for a source checkout, `nocobase.buildTarget` for a built `dist/`), or from `NOCOBASE_APP_ROOT`; applications no longer have a `cli/index.ts`. A built-in command runs without importing the application's plugins.
  - **Plugins.** A plugin's topic is its package name without the scope and `app-plugin-` prefix, so the scheduler's commands move from `schedule` to `scheduler` and the CLI example's from `demo` to `cli-example`. `defineCliPlugin` accepts `devCommands`, which a built `dist/` leaves out; the workflow plugin's `check` and `build` are development commands. Plugins declare `@nocobase/app-cli` as their peer instead of `@nocobase/nb3-cli`.
  - **Deployment.** `nocobase build` writes `dist/cli/index.js`, so `node dist/cli/index.js db apply` runs from any directory without pnpm; `dist/package.json` keeps only the `start` and `nocobase` scripts. The `migrate` and `seed` scripts it used to generate pointed at commands that no longer existed and are gone. Development tooling (`typescript`, `tsx`, `vite`, `prettier`, `tar`, `@nocobase/dev-config`) is an optional peer, so a deployment installs none of it.
  - **Templates.** Scripts are reduced to `postinstall`, `dev`, `build`, `start` and the quality checks; every other command is `pnpm nocobase <topic> <command>`. `scripts/`, `cli/index.ts` and `cli/commands/index.ts` are removed.

  Upgrading an existing application requires moving to the new layout in one step: see "Shared application scripts and commands" in the `nocobase-app-upgrade` Skill (`packages/app/app-skills/skills/nocobase-app-upgrade/references/edge-cases.md`) for the full procedure. Messages that named `nocobase app db repair` and similar commands now name the new ids.

- ec92b20: Plugin commands are `AppCommand`s and print the command envelope under `--json`. `scheduler sync` creates the application through `withApp()`, so it acts on the application the runner located rather than the current directory and always destroys the runtime. `workflow build` path flags are `appPath()` flags, so their defaults resolve against the application root from any directory. The CLI example's `artifact build` is a development command, and `pnpm plugin:create --with cli` generates an `AppCommand` with a test that uses `@nocobase/app-cli/testing`.

  The application Skill gains a reference on adding an application command, and the application templates and plugin `AGENTS.md` files describe commands in those terms: a command returns its result, throws `CommandError`, and creates the application with `withApp()` when it needs it. The templates import the CLI authoring API from `@nocobase/app-cli`.

### Patch Changes

- dbf5631: Replace guidance that named removed commands and layouts. The Hub's development page names the archive `nocobase build --tar` actually writes, `storage/exports/dist.tar.gz`. The scheduler Skill synchronizes with `pnpm nocobase scheduler sync` instead of `nb3 schedule:sync` and gives the deployed form, `node dist/cli/index.js scheduler sync --finalize`. The repository example applies its migrations and seeds with `nocobase db apply`, the CLI example's Skill matches its manifest and the stdout-only `--json` contract, and the i18n Skill no longer presents `pnpm i18n:check` as the monorepo form of `locales check`. Plugin `AGENTS.md` files carry the current dependency rules from the plugin template.
- Updated dependencies [ec92b20]
- Updated dependencies [dbf5631]
- Updated dependencies [ec92b20]
- Updated dependencies [757eedf]
- Updated dependencies [1b139b6]
- Updated dependencies [02d5402]
- Updated dependencies [dbf5631]
- Updated dependencies [ae43f41]
- Updated dependencies [8c06293]
- Updated dependencies [05af1d4]
- Updated dependencies [4adcf24]
- Updated dependencies [ec92b20]
- Updated dependencies [ec92b20]
- Updated dependencies [757eedf]
  - @nocobase/app-cli@1.0.0-beta.6
  - @nocobase/app-plugin-authorization@0.2.0-beta.20
  - @nocobase/app-server@1.0.0-beta.27
  - @nocobase/db@1.0.0-beta.16
  - @nocobase/app-plugin-authentication@1.0.0-beta.24
  - @nocobase/app-client@1.0.0-beta.21
  - @nocobase/queue@0.1.0-beta.7
  - @nocobase/i18n@1.0.0-beta.4
  - @nocobase/service-provider@0.0.2-beta.1

## 0.1.0-beta.8

### Patch Changes

- c8ddd7d: Consolidate the authorization API. Resource types are either catalog types (`settings`, `composite`, `database.collection`), whose items and actions must be registered, or record types (`page`, `user`, `notification`, `hub.app`, `hub.host`), which declare type-level actions and judge each record; there are no `*` items. Business resources become composite resources, a built-in core mechanism: every Authorization has `authz.compositeResources` (which replaces `authz.business`) and reserves the `composite` resource type, so `businessPlugin()` is gone with no replacement and `resourceTypes.add({ type: 'composite' })` throws; `defineBusinessResource` is `defineCompositeResource`, every `Business*` type is `CompositeResource*` (`CompositeResource`, `CompositeResourceBuilder`, `CompositeResourceActionBuilder`, `CompositeResourceReference`, `CompositeResourceConditions`, `CompositeResourceApi`, `BindableCompositeResourcePermission` and so on) and the grant policy is `{ type: 'composite', scopes }`. Resource types carry no `title`: they are never displayed, and the library holds no translation keys. A composite composes exactly the grants its definition lists, on any type except another composite. A data scope no longer names a `collection`: it targets the one resource its grant actions address (`dataScopeTarget(action, key)`), whose type must declare `recordAccess: true` on `resourceTypes.add`, as `database.collection` does; `define` checks this when the type is registered, and `authz.compositeResources.validate()` and first use check types registered later. The library holds no display concepts. `@nocobase/app-plugin-authorization` provides `authz.ui`, also exposed to plugin setup contexts: `ui.sections.add` for the top-level sections `pages`, `business` and `administration` and one level of subsections (with `extend: true` for a subsection another plugin owns, as workflow owns `automation` and scheduler extends it), `ui.groups.add` for right-side groups, `ui.place(ref, { section, group? })`, and `ui.defaultSection(type, section)`. `pagesPlugin` registers the `pages.page` subsection, the only one the client fills, from its route tree. The client no longer remaps the `@nocobase/authorization` namespace. `authz.settings.add` no longer takes `section`; settings items and composites are placed with `authz.ui.place`, and unplaced ones land in their type's default section "Other". Startup validation runs after every provider has booted and reports unknown subsections and groups, placements of unregistered resources and unfit data scopes, throwing in development and logging a warning in production. A resource holds at most one default-access rule: the table is unique on `(resourceType, resourceId)` as well as `key`, and a second rule raises `DefaultAccessConflictError`, answered with 409. `authorizationToken` is the only service token: `permissionSetsToken` is gone, `authz.db` is now `authz.database`, settings items are registered with `authz.settings.add` and checked with semantic actions, and rule plugins build on `@nocobase/app-plugin-authorization/server/extension`. The client exposes `AuthorizationClient.snapshot/revision/invalidate/onInvalidated` and renamed management components. Every client page route must now declare `authz` (a check or `'skip'`); nothing is inferred from the route name. The authorization migrations and seeds were edited in place, including the new `key` column on default-access rules, so existing databases must be reset and reinstalled. A stored composite grant that no longer expands — an unknown action or data scope, an invalid scope value or policy — is skipped for that grant alone instead of failing every check of the identity: it permits nothing, a direct check of its action denies with `INVALID_GRANT`, and `createAuthorization({ onInvalidGrant })` is told once, which the application plugin logs; `authz.compositeResources.validateGrant` explains a stored grant, and the plugin's startup validation scans every stored Permission Set, throwing in development and warning in production. `authz.database.collections.add` treats a re-registration with the same actions as a no-op even when its title or description differ, keeping the first and reporting a startup warning through `collections.warnings()`; only different actions throw. `authz.resourceTypes.get(type).items.add(item)` remains the generic low-level item registration that `settings.add`, `database.collections.add` and `compositeResources.define` build on.
- Updated dependencies [f6c3cd8]
- Updated dependencies [c8ddd7d]
- Updated dependencies [f3917b6]
- Updated dependencies [0b37436]
- Updated dependencies [d18e964]
- Updated dependencies [0231d46]
  - @nocobase/app-server@1.0.0-beta.26
  - @nocobase/app-client@1.0.0-beta.20
  - @nocobase/app-plugin-authentication@1.0.0-beta.23
  - @nocobase/app-plugin-authorization@0.2.0-beta.19

## 0.1.0-beta.7

### Patch Changes

- Updated dependencies [cda1175]
- Updated dependencies [e286e0d]
- Updated dependencies [808bf34]
- Updated dependencies [4e58fe3]
- Updated dependencies [4e58fe3]
- Updated dependencies [4e58fe3]
- Updated dependencies [4e58fe3]
- Updated dependencies [4e58fe3]
- Updated dependencies [80ef702]
  - @nocobase/app-plugin-authentication@1.0.0-beta.21
  - @nocobase/app-plugin-authorization@0.2.0-beta.18
  - @nocobase/app-server@1.0.0-beta.25
  - @nocobase/db@1.0.0-beta.15
  - @nocobase/app-client@1.0.0-beta.19
  - @nocobase/i18n@1.0.0-beta.4
  - @nocobase/queue@0.1.0-beta.7
  - @nocobase/service-provider@0.0.2-beta.1
  - @nocobase/nb3-cli@1.0.0-beta.11

## 0.1.0-beta.6

### Patch Changes

- d696700: Stop the `bubblegum` theme from turning settings pages into competing hues, and fix the token misuse it exposed.

  The preset was carried over from tweakcn verbatim, and upstream spends the generic surface and outline roles on decoration: `--card` was a cream 101 degrees of hue away from the pink `--background`, `--border` was `--primary` itself at chroma 0.18 against a median of 0.02 across the other thirty presets, and `--muted` was a cyan. One demonstration card and a few dividers carry that; a settings page stacking several panels over dozens of hairlines does not, and pages showed pink, cream, cyan and teal at once. Six light values are retuned — `--card`, `--border`, `--muted`, `--input`, `--sidebar-border` and `--sidebar-primary` — keeping those roles in the background's hue family and leaving the preset's colour in `--primary`, `--secondary` and `--accent`. The dark values, the radius, and every other preset are unchanged, and `THIRD-PARTY-NOTICES.md` records the deviation.

  The same pages also used tokens for something other than their role, which no neutral preset makes visible. Authorization's two page shells and four Hub pages painted the whole page with `bg-muted/20`, which is the page surface and belongs to `bg-background`; under a preset whose `--muted` is a real colour that was a film over the entire viewport. The AI employee page's read-only fields hand-rolled `bg-muted/40` instead of using the shared `Input` and `Textarea` with `disabled`, three information callouts were fixed `bg-blue-50`, and the MCP transport labels were fixed `bg-blue-100`/`bg-green-100`/`bg-amber-100`; the transports now take their three tones from the theme's chart series, which is what a preset defines to be told apart.

  Three fixed colours on settings pages are corrected while they are in hand. The AI employee page's missing-knowledge-base warning and the schedule detail page's target-issue icon named a light-mode ink with no dark counterpart, so both were close to unreadable on a dark card; they now carry one. The routes example reported a load failure in a fixed red, which is what `--destructive` is for.

  The theme authoring reference and the token reference now state the rule, so a preset converted tomorrow is checked against it.

- 095319c: Build the scheduled task list and detail pages from the same shared page sections, table, badge, and button components the other modules use, instead of page-local table markup and status chips.
- Updated dependencies [709f9ed]
- Updated dependencies [d696700]
- Updated dependencies [fa01814]
- Updated dependencies [ca3188e]
- Updated dependencies [38e5253]
- Updated dependencies [fa01814]
- Updated dependencies [7bde7bd]
- Updated dependencies [5380642]
- Updated dependencies [ea91af0]
- Updated dependencies [3187ace]
- Updated dependencies [d4783c2]
- Updated dependencies [d696700]
- Updated dependencies [5380642]
- Updated dependencies [c5f4438]
- Updated dependencies [3187ace]
- Updated dependencies [38e5253]
- Updated dependencies [38e5253]
  - @nocobase/app-plugin-authentication@0.1.0-beta.20
  - @nocobase/app-plugin-authorization@0.2.0-beta.17
  - @nocobase/db@1.0.0-beta.13
  - @nocobase/app-server@1.0.0-beta.23
  - @nocobase/nb3-cli@1.0.0-beta.11
  - @nocobase/app-client@1.0.0-beta.19
  - @nocobase/i18n@1.0.0-beta.4
  - @nocobase/queue@0.1.0-beta.7
  - @nocobase/service-provider@0.0.2-beta.1

## 0.1.0-beta.5

### Patch Changes

- 4ffcbc2: Align workflow and schedule management pages with the standard page container, heading typography, and spacing used by other settings pages.
- Updated dependencies [43592e9]
- Updated dependencies [43592e9]
  - @nocobase/app-plugin-authentication@0.1.0-beta.19
  - @nocobase/app-plugin-authorization@0.2.0-beta.16
  - @nocobase/db@1.0.0-beta.12
  - @nocobase/app-server@1.0.0-beta.22

## 0.1.0-beta.4

### Patch Changes

- 4b3bcfe: Keep switch tracks and thumbs on the same theme spacing scale so compact themes preserve their proportions and checked alignment.

## 0.1.0-beta.3

### Patch Changes

- 64b3fdb: Remove Refine from client authorization checks. Use `AuthorizationClient.can({ resource, action })` instead of the removed two-argument signature, and import `useCan` from `@nocobase/app-plugin-authorization/client`. Migrate page guards, navigation, and notification visibility while preserving session isolation and realtime permission invalidation.

  Remove the Refine access-control configuration and legacy global authorization client accessors. Resolve the application-owned client through `useAuthorizationClient()` or `authorizationClientToken`. Settings actions now revoke stale access immediately; route checks no longer bypass the authorization page or translate Refine CRUD action names.

  Unify route authorization under `authz: 'skip' | { resource: { type, id }, action }`. Normalize default rules during registration and share them across page guards, navigation, permission discovery, and inspection. Remove the legacy `access` field and string resource adapter.

  Limit settings action checks to the actions each page uses, keep the permission-set action helper internal, and avoid rebuilding navigation twice when selecting a route.

- 64b3fdb: Align workflow and scheduler route paths with their current pages while preserving page authorization, including nested workflow tabs. Remove duplicate development declarations for dependencies already required by the examples and hub server runtimes.
- 0f17c1b: Complete English and Chinese translations for workflow canvas controls and inspector statuses, and scheduled task target types, pending status, and execution reasons.
- 64b3fdb: Move workflow and schedule settings and detail routes to the read actions of system administration resources, grouped under Automation, instead of ordinary page permissions.
- Updated dependencies [64b3fdb]
- Updated dependencies [64b3fdb]
- Updated dependencies [64b3fdb]
- Updated dependencies [64b3fdb]
- Updated dependencies [64b3fdb]
- Updated dependencies [64b3fdb]
- Updated dependencies [64b3fdb]
- Updated dependencies [64b3fdb]
- Updated dependencies [64b3fdb]
- Updated dependencies [64b3fdb]
- Updated dependencies [64b3fdb]
- Updated dependencies [64b3fdb]
- Updated dependencies [64b3fdb]
- Updated dependencies [64b3fdb]
- Updated dependencies [64b3fdb]
- Updated dependencies [64b3fdb]
- Updated dependencies [64b3fdb]
- Updated dependencies [64b3fdb]
- Updated dependencies [64b3fdb]
- Updated dependencies [64b3fdb]
- Updated dependencies [64b3fdb]
- Updated dependencies [64b3fdb]
- Updated dependencies [64b3fdb]
- Updated dependencies [64b3fdb]
- Updated dependencies [64b3fdb]
- Updated dependencies [64b3fdb]
- Updated dependencies [64b3fdb]
- Updated dependencies [64b3fdb]
- Updated dependencies [64b3fdb]
- Updated dependencies [64b3fdb]
- Updated dependencies [64b3fdb]
- Updated dependencies [64b3fdb]
- Updated dependencies [64b3fdb]
- Updated dependencies [64b3fdb]
- Updated dependencies [64b3fdb]
- Updated dependencies [fe564d9]
- Updated dependencies [fe564d9]
- Updated dependencies [64b3fdb]
- Updated dependencies [64b3fdb]
- Updated dependencies [64b3fdb]
- Updated dependencies [64b3fdb]
  - @nocobase/app-client@1.0.0-beta.19
  - @nocobase/app-plugin-authorization@0.2.0-beta.15
  - @nocobase/app-server@1.0.0-beta.21
  - @nocobase/queue@0.1.0-beta.7
  - @nocobase/app-plugin-authentication@0.1.0-beta.18
  - @nocobase/db@1.0.0-beta.11
  - @nocobase/i18n@1.0.0-beta.4
  - @nocobase/service-provider@0.0.2-beta.1
  - @nocobase/nb3-cli@1.0.0-beta.9

## 0.1.0-beta.2

### Patch Changes

- 9628cdd: Improve workflow and scheduler management pages with consistent layouts, filters, tables, and switches. Keep page layout and UI components local to their owning plugins, and align authorization pages with the same layout conventions.

  Normalize workflow and execution URLs under `/settings/workflow` and scheduler URLs under `/settings/schedules`, retaining the automation menu group without adding it to URLs. Update scheduler target links and the examples homepage entry. Use bookmarkable workflow/run child routes, preserve queries and browser history, and link execution detail titles to their workflow.

  Improve the workflow execution canvas with reorganized run controls, fullscreen viewing, terminal edge markers, direct empty-branch connections, and theme-aware styling. Unify node dialogs with consistent titles and close controls, collapsible descriptions, execution results and status colors, and explanatory states for unexecuted nodes.

- Updated dependencies [c84bfe8]
- Updated dependencies [e9da3c2]
- Updated dependencies [9628cdd]
  - @nocobase/db@1.0.0-beta.11
  - @nocobase/app-server@1.0.0-beta.20
  - @nocobase/app-plugin-authorization@0.2.0-beta.14
  - @nocobase/app-plugin-authentication@0.1.0-beta.18

## 0.1.0-beta.1

### Patch Changes

- e0c4b3d: Add a transaction-safe physical row upsert API and use it through a unified Queue adapter accepting DatabaseConnection, with the upstream Knex client bridge kept private. Fix scheduler startup across database dialects while preserving schedule execution history.

  Preserve the outer Oracle transaction when a nested savepoint completes, allowing inserted rows to roll back with their owning transaction.

  Retry deadlocks with bounded backoff when a physical row upsert owns its transaction; preserve caller-owned transaction boundaries and propagate failures requiring the caller to retry.

  Recognize Dameng unique-key conflicts during concurrent upserts and preserve the outer transaction when knex-dm finishes a nested savepoint.

  Declare Knex as a Dameng runtime dependency so nested transaction support also works in registry installations.

- Updated dependencies [e0c4b3d]
- Updated dependencies [e13ed84]
- Updated dependencies [e13ed84]
- Updated dependencies [e13ed84]
- Updated dependencies [00362cf]
- Updated dependencies [e13ed84]
- Updated dependencies [e13ed84]
  - @nocobase/queue@0.1.0-beta.6
  - @nocobase/db@1.0.0-beta.10
  - @nocobase/app-server@1.0.0-beta.19
  - @nocobase/app-plugin-authentication@0.1.0-beta.18
  - @nocobase/app-client@1.0.0-beta.18
  - @nocobase/i18n@1.0.0-beta.4
  - @nocobase/service-provider@0.0.2-beta.1
  - @nocobase/app-plugin-authorization@0.2.0-beta.13
  - @nocobase/nb3-cli@1.0.0-beta.9

## 0.1.0-beta.0

### Minor Changes

- 26ac480: Add code-defined Cron scheduling with timezone support, transactional synchronization, and stable schedule identities. Applications and plugins register schedules with `SchedulerService.defineSchedule(definition)` and execution targets with `registerTarget()` during provider registration or boot.

  Route scheduled jobs and workers through the application's configured logical queue, with an adapter-neutral schedule store. Keep the upstream queue dependency unmodified and store queue and scheduler timestamps compatibly with their adapters while preserving absolute instants.

  Move queue storage migrations from Scheduler into the queue library, which resolves configured database connections and physical tables. Assemble these sources centrally in app-server for startup and CLI commands, rejecting overlapping active queue tables before execution. Support immutable target parameters, shared migration history and locks, upstream-compatible physical schemas, and read-only execution conditions that leave skipped migrations unapplied.

  Track idempotent occurrences through the target's final outcome, including asynchronous Workflow completion and recovery with stable run references. Target registration returns a completion-reporting handle scoped to that target; long-running executions can report completion without a fixed scheduler observation timeout.

  Provide an authorized, read-only schedule management page and API with paginated schedules, trigger counts, execution history, and separate schedule and execution statuses. Register `pnpm nocobase schedule sync` as a global CLI command and integrate it into all application templates.

  Include application examples for custom task targets and scheduled Workflows, and agent guidance for schedule definition, target selection, asynchronous execution, diagnostics, and recovery.

  Keep the database manifest CLI entry available before compilation so fresh workspace installs link the command required by package builds.

  Declare the OpenTelemetry dependencies referenced by the upstream queue declarations so consumers can typecheck published Server APIs without enabling tracing or skipping library checks.

### Patch Changes

- Updated dependencies [d4ca00e]
- Updated dependencies [365a9fe]
- Updated dependencies [365a9fe]
- Updated dependencies [60fa139]
- Updated dependencies [24e771f]
- Updated dependencies [60fa139]
- Updated dependencies [26ac480]
  - @nocobase/app-client@1.0.0-beta.18
  - @nocobase/app-plugin-authorization@0.2.0-beta.13
  - @nocobase/app-plugin-authentication@0.1.0-beta.17
  - @nocobase/db@1.0.0-beta.9
  - @nocobase/queue@0.1.0-beta.5
  - @nocobase/app-server@1.0.0-beta.18
  - @nocobase/i18n@1.0.0-beta.4
  - @nocobase/service-provider@0.0.2-beta.1
  - @nocobase/nb3-cli@1.0.0-beta.9

## 0.0.1

### Patch Changes

- Add code-defined Cron schedules, transactional Database Queue projection,
  target registries, occurrence history, manifest synchronization, and a
  read-only management interface.
