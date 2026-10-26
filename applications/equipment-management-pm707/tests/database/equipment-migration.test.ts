import path from 'node:path';
import { createRequire } from 'node:module';
import { describeMigration } from '@nocobase/app-testing/server';
const require = createRequire(import.meta.url);
describeMigration('202611020001_equipment_schema', {
  sources: [
    {
      packageName: '@nocobase/app-plugin-authentication',
      directory: path.join(
        path.dirname(
          require.resolve('@nocobase/app-plugin-authentication/package.json'),
        ),
        'database/migrations',
      ),
    },
    {
      packageName: 'equipment-management',
      directory: path.resolve(
        import.meta.dirname,
        '../../database/main/migrations',
      ),
    },
  ],
  up: async ({ expectCollection }) => {
    await expectCollection('equipmentAssets').toHaveField('status', {
      nullable: false,
    });
    await expectCollection('equipmentAssets').toHaveField('lifecycleVersion', {
      nullable: false,
    });
    await expectCollection('equipmentAssets').toHaveField('custodianId', {
      nullable: true,
    });
    await expectCollection('equipmentRequests').toExist();
    await expectCollection('equipmentMaintenance').toExist();
    await expectCollection('equipmentStocktakeItems').toExist();
    await expectCollection('equipmentTransitions').toHaveField('requestKey', {
      nullable: false,
    });
    await expectCollection('equipmentEffectRuns').toHaveField(
      'continuationDueAt',
      { nullable: true },
    );
  },
  down: async ({ expectCollection }) => {
    for (const name of [
      'equipmentAssets',
      'equipmentRequests',
      'equipmentStocktakes',
      'equipmentStocktakeItems',
      'equipmentMaintenance',
      'equipmentTransitions',
      'equipmentEffectRuns',
    ])
      await expectCollection(name).not.toExist();
  },
});
