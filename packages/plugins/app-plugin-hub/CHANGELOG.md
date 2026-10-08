# @nocobase/app-plugin-hub

## 2.0.0-beta.1

### Minor Changes

- bc1e83f: Seal the recoverable copy of each Hub key with the application's secrets service (`secrets.keys`) instead of a key derived from `auth.secret`, still bound to the key's id and owner. Copies stored by earlier versions (`v1.`) are still read with `auth.secret`, and the plugin registers them as a secrets store, so `nocobase secrets rotate` reseals them with the secrets service. `HubApiKeyService` takes `{ secrets, legacySecret }` as its fourth argument; a string is still read as `auth.secret`. Config file deployments now also fill a missing, empty or placeholder `secrets.keys` for the hosted application, keeping the key it already uses, beside `auth.secret` and `session.secret`.

  Upgrading a Hub: register `SecretsProvider` and declare the `secrets` section (see the template changeset), add a key to `config.yml` under `secrets.keys` (`openssl rand -hex 32`), and keep `auth.secret`. Creating a Hub key now needs `secrets.keys`. Run `pnpm nocobase secrets status` to see how many copies are still sealed under `auth.secret`, and `pnpm nocobase secrets rotate` to reseal them; until then `auth.secret` must stay as it was.

### Patch Changes

- be0fbbd: Client code merges class names with the `cn` package instead of `clsx` and `tailwind-merge`, so the plugins declare `cn` as a peer dependency in their place. The application templates provide it; an application that does not declare `cn` yet adds it to its `devDependencies`, or the client build cannot resolve these plugins. The AI employee registry item `nocobase-ai` lists `cn` instead of `clsx` and `tailwind-merge`, and the authentication plugin drops the two unused development dependencies.
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
- Updated dependencies [bc1e83f]
- Updated dependencies [be0fbbd]
- Updated dependencies [bc1e83f]
- Updated dependencies [6993158]
- Updated dependencies [a6796d9]
- Updated dependencies [37c8d20]
- Updated dependencies [37c8d20]
- Updated dependencies [bc1e83f]
- Updated dependencies [bc1e83f]
- Updated dependencies [bc1e83f]
- Updated dependencies [37c8d20]
- Updated dependencies [37c8d20]
- Updated dependencies [bc1e83f]
- Updated dependencies [bc1e83f]
- Updated dependencies [bc1e83f]
- Updated dependencies [bc1e83f]
- Updated dependencies [bc1e83f]
- Updated dependencies [37c8d20]
- Updated dependencies [bc1e83f]
- Updated dependencies [37c8d20]
- Updated dependencies [bc1e83f]
- Updated dependencies [bc1e83f]
- Updated dependencies [6162033]
- Updated dependencies [bc1e83f]
- Updated dependencies [bc1e83f]
  - @nocobase/secrets@0.1.0-beta.0
  - @nocobase/app-plugin-api-keys@1.0.0-beta.13
  - @nocobase/app-client@2.0.0-beta.1
  - @nocobase/app-host@0.1.0-beta.14
  - @nocobase/app-server@2.0.0-beta.1
  - @nocobase/app-plugin-authentication@2.0.0-beta.1
  - @nocobase/authorization@1.0.0-beta.12
  - @nocobase/app-plugin-authorization@1.0.0-beta.25
  - @nocobase/app-plugin-users@2.0.0-beta.1
  - @nocobase/db@1.0.0-beta.18
  - @nocobase/i18n@1.0.0-beta.5
  - @nocobase/service-provider@0.0.2-beta.1

## 2.0.0-beta.0

### Major Changes

- e123790: Move `@nocobase/app-server`, `@nocobase/app-client`, `@nocobase/app-plugin-authentication`, `@nocobase/app-plugin-users`, `@nocobase/app-plugin-hub`, `@nocobase/app-plugin-workflow` and `@nocobase/app-plugin-ai-employee` to the 2.0.0 prerelease line. The HTTP API migration released in 1.0.0-beta.N changed every route and the error body, but in prerelease mode a `major` changeset on a version that is already a `1.0.0` prerelease only increments the prerelease number, so nothing in the version said the change was breaking. These packages now release as `2.0.0-beta.0`, and every package that depends on or peers with one of them is released again so that its published range is `^2.0.0-beta.0` rather than a `^1.0.0-beta` range the new versions do not satisfy. An application upgrading to these versions upgrades all of them together.

### Patch Changes

- Updated dependencies [e123790]
  - @nocobase/app-client@2.0.0-beta.0
  - @nocobase/app-plugin-authentication@2.0.0-beta.0
  - @nocobase/app-plugin-users@2.0.0-beta.0
  - @nocobase/app-server@2.0.0-beta.0
  - @nocobase/app-host@0.1.0-beta.13
  - @nocobase/app-plugin-api-keys@1.0.0-beta.12
  - @nocobase/app-plugin-authorization@1.0.0-beta.24

## 2.0.0-beta

Moves the package to the 2.0.0 prerelease line, so that the breaking changes released as 1.0.0-beta.25 show in the major version. This version is never published; the first release on the line is 2.0.0-beta.0.

## 1.0.0-beta.25

### Major Changes

- 21d274c: The Hub API under `/api/hub` follows the application's HTTP API rules, and `@nocobase/hub-cli` speaks the new API. A `hub-cli` older than this release cannot publish to an upgraded Hub, and this `hub-cli` cannot publish to an older one, so upgrade both together.

  URL and method changes:

  - `/api/hub/api-keys` → `/api/hub/apiKeys`, `/api/hub/api-keys/apps` → `/api/hub/apiKeys/apps`, `/api/hub/api-keys/:keyId/reveal` → `/api/hub/apiKeys/:keyId/reveal`, `/api/hub/api-keys/:keyId/disable` → `/api/hub/apiKeys/:keyId/disable`, `DELETE /api/hub/api-keys/:keyId` → `DELETE /api/hub/apiKeys/:keyId`.
  - `GET /api/hub/apps/:appId/releases/:releaseId/config-template` → `GET /api/hub/apps/:appId/releases/:releaseId/configTemplate`.
  - `GET /api/hub/apps?search=` → `GET /api/hub/apps?q=`; its default page size is now 20.
  - Log reads (`GET /api/hub/apps/:appId/logs` and `GET /api/hub/apps/:appId/deployments/:deploymentId/logs`): `cursor` → `pageToken` and `search` → `q`; `level`, `source`, `since`, `until` and `fromStart` keep their names.
  - `PUT /api/hub/apps/:appId/settings` → `PATCH /api/hub/apps/:appId/settings`, a partial update of `name` and `activation`.
  - Log reads validate their filters: `level` must be one of `trace`, `debug`, `info`, `warn`, `error`, `fatal`, and `since` and `until` must be RFC 3339 times in UTC (`2026-01-01T00:00:00Z`); anything else answers `400 / INVALID_INPUT`.

  Response changes:

  - Lists answer `{ data: [...], meta }`. `GET /apps`, `GET /apps/:appId/releases` and `GET /apps/:appId/deployments` carry `meta: { page, pageSize, total }` instead of `{ data: { items, total, page, pageSize } }`; `GET /apiKeys`, `GET /apiKeys/apps` and `GET /roles` carry `meta: { total }`.
  - A log read answers its entries in `data` and `meta: { nextPageToken, hasMore, available, enabled, reset, status?, phase? }`, where `nextPageToken` replaces `cursor`.
  - `POST /apps` answers `201` with the created App instead of `{ id }`. `POST /apiKeys` and `POST /apps/:appId/releases` answer `201`.
  - `POST /apiKeys/:keyId/disable` answers with the disabled key, `PUT /apps/:appId/settings` with `{ name, activation }`, and `POST /apps/:appId/stop`, `start`, `restart` and `refresh` with the App, instead of `{ success: true }`.
  - `POST /apps/:appId/releases/uploads` always answers the upload resource `{ uploadId, offset, size, chunkSize, expiresAt }` instead of `{ upload }` or `{ release }`; when the App already has the archive it answers `200` without `uploadId`, with `offset` equal to `size` and `releaseId`, `version` and `reused: true` naming the existing Release.
  - Reading a log no longer prunes expired journal files (deployment logs are pruned when a deployment finishes, App logs by the App's file logger), and `GET /apps/:appId/releases/uploads/:uploadId` answers an expired session with `404` without deleting it; the next upload start or a write to that session removes it.
  - `DELETE /apiKeys/:keyId` and `DELETE /apps/:appId` answer `204` with no body. Deleting a key that does not exist answers `404 / API_KEY_NOT_FOUND` instead of succeeding.

  Error changes:

  - Every failure is the standard error body `{ error: { code, status, reason, domain: 'hub', message, metadata?, fieldViolations? } }`. The former `error.code` string is now `error.reason`, and extra members such as an upload's `offset` moved to `error.metadata`.
  - Every route validates its path, query, headers and JSON body. An invalid input answers `400` with reason `INVALID_INPUT` in the `app` domain and a field violation for each problem, and a JSON body rejects unknown fields. This replaces `INVALID_CONTENT_LENGTH`, the header checks behind `INVALID_CHUNK`, and the shape checks behind `INVALID_UPLOAD`, `INVALID_API_KEY_INPUT` and `INVALID_DEPLOYMENT_INPUT`.
  - HTTP 422 is gone. The archive and input refusals (`CHECKSUM_MISMATCH`, `INVALID_ARTIFACT`, `INVALID_ARTIFACT_VERSION`, `UNSAFE_ARTIFACT`, `INVALID_CONFIG_FILE`, `UNSUPPORTED_CONFIG_FILE`, `INVALID_APP_ID`, `INVALID_APP_NAME`, `INVALID_CONFIG_MODE`, `INVALID_ACTIVATION_POLICY`) answer `400 INVALID_ARGUMENT`, and `BASE_PATH_MISMATCH` and `BUILD_TARGET_MISMATCH` answer `400 FAILED_PRECONDITION`.
  - Conflicts of state answer `400 FAILED_PRECONDITION` instead of `409`: `APP_NOT_DEPLOYED`, `APP_NOT_RUNNING`, `CONFIG_NOT_EDITABLE`, `DEPLOYMENT_IN_PROGRESS`, `INVALID_ROLLBACK_TARGET`, `UPLOAD_INCOMPLETE`, `UPLOAD_COMPLETED`, `API_KEY_INACTIVE`, `API_KEY_NOT_RECOVERABLE` and `APP_OWNER_UNAVAILABLE`. `ROLLBACK_CONFIG_MODE_MISMATCH` answers `400 INVALID_ARGUMENT` naming `config.mode`. `APP_EXISTS` stays `409`, as `ALREADY_EXISTS`; `IDEMPOTENCY_CONFLICT` and `UPLOAD_OFFSET_MISMATCH` stay `409`, as `ABORTED`.
  - A Release, deployment or App named in a request body that does not exist answers `400 INVALID_ARGUMENT` naming the field (`releaseId`, `deploymentId`, `appIds`), keeping its `RELEASE_NOT_FOUND`, `DEPLOYMENT_NOT_FOUND` or `APP_NOT_FOUND` reason; only the resource in the URL path answers `404`.
  - A release upload or chunk of the wrong content type answers `415 / INVALID_CONTENT_TYPE` instead of `400`; an empty archive answers `400 / INVALID_ARTIFACT_SIZE` instead of `413`. `ARTIFACT_TOO_LARGE` and `CHUNK_TOO_LARGE` stay `413`.
  - `START_FAILED`, `STOP_FAILED`, `RESTART_FAILED` and `CONFIG_RELOAD_FAILED` answer `503 UNAVAILABLE`.
  - A denied permission answers reason `AUTHORIZATION_DENIED` in the `authorization` domain instead of code `FORBIDDEN`. `SESSION_REQUIRED` and `INVALID_API_KEY` answer `401 UNAUTHENTICATED`, and `API_KEY_FORBIDDEN` and `API_KEY_OWNER_REQUIRED` answer `403 PERMISSION_DENIED`.

  `HubError` now extends `ApiError` from `@nocobase/app-server/router`: `reason` is the former `code`, `status` is the canonical status name, `code` is the HTTP status, and `details` is `metadata`. The new `HubService.listReleasesPage(appId, { page, pageSize })` returns one page of Releases.

  `@nocobase/hub-cli` reads the paged Release and deployment lists, passes the Hub's `error.reason` through as its error code and an upload's offset from `error.metadata.offset`, and reports `HUB_NOT_FOUND` for a 404 that names no reason or names the application's `ROUTE_NOT_FOUND`. It reads the single upload resource the upload start answers. Its commands, flags, output and exit codes are unchanged.

- e44f49c: `@nocobase/hub-cli` deploys to named remotes and builds for the Hub. `hub remote add <name> <url>`, `hub remote list` and `hub remote remove` keep the Apps an application deploys to in the committed `.nocobase/hub.json`, where a remote URL is `<Hub URL>/apps/<App ID>` and the first remote is the default; every command takes `--remote <name>`. `hub auth login` saves an API key for a remote after the Hub accepts it, asking for it without echoing it or reading it from standard input with `--with-token`, in `$XDG_CONFIG_HOME/nocobase/hub-credentials.json` (`%APPDATA%\nocobase` on Windows), readable by its owner only; `hub auth logout` removes it and `hub auth status` checks every remote's key. `hub deploy` and `hub upload` now read the platform the Hub runs Apps on and run `nocobase build --target … --node-version … --tar` for it before uploading; `--no-build` uploads the existing archive and `--file` another one, each checked against the Hub's platform first (`BUILD_TARGET_MISMATCH`). `hub deploy` uploads, then deploys through the Hub's deploy endpoint, so an archive the Hub already has is deployed as its existing Release instead of failing with `NO_DEPLOYMENT`; its `--idempotency-key` is the deployment's retry identity, and the upload is keyed by the archive checksum.

  `hub remote add` warns when the App root's `.gitignore` ignores `.nocobase/`, as applications generated by an earlier `@nocobase/create-app` do; the line has to go for the remotes to reach another checkout. `hub auth status` reports a key as rejected only when the Hub rejects it (`INVALID_API_KEY`, `API_KEY_FORBIDDEN`); a Hub that cannot be reached or answers something else leaves the key unchecked. `--timeout` bounds each request to the Hub and the wait for a deployment rather than the whole run, and a request that outlasts it fails with `TIMEOUT` (exit 3) instead of `RESULT_UNKNOWN`. Under the default `--idempotency-key`, deploying a Release the App deployed before and has since moved on from, as `hub deploy --release-id` does to roll back, deploys it again instead of answering with the earlier deployment; running the same command again still repeats nothing. A 404 that does not come from the Hub, as at a mistyped remote URL, fails with `HUB_NOT_FOUND` and points to `hub remote list`, and Ctrl-C at the `hub auth login` prompt cancels with `LOGIN_CANCELLED` (exit 130).

  Breaking: `HUB_URL`, `HUB_APP_ID` and `HUB_API_KEY`, from the environment or the App root `.env`, and the `--hub`, `--app-id` and `--api-key` flags are removed. Migrate with `pnpm nocobase hub remote add origin <Hub URL>/apps/<App ID>` and `pnpm nocobase hub auth login` (`echo "$HUB_KEY" | pnpm nocobase hub auth login --with-token` in CI). Under `--json`, `hub upload` no longer reports `operationId`, `hub deploy` reports `reused` for a reused deployment, and a build adds `buildTarget`. The package root exports `publish`, `HubClient` and `parseRemoteUrl` in place of `publishToHub` and `publishRelease`.

  Breaking for `@nocobase/app-plugin-hub`: `POST /api/hub/apps/:appId/releases` only uploads. It no longer accepts the `application/vnd.nocobase.release-upload.v1` configuration-prefixed body or `X-Hub-Config-Length`, ignores `X-Hub-Deployment-Intent` and `X-Hub-Wait`, and returns 200 with the Release, `releaseId` and `reused`; deploy through `POST /api/hub/apps/:appId/deploy`. An older hub-cli uploads but no longer deploys in the same request. An upload whose `nocobase.buildTarget` names another platform, architecture, Node major or Linux C library than the Host's is rejected with `422 BUILD_TARGET_MISMATCH` before anything is stored. `GET /api/hub/apps/:appId` reports the Host's `buildTarget` and, like `GET /apps/:appId/deployments/:deploymentId/status`, accepts a publishing key holding either scope for the App. Which routes a publishing key may call is declared with each route rather than matched by a separate pattern.

  `@nocobase/app-host` reports `runtime` — the Host process's `platform`, `arch`, `libc`, `nodeAbi` and `nodeMajor` — in `HostStatus`. The `nocobase-deployment`, `nocobase-app-development` and `nocobase-app-upgrade` Skills describe the remote, `hub auth login` and the build inside `hub deploy`, and the upgrade edge cases list the migration for an existing application.

### Minor Changes

- e44f49c: `hub releases` lists an App's Releases newest first — ID, version, checksum, size, `uploadedAt`, the `buildTarget` the archive records, whether it is what the App runs now (`running`) and whether a deployment of it ever succeeded (`everDeployed`) — with `--limit` (1–100, default 20) and `--release-id` for one. `hub status` reports the remote, the platform the Hub builds the App for, the Release and version it runs, the Host's state for it and its last deployment, and `hub status --deployment <id>` one deployment's status. Both read with a key holding either publishing permission, so finding the Release to roll back to no longer needs the Hub's web page.

  A publishing key holding either scope for an App can now read `GET /api/hub/apps/:appId/releases`, `GET /api/hub/apps/:appId/releases/:releaseId` and `GET /api/hub/apps/:appId/deployments`. The Release list pages with `page` and `pageSize` (`pageSize` 1–100, default 20; anything else is answered with `400 INVALID_ARGUMENT` and reason `INVALID_INPUT`) and answers `{ data, meta: { page, pageSize, total } }`, each Release reports `buildTarget`, `running` and `everDeployed`, and deployment list items carry `finishedAt`. Deployment configuration, deployment details and logs stay signed-in only.

- e44f49c: `hub deploy` and `hub upload` send the archive through the Hub's resumable upload, so an archive may be up to 2 GiB and a reverse proxy in front of the Hub only needs to allow a request the size of one chunk (8 MiB). A chunk whose answer is lost is sent again from the offset the Hub reports, after up to five consecutive failures of the chunk or of the read that finds the offset; a run that gives up leaves its session on the Hub for 24 hours so the same command resumes it, and an archive the Hub already has is not sent again. Progress is reported by the tenth.

  The Hub accepts resumable Release uploads under `/api/hub/apps/:appId/releases/uploads` with the `upload-release` action or publishing-key scope: `POST` starts a session for `{ size, sha256 }` (resuming an unfinished one for the same archive, or answering with the Release when the App already has it), `PATCH /:uploadId` appends a chunk at `Upload-Offset` (`409` with reason `UPLOAD_OFFSET_MISMATCH` reports the offset to continue from in `error.metadata.offset`), `GET /:uploadId` reports the offset, and `POST /:uploadId/complete` verifies the archive and creates the Release through the same checks as the single upload, answering a retried completion with the same Release. Sessions are staged on the Hub's local disk under the new `uploadsDir` option, which the Hub template sets to `storage/hub/uploads`, one directory per App, and expire 24 hours after their last chunk; an App's expired sessions are removed when one of its uploads starts, and every App's once an hour. `POST /api/hub/apps/:appId/releases`, which the management console uses, keeps its 256 MiB limit.

### Patch Changes

- be0fbbd: Hub's tables can be created on MySQL. The release table's `artifactKey` was `varchar(1024)` with a unique index, which exceeds MySQL's 3072-byte index key limit under utf8mb4 (`Specified key was too long`), so installing the plugin failed there. The column is now `varchar(512)`; keys are `<appId>/<release id>.tar.gz`, at most 172 characters.

  This edits the released migration `202609010001_create_hub_app_tables`, as an exception to the rule that a released migration never changes: the failing statement is in that migration itself, so no later migration could let a MySQL installation get past it, and it never succeeded on MySQL. An installation on SQLite or PostgreSQL that already ran it keeps its 1024-character column and reports a checksum mismatch for this migration as a warning; `pnpm nocobase db repair` records the new checksum.

- 0b933b3: Declare every `/api/hub` route in the application's OpenAPI document, served at `/api/swagger/docs`: each route names its summary, an `operationId` starting `hub` (such as `hubDeployApp`) under the tag `Hub`, its input schemas, its response schemas and the reasons each error status carries. The single Release upload documents its `application/gzip` body, its `X-Artifact-SHA256` and `Idempotency-Key` headers and its `413` and `415` refusals; the resumable chunk append documents its `application/octet-stream` body, the required `Upload-Offset` and `Content-Length` headers and the `409` (`UPLOAD_OFFSET_MISMATCH`) whose `error.metadata.offset` says where to resume; deploying and rolling back answer `202`; logs are documented as a feed paged by `pageToken`. Response schemas are typed against the Hub's views, so a response and its documentation cannot drift apart unnoticed. Input is now validated through `apiValidator()`, which answers invalid input exactly as before; no route, request or response changes. The `400` for invalid input comes from the input validators; a route's own `400` names only its other reasons, such as a failed precondition.
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
- Updated dependencies [3f01f61]
- Updated dependencies [21d274c]
- Updated dependencies [21d274c]
- Updated dependencies [e44f49c]
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
  - @nocobase/app-plugin-users@1.0.0-beta.14
  - @nocobase/authorization@1.0.0-beta.11
  - @nocobase/app-plugin-api-keys@1.0.0-beta.11
  - @nocobase/app-host@0.1.0-beta.12
  - @nocobase/i18n@1.0.0-beta.5
  - @nocobase/service-provider@0.0.2-beta.1

## 1.0.0-beta.24

### Patch Changes

- ec4b764: Drop the stale `Releases` fallback from the releases section title, which the locale file already names "Release artifacts".
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
  - @nocobase/app-plugin-authorization@0.2.0-beta.22
  - @nocobase/app-plugin-users@1.0.0-beta.13
  - @nocobase/app-host@0.1.0-beta.11
  - @nocobase/app-plugin-api-keys@0.1.0-beta.10
  - @nocobase/app-plugin-authentication@1.0.0-beta.24
  - @nocobase/authorization@0.1.0-beta.10
  - @nocobase/db@1.0.0-beta.16
  - @nocobase/service-provider@0.0.2-beta.1

## 1.0.0-beta.23

### Major Changes

- db16945: Toasts go through a toaster that `@nocobase/app-client` defines and the application implements, so code that reports a result no longer depends on how toasts are rendered.

  - **App client.** `useToaster()` returns the application's `Toaster`. Its `show({ type, title, description, action, duration, id, onClose })` returns an id that `close(id)` takes, and `resolveToaster(app.services)` returns the same toaster outside React. The application registers the implementation under `toasterToken`; `@nocobase/app-client` registers none. Without one, nothing throws: each toast is logged to the console instead, an error toast as an error, and the first says how to register a toaster. Clicking a toast's action runs its `onClick` and leaves the toast open.
  - **Templates.** `client/lib/toaster.ts` forwards toasts to the Base UI `toast` manager that the mounted `Toaster` renders, and decides their presentation for the whole application: an error written as plain text is announced at once, while one with an action, or with an element for its title or description, keeps the default priority. `client/service-provider.ts` registers it in `register()`. The account menu, the language switcher and the Examples route overlay demo show their toasts through `useToaster()`.
  - **Plugins (breaking).** Hub, Users, Workflow and AI employee pages report through `useToaster()` instead of `Toast.useToastManager()` from `@base-ui/react/toast`, and no longer choose a toast's priority. They need the `@nocobase/app-client` that exports it, and the application has to register a toaster: without one nothing throws, but their toasts only reach the console, and a Hub page whose only content is an error shows nothing. They no longer require a Base UI `Toast.Provider`.
  - **Skills.** The frontend references and each affected plugin's Skill describe `useToaster()`, and the `nocobase-app-upgrade` edge case "Notifications and the application toaster" replaces "Notifications and the Base UI toast".

  Upgrade an existing application with the `nocobase-app-upgrade` Skill, which brings `client/lib/toaster.ts` and its registration together with the new `@nocobase/app-client` and plugin ranges; follow the same steps when upgrading by hand. `pnpm nocobase plugin update` is not enough on its own: the plugins stay inside the application's `^1.0.0-beta` ranges, so it installs them, but it leaves `@nocobase/app-client` where it is, and their pages then fail to load for want of `useToaster`.

### Patch Changes

- 84cc7d2: `release upload` and `release deploy` leave `@nocobase/app-cli` for the new `@nocobase/hub-cli` package as `hub upload` and `hub deploy`, and the `nocobase.cli.publishing` flag that registered them is removed. An application gets the commands by depending on `@nocobase/hub-cli`; the Default template declares it in `devDependencies`. `hub deploy` uploads `storage/exports/dist.tar.gz` and deploys it, as `release upload --deploy` did, and with `--release-id` deploys a Release already on the Hub, as `release deploy` did. `hub upload` only uploads and takes no `--deploy`, `--wait` or `--config`. The other flags, the `HUB_*` variables and the exit codes are unchanged; under `--json`, `command` names the new commands, and an unexpected upload failure is `UPLOAD_FAILED` where it was `PUBLISH_FAILED`. The client that `@nocobase/app-cli/hub-publishing` exported is now the `@nocobase/hub-cli` package root, and the Hub's `NO_DEPLOYMENT` and configuration-conflict messages name `hub deploy --release-id`.

  A direct `@nocobase/` dependency whose `package.json` names a CLI entry in `nocobase.cli.entry` now contributes that entry's `defineCliPlugin` commands without an entry in `cli/plugins.ts`, and a package that is not an application plugin takes its topic from its name without the `-cli` suffix. The runner imports such a package only for a command under its topic, for help on the whole tree and for `commands`; a package the application requires but nobody installed is reported as `PACKAGE_NOT_INSTALLED` with `pnpm install` as the suggestion. `AppLocation` no longer has `publishing`. `@nocobase/hub-cli` ships a `nocobase-hub-cli` Skill, and the `nocobase-app-upgrade` Skill's edge cases list the steps for an existing application.

- Updated dependencies [41f478f]
- Updated dependencies [db16945]
  - @nocobase/app-plugin-api-keys@0.1.0-beta.9
  - @nocobase/app-client@1.0.0-beta.23
  - @nocobase/app-plugin-users@1.0.0-beta.12
  - @nocobase/app-plugin-authentication@1.0.0-beta.24

## 1.0.0-beta.22

### Minor Changes

- 46ce11f: A build is no longer tied to a mount path. `createAppViteConfig` builds with a relative base, and the application server rewrites the relative URLs in `index.html` — the `./assets/` chunks and every `public/` file the page references — to the path it is mounted at, so one `dist/` runs at any `APP_BASE_PATH`. The development server still needs an absolute base and refuses to start without `APP_BASE_PATH`, which `pnpm dev` always passes; `DEFAULT_APP_BASE_PATH` in `@nocobase/app-server/support` is the `/main` it falls back to. In proxy mode, `createDevClientConfigPlugin` from `@nocobase/app-cli/dev/proxy` renders the remote application's client configuration into the local page, and says which status or redirect it met when the remote does not serve one.

  `pnpm build` records `nocobase.relocatable: true` in `dist/package.json` in place of `nocobase.basePath`, and no longer copies `APP_BASE_PATH` into `dist/.env`. app-installer chooses the mount path with `install --base-path` and keeps it in `app.env`, and a Hub archive keeps `/hub` unless the flag says otherwise; an archive from an earlier build runs only at the path it records, and `install`, `upgrade` and `rollback` refuse it elsewhere with `BASE_PATH_MISMATCH`. The Hub refuses such an archive unless it was built for `/<appId>`. The template Dockerfiles no longer take `APP_BASE_PATH` as a build argument: the image defaults to `/main`, `/hub` for the Hub, and `docker run -e APP_BASE_PATH` moves it.

### Patch Changes

- Updated dependencies [46ce11f]
- Updated dependencies [46ce11f]
  - @nocobase/app-client@1.0.0-beta.22
  - @nocobase/app-server@1.0.0-beta.29
  - @nocobase/app-plugin-authentication@1.0.0-beta.24
  - @nocobase/authorization@0.1.0-beta.10
  - @nocobase/db@1.0.0-beta.16
  - @nocobase/i18n@1.0.0-beta.4
  - @nocobase/service-provider@0.0.2-beta.1
  - @nocobase/app-plugin-api-keys@0.1.0-beta.8
  - @nocobase/app-plugin-authorization@0.2.0-beta.21
  - @nocobase/app-plugin-users@1.0.0-beta.11

## 1.0.0-beta.21

### Major Changes

- 2217eb2: Remove `@nocobase/app-plugin-notification-provider` and show every notification through the Base UI toast the templates already ship. The package is no longer published, and Sonner is no longer a dependency of anything.

  - **Templates.** `client/react-providers.ts` mounts the `Toaster` from `client/components/ui/toast.tsx` once, in the `application` layer, and the account menu and language switcher call `toast.add` from `@/components/ui/toast`. A rule at the end of `client/styles.css` lifts the toast viewport above dialogs and sheets, which share its `z-50`. The plugin and `sonner` leave `client/plugins.ts` and `package.json`, and no Refine notification provider is registered.
  - **Plugins (breaking).** Hub, Users, Workflow and AI employee pages report through `Toast.useToastManager()` from `@base-ui/react/toast` instead of Sonner or Refine's `useNotification()`, so they now require the application to mount a Base UI `Toast.Provider`; without one their pages fail with `Base UI: useToastManager must be used within <Toast.Provider>`. They move to `1.0.0` for that reason, which keeps an existing application's `^0.1.0` ranges, and so `pnpm nocobase plugin update`, from installing them before the toaster is in place. Hub notifications appear where the application's toaster places them rather than top-right. `sonner` and `@refinedev/core` are no longer peers.
  - **Skills.** The frontend references describe `toast.add` from `@/components/ui/toast` in place of Sonner, and each affected plugin's Skill names the toaster requirement and the error that reveals it.

  Upgrade an existing application by moving to this template release with the `nocobase-app-upgrade` Skill, which brings the new plugin ranges together with the toaster. Its "Notifications and the Base UI toast" edge case (`packages/app/app-skills/skills/nocobase-app-upgrade/references/edge-cases.md`) lists the steps, their order, and how to verify the pages afterwards; follow the same steps when upgrading by hand.

### Patch Changes

- 02d5402: `@nocobase/app-cli` is now the whole application command line: it provides the `nocobase` bin and absorbs `@nocobase/nb3-cli` (command assembly, the plugin contract, plugin and Skill management) and `@nocobase/app-tools` (`dev`, `build`, `start`, `server-deps`). Neither of those two packages is published any more, and there is no compatibility period.

  - **Commands.** Standard commands leave the `app` topic: `nocobase db apply`, `nocobase config init`, `nocobase collections generate`. `app db doctor` is now `collections doctor`, `app i18n:check` is now `locales check`, and `app upload`/`app deploy` are `release upload`/`release deploy`, registered only when `package.json` sets `nocobase.cli.publishing: true`. New commands `dev`, `build`, `start`, `dist retarget` and `dist check` replace the application's `scripts/*.mjs`. `plugin skills sync` and `plugin cli-hooks` are removed; use `skills sync`. `app` now holds only an application's own commands.
  - **Discovery.** Commands are found by path: an application's `cli/commands/orders/sync.ts` answers to `nocobase app orders sync`, with no index to maintain. The bin finds the application from the nearest `package.json` (`nocobase.templateKind` for a source checkout, `nocobase.buildTarget` for a built `dist/`), or from `NOCOBASE_APP_ROOT`; applications no longer have a `cli/index.ts`. A built-in command runs without importing the application's plugins.
  - **Plugins.** A plugin's topic is its package name without the scope and `app-plugin-` prefix, so the scheduler's commands move from `schedule` to `scheduler` and the CLI example's from `demo` to `cli-example`. `defineCliPlugin` accepts `devCommands`, which a built `dist/` leaves out; the workflow plugin's `check` and `build` are development commands. Plugins declare `@nocobase/app-cli` as their peer instead of `@nocobase/nb3-cli`.
  - **Deployment.** `nocobase build` writes `dist/cli/index.js`, so `node dist/cli/index.js db apply` runs from any directory without pnpm; `dist/package.json` keeps only the `start` and `nocobase` scripts. The `migrate` and `seed` scripts it used to generate pointed at commands that no longer existed and are gone. Development tooling (`typescript`, `tsx`, `vite`, `prettier`, `tar`, `@nocobase/dev-config`) is an optional peer, so a deployment installs none of it.
  - **Templates.** Scripts are reduced to `postinstall`, `dev`, `build`, `start` and the quality checks; every other command is `pnpm nocobase <topic> <command>`. `scripts/`, `cli/index.ts` and `cli/commands/index.ts` are removed.

  Upgrading an existing application requires moving to the new layout in one step: see "Shared application scripts and commands" in the `nocobase-app-upgrade` Skill (`packages/app/app-skills/skills/nocobase-app-upgrade/references/edge-cases.md`) for the full procedure. Messages that named `nocobase app db repair` and similar commands now name the new ids.

- ae43f41: Tidy the `release upload` and `release deploy` commands and make `--json` output consistent across the CLI.

  - The JSON document's `operation` is now `release:upload` or `release:deploy`, matching the command id, instead of `app.upload` or `app.deploy`. Scripts that match on the old values need updating.
  - `release upload` and `release deploy` are no longer registered in a built `dist/`. They publish the archive `nocobase build --tar` writes beside the sources, so run them in the source checkout or in CI.
  - A path given to `--file` or `--config` now resolves from the current directory rather than from the App root. Without `--file`, upload still reads `storage/exports/dist.tar.gz` in the App root.
  - An argument error names the flag that is missing, invalid or unknown, such as `Missing required flag --release-id.`, and still never repeats a value. A failure with no known cause suggests `NOCOBASE_CLI_DEBUG=1`, which prints that cause to stderr.
  - Both commands have a description and examples in `--help`, and `--hub` is described the same way on both.
  - `plugin register`, `plugin unregister`, `plugin update`, `plugin inspect`, `package remove` and `skills sync` print a `--json` failure on stdout, as a success already was and as every other command already did. A caller reads one stream and checks the exit code.
  - The Hub publishing guidance moves from the `nocobase-app-development` Skill to `nocobase-deployment`, the CLI reference describes the stdout-only `--json` contract and path resolution, and the Hub API key Skill states the new path rule.

- dbf5631: Replace guidance that named removed commands and layouts. The Hub's development page names the archive `nocobase build --tar` actually writes, `storage/exports/dist.tar.gz`. The scheduler Skill synchronizes with `pnpm nocobase scheduler sync` instead of `nb3 schedule:sync` and gives the deployed form, `node dist/cli/index.js scheduler sync --finalize`. The repository example applies its migrations and seeds with `nocobase db apply`, the CLI example's Skill matches its manifest and the stdout-only `--json` contract, and the i18n Skill no longer presents `pnpm i18n:check` as the monorepo form of `locales check`. Plugin `AGENTS.md` files carry the current dependency rules from the plugin template.
- Updated dependencies [757eedf]
- Updated dependencies [1b139b6]
- Updated dependencies [02d5402]
- Updated dependencies [dbf5631]
- Updated dependencies [05af1d4]
- Updated dependencies [4adcf24]
- Updated dependencies [ec92b20]
- Updated dependencies [ec92b20]
- Updated dependencies [ec92b20]
- Updated dependencies [dbf5631]
- Updated dependencies [2217eb2]
- Updated dependencies [757eedf]
  - @nocobase/app-plugin-authorization@0.2.0-beta.20
  - @nocobase/app-server@1.0.0-beta.27
  - @nocobase/db@1.0.0-beta.16
  - @nocobase/app-plugin-authentication@1.0.0-beta.24
  - @nocobase/app-plugin-api-keys@0.1.0-beta.8
  - @nocobase/app-client@1.0.0-beta.21
  - @nocobase/logging@0.1.0-beta.6
  - @nocobase/app-plugin-users@1.0.0-beta.11
  - @nocobase/authorization@0.1.0-beta.9
  - @nocobase/i18n@1.0.0-beta.4
  - @nocobase/service-provider@0.0.2-beta.1

## 0.1.0-beta.20

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
  - @nocobase/authorization@0.1.0-beta.9
  - @nocobase/app-plugin-authorization@0.2.0-beta.19
  - @nocobase/app-plugin-users@0.1.0-beta.10
  - @nocobase/app-plugin-api-keys@0.1.0-beta.7

## 0.1.0-beta.19

### Minor Changes

- 441a3ef: Remove the legacy Viewer Hub role and keep filter labels on one line

  The Hub role picker offered a third option, `hub-viewer`, that was already
  impossible to assign: it rendered as a locked row explaining that the
  assignment was protected. It only existed to keep older installations
  readable, and the Hub has no such installations, so the role is gone. The
  picker now offers the two roles that can actually be assigned, and a new
  migration deletes the Permission Set together with its assignments.
  `HUB_ACTIVE_ROLE_KEYS` disappears with it, because it only existed to name
  the subset of `HUB_PERMISSION_SET_KEYS` that excluded the legacy role.

  `SelectValue` also stretched its trigger instead of staying on one line, so
  "All permission sets" wrapped to two lines and overflowed the fixed-height
  control on the Users page. It now truncates, and the permission set filter is
  wide enough to show its own default label.

### Patch Changes

- Updated dependencies [d7543b5]
- Updated dependencies [441a3ef]
  - @nocobase/app-plugin-authentication@1.0.0-beta.22
  - @nocobase/app-plugin-users@0.1.0-beta.9

## 0.1.0-beta.18

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
  - @nocobase/app-plugin-users@0.1.0-beta.8
  - @nocobase/app-plugin-api-keys@0.1.0-beta.6
  - @nocobase/app-client@1.0.0-beta.19
  - @nocobase/authorization@0.1.0-beta.8
  - @nocobase/i18n@1.0.0-beta.4
  - @nocobase/service-provider@0.0.2-beta.1

## 0.1.0-beta.17

### Patch Changes

- b00290d: Declare `tsx` and `typescript` as peer dependencies of `@nocobase/app-tools`, and stop loading the TypeScript compiler on every `pnpm dev`.

  `dev` spawns three executables it never imports — `vite`, `tsx`, and `nocobase` — and only two of them were declared. `tsx` sat in `devDependencies`, which are not installed for a consumer, so an application that installed `@nocobase/app-tools` from a registry carried no statement that it needed one. Nothing caught it: every template declares `tsx` for its own use, so the binary resolves in this repository and in any application generated from a template, and is absent only in an application that never installed it. Neither `pnpm deps:check` nor `pnpm peers:check` could have caught it either, because both read import specifiers and a spawned binary has none. Both checks now cover `packages/tools`, the package README carries a table of the executables these scripts spawn, and AGENTS.md records that a spawned tool is a dependency too.

  `typescript` moves from `dependencies` to `peerDependencies` for a different reason. It is imported directly, to parse `server/plugins.ts` without running it, while the build compiles through the application's own `pnpm exec tsc`. That is two copies, and a version split between them fails silently: the application compiles syntax the older parser then cannot read, `resolvePluginWatchIncludes` returns nothing, and editing a workspace plugin quietly stops restarting the server. **An application that does not already declare `typescript` must add it** — every template does, so an application generated from one needs no change.

  That parse is now gated as well. It can only ever name a workspace neighbour, so a `server/plugins.ts` naming none of them is answered without importing the compiler at all. Every `pnpm dev` in a generated application was loading 24 MB of TypeScript to be told there was nothing to watch. `resolvePluginWatchIncludes` is asynchronous as a result.

  `cross-spawn` and `tar` move to the workspace catalog, which also settles `tar` on a single range: `@nocobase/app-host` and `@nocobase/app-plugin-hub` were one minor version behind the four other declarations. The three templates drop their own `cross-spawn` and `tar` entries, which nothing in them has imported since these scripts moved into `@nocobase/app-tools`.

- Updated dependencies [b00290d]
- Updated dependencies [8f1ead4]
- Updated dependencies [77d34b6]
- Updated dependencies [ffafc2a]
- Updated dependencies [a1a8690]
  - @nocobase/app-host@0.1.0-beta.10
  - @nocobase/db@1.0.0-beta.14
  - @nocobase/app-server@1.0.0-beta.24
  - @nocobase/app-plugin-authentication@0.1.0-beta.20

## 0.1.0-beta.16

### Patch Changes

- 709f9ed: Update Better Auth and API keys to 1.7.5 and align fresh authentication databases with provider-based account identity. Existing authentication databases must be recreated; the original account migration has changed and no compatibility migration is provided.
- d696700: Stop the `bubblegum` theme from turning settings pages into competing hues, and fix the token misuse it exposed.

  The preset was carried over from tweakcn verbatim, and upstream spends the generic surface and outline roles on decoration: `--card` was a cream 101 degrees of hue away from the pink `--background`, `--border` was `--primary` itself at chroma 0.18 against a median of 0.02 across the other thirty presets, and `--muted` was a cyan. One demonstration card and a few dividers carry that; a settings page stacking several panels over dozens of hairlines does not, and pages showed pink, cream, cyan and teal at once. Six light values are retuned — `--card`, `--border`, `--muted`, `--input`, `--sidebar-border` and `--sidebar-primary` — keeping those roles in the background's hue family and leaving the preset's colour in `--primary`, `--secondary` and `--accent`. The dark values, the radius, and every other preset are unchanged, and `THIRD-PARTY-NOTICES.md` records the deviation.

  The same pages also used tokens for something other than their role, which no neutral preset makes visible. Authorization's two page shells and four Hub pages painted the whole page with `bg-muted/20`, which is the page surface and belongs to `bg-background`; under a preset whose `--muted` is a real colour that was a film over the entire viewport. The AI employee page's read-only fields hand-rolled `bg-muted/40` instead of using the shared `Input` and `Textarea` with `disabled`, three information callouts were fixed `bg-blue-50`, and the MCP transport labels were fixed `bg-blue-100`/`bg-green-100`/`bg-amber-100`; the transports now take their three tones from the theme's chart series, which is what a preset defines to be told apart.

  Three fixed colours on settings pages are corrected while they are in hand. The AI employee page's missing-knowledge-base warning and the schedule detail page's target-issue icon named a light-mode ink with no dark counterpart, so both were close to unreadable on a dark card; they now carry one. The routes example reported a load failure in a fixed red, which is what `--destructive` is for.

  The theme authoring reference and the token reference now state the rule, so a preset converted tomorrow is checked against it.

- e5601cb: Add `@nocobase/app-cli` as a development dependency so the plugin's tests can publish a Release through the real CLI against a real App Host. No runtime change.
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
  - @nocobase/app-plugin-api-keys@0.1.0-beta.5
  - @nocobase/app-plugin-authorization@0.2.0-beta.17
  - @nocobase/db@1.0.0-beta.13
  - @nocobase/app-server@1.0.0-beta.23
  - @nocobase/app-plugin-users@0.1.0-beta.7
  - @nocobase/app-host@0.1.0-beta.9
  - @nocobase/app-client@1.0.0-beta.19
  - @nocobase/authorization@0.1.0-beta.8
  - @nocobase/i18n@1.0.0-beta.4
  - @nocobase/service-provider@0.0.2-beta.1

## 0.1.0-beta.15

### Patch Changes

- 4ffcbc2: Add the user-event development dependency to exercise API key confirmation flows with realistic pointer and focus interactions.
- Updated dependencies [43592e9]
- Updated dependencies [43592e9]
  - @nocobase/app-plugin-authentication@0.1.0-beta.19
  - @nocobase/app-plugin-authorization@0.2.0-beta.16
  - @nocobase/db@1.0.0-beta.12
  - @nocobase/app-server@1.0.0-beta.22

## 0.1.0-beta.14

### Patch Changes

- e73837a: Generate and persist a session secret for Config file deployments and configuration publications even when the session section is omitted. Reuse existing secrets on subsequent operations and preserve custom values. Existing applications using a runtime-only session secret receive a stable secret on the next deployment or configuration publication, invalidating cookies encrypted with the previous secret.

## 0.1.0-beta.13

### Patch Changes

- 64b3fdb: Separate authorization services from application integration: the library provides decisions, permission-set and access-rule services, store contracts and handlers; the application plugin owns database adapters, migrations, identities and management UI.

  Add configurable root and default permission sets, protected-set metadata, transaction-bound service APIs, and integration with user management and Hub roles. Add database authorization for explicitly registered collections through Repository policies, plus a runnable example plugin.

  Provide a permission-set workspace with routed editing and user assignments, nested resource groups, field and record-scope controls, and a permission inspector. Localize management UI and request-specific resource labels. Application routes may declare signed-in access without a page grant.

  Migration ownership changes inline the existing table definitions in the application plugin. This changes the checksums of previously executed migrations; upgrade compatibility must be resolved before deploying to an existing database.

- 64b3fdb: Separate business resource declarations from underlying handler registration through `resourceTypes`. Remove transitional registration aliases and legacy title decoding. Store rule record IDs directly in each action's JSON, preserving independent named scopes without auxiliary record tables. Initialize the sales example and Hub permission titles directly in their final form, without development-version upgrade scripts.
- 64b3fdb: Integrate source-qualified database authorization and native relation policies with AI data services. Preserve explicit route group extensions, translated resource search, Hub ownership checks, API key cleanup, and protected permission-set assignments across user deletion. Update shared application guidance for the split authorization plugins.
- 64b3fdb: Add composed business operations with named data scopes and categorized business and administration groups. Permission and rule editors expose only this catalog; page, collection and custom resource handlers remain internal authorization targets.

  Enforce per-operation default access, sharing and restriction scopes while preserving field permissions. Return resolved underlying decisions and repository policies for inspection and execution.

  Use translation descriptors for permission titles, integrate permission-set assignments into user management, and demonstrate independent project, quote and order scopes with direct and team-based assignments.

- 64b3fdb: Keep the combined release and deployment workspace accessible through Hub page authorization, with separate capability checks for each section instead of requiring deployment-read access for the entire page.
- c3bc6c8: Hide the unfinished Resources tab and prevent its configuration requests while retaining the implementation for future development.
- c3bc6c8: Display readable severity labels for numeric and textual levels in runtime and deployment log summaries while preserving raw log details and exports.
- c3bc6c8: Require a manually entered application ID in the creation dialog, remove name-based ID generation, clarify input placeholders and ID requirements, and mark required fields with a theme-aware asterisk.

  Reject the reserved double-underscore application ID prefix before submission.

- c3bc6c8: Combine release uploads and deployment history in one permission-aware workspace, add per-release deployment actions and collapsible release lists, and open each submitted deployment's live logs in a URL-addressable drawer.

  Derive the latest-upload badge and deployment emphasis from persisted releases and the active release so they survive refreshes; show upload confirmation as a temporary notification.

  Refresh deployment history immediately after an accepted submission, even if the overview refresh fails, and require configuration read permissions before offering the deployment action.

- 64b3fdb: Remove Refine from client authorization checks. Use `AuthorizationClient.can({ resource, action })` instead of the removed two-argument signature, and import `useCan` from `@nocobase/app-plugin-authorization/client`. Migrate page guards, navigation, and notification visibility while preserving session isolation and realtime permission invalidation.

  Remove the Refine access-control configuration and legacy global authorization client accessors. Resolve the application-owned client through `useAuthorizationClient()` or `authorizationClientToken`. Settings actions now revoke stale access immediately; route checks no longer bypass the authorization page or translate Refine CRUD action names.

  Unify route authorization under `authz: 'skip' | { resource: { type, id }, action }`. Normalize default rules during registration and share them across page guards, navigation, permission discovery, and inspection. Remove the legacy `access` field and string resource adapter.

  Limit settings action checks to the actions each page uses, keep the permission-set action helper internal, and avoid rebuilding navigation twice when selecting a route.

- 64b3fdb: Move default user permission-set integration into the Users plugin and remove duplicated template providers. Add application-owned preset title metadata for client-side localization without overwriting custom names. Preserve Hub's custom role scope and share searchable assignment selection between user creation and editing.
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
- Updated dependencies [64b3fdb]
  - @nocobase/app-client@1.0.0-beta.19
  - @nocobase/authorization@0.1.0-beta.8
  - @nocobase/app-plugin-authorization@0.2.0-beta.15
  - @nocobase/app-plugin-users@0.1.0-beta.6
  - @nocobase/app-server@1.0.0-beta.21
  - @nocobase/app-plugin-api-keys@0.1.0-beta.4
  - @nocobase/app-plugin-authentication@0.1.0-beta.18
  - @nocobase/db@1.0.0-beta.11
  - @nocobase/i18n@1.0.0-beta.4
  - @nocobase/service-provider@0.0.2-beta.1

## 0.1.0-beta.12

### Patch Changes

- c210c51: Align deployment configuration headings with the comparison editor by reserving the same fixed-width change-control gutter between both columns.
- c210c51: Keep refreshing pending deployments until completion, retry transient status failures with bounded backoff, and clarify automatic authentication and session secret initialization. Return to the deployment list after submission instead of opening logs automatically, and keep manually opened logs mounted during background refreshes.
- c210c51: Show the create-app command without a package registry, and follow it with an example prompt that hands the created project to the user's AI Agent.
- c210c51: Allow importing local YAML files from the configuration editor and deployment draft toolbar with validation, overwrite confirmation, undo, and environment warnings. Importing does not save, deploy, or change the active configuration until explicitly submitted.
- c210c51: Preserve configuration drafts during deployment polling and require confirmation before replacing unsaved edits with updated server configuration.
- c210c51: Show request-scoped feedback for automatic and manual status refreshes and prevent overlapping refresh requests without blocking unrelated page controls.
- c210c51: Accept a dragged release artifact through a full-size native file input, highlight the drop zone, and explain that selecting a file requires a separate upload confirmation. Validate a single .tar.gz or .tgz file for both selection methods, prevent replacement during upload, and claim file drops that miss the zone so the browser does not open the artifact.
- c210c51: Remove the native release file picker filter that can disable valid .tar.gz artifacts on macOS. Keep single-file extension validation for selected and dropped files, and require explicit upload submission.
- Updated dependencies [c84bfe8]
- Updated dependencies [e9da3c2]
- Updated dependencies [9628cdd]
  - @nocobase/db@1.0.0-beta.11
  - @nocobase/app-server@1.0.0-beta.20
  - @nocobase/app-plugin-authorization@0.2.0-beta.14
  - @nocobase/app-plugin-authentication@0.1.0-beta.18

## 0.1.0-beta.11

### Minor Changes

- e13ed84: Organize Hub storage by ownership, add explicit managed revision and log directories, retain legacy layouts, and provide an offline migration preview and copy workflow. Keep standalone Hub data outside build output and place template build archives under storage/exports with matching publishing defaults.
- e13ed84: Persist per-deployment phase and failure logs and expose application runtime logs in Hub with scoped access, incremental reading, retention, and independent file and console outputs.

  Unify runtime logging configuration and source routing, merge default outputs into app files, connect workflow diagnostics with execution identities, and preserve legacy configuration and historical log readability.

  Enforce hosted capture policy, declare the Host server runtime peer, merge paged source logs chronologically with bounded opaque cursors, and preserve correlation and error details when truncating oversized records. Handle expired scans explicitly in the Hub viewer and downloads.

  Route HTTP request logs to separate request files by default in all application templates.

- e13ed84: Unify application directory fields and path helpers in AppPaths, shared by configuration factories, runtime and Application. Replace ConfigPaths and runtime.configPaths with AppPaths and runtime.paths, and construct applications through createAppFromRuntime so Host logging policy and the runtime application reference are wired consistently.

  Standalone applications declare their deployment root separately from their code root. Configuration and default persistent storage use that deployment root in both source and compiled execution. Explicit storage paths take precedence over HUB_STORAGE_DIR, and embedded applications retain Host-provided volumes.

  Standardize Hub storage and expanded releases on the hub, host and apps layout, remove legacy layout detection and offline storage migration commands, and replace appDeploymentsDir with appRevisionsDir. Expanded releases use appRevisionsDir/<appId>/<sha256>; standalone discovery records the selected revision. Consumers must update removed path and storage APIs and configure existing data locations explicitly before adopting this release. Rebuild application artifacts with the updated runtime and templates.

### Patch Changes

- e13ed84: Align Hub dialog backdrops with application templates using a light scrim, supported backdrop blur, and fade transitions.
- e13ed84: Preserve input focus rings inside Hub dialogs and use the standard input styling for application search, with a full-width search field on narrow screens.
- 00362cf: Report a reused Hub deployment honestly. A repeated `app deploy` for the same Release and configuration is answered from the earlier idempotent request, so the Hub now returns `reused` and the deployment's `createdAt` with the accepted operation, and the CLI reports that field and warns that nothing was deployed now instead of printing the same success line as a new deployment. Existing retries keep their exit code; only the output changes.
- e13ed84: Use shadcn select and calendar popover controls for log level and local date-time filters, with localized labels, clear actions, and responsive sizing.
- Updated dependencies [e0c4b3d]
- Updated dependencies [e13ed84]
- Updated dependencies [e13ed84]
- Updated dependencies [e13ed84]
- Updated dependencies [00362cf]
- Updated dependencies [e13ed84]
- Updated dependencies [e13ed84]
  - @nocobase/db@1.0.0-beta.10
  - @nocobase/app-host@0.1.0-beta.8
  - @nocobase/app-server@1.0.0-beta.19
  - @nocobase/logging@0.1.0-beta.5
  - @nocobase/app-plugin-authentication@0.1.0-beta.18
  - @nocobase/app-client@1.0.0-beta.18
  - @nocobase/authorization@0.1.0-beta.7
  - @nocobase/i18n@1.0.0-beta.4
  - @nocobase/service-provider@0.0.2-beta.1
  - @nocobase/app-plugin-api-keys@0.1.0-beta.3
  - @nocobase/app-plugin-authorization@0.2.0-beta.13
  - @nocobase/app-plugin-users@0.0.2-beta.5

## 0.1.0-beta.10

### Minor Changes

- 60fa139: Add streamed, checksum-verified Hub release uploads, persistent upload and deployment retry identities, explicit upload-and-deploy requests, and App CLI upload/deploy commands. Reuse existing upload-release and deploy authorization actions and expose minimal deployment status for CI. Preserve historical releases during canonical checksum migration. Normalize permissions returned by the generic API key service.

  Support optional runtime configuration files for deploy and upload-with-deploy, with bounded streaming transport, existing configuration reuse, and configuration-aware retry checks.

  Reject upload-and-deploy requests that cannot return a publishing deployment, including CLI calls without waiting. Correct the unmerged publishing migration rollback.

### Patch Changes

- 60fa139: Clarify the Viewer role description in Chinese and English as read-only access to permitted applications and runtime status.
- 60fa139: Use a compact layout for simple Hub confirmation dialogs, with balanced spacing and no unnecessary footer divider.
- 365a9fe: Complete English and Chinese translations for authentication, route feedback, authorization, shared controls, File and Notification Registry components, and development examples. Use concise semantic keys consistently for the new translations. Resolve AI Registry copy from the active language and localize development navigation and section headings. Translate MCP configuration guidance, tool drawer labels, and transport descriptions.
- 60fa139: Allow application names to be edited in Hub Settings with owner-scoped authorization, server validation, and unchanged App IDs and URLs.
- 60fa139: Copy recoverable API keys directly from the list, report unavailable legacy keys explicitly, and show a manual-copy dialog when clipboard access is unavailable or denied.
- 60fa139: Use explicit domain resource checks for Hub tabs and publishing keys so granted Operators can access their application pages.
- 60fa139: Fix the publishing skill namespace so plugin skill synchronization succeeds when creating a Hub application.
- 365a9fe: Match translated resource names when searching permissions, preserve the pagination slot across locales, and retranslate stored upload errors when the language changes.
- 60fa139: Move publishing API key management to the Hub navigation and allow each key to bind multiple existing Apps or all current and future Apps. Reuse the existing upload-release and deploy actions, enforce owner permissions for every selected App, and migrate legacy bindings without promoting read permissions to writes.

  Allow creators to retrieve active Hub publishing keys through an authenticated, audited copy action backed by encrypted storage. Preserve hash-only authentication in the generic plugin and mark legacy keys as unrecoverable.

- 60fa139: Reject unsafe, linked, or oversized release metadata through the upload error boundary instead of throwing from tar stream callbacks and terminating Hub. Clean temporary files before returning the validation error.
- 60fa139: Show Hub operation errors as top-right notifications, generate editable application IDs with short random suffixes, and distinguish ID conflicts from reusable application names.
- 60fa139: Filter publishing API Key application metadata through the current user's read permissions after role changes, while preserving key revocation and stored bindings.
- 934d37e: Guide new and existing applications through build, release upload, and deployment. Show Releases before Deployments while selecting the default tab by application state and preserving explicit links and permission boundaries.
- 60fa139: Rename Hub roles to Platform Administrator and Application Administrator in English and Chinese, and clarify application and publishing API Key scope without changing role identifiers or permissions.
- 60fa139: Add confirmed user deletion for Hub platform administrators. Protect the current user, the last active platform administrator, and users who own applications. Revoke sessions and API Keys transactionally while retaining an inactive identity record for historical attribution. Prevent new applications and publishing keys from being created for deleted owners.
- 60fa139: Scope Hub application management to the authenticated creator for non-administrators, including catalog pagination, direct APIs, publishing credentials, and Host status. Preserve administrator access to all applications and keep legacy applications without ownership administrator-only.
- 60fa139: Mark required API key fields and minimum application and permission selections using standard Hub form labels, below-control help text, and shared dialog spacing and radio controls. Label expiration as optional and show a required date field when custom expiration is selected.
- 60fa139: Allow Hub Operators to remove their own applications through the existing confirmation flow. Upgrade the Operator permission set without changing other grants; server-side ownership checks continue to reject access to other users' Apps and Apps without an owner.
- 60fa139: Allow Hub Operators to create and manage their own publishing API keys. Enforce creator ownership on key lists and revocation, retain administrator oversight, and keep each key limited by its creator’s current App and operation permissions. Upgrade the Operator role through an idempotent additive migration.
- 60fa139: Reuse the API Keys plugin through configuration-bound server operations and a scoped Authentication plugin API that preserves hooks and caller-owned transactions. Add per-application publishing API key management in Hub with one-time secret display, scoped Release and Deployment access, expiration, revocation, and current-owner permission checks.
- 60fa139: Reject configured upload retries that omit the original deployment configuration and report known failed or cancelled deployment retries as CLI failures even without --wait.
- 60fa139: Remove the ambiguous app publish alias. Use app upload to upload releases and app deploy to deploy existing releases; update CLI guidance accordingly.
- 60fa139: Remove the duplicate create application button from the empty catalog while retaining the toolbar action.
- 60fa139: Offer Administrator and Operator as the active Hub roles. Prevent new Viewer assignments and hide Viewer from the role matrix while preserving existing Viewer accounts and their read-only permissions without automatic promotion.
- d4ca00e: Use the application's API client for Hub artifact uploads and the notification logs Registry page so requests honor the configured API base URL. Pass the client explicitly to uploadArtifact and fetchNotificationLogs while retaining upload bodies, log responses and cancellation.
- 60fa139: Initialize authentication and session secrets left at example placeholders when preparing or publishing a managed configuration. Preserve existing valid secrets across deployments and configuration updates.
- 8af03c3: Use PageContainer and PageHeader for consistent application catalog, role permissions, and API key page layouts.
- d4ca00e: Use useApiClient() for React API client access across application pages, plugins and shared examples, preserving application-scoped client resolution.
- 60fa139: Wait for the final deployment result by default in app deploy and app upload --deploy. Support --no-wait for asynchronous acceptance, preserve explicit --wait compatibility, and keep upload-only commands independent of deployment polling.
- Updated dependencies [d4ca00e]
- Updated dependencies [365a9fe]
- Updated dependencies [365a9fe]
- Updated dependencies [60fa139]
- Updated dependencies [24e771f]
- Updated dependencies [60fa139]
- Updated dependencies [26ac480]
- Updated dependencies [60fa139]
- Updated dependencies [60fa139]
- Updated dependencies [d4ca00e]
  - @nocobase/app-client@1.0.0-beta.18
  - @nocobase/app-plugin-api-keys@0.1.0-beta.3
  - @nocobase/app-plugin-authorization@0.2.0-beta.13
  - @nocobase/app-plugin-users@0.0.2-beta.5
  - @nocobase/app-plugin-authentication@0.1.0-beta.17
  - @nocobase/db@1.0.0-beta.9
  - @nocobase/app-server@1.0.0-beta.18
  - @nocobase/authorization@0.1.0-beta.7
  - @nocobase/i18n@1.0.0-beta.4
  - @nocobase/service-provider@0.0.2-beta.1

## 0.1.0-beta.9

### Patch Changes

- 028dd7c: Use host-provided peers for shared database types, authorization errors, service tokens, cache registries, and repository filter metadata. Declare their production providers in all application templates so deployments with automatic peer installation disabled retain the required runtime packages. Document the provider contract for generated plugins.

  Existing applications upgrading these packages must add compatible versions of their required shared peers to production dependencies: @nocobase/db, @nocobase/service-provider, @nocobase/repository-input, @nocobase/authorization, @nocobase/caching, @nocobase/i18n, and @nocobase/queue for the standard server stack, plus @nocobase/ai-employee when using its plugin. Update the lockfile and verify the production install; peer declarations do not remove incompatible historical versions automatically.

- Updated dependencies [028dd7c]
  - @nocobase/app-client@1.0.0-beta.17
  - @nocobase/app-plugin-authentication@0.1.0-beta.16
  - @nocobase/app-plugin-authorization@0.2.0-beta.12
  - @nocobase/app-plugin-users@0.0.2-beta.4
  - @nocobase/app-server@1.0.0-beta.17
  - @nocobase/authorization@0.1.0-beta.7
  - @nocobase/db@1.0.0-beta.8

## 0.1.0-beta.8

### Patch Changes

- 415d763: Add optional standalone HTTP and WebSocket proxy routing and configure Hub to forward paths outside its public mount to the current ready App Host port. Preserve public request identity and streaming, release proxy connections during shutdown, and use the shared public entry for hosted application links.

  Return 502 and close the upstream connection when a regular HTTP request receives an unexpected protocol upgrade. Validate App IDs against the normalized Hub mount and the managed Host's reserved `__` namespace before creating an application.

- Updated dependencies [415d763]
- Updated dependencies [1fea79a]
  - @nocobase/app-server@1.0.0-beta.16
  - @nocobase/app-plugin-authorization@0.2.0-beta.11
  - @nocobase/app-plugin-authentication@0.1.0-beta.15

## 0.1.0-beta.7

### Patch Changes

- d927494: Fix development startup of generated Hub applications by selecting the App Host launcher from the loaded package format, preserving source development in the workspace and using compiled JavaScript in installed packages. Keep the optional application configuration commented out so an empty YAML section cannot override application identity defaults during production startup. Correct the AI Employee plugin Skill namespace so generated applications can synchronize their registered plugins' Skills.
- Updated dependencies [d927494]
- Updated dependencies [6acf3bc]
- Updated dependencies [89955c5]
  - @nocobase/app-host@0.1.0-beta.7
  - @nocobase/app-plugin-users@0.0.2-beta.3
  - @nocobase/authorization@0.1.0-beta.6
  - @nocobase/app-plugin-authentication@0.1.0-beta.15
  - @nocobase/app-server@1.0.0-beta.15
  - @nocobase/db@1.0.0-beta.7

## 0.1.0-beta.6

### Patch Changes

- 1decf5f: Keep a dialog's actions and its step indicator in view while its content scrolls

  `DialogContent` made the whole popup one scroll container, so a dialog tall enough to overflow moved its own footer below the fold. Deploying an application was the worst case: the configuration step stacks a source picker, a notice, and two editors, and the primary action could only be reached by scrolling past all of it.

  The popup is now a column that does not scroll. A header, an optional subheader, and a footer stay put, and a single body between them is what moves. `AppDialog` gained `footer` and `subheader` for this, and the deploy wizard puts its step indicator and configuration-source picker in the subheader — controls a reader needs in order to act on the body scroll out of reach exactly when the content is long enough to need them.

  The configuration editor's height is capped against the viewport as well as in pixels, so on a short screen it shrinks rather than spending the whole body on itself.

  One behavioural note: the create-application dialog's submit button now sits outside the `<form>` it belongs to, and is reassociated with it by `form` id, so both clicking it and pressing Enter in a field still submit.

- a60decd: Require an explicit absolute baseDir for Server plugins and resolve migrations, seeds, jobs, and package metadata from the loaded plugin copy. Generate and validate database task manifests during builds so TypeScript and JavaScript share source checksums, with verified legacy JavaScript history conversion and synchronized plugin scaffolding and application templates.
- Updated dependencies [1decf5f]
- Updated dependencies [63db898]
- Updated dependencies [63db898]
- Updated dependencies [63db898]
- Updated dependencies [63db898]
- Updated dependencies [a60decd]
- Updated dependencies [1a85a86]
- Updated dependencies [1a85a86]
- Updated dependencies [1c70f60]
- Updated dependencies [63db898]
  - @nocobase/app-host@0.1.0-beta.6
  - @nocobase/app-server@1.0.0-beta.15
  - @nocobase/db@1.0.0-beta.7
  - @nocobase/app-plugin-authentication@0.1.0-beta.14
  - @nocobase/app-plugin-authorization@0.2.0-beta.10
  - @nocobase/app-plugin-users@0.0.2-beta.2
  - @nocobase/app-client@1.0.0-beta.16
  - @nocobase/i18n@1.0.0-beta.4
  - @nocobase/service-provider@0.0.2-beta.1

## 0.1.0-beta.5

### Patch Changes

- a2dbe54: Publish only the compiled `dist/database`, no longer the TypeScript sources beside it. The runtime resolves a plugin's declared `database/migrations` and `database/seeds` against the package directory first and its `dist` second, so an installed plugin that shipped both served the sources, and Node refuses to strip types from a file under `node_modules`: `@nocobase/app-plugin-ai-employee` failed every application start with `Stripping types is currently unsupported for files under node_modules` while every development checkout, which resolves the same sources outside `node_modules`, kept working.

## 0.1.0-beta.4

### Minor Changes

- f17f3a6: Provide editable TypeScript defaults for application modules, assembled by the runtime before services start. Module factories receive the runtime with application paths and plugin metadata; deployment files and environment variables override defaults, and configuration reload preserves code defaults.

  Keep deployment settings in YAML examples and reserve explicit environment overrides for secrets and startup integration. Simplify application configuration loading, merging and reload subscriptions.

  Align client configuration assembly with the server: runtime merges application TypeScript defaults beneath public configuration before services start. Client inspection reports the application configuration entry.

- e11b855: Improve Hub App management with server-side catalog search and pagination, URL-addressable App detail Tabs, unified runtime status and action availability feedback, and application removal from the catalog.

  The catalog search is scoped to the Collection's database schema, so it works on PostgreSQL when the application runs outside the connection's default schema, and Hub reads no longer wait indefinitely for startup restoration; Apps the Host has not reached yet are reported as pending in the meantime.

  `GET /hub/apps` now returns a pagination object rather than an array. The response body changes from `HubAppSummary[]` to `{ items, total, page, pageSize }`, and accepts `search`, `page`, and `pageSize` query parameters. Any HTTP client reading the array directly has to read `items` instead. The `HubService.listApps()` method keeps its existing array return type; the new `HubService.listAppsPage()` serves the paginated route.

### Patch Changes

- ceb356b: Fix published package metadata and database test driver registration.
- e11b855: Generate and persist an authentication secret when a Config file deployment does not provide one.
- e11b855: Format dates in the language the application is in rather than the browser's. `Intl.DateTimeFormat` was constructed without a locale, which resolves to the browser's own language, so an English Hub on a Chinese browser rendered `2026年9月14日` beside its English labels — and a Chinese Hub on an English browser rendered `Sep 14, 2026`. The catalog, App detail header, Releases, Deployments and configuration history all read the application's language now.
- e11b855: Default the deploy dialog to the newest uploaded release instead of the one already running, mark the running and newest releases in the picker so two uploads of the same version can be told apart, and show the release checksum in the review step.
- e11b855: Preserve an existing App configuration when deploying a newer Release with a configuration template.
- Updated dependencies [ceb356b]
- Updated dependencies [f17f3a6]
- Updated dependencies [f17f3a6]
- Updated dependencies [f17f3a6]
- Updated dependencies [43d25b4]
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
- Updated dependencies [e11b855]
- Updated dependencies [e11b855]
- Updated dependencies [ceb356b]
- Updated dependencies [e11b855]
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
- Updated dependencies [ceb356b]
  - @nocobase/app-server@1.0.0-beta.11
  - @nocobase/app-client@1.0.0-beta.14
  - @nocobase/app-plugin-authentication@0.1.0-beta.11
  - @nocobase/db@1.0.0-beta.5
  - @nocobase/authorization@0.1.0-beta.5
  - @nocobase/app-host@0.1.0-beta.5
  - @nocobase/app-plugin-users@0.0.2-beta.1

## 0.1.0-beta.3

### Minor Changes

- e3fa827: Add reusable user administration and Hub-scoped role-based authorization. Authentication now supports disabled accounts, transaction-aware administration, stable duplicate-identity conflicts, Session revocation, and immediate Realtime disconnects. Authorization supports protected Permission Sets, atomic scoped assignment replacement, and Client permission invalidation. The Users page supports protected role options, readable multi-role editing, explicit unassigned states, and a distinction between direct roles and authenticated-user defaults; password reset and database Session revocation share one transaction. The default App exposes its direct Authorization Permission Sets as application roles while keeping System administrator changes in Authorization. The Hub defines Administrator, Operator, and Viewer roles, batch-loads their user assignments, enforces every Hub and user-management action on the server, protects the final enabled Administrator, and hides unauthorized Client controls. Both templates register the reusable Users plugin; Hub exposes Applications, User management, and a read-only role matrix directly in its control-plane navigation, while the default App keeps Users in Settings. Only the Hub template receives Hub roles, disables public sign-up, and omits ordinary App Settings, workflows, notifications, and example plugins.

### Patch Changes

- 1d042c0: Support recursive page routes and navigation groups across App, Settings, and Dev. Render application menus from route navigation instead of Refine resources, preserve parent access checks, and migrate template and example navigation. Refine resources remain available for CRUD integration.
- Updated dependencies [e3fa827]
- Updated dependencies [c3e02bf]
- Updated dependencies [0a3fa83]
- Updated dependencies [1d042c0]
  - @nocobase/app-server@1.0.0-beta.9
  - @nocobase/authorization@0.1.0-beta.4
  - @nocobase/app-plugin-authentication@0.1.0-beta.10
  - @nocobase/app-plugin-authorization@0.2.0-beta.9
  - @nocobase/app-plugin-users@0.0.2-beta.0
  - @nocobase/app-client@1.0.0-beta.12
  - @nocobase/db@1.0.0-beta.4

## 0.0.2-beta.2

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
  - @nocobase/app-plugin-authorization@0.2.0-beta.8

## 0.0.2-beta.1

### Patch Changes

- a3cb4bb: Show release templates on the left and editable deployment drafts on the right. Initialize subsequent deployment drafts from current configuration and allow template changes to be applied selectively while reviewing against the active configuration.
- Updated dependencies [0e9505a]
- Updated dependencies [9536bf5]
- Updated dependencies [9536bf5]
  - @nocobase/app-plugin-authentication@0.1.0-beta.8
  - @nocobase/drive@0.1.0-beta.3
  - @nocobase/app-client@1.0.0-beta.11
  - @nocobase/app-plugin-authorization@0.2.0-beta.7

## 0.0.2-beta.0

### Patch Changes

- a864497: Register the Application Hub in the Hub template and provide an application control plane. Release artifacts supply their version and an optional `config.example.yml` or `config.example.yaml` template, while applications choose Config file or External configuration and reserve Hub-managed configuration for a future database-backed implementation. Hub actions reconcile only the selected application, reuse an already installed matching artifact, report deployment phase timings, and support removing an application and its persisted resources. Separate Hub desired configuration files from Host-owned runtime configuration, rebuild recovery targets when Host becomes ready, and split the management page into business modules.
- a864497: Paginate deployment history on the server and add page navigation to the Hub workspace. Refresh only the selected page and show new deployments on the first page.
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
  - @nocobase/app-host@0.1.0-beta.4
  - @nocobase/app-plugin-authorization@0.2.0-beta.7

## 0.0.1

### Patch Changes

- Add the initial single-Host application management flow with immutable Release builds, asynchronous deployment history, rollback operations, deployment-scoped configuration, Host-owned runtime status, and non-blocking eager App restoration during Hub startup.
