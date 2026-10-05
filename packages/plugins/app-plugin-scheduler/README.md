# @nocobase/app-plugin-scheduler

Code-defined scheduling for NocoBase applications.

A plugin or application registers a schedule by resolving `schedulerServiceToken`
and calling `defineSchedule(definition)` during `register()` or `boot()`,
the same way it calls `registerTarget()`:

```ts
import { schedulerServiceToken } from '@nocobase/app-plugin-scheduler/server/tokens';

public override async boot(): Promise<void> {
  if (!this.app.container.has(schedulerServiceToken)) return;
  this.app.container.resolve(schedulerServiceToken).defineSchedule({
    key: 'daily-sync',
    title: 'Daily sync',
    schedule: { cron: '0 0 2 * * *', timezone: 'UTC' },
    target: {
      type: 'workflow',
      config: { workflowKey: 'daily-sync', input: {} },
    },
  });
}
```

The plugin reconciles declarations into `schedule_definitions` and hands each schedule's rule to the application's jobs service from `@nocobase/app-server/jobs`, on its own `@nocobase/app-plugin-scheduler` scope, with the concurrency and attempts of the `jobs` configuration it runs on. The application's `jobs` configuration selects the backend: `redis` runs every firing once across any number of instances, and `memory` — also the built-in fallback when `jobs.default` is not set — serves one process, keeping its state in memory and writing it under `storage/jobs` when the application stops. The application must compose `JobExecutorServiceProvider`. Scheduler records each firing as an idempotent occurrence whose id is the firing's job id, keeps the run count, last run and next run on the definition, and provides an authenticated, authorized, read-only Settings page and API. Raw target config is never returned by the API.

The schedules follow `jobs.default` unless `scheduler.jobs` — or the `SCHEDULER_JOBS` environment variable — names another `jobs` configuration for them, such as a Redis configuration with its own `concurrency`. A name the `jobs` section does not define stops the application from starting. Keep `attempts` at `1` for that configuration: a failed dispatch is recorded as the occurrence's outcome, so a retry of the same firing finds it recorded and runs nothing.

`schedulerServiceToken` is the plugin's whole extension surface, with two methods. `registerTarget()` declares what a schedule can point at: how a config is validated, how a firing starts, and how a run that finishes later is inspected, and it returns the handle that reports a terminal outcome. `defineSchedule(definition)` registers a schedule itself; `key` must be unique within the application and forms the schedule's stable identity. Both are read once when the App syncs during startup, so call them from `register()` or `boot()`. Reading and changing schedules afterward is reachable through the HTTP API and the `scheduler sync` command rather than through the service. The HTTP API lives under `/api/scheduler` and is documented under the `Scheduler` tag at `/api/swagger/docs` in the running application.

Run a non-destructive synchronization with `pnpm nocobase scheduler sync`. A deployment may run `node dist/cli/index.js scheduler sync --finalize` once per App, from any directory, or `pnpm nocobase scheduler sync --finalize` inside `dist/`, to deactivate declarations missing from the complete manifest. The one-shot command writes rules without starting the schedule worker. On the `memory` adapter a running application overwrites what it wrote when it stops; that loses nothing, because every start synchronizes again from the code and removes again the rules of disabled and deactivated definitions.

This version replaces the queue-backed scheduling of earlier releases and
migrates nothing from `queue_schedules` or `queue_jobs`: rules are written again
on the next start, and run counts start from zero.

## Verification

```bash
pnpm --filter @nocobase/app-plugin-scheduler lint
pnpm --filter @nocobase/app-plugin-scheduler typecheck
pnpm --filter @nocobase/app-plugin-scheduler test
pnpm --filter @nocobase/app-plugin-scheduler build
pnpm --filter @nocobase/app-plugin-scheduler test:integration  # needs Docker; runs against Redis
```
