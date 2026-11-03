import { expect, it, vi } from 'vitest';
import { mayAccessRun } from '../server/core/runs/access.js';
import type { Run } from '../shared/runs.js';

const run = { actorUserId: 'actor', ownerUserId: 'owner' } as Run;
it('allows participants but never grants private runs to unrelated administrators', async () => {
  const permission = vi.fn(async () => true);
  expect(await mayAccessRun(run, 'actor', true, permission)).toBe(true);
  expect(await mayAccessRun(run, 'owner', true, permission)).toBe(true);
  expect(await mayAccessRun(run, 'other', true, permission)).toBe(false);
  expect(permission).not.toHaveBeenCalled();
});
it('reevaluates current grants for a nonparticipant on each delivery', async () => {
  const permission = vi
    .fn()
    .mockResolvedValueOnce(true)
    .mockResolvedValueOnce(false);
  expect(await mayAccessRun(run, 'reader', false, permission)).toBe(true);
  expect(await mayAccessRun(run, 'reader', false, permission)).toBe(false);
});
