# ServiceToken and Provider examples

Use these examples after [Services, tokens, and Providers](services.md) identifies the container and lifecycle as the right design. The snippets follow the current `@nocobase/service-provider` and `@nocobase/app-server` APIs on `develop`: Tokens use object identity, singleton factories are synchronous, Server plugins require an absolute `baseDir`, and the App drives Provider lifecycle methods.

## ServiceToken patterns

`ServiceToken<T>` gives a runtime identity to a TypeScript contract. A container can bind a class instance, ordinary object, function, primitive value, or lazy singleton to that identity.

The first examples use one container:

```ts
import {
  createServiceToken,
  ServiceContainer,
  type ServiceToken,
} from '@nocobase/service-provider';

const container = new ServiceContainer();
```

### Class instance

Use `instance()` when the value already exists:

```ts
class HeartbeatService {
  public ping(): string {
    return 'pong';
  }
}

const heartbeatServiceToken: ServiceToken<HeartbeatService> =
  createServiceToken<HeartbeatService>(
    '@example/app-plugin-service-examples/heartbeat',
  );

container.instance(heartbeatServiceToken, new HeartbeatService());

const heartbeat = container.resolve(heartbeatServiceToken);
heartbeat.ping();
```

The Token identifies the capability while `HeartbeatService` is its current implementation.

### Interface contract and object implementation

An interface disappears after compilation, so export a Token as the capability's runtime identity:

```ts
export interface Clock {
  now(): Date;
}

export const clockToken: ServiceToken<Clock> = createServiceToken<Clock>(
  '@example/app-plugin-service-examples/clock',
);

container.instance(clockToken, {
  now: (): Date => new Date(),
});

const currentTime = container.resolve(clockToken).now();
```

Consumers depend on the `Clock` contract rather than the concrete object shape chosen here.

### Function service

A function can be a complete service contract:

```ts
type GenerateId = () => string;

const generateIdToken: ServiceToken<GenerateId> =
  createServiceToken<GenerateId>(
    '@example/app-plugin-service-examples/generate-id',
  );

container.instance(generateIdToken, (): string => crypto.randomUUID());

const generateId = container.resolve(generateIdToken);
const id = generateId();
```

The Token names the function's dependency role; consumers do not need a wrapper class.

### Shared value

Primitive and other ordinary values are valid bindings:

```ts
const deploymentIdToken: ServiceToken<string> = createServiceToken<string>(
  '@example/app-plugin-service-examples/deployment-id',
);

container.instance(deploymentIdToken, 'deployment-001');

const deploymentId = container.resolve(deploymentIdToken);
```

Do not turn every App configuration property into a service. A value Token is useful when several consumers genuinely resolve the value as a shared dependency.

### Same shape, different roles

Different Tokens distinguish business roles even when both services implement the same interface:

```ts
interface FileStorage {
  write(path: string, content: Uint8Array): Promise<void>;
  read(path: string): Promise<Uint8Array | undefined>;
}

class MemoryFileStorage implements FileStorage {
  private readonly files = new Map<string, Uint8Array>();

  public write(path: string, content: Uint8Array): Promise<void> {
    this.files.set(path, content);
    return Promise.resolve();
  }

  public read(path: string): Promise<Uint8Array | undefined> {
    return Promise.resolve(this.files.get(path));
  }
}

const publicFileStorageToken: ServiceToken<FileStorage> =
  createServiceToken<FileStorage>(
    '@example/app-plugin-service-examples/public-files',
  );
const privateFileStorageToken: ServiceToken<FileStorage> =
  createServiceToken<FileStorage>(
    '@example/app-plugin-service-examples/private-files',
  );

container.instance(publicFileStorageToken, new MemoryFileStorage());
container.instance(privateFileStorageToken, new MemoryFileStorage());

const publicFiles = container.resolve(publicFileStorageToken);
const privateFiles = container.resolve(privateFileStorageToken);
```

TypeScript structural compatibility cannot express which storage role a consumer needs; the two Token identities do.

### Lazy singleton with dependencies

Use `singleton()` to defer construction until first resolution. Its synchronous factory receives a resolver for dependencies:

```ts
interface GreetingService {
  greet(name: string): string;
}

const greetingServiceToken: ServiceToken<GreetingService> =
  createServiceToken<GreetingService>(
    '@example/app-plugin-service-examples/greeting',
  );

container.singleton(greetingServiceToken, (resolver) => {
  const clock = resolver.resolve(clockToken);

  return {
    greet(name: string): string {
      return `Hello ${name}. The time is ${clock.now().toISOString()}.`;
    },
  };
});

const firstGreetingService = container.resolve(greetingServiceToken);
const secondGreetingService = container.resolve(greetingServiceToken);
```

Both resolutions return the same object. Resolve dependencies inside the factory rather than reading module-level mutable state, and perform asynchronous preparation in a Provider lifecycle phase rather than returning a Promise from a singleton factory.

### Replace a service in a test without changing its Token

The owner exports its Token and contract from a stable public entry such as `@example/app-plugin-service-examples/server`. A test imports that exact Token and binds a small replacement that satisfies the contract:

```ts
import {
  createServiceToken,
  ServiceContainer,
  type ServiceToken,
} from '@nocobase/service-provider';
import { expect, it } from 'vitest';

import {
  clockToken,
  type Clock,
} from '@example/app-plugin-service-examples/server';

it('uses a fixed clock', () => {
  const testContainer = new ServiceContainer();

  testContainer.instance(clockToken, {
    now: (): Date => new Date('2026-08-28T00:00:00.000Z'),
  });

  expect(testContainer.resolve(clockToken).now().toISOString()).toBe(
    '2026-08-28T00:00:00.000Z',
  );

  const recreatedClockToken: ServiceToken<Clock> = createServiceToken<Clock>(
    clockToken.name,
  );

  expect(() => testContainer.resolve(recreatedClockToken)).toThrow(
    `Service \"${clockToken.name}\" is not registered.`,
  );
});
```

The replacement does not need to extend the production class. Recreating a Token with the same name creates a different object and therefore a different container key.

## Complete Provider example: timed counter

The following Server-only plugin shows a Service, its public contract and Token, a Provider, the Server plugin contribution, target App registration, and focused lifecycle tests. The timer is intentionally local and in-memory; use a Queue when work needs persistence, retries, distributed execution, or cross-process coordination.

The relevant files are:

```text
server/
  tokens.ts
  services/tick-counter.ts
  providers/tick-counter.ts
  providers/index.ts
  plugin.ts
  index.ts
tests/
  provider.test.ts
```

### Define the public contract and original Token

`server/tokens.ts`:

```ts
import {
  createServiceToken,
  type ServiceToken,
} from '@nocobase/service-provider';

export interface TickCounterService {
  start(): void;
  stop(): void;
  getCount(): number;
}

export const tickCounterToken: ServiceToken<TickCounterService> =
  createServiceToken<TickCounterService>(
    '@nocobase/app-plugin-tick-counter/service',
  );
```

The plugin owns this Token. Routes and other plugins import it from the plugin's public `./server` export rather than creating another Token with the same name.

### Implement the Service

`server/services/tick-counter.ts`:

```ts
import type { TickCounterService } from '../tokens.js';

export class DefaultTickCounter implements TickCounterService {
  private timer: ReturnType<typeof setInterval> | undefined;
  private count: number = 0;

  public constructor(private readonly intervalMs: number) {}

  public start(): void {
    if (this.timer !== undefined) {
      return;
    }

    this.timer = setInterval(() => {
      this.count += 1;
    }, this.intervalMs);
  }

  public stop(): void {
    if (this.timer === undefined) {
      return;
    }

    clearInterval(this.timer);
    this.timer = undefined;
  }

  public getCount(): number {
    return this.count;
  }
}
```

The constructor does not start work. `start()` and `stop()` are idempotent, so normal shutdown and cleanup after partial startup can use the same path.

### Register and drive it with a Provider

`server/providers/tick-counter.ts`:

```ts
import {
  ServiceProvider,
  type ServiceContainer,
} from '@nocobase/service-provider';

import { DefaultTickCounter } from '../services/tick-counter.js';
import { tickCounterToken } from '../tokens.js';

export interface TickCounterApplication {
  readonly container: ServiceContainer;
}

export class TickCounterProvider extends ServiceProvider<TickCounterApplication> {
  public readonly name: string = '@nocobase/app-plugin-tick-counter';

  public override register(): void {
    this.app.container.singleton(
      tickCounterToken,
      () => new DefaultTickCounter(1_000),
    );
  }

  public override start(): Promise<void> {
    this.app.container.resolve(tickCounterToken).start();
    return Promise.resolve();
  }

  public override shutdown(): Promise<void> {
    this.app.container.resolveIfCreated(tickCounterToken)?.stop();
    return Promise.resolve();
  }
}
```

The Provider declares only the App capability it uses, so the full `AppPluginApplication` satisfies the constructor and tests can pass a complete, typed fixture without assertions. `register()` binds a lazy synchronous factory, `start()` starts the resource, and `shutdown()` avoids constructing an unused singleton.

### Add the Server plugin contribution

`server/providers/index.ts` exports constructor references without creating Provider instances:

```ts
import type { AppPluginProviderConstructor } from '@nocobase/app-server/plugins';

import { TickCounterProvider } from './tick-counter.js';

const serviceProviders: readonly AppPluginProviderConstructor[] = [
  TickCounterProvider,
];

export default serviceProviders;
```

`server/plugin.ts` declares the contribution and supplies the absolute `baseDir` required by current Server plugins:

```ts
import path from 'node:path';

import {
  defineServerPlugin,
  type AppServerPlugin,
} from '@nocobase/app-server/plugins';

import serviceProviders from './providers/index.js';

const tickCounterPlugin: AppServerPlugin = defineServerPlugin({
  baseDir: path.resolve(import.meta.dirname, '..'),
  packageName: '@nocobase/app-plugin-tick-counter',
  serviceProviders,
});

export default tickCounterPlugin;
```

`server/index.ts` exposes the definition plus the owner-created Token and contract:

```ts
export { default } from './plugin.js';
export { tickCounterToken } from './tokens.js';
export type { TickCounterService } from './tokens.js';
```

The package's source and publish `./server` exports must both resolve this entry. Keep the implementation and Provider internal unless consumers have a concrete reason to construct them.

### Register the plugin in the target App

Installation alone does not run a Provider. The target App's `server/plugins.ts` imports the plugin definition and includes it in `defineServerPlugins()`:

```ts
import tickCounter from '@nocobase/app-plugin-tick-counter/server';
import {
  defineServerPlugins,
  type AppServerPlugins,
} from '@nocobase/app-server/plugins';

const serverPlugins: AppServerPlugins = defineServerPlugins([
  // Existing plugin definitions remain here.
  tickCounter,
]);

export default serverPlugins;
```

Use the registration workflow in [Registration and lifecycle](registration.md) to update the dependency and each applicable App contribution together. Preserve existing plugin definitions and place this one according to real lifecycle dependencies rather than alphabetical appearance alone.

### Test lazy creation and lifecycle cleanup

`tests/provider.test.ts` uses a fresh container and fake timers. It observes behavior owned by this plugin without constructing the full Server Application:

```ts
import { ServiceContainer } from '@nocobase/service-provider';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { TickCounterProvider } from '../server/providers/tick-counter.js';
import { tickCounterToken } from '../server/tokens.js';

afterEach(() => {
  vi.clearAllTimers();
  vi.useRealTimers();
});

describe('TickCounterProvider', () => {
  it('creates one service, starts one timer, and stops it', async () => {
    vi.useFakeTimers();
    const container = new ServiceContainer();
    const provider = new TickCounterProvider({ container });

    provider.register();

    expect(container.has(tickCounterToken)).toBe(true);
    expect(container.resolveIfCreated(tickCounterToken)).toBeUndefined();

    await provider.start();
    await provider.start();

    const counter = container.resolve(tickCounterToken);
    expect(container.resolve(tickCounterToken)).toBe(counter);

    vi.advanceTimersByTime(2_000);
    expect(counter.getCount()).toBe(2);
    expect(vi.getTimerCount()).toBe(1);

    await provider.shutdown();
    await provider.shutdown();

    vi.advanceTimersByTime(2_000);
    expect(counter.getCount()).toBe(2);
    expect(vi.getTimerCount()).toBe(0);
  });

  it('does not create an unused service during shutdown', async () => {
    const container = new ServiceContainer();
    const provider = new TickCounterProvider({ container });

    provider.register();
    await provider.shutdown();

    expect(container.resolveIfCreated(tickCounterToken)).toBeUndefined();
  });
});
```

For a real plugin, add tests for any asynchronous preparation, dependency failure, partial startup, or externally visible behavior it owns. The lifecycle test should not duplicate the framework Registry's own unit tests.

## Current API boundaries reflected here

- `ServiceContainer` supports `instance()`, synchronous lazy `singleton()`, `has()`, `resolve()`, and `resolveIfCreated()`; it has no override, transient, scoped, string-keyed, or automatic constructor-injection binding.
- A failed singleton factory remains failed and later resolutions throw the stored error; circular creation is rejected.
- A Provider may implement `register()`, `boot()`, `start()`, `ready()`, and `shutdown()`. The Server completes each phase for all Providers before advancing, and shutdown runs in reverse composition order.
- `defineServerPlugin()` currently accepts `baseDir`, `packageName`, `serviceProviders`, `routes`, `database`, and `locales`; `queue` is still accepted but deprecated and ignored. It does not accept a plugin-owned `config` contribution.
- Resolve Tokens exported by another package from that package's public entry and keep identity-sensitive runtimes in peer dependencies so the process does not load a second Token identity.
