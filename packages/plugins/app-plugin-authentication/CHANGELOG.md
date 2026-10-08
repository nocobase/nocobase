# @nocobase/app-plugin-authentication

## 2.0.0-beta.1

### Minor Changes

- bc1e83f: Derive Better Auth's keys from the application's secrets keys. When the configuration sets neither `auth.secret` nor `auth.secrets`, the plugin passes Better Auth versioned `secrets` derived from `secrets.keys` for the purpose `@nocobase/app-plugin-authentication/better-auth`, so adding a key to `secrets.keys` rotates them; an `auth.secret` set alongside `secrets.keys` is passed as Better Auth's legacy secret so data encrypted before still decrypts, and `auth.secret` alone keeps working as before. With neither, the application refuses to start with `ApplicationNotConfiguredError` naming `secrets.keys` and `SECRETS_KEYS`. `resolveAuthSecrets` is the new resolver; `resolveAuthSecret` is deprecated.

  Better Auth signs its session cookie with the current key only, so putting a new key first signs every user out once, and so does adding `secrets.keys` to an application that only had `auth.secret`. Encrypted account data, such as OAuth tokens, stays readable while the older key remains in the list.

- bc1e83f: Add service accounts and scoped-credential checks. A user now has a `kind` (`person`, or `service` for an account that acts only through API keys) and a `description`, added by the migration `202610020101_add_user_kind`; existing users are people. A service account never signs in: every session it would get is refused with `SERVICE_ACCOUNT_NO_LOGIN`, whichever sign-in method created it, it is never given a password or a linked provider, and its reset link is never sent. `UserAdministrationService` gains `createServiceAccount` and `updateServiceAccount`, reports `kind` and `description`, lists people unless asked for `kind: 'service'` or `'all'`, and refuses to set a service account's password (`SERVICE_ACCOUNT_NO_PASSWORD`). `auth.required()` refuses a scoped credential — an API key with a scope, recognized by checks registered with `auth.addScopedCredentialCheck`, or any key of a service account — with 403 `SCOPED_KEY_FORBIDDEN` unless the route opts in with `required({ scopedKeys: true })`.
- bc1e83f: Command-line sign-in through the browser with Better Auth's official device authorization (RFC 8628). The templates enable `deviceAuthorization()` and `bearer()` in `server/config/auth.ts`, accepting the client id `nocobase-cli`, register `deviceAuthorizationClient()` in `client/config/auth.ts`, create the `deviceCode` table in a new migration (`202610060001_create_device_code`), and add a signed-in `/device` page built from the new `device-approval` UI Library block, preinstalled in `client/extensions/nocobase-device-approval/`. An existing application adopts it by copying those pieces and running `pnpm nocobase db apply`.

  The authentication plugin places an app-local `verificationUri` such as `/device` below the application's public base path, documents a `bearerAuth` security scheme beside `cookieAuth` when `bearer()` is enabled, and documents `/api/auth/device/code` and `/api/auth/device/token` as callable without a credential. A guest page now sends a signed-in visitor to its `redirect` search parameter when it names a path in the application, and to `/` otherwise. The Skill gains a reference on enabling any official Better Auth plugin, including the migration its tables need.

  The API keys plugin refuses an API key on the device approval endpoints (`/api/auth/device`, `/device/approve`, `/device/deny`) with `API_KEY_SESSION_FORBIDDEN`: approving issues a session, which takes a sign-in.

- bc1e83f: `auth.required()` refuses a scoped credential in the standard error body — 403 `PERMISSION_DENIED`, reason `SCOPED_KEY_FORBIDDEN`, domain `authentication` — instead of `{ code, message }`.
- 37c8d20: Add issued credentials: `Auth.addCredentialResolver()` lets a plugin recognize a credential of its own, such as an agent's run token, as a scoped session acting for a user (`AuthSession.credential`). A route accepts it only when it opts in to scoped credentials and its own security requirements list the credential's scheme; otherwise it answers 403 `CREDENTIAL_NOT_ACCEPTED`. `@nocobase/app-server/router` adds `declaredRouteOf()` and `routeAcceptsScheme()` for reading the answering route's declaration from a middleware.

### Patch Changes

- bc1e83f: Show authentication errors in the person's language. The password sign-in, registration and reset actions now map the server's error code (Better Auth's, such as `INVALID_EMAIL_OR_PASSWORD`, its username plugin's, and this plugin's `ACCOUNT_DISABLED` and `SERVICE_ACCOUNT_NO_LOGIN`) to a message from the plugin's new `en-US` and `zh-CN` locales, report a rate limit and an unreachable server in their own words, and otherwise fall back to a generic localized message instead of the response's status text (a wrong password used to read "Unauthorized"). `AuthenticationActionError` gains an optional `code`. The plugin now declares `@nocobase/i18n` as a peer dependency, which applications already install.
- bc1e83f: Describe a service account as the identity an application may give an API key of its own, rather than as a robot, in the Skill and the code documentation.
- bc1e83f: Better Auth's endpoints under `/api/auth/` stay documented but are left off the application's command line: they are the browser's sign-in and session flow.
- be0fbbd: Client code merges class names with the `cn` package instead of `clsx` and `tailwind-merge`, so the plugins declare `cn` as a peer dependency in their place. The application templates provide it; an application that does not declare `cn` yet adds it to its `devDependencies`, or the client build cannot resolve these plugins. The AI employee registry item `nocobase-ai` lists `cn` instead of `clsx` and `tailwind-merge`, and the authentication plugin drops the two unused development dependencies.
- 37c8d20: Describe every environment variable an application reads, and write the description into the build. An environment mapping now carries optional metadata — `description`, `secret`, `required`, `generate` (`secret`, `secretKeys` or `password`) and `firstStartOnly` — given as the second argument of `envString`, `envInteger` and `envBoolean` (the third of `envStrings`), and the helpers record the value's `type`. `@nocobase/config` also exports `isSecretPath`, which tells a secret path by its last word. Metadata changes nothing about how a variable is read.

  `AppConfig.environmentVariableMappings()` in `@nocobase/app-server` returns each variable's full mapping with its absolute path, `{ AUTH_SECRET: { path: 'auth.secret', type: 'string', … } }`; `sectionEnvironmentVariables()` still returns the paths alone. `@nocobase/app-server/config` adds `buildVariablesManifest`, `requiredOf`, `isExamplePlaceholder` and `KNOWN_EXAMPLE_PLACEHOLDERS`: a variable is required unless the code defaults or `config.example.yml` give its path a real value — `admin123` and `replace-with-a-unique-secret` count as none — it can be generated, or `required: false` says so. `@nocobase/app-server/database` adds `connectionEnvironment(connection, prefix = 'DB')`, which maps `<prefix>_DIALECT`, `_HOST`, `_PORT`, `_DATABASE`, `_USERNAME`, `_PASSWORD`, `_SSL` and `_FILENAME` onto a connection, and `defineAppDatabaseConfig` takes a second argument, `{ env, validate }`, to declare them. `AppIdentityConfig` gains `sampleData`. `SECRETS_KEYS`, `API_BODY_LIMIT` and `API_TIMEOUT` carry their metadata, and `AUTH_SECRET` from `@nocobase/app-plugin-authentication` is a secret a deployment may generate.

  `@nocobase/app-plugin-users` exports `defineUsersConfig` and `USERS_ENVIRONMENT` from `@nocobase/app-plugin-users/server/config`, mapping `INITIAL_ADMIN_USERNAME`, `INITIAL_ADMIN_EMAIL` and `INITIAL_ADMIN_PASSWORD` onto `users.initialAdmin`, read only on the first start; `UsersConfig` declares `initialAdmin`.

  `@nocobase/app-cli` adds `pnpm nocobase config variables [--out <file>]`, which prints the manifest — every variable with its path, description, whether it is a secret, required, generated or read only on the first start — and `pnpm build` writes it to `dist/variables.json` before generating the server package; a failure fails the build. `config env` marks each variable as a secret or required, and its `--json` entries gain `secret` and `required`.

  The templates declare `DB_*` for the main connection in `server/config/database.ts`, `INITIAL_ADMIN_*` in `server/config/users.ts` (new in Default and Examples; Hub switches to `defineUsersConfig`), `APP_SAMPLE_DATA` for `app.sampleData`, and a description on every variable they map. `config.example.yml` no longer shows `${NAME}`, which was never expanded. Nothing changes for an application that sets none of the new variables: `users.initialAdmin` keeps its example values and `config init` is unchanged. To adopt this in an existing application, copy `server/config/database.ts`, `server/config/users.ts` (and its entry in `server/config/index.ts`), `app.ts` and the `env` declarations of the other section files from the new template version.

- Updated dependencies [37c8d20]
- Updated dependencies [37c8d20]
- Updated dependencies [37c8d20]
- Updated dependencies [37c8d20]
- Updated dependencies [37c8d20]
- Updated dependencies [37c8d20]
- Updated dependencies [37c8d20]
- Updated dependencies [37c8d20]
- Updated dependencies [37c8d20]
- Updated dependencies [6993158]
- Updated dependencies [a6796d9]
- Updated dependencies [37c8d20]
- Updated dependencies [37c8d20]
- Updated dependencies [37c8d20]
- Updated dependencies [37c8d20]
  - @nocobase/app-client@2.0.0-beta.1
  - @nocobase/app-server@2.0.0-beta.1
  - @nocobase/db@1.0.0-beta.18
  - @nocobase/caching@0.1.0-beta.2
  - @nocobase/i18n@1.0.0-beta.5
  - @nocobase/service-provider@0.0.2-beta.1

## 2.0.0-beta.0

### Major Changes

- e123790: Move `@nocobase/app-server`, `@nocobase/app-client`, `@nocobase/app-plugin-authentication`, `@nocobase/app-plugin-users`, `@nocobase/app-plugin-hub`, `@nocobase/app-plugin-workflow` and `@nocobase/app-plugin-ai-employee` to the 2.0.0 prerelease line. The HTTP API migration released in 1.0.0-beta.N changed every route and the error body, but in prerelease mode a `major` changeset on a version that is already a `1.0.0` prerelease only increments the prerelease number, so nothing in the version said the change was breaking. These packages now release as `2.0.0-beta.0`, and every package that depends on or peers with one of them is released again so that its published range is `^2.0.0-beta.0` rather than a `^1.0.0-beta` range the new versions do not satisfy. An application upgrading to these versions upgrades all of them together.

### Patch Changes

- Updated dependencies [e123790]
  - @nocobase/app-client@2.0.0-beta.0
  - @nocobase/app-server@2.0.0-beta.0

## 2.0.0-beta

Moves the package to the 2.0.0 prerelease line, so that the breaking changes released as 1.0.0-beta.25 show in the major version. This version is never published; the first release on the line is 2.0.0-beta.0.

## 1.0.0-beta.25

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

- 463a7a8: A new `@nocobase/app-plugin-authentication/testing` entry lets other packages' tests act as a signed-in user. `signIn(app, { email | username, password })` signs in through the application's own sign-in route and returns the session: its user, its cookie, and a `fetch` that sends requests as that user, resolving a path against the application's API root. `DEFAULT_ADMIN_CREDENTIALS` names the administrator the default-administrator seed creates when `users.initialAdmin` is not configured. Nothing in it depends on a test runner.
- 0b933b3: Let signed-in sessions and API keys read the application's OpenAPI document, and document Better Auth's endpoints in it.

  - `@nocobase/app-plugin-authentication` registers an access check that lets a request with a valid session read `GET /api/swagger` and the Swagger UI at `GET /api/swagger/docs`; the session is resolved without extending its expiry or setting cookies. It also merges Better Auth's endpoints into the document from Better Auth's own OpenAPI generator, at their full `/api/auth/...` paths and tagged `Authentication`, including those of the Better Auth plugins the application configures. Browser-only steps (social sign-in and account linking, the OAuth callback, email links and the error page) are left out, and Better Auth's own `/reference` page is not served. The `/api/auth/*` route is declared hidden. The document names the session cookie as the `cookieAuth` security scheme, with the cookie name Better Auth actually sets under the application's configuration (cookie prefix and `__Secure-` prefix included), and requires it at the top level; Better Auth's endpoints a caller reaches without a session — sign-in, sign-up, the password reset request and reset, the verification email, username availability, `get-session` and `ok` — declare `security: []`. `Auth.getSession()` accepts `{ disableRefresh: true }`, `Auth.plugin(id)` returns a configured Better Auth plugin, `Auth.openAPISchema()` returns Better Auth's generated description, and `Auth.sessionCookieName()` returns the session cookie's name.
  - `@nocobase/app-plugin-api-keys` registers an access check that lets a request carrying a valid, enabled, unexpired API key read the same document. It also adds the API key header to the document as the `apiKeyAuth` security scheme — the first header the configured `apiKey()` plugin reads keys from, `x-api-key` by default — offered beside `cookieAuth` as an alternative, so Swagger UI's "Authorize" sends a key with every request it makes; without a configuration that turns keys into sessions it adds nothing. `apiKey()` now exposes its configurations as `options.configurations`, and the server entry exports `findRequestApiKey()` and `createApiKeyApiDocsAccess()`.

### Patch Changes

- 7e5b7d4: Describe the sign-in pages as application code that wires the UI Library's presentational authentication components (`auth-forms`, `auth-methods`, `auth-split-layout`) to the headless actions, in place of the removed `auth-ui` block, in the authentication Skill, its README and the development Skill's i18n and styling references.
- be0fbbd: User administration's search and the workflow list's search parameter `q` match regardless of case on every database. They used the Repository's default string mode, which follows the database's own comparison: case-insensitive on SQLite and MySQL, case-sensitive on PostgreSQL, where searching `alice` did not find `Alice`. Both now pass `{ mode: 'insensitive' }`.
- be0fbbd: Tests in these plugins and example plugins take their fixtures from `@nocobase/app-testing` alone: database fixtures such as `createDatabaseTest()`, `describeMigration()` and `expectCollection()` from `@nocobase/app-testing/server`, and the command runner from `@nocobase/app-testing/cli`. Each package replaces its `@nocobase/db-testing` development dependency with `@nocobase/app-testing`. Nothing any of them ships changes.
- be0fbbd: Database tests in these plugins and example plugins take their database from `@nocobase/db-testing` instead of configuring an in-memory SQLite database, so they run on SQLite by default and on the database `NOCOBASE_TEST_DB_DIALECT` selects otherwise. Schema assertions that read `PRAGMA` output or `sqlite_master` are written with `expectCollection()` against Field and Collection names, migration up and down tests use `describeMigration()`, and the SQLite triggers that made a write fail are replaced by spies on the write. Each package replaces its `@nocobase/db-sqlite` development dependency with `@nocobase/db-testing`; nothing any of them ships changes.
- Updated dependencies [21d274c]
- Updated dependencies [21d274c]
- Updated dependencies [299b35a]
- Updated dependencies [463a7a8]
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
- Updated dependencies [3f01f61]
- Updated dependencies [21d274c]
- Updated dependencies [0b933b3]
- Updated dependencies [21d274c]
  - @nocobase/app-server@1.0.0-beta.33
  - @nocobase/app-client@1.0.0-beta.25
  - @nocobase/db@1.0.0-beta.17
  - @nocobase/caching@0.1.0-beta.2
  - @nocobase/service-provider@0.0.2-beta.1

## 1.0.0-beta.24

### Patch Changes

- 02d5402: `@nocobase/app-cli` is now the whole application command line: it provides the `nocobase` bin and absorbs `@nocobase/nb3-cli` (command assembly, the plugin contract, plugin and Skill management) and `@nocobase/app-tools` (`dev`, `build`, `start`, `server-deps`). Neither of those two packages is published any more, and there is no compatibility period.

  - **Commands.** Standard commands leave the `app` topic: `nocobase db apply`, `nocobase config init`, `nocobase collections generate`. `app db doctor` is now `collections doctor`, `app i18n:check` is now `locales check`, and `app upload`/`app deploy` are `release upload`/`release deploy`, registered only when `package.json` sets `nocobase.cli.publishing: true`. New commands `dev`, `build`, `start`, `dist retarget` and `dist check` replace the application's `scripts/*.mjs`. `plugin skills sync` and `plugin cli-hooks` are removed; use `skills sync`. `app` now holds only an application's own commands.
  - **Discovery.** Commands are found by path: an application's `cli/commands/orders/sync.ts` answers to `nocobase app orders sync`, with no index to maintain. The bin finds the application from the nearest `package.json` (`nocobase.templateKind` for a source checkout, `nocobase.buildTarget` for a built `dist/`), or from `NOCOBASE_APP_ROOT`; applications no longer have a `cli/index.ts`. A built-in command runs without importing the application's plugins.
  - **Plugins.** A plugin's topic is its package name without the scope and `app-plugin-` prefix, so the scheduler's commands move from `schedule` to `scheduler` and the CLI example's from `demo` to `cli-example`. `defineCliPlugin` accepts `devCommands`, which a built `dist/` leaves out; the workflow plugin's `check` and `build` are development commands. Plugins declare `@nocobase/app-cli` as their peer instead of `@nocobase/nb3-cli`.
  - **Deployment.** `nocobase build` writes `dist/cli/index.js`, so `node dist/cli/index.js db apply` runs from any directory without pnpm; `dist/package.json` keeps only the `start` and `nocobase` scripts. The `migrate` and `seed` scripts it used to generate pointed at commands that no longer existed and are gone. Development tooling (`typescript`, `tsx`, `vite`, `prettier`, `tar`, `@nocobase/dev-config`) is an optional peer, so a deployment installs none of it.
  - **Templates.** Scripts are reduced to `postinstall`, `dev`, `build`, `start` and the quality checks; every other command is `pnpm nocobase <topic> <command>`. `scripts/`, `cli/index.ts` and `cli/commands/index.ts` are removed.

  Upgrading an existing application requires moving to the new layout in one step: see "Shared application scripts and commands" in the `nocobase-app-upgrade` Skill (`packages/app/app-skills/skills/nocobase-app-upgrade/references/edge-cases.md`) for the full procedure. Messages that named `nocobase app db repair` and similar commands now name the new ids.

- Updated dependencies [02d5402]
- Updated dependencies [dbf5631]
- Updated dependencies [05af1d4]
- Updated dependencies [4adcf24]
- Updated dependencies [ec92b20]
- Updated dependencies [ec92b20]
- Updated dependencies [757eedf]
  - @nocobase/app-server@1.0.0-beta.27
  - @nocobase/db@1.0.0-beta.16
  - @nocobase/app-client@1.0.0-beta.21
  - @nocobase/caching@0.1.0-beta.2
  - @nocobase/service-provider@0.0.2-beta.1

## 1.0.0-beta.23

### Minor Changes

- f6c3cd8: Let a configuration section declare validation and the fields the browser may read, and use it to hide sign-up when the server has disabled it.

  `defineAppConfig` in `@nocobase/app-server/config` now also takes an object, `{ defaults, validate, public }`, where `defaults` is an object or a function of the runtime; the function form keeps working unchanged. `validate` may be async and reports with `ctx.error(path, message, { fix })` and `ctx.warning(path, message)`. It runs when the application starts, where an error stops the start with every problem listed, on `AppConfig.reload()`, which refuses a configuration that breaks a rule and keeps the running one, and in `pnpm config:check`, which reports each problem with code `invalid`. `defineAppDatabaseConfig` now checks that `database.default` names a configured connection and that every connection sets a dialect. `checkConnections` moved from `@nocobase/app-cli` into `@nocobase/app-server/database`.

  `public` lists leaf fields, relative to the section, that are sent to the browser in a separate `public` block of the page's runtime configuration. The browser reads them with `config.public.get('<section>.<field>')` at the same path as on the server; `config.get` never returns them and, in development, throws when asked for one, and `config.public.get` warns with the published paths when asked for one that is not. Anything not listed is never sent, and an object, function or instance cannot be listed. `i18n.defaultLocale` is now always published this way; the client still falls back to `client.i18n.defaultLocale`. `pnpm config:check` lists the published values, and its `--json` result carries them under `public`.

  `@nocobase/app-plugin-authentication` adds `defineAuthConfig` for the `auth` section, which validates the `emailAndPassword` switches and publishes `emailAndPassword.enabled` and `emailAndPassword.disableSignUp`, and `useSignUpAvailable()` on the client. The templates declare `auth` with it, their `PasswordLoginForm` hides the sign-up link and `/register` redirects to `/login` while the server refuses sign-up. An existing application keeps working but must switch `server/config/auth.ts` to `defineAuthConfig({ defaults: { ... } })` for this to take effect; until then the plugin logs a warning at startup. Copy the updated `password-login-form.tsx` and `pages/auth/register.tsx` from the new template version to get the same behavior.

- d18e964: Declare environment variables on the configuration section they set, list them with `pnpm config:env`, and stop shipping environment variables nothing reads.

  `defineAppConfig` takes `env`, a map from variable to a mapping relative to the section, such as `{ APP_SERVER_PORT: envInteger('port') }`. The runtime loads these above the configuration file once the sections are known, and refuses one variable declared for two different fields. `defineAuthConfig` maps `AUTH_SECRET` itself, and the templates declare the rest in `server/config/session.ts`, `server.ts`, `app.ts`, `i18n.ts`, `snowflake.ts` and `spa.ts`. `server/environment.ts` is gone and `server/config.ts` loads only the configuration file. An existing application that keeps its own `server/environment.ts` still works, since a variable mapped twice to the same field is harmless; to move over, copy the `env` of each section file from the new template version and delete the mapping file.

  `pnpm config:env`, also in a built `dist/`, lists every variable the application reads — those its sections declare, with the configuration path each sets, and those the runtime reads itself, `APP_BASE_PATH`, `APP_CONFIG_FILE` and `NOCOBASE_STRICT_STARTUP` — and whether each is set, never its value. `--json` prints the same list. `RUNTIME_ENVIRONMENT_VARIABLES` in `@nocobase/app-server/config` names the runtime-read ones.

  `APP_NAME` is gone from the Hub's `.env.example` and from the `.env` that `create-app` writes for a Hub, which used to set it to the project directory's name: nothing read it, and an application's name follows from `APP_BASE_PATH`. The commented `API_CLIENT_*` lines are gone for the same reason. The Hub template gains a test that every variable `.env.example` names is one `config:env` lists. `pnpm build` no longer copies `DB_*`, `QUEUE_*`, `REDIS_*`, `SMTP_*`, `API_CLIENT_*` and the notification provider variables into `dist/.env`; nothing reads any of them.

### Patch Changes

- 0231d46: Type-check the paths read through `config.public`. `config.public.get` and `has` now accept only paths declared in the new `PublicAppConfig` interface, and `get` returns that field's type, so a mistyped path or a wrong value type fails `typecheck` instead of reading `undefined` at runtime. A section's owner declares its public fields by augmenting the interface from `@nocobase/app-client`; `i18n.defaultLocale` is declared by the client itself, and `@nocobase/app-plugin-authentication` declares `auth.emailAndPassword.enabled` and `auth.emailAndPassword.disableSignUp`. `PublicConfigPath` and `PublicConfigValue` are exported for code that forwards such a path.
- Updated dependencies [f6c3cd8]
- Updated dependencies [c8ddd7d]
- Updated dependencies [f3917b6]
- Updated dependencies [d18e964]
- Updated dependencies [0231d46]
  - @nocobase/app-server@1.0.0-beta.26
  - @nocobase/app-client@1.0.0-beta.20

## 1.0.0-beta.22

### Minor Changes

- d7543b5: Support users.initialAdmin.email for fresh installations, defaulting to admin@nocobase.com when omitted, and document every initial administrator field in the template configuration examples.

## 1.0.0-beta.21

### Major Changes

- 4e58fe3: Remove `@nocobase/app-plugin-install` and the install mode it existed for. Configuration is written by `nocobase app config init` before an application is started.

  The plugin redirected an application to `/install` whenever the authentication secret was the temporary one the runtime invented for an application with no configuration file. That page could never be reached from an application made by `create-app`, which always wrote a `config.yml` and so never entered install mode; it was undocumented, and a Hub-hosted application receives its configuration from the Hub instead. With the templates no longer shipping a configuration file at all, an unconfigured application has no database driver decision made either, and nothing left to serve the page with.

  `resolveAuthSecret` no longer takes the application root and no longer invents a secret. A secret generated at boot is different on every restart, which silently invalidates every session; a missing one is now an error that names the command which writes it. Applications upgrading from an earlier version remove `@nocobase/app-plugin-install` from `package.json` and drop its entries from `client/plugins.ts` and `server/plugins.ts`; applications that had come to rely on the installation page configure themselves with `pnpm config:init` instead.

### Patch Changes

- cda1175: Allow an administrator to submit a user's existing username during an identity update without triggering a false username conflict.
- e286e0d: Check trusted request origins for cookie-authenticated business writes in the authentication middleware, and name newly seeded administrators "Super Admin".
- 80ef702: Match the user search as literal text, and stop reporting server faults as invalid input.

  `UserAdministrationService.list` now reads through the Repository, whose `includes` treats the search term as literal text: `%` and `_` typed into the user search box mean themselves instead of acting as SQL wildcards, where `%` previously listed every account. The page is ordered by creation time with `id` as a tiebreaker, so accounts created in the same instant cannot repeat or disappear between pages.

  The `/api/users` routes answer `400 INVALID_USER_INPUT` only for their own request parsing. A `TypeError` raised anywhere else, such as a defect in a registered `UserRoleScope`, is no longer returned to the caller as invalid input carrying an internal message; it surfaces as a server error.

- Updated dependencies [4e58fe3]
- Updated dependencies [4e58fe3]
- Updated dependencies [4e58fe3]
- Updated dependencies [4e58fe3]
  - @nocobase/app-server@1.0.0-beta.25
  - @nocobase/db@1.0.0-beta.15
  - @nocobase/app-client@1.0.0-beta.19
  - @nocobase/caching@0.1.0-beta.2
  - @nocobase/service-provider@0.0.2-beta.1

## 0.1.0-beta.20

### Patch Changes

- 709f9ed: Update Better Auth and API keys to 1.7.5 and align fresh authentication databases with provider-based account identity. Existing authentication databases must be recreated; the original account migration has changed and no compatibility migration is provided.
- d4783c2: Guide agents to preserve extension components and page source during customization, disable frontend feature availability reversibly, and enforce disabled operations on the server.
- Updated dependencies [fa01814]
- Updated dependencies [ca3188e]
- Updated dependencies [38e5253]
- Updated dependencies [fa01814]
- Updated dependencies [7bde7bd]
- Updated dependencies [5380642]
- Updated dependencies [3187ace]
- Updated dependencies [5380642]
- Updated dependencies [c5f4438]
- Updated dependencies [3187ace]
- Updated dependencies [38e5253]
- Updated dependencies [38e5253]
  - @nocobase/db@1.0.0-beta.13
  - @nocobase/app-server@1.0.0-beta.23
  - @nocobase/app-client@1.0.0-beta.19
  - @nocobase/caching@0.1.0-beta.2
  - @nocobase/service-provider@0.0.2-beta.1

## 0.1.0-beta.19

### Minor Changes

- 43592e9: Support users.initialAdmin credentials for fresh installations, preserving legacy defaults when omitted and assigning root permission to the configured administrator without resetting existing accounts.

### Patch Changes

- Updated dependencies [43592e9]
  - @nocobase/db@1.0.0-beta.12
  - @nocobase/app-server@1.0.0-beta.22

## 0.1.0-beta.18

### Patch Changes

- e13ed84: Make development logs concise and application-scoped while retaining structured file diagnostics. Route configuration and authentication diagnostics through application logging, reduce routine startup and request noise, distinguish optional AI Skill directories from missing configured paths, and align development console settings across templates. Document that deployed applications need rebuilding to adopt the current logging protocol.
- Updated dependencies [e0c4b3d]
- Updated dependencies [e13ed84]
- Updated dependencies [e13ed84]
- Updated dependencies [e13ed84]
- Updated dependencies [00362cf]
- Updated dependencies [e13ed84]
- Updated dependencies [e13ed84]
  - @nocobase/db@1.0.0-beta.10
  - @nocobase/app-server@1.0.0-beta.19
  - @nocobase/app-client@1.0.0-beta.18
  - @nocobase/caching@0.1.0-beta.2
  - @nocobase/service-provider@0.0.2-beta.1

## 0.1.0-beta.17

### Patch Changes

- 60fa139: Add confirmed user deletion for Hub platform administrators. Protect the current user, the last active platform administrator, and users who own applications. Revoke sessions and API Keys transactionally while retaining an inactive identity record for historical attribution. Prevent new applications and publishing keys from being created for deleted owners.
- 60fa139: Reuse the API Keys plugin through configuration-bound server operations and a scoped Authentication plugin API that preserves hooks and caller-owned transactions. Add per-application publishing API key management in Hub with one-time secret display, scoped Release and Deployment access, expiration, revocation, and current-owner permission checks.
- Updated dependencies [d4ca00e]
- Updated dependencies [24e771f]
- Updated dependencies [26ac480]
  - @nocobase/app-client@1.0.0-beta.18
  - @nocobase/db@1.0.0-beta.9
  - @nocobase/app-server@1.0.0-beta.18
  - @nocobase/caching@0.1.0-beta.2
  - @nocobase/service-provider@0.0.2-beta.1

## 0.1.0-beta.16

### Patch Changes

- 028dd7c: Use host-provided peers for shared database types, authorization errors, service tokens, cache registries, and repository filter metadata. Declare their production providers in all application templates so deployments with automatic peer installation disabled retain the required runtime packages. Document the provider contract for generated plugins.

  Existing applications upgrading these packages must add compatible versions of their required shared peers to production dependencies: @nocobase/db, @nocobase/service-provider, @nocobase/repository-input, @nocobase/authorization, @nocobase/caching, @nocobase/i18n, and @nocobase/queue for the standard server stack, plus @nocobase/ai-employee when using its plugin. Update the lockfile and verify the production install; peer declarations do not remove incompatible historical versions automatically.

- Updated dependencies [028dd7c]
  - @nocobase/app-client@1.0.0-beta.17
  - @nocobase/app-server@1.0.0-beta.17
  - @nocobase/db@1.0.0-beta.8

## 0.1.0-beta.15

### Patch Changes

- 89955c5: Upgrade better-sqlite3 to ^13.0.3 and keep its dependency declaration in @nocobase/db-sqlite only. Remove redundant test dependencies from consumers so they use the same SQLite driver as applications.

  Preserve the bundled musl binary when building applications for Alpine Linux.

- @nocobase/app-server@1.0.0-beta.15
  - @nocobase/db@1.0.0-beta.7

## 0.1.0-beta.14

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
  - @nocobase/app-client@1.0.0-beta.16
  - @nocobase/service-provider@0.0.2-beta.1

## 0.1.0-beta.13

### Patch Changes

- c258b92: Reject `auth.secret` and `session.secret` left at the placeholder `config.example.yml` ships.

  The example declares both as live keys carrying `replace-with-a-unique-secret`, so that `@nocobase/create-app` can fill them in by replacing a value rather than by uncommenting a line. That leaves one way to end up running on it: copying `config.example.yml` to `config.yml` by hand and starting the application without editing it. The placeholder is a non-empty string, so every existing check accepted it — and it is the same string in every installation that did this, published in this repository.

  `resolveAuthSecret` and `resolveAppSessionConfig` now refuse it, naming the setting and how to generate a replacement. `@nocobase/app-server/config` exports `PLACEHOLDER_SECRET`, `isPlaceholderSecret`, and `assertSecretIsNotPlaceholder` so that anything else reading a secret out of configuration can apply the same rule.

  Applications generated by `create-app` are unaffected: their `config.yml` has real secrets written into it.

- Updated dependencies [c258b92]
  - @nocobase/app-server@1.0.0-beta.14

## 0.1.0-beta.12

### Minor Changes

- 154e09e: Add `AuthClientPluginRegistry`, an augmentable interface that decides what `AuthClient` is typed as.

  The Better Auth client is created inside this package from the application's config, so its type could never be inferred from the plugins the application actually passes. `AuthClient` was pinned to `usernameClient` instead — too narrow for any plugin an application adds, and a plugin that added one had no way to say so except a cast. A plugin package now augments the registry with its client plugin, and `AuthClient` carries it:

  ```ts
  declare module '@nocobase/app-plugin-authentication/client' {
    interface AuthClientPluginRegistry {
      'api-key': ReturnType<typeof apiKeyClient>;
    }
  }
  ```

  This is the same mechanism Better Auth uses for its own server-side plugin registry. Nothing changes for an application that adds no client plugins: the registry seeds `username`, so `AuthClient` is what it was.

### Patch Changes

- 154e09e: Answer a refused credential with Better Auth's own status and body instead of a 500.

  `getSession()` keeps Better Auth's contract: a session, `null` when nobody is signed in, and a thrown `APIError` when a credential is present but refused — an expired or revoked API key. `Auth` had nothing translating that error at the edge, so it escaped `auth.required()` unhandled and Hono answered 500. `required()` and `optional()` now catch an `APIError` and respond with its status and body: `401 KEY_EXPIRED`, `429 USAGE_EXCEEDED`. Nothing changes for a request carrying no credential or a bad cookie. The realtime principal resolver treats a refused credential as no principal.

- Updated dependencies [c01baf6]
  - @nocobase/app-client@1.0.0-beta.15
  - @nocobase/app-server@1.0.0-beta.13

## 0.1.0-beta.11

### Minor Changes

- f17f3a6: Move the password authentication pages to the application. The authentication plugin keeps only the protocol, session state, guards and headless actions: it no longer declares `/login`, `/register`, `/forgot-password` or `/reset-password`, drops the `client/routes` and `client/route-contracts` entries, and removes the `loginPage`/`registerPage` route override options.

  Each application template now declares those four guest routes in `client/routes.ts` and loads the application-owned pages from `client/pages/auth/`, which compose the preinstalled UI from `client/extensions/nocobase-auth-ui/`. The pages use ordinary relative links; URL handling remains with the application router and basename.

- f17f3a6: Support TypeScript authentication options in application templates and use the native authentication client. Keep authentication plugins and callbacks in editable server and client configuration, with YAML as the default format for deployment settings.

  Runtime assembly now prepares complete configuration before application creation. Module configuration factories use defineAppConfig and defaultAppConfigs, receive the runtime once, and retain their defaults when environment configuration reloads.

### Patch Changes

- 43d25b4: Publish the `nocobase-app-plugin-authentication` Agent Skill with the package. It documents the plugin's public server and client surfaces and walks an application Agent through protecting routes, reading the session and customizing the sign-in pages, adding sign-in methods including a custom Better Auth plugin, managing account lifecycle, and deploying safely. Plugin registration synchronizes it into the application's `.agents/skills/`.

  The package-local `docs/` directory is removed; its content now lives in the Skill and in the NocoBase documentation site.

- ceb356b: Fix published package metadata and database test driver registration.
- 40e2d49: Name session cookies after the port an app is reached on, so two apps sharing a host no longer share a session

  Cookies are scoped by host and path but never by port (RFC 6265), so two apps on one host share a cookie jar even on different ports. The cookie name was the only thing left to separate them, and it was derived from the app name alone — which every standalone app defaults to `main`. Two apps started on different ports both wrote `main.session_token` at path `/main`, so the second sign-in overwrote the first, and the overwritten side sent a token its own database had never issued.

  The prefix now carries the port the app is reached on. A configured `publicOrigin` is authoritative, since it is what browsers actually see rather than the listen port a reverse proxy hides; when it carries no explicit port the prefix stays the bare app name, so an existing `https://example.com` deployment keeps its sessions. The listen port is the fallback for development, where `publicOrigin` is usually unset and the port is the only thing telling two apps apart, and it applies only to a standalone app — an embedded app is merged the same template defaults and so carries a `server.port` the host actually owns. Embedded apps keep the bare name, which their base paths already make distinct.

  Development sessions of standalone apps are invalidated once on upgrade, as is any deployment whose `publicOrigin` names an explicit port. Setting `advanced.cookiePrefix` still overrides all of this.

- ceb356b: Support local `Date` values for `date`, `time`, and `datetime` mutations while
  preserving Better Auth date values when records are read through its adapter.
- Updated dependencies [ceb356b]
- Updated dependencies [f17f3a6]
- Updated dependencies [f17f3a6]
- Updated dependencies [ceb356b]
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
  - @nocobase/db@1.0.0-beta.5

## 0.1.0-beta.10

### Minor Changes

- e3fa827: Add reusable user administration and Hub-scoped role-based authorization. Authentication now supports disabled accounts, transaction-aware administration, stable duplicate-identity conflicts, Session revocation, and immediate Realtime disconnects. Authorization supports protected Permission Sets, atomic scoped assignment replacement, and Client permission invalidation. The Users page supports protected role options, readable multi-role editing, explicit unassigned states, and a distinction between direct roles and authenticated-user defaults; password reset and database Session revocation share one transaction. The default App exposes its direct Authorization Permission Sets as application roles while keeping System administrator changes in Authorization. The Hub defines Administrator, Operator, and Viewer roles, batch-loads their user assignments, enforces every Hub and user-management action on the server, protects the final enabled Administrator, and hides unauthorized Client controls. Both templates register the reusable Users plugin; Hub exposes Applications, User management, and a read-only role matrix directly in its control-plane navigation, while the default App keeps Users in Settings. Only the Hub template receives Hub roles, disables public sign-up, and omits ordinary App Settings, workflows, notifications, and example plugins.

### Patch Changes

- Updated dependencies [e3fa827]
- Updated dependencies [c3e02bf]
- Updated dependencies [0a3fa83]
- Updated dependencies [1d042c0]
  - @nocobase/app-server@1.0.0-beta.9
  - @nocobase/app-client@1.0.0-beta.12
  - @nocobase/db@1.0.0-beta.4

## 0.1.0-beta.9

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

## 0.1.0-beta.8

### Patch Changes

- 0e9505a: Use the application theme's shadow color in the authentication UI registry recipe and keep it aligned with the preinstalled template copies.
- Updated dependencies [9536bf5]
  - @nocobase/app-client@1.0.0-beta.11

## 0.1.0-beta.7

### Minor Changes

- 90a4903: Replace the composite application transport with application-owned `ApiClient` and `RealtimeClient` services. Client plugins, examples, and application templates now use object-style HTTP request options through the shared API client, while realtime subscriptions resolve their dedicated WebSocket client.

### Patch Changes

- 90a4903: Extract the shared realtime wire protocol and browser WebSocket client into `@nocobase/realtime`. Replace the session-specific client reconnect method with a transport-level `reconnect()` operation, and make the application client and server consume the shared package.
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

## 0.1.0-beta.6

### Minor Changes

- cee3251: Add authenticated realtime subscriptions, refresh their identity after authentication changes, and invalidate in-app notification state through user-scoped events.

### Patch Changes

- 813da59: Declare browser-only packages as devDependencies rather than dependencies, and make `react-i18next` an optional peer of `@nocobase/i18n` provided by `@nocobase/app-client`. Client code is bundled by the consuming application, so these entries did nothing for the bundle while `dist/package.json` pulled every one of them into the server deployment to be installed and never required.
- Updated dependencies [8d88ff4]
- Updated dependencies [43d5bf0]
- Updated dependencies [813da59]
- Updated dependencies [cee3251]
  - @nocobase/app-server@1.0.0-beta.6
  - @nocobase/app-client@1.0.0-beta.9
  - @nocobase/db@1.0.0-beta.2
  - @nocobase/service-provider@0.0.2-beta.1

## 0.1.0-beta.5

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
  - @nocobase/db@1.0.0-beta.2
  - @nocobase/snowflake@1.0.0-beta.3
  - @nocobase/service-provider@0.0.2-beta.1

## 0.1.0-beta.4

### Minor Changes

- ac3f033: Replace aggregated application configuration objects and config factories with typed module-owned configuration definitions. Applications now compose defaults, file providers, environment layers, validation, explicit reloads, and subscriptions through `AppConfig`, while providers read their configuration through `app.config.get(definition)`.
- ac3f033: Export every server plugin from its package's `./server` entry point, and update application composition, plugin discovery, and generated plugins to use the unified entry point.

### Patch Changes

- 78cf0a2: Generate runtime-aware TypeScript, ESLint, Node engine, and development dependency configuration for Client-only, Server-only, and full-stack plugins, including stable package-scoped Queue Job identities.

  Keep plugins aligned with the Agent development contract by giving Queue, System Information, and Workflow Routes path-scoped authentication, documenting the Queue API path and Database declaration source accurately, and storing example tests under each plugin's root test directory.

- fb1a752: Unify Client and Server application composition around the explicit `serviceProviders` contribution and rename Client React tree contributions to `reactProviders`.

  Replace Client bootstrap modules with application-owned ServiceProvider lifecycle hooks, make the default Client start through `ClientApplication` and render through the Browser host, and update built-in plugins and runtime inspection to the new static contribution protocol.

- Updated dependencies [fb1a752]
- Updated dependencies [948304d]
- Updated dependencies [ac3f033]
- Updated dependencies [fb1a752]
- Updated dependencies [78cf0a2]
- Updated dependencies [fb1a752]
- Updated dependencies [fb1a752]
  - @nocobase/app-client@1.0.0-beta.5
  - @nocobase/app-server-kit@0.1.0-beta.3
  - @nocobase/caching@0.1.0-beta.2
  - @nocobase/id-generator@0.1.0-beta.2
  - @nocobase/service-provider@0.0.2-beta.1

## 0.1.0-beta.3

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
  - @nocobase/caching@0.0.1-beta.1
  - @nocobase/id-generator@0.0.1-beta.1
  - @nocobase/service-provider@0.0.2-beta.0
  - @nocobase/app-database@0.0.1-beta.1

## 0.1.0-beta.2

### Minor Changes

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

## 0.0.1-beta.1

### Patch Changes

- 509d812: Localize the shadcn UI components used by applications, plugins, and registries so they can customize their presentation independently. Remove the `@nocobase/app-client/ui` entry point and migrate its consumers to package-local components.
- Updated dependencies [509d812]
  - @nocobase/app-client@1.0.0-beta.1

## 0.0.1-beta.0

### Patch Changes

- da1b1b0: 首次发布。
- Updated dependencies [da1b1b0]
  - @nocobase/app-client@0.0.1-beta.0
  - @nocobase/app-database@0.0.1-beta.0
  - @nocobase/app-sdk@0.0.1-beta.0
  - @nocobase/caching@0.0.1-beta.0
