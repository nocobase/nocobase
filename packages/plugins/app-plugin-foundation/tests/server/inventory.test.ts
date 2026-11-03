import { expect, it, vi } from 'vitest';
import { setImmediate } from 'node:timers/promises';
import { Inventory, Probe } from '../../server/inventory.js';
import { ReadQueue } from '../../server/read-queue.js';

it('does not report a successful prefix when a later configuration page fails', async () => {
  const findMany = vi
    .fn()
    .mockResolvedValueOnce([{ id: 'one' }, { id: 'two' }])
    .mockRejectedValueOnce(new Error('private database detail'));
  const inventory = {
    reads: new ReadQueue(),
    database: { repository: () => ({ findMany }) },
  } as unknown as Inventory;
  const probe = new Probe(inventory);
  expect(await probe.records('authorizationPermissionSets', 2)).toBeNull();
  expect(findMany).toHaveBeenCalledTimes(2);
  expect(probe.issues).toEqual([
    { code: 'SOURCE_UNREADABLE', source: 'authorizationPermissionSets' },
  ]);
});

it('does not request another configuration page after the collector deadline', async () => {
  let finish: (rows: { id: string }[]) => void = () => undefined;
  const findMany = vi.fn(
    () =>
      new Promise<{ id: string }[]>((resolve) => {
        finish = resolve;
      }),
  );
  const inventory = {
    reads: new ReadQueue(),
    database: { repository: () => ({ findMany }) },
  } as unknown as Inventory;
  const abort = new AbortController();
  const pending = new Probe(inventory, abort.signal).records(
    'authorizationPermissionSets',
    2,
  );
  await setImmediate();
  abort.abort();
  expect(await pending).toBeNull();
  finish([{ id: 'one' }, { id: 'two' }]);
  await setImmediate();
  expect(findMany).toHaveBeenCalledTimes(1);
});
