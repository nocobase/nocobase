import { describe, expect, it } from 'vitest';

import plugin from '../../server/index.js';

describe('@nocobase/app-plugin-agent-sessions', () => {
  it('declares its server capabilities', () => {
    expect(plugin).toMatchObject({
      packageName: '@nocobase/app-plugin-agent-sessions',
      locales: expect.objectContaining({
        'en-US': expect.any(Function),
        'zh-CN': expect.any(Function),
      }),
      serviceProviders: expect.any(Array),
      routes: expect.any(Array),
      database: { migrations: './database/migrations' },
    });
  });
});
