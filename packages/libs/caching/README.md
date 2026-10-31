# Caching

`@nocobase/caching` provides namespaced Cache, Counter and BloomFilter contracts with an in-process Memory driver. Applications own one `Caching` instance and provide it through `cachingToken` from `@nocobase/app-server/caching`. Business plugins use that host service; they do not install or select a backend themselves.

## Register a driver for one application

Driver registration belongs to a `Caching` instance. The former global `registerCachingDriver()` and `getCachingDriver()` exports have been removed. Migrate every registration to the application's instance; there is no process-wide registration or unregister function.

```ts
import {
  createCaching,
  type Caching,
  type CacheProviderDriver,
} from '@nocobase/caching';

export function createApplicationCaching(driver: CacheProviderDriver): Caching {
  const caching = createCaching({
    default: 'shared',
    providers: { shared: { driver: driver.name } },
  });
  caching.registerDriver(driver);
  caching.validateDefaultProvider();
  return caching;
}
```

A server integration resolves the original `cachingToken` and calls `registerDriver()` in its Provider's synchronous `register()` phase, after the core `CachingProvider` has registered the token. The core Provider checks the default driver's availability in `boot()`, after all registrations. Do not create connections, timers or listeners when importing a driver, registering it, or validating the default. A driver creates a separate Provider for each application/provider configuration; it must not return a process-wide Provider singleton. Duplicate driver names within one application fail; the same name in different applications is independent.

`validateDefaultProvider()` checks driver availability, not connectivity or backend-specific options. Driver-specific pure validation belongs to `createProvider()` when selected. Actual network initialization belongs to asynchronous operations. Applications requiring an external readiness probe must arrange it explicitly; application startup alone does not establish backend connectivity.

## Select a provider

Configuration retains `default` and `providers`. The default must name an existing definition and each definition must have a nonempty driver name. An unused definition may name an unavailable driver, allowing a Memory application to retain deployment configuration for an optional backend. Selecting an unavailable driver or an unknown provider always fails; neither falls back to Memory.

The first getter may supplement the provider definition through `runtimeOptions`. Runtime options cannot override static configuration, and subsequent getter options must match the provider's initialization options. These options do not imply that every driver accepts an external client. Plain static configuration is snapshotted; drivers must validate and snapshot their supported options, including any opaque extension objects.

## Values, TTL and atomic operations

Memory retains its existing value behavior, including `useClone: false`; this package does not impose a JSON-only restriction. A separately installed backend can document a narrower value contract and must reject unsupported values rather than silently converting them.

`resolveTtlConfig(value, name)` is the public duration parser for drivers. It accepts positive numeric milliseconds or duration strings with `ms`, `s`, `m`, `h` or `d`, rounds positive fractional milliseconds upward, and rejects results outside positive safe-integer milliseconds. Undefined TTL inherits the Cache namespace default, then the Provider default; when none exists, the value has no expiration. Zero is not a request for permanent storage. Cache TTL defaults do not apply to Counter or BloomFilter. Reusing a Cache namespace with a different effective default TTL fails.

`take()` atomically removes the current value. `wrap()` only coalesces loaders within this process; it is not a distributed lock or compare-and-set. Loader failures and undefined results are not cached. Accepted loaders and their writeback finish before their Provider is released.

Counter increments accept finite positive, negative and fractional numbers; a non-finite accumulated result is rejected before changing Memory's stored value. TTL is applied only at creation: later increments do not extend or add expiration. Floating-point arithmetic is not an arbitrary-precision ledger, and backend implementations need not produce bit-identical decimal results. Backend failures must not be converted to misses, zero or false, and an unknown mutation result must not be blindly replayed.

Batch methods preserve input order and repeated-key behavior but do not promise a cross-key transaction. Memory validates all batch TTLs before writes. Remote providers must additionally prevalidate their complete encoded batch and inspect every command result; network failures can leave partial effects.

## Close the application-owned service

`ManagedCacheProvider` is the public lifecycle decorator for backend authors: pass a Provider that owns its resources, or subclass the decorator and pass that Provider to `super()`, as Memory does. It supplies stable capability wrappers, admission/draining and retryable cleanup without deep imports. The inner Provider must make `dispose()` confirm resource termination, retain failed resources for retry, and preserve accepted wrap writeback. It must not close resources independently before the decorator drains operations. `Caching` also decorates driver results so an application's previously returned handles observe its shutdown boundary.

Call and await `dispose()` after stopping consumers. It synchronously rejects new getters, registrations and operations on existing handles, drains accepted operations (including wrap loaders), and then releases Providers. Concurrent close calls share an attempt. Every Provider cleanup is observed before reporting combined failures; a failed cleanup retains its resource and can be retried through `dispose()` without reopening the service. Successfully released Providers are not released again.

A Provider close observer has a 30-second deadline. Timeout reports failure while retaining and observing pending work and cleanup; it does not cancel a user loader or prove that its resource is released. A subsequent `dispose()` can await retained cleanup. There is no hard cancellation of arbitrary user code. The host's Provider registry performs one shutdown attempt, so a host shutdown failure must be surfaced and handled explicitly rather than assuming automatic retries. Closing releases local resources and must not remove another application's shared backend data.
