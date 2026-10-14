// @vitest-environment node
import path from 'node:path';
import { describeMigration } from '@nocobase/app-testing/server';

describeMigration('202610250010_studio_access_upgrade_changes', {
  sources: [
    {
      directory: path.resolve(
        import.meta.dirname,
        '../../database/main/migrations',
      ),
      packageName: '@nocobase/studio',
    },
  ],
  up: async ({ expectCollection }) => {
    await expectCollection('studioAccessUpgradeChanges').toHaveField(
      'beforeHash',
    );
    await expectCollection('studioAccessUpgradeChanges').toHaveField(
      'afterGrants',
    );
  },
  down: async ({ expectCollection }) => {
    await expectCollection('studioAccessUpgradeChanges').not.toExist();
  },
});
