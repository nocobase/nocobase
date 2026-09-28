---
'@nocobase/jobs': minor
'@nocobase/app-server': minor
---

Add `@nocobase/jobs`, persistent recurring jobs with one executor per consumer, and compose it under `@nocobase/app-server/jobs`

`createJobExecutorService(config, { appName, storagePath, logger, onFallback })` hands out executors by scope and configuration key; an executor's concurrency, attempts and retention are those of its configuration. An executor stores each job's rule in a backend and runs its handler when the rule fires: `addJob(job, registerOnly?)` skips the write when the rule, payload and execution settings are unchanged, passes `immediately` only for a new job, and registers the handler alone with `registerOnly`; `removeJob` keeps the handler; `subscribe` reports the firings this instance ran, with `jobId`, `scheduledAt`, `runAt` and `nextRunAt`; a firing whose job has no handler fails once as `handler-not-registered`. Two adapters implement it. `redis` uses BullMQ 6.3.6 job schedulers through their public API only and runs each firing on exactly one instance. `memory` keeps rules, next firings and counts in the process, reads them from a versioned state file under `persistence.path` at setup and overwrites that file whole at shutdown; it serves one process, and one that ends without shutting down loses what changed since it started. A firing missed while the process was stopped runs once after it starts again.

`@nocobase/app-server/jobs` exports `jobExecutorServiceToken`, `JobExecutorServiceProvider` and `AppJobsConfig`. The provider reads the `jobs` section, defaults `namespace` to the application name and the built-in memory configuration to `storage/jobs`, reports a fallback to that configuration outside `develop` and `development` (pass `{ nodeEnv }` when adding it), and shuts down executors their owners left running. `@nocobase/app-server` declares `@nocobase/jobs` as a peer; applications provide it.
