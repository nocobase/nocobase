---
'@nocobase/app-plugin-scheduler': minor
---

Schedule through `@nocobase/jobs` instead of the queue's schedule projection

**Breaking.** Scheduler hands each schedule's rule to its own executor from `@nocobase/app-server/jobs`, on the `@nocobase/app-plugin-scheduler` scope, with the concurrency and attempts of the `jobs` configuration it runs on. `ScheduleDispatchJob` is no longer exported, the plugin contributes no queue jobs and needs no `schedule` queue, and it depends on `@nocobase/jobs` as a peer. A new migration adds `nextRunAt`, `lastRunAt`, `runCount`, `appliedLimit` and `lastOccurrenceId` to `scheduleDefinitions` and `scheduledAt` to `scheduleOccurrences`.

- **No migration from the queue.** Rules are not carried over from `queue_schedules`, nor pending jobs from `queue_jobs`. Each schedule's rule is written again on the next start and its run count starts from zero; its definition, enablement and occurrence history are kept.
- **One run per firing across instances** on the `redis` jobs adapter. On `memory`, the built-in default, schedules serve one process.
- **Every start repairs the rules.** Synchronization removes again the rule of every disabled definition and of every definition `--finalize` deactivated, so a removal that was lost — on `memory`, a running application overwrites what `nocobase scheduler sync` wrote when it stops — takes effect at the next start.
- **Occurrences.** An occurrence's id is the firing's job id, so a firing delivered twice records and starts its target once. A target that is not ready now records a `skipped` occurrence instead of failing.
- **Limits.** Disabling and re-enabling a schedule, or changing its definition, continues from the firings already run rather than restarting its limit.
- **Choosing the backend.** `scheduler.jobs`, or `SCHEDULER_JOBS`, names the `jobs` configuration the schedules run on; without it they follow `jobs.default`. A name `jobs` does not define stops the application from starting. Keep `attempts` at `1` there: a failed dispatch is recorded as the occurrence's outcome, so a retry finds it recorded and runs nothing.

Upgrading: compose `JobExecutorServiceProvider` in `server/app.ts`, declare `@nocobase/jobs` as a dependency, add a `jobs` configuration — `redis` for more than one instance — and remove the `queues.schedule` connection the queue configuration kept for Scheduler. The application templates do all of this.
