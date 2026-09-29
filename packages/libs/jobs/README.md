# @nocobase/jobs

Ordinary one-off tasks and persistent recurring jobs for NocoBase applications. The application's jobs service hands each consumer — a plugin, or the application's own code — a scoped `JobExecutor` for tasks or `ScheduleExecutor` for recurring rules. They share application configuration, service ownership and shutdown, but use separate backend identities and lifecycles.

| Adapter  | Backend                                                                                  | Deployment                                                                              |
| -------- | ---------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| `redis`  | BullMQ ordinary queues and job schedulers, through public APIs only                      | Multiple workers claim tasks and firings; recovery can replay work                      |
| `memory` | Process memory, read from a local state file at setup and written back whole at shutdown | One process; a process killed without shutting down loses what changed since it started |

The package exports job classes, errors, factories and types. It holds no module-level service or registry and reads neither application settings nor the process environment. Applications compose it through `@nocobase/app-server/jobs`, which supplies the application name, the storage directory and the logger. Plugins and application code use it through that composition, never by creating a service of their own.

## Choosing it

Use `getJobExecutor(scope, name?)` for one-off work submitted as `new JobClass(payload)`. It queues each submission immediately; it has no delay, cron, job factory, or per-executor settings override. Use `getScheduleExecutor(scope, name?)` for work that has to happen because time passed — a nightly digest, an hourly cleanup, an overdue scan — and that nobody needs to see in the UI.

Use the Scheduler plugin (`@nocobase/app-plugin-scheduler`) instead when administrators should see the task, enable or disable it, and track each run. Scheduler continues to use `ScheduleExecutor`; its contract is unchanged.

The separate `@nocobase/queue` API and its automatically discovered jobs remain unchanged. Keep using it for existing queue integrations or capabilities such as delayed dispatch; its `Job` is not the `Job` from this package.

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

`@nocobase/app-plugin-jobs-example` demonstrates both executors on one scope. Its `ScheduleExecutor` holds a fixed set of rules whose handlers it registers before `setup()`, so a rule started from its page keeps running across restarts; it removes its orphan rules, and its page starts, stops and replans rules and shows their runs. Its `JobExecutor` registers a payload-only `ProgressJob` before setup; the job reports 10% of progress each second through `reportProgress`, the provider turns the executor's events into task records, and a page shows each task's progress live over a realtime topic. A task interrupted by shutdown runs again on the next start.

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
| `concurrency`                       | both    | Jobs one executor worker runs at the same time, not a global limit. Defaults to `1`.                                                                                                              |
| `attempts`                          | both    | Ordinary failure budget per task or firing, the first try included. Defaults to `1`. Ordinary task interruption and recovery do not consume this budget.                                          |
| `connection`                        | redis   | Redis connection options, handed to BullMQ as they are.                                                                                                                                           |
| `removeOnComplete` / `removeOnFail` | redis   | How many finished jobs BullMQ keeps: `true`, a count, or `{ count, age }` with `age` in seconds. Default `{ count: 1000 }` and `{ age: 604800 }`; applies to ordinary tasks and schedule firings. |
| `persistence.path`                  | memory  | The directory holding the state files. Defaults to `storage/jobs`.                                                                                                                                |

A consumer's configuration is chosen as follows:

1. The key the consumer named, when it exists. The Scheduler plugin takes it from its own `scheduler.jobs`.
2. Otherwise the key `jobs.default` names. A default naming no configuration is an error.
3. Without `jobs.default`, a built-in memory configuration under `storage/jobs`. Outside `develop` and `development` this logs a warning, because it serves one process only. Set `jobs.default: memory` to keep that choice without the warning.

Redis must persist its data (AOF or RDB) and use `maxmemory-policy noeviction`; otherwise tasks and rules can be evicted or lost on restart. Every consumer opens its own queue and worker connections, so count them in the connection budget.

## Ordinary one-off tasks

Resolve the existing `jobExecutorServiceToken` from `@nocobase/app-server/jobs`; do not create a second provider, token, global container, or module-level job registry. Request `getJobExecutor(scope, name?)` with your package name as the scope and an optional configuration key. `concurrency`, `attempts` and Redis retention come only from that selected configuration. Scope validation is the same as for `ScheduleExecutor`.

```ts
import { jobExecutorServiceToken } from '@nocobase/app-server/jobs';
import type { AppPluginApplication } from '@nocobase/app-server/plugins';
import { Job, type JobExecutionContext } from '@nocobase/jobs';

interface PublishPayload {
  readonly url: string;
  readonly documentId: string;
}

class PublishDocument extends Job<PublishPayload> {
  public static readonly jobName: string = 'documents.publish';

  public async execute({ jobId, signal }: JobExecutionContext): Promise<void> {
    const response = await fetch(this.payload.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Idempotency-Key': jobId,
      },
      body: JSON.stringify({ documentId: this.payload.documentId }),
      signal,
    });
    if (!response.ok) throw new Error(`Publication failed: ${response.status}`);
  }
}

export async function startPublisher(app: AppPluginApplication): Promise<void> {
  const executor = app.container
    .resolve(jobExecutorServiceToken)
    .getJobExecutor('@acme/app-plugin-documents');

  // In a provider, register all classes and set up the consumer in start().
  executor.registerJob(PublishDocument);
  await executor.setup();

  // Submit only after setup; this receipt acknowledges backend acceptance.
  const receipt = await executor.addJob(
    new PublishDocument({
      url: 'https://publisher.example/documents',
      documentId: 'document-42',
    }),
  );
  // Retain receipt.jobId as the identity of this task, not a completion result.
  // Call executor.shutdown() from the owning provider's shutdown().
}
```

Validate any caller-supplied URL against application policy before submitting this example's payload. Constructors must be side-effect free and accept only `payload`; there is no factory API, dependency injection, or application/service context passed to the job. Use payload-only operations, and keep domain behavior testable separately. A service container, database connection or request context must never enter a payload or backend record.

### Registration and submission

- A class extends `Job<TPayload>`, implements `execute(context)` on its prototype and declares its own stable `static jobName`. Names are non-empty and contain neither whitespace nor `:`. An inherited name or JavaScript class name is not a job identity. Changing `jobName` strands queued work unless its old handler remains registered.
- `registerJob(JobClass)` does not construct a job or enqueue work. Registering the same class with the same name again is harmless; a different class under that name is rejected. Registries belong to individual executors.
- Every consuming process registers all expected classes before `setup()`. `addJob(new JobClass(payload))` also registers that class locally, but that cannot prepare other workers or guarantee they know a handler before they claim an existing task. A task with no registered handler fails without retry and emits `JobError` with `handler-not-registered`.
- `setup()` starts a consumer. A producer-only process uses `setup({ consume: false })` before submitting; it does not execute tasks. The first setup call fixes the mode. Repeated or concurrent `setup()` and `shutdown()` calls are idempotent.
- An `addJob` before setup begins rejects; one submitted while setup is in progress waits for setup to finish. Shutdown closes submission. Each accepted submission is a separate task; `jobName` is a handler identity, not a deduplication key.
- Submission snapshots `payload` immediately, before asynchronous setup or enqueue work. Only strict JSON data is accepted: null, strings, booleans, finite numbers, plain objects and dense arrays of such values. Undefined, non-finite numbers, bigints, symbols, functions, class instances such as `Date`, cycles, accessors and hidden or symbol properties are rejected rather than silently erased or coerced. Mutating the submitted instance later cannot change the queued snapshot.
- Each execution attempt constructs a new `JobClass(payload)` from the snapshot. The submitted object is never executed or stored; instance fields, closures and services do not cross the backend boundary. Mutations in one attempt cannot leak into another.

### Receipts, events and attempts

`addJob` returns `{ jobId, jobName, enqueuedAt }` after backend acceptance, not after execution. `execute` also receives `runAt`, a one-based `attempt`, and an `AbortSignal`. `attempt` counts execution starts, including starts after interruption or stalled recovery; it is not the failure count charged against configured `attempts`. Use `jobId` or a stable business key to make effects idempotent because a task can run again after failure or recovery.

`subscribe` reports only attempts this executor runs: `JobStart`, any number of `JobProgress`, then `JobEnd` or `JobError`. The event contracts are in `src/job/types.ts`; `JobError` carries `reason` (`handler-not-registered`, `execute-failed` or `interrupted`) and an `Error`. A `JobError` describes a local attempt, not necessarily final task failure. Events are asynchronous local notifications, not durable delivery, backend acknowledgement, or a global completion history. Do not use `JobEnd` as proof that the backend has acknowledged completion, and do not assume `JobStart` subscribers have run before the handler starts. Subscriber failures are logged without failing the task.

`execute` reports how far an attempt has come with `await reportProgress(percent)`, a number from 0 to 100; anything else rejects with a `RangeError`. It resolves once the backend has stored the value — on Redis, BullMQ's job progress, which other processes can read — and then emits `JobProgress` with `progress`. Memory does not persist progress. Progress belongs to one attempt: a retry or a recovered start begins again and reports from scratch, and a report made after the attempt settled rejects instead of arriving after its `JobEnd` or `JobError`. `reportProgress` is a property, so it can be destructured from the context. To show progress elsewhere, subscribe on the executing instance and forward `JobProgress` to where it is read, such as a realtime topic.

### Shutdown and recovery

Call `executor.shutdown()` in the owning provider's shutdown hook. The application jobs provider also shuts down every ordinary and schedule executor that owners leave open. Shutdown stops new work, aborts running signals and waits for running handlers. A handler that returns successfully completes its task even if its signal was aborted; do not requeue already-completed work just because shutdown happened.

When a handler has not finished its work, it can use `signal.throwIfAborted()` or throw `JobInterruptedError` while that signal is aborted. Only these explicit interruption paths retain the task for recovery without spending the ordinary failure budget. Other exceptions remain ordinary failures even if shutdown also aborted the signal; `JobInterruptedError` with a live signal is an ordinary failure too. Backend crash/stalled recovery is separate and can replay work whose side effects already happened, so neither shutdown nor Redis provides exactly-once effects.

Waiting tasks are claimed FIFO; concurrent workers and retries can complete them in a different order. `concurrency` is local to one executor worker, not a scope-wide or application-wide limit.

### Ordinary task identity and persistence

Physical identity leaves the configuration key out, as Schedule does, so renaming a key, re-pointing `jobs.default`, or replacing the built-in default with `jobs.default: memory` keeps reading the same pending tasks. Keys whose connection, namespace and scope match address the same tasks; give a configuration its own `namespace` to isolate it. Within one service, ordinary executors are cached by the resolved configuration key and scope, and omitted, `default`, and unknown names that select the same default share an executor. Memory keys naming the same file also share one executor, and requesting one whose `concurrency` or `attempts` differs from the executor already created for that file throws. `JobExecutor` and `ScheduleExecutor` never share an executor or a physical queue.

- **Redis:** physical identity is the Redis connection, BullMQ `prefix` equal to the namespace, and queue name `jobs/<base64url(JSON.stringify([scope]))>`. The slash keeps ordinary queues apart from Schedule, whose queue is the scope itself. The adapter uses public BullMQ APIs and stores serialized task data, never submitted objects, constructors or services.
- **Memory:** the file is `<persistence.path>/jobs.<base64url(JSON.stringify([namespace, scope]))>.state.json`, separate from every Schedule file. Setup reads it and graceful shutdown writes it after active work settles. It contains pending tasks only, with no finished or failed history. A failed or corrupt read is not overwritten on shutdown.
- **Memory durability:** enqueues are only in process memory until shutdown. A forced exit can lose new submissions and replay old tasks already completed since the last saved snapshot. There is no interprocess locking or shared consumption; do not point multiple processes at the same file. Use Redis with persistence for multiprocess execution and durable acceptance.

## Using a ScheduleExecutor in a plugin or application

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

## Schedule jobs

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

## Schedule handlers and rules

Rules live in the backend; handlers live in the process that registered them.

- **Disabled jobs.** A job whose rule should not be written right now — disabled, or out of firings — is still registered with `addJob(job, true)`. Another instance may add its rule again, and this instance must then be able to run it.
- **`removeJob` keeps the handler.** It removes the rule and its planned firing for every instance, but the handler stays registered in this process until `shutdown()`.
- **Firings without a handler.** A firing whose job has no handler in the executing process fails once, without retry, and is reported with reason `handler-not-registered`. This happens when code no longer defines a job whose rule is still stored.
- **Orphan rules.** Removing such rules is the owner's job. Compare `listJob(0, -1)` with the jobs your code defines and `removeJob` the rest, taking care not to remove rules another part of the application still owns. The package never removes a rule by itself.

## Schedule events

`subscribe(subscriber)` reports the firings this instance runs: `ScheduleStart` on each attempt, then `ScheduleEnd` or `ScheduleError`. `ScheduleError` carries `reason` (`execute-failed` or `handler-not-registered`) and `error`. Each event carries `jobId`, `jobName`, `scheduledAt`, `runAt` and `nextRunAt`. Nothing is broadcast to other instances, so counting `ScheduleStart` per `jobId` counts each firing once. Events are delivered after the fact and in order, so a handler must not count on its own `ScheduleStart` having been handled when it runs. They are not persisted: a process that stops between running a job and handling its event loses that event. An error thrown by a subscriber is logged and does not affect the firing.

## The Schedule memory adapter

- The state — rules, next firings and firing counts — is read from `<persistence.path>/<namespace>.<scope>.json` in `setup()`. It is changed only in memory while the process runs, and written back whole in `shutdown()` after running handlers finish. A failed write makes `shutdown()` reject. A file that `setup()` could not read, because of an unknown format version or invalid JSON, is never overwritten.
- A process that ends without `shutdown()` — killed, out of memory, power loss — loses every change since it started, including firing counts, so a job with `limit` may run again. A consumer that writes its rules at every start, as shown above, gets them back.
- A firing missed while the process was stopped runs once after it starts, and the next firing is planned from the present.
- There is no lock. Each process holds its own copy: several processes on one state file each fire every job, and the one that shuts down last overwrites the others. Use the `redis` adapter for more than one process.

## The Schedule redis adapter

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
