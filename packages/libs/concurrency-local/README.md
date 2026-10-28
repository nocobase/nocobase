# @nocobase/concurrency-local

An in-process fixed-TTL backend for `@nocobase/concurrency`, using the public `Mutex` from `async-mutex@0.5.0` only for short synchronous state transitions. Requires Node 24 ESM. Install core alongside this adapter; core is a peer so errors, backend contracts, leases and execution logic share one identity.

```js
import { createConcurrentRuntime } from '@nocobase/concurrency';
import { LocalConcurrentBackend } from '@nocobase/concurrency-local';

const backend = new LocalConcurrentBackend();
const runtime = await createConcurrentRuntime({
  backend,
  namespace: 'orders:local',
});
const executor = await runtime.manager.createSynchronous('order:123', {
  ttl: 30000,
});
const value = await executor.run(async ({ signal }) => {
  signal.throwIfAborted();
  return 42;
});
console.log(value);
await runtime.close();
await backend.close();
```

## Competition and time

Sessions created on the same backend share exact namespace/kind/name resources and must use the same Clock and Scheduler objects. Defaults are shared core instances. Different backends, processes, isolates and namespaces are isolated. A same-name lock and executor compete for the same lock resource. Names are neither trimmed nor Unicode/case normalized; state keys encode the structured tuple rather than concatenate unescaped names.

TTL defaults to 30000ms. Every successful attempt uses a new token and actual monotonic grant time plus TTL. Resource timers carry token/version checks, round delays up, rearm when early, and only trigger best-effort cleanup. Each acquisition and release also purges by actual time, so delayed timers do not extend ownership. Expiry permits another acquisition but never stops old business code. Expired manual leases still require return before runtime/session close.

`new LocalConcurrentBackend({ retryIntervalMs: 10 })` configures the retry interval. It must be an integer in 1..2147483647. Ordinary `lock({ signal })` and `run(runner, { signal })` use protocol v1 `unbounded` waits: retries continue outside the gate until success, cancellation or failure, without a 30-second acquisition limit. Single try calls attempt at most once. Positive positional try timeouts use `bounded` waits of min(interval, remaining deadline). Both retry modes are cancellable per request. There is no FIFO, fairness or starvation guarantee; core does not add another retry loop. No call to `async-mutex.cancel()` can cancel another request. The initial session protocol is fixed at 1 while unpublished; other protocol versions are rejected explicitly.

## State and lifecycle

A registry reference is pinned synchronously before waiting for a real Mutex gate. Critical sections never await business/I/O or publish scheduler/signal effects. Effects run after unlocking, while references and effect counts protect the state against reclamation. Empty state is deleted only if it has no holder/reference/timer/effect and the map still points to it. Facades resolve the registry on each call instead of caching reclaimable state pointers.

Each grant releases only its original token. Repeated and concurrent release are idempotent; failed gate entry can be retried without affecting a newer token. No private core classes, copied public errors, leases or executors are used. The root entry exports `LocalConcurrentBackend` and `LocalConcurrentBackendOptions`; adapter implementation modules are not public exports.

Runtime close belongs to core: it refuses new work, cancels only undelivered acquisition, waits for real runners/manual returns, retains failed executor cleanup and permits retry after close timeout. Backend close rejects while any session remains; after sessions close it rejects new sessions and drains visible timer/gate promises. Closing one runtime does not close the shared backend. No global singleton or implicit application/environment configuration is installed.

## Supported scope

Capabilities are `lock:true`, `executor:true`, `semaphore:false`, `autoRenew:false`. Core rejects owner, priority (including zero), automatic renewal and semaphore creation before storage effects. There is no extend, reentrancy, read/write mode, final atomic validity proof, strong replay barrier or automatic migration of existing business locks. See core's documentation for independent acquisition/executor signals, conservative success semantics and business error priority.

## Verification

Run scoped `fix`, `lint`, `typecheck`, `test` and `build`. Tests run the published framework-neutral backend/fault drivers, deterministic Clock/Scheduler races, actual Mutex gate blocking, old timer/token checks, release failures, business/cause/logger edge cases, close retry/isolation and dynamic-name reclamation. A real event-loop integration case runs competing callbacks using the actual async-mutex implementation. `node tests/verify-packed.mjs <artifact-directory>` packs this package, installs it with a freshly packed core in a temporary directory outside the workspace, checks declarations/public entries and executes real multi-manager competition and public contract drivers. Tests never imply cross-process coordination or Redis correctness.
