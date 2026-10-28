import {
  createConcurrentRuntime,
  type Lease,
  type SynchronousExecutor,
} from '../src/index.ts';
import type {
  ConcurrentBackend,
  BackendContext,
  ResourceSpec,
  ConcurrentBackendSession,
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
  // @ts-expect-error Unimplemented factories are not public APIs.
  runtime.manager.createSemaphore('s', 2);
  // @ts-expect-error No capability negotiation for placeholder features.
  runtime.capabilities;
  // @ts-expect-error Automatic renewal is not a public option, even false.
  await runtime.manager.createSynchronous('r', { autoRenew: false });
  await createConcurrentRuntime({
    backend,
    namespace: 'n',
    // @ts-expect-error No global acquisition deadline exists.
    defaultAcquireTimeoutMs: 10,
  });
  await runtime.close();
}
export function extension(context: BackendContext): void {
  const version: 1 = context.protocolVersion;
  void version;
  // @ts-expect-error Only the initial protocol version is supported.
  const unsupportedVersion: 2 = context.protocolVersion;
  void unsupportedVersion;
  // @ts-expect-error Historical low-level operations are not public.
  context.cancelAcquire();
}
void runBackendContract;
void ControlledBackend;

// @ts-expect-error Unimplemented semaphore types are not exported.
export type RemovedSemaphore = import('../src/index.ts').Semaphore;
// @ts-expect-error There is no reserved executor-options extension.
export type RemovedExecutorOptions = import('../src/index.ts').ExecutorOptions;
// @ts-expect-error No placeholder capability type is exported.
export type NoCaps = import('../src/index.ts').ConcurrentCapabilities;

export function backendSurface(
  resource: ResourceSpec,
  session: ConcurrentBackendSession,
): void {
  const kind: 'lock' = resource.kind;
  void kind;
  // @ts-expect-error No reserved semaphore resource kind exists.
  resource.kind = 'semaphore';
  // @ts-expect-error No reserved capacity field exists.
  resource.permits;
  // @ts-expect-error Backend sessions have no placeholder capability map.
  session.capabilities;
}
