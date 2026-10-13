import path from 'node:path';
import { describeMigration } from '@nocobase/app-testing/server';
import { expect } from 'vitest';

describeMigration('202610240040_ag_discovery_preferences', {
  sources: [
    {
      packageName: '@nocobase/app-plugin-agents',
      directory: path.resolve(import.meta.dirname, '../database/migrations'),
    },
  ],
  up: async ({ connection, expectCollection }) => {
    await expectCollection('agDiscoveryPreferences').toHaveField('ignored');
    await connection.repository('agDiscoveryPreferences').createOne({
      values: {
        key: 'pi:gpt-6-astra',
        ignored: true,
        revision: 1,
        updatedAt: new Date(),
      },
    });
    expect(
      await connection
        .repository('agDiscoveryPreferences')
        .findOne({ filter: { key: 'pi:gpt-6-astra' } }),
    ).toMatchObject({ ignored: true, revision: 1 });
  },
  down: async ({ expectCollection }) => {
    await expectCollection('agDiscoveryPreferences').not.toExist();
  },
});
