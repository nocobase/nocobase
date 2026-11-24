import { describe, expect, it } from 'vitest';

import plugin from '../../server/index.js';

describe('@nocobase/app-plugin-message-broker', () => {
  it('declares only its selected Server capabilities', () => {
    expect(plugin).toMatchObject({
      packageName: '@nocobase/app-plugin-message-broker',
      serviceProviders: expect.any(Array),
      database: {
        migrations: './database/migrations',
      },
    });
  });
});
