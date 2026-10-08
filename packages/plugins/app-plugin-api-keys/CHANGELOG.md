# @nocobase/app-plugin-api-keys

## 1.0.0-beta.13

### Minor Changes

- bc1e83f: Rotate a key in place: `ScopedApiKeys.rotate` (and `POST /api/api-keys/:id/rotate`) now keeps the key's id, name, description, scope and owner and replaces only its secret, renewing the expiry for the lifetime it had; the old secret stops at once. New `ScopedApiKeys` methods: `check` validates what `create` would issue without issuing it, `issueChecked` issues it, `get` reads one key, `setScope` replaces a scoped key's scope (checking the chosen records against whoever chooses them), and `update` renames a key or changes its description. An application may say who creates keys of their own with `setOwnKeyPolicy` (`mayCreateOwn`, `requireOwnCreation`): `POST /api/api-keys`, its rotation and Better Auth's own `/api-key/create` then answer 403 `API_KEY_CREATION_FORBIDDEN` to anyone else, and `GET /api/api-keys/scope-options` reports `mayCreate`.
- bc1e83f: Add scoped keys. A key may carry a scope of permission groups at read, write or admin level, optionally limited to some records; its effective permission is its owner's intersected with the scope. Plugins declare groups and presets as data, and the application assembles them through `apiKeyScopesToken`. The scope is stored in Better Auth's server-only `permissions` column. The plugin now has a server provider: it adds a request's key scope to the authorization identity (`keyScope`), tells authentication which sessions are scoped so `auth.required()` refuses them unless a route opts in, and keeps scoped keys and service-account keys away from every Better Auth account endpoint but `/get-session`. No API key manages keys any more, scoped or not: every `/api-key/*` endpoint answers 403 `API_KEY_SESSION_FORBIDDEN` to a request made with a key, and `requireSignInSession()` applies the same rule to an application's own key routes. `ScopedApiKeys` (`scopedApiKeysToken`) creates, lists (with the last use), rotates and revokes any user's keys, and `/api/api-keys` serves a person's own; `apiKeys.maxScopedKeyDays` caps a scoped key's life. The plugin now depends on `hono` and peers on `@nocobase/authorization` and `@nocobase/app-plugin-authorization`.
- bc1e83f: The person's own key routes follow the application's HTTP API rules. `/api/api-keys` is now `/api/apiKeys`: `GET /scope-options` → `GET /apiKeys/scopeOptions`, `GET /scope-objects/:group?search=&id=` → `GET /apiKeys/scopeObjects/:group?q=&id=`, `POST /:id/rotate` → `POST /apiKeys/:keyId/rotate`, `DELETE /:id` → `DELETE /apiKeys/:keyId`. `GET /apiKeys` and `GET /apiKeys/scopeObjects/:group` answer `{ data, meta: { total } }`. The create body is validated strictly (an unknown field is 400 `INVALID_INPUT`), and refusals answer in the standard error body with domain `apiKeys` and the former `code` as `reason`, instead of `{ code, message }`; a scope error names `scope` and an expiry error `expiresInDays` in `fieldViolations`, and `KEY_NOT_SCOPED` is `FAILED_PRECONDITION`. `requireSignInSession()` answers `API_KEY_SESSION_FORBIDDEN` in the standard body too. The new `toApiKeysApiError(error)` turns `ApiKeyScopeError` and `ApiKeyRequestError` into that body for an application's own key routes. The plugin now depends on `zod`.

### Patch Changes

- bc1e83f: An `AccessMapping` may map a ref to several actions of a resource (`{ resource, actions }`), such as a business action granted once per level (`edit.related`, `edit.all`): holding any of them is holding the ref when the key editor reports what a user holds, and a scope covering the ref allows every one. `ApiKeyScopes.accessOf` answers `MappedAccess` entries (`{ resource, actions }`) accordingly.
- bc1e83f: A key scope's group may now be limited to an empty list of records, which reaches none of them: the key holds the group's actions, so the commands and routes that need them are offered, while every record the owning plugin checks is refused. This lets a key be issued before the records it will reach exist, such as a repository's CI key before the repository has any App.
- bc1e83f: Name the command-line commands of users, API keys and the in-app inbox. The routes carry `x-cli` hints: `user list|create|update|delete|enable|disable|reset-password|revoke-sessions|options|role-scope set|invitation …|preference …` (the invitation link's `lookup` and `accept` stay off the command line), `api-key list|create|rotate|delete|scope-options|scope-objects`, and `inbox list|delete|mark-read|mark-unread|mark-all-read|unread-count`.
- be0fbbd: Client code merges class names with the `cn` package instead of `clsx` and `tailwind-merge`, so the plugins declare `cn` as a peer dependency in their place. The application templates provide it; an application that does not declare `cn` yet adds it to its `devDependencies`, or the client build cannot resolve these plugins. The AI employee registry item `nocobase-ai` lists `cn` instead of `clsx` and `tailwind-merge`, and the authentication plugin drops the two unused development dependencies.
- bc1e83f: Command-line sign-in through the browser with Better Auth's official device authorization (RFC 8628). The templates enable `deviceAuthorization()` and `bearer()` in `server/config/auth.ts`, accepting the client id `nocobase-cli`, register `deviceAuthorizationClient()` in `client/config/auth.ts`, create the `deviceCode` table in a new migration (`202610060001_create_device_code`), and add a signed-in `/device` page built from the new `device-approval` UI Library block, preinstalled in `client/extensions/nocobase-device-approval/`. An existing application adopts it by copying those pieces and running `pnpm nocobase db apply`.

  The authentication plugin places an app-local `verificationUri` such as `/device` below the application's public base path, documents a `bearerAuth` security scheme beside `cookieAuth` when `bearer()` is enabled, and documents `/api/auth/device/code` and `/api/auth/device/token` as callable without a credential. A guest page now sends a signed-in visitor to its `redirect` search parameter when it names a path in the application, and to `/` otherwise. The Skill gains a reference on enabling any official Better Auth plugin, including the migration its tables need.

  The API keys plugin refuses an API key on the device approval endpoints (`/api/auth/device`, `/device/approve`, `/device/deny`) with `API_KEY_SESSION_FORBIDDEN`: approving issues a session, which takes a sign-in.

- bc1e83f: Declare the `/api/apiKeys` routes in the API document, under the `ApiKeys` tag, with response schemas for keys, created keys and scope options. API documentation access and the `apiKeyAuth` security scheme are now registered by the plugin's single `ApiKeysProvider`.
- bc1e83f: Confirm revoking a key in an AlertDialog that names the key, and keep the dialog footer in view on short screens.
- bc1e83f: Select popups grow with their options instead of taking the trigger's width, up to `max-w-sm` or the space beside them, and wrap a long option rather than cutting it off. The UI guidelines add this as rule I12, with the class every `SelectContent` takes.
- Updated dependencies [37c8d20]
- Updated dependencies [37c8d20]
- Updated dependencies [37c8d20]
- Updated dependencies [bc1e83f]
- Updated dependencies [bc1e83f]
- Updated dependencies [bc1e83f]
- Updated dependencies [bc1e83f]
- Updated dependencies [37c8d20]
- Updated dependencies [37c8d20]
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
- Updated dependencies [bc1e83f]
- Updated dependencies [37c8d20]
- Updated dependencies [bc1e83f]
- Updated dependencies [37c8d20]
- Updated dependencies [bc1e83f]
- Updated dependencies [6162033]
  - @nocobase/app-client@2.0.0-beta.1
  - @nocobase/app-server@2.0.0-beta.1
  - @nocobase/app-plugin-authentication@2.0.0-beta.1
  - @nocobase/authorization@1.0.0-beta.12
  - @nocobase/app-plugin-authorization@1.0.0-beta.25
  - @nocobase/db@1.0.0-beta.18
  - @nocobase/i18n@1.0.0-beta.5
  - @nocobase/service-provider@0.0.2-beta.1

## 1.0.0-beta.12

### Patch Changes

- e123790: Move `@nocobase/app-server`, `@nocobase/app-client`, `@nocobase/app-plugin-authentication`, `@nocobase/app-plugin-users`, `@nocobase/app-plugin-hub`, `@nocobase/app-plugin-workflow` and `@nocobase/app-plugin-ai-employee` to the 2.0.0 prerelease line. The HTTP API migration released in 1.0.0-beta.N changed every route and the error body, but in prerelease mode a `major` changeset on a version that is already a `1.0.0` prerelease only increments the prerelease number, so nothing in the version said the change was breaking. These packages now release as `2.0.0-beta.0`, and every package that depends on or peers with one of them is released again so that its published range is `^2.0.0-beta.0` rather than a `^1.0.0-beta` range the new versions do not satisfy. An application upgrading to these versions upgrades all of them together.
- Updated dependencies [e123790]
  - @nocobase/app-client@2.0.0-beta.0
  - @nocobase/app-plugin-authentication@2.0.0-beta.0
  - @nocobase/app-server@2.0.0-beta.0

## 1.0.0-beta.11

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

### Minor Changes

- 0b933b3: Let signed-in sessions and API keys read the application's OpenAPI document, and document Better Auth's endpoints in it.

  - `@nocobase/app-plugin-authentication` registers an access check that lets a request with a valid session read `GET /api/swagger` and the Swagger UI at `GET /api/swagger/docs`; the session is resolved without extending its expiry or setting cookies. It also merges Better Auth's endpoints into the document from Better Auth's own OpenAPI generator, at their full `/api/auth/...` paths and tagged `Authentication`, including those of the Better Auth plugins the application configures. Browser-only steps (social sign-in and account linking, the OAuth callback, email links and the error page) are left out, and Better Auth's own `/reference` page is not served. The `/api/auth/*` route is declared hidden. The document names the session cookie as the `cookieAuth` security scheme, with the cookie name Better Auth actually sets under the application's configuration (cookie prefix and `__Secure-` prefix included), and requires it at the top level; Better Auth's endpoints a caller reaches without a session — sign-in, sign-up, the password reset request and reset, the verification email, username availability, `get-session` and `ok` — declare `security: []`. `Auth.getSession()` accepts `{ disableRefresh: true }`, `Auth.plugin(id)` returns a configured Better Auth plugin, `Auth.openAPISchema()` returns Better Auth's generated description, and `Auth.sessionCookieName()` returns the session cookie's name.
  - `@nocobase/app-plugin-api-keys` registers an access check that lets a request carrying a valid, enabled, unexpired API key read the same document. It also adds the API key header to the document as the `apiKeyAuth` security scheme — the first header the configured `apiKey()` plugin reads keys from, `x-api-key` by default — offered beside `cookieAuth` as an alternative, so Swagger UI's "Authorize" sends a key with every request it makes; without a configuration that turns keys into sessions it adds nothing. `apiKey()` now exposes its configurations as `options.configurations`, and the server entry exports `findRequestApiKey()` and `createApiKeyApiDocsAccess()`.

### Patch Changes

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
- Updated dependencies [0b933b3]
- Updated dependencies [0b933b3]
- Updated dependencies [be0fbbd]
- Updated dependencies [be0fbbd]
- Updated dependencies [21d274c]
  - @nocobase/app-server@1.0.0-beta.33
  - @nocobase/app-client@1.0.0-beta.25
  - @nocobase/app-plugin-authentication@1.0.0-beta.25
  - @nocobase/db@1.0.0-beta.17
  - @nocobase/i18n@1.0.0-beta.5
  - @nocobase/service-provider@0.0.2-beta.1

## 0.1.0-beta.10

### Patch Changes

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
  - @nocobase/app-plugin-authentication@1.0.0-beta.24
  - @nocobase/db@1.0.0-beta.16
  - @nocobase/service-provider@0.0.2-beta.1

## 0.1.0-beta.9

### Patch Changes

- 41f478f: Cite `lucide-react` instead of `sonner` as the example client peer in the plugin `AGENTS.md`, since plugins report toasts through the application and no longer depend on `sonner`.
- Updated dependencies [db16945]
  - @nocobase/app-client@1.0.0-beta.23
  - @nocobase/app-plugin-authentication@1.0.0-beta.24

## 0.1.0-beta.8

### Patch Changes

- 02d5402: `@nocobase/app-cli` is now the whole application command line: it provides the `nocobase` bin and absorbs `@nocobase/nb3-cli` (command assembly, the plugin contract, plugin and Skill management) and `@nocobase/app-tools` (`dev`, `build`, `start`, `server-deps`). Neither of those two packages is published any more, and there is no compatibility period.

  - **Commands.** Standard commands leave the `app` topic: `nocobase db apply`, `nocobase config init`, `nocobase collections generate`. `app db doctor` is now `collections doctor`, `app i18n:check` is now `locales check`, and `app upload`/`app deploy` are `release upload`/`release deploy`, registered only when `package.json` sets `nocobase.cli.publishing: true`. New commands `dev`, `build`, `start`, `dist retarget` and `dist check` replace the application's `scripts/*.mjs`. `plugin skills sync` and `plugin cli-hooks` are removed; use `skills sync`. `app` now holds only an application's own commands.
  - **Discovery.** Commands are found by path: an application's `cli/commands/orders/sync.ts` answers to `nocobase app orders sync`, with no index to maintain. The bin finds the application from the nearest `package.json` (`nocobase.templateKind` for a source checkout, `nocobase.buildTarget` for a built `dist/`), or from `NOCOBASE_APP_ROOT`; applications no longer have a `cli/index.ts`. A built-in command runs without importing the application's plugins.
  - **Plugins.** A plugin's topic is its package name without the scope and `app-plugin-` prefix, so the scheduler's commands move from `schedule` to `scheduler` and the CLI example's from `demo` to `cli-example`. `defineCliPlugin` accepts `devCommands`, which a built `dist/` leaves out; the workflow plugin's `check` and `build` are development commands. Plugins declare `@nocobase/app-cli` as their peer instead of `@nocobase/nb3-cli`.
  - **Deployment.** `nocobase build` writes `dist/cli/index.js`, so `node dist/cli/index.js db apply` runs from any directory without pnpm; `dist/package.json` keeps only the `start` and `nocobase` scripts. The `migrate` and `seed` scripts it used to generate pointed at commands that no longer existed and are gone. Development tooling (`typescript`, `tsx`, `vite`, `prettier`, `tar`, `@nocobase/dev-config`) is an optional peer, so a deployment installs none of it.
  - **Templates.** Scripts are reduced to `postinstall`, `dev`, `build`, `start` and the quality checks; every other command is `pnpm nocobase <topic> <command>`. `scripts/`, `cli/index.ts` and `cli/commands/index.ts` are removed.

  Upgrading an existing application requires moving to the new layout in one step: see "Shared application scripts and commands" in the `nocobase-app-upgrade` Skill (`packages/app/app-skills/skills/nocobase-app-upgrade/references/edge-cases.md`) for the full procedure. Messages that named `nocobase app db repair` and similar commands now name the new ids.

- ec92b20: Plugin commands are `AppCommand`s and print the command envelope under `--json`. `scheduler sync` creates the application through `withApp()`, so it acts on the application the runner located rather than the current directory and always destroys the runtime. `workflow build` path flags are `appPath()` flags, so their defaults resolve against the application root from any directory. The CLI example's `artifact build` is a development command, and `pnpm plugin:create --with cli` generates an `AppCommand` with a test that uses `@nocobase/app-cli/testing`.

  The application Skill gains a reference on adding an application command, and the application templates and plugin `AGENTS.md` files describe commands in those terms: a command returns its result, throws `CommandError`, and creates the application with `withApp()` when it needs it. The templates import the CLI authoring API from `@nocobase/app-cli`.

- dbf5631: Replace guidance that named removed commands and layouts. The Hub's development page names the archive `nocobase build --tar` actually writes, `storage/exports/dist.tar.gz`. The scheduler Skill synchronizes with `pnpm nocobase scheduler sync` instead of `nb3 schedule:sync` and gives the deployed form, `node dist/cli/index.js scheduler sync --finalize`. The repository example applies its migrations and seeds with `nocobase db apply`, the CLI example's Skill matches its manifest and the stdout-only `--json` contract, and the i18n Skill no longer presents `pnpm i18n:check` as the monorepo form of `locales check`. Plugin `AGENTS.md` files carry the current dependency rules from the plugin template.
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
  - @nocobase/i18n@1.0.0-beta.4
  - @nocobase/service-provider@0.0.2-beta.1

## 0.1.0-beta.7

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

## 0.1.0-beta.6

### Patch Changes

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
  - @nocobase/i18n@1.0.0-beta.4
  - @nocobase/service-provider@0.0.2-beta.1

## 0.1.0-beta.5

### Patch Changes

- 709f9ed: Update Better Auth and API keys to 1.7.5 and align fresh authentication databases with provider-based account identity. Existing authentication databases must be recreated; the original account migration has changed and no compatibility migration is provided.
- fa01814: Add `db apply` and `db reset`, and retire `migrate --fresh`.

  `nocobase app db apply` (`pnpm db:apply`) runs migrations and seeds as one plan, in the order startup runs them: each connection is migrated, then seeded. Only pending tasks run, so repeating it is safe. `nocobase app db reset` (`pnpm db:reset`) drops every managed schema object first and reruns both from empty; it asks for confirmation and requires `--force` in CI or a non-interactive terminal.

  `migrate --fresh` is removed and now exits with a pointer to `db reset`. It rebuilt the schema without reseeding, so it left the seed history cleared and no seed executed — the default connection recovered on the next startup, and a connection with `autoRun: false` did not.

  The `migrate` and `seed` commands are removed along with their template scripts; `db apply` replaces both. Running one half on its own is not a separate command, because both halves apply only what is pending: on an already-migrated database `db apply` applies seeds alone, and the one case it does not cover — migrating ahead of a deployment without seeding — can be served by a flag later without breaking anything.

  `runAppDatabaseTasks` accepts several task kinds in one plan through its `kind` option, which is what makes a reset correct across both kinds: one plan means a connection's schema is rebuilt by its migrations task before its seeds run.

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
  - @nocobase/i18n@1.0.0-beta.4
  - @nocobase/service-provider@0.0.2-beta.1

## 0.1.0-beta.4

### Patch Changes

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
- Updated dependencies [fe564d9]
- Updated dependencies [fe564d9]
  - @nocobase/app-client@1.0.0-beta.19
  - @nocobase/app-server@1.0.0-beta.21
  - @nocobase/app-plugin-authentication@0.1.0-beta.18
  - @nocobase/db@1.0.0-beta.11
  - @nocobase/i18n@1.0.0-beta.4
  - @nocobase/service-provider@0.0.2-beta.1

## 0.1.0-beta.3

### Patch Changes

- 365a9fe: Complete English and Chinese translations for authentication, route feedback, authorization, shared controls, File and Notification Registry components, and development examples. Use concise semantic keys consistently for the new translations. Resolve AI Registry copy from the active language and localize development navigation and section headings. Translate MCP configuration guidance, tool drawer labels, and transport descriptions.
- 60fa139: Add confirmed user deletion for Hub platform administrators. Protect the current user, the last active platform administrator, and users who own applications. Revoke sessions and API Keys transactionally while retaining an inactive identity record for historical attribution. Prevent new applications and publishing keys from being created for deleted owners.
- 60fa139: Reuse the API Keys plugin through configuration-bound server operations and a scoped Authentication plugin API that preserves hooks and caller-owned transactions. Add per-application publishing API key management in Hub with one-time secret display, scoped Release and Deployment access, expiration, revocation, and current-owner permission checks.
- 60fa139: Add streamed, checksum-verified Hub release uploads, persistent upload and deployment retry identities, explicit upload-and-deploy requests, and App CLI upload/deploy commands. Reuse existing upload-release and deploy authorization actions and expose minimal deployment status for CI. Preserve historical releases during canonical checksum migration. Normalize permissions returned by the generic API key service.

  Support optional runtime configuration files for deploy and upload-with-deploy, with bounded streaming transport, existing configuration reuse, and configuration-aware retry checks.

  Reject upload-and-deploy requests that cannot return a publishing deployment, including CLI calls without waiting. Correct the unmerged publishing migration rollback.

- 60fa139: Declare the Better Auth API Key plugin's runtime peers explicitly so deployments with automatic peer installation disabled can load the plugin even when Better Auth's own dependencies are nested.
- Updated dependencies [d4ca00e]
- Updated dependencies [60fa139]
- Updated dependencies [24e771f]
- Updated dependencies [60fa139]
- Updated dependencies [26ac480]
  - @nocobase/app-client@1.0.0-beta.18
  - @nocobase/app-plugin-authentication@0.1.0-beta.17
  - @nocobase/db@1.0.0-beta.9
  - @nocobase/app-server@1.0.0-beta.18
  - @nocobase/i18n@1.0.0-beta.4
  - @nocobase/service-provider@0.0.2-beta.1

## 0.1.0-beta.2

### Patch Changes

- 6acf3bc: Use plugin-owned PageContainer components to unify settings page width, spacing, and responsive padding across database exploration, user management, API keys, workflows, and notification logs.

  Use plugin-owned PageHeader components for consistent titles, descriptions, and page actions while preserving permission checks and workflow detail navigation.

  Preserve spacing below workflow tabs and wrap workflow list filters and actions on narrow screens.

  Restore spacing between workflow detail back links and headings, and keep execution duration cells aligned when table rows grow.

- Updated dependencies [89955c5]
  - @nocobase/app-plugin-authentication@0.1.0-beta.15
  - @nocobase/app-server@1.0.0-beta.15
  - @nocobase/db@1.0.0-beta.7

## 0.1.0-beta.1

### Patch Changes

- a60decd: Require an explicit absolute baseDir for Server plugins and resolve migrations, seeds, jobs, and package metadata from the loaded plugin copy. Generate and validate database task manifests during builds so TypeScript and JavaScript share source checksums, with verified legacy JavaScript history conversion and synchronized plugin scaffolding and application templates.
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
  - @nocobase/i18n@1.0.0-beta.4
  - @nocobase/service-provider@0.0.2-beta.1

## 0.1.0-beta.0

### Minor Changes

- 154e09e: Add `@nocobase/app-plugin-api-keys`, which lets scripts and integrations call an application's API as the user who issued the key.

  The package is Better Auth's API Key plugin plus the parts an application needs around it: the `apikey` table migration, a self-service Settings page where each user creates and revokes their own keys, and `apiKey` and `apiKeyClient` carrying Better Auth's own names and options. `apiKey` is wrapped only to supply three defaults, all of them overridable; its documentation applies unchanged.

  The re-export is what keeps the migration honest. That table has to match the schema the installed `@better-auth/api-key` declares, so both come from one package rather than from a dependency each application pins separately; a test asserts the table carries a column for every field the plugin declares.

  Configured in `auth.plugins`, `Auth.getSession()` resolves an `x-api-key` header the same way it resolves a session cookie, so `auth.required()`, the route guards, and Authorization all see the owning user and exactly the roles that user holds. No application route needs to know a request arrived by key.

  The three defaults are `enableSessionForAPIKeys: true`, `rateLimit: { enabled: false }` and `requireName: true`. The first is the one that has to be set: Better Auth defaults it off, and with it off a key authenticates nothing — the page still issues keys and every request carrying one answers 401, with nothing pointing at the configuration. The second avoids the upstream default of 10 requests per key per day, which is a quota for issuing keys rather than for using them. Supplying them here rather than in each application's auth config is what keeps a required setting from being something an application can silently get wrong.

  A key is its owner, so it also reaches the Better Auth endpoints a session reaches — including `/api-key/create`, which means a key can mint a successor with its own expiry that revoking the first key does not revoke. Revoking a leaked key means reviewing the owner's whole list. An application that wants that closed adds its own `before` hook.

### Patch Changes

- Updated dependencies [154e09e]
- Updated dependencies [154e09e]
- Updated dependencies [c01baf6]
  - @nocobase/app-plugin-authentication@0.1.0-beta.12
  - @nocobase/i18n@1.0.0-beta.4
  - @nocobase/app-client@1.0.0-beta.15
  - @nocobase/app-server@1.0.0-beta.13

## 0.0.1

### Patch Changes

- Add the initial plugin scaffold.
