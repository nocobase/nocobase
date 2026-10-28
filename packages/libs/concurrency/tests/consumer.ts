import {
  createConcurrentRuntime,
  type Lease,
  type SynchronousExecutor,
} from '../src/index.ts';
import type {
  ConcurrentBackend,
  BackendContext,
} from '../src/backend/index.ts';
import { runBackendContract, ControlledBackend } from '../src/testing/index.ts';

export async function consumer(backend: ConcurrentBackend): Promise<void> {
  const runtime = await createConcurrentRuntime({
    backend,
    namespace: 'typed',
  });
  const lock = await runtime.manager.createLock('resource');
  const lease: Lease = await lock.lock();
  await lease.release();
  const executor: SynchronousExecutor =
    await runtime.manager.createSynchronous('resource');
  const text: string = await executor.run(({ signal }) => {
    signal.throwIfAborted();
    return 'value';
  });
  void text;
  // @ts-expect-error Lease has no renewal API.
  lease.extend();
  // @ts-expect-error Owner reentrancy is not supported.
  await runtime.manager.createLock('r', { owner: 'x' });
  // @ts-expect-error Priority is not a public option, including zero.
  await lock.lock({ priority: 0 });
  await executor.run((context) => {
    // @ts-expect-error The executor owns release.
    context.release();
  });
  // @ts-expect-error Read/write locks are not part of this contract.
  runtime.manager.createReadWriteLock('r');
  const signal = new AbortController().signal;
  await (await lock.lock({ signal })).release();
  await executor.run(() => 1, { signal });
  await lock.tryLock(10, { signal });
  await executor.tryRun(() => 1, 10, { signal });
  // @ts-expect-error Only try methods accept acquisition timeouts.
  await lock.lock({ timeoutMs: 10 });
  // @ts-expect-error Ordinary run has no acquisition timeout.
  await executor.run(() => 1, { timeoutMs: 10 });
  const semaphore = await runtime.manager.createSemaphore('s', 2);
  // @ts-expect-error Ordinary acquire has no acquisition timeout.
  await semaphore.acquire({ timeoutMs: 10 });
  await createConcurrentRuntime({
    backend,
    namespace: 'n',
    // @ts-expect-error No global acquisition deadline exists.
    defaultAcquireTimeoutMs: 10,
  });
  await runtime.close();
}
export function extension(context: BackendContext): void {
  const version: 3 = context.protocolVersion;
  void version;
  // @ts-expect-error Protocol v2 cannot express ordinary unbounded waits.
  const oldVersion: 2 = context.protocolVersion;
  void oldVersion;
  // @ts-expect-error Protocol v1 operations must not return.
  context.cancelAcquire();
}
void runBackendContract;
void ControlledBackend;
