# @nocobase/app-plugin-jobs-example

## 0.1.0-beta.1

### Patch Changes

- e77641b: Point plugin guidance at `@nocobase/jobs` for background work, and at the rebuilt `@nocobase/queue` only for what jobs cannot do

  The Scheduler Skill now hands a target's lengthy work to a `JobExecutor` owned by the target's Provider, with the occurrence's own execution record as the reference, so a repeated start of the same occurrence returns the same reference; the job decides and reports its terminal outcome itself, because it cannot tell which executor attempt is the last. Recurring work without administrator visibility goes to a `ScheduleExecutor`, and only a one-time delay goes to a queue. Its description of Scheduler's own backend now names the jobs service and `scheduler.jobs` instead of the removed `queue.queues.schedule` connection. The Notification Skill's diagnostics check the jobs configuration Deliveries run on instead of a queue manager.

  The plugins' `AGENTS.md` list `@nocobase/queue` as a host-owned contract rather than a job registry. The jobs README states that background work goes there by default, the i18n Skill speaks of background jobs rather than queue jobs, and the departments example no longer composes the removed `QueueProvider` in its tests.

- Updated dependencies [9291dbb]
- Updated dependencies [9291dbb]
- Updated dependencies [ec4b764]
- Updated dependencies [a859ba1]
- Updated dependencies [e77641b]
- Updated dependencies [e77641b]
  - @nocobase/i18n@1.0.0-beta.5
  - @nocobase/app-client@1.0.0-beta.24
  - @nocobase/app-server@1.0.0-beta.32
  - @nocobase/jobs@0.1.0-beta.2
  - @nocobase/app-plugin-authentication@1.0.0-beta.24
  - @nocobase/service-provider@0.0.2-beta.1

## 0.1.0-beta.0

### Minor Changes

- 3d44c4c: Add `@nocobase/app-plugin-jobs-example`, a plugin demonstrating both executors of the application's jobs service; it replaces `@nocobase/app-plugin-schedule-example`

  Its `ScheduleExecutor` runs the `heartbeat` the schedule example ran, now under the `@nocobase/app-plugin-jobs-example` scope, beside three rules a "Schedules" page starts and stops: `interval` every 5, 10 or 30 seconds, `limited` every 3 seconds for five runs, and `cron` every minute. Their handlers are all registered before `setup()`, so a rule started from the page keeps running across restarts. The page shows each rule's state, next firing and recent runs, and reloads them through `GET /api/jobs-example/schedule` whenever the public `jobs-example:schedules` topic announces a change; `POST /api/jobs-example/schedule/:name/start` and `/stop` change a rule. Its `JobExecutor` runs a payload-only `ProgressJob` that works for ten seconds and reports 10% of progress each second. A "One-off jobs" page adds one block per job created with its button and follows each block's progress live: the page subscribes to the user-audience `jobs-example:tasks` realtime topic only while it is open, and the provider publishes every task change there for the user who created it. `POST /api/jobs-example/job` creates a task and answers `202`, and `GET /api/jobs-example/job` lists the signed-in user's recent tasks. A task interrupted by shutdown goes back to waiting and runs again on the next start. Both pages sit under a "Jobs example" menu group. The examples template registers the plugin's server and client in place of the schedule example, whose `/api/schedule-example` route is gone; the heartbeat rule stored under the old scope is no longer read.

### Patch Changes

- Updated dependencies [3d44c4c]
  - @nocobase/jobs@0.1.0-beta.1
  - @nocobase/app-server@1.0.0-beta.31
  - @nocobase/app-plugin-authentication@1.0.0-beta.24
  - @nocobase/app-client@1.0.0-beta.23
  - @nocobase/i18n@1.0.0-beta.4
  - @nocobase/service-provider@0.0.2-beta.1

## 0.0.1

### Patch Changes

- Initial release.
