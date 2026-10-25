import { fileURLToPath } from 'node:url';
import { describeMigration } from '@nocobase/app-testing/server';

const sources = [
  {
    packageName: '@nocobase/app-plugin-demo-mode',
    directory: fileURLToPath(
      new URL('../../database/migrations', import.meta.url),
    ),
  },
];

describeMigration('202610200001_demo_mode_create_data_tables', {
  sources,
  up: async ({ expectCollection }) => {
    await expectCollection('demoModeDatasets').toHaveField('state', {
      type: 'string',
      nullable: false,
      length: 16,
    });
    await expectCollection('demoModeDatasets').toHaveField('operationId', {
      type: 'string',
      length: 36,
      nullable: true,
    });
    await expectCollection('demoModeRecords').toHaveField('recordId', {
      type: 'string',
      nullable: false,
      length: 255,
    });
    await expectCollection('demoModeAccounts').toHaveField('passwordHash', {
      type: 'string',
      length: 128,
      nullable: false,
    });
    await expectCollection('demoModeConfiguration').toHaveField('revision', {
      type: 'integer',
      nullable: false,
    });
    await expectCollection('demoModeModel').toHaveField('modelService', {
      type: 'string',
      length: 128,
    });
  },
  down: async ({ expectCollection }) => {
    for (const name of [
      'demoModeModel',
      'demoModeConfiguration',
      'demoModeAccounts',
      'demoModeRecords',
      'demoModeDatasets',
    ])
      await expectCollection(name).not.toExist();
  },
});
