# @nocobase/app-plugin-authz-default-access

## 1.0.0-beta.9

### Patch Changes

- e123790: Move `@nocobase/app-server`, `@nocobase/app-client`, `@nocobase/app-plugin-authentication`, `@nocobase/app-plugin-users`, `@nocobase/app-plugin-hub`, `@nocobase/app-plugin-workflow` and `@nocobase/app-plugin-ai-employee` to the 2.0.0 prerelease line. The HTTP API migration released in 1.0.0-beta.N changed every route and the error body, but in prerelease mode a `major` changeset on a version that is already a `1.0.0` prerelease only increments the prerelease number, so nothing in the version said the change was breaking. These packages now release as `2.0.0-beta.0`, and every package that depends on or peers with one of them is released again so that its published range is `^2.0.0-beta.0` rather than a `^1.0.0-beta` range the new versions do not satisfy. An application upgrading to these versions upgrades all of them together.
- Updated dependencies [e123790]
  - @nocobase/app-client@2.0.0-beta.0
  - @nocobase/app-plugin-authentication@2.0.0-beta.0
  - @nocobase/app-server@2.0.0-beta.0
  - @nocobase/app-plugin-authorization@1.0.0-beta.24

## 1.0.0-beta.8

### Major Changes

- 21d274c: The users, authentication and authorization HTTP APIs follow the HTTP API specification: camelCase paths, standard methods, validated input and the standard error body. Every route checks permission before it validates the request, every JSON body is a strict schema that rejects unknown fields with `400 INVALID_ARGUMENT` and reason `INVALID_INPUT`, and every failure is `{ error: { code, status, reason, domain, message, requestId } }`. Clients branch on `ApiClientError.reason`.

  Users (`/api/users`):

  - `GET /users?search=` is now `GET /users?q=`, and answers `{ data: [...], meta: { page, pageSize, total } }` instead of `{ data: { items, page, pageSize, total } }`. `UsersClient.list()` still returns `{ items, page, pageSize, total }` and takes `q` instead of `search`.
  - `DELETE /users/:userId` with body `{ confirm: true }` is now `DELETE /users/:userId?confirm=true`, answering `204` with no body; deleting a user who no longer exists answers `404 USER_NOT_FOUND`.
  - `PUT /users/:userId/role-scopes/:scope` is now `PUT /users/:userId/roleScopes/:scope`.
  - `POST /users/:userId/reset-password` is now `POST /users/:userId/resetPassword`, and `POST /users/:userId/revoke-sessions` is now `POST /users/:userId/revokeSessions`; both answer `204` instead of `{ data: { success: true } }`.
  - Errors: `USER_NOT_FOUND` is `404 NOT_FOUND`; `SELF_DELETE_NOT_ALLOWED`, `USER_DELETION_NOT_CONFIGURED`, `PROTECTED_ROLE_ASSIGNMENT` and a role scope's `UserRoleScopeError` with status `409` (such as Hub's `HUB_ADMIN_REQUIRED` and `USER_HAS_APPS`) are `400 FAILED_PRECONDITION` with domain `users`; `LAST_ASSIGNMENT` is `400 FAILED_PRECONDITION` with domain `authorization` instead of `409`; `USER_EMAIL_CONFLICT`, `USER_USERNAME_CONFLICT` and `USER_IDENTITY_CONFLICT` are `409 ALREADY_EXISTS` and `PASSWORD_TOO_SHORT` and `PASSWORD_TOO_LONG` are `400 INVALID_ARGUMENT`, all with domain `authentication`; a role scope named in a request body or filter that does not exist is `400 ROLE_SCOPE_NOT_FOUND`. `INVALID_USER_INPUT` is replaced by `INVALID_INPUT`. The users page no longer shows a server's `message`.

  Authentication: a cookie-bearing write from an untrusted origin answers `403 PERMISSION_DENIED`, reason `INVALID_CSRF_ORIGIN`, domain `authentication`, instead of `{ code: 'INVALID_CSRF_ORIGIN' }`. `/api/auth/*` is unchanged. The API key documentation describes a rejected key in the standard error body.

  Authorization (`/api/authz` is now `/api/authorization`):

  - `/authz/permissions` → `/authorization/permissions`.
  - `/authz/permission-sets[...]` → `/authorization/permissionSets[...]`; `PUT /permission-sets/:key` → `PATCH /permissionSets/:key`, which changes only the fields it names (`title: null` clears the title); `DELETE /permission-sets/:key/assignments/:id` → `DELETE /permissionSets/:key/assignments/:assignmentId`.
  - `GET /authz/permission-sets/effective/:type/:id` → `GET /authorization/permissionSets?subjectType=:type&subjectId=:id`.
  - `POST /authz/inspector/decision` → `POST /authorization/inspector/decide`; `POST /authz/inspector/batch` → `POST /authorization/inspector/batchDecide`; `POST /authz/inspector/configured` with `{ subject }` → `GET /authorization/inspector/configuredAccess?subjectType=&subjectId=`.
  - `GET <surface>/subjects/:type?search=` → `?q=`, answering `{ data: [...], meta: { page, pageSize, total } }` instead of `{ data: { items, total } }`; `pageSize` defaults to 20 instead of 30. `AuthorizationClient.listSubjects()` still returns `{ items, total }`.
  - `GET <rule>/records/:collection` no longer decodes the collection name a second time. It pages by `page` and `pageSize` (default 20, at most 100) and answers `{ data, meta: { page, pageSize, total } }` instead of silently truncating at 100 records, and a name the database holds no Collection for is `404 COLLECTION_NOT_FOUND` instead of an empty list. The settings pages' record pickers request the first page of 100.
  - `GET /permissionSets`, `GET /permissionSets/:key/assignments` and each `GET /<rule>` answer `{ data, meta: { total } }`.
  - A rule create or rename to a key another rule of the same plugin already uses is `409 ALREADY_EXISTS` with reason `RULE_ALREADY_EXISTS` and `metadata.key`, checked before the write and mapped from the unique index, instead of an opaque `500`. A rule key may not be `options`, `subjects` or `records`, the fixed segments beside `/<rule>/:key`, and a sharing or restriction rule may not list a subject twice; both are `400 INVALID_INPUT` with a field violation on `key` or the repeated `subjects.<index>`. `INVALID_AUTHORIZATION_INPUT` for a rule the registered model refuses names the offending field, such as `resource.id` or `actions.0.scopeKey`, in `fieldViolations`.
  - The rule plugins are served at `/api/authorization/defaultAccess`, `/api/authorization/sharingRules` and `/api/authorization/restrictionRules` instead of `/api/authz/default-access`, `/api/authz/sharing-rules` and `/api/authz/restriction-rules`; `PUT /<rule>/:key` → `PATCH /<rule>/:key`, which changes only the fields it names; deleting an unknown rule answers `404 RULE_NOT_FOUND` instead of `204`. Their settings item ids, such as `authorization.sharing-rules`, are unchanged.
  - Errors, all with domain `authorization`: `PROTECTED_PERMISSION_SET` is `400 FAILED_PRECONDITION` instead of `403`; `PERMISSION_SET_SUBJECT_NOT_ALLOWED` is `400 INVALID_ARGUMENT` instead of `403`; `LAST_ASSIGNMENT` is `400 FAILED_PRECONDITION` instead of `409`; `PERMISSION_SET_CONFLICT` and `DEFAULT_ACCESS_CONFLICT` are `409 ALREADY_EXISTS` (the latter with `metadata.existing`); `PERMISSION_SET_NOT_FOUND`, `ASSIGNMENT_NOT_FOUND`, `UNKNOWN_SUBJECT_TYPE` and `RULE_NOT_FOUND` are `404 NOT_FOUND`. `INVALID_PAGINATION` and `INVALID_SUBJECT_IDS`, and the inspector's `INVALID_AUTHORIZATION_INPUT` for a malformed body, are replaced by `INVALID_INPUT`; `INVALID_AUTHORIZATION_INPUT` remains for a grant or rule the registered model does not accept. Listing the assignments of an unknown Permission Set answers `404`.
  - Repository endpoints guarded by `authz.database.authorizeRepository()` are matched as `POST /{name}/{action}`, and a refused one answers `403 PERMISSION_DENIED` with reason `AUTHORIZATION_DENIED` instead of `{ code: 'FORBIDDEN' }`.
  - `@nocobase/app-plugin-authorization/server/extension`: `createRuleSupportRoutes(authz, rule)` is now `createRuleSupportRoutes(authz, { path, settings })`, so a rule's camelCase route prefix and its settings item id are named separately; `createSettingsRouter(translate?)` takes a translator for a rule plugin's own domain errors and hands everything else to `apiErrorHandler`; new exports `settingsAccess(id, action)` middleware, `toAuthorizationApiError`, `AUTHORIZATION_ERROR_DOMAIN`, `AuthorizationInputError`, `assertRuleKeyAvailable`, `rethrowRuleConflict`, `ruleAlreadyExists`, `RESERVED_RULE_KEYS`, and the zod schemas `DataScopeRuleBody`, `DataScopeRulePatchBody`, `SubjectRuleBody`, `SubjectRulePatchBody`, `RuleParams`, `RuleKeyInput`, `SubjectsInput`, `ReferenceInput`, `TitleInput`, `RecordSelectionInput` and `RuleActionInput`. `validateDataScopeRule` throws `AuthorizationInputError`, a `TypeError` naming the offending field.
  - `@nocobase/authorization` documents that an uncaught `AuthorizationDeniedError` answers the standard error body, and that the application plugin's surface is `/api/authorization`.
  - `permissionSetErrorMessage()` reads `ApiClientError.reason`, and the management pages show a server failure as `errors.requestFailed` instead of its `message`. Client surface names passed to `loadOptions`, `listSubjects`, `useAuthorizationPageData` and `SubjectPicker`'s `settings` are camelCase: `permissionSets`, `inspector`, `defaultAccess`, `sharingRules`, `restrictionRules`.

### Patch Changes

- 0b933b3: The user management routes under `/api/users`, every authorization route under `/api/authorization` (the permission snapshot, Permission Sets, the inspector, and the default-access, sharing-rule and restriction-rule settings) and `GET /api/i18n/locales` are now described in the application's OpenAPI document, with their parameters, response schemas and error statuses, and listed in Swagger UI at `/api/swagger/docs` under the `Users`, `Authorization` and `I18n` tags. `GET /api/i18n/locales` declares `security: []`, because the sign-in page reads it before anyone is signed in. `PUT /api/i18n/locale` is hidden from the document because it only changes the browser's session. Input validation answers exactly as before. Each route lists `403` only where it checks a permission, so `GET /api/authorization/permissions` lists `401` and `500`; the `400` for invalid input comes from the input validators, and a route that can answer `400` for another reason declares it with its reasons, such as `INVALID_AUTHORIZATION_INPUT` on rule create and update, `PROTECTED_PERMISSION_SET` on Permission Set changes, and the password and role-scope reasons on user routes.

  The settings routes behind the `/api/authorization` dispatcher are forwarded at request time, where the document generator cannot see them, so at boot the authorization plugin registers every `authz.routes` registration with the application's API documentation through app-server's generic `addApiRouter()` and `addUndeclaredApiRoute()`. Routes registered through `authz.routes.add(path, createRouteHandler(router))` are documented automatically at their full `/api/authorization/...` path and checked like any other route; declare each route of the router with `describeRoute()`. A handler that is a plain function rather than a `createRouteHandler` router keeps working but cannot be described: the plugin logs a warning naming its path and registers it as an undeclared route, so `findUndeclaredApiRoutes(app)` and `pnpm openapi:check` report it like any route that declares nothing. A route a router declares outside the path its handler is registered under, which the dispatcher never forwards to, is left out of the document, logged, and reported the same way. `documentAuthorizationRoutes(apiDocs, authz.routes, onWarning?)` performs that registration, for a plugin's tests to assert on with `findUndeclaredApiRoutes` and the generated document without starting an application. `createRuleSupportRoutes` accepts an optional `name` for its operation ids, and the extension exports `AUTHORIZATION_API_TAGS`, `documentAuthorizationRoutes` and response schemas such as `SubjectRuleSchema` and `TotalMetaSchema`.

  `AuthorizationRouteRegistry` in `@nocobase/authorization/core` gains `entries()`, which lists every registration with its handler, sorted by path like `list()`.

  The default-access, sharing-rule and restriction-rule plugins no longer declare `hono`, which none of their code imports. The authorization plugin's README describes the rule request bodies as validated through `apiValidator()`.

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
- Updated dependencies [7dbc54b]
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
  - @nocobase/app-plugin-authorization@1.0.0-beta.23
  - @nocobase/authorization@1.0.0-beta.11
  - @nocobase/i18n@1.0.0-beta.5

## 0.1.0-beta.7

### Patch Changes

- 9291dbb: Pass `locales` the same way on the client and the server

  `defineClientPlugin`, `defineServerPlugin` and both sides' `defineAppRuntime` now accept the `locales/index.ts` module itself or a function importing it, typed as the new `LocalesContribution` from `@nocobase/i18n`, which also exports `resolveLocalesContribution` to turn either into the module. Previously the client took only the module and the server only a function, so a plugin wired the same file two different ways. The module is the recommended form on both sides: each language in it is already a separate dynamic import, so importing the map statically loads no translations early. Existing `locales: () => import('./locales/index.js')` declarations keep working unchanged. `@nocobase/app-server` exports `AppServerPluginLocales` for the widened type and keeps `AppServerPluginLocalesLoader` as a deprecated alias. The bundled plugins, the application templates' `server/runtime.ts` and plugins generated by `create-plugin` now import their server locales statically.

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
  - @nocobase/app-plugin-authorization@0.2.0-beta.22
  - @nocobase/app-plugin-authentication@1.0.0-beta.24
  - @nocobase/db@1.0.0-beta.16

## 0.1.0-beta.6

### Patch Changes

- 41f478f: Cite `lucide-react` instead of `sonner` as the example client peer in the plugin `AGENTS.md`, since plugins report toasts through the application and no longer depend on `sonner`.
- Updated dependencies [db16945]
  - @nocobase/app-client@1.0.0-beta.23
  - @nocobase/app-plugin-authentication@1.0.0-beta.24

## 0.1.0-beta.5

### Patch Changes

- 2f97f00: The authorization Skills are self-contained: they no longer send readers to the example plugins or rely on their sample ids, and use a neutral `org.team` subject type in their snippets. Organisation work, such as departments, positions and department heads, is routed to the application development Skill's organisation reference, and each rule plugin's Skill links its permission design guide for department baselines, cross-department sharing and department-assigned restrictions, noting that the guide's core needs permission sets alone.
- Updated dependencies [a4ee8aa]
- Updated dependencies [2f97f00]
- Updated dependencies [2f97f00]
- Updated dependencies [2f97f00]
  - @nocobase/app-server@1.0.0-beta.28
  - @nocobase/authorization@0.1.0-beta.10
  - @nocobase/app-plugin-authorization@0.2.0-beta.21
  - @nocobase/app-plugin-authentication@1.0.0-beta.24

## 0.1.0-beta.4

### Patch Changes

- 1b139b6: List Permission Sets first and the Permission Inspector last in the authorization settings subsection, with the rule plugins between them. `authz.ui.place` accepts an optional `order` within a subsection; unordered resources follow in registration order. The permission workspace now shows a resource's key under its name, and its sidebar leads with subsections, keeping section headers as muted labels.
- ec92b20: Plugin commands are `AppCommand`s and print the command envelope under `--json`. `scheduler sync` creates the application through `withApp()`, so it acts on the application the runner located rather than the current directory and always destroys the runtime. `workflow build` path flags are `appPath()` flags, so their defaults resolve against the application root from any directory. The CLI example's `artifact build` is a development command, and `pnpm plugin:create --with cli` generates an `AppCommand` with a test that uses `@nocobase/app-cli/testing`.

  The application Skill gains a reference on adding an application command, and the application templates and plugin `AGENTS.md` files describe commands in those terms: a command returns its result, throws `CommandError`, and creates the application with `withApp()` when it needs it. The templates import the CLI authoring API from `@nocobase/app-cli`.

- dbf5631: Replace guidance that named removed commands and layouts. The Hub's development page names the archive `nocobase build --tar` actually writes, `storage/exports/dist.tar.gz`. The scheduler Skill synchronizes with `pnpm nocobase scheduler sync` instead of `nb3 schedule:sync` and gives the deployed form, `node dist/cli/index.js scheduler sync --finalize`. The repository example applies its migrations and seeds with `nocobase db apply`, the CLI example's Skill matches its manifest and the stdout-only `--json` contract, and the i18n Skill no longer presents `pnpm i18n:check` as the monorepo form of `locales check`. Plugin `AGENTS.md` files carry the current dependency rules from the plugin template.
- Updated dependencies [757eedf]
- Updated dependencies [1b139b6]
- Updated dependencies [02d5402]
- Updated dependencies [dbf5631]
- Updated dependencies [05af1d4]
- Updated dependencies [4adcf24]
- Updated dependencies [ec92b20]
- Updated dependencies [ec92b20]
- Updated dependencies [757eedf]
  - @nocobase/app-plugin-authorization@0.2.0-beta.20
  - @nocobase/app-server@1.0.0-beta.27
  - @nocobase/db@1.0.0-beta.16
  - @nocobase/app-plugin-authentication@1.0.0-beta.24
  - @nocobase/app-client@1.0.0-beta.21
  - @nocobase/i18n@1.0.0-beta.4

## 0.1.0-beta.3

### Minor Changes

- c8ddd7d: Consolidate the authorization API. Resource types are either catalog types (`settings`, `composite`, `database.collection`), whose items and actions must be registered, or record types (`page`, `user`, `notification`, `hub.app`, `hub.host`), which declare type-level actions and judge each record; there are no `*` items. Business resources become composite resources, a built-in core mechanism: every Authorization has `authz.compositeResources` (which replaces `authz.business`) and reserves the `composite` resource type, so `businessPlugin()` is gone with no replacement and `resourceTypes.add({ type: 'composite' })` throws; `defineBusinessResource` is `defineCompositeResource`, every `Business*` type is `CompositeResource*` (`CompositeResource`, `CompositeResourceBuilder`, `CompositeResourceActionBuilder`, `CompositeResourceReference`, `CompositeResourceConditions`, `CompositeResourceApi`, `BindableCompositeResourcePermission` and so on) and the grant policy is `{ type: 'composite', scopes }`. Resource types carry no `title`: they are never displayed, and the library holds no translation keys. A composite composes exactly the grants its definition lists, on any type except another composite. A data scope no longer names a `collection`: it targets the one resource its grant actions address (`dataScopeTarget(action, key)`), whose type must declare `recordAccess: true` on `resourceTypes.add`, as `database.collection` does; `define` checks this when the type is registered, and `authz.compositeResources.validate()` and first use check types registered later. The library holds no display concepts. `@nocobase/app-plugin-authorization` provides `authz.ui`, also exposed to plugin setup contexts: `ui.sections.add` for the top-level sections `pages`, `business` and `administration` and one level of subsections (with `extend: true` for a subsection another plugin owns, as workflow owns `automation` and scheduler extends it), `ui.groups.add` for right-side groups, `ui.place(ref, { section, group? })`, and `ui.defaultSection(type, section)`. `pagesPlugin` registers the `pages.page` subsection, the only one the client fills, from its route tree. The client no longer remaps the `@nocobase/authorization` namespace. `authz.settings.add` no longer takes `section`; settings items and composites are placed with `authz.ui.place`, and unplaced ones land in their type's default section "Other". Startup validation runs after every provider has booted and reports unknown subsections and groups, placements of unregistered resources and unfit data scopes, throwing in development and logging a warning in production. A resource holds at most one default-access rule: the table is unique on `(resourceType, resourceId)` as well as `key`, and a second rule raises `DefaultAccessConflictError`, answered with 409. `authorizationToken` is the only service token: `permissionSetsToken` is gone, `authz.db` is now `authz.database`, settings items are registered with `authz.settings.add` and checked with semantic actions, and rule plugins build on `@nocobase/app-plugin-authorization/server/extension`. The client exposes `AuthorizationClient.snapshot/revision/invalidate/onInvalidated` and renamed management components. Every client page route must now declare `authz` (a check or `'skip'`); nothing is inferred from the route name. The authorization migrations and seeds were edited in place, including the new `key` column on default-access rules, so existing databases must be reset and reinstalled. A stored composite grant that no longer expands — an unknown action or data scope, an invalid scope value or policy — is skipped for that grant alone instead of failing every check of the identity: it permits nothing, a direct check of its action denies with `INVALID_GRANT`, and `createAuthorization({ onInvalidGrant })` is told once, which the application plugin logs; `authz.compositeResources.validateGrant` explains a stored grant, and the plugin's startup validation scans every stored Permission Set, throwing in development and warning in production. `authz.database.collections.add` treats a re-registration with the same actions as a no-op even when its title or description differ, keeping the first and reporting a startup warning through `collections.warnings()`; only different actions throw. `authz.resourceTypes.get(type).items.add(item)` remains the generic low-level item registration that `settings.add`, `database.collections.add` and `compositeResources.define` build on.

### Patch Changes

- 0b37436: Fit the default access page to the available height on large screens, so the page no longer scrolls around the resource table that already scrolls on its own. `PermissionsPage` gains an opt-in `fill` prop and `ManagementTable` accepts a `className` for pages that lay out their own scroll regions; on viewports too short for a usable layout the page keeps a minimum height and scrolls once as a whole.
- Updated dependencies [f6c3cd8]
- Updated dependencies [c8ddd7d]
- Updated dependencies [f3917b6]
- Updated dependencies [0b37436]
- Updated dependencies [d18e964]
- Updated dependencies [0231d46]
  - @nocobase/app-server@1.0.0-beta.26
  - @nocobase/app-client@1.0.0-beta.20
  - @nocobase/app-plugin-authentication@1.0.0-beta.23
  - @nocobase/authorization@0.1.0-beta.9
  - @nocobase/app-plugin-authorization@0.2.0-beta.19

## 0.1.0-beta.2

### Patch Changes

- 808bf34: Remove the authorization workspace dependency cycle by keeping rule plugin dependencies one way and running cross-plugin coverage in the authorization example. Verify each rule plugin's management handler and migration in its own test suite.
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

## 0.1.0-beta.1

### Patch Changes

- d696700: Give every settings surface the token that matches what it is, so panels stop disagreeing with one another.

  The permission set editor is where this shows: its two tabs sit in one panel, and the permission configuration tab painted itself `bg-background` while the assignment tab inherited the panel's `bg-card`, so switching tabs changed the page colour under the same heading. The same mistake is spread across the settings pages, and none of it is visible under a preset whose page and card are near-identical.

  Each token names a layer rather than a shade, and every site now uses the one that describes it. A panel resting on the page is `bg-card`, which is what the AI tools and skills pages already used while the LLM service, MCP service, conversation, API key, user and notification log panels named the page surface instead — two lists in one plugin, one framed and one flat. A dialog or drawer is `bg-popover`, which is what the shared `Sheet`, `Dialog` and `Popover` primitives use and what six hand-rolled drawers and dialogs did not. An opaque sticky header, footer or table head names the surface it scrolls within rather than the page behind it. A form control names no surface at all and inherits the one it sits on, the way the shared `Input` and `Textarea` do with `bg-transparent`; twenty hand-rolled inputs, selects and text areas were pinned to the page colour and showed through as a differently coloured box inside every card.

  The styling reference now states which token describes which layer, and why picking one because it happens to look right is what puts a page-coloured block inside a panel.

- Updated dependencies [709f9ed]
- Updated dependencies [d696700]
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
  - @nocobase/app-plugin-authorization@0.2.0-beta.17
  - @nocobase/db@1.0.0-beta.13
  - @nocobase/app-server@1.0.0-beta.23
  - @nocobase/app-client@1.0.0-beta.19
  - @nocobase/i18n@1.0.0-beta.4

## 0.1.0-beta.0

### Minor Changes

- 64b3fdb: Support entry-level parent references for settings routes contributed by different plugins. Preserve route ownership and localization while resolving nested groups independently of plugin order.

  Split default access, sharing rules and restriction rules into application plugins that own management endpoints, stores, migrations and UI. Keep pure authorization rules and Store contracts in the authorization library and move permission-set management HTTP handlers to the application plugin. Update all application templates to explicitly compose the new plugins. The migration ownership change assumes a fresh installation.

### Patch Changes

- 64b3fdb: Separate business resource declarations from underlying handler registration through `resourceTypes`. Remove transitional registration aliases and legacy title decoding. Store rule record IDs directly in each action's JSON, preserving independent named scopes without auxiliary record tables. Initialize the sales example and Hub permission titles directly in their final form, without development-version upgrade scripts.
- 64b3fdb: Return translation descriptors for authorization options and translate them on the client. Language changes update resource, action, group, scope and subject labels without reloading permission data or discarding edits. Rule plugins expose their resource titles in client locales.
- 64b3fdb: Document business authorization development, scope-rule configuration, inherited subjects and server enforcement in the published Skills, with application-level guidance to select the authorization workflow. Make installed Skills self-contained with client integration, code-versus-seed decisions, complete API contracts and the current sales collaboration and delivery examples.
- 64b3fdb: Remove obsolete database field editors, user-directory helpers, and unused authorization management components. Preserve underlying grant policies when saving permission sets, share scope labels across rule plugins, and centralize unsaved-change handling in the permission workspace.
- 64b3fdb: Separate permission-set assignment management from CRUD, use one configure permission for default access, and register an independent permission inspector with its own options and subject selection endpoints. Reflect the operations in management controls and the user inspection shortcut.
- 64b3fdb: Support settings navigation order across plugin contributions. Place the authorization inspector after rule management and align authorization page headings with other settings pages.

  Each rule plugin owns its shadcn primitives instead of importing them from the authorization management API.

- 64b3fdb: Focus authorization Skills on designing and implementing application business permissions. Consolidate repeated API guidance, add a policy-bound transactional workflow example, require model development and accompanying business permission configuration according to each requested change, and correct seed imports and optional-rule examples.
- 64b3fdb: Remove unused seed-directory declarations so server inspection succeeds in clean checkouts and installed applications without local empty directories.
- 64b3fdb: Add composed business operations with named data scopes and categorized business and administration groups. Permission and rule editors expose only this catalog; page, collection and custom resource handlers remain internal authorization targets.

  Enforce per-operation default access, sharing and restriction scopes while preserving field permissions. Return resolved underlying decisions and repository policies for inspection and execution.

  Use translation descriptors for permission titles, integrate permission-set assignments into user management, and demonstrate independent project, quote and order scopes with direct and team-based assignments.

- 64b3fdb: Remove Refine from client authorization checks. Use `AuthorizationClient.can({ resource, action })` instead of the removed two-argument signature, and import `useCan` from `@nocobase/app-plugin-authorization/client`. Migrate page guards, navigation, and notification visibility while preserving session isolation and realtime permission invalidation.

  Remove the Refine access-control configuration and legacy global authorization client accessors. Resolve the application-owned client through `useAuthorizationClient()` or `authorizationClientToken`. Settings actions now revoke stale access immediately; route checks no longer bypass the authorization page or translate Refine CRUD action names.

  Unify route authorization under `authz: 'skip' | { resource: { type, id }, action }`. Normalize default rules during registration and share them across page guards, navigation, permission discovery, and inspection. Remove the legacy `access` field and string resource adapter.

  Limit settings action checks to the actions each page uses, keep the permission-set action helper internal, and avoid rebuilding navigation twice when selecting a route.

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
- Updated dependencies [64b3fdb]
- Updated dependencies [fe564d9]
- Updated dependencies [fe564d9]
- Updated dependencies [64b3fdb]
- Updated dependencies [64b3fdb]
- Updated dependencies [64b3fdb]
- Updated dependencies [64b3fdb]
  - @nocobase/app-client@1.0.0-beta.19
  - @nocobase/authorization@0.1.0-beta.8
  - @nocobase/app-plugin-authorization@0.2.0-beta.15
  - @nocobase/app-server@1.0.0-beta.21
  - @nocobase/app-plugin-authentication@0.1.0-beta.18
  - @nocobase/db@1.0.0-beta.11
  - @nocobase/i18n@1.0.0-beta.4

## 0.0.1

### Patch Changes

- Provide default-access rule persistence, administration endpoints and settings UI.
