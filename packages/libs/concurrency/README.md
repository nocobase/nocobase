# @nocobase/concurrency

Node 24 ESM coordination with fixed-TTL, non-reentrant locks and serial executors. Applications explicitly supply a backend; this package contains no production storage adapter. A runtime exclusively owns the supplied backend, initializes it once and closes it during runtime shutdown. Supply a fresh backend instance for each runtime; reusing one is rejected even during initialization or after close.

## Public entries

- `@nocobase/concurrency`: `createConcurrentRuntime`, caller interfaces and six shared error constructors.
- `@nocobase/concurrency/backend`: protocol v1 extension interfaces, `defaultClock`, `defaultScheduler`, `encodeResourceKey` and the identical error constructors.
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
console.log(await runCoreFaultContract());
```

With a production backend, create a lock using `await runtime.manager.createLock(name, { ttl })`. `lock({ signal })` and executor `run(runner, { signal })` wait until acquisition succeeds, is cancelled, or fails; neither accepts an acquisition timeout. Only `tryLock(timeoutMs, { signal })` and `tryRun(runner, timeoutMs, { signal })` accept a finite wait budget. `tryLock` returns `undefined` only for normal non-acquisition. Each successful call returns a distinct `Lease` with `release(): Promise<void>`. Prefer executors to manual `finally` blocks when preserving business exceptions matters. `tryRun` returns `{ acquired: false }` or `{ acquired: true, value }`.

## Time and delivery

TTL and close wait default to 30000ms. Ordinary `lock` and `run` have no overall acquisition deadline; they do not stop waiting after 30 seconds. `WaitOptions` and `defaultAcquireTimeoutMs` are not public configuration. JavaScript calls that supply removed acquisition timeout options are rejected before backend effects. `operationTimeoutMs` and `cleanupTimeoutMs` default to 5000ms and describe individual backend command budgets, not hard deadlines for third-party compound methods. Milliseconds are integers in 1..2147483647; only positional try waits allow 0. Omitted/zero try waits mean at most one attempt, not a zero-length delivery deadline. The backend owns cancellable retries for ordinary and bounded waits; core calls `backend.acquire` once per logical request.

The monotonic clock and scheduler can be injected for deterministic testing. A grant's `notAfter` belongs to that same clock domain and includes conservative elapsed acquisition time. Final delivery checks cancellation, closing, wait deadline and grant budget. Confirmed late grants are released without invoking the runner; unknown backend results throw rather than becoming busy. Visible promises remain tracked until settlement. Waiting budgets do not forcibly interrupt backend methods or business callbacks.

A positive try budget exhausted before the first backend call returns normal non-acquisition (`undefined` or `{ acquired: false }`). Caller cancellation and closing remain errors, as do backend failures and confirmed grants arriving too late. Deadline timers round scheduling delays up and recheck the monotonic clock on notification; early notifications rearm the timer instead of cancelling acquisition, and obsolete callbacks cannot restart completed waits.

Acquisition signals affect delivery only. Each executor receives an independent `{ signal }` with a unique `ConcurrentLeaseLostError` reason on observed budget loss. TTL notifications are best effort; delayed timers do not extend the budget. TTL does not stop old code or fence business writes. The executor rechecks its budget before and after release. Its normal result is not proof of atomic validity throughout the callback.

## Lifecycle and failures

The six errors are `ConcurrentConfigurationError`, `ConcurrentAcquireError`, `ConcurrentAbortError`, `ConcurrentLeaseLostError`, `ConcurrentReleaseError` and `ConcurrentCloseError`. Concurrent release calls share an in-flight promise; failure retains the original grant for retry and never makes the lease usable again. An independent business throw wins unchanged, including `undefined` and `null`. Only identity or an explicit safe `cause` chain associates a thrown value with lease loss; an `AbortError` name alone does not. Diagnostic logger failures cannot alter outcomes. Applications should redact backend errors before writing diagnostic payloads to persistent logs.

`runtime.close({ timeoutMs })` rejects new work, cancels undelivered acquisitions and waits for real callbacks and manual lease returns before closing its backend. Applications normally call only runtime close, not backend close. Expired manual leases still require return. Failed executor/late-grant cleanup is retained and retried on subsequent close calls. Timeout leaves the runtime closing and permits another wait. In-flight backend close is retained across caller timeouts. A backend close failure rejects all current close waiters; a later close call retries it. Closed means the owned backend has drained visible work, not that remote commands were withdrawn or Redis is empty. Backend ownership does not transfer ownership of external clients borrowed by an adapter.

Runtime options are validated before ownership is claimed. Once claimed, the backend is consumed for one runtime lifetime, including failed initialization. Protocol rejection or initialization failure triggers backend cleanup and preserves the original failure; cleanup failures are reported to the optional diagnostic logger without replacing that failure. If startup returns no runtime and cleanup fails, retain the original backend to retry exceptional cleanup directly. Do not reuse that instance for another runtime. Adapters must reject repeated initialization and keep close idempotent and retryable, including after partial initialization.

Confirmed grants enter cleanup tracking before any external lease-timer registration. If monitoring cannot start, acquisition fails without delivering a lease or entering the runner, and core releases the original grant; a failed release remains retained for a later close retry. After delivery, a monitoring rearm failure marks the lease lost rather than escaping as an uncaught timer callback, but still waits for real business completion before cleanup. Timer cancellation failures are diagnostic and cannot prevent grant release.

Each close caller has its own monotonic deadline. Close timer delays round up and notifications recheck remaining time; early notifications rearm instead of rejecting, while obsolete or completed callbacks cannot restart a wait. Close-timer registration/rearm failure rejects that caller with `ConcurrentCloseError`, removes its observer and leaves runtime/backend cleanup retryable.

## Protocol v1 and resource domains

The public backend directly provides `protocolVersion`, `initialize(context)`, `validateResource`, `acquire` and `close()`. It has no session factory or session interface. The initial protocol is fixed at `protocolVersion: 1` while this library is unpublished; draft revisions are not released protocol versions. Each request has unique `requestId` and token; each confirmed grant has `notAfter` and identity-bound `release`. Wait policies are `unbounded` for ordinary acquisition, `single` for omitted/zero try waits, and `bounded` with a monotonic deadline for positive try waits. Other protocol versions are rejected explicitly. Tokens are not server-side terminal replay barriers. No renew, validate-and-release or cancel-acquire protocol exists. Resource-key encoding is versioned independently of the backend protocol.

Competition uses the exact `(namespace, kind, name)` tuple, without trimming or Unicode/case normalization. Lock and same-name executor both use the only supported resource kind, `'lock'`. `encodeResourceKey` returns `nb-concurrency:v2:` plus base64url UTF-8 of `JSON.stringify([namespace, name])`; Redis mutex libraries add their own native prefix. Local adapters preserve the same tuple identity. Changing the encoding requires draining and migrating all participants.

## Scope and testing

This version exposes only complete fixed-TTL Lock and SynchronousExecutor APIs. Both factories accept `ConcurrentOptions` with `ttl`; acquisition options contain only `signal`. There is no semaphore factory/type, automatic-renewal option, capability negotiation or reserved backend resource branch. Unknown option keys are rejected before backend effects, including `autoRenew: false` or `undefined`; they are not supported no-op settings. Reentrancy, read/write locks, FIFO/fairness, strong replay prevention and final atomic validity checks are outside this API. Explicit application transactions, idempotency and fencing remain necessary. No existing business locking is migrated automatically.

Run `runBackendContract({ createBackend })` with a factory returning a fresh owned backend on every invocation for public competition/isolation/cleanup scenarios. Run `runCoreFaultContract()` for deterministic late-delivery cases; production adapters need no fault injection controls. `ControlledBackend` is only a programmable test fixture, not a storage engine. Adapter-specific real-network, TTL, failure and recycling tests are additional obligations, not implied by passing this baseline suite. Package tests include deterministic release/error/close races and compile-only positive and negative consumers.
