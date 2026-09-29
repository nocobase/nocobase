---
"@nocobase/jobs": minor
"@nocobase/app-server": patch
"@nocobase/app-skills": patch
---

Add one-off `JobExecutor` tasks alongside recurring `ScheduleExecutor` rules through the existing application jobs provider and service token. Jobs declare an own stable static `jobName`, accept only payload in their constructors, and reconstruct a fresh instance for every attempt from a strict JSON snapshot. Consumers register classes before setup; producer-only executors use `setup({ consume: false })`.

Identify ordinary tasks by connection or storage path, namespace and scope, like Schedule, so renaming a configuration key or replacing the built-in default with `jobs.default: memory` keeps pending tasks; they use Redis queues and pending-only memory snapshots separate from Schedule's. Report local attempt events, including `JobProgress` for the 0–100 progress a handler reports through `reportProgress` (stored as BullMQ job progress on Redis), preserve explicitly interrupted work for recovery, and complete successful handlers even when shutdown has aborted their signal. Memory persistence remains setup-read and shutdown-write, so forced exits can lose new tasks or replay work completed since the last snapshot.

Rename the shared configuration and service types from `Schedule*` to `Jobs*`, because they configure ordinary and recurring executors alike: `ScheduleConfig` is now `JobsConfig`, and `ScheduleAdapterConfig`, `RedisScheduleAdapterConfig`, `MemoryScheduleAdapterConfig`, `ScheduleRedisConnectionOptions`, `ScheduleRetentionPolicy`, `ScheduleLogger` and `ScheduleFallbackEvent` are now `JobsAdapterConfig`, `RedisJobsAdapterConfig`, `MemoryJobsAdapterConfig`, `JobsRedisConnectionOptions`, `JobsRetentionPolicy`, `JobsLogger` and `JobsFallbackEvent`. The old names are removed, so code importing them from `@nocobase/jobs` must switch to the new ones. Shared error messages now say "jobs" instead of "schedule". Types specific to recurring rules, such as `ScheduleExecutor` and `ScheduleJob`, keep their names.

Document ordinary and recurring executor ownership in app-server and update application-development guidance to distinguish payload-only tasks from the unchanged queue-job and Scheduler APIs.
