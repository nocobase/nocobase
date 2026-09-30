# Services, tokens, and Providers

Use this reference when multiple routes or Providers share domain behavior, another plugin consumes a capability, an implementation must be replaceable in tests, or a resource needs lifecycle management. Keep a private helper or pure function outside the container when none of those conditions applies.

For typed examples of class, object, function, value, role-specific, dependency-aware, and test-replacement bindings, plus a complete timer-backed Provider and lifecycle test, read [ServiceToken and Provider examples](service-examples.md).

```text
Service contract → owner-created Token → implementation → ServiceProvider → consumer
```

## Define the public capability

The plugin that owns a capability defines and exports its contract and original Token object:

```ts
import {
  createServiceToken,
  type ServiceToken,
} from '@nocobase/service-provider';

export interface AuditLogService {
  list(): Promise<readonly AuditRecord[]>;
  dispose(): Promise<void>;
}

export interface AuditRecord {
  readonly id: number;
  readonly action: string;
}

export const auditLogServiceToken: ServiceToken<AuditLogService> =
  createServiceToken<AuditLogService>('@nocobase/app-plugin-audit-log/service');
```

Export the Token and contract from the plugin's stable `./server` entry, for example `@nocobase/app-plugin-audit-log/server`. Consumers must import that exact object. Calling `createServiceToken()` again with the same name creates a different identity and cannot resolve the owner's binding. Do not expose only a deep source path such as `server/tokens.ts`; the source and published `package.json#exports` entries define the real public API.

`ServiceToken<T>` identifies a role, and `T` may be an interface, function, ordinary object, class instance, or primitive value. Separate Tokens can represent two roles with the same TypeScript shape, such as public and private storage. Avoid turning every configuration property into a Token; only shared dependency roles belong in the container.

Plugins must declare identity-sensitive NocoBase runtimes they plug into as peer dependencies, including `@nocobase/service-provider`, `@nocobase/app-server`, `@nocobase/db`, and other owner packages whose Tokens cross the boundary. A second installed copy creates a second Token identity even when names and types look identical.

## Implement domain behavior

A Service implements reusable behavior. It does not read Hono context, select HTTP status codes, define paths, or decide queue retry policy. Keep only the contract and cross-plugin types public; the default implementation can stay internal.

```ts
import type { AuditLogService, AuditRecord } from '../tokens.js';

export interface AuditLogStore {
  findAll(): Promise<readonly AuditRecord[]>;
  close(): Promise<void>;
}

export class DefaultAuditLogService implements AuditLogService {
  public constructor(private readonly store: AuditLogStore) {}

  public async list(): Promise<readonly AuditRecord[]> {
    return this.store.findAll();
  }

  public async dispose(): Promise<void> {
    await this.store.close();
  }
}
```

The examples below assume a plugin-owned `createAuditLogStore(database)` adapter implementing this interface in `server/services/store.ts`. Implement that adapter for the actual storage requirement; its `close()` releases only resources it creates, never the host's shared DatabaseManager.

## Register with the container

`ServiceContainer` has two binding forms:

| Need                                                   | API                                   |
| ------------------------------------------------------ | ------------------------------------- |
| Register an already-created object, function, or value | `container.instance(token, value)`    |
| Create one value lazily on first use                   | `container.singleton(token, factory)` |

A singleton factory is synchronous and receives a `ServiceResolver`, which is the correct place to resolve dependencies:

```ts
this.app.container.singleton(
  auditLogServiceToken,
  (resolver) =>
    new DefaultAuditLogService(
      createAuditLogStore(resolver.resolve(databaseManagerToken)),
    ),
);
```

`resolve()` fails for missing bindings and detects circular creation. `instance()` and `singleton()` reject duplicate Tokens. `has()` reports whether a binding exists. `resolveIfCreated()` returns an instance only after creation and never triggers a lazy factory. A singleton factory failure is retained, so later `resolve()` calls throw the same failure rather than rerunning the factory. There are no transient, scoped, string-keyed, automatic constructor-injection, or override bindings.

## Register and own lifecycle through a Provider

```ts
import type { AppPluginApplication } from '@nocobase/app-server/plugins';
import { databaseManagerToken } from '@nocobase/db';
import { ServiceProvider } from '@nocobase/service-provider';

import { DefaultAuditLogService } from '../services/audit-log.js';
import { createAuditLogStore } from '../services/store.js';
import { auditLogServiceToken } from '../tokens.js';

export class AuditLogProvider extends ServiceProvider<AppPluginApplication> {
  public readonly name: string = '@nocobase/app-plugin-audit-log';

  public override register(): void {
    this.app.container.singleton(
      auditLogServiceToken,
      (resolver) =>
        new DefaultAuditLogService(
          createAuditLogStore(resolver.resolve(databaseManagerToken)),
        ),
    );
  }

  public override async shutdown(): Promise<void> {
    await this.app.container.resolveIfCreated(auditLogServiceToken)?.dispose();
  }
}
```

A Provider registers implementations and controls resources; it is not the Service and must not contain Route handlers. Give every Provider a stable name unique within the App. One Provider normally uses the package name; multiple Providers use stable capability suffixes. Keep constructor and declaration imports side-effect free.

Aggregate constructor references without instantiating them:

```ts
import type { AppPluginProviderConstructor } from '@nocobase/app-server/plugins';

import { AuditLogProvider } from './audit-log.js';

const serviceProviders: readonly AppPluginProviderConstructor[] = [
  AuditLogProvider,
];

export default serviceProviders;
```

The target App creates the Providers from the plugin's `serviceProviders` contribution and drives their lifecycle. A Provider may type its App as `AppPluginApplication` or a structurally compatible narrow interface containing only fields it actually uses; narrow fixtures avoid unsafe catch-all assertions in tests.

## Lifecycle and ordering

The Server starts in this order:

```text
register every Provider
→ register locale resources
→ boot every Provider
→ create and mount every Route contribution
→ start every Provider
→ ready every Provider
```

All Providers finish one phase before any enter the next; shutdown runs in reverse composition order.

| Phase        | Appropriate work                                              | Do not do or assume                               |
| ------------ | ------------------------------------------------------------- | ------------------------------------------------- |
| `register()` | Synchronously bind instances and lazy factories               | Async I/O, network access, timers, schema changes |
| `boot()`     | Prepare async internals and validate registered dependencies  | Another Provider has already completed `start()`  |
| `start()`    | Start workers, listeners, connections, or timers              | Register new service bindings                     |
| `ready()`    | Transition internal services after every Provider has started | The external HTTP host is already listening       |
| `shutdown()` | Stop and await resources this Provider owns                   | Resolve and create an unused lazy service         |

Route factories run after `boot()` and before `start()`. They may resolve registered, boot-prepared Services, but they cannot assume background resources have started. Normal requests wait for the complete App startup.

If `boot()`, `start()`, or `ready()` fails, the registry attempts reverse-order shutdown and preserves both startup and cleanup errors. Cleanup must tolerate an uncreated singleton, partial startup, and repeated shutdown. Save a resource reference before a later operation can fail, await asynchronous cleanup, and use `resolveIfCreated()` so shutdown does not create a resource only to close it.

The owner of a resource closes it. A plugin must not close a database, logger, queue, or other shared Service resolved from another owner. It must close connections, consumers, subscriptions, listeners, and timers that its own implementation created.

## Configuration and database dependencies

Read configuration through definitions already owned by the App or capability and through `this.app.config`; do not invent string paths or assume `defineServerPlugin()` accepts a `config` contribution. Its current declaration fields are `baseDir`, `packageName`, `serviceProviders`, `routes`, `database`, and `locales`; `queue` is still accepted but deprecated and ignored.

Resolve database access through the owner-exported `databaseManagerToken`. Use `manager.repository(collection)` for logical Collection-aware operations and `manager.query(connectionName?)` for lower-level database queries that do not apply Collection metadata or table-prefix resolution. Structural changes belong in migrations, never Provider startup.

A `JobExecutor` job never resolves the container: the Provider that owns the executor creates the job class with a factory that closes over the Services it needs, then registers that class. A queue handler is likewise a closure the Provider registers in `boot()`; await its unregister function in `shutdown()` before releasing those Services. Do not store a global container for either.

## Test the contract and lifecycle

Use a fresh `ServiceContainer` and a minimal typed App fixture. Cover these observable contracts:

- `register()` creates the binding but does not instantiate a lazy singleton.
- First `resolve()` creates the value and later resolutions return the same value.
- A test can bind a fake to the owner-created Token without subclassing the production implementation.
- Lifecycle methods cause the expected state transitions and await cleanup.
- `shutdown()` does not create an unused singleton and does close a created resource.
- Missing dependencies, duplicate Tokens, duplicate Provider names, circular dependencies, and startup failures are visible.
- The public `./server` export resolves from a real consumer.

For maintained code, see ServiceContainer (`packages/libs/service-provider/src/container.ts`), Provider lifecycle registry (`packages/libs/service-provider/src/registry.ts`), and the runnable ServiceProvider example (`packages/examples/app-plugin-service-provider-example`).
