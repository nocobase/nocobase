# @nocobase/app-plugin-notification-in-app

## 1.0.0-beta.22

### Minor Changes

- bc1e83f: Add `@nocobase/app-plugin-notification-in-app/client/inbox`, React Query hooks for an application that renders its own inbox: `inboxKeys`, `useInboxItems(pageSize)` (paged by `nextPageToken`), `useInboxUnreadCount()`, `useInboxActions()` (`mark(id, action)` and `readAll()`, applied to the cached list and count at once, restored if the server refuses and refetched once settled) and `useInboxRefresh(extraTopics)` (refetch on the realtime signal, reconnection, window focus and further topics). `@tanstack/react-query` is now a peer dependency; the application templates already provide it.

### Patch Changes

- bc1e83f: Name the command-line commands of users, API keys and the in-app inbox. The routes carry `x-cli` hints: `user list|create|update|delete|enable|disable|reset-password|revoke-sessions|options|role-scope set|invitation …|preference …` (the invitation link's `lookup` and `accept` stay off the command line), `api-key list|create|rotate|delete|scope-options|scope-objects`, and `inbox list|delete|mark-read|mark-unread|mark-all-read|unread-count`.
- be0fbbd: Client code merges class names with the `cn` package instead of `clsx` and `tailwind-merge`, so the plugins declare `cn` as a peer dependency in their place. The application templates provide it; an application that does not declare `cn` yet adds it to its `devDependencies`, or the client build cannot resolve these plugins. The AI employee registry item `nocobase-ai` lists `cn` instead of `clsx` and `tailwind-merge`, and the authentication plugin drops the two unused development dependencies.
- bc1e83f: Describe dev pages as rendered inside the application shell at their `/dev/...` paths with no navigation or header entry, opened by URL, now that the templates no longer have a separate Dev tools layout.
- Updated dependencies [37c8d20]
- Updated dependencies [37c8d20]
- Updated dependencies [37c8d20]
- Updated dependencies [bc1e83f]
- Updated dependencies [bc1e83f]
- Updated dependencies [bc1e83f]
- Updated dependencies [bc1e83f]
- Updated dependencies [37c8d20]
- Updated dependencies [37c8d20]
- Updated dependencies [37c8d20]
- Updated dependencies [37c8d20]
- Updated dependencies [37c8d20]
- Updated dependencies [37c8d20]
- Updated dependencies [bc1e83f]
- Updated dependencies [be0fbbd]
- Updated dependencies [bc1e83f]
- Updated dependencies [6993158]
- Updated dependencies [a6796d9]
- Updated dependencies [37c8d20]
- Updated dependencies [37c8d20]
- Updated dependencies [bc1e83f]
- Updated dependencies [37c8d20]
- Updated dependencies [37c8d20]
- Updated dependencies [37c8d20]
- Updated dependencies [37c8d20]
  - @nocobase/app-client@2.0.0-beta.1
  - @nocobase/app-server@2.0.0-beta.1
  - @nocobase/app-plugin-authentication@2.0.0-beta.1
  - @nocobase/app-plugin-notification@1.0.0-beta.23
  - @nocobase/db@1.0.0-beta.18
  - @nocobase/i18n@1.0.0-beta.5
  - @nocobase/service-provider@0.0.2-beta.1

## 1.0.0-beta.21

### Patch Changes

- e123790: Move `@nocobase/app-server`, `@nocobase/app-client`, `@nocobase/app-plugin-authentication`, `@nocobase/app-plugin-users`, `@nocobase/app-plugin-hub`, `@nocobase/app-plugin-workflow` and `@nocobase/app-plugin-ai-employee` to the 2.0.0 prerelease line. The HTTP API migration released in 1.0.0-beta.N changed every route and the error body, but in prerelease mode a `major` changeset on a version that is already a `1.0.0` prerelease only increments the prerelease number, so nothing in the version said the change was breaking. These packages now release as `2.0.0-beta.0`, and every package that depends on or peers with one of them is released again so that its published range is `^2.0.0-beta.0` rather than a `^1.0.0-beta` range the new versions do not satisfy. An application upgrading to these versions upgrades all of them together.
- Updated dependencies [e123790]
  - @nocobase/app-client@2.0.0-beta.0
  - @nocobase/app-plugin-authentication@2.0.0-beta.0
  - @nocobase/app-server@2.0.0-beta.0
  - @nocobase/app-plugin-notification@1.0.0-beta.22

## 1.0.0-beta.20

### Major Changes

- 21d274c: Workflow, scheduler, i18n and notification routes follow the HTTP API specification: every success is `{ data }` (lists `{ data, meta }`), every failure is the standard error body, and every input is validated, with unknown JSON body fields rejected as 400 `INVALID_INPUT`.

  **Workflow** (domain `workflows`). Runs move under the workflow namespace: `/api/workflow-runs` -> `/api/workflows/runs`, `/api/workflow-runs/{id}` -> `/api/workflows/runs/{runId}`, `/api/workflow-runs/{id}/node-runs[/{nodeRunId}/payload]` -> `/api/workflows/runs/{runId}/nodeRuns[/{nodeRunId}/payload]`. Source previews move from `/api/workflows/by-key/{key}/source[/revisions]` to `/api/workflows/sources/{key}[/revisions]`. `PATCH /api/workflows/{id}/status` is removed (use `POST .../enable` and `.../disable`), and `GET /api/workflows/{id}/runs` is removed (use `GET /api/workflows/runs?workflowId=`). Revision and node-run lists answer `{ data, meta: { page, pageSize, total } }`. `POST /api/workflows/{id}/run` requires `{ input }` and validates the `Event-Key` header; `PUT /api/workflows/{id}/parameters` requires `{ parameterValues }`. A workflow, source, run or node run named by the path that does not exist is 404 (was 400); permission denial is 403 `WORKFLOW_MANAGEMENT_REQUIRED`; an unconfigured service is 503 `WORKFLOW_SERVICE_NOT_CONFIGURED`. Invocation codes are kept as reasons: `WORKFLOW_NOT_FOUND` is 404, `WORKFLOW_DISABLED`, `PARENT_RUN_NOT_FOUND` and `STACK_LIMIT_EXCEEDED` are `FAILED_PRECONDITION`, `INVALID_INPUT` is `INVALID_ARGUMENT` with field violations, and `INPUT_TOO_LARGE` answers 413. Translated text is in `localizedMessage`.

  **Scheduler** (domain `scheduler`). `/api/schedules` -> `/api/scheduler/schedules`, paged by `page` and `pageSize` with `meta: { page, pageSize, total }`. New `GET /api/scheduler/schedules/{scheduleId}`. `GET /api/scheduler/schedules/{scheduleId}/occurrences` is cursor-paged by `pageSize` and `pageToken` with `meta: { nextPageToken }`, replacing the fixed latest-100 list. `POST .../enable` and `.../disable` keep their shape under the new prefix. A caller without access gets 403 `SCHEDULE_ACCESS_REQUIRED` (was `{ error: 'Schedule access is required.' }`), and an unknown schedule id gets 404 `SCHEDULE_NOT_FOUND` (was 500, or an empty occurrence list).

  **i18n** (domain `i18n`). `GET /api/i18n/locales` answers `{ data: { defaultLocale, locales } }`. `POST /api/i18n/locale` -> `PUT /api/i18n/locale`, answering `{ data: { locale, requestedLocale, fallback } }`; an unsupported language still falls back to English successfully. A missing or invalid `locale` is 400 `INVALID_INPUT` with a field violation (was `{ error: 'A locale is required.' }`), in the standard error body even when the router is mounted on its own.

  **Notification** (domain `notifications`). `GET /api/notifications/logs` is cursor-paged (`pageSize`, `pageToken`) and answers `{ data, meta: { nextPageToken } }`; `/api/notifications/logs/:id` is `/api/notifications/logs/{logId}`. `GET /api/notifications/test/targets` -> `GET /api/notifications/testTargets`, `POST /api/notifications/test/send` -> `POST /api/notifications/testSends` (strict `{ channel, values }`, 202), `GET /api/notifications/test/{id}/status` -> `GET /api/notifications/testSends/{testSendId}`. The `{ error: { code, message, ns, key, params } }` body is gone: `reason` carries the former code, `localizedMessage` the translated text and `metadata` its parameters; invalid test fields report `fieldViolations`, and `NOTIFICATION_TEST_FAILED` is 503 `UNAVAILABLE` only when the Channel's transport cannot be reached (the new exported `NotificationTransportUnavailableError`); any other failure of a test send is no longer reported as `NOTIFICATION_TEST_FAILED`. `GET /api/notifications/testTargets` answers `{ data, meta: { total } }`. `NotificationTestApiError` exposes `reason` instead of `code`, `ns`, `key` and `params`, and `NotificationStore.listLogs()` accepts an optional cursor.

  **In-app notification** (domain `notificationInApp`). The inbox moves from `/api/notifications/in-app` to `/api/notificationInApp`: `GET /messages` (`pageSize`, `pageToken`, `unreadOnly` -> `{ data, meta: { nextPageToken } }`, replacing `limit`, `cursor` and `nextCursor`), `GET /messages/unreadCount` -> `{ data: { count } }`, `POST /messages/markAllRead` (was `/read-all`), `POST /messages/{messageId}/markRead` and `/markUnread` and `DELETE /messages/{messageId}` (204), replacing `POST /:id { action }`. Every inbox route runs behind the authentication plugin's `auth.required()` and reads the user only from the Better Auth session: it no longer falls back to, or writes, a `userId` in the NocoBase session, so an inbox request after sign-out or without a session is 401 `UNAUTHENTICATED` with reason `AUTHENTICATION_REQUIRED` in the `authentication` domain. `createInAppRouter(store, options)` requires `options.authenticate`, a middleware that sets `auth`, and `resolveUserId` and `InAppUserIdResolver` are removed. An anonymous request reaching `createInAppRouter` without `auth` is 401 `UNAUTHENTICATED` with reason `IN_APP_NOTIFICATION_AUTHENTICATION_REQUIRED`, `IN_APP_NOTIFICATION_INVALID_CURSOR` is now `IN_APP_NOTIFICATION_INVALID_PAGE_TOKEN`, and the limit, body and action errors are gone. The client helpers take `pageSize` and `pageToken`, return `nextPageToken`, and `mutateInboxItem` deletes with `DELETE`.

  The application templates' tests follow the new locale and inbox response shapes.

- 21d274c: The in-app inbox no longer has a CSRF mechanism of its own. `GET /api/notificationInApp/csrfToken` (previously `GET /api/notifications/in-app/csrf`) and its `notification_in_app_csrf` cookie are removed, writes no longer require an `x-csrf-token` header, and the `IN_APP_NOTIFICATION_INVALID_CSRF` reason is gone. Cross-site writes are rejected by the authentication plugin's origin check instead, which every inbox route already runs through `auth.required()`: a cookie-authenticated write from an untrusted origin answers 403 `PERMISSION_DENIED` with reason `INVALID_CSRF_ORIGIN` in the `authentication` domain. The client helpers no longer request a token or send the header; a client that calls the inbox API directly drops both.

### Patch Changes

- 0b933b3: Declare every hand-written `/api` route of the file, notification, in-app notification, scheduler and Database Explorer plugins in the application's API document at `/api/swagger/docs`, with response schemas and the error statuses each route answers. The file plugin documents the `uploadOne` and `uploadMany` endpoints of each exposure as `multipart/form-data` beside that exposure's data endpoints, under its tag and with operationIds such as `attachmentsUploadOne`. Each file exposure declares the `contentUrl` it adds to every record as a computed field, so the record schema of its data endpoints lists it, read-only, beside the Collection's fields. Route input is now validated through `apiValidator()`, which answers invalid input exactly as before. A route lists `403` only where it checks a permission, so the in-app inbox routes list `401` and `500`; the `400` for invalid input comes from the input validators, and a route that can answer `400` for another reason, such as an invalid page token or cursor or an unavailable test target, declares it with its reasons.
- be0fbbd: Tests in these plugins and example plugins take their fixtures from `@nocobase/app-testing` alone: database fixtures such as `createDatabaseTest()`, `describeMigration()` and `expectCollection()` from `@nocobase/app-testing/server`, and the command runner from `@nocobase/app-testing/cli`. Each package replaces its `@nocobase/db-testing` development dependency with `@nocobase/app-testing`. Nothing any of them ships changes.
- be0fbbd: Database tests in these plugins and example plugins take their database from `@nocobase/db-testing` instead of configuring an in-memory SQLite database, so they run on SQLite by default and on the database `NOCOBASE_TEST_DB_DIALECT` selects otherwise. Schema assertions that read `PRAGMA` output or `sqlite_master` are written with `expectCollection()` against Field and Collection names, migration up and down tests use `describeMigration()`, and the SQLite triggers that made a write fail are replaced by spies on the write. Each package replaces its `@nocobase/db-sqlite` development dependency with `@nocobase/db-testing`; nothing any of them ships changes.
- Updated dependencies [21d274c]
- Updated dependencies [21d274c]
- Updated dependencies [299b35a]
- Updated dependencies [463a7a8]
- Updated dependencies [7e5b7d4]
- Updated dependencies [463a7a8]
- Updated dependencies [21d274c]
- Updated dependencies [be0fbbd]
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
- Updated dependencies [21d274c]
- Updated dependencies [be0fbbd]
- Updated dependencies [0b933b3]
- Updated dependencies [0b933b3]
- Updated dependencies [0b933b3]
- Updated dependencies [be0fbbd]
- Updated dependencies [be0fbbd]
- Updated dependencies [21d274c]
  - @nocobase/app-server@1.0.0-beta.33
  - @nocobase/app-client@1.0.0-beta.25
  - @nocobase/app-plugin-authentication@1.0.0-beta.25
  - @nocobase/db@1.0.0-beta.17
  - @nocobase/app-plugin-notification@1.0.0-beta.21
  - @nocobase/i18n@1.0.0-beta.5
  - @nocobase/service-provider@0.0.2-beta.1

## 0.2.0-beta.19

### Patch Changes

- 9291dbb: Pass `locales` the same way on the client and the server

  `defineClientPlugin`, `defineServerPlugin` and both sides' `defineAppRuntime` now accept the `locales/index.ts` module itself or a function importing it, typed as the new `LocalesContribution` from `@nocobase/i18n`, which also exports `resolveLocalesContribution` to turn either into the module. Previously the client took only the module and the server only a function, so a plugin wired the same file two different ways. The module is the recommended form on both sides: each language in it is already a separate dynamic import, so importing the map statically loads no translations early. Existing `locales: () => import('./locales/index.js')` declarations keep working unchanged. `@nocobase/app-server` exports `AppServerPluginLocales` for the widened type and keeps `AppServerPluginLocalesLoader` as a deprecated alias. The bundled plugins, the application templates' `server/runtime.ts` and plugins generated by `create-plugin` now import their server locales statically.

- Updated dependencies [9291dbb]
- Updated dependencies [9291dbb]
- Updated dependencies [ec4b764]
- Updated dependencies [e77641b]
- Updated dependencies [e77641b]
  - @nocobase/i18n@1.0.0-beta.5
  - @nocobase/app-client@1.0.0-beta.24
  - @nocobase/app-server@1.0.0-beta.32
  - @nocobase/app-plugin-notification@0.1.0-beta.20
  - @nocobase/app-plugin-authentication@1.0.0-beta.24
  - @nocobase/db@1.0.0-beta.16
  - @nocobase/service-provider@0.0.2-beta.1

## 0.2.0-beta.18

### Patch Changes

- c8ddd7d: Consolidate the authorization API. Resource types are either catalog types (`settings`, `composite`, `database.collection`), whose items and actions must be registered, or record types (`page`, `user`, `notification`, `hub.app`, `hub.host`), which declare type-level actions and judge each record; there are no `*` items. Business resources become composite resources, a built-in core mechanism: every Authorization has `authz.compositeResources` (which replaces `authz.business`) and reserves the `composite` resource type, so `businessPlugin()` is gone with no replacement and `resourceTypes.add({ type: 'composite' })` throws; `defineBusinessResource` is `defineCompositeResource`, every `Business*` type is `CompositeResource*` (`CompositeResource`, `CompositeResourceBuilder`, `CompositeResourceActionBuilder`, `CompositeResourceReference`, `CompositeResourceConditions`, `CompositeResourceApi`, `BindableCompositeResourcePermission` and so on) and the grant policy is `{ type: 'composite', scopes }`. Resource types carry no `title`: they are never displayed, and the library holds no translation keys. A composite composes exactly the grants its definition lists, on any type except another composite. A data scope no longer names a `collection`: it targets the one resource its grant actions address (`dataScopeTarget(action, key)`), whose type must declare `recordAccess: true` on `resourceTypes.add`, as `database.collection` does; `define` checks this when the type is registered, and `authz.compositeResources.validate()` and first use check types registered later. The library holds no display concepts. `@nocobase/app-plugin-authorization` provides `authz.ui`, also exposed to plugin setup contexts: `ui.sections.add` for the top-level sections `pages`, `business` and `administration` and one level of subsections (with `extend: true` for a subsection another plugin owns, as workflow owns `automation` and scheduler extends it), `ui.groups.add` for right-side groups, `ui.place(ref, { section, group? })`, and `ui.defaultSection(type, section)`. `pagesPlugin` registers the `pages.page` subsection, the only one the client fills, from its route tree. The client no longer remaps the `@nocobase/authorization` namespace. `authz.settings.add` no longer takes `section`; settings items and composites are placed with `authz.ui.place`, and unplaced ones land in their type's default section "Other". Startup validation runs after every provider has booted and reports unknown subsections and groups, placements of unregistered resources and unfit data scopes, throwing in development and logging a warning in production. A resource holds at most one default-access rule: the table is unique on `(resourceType, resourceId)` as well as `key`, and a second rule raises `DefaultAccessConflictError`, answered with 409. `authorizationToken` is the only service token: `permissionSetsToken` is gone, `authz.db` is now `authz.database`, settings items are registered with `authz.settings.add` and checked with semantic actions, and rule plugins build on `@nocobase/app-plugin-authorization/server/extension`. The client exposes `AuthorizationClient.snapshot/revision/invalidate/onInvalidated` and renamed management components. Every client page route must now declare `authz` (a check or `'skip'`); nothing is inferred from the route name. The authorization migrations and seeds were edited in place, including the new `key` column on default-access rules, so existing databases must be reset and reinstalled. A stored composite grant that no longer expands — an unknown action or data scope, an invalid scope value or policy — is skipped for that grant alone instead of failing every check of the identity: it permits nothing, a direct check of its action denies with `INVALID_GRANT`, and `createAuthorization({ onInvalidGrant })` is told once, which the application plugin logs; `authz.compositeResources.validateGrant` explains a stored grant, and the plugin's startup validation scans every stored Permission Set, throwing in development and warning in production. `authz.database.collections.add` treats a re-registration with the same actions as a no-op even when its title or description differ, keeping the first and reporting a startup warning through `collections.warnings()`; only different actions throw. `authz.resourceTypes.get(type).items.add(item)` remains the generic low-level item registration that `settings.add`, `database.collections.add` and `compositeResources.define` build on.
- Updated dependencies [f6c3cd8]
- Updated dependencies [c8ddd7d]
- Updated dependencies [f3917b6]
- Updated dependencies [d18e964]
- Updated dependencies [0231d46]
  - @nocobase/app-server@1.0.0-beta.26
  - @nocobase/app-client@1.0.0-beta.20
  - @nocobase/app-plugin-authentication@1.0.0-beta.23
  - @nocobase/app-plugin-notification@0.1.0-beta.17

## 0.2.0-beta.17

### Patch Changes

- aec05e1: Improve the notification task example with consistent task forms, server-side pagination, record counts, and responsive inbox error styling.
- Updated dependencies [cda1175]
- Updated dependencies [e286e0d]
- Updated dependencies [4e58fe3]
- Updated dependencies [4e58fe3]
- Updated dependencies [4e58fe3]
- Updated dependencies [4e58fe3]
- Updated dependencies [4e58fe3]
- Updated dependencies [80ef702]
  - @nocobase/app-plugin-authentication@1.0.0-beta.21
  - @nocobase/app-server@1.0.0-beta.25
  - @nocobase/db@1.0.0-beta.15
  - @nocobase/app-plugin-notification@0.1.0-beta.16
  - @nocobase/app-client@1.0.0-beta.19
  - @nocobase/i18n@1.0.0-beta.4
  - @nocobase/service-provider@0.0.2-beta.1

## 0.2.0-beta.16

### Minor Changes

- ffafc2a: Use unique Channel map keys for sending, test sending, runtime isolation and retries. Preserve message types separately in delivery records and reject retries after the original Channel or Provider becomes unavailable. Migrate existing Channel identities and update application configuration and integration guidance.
- ffafc2a: Replace actionUrl with a validated route-or-URL target. Render internal inbox routes through the application Router and full URLs through native links. Add nullable target storage without converting historical links, expose test-send target fields, and include only URL targets in IM messages. Legacy actionUrl values are ignored.
- ffafc2a: Replace notification configuration with named single-Provider Channels and send complete messages through a Channel-keyed map. Validate all messages before enqueueing, deliver native recipients independently, and retain retries bound to the original Channel and Provider. Simplify the test form and remove Provider instance names from delivery records with a new migration.

### Patch Changes

- ffafc2a: Translate missing in-app notification recipient errors in notification logs and add a stable provider error code.
- Updated dependencies [8f1ead4]
- Updated dependencies [77d34b6]
- Updated dependencies [ffafc2a]
- Updated dependencies [ffafc2a]
- Updated dependencies [ffafc2a]
- Updated dependencies [ffafc2a]
- Updated dependencies [ffafc2a]
- Updated dependencies [ffafc2a]
- Updated dependencies [a1a8690]
  - @nocobase/db@1.0.0-beta.14
  - @nocobase/app-server@1.0.0-beta.24
  - @nocobase/app-plugin-notification@0.1.0-beta.15
  - @nocobase/app-plugin-authentication@0.1.0-beta.20

## 0.2.0-beta.15

### Patch Changes

- 709f9ed: Update Better Auth and API keys to 1.7.5 and align fresh authentication databases with provider-based account identity. Existing authentication databases must be recreated; the original account migration has changed and no compatibility migration is provided.
- d696700: Give every settings surface the token that matches what it is, so panels stop disagreeing with one another.

  The permission set editor is where this shows: its two tabs sit in one panel, and the permission configuration tab painted itself `bg-background` while the assignment tab inherited the panel's `bg-card`, so switching tabs changed the page colour under the same heading. The same mistake is spread across the settings pages, and none of it is visible under a preset whose page and card are near-identical.

  Each token names a layer rather than a shade, and every site now uses the one that describes it. A panel resting on the page is `bg-card`, which is what the AI tools and skills pages already used while the LLM service, MCP service, conversation, API key, user and notification log panels named the page surface instead — two lists in one plugin, one framed and one flat. A dialog or drawer is `bg-popover`, which is what the shared `Sheet`, `Dialog` and `Popover` primitives use and what six hand-rolled drawers and dialogs did not. An opaque sticky header, footer or table head names the surface it scrolls within rather than the page behind it. A form control names no surface at all and inherits the one it sits on, the way the shared `Input` and `Textarea` do with `bg-transparent`; twenty hand-rolled inputs, selects and text areas were pinned to the page colour and showed through as a differently coloured box inside every card.

  The styling reference now states which token describes which layer, and why picking one because it happens to look right is what puts a page-coloured block inside a panel.

- Updated dependencies [709f9ed]
- Updated dependencies [fa01814]
- Updated dependencies [ca3188e]
- Updated dependencies [38e5253]
- Updated dependencies [fa01814]
- Updated dependencies [7bde7bd]
- Updated dependencies [5380642]
- Updated dependencies [3187ace]
- Updated dependencies [d4783c2]
- Updated dependencies [d696700]
- Updated dependencies [5380642]
- Updated dependencies [c5f4438]
- Updated dependencies [3187ace]
- Updated dependencies [38e5253]
- Updated dependencies [38e5253]
  - @nocobase/app-plugin-authentication@0.1.0-beta.20
  - @nocobase/db@1.0.0-beta.13
  - @nocobase/app-server@1.0.0-beta.23
  - @nocobase/app-plugin-notification@0.1.0-beta.14
  - @nocobase/app-client@1.0.0-beta.19
  - @nocobase/i18n@1.0.0-beta.4
  - @nocobase/service-provider@0.0.2-beta.1

## 0.2.0-beta.14

### Patch Changes

- 78e3c42: Migrate inbox timestamps to timezone-aware datetime fields so stored UTC notifications can be read and marked as read without temporal validation errors.

  Validate recipient existence at final in-app delivery and reject missing users with a non-retryable recipient error. Custom database Provider factories must supply a recipient existence resolver.

  Show an end-of-list message when the inbox has no more notifications to load.

  Load the next inbox page automatically near the bottom, with duplicate-request protection and cancellation when filters or refreshed data change.

  Keep the channel badge aligned with the title and collapse long message bodies to three lines with expand and collapse controls.

- Updated dependencies [e0c4b3d]
- Updated dependencies [e13ed84]
- Updated dependencies [e13ed84]
- Updated dependencies [e13ed84]
- Updated dependencies [00362cf]
- Updated dependencies [e13ed84]
- Updated dependencies [e13ed84]
  - @nocobase/db@1.0.0-beta.10
  - @nocobase/app-server@1.0.0-beta.19
  - @nocobase/app-plugin-authentication@0.1.0-beta.18
  - @nocobase/app-plugin-notification@0.1.0-beta.12
  - @nocobase/app-client@1.0.0-beta.18
  - @nocobase/i18n@1.0.0-beta.4
  - @nocobase/service-provider@0.0.2-beta.1

## 0.2.0-beta.13

### Patch Changes

- d4ca00e: Clarify React API client access through useApiClient and retain explicit client resolution for non-React code in application and inbox Skills.
- 365a9fe: Complete English and Chinese translations for authentication, route feedback, authorization, shared controls, File and Notification Registry components, and development examples. Use concise semantic keys consistently for the new translations. Resolve AI Registry copy from the active language and localize development navigation and section headings. Translate MCP configuration guidance, tool drawer labels, and transport descriptions.
- d4ca00e: Use useApiClient() for React API client access across application pages, plugins and shared examples, preserving application-scoped client resolution.
- Updated dependencies [d4ca00e]
- Updated dependencies [365a9fe]
- Updated dependencies [60fa139]
- Updated dependencies [24e771f]
- Updated dependencies [60fa139]
- Updated dependencies [26ac480]
- Updated dependencies [d4ca00e]
- Updated dependencies [d4ca00e]
  - @nocobase/app-client@1.0.0-beta.18
  - @nocobase/app-plugin-notification@0.1.0-beta.11
  - @nocobase/app-plugin-authentication@0.1.0-beta.17
  - @nocobase/db@1.0.0-beta.9
  - @nocobase/app-server@1.0.0-beta.18
  - @nocobase/i18n@1.0.0-beta.4
  - @nocobase/service-provider@0.0.2-beta.1

## 0.2.0-beta.12

### Patch Changes

- 9131230: Use plugin-owned PageContainer and PageHeader components to unify AI component demo and in-app inbox page layouts.

## 0.2.0-beta.11

### Patch Changes

- a60decd: Require an explicit absolute baseDir for Server plugins and resolve migrations, seeds, jobs, and package metadata from the loaded plugin copy. Generate and validate database task manifests during builds so TypeScript and JavaScript share source checksums, with verified legacy JavaScript history conversion and synchronized plugin scaffolding and application templates.
- Updated dependencies [63db898]
- Updated dependencies [63db898]
- Updated dependencies [63db898]
- Updated dependencies [63db898]
- Updated dependencies [a60decd]
- Updated dependencies [1a85a86]
- Updated dependencies [1a85a86]
- Updated dependencies [1c70f60]
- Updated dependencies [63db898]
  - @nocobase/app-server@1.0.0-beta.15
  - @nocobase/db@1.0.0-beta.7
  - @nocobase/app-plugin-notification@0.1.0-beta.9
  - @nocobase/app-plugin-authentication@0.1.0-beta.14
  - @nocobase/app-client@1.0.0-beta.16
  - @nocobase/i18n@1.0.0-beta.4
  - @nocobase/service-provider@0.0.2-beta.1

## 0.2.0-beta.10

### Patch Changes

- 154e09e: Treat a credential Better Auth refuses — an expired or revoked API key — as not signed in when resolving the caller, instead of failing the request.
- Updated dependencies [154e09e]
- Updated dependencies [154e09e]
- Updated dependencies [c01baf6]
  - @nocobase/app-plugin-authentication@0.1.0-beta.12
  - @nocobase/i18n@1.0.0-beta.4
  - @nocobase/app-client@1.0.0-beta.15
  - @nocobase/app-server@1.0.0-beta.13

## 0.2.0-beta.9

### Patch Changes

- ceb356b: Fix published package metadata and database test driver registration.
- Updated dependencies [ceb356b]
- Updated dependencies [f17f3a6]
- Updated dependencies [f17f3a6]
- Updated dependencies [f17f3a6]
- Updated dependencies [43d25b4]
- Updated dependencies [ceb356b]
- Updated dependencies [ceb356b]
- Updated dependencies [ceb356b]
- Updated dependencies [ceb356b]
- Updated dependencies [ceb356b]
- Updated dependencies [40e2d49]
- Updated dependencies [ceb356b]
- Updated dependencies [ceb356b]
- Updated dependencies [ceb356b]
- Updated dependencies [ceb356b]
- Updated dependencies [590861e]
- Updated dependencies [e11b855]
- Updated dependencies [72ed008]
- Updated dependencies [ceb356b]
- Updated dependencies [ceb356b]
- Updated dependencies [ceb356b]
- Updated dependencies [ceb356b]
- Updated dependencies [e11b855]
- Updated dependencies [ceb356b]
- Updated dependencies [e11b855]
- Updated dependencies [ceb356b]
- Updated dependencies [40e2d49]
- Updated dependencies [590861e]
- Updated dependencies [ceb356b]
- Updated dependencies [c960d07]
- Updated dependencies [c960d07]
- Updated dependencies [c960d07]
- Updated dependencies [c960d07]
- Updated dependencies [c960d07]
- Updated dependencies [c960d07]
- Updated dependencies [c960d07]
- Updated dependencies [c960d07]
- Updated dependencies [c960d07]
- Updated dependencies [c960d07]
- Updated dependencies [c960d07]
- Updated dependencies [c960d07]
- Updated dependencies [ceb356b]
- Updated dependencies [ceb356b]
- Updated dependencies [c960d07]
- Updated dependencies [c960d07]
- Updated dependencies [ceb356b]
- Updated dependencies [ceb356b]
- Updated dependencies [ceb356b]
  - @nocobase/app-server@1.0.0-beta.11
  - @nocobase/app-client@1.0.0-beta.14
  - @nocobase/app-plugin-notification@0.1.0-beta.8
  - @nocobase/app-plugin-authentication@0.1.0-beta.11
  - @nocobase/db@1.0.0-beta.5

## 0.2.0-beta.8

### Patch Changes

- adedf9c: Use a database-side count for unread in-app notifications instead of loading all matching rows.
- 426bd48: Remove logical IM `target` recipients and make `send().to` optional so Webhook Providers can be selected directly by Provider name or fan-out strategy.
- Updated dependencies [a009e2d]
- Updated dependencies [426bd48]
  - @nocobase/app-server@1.0.0-beta.10
  - @nocobase/app-client@1.0.0-beta.13
  - @nocobase/i18n@1.0.0-beta.3
  - @nocobase/app-plugin-notification@0.1.0-beta.7

## 0.2.0-beta.7

### Minor Changes

- 0a3fa83: Ship package changelogs, return stable localized error envelopes for notification-owned failures, and show user-facing Channel and Provider labels in notification logs.

### Patch Changes

- 0a3fa83: Require stable send idempotency keys, expose ordered notification status observation and reason-required Delivery retry APIs, persist inferred retry resolutions and Provider idempotency windows, and declare built-in Provider idempotency capabilities.
- 0a3fa83: Always show the notification test action, use user-facing delivery method labels, and enforce its permission only when a test message is submitted.
- Updated dependencies [e3fa827]
- Updated dependencies [0a3fa83]
- Updated dependencies [c3e02bf]
- Updated dependencies [0a3fa83]
- Updated dependencies [0a3fa83]
- Updated dependencies [1d042c0]
- Updated dependencies [0a3fa83]
  - @nocobase/app-server@1.0.0-beta.9
  - @nocobase/app-plugin-authentication@0.1.0-beta.10
  - @nocobase/app-plugin-notification@0.1.0-beta.6
  - @nocobase/app-client@1.0.0-beta.12
  - @nocobase/db@1.0.0-beta.4

## 0.2.0-beta.6

### Patch Changes

- 52d1107: Resolve the shared UI packages through the workspace catalog: `@base-ui/react`, `class-variance-authority`, `clsx`, `lucide-react`, `shadcn`, `tailwind-merge`, and `tw-animate-css`.

  Every package already agreed on one version for each of these — the catalog is what keeps them agreeing. A range edited in one manifest and not the others would otherwise put two copies of a UI primitive into an application's bundle, which is the kind of drift nothing reports until a component behaves differently depending on which plugin rendered it.

  Peer dependencies use `catalog:` too. `pnpm pack` resolves it before publishing, so a consumer still reads an ordinary range.

- 52d1107: Declare the packages each plugin's browser code imports as peer dependencies, so an application that installs the plugin can resolve them while a server deployment installs none of them.

  A plugin's `client/` is not bundled by the plugin: `build` is `tsc`, so `dist/client/*.js` keeps its bare imports and the consuming application's Vite build resolves them. That application has only what the published manifest declares, and npm does not publish `devDependencies` — so a client import declared only there fails with `Could not resolve "…"`. `sonner` and `@xyflow/react` both shipped that way. Ten of these plugins appeared to work only because `app-template-default` happened to declare the same package for its own use; `@nocobase/app-plugin-hub`'s CodeMirror imports had no such coincidence and were unresolvable wherever it was installed.

  Peer dependencies are what satisfy both sides. An application installs one shared copy, and a deployment — which sets `autoInstallPeers: false` — installs none, so packages a server never requires stay out of it. Each keeps a matching devDependency so the workspace still resolves it and the version used here stays pinned. None is marked `optional`: an optional peer is not auto-installed anywhere, including in the application that needs it.

  `create-plugin` emits the same shape and its generated `AGENTS.md` teaches it, so a plugin created tomorrow declares its browser packages as peers rather than repeating the mistake.

- 52d1107: Declare each peer dependency once, dropping the devDependency that used to accompany it.

  The pairing was required on the grounds that a peer range is wide enough for development to drift off this repository's copy. It is not: pnpm installs a peer and links it into the plugin's own `node_modules`, resolving `workspace:^` to the same package `workspace:*` would. A plugin with the devDependency removed still links, typechecks, builds, and tests against it — verified against a clean install with every plugin's `node_modules` deleted first.

  What remained was a second declaration that changed nothing and had to be kept in step with the first. `pnpm peers:check` no longer asks for it, and `create-plugin` no longer emits it.

- Updated dependencies [52d1107]
- Updated dependencies [52d1107]
- Updated dependencies [52d1107]
  - @nocobase/app-plugin-authentication@0.1.0-beta.9
  - @nocobase/app-plugin-notification@0.1.0-beta.5

## 0.2.0-beta.5

### Patch Changes

- 90a4903: Replace the composite application transport with application-owned `ApiClient` and `RealtimeClient` services. Client plugins, examples, and application templates now use object-style HTTP request options through the shared API client, while realtime subscriptions resolve their dedicated WebSocket client.
- 90a4903: Preserve configured API and realtime endpoints after splitting the client services. Integrate file inventory and the plugin-owned inbox with the shared API and realtime clients, including reconnection refresh and isolated event listeners.

  Allow the Oracle driver install script in both templates’ standalone deployment workspace settings.

  Resolve SQLite auto-incrementing bigint metadata correctly, narrow Oracle LOB values before reading their type, preserve legacy file timestamps, and rebuild the AI registry against the current API client.

- Updated dependencies [90a4903]
- Updated dependencies [90a4903]
- Updated dependencies [90a4903]
- Updated dependencies [90a4903]
- Updated dependencies [90a4903]
- Updated dependencies [90a4903]
- Updated dependencies [90a4903]
- Updated dependencies [90a4903]
- Updated dependencies [90a4903]
- Updated dependencies [90a4903]
- Updated dependencies [90a4903]
- Updated dependencies [90a4903]
- Updated dependencies [90a4903]
- Updated dependencies [90a4903]
- Updated dependencies [90a4903]
- Updated dependencies [90a4903]
- Updated dependencies [90a4903]
- Updated dependencies [90a4903]
- Updated dependencies [90a4903]
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
- Updated dependencies [90a4903]
- Updated dependencies [90a4903]
- Updated dependencies [90a4903]
- Updated dependencies [90a4903]
- Updated dependencies [90a4903]
- Updated dependencies [90a4903]
- Updated dependencies [90a4903]
- Updated dependencies [90a4903]
- Updated dependencies [90a4903]
- Updated dependencies [90a4903]
- Updated dependencies [90a4903]
- Updated dependencies [90a4903]
- Updated dependencies [90a4903]
- Updated dependencies [90a4903]
- Updated dependencies [90a4903]
- Updated dependencies [90a4903]
- Updated dependencies [90a4903]
- Updated dependencies [90a4903]
- Updated dependencies [90a4903]
- Updated dependencies [90a4903]
- Updated dependencies [90a4903]
  - @nocobase/db@1.0.0-beta.3
  - @nocobase/app-server@1.0.0-beta.7
  - @nocobase/app-client@1.0.0-beta.10
  - @nocobase/app-plugin-authentication@0.1.0-beta.7
  - @nocobase/app-plugin-notification@0.1.0-beta.4

## 0.2.0-beta.4

### Minor Changes

- cee3251: Add authenticated realtime subscriptions, refresh their identity after authentication changes, and invalidate in-app notification state through user-scoped events.

### Patch Changes

- Updated dependencies [8d88ff4]
- Updated dependencies [813da59]
- Updated dependencies [cee3251]
  - @nocobase/app-server@1.0.0-beta.6
  - @nocobase/i18n@1.0.0-beta.2
  - @nocobase/app-plugin-authentication@0.1.0-beta.6
  - @nocobase/app-plugin-notification@0.1.0-beta.3
  - @nocobase/db@1.0.0-beta.2
  - @nocobase/service-provider@0.0.2-beta.1

## Unreleased

### Minor Changes

- Add the in-app test adapter with authenticated-user defaulting, keep the inbox
  API available when the core notification Server plugin is not registered,
  and fail fast when the required database service is missing. The package
  still requires the core package for its shared extension contracts.
- Move the inbox component example into the plugin-owned Client runtime and
  expose it at the development-only `/dev/notification-in-app` route.

## 0.2.0-beta.3

### Minor Changes

- 1527426: Declare identity-sensitive runtime packages as peer dependencies of every plugin.

  A plugin used to list `@nocobase/app-server`, `@nocobase/db`, `@nocobase/service-provider`, `@nocobase/i18n`, `@nocobase/queue`, `@nocobase/app-portal-sdk`, and the plugins it builds on among its `dependencies`. Each of these carries state that only works while exactly one copy of the module exists in the process: `ServiceContainer` keys its bindings by the token object itself, React contexts match only the provider created from the same module, and `@nocobase/queue` registers job classes into a global `Locator`. A `dependencies` range lets a package manager install a second copy to satisfy it, which splits that state.

  The monorepo could never show the problem, because `workspace:` links every consumer to one directory. It appears once a plugin is installed from a registry into an application, and it appears at runtime rather than at install time: a service that is registered reports `Service "..." is not registered`, or a context reads `undefined` under a mounted provider.

  Each of these packages is now a peer dependency paired with a devDependency. The peer is the published contract that makes the installing application provide the single copy; the devDependency pins this repository's copy for development and tests, which the deliberately wide peer range does not. Applications built from the templates are unaffected — they already install every one of these packages directly, which is what satisfies the new peer ranges.

  `pnpm plugin:create` generates the same shape, and `pnpm peers:check` enforces it in CI.

### Patch Changes

- 174eab5: Correct the `@nocobase/app-portal-sdk` range these Registry recipes declare. It named `^2.0.0`, a version the v3 package never had, so installing one of these recipes into an application could not resolve the dependency it needs for its v2 API calls.
- c64802c: Harden notification packaging, Provider error redaction, in-app pagination and input validation, migration coverage, Agent Skill safety, localization, and production demo-route defaults.
- Updated dependencies [174eab5]
- Updated dependencies [c64802c]
- Updated dependencies [1527426]
- Updated dependencies [174eab5]
- Updated dependencies [174eab5]
- Updated dependencies [c64802c]
  - @nocobase/app-server@1.0.0-beta.4
  - @nocobase/app-plugin-authentication@0.1.0-beta.5
  - @nocobase/app-plugin-notification@0.1.0-beta.2
  - @nocobase/db@1.0.0-beta.2
  - @nocobase/service-provider@0.0.2-beta.1

## 0.2.0-beta.2

### Minor Changes

- ac3f033: Export every server plugin from its package's `./server` entry point, and update application composition, plugin discovery, and generated plugins to use the unified entry point.

### Patch Changes

- fb1a752: Unify Client and Server application composition around the explicit `serviceProviders` contribution and rename Client React tree contributions to `reactProviders`.

  Replace Client bootstrap modules with application-owned ServiceProvider lifecycle hooks, make the default Client start through `ClientApplication` and render through the Browser host, and update built-in plugins and runtime inspection to the new static contribution protocol.

- Updated dependencies [948304d]
- Updated dependencies [78cf0a2]
- Updated dependencies [ac3f033]
- Updated dependencies [fb1a752]
- Updated dependencies [ac3f033]
- Updated dependencies [78cf0a2]
- Updated dependencies [fb1a752]
- Updated dependencies [fb1a752]
  - @nocobase/app-server-kit@0.1.0-beta.3
  - @nocobase/app-plugin-authentication@0.1.0-beta.4
  - @nocobase/app-plugin-notification@0.1.0-beta.1
  - @nocobase/session@0.1.0-beta.2
  - @nocobase/service-provider@0.0.2-beta.1

## 0.1.1-beta.1

### Patch Changes

- 7cdffbd: Replace separate API and root route arrays with one ordered `routes` contribution array. Route factories now receive the Application, create and return their own Hono router, and are mounted automatically at `/api` or the application root according to their definition.

  Standardize plugin server modules around `providers/index.ts` and `routes/index.ts` collection entries, `services/` domain implementations, and a stable `tokens.ts` public contract.

  Generated plugins now declare conventional database and queue contribution directories by default. Missing optional directories are ignored until executable migrations, seeds, or jobs are added.

  Generated plugins now include an App-facing starter Agent Skill under the package's `skills/` directory. Plugin registration and skill synchronization copy these package-owned Skills into registered applications' `.agents/skills/` directories.

  Unify Client page contributions behind one `routes` loader. Plugins now use `defineAppRoutes()` and `defineSettingsRoutes()` to add child Routes to the application's two built-in Client Routes, mirroring how Server plugins use `defineRootRoutes()` and `defineApiRoutes()` with the built-in Hono routers.

- 7cdffbd: Add explicit `server/plugin.ts` definitions for Providers, API routes, root routes, database sources, and queue jobs. Register routes in a dedicated Application phase after Provider boot, add reusable HTTP and runtime composition helpers to their owning packages, and remove the default template's duplicate runtime layer and legacy plugin discovery contract.
- Updated dependencies [b049266]
- Updated dependencies [7cdffbd]
- Updated dependencies [7cdffbd]
- Updated dependencies [7cdffbd]
- Updated dependencies [ce4eab8]
- Updated dependencies [7cdffbd]
- Updated dependencies [7cdffbd]
- Updated dependencies [7cdffbd]
- Updated dependencies [8438765]
- Updated dependencies [7cdffbd]
- Updated dependencies [7cdffbd]
  - @nocobase/app-server-kit@0.1.0-beta.2
  - @nocobase/app-plugin-authentication@0.1.0-beta.3
  - @nocobase/service-provider@0.0.2-beta.0
  - @nocobase/session@0.1.0-beta.1
  - @nocobase/app-plugin-notification@0.0.2-beta.0
  - @nocobase/app-database@0.0.1-beta.1

## 0.1.1-beta.0

### Patch Changes

- Updated dependencies [c8f38c8]
- Updated dependencies [1a9732a]
  - @nocobase/app-plugin-authentication@0.1.0-beta.2

## 0.1.0

### Minor Changes

- 934d246: Add the in-app notification channel and database provider.
