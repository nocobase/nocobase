# @nocobase/app-plugin-hub

The first-party control plane for applications run by a managed NocoBase App Host.

Every Hub route lives under `/api/hub` and follows the application's HTTP API rules: a list answers `{ data: [...], meta }`, an input that fails validation answers `400` with reason `INVALID_INPUT` naming each invalid field, and every failure is the standard error body, whose `reason` in the `hub` domain is what a client branches on.

Every route is described in the application's OpenAPI document under the `Hub` tag, with its operationId (such as `hubDeployApp`), inputs, response schemas and the reasons each status carries: open `<Hub base>/api/swagger/docs` while signed in, or read `<Hub base>/api/swagger` as JSON. The sections below explain behavior the document does not.

The application catalog is searched and paginated on the server. `GET /api/hub/apps?q=customer&page=1&pageSize=24` returns `{ data: [...], meta: { page, pageSize, total } }`; `q` matches App IDs and names case-insensitively and is at most 100 characters, page size defaults to 20, and page size is limited to 100. Deployment history is paginated the same way: `GET /api/hub/apps/:appId/deployments?page=1&pageSize=20` returns `{ data: [...], meta: { page, pageSize, total } }`. The workspace refreshes only the selected page and returns to the first page after submitting a deployment or rollback.

Runtime and deployment logs are read as a feed: `GET /api/hub/apps/:appId/logs` and `GET /api/hub/apps/:appId/deployments/:deploymentId/logs` return the entries in `data` and `meta: { nextPageToken, hasMore, available, enabled, reset }`, plus `status` and `phase` for a deployment. Pass `nextPageToken` back as `pageToken` to read on; a log keeps returning a token while it grows, so reading from the same token later returns what was written since. `q`, `level` (one of `trace`, `debug`, `info`, `warn`, `error`, `fatal`), `source`, `since` and `until` (RFC 3339 times in UTC, such as `2026-01-01T00:00:00Z`) and `fromStart` filter the read; any other value answers `400 / INVALID_INPUT`. Reading a log never removes anything: retention runs when a deployment finishes and in the App's own file logger.

Creating an App answers `201` with the App. `PATCH /api/hub/apps/:appId/settings` updates any of `name` and `activation` and answers with the settings, `{ name, activation }`. `POST /api/hub/apps/:appId/start`, `stop`, `restart` and `refresh` answer with the App as it stands afterwards, and `DELETE /api/hub/apps/:appId` answers `204`.

The initial implementation supports a single Hub-spawned Host and in-process Apps. Its application catalog supports card and list views; each App opens into an operational detail workspace with runtime and deployment facts in the header plus Releases & deployments, Runtime logs, post-deployment Configuration, and Settings tabs. The unfinished Resources tab is hidden; its implementation is retained for future development. Development guides both new and existing projects through building `storage/exports/dist.tar.gz`. The application parent URL opens the combined Releases & deployments workspace, falling back to the first accessible tab. Legacy Releases URLs redirect to that workspace while preserving queries. Its compact release list shows the latest three uploads, expands to all versions, and offers per-release deployment actions. Uploading expands the list and shows a temporary success notification. The newest persisted upload retains its Latest upload badge across refreshes and is highlighted until it becomes the active release; submitting a deployment collapses it and opens that deployment’s live logs in a URL-addressable drawer. Each section and action retains its independent permission checks. Release upload and deployment are separate actions; deployment uses a three-step Release, Configuration, and Review flow. Settings choose whether the App activates with Hub (`eager`, the default) or registers for activation on its first visit (`lazy`); deployments do not change this policy. The workspace also provides live Host status refresh, App access, start, stop, and removal. Runtime state always comes from App Host and is reported as unknown when Host is unavailable. Interactive operations reconcile only the selected App; complete deployment sets are reserved for Host startup recovery. Stop sets the persisted `enabled` policy to false while preserving the current deployment so Start can reactivate it. Remove permanently deletes the App record, Releases, deployment history, configuration, and App volume.

Releases accept a root `config.example.yml` or `config.example.yaml` as an editable template. Real `config.yml` files are not imported. Hub persists desired configuration privately under `storage/hub/desired-configs/<appId>/<deploymentId>.yml` and sends content and revision to Host. Host owns a separate runtime file under `storage/apps/volumes/<appId>/configs/config.<deploymentId>.yml`, including atomic writes, replacement cleanup and publishing to the active runtime. These files are not configuration version history. Rollback preserves the target mode, not its old path. On Host readiness, Hub rebuilds recovery targets from its database and desired configuration files; the process supervisor does not retain an application deployment snapshot. The Host expands Releases into `storage/apps/revisions/<appId>/<sha256>` directories.

For Config file deployments, Hub fills a missing, empty, or example-placeholder `secrets.keys` with one random 32-byte key (version 1), and missing, blank, or example-placeholder `auth.secret` and `session.secret` values with independent random 32-byte secrets, including when a configuration section is omitted; applications built from a template older than `secrets.keys` still need the latter two. A secret supplied by the user, or already present in the current Config file, is preserved and reused by later deployments and configuration publications. Existing applications without a persisted session secret receive one on their next Config file deployment or configuration publication; cookies encrypted with the previous runtime-only session secret become invalid. External configuration does not create or modify a file secret.

Deploy and rollback requests persist a queued operation and return HTTP 202. The in-process runner serializes operations for one App while allowing different Apps to deploy concurrently. The page polls active operations and exposes deployment history with rollback actions. Rollback creates a new record from a previously successful deployment; whether its expanded revision is cached changes only deployment speed. The current deployment pointer changes only after Host reports success, so a failure leaves the active deployment untouched. Reconciliation reuses an expanded directory when the Release checksum matches. The Host currently uses stop-first Runtime replacement to avoid overlapping process-global queue state, restores the previous Runtime when replacement fails, retains the three most recently used expanded revisions per App, and logs artifact, activation, and cache-pruning phase durations.

During Hub startup, only managed Host availability is awaited. Restoring the complete deployment set runs in the background, so eager App activation does not delay Hub readiness. App Host currently reconciles that startup set through its existing serial operation queue; this bounds startup load and preserves deployment revision ordering.

The Client plugin defaults to its compatible `/hub` page. App details are
addressable at `<applicationsPath>/:appId/<tab>`; the detail Tabs are child
routes so direct links, refresh, and browser history preserve the selected App
and Tab. Applications can
configure the Client factory with `applicationsPath` and `rolesPath` to expose
a control-plane console. The Hub template uses
`/apps`, `/users`, and `/roles`; the roles page is a read-only product view of
the Hub-owned grants rather than the generic Permission Set editor.

Hub offers two roles: **Platform Administrator** (`hub-administrator`, 平台管理员) and **Application Administrator** (`hub-operator`, 应用管理员). These display names describe platform-wide management and management of applications created by the user, respectively; the role identifiers remain unchanged. Every management API checks a `hub.app`, `hub.host`, or `user` resource action on the server rather than checking a role name. Administrators manage applications and users, and Operators manage application releases and runtime operations and can delete their own Apps after confirmation. Existing System Administrators receive the Hub Administrator role during upgrade, but the two roles do not implicitly inherit from one another at runtime.
Application ownership is enforced on the server in addition to action grants. Hub Administrators can access all Apps. Operators can access only Apps whose `createdBy` matches their authenticated user ID, subject to their existing action permissions. The server records the creator when an App is created and ignores client-supplied ownership. Catalog search, totals, pagination, detail APIs, publishing credentials, and Host deployment status use the same boundary. Existing Apps without reliable ownership remain visible only to Hub Administrators until their ownership is explicitly established; upgrading does not guess or reassign creators. This controls Hub management access, while each hosted App retains its own business-data authentication and authorization.

The Hub template redirects its root and legacy `/hub` route to `/apps` and uses
Applications, User management, and Roles & permissions as its primary
navigation. These entries are declared on their owning routes and do not use
Refine resources as menu metadata. The template
does not expose the ordinary App Settings centre, notification centre,
workflows, or example plugins. The notification provider remains available for
in-page operation feedback.

This version uses an in-process deployment runner rather than a separate durable queue worker. If Hub restarts during an operation, the persisted queued/deploying record is marked failed and can be retried manually. It does not yet provide remote Hosts, multiple Hosts or environments, configuration publications, external provider integration, or database migration rollback. Start-first replacement is not a strict zero-downtime guarantee for long-lived connections or incompatible database migrations. Database migration and seed behavior remains part of App startup.

Set `HUB_HOST_ENABLED=false` only for processes that need Hub metadata without starting its local managed Host, such as composition-only tests.

## Host supervision configuration

`hubServiceToken` exposes `getHostProxyTarget()` for a standalone listener to read the current ready Host origin without starting it. The method returns `null` while Host is disabled, stopped, starting or failed, and reads Supervisor state again on every call so a restarted Host may use a different port. The Hub listener owns HTTP and WebSocket forwarding; plugin API routes remain application-local management endpoints. App IDs that overlap the Hub application's normalized public base path are rejected when created. IDs beginning with `__` are also rejected to match the managed Host's reserved namespace, which includes `/__live`, `/__ready`, and `/__health`.

`hub.publicHostUrl` controls the public entry used by the Visit App link. Set it to `/` when the Hub standalone listener proxies other paths on the same origin, as the Hub template does. An absolute origin supports an externally exposed Host; omitting it preserves direct Host links for existing plugin consumers. The internal proxy target always comes from Supervisor state, independently of this browser-facing setting.

Hub configures its child-process supervisor through `hub.host` in the Hub's
configuration file. The supervisor receives resolved options and does not read
`APP_HOST_*` settings from the parent environment.

```yaml
hub:
  host:
    enabled: true
    driver: node
    host: 127.0.0.1
    # port: 13010 # Omit to find an available port starting at 13010.
    startTimeoutMs: 30000
    ipcTimeoutMs: 300000
    shutdownTimeoutMs: 30000
    autoRestart: true
    maxAutomaticRestarts: 5
    automaticRestartWindowMs: 60000
    automaticRestartBaseDelayMs: 250
```

Paths remain configurable through `appRevisionsDir`, `appVolumesDir`, and
`configPath`; their defaults are under the Hub storage directory. Advanced
development overrides are `entrypoint`, `tsxCli`, and `tsconfig`.
Environment overrides use `HUB_HOST_*`, for example `HUB_HOST_PORT`,
`HUB_HOST_START_TIMEOUT_MS`, `HUB_HOST_AUTO_RESTART`, `HUB_HOST_ENTRY`,
`HUB_HOST_TSX_CLI`, and `HUB_HOST_TSCONFIG`. Directory overrides are
`HUB_HOST_DEPLOYMENTS_DIR`, `HUB_HOST_VOLUMES_DIR`, and `HUB_HOST_CONFIG_PATH`.
The Hub template uses `node` in production and `auto` otherwise. `auto` follows the loaded App Host package: workspace TypeScript exports use `tsx`, while published JavaScript exports use `node`. Development mode therefore works with an installed package that ships only `dist`, without requiring its TypeScript sources. Set `driver` to `node` or `tsx` to explicitly choose a launcher.

This does not change standalone Host configuration: a directly launched Host
still reads its own top-level `host` configuration and `APP_HOST_*` environment
mappings. It does not instantiate a supervisor; process supervision belongs to
Docker, systemd, or another external process manager. In Hub-managed mode, Hub
passes the selected port and paths to the child process.

## Verification

The application catalog returns lightweight summaries using three database queries and one shared Host status snapshot, independent of the number of Apps. It does not load release templates or deployment histories. Opening an App loads its overview, then the visible workspace loads releases and paginated deployment history according to the user’s permissions. Configuration loads only for Configuration or deployment dialogs. Deployment polling refreshes the overview and visible workspace without remounting the logs drawer.

```bash
pnpm --filter @nocobase/app-plugin-hub lint
pnpm --filter @nocobase/app-plugin-hub typecheck
pnpm --filter @nocobase/app-plugin-hub test
pnpm --filter @nocobase/app-plugin-hub build
```

## App publishing API keys

The Hub **API Keys** page follows **Roles & permissions** in the main navigation. Administrators and Operators select specific existing Apps or **All applications (including future apps)** and grant only the existing `hub.app` actions `upload-release` and `deploy`. The API Keys plugin generates, hashes, verifies, expires and revokes credentials; Hub stores publishing permissions, App bindings and an encrypted recovery copy. Expiration is optional. While a key is active, its creator can retrieve it again through the authenticated Hub copy action; list responses never include the plaintext or ciphertext. The all-applications choice is a dynamic grant, so newly created Apps are included automatically; granting it requires the corresponding wildcard Hub permissions, and every request still checks the owner’s current permissions. Bindings and permissions cannot be edited after creation.

Use `Authorization: Bearer <key>` with `POST /api/hub/apps/:appId/releases` and the resumable upload routes under `/api/hub/apps/:appId/releases/uploads` (`upload-release`), `POST /api/hub/apps/:appId/deploy` (`deploy`), and the reads any publishing key for the App may make: `GET /api/hub/apps/:appId`, `GET /api/hub/apps/:appId/releases`, `GET /api/hub/apps/:appId/releases/:releaseId`, `GET /api/hub/apps/:appId/deployments` and `GET /api/hub/apps/:appId/deployments/:deploymentId/status`. Every other Hub endpoint answers a publishing key with `403 / API_KEY_FORBIDDEN`. Each App route starts with the middleware `HubAppRoutes.access()` in `server/routes/api-key-access.ts` makes for it, which declares whether it accepts a publishing key, and the boundary rejects a key for any route that did not. Publishing keys do not become user Sessions and cannot access configuration, user administration or key management. Each use additionally checks that its creator is enabled and still has the corresponding Hub permission. Revocation takes effect for subsequent requests; it does not cancel an already accepted deployment.

Management requires a signed-in user with `hub.app / manage-api-keys`, granted to `hub-administrator` and `hub-operator` by default. Operators can list, copy, disable, and delete only their own keys. Administrators can list, disable, and delete all publishing keys, but can copy only their own. Every key is bound to its creator; selected Apps and actions never exceed that user’s current permissions. Key lists display bound App metadata only when the current user can still read that App. After a role downgrade, inaccessible Apps are hidden without changing stored bindings or preventing the creator from revoking their old keys. Removing an App removes only its binding; removing the final binding deletes the credential. The forward-only multi-App migration preserves existing single-App bindings and retains only existing upload/deploy grants, never promoting legacy read grants to writes. The generic user API Keys plugin remains separate. See [the publishing-key guide](skills/nocobase-app-plugin-hub-api-keys/SKILL.md) for endpoint and scope details.

Hub reuses `@nocobase/app-plugin-api-keys` for key generation, hashing, expiry, verification, and credential management. Register `...hubApiKeyAuthentication()` in the Hub authentication configuration in place of `apiKey()`. It preserves the default user-key configuration and adds a `hub-publishing` configuration without Session authentication. Hub owns the App binding, scopes, encrypted recovery, permanent revocation rule, and current-owner authorization.

Recoverable Hub keys are sealed with the Hub's secrets service (`secrets.keys`), bound to the credential ID and owner. Copies stored by earlier versions under a key derived from `auth.secret` (`v1.`) stay readable while `auth.secret` is kept, and `pnpm nocobase secrets rotate` reseals them with the secrets service, after which `auth.secret` is no longer needed for them. Keep `secrets.keys` backed up separately from the database; removing a key before `secrets rotate` has resealed what it sealed makes those copies unrecoverable, while credential hash verification remains independent. `POST /api/hub/apiKeys/:keyId/reveal` requires an authenticated session, management permission and ownership, returns `no-store`, and logs only identifiers. Disabling clears the encrypted copy. Older keys that only have a hash cannot be recovered and must be replaced to enable copying.

## Publishing from the command line

Applications that depend on `@nocobase/hub-cli` get the `pnpm nocobase hub` commands; the Default template declares it, and its README is the command reference. An App is added as a remote by its URL on the Hub, `<Hub URL>/apps/<App ID>`, where the Hub URL includes its mount path, and a publishing key is saved for it with `hub auth login`. `hub deploy` reads `buildTarget` from `GET /api/hub/apps/:appId`, builds for it, uploads and deploys:

```bash
pnpm nocobase hub remote add origin https://hub.example/main/apps/crm
pnpm nocobase hub auth login
pnpm nocobase hub deploy --json
pnpm nocobase hub deploy --release-id <releaseId> --idempotency-key <ci-run-id> --json
```

An upload streams the archive into a private temporary file, compute SHA-256, validate the artifact, and stream it to artifact storage. The compressed limit is 256 MiB. `Content-Type` must be `application/gzip` or `application/octet-stream`; `X-Artifact-SHA256` can assert the digest. Temporary files are removed on success, validation failure, disconnect, or oversize input. Failed persistence removes the candidate artifact. Abrupt process termination can leave staging files or an artifact; crash reconciliation remains outside this release.

Release identity is scoped to an App and checksum. Version is a display label; different artifacts may have the same version. `Idempotency-Key` accepts 1–128 letters, digits, dots, underscores, colons and hyphens; reusing a key with a different checksum returns 409. The new canonical checksum table preserves all historical Release and Deployment IDs and selects the earliest existing Release for future retries instead of deleting duplicates.

Uploading only saves a Release; it never deploys. Deploy a stored Release with `POST /api/hub/apps/:appId/deploy` and `{ releaseId, config? }`, which is the only way a deployment starts. There is no automatic/manual deployment setting or default mode: users choose commands and automate them in their own scripts. An upload returns 201 with the Release fields, `releaseId`, and `reused`, which is true when the checksum or `Idempotency-Key` matched a Release stored by an earlier request.

Uploads are checked against the Host before anything is stored. `pnpm build` records the platform its native binaries target as `nocobase.buildTarget` in `dist/package.json`; when the archive carries one, its `platform`, `arch`, and `nodeMajor` must equal the Host's, and on Linux so must its C library, where an archive without `libc` counts as glibc. A mismatch returns `400 / BUILD_TARGET_MISMATCH` (`FAILED_PRECONDITION`) naming both targets. An archive without a build target is accepted, as is any archive while the Host status cannot be read. `GET /api/hub/apps/:appId` reports the Host's target as `buildTarget` (`{ platform, arch, libc, nodeAbi, nodeMajor }`, `libc` null outside Linux), or null while the Host is unavailable, so a client can build for it.

Publishing credentials continue to expose only `upload-release` and `deploy`, under the existing `hub.app` resource and current owner authorization. The reads accept a key holding either scope for the App, provided its creator still holds the action of at least one of the scopes the key was granted. The Release list is paged by number, newest first: `GET /api/hub/apps/:appId/releases?page=1&pageSize=20` returns `{ data: [...], meta: { page, pageSize, total } }`, with page size defaulting to 20 and limited to 100. Each Release, listed or single, reports the `buildTarget` its archive records, whether it is the Release of the App's current deployment (`running`) and whether a deployment of it ever succeeded (`everDeployed`). Deployment list items carry `finishedAt` and the Release version. `GET /api/hub/apps/:appId/deployments/:deploymentId/status` returns only IDs, status, and phase; no read grants a key deployment configuration, deployment details, logs, or other App APIs.

Standalone deployments use a separate persistent retry table. The same `Idempotency-Key` and release/configuration request returns the original deployment; a changed request returns 409. The CLI's retry identities, waiting, exit codes and `--json` output are described in the `@nocobase/hub-cli` README.

This remains the single-Hub deployment model. Restart recovery retains the existing behavior: queued or active deployments interrupted by restart are marked failed, not silently retried. Acceptance (202) does not promise eventual success; poll the deployment status or inspect the deployment in Hub.

A deployment may carry a runtime YAML configuration (non-empty UTF-8, at most 1 MiB) in `config`. Omitting it reuses the current Hub configuration; on first deployment, the existing Release-template initialization still applies. Supplied configuration replaces the configuration document through the existing Hub secret handling and YAML validation; it is not merged with arbitrary existing fields and never changes the Release template or archive.

### Resumable Release uploads

Archives up to 2 GiB (`MAX_RESUMABLE_ARTIFACT_SIZE`) can be uploaded in chunks and resumed after a failure; the single `POST /releases` stays limited to 256 MiB. Every route below is relative to `/api/hub/apps/:appId/releases/uploads` and needs `upload-release`, as the signed-in user's `hub.app` action or as a publishing key's scope:

| Route                      | Request                                                                                                  | Answer                                                                                                                                                                                                                                |
| -------------------------- | -------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `POST /`                   | JSON `{ size, sha256 }`: size 1 byte to 2 GiB, lowercase SHA-256 hex                                     | Always the upload resource: `201` with a new session at offset 0; `200` resuming an unfinished session for the same checksum and size; `200` without `uploadId` when the App already has a Release with that checksum, nothing staged |
| `PATCH /:uploadId`         | Raw bytes as `application/octet-stream`, `Upload-Offset: <offset>`, `Content-Length` at most `chunkSize` | `200 { data: { uploadId, offset, size, expiresAt } }` once the chunk is on disk                                                                                                                                                       |
| `GET /:uploadId`           |                                                                                                          | `200` with the same body as `PATCH`                                                                                                                                                                                                   |
| `POST /:uploadId/complete` | Optional `Idempotency-Key`, as for `POST /releases`                                                      | `200` with the body `POST /releases` answers; a repeated completion answers with the same Release                                                                                                                                     |

`POST /` answers one resource type, the upload: `{ uploadId, offset, size, chunkSize, expiresAt }` for a session. When the App already has the archive no session is created, so the answer has no `uploadId` or `expiresAt`, `offset` equals `size`, and `releaseId`, `version` and `reused: true` name the existing Release, the way a completed upload reports the Release it became; a client that sees no `uploadId` has nothing to send. `chunkSize` is 8 MiB (`RELEASE_UPLOAD_CHUNK_SIZE`); a client may send smaller chunks. `offset` always counts the bytes durably stored: a chunk that does not arrive whole is discarded, so the client resends it from `offset`. A chunk at another offset answers `409 / UPLOAD_OFFSET_MISMATCH` (`ABORTED`) with the current offset in the error's `metadata.offset`; a chunk reaching past `size` answers `400 / UPLOAD_TOO_LARGE`; a missing or zero `Content-Length` or a missing `Upload-Offset` answers `400 / INVALID_INPUT` naming the header, a body other than `application/octet-stream` `415 / INVALID_CONTENT_TYPE`, and a chunk above `chunkSize` `413 / CHUNK_TOO_LARGE`. Completing before every byte arrived answers `400 / UPLOAD_INCOMPLETE` (`FAILED_PRECONDITION`) with `metadata.offset`. Completion checks the declared SHA-256 (`400 / CHECKSUM_MISMATCH`) and then creates the Release through the same validation and storage as `POST /releases`; a checksum mismatch or a refused archive (`INVALID_ARTIFACT`, `INVALID_ARTIFACT_VERSION`, `UNSAFE_ARTIFACT`, `INVALID_CONFIG_FILE`, `UNSUPPORTED_CONFIG_FILE`, `BASE_PATH_MISMATCH`, `BUILD_TARGET_MISMATCH`) discards the session, while any other failure keeps it so completion can be retried.

A session expires 24 hours after its last accepted chunk (`expiresAt`), and an unknown or expired session, or one that belongs to another App, answers `404 / UPLOAD_NOT_FOUND`. Sessions are staged on the Hub's local disk under `uploadsDir`, by default `uploads` next to `host.configPath` (the Hub template sets `storage/hub/uploads`), one `<uploadId>` directory each with `meta.json` and `data`. The staged bytes are removed when the upload completes; a small record stays until expiry so a repeated completion finds its Release. Expired sessions are removed when a new session is started or a chunk or completion is sent to an expired one, and an App's sessions when the App is removed; `GET /:uploadId` answers an expired session with `404` without removing it. Because every chunk goes through one Hub process's disk, route a session to one Hub process.

A reverse proxy in front of the Hub only needs to accept request bodies of `chunkSize` (8 MiB, plus headroom) for these routes, which is what makes them usable behind proxies with small body limits. The single upload that the web console uses still needs about 256 MiB on `POST /api/hub/apps/:appId/releases`.

### Application names, IDs, and error notifications

Application names may be repeated across users and edited in Settings by an authorized owner or Hub Administrator. Renaming preserves the App ID, URL, releases, configuration, and runtime. The creation form generates an editable ID with an eight-character random hexadecimal suffix; IDs remain globally unique because they identify shared URLs, deployment records, and storage paths. Manual ID conflicts return `APP_EXISTS` without disclosing another application's owner. Hub operation failures use the shared top-right notification host, including failures while a dialog is open; they preserve form input and keep technical details collapsed.

### Delete a Hub user

Only Platform Administrators can delete users, after confirmation. Deleting the current user or the last enabled Platform Administrator is prohibited. Any App owned by the target blocks deletion until it is transferred or removed; deletion never removes Apps. Session/account cleanup and removal of the user's default and Hub publishing API Keys occur in one transaction. An inactive user identity, deletion time and actor remain for historical attribution. Application creation and publishing key creation lock and recheck the owner so a deleted user cannot acquire new resources. Existing users are not deleted by the upgrade migrations.

## Deployment and runtime logs

Each new deployment has an independent JSON Lines `.log` file under `storage/hub/deployment-logs/<appId>/<deploymentId>.log`. Hub records queuing and completion; Host sends ordered phase events and sanitized errors over its management IPC connection before returning the result. Open **View logs** on a deployment, or load `deployments/<deploymentId>/logs` directly. Existing deployment summaries cannot reconstruct historical process logs.

The **Logs** tab reads retained application logs from `storage/apps/volumes/<appId>/storage/logs/`. It remains available while the App or Host is stopped. `read-log` is a separate app-scoped permission granted by migration to Hub administrators and operators. Deployment logs use `read-deployment`. Both endpoints disable HTTP caching and accept incremental cursors, level, source, text, and ISO time filters. The reader scans at most 256 KiB per request and the viewer retains at most 2,000 entries. History merges source files in timestamp order across pages. Cursors are short process-local checkpoints scoped to the query, with a five-minute lifetime and bounded memory; route a scan to one Hub process. The viewer restarts its window when a checkpoint expires or history changes. Downloads are limited to 50 MiB and stop with a retry message if the scan resets; narrow the time range for larger exports.

Configure deployment retention with `hub.logging.deployments.enabled`, `retentionDays` (30), `maxFileSizeMB` (50 per deployment), and `maxTotalSizeMB` (1024 per App). Runtime capture uses `hub.logging.apps.level`, `file.enabled`, `file.name` (`app`), `file.retentionDays` (7), `file.maxFileSizeMB` (10), `file.maxTotalSizeMB` (500 per App), and `console.enabled` / `console.pretty`. Expired files are pruned as they are written and rotated, and deployment logs when a deployment finishes; reading logs never prunes them. The UI reports unavailable retained files instead of presenting them as an empty successful execution. A deployment that hits its size cap records a truncation marker; final status remains in the database.

Runtime sources share `app.<UTC-date>.<part>.log` by default, including Host lifecycle diagnostics captured before application logging initializes. `logging.loggers.<source>.file.name` explicitly separates a source. The source field, App/deployment/runtime identities, and workflow execution/node identities support filtering without producing a file per source. See [logging configuration](../../libs/logging/README.md) for routing, compatibility, and retention details.

Runtime files and terminal output are independent. Top-level `logging.file` and `logging.console` configure Hub itself; `hub.host.logging` is forwarded to Host. `logging.console.pretty` affects only terminal rendering. An explicit legacy `transport` continues to own its outputs. Hosted applications need a runtime/template release that supports `scope.logging` to honor the Hub collection policy; older artifacts retain their own logger behavior, while Host still records lifecycle failures. Arbitrary third-party stdout cannot be attributed safely to an App sharing the Host process.

### Explicit storage roots

`desiredConfigsDir` stores `<appId>/<deploymentId>.yml`; `logging.deployments.directory` stores `<appId>/<deploymentId>.log`. The Hub template configures these directories separately from `host.configPath`. `host.appRevisionsDir` stores expanded releases at `<appId>/<sha256>`, while application volumes remain separate.
