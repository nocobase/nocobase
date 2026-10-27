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
  await runtime.close();
}
export function extension(context: BackendContext): void {
  const version: 2 = context.protocolVersion;
  void version;
  // @ts-expect-error Protocol v1 operations must not return.
  context.cancelAcquire();
}
void runBackendContract;
void ControlledBackend;
