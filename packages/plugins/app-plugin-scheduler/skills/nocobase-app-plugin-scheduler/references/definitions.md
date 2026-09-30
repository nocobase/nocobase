# Definitions, Registration, and Synchronization

## Prerequisites and Application Registration

Declare application Server packages in `dependencies`. Business plugins consuming Scheduler use `peerDependencies` and import the original Tokens rather than creating same-named Tokens. Installing a package does not enable it. Preserve existing registrations and add the default export of `@nocobase/app-plugin-scheduler/server` to `server/plugins.ts`. Register `@nocobase/app-plugin-scheduler/client` in `client/plugins.ts` for administrator UI observability. The synchronization command requires `@nocobase/app-plugin-scheduler/cli` in `cli/plugins.ts`.

Scheduler keeps its rules on a `ScheduleExecutor` of the application's jobs service, under the `@nocobase/app-plugin-scheduler` scope, so the application composes `JobExecutorServiceProvider`. `scheduler.jobs` (`SCHEDULER_JOBS`) names the `jobs` configuration it runs on; left out, it follows `jobs.default`, and a name `jobs` does not define stops the application from starting. The `memory` adapter serves one process; more than one instance needs `redis`, which fires each rule once. Keep that configuration's `attempts` at 1: a failed dispatch is recorded as the occurrence's outcome. Complete application migrations before synchronization. Scheduler runs only its own executor; the executors its targets hand work to belong to the targets' owners.

There is no Server declaration field for schedules — nothing to add to `defineServerPlugin()`, and no conventional file path to discover. A schedule is registered imperatively, wherever the application or a plugin needs it, by resolving `schedulerServiceToken` and calling `defineSchedule(definition)`. Do this from a Provider's `register()` or `boot()`, guarded the same way a target registration is guarded, since the scheduler plugin might not be installed:

```ts
import { schedulerServiceToken } from '@nocobase/app-plugin-scheduler/server/tokens';
import type { AppPluginApplication } from '@nocobase/app-server/plugins';
import { ServiceProvider } from '@nocobase/service-provider';

export default class MaintenanceScheduleProvider extends ServiceProvider<AppPluginApplication> {
  public readonly name = 'app/maintenance-schedule';

  public override async boot(): Promise<void> {
    if (!this.app.container.has(schedulerServiceToken)) return;
    this.app.container.resolve(schedulerServiceToken).defineSchedule({
      key: 'daily-maintenance',
      title: 'Daily maintenance',
      schedule: { cron: '0 2 * * *', timezone: 'Asia/Shanghai' },
      target: {
        type: 'app.maintenance',
        config: { batchSize: 100 },
      },
    });
  }
}
```

Add this Provider to the existing `server/providers/index.ts` array; a business plugin's own Provider belongs in its `serviceProviders` contribution instead. `key` is an application-wide stable identifier and forms the schedule's persistent identity together with the application name. Renaming it is not an in-place update, so use a namespaced key such as `sales.daily-report` when the application contains multiple business modules.

Both `register()` and `boot()` run, across every plugin, before the scheduler's own `start()` reads what was registered — so call order between plugins does not matter, only that the call happens before `start()`. A call after that point has no effect until the next sync.

## Declare Either Target

Register one call per schedule, in whichever Provider owns it:

```ts
scheduler.defineSchedule({
  key: 'daily-maintenance',
  title: 'Daily maintenance',
  schedule: { cron: '0 2 * * *', timezone: 'Asia/Shanghai' },
  target: {
    type: 'app.maintenance',
    config: { batchSize: 100 },
  },
});
scheduler.defineSchedule({
  key: 'daily-reconciliation',
  title: 'Daily reconciliation workflow',
  schedule: { cron: '0 3 * * *', timezone: 'Asia/Shanghai' },
  target: {
    type: 'workflow',
    config: { workflowKey: 'daily-reconciliation', input: {} },
  },
});
```

Implement and register these targets first. Keep only the definitions the application needs.

| Field                   | Current contract                                                                                                                                                           |
| ----------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `key`                   | Required; matches `^[A-Za-z0-9][A-Za-z0-9._:-]*$`; unique within the application. Application name and key form persistent identity, so renaming is not an in-place update |
| `title` / `description` | Required title / optional description                                                                                                                                      |
| `schedule.cron`         | Five fields starting with minutes, or six starting with seconds; `*/5 * * * *` runs every five minutes, `*/10 * * * * *` every ten seconds                                 |
| `schedule.timezone`     | Defaults to `UTC`; use an explicit IANA timezone and consider daylight saving changes for local business time                                                              |
| `schedule.from` / `to`  | Optional inclusive `Date` boundaries; construct from ISO timestamps with explicit timezone offsets; from must not exceed to                                                |
| `schedule.limit`        | Optional positive integer; counts firings started, not successful completions. Disabling and re-enabling or changing the definition continues from the firings already run |
| `target.type`           | A registered target type: `workflow` with Workflow installed, or one the application or a plugin registered itself. There is no built-in type                              |
| `target.config`         | JSON object; no functions, Service instances, or credentials. Sensitive field names are rejected recursively                                                               |

`defineSchedule()` validates and normalizes the definition before adding it to the in-memory manifest for the next sync. It defaults the timezone, computes a definition hash, and freezes the stored definition. Do not construct the hash manually or mutate a definition after passing it in. There are no `enabled`, `retry`, or `overlap` declaration fields; do not insert job or queue options, or fields from another scheduling framework.

`target.config` is whatever the target's own `validate()` accepts. Synchronization checks that the type is registered and runs that `validate()`; anything it does not check is checked when the schedule fires. Successful synchronization does not prove the config drives correct business behavior.

## Workflow Readiness and Execution Recovery

The `workflow` config is `{ workflowKey: string, input?: JsonObject }`, with input defaulting to `{}`. The key is the workflow source directory name, not its title or database revision id. Complete workflow checking, Artifact build, synchronization, and enablement separately; schedule synchronization does not perform these steps. Triggers use the current version, and its input schema validates input.

The Workflow plugin registers its target, reports terminal completion through its Scheduler handle, and supplies persisted-run inspection for lost notifications. Applications using this built-in integration do not need a second job wrapping the workflow or their own completion bridge. It uses `schedule:<scheduleId>:<occurrenceId>` as eventKey and records `sourceType: 'schedule'` with occurrenceId. Recovery of the same trigger looks up that eventKey and returns the existing `workflow-run` reference; inspection reads that original run's persisted status. Preserve scheduleId and occurrenceId during recovery; do not trigger another workflow independently. For missing or disabled targets and invalid input, inspect the actual occurrence status and reason.

## Synchronization and Deployment

Run from the target application root:

```bash
pnpm nocobase scheduler sync --json
```

Success returns the command envelope with `ok: true`, `status: "success"` and `result: { finalize: false }`; also inspect the exit code for failures. The command starts the application for synchronization, writes the rules, and shuts it down, without starting Scheduler's schedule worker. Normal application startup also performs non-destructive synchronization before starting the worker. On the `memory` jobs adapter a running application overwrites what the command wrote when it stops. That loses nothing: every start synchronizes again from the code, and removes again the rules of disabled definitions and of those `--finalize` deactivated.

Normal synchronization validates the complete loaded manifest and upserts definitions without deactivating missing ones. It preserves existing administrator enable/disable settings. During production deployment, once the complete manifest is available, run once per application against the built `dist/`:

```bash
node dist/cli/index.js scheduler sync --finalize --json
```

A built `dist/` has no `.bin`, so run its entry as shown, from any directory, or run `pnpm nocobase scheduler sync --finalize --json` inside `dist/`. Finalization additionally soft-deactivates definitions removed from code, preserving history. Never finalize from a process that loads only some plugins. Import, validation, or write failures must not commit partial reconciliation. Finalization and temporary administrator disabling are distinct operations.
