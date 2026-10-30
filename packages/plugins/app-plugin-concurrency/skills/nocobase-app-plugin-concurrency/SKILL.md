---
name: nocobase-app-plugin-concurrency
description: Configure and consume NocoBase 3 process-local Mutex locks, strict named managers, original service Token, optional TTL, public implementation extensions and application-owned shutdown.
---

# Concurrency

## Install and register

Install `@nocobase/app-plugin-concurrency` with compatible application-supplied `@nocobase/app-server`, `@nocobase/service-provider` and `@nocobase/concurrency` peers. Register the default `/server` definition before business plugins and register `defineConcurrencyConfig()` from `/config` under `concurrency`. Installation and both registrations are separate requirements.

The factory supplies `default: memory` and `memory.adapter: mutex`, declares `CONCURRENCY_DEFAULT` and exposes no browser fields. Entry fields are `adapter`, optional `namespace` (application name by default), optional `ttl`, and implementation-owned `connection`. Mutex forbids connection. TTL is a renewable lease duration, an integer from 1 through 2147483647 milliseconds. Local Mutex accepts and validates TTL but ignores it, with no holding timer, expiration release or local renewal. Resource TTL overrides configuration TTL; `undefined` retains configuration TTL. Unknown options and invalid selectors fail. Entries do not inherit from one another. Two enabled local entries cannot share a namespace.

## Consume the original service

```ts
import { concurrencyServiceToken } from '@nocobase/app-plugin-concurrency/server';

const service = app.container.resolve(concurrencyServiceToken);
// Obtain managers in ready or normal running work.
const manager = await service.getManager();
const executor = await manager.createSynchronous('orders:sync');
const result = await executor.tryRun(async () => 'done', 500);
```

Inject the owner-created Token; never create a second Token or service. The same configuration name shares one manager. Same-name Lock and Executor handles compete in the same domain regardless of TTL. Use bounded, stable resource names: the local native Mutex table remains until instance shutdown. Local locks coordinate only within that instance, never across processes.

`lock` and `run` wait without a deadline until success, cancellation or failure. Omitted/zero positional try budgets use native `tryAcquire`, including its zero-millisecond timer window. Positive try budgets use native `withTimeout`, not a precise return deadline. Busy results come only from explicit native non-acquisition. Capture each call's signal once; cancellation before delivery must not affect other waiters. Cancellation after delivery does not release a Lease or stop a runner. Late native success after cancellation is released using its own releaser without delivery, runner execution or TTL timer.

Lease release is asynchronous and idempotent; concurrent calls share a result and failures permit explicit retry on the same handle while its instance remains usable. Executors combine Lock acquisition with a no-argument runner, wait for actual runner settlement and diagnose cleanup failure without replacing business values or exceptions. Local Mutex remains held beyond an explicit TTL until manual release, actual runner settlement or instance shutdown. TTL is not a runner timeout or a validity guarantee. Redis implementations use native automatic renewal for both Lock and Executor, not an Executor-owned renewal loop. Use application transactions and idempotency where required.

## Lifecycle and extensions

The Provider owns initialization and shutdown. Default startup is eager; named configurations initialize lazily and concurrently share one initialization. Boot freezes the complete snapshot, including unused entries. Reload requires restart to apply changes and never changes active or lazy domains.

Applications stop dependent business work before Concurrency shutdown. Shutdown rejects new acquisitions, interrupts waits, observes issued native requests and actively releases confirmed Leases without draining runners. Release failures are diagnosed while cleanup continues. Concurrent shutdown shares a Promise and successful shutdown is idempotent. Failed owned-resource closure retains its handle for explicit owner `service.shutdown()` retry. A second `app.shutdown()` does not repeat cached Provider shutdown. No public operation, cleanup or overall shutdown deadline is configured.

Implementation authors use `/server`: `ManagedLeaseRegistry`, `startAcquire`, `createSynchronousExecutor`, `encodeResourceKey` and the original implementation/configuration types. The registry registers confirmed releasers synchronously and owns only Lease release and record disposal, not acquisition, pending work, TTL or renewal. `startAcquire(registry, { signal, acquire }, report?)` returns a caller-facing result and optional completion for native acquisition plus late-grant cleanup. Each instance tracks and drains completion, which may outlive cancellation, before releasing confirmed Leases and closing native resources. Register through the original service during Provider register; validate at boot without I/O. Synchronous create returns a fresh `{ manager, start(), shutdown() }` and performs no networking; the service saves it before awaiting start. Each instance owns one shutdown signal and must handle start/shutdown interleaving without reopening resources. Extend `ConcurrencyAdapterConnections` through the public declaration entry for connection typing. Do not import internal paths or duplicate error constructors, Tokens or execution tools. OSS does not require a Redis implementation.

## Verify

Verify both registrations, two real consumers sharing a manager, same-name Lock/Executor contention, cancellation and natural host shutdown. Test strict names, optional TTL and startup snapshots. Verify installed compiled exports and declarations outside the workspace using fixed tarballs. Local competition and extension lifecycle fixtures do not establish Redis or cross-process correctness.
