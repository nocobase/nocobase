# @nocobase/app-host

Standalone runtime host for NocoBase apps.

From the repository root:

```bash
pnpm --filter @nocobase/app-host build
APP_REVISIONS_DIR="$PWD/packages/app/app-host/fixtures/app-dist" pnpm --filter @nocobase/app-host start
```

The workspace start scripts use `tsx` because internal package exports resolve
to TypeScript source during monorepo development. Published package exports
resolve to compiled JavaScript instead.

When embedding `AppHostSupervisor`, use `driver: 'auto'` to follow the loaded package: a supervisor loaded from TypeScript launches the source CLI with `tsx`, while a supervisor loaded from compiled JavaScript launches the compiled CLI with Node. This selection is independent of `NODE_ENV`, so an installed package can run in development without shipping its sources. An omitted driver still defaults to `node`; explicit `node` and `tsx` selections keep their existing behavior.

By default the host listens on `127.0.0.1:3000` and discovers deployed apps
from `./storage/apps/revisions` in the current working directory.

The CLI loads the `host` namespace once at startup. It accepts `.yml`, `.yaml`,
and `.json` files. Set `APP_HOST_CONFIG_PATH` to an explicit file or extensionless
path; otherwise the host discovers `config.yml`, `config.yaml`, or `config.json`
in that order. Environment variables override file values.

```yaml
host:
  mode: standalone
  server:
    host: 127.0.0.1
    port: 3000
  artifact:
    driver: fs
    location: ./storage/apps/artifacts
    visibility: private
  logging:
    level: info
  appRevisionsDir: ./storage/apps/revisions
  appVolumesDir: ./storage/apps/volumes
```

The Host owns its logging lifecycle. Both development and production write JSON Lines to `storage/host/logs/host.<UTC-date>.<part>.log` and independently emit terminal output. `host.logging.console.pretty` defaults to true in development and false in production. Configure `host.logging.file` with `enabled`, `name`, `retentionDays`, `maxFileSizeMB`, and `maxTotalSizeMB`; `APP_HOST_LOG_LEVEL` overrides the level. The Host selects source `host` explicitly, so no `default` option is needed. See [logging configuration](../../libs/logging/README.md).

Hosted App runtime logs, including lifecycle and initialization failures, belong to `storage/apps/volumes/<appId>/storage/logs/app.<UTC-date>.<part>.log`. App sources share that file unless `logging.loggers.<source>.file.name` selects a separate file. The Host passes capture policy and App/deployment/runtime identities to compatible application runtimes. Hub deployment journals remain separate, with one file per deployment operation.

The directories have separate lifecycles:

```text
storage/
  apps/artifacts/           immutable release archives
  apps/revisions/<appId>/   standalone package or managed revision cache
  apps/volumes/<appId>/      persistent configuration and storage/
```

## Host modes

The host defaults to `standalone` mode. It discovers local app definitions and
activates an app lazily when its first request arrives.

```bash
APP_HOST_MODE=standalone app-host
```

`managed` mode is intended for a Hub-controlled host. It does not register apps
from the local directory, and its application HTTP server does not expose the
app management endpoints. Only minimal liveness and readiness probes remain on
that server; management uses a private transport.
The Hub supplies complete host deployment sets over an authenticated
Node IPC channel. Each artifact reference identifies one immutable `.tar.gz`
object by Drive key, version, app ID, and SHA-256 checksum. The host reads that
object through its configured `@nocobase/drive` FS or S3 disk, verifies it,
expands it to the immutable
`apps/revisions/<appId>/<sha256>` directory, prepares writable
storage at `app-volumes/<appId>/storage`, and reports reconciled state back to
the Hub. Each Runtime keeps the exact revision root it was started from, so an
old Runtime cannot observe the new Runtime's code or static assets while it is
draining. An installed-artifact marker lets later reconciliation of the same
Release checksum reuse the expanded directory without downloading, hashing, or
extracting the archive again. After a successful replacement, the Host retains
the three most recently used expanded revisions for fast rollback and prunes
older local revisions in the background. Deployment history and Release
artifacts have independent retention policies. Host logs report checksum,
extraction, discovery, activation, previous-runtime destruction, and cache
pruning durations so slow deployments can be attributed to a concrete phase.
For file configuration, the deployment set may select an absolute path or the default
`app-volumes/<appId>/config` path. Non-file configuration providers are handled
by the app and do not involve the host. Runtime replacement is stop-first with
bounded graceful request draining. If activation fails, the Host attempts to
recreate the previous Runtime from its unchanged definition and immutable
revision; this is not a guarantee of zero downtime for long-lived connections
or incompatible database migrations.

```bash
APP_HOST_MODE=managed app-host
```

The mode is fixed for the lifetime of the host process. A managed host never
falls back to standalone discovery when its Hub connection is unavailable.
The spawning supervisor automatically restarts an unexpectedly exited managed
host with bounded exponential backoff and replays its latest accepted deployment set.
The current runtime capability is `in-process`; Worker and Process backends can
be registered through the backend router contract but are not advertised until
their isolation runners are implemented.

The application Drive uses the App `storage` directory as its default private
filesystem disk. There is no default public filesystem disk or public storage
route; revisions remain immutable and contain no runtime-created storage links.

The package fixture shows the supported single-level deployment layout:

```text
packages/app/app-host/fixtures/app-dist/
  demo/
    package.json
    dist/client/index.html
    dist/client/assets/...
    dist/server/embedded.js

  service/
    package.json
    dist/server/embedded.js

  koa/
    package.json
    dist/server/embedded.js
    dist/server/koa-fetch-adapter.js

  lifecycle/
    package.json
    dist/client/index.html
    dist/client/assets/...
    dist/server/embedded.js

  ws-demo/
    package.json
    dist/client/index.html
    dist/client/assets/...
    dist/server/embedded.js
```

The public URL is also a single level:

```text
http://127.0.0.1:3000/demo/
http://127.0.0.1:3000/demo/assets/demo.js
http://127.0.0.1:3000/demo/api/info
http://127.0.0.1:3000/service/healthz
http://127.0.0.1:3000/koa/api/info
http://127.0.0.1:3000/koa/redirect
http://127.0.0.1:3000/koa/stream
http://127.0.0.1:3000/lifecycle/
http://127.0.0.1:3000/lifecycle/api/lifecycle
http://127.0.0.1:3000/ws-demo/
http://127.0.0.1:3000/ws-demo/api/info
ws://<host>/ws-demo/ws
```

`dist/server/embedded.js` is the standard app runtime entrypoint and is required
for discovery. `dist/client/assets/**` is the optional static asset directory
that can be served by Nginx, CDN, object storage, or the host fallback.

Route ownership is intentionally narrow:

```text
/<app>/assets/*  -> dist/client/assets/*
/<app>/*         -> dist/server/embedded.js
```

The server receives the path after the `/<app>` mount point, so
`/demo/api/info` is dispatched as `/api/info` and `/demo/dashboard` is dispatched
as `/dashboard`.

`dist/client/index.html` is not a host fallback artifact. If an app wants to
serve a SPA shell, its `dist/server/embedded.js` should read and return that
HTML. This keeps HTML, API, SSR, redirects, auth callbacks, and ordinary server
routes under the app's own runtime.

Server artifacts should export `createServer(scope)`. The host still accepts
`createApp(scope)`, `default(scope)`, `createApp()`, and the old
`createApi(scope)` export during the v3 transition.

The returned app object must implement `AppInstance` from
`@nocobase/app-server/runtime`: `fetch`, `config`, and optional `websocket`.
NocoBase `Application` implements this contract directly.
App-created resources should be released through
`scope.registerDisposer(name, dispose)`.

The host and App Server share this contract and its `ws`-backed Node adapter
through `@nocobase/app-websocket`. The Host imports App Server types only;
it does not load its runtime module. `management.reloadAppConfig(appId)`
calls the active instance's `config.reload()` under the per-App lifecycle
lock without replacing the runtime. It returns `null` for an inactive App
and does not activate it. Configuration reload errors propagate to the caller.

Managed host startup uses `restoreDeploymentSet` to register installed local
revisions and activate eager Apps asynchronously. Restoration does not download
or extract artifacts, scan revision contents, create Hub deployment records, or prune revisions.
It reads the installed metadata and entrypoint declarations, using the artifact
checksum as the immutable revision fingerprint. Missing
installed revisions require an explicit deployment. Lazy Apps remain inactive.

The `lifecycle` fixture is a complete lifecycle example. It registers a
`scope.onBeforeDestroy(...)` hook, registers a `scope.registerDisposer(...)`
cleanup function, and implements the actual `dispose()` logic.

The `ws-demo` fixture exposes a WebSocket clock stream. Its client derives the
public URL from the current page origin, so `ws://<host>/ws-demo/ws` maps to
`/ws` inside the embedded app.

The `koa` fixture adapts a real `koa.callback()` to the host's Fetch contract
through an ephemeral loopback HTTP server. It demonstrates Koa middleware,
request bodies, redirects, cookies, streaming responses, and lifecycle cleanup.
See `fixtures/app-dist/README.md` for the adapter's HTTP-only boundary.

### Managed revision directory

Set `appRevisionsDir` (configuration `host.appRevisionsDir`, environment `APP_REVISIONS_DIR`) to store expanded archives at `<root>/<appId>/<sha256>`. Restore requires installed revision metadata; a missing revision requires deployment again. Application volumes remain separate.

Supervisor callers may set `childOutputDir` to capture stdout/stderr as bounded JSON Lines with retention, independently of terminal forwarding. Host logging uses `logging.file.directory`; neither directory is inferred from the generated Host configuration path.

Successful artifact deployment records the selected checksum in `<appId>/.active-revision` atomically. Standalone rescans and restarts use that revision; a failed candidate leaves the selection unchanged. Managed recovery continues to use the desired deployment set. Manually supplied standalone applications may still place their package directly under `<appId>/`.

## On-demand Apps: idle stop and dormancy

Every registered App has a lifecycle state the managed status reports per deployment (`lifecycle`): `running` (a runtime serves it), `starting` (one is being activated), `stopped` (no runtime; its expanded release is on disk) and `dormant` (no runtime and no expanded release). Two per-App policies move an App along it, both counted from its last request (or its last activation, or its registration):

- `idleStopMs` (a deployment spec field, stored as the definition's `resourcePolicy.idleTtlMs`) stops the runtime after that long without a request and frees its memory; files, configuration and data stay. `0` never stops it; omitted, the Host-wide `idleTtlMs` applies (5 minutes unless configured).
- `dormantAfterMs` (`resourcePolicy.dormantAfterMs`) makes the App dormant after that long without a request: its runtime is stopped and every expanded revision under `apps/revisions/<appId>/` is removed, while the definition, the deployment status, the configuration and the data volume stay. Only a managed Host honours it, because it needs the artifact reference to prepare the App again. `0` or omitted never makes it dormant.

`activation: 'lazy'` keeps an App stopped when it is deployed or restored; `eager` starts it. Either way a request to a stopped App starts it, and a request to a dormant App first expands its release again from the artifact store (the same content-addressed path, so the definition is unchanged) and then starts it. A static asset request to a dormant App prepares its files without starting it. While an App starts, a browser page request (GET or HEAD, `Accept: text/html`, `Sec-Fetch-Mode: navigate` when sent) waits `activationHoldMs` (1.5 s by default) and is then answered with a small 503 page that says the App is starting (or being prepared again) in English or Chinese and refreshes itself every two seconds; other requests wait `activationWaitMs` (60 s by default) and then get a 503 JSON body with `code: 'APP_STARTING'` and `Retry-After`. WebSocket upgrades wait the same and are refused with 503 when the App is not ready in time. A failed activation answers requests with an error page (or `APP_START_FAILED`) for ten seconds before the next request tries again.

The eviction loop (`evictionIntervalMs`, 60 s by default) stops idle Apps and then makes due Apps dormant. Removing an App's data happens only through an explicit `removeDeployment`. A managed Host records each App's last access, and whether it is dormant together with the definition to register it under, in `apps/revisions/<appId>/.lifecycle.json`: on idle stop, dormancy, preparation and shutdown. A restarted Host restores a dormant App as dormant rather than failing on its missing revision, and keeps counting idle and dormancy time from the recorded access. Changing only `idleStopMs` or `dormantAfterMs` of a running App updates its definition without restarting it.

In-process Apps cannot unload the modules they imported, so memory a stopped runtime leaves behind is not fully reclaimed by stopping it. The status `counters` (`activations`, `idleStops`, `dormancies`, `materializations` since the Host process started) let a supervisor recycle the Host, as the releases plugin's `restartAfterChurn` does.

```yaml
host:
  evictionIntervalMs: 60000
  activationHoldMs: 1500
  activationWaitMs: 60000
```

## Scopes, operations and backends

The managed management service (`HostManagementService`, over IPC from `AppHostSupervisor.getManagementClient()`) is what a control plane, such as release management, uses to run Apps on a Host. Its v1 calls keep their meaning; these additions are optional, so a caller that never sends them, such as the Hub, sees the Host it always did:

| Addition                                                                                                             | What it does                                                                                                                                                                                                                                                                            |
| -------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `scope` on `HostDeploymentSet` and `HostDeploymentSpec` (`HostScope`: `id`, `backend?`, `backendConfig?`, `secret?`) | The set or deployment belongs to one scope, usually a control-plane environment, with its own revision: restoring one scope's set never touches another's Apps, and an App belongs to one scope (`APP_OWNED_BY_OTHER_SCOPE`). Without a scope, a set is the Host-wide v1 set, as before |
| `operationId` on a deployment spec, `getOperation(id, { scope })`                                                    | A deployment runs at most once per operation ID, and its outcome (`running`, `succeeded`, `failed`, `interrupted`) stays readable after either side restarted                                                                                                                           |
| `getStatus({ scope, appIds })`                                                                                       | One scope's or some Apps' part of the status, with `scope: { id, revision }` once the Host holds a set for it; deployments report `scopeId`, `operationId` and `version`                                                                                                                |
| `describeHost()`, `checkScope(scope)`                                                                                | The Host's identity (new per process) and its backends with their capabilities and settings schemas; whether a scope's backend settings and credentials work, before they are saved (`details.invalidSettings` when the settings themselves are wrong)                                  |
| `readAppLogs(appId, query)`, `removeDeployment(appId, { purgeData })`                                                | An App's runtime log; removal that keeps the App's data when asked                                                                                                                                                                                                                      |
| `backend: 'external-service'`, `images`, `hostname` on a deployment spec                                             | The App runs on the scope's external-service backend (below) from its release image, pulled by digest; `hostname` routes a host name to the App (subdomain addresses)                                                                                                                   |

A managed Host keeps its operation log in `host.controlDir` (`APP_HOST_CONTROL_DIR`; `control/` next to the revisions directory by default): one JSON file per operation under `operations/<scopeId>/`, finished results kept 30 days, at most 500 per scope. On start it waits up to 45 seconds for a previous Host that still holds the log, then records what that Host left running as interrupted. When it is told to stop, or its supervisor goes away, it closes its listener at once, lets deployments under way finish and record their outcome (up to 25 seconds, refusing new ones with `HOST_DRAINING`), and then stops its Apps.

### External-service backends

An activation backend of kind `external-service` (`ServiceBackend`, exported by `@nocobase/app-host`) runs each App as a service of its own, such as a container, instead of loading it into the Host process. The registry activates, stops and retires its runtimes like any other backend's, so on-demand start, the idle stop and dormancy work the same, and the Host listener forwards the App's HTTP and WebSocket traffic to the service (`ActiveAppHandle.forward`, `forwardUpgrade`). A backend may replace a running App start-first (`replacement: 'start-first'`): the new runtime starts while the old one serves, and requests switch once it is ready. When the Host stops, such services keep running (`detach`) and the next Host adopts them (`inspect`).

Settings and credentials belong to a scope: the Host binds each scope it is told about to its backend (`bindScope`), and an App's definition names only its scope, so credentials never enter a definition. Pass backends to `createAppHost({ backends })` or `runAppHostCli({ backends })`, a function of the Host's logger and its `host.backends.<name>` settings. A backend that holds platform credentials, such as a Docker socket, must not share a process with untrusted App code: a Host refuses to offer one beside the in-process backend unless `trustedApps` (`host.trustedApps`) says every in-process App is trusted, which a Host that runs code under preview must never set. Run such a backend in a Host of its own, as `@nocobase/app-host-docker` does.
