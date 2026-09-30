# Server contributions

Use this reference when a plugin needs HTTP routes, background jobs, or a Server declaration. Read [services.md](./services.md) for reusable domain services and lifecycle ownership, and [database.md](./database.md) for database structure, initial data, and Repository APIs.

## Choose the owning module

| Requirement                                                    | Owner                                                           |
| -------------------------------------------------------------- | --------------------------------------------------------------- |
| Reusable domain behavior                                       | Service, optionally registered through a `ServiceProvider`      |
| Stable cross-module capability identity                        | `ServiceToken<T>` owned and exported by the capability provider |
| HTTP input, output, authentication, and authorization          | Root or API Route contribution                                  |
| Deferred, retryable, delayed, or batch execution               | Queue Job                                                       |
| Table, field, relation, index, constraint, or metadata history | Migration                                                       |
| Required initial records in an existing schema                 | Seed                                                            |

Keep these boundaries visible in the code. A Route maps HTTP to a Service call. A Job validates a serializable payload and orchestrates one asynchronous execution. A Service implements reusable behavior without Hono context, status codes, paths, or Queue retry policy. A Provider registers dependencies and owns resource lifecycle.

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
  queue: {
    jobs: ['./server/jobs'],
  },
  database: {
    migrations: './database/migrations',
    seeds: './database/seeds',
  },
});

export default plugin;
```

Declare only capabilities the plugin implements. Provider constructors and Route definitions are direct contributions. Jobs, migrations, and seeds are filesystem locations relative to `baseDir`. The target App must import the plugin's `./server` export and include the definition in its explicit `server/plugins.ts` composition; installing the package alone does not activate it.

### `baseDir` is part of the runtime contract

Every Server plugin must provide an absolute `baseDir`. In a source `server/plugin.ts`, `path.resolve(import.meta.dirname, '..')` points to the package root. In the compiled `dist/server/plugin.js`, the same expression points to `dist`. The runtime resolves migrations, seeds, jobs, and package metadata only from the loaded copy; it does not search a source fallback, a build fallback, or a directory selected from `NODE_ENV`.

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

## Queue Jobs

Use a Job for execution that is deferred, delayed, retried, batched, or performed by a worker. Keep reusable domain behavior outside the Job class.

```ts
import { Job, type JobOptions } from '@nocobase/queue';

export interface RebuildIndexPayload {
  readonly collection: string;
  readonly requestedAt: string;
}

interface RebuildIndexDependencies {
  readonly logger: {
    info(data: Record<string, unknown>, message: string): void;
  };
}

export default class RebuildIndexJob extends Job<RebuildIndexPayload> {
  public static options: JobOptions = {
    name: '@nocobase/app-plugin-audit-log/rebuild-index',
    queue: 'default',
  };

  public constructor(private readonly dependencies: RebuildIndexDependencies) {
    super();
  }

  public async execute(): Promise<void> {
    this.dependencies.logger.info(
      {
        jobId: this.context.jobId,
        queue: this.context.queue,
        attempt: this.context.attempt,
        collection: this.payload.collection,
      },
      'Rebuilding search index',
    );
  }
}
```

Give every Job a stable `options.name`; class names are refactoring details. Payloads must be serializable, validated, and reconstructible in another process. Do not place Services, request contexts, database connections, functions, or secrets in the payload. A published payload change must account for older queued jobs.

The default App Queue factory constructs discovered jobs with an object containing `database` when available and `logger`; it does not inject `ServiceContainer`. A Job that needs an App service must not reach for a module-level container. Either extract a domain operation that accepts explicit dependencies, or let a Provider register a named factory through `queueJobFactoryRegistryToken` during `boot()` and unregister it during `shutdown()`. The factory name must match the Job's stable `options.name`.

Dispatch from a Route, Provider, or other container-aware producer:

```ts
import { queueManagerToken } from '@nocobase/app-server/queue';

const queue = container.resolve(queueManagerToken);
await queue.dispatch(RebuildIndexJob, {
  collection: 'auditLogs',
  requestedAt: new Date().toISOString(),
});
```

Dispatch options support connection, queue, priority, delay, group, and deduplication. A Route that dispatches a Job still needs its own authentication and authorization.

Assume at-least-once execution. Use a stable business key, Queue deduplication, or durable execution state for side effects such as email, external API calls, billing, and file writes. Distinguish temporary retryable failures from invalid input or terminal business failures. Log Job ID, queue, attempt, and non-sensitive business identity. Never rely on a process-local `Map` to remember completion.

Test the handler's payload validation and behavior directly, then cover retry, deduplication, and idempotency where relevant. Verify the declaration points to a real compiled location and run a target App integration test that discovers, dispatches, executes, and shuts down the worker.

## Verification and source references

Run the modified plugin's `lint`, `typecheck`, `test`, and `build`, plus the affected target App checks. Use `pnpm nocobase plugin inspect <name> --workspace-root . --app <app> --json` only when registration is in question; it reads static registration facts and does not prove Route security, Provider lifecycle, Job execution, migrations, or seeds.

Use these maintained implementations when a detail is uncertain:

- App Server plugin contract (`packages/app/app-server/src/plugins/types.ts`)
- Server plugin path resolution (`packages/app/app-server/src/plugins/resolve.ts`)
- Application startup and Route mounting (`packages/app/app-server/src/application/index.ts`)
- Runnable Route plugin (`packages/examples/app-plugin-routes-example`)
- Runnable Queue plugin (`packages/examples/app-plugin-queue-example`)
