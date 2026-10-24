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
      // A target type the application or a plugin registered with `registerTarget()`.
      type: 'app.daily-sync',
      config: { batchSize: 100 },
    },
  });
}
```

The plugin reconciles declarations into `schedule_definitions` and hands each schedule's rule to the application's jobs service from `@nocobase/app-server/jobs`, on its own `@nocobase/app-plugin-scheduler` scope, with the concurrency and attempts of the `jobs` configuration it runs on. The application's `jobs` configuration selects the backend: `redis` runs every firing once across any number of instances, and `memory` — also the built-in fallback when `jobs.default` is not set — serves one process, keeping its state in memory and writing it under `storage/jobs` when the application stops. The application must compose `JobExecutorServiceProvider`. Scheduler records each firing as an idempotent occurrence whose id is the firing's job id, keeps the run count, last run and next run on the definition, and provides an authenticated, authorized API for listing schedules, inspecting their occurrences and enabling or disabling them. The plugin contributes no pages; an application that shows schedules builds its pages on that API among its own routes. Raw target config is never returned by the API.

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

## Draining before dependency shutdown

Resolve `schedulerServiceToken` from `@nocobase/app-plugin-scheduler/server/tokens` and call `drain(): Promise<void>` before releasing services used by schedule targets. For reverse-order provider shutdown, an application can register a final provider whose `shutdown()` returns `this.app.container.resolve(schedulerServiceToken).drain()`. Stop host HTTP admission and drain other business executors in the appropriate application order; Scheduler does not own them.

The first call synchronously stops admission of reconciliation checks and clears the reconciliation timer. Already admitted checks may overlap as before. Drain waits for those checks, their observation/completion writes, and the existing configured schedule executor, including its state persistence and event delivery. Completion reports remain accepted while the executor or checks are draining. Once both settle, the report entry closes and drain waits for all previously accepted reports and event records before releasing the subscription. A late `reportCompletion()` rejects with `The Scheduler has been drained.` before any storage access, even if drain failed.

Concurrent and repeated calls, including the plugin provider's final shutdown, return the same promise and the same success or failure. A failure does not finish drain early: other admitted work settles first. A single failure is rethrown unchanged; multiple failures use `AggregateError.errors`. Scheduler observes its own event-record failures even though Jobs logs subscriber errors. Infrastructure failures observed by an in-flight reconciliation are included; target inspection failures still mean an unknown target state, and business terminal outcomes retain their existing meaning. Failures already settled before drain began remain the responsibility of their original callers/logs.

Drain is a one-way, process-local boundary with no restart or retry. It does not wait for every durable `waiting` occurrence or for human approval; later processes can use the existing recovery path. It neither cancels business work nor imposes a new deadline. Keep dependencies available until the drain promise settles, and propagate rejection to the host's shutdown error handling. Do not await drain from inside a target, inspection or completion operation that drain itself must wait for.

The same boundary works with an empty manifest, sync-only startup and partial startup failure. Shutdown uses the already selected `scheduler.jobs` executor and does not create a replacement. This contract requires a Jobs revision whose Schedule executor waits for queued event delivery even when backend shutdown fails; the older failure path that returns before delivery is insufficient.

Tracking adds only process-local state and promises. Requests, ticks, claims and runs add no SQL, network request, durable write, transaction or lock. Existing shutdown state-file persistence and occurrence/event writes still occur and must complete; drain does not make those costs zero.
