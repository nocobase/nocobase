/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it, vi } from 'vitest';
import { createClientAppDevProxyRouter, normalizeClientAppRouteRoot } from '../clientAppDevProxy';

const gatewayTargetUrl = 'http://127.0.0.1:23001';
const modernClientTargetUrl = 'http://127.0.0.1:23002';

function createFetchClient(records: unknown[]) {
  return vi.fn(async () => ({
    ok: true,
    async json() {
      return { data: records };
    },
  }));
}

describe('client app dev proxy', () => {
  it.each([
    ['/customer', '/v/', '/v/customer'],
    ['/v/customer', '/v/', '/v/customer'],
    ['/nocobase/customer', '/nocobase/v/', '/nocobase/v/customer'],
    ['/nocobase/v/customer', '/nocobase/v/', '/nocobase/v/customer'],
    ['/v/customer', '/nocobase/v/', '/nocobase/v/customer'],
  ])('normalizes route %s under %s', (routePath, modernClientBasePath, expected) => {
    expect(normalizeClientAppRouteRoot(routePath, modernClientBasePath)).toBe(expected);
  });

  it('routes client app documents and assets to the Gateway', async () => {
    const fetchClient = createFetchClient([
      {
        enabled: true,
        routePath: '/nb-crm',
        frontend: { type: 'client-app', entryId: 'crm-entry' },
      },
      {
        enabled: true,
        routePath: '/layout-space',
        frontend: { type: 'layout', layoutUid: 'layout' },
      },
    ]);
    const router = createClientAppDevProxyRouter({
      apiBasePath: '/api/',
      cacheTtlMs: 10_000,
      fetchClient,
      gatewayTargetUrl,
      modernClientBasePath: '/v/',
      modernClientTargetUrl,
    });

    await expect(router({ url: '/v/nb-crm/' })).resolves.toBe(gatewayTargetUrl);
    await expect(router({ url: '/v/nb-crm/assets/index.js' })).resolves.toBe(gatewayTargetUrl);
    await expect(router({ url: '/v/nb-crm-opportunities' })).resolves.toBe(modernClientTargetUrl);
    await expect(router({ url: '/v/layout-space/' })).resolves.toBe(modernClientTargetUrl);
    expect(fetchClient).toHaveBeenCalledOnce();
    expect(fetchClient.mock.calls[0][0]).toBe('http://127.0.0.1:23001/api/multiPortals:listEnabled');
  });

  it('falls back without negatively caching a temporary discovery failure', async () => {
    const fetchClient = vi
      .fn()
      .mockRejectedValueOnce(new Error('Gateway unavailable'))
      .mockResolvedValueOnce({
        ok: true,
        async json() {
          return {
            data: [
              {
                enabled: true,
                routePath: '/nb-crm',
                frontend: { type: 'client-app', entryId: 'crm-entry' },
              },
            ],
          };
        },
      });
    const router = createClientAppDevProxyRouter({
      apiBasePath: '/api/',
      fetchClient,
      gatewayTargetUrl,
      modernClientBasePath: '/v/',
      modernClientTargetUrl,
    });

    await expect(router({ url: '/v/nb-crm/' })).resolves.toBe(modernClientTargetUrl);
    await expect(router({ url: '/v/nb-crm/' })).resolves.toBe(gatewayTargetUrl);
    expect(fetchClient).toHaveBeenCalledTimes(2);
  });
});
