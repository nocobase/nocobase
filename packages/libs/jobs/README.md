# @nocobase/jobs

Persistent recurring jobs for NocoBase applications. The application's schedule service hands each consumer — a plugin, or the application's own code — a private executor. The executor stores each job's rule in a backend and runs the job's handler whenever the rule fires.

| Adapter  | Backend                                                                                  | Deployment                                                                              |
| -------- | ---------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| `redis`  | BullMQ job schedulers, through its public API only                                       | Any number of instances; each firing runs on exactly one of them                        |
| `memory` | Process memory, read from a local state file at setup and written back whole at shutdown | One process; a process killed without shutting down loses what changed since it started |

The package exports factories and types only. It holds no module-level state and reads neither application settings nor the process environment. Applications compose it through `@nocobase/app-server/jobs`, which supplies the application name, the storage directory and the logger. Plugins and application code use it through that composition, never by creating a service of their own.

## Choosing it

Use it for work that has to happen because time passed — a nightly digest, an hourly cleanup, an overdue scan — and that nobody needs to see in the UI.

Use the Scheduler plugin (`@nocobase/app-plugin-scheduler`) instead when administrators should see the task, enable or disable it, and track each run. Scheduler is built on this package.

Use a queue job instead for work that runs once, immediately or after a delay.

## Composing it in an application

The application templates already do this; an application created before them adds the same three things.

`server/app.ts` adds the provider, passing the environment so that the fallback warning stays quiet in development:

```ts
import { JobExecutorServiceProvider } from '@nocobase/app-server/jobs';

app.addServiceProvider(JobExecutorServiceProvider, {
  nodeEnv: runtime.env.NODE_ENV,
});
```

`server/config/jobs.ts` declares the configurations, and `server/config/index.ts` adds it to `defaultAppConfigs`:

```ts
import {
  defineAppConfig,
  type AppConfigFactory,
} from '@nocobase/app-server/config';
import type { AppJobsConfig } from '@nocobase/app-server/jobs';

const jobs: AppConfigFactory<AppJobsConfig> = defineAppConfig(({ paths }) => ({
  memory: {
    adapter: 'memory',
    persistence: { path: paths.storage('jobs') },
  },
  redis: {
    adapter: 'redis',
    connection: { host: '127.0.0.1', port: 6379, db: 0 },
    removeOnComplete: { count: 1000 },
    removeOnFail: { age: 604_800 },
  },
}));

export default jobs;
```

`package.json` declares `@nocobase/jobs` in `dependencies`: `@nocobase/app-server` and every plugin that schedules declare it as a peer, and the application is what provides it.

`@nocobase/app-plugin-schedule-example` is a complete plugin doing all of the below: a provider that runs a heartbeat on its own scope, removes its orphan rules, and exposes the runs through a route.

## Configuring it

The `jobs` section maps configuration keys to configurations, and `default` names the one used when a consumer names none. A deployment selects one in `config.yml`:

```yaml
jobs:
  default: redis
  redis:
    connection:
      host: redis.internal
      port: 6379
```

| Option                              | Adapter | Meaning                                                                                                                                                                                           |
| ----------------------------------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `adapter`                           | both    | `redis` or `memory`.                                                                                                                                                                              |
| `namespace`                         | both    | Isolates applications that share a backend. Defaults to the application name. Set it when deployments with the same name share one Redis, and use a hash tag such as `{my-app}` on Redis Cluster. |
| `concurrency`                       | both    | Jobs one instance runs at the same time. Defaults to `1`.                                                                                                                                         |
| `attempts`                          | both    | Tries per firing, the first included. Defaults to `1`, which means no retry.                                                                                                                      |
| `connection`                        | redis   | Redis connection options, handed to BullMQ as they are.                                                                                                                                           |
| `removeOnComplete` / `removeOnFail` | redis   | How many finished jobs BullMQ keeps: `true`, a count, or `{ count, age }` with `age` in seconds. Default `{ count: 1000 }` and `{ age: 604800 }`; every firing leaves one behind.                 |
| `persistence.path`                  | memory  | The directory holding the state files. Defaults to `storage/jobs`.                                                                                                                                |

A consumer's configuration is chosen as follows:

1. The key the consumer named, when it exists. The Scheduler plugin takes it from its own `scheduler.jobs`.
2. Otherwise the key `jobs.default` names. A default naming no configuration is an error.
3. Without `jobs.default`, a built-in memory configuration under `storage/jobs`. Outside `develop` and `development` this logs a warning, because it serves one process only. Set `jobs.default: memory` to keep that choice without the warning.

Redis must persist its data (AOF or RDB) and use `maxmemory-policy noeviction`; otherwise rules can be evicted or lost on restart. Every consumer opens its own queue and worker connections, so count them in the connection budget.

## Using it in a plugin or in application code

Resolve the service from the container in a provider, and ask it for an executor under your package name as the scope. Register the jobs, then call `setup()`, both in `start()`. Shut the executor down in `shutdown()`.

```ts
import type { AppPluginApplication } from '@nocobase/app-server/plugins';
import { jobExecutorServiceToken } from '@nocobase/app-server/jobs';
import type { ScheduleExecutor } from '@nocobase/jobs';
import { ServiceProvider } from '@nocobase/service-provider';

export class DigestProvider extends ServiceProvider<AppPluginApplication> {
  public readonly name: string = '@acme/app-plugin-digest';
  private executor: ScheduleExecutor | undefined;

  public override async start(): Promise<void> {
    this.executor = this.app.container
      .resolve(jobExecutorServiceToken)
      .getScheduleExecutor('@acme/app-plugin-digest');
    await this.executor.addJob({
      name: 'nightly-digest',
      options: { cron: '0 2 * * *', tz: 'Asia/Shanghai' },
      payload: { channel: 'email' },
      execute: async ({ jobId, scheduledAt, signal }) => {
        // Resolve a service and call one method; keep the rest out of here.
      },
    });
    await this.executor.setup();
  }

  public override async shutdown(): Promise<void> {
    await this.executor?.shutdown();
  }
}
```

- **Scope.** Use your package name. It becomes the BullMQ queue name and the memory state file name, and it may contain only the one `/` of an `@scope/name`, with no `:` and no whitespace. Each consumer uses its own scope and never shares an executor.
- **Order.** Register every job before `setup()`. `setup()` writes the rules and only then starts executing, so a due firing never reaches a job whose handler is not registered yet. Before `setup()`, `addJob` only registers the job, and its receipt carries no `scheduledAt`. `removeJob`, `getJob`, `listJob` and `countJob` fail until `setup()` has run.
- **Shutting down.** Call `executor.shutdown()` from your provider's `shutdown()`. It aborts the `signal` of running handlers and waits for them to finish. It keeps the rules, so other instances continue and the next start resumes. Do not call `removeJob` on shutdown: that removes the rule for every instance.
- **Settings.** `concurrency`, `attempts` and retention come from the configuration the executor runs on; an executor cannot change them. A consumer that needs different values names a configuration of its own in `getScheduleExecutor(scope, name)`, which the application defines in its `jobs` section.
- **Commands.** A CLI command that only writes rules calls `setup({ consume: false })`, which writes the rules without starting a worker.

### Declaring the dependency

A plugin declares `@nocobase/app-server` and `@nocobase/jobs` as `peerDependencies`. The types it imports from `@nocobase/jobs` remain in its published declarations, so a `devDependency` is not enough, and the application provides the one shared copy. Application code needs nothing more than the application's own `dependencies` entry.

## Jobs

| Field     | Meaning                                                                                                                                       |
| --------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `name`    | The job's stable identity within the scope; must not contain `:`. Renaming a job creates another one and leaves the old rule behind.          |
| `options` | Exactly one of `cron` (five or six fields) and `every` (milliseconds), plus optional `tz`, `startDate`, `endDate`, `limit` and `immediately`. |
| `payload` | JSON data stored with the rule and returned by `getJob`. The handler may read the current payload from its closure instead.                   |
| `execute` | Receives `jobId`, `scheduledAt`, `runAt`, `nextRunAt` and `signal`. A rejected promise fails the firing, which is retried up to `attempts`.   |

- **`tz`** defaults to UTC, not the host's time zone.
- **`startDate`** is exclusive: a cron rule fires at its first tick after `startDate`. An `every` rule fires first at `max(now, startDate)`, then every interval.
- **`immediately`** fires a cron rule once when it is created. It is ignored when the rule already exists, and it cannot be combined with `startDate`.
- **`endDate`** already in the past stores no rule: `addJob` removes any rule of that name and returns no `scheduledAt`.
- **`jobId`** identifies one firing and is the same in its events. Use it as the idempotency key of the handler's effect: a firing may be delivered again, for example after a crash.

### Writing rules repeatedly

`addJob` compares the job with the rule already stored: its options, its payload (with keys in any order) and the executor's `attempts` and retention. When nothing changed it writes nothing, so calling it at every start is cheap and harmless.

When something changed it replaces the rule. The planned firing is replaced as well, even one that is already due, and `limit` counts again from zero. A consumer that relies on `limit` passes what is left of it — `limit` minus the firings already run — when it rewrites a rule.

### Receipts

| `code` | `message`            | When                                                                                                         |
| ------ | -------------------- | ------------------------------------------------------------------------------------------------------------ |
| `1000` | `Job upserted`       | `addJob` wrote or kept the rule; `scheduledAt` is the next planned firing, when there is one after `setup()` |
| `2000` | `Job removed`        | `removeJob` removed the rule and its planned firing                                                          |
| `3000` | `Job not existed`    | `removeJob` found no rule of that name                                                                       |
| `4000` | `Handler registered` | `addJob(job, true)` registered the handler and did not touch the backend                                     |

Import `ScheduleReceiptCode` rather than writing the numbers.

## Handlers and rules

Rules live in the backend; handlers live in the process that registered them.

- **Disabled jobs.** A job whose rule should not be written right now — disabled, or out of firings — is still registered with `addJob(job, true)`. Another instance may add its rule again, and this instance must then be able to run it.
- **`removeJob` keeps the handler.** It removes the rule and its planned firing for every instance, but the handler stays registered in this process until `shutdown()`.
- **Firings without a handler.** A firing whose job has no handler in the executing process fails once, without retry, and is reported with reason `handler-not-registered`. This happens when code no longer defines a job whose rule is still stored.
- **Orphan rules.** Removing such rules is the owner's job. Compare `listJob(0, -1)` with the jobs your code defines and `removeJob` the rest, taking care not to remove rules another part of the application still owns. The package never removes a rule by itself.

## Events

`subscribe(subscriber)` reports the firings this instance runs: `ScheduleStart` on each attempt, then `ScheduleEnd` or `ScheduleError`. `ScheduleError` carries `reason` (`execute-failed` or `handler-not-registered`) and `error`. Each event carries `jobId`, `jobName`, `scheduledAt`, `runAt` and `nextRunAt`. Nothing is broadcast to other instances, so counting `ScheduleStart` per `jobId` counts each firing once. Events are delivered after the fact and in order, so a handler must not count on its own `ScheduleStart` having been handled when it runs. They are not persisted: a process that stops between running a job and handling its event loses that event. An error thrown by a subscriber is logged and does not affect the firing.

## The memory adapter

- The state — rules, next firings and firing counts — is read from `<persistence.path>/<namespace>.<scope>.json` in `setup()`. It is changed only in memory while the process runs, and written back whole in `shutdown()` after running handlers finish. A failed write makes `shutdown()` reject. A file that `setup()` could not read, because of an unknown format version or invalid JSON, is never overwritten.
- A process that ends without `shutdown()` — killed, out of memory, power loss — loses every change since it started, including firing counts, so a job with `limit` may run again. A consumer that writes its rules at every start, as shown above, gets them back.
- A firing missed while the process was stopped runs once after it starts, and the next firing is planned from the present.
- There is no lock. Each process holds its own copy: several processes on one state file each fire every job, and the one that shuts down last overwrites the others. Use the `redis` adapter for more than one process.

## The redis adapter

- The namespace is the BullMQ `prefix` and the scope is the queue name. Every function goes through the public API of BullMQ's `Queue`, `Worker` and `Job`: the package opens no Redis client of its own and relies on no key layout, script or job id format.
- Each firing runs on one instance, and a worker that stops leaves the rule to the others.
- Redis Cluster is not recommended with BullMQ 6.3.6. If it is used, the namespace must be a hash tag such as `{my-app}`.

## Testing

Create a service directly in tests, on the memory adapter with a temporary directory, and shut it down afterwards:

```ts
import { createJobExecutorService } from '@nocobase/jobs';

const service = createJobExecutorService(undefined, {
  appName: 'test',
  storagePath: temporaryDirectory,
});
const executor = service.getScheduleExecutor('@acme/app-plugin-digest');
// ...
await service.shutdown();
```

Test what a handler does by calling the service it delegates to, rather than by waiting for a schedule. Give each application a test starts its own `persistence.path`: two applications on one state file overwrite each other.

This package's own suites:

```bash
pnpm --filter @nocobase/jobs test
pnpm --filter @nocobase/jobs test:integration  # starts Redis in Docker
```
