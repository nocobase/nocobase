import { describe, expect, it } from 'vitest';

import plugin from '../server/index.js';
import { apiRoutes } from '../server/routes/index.js';

describe('plugin', () => {
  it('declares its migrations and API routes', () => {
    expect(plugin).toMatchObject({
      packageName: '@nocobase/app-plugin-agents',
      database: { migrations: './database/migrations' },
    });
    expect(apiRoutes).toMatchObject({ scope: 'api' });
  });
});
