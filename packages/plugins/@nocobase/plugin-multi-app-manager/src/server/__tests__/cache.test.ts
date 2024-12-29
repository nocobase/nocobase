/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { createMockServer, MockServer, MockServerOptions } from '@nocobase/test';
import { AppSupervisor } from '@nocobase/server';

describe('cache', async () => {
  let app: MockServer;
  let agent: any;

  beforeEach(async () => {
    const options: MockServerOptions = {
      plugins: ['multi-app-manager', 'field-sort'],
    };
    if (process.env.CACHE_REDIS_URL) {
      options.cacheManager = {
        defaultStore: 'redis',
        stores: {
          redis: {
            url: process.env.CACHE_REDIS_URL,
          },
        },
      };
    }
    app = await createMockServer(options);
    await app.db.getRepository('applications').create({
      values: {
        name: 'test_sub',
        options: {
          plugins: [],
        },
      },
      context: {
        waitSubAppInstall: true,
      },
    });

    agent = app.agent();
  });

  afterEach(async () => {
    await app.cacheManager.flushAll();
    await app.destroy();
  });

  test('should separate cache for multiple apps', async () => {
    const cache1 = app.cache;
    const subApp = await AppSupervisor.getInstance().getApp('test_sub');
    const cache2 = subApp.cache;
    await cache1.set('test', 'test1');
    await cache2.set('test', 'test2');
    expect(await cache1.get('test')).toBe('test1');
    expect(await cache2.get('test')).toBe('test2');
  });
});
