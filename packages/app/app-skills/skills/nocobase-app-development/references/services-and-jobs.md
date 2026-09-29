# Services and background jobs

A service holds reusable domain logic. A job runs work outside the request that triggered it.

## Services

Put domain logic in a service under `server/providers/` once more than one route needs it, or once it is worth testing on its own. A route that only reads and returns a list may query directly.

A service is registered by a provider under a token, so anything in the application can resolve it without importing the implementation:

```ts
// server/providers/orders.ts
import type { Application } from '@nocobase/app-server/application';
import { databaseManagerToken } from '@nocobase/db';
import {
  createServiceToken,
  ServiceProvider,
  type ServiceToken,
} from '@nocobase/service-provider';

export interface OrderService {
  list(): Promise<Order[]>;
  create(input: CreateOrderInput): Promise<Order>;
}

export const orderServiceToken: ServiceToken<OrderService> =
  createServiceToken<OrderService>('app/order-service');

export default class OrderProvider extends ServiceProvider<Application> {
  public readonly name: string = 'app/order-provider';

  public override register(): void {
    this.app.container.singleton(orderServiceToken, () => {
      const database = this.app.container.resolve(databaseManagerToken);
      return createOrderService(database);
    });
  }
}
```

Add the provider to the array in `server/providers/index.ts` and export its token from there so routes can import it.

Resolve it where you need it:

```ts
const orders = app.container.resolve(orderServiceToken);
```

**The token is the identity.** Two `createServiceToken` calls with the same name are two different keys — the container matches by object identity. Always import the token from where it is defined rather than recreating one.

`singleton` builds the service once, on first resolve. Use `instance` for an already-constructed value.

Keep the layers apart: a service should not read a Hono context, return HTTP status codes, or decide retry behavior. It takes its dependencies and returns domain results.

## Provider lifecycle

| Method       | Runs                             | For                                              |
| ------------ | -------------------------------- | ------------------------------------------------ |
| `register()` | Assembly, before anything starts | Binding tokens. Do not connect or start anything |
| `boot()`     | After all providers registered   | Work needing other services                      |
| `start()`    | Application start                | Long-lived resources: listeners, pollers         |
| `shutdown()` | Application stop                 | Releasing what `start()` acquired                |

Declaration modules must not connect to a database or start a worker at module top level.

## Client-side services

The client has the same pattern. `client/service-provider.ts` holds application startup logic. In React components and custom Hooks, use `useApiClient()` to resolve the application's HTTP client and `useService(token)` to resolve other services:

```tsx
const api = useApiClient();
const realtime = useService(realtimeClientToken);
```

## Ordinary one-off tasks

Use `JobExecutor` from `@nocobase/jobs` for immediate one-off tasks with payload-only classes. Resolve the existing `jobExecutorServiceToken` from `@nocobase/app-server/jobs` and call `getJobExecutor(scope, name?)`; do not add another provider, token, global registry or service container. Keep these classes outside the automatically discovered `server/jobs/` directory, which belongs to the separate `@nocobase/queue` contract below.

```ts
import { jobExecutorServiceToken } from '@nocobase/app-server/jobs';
import { Job, type JobExecutionContext } from '@nocobase/jobs';

class PublishDocument extends Job<{ url: string; documentId: string }> {
  public static readonly jobName: string = 'documents.publish';

  public async execute({ jobId, signal }: JobExecutionContext): Promise<void> {
    const response = await fetch(this.payload.url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Idempotency-Key': jobId },
      body: JSON.stringify({ documentId: this.payload.documentId }),
      signal,
    });
    if (!response.ok) throw new Error(`Publication failed: ${response.status}`);
  }
}

// In the owning provider's start(), before any task can be consumed:
const executor = app.container
  .resolve(jobExecutorServiceToken)
  .getJobExecutor('@acme/crm');
executor.registerJob(PublishDocument);
await executor.setup();

// In the submission path, after setup; validate the target URL before enqueueing.
const receipt = await executor.addJob(
  new PublishDocument({
    url: 'https://publisher.example/documents',
    documentId: 'document-42',
  }),
);
```

Every class declares its own stable `static jobName` and has a side-effect-free constructor accepting only payload. There is no factory API or injected service, database, logger or container. `addJob` auto-registers the submitted class locally, but every consuming process must register all expected classes before `setup()` to handle already-queued work. Re-registering the same class and name is idempotent; another class under that name rejects. A producer-only process uses `setup({ consume: false })`. Adding before setup starts rejects; adding during setup waits. Both setup and shutdown are idempotent, and the first setup call fixes whether the executor consumes.

Payloads are snapshotted immediately and must be strict JSON data, not functions, services, `Date` instances, undefined, non-finite numbers, cyclic objects or accessors. Each task attempt reconstructs a new instance from that snapshot; submitted instances and their extra state never reach the backend. `receipt.jobId` identifies backend-accepted work, not completed work. Make external effects idempotent with a stable business key or `jobId`. Local `JobStart`, `JobProgress`, `JobEnd` and `JobError` events describe attempts, not durable acknowledgements; an error event need not mean final failure. Report progress from `execute` with `await reportProgress(percent)` (0 to 100); it restarts with every attempt, and the provider forwards `JobProgress` wherever the UI reads it, such as a realtime topic. `attempt` counts execution starts including recovery, not the failures spent against configured `attempts`.

The selected `jobs` configuration supplies concurrency, attempts and retention; `getJobExecutor` accepts no overrides. Omitted, `default`, and unknown names that select the same configuration share an executor. Physical identity ignores the configuration key: keys with the same connection or storage path, namespace and scope reach the same tasks, so renaming a key keeps pending work, and a separate `namespace` isolates a configuration. Concurrency is per worker; FIFO waiting claims do not guarantee completion order. Use Redis for multiple processes. Memory reads pending-only snapshots at setup and writes them at shutdown in files separate from Schedule; forced exit can lose new tasks or replay completed work. See the `@nocobase/jobs` README for persistence identities and configuration.

Call `executor.shutdown()` in the owning provider's shutdown hook; the application's existing jobs provider also closes every ordinary and Schedule executor left open. Shutdown aborts running signals and waits for handlers. A successful handler return completes the task even if its signal was aborted. Only `signal.throwIfAborted()` or `JobInterruptedError` while the signal is aborted marks unfinished work for recovery without spending the ordinary failure budget; any other exception is a normal failure. Do not throw an interruption after committing a completed effect.

## Queue jobs

Existing `@nocobase/queue` integrations and capabilities such as delayed dispatch use a different `Job` contract under `server/jobs/`:

```ts
// server/jobs/rebuild-index.ts
import { Job, type JobOptions } from '@nocobase/queue';

export interface RebuildIndexPayload {
  readonly collection: string;
  readonly requestedAt: string;
}

export default class RebuildIndexJob extends Job<RebuildIndexPayload> {
  public static options: JobOptions = {
    name: 'app/rebuild-index',
    queue: 'default',
  };

  public async execute(): Promise<void> {
    // Validate the payload, then call a reusable domain operation.
  }
}
```

Jobs in `server/jobs/` are discovered automatically. Review `server/plugins.ts` and each registered plugin’s job declarations when checking contributions.

Dispatch by resolving the queue manager:

```ts
const queue = app.container.resolve(queueManagerToken);

await queue.dispatch(RebuildIndexJob, {
  collection: 'orders',
  requestedAt: new Date().toISOString(),
});
```

### What a payload may contain

Only serializable data. A worker may run in another process and rebuilds the payload from storage, so a service instance, a database connection, a request context, a function, or a secret cannot survive the trip. Pass an ID and resolve the object inside `execute()`.

`options.name` is the stable identity of queued work. Do not rely on the class name — a rename would orphan everything already queued.

### Retries and idempotency

A job may run more than once: a retry after a transient failure, or a duplicate delivery. Anything with an external side effect — mail, payment, a file write — needs a stable business key or persisted execution state so a second run is harmless.

Distinguish a transient failure worth retrying from a bad-input failure that never will be. Do not keep completion state in a module-level variable; another process will not see it.

By default the job factory supplies `database` and `logger`, not the service container. Do not assume `container.resolve()` inside a job. Extract shared logic into a function taking explicit dependencies, and construct it from what the job has.

The default queue connection is `sync`, which runs jobs inline — convenient in development, and the reason a job that appears to work locally may behave differently against a real queue.

## Work that runs on a schedule

A job runs when something dispatches it. Work that has to happen _because time passed_ — scan for records overdue today, send a nightly digest, expire stale sessions — needs a scheduler, and the application's jobs service provides one. If administrators need to see the task and its runs in the UI, register a Scheduler schedule instead, as the Scheduler plugin's Skill describes; the service below is for work nobody tracks there.

Resolve `jobExecutorServiceToken` and ask it for an executor of your own, with your package name as the scope. Register the jobs, then call `setup()`, both in `start()`, and shut the executor down in `shutdown()`:

```ts
import { jobExecutorServiceToken } from '@nocobase/app-server/jobs';
import type { ScheduleExecutor } from '@nocobase/jobs';

export default class OverdueScanProvider extends ServiceProvider<Application> {
  public readonly name: string = 'app/overdue-scan-provider';

  private executor: ScheduleExecutor | undefined;

  public override async start(): Promise<void> {
    this.executor = this.app.container
      .resolve(jobExecutorServiceToken)
      .getScheduleExecutor('@acme/crm');
    await this.executor.addJob({
      name: 'overdue-scan',
      options: { cron: '0 8 * * *', tz: 'Asia/Shanghai' },
      payload: {},
      execute: async ({ jobId, signal }) => {
        // Keep this thin: resolve the service and call it.
      },
    });
    await this.executor.setup();
  }

  public override async shutdown(): Promise<void> {
    await this.executor?.shutdown();
  }
}
```

The rule is stored, not just held in memory: `addJob` writes it on `setup()` and leaves it alone when nothing changed, and `shutdown()` stops this instance without removing it. `removeJob(name)` deletes a job you no longer define; `getJob` and `listJob` show when each fires next. A job's `name` must be stable and may not contain `:`. `cron` takes five or six fields, `tz` defaults to UTC, and `every`, `limit`, `startDate` and `endDate` are the other options. The types come from `@nocobase/jobs`, which the application already depends on.

Keep `execute` thin. It should resolve a service and call one method, so the behavior stays testable without waiting for a schedule; test that method directly and let the schedule only decide when it runs. `jobId` identifies the firing, and is the key to make its effect idempotent.

Two things to decide before shipping one:

- **More than one instance.** `jobs.default` decides. The `redis` adapter runs each firing on exactly one instance, however many there are. The `memory` adapter — also what runs when no default is set — keeps its state in the process and writes it under `storage/jobs` when the application stops: it serves one process, every other process or instance would fire its own copy, and a process that is killed loses what changed since it started. Configure `redis` before scaling out.
- **Long or heavy work.** A firing that runs for minutes holds one of the executor's slots. Prefer one that dispatches a job and returns, which also gets you the queue's retry behavior.

## Verify

- The service resolves from the token and behaves correctly in isolation.
- Provider lifecycle releases in `shutdown()` what `start()` acquired, including ordinary and schedule executors.
- Ordinary job classes are registered before consumption, accept only strict JSON payloads, and reconstruct a fresh instance for each attempt; do not rely on queue-job dependency injection.
- The job runs with a realistic payload, and running it twice is harmless.
- A failure retries or terminates as intended.
- A scheduled job's work is tested directly, and a deployment of more than one instance runs it on the `redis` jobs adapter.

### Application code configuration

Each file under `server/config/` defines one section with `defineAppConfig` from `@nocobase/app-server/config`. `server/config/index.ts` imports those sections and exports `defaultAppConfigs({ auth })`. The client uses the same helpers from `@nocobase/app-client`, in their function form only.

On the server, `defineAppConfig((runtime) => options)` declares defaults alone. The object form adds rules:

```ts
const billing: AppConfigFactory<BillingConfig> = defineAppConfig({
  defaults: { currency: 'USD', trialDays: 14 }, // or (runtime) => ({ ... })
  async validate(value, ctx) {
    if (value.trialDays < 0) ctx.error('trialDays', 'must not be negative.');
  },
  public: ['currency'],
});
```

- `validate` receives the section's final value — code defaults, then `config.yml`, then environment mappings — and reports with `ctx.error(path, message, { fix })` or `ctx.warning(path, message)`, paths relative to the section. It runs at startup, on reload and in `pnpm nocobase config check`; an error stops the start and refuses the reload. Treat the value as untrusted input. It may read local files but must not reach the network or write anything; database reachability stays with `config check`.
- `public` lists leaf fields the browser may read. The browser reads them with `config.public.get('<section>.<field>')`, never `config.get`, which in development throws when asked for a published path. Anything not listed never reaches the browser, so secrets need no declaration; an object, function or instance cannot be listed. `config.public.get` only accepts paths declared in `PublicAppConfig`, so declare each section's public fields once on the client and a mistyped path or value type fails `pnpm typecheck`:

  ```ts
  declare module '@nocobase/app-client' {
    interface PublicAppConfig {
      billing: { currency?: string };
    }
  }
  ```

- When a plugin owns a section, use the plugin's wrapper instead, such as `defineAuthConfig` from `@nocobase/app-plugin-authentication/server` for `auth`, so its rules apply; prefer a plugin hook such as `useSignUpAvailable()` over reading published paths yourself.
- `pnpm nocobase config check --json` reports every rule violation with code `invalid` and lists what the browser receives under `public`, so a change can be verified without opening the application.

The runtime definition declares `createAppConfig` for the loader and `defaultConfigs` for the aggregated configuration factory. `resolveAppRuntime()` assembles `runtime.config`. The entry point then calls `createApp(runtime)`, which binds `runtime.app` and uses the same configuration object. Services start afterwards.

Code configuration executes once per application. Callbacks can capture `runtime` and resolve services through `runtime.app` when invoked; do not resolve services while generating defaults. Code defaults are overridden by file configuration, then explicit environment mappings. Objects merge by field; arrays and callbacks are replaced. Reload reads environment configuration again and retains code defaults. Changing TS configuration requires a restart.

Edit `server/config/auth.ts` for authentication options, using `AuthConfig` from `@nocobase/app-plugin-authentication/server` and `username` from `better-auth/plugins`. Edit `client/config/auth.ts` for native client options, using `AuthConfig` from the `/client` entry and `usernameClient` from `better-auth/client/plugins`. Keep deployment secrets in YAML or environment variables. Better Auth instances are created once; reloading configuration does not recreate them.

Authorization integration belongs to the installed `nocobase-app-plugin-authorization` Skill; see [application permission development](authorization.md). The main plugin supplies permission sets, pages, settings, composite resources, workspace placement and database authorization. App feature development registers its composites and preserves system permission configuration. For default access, sharing or restrictions, locate the corresponding `nocobase-app-plugin-authz-default-access`, `nocobase-app-plugin-authz-sharing-rules` or `nocobase-app-plugin-authz-restriction-rules` Skill and follow its integration instructions. If that Skill is absent, treat the capability as unsupported and explain that it needs separate development; do not assume its factories, endpoints or tables exist. `authorizationToken` is the only service token; permission sets are `authz.permissionSets` on the instance it resolves.

Module defaults are assembled by `server/config/index.ts`; inspect its imports before assuming a section exists. Common sections include application, authentication, database, storage, localization, logging, queue, server, session, snowflake, and SPA settings, while a template or installed capability may add or omit sections. The client defaults are assembled independently under `client/config/`.

Factories receive `runtime` and can use `runtime.paths`, and `runtime.plugins` for application directories, routing, and resolved plugin metadata. Providers read sections with `app.config.get<ModuleConfig>('module')`. Runtime configuration reload subscriptions use `app.config.subscribe<ModuleConfig>('module', listener)`. Environment variables are declared by the section they set, in `env` of its `defineAppConfig` with paths relative to the section, such as `env: { APP_SERVER_PORT: envInteger('port') }` in `server/config/server.ts`; a plugin's wrapper declares its own, as `defineAuthConfig` does for `AUTH_SECRET`. There is no separate mapping file. `pnpm nocobase config env` lists every variable the application reads, the path each sets and whether it is set, including those the runtime reads itself such as `APP_BASE_PATH`; a variable named in `.env.example` must be one of them. Keep deployment parameters in `config.example.yml`, behavior defaults in TS, and reserve environment overrides for secrets and startup integration.

## Persistent logging

Application templates configure `logging.loggers.request.file.name: request`, so HTTP request logs go to `storage/logs/request.<UTC-date>.<part>.log`. Other sources use the shared app file unless explicitly routed.

Use `loggingToken` from `@nocobase/app-server/logging` and `logging.getLogger(source)` for application and plugin diagnostics. Sources without a file override share `storage/logs/app.<UTC-date>.<part>.log` containing JSON Lines. `getLogger()` uses source `system`; omit `default`. Only `logging.loggers.<source>.file.name` routes a source into a separate file, without duplicating it into app. Configure `logging.file.enabled`, `name`, `retentionDays`, `maxFileSizeMB`, and `maxTotalSizeMB` independently from `logging.console.enabled` and `logging.console.pretty`. Total retention covers all files in the directory. Both development and production capture structured files; pretty only formats the terminal. Omit legacy top-level `pretty`, `default`, and `maxSizeMB` in new configuration. Host capture policy overrides App and source enablement, output and level settings. Source file overrides accept only `name` and `enabled`; they cannot change the directory or retention budget; outside that boundary explicit custom transports own their destinations.

Application composition roots call `createAppFromRuntime(runtime)` to transfer resolved configuration, paths, mode and Host logging policy and bind `runtime.app`. Preserve this when upgrading templates: Host supplies App, deployment, and runtime identities and capture policy through that boundary. Hosted runtime logs belong to the App volume, never the expanded release directory. Hub deployment logs belong to each deployment operation and are separate from application runtime logs. See the Hub plugin README for paths, retention, API limits, and the `read-log` permission.

`runtime.paths`, the configuration loader’s `context.paths`, and `app.paths` share the resolved `AppPaths` object. It exposes directory fields and `root()`, `server()`, `database()`, `client()`, `config()`, and `storage()` methods. Input `AppPathOptions` is normalized after application path policies run. Standalone declarations provide `deploymentRootDir` relative to the code root; configuration and default storage live in that deployment root, while code resources stay under `rootDir`. Server and CLI use the same declaration.

Standalone environment loading reads packaged code-root `.env` defaults, then deployment-root `.env` and `.env.local`, then the process environment and explicit overrides. Packaged defaults remain effective when deployment files are absent. Embedded scopes only use their explicitly supplied environment.
