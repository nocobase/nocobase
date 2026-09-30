# @nocobase/queue

Application queues for NocoBase: a producer publishes messages on a channel of a named queue, consumers registered on that queue receive them, and a manager adjusts the queue at runtime. The application's `QueueService` routes each queue to one of two implementations, chosen by the configuration key the queue selects.

| `adapter`  | Implementation                                                         | Deployment                                                                                                      |
| ---------- | ---------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| `redis`    | BullMQ 6.3.6 through its public `Queue` and `Worker` APIs              | Any number of instances share a queue and compete for its jobs                                                  |
| `inMemory` | `InMemoryQueueService`, in process memory, with a state file per queue | One process; unfinished jobs are written at a clean shutdown, and everything since start is lost on a hard kill |

The package holds no module-level service or registry and reads neither application settings nor the process environment. Applications compose it through `@nocobase/app-server/queue`, which supplies the application name, the storage directory and the logger; plugins resolve the application's service from `queueServiceToken` and never create one of their own.

## Queue or jobs

Background work belongs to `@nocobase/jobs` by default: a `JobExecutor` for one-off tasks that run outside the request and retry on failure, a `ScheduleExecutor` for recurring rules, and the Scheduler plugin when administrators should see and control a recurring task. Most of what the former `@nocobase/queue` Job classes did is a `JobExecutor` job now.

Use a queue only for what the executors do not have: a delay before a job may start, a priority, a job ID that deduplicates, a batch prepared and written as a whole, a global rate limit, cancelling a job that is running, or several handlers consuming each message, with `withChannel()` picking the channels each one handles. `Job` classes, `server/jobs` discovery and the `queue: { jobs }` plugin field belong to the former queue design and are not part of this package.

## Composing it in an application

The application templates already do this. `server/app.ts` adds the provider before the plugins that use it, passing the environment so the fallback warning stays quiet in development:

```ts
import { QueueServiceProvider } from '@nocobase/app-server/queue';

app.addServiceProvider(QueueServiceProvider, {
  nodeEnv: runtime.env.NODE_ENV,
});
```

`server/config/queue.ts` declares the configurations queues can select, and `server/config/index.ts` adds it to `defaultAppConfigs`:

```ts
import {
  defineAppConfig,
  type AppConfigFactory,
} from '@nocobase/app-server/config';
import type { AppQueueConfig } from '@nocobase/app-server/queue';

const queue: AppConfigFactory<AppQueueConfig> = defineAppConfig(
  ({ paths }) => ({
    memory: {
      adapter: 'inMemory',
      persistence: { path: paths.storage('queue') },
    },
    redis: {
      adapter: 'redis',
      connection: { host: '127.0.0.1', port: 6379, db: 0 },
      removeOnComplete: { count: 1000 },
      removeOnFail: { age: 604_800 },
    },
  }),
);

export default queue;
```

## Configuring it

The `queue` section has the same shape as `jobs`: `default` names one key, and every other key is one complete configuration. Keys never inherit from each other, and the section declares configurations, not queues: `queue.producer('reports')` creates the `reports` queue on the default key without any key mentioning it.

A queue's key is chosen when its first entry point is obtained: the `configKey` argument when that key exists, otherwise the key `queue.default` names, otherwise the built-in memory configuration `{ adapter: 'inMemory' }` with its state files under `storage/queue`. A queue stays bound to that key within the service, and asking for it under a key that resolves differently throws. Outside development the built-in configuration is reported once as a warning; set `queue.default: memory` to choose it explicitly and silence the report, or `queue.default: redis` to share queues across instances.

```yaml
queue:
  default: redis
  redis:
    adapter: redis
    namespace: crm # Defaults to the application name.
    connection:
      host: redis.internal
      port: 6379
    concurrency: 4
    rateLimit: { max: 10, duration: 1000 }
    attempts: 3
    backoff: { type: exponential, delay: 1000 }
```

| Field                                      | Default                              | Meaning                                                                                                          |
| ------------------------------------------ | ------------------------------------ | ---------------------------------------------------------------------------------------------------------------- |
| `adapter`                                  | required                             | `inMemory` for the in-process queue, `redis` for BullMQ                                                          |
| `queueBackend`                             | BullMQ's Redis backend               | `redis` only: the name of a BullMQ backend factory registered with `registerBackend()`                           |
| `connection`                               | required for BullMQ's Redis backend  | BullMQ connection options, handed over as they are, or what the named factory interprets; `inMemory` takes none  |
| `persistence.path`                         | `storage/queue`                      | `inMemory` only: the directory of the state files                                                                |
| `namespace`                                | the application name                 | Isolates applications sharing a backend                                                                          |
| `concurrency`                              | `1`                                  | Jobs of one queue this instance runs at once                                                                     |
| `rateLimit`                                | untouched                            | `{ max, duration }` starts per window across every instance of one physical queue; `null` removes a stored limit |
| `attempts`, `backoff`                      | `1`, none                            | Tries per job and the retry delay; only BullMQ's `fixed` and `exponential` strategies are accepted               |
| `removeOnComplete`, `removeOnFail`         | `{ count: 1000 }`, `{ age: 604800 }` | How many finished jobs are kept; `age` is in seconds                                                             |
| `jobIdProducer`                            | none                                 | `(queue, channel, message) => string`; code configuration only                                                   |
| `setupTimeoutMs`                           | `10000`                              | Initialization budget of each queue                                                                              |
| `shutdownTimeoutMs`, `cancellationGraceMs` | `30000`, `5000`                      | Wait for running jobs at shutdown, then send the shutdown signal and wait this much longer                       |

A section in the former format — `connections`, `worker` and `jobs` — is ignored with one warning. Its `default` is ignored too unless it names a key of the current format, so an application that has not migrated its configuration starts on the built-in memory configuration instead of failing.

The namespace and the logical queue name identify a physical queue; the configuration key does not. Renaming a key or re-pointing `default` keeps reaching the same jobs as long as the backend, the connection target and the namespace stay the same. `appName` is not unique across deployments, so deployments sharing a Redis set distinct namespaces.

## Using it in a plugin

A plugin registers handlers in `boot()`, publishes once the service is set up, and waits for its handlers to unregister before releasing what they use:

```ts
import { queueServiceToken } from '@nocobase/app-server/queue';
import { withChannel, type UnregisterHandler } from '@nocobase/queue';

export class EmailConsumerProvider extends ServiceProvider<AppPluginApplication> {
  public readonly name: string = 'email-consumer';
  private unregister: UnregisterHandler | undefined;

  public override boot(): void {
    const queue = this.app.container.resolve(queueServiceToken);
    this.unregister = queue.consumer('email').consume(
      withChannel('send', async (_channel, message, signal) => {
        await sendEmail(message, signal);
      }),
    );
  }

  public override async shutdown(): Promise<void> {
    await this.unregister?.();
    this.unregister = undefined;
  }
}

// After setup, for example in a route handler:
await queue.producer('email').publish('send', { to: 'user@example.com' });
```

A plugin that reads a configuration key from its own settings passes it as the second argument of `producer()`, `consumer()` and `manager()`. The provider's `start()` calls `setup()`, so a plugin's `boot()` can register handlers and configure queues but cannot publish yet. A plugin that registers a backend factory does so in `register()`, before `setup()` freezes the registry:

```ts
public override register(): void {
  this.app.container.resolve(queueServiceToken).registerBackend('custom', customBackendFactory);
}
```

A configuration selects the factory with `adapter: redis` and `queueBackend: custom`; without `queueBackend` it runs on BullMQ's own Redis backend, whose name `redis` cannot be registered again. Names are unique per service. A backend factory is BullMQ's `BackendFactory`; it receives the configuration's `connection` as BullMQ's `opts.connection` and interprets it.

## Publishing

`publish(channel, message, options?)` and `publishMany([{ channel, message }], options?)` return `{ jobId }` once the backend accepted the job, not once it ran. The channel becomes BullMQ's `job.name`.

- **Messages** follow BullMQ's JSON rule: a top-level `undefined` becomes `{}`, a `Date` becomes its ISO string, and cycles, BigInt and roots with no JSON form are rejected. The message is serialized once, when published; BullMQ stores `{ version: 1, payload }` with the JSON text as `payload`, and a job without that envelope fails without a retry.
- **Options** are `priority`, `delay` in milliseconds, `attempts`, `backoff`, `removeOnComplete`, `removeOnFail` and `jobIdProducer`. They override `manager.configure()`, which overrides the configuration key, which overrides the built-in defaults. Jobs without a priority run first; prioritized ones follow, lowest number first.
- **Job IDs** come from the `jobIdProducer`, or from the backend when there is none. BullMQ's rules apply to custom IDs: no integers, and no `:` unless the ID has exactly three parts. Publishing an ID that still exists adds nothing and returns that ID; once the job has been removed from the history, the same ID can be published again. It is deduplication, not a permanent idempotency guarantee.
- **Batches** are prepared entirely — serialization, options and IDs — before anything is written, so a preparation failure writes nothing. `InMemoryQueueService` then writes the batch at once. BullMQ's Redis backend writes a batch in a pipeline, which a server error or a lost connection can leave partly written; retry a batch with stable job IDs.
- **Budget**: one publish, including a queue's lazy initialization, has 10 seconds. A timeout does not mean nothing was written.

## Consuming

`consume(handler)` adds a handler and returns the function that removes it. On each job, the queue takes a snapshot of its handlers and runs all of them in parallel, each with its own copy of the message, then settles the job: it completes when every handler succeeded and fails when any failed, in which case every handler runs again on the retry. Handlers must be idempotent and must not depend on each other's order. A handler that skips a channel returns normally; a job every handler skipped completes.

Unregistering keeps the handler out of new snapshots and resolves once its calls already in a snapshot have settled. Never await a handler's own unregistration inside the handler: it waits for itself. When the last handler leaves, this instance stops taking the queue's jobs, and a job taken in that moment returns to waiting; registering again resumes. Other instances keep consuming a shared queue, and jobs published while a plugin is shutting down may be completed by the handlers still registered.

One queue has one worker per service, whatever the number of handlers, and `concurrency` is its parallelism. Instances sharing a queue compete for its jobs rather than each running every job.

## Managing a queue

`manager(queue)` returns:

- `configure({ concurrency, attempts, backoff, removeOnComplete, removeOnFail, jobIdProducer, rateLimit })` changes this instance's settings. Before `setup()` it changes what the queue opens with; afterwards it resolves once the change applies. Calls on one queue run in order, invalid input changes nothing, and the backend's rate limit is written after the local settings, so a failure there leaves the local change in place. Job defaults apply to jobs published afterwards.
- `drain({ delayed })` removes waiting jobs, and delayed ones with `delayed: true`, from the physical queue — for every instance sharing it. Running jobs and the history are untouched.
- `cancelJob(jobId, reason?)` and `cancelAllJobs(reason?)` abort the signal of jobs this instance is running. A cancelled job fails without a retry, even if its handler ignores the signal and returns. Jobs running on other instances, and waiting jobs, are not affected.

## Setup and shutdown

`setup()` freezes the backend registry, validates every configuration key and backend name, initializes every queue requested so far, and only then starts the workers of queues with handlers. Any failure fails the whole setup and releases what was initialized; there is no fallback to memory. After setup, a queue requested for the first time initializes on first use, and a failure there stays with that queue.

`shutdown()` is idempotent. For each queue it stops taking jobs and waits `shutdownTimeoutMs` for running jobs, then sends the shutdown signal and waits `cancellationGraceMs`. The shutdown signal is not a cancellation: a job whose handlers stop on it returns to waiting without spending an attempt. Handlers can still publish while running jobs finish; new publishes are then refused, accepted ones settle, and the queue is closed. A handler still running after the grace period makes `shutdown()` reject: closing a connection does not stop code. On BullMQ, such a job is recovered by lock expiry and stalled detection.

## The inMemory implementation

`InMemoryQueueService` keeps each queue in process memory and implements the same contract without BullMQ: serialization round trips, whole-batch writes, concurrency, the rate limit, delays, priorities, retries with backoff, job ID deduplication, cancellation and shutdown. Queues of different services never share jobs, even with the same namespace and name.

Each queue reads `<persistence.path>/queue.<base64url(JSON.stringify([namespace, queue]))>.state.json` when it initializes and replaces it through a synced temporary file at shutdown. It records waiting jobs, delayed jobs with their due time, and jobs the shutdown interrupted, which do not count as failures. The history is kept in memory only, so a finished job's ID can be published again after a restart. A file that fails validation stops the queue from initializing and is never overwritten. The file is not locked: one process owns it, so processes of one application, or different applications, must not share a `persistence.path` with the same namespace and queue. A process killed without shutting down loses every change since it started, and jobs completed since then run again.

## Redis

A queue's BullMQ prefix is `nbq:{<sha256 of JSON.stringify([namespace, queue])>}` and its BullMQ name is `q-` followed by the base64url of the queue name, so every key of one queue shares a hash tag. The ioredis `keyPrefix` option is not supported. Redis Cluster is not supported yet: BullMQ builds a single-node client from connection options, and a Cluster needs a client instance whose lifecycle this package would have to own.

Redis must persist its data (AOF or RDB) and use `maxmemory-policy noeviction`. A disconnected Redis never falls back to memory; BullMQ reconnects and resumes, and the queue and worker errors it reports are written to the logger.

## Testing

`pnpm test` runs the unit tests and the shared contract against `inMemory`. `pnpm test:integration` starts a disposable Redis with Docker Compose and runs the same contract against `redis`, plus Redis-specific tests; set `KEEP_TEST_REDIS=1` to keep the container. Run one integration suite at a time.

In an application's tests, point `persistence.path` at a temporary directory, or select a `memory` key that does, so state files stay out of the working tree.
