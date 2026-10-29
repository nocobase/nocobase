# @nocobase/app-plugin-concurrency

Application-owned concurrency services and an in-process fixed-TTL Mutex backend for NocoBase 3. This package replaces the unpublished @nocobase/concurrency-mutex package; do not install both names. Requires Node 24 ESM and compatible @nocobase/app-server, @nocobase/service-provider and @nocobase/concurrency peers.

## Application integration

Install the plugin and its peers, then register the Server definition before business consumers in the application's server/plugins.ts:

```ts
import concurrency from '@nocobase/app-plugin-concurrency/server';
import { defineServerPlugins } from '@nocobase/app-server/plugins';

export default defineServerPlugins([
  concurrency,
  // Other application plugins.
]);
```

Register configuration separately in the application's existing configuration aggregator:

```ts
import { defineConcurrencyConfig } from '@nocobase/app-plugin-concurrency/config';

export default defineConcurrencyConfig();
```

The factory supplies { default: 'memory', memory: { adapter: 'mutex' } }, maps CONCURRENCY_DEFAULT to the section's default selector, validates without I/O and publishes no browser configuration. Register this factory under concurrency. File and environment precedence remain application-owned. Both OSS templates already perform these two registration steps. A manually composed host with no section uses a built-in Mutex item. Unknown names or invalid defaults never fall back. Unused named adapters need not be installed, but common fields and every registered implementation are validated at boot.

## Business consumers and lifecycle

Import the original concurrencyServiceToken and ConcurrencyService from @nocobase/app-plugin-concurrency/server. Resolve and inject the service during boot; call getManager() or getManager(name) only in ready or normal running work. The same configuration name shares one manager/runtime. Its createLock/createSynchronous methods only apply the configured default TTL and return core objects; they do not wrap acquisition or execution. Leases belong to callers and must be returned. A fixed TTL is not renewal or an acquisition timeout. See the packaged [integration Skill](skills/nocobase-app-plugin-concurrency/SKILL.md) for a complete consumption example.

The Provider owns initialization and shutdown. A failed close retains the original runtime/backend for explicit service.shutdown() retry; the application's cached shutdown Promise does not repeat Provider cleanup. Business consumers must not close shared resources. Boot freezes all entries, including lazy ones. Reload only warns; applying a changed lock domain requires coordinated restart. Two enabled Mutex entries with the same namespace are rejected: reuse the same item instead. Local locks never coordinate separate processes. Non-development use emits a local-scope warning.

Redis support is contributed by the commercial @nocobase/app-plugin-concurrency-redis plugin, not enabled by installation alone. That plugin owns its backend, registration, dedicated connection and Redis-specific validator. OSS applications do not depend on it.

## Public exports

- /server: the static Server definition, original Token, service/extension contracts and Provider.
- /config: defineConcurrencyConfig, common types and pure validation, without importing Server registration.
- /package.json: package metadata.
- Root: LocalConcurrentBackend and LocalConcurrentBackendOptions for deliberate low-level runtime construction. It does not bind a host service or register a plugin automatically.

## Low-level backend

```ts
import { createConcurrentRuntime } from '@nocobase/concurrency';
import { LocalConcurrentBackend } from '@nocobase/app-plugin-concurrency';

const runtime = await createConcurrentRuntime({
  backend: new LocalConcurrentBackend(),
  namespace: 'orders:local',
});
const executor = await runtime.manager.createSynchronous('order:123', {
  ttl: 30000,
});
await executor.run(async ({ signal }) => {
  signal.throwIfAborted();
});
await runtime.close();
```

## Competition and time

Each runtime exclusively owns one backend. Lock and executor handles created by that runtime share exact namespace/kind/name resources. Supply a fresh backend for another runtime; separate backend instances, processes and isolates are isolated. Each backend uses its own runtime's Clock and Scheduler; there is no cross-runtime clock-sharing requirement. A same-name lock and executor compete for the same lock resource. Names are neither trimmed nor Unicode/case normalized; state keys encode the structured tuple rather than concatenate unescaped names.

TTL defaults to 30000ms. Every successful attempt uses a new token and actual monotonic grant time plus TTL. Resource timers carry token/version checks, round delays up, rearm when early, and only trigger best-effort cleanup. Each acquisition and release also purges by actual time, so delayed timers do not extend ownership. Expiry permits another acquisition but never stops old business code. Expired manual leases still require return before runtime close.

`new LocalConcurrentBackend({ retryIntervalMs: 10 })` configures the retry interval. It must be an integer in 1..2147483647. Ordinary `lock({ signal })` and `run(runner, { signal })` use protocol v1 `unbounded` waits: retries continue outside the gate until success, cancellation or failure, without a 30-second acquisition limit. Single try calls attempt at most once. Positive positional try timeouts use `bounded` waits of min(interval, remaining deadline). Both retry modes are cancellable per request. There is no FIFO, fairness or starvation guarantee; core does not add another retry loop. No call to `async-mutex.cancel()` can cancel another request. The initial backend protocol is fixed at 1 while unpublished; other protocol versions are rejected explicitly.

## State and lifecycle

A registry reference is pinned synchronously before waiting for a real Mutex gate. Critical sections never await business/I/O or publish scheduler/signal effects. Effects run after unlocking, while references and effect counts protect the state against reclamation. Empty state is deleted only if it has no holder/reference/timer/effect and the map still points to it. Facades resolve the registry on each call instead of caching reclaimable state pointers.

Each grant releases only its original token. Repeated and concurrent release are idempotent; failed gate entry can be retried without affecting a newer token. No private core classes, copied public errors, leases or executors are used. The root entry exports `LocalConcurrentBackend` and `LocalConcurrentBackendOptions`; adapter implementation modules are not public exports.

Runtime close belongs to core: it refuses new work, cancels only undelivered acquisition, waits for real runners/manual returns, retains failed executor cleanup and then closes its owned backend. Applications call only `runtime.close()`. The backend directly implements `initialize`, `validateResource`, `acquire` and `close`; no session layer remains. Initialization is single-use. Backend close aborts pending attempts, rejects while grants or releases remain, drains visible timer/gate promises and marks closed only after successful drain. Failed or timed-out runtime close can be retried without duplicating in-flight backend cleanup. No global lock singleton or implicit application/environment configuration is installed.

## Supported scope

Only fixed-TTL Lock and SynchronousExecutor are exposed, with both provided by every Local backend. There is no placeholder semaphore API, automatic-renewal option or capability map. Unknown options are rejected rather than accepted as no-ops. There is no extend, reentrancy, read/write mode, final atomic validity proof, strong replay barrier or automatic migration of existing business locks. See core's documentation for independent acquisition/executor signals, conservative success semantics and business error priority.

## Verification

Run scoped `fix`, `lint`, `typecheck`, `test` and `build`. Tests run the published framework-neutral backend/fault drivers, deterministic Clock/Scheduler races, actual Mutex gate blocking, old timer/token checks, release failures, business/cause/logger edge cases, owned backend close/retry and dynamic-name reclamation. A real event-loop integration case runs competing callbacks using the actual async-mutex implementation. `node tests/verify-packed.mjs <artifact-directory>` packs this package, installs it with a freshly packed core in a temporary directory outside the workspace, checks declarations/public entries and executes real same-runtime handle competition and public contract drivers. Tests never imply cross-process coordination or Redis correctness.
