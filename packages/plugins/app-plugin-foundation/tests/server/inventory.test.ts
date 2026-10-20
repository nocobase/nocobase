import { expect, it, vi } from 'vitest';
import { Inventory, Probe } from '../../server/inventory.js';

it('does not report a successful prefix when a later configuration page fails', async () => {
  const findMany = vi
    .fn()
    .mockResolvedValueOnce([{ id: 'one' }, { id: 'two' }])
    .mockRejectedValueOnce(new Error('private database detail'));
  const inventory = {
    database: { repository: () => ({ findMany }) },
  } as unknown as Inventory;
  const probe = new Probe(inventory);
  expect(await probe.records('authorizationPermissionSets', 2)).toBeNull();
  expect(findMany).toHaveBeenCalledTimes(2);
  expect(probe.issues).toEqual([
    { code: 'SOURCE_UNREADABLE', source: 'authorizationPermissionSets' },
  ]);
});
