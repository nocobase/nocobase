import type {
  ConcurrentManager,
  Lease,
  SynchronousExecutor,
} from '../src/index.ts';

export async function consumer(manager: ConcurrentManager): Promise<void> {
  const lock = await manager.createLock('resource', { ttl: 1000 });
  const lease: Lease = await lock.lock();
  await lease.release();
  const executor: SynchronousExecutor = await manager.createSynchronous(
    'resource',
    { ttl: 2000 },
  );
  const value: string = await executor.run(() => 'value');
  void value;
  const result = await executor.tryRun(async () => 42, 10);
  if (result.acquired) {
    const number: number = result.value;
    void number;
  }
  const signal = new AbortController().signal;
  await (await lock.lock({ signal })).release();
  await lock.tryLock(10, { signal });
  await executor.run(
    // @ts-expect-error Runner has no execution context.
    (context: { signal: AbortSignal }) => context.signal.aborted,
  );
  // @ts-expect-error Lease has no renewal API.
  lease.extend();
  // @ts-expect-error Shared managers do not own application lifecycle.
  manager.shutdown();
  // @ts-expect-error No public runtime lifecycle is exposed.
  manager.close();
  // @ts-expect-error Owner reentrancy is not supported.
  await manager.createLock('r', { owner: 'x' });
  // @ts-expect-error Ordinary lock has no acquisition timeout.
  await lock.lock({ timeoutMs: 10 });
  // @ts-expect-error Ordinary run has no acquisition timeout.
  await executor.run(() => 1, { timeoutMs: 10 });
  // @ts-expect-error There is no public automatic renewal option.
  await manager.createSynchronous('r', { autoRenew: false });
  // @ts-expect-error Semaphore is not a supported factory.
  manager.createSemaphore('r', 2);
}
// @ts-expect-error No execution context is exported.
export type NoContext = import('../src/index.ts').ExecutorContext;
// @ts-expect-error No runtime engine is exported.
export type NoRuntime = import('../src/index.ts').ConcurrentRuntime;
