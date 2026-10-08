# @nocobase/app-plugin-authorization

## 1.0.0-beta.25

### Minor Changes

- bc1e83f: `/api/authz` accepts scoped API keys (`auth.required({ scopedKeys: true })`): the permissions snapshot and every registered check run through `authz`, which narrows them to the key's scope. The README explains scoped credentials and why code that derives permissions from `permissionSets.getEffective` must intersect with `identity.keyScope`.

### Patch Changes

- bc1e83f: `GET /api/authz/permission-sets` and `GET /api/authz/permission-sets/effective/:type/:id` leave out Permission Sets whose protection is `hidden`.
- be0fbbd: Client code merges class names with the `cn` package instead of `clsx` and `tailwind-merge`, so the plugins declare `cn` as a peer dependency in their place. The application templates provide it; an application that does not declare `cn` yet adds it to its `devDependencies`, or the client build cannot resolve these plugins. The AI employee registry item `nocobase-ai` lists `cn` instead of `clsx` and `tailwind-merge`, and the authentication plugin drops the two unused development dependencies.
- bc1e83f: Show confirmations as an AlertDialog and give the rule drawer the standard drawer width.
- bc1e83f: The plugins' Skills name the NocoBase UI Library items that present their APIs: `permission-editor` for authorization, and `attachment-list` for files.
- bc1e83f: Select popups grow with their options instead of taking the trigger's width, up to `max-w-sm` or the space beside them, and wrap a long option rather than cutting it off. The UI guidelines add this as rule I12, with the class every `SelectContent` takes.
- 6162033: Declare `@testing-library/user-event` as a development dependency, which the package's tests now use to open menus and selects. Nothing an application installs changes.
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
  - @nocobase/authorization@1.0.0-beta.12
  - @nocobase/db@1.0.0-beta.18
  - @nocobase/i18n@1.0.0-beta.5
  - @nocobase/service-provider@0.0.2-beta.1

## 1.0.0-beta.24

### Patch Changes

- e123790: Move `@nocobase/app-server`, `@nocobase/app-client`, `@nocobase/app-plugin-authentication`, `@nocobase/app-plugin-users`, `@nocobase/app-plugin-hub`, `@nocobase/app-plugin-workflow` and `@nocobase/app-plugin-ai-employee` to the 2.0.0 prerelease line. The HTTP API migration released in 1.0.0-beta.N changed every route and the error body, but in prerelease mode a `major` changeset on a version that is already a `1.0.0` prerelease only increments the prerelease number, so nothing in the version said the change was breaking. These packages now release as `2.0.0-beta.0`, and every package that depends on or peers with one of them is released again so that its published range is `^2.0.0-beta.0` rather than a `^1.0.0-beta` range the new versions do not satisfy. An application upgrading to these versions upgrades all of them together.
- Updated dependencies [e123790]
  - @nocobase/app-client@2.0.0-beta.0
  - @nocobase/app-plugin-authentication@2.0.0-beta.0
  - @nocobase/app-server@2.0.0-beta.0

## 1.0.0-beta.23

### Major Changes

- 3f01f61: Every failed `/api` response now has one body, `{ error: { code, status, reason, domain, message, localizedMessage?, fieldViolations?, metadata?, requestId } }`, following Google's AIP-193: `code` is the HTTP status, `status` one of a fixed set such as `NOT_FOUND`, and `reason` the stable, machine-readable cause clients branch on.

  - `@nocobase/app-server/router` exports `ApiError`, which a route throws to answer in that body, and `parseApiInput()`, which validates input against a zod schema inside Hono's `validator()` and answers `400 INVALID_ARGUMENT` naming every invalid field. The application renders anything a route does not: an unexpected error is an opaque `500 INTERNAL`, Hono's `HTTPException` and any error carrying a 4xx `status` keep it, and an unknown `/api` path is a JSON `404 ROUTE_NOT_FOUND` instead of the SPA page. Every `/api` response carries the request's id in `x-request-id`, reusing a safe id the caller sent, and the request log uses the same id. Repository routes report their errors in the new body, with the Repository error code as `reason` and `domain` `app`; a write refused by Policy carries its `path` and `details` in `metadata`.
  - `ApiClientError` (from `@nocobase/api-client`, re-exported by `@nocobase/app-client`) replaces `code` with `reason` and `domain`, read from the new body; `requestId` falls back to the body when the header is absent. Replace `error.code === 'X'` with `error.reason === 'X'`.
  - `AuthorizationDeniedError` carries `reason` `AUTHORIZATION_DENIED` and `domain` `authorization`, and its `getResponse()` answers the new body.
  - `auth.required()` answers an anonymous request with `401 UNAUTHENTICATED`, reason `AUTHENTICATION_REQUIRED`, and a credential Better Auth refuses with its status and Better Auth's code as `reason`, instead of `{ code: 'UNAUTHORIZED' }` and Better Auth's own body. Better Auth's own routes under `/api/auth/` are unchanged.
  - The authorization routes answer a denial with `403 PERMISSION_DENIED` and invalid settings input with `400 INVALID_ARGUMENT`, reason `INVALID_AUTHORIZATION_INPUT`, instead of `{ code: 'FORBIDDEN' }` and `{ code: 'INVALID_AUTHORIZATION_INPUT' }`.

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

### Minor Changes

- 21d274c: Permission Sets can no longer be saved with a write grant that every write would reject. `POST /api/authorization/permissionSets`, and a `PATCH` that replaces `grants`, now check each `database.collection` `create` and `update` grant against the Collection's metadata and answer `400 INVALID_ARGUMENT` with reason `INVALID_AUTHORIZATION_INPUT`, domain `authorization`, and one `fieldViolations` entry per offending member, such as `grants.0.actions.1.policy.fields.2`, when a listed field does not exist or is one a write cannot set (auto-increment, generated or optimistic-lock version), when a listed relation does not exist, or when `through` is given on a relation that is not `belongsToMany`. Such a grant used to save and then fail every write it allowed with an opaque `500`. Read and delete grants, `'*'`, and Collections the database does not hold are not checked, and a `PATCH` that changes only the key or title still saves a set whose stored grants have gone stale. Clients that saved such grants must remove the offending fields.

  An `update` grant with `fields: '*'` on a Collection whose primary key is an auto-increment column failed every write with `500 INTERNAL`, because `'*'` resolved to every field, the primary key included, and db refuses a Policy naming a field it assigns itself. `'*'` on `create` and `update` now resolves to the fields a write may set. `AuthorizationCollection` gains `writableFields` accordingly.

  The startup scan of stored Permission Sets now also reports `database.collection` write grants, given directly or composed by a stored composite grant's definition, that name a field or relation a write can no longer use, for example after a field was dropped or a seed wrote the grant directly. As for composite grants that no longer expand, it throws in development and warns in production.

  `@nocobase/db` exports the rule those checks share: `writableFields(collection)` lists the fields a write may name, `isManagedField(collection, field)` says whether the database or Repository assigns a field, and `writePolicyProblems(collections, collection, policy)` returns every member of a write policy that does not fit the Collection metadata, each with its path, instead of throwing `INVALID_WRITE_POLICY` on the first. The Repository's own write-policy validation now runs on the same code.

- 0b933b3: The user management routes under `/api/users`, every authorization route under `/api/authorization` (the permission snapshot, Permission Sets, the inspector, and the default-access, sharing-rule and restriction-rule settings) and `GET /api/i18n/locales` are now described in the application's OpenAPI document, with their parameters, response schemas and error statuses, and listed in Swagger UI at `/api/swagger/docs` under the `Users`, `Authorization` and `I18n` tags. `GET /api/i18n/locales` declares `security: []`, because the sign-in page reads it before anyone is signed in. `PUT /api/i18n/locale` is hidden from the document because it only changes the browser's session. Input validation answers exactly as before. Each route lists `403` only where it checks a permission, so `GET /api/authorization/permissions` lists `401` and `500`; the `400` for invalid input comes from the input validators, and a route that can answer `400` for another reason declares it with its reasons, such as `INVALID_AUTHORIZATION_INPUT` on rule create and update, `PROTECTED_PERMISSION_SET` on Permission Set changes, and the password and role-scope reasons on user routes.

  The settings routes behind the `/api/authorization` dispatcher are forwarded at request time, where the document generator cannot see them, so at boot the authorization plugin registers every `authz.routes` registration with the application's API documentation through app-server's generic `addApiRouter()` and `addUndeclaredApiRoute()`. Routes registered through `authz.routes.add(path, createRouteHandler(router))` are documented automatically at their full `/api/authorization/...` path and checked like any other route; declare each route of the router with `describeRoute()`. A handler that is a plain function rather than a `createRouteHandler` router keeps working but cannot be described: the plugin logs a warning naming its path and registers it as an undeclared route, so `findUndeclaredApiRoutes(app)` and `pnpm openapi:check` report it like any route that declares nothing. A route a router declares outside the path its handler is registered under, which the dispatcher never forwards to, is left out of the document, logged, and reported the same way. `documentAuthorizationRoutes(apiDocs, authz.routes, onWarning?)` performs that registration, for a plugin's tests to assert on with `findUndeclaredApiRoutes` and the generated document without starting an application. `createRuleSupportRoutes` accepts an optional `name` for its operation ids, and the extension exports `AUTHORIZATION_API_TAGS`, `documentAuthorizationRoutes` and response schemas such as `SubjectRuleSchema` and `TotalMetaSchema`.

  `AuthorizationRouteRegistry` in `@nocobase/authorization/core` gains `entries()`, which lists every registration with its handler, sorted by path like `list()`.

  The default-access, sharing-rule and restriction-rule plugins no longer declare `hono`, which none of their code imports. The authorization plugin's README describes the rule request bodies as validated through `apiValidator()`.

### Patch Changes

- 7dbc54b: A permission-set service bound with `withTransaction(connection)` to a `@nocobase/db` connection now publishes its grant-change notifications after that transaction commits, and drops them on rollback, instead of publishing nothing and leaving it to the caller. Call `notifyAssignmentsChanged(subject)` on the bound service inside the transaction; calling the unbound service again after the commit is no longer needed and only repeats the refresh. A transaction of any other type keeps the previous behaviour. The authorization Skill and READMEs describe the new pattern.

  User management registers `onRoleScopesChanged` with `afterCommit` inside the transaction that changes the role scopes, so a failing notification is reported through the connection's `onTransactionCallbackError` instead of failing a request whose change has already committed, and deleting a user who no longer exists notifies nobody.

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
  - @nocobase/authorization@1.0.0-beta.11
  - @nocobase/i18n@1.0.0-beta.5
  - @nocobase/service-provider@0.0.2-beta.1

## 0.2.0-beta.22

### Patch Changes

- 9291dbb: Pass `locales` the same way on the client and the server

  `defineClientPlugin`, `defineServerPlugin` and both sides' `defineAppRuntime` now accept the `locales/index.ts` module itself or a function importing it, typed as the new `LocalesContribution` from `@nocobase/i18n`, which also exports `resolveLocalesContribution` to turn either into the module. Previously the client took only the module and the server only a function, so a plugin wired the same file two different ways. The module is the recommended form on both sides: each language in it is already a separate dynamic import, so importing the map statically loads no translations early. Existing `locales: () => import('./locales/index.js')` declarations keep working unchanged. `@nocobase/app-server` exports `AppServerPluginLocales` for the widened type and keeps `AppServerPluginLocalesLoader` as a deprecated alias. The bundled plugins, the application templates' `server/runtime.ts` and plugins generated by `create-plugin` now import their server locales statically.

- Updated dependencies [9291dbb]
- Updated dependencies [9291dbb]
- Updated dependencies [ec4b764]
- Updated dependencies [e77641b]
  - @nocobase/i18n@1.0.0-beta.5
  - @nocobase/app-client@1.0.0-beta.24
  - @nocobase/app-server@1.0.0-beta.32
  - @nocobase/app-plugin-authentication@1.0.0-beta.24
  - @nocobase/authorization@0.1.0-beta.10
  - @nocobase/db@1.0.0-beta.16
  - @nocobase/service-provider@0.0.2-beta.1

## 0.2.0-beta.21

### Minor Changes

- 2f97f00: The inspector shows inherited access. `POST /inspector/configured` also answers `identity.subjects`, the subjects a user inherits from, and per effective permission set the assignments that bring it (`ConfiguredPermissionSet` in `sets`); the inspector page shows which subjects the user inherits from and whether each granting set comes through one of them or a direct assignment. A subject option's `title` and `description` may be a `{ key, ns }` translation descriptor, which the subject picker, assignment lists, rule panels and inspector render in the viewer's language; the client `SubjectOption` types them as `LocalizedText`. A permission-set assignment change on any subject other than a user now refreshes every signed-in client, so members of a department see the change without reloading.

### Patch Changes

- 2f97f00: A denied `require` now answers `403 { code: 'FORBIDDEN', message }` from any Hono route without an `onError` mapping: `AuthorizationDeniedError` carries `status: 403` and a `getResponse()` that Hono's default error handler honours. A record access that resolves to no records for a principal who holds the grant, such as a user in no department, now yields a conditional decision whose scope matches no rows, with the `EMPTY_RECORD_ACCESS` reason, so a bound Repository returns an empty result and updates or deletes nothing instead of refusing to run. A principal without a grant, or a grant whose data scopes configure no selection, is still denied.
- 2f97f00: The authorization Skills are self-contained: they no longer send readers to the example plugins or rely on their sample ids, and use a neutral `org.team` subject type in their snippets. Organisation work, such as departments, positions and department heads, is routed to the application development Skill's organisation reference, and each rule plugin's Skill links its permission design guide for department baselines, cross-department sharing and department-assigned restrictions, noting that the guide's core needs permission sets alone.
- Updated dependencies [a4ee8aa]
- Updated dependencies [2f97f00]
  - @nocobase/app-server@1.0.0-beta.28
  - @nocobase/authorization@0.1.0-beta.10
  - @nocobase/app-plugin-authentication@1.0.0-beta.24

## 0.2.0-beta.20

### Patch Changes

- 757eedf: Check unrestricted access from the client, and never offer unrestricted-only pages as grants

  `AuthorizationClient.can` and `useCan` accept `'unrestricted'` in addition to a `{ resource, action }` check, typed as the new exported `AuthorizationRequirement`. It passes only when the session's permission snapshot is unrestricted, as root's is, and nothing can grant it. Route guards and menus use it for pages whose `authz` is `'unrestricted'`, which is what a protected App or settings page without a declared `authz` now defaults to.

  The permission workspace and inspector list only routes whose `authz` checks `page` `access`, so an unrestricted-only page is never offered as a page grant. The client development guidance in the plugin's Skill now describes `authz` inheritance, the defaults for a page that omits it, and the unrestricted requirement.

- 1b139b6: List Permission Sets first and the Permission Inspector last in the authorization settings subsection, with the rule plugins between them. `authz.ui.place` accepts an optional `order` within a subsection; unordered resources follow in registration order. The permission workspace now shows a resource's key under its name, and its sidebar leads with subsections, keeping section headers as muted labels.
- Updated dependencies [02d5402]
- Updated dependencies [dbf5631]
- Updated dependencies [05af1d4]
- Updated dependencies [4adcf24]
- Updated dependencies [ec92b20]
- Updated dependencies [ec92b20]
- Updated dependencies [757eedf]
  - @nocobase/app-server@1.0.0-beta.27
  - @nocobase/db@1.0.0-beta.16
  - @nocobase/app-plugin-authentication@1.0.0-beta.24
  - @nocobase/app-client@1.0.0-beta.21
  - @nocobase/authorization@0.1.0-beta.9
  - @nocobase/i18n@1.0.0-beta.4
  - @nocobase/service-provider@0.0.2-beta.1

## 0.2.0-beta.19

### Minor Changes

- c8ddd7d: Consolidate the authorization API. Resource types are either catalog types (`settings`, `composite`, `database.collection`), whose items and actions must be registered, or record types (`page`, `user`, `notification`, `hub.app`, `hub.host`), which declare type-level actions and judge each record; there are no `*` items. Business resources become composite resources, a built-in core mechanism: every Authorization has `authz.compositeResources` (which replaces `authz.business`) and reserves the `composite` resource type, so `businessPlugin()` is gone with no replacement and `resourceTypes.add({ type: 'composite' })` throws; `defineBusinessResource` is `defineCompositeResource`, every `Business*` type is `CompositeResource*` (`CompositeResource`, `CompositeResourceBuilder`, `CompositeResourceActionBuilder`, `CompositeResourceReference`, `CompositeResourceConditions`, `CompositeResourceApi`, `BindableCompositeResourcePermission` and so on) and the grant policy is `{ type: 'composite', scopes }`. Resource types carry no `title`: they are never displayed, and the library holds no translation keys. A composite composes exactly the grants its definition lists, on any type except another composite. A data scope no longer names a `collection`: it targets the one resource its grant actions address (`dataScopeTarget(action, key)`), whose type must declare `recordAccess: true` on `resourceTypes.add`, as `database.collection` does; `define` checks this when the type is registered, and `authz.compositeResources.validate()` and first use check types registered later. The library holds no display concepts. `@nocobase/app-plugin-authorization` provides `authz.ui`, also exposed to plugin setup contexts: `ui.sections.add` for the top-level sections `pages`, `business` and `administration` and one level of subsections (with `extend: true` for a subsection another plugin owns, as workflow owns `automation` and scheduler extends it), `ui.groups.add` for right-side groups, `ui.place(ref, { section, group? })`, and `ui.defaultSection(type, section)`. `pagesPlugin` registers the `pages.page` subsection, the only one the client fills, from its route tree. The client no longer remaps the `@nocobase/authorization` namespace. `authz.settings.add` no longer takes `section`; settings items and composites are placed with `authz.ui.place`, and unplaced ones land in their type's default section "Other". Startup validation runs after every provider has booted and reports unknown subsections and groups, placements of unregistered resources and unfit data scopes, throwing in development and logging a warning in production. A resource holds at most one default-access rule: the table is unique on `(resourceType, resourceId)` as well as `key`, and a second rule raises `DefaultAccessConflictError`, answered with 409. `authorizationToken` is the only service token: `permissionSetsToken` is gone, `authz.db` is now `authz.database`, settings items are registered with `authz.settings.add` and checked with semantic actions, and rule plugins build on `@nocobase/app-plugin-authorization/server/extension`. The client exposes `AuthorizationClient.snapshot/revision/invalidate/onInvalidated` and renamed management components. Every client page route must now declare `authz` (a check or `'skip'`); nothing is inferred from the route name. The authorization migrations and seeds were edited in place, including the new `key` column on default-access rules, so existing databases must be reset and reinstalled. A stored composite grant that no longer expands — an unknown action or data scope, an invalid scope value or policy — is skipped for that grant alone instead of failing every check of the identity: it permits nothing, a direct check of its action denies with `INVALID_GRANT`, and `createAuthorization({ onInvalidGrant })` is told once, which the application plugin logs; `authz.compositeResources.validateGrant` explains a stored grant, and the plugin's startup validation scans every stored Permission Set, throwing in development and warning in production. `authz.database.collections.add` treats a re-registration with the same actions as a no-op even when its title or description differ, keeping the first and reporting a startup warning through `collections.warnings()`; only different actions throw. `authz.resourceTypes.get(type).items.add(item)` remains the generic low-level item registration that `settings.add`, `database.collections.add` and `compositeResources.define` build on.

### Patch Changes

- 0b37436: Fit the default access page to the available height on large screens, so the page no longer scrolls around the resource table that already scrolls on its own. `PermissionsPage` gains an opt-in `fill` prop and `ManagementTable` accepts a `className` for pages that lay out their own scroll regions; on viewports too short for a usable layout the page keeps a minimum height and scrolls once as a whole.
- Updated dependencies [f6c3cd8]
- Updated dependencies [c8ddd7d]
- Updated dependencies [f3917b6]
- Updated dependencies [d18e964]
- Updated dependencies [0231d46]
  - @nocobase/app-server@1.0.0-beta.26
  - @nocobase/app-client@1.0.0-beta.20
  - @nocobase/app-plugin-authentication@1.0.0-beta.23
  - @nocobase/authorization@0.1.0-beta.9

## 0.2.0-beta.18

### Patch Changes

- 808bf34: Remove the authorization workspace dependency cycle by keeping rule plugin dependencies one way and running cross-plugin coverage in the authorization example. Verify each rule plugin's management handler and migration in its own test suite.
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
  - @nocobase/app-client@1.0.0-beta.19
  - @nocobase/authorization@0.1.0-beta.8
  - @nocobase/i18n@1.0.0-beta.4
  - @nocobase/service-provider@0.0.2-beta.1

## 0.2.0-beta.17

### Patch Changes

- d696700: Stop the `bubblegum` theme from turning settings pages into competing hues, and fix the token misuse it exposed.

  The preset was carried over from tweakcn verbatim, and upstream spends the generic surface and outline roles on decoration: `--card` was a cream 101 degrees of hue away from the pink `--background`, `--border` was `--primary` itself at chroma 0.18 against a median of 0.02 across the other thirty presets, and `--muted` was a cyan. One demonstration card and a few dividers carry that; a settings page stacking several panels over dozens of hairlines does not, and pages showed pink, cream, cyan and teal at once. Six light values are retuned — `--card`, `--border`, `--muted`, `--input`, `--sidebar-border` and `--sidebar-primary` — keeping those roles in the background's hue family and leaving the preset's colour in `--primary`, `--secondary` and `--accent`. The dark values, the radius, and every other preset are unchanged, and `THIRD-PARTY-NOTICES.md` records the deviation.

  The same pages also used tokens for something other than their role, which no neutral preset makes visible. Authorization's two page shells and four Hub pages painted the whole page with `bg-muted/20`, which is the page surface and belongs to `bg-background`; under a preset whose `--muted` is a real colour that was a film over the entire viewport. The AI employee page's read-only fields hand-rolled `bg-muted/40` instead of using the shared `Input` and `Textarea` with `disabled`, three information callouts were fixed `bg-blue-50`, and the MCP transport labels were fixed `bg-blue-100`/`bg-green-100`/`bg-amber-100`; the transports now take their three tones from the theme's chart series, which is what a preset defines to be told apart.

  Three fixed colours on settings pages are corrected while they are in hand. The AI employee page's missing-knowledge-base warning and the schedule detail page's target-issue icon named a light-mode ink with no dark counterpart, so both were close to unreadable on a dark card; they now carry one. The routes example reported a load failure in a fixed red, which is what `--destructive` is for.

  The theme authoring reference and the token reference now state the rule, so a preset converted tomorrow is checked against it.

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
- Updated dependencies [5380642]
- Updated dependencies [c5f4438]
- Updated dependencies [3187ace]
- Updated dependencies [38e5253]
- Updated dependencies [38e5253]
  - @nocobase/app-plugin-authentication@0.1.0-beta.20
  - @nocobase/db@1.0.0-beta.13
  - @nocobase/app-server@1.0.0-beta.23
  - @nocobase/app-client@1.0.0-beta.19
  - @nocobase/authorization@0.1.0-beta.8
  - @nocobase/i18n@1.0.0-beta.4
  - @nocobase/service-provider@0.0.2-beta.1

## 0.2.0-beta.16

### Patch Changes

- 43592e9: Support users.initialAdmin credentials for fresh installations, preserving legacy defaults when omitted and assigning root permission to the configured administrator without resetting existing accounts.
- Updated dependencies [43592e9]
- Updated dependencies [43592e9]
  - @nocobase/app-plugin-authentication@0.1.0-beta.19
  - @nocobase/db@1.0.0-beta.12
  - @nocobase/app-server@1.0.0-beta.22

## 0.2.0-beta.15

### Minor Changes

- 64b3fdb: Separate authorization services from application integration: the library provides decisions, permission-set and access-rule services, store contracts and handlers; the application plugin owns database adapters, migrations, identities and management UI.

  Add configurable root and default permission sets, protected-set metadata, transaction-bound service APIs, and integration with user management and Hub roles. Add database authorization for explicitly registered collections through Repository policies, plus a runnable example plugin.

  Provide a permission-set workspace with routed editing and user assignments, nested resource groups, field and record-scope controls, and a permission inspector. Localize management UI and request-specific resource labels. Application routes may declare signed-in access without a page grant.

  Migration ownership changes inline the existing table definitions in the application plugin. This changes the checksums of previously executed migrations; upgrade compatibility must be resolved before deploying to an existing database.

- 64b3fdb: Separate business resource declarations from underlying handler registration through `resourceTypes`. Remove transitional registration aliases and legacy title decoding. Store rule record IDs directly in each action's JSON, preserving independent named scopes without auxiliary record tables. Initialize the sales example and Hub permission titles directly in their final form, without development-version upgrade scripts.
- 64b3fdb: Return translation descriptors for authorization options and translate them on the client. Language changes update resource, action, group, scope and subject labels without reloading permission data or discarding edits. Rule plugins expose their resource titles in client locales.
- 64b3fdb: Add independent Policy-shaped relation permission declarations and immutable fluent builders, resolve target record scopes, and require explicit relation grants when narrowing repository API policies. Extend the sales authorization example with delivery-team associations, nested delivery checks, many-to-many collaborator notes, and an interactive relationship editor.

  Replace the business resource and collection/page declaration factories with callback-based authorization resources and reusable database permissions. Bind configuration keys at the action boundary, retain direct registration, and migrate the sales example without changing persisted grant or rule shapes.

  Move record access registration to the authorization core, add portable defineRecordAccess declarations, and consume repository-input FilterAst values only in the DB adapter. Migrate the sales example and policy selectors to generic resource references.

  Remove obsolete Business-prefixed public contracts and unused page/registry-bound builder entry points. Keep resource grant construction internal to the authorization package.

  Remove directional input/output objects from database grant fields. Use field lists or '*' per action, reject obsolete object-shaped grants, and update examples, documentation and tests. Request field directions remain supported.

- 64b3fdb: Support entry-level parent references for settings routes contributed by different plugins. Preserve route ownership and localization while resolving nested groups independently of plugin order.

  Split default access, sharing rules and restriction rules into application plugins that own management endpoints, stores, migrations and UI. Keep pure authorization rules and Store contracts in the authorization library and move permission-set management HTTP handlers to the application plugin. Update all application templates to explicitly compose the new plugins. The migration ownership change assumes a fresh installation.

- 64b3fdb: Add business-action authorization middleware for existing Repository route definitions. Intersect request constraints with endpoint policies, reject incomplete multi-scope shortcuts, and demonstrate project queries and editing in the authorization example. The example's project edit now uses `salesProjects:updateOne` with Repository input/output and 404 for out-of-scope targets.

  Document when to use generated CRUD versus custom business handlers in the authorization development Skill. Remove the separate authorization example Skill and its package publication entry.

  Remove the collection-aggregated `authz.db.repositories` adapter and its public types. Use `authz.db.authorizeRepository` with explicit business-action mappings for generated Repository routes.

- 64b3fdb: Add composed business operations with named data scopes and categorized business and administration groups. Permission and rule editors expose only this catalog; page, collection and custom resource handlers remain internal authorization targets.

  Enforce per-operation default access, sharing and restriction scopes while preserving field permissions. Return resolved underlying decisions and repository policies for inspection and execution.

  Use translation descriptors for permission titles, integrate permission-set assignments into user management, and demonstrate independent project, quote and order scopes with direct and team-based assignments.

- 64b3fdb: Support registered authorization subject selectors with permission-checked search, pagination, and name resolution. Share the dynamic picker across permission-set assignments, sharing rules, and restriction rules, and integrate the existing user service.
- 64b3fdb: Add composable, typed authorization builders with plugin-owned page and database grants, immutable scopes, and record-access policy registration. Support portable build/reference/register APIs and pure permission-set and rule DSL builders. Convert the sales example and its per-table seed data to shared fluent declarations while preserving authorization behavior.

  Separate page entry permissions from business data operations. Expose registered pages independently in permission sets and the inspector, and restrict business composition to database grants.

- 64b3fdb: Remove Refine from client authorization checks. Use `AuthorizationClient.can({ resource, action })` instead of the removed two-argument signature, and import `useCan` from `@nocobase/app-plugin-authorization/client`. Migrate page guards, navigation, and notification visibility while preserving session isolation and realtime permission invalidation.

  Remove the Refine access-control configuration and legacy global authorization client accessors. Resolve the application-owned client through `useAuthorizationClient()` or `authorizationClientToken`. Settings actions now revoke stale access immediately; route checks no longer bypass the authorization page or translate Refine CRUD action names.

  Unify route authorization under `authz: 'skip' | { resource: { type, id }, action }`. Normalize default rules during registration and share them across page guards, navigation, permission discovery, and inspection. Remove the legacy `access` field and string resource adapter.

  Limit settings action checks to the actions each page uses, keep the permission-set action helper internal, and avoid rebuilding navigation twice when selecting a route.

- 64b3fdb: Unify grantable resource registration through getResource(type).items and separate recursive display groups. Move authorization settings to module-qualified items under the built-in settings resource, replace the database collections registration entry point, and preserve page navigation groups in the resource picker. Existing authorization settings grant records are not migrated.

  Replace the permission-set list and separate detail view with a collapsible, searchable sidebar and routed permission configuration and user-assignment tabs. Keep edits in the workspace with save/discard controls and protected-set restrictions. Present registered resources in an expandable tree with searchable field configuration in a local floating panel, and toggle simple permissions directly between full access and no grant.

- 64b3fdb: Add a paginated subject permission overview with grouped resource matrices, scope and field details, and structured authorization reasons. Reuse built-in rule lists within each authorization scope to avoid repeated database reads during batch inspection.

### Patch Changes

- 64b3fdb: Run permission assignment revocation and replacement in a transaction, hold protected permission set locks before reading assignments, and notify permission changes only after commit. Concurrent removals can no longer delete the last active administrator assignment.
- 64b3fdb: Integrate source-qualified database authorization and native relation policies with AI data services. Preserve explicit route group extensions, translated resource search, Hub ownership checks, API key cleanup, and protected permission-set assignments across user deletion. Update shared application guidance for the split authorization plugins.
- 64b3fdb: Document business authorization development, scope-rule configuration, inherited subjects and server enforcement in the published Skills, with application-level guidance to select the authorization workflow. Make installed Skills self-contained with client integration, code-versus-seed decisions, complete API contracts and the current sales collaboration and delivery examples.
- 64b3fdb: Keep page and business permission categories visible before resources are defined, with localized guidance for asking AI to develop the model and configure initial permissions. Expose the page catalog even without server-registered pages so client-declared page permissions remain configurable.
- 64b3fdb: Remove obsolete database field editors, user-directory helpers, and unused authorization management components. Preserve underlying grant policies when saving permission sets, share scope labels across rule plugins, and centralize unsaved-change handling in the permission workspace.
- 64b3fdb: Separate permission-set assignment management from CRUD, use one configure permission for default access, and register an independent permission inspector with its own options and subject selection endpoints. Reflect the operations in management controls and the user inspection shortcut.
- 64b3fdb: Support settings navigation order across plugin contributions. Place the authorization inspector after rule management and align authorization page headings with other settings pages.

  Each rule plugin owns its shadcn primitives instead of importing them from the authorization management API.

- 64b3fdb: Disable rule creation and show setup guidance when no eligible business resources are defined. Remove fallback raw resource IDs and free-form action inputs from management editors.
- 64b3fdb: Focus authorization Skills on designing and implementing application business permissions. Consolidate repeated API guidance, add a policy-bound transactional workflow example, require model development and accompanying business permission configuration according to each requested change, and correct seed imports and optional-rule examples.
- 64b3fdb: Install page authorization automatically alongside permission sets and database authorization in createAppAuthorization. Remove explicit pages() installation from application configuration; the Default, Examples and Hub templates now configure only optional access-rule plugins. Page grants and route access behavior remain unchanged.
- 64b3fdb: Use consistent shadcn selects, checkboxes, and search inputs throughout authorization settings, including filter groups and scope drawers.
- 64b3fdb: Align all five authorization settings pages with the default access page's full-width layout, title, description, and spacing, while retaining the permission-set workspace's collapsible sidebar and internal scrolling.
- 64b3fdb: Carry optional localized display titles on authorization sources and render inspection explanations from returned decisions. Remove the hard-coded rule-plugin pipeline, plugin-name labels and separate permission-set title catalogue; preserve explanations from custom plugins.
- 64b3fdb: Declare built-in administration resources with the authorization fluent builder and separate their registration and record-access validation from application composition. Remove redundant page-action validation already enforced by the resource registry.
- 64b3fdb: Match inspector operations to the permission-set and default-scope action styling, with equally sized status icons and consistent spacing. Deduplicate grant explanations by source identity while preserving user-context requirements and full technical decisions.
- 64b3fdb: Mark inspector resource groups as configured only when their own resources have matching configuration, instead of marking every group sharing the same resource type. Preserve wildcard and unrestricted indicators.
- 64b3fdb: Add a configured-resources filter to the permission inspector, applying it before pagination while preserving action column positions and unrestricted access.
- 64b3fdb: Explain inspected business operations using a concise result, deduplicated permission-set names and named data scopes. Show the inspected subject's name, collapse effective filters and fields, and keep underlying checks and raw output in one technical section. Simplify redundant Boolean conditions only for display.
- 64b3fdb: Unify custom record-scope editing around native DB filter nodes, with nested AND/OR groups, typed scalar values, and consistent empty-group validation across permission sets and access rules.
- 64b3fdb: Move default user permission-set integration into the Users plugin and remove duplicated template providers. Add application-owned preset title metadata for client-side localization without overwriting custom names. Preserve Hub's custom role scope and share searchable assignment selection between user creation and editing.
- 64b3fdb: Prevent the permission management API from renaming protected permission sets or renaming other sets onto protected keys. Default permission sets still allow title and permission updates.
- 64b3fdb: Remove unused resource-handler group registries and item grouping metadata. Derive page display groups exclusively from client navigation routes, including pages also registered by the server, while keeping business resource groups separate.
- 64b3fdb: Display settings permissions as grouped module rows with individually labeled action toggles and module, group, and filtered bulk selection. Keep database permissions in the existing matrix.
- 64b3fdb: Show default access in a grouped full-width table with inline scope updates and URL-addressable drawer configuration and edit sharing and restriction rules in URL-addressable drawers with visible scope sections and unsaved-change confirmation.
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
- Updated dependencies [fe564d9]
- Updated dependencies [fe564d9]
- Updated dependencies [64b3fdb]
- Updated dependencies [64b3fdb]
  - @nocobase/app-client@1.0.0-beta.19
  - @nocobase/authorization@0.1.0-beta.8
  - @nocobase/app-server@1.0.0-beta.21
  - @nocobase/app-plugin-authentication@0.1.0-beta.18
  - @nocobase/db@1.0.0-beta.11
  - @nocobase/i18n@1.0.0-beta.4
  - @nocobase/service-provider@0.0.2-beta.1

## 0.2.0-beta.14

### Patch Changes

- 9628cdd: Improve workflow and scheduler management pages with consistent layouts, filters, tables, and switches. Keep page layout and UI components local to their owning plugins, and align authorization pages with the same layout conventions.

  Normalize workflow and execution URLs under `/settings/workflow` and scheduler URLs under `/settings/schedules`, retaining the automation menu group without adding it to URLs. Update scheduler target links and the examples homepage entry. Use bookmarkable workflow/run child routes, preserve queries and browser history, and link execution detail titles to their workflow.

  Improve the workflow execution canvas with reorganized run controls, fullscreen viewing, terminal edge markers, direct empty-branch connections, and theme-aware styling. Unify node dialogs with consistent titles and close controls, collapsible descriptions, execution results and status colors, and explanatory states for unexecuted nodes.

- Updated dependencies [c84bfe8]
- Updated dependencies [e9da3c2]
  - @nocobase/db@1.0.0-beta.11
  - @nocobase/app-server@1.0.0-beta.20
  - @nocobase/app-plugin-authentication@0.1.0-beta.18

## 0.2.0-beta.13

### Patch Changes

- 365a9fe: Complete English and Chinese translations for authentication, route feedback, authorization, shared controls, File and Notification Registry components, and development examples. Use concise semantic keys consistently for the new translations. Resolve AI Registry copy from the active language and localize development navigation and section headings. Translate MCP configuration guidance, tool drawer labels, and transport descriptions.
- 365a9fe: Match translated resource names when searching permissions, preserve the pagination slot across locales, and retranslate stored upload errors when the language changes.
- Updated dependencies [d4ca00e]
- Updated dependencies [60fa139]
- Updated dependencies [24e771f]
- Updated dependencies [60fa139]
- Updated dependencies [26ac480]
  - @nocobase/app-client@1.0.0-beta.18
  - @nocobase/app-plugin-authentication@0.1.0-beta.17
  - @nocobase/db@1.0.0-beta.9
  - @nocobase/app-server@1.0.0-beta.18
  - @nocobase/authorization@0.1.0-beta.7
  - @nocobase/i18n@1.0.0-beta.4
  - @nocobase/service-provider@0.0.2-beta.1

## 0.2.0-beta.12

### Patch Changes

- 028dd7c: Use host-provided peers for shared database types, authorization errors, service tokens, cache registries, and repository filter metadata. Declare their production providers in all application templates so deployments with automatic peer installation disabled retain the required runtime packages. Document the provider contract for generated plugins.

  Existing applications upgrading these packages must add compatible versions of their required shared peers to production dependencies: @nocobase/db, @nocobase/service-provider, @nocobase/repository-input, @nocobase/authorization, @nocobase/caching, @nocobase/i18n, and @nocobase/queue for the standard server stack, plus @nocobase/ai-employee when using its plugin. Update the lockfile and verify the production install; peer declarations do not remove incompatible historical versions automatically.

- Updated dependencies [028dd7c]
  - @nocobase/app-client@1.0.0-beta.17
  - @nocobase/app-plugin-authentication@0.1.0-beta.16
  - @nocobase/app-server@1.0.0-beta.17
  - @nocobase/authorization@0.1.0-beta.7
  - @nocobase/db@1.0.0-beta.8

## 0.2.0-beta.11

### Patch Changes

- 1fea79a: Refresh permission snapshots, navigation, and route guards when sessions or permissions change, and discard obsolete permission responses without requiring a browser reload. Support explicit type:id domain resources in client access checks without rewriting their actions.
- Updated dependencies [415d763]
  - @nocobase/app-server@1.0.0-beta.16
  - @nocobase/app-plugin-authentication@0.1.0-beta.15

## 0.2.0-beta.10

### Patch Changes

- a60decd: Require an explicit absolute baseDir for Server plugins and resolve migrations, seeds, jobs, and package metadata from the loaded plugin copy. Generate and validate database task manifests during builds so TypeScript and JavaScript share source checksums, with verified legacy JavaScript history conversion and synchronized plugin scaffolding and application templates.
- 1a85a86: Add breadcrumb labels to plugin routes so nested pages show their navigation path.
- Updated dependencies [63db898]
- Updated dependencies [63db898]
- Updated dependencies [63db898]
- Updated dependencies [63db898]
- Updated dependencies [a60decd]
- Updated dependencies [1a85a86]
- Updated dependencies [1c70f60]
- Updated dependencies [63db898]
  - @nocobase/app-server@1.0.0-beta.15
  - @nocobase/db@1.0.0-beta.7
  - @nocobase/app-plugin-authentication@0.1.0-beta.14
  - @nocobase/app-client@1.0.0-beta.16
  - @nocobase/service-provider@0.0.2-beta.1

## 0.2.0-beta.9

### Minor Changes

- e3fa827: Add reusable user administration and Hub-scoped role-based authorization. Authentication now supports disabled accounts, transaction-aware administration, stable duplicate-identity conflicts, Session revocation, and immediate Realtime disconnects. Authorization supports protected Permission Sets, atomic scoped assignment replacement, and Client permission invalidation. The Users page supports protected role options, readable multi-role editing, explicit unassigned states, and a distinction between direct roles and authenticated-user defaults; password reset and database Session revocation share one transaction. The default App exposes its direct Authorization Permission Sets as application roles while keeping System administrator changes in Authorization. The Hub defines Administrator, Operator, and Viewer roles, batch-loads their user assignments, enforces every Hub and user-management action on the server, protects the final enabled Administrator, and hides unauthorized Client controls. Both templates register the reusable Users plugin; Hub exposes Applications, User management, and a read-only role matrix directly in its control-plane navigation, while the default App keeps Users in Settings. Only the Hub template receives Hub roles, disables public sign-up, and omits ordinary App Settings, workflows, notifications, and example plugins.

### Patch Changes

- Updated dependencies [e3fa827]
- Updated dependencies [c3e02bf]
- Updated dependencies [0a3fa83]
- Updated dependencies [1d042c0]
  - @nocobase/app-server@1.0.0-beta.9
  - @nocobase/authorization@0.1.0-beta.4
  - @nocobase/app-plugin-authentication@0.1.0-beta.10
  - @nocobase/app-client@1.0.0-beta.12
  - @nocobase/db@1.0.0-beta.4

## 0.2.0-beta.8

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

## 0.2.0-beta.7

### Patch Changes

- 90a4903: Replace the composite application transport with application-owned `ApiClient` and `RealtimeClient` services. Client plugins, examples, and application templates now use object-style HTTP request options through the shared API client, while realtime subscriptions resolve their dedicated WebSocket client.
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

## 0.2.0-beta.6

### Patch Changes

- 813da59: Declare browser-only packages as devDependencies rather than dependencies, and make `react-i18next` an optional peer of `@nocobase/i18n` provided by `@nocobase/app-client`. Client code is bundled by the consuming application, so these entries did nothing for the bundle while `dist/package.json` pulled every one of them into the server deployment to be installed and never required.
- Updated dependencies [8d88ff4]
- Updated dependencies [43d5bf0]
- Updated dependencies [813da59]
- Updated dependencies [cee3251]
  - @nocobase/app-server@1.0.0-beta.6
  - @nocobase/app-client@1.0.0-beta.9
  - @nocobase/app-plugin-authentication@0.1.0-beta.6
  - @nocobase/db@1.0.0-beta.2
  - @nocobase/service-provider@0.0.2-beta.1

## 0.2.0-beta.5

### Minor Changes

- 6f9b399: Rewrite the template's agent and human documentation around building an application rather than developing a plugin. `README.md` now describes the project structure, how to run it, and what each of its own pnpm scripts does; `AGENTS.md` describes how to build a feature — pages, shadcn/ui components, endpoints, database access, migrations, and translations — and routes to a new `skills/nocobase-app-development/` skill whose references carry the detail. The nested `client/AGENTS.md` and `server/AGENTS.md` are rewritten to match: the server guide previously told agents to put new domain APIs in a plugin package, the opposite of what an application scaffold should say, and the client guide was largely about a `client-old/` directory that no longer exists.

  The page-to-sidebar path is now written down. Declaring a route makes the URL work but leaves the page out of navigation, which needs a Refine resource registered in `client/service-provider.ts`; the documentation previously described only the route half, so a page added by following it would have been unreachable from the sidebar. The guidance also now separates the directories business code belongs in from the framework scaffolding the template replaces on upgrade, and asks that both be updated together when an application changes that structure.

  The authorization Skill moves from `@nocobase/authorization` to `@nocobase/app-plugin-authorization` and is renamed `nocobase-app-plugin-authorization`. Skills synchronize from registered plugins, so one published by a library could never reach an application; its example also imported `@nocobase/authorization/database`, which an application does not depend on, and now imports the types the plugin re-exports.

  The guidance now points at the plugins an application already has. A prompt asking for approvals, notifications, or per-user record access was answerable only by building those from scratch, because nothing told an agent that `app-plugin-workflow`, `app-plugin-notification`, and `app-plugin-authorization` are installed and publish their own Skills — `.agents/skills/` was described only as generated output not to edit. Server route guidance also covered `can()` but not `authorize()`, so an ownership rule like "a salesperson sees only their own customers" had no documented path other than filtering rows in memory after fetching them, and scheduled work had no guidance at all.

  Application-owned migrations now reach the build. `database/migrations` and `database/seeds` exist in the template, and `tsconfig.server.json` compiles `database/**/*.ts`, so a migration an application writes is typechecked and emitted to `dist/database/` — which `scripts/build-server-dist-package.mjs` already expected to find. `pnpm migrate` applied such a migration before this change, but `pnpm build` silently dropped it. The unreferenced `tsconfig.migrations.base.json` is removed.

  `app-template-hub` receives the same framework-level change, since it is the same application scaffold with a different product identity: the rewritten documentation and the `nocobase-app-development` Skill, `CLAUDE.md`, and the migration build fix, which it had the identical version of. The repository `AGENTS.md` now records that framework changes to one template belong in the other by default, with the parts that stay template-specific.

### Patch Changes

- Updated dependencies [6f9b399]
  - @nocobase/authorization@0.0.1-beta.3

## 0.2.0-beta.4

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
- Updated dependencies [1527426]
- Updated dependencies [174eab5]
  - @nocobase/app-client@1.0.0-beta.6
  - @nocobase/app-server@1.0.0-beta.4
  - @nocobase/app-plugin-authentication@0.1.0-beta.5
  - @nocobase/db@1.0.0-beta.2
  - @nocobase/authorization@0.0.1-beta.2
  - @nocobase/service-provider@0.0.2-beta.1

## 0.2.0-beta.3

### Minor Changes

- ac3f033: Export every server plugin from its package's `./server` entry point, and update application composition, plugin discovery, and generated plugins to use the unified entry point.

### Patch Changes

- fb1a752: Unify Client and Server application composition around the explicit `serviceProviders` contribution and rename Client React tree contributions to `reactProviders`.

  Replace Client bootstrap modules with application-owned ServiceProvider lifecycle hooks, make the default Client start through `ClientApplication` and render through the Browser host, and update built-in plugins and runtime inspection to the new static contribution protocol.

- Updated dependencies [fb1a752]
- Updated dependencies [948304d]
- Updated dependencies [78cf0a2]
- Updated dependencies [ac3f033]
- Updated dependencies [fb1a752]
- Updated dependencies [ac3f033]
- Updated dependencies [78cf0a2]
- Updated dependencies [fb1a752]
- Updated dependencies [fb1a752]
  - @nocobase/app-client@1.0.0-beta.5
  - @nocobase/app-server-kit@0.1.0-beta.3
  - @nocobase/app-plugin-authentication@0.1.0-beta.4
  - @nocobase/service-provider@0.0.2-beta.1

## 0.2.0-beta.2

### Patch Changes

- ce4eab8: Add a focused ServiceProvider plugin example with a tokenized heartbeat
  service, lifecycle management, and an HTTP status route. Pass the Application
  directly to providers and standardize service access through `app.container`.
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
- Updated dependencies [7cdffbd]
- Updated dependencies [7cdffbd]
  - @nocobase/app-client@1.0.0-beta.4
  - @nocobase/app-server-kit@0.1.0-beta.2
  - @nocobase/app-plugin-authentication@0.1.0-beta.3
  - @nocobase/service-provider@0.0.2-beta.0
  - @nocobase/app-database@0.0.1-beta.1

## 0.2.0-beta.1

### Minor Changes

- 062f5b1: Add `settings` to `defineClientPlugin`, a fourth contribution type alongside `bootstrap`, `routes`, and `providers`. A plugin points it at a module that default-exports an array of setting definitions, or a function of the plugin options returning one, and each entry becomes a page in the application's settings centre.

  An entry is either a page — `id`, `title`, an optional `icon` and `access` rule, and a `pageLoader` — or a group that carries an icon and title once for a set of pages. Ids are single URL segments and nesting comes from the tree, so a page under a group is served at `/settings/<group>/<page>`, and a plugin contributing one page declares it without a group and gets `/settings/<id>`. Groups nest one level. Settings and routes share one path space, so a route and a page that would mount at the same address fail resolution with both identities named.

  The default template renders the settings centre, reusing the application shell's chrome — brand, sidebar collapse, theme, and user menu — with `Back to app` where the workspace label sits and no gear pointing at itself. The left rail collapses by group the way the product sidebar does. A page whose `access` rule is denied is left out of the navigation and cannot be reached by its URL either, and a group whose pages are all denied disappears with them. A setting whose `access` rule is denied is left out of the navigation and cannot be reached by its URL either. Authorization's four administration pages now arrive this way, at the URLs they already had, and no longer appear in the product sidebar.

  `client:inspect` gains `--type settings`, and `pnpm plugin:create` scaffolds a `client/settings.ts` entry.

- c8f38c8: Register client plugins explicitly in the application's `client/plugins.ts` instead of discovering them from `nocobase.plugins` through a Vite virtual module.

  Each plugin now ships a `client/plugin.ts` descriptor, exported as `./client/plugin`, that declares its bootstrap, routes, providers, and route component overrides. An application composes them with `defineClientPlugins([...])`, where array order is bootstrap order and a plugin is enabled by being present. The entry is real, type-checked application source: it can be read, diffed, and edited, and Vite reloads it like any other module.

  Plugins can also accept options. `defineClientPlugin` takes an options type that reaches the bootstrap context, the routes and providers factories, and the route component overrides, so an application can pass a custom login page or a notification label at registration.

  `@nocobase/app-plugin-registry-example` only drops its now-unread `nocobase.plugin.client` manifest field; it contributes no client extensions.

- 1a9732a: Re-export the client registration factory as the default from `client/index.ts`, so an application registers a plugin by importing `<package>/client` instead of `<package>/client/plugin`. `client/plugin.ts` still defines the factory and its `./client/plugin` subpath still resolves; the barrel simply re-exports it.

  Every plugin now declares `sideEffects: false`. An application imports the barrel, which also carries types, helpers, and components, and without that declaration a bundler must assume each of those matters and keeps them in the application entry chunk. With it, importing `<package>/client` costs exactly what importing `<package>/client/plugin` cost: the entry chunk is byte-identical for all eight plugins, where before it grew by 696 bytes for authentication and 88 for file.

  The declaration was checked rather than assumed: every client module's top-level statements are pure declarations, with no global assignment and no bare `import './x.css'`. The CSS imports under `app-plugin-workflow/registry` are copied as source by `registry materialize` and never bundled through `exports`. A plugin that later introduces a module-level side effect must drop the declaration.

  `@nocobase/app-plugin-workflow` additionally points `./client` at `./client/index.ts` rather than `./dist/client/index.js`, matching every other plugin. Consuming the built output made the barrel resolve to a stale artifact, which failed the build outright.

### Patch Changes

- Updated dependencies [062f5b1]
- Updated dependencies [c8f38c8]
  - @nocobase/app-client@1.0.0-beta.3

## 0.1.1-beta.0

### Patch Changes

- 0465323: Introduce the plugin-based authorization core and permission management UI. Replace the previous authorization API with composable core, database, permission-set, default-access, sharing-rule, restriction-rule, and page plugins; add route access metadata to the application client; publish and enable the authorization app plugin in the default template; and correct the Hub documentation to use the v3 Portal SDK package name.
- b269e38: Publish this package. It was marked private, so it never reached the registry even though the default template depends on it and enables it, which left `pnpm install` in a generated application failing with a 404.
- Updated dependencies [0465323]
- Updated dependencies [0465323]
  - @nocobase/authorization@0.0.1-beta.1
  - @nocobase/app-client@1.0.0-beta.2
  - @nocobase/app-server-kit@0.0.1-beta.1
