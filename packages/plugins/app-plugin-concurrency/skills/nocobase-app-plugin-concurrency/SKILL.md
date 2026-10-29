---
name: nocobase-app-plugin-concurrency
description: Configure and consume the NocoBase 3 Concurrency plugin: process-local Mutex locks, strict named managers, original service Token, fixed TTL and application-owned shutdown. Use when an application needs coordinated Lock or SynchronousExecutor work or a concurrency backend registration.
---

# Concurrency

## Install and register

Install @nocobase/app-plugin-concurrency with compatible @nocobase/app-server, @nocobase/service-provider and @nocobase/concurrency peers. Register its default /server export before business plugins in the application's defineServerPlugins list. Register defineConcurrencyConfig() from /config under concurrency in the existing configuration aggregator. Installation, Server registration and configuration registration are separate steps. Do not put the service or Token in app-server or create a same-named Token locally.

The factory defaults to memory.adapter = mutex and default = memory, declares CONCURRENCY_DEFAULT and exposes no browser fields. Common item fields are adapter, namespace (defaults to appName), ttl (30000ms), operationTimeoutMs (5000ms), cleanupTimeoutMs (5000ms), shutdownTimeoutMs (30000ms), and an implementation-owned connection. Mutex forbids connection. Time fields are integers in 1..2147483647. Unknown names and invalid defaults fail; items do not inherit from one another. Two enabled Mutex items cannot use the same namespace.

## Consume the original service

```ts
import { concurrencyServiceToken } from '@nocobase/app-plugin-concurrency/server';

const service = app.container.resolve(concurrencyServiceToken);
// Run this in ready or normal business work, not Provider register/boot/start.
const manager = await service.getManager();
const lock = await manager.createLock('orders:sync', { ttl: 30000 });
const lease = await lock.lock();
try {
  // Work must finish within the fixed TTL; expiry does not stop application code.
} finally {
  await lease.release();
}
```

Inject the service into business objects during boot when needed. getManager(name) selects exactly one declared item; the same name shares one runtime. createSynchronous(name) competes with a same-name Lock. Ordinary lock/run waits are unbounded unless cancelled; bounded waits are positional tryLock/tryRun arguments, never a new resource timeout option. No automatic renewal, Semaphore, reentrancy, fairness or read/write mode is provided. Preserve core cancellation and error semantics.

## Backend and lifecycle ownership

The plugin owns runtime initialization and shutdown. Consumers end their own tasks and return their own leases before host cleanup. They must not close the manager or a shared transport. Only the startup owner retries service.shutdown() after failure; app.shutdown() itself is cached and does not repeat Provider shutdown. Runtime close must succeed before disposing its owned transport. Failure retains the original handles. No hot reconfiguration is supported: the full boot snapshot survives reload, including not-yet-initialized items. Restart and coordinate instances when changing namespaces or connections.

Mutex is process-local even when namespaces match across instances. Multi-instance Redis support comes from @nocobase/app-plugin-concurrency-redis, which owns the Redis backend, original-client release, dedicated connection, implementation registration and Redis-specific pure validator. It must import this OSS plugin's service Token and extension contract; do not add a second Redis thin plugin, copy core state machines, or reuse active Queue/Jobs/Caching clients. Read that plugin's version-matched Skill before configuring Redis. Do not migrate an existing business lock merely by enabling this plugin.

## Verify

Verify both registration steps, two real business consumers sharing one manager, same-name Lock/Executor contention, cancellation, caller lease return and natural shutdown. Validate named selection, defaults and reload through the application's real config commands. Memory tests do not establish Redis or cross-process correctness.
