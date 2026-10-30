# @nocobase/concurrency

Business interfaces and five shared error constructors for Node 24 ESM concurrency implementations. This package contains no implementation, timers, connections or application services. Applications obtain a `ConcurrentManager` from their configured service.

## Business contract

```ts
import type { ConcurrentManager } from '@nocobase/concurrency';

export async function report(manager: ConcurrentManager): Promise<string> {
  const executor = await manager.createSynchronous('reports:daily');
  return executor.run(async () => 'completed');
}
```

`createLock(name, { ttl? })` and `createSynchronous(name, { ttl? })` are asynchronous. Same-name Locks and Executors share their manager's competition domain. Resource names are non-empty strings preserved exactly; TTL does not affect identity.

`lock({ signal? })` and `run(runner, { signal? })` wait until success, cancellation or failure without an acquisition deadline. `tryLock(timeoutMs?, { signal? })` returns a Lease or `undefined`; `tryRun(runner, timeoutMs?, { signal? })` returns `{ acquired: true, value }` or `{ acquired: false }`. Omitted or zero try budgets select a native single attempt, including its zero-millisecond timer window. Positive budgets use native bounded waiting, not a precise return deadline or a second success-budget check. Millisecond values are integers through 2147483647; only try budgets allow zero.

Acquisition captures the original signal once. Cancellation affects only acquisition before Lease delivery. It does not release a delivered Lease or stop business work. Cancelled native acquisitions remain observed; a confirmed late success is released without delivery or runner execution.

A Lease exposes only `release(): Promise<void>`. Concurrent release calls share an in-flight result; successful release is idempotent and failed release can be explicitly retried on the original handle while its instance remains usable. Prefer Executors for automatic release: runners take no arguments, execute once, and retain their actual value or original exception even if automatic cleanup fails.

TTL is an optional renewable lease duration, not a maximum holding time, runner timeout or validity guarantee. The process-local async-mutex implementation accepts and validates TTL but ignores it: neither omitted nor explicit TTL creates a holding timer or expires ownership. Executors keep the Mutex until the runner actually settles, unless the application shuts down. Lease-based implementations own their native renewal behavior. Applications remain responsible for transactions, idempotency and any fencing they require.

## Errors and ownership

The only runtime exports are `ConcurrentConfigurationError`, `ConcurrentAcquireError`, `ConcurrentAbortError`, `ConcurrentReleaseError` and `ConcurrentCloseError`. Each supports the standard Error cause option. Declare this package as a peer when sharing these constructors across plugin boundaries.

Managers expose only business factories, not lifecycle methods. Applications end dependent business work before their concurrency service shuts down. Implementation registration and lifecycle belong to `@nocobase/app-plugin-concurrency` and its public `/server` entry.

## Verification

Run scoped `lint`, `typecheck`, `test` and `build`. Compile-only consumers check runner signatures, result narrowing and unsupported operations. The packed consumer verifies installed declarations and the compiled runtime exports outside the workspace.
