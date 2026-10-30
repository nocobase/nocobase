# @nocobase/app-plugin-concurrency

Application-owned concurrency configuration, services, process-local Mutex instances and public implementation tools for NocoBase 3. Requires Node 24 ESM and compatible `@nocobase/app-server`, `@nocobase/service-provider` and `@nocobase/concurrency` peers supplied by the application.

## Application integration

Register the default `/server` export before business plugins in `server/plugins.ts`. Register `defineConcurrencyConfig()` from `/config` under `concurrency` in the application's configuration aggregator. Both application templates include these registrations and production dependencies.

```ts
import concurrency from '@nocobase/app-plugin-concurrency/server';
import { defineServerPlugins } from '@nocobase/app-server/plugins';

export default defineServerPlugins([concurrency]);
```

The factory supplies `{ default: 'memory', memory: { adapter: 'mutex' } }`, declares `CONCURRENCY_DEFAULT` and publishes no browser fields. A host without a default selector uses an independent built-in local entry. Unknown names and invalid defaults fail instead of falling back. Common entry fields are `adapter`, optional `namespace` (defaults to the application name) and optional `ttl`. Mutex forbids `connection`; other implementations validate their own connection data without I/O. TTL is an integer in 1..2147483647 milliseconds. Configuration entries do not inherit from one another.

## Business consumption

```ts
import { concurrencyServiceToken } from '@nocobase/app-plugin-concurrency/server';

const service = app.container.resolve(concurrencyServiceToken);
// Obtain managers in ready or normal running work.
const manager = await service.getManager();
const executor = await manager.createSynchronous('reports:daily');
const result = await executor.tryRun(async () => 'done', 500);
```

Inject the original service Token, never a locally recreated Token. The same configuration shares one manager. `getManager(name)` strictly selects a declared entry. Same-name Lock and Executor handles compete for the same native Mutex, independent of TTL. Each enabled local configuration owns its instance; duplicate enabled local namespaces are rejected.

Local acquisition uses the public `async-mutex` API: ordinary `acquire`, `tryAcquire` for omitted/zero try budgets, and `withTimeout` for positive budgets. Native timeout errors alone produce busy results. No second acquisition deadline or success-budget recheck is applied. Signals are captured once and cancel only undelivered acquisitions. Native late successes after cancellation are released on their original releaser without TTL setup or runner entry; cancelling one request never cancels the shared Mutex queue.

TTL is a renewable lease duration, not a maximum holding time or runner timeout. Resource TTL overrides configuration TTL for lease-based implementations; `undefined` retains the configured value. The local async-mutex implementation validates legal values but ignores both: no holding timer, expiration release or local renewal is scheduled. A local Lease remains held until manual release, actual runner settlement or instance shutdown. Executors compose Lock, call no-argument runners once and diagnose automatic release failures without replacing business results. Redis implementations use native automatic renewal for both Lock and Executor without public renewal controls.

Native Mutex entries remain in the instance until shutdown. Use stable, bounded resource names rather than unbounded one-use names. Local coordination applies only within an instance, not between processes or separate applications.

## Configuration and lifecycle

Boot copies and freezes the complete configuration snapshot, including lazy entries. Reload warns that a restart is required; it does not change an active or lazy instance's namespace, TTL or connection. Default initialization occurs during service start; named initialization is lazy and shared. Failed initialization retains the instance for cleanup and never rebuilds it implicitly.

Applications stop dependent business work before shutting down Concurrency. Shutdown permanently rejects new work, interrupts undelivered requests, cancels local native queues, observes in-flight acquisitions and actively releases confirmed Leases. It does not wait for runners to finish. Individual release failures are diagnosed while remaining cleanup continues. Concurrent shutdown calls share an in-flight result; successful shutdown is idempotent. Failed owned-resource cleanup preserves its handle for explicit service/instance retry. The host caches Provider shutdown, so a second `app.shutdown()` does not repeat failed Provider cleanup. There is no public operation, cleanup or overall shutdown deadline.

Diagnostics cannot alter business or cleanup results. Default logging includes only safe phase/configuration identifiers, not raw exceptions or connection data. Local use outside development warns that coordination is process-local.

## Public exports and extensions

- `/server`: static Server definition, original `concurrencyServiceToken`, Provider, service/configuration/instance/diagnostic contracts, `ManagedLeaseRegistry`, `startAcquire`, `createSynchronousExecutor` and `encodeResourceKey`.
- `/config`: configuration factory, common configuration types and pure validation.
- `/package.json`: package metadata.

The built-in `MutexConcurrencyInstance` lives in `server/mutex/instance.ts`. It is an internal implementation; consumers and adapter authors import the public contracts and tools directly from `@nocobase/app-plugin-concurrency/server`.

Implementations register in Provider `register()` through the original service. All registrations complete before boot validation; business obtains managers in `ready()` or normal running work. `validate(entry)` and synchronous `create(entry)` perform no network I/O. `create` returns a fresh `{ manager, start(), shutdown() }` instance; the service saves it before awaiting start. Instances must handle start/shutdown interleaving without reopening resources after closure. Managers expose no shutdown method.

`ManagedLeaseRegistry.register(nativeRelease)` synchronously registers a confirmed releaser and returns its Lease. `releaseAll()` attempts every confirmed release and diagnoses failures; `clear()` only discards records and must run after owned resources have closed. `startAcquire(registry, { signal, acquire }, report?)` observes one native acquisition and returns `{ result, completion? }`. The result settles for the caller; completion also waits for any late-grant cleanup and may outlive cancellation. Each implementation instance tracks and drains these completions before releasing confirmed Leases. The registry neither acquires nor tracks pending work. These tools do not manage TTL or renewal. The implementation classifies native errors, combines request/shutdown signals and owns native resource closure. Code-only reporters may receive controlled causes and must not be serialized into configuration. `createSynchronousExecutor(lock, report?)` preserves business-result priority.

`encodeResourceKey(namespace, name)` returns `nb-concurrency:v2:` followed by base64url UTF-8 JSON of `[namespace, name]`. Configuration names and TTL are not part of the key. `ConcurrencyAdapterConnections` supports public module augmentation for implementation-specific connection types. OSS does not include or require a Redis implementation.

## Verification

Run scoped `fix`, `lint`, `typecheck`, `test` and `build`. Tests use real async-mutex competition, controlled release/Promise faults and small public lifecycle implementations. Both templates exercise the real host container. `node tests/verify-packed.mjs <artifact-directory> <host-cohort.json>` verifies installed compiled exports and declarations using a fixed host tarball cohort outside the workspace. Local and extension-fixture checks do not establish Redis or cross-process correctness.
