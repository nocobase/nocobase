# @nocobase/app-host

## 0.1.0-beta.11

### Patch Changes

- e77641b: Point plugin guidance at `@nocobase/jobs` for background work, and at the rebuilt `@nocobase/queue` only for what jobs cannot do

  The Scheduler Skill now hands a target's lengthy work to a `JobExecutor` owned by the target's Provider, with the occurrence's own execution record as the reference, so a repeated start of the same occurrence returns the same reference; the job decides and reports its terminal outcome itself, because it cannot tell which executor attempt is the last. Recurring work without administrator visibility goes to a `ScheduleExecutor`, and only a one-time delay goes to a queue. Its description of Scheduler's own backend now names the jobs service and `scheduler.jobs` instead of the removed `queue.queues.schedule` connection. The Notification Skill's diagnostics check the jobs configuration Deliveries run on instead of a queue manager.

  The plugins' `AGENTS.md` list `@nocobase/queue` as a host-owned contract rather than a job registry. The jobs README states that background work goes there by default, the i18n Skill speaks of background jobs rather than queue jobs, and the departments example no longer composes the removed `QueueProvider` in its tests.

- Updated dependencies [9291dbb]
- Updated dependencies [e77641b]
  - @nocobase/app-server@1.0.0-beta.32

## 0.1.0-beta.10

### Patch Changes

- b00290d: Declare `tsx` and `typescript` as peer dependencies of `@nocobase/app-tools`, and stop loading the TypeScript compiler on every `pnpm dev`.

  `dev` spawns three executables it never imports — `vite`, `tsx`, and `nocobase` — and only two of them were declared. `tsx` sat in `devDependencies`, which are not installed for a consumer, so an application that installed `@nocobase/app-tools` from a registry carried no statement that it needed one. Nothing caught it: every template declares `tsx` for its own use, so the binary resolves in this repository and in any application generated from a template, and is absent only in an application that never installed it. Neither `pnpm deps:check` nor `pnpm peers:check` could have caught it either, because both read import specifiers and a spawned binary has none. Both checks now cover `packages/tools`, the package README carries a table of the executables these scripts spawn, and AGENTS.md records that a spawned tool is a dependency too.

  `typescript` moves from `dependencies` to `peerDependencies` for a different reason. It is imported directly, to parse `server/plugins.ts` without running it, while the build compiles through the application's own `pnpm exec tsc`. That is two copies, and a version split between them fails silently: the application compiles syntax the older parser then cannot read, `resolvePluginWatchIncludes` returns nothing, and editing a workspace plugin quietly stops restarting the server. **An application that does not already declare `typescript` must add it** — every template does, so an application generated from one needs no change.

  That parse is now gated as well. It can only ever name a workspace neighbour, so a `server/plugins.ts` naming none of them is answered without importing the compiler at all. Every `pnpm dev` in a generated application was loading 24 MB of TypeScript to be told there was nothing to watch. `resolvePluginWatchIncludes` is asynchronous as a result.

  `cross-spawn` and `tar` move to the workspace catalog, which also settles `tar` on a single range: `@nocobase/app-host` and `@nocobase/app-plugin-hub` were one minor version behind the four other declarations. The three templates drop their own `cross-spawn` and `tar` entries, which nothing in them has imported since these scripts moved into `@nocobase/app-tools`.

- Updated dependencies [8f1ead4]
- Updated dependencies [77d34b6]
- Updated dependencies [a1a8690]
  - @nocobase/app-server@1.0.0-beta.24

## 0.1.0-beta.9

### Patch Changes

- 3187ace: Wait for a contended migration or seed lock instead of failing on the first conflict, report who holds it, and stop abandoning it held when a restart interrupts startup.

  Acquiring the lock now retries with backoff until `lockAcquireTimeoutMs` — a new Migrator and Seeder option defaulting to 30 seconds — so the brief overlap between two starts resolves itself rather than surfacing as an error. A conflicting insert is treated as contention on its own: the previous implementation re-read the lock row to decide what to report, and a holder that released in between left the driver's `UNIQUE constraint failed` text as the whole explanation. When the wait does expire, the message names the holder recorded in `locked_by`, the time in `locked_at`, how long it waited, and that the row has to be deleted if the process holding it was killed. An insert that keeps failing while the lock table holds no row is still reported as the driver error it is, rather than being retried until the timeout.

  Startup watches `SIGINT` and `SIGTERM` from before the application boots until the HTTP server registers its own handlers. Migrations and seeds run in that window, and Node's default disposition terminated the process outright, so a `tsx watch` restart triggered by a dependency install left the lock held by a process that no longer existed and the next start had to wait it out. The signal is now recorded, startup finishes and releases the lock the ordinary way, and the application shuts down instead of listening. A second signal still forces the exit. `watchStartupShutdownSignals` is exported for hosts that run their own startup sequence, and the app-host CLI uses it: its handlers were registered before the host existed, so a signal during startup exited the process immediately and abandoned the same locks.

  Migrations and seeds share one lock implementation, so contention behaves and reports identically for both.

- Updated dependencies [fa01814]
- Updated dependencies [ca3188e]
- Updated dependencies [fa01814]
- Updated dependencies [7bde7bd]
- Updated dependencies [5380642]
- Updated dependencies [3187ace]
  - @nocobase/app-server@1.0.0-beta.23

## 0.1.0-beta.8

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

- e13ed84: Make development logs concise and application-scoped while retaining structured file diagnostics. Route configuration and authentication diagnostics through application logging, reduce routine startup and request noise, distinguish optional AI Skill directories from missing configured paths, and align development console settings across templates. Document that deployed applications need rebuilding to adopt the current logging protocol.
- 00362cf: Restore colored log levels in the development terminal. Replacing the pino-pretty transport with `console.pretty` dropped the ANSI escapes, so INFO, WARN and ERROR lost the colors developers had in v2. Pretty output colors the level label again, using the previous palette, and only when it helps: `console.color` decides when set, otherwise a terminal check applies, `NO_COLOR` disables the escapes, `FORCE_COLOR` requests them, and piped or captured output stays plain. Structured console output, journals and log files still never contain escapes. Applications pass an explicit `logging.console.color` (or `hub.logging.apps.console.color`) through to the logging library. A managed App Host child inherits a pipe and cannot see the terminal its output is relayed to, so the supervisor requests `FORCE_COLOR` for it when the environment states no preference, and captured child output drops terminal escape sequences so the Hub log viewer keeps showing readable text.
- Updated dependencies [e13ed84]
- Updated dependencies [e13ed84]
- Updated dependencies [e13ed84]
- Updated dependencies [00362cf]
- Updated dependencies [e13ed84]
- Updated dependencies [e13ed84]
  - @nocobase/app-server@1.0.0-beta.19
  - @nocobase/logging@0.1.0-beta.5

## 0.1.0-beta.7

### Patch Changes

- d927494: Fix development startup of generated Hub applications by selecting the App Host launcher from the loaded package format, preserving source development in the workspace and using compiled JavaScript in installed packages. Keep the optional application configuration commented out so an empty YAML section cannot override application identity defaults during production startup. Correct the AI Employee plugin Skill namespace so generated applications can synchronize their registered plugins' Skills.

## 0.1.0-beta.6

### Patch Changes

- 1decf5f: Report which deployment phase failed, and why, instead of a bare summary

  A failed deployment told an operator what went wrong without saying where. Reporting went through `rootErrorMessage`, which walks an error's `cause` chain to the innermost failure and discards every wrapper along the way, so `Cannot find package 'hono'` was the whole of it — with nothing to say whether the package was missing while the artifact was being installed or when the application started, which are different faults with different fixes.

  Artifact installation now records each phase as it completes, and a failure reports the phase it died in together with the phases that had already succeeded: `Deployment failed during discovery after artifact download 1.2s, extract 3.4s: ...`. `AppCreateFailedError` and `AppReloadFailedError` fold their cause into their own message, so the reason survives the Host IPC boundary, which serialises an error to its message alone. An `AggregateError` is unfolded rather than summarised, so a failed replacement reports both the activation failure and the failed restore.

  Deployment status reporting uses those messages instead of digging out the innermost cause. `rootErrorMessage` remains for matching an underlying failure, alongside a new `fullErrorMessage` for anything an operator reads.

  Only phase names, durations, and error messages are included. Subprocess output is deliberately left out, because a dependency install prints registry URLs and authentication traces, and this string is stored and shown wherever a deployment is.

## 0.1.0-beta.5

### Patch Changes

- e11b855: Fail with a clear error when managed app-host port discovery reaches the TCP port limit.
- e11b855: Republish managed application configuration before activating a stopped deployment.
- e11b855: Read the application manifest from `dist/package.json` when loading `pnpm build --tar` artifacts.
- Updated dependencies [f17f3a6]
- Updated dependencies [ceb356b]
  - @nocobase/config@0.1.0-beta.1
  - @nocobase/logging@0.1.0-beta.4

## 0.1.0-beta.4

### Minor Changes

- a864497: Add standalone and Hub-managed host modes, startup-only YAML or JSON host configuration, FS and S3 release deployment through NocoBase Drive, strict desired deployment reconciliation, file configuration path selection, host-owned structured logging, shared ws-backed App WebSocket handling, private authenticated child-process management over Node IPC, and bounded managed-host crash recovery. Managed deployments use checksum-addressed immutable revision directories, stop-first Runtime replacement with bounded graceful request draining, and a three-revision local cache for fast rollback. Rename the Host's in-process runtime implementation to `InProcessAppHandle`.

### Patch Changes

- a864497: Wait for prior revision cache cleanup before resolving or restoring the next deployment. Reject configuration publishing when the application is not registered or has no runtime configuration file instead of reporting success.
- a864497: Register the Application Hub in the Hub template and provide an application control plane. Release artifacts supply their version and an optional `config.example.yml` or `config.example.yaml` template, while applications choose Config file or External configuration and reserve Hub-managed configuration for a future database-backed implementation. Hub actions reconcile only the selected application, reuse an already installed matching artifact, report deployment phase timings, and support removing an application and its persisted resources. Separate Hub desired configuration files from Host-owned runtime configuration, rebuild recovery targets when Host becomes ready, and split the management page into business modules.

## 0.0.1-beta.3

### Patch Changes

- Updated dependencies [174eab5]
- Updated dependencies [174eab5]
  - @nocobase/app-server@1.0.0-beta.4

## 0.0.1-beta.2

### Patch Changes

- 7cdffbd: Add a runnable Koa fixture that adapts Koa's Node HTTP handler to the embedded app Fetch contract, and load workspace TypeScript exports correctly from the app-host development scripts.
- 7cdffbd: Add declarative application Runtime Definitions, shared application Scope, path, and disposal contracts, reusable Node standalone Scope and environment loading utilities, and focused Runtime Config section resolution. Resolve plugins before config factories and pass the complete resolved Runtime into application assembly, making Runtime plugins the single source for both configuration contributions and provider or route registration. Use the shared Runtime assembly across app-host and the default application template so embedded and standalone modes no longer maintain separate structural copies. Remove the template-local Scope and config-loading infrastructure, require standalone entrypoints to pass their resolved application root explicitly, and remove the legacy `/v2/api` proxy contract in favor of each application's local `/api` router.
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
  - @nocobase/app-server-kit@0.1.0-beta.2

## 0.0.1-beta.1

### Patch Changes

- 0465323: Expose application configuration paths to server plugins and add helpers for mounting redirect responses below an application's base path. Application hosts now rewrite root-relative redirects returned by embedded applications so installation and other redirects remain inside the mounted application.
- Updated dependencies [0465323]
  - @nocobase/app-server-kit@0.0.1-beta.1

## 0.0.1-beta.0

### Patch Changes

- da1b1b0: 首次发布。
- Updated dependencies [da1b1b0]
  - @nocobase/app-server-kit@0.0.1-beta.0
