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

## Choose where background work runs

| The work                                                                                                                                               | Use                                                                                  |
| ------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------ |
| Runs once, outside the request that caused it, and retries on failure                                                                                  | `JobExecutor`, below — the default                                                   |
| Recurs by cron or interval, and nobody tracks it in the UI                                                                                             | `ScheduleExecutor`, in [Work that runs on a schedule](#work-that-runs-on-a-schedule) |
| Recurs, and administrators view, enable, disable and track it                                                                                          | A Scheduler schedule, as the Scheduler plugin's Skill describes                      |
| Needs a delay, a priority, a job ID that deduplicates, an atomic batch, a global rate limit, cancelling a running job, or several handlers per message | A queue, in [Queues](#queues)                                                        |

Both executors come from the application's jobs service and run on the `jobs` configuration; queues run on the separate `queue` configuration. An application running more than one instance sets `jobs.default`, and `queue.default` if it uses queues, to a `redis` configuration.

## Ordinary one-off tasks

Use `JobExecutor` from `@nocobase/jobs` for immediate one-off tasks with payload-only classes. Resolve the existing `jobExecutorServiceToken` from `@nocobase/app-server/jobs` and call `getJobExecutor(scope, name?)`; do not add another provider, token, global registry or service container.

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

Every class declares its own stable `static jobName` and has a side-effect-free constructor accepting only payload. There is no factory API or injected service, database, logger or container. A job that calls a Service receives it by closure: the owning provider creates the class with a function that captures the Service — `createPublishDocumentJob(publisher)` returning `class extends Job<…>` — and registers what it returns. `addJob` auto-registers the submitted class locally, but every consuming process must register all expected classes before `setup()` to handle already-queued work. Re-registering the same class and name is idempotent; another class under that name rejects. A producer-only process uses `setup({ consume: false })`. Adding before setup starts rejects; adding during setup waits. Both setup and shutdown are idempotent, and the first setup call fixes whether the executor consumes.

Payloads are snapshotted immediately and must be strict JSON data, not functions, services, `Date` instances, undefined, non-finite numbers, cyclic objects or accessors. Each task attempt reconstructs a new instance from that snapshot; submitted instances and their extra state never reach the backend. `receipt.jobId` identifies backend-accepted work, not completed work. Make external effects idempotent with a stable business key or `jobId`. Local `JobStart`, `JobProgress`, `JobEnd` and `JobError` events describe attempts, not durable acknowledgements; an error event need not mean final failure. Report progress from `execute` with `await reportProgress(percent)` (0 to 100); it restarts with every attempt, and the provider forwards `JobProgress` wherever the UI reads it, such as a realtime topic. `attempt` counts execution starts including recovery, not the failures spent against configured `attempts`.

The selected `jobs` configuration supplies concurrency, attempts and retention; `getJobExecutor` accepts no overrides. Omitted, `default`, and unknown names that select the same configuration share an executor. Physical identity ignores the configuration key: keys with the same connection or storage path, namespace and scope reach the same tasks, so renaming a key keeps pending work, and a separate `namespace` isolates a configuration. Concurrency is per worker; FIFO waiting claims do not guarantee completion order. Use Redis for multiple processes. Memory reads pending-only snapshots at setup and writes them at shutdown in files separate from Schedule; forced exit can lose new tasks or replay completed work. See the `@nocobase/jobs` README for persistence identities and configuration.

Call `executor.shutdown()` in the owning provider's shutdown hook; the application's existing jobs provider also closes every ordinary and Schedule executor left open. Shutdown aborts running signals and waits for handlers. A successful handler return completes the task even if its signal was aborted. Only `signal.throwIfAborted()` or `JobInterruptedError` while the signal is aborted marks unfinished work for recovery without spending the ordinary failure budget; any other exception is a normal failure. Do not throw an interruption after committing a completed effect.

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
- **Long or heavy work.** A firing that runs for minutes holds one of the executor's slots. Prefer one that submits a task to a `JobExecutor` and returns, which also gets you its retry behavior.

## Queues

Use a queue only for what the executors above do not have: delays, priorities, job IDs that deduplicate, atomic batches, a global rate limit, cancelling a running job, or several handlers consuming each message. A producer publishes `(channel, message)` to a named queue, and every handler registered on it consumes each job. Resolve the existing `queueServiceToken` from `@nocobase/app-server/queue`; do not create a service or token of your own. Nothing is discovered from a directory.

```ts
import { queueServiceToken } from '@nocobase/app-server/queue';
import { withChannel, type UnregisterHandler } from '@nocobase/queue';

export class ExportQueueProvider extends ServiceProvider<Application> {
  public readonly name: string = 'exports';
  private unregister: UnregisterHandler | undefined;

  public override boot(): void {
    const queue = this.app.container.resolve(queueServiceToken);
    this.unregister = queue.consumer('exports').consume(
      withChannel('run', async (_channel, message, signal) => {
        const { exportId } = message as { exportId: string };
        await runExport(exportId, signal);
      }),
    );
  }

  public override async shutdown(): Promise<void> {
    await this.unregister?.();
  }
}

// After the application started, for example in a route: run the export in
// ten minutes, and at most once while the job exists.
await app.container
  .resolve(queueServiceToken)
  .producer('exports')
  .publish(
    'run',
    { exportId },
    { delay: 600_000, jobIdProducer: () => `export-${exportId}` },
  );
```

- **Lifecycle.** Register handlers in `boot()`; the queue provider sets the service up in its `start()`, so publishing before the application has started rejects. In `shutdown()`, await every unregister function before releasing what the handlers use, and never await a handler's own unregistration inside it.
- **Handlers.** Every handler of a queue runs for every job, in parallel; the job completes only when all succeed, and a retry runs all of them again. Filter with `withChannel()`; a job every handler skips completes. Handlers must be idempotent.
- **Messages.** JSON only, serialized once when published: pass IDs, not services, connections or request contexts. A `Date` arrives as a string.
- **IDs and batches.** A `jobIdProducer` in publish options or configuration gives stable IDs, and publishing an ID that still exists adds nothing. `publishMany()` prepares every entry before writing any.
- **Retries and cancellation.** `attempts` and `backoff` (`fixed` or `exponential`) come from the configuration key, `manager(queue).configure()`, or publish options. `manager(queue).cancelJob(jobId)` fails a job running on this instance without a retry.
- **Configuration.** `server/config/queue.ts` declares keys such as `memory` and `redis`; `queue.default` picks one, and a queue can name another as the second argument of `producer()`, `consumer()` and `manager()`. Without a default, queues run on the built-in memory configuration, which serves one process and writes pending jobs under `storage/queue` at shutdown. Set `queue.default: redis` before running more than one instance.

See the `@nocobase/queue` README for the full contract.

## Verify

- The service resolves from the token and behaves correctly in isolation.
- Provider lifecycle releases in `shutdown()` what `start()` acquired, including ordinary and schedule executors.
- Ordinary job classes are registered before consumption, accept only strict JSON payloads, and reconstruct a fresh instance for each attempt.
- Queue handlers are registered in `boot()` and awaited on unregister in `shutdown()`, and every handler of a queue tolerates running again.
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

Store a value the server must read back later — a provider key, a credential, a token — sealed, never in plain text and never with a key of its own: resolve `secretsServiceToken` from `@nocobase/app-server/secrets` and call `seal(value, { purpose, aad })`, `open(sealed, { purpose, aad })` with a purpose naming the package and use (`@acme/app-plugin-crm/smtp-password`) and `aad` binding the value to its record (its id), so a ciphertext copied to another row does not open. Without `secrets.keys` the service is not `ready` and `seal` throws `SECRETS_NOT_CONFIGURED`; answer that as unavailable rather than storing the value unsealed. Register each table that holds sealed values with `registerStore(createSecretsTableStore({ name, table, columns: [{ column, purpose, aad }], connection }))` from the provider's `register()`, so `pnpm nocobase secrets status` reports it and `secrets rotate` reseals it after a key change. A library with its own encryption that takes a rotation list gets one from `keyring(purpose)`, current key first. A value only ever verified, such as an API key, is hashed instead.

Edit `server/config/auth.ts` for authentication options, using `AuthConfig` from `@nocobase/app-plugin-authentication/server` and `username` from `better-auth/plugins`. Edit `client/config/auth.ts` for native client options, using `AuthConfig` from the `/client` entry and `usernameClient` from `better-auth/client/plugins`. Keep deployment secrets in YAML or environment variables. Better Auth instances are created once; reloading configuration does not recreate them.

Authorization integration belongs to the installed `nocobase-app-plugin-authorization` Skill; see [application permission development](authorization.md). The main plugin supplies permission sets, pages, settings, composite resources, workspace placement and database authorization. App feature development registers its composites and preserves system permission configuration. For default access, sharing or restrictions, locate the corresponding `nocobase-app-plugin-authz-default-access`, `nocobase-app-plugin-authz-sharing-rules` or `nocobase-app-plugin-authz-restriction-rules` Skill and follow its integration instructions. If that Skill is absent, treat the capability as unsupported and explain that it needs separate development; do not assume its factories, endpoints or tables exist. `authorizationToken` is the only service token; permission sets are `authz.permissionSets` on the instance it resolves.

Module defaults are assembled by `server/config/index.ts`; inspect its imports before assuming a section exists. Common sections include application, authentication, database, storage, localization, logging, queue, server, session, snowflake, and SPA settings, while a template or installed capability may add or omit sections. The client defaults are assembled independently under `client/config/`.

Factories receive `runtime` and can use `runtime.paths`, and `runtime.plugins` for application directories, routing, and resolved plugin metadata. Providers read sections with `app.config.get<ModuleConfig>('module')`. Runtime configuration reload subscriptions use `app.config.subscribe<ModuleConfig>('module', listener)`. Environment variables are declared by the section they set, in `env` of its `defineAppConfig` with paths relative to the section, such as `env: { APP_SERVER_PORT: envInteger('port') }` in `server/config/server.ts`; a plugin's wrapper declares its own, as `defineAuthConfig` does for `AUTH_SECRET`. There is no separate mapping file. `pnpm nocobase config env` lists every variable the application reads, the path each sets and whether it is set, including those the runtime reads itself such as `APP_BASE_PATH`; a variable named in `.env.example` must be one of them. Give each mapping its metadata in the helper's second argument, such as `envString('smtp.password', { description: 'The SMTP password.', secret: true })`: `description`, `secret`, `required`, `generate` (`secret`, `secretKeys` or `password`, which a deployment may generate) and `firstStartOnly`. A variable is required unless the code defaults or `config.example.yml` give its path a real value, it can be generated, or `required: false` says so; `pnpm nocobase config variables` shows the result and `pnpm build` writes it to `dist/variables.json`. Do not write `${NAME}` in `config.yml`: it is not expanded. Keep deployment parameters in `config.example.yml`, behavior defaults in TS, and reserve environment overrides for secrets and startup integration.

## Persistent logging

Application templates configure `logging.loggers.request.file.name: request`, so HTTP request logs go to `storage/logs/request.<UTC-date>.<part>.log`. Other sources use the shared app file unless explicitly routed.

Use `loggingToken` from `@nocobase/app-server/logging` and `logging.getLogger(source)` for application and plugin diagnostics. Sources without a file override share `storage/logs/app.<UTC-date>.<part>.log` containing JSON Lines. `getLogger()` uses source `system`; omit `default`. Only `logging.loggers.<source>.file.name` routes a source into a separate file, without duplicating it into app. Configure `logging.file.enabled`, `name`, `retentionDays`, `maxFileSizeMB`, and `maxTotalSizeMB` independently from `logging.console.enabled` and `logging.console.pretty`. Total retention covers all files in the directory. Both development and production capture structured files; pretty only formats the terminal. Omit legacy top-level `pretty`, `default`, and `maxSizeMB` in new configuration. Host capture policy overrides App and source enablement, output and level settings. Source file overrides accept only `name` and `enabled`; they cannot change the directory or retention budget; outside that boundary explicit custom transports own their destinations.

Application composition roots call `createAppFromRuntime(runtime)` to transfer resolved configuration, paths, mode and Host logging policy and bind `runtime.app`. Preserve this when upgrading templates: Host supplies App, deployment, and runtime identities and capture policy through that boundary. Hosted runtime logs belong to the App volume, never the expanded release directory. Hub deployment logs belong to each deployment operation and are separate from application runtime logs. See the Hub plugin README for paths, retention, API limits, and the `read-log` permission.

`runtime.paths`, the configuration loader’s `context.paths`, and `app.paths` share the resolved `AppPaths` object. It exposes directory fields and `root()`, `server()`, `database()`, `client()`, `config()`, and `storage()` methods. Input `AppPathOptions` is normalized after application path policies run. Standalone declarations provide `deploymentRootDir` relative to the code root; configuration and default storage live in that deployment root, while code resources stay under `rootDir`. Server and CLI use the same declaration.

Standalone environment loading reads packaged code-root `.env` defaults, then deployment-root `.env` and `.env.local`, then the process environment and explicit overrides. Packaged defaults remain effective when deployment files are absent. Embedded scopes only use their explicitly supplied environment.
