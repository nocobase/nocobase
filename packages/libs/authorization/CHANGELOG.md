# @nocobase/authorization

## 1.0.0-beta.12

### Minor Changes

- 37c8d20: A Permission Set protection may be `hidden`: the set is its owner's implementation detail (the grants of one API key's identity, say), and `protection(key)` reports it so a generic management surface can leave the set out of its lists. Holding the set allows exactly what it did.
- 37c8d20: Add key scopes: an identity may carry `keyScope`, the scope of the credential its request arrived with (a scoped API key, say), set by an identity step through the new `AuthorizationMiddlewareRequest.keyScope`. `authorize`, `can` and `require` deny anything outside it with the `KEY_SCOPE` reason before reading a grant, a superuser included, and `snapshot()` lists only what the scope covers. A composite action is checked against the scope as requested; the grants it expands into are not. `KeyScope.objects(business)` carries record selections for the code that owns the records, and `keyScopeAllows` answers the scope question for code that derives permissions itself.

### Patch Changes

- Updated dependencies [6993158]
- Updated dependencies [a6796d9]
- Updated dependencies [37c8d20]
  - @nocobase/db@1.0.0-beta.18

## 1.0.0-beta.11

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

- 7dbc54b: A permission-set service bound with `withTransaction(connection)` to a `@nocobase/db` connection now publishes its grant-change notifications after that transaction commits, and drops them on rollback, instead of publishing nothing and leaving it to the caller. Call `notifyAssignmentsChanged(subject)` on the bound service inside the transaction; calling the unbound service again after the commit is no longer needed and only repeats the refresh. A transaction of any other type keeps the previous behaviour. The authorization Skill and READMEs describe the new pattern.

  User management registers `onRoleScopesChanged` with `afterCommit` inside the transaction that changes the role scopes, so a failing notification is reported through the connection's `onTransactionCallbackError` instead of failing a request whose change has already committed, and deleting a user who no longer exists notifies nobody.

- 0b933b3: The user management routes under `/api/users`, every authorization route under `/api/authorization` (the permission snapshot, Permission Sets, the inspector, and the default-access, sharing-rule and restriction-rule settings) and `GET /api/i18n/locales` are now described in the application's OpenAPI document, with their parameters, response schemas and error statuses, and listed in Swagger UI at `/api/swagger/docs` under the `Users`, `Authorization` and `I18n` tags. `GET /api/i18n/locales` declares `security: []`, because the sign-in page reads it before anyone is signed in. `PUT /api/i18n/locale` is hidden from the document because it only changes the browser's session. Input validation answers exactly as before. Each route lists `403` only where it checks a permission, so `GET /api/authorization/permissions` lists `401` and `500`; the `400` for invalid input comes from the input validators, and a route that can answer `400` for another reason declares it with its reasons, such as `INVALID_AUTHORIZATION_INPUT` on rule create and update, `PROTECTED_PERMISSION_SET` on Permission Set changes, and the password and role-scope reasons on user routes.

  The settings routes behind the `/api/authorization` dispatcher are forwarded at request time, where the document generator cannot see them, so at boot the authorization plugin registers every `authz.routes` registration with the application's API documentation through app-server's generic `addApiRouter()` and `addUndeclaredApiRoute()`. Routes registered through `authz.routes.add(path, createRouteHandler(router))` are documented automatically at their full `/api/authorization/...` path and checked like any other route; declare each route of the router with `describeRoute()`. A handler that is a plain function rather than a `createRouteHandler` router keeps working but cannot be described: the plugin logs a warning naming its path and registers it as an undeclared route, so `findUndeclaredApiRoutes(app)` and `pnpm openapi:check` report it like any route that declares nothing. A route a router declares outside the path its handler is registered under, which the dispatcher never forwards to, is left out of the document, logged, and reported the same way. `documentAuthorizationRoutes(apiDocs, authz.routes, onWarning?)` performs that registration, for a plugin's tests to assert on with `findUndeclaredApiRoutes` and the generated document without starting an application. `createRuleSupportRoutes` accepts an optional `name` for its operation ids, and the extension exports `AUTHORIZATION_API_TAGS`, `documentAuthorizationRoutes` and response schemas such as `SubjectRuleSchema` and `TotalMetaSchema`.

  `AuthorizationRouteRegistry` in `@nocobase/authorization/core` gains `entries()`, which lists every registration with its handler, sorted by path like `list()`.

  The default-access, sharing-rule and restriction-rule plugins no longer declare `hono`, which none of their code imports. The authorization plugin's README describes the rule request bodies as validated through `apiValidator()`.

### Patch Changes

- Updated dependencies [21d274c]
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
- Updated dependencies [0b933b3]
- Updated dependencies [21d274c]
  - @nocobase/db@1.0.0-beta.17

## 0.1.0-beta.10

### Patch Changes

- 2f97f00: A denied `require` now answers `403 { code: 'FORBIDDEN', message }` from any Hono route without an `onError` mapping: `AuthorizationDeniedError` carries `status: 403` and a `getResponse()` that Hono's default error handler honours. A record access that resolves to no records for a principal who holds the grant, such as a user in no department, now yields a conditional decision whose scope matches no rows, with the `EMPTY_RECORD_ACCESS` reason, so a bound Repository returns an empty result and updates or deletes nothing instead of refusing to run. A principal without a grant, or a grant whose data scopes configure no selection, is still denied.

## 0.1.0-beta.9

### Minor Changes

- c8ddd7d: Consolidate the authorization API. Resource types are either catalog types (`settings`, `composite`, `database.collection`), whose items and actions must be registered, or record types (`page`, `user`, `notification`, `hub.app`, `hub.host`), which declare type-level actions and judge each record; there are no `*` items. Business resources become composite resources, a built-in core mechanism: every Authorization has `authz.compositeResources` (which replaces `authz.business`) and reserves the `composite` resource type, so `businessPlugin()` is gone with no replacement and `resourceTypes.add({ type: 'composite' })` throws; `defineBusinessResource` is `defineCompositeResource`, every `Business*` type is `CompositeResource*` (`CompositeResource`, `CompositeResourceBuilder`, `CompositeResourceActionBuilder`, `CompositeResourceReference`, `CompositeResourceConditions`, `CompositeResourceApi`, `BindableCompositeResourcePermission` and so on) and the grant policy is `{ type: 'composite', scopes }`. Resource types carry no `title`: they are never displayed, and the library holds no translation keys. A composite composes exactly the grants its definition lists, on any type except another composite. A data scope no longer names a `collection`: it targets the one resource its grant actions address (`dataScopeTarget(action, key)`), whose type must declare `recordAccess: true` on `resourceTypes.add`, as `database.collection` does; `define` checks this when the type is registered, and `authz.compositeResources.validate()` and first use check types registered later. The library holds no display concepts. `@nocobase/app-plugin-authorization` provides `authz.ui`, also exposed to plugin setup contexts: `ui.sections.add` for the top-level sections `pages`, `business` and `administration` and one level of subsections (with `extend: true` for a subsection another plugin owns, as workflow owns `automation` and scheduler extends it), `ui.groups.add` for right-side groups, `ui.place(ref, { section, group? })`, and `ui.defaultSection(type, section)`. `pagesPlugin` registers the `pages.page` subsection, the only one the client fills, from its route tree. The client no longer remaps the `@nocobase/authorization` namespace. `authz.settings.add` no longer takes `section`; settings items and composites are placed with `authz.ui.place`, and unplaced ones land in their type's default section "Other". Startup validation runs after every provider has booted and reports unknown subsections and groups, placements of unregistered resources and unfit data scopes, throwing in development and logging a warning in production. A resource holds at most one default-access rule: the table is unique on `(resourceType, resourceId)` as well as `key`, and a second rule raises `DefaultAccessConflictError`, answered with 409. `authorizationToken` is the only service token: `permissionSetsToken` is gone, `authz.db` is now `authz.database`, settings items are registered with `authz.settings.add` and checked with semantic actions, and rule plugins build on `@nocobase/app-plugin-authorization/server/extension`. The client exposes `AuthorizationClient.snapshot/revision/invalidate/onInvalidated` and renamed management components. Every client page route must now declare `authz` (a check or `'skip'`); nothing is inferred from the route name. The authorization migrations and seeds were edited in place, including the new `key` column on default-access rules, so existing databases must be reset and reinstalled. A stored composite grant that no longer expands — an unknown action or data scope, an invalid scope value or policy — is skipped for that grant alone instead of failing every check of the identity: it permits nothing, a direct check of its action denies with `INVALID_GRANT`, and `createAuthorization({ onInvalidGrant })` is told once, which the application plugin logs; `authz.compositeResources.validateGrant` explains a stored grant, and the plugin's startup validation scans every stored Permission Set, throwing in development and warning in production. `authz.database.collections.add` treats a re-registration with the same actions as a no-op even when its title or description differ, keeping the first and reporting a startup warning through `collections.warnings()`; only different actions throw. `authz.resourceTypes.get(type).items.add(item)` remains the generic low-level item registration that `settings.add`, `database.collections.add` and `compositeResources.define` build on.

## 0.1.0-beta.8

### Minor Changes

- 64b3fdb: Separate authorization services from application integration: the library provides decisions, permission-set and access-rule services, store contracts and handlers; the application plugin owns database adapters, migrations, identities and management UI.

  Add configurable root and default permission sets, protected-set metadata, transaction-bound service APIs, and integration with user management and Hub roles. Add database authorization for explicitly registered collections through Repository policies, plus a runnable example plugin.

  Provide a permission-set workspace with routed editing and user assignments, nested resource groups, field and record-scope controls, and a permission inspector. Localize management UI and request-specific resource labels. Application routes may declare signed-in access without a page grant.

  Migration ownership changes inline the existing table definitions in the application plugin. This changes the checksums of previously executed migrations; upgrade compatibility must be resolved before deploying to an existing database.

- 64b3fdb: Separate business resource declarations from underlying handler registration through `resourceTypes`. Remove transitional registration aliases and legacy title decoding. Store rule record IDs directly in each action's JSON, preserving independent named scopes without auxiliary record tables. Initialize the sales example and Hub permission titles directly in their final form, without development-version upgrade scripts.
- 64b3fdb: Add independent Policy-shaped relation permission declarations and immutable fluent builders, resolve target record scopes, and require explicit relation grants when narrowing repository API policies. Extend the sales authorization example with delivery-team associations, nested delivery checks, many-to-many collaborator notes, and an interactive relationship editor.

  Replace the business resource and collection/page declaration factories with callback-based authorization resources and reusable database permissions. Bind configuration keys at the action boundary, retain direct registration, and migrate the sales example without changing persisted grant or rule shapes.

  Move record access registration to the authorization core, add portable defineRecordAccess declarations, and consume repository-input FilterAst values only in the DB adapter. Migrate the sales example and policy selectors to generic resource references.

  Remove obsolete Business-prefixed public contracts and unused page/registry-bound builder entry points. Keep resource grant construction internal to the authorization package.

  Remove directional input/output objects from database grant fields. Use field lists or '*' per action, reject obsolete object-shaped grants, and update examples, documentation and tests. Request field directions remain supported.

- 64b3fdb: Support entry-level parent references for settings routes contributed by different plugins. Preserve route ownership and localization while resolving nested groups independently of plugin order.

  Split default access, sharing rules and restriction rules into application plugins that own management endpoints, stores, migrations and UI. Keep pure authorization rules and Store contracts in the authorization library and move permission-set management HTTP handlers to the application plugin. Update all application templates to explicitly compose the new plugins. The migration ownership change assumes a fresh installation.

- 64b3fdb: Add composed business operations with named data scopes and categorized business and administration groups. Permission and rule editors expose only this catalog; page, collection and custom resource handlers remain internal authorization targets.

  Enforce per-operation default access, sharing and restriction scopes while preserving field permissions. Return resolved underlying decisions and repository policies for inspection and execution.

  Use translation descriptors for permission titles, integrate permission-set assignments into user management, and demonstrate independent project, quote and order scopes with direct and team-based assignments.

- 64b3fdb: Support registered authorization subject selectors with permission-checked search, pagination, and name resolution. Share the dynamic picker across permission-set assignments, sharing rules, and restriction rules, and integrate the existing user service.
- 64b3fdb: Carry optional localized display titles on authorization sources and render inspection explanations from returned decisions. Remove the hard-coded rule-plugin pipeline, plugin-name labels and separate permission-set title catalogue; preserve explanations from custom plugins.
- 64b3fdb: Add composable, typed authorization builders with plugin-owned page and database grants, immutable scopes, and record-access policy registration. Support portable build/reference/register APIs and pure permission-set and rule DSL builders. Convert the sales example and its per-table seed data to shared fluent declarations while preserving authorization behavior.

  Separate page entry permissions from business data operations. Expose registered pages independently in permission sets and the inspector, and restrict business composition to database grants.

- 64b3fdb: Remove unused resource-handler group registries and item grouping metadata. Derive page display groups exclusively from client navigation routes, including pages also registered by the server, while keeping business resource groups separate.
- 64b3fdb: Unify grantable resource registration through getResource(type).items and separate recursive display groups. Move authorization settings to module-qualified items under the built-in settings resource, replace the database collections registration entry point, and preserve page navigation groups in the resource picker. Existing authorization settings grant records are not migrated.

  Replace the permission-set list and separate detail view with a collapsible, searchable sidebar and routed permission configuration and user-assignment tabs. Keep edits in the workspace with save/discard controls and protected-set restrictions. Present registered resources in an expandable tree with searchable field configuration in a local floating panel, and toggle simple permissions directly between full access and no grant.

### Patch Changes

- 64b3fdb: Run permission assignment revocation and replacement in a transaction, hold protected permission set locks before reading assignments, and notify permission changes only after commit. Concurrent removals can no longer delete the last active administrator assignment.
- 64b3fdb: Share request-scoped access constraints between business grant expansion and ordinary authorization checks, avoiding repeated rule queries while keeping scopes and request identities isolated.
- 64b3fdb: Add a paginated subject permission overview with grouped resource matrices, scope and field details, and structured authorization reasons. Reuse built-in rule lists within each authorization scope to avoid repeated database reads during batch inspection.
- @nocobase/db@1.0.0-beta.11

## 0.1.0-beta.7

### Patch Changes

- 028dd7c: Use host-provided peers for shared database types, authorization errors, service tokens, cache registries, and repository filter metadata. Declare their production providers in all application templates so deployments with automatic peer installation disabled retain the required runtime packages. Document the provider contract for generated plugins.

  Existing applications upgrading these packages must add compatible versions of their required shared peers to production dependencies: @nocobase/db, @nocobase/service-provider, @nocobase/repository-input, @nocobase/authorization, @nocobase/caching, @nocobase/i18n, and @nocobase/queue for the standard server stack, plus @nocobase/ai-employee when using its plugin. Update the lockfile and verify the production install; peer declarations do not remove incompatible historical versions automatically.

- Updated dependencies [028dd7c]
  - @nocobase/db@1.0.0-beta.8

## 0.1.0-beta.6

### Patch Changes

- 89955c5: Upgrade better-sqlite3 to ^13.0.3 and keep its dependency declaration in @nocobase/db-sqlite only. Remove redundant test dependencies from consumers so they use the same SQLite driver as applications.

  Preserve the bundled musl binary when building applications for Alpine Linux.

## 0.1.0-beta.5

### Patch Changes

- ceb356b: Fix published package metadata and database test driver registration.
- Updated dependencies [ceb356b]
- Updated dependencies [ceb356b]
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
- Updated dependencies [ceb356b]
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
- Updated dependencies [ceb356b]
- Updated dependencies [ceb356b]
- Updated dependencies [c960d07]
- Updated dependencies [c960d07]
- Updated dependencies [ceb356b]
- Updated dependencies [ceb356b]
  - @nocobase/db@1.0.0-beta.5

## 0.1.0-beta.4

### Minor Changes

- e3fa827: Add reusable user administration and Hub-scoped role-based authorization. Authentication now supports disabled accounts, transaction-aware administration, stable duplicate-identity conflicts, Session revocation, and immediate Realtime disconnects. Authorization supports protected Permission Sets, atomic scoped assignment replacement, and Client permission invalidation. The Users page supports protected role options, readable multi-role editing, explicit unassigned states, and a distinction between direct roles and authenticated-user defaults; password reset and database Session revocation share one transaction. The default App exposes its direct Authorization Permission Sets as application roles while keeping System administrator changes in Authorization. The Hub defines Administrator, Operator, and Viewer roles, batch-loads their user assignments, enforces every Hub and user-management action on the server, protects the final enabled Administrator, and hides unauthorized Client controls. Both templates register the reusable Users plugin; Hub exposes Applications, User management, and a read-only role matrix directly in its control-plane navigation, while the default App keeps Users in Settings. Only the Hub template receives Hub roles, disables public sign-up, and omits ordinary App Settings, workflows, notifications, and example plugins.

### Patch Changes

- Updated dependencies [0a3fa83]
  - @nocobase/db@1.0.0-beta.4

## 0.0.1-beta.3

### Patch Changes

- 6f9b399: Rewrite the template's agent and human documentation around building an application rather than developing a plugin. `README.md` now describes the project structure, how to run it, and what each of its own pnpm scripts does; `AGENTS.md` describes how to build a feature — pages, shadcn/ui components, endpoints, database access, migrations, and translations — and routes to a new `skills/nocobase-app-development/` skill whose references carry the detail. The nested `client/AGENTS.md` and `server/AGENTS.md` are rewritten to match: the server guide previously told agents to put new domain APIs in a plugin package, the opposite of what an application scaffold should say, and the client guide was largely about a `client-old/` directory that no longer exists.

  The page-to-sidebar path is now written down. Declaring a route makes the URL work but leaves the page out of navigation, which needs a Refine resource registered in `client/service-provider.ts`; the documentation previously described only the route half, so a page added by following it would have been unreachable from the sidebar. The guidance also now separates the directories business code belongs in from the framework scaffolding the template replaces on upgrade, and asks that both be updated together when an application changes that structure.

  The authorization Skill moves from `@nocobase/authorization` to `@nocobase/app-plugin-authorization` and is renamed `nocobase-app-plugin-authorization`. Skills synchronize from registered plugins, so one published by a library could never reach an application; its example also imported `@nocobase/authorization/database`, which an application does not depend on, and now imports the types the plugin re-exports.

  The guidance now points at the plugins an application already has. A prompt asking for approvals, notifications, or per-user record access was answerable only by building those from scratch, because nothing told an agent that `app-plugin-workflow`, `app-plugin-notification`, and `app-plugin-authorization` are installed and publish their own Skills — `.agents/skills/` was described only as generated output not to edit. Server route guidance also covered `can()` but not `authorize()`, so an ownership rule like "a salesperson sees only their own customers" had no documented path other than filtering rows in memory after fetching them, and scheduled work had no guidance at all.

  Application-owned migrations now reach the build. `database/migrations` and `database/seeds` exist in the template, and `tsconfig.server.json` compiles `database/**/*.ts`, so a migration an application writes is typechecked and emitted to `dist/database/` — which `scripts/build-server-dist-package.mjs` already expected to find. `pnpm migrate` applied such a migration before this change, but `pnpm build` silently dropped it. The unreferenced `tsconfig.migrations.base.json` is removed.

  `app-template-hub` receives the same framework-level change, since it is the same application scaffold with a different product identity: the rewritten documentation and the `nocobase-app-development` Skill, `CLAUDE.md`, and the migration build fix, which it had the identical version of. The repository `AGENTS.md` now records that framework changes to one template belong in the other by default, with the parts that stay template-specific.

## 0.0.1-beta.2

### Patch Changes

- Updated dependencies [174eab5]
  - @nocobase/db@1.0.0-beta.2

## 0.0.1-beta.1

### Patch Changes

- 0465323: Introduce the plugin-based authorization core and permission management UI. Replace the previous authorization API with composable core, database, permission-set, default-access, sharing-rule, restriction-rule, and page plugins; add route access metadata to the application client; publish and enable the authorization app plugin in the default template; and correct the Hub documentation to use the v3 Portal SDK package name.

## 0.0.1-beta.0

### Patch Changes

- da1b1b0: 首次发布。
- Updated dependencies [da1b1b0]
  - @nocobase/app-database@0.0.1-beta.0
