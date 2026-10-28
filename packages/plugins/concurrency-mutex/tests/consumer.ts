import {
  createConcurrentRuntime,
  type ConcurrentRuntime,
} from '@nocobase/concurrency';
import type { ConcurrentBackend } from '@nocobase/concurrency/backend';
import {
  LocalConcurrentBackend,
  type LocalConcurrentBackendOptions,
} from '../src/index.ts';

export async function consume(): Promise<ConcurrentRuntime> {
  const options: LocalConcurrentBackendOptions = { retryIntervalMs: 10 };
  const backend: ConcurrentBackend = new LocalConcurrentBackend(options);
  const runtime = await createConcurrentRuntime({
    backend,
    namespace: 'consumer',
  });
  const value: number = await (
    await runtime.manager.createSynchronous('r')
  ).run(() => 1);
  void value;
  const lock = await runtime.manager.createLock('r');
  const executor = await runtime.manager.createSynchronous('r');
  const signal = new AbortController().signal;
  await (await lock.lock({ signal })).release();
  await executor.run(() => 1, { signal });
  // @ts-expect-error Ordinary lock waits do not accept timeoutMs.
  await lock.lock({ timeoutMs: 10 });
  // @ts-expect-error Ordinary executor waits do not accept timeoutMs.
  await executor.run(() => 1, { timeoutMs: 10 });
  // @ts-expect-error The backend does not own shared executor implementations.
  backend.createSynchronous('r');
  // @ts-expect-error Priority does not belong to local backend options.
  new LocalConcurrentBackend({ priority: 0 });
  return runtime;
}
