import { fileURLToPath } from 'node:url';
import { expect } from 'vitest';
import { describeMigration } from '@nocobase/app-testing/server';

const sources = [
  {
    packageName: '@nocobase/app-plugin-demo-mode',
    directory: fileURLToPath(
      new URL('../../database/migrations', import.meta.url),
    ),
  },
];

describeMigration('202610230001_demo_mode_account_credentials', {
  sources,
  before: async ({ connection }) => {
    await connection.query
      .insertInto('demoModeAccounts')
      .values({ userId: 'existing-user', datasetId: 'existing-demo' })
      .execute();
  },
  up: async ({ connection, expectCollection }) => {
    await expectCollection('demoModeAccounts').toHaveField('passwordHash', {
      type: 'string',
      length: 128,
      nullable: true,
    });
    expect(
      await connection.query
        .selectFrom('demoModeAccounts')
        .selectAll()
        .where('userId', '=', 'existing-user')
        .executeTakeFirst(),
    ).toMatchObject({ datasetId: 'existing-demo', passwordHash: null });
  },
  down: async ({ expectCollection }) => {
    await expectCollection('demoModeAccounts').not.toHaveField('passwordHash');
  },
});

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

describeMigration('202610210002_demo_mode_environment_model', {
  sources,
  up: async ({ expectCollection }) => {
    await expectCollection('demoModeModel').toHaveField('modelService', {
      type: 'string',
      length: 128,
    });
  },
  down: async ({ expectCollection }) => {
    await expectCollection('demoModeModel').not.toExist();
  },
});

describeMigration('202610210003_demo_mode_adopt_environment_model', {
  sources,
  before: async ({ connection }) => {
    await connection.query
      .insertInto('demoModeDatasets')
      .values({
        id: 'old',
        state: 'ready',
        modelKey: 'fixture-key',
        modelService: 'existing-model',
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .execute();
  },
  up: async ({ connection }) => {
    expect(
      await connection.query
        .selectFrom('demoModeModel')
        .selectAll()
        .executeTakeFirst(),
    ).toMatchObject({
      id: 'default',
      modelKey: 'fixture-key',
      modelService: 'existing-model',
    });
  },
  down: async ({ connection }) => {
    expect(
      await connection.query
        .selectFrom('demoModeModel')
        .select('modelService')
        .executeTakeFirst(),
    ).toMatchObject({ modelService: 'existing-model' });
  },
});

describeMigration('202610210004_demo_mode_operation_lease', {
  sources,
  before: async ({ connection }) => {
    await connection.query
      .insertInto('demoModeDatasets')
      .values({
        id: 'before-lease',
        state: 'ready',
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .execute();
  },
  up: async ({ connection, expectCollection }) => {
    await expectCollection('demoModeDatasets').toHaveField('operationId', {
      type: 'string',
      length: 36,
      nullable: true,
    });
    expect(
      await connection.query
        .selectFrom('demoModeDatasets')
        .select(['state', 'operationId'])
        .where('id', '=', 'before-lease')
        .executeTakeFirst(),
    ).toMatchObject({ state: 'ready', operationId: null });
  },
  down: async ({ connection, expectCollection }) => {
    await expectCollection('demoModeDatasets').not.toHaveField('operationId');
    expect(
      await connection.query
        .selectFrom('demoModeDatasets')
        .select('state')
        .where('id', '=', 'before-lease')
        .executeTakeFirst(),
    ).toMatchObject({ state: 'ready' });
  },
});

describeMigration('202610220001_demo_mode_dataset_operation', {
  sources,
  before: async ({ connection }) => {
    await connection.query
      .insertInto('demoModeDatasets')
      .values({
        id: 'before-operation',
        state: 'ready',
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .execute();
  },
  up: async ({ connection, expectCollection }) => {
    await expectCollection('demoModeDatasets').toHaveField('operation', {
      type: 'string',
      length: 16,
      nullable: true,
    });
    expect(
      await connection.query
        .selectFrom('demoModeDatasets')
        .select(['state', 'operation'])
        .where('id', '=', 'before-operation')
        .executeTakeFirst(),
    ).toMatchObject({ state: 'ready', operation: null });
  },
  down: async ({ expectCollection }) => {
    await expectCollection('demoModeDatasets').not.toHaveField('operation');
  },
});
