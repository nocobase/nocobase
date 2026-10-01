# @nocobase/app-plugin-queue-example

## 0.1.0-beta.8

### Minor Changes

- e77641b: Rebuild `@nocobase/queue` on BullMQ 6.3.6, with producers, consumers and managers per application

  **Breaking.** `@nocobase/queue` no longer wraps `@boringnode/queue`. `createQueueService(config, { appName, storagePath, logger?, onFallback? })` creates one application's `QueueService`, whose `producer(queue, configKey?)`, `consumer(queue, configKey?)` and `manager(queue, configKey?)` are bound to a named queue:

  - `producer().publish(channel, message, options?)` and `publishMany([{ channel, message }], options?)` write JSON messages with `priority`, `delay`, `attempts`, `backoff` (`fixed` or `exponential`), `removeOnComplete`, `removeOnFail` and a `jobIdProducer`. A batch is prepared entirely before anything is written.
  - `consumer().consume(handler)` registers a handler `(channel, message, signal)` and returns the function that unregisters it once its running calls settle. Every handler of a queue runs for every job; `withChannel(channels, handler)` filters channels.
  - `manager().configure()` changes concurrency, job defaults and the global rate limit at runtime; `drain()` empties waiting jobs; `cancelJob()` and `cancelAllJobs()` cancel jobs this instance runs, without a retry.
  - An `adapter: 'redis'` configuration runs on BullMQ through its public Queue and Worker APIs, each queue under the hash-tagged prefix `nbq:{<digest>}`. `adapter: 'inMemory'` runs in the process and writes unfinished jobs to `storage/queue` when it shuts down; it serves one process. Its optional `queueBackend` names a BullMQ backend factory registered with `registerBackend()`, such as a PostgreSQL one; left out, BullMQ's own Redis backend is used. Redis Cluster is not supported yet.
  - `Job`, `Locator`, `Worker`, `Schedule`, `QueueManager`, `createQueueManager`, `createSyncQueueConfig`, the `sync` and `database` drivers, job discovery, job factories and the OpenTelemetry instrumentation are removed. So is the database driver's migration.

  The `queue` configuration section now has the shape of `jobs`: `default` names a key, and every other key is one complete configuration. Without `queue.default`, queues run on the built-in memory configuration, reported once outside development. A section in the former `connections`/`worker`/`jobs` format is ignored with one warning instead of stopping the application, and its `default` is ignored unless it names a key of the new format.

  `@nocobase/app-server/queue` exports `QueueServiceProvider`, constructed with `{ nodeEnv }`, `queueServiceToken` and `AppQueueConfig`; `QueueProvider`, `queueManagerToken` and `queueJobFactoryRegistryToken` are removed. The provider sets the service up in `start()`, after every provider has booted, and shuts it down last. `planAppRuntimeDatabaseTasks` and `AppRuntimeDatabaseTaskPlanOptions` are removed: planning no longer adds a queue migration source, and `runAppDatabaseTasks` keeps its `runtimeConfig` option. The plugin field `queue: { jobs }` and `createPluginJobLocations()` are deprecated: the field is accepted and ignored, each plugin declaring it is reported once at startup, plugin inspection reports it as the `SERVER_QUEUE_JOBS_DEPRECATED` warning in place of `SERVER_JOB_LOCATION_MISSING`, and `createPluginJobLocations()` returns an empty list.

  The templates compose `QueueServiceProvider`, declare a `memory` and a `redis` key in `server/config/queue.ts`, and drop the `@/jobs` path alias. `create-plugin`'s `server.jobs` capability now generates a `@nocobase/jobs` job and the provider that owns the plugin's `JobExecutor`, instead of a Queue Job; the plugin declares `@nocobase/jobs` as a peer. The Vitest presets no longer inline `@boringnode/queue`. The application development Skill makes `@nocobase/jobs` the default for background work — `JobExecutor` for one-off tasks, `ScheduleExecutor` for recurring ones — and keeps queues for delays, priorities, deduplicating IDs, batches, rate limits and fan-out; the deployment Skill covers the `queue` backend next to the `jobs` one. The queue example plugin now publishes greetings and digest batches and consumes them with two handlers.

  The `queue_jobs` and `queue_schedules` tables of the former database driver, and their migration's history record, are left in place: the migrator only checks packages that still contribute migrations, so startup is unaffected. Drop the tables by hand when nothing reads them. `pnpm nocobase db rollback` refuses to roll back a batch that contains that history record, so it fails while the latest batch is the one that created the tables, as in an application that has applied no migration since.

  Upgrading an application:

  1. In `server/app.ts`, replace `app.addServiceProvider(QueueProvider)` with `app.addServiceProvider(QueueServiceProvider, { nodeEnv: runtime.env.NODE_ENV })`, imported from `@nocobase/app-server/queue`.
  2. Replace `server/config/queue.ts` with configuration keys, such as `memory: { adapter: 'inMemory', persistence: { path: paths.storage('queue') } }` and `redis: { adapter: 'redis', connection: { host, port, db } }`, and set `queue.default` in `config.yml` to the one to run on; an application running more than one instance needs `redis`.
  3. Move each `server/jobs` Job to `@nocobase/jobs`: a `JobExecutor` job registered and set up by the provider that owns it, submitted with `addJob(new Job(payload))`, or a `ScheduleExecutor` rule for recurring work. Use a queue handler registered with `queueServiceToken` in a provider's `boot()`, published with `producer(queue).publish(channel, message)`, only for work that needs a delay, a priority, a deduplicating job ID, a batch, a rate limit or several handlers. Remove `queue: { jobs }` from plugin declarations and `createPluginJobLocations()` from configuration. Jobs still waiting in the former queue storage are not moved.

### Patch Changes

- Updated dependencies [9291dbb]
- Updated dependencies [e77641b]
  - @nocobase/app-server@1.0.0-beta.32
  - @nocobase/queue@0.1.0-beta.8
  - @nocobase/app-plugin-authentication@1.0.0-beta.24
  - @nocobase/service-provider@0.0.2-beta.1

## 0.1.0-beta.7

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
  - @nocobase/queue@0.1.0-beta.7
  - @nocobase/service-provider@0.0.2-beta.1

## 0.1.0-beta.6

### Patch Changes

- a60decd: Require an explicit absolute baseDir for Server plugins and resolve migrations, seeds, jobs, and package metadata from the loaded plugin copy. Generate and validate database task manifests during builds so TypeScript and JavaScript share source checksums, with verified legacy JavaScript history conversion and synchronized plugin scaffolding and application templates.
- Updated dependencies [63db898]
- Updated dependencies [63db898]
- Updated dependencies [63db898]
- Updated dependencies [a60decd]
- Updated dependencies [63db898]
  - @nocobase/app-server@1.0.0-beta.15
  - @nocobase/app-plugin-authentication@0.1.0-beta.14
  - @nocobase/queue@0.1.0-beta.3
  - @nocobase/service-provider@0.0.2-beta.1

## 0.1.0-beta.5

### Patch Changes

- 52d1107: Declare each peer dependency once, dropping the devDependency that used to accompany it.

  The pairing was required on the grounds that a peer range is wide enough for development to drift off this repository's copy. It is not: pnpm installs a peer and links it into the plugin's own `node_modules`, resolving `workspace:^` to the same package `workspace:*` would. A plugin with the devDependency removed still links, typechecks, builds, and tests against it — verified against a clean install with every plugin's `node_modules` deleted first.

  What remained was a second declaration that changed nothing and had to be kept in step with the first. `pnpm peers:check` no longer asks for it, and `create-plugin` no longer emits it.

- Updated dependencies [52d1107]
- Updated dependencies [52d1107]
- Updated dependencies [52d1107]
  - @nocobase/app-plugin-authentication@0.1.0-beta.9

## 0.1.0-beta.4

### Minor Changes

- 1527426: Declare identity-sensitive runtime packages as peer dependencies of every plugin.

  A plugin used to list `@nocobase/app-server`, `@nocobase/db`, `@nocobase/service-provider`, `@nocobase/i18n`, `@nocobase/queue`, `@nocobase/app-portal-sdk`, and the plugins it builds on among its `dependencies`. Each of these carries state that only works while exactly one copy of the module exists in the process: `ServiceContainer` keys its bindings by the token object itself, React contexts match only the provider created from the same module, and `@nocobase/queue` registers job classes into a global `Locator`. A `dependencies` range lets a package manager install a second copy to satisfy it, which splits that state.

  The monorepo could never show the problem, because `workspace:` links every consumer to one directory. It appears once a plugin is installed from a registry into an application, and it appears at runtime rather than at install time: a service that is registered reports `Service "..." is not registered`, or a context reads `undefined` under a mounted provider.

  Each of these packages is now a peer dependency paired with a devDependency. The peer is the published contract that makes the installing application provide the single copy; the devDependency pins this repository's copy for development and tests, which the deliberately wide peer range does not. Applications built from the templates are unaffected — they already install every one of these packages directly, which is what satisfies the new peer ranges.

  `pnpm plugin:create` generates the same shape, and `pnpm peers:check` enforces it in CI.

### Patch Changes

- Updated dependencies [174eab5]
- Updated dependencies [1527426]
- Updated dependencies [174eab5]
  - @nocobase/app-server@1.0.0-beta.4
  - @nocobase/app-plugin-authentication@0.1.0-beta.5
  - @nocobase/queue@0.1.0-beta.3
  - @nocobase/service-provider@0.0.2-beta.1

## 0.1.0-beta.3

### Minor Changes

- ac3f033: Export every server plugin from its package's `./server` entry point, and update application composition, plugin discovery, and generated plugins to use the unified entry point.

### Patch Changes

- 78cf0a2: Generate runtime-aware TypeScript, ESLint, Node engine, and development dependency configuration for Client-only, Server-only, and full-stack plugins, including stable package-scoped Queue Job identities.

  Keep plugins aligned with the Agent development contract by giving Queue, System Information, and Workflow Routes path-scoped authentication, documenting the Queue API path and Database declaration source accurately, and storing example tests under each plugin's root test directory.

- Updated dependencies [948304d]
- Updated dependencies [78cf0a2]
- Updated dependencies [ac3f033]
- Updated dependencies [fb1a752]
- Updated dependencies [ac3f033]
- Updated dependencies [78cf0a2]
- Updated dependencies [fb1a752]
- Updated dependencies [fb1a752]
  - @nocobase/app-server-kit@0.1.0-beta.3
  - @nocobase/app-plugin-authentication@0.1.0-beta.4
  - @nocobase/queue@0.1.0-beta.2
  - @nocobase/service-provider@0.0.2-beta.1

## 0.0.1-beta.2

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
  - @nocobase/app-server-kit@0.1.0-beta.2
  - @nocobase/queue@0.1.0-beta.1
  - @nocobase/service-provider@0.0.2-beta.0

## 0.0.1-beta.1

### Patch Changes

- 0465323: Declare explicit publish files for the example plugins and Hub template, and add a safe Hub environment example for generated projects.
- Updated dependencies [0465323]
  - @nocobase/app-server-kit@0.0.1-beta.1

## 0.0.1-beta.0

### Patch Changes

- da1b1b0: 首次发布。
- Updated dependencies [da1b1b0]
  - @nocobase/app-server-kit@0.0.1-beta.0
  - @nocobase/queue@0.0.1-beta.0
