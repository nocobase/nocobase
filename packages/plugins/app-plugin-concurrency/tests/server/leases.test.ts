import { expect, it, vi } from 'vitest';
import { ConcurrentReleaseError } from '@nocobase/concurrency';
import { ManagedLeaseRegistry } from '../../server/leases.js';

it('registers synchronously without invoking release and removes successful leases', async () => {
  const registry = new ManagedLeaseRegistry();
  const release = vi.fn(async () => {});
  const lease = registry.register(release);
  expect(release).not.toHaveBeenCalled();
  await lease.release();
  await registry.releaseAll();
  await lease.release();
  expect(release).toHaveBeenCalledOnce();
});

it('shares an in-flight release Promise and retries only after failure', async () => {
  const registry = new ManagedLeaseRegistry();
  const barrier = Promise.withResolvers<void>();
  const cause = new Error('release');
  const release = vi
    .fn()
    .mockImplementationOnce(() => barrier.promise)
    .mockResolvedValue(undefined);
  const lease = registry.register(release);
  const first = lease.release();
  const failure = first.catch((error: unknown) => error);
  expect(lease.release()).toBe(first);
  barrier.reject(cause);
  const error = await failure;
  expect(error).toBeInstanceOf(ConcurrentReleaseError);
  expect(error).toHaveProperty('cause', cause);
  await registry.releaseAll();
  await lease.release();
  expect(release).toHaveBeenCalledTimes(2);
});

it('starts all cleanup attempts concurrently and retains failures for retry', async () => {
  const report = vi.fn(() => Promise.reject(new Error('diagnostic')));
  const registry = new ManagedLeaseRegistry(report);
  const blocked = Promise.withResolvers<void>();
  const first = vi.fn(() => blocked.promise);
  const failed = vi
    .fn()
    .mockRejectedValueOnce(new Error('native'))
    .mockResolvedValue(undefined);
  const sibling = vi.fn(async () => {});
  registry.register(first);
  registry.register(failed);
  registry.register(sibling);
  const cleaning = registry.releaseAll();
  await Promise.resolve();
  expect(first).toHaveBeenCalledOnce();
  expect(failed).toHaveBeenCalledOnce();
  expect(sibling).toHaveBeenCalledOnce();
  blocked.resolve();
  await cleaning;
  expect(report).toHaveBeenCalledWith(
    expect.objectContaining({ phase: 'cleanup' }),
  );
  await registry.releaseAll();
  expect(first).toHaveBeenCalledOnce();
  expect(sibling).toHaveBeenCalledOnce();
  expect(failed).toHaveBeenCalledTimes(2);
});

it('clear discards records without releasing or changing an existing lease', async () => {
  const registry = new ManagedLeaseRegistry();
  const release = vi.fn(async () => {});
  const lease = registry.register(release);
  registry.clear();
  await registry.releaseAll();
  expect(release).not.toHaveBeenCalled();
  await lease.release();
  expect(release).toHaveBeenCalledOnce();
});

it('old leases never remove or release a successor record', async () => {
  const registry = new ManagedLeaseRegistry();
  const first = vi.fn(async () => {});
  const second = vi.fn(async () => {});
  const old = registry.register(first);
  await old.release();
  registry.register(second);
  await old.release();
  expect(second).not.toHaveBeenCalled();
  await registry.releaseAll();
  expect(first).toHaveBeenCalledOnce();
  expect(second).toHaveBeenCalledOnce();
});
