# @nocobase/concurrency

Node 24 ESM coordination with fixed-TTL, non-reentrant locks and serial executors. Applications explicitly supply a backend; this package contains no production storage adapter. A runtime asynchronously opens one backend session. Different sessions can share a backend without closing it on runtime shutdown.

## Public entries

- `@nocobase/concurrency`: `createConcurrentRuntime`, caller interfaces and six shared error constructors.
- `@nocobase/concurrency/backend`: protocol v2 extension interfaces, `defaultClock`, `defaultScheduler`, `encodeResourceKey` and the identical error constructors.
- `@nocobase/concurrency/testing`: compiled, framework-neutral `runBackendContract`, `runCoreFaultContract`, `ControlledBackend`, `ManualTime`, `deferred` and shared errors. No Vitest runtime dependency.

Source exports are used inside the workspace; published exports resolve to JavaScript and declarations in `dist`. Adapters declare core as a peer, import only these public entries, and never duplicate errors, leases or execution logic.

## Executable core-only example

This controlled fixture demonstrates public consumption, not a production lock. Run after installing the packed package with `node example.mjs`:

```js
import { createConcurrentRuntime } from '@nocobase/concurrency';
import {
  ControlledBackend,
  runCoreFaultContract,
} from '@nocobase/concurrency/testing';

const backend = new ControlledBackend({
  acquire: async (request, context) => ({
    notAfter: context.clock.now() + request.resource.ttl,
    release: async () => {},
  }),
});
const runtime = await createConcurrentRuntime({
  backend,
  namespace: 'example',
});
const executor = await runtime.manager.createSynchronous('report');
console.log(
  await executor.run(({ signal }) => {
    signal.throwIfAborted();
    return 42;
  }),
);
await runtime.close();
await backend.close();
console.log(await runCoreFaultContract());
```

With a production backend, create a lock using `await runtime.manager.createLock(name, { ttl })`; `lock({ timeoutMs, signal })` throws on busy, while `tryLock(timeoutMs, { signal })` returns `undefined` only for normal non-acquisition. Each successful call returns a distinct `Lease` with `release(): Promise<void>`. Prefer executors to manual `finally` blocks when preserving business exceptions matters. `tryRun` returns `{ acquired: false }` or `{ acquired: true, value }`.

## Time and delivery

TTL, default acquisition wait and close wait default to 30000ms. `operationTimeoutMs` and `cleanupTimeoutMs` default to 5000ms and describe individual backend command budgets, not hard deadlines for third-party compound methods. Milliseconds are integers in 1..2147483647; only try waits allow 0. Omitted/zero try waits mean at most one attempt, not a zero-length delivery deadline. The backend owns bounded retries; core calls `session.acquire` once per logical request.

The monotonic clock and scheduler can be injected for deterministic testing. A grant's `notAfter` belongs to that same clock domain and includes conservative elapsed acquisition time. Final delivery checks cancellation, closing, wait deadline and grant budget. Confirmed late grants are released without invoking the runner; unknown backend results throw rather than becoming busy. Visible promises remain tracked until settlement. Waiting budgets do not forcibly interrupt backend methods or business callbacks.

Acquisition signals affect delivery only. Each executor receives an independent `{ signal }` with a unique `ConcurrentLeaseLostError` reason on observed budget loss. TTL notifications are best effort; delayed timers do not extend the budget. TTL does not stop old code or fence business writes. The executor rechecks its budget before and after release. Its normal result is not proof of atomic validity throughout the callback.

## Lifecycle and failures

The six errors are `ConcurrentConfigurationError`, `ConcurrentAcquireError`, `ConcurrentAbortError`, `ConcurrentLeaseLostError`, `ConcurrentReleaseError` and `ConcurrentCloseError`. Concurrent release calls share an in-flight promise; failure retains the original grant for retry and never makes the lease usable again. An independent business throw wins unchanged, including `undefined` and `null`. Only identity or an explicit safe `cause` chain associates a thrown value with lease loss; an `AbortError` name alone does not. Diagnostic logger failures cannot alter outcomes. Applications should redact backend errors before writing diagnostic payloads to persistent logs.

`runtime.close({ timeoutMs })` rejects new work, cancels this session's undelivered acquisitions and waits for real callbacks and manual lease returns. Expired manual leases still require return. Failed executor/late-grant cleanup is retained and retried on subsequent close calls. Timeout leaves the runtime closing and permits another wait. In-flight session close is retained across timeouts. Runtime close does not close the shared backend; backend close does not own external clients. Closed means visible lifecycle drained, not that remote commands were withdrawn or Redis is empty.

## Protocol v2 and resource domains

The public backend has `openSession(context)` and `close()`. A session provides immutable `protocolVersion: 2`, capabilities, `validateResource`, `acquire` and `close`. Each request has unique `requestId` and token; each confirmed grant has `notAfter` and identity-bound `release`. Tokens are not server-side terminal replay barriers. No renew, validate-and-release or cancel-acquire protocol exists.

Competition uses the exact `(namespace, kind, name)` tuple, without trimming or Unicode/case normalization. Lock and same-name executor share `kind: 'lock'`; semaphore is a separate kind. `encodeResourceKey` returns `nb-concurrency:v2:` plus base64url UTF-8 of `JSON.stringify([namespace, name])`; Redis libraries add their own `mutex:`/`semaphore:` kind prefix. Local adapters must preserve the same tuple identity. Changing the encoding requires draining and migrating all participants.

## Scope and testing

First-version capabilities are lock/executor true and semaphore/autoRenew false. Semaphore types remain reserved but creation is gated. `autoRenew: true`, non-undefined owner and priority (including zero) are rejected before backend effects. No extend, reentrancy, read/write locks, FIFO/fairness guarantee, strong replay prevention or final atomic validity check is provided. Explicit application transactions, idempotency and fencing remain necessary. No existing business locking is migrated automatically.

Run `runBackendContract({ createBackend })` against a fresh production backend for public competition/isolation/cleanup scenarios. Run `runCoreFaultContract()` for deterministic late-delivery cases; production adapters need no fault injection controls. `ControlledBackend` is only a programmable test fixture, not a storage engine. Adapter-specific real-network, TTL, failure and recycling tests are additional obligations, not implied by passing this baseline suite. Package tests include deterministic release/error/close races and compile-only positive and negative consumers.
