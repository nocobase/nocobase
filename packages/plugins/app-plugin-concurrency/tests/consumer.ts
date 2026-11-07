import {
  concurrencyServiceToken,
  type ConcurrencyService,
} from '@nocobase/app-plugin-concurrency/server';
import {
  ManagedLeaseRegistry,
  startAcquire,
  type AcquireTask,
  createSynchronousExecutor,
  encodeResourceKey,
  type ConcurrencyImplementation,
  type ManagedLeaseAcquireOptions,
} from '@nocobase/app-plugin-concurrency/server';
import type { ConcurrentManager } from '@nocobase/concurrency';
export async function consumer(service: ConcurrencyService): Promise<void> {
  const manager = await service.getManager();
  const lock = await manager.createLock('installed', { ttl: 1000 });
  await (await lock.lock()).release();
  const executor = createSynchronousExecutor(lock);
  const value: number = await executor.run(() => 42);
  void value;
}
export function extension(
  manager: ConcurrentManager,
): ConcurrencyImplementation {
  return {
    validate: () => {},
    create: () => ({
      manager,
      start: async () => {},
      shutdown: async () => {},
    }),
  };
}
void [concurrencyServiceToken, ManagedLeaseRegistry, encodeResourceKey];
export type PrivateMutex =
  // @ts-expect-error Private implementation paths are not public exports.
  import('@nocobase/app-plugin-concurrency/server/mutex/instance').MutexConcurrencyInstance;
export type NoExtensionEntry =
  // @ts-expect-error All public implementation tools belong to the Server entry.
  import('@nocobase/app-plugin-concurrency/server/extensions').ManagedLeaseRegistry;
export const managedOptions: ManagedLeaseAcquireOptions = {
  signal: new AbortController().signal,
  acquire: async () => async () => {},
};
export const invalidManagedOptions: ManagedLeaseAcquireOptions = {
  ...managedOptions,
  // @ts-expect-error The registry owns releasers, not lease duration or renewal.
  ttl: 1000,
};

export async function managedAcquisition(): Promise<void> {
  const registry = new ManagedLeaseRegistry();
  const task: AcquireTask = startAcquire(registry, managedOptions);
  await (await task.result)?.release();
  await task.completion;
  registry.register(async () => {});
  await registry.releaseAll();
  registry.clear();
}
export function removedRegistryMethods(registry: ManagedLeaseRegistry): void {
  // @ts-expect-error The registry only registers confirmed releasers.
  registry.acquire(managedOptions);
  // @ts-expect-error Pending acquisitions belong to the instance.
  registry.settlePending();
}
export type PrivateMutexLock =
  // @ts-expect-error Mutex adaptation is not a public subpath.
  import('@nocobase/app-plugin-concurrency/server/mutex/lock').createMutexLock;
export type PrivateAcquireModule =
  // @ts-expect-error Implementation tools use the single Server entry.
  import('@nocobase/app-plugin-concurrency/server/acquire').AcquireTask;
export type PrivateRequest =
  // @ts-expect-error The per-request class is not a public contract.
  import('@nocobase/app-plugin-concurrency/server').AcquireRequest;
