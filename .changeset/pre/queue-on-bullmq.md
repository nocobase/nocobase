---
'@nocobase/queue': minor
'@nocobase/app-server': minor
'@nocobase/app-template-default': minor
'@nocobase/app-template-examples': minor
'@nocobase/app-template-hub': minor
'@nocobase/create-plugin': minor
'@nocobase/app-plugin-queue-example': minor
'@nocobase/dev-config': patch
'@nocobase/app-skills': patch
---

Rebuild `@nocobase/queue` on BullMQ 6.3.6, with producers, consumers and managers per application

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
