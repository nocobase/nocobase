// @vitest-environment node
import type { ServiceResolver } from '@nocobase/service-provider';
import { expect, it, vi } from 'vitest';

import { studioApiKeysToken } from '../../server/access/token.js';
import { orgCiKeys } from '../../server/builds/ci-provider.js';

it('passes the managed key last-used time through the CI key adapter', async () => {
  const lastUsedAt = '2026-10-09T12:30:00.000Z';
  const find = vi.fn().mockResolvedValue({
    id: 'key-1',
    name: 'acme/shop CI',
    expiresAt: null,
    lastUsedAt,
    status: 'active',
    scope: { groups: { 'releases.apps': { objects: ['shop'] } } },
  });
  const resolver = {
    resolve: (token: unknown) => {
      expect(token).toBe(studioApiKeysToken);
      return { find };
    },
  } as unknown as ServiceResolver;

  await expect(orgCiKeys(resolver).find('key-1')).resolves.toEqual({
    id: 'key-1',
    name: 'acme/shop CI',
    expiresAt: null,
    lastUsedAt,
    status: 'active',
    appIds: ['shop'],
  });
  expect(find).toHaveBeenCalledWith('key-1');
});
