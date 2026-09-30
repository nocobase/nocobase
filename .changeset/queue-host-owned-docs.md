---
'@nocobase/jobs': patch
'@nocobase/app-host': patch
'@nocobase/app-plugin-scheduler': patch
'@nocobase/app-plugin-notification': patch
'@nocobase/app-plugin-i18n': patch
'@nocobase/app-plugin-users': patch
'@nocobase/app-plugin-api-keys': patch
'@nocobase/app-plugin-authz-default-access': patch
'@nocobase/app-plugin-authz-restriction-rules': patch
'@nocobase/app-plugin-authz-sharing-rules': patch
'@nocobase/app-plugin-database-explorer': patch
'@nocobase/app-plugin-authorization-example': patch
'@nocobase/app-plugin-departments-example': patch
'@nocobase/app-plugin-file-example': patch
'@nocobase/app-plugin-jobs-example': patch
'@nocobase/app-plugin-repository-example': patch
---

Point plugin guidance at `@nocobase/jobs` for background work, and at the rebuilt `@nocobase/queue` only for what jobs cannot do

The Scheduler Skill now hands a target's lengthy work to a `JobExecutor` owned by the target's Provider, with the occurrence's own execution record as the reference, so a repeated start of the same occurrence returns the same reference; the job decides and reports its terminal outcome itself, because it cannot tell which executor attempt is the last. Recurring work without administrator visibility goes to a `ScheduleExecutor`, and only a one-time delay goes to a queue. Its description of Scheduler's own backend now names the jobs service and `scheduler.jobs` instead of the removed `queue.queues.schedule` connection. The Notification Skill's diagnostics check the jobs configuration Deliveries run on instead of a queue manager.

The plugins' `AGENTS.md` list `@nocobase/queue` as a host-owned contract rather than a job registry. The jobs README states that background work goes there by default, the i18n Skill speaks of background jobs rather than queue jobs, and the departments example no longer composes the removed `QueueProvider` in its tests.
