/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it } from 'vitest';
import { createPortalDevProxyOptions, getPortalDevProxyBasePath, isPortalDevProxyPath } from '../portalDevProxy';

describe('portal dev proxy', () => {
  it.each([
    ['/', '/portals'],
    ['/nocobase/', '/nocobase/portals'],
    ['nocobase', '/nocobase/portals'],
  ])('builds the portal base path from APP_PUBLIC_PATH: %s', (publicPath, expected) => {
    expect(getPortalDevProxyBasePath(publicPath)).toBe(expected);
  });

  it.each([
    ['/portals', '/', true],
    ['/portals/admin-starter/healthz', '/', true],
    ['/portals?from=dev', '/', true],
    ['/portals-other/admin-starter', '/', false],
    ['/nocobase/portals', '/nocobase/', true],
    ['/nocobase/portals/admin-starter/healthz', '/nocobase/', true],
    ['/portals/admin-starter/healthz', '/nocobase/', false],
    ['/nocobase/api/portals', '/nocobase/', false],
  ])('matches only portal public paths: %s', (url, publicPath, expected) => {
    expect(isPortalDevProxyPath(url, publicPath)).toBe(expected);
  });

  it('creates a websocket-capable proxy for the NocoBase server', () => {
    const options = createPortalDevProxyOptions('/nocobase/', 'http://127.0.0.1:13001');

    expect(options).toMatchObject({
      target: 'http://127.0.0.1:13001',
      changeOrigin: true,
      ws: true,
      xfwd: true,
    });
    expect(options.context?.('/nocobase/portals/admin-starter/healthz')).toBe(true);
    expect(options.context?.('/nocobase/portals/admin-starter/ws')).toBe(true);
    expect(options.context?.('/nocobase/settings')).toBe(false);
  });
});
