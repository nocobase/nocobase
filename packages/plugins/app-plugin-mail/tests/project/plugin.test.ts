import { describe, expect, it } from 'vitest';

import plugin from '../../server/index.js';

describe('@nocobase/app-plugin-mail', () => {
  it('declares the Mail Server capabilities', () => {
    expect(plugin).toMatchObject({
      packageName: '@nocobase/app-plugin-mail',
      locales: expect.any(Function),
      serviceProviders: expect.any(Array),
    });
    expect(plugin.routes).toHaveLength(3);
    expect(plugin.routes.map((route) => route.scope)).toEqual([
      'root',
      'root',
      'api',
    ]);
    expect(plugin.queue).toBeUndefined();
    expect(plugin.database).toEqual({
      migrations: './database/migrations',
    });
  });
});
