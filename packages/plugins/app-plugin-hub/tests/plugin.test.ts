import { describe, expect, it } from 'vitest';

import plugin from '../server/index.js';

describe('@nocobase/app-plugin-hub', () => {
  it('declares only its selected Server capabilities', () => {
    expect(plugin).toMatchObject({
      packageName: '@nocobase/app-plugin-hub',
      locales: {
        'en-US': expect.any(Function),
        'zh-CN': expect.any(Function),
      },
      serviceProviders: expect.any(Array),
      routes: expect.any(Array),
      database: {
        migrations: './database/migrations',
        seeds: './database/seeds',
      },
    });
  });
});
