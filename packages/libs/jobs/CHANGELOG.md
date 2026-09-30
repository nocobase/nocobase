# @nocobase/jobs

## 0.1.0-beta.1

### Minor Changes

- 3d44c4c: Add one-off `JobExecutor` tasks alongside recurring `ScheduleExecutor` rules through the existing application jobs provider and service token. Jobs declare an own stable static `jobName`, accept only payload in their constructors, and reconstruct a fresh instance for every attempt from a strict JSON snapshot. Consumers register classes before setup; producer-only executors use `setup({ consume: false })`.

  Identify ordinary tasks by connection or storage path, namespace and scope, like Schedule, so renaming a configuration key or replacing the built-in default with `jobs.default: memory` keeps pending tasks; they use Redis queues and pending-only memory snapshots separate from Schedule's. Report local attempt events, including `JobProgress` for the 0–100 progress a handler reports through `reportProgress` (stored as BullMQ job progress on Redis), preserve explicitly interrupted work for recovery, and complete successful handlers even when shutdown has aborted their signal. Memory persistence remains setup-read and shutdown-write, so forced exits can lose new tasks or replay work completed since the last snapshot.

  Rename the shared configuration and service types from `Schedule*` to `Jobs*`, because they configure ordinary and recurring executors alike: `ScheduleConfig` is now `JobsConfig`, and `ScheduleAdapterConfig`, `RedisScheduleAdapterConfig`, `MemoryScheduleAdapterConfig`, `ScheduleRedisConnectionOptions`, `ScheduleRetentionPolicy`, `ScheduleLogger` and `ScheduleFallbackEvent` are now `JobsAdapterConfig`, `RedisJobsAdapterConfig`, `MemoryJobsAdapterConfig`, `JobsRedisConnectionOptions`, `JobsRetentionPolicy`, `JobsLogger` and `JobsFallbackEvent`. The old names are removed, so code importing them from `@nocobase/jobs` must switch to the new ones. Shared error messages now say "jobs" instead of "schedule". Types specific to recurring rules, such as `ScheduleExecutor` and `ScheduleJob`, keep their names.

  Document ordinary and recurring executor ownership in app-server and update application-development guidance to distinguish payload-only tasks from the unchanged queue-job and Scheduler APIs.

## 0.1.0-beta.0

### Minor Changes

- aeff80a: Add `@nocobase/jobs`, persistent recurring jobs with one executor per consumer, and compose it under `@nocobase/app-server/jobs`

  `createJobExecutorService(config, { appName, storagePath, logger, onFallback })` hands out executors by scope and configuration key; an executor's concurrency, attempts and retention are those of its configuration. An executor stores each job's rule in a backend and runs its handler when the rule fires: `addJob(job, registerOnly?)` skips the write when the rule, payload and execution settings are unchanged, passes `immediately` only for a new job, and registers the handler alone with `registerOnly`; `removeJob` keeps the handler; `subscribe` reports the firings this instance ran, with `jobId`, `scheduledAt`, `runAt` and `nextRunAt`; a firing whose job has no handler fails once as `handler-not-registered`. Two adapters implement it. `redis` uses BullMQ 6.3.6 job schedulers through their public API only and runs each firing on exactly one instance. `memory` keeps rules, next firings and counts in the process, reads them from a versioned state file under `persistence.path` at setup and overwrites that file whole at shutdown; it serves one process, and one that ends without shutting down loses what changed since it started. A firing missed while the process was stopped runs once after it starts again.

  `@nocobase/app-server/jobs` exports `jobExecutorServiceToken`, `JobExecutorServiceProvider` and `AppJobsConfig`. The provider reads the `jobs` section, defaults `namespace` to the application name and the built-in memory configuration to `storage/jobs`, reports a fallback to that configuration outside `develop` and `development` (pass `{ nodeEnv }` when adding it), and shuts down executors their owners left running. `@nocobase/app-server` declares `@nocobase/jobs` as a peer; applications provide it.

## 0.0.1

### Patch Changes

- Initial release.
