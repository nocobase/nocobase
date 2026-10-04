---
'@nocobase/app-plugin-hub': major
'@nocobase/hub-cli': major
---

The Hub API under `/api/hub` follows the application's HTTP API rules, and `@nocobase/hub-cli` speaks the new API. A `hub-cli` older than this release cannot publish to an upgraded Hub, and this `hub-cli` cannot publish to an older one, so upgrade both together.

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
