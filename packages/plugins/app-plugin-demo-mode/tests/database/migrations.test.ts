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
    await expectCollection('demoModeRecords').toHaveField('recordId', {
      type: 'string',
      nullable: false,
      length: 255,
    });
  },
  down: async ({ expectCollection }) => {
    await expectCollection('demoModeRecords').not.toExist();
    await expectCollection('demoModeDatasets').not.toExist();
  },
});

describeMigration('202610200002_demo_mode_account_ownership', {
  sources,
  up: async ({ expectCollection }) => {
    await expectCollection('demoModeAccounts').toHaveField('userId', {
      type: 'string',
      nullable: false,
      length: 64,
    });
  },
  down: async ({ expectCollection }) => {
    await expectCollection('demoModeAccounts').not.toExist();
  },
});

describeMigration('202610210001_demo_mode_configuration', {
  sources,
  up: async ({ expectCollection }) => {
    await expectCollection('demoModeConfiguration').toHaveField('revision', {
      type: 'integer',
      nullable: false,
    });
  },
  down: async ({ expectCollection }) => {
    await expectCollection('demoModeConfiguration').not.toExist();
  },
});
