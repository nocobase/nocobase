# Server contributions

Use this reference when a plugin needs HTTP routes, background jobs, queues, or a Server declaration. Read [services.md](./services.md) for reusable domain services and lifecycle ownership, and [database.md](./database.md) for database structure, initial data, and Repository APIs.

## Choose the owning module

| Requirement                                                    | Owner                                                           |
| -------------------------------------------------------------- | --------------------------------------------------------------- |
| Reusable domain behavior                                       | Service, optionally registered through a `ServiceProvider`      |
| Stable cross-module capability identity                        | `ServiceToken<T>` owned and exported by the capability provider |
| HTTP input, output, authentication, and authorization          | Root or API Route contribution                                  |
| Deferred or retryable one-off work                             | `JobExecutor` job owned by a Provider                           |
| Recurring work                                                 | `ScheduleExecutor` rule, or Scheduler when administrators track it |
| Delayed, prioritized, deduplicated, rate-limited or fan-out messages | Queue handler registered by a Provider                   |
| Table, field, relation, index, constraint, or metadata history | Migration                                                       |
| Required initial records in an existing schema                 | Seed                                                            |

Keep these boundaries visible in the code. A Route maps HTTP to a Service call. A job or queue handler validates a JSON payload and orchestrates one asynchronous execution. A Service implements reusable behavior without Hono context, status codes, paths, or retry policy. A Provider registers dependencies and owns resource lifecycle.

## Declare the Server plugin

Compose direct contributions in `server/plugin.ts` and re-export that definition from `server/index.ts`:

```ts
import path from 'node:path';

import {
  defineServerPlugin,
  type AppServerPlugin,
} from '@nocobase/app-server/plugins';

import locales from './locales/index.js';
import serviceProviders from './providers/index.js';
import routes from './routes/index.js';

const plugin: AppServerPlugin = defineServerPlugin({
  baseDir: path.resolve(import.meta.dirname, '..'),
  packageName: '@nocobase/app-plugin-audit-log',
  locales,
  serviceProviders,
  routes,
  database: {
    migrations: './database/migrations',
    seeds: './database/seeds',
  },
});

export default plugin;
```

Declare only capabilities the plugin implements. Provider constructors and Route definitions are direct contributions. Migrations and seeds are filesystem locations relative to `baseDir`. The `queue: { jobs }` field is deprecated and ignored: nothing is discovered from `server/jobs/`, and a plugin still declaring it is reported at startup. The target App must import the plugin's `./server` export and include the definition in its explicit `server/plugins.ts` composition; installing the package alone does not activate it.

### `baseDir` is part of the runtime contract

Every Server plugin must provide an absolute `baseDir`. In a source `server/plugin.ts`, `path.resolve(import.meta.dirname, '..')` points to the package root. In the compiled `dist/server/plugin.js`, the same expression points to `dist`. The runtime resolves migrations, seeds, and package metadata only from the loaded copy; it does not search a source fallback, a build fallback, or a directory selected from `NODE_ENV`.

Filesystem contribution paths must be safe `baseDir`-relative paths beginning with `./`; `..`, backslashes, doubled separators, and the bare `./` are rejected. The resolver walks upward from `baseDir` until it finds a `package.json` whose `name` equals `packageName`. Keep source and published `./server` exports aligned so each loads its matching declaration, and ensure compiled resources are present below `dist`.

Declaration modules must remain import-safe. Top-level code may create frozen definitions, tokens, and constructor arrays; it must not connect to a database, start a worker, create a timer, make a network request, instantiate a Provider, or execute a Route factory. App composition imports these modules before any lifecycle runs.

## Root and API routes

NocoBase Server routes are Hono routers contributed directly by a plugin:

Read [Server Route examples](./server-route-examples.md) for complete authenticated API, independently protected Root Route, public callback, authentication-and-authorization, isolated child-router, composition, and production `createRouter()` test patterns.

| Need                                             | API                  | Source path          | Mounted path         |
| ------------------------------------------------ | -------------------- | -------------------- | -------------------- |
| App business or administration API               | `defineApiRoutes()`  | `/orders`            | `/api/orders`        |
| Top-level callback, webhook, or other root entry | `defineRootRoutes()` | `/callbacks/payment` | `/callbacks/payment` |

Do not repeat `/api`, an App name, or a deployment public base path in the source path. Mount scope is not a security policy: `/api` does not authenticate a request, and a Root Route does not inherit middleware from another contribution.

### Own the security boundary

Each contribution installs and tests its own authentication and authorization. Restrict middleware to an explicit path owned by the plugin, or to an isolated child router mounted below that path. Avoid `router.use('*', ...)` on a contribution-wide router because it can affect later contributions after composition.

```ts
import { authenticationToken } from '@nocobase/app-plugin-authentication';
import type { AppPluginApplication } from '@nocobase/app-server/plugins';
import {
  defineApiRoutes,
  type AppApiRouteContribution,
} from '@nocobase/app-server/router';
import { Hono } from 'hono';

export const apiRoutes: AppApiRouteContribution<AppPluginApplication> =
  defineApiRoutes(({ container }) => {
    const router = new Hono();
    const authentication = container.resolve(authenticationToken);

    router.use('/audit-log/status', authentication.required());
    router.get('/audit-log/status', (context) =>
      context.json({ enabled: true }),
    );

    return router;
  });
```

This status endpoint deliberately permits every authenticated user. Authentication establishes who the caller is; authorization establishes whether that caller may perform the business action. Sensitive routes normally need both. Resolve the owner-exported authorization token, install its middleware, and require stable resource/action pairs inside handlers. Test `401` for anonymous callers, `403` for authenticated callers without the action, and success for an allowed caller.

A third-party webhook may intentionally omit NocoBase session authentication, but it still owns an explicit protocol boundary. Verify signatures or one-time state, timestamps, replay prevention, body limits, and idempotency as required by the protocol; return only necessary information. Record why the endpoint is public and test missing, invalid, valid, and duplicate deliveries.

### Organize and compose routes

Keep one or two handlers directly inside the contribution factory. When a business area has multiple handlers, shared HTTP error mapping, or a useful independent test boundary, extract `createOrderRoutes(options): Hono` and mount the returned router. Do not invent a framework-level `registerOrderRoutes(router, ...)` API that mutates a caller-owned router merely to make tests convenient.

Aggregate Root and API contributions in a stable array and give that array to `defineServerPlugin()`:

```ts
import type { AppPluginApplication } from '@nocobase/app-server/plugins';
import type { AppRouteContribution } from '@nocobase/app-server/router';

import { apiRoutes } from './api.js';
import { rootRoutes } from './root.js';

const routes: readonly AppRouteContribution<AppPluginApplication>[] = [
  rootRoutes,
  apiRoutes,
];

export default routes;
```

### Test the production contribution

Call the real contribution's `createRouter()` with an isolated `ServiceContainer`; this exercises the same dependency resolution, middleware installation, and handler factory used in production. Do not replace this with a test-only registration helper.

The [complete production contribution test](server-route-examples.md#test-the-production-contributions) creates a real `Auth` against an in-memory SQLite connection, controls its session lookup, binds the original service Tokens, and constructs a fully typed `AppPluginApplication`. It calls `createRouter()` directly and tests the mounted endpoints without partial `Auth` casts or an undefined test helper.

Also compose a later unrelated route and verify the plugin middleware does not leak into it. Contribution tests do not prove final mount prefixes, public base paths, interaction among multiple contributions, or real authentication; cover those in a target App integration test.

## Background work

Choose by what the work needs, not by which API is closest:

| The work                                                                                                          | Use                                                                                    |
| ----------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| Runs once, outside the request that caused it, and retries on failure                                             | `JobExecutor` from `@nocobase/jobs` — the default                                      |
| Recurs by cron or interval, and nobody tracks it in the UI                                                        | `ScheduleExecutor` from `@nocobase/jobs`                                               |
| Recurs, and administrators view, enable, disable and track it                                                     | The Scheduler plugin; see its `nocobase-app-plugin-scheduler` Skill                     |
| Needs a delay, a priority, a job ID that deduplicates, an atomic batch, a global rate limit, cancelling a running job, or several handlers per message | `@nocobase/queue`                                                                      |

Both executors come from the application's jobs service, `jobExecutorServiceToken` in `@nocobase/app-server/jobs`, under the plugin's package name as the scope; declare `@nocobase/jobs` as a peer. The application's `jobs` configuration decides the backend: `memory` serves one process, and more than one instance needs `redis`. A plugin that lets the App choose reads a configuration key from its own settings, as Notification reads `notification.jobs`, and passes it as the second argument of `getJobExecutor()` or `getScheduleExecutor()`.

### One-off jobs

A job is a class extending `Job<TPayload>` with a stable `static jobName` and a constructor that takes only its payload. The Provider that owns the executor registers every class and sets the executor up in `start()`, and shuts it down in `shutdown()`. `pnpm plugin:create --with server.jobs` generates this shape. A job that calls a Service gets it by closure: the Provider creates the class with a factory that captures the Service and registers that class, as Notification's `createDeliveryJob(channelManager)` does. Each executor keeps its own registry, so the class that registered is the one that runs.

```ts
import { jobExecutorServiceToken } from '@nocobase/app-server/jobs';
import type { AppPluginApplication } from '@nocobase/app-server/plugins';
import { Job, type JobClass, type JobExecutionContext, type JobExecutor } from '@nocobase/jobs';
import { ServiceProvider } from '@nocobase/service-provider';

import { searchIndexServiceToken, type SearchIndexService } from '../tokens.js';

export interface RebuildIndexPayload {
  readonly collection: string;
}

export function createRebuildIndexJob(searchIndex: SearchIndexService): JobClass<RebuildIndexPayload> {
  return class RebuildIndexJob extends Job<RebuildIndexPayload> {
    // Stored with every queued task: keep it stable across renames.
    public static readonly jobName: string = '@nocobase/app-plugin-audit-log/rebuild-index';

    public async execute({ signal }: JobExecutionContext): Promise<void> {
      // Idempotent work keyed by a business key; honour the signal.
      await searchIndex.rebuild(this.payload.collection, signal);
    }
  };
}

export class SearchIndexJobsProvider extends ServiceProvider<AppPluginApplication> {
  public readonly name: string = '@nocobase/app-plugin-audit-log/jobs';
  private executor: JobExecutor | undefined;

  public override async start(): Promise<void> {
    const executor = this.app.container
      .resolve(jobExecutorServiceToken)
      .getJobExecutor('@nocobase/app-plugin-audit-log');
    const RebuildIndexJob = createRebuildIndexJob(this.app.container.resolve(searchIndexServiceToken));
    // Register every class before setup(): a task waiting from an earlier run must find its handler.
    executor.registerJob(RebuildIndexJob);
    await executor.setup();
    this.executor = executor;
  }

  public override async shutdown(): Promise<void> {
    await this.executor?.shutdown();
    this.executor = undefined;
  }
}

// After start(), wherever the Provider hands the executor and class, such as a Service it registers:
const receipt = await executor.addJob(new RebuildIndexJob({ collection: 'auditLogs' }));
```

- **Payload.** Strict JSON, snapshotted when submitted; every attempt rebuilds the class from it in whichever process runs it. The constructor receives nothing else, and a job never resolves the container itself: Services come through the factory's closure. Pass identifiers, never Services, request contexts, connections, functions or secrets.
- **Receipt.** `addJob` resolves once the backend accepted the task, with `{ jobId, jobName, enqueuedAt }`; it does not mean the task ran. A producer-only process calls `setup({ consume: false })`.
- **Retries.** `attempts` comes from the selected `jobs` configuration. Any thrown error is a failure and retries within it; `signal.throwIfAborted()` or `JobInterruptedError` while the signal is aborted marks work interrupted by shutdown, which returns to waiting without spending an attempt.
- **Observability.** `executor.subscribe()` reports `JobStart`, `JobProgress`, `JobEnd` and `JobError` for this instance's attempts; `reportProgress(percent)` in `execute` feeds `JobProgress`. They describe attempts, not durable acknowledgements.
- **Idempotency.** Assume at-least-once execution. Key external effects — email, external APIs, billing, file writes — by `jobId` or a business key with durable execution state, and never remember completion in a process-local `Map`.

There is no delay, priority, custom job ID or cancellation of a running task; reach for a queue when the work needs one of those. `packages/examples/app-plugin-jobs-example` is a runnable plugin with progress reporting.

### Recurring jobs

`getScheduleExecutor(scope)` returns an executor for cron and interval rules: `addJob({ name, options: { cron, tz } | { every }, payload, execute })` for each rule in `start()`, then `setup()`, and `shutdown()` in `shutdown()`. A rule is stored, so it survives restarts and fires on one instance under `redis`; do not remove rules on shutdown. Keep `execute` to one Service call, and hand work that runs for minutes to a `JobExecutor` rather than holding the schedule executor's slot. When administrators should see and control the task, register a Scheduler schedule instead of a rule of your own. The `@nocobase/jobs` README describes rule options and receipts.

### Queues

Use a queue only for what the executors do not have: a delay, a priority, a job ID that deduplicates, an atomic batch, a global rate limit, cancelling a running job, or several handlers consuming each message. The application owns one `QueueService`; resolve it from `queueServiceToken` in `@nocobase/app-server/queue` and declare `@nocobase/queue` as a peer.

```ts
import type { AppPluginApplication } from '@nocobase/app-server/plugins';
import { queueServiceToken } from '@nocobase/app-server/queue';
import { withChannel, type UnregisterHandler } from '@nocobase/queue';
import { ServiceProvider } from '@nocobase/service-provider';

import { exportServiceToken } from '../tokens.js';

export class ExportQueueProvider extends ServiceProvider<AppPluginApplication> {
  public readonly name: string = '@nocobase/app-plugin-audit-log/exports';
  private unregister: UnregisterHandler | undefined;

  public override boot(): void {
    const queue = this.app.container.resolve(queueServiceToken);
    const exports = this.app.container.resolve(exportServiceToken);
    this.unregister = queue
      .consumer('@nocobase/app-plugin-audit-log/exports')
      .consume<{ readonly exportId: string }>(
        withChannel('run', async (_channel, message, signal) => {
          await exports.run(message.exportId, signal);
        }),
      );
  }

  public override async shutdown(): Promise<void> {
    // Running calls finish before the Service they use goes away.
    await this.unregister?.();
    this.unregister = undefined;
  }
}

// Once the application runs: run the export ten minutes from now, once per export.
await queue
  .producer('@nocobase/app-plugin-audit-log/exports')
  .publish('run', { exportId }, { delay: 600_000, jobIdProducer: () => `export-${exportId}` });
```

Register handlers in `boot()`: the application's queue provider sets the service up in its `start()`, after every provider has booted, so nothing publishes before the application starts. `manager(queue).configure()` may run in `boot()`; a plugin bringing a BullMQ backend factory registers it with `registerBackend(name, factory)` in `register()`, and a configuration selects it with `adapter: redis` and `queueBackend: <name>`. Name queues after the package. Messages are JSON, serialized once. Every handler of a queue runs for every job and the job completes only when all succeed, so each handler is idempotent. Honour the signal: `manager(queue).cancelJob(jobId)` fails a running job without a retry, and the shutdown signal returns an interrupted job to waiting. Never await a handler's own unregistration inside it. The `@nocobase/queue` README has the full contract, and `packages/examples/app-plugin-queue-example` is a runnable plugin.

### Test background work

Test the real Provider against a service created for the test, with its memory state under a temporary directory: `createJobExecutorService(undefined, { appName, storagePath })` for jobs, or `createQueueService({ default: 'memory', memory: { adapter: 'inMemory', persistence: { path } } }, …)` for queues. Start or set up, submit or publish, wait for the effect, and shut down. Cover retry, idempotency and, for queues, deduplication, then run a target App integration test. A Route that submits work still needs its own authentication and authorization tests.

## Verification and source references

Run the modified plugin's `lint`, `typecheck`, `test`, and `build`, plus the affected target App checks. Use `pnpm nocobase plugin inspect <name> --workspace-root . --app <app> --json` only when registration is in question; it reads static registration facts and does not prove Route security, Provider lifecycle, job or queue execution, migrations, or seeds.

Use these maintained implementations when a detail is uncertain:

- App Server plugin contract (`packages/app/app-server/src/plugins/types.ts`)
- Server plugin path resolution (`packages/app/app-server/src/plugins/resolve.ts`)
- Application startup and Route mounting (`packages/app/app-server/src/application/index.ts`)
- Runnable Route plugin (`packages/examples/app-plugin-routes-example`)
- Runnable jobs plugin (`packages/examples/app-plugin-jobs-example`)
- Runnable Queue plugin (`packages/examples/app-plugin-queue-example`)
