# @nocobase/hub-cli

## 1.0.0-beta.1

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

### Minor Changes

- e44f49c: `hub releases` lists an App's Releases newest first — ID, version, checksum, size, `uploadedAt`, the `buildTarget` the archive records, whether it is what the App runs now (`running`) and whether a deployment of it ever succeeded (`everDeployed`) — with `--limit` (1–100, default 20) and `--release-id` for one. `hub status` reports the remote, the platform the Hub builds the App for, the Release and version it runs, the Host's state for it and its last deployment, and `hub status --deployment <id>` one deployment's status. Both read with a key holding either publishing permission, so finding the Release to roll back to no longer needs the Hub's web page.

  A publishing key holding either scope for an App can now read `GET /api/hub/apps/:appId/releases`, `GET /api/hub/apps/:appId/releases/:releaseId` and `GET /api/hub/apps/:appId/deployments`. The Release list pages with `page` and `pageSize` (`pageSize` 1–100, default 20; anything else is answered with `400 INVALID_ARGUMENT` and reason `INVALID_INPUT`) and answers `{ data, meta: { page, pageSize, total } }`, each Release reports `buildTarget`, `running` and `everDeployed`, and deployment list items carry `finishedAt`. Deployment configuration, deployment details and logs stay signed-in only.

- e44f49c: `@nocobase/hub-cli` deploys to named remotes and builds for the Hub. `hub remote add <name> <url>`, `hub remote list` and `hub remote remove` keep the Apps an application deploys to in the committed `.nocobase/hub.json`, where a remote URL is `<Hub URL>/apps/<App ID>` and the first remote is the default; every command takes `--remote <name>`. `hub auth login` saves an API key for a remote after the Hub accepts it, asking for it without echoing it or reading it from standard input with `--with-token`, in `$XDG_CONFIG_HOME/nocobase/hub-credentials.json` (`%APPDATA%\nocobase` on Windows), readable by its owner only; `hub auth logout` removes it and `hub auth status` checks every remote's key. `hub deploy` and `hub upload` now read the platform the Hub runs Apps on and run `nocobase build --target … --node-version … --tar` for it before uploading; `--no-build` uploads the existing archive and `--file` another one, each checked against the Hub's platform first (`BUILD_TARGET_MISMATCH`). `hub deploy` uploads, then deploys through the Hub's deploy endpoint, so an archive the Hub already has is deployed as its existing Release instead of failing with `NO_DEPLOYMENT`; its `--idempotency-key` is the deployment's retry identity, and the upload is keyed by the archive checksum.

  `hub remote add` warns when the App root's `.gitignore` ignores `.nocobase/`, as applications generated by an earlier `@nocobase/create-app` do; the line has to go for the remotes to reach another checkout. `hub auth status` reports a key as rejected only when the Hub rejects it (`INVALID_API_KEY`, `API_KEY_FORBIDDEN`); a Hub that cannot be reached or answers something else leaves the key unchecked. `--timeout` bounds each request to the Hub and the wait for a deployment rather than the whole run, and a request that outlasts it fails with `TIMEOUT` (exit 3) instead of `RESULT_UNKNOWN`. Under the default `--idempotency-key`, deploying a Release the App deployed before and has since moved on from, as `hub deploy --release-id` does to roll back, deploys it again instead of answering with the earlier deployment; running the same command again still repeats nothing. A 404 that does not come from the Hub, as at a mistyped remote URL, fails with `HUB_NOT_FOUND` and points to `hub remote list`, and Ctrl-C at the `hub auth login` prompt cancels with `LOGIN_CANCELLED` (exit 130).

  Breaking: `HUB_URL`, `HUB_APP_ID` and `HUB_API_KEY`, from the environment or the App root `.env`, and the `--hub`, `--app-id` and `--api-key` flags are removed. Migrate with `pnpm nocobase hub remote add origin <Hub URL>/apps/<App ID>` and `pnpm nocobase hub auth login` (`echo "$HUB_KEY" | pnpm nocobase hub auth login --with-token` in CI). Under `--json`, `hub upload` no longer reports `operationId`, `hub deploy` reports `reused` for a reused deployment, and a build adds `buildTarget`. The package root exports `publish`, `HubClient` and `parseRemoteUrl` in place of `publishToHub` and `publishRelease`.

  Breaking for `@nocobase/app-plugin-hub`: `POST /api/hub/apps/:appId/releases` only uploads. It no longer accepts the `application/vnd.nocobase.release-upload.v1` configuration-prefixed body or `X-Hub-Config-Length`, ignores `X-Hub-Deployment-Intent` and `X-Hub-Wait`, and returns 200 with the Release, `releaseId` and `reused`; deploy through `POST /api/hub/apps/:appId/deploy`. An older hub-cli uploads but no longer deploys in the same request. An upload whose `nocobase.buildTarget` names another platform, architecture, Node major or Linux C library than the Host's is rejected with `422 BUILD_TARGET_MISMATCH` before anything is stored. `GET /api/hub/apps/:appId` reports the Host's `buildTarget` and, like `GET /apps/:appId/deployments/:deploymentId/status`, accepts a publishing key holding either scope for the App. Which routes a publishing key may call is declared with each route rather than matched by a separate pattern.

  `@nocobase/app-host` reports `runtime` — the Host process's `platform`, `arch`, `libc`, `nodeAbi` and `nodeMajor` — in `HostStatus`. The `nocobase-deployment`, `nocobase-app-development` and `nocobase-app-upgrade` Skills describe the remote, `hub auth login` and the build inside `hub deploy`, and the upgrade edge cases list the migration for an existing application.

- e44f49c: `hub deploy` and `hub upload` send the archive through the Hub's resumable upload, so an archive may be up to 2 GiB and a reverse proxy in front of the Hub only needs to allow a request the size of one chunk (8 MiB). A chunk whose answer is lost is sent again from the offset the Hub reports, after up to five consecutive failures of the chunk or of the read that finds the offset; a run that gives up leaves its session on the Hub for 24 hours so the same command resumes it, and an archive the Hub already has is not sent again. Progress is reported by the tenth.

  The Hub accepts resumable Release uploads under `/api/hub/apps/:appId/releases/uploads` with the `upload-release` action or publishing-key scope: `POST` starts a session for `{ size, sha256 }` (resuming an unfinished one for the same archive, or answering with the Release when the App already has it), `PATCH /:uploadId` appends a chunk at `Upload-Offset` (`409` with reason `UPLOAD_OFFSET_MISMATCH` reports the offset to continue from in `error.metadata.offset`), `GET /:uploadId` reports the offset, and `POST /:uploadId/complete` verifies the archive and creates the Release through the same checks as the single upload, answering a retried completion with the same Release. Sessions are staged on the Hub's local disk under the new `uploadsDir` option, which the Hub template sets to `storage/hub/uploads`, one directory per App, and expire 24 hours after their last chunk; an App's expired sessions are removed when one of its uploads starts, and every App's once an hour. `POST /api/hub/apps/:appId/releases`, which the management console uses, keeps its 256 MiB limit.

### Patch Changes

- e44f49c: `defineCliPlugin` accepts `topics`, a one-line description for each topic nested under the plugin's own, keyed like a command name without its last part: `topics: { remote: '…' }` describes the topic holding `remote:add` and `remote:list`. `--help` and `pnpm nocobase commands` show it for the nested topic instead of one of its commands' summaries, and only where a command under it is registered, so a deployment without the development commands lists no empty topic. A described topic with no command under it, or with an empty description, is rejected. `@nocobase/hub-cli` describes its `hub remote` and `hub auth` topics.
- Updated dependencies [463a7a8]
- Updated dependencies [463a7a8]
- Updated dependencies [e44f49c]
  - @nocobase/app-cli@1.0.0-beta.12

## 0.1.0-beta.0

### Minor Changes

- 84cc7d2: `release upload` and `release deploy` leave `@nocobase/app-cli` for the new `@nocobase/hub-cli` package as `hub upload` and `hub deploy`, and the `nocobase.cli.publishing` flag that registered them is removed. An application gets the commands by depending on `@nocobase/hub-cli`; the Default template declares it in `devDependencies`. `hub deploy` uploads `storage/exports/dist.tar.gz` and deploys it, as `release upload --deploy` did, and with `--release-id` deploys a Release already on the Hub, as `release deploy` did. `hub upload` only uploads and takes no `--deploy`, `--wait` or `--config`. The other flags, the `HUB_*` variables and the exit codes are unchanged; under `--json`, `command` names the new commands, and an unexpected upload failure is `UPLOAD_FAILED` where it was `PUBLISH_FAILED`. The client that `@nocobase/app-cli/hub-publishing` exported is now the `@nocobase/hub-cli` package root, and the Hub's `NO_DEPLOYMENT` and configuration-conflict messages name `hub deploy --release-id`.

  A direct `@nocobase/` dependency whose `package.json` names a CLI entry in `nocobase.cli.entry` now contributes that entry's `defineCliPlugin` commands without an entry in `cli/plugins.ts`, and a package that is not an application plugin takes its topic from its name without the `-cli` suffix. The runner imports such a package only for a command under its topic, for help on the whole tree and for `commands`; a package the application requires but nobody installed is reported as `PACKAGE_NOT_INSTALLED` with `pnpm install` as the suggestion. `AppLocation` no longer has `publishing`. `@nocobase/hub-cli` ships a `nocobase-hub-cli` Skill, and the `nocobase-app-upgrade` Skill's edge cases list the steps for an existing application.

### Patch Changes

- Updated dependencies [9f75a27]
- Updated dependencies [84cc7d2]
  - @nocobase/app-cli@1.0.0-beta.9

## 0.0.1

### Minor Changes

- Add `nocobase hub deploy` and `nocobase hub upload` to the application that depends on this package, replacing `nocobase release upload` and `release deploy` from `@nocobase/app-cli`.
