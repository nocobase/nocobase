import { describeMigration } from '@nocobase/app-testing/server';
import { expect } from 'vitest';

import { aiEmployeeMigrations } from './support/migrations.js';

// `up` runs once after the first application and again after the migration is
// reapplied; the row it writes has to be new each time.
let applications = 0;

describeMigration('202609230001_add_ai_mcp_tool_permissions', {
  sources: aiEmployeeMigrations,
  up: async ({ connection, expectCollection }) => {
    await expectCollection('aiMcpClients').toHaveField('toolPermissions');
    const name = `search-${++applications}`;
    await connection.repository('aiMcpClients').createOne({
      values: {
        name,
        transport: 'http',
        toolPermissions: { lookup: 'ALLOW' },
      },
    });
    await expect(
      connection.repository('aiMcpClients').findOne({ filter: { name } }),
    ).resolves.toMatchObject({ toolPermissions: { lookup: 'ALLOW' } });
  },
  down: async ({ expectCollection }) => {
    await expectCollection('aiMcpClients').not.toHaveField('toolPermissions');
  },
});
