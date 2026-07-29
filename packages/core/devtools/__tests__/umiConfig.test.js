/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

/* eslint-env jest */

const { getUmiConfig } = require('../umiConfig');

describe('getUmiConfig Settings dev proxy', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env.APP_PORT = '13001';
    process.env.APP_SETTINGS_PORT = '13004';
    process.env.APP_PUBLIC_PATH = '/nocobase/';
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  test('proxies the outer Settings document path without taking over v1 settings', () => {
    const { proxy } = getUmiConfig();
    const rootProxy = proxy['/nocobase/settings{,/**}'];

    expect(rootProxy).toMatchObject({ target: 'http://127.0.0.1:13004', changeOrigin: true, ws: true });
    expect(rootProxy.pathRewrite).toBeUndefined();
    expect(proxy['/nocobase/apps/*/settings{,/**}']).toBeUndefined();
    expect(proxy['/nocobase/_app/*/settings{,/**}']).toBeUndefined();
    expect(proxy['/nocobase/admin/settings']).toBeUndefined();
  });
});
