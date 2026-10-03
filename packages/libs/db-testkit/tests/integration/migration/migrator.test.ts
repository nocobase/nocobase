import { ServiceContainer } from '../../../../service-provider/src/index.js';
import { databaseManagerToken } from '../../../../db/src/index.js';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { afterEach, expect, it, vi } from 'vitest';
import { createMigrator, loadMigrations } from '../../../../db/src/index.js';
import { describeIntegrationDatabases } from '../helpers.js';

const tempRoot = join(process.cwd(), 'tests/.tmp');
const tempDirectories: string[] = [];

describeIntegrationDatabases('migration runner', (context) => {
  afterEach(async () => {
    await Promise.all(
      tempDirectories
        .splice(0)
        .map((directory) => rm(directory, { recursive: true, force: true })),
    );
  });

  it.each([true, false])(
    'passes config to callbacks with transaction=%s',
    async (transaction) => {
      const directory = await createTempDirectory();
      const name = '202609200001_runtime_config';
      const container = new ServiceContainer();
      container.instance(databaseManagerToken, context.database);
      await writeFile(
        join(directory, `${name}.ts`),
        `
      import { defineMigration, databaseManagerToken } from '../../../../db/src/index.js';
      function check(config, container) {
        if (config.get('initialAdmin.username') !== 'configured-admin') throw new Error('missing config');
        if (config.get('missing') !== undefined) throw new Error('unexpected config');
        if (!container.has(databaseManagerToken) || !container.resolve(databaseManagerToken).connection('${context.spec.name}')) throw new Error('missing container');
      }
      export default defineMigration({
        name: '${name}', transaction: ${transaction},
        shouldRun({ config, container }) { check(config, container); return true; },
        async up({ config, container }) { check(config, container); },
        async down({ config, container }) { check(config, container); },
      });
    `,
      );
      const runner = context.database.createMigrator({
        connection: context.spec.name,
        directory,
        packageName: 'config-test',
        container,
        tableName: context.table('runtimeConfigHistory'),
        lockTableName: context.table('runtimeConfigLock'),
        config: {
          get: <T>(key: string): T | undefined =>
            (key === 'initialAdmin.username'
              ? 'configured-admin'
              : undefined) as T | undefined,
        },
      });
      expect((await runner.latest()).executed).toEqual([name]);
      expect((await runner.rollback()).rolledBack).toEqual([name]);
    },
  );

  it.each([true, false])(
    'keeps conditionally skipped migrations pending with transaction=%s',
    async (transaction) => {
      const directory = await createTempDirectory();
      const gate = context.table('conditionalGate');
      const output = context.table('conditionalRecord');
      await writeMigration(
        directory,
        '202608170001_conditional',
        `
      import { defineMigration } from '../../../../db/src/index.js';
      export default defineMigration({
        name: '202608170001_conditional',
        transaction: ${transaction},
        async shouldRun({ connection, parameters }) {
          const client = await connection.client();
          return client.schema.hasTable(parameters.gate);
        },
        async up({ builder }) {
          await builder.createCollection('conditionalRecord', collection => { collection.increments('id'); });
        },
        async down({ builder }) {
          await builder.dropCollection('conditionalRecord');
        },
      });
    `,
      );
      const migrator = context.database.createMigrator({
        connection: context.spec.name,
        tableName: context.table('conditionalHistory'),
        lockTableName: context.table('conditionalLock'),
        sources: [
          { packageName: 'conditional-test', directory, parameters: { gate } },
        ],
      });
      const skipped = await migrator.latest();
      expect(skipped.batch).toBe(0);
      expect(skipped.executed).toEqual([]);
      expect(skipped.skipped).toHaveLength(1);
      expect(await migrator.history()).toEqual([]);
      expect(await context.db.schema.hasTable(output)).toBe(false);
      await context.db.schema.createTable(gate, (table) => {
        table.integer('id');
      });
      expect((await migrator.latest()).executed).toEqual(skipped.skipped);
      expect(await migrator.history()).toHaveLength(1);
      expect(await context.db.schema.hasTable(output)).toBe(true);
      await context.db.schema.dropTable(gate);
      expect((await migrator.latest()).executed).toEqual([]);
      expect((await migrator.rollback()).rolledBack).toEqual(skipped.skipped);
      expect(await context.db.schema.hasTable(output)).toBe(false);
    },
  );

  it('does not record a migration when its execution condition throws', async () => {
    const directory = await createTempDirectory();
    await writeMigration(
      directory,
      '202608170002_condition_error',
      `
      import { defineMigration } from '../../../../db/src/index.js';
      export default defineMigration({
        name: '202608170002_condition_error',
        shouldRun() { throw new Error('condition failed'); },
        async up() { throw new Error('up must not execute'); },
        async down() {},
      });
    `,
    );
    const migrator = context.database.createMigrator({
      connection: context.spec.name,
      directory,
      tableName: context.table('conditionErrorHistory'),
      lockTableName: context.table('conditionErrorLock'),
    });
    await expect(migrator.latest()).rejects.toThrow('condition failed');
    expect(await migrator.history()).toEqual([]);
  });

  it.each([true, false])(
    'applies and rolls back parameterized targets with transaction=%s',
    async (transaction) => {
      const directory = await createTempDirectory();
      await writeMigration(
        directory,
        '202608180000_parameterized',
        `
      import { defineMigration } from '../../../../db/src/index.js';
      export default defineMigration({
        name: '202608180000_parameterized',
        transaction: ${transaction},
        async up({ builder, parameters }) {
          await builder.createCollection(parameters.table, collection => { collection.increments('id'); });
        },
        async down({ builder, parameters }) {
          await builder.dropCollection(parameters.table);
        },
      });
    `,
      );
      const migrator = context.database.createMigrator({
        connection: context.spec.name,
        tableName: context.table('parameterHistory'),
        lockTableName: context.table('parameterLock'),
        sources: ['parameterFirst', 'parameterSecond'].map((table) => ({
          packageName: 'parameter-test',
          directory,
          parameters: { table },
        })),
      });
      expect((await migrator.latest()).executed).toHaveLength(2);
      expect((await migrator.latest()).executed).toEqual([]);
      for (const table of ['parameterFirst', 'parameterSecond']) {
        expect(await context.db.schema.hasTable(context.table(table))).toBe(
          true,
        );
      }
      expect((await migrator.rollback()).rolledBack).toHaveLength(2);
      for (const table of ['parameterFirst', 'parameterSecond']) {
        expect(await context.db.schema.hasTable(context.table(table))).toBe(
          false,
        );
      }
    },
  );

  it('runs pending migrations once and records history', async () => {
    const directory = await createTempDirectory();
    const tableName = context.table('migrationHistory');
    const lockTableName = context.table('migrationLock');
    await writeMigration(
      directory,
      '202608180001_create_migration_users',
      `
      import { defineMigration } from '../../../../db/src/index.js';

      export default defineMigration({
        name: '202608180001_create_migration_users',

        async up({ builder }) {
          await builder.createCollection('migrationUsers', (collection) => {
            collection.increments('id');
            collection.string('name');
          });
        },

        async down({ builder }) {
          await builder.dropCollection('migrationUsers');
        },
      });
    `,
    );

    const migrator = context.database.createMigrator({
      connection: context.spec.name,
      directory,
      packageName: '@nocobase/plugin-users',
      tableName,
      lockTableName,
    });
    const invalidate = vi.spyOn(
      context.database.connection().collections,
      'invalidate',
    );

    await expect(migrator.latest()).resolves.toMatchObject({
      batch: 1,
      executed: ['202608180001_create_migration_users'],
      skipped: [],
    });
    expect(
      await context.db.schema.hasTable(context.table('migrationUsers')),
    ).toBe(true);
    expect(invalidate).toHaveBeenCalled();

    invalidate.mockClear();
    await expect(migrator.latest()).resolves.toMatchObject({
      batch: 1,
      executed: [],
      skipped: ['202608180001_create_migration_users'],
    });
    expect(invalidate).not.toHaveBeenCalled();

    const history = await context
      .db(tableName)
      .select(['package_name', 'name', 'batch']);
    expect(history).toEqual([
      {
        package_name: '@nocobase/plugin-users',
        name: '202608180001_create_migration_users',
        // Oracle INTEGER is physically NUMBER(38,0), decoded losslessly.
        batch: context.profile.numeric.integerResults === 'string' ? '1' : 1,
      },
    ]);
  });

  it('runs pending migrations through an inclusive target', async () => {
    const directory = await createTempDirectory();
    const tableName = context.table('targetMigrationHistory');
    const lockTableName = context.table('targetMigrationLock');
    const dataTableName = context.table('targetMigrationEvents');
    const migrationNames = [
      '202608180001_target_first',
      '202608180002_target_second',
      '202608180003_target_third',
    ] as const;
    await context.db.schema.createTable(dataTableName, (table) => {
      table.increments('id').primary();
      table.string('event').notNullable();
    });
    for (const name of migrationNames) {
      await writeEventMigration(directory, name, dataTableName);
    }

    const migrator = context.database.createMigrator({
      connection: context.spec.name,
      directory,
      tableName,
      lockTableName,
    });

    await expect(migrator.upTo(migrationNames[1])).resolves.toEqual({
      batch: 1,
      executed: migrationNames.slice(0, 2),
      skipped: [],
      warnings: [],
    });
    await expect(migrator.upTo(migrationNames[1])).resolves.toEqual({
      batch: 1,
      executed: [],
      skipped: migrationNames.slice(0, 2),
      warnings: [],
    });
    await expect(migrator.latest()).resolves.toEqual({
      batch: 2,
      executed: [migrationNames[2]],
      skipped: migrationNames.slice(0, 2),
      warnings: [],
    });
    await expect(migrator.upTo(migrationNames[1])).resolves.toEqual({
      batch: 2,
      executed: [],
      skipped: migrationNames.slice(0, 2),
      warnings: [],
    });
    await expect(migrator.rollback()).resolves.toMatchObject({
      batch: 2,
      rolledBack: [migrationNames[2]],
      warnings: [],
    });
    await expect(
      context.db(dataTableName).select('event').orderBy('id'),
    ).resolves.toEqual([
      { event: `up:${migrationNames[0]}` },
      { event: `up:${migrationNames[1]}` },
      { event: `up:${migrationNames[2]}` },
      { event: `down:${migrationNames[2]}` },
    ]);
  });

  it('rejects an unknown or empty migration target', async () => {
    const directory = await createTempDirectory();
    const migrator = context.database.createMigrator({
      connection: context.spec.name,
      directory,
      tableName: context.table('invalidTargetMigrationHistory'),
      lockTableName: context.table('invalidTargetMigrationLock'),
    });

    await expect(migrator.upTo('')).rejects.toThrow(
      'Migration target name must be a non-empty string.',
    );
    await expect(migrator.upTo('202608180001_missing')).rejects.toThrow(
      'Migration target "202608180001_missing" was not found.',
    );
  });

  it('upgrades legacy history tables and preserves applied migrations', async () => {
    const directory = await createTempDirectory();
    const tableName = context.table('legacyMigrationHistory');
    const lockTableName = context.table('legacyMigrationLock');
    const migrationName = '202608180001_legacy_history';
    await writeMigration(
      directory,
      migrationName,
      `
      import { defineMigration } from '../../../../db/src/index.js';

      export default defineMigration({
        name: '${migrationName}',
        async up() { throw new Error('already applied migration ran again'); },
        async down() {},
      });
    `,
    );
    const [loaded] = await loadMigrations({ directory });
    await context.db.schema.createTable(tableName, (table) => {
      table.increments('id').primary();
      table.string('name', 191).notNullable().unique();
      table.integer('batch').notNullable();
      table.string('checksum', 128).notNullable();
      table.dateTime('executed_at').notNullable();
      table.integer('duration_ms').nullable();
    });
    await context.db(tableName).insert({
      name: loaded.name,
      batch: 1,
      checksum: loaded.checksum,
      executed_at: new Date(),
      duration_ms: 1,
    });

    const migrator = createMigrator({
      database: context.database,
      connection: context.spec.name,
      sources: [{ packageName: '@nocobase/plugin-legacy', directory }],
      tableName,
      lockTableName,
    });

    await expect(migrator.latest()).resolves.toEqual({
      batch: 1,
      executed: [],
      skipped: [migrationName],
      warnings: [],
    });
    await expect(
      context.db(tableName).select(['package_name', 'name']),
    ).resolves.toEqual([{ package_name: 'app', name: migrationName }]);
  });

  it('runs and rolls back a global batch across package sources', async () => {
    const firstDirectory = await createTempDirectory();
    const secondDirectory = await createTempDirectory();
    const tableName = context.table('packageMigrationHistory');
    const lockTableName = context.table('packageMigrationLock');
    const dataTableName = context.table('packageMigrationEvents');
    await context.db.schema.createTable(dataTableName, (table) => {
      table.increments('id').primary();
      table.string('event').notNullable();
    });
    await writeEventMigration(
      firstDirectory,
      '202608180002_package_alpha',
      dataTableName,
    );
    await writeEventMigration(
      secondDirectory,
      '202608180001_package_beta',
      dataTableName,
    );

    const migrator = createMigrator({
      database: context.database,
      connection: context.spec.name,
      sources: [
        { packageName: '@nocobase/plugin-alpha', directory: firstDirectory },
        { packageName: '@nocobase/plugin-beta', directory: secondDirectory },
      ],
      tableName,
      lockTableName,
    });

    await expect(migrator.latest()).resolves.toMatchObject({
      executed: ['202608180001_package_beta', '202608180002_package_alpha'],
    });
    await expect(
      context.db(tableName).select(['package_name', 'name']).orderBy('id'),
    ).resolves.toEqual([
      {
        package_name: '@nocobase/plugin-beta',
        name: '202608180001_package_beta',
      },
      {
        package_name: '@nocobase/plugin-alpha',
        name: '202608180002_package_alpha',
      },
    ]);

    await expect(migrator.rollback()).resolves.toMatchObject({
      batch: 1,
      rolledBack: ['202608180002_package_alpha', '202608180001_package_beta'],
      warnings: [],
    });
    await expect(
      context.db(dataTableName).select('event').orderBy('id'),
    ).resolves.toEqual([
      { event: 'up:202608180001_package_beta' },
      { event: 'up:202608180002_package_alpha' },
      { event: 'down:202608180002_package_alpha' },
      { event: 'down:202608180001_package_beta' },
    ]);
  });

  it('keeps history for packages that no longer participate', async () => {
    const pluginDirectory = await createTempDirectory();
    const appDirectory = await createTempDirectory();
    const tableName = context.table('disabledPackageHistory');
    const lockTableName = context.table('disabledPackageLock');
    const migrationName = '202608180001_disabled_package';
    await writeMigration(
      pluginDirectory,
      migrationName,
      `
      import { defineMigration } from '../../../../db/src/index.js';

      export default defineMigration({
        name: '${migrationName}',
        async up() {},
        async down() {},
      });
    `,
    );

    const installer = createMigrator({
      database: context.database,
      connection: context.spec.name,
      sources: [
        {
          packageName: '@nocobase/app-plugin-disabled',
          directory: pluginDirectory,
        },
      ],
      tableName,
      lockTableName,
    });
    await installer.latest();

    const appMigrator = createMigrator({
      database: context.database,
      connection: context.spec.name,
      sources: [
        {
          packageName: '@nocobase/app-template-default',
          directory: appDirectory,
        },
      ],
      tableName,
      lockTableName,
    });

    await expect(appMigrator.latest()).resolves.toEqual({
      batch: 1,
      executed: [],
      skipped: [],
      warnings: [],
    });
    await expect(
      context.db(tableName).select(['package_name', 'name']),
    ).resolves.toEqual([
      {
        package_name: '@nocobase/app-plugin-disabled',
        name: migrationName,
      },
    ]);
  });

  it('rolls back the latest batch in reverse order', async () => {
    const directory = await createTempDirectory();
    const tableName = context.table('rollbackHistory');
    const lockTableName = context.table('rollbackLock');
    await writeMigration(
      directory,
      '202608180001_create_rollback_users',
      `
      import { defineMigration } from '../../../../db/src/index.js';

      export default defineMigration({
        name: '202608180001_create_rollback_users',

        async up({ builder }) {
          await builder.createCollection('rollbackUsers', (collection) => {
            collection.increments('id');
            collection.string('name');
          });
        },

        async down({ builder }) {
          await builder.dropCollection('rollbackUsers');
        },
      });
    `,
    );

    const migrator = createMigrator({
      database: context.database,
      connection: context.spec.name,
      directory,
      tableName,
      lockTableName,
    });

    await migrator.latest();
    expect(
      await context.db.schema.hasTable(context.table('rollbackUsers')),
    ).toBe(true);

    // A dry run reports the batch it would undo, with the history record
    // behind each migration, and touches neither the schema nor the history.
    const preview = await migrator.rollback({ dryRun: true });
    expect(preview).toMatchObject({
      batch: 1,
      dryRun: true,
      rolledBack: ['202608180001_create_rollback_users'],
    });
    expect(preview.records.map((record) => record.name)).toEqual([
      '202608180001_create_rollback_users',
    ]);
    expect(
      await context.db.schema.hasTable(context.table('rollbackUsers')),
    ).toBe(true);
    await expect(context.db(tableName).select()).resolves.toHaveLength(1);

    await expect(migrator.rollback()).resolves.toMatchObject({
      batch: 1,
      dryRun: false,
      rolledBack: ['202608180001_create_rollback_users'],
      warnings: [],
    });
    expect(
      await context.db.schema.hasTable(context.table('rollbackUsers')),
    ).toBe(false);
    await expect(context.db(tableName).select()).resolves.toEqual([]);
  });

  it('previews a rollback and a repair without creating the history or lock table', async () => {
    const directory = await createTempDirectory();
    const tableName = context.table('dryRunHistory');
    const lockTableName = context.table('dryRunLock');
    await writeMigration(
      directory,
      '202608180002_create_dry_run_items',
      `
      import { defineMigration } from '../../../../db/src/index.js';

      export default defineMigration({
        name: '202608180002_create_dry_run_items',

        async up({ builder }) {
          await builder.createCollection('dryRunItems', (collection) => {
            collection.increments('id');
          });
        },

        async down({ builder }) {
          await builder.dropCollection('dryRunItems');
        },
      });
    `,
    );
    const migrator = createMigrator({
      database: context.database,
      connection: context.spec.name,
      directory,
      tableName,
      lockTableName,
    });

    // On a database no migration has run on, a dry run answers from an empty
    // history and creates nothing: taking the lock or ensuring the history
    // table would leave both behind.
    await expect(migrator.rollback({ dryRun: true })).resolves.toEqual({
      batch: 0,
      rolledBack: [],
      records: [],
      warnings: [],
      dryRun: true,
    });
    await expect(migrator.repair({ dryRun: true })).resolves.toEqual({
      repaired: [],
      dryRun: true,
    });
    for (const table of [
      tableName,
      lockTableName,
      context.table('dryRunItems'),
    ]) {
      expect(await context.db.schema.hasTable(table)).toBe(false);
    }
  });

  it('keeps query changes and history writes in the same transaction', async () => {
    const directory = await createTempDirectory();
    const tableName = context.table('failedHistory');
    const lockTableName = context.table('failedLock');
    await context.builder.createCollection('migrationRows', (collection) => {
      collection.increments('id');
      collection.string('status');
    });
    await writeMigration(
      directory,
      '202608180001_failing_data_migration',
      `
      import { defineMigration } from '../../../../db/src/index.js';

      export default defineMigration({
        name: '202608180001_failing_data_migration',

        async up({ query }) {
          await query
            .insertInto('migrationRows')
            .values({ status: 'created' })
            .execute();
          throw new Error('migration failed on purpose');
        },

        async down({ query }) {
          await query
            .deleteFrom('migrationRows')
            .where('status', '=', 'created')
            .execute();
        },
      });
    `,
    );

    const migrator = createMigrator({
      database: context.database,
      connection: context.spec.name,
      directory,
      tableName,
      lockTableName,
    });

    await expect(migrator.latest()).rejects.toThrow(
      'migration failed on purpose',
    );
    await expect(
      context.database
        .query()
        .selectFrom('migrationRows')
        .select('status')
        .execute(),
    ).resolves.toEqual([]);
    await expect(context.db(tableName).select()).resolves.toEqual([]);
  });

  it('reports, rejects, and repairs checksum changes for executed migrations', async () => {
    const directory = await createTempDirectory();
    const tableName = context.table('checksumHistory');
    const lockTableName = context.table('checksumLock');
    const migrationName = '202608180001_checksum_guard';
    const source = (body: string): string => `
      import { defineMigration } from '../../../../db/src/index.js';

      export default defineMigration({
        name: '202608180001_checksum_guard',
        async up() {${body}},
        async down() {},
      });
    `;
    await writeMigration(directory, migrationName, source(''));

    const options = {
      database: context.database,
      connection: context.spec.name,
      directory,
      tableName,
      lockTableName,
    };
    const migrator = createMigrator(options);

    const first = await migrator.latest();
    expect(first.executed).toEqual([migrationName]);
    expect(first.warnings).toEqual([]);
    const [recorded] = await context.db(tableName).select();

    await writeMigration(
      directory,
      migrationName,
      source('\n          // changed after execution\n        '),
    );

    // The default policy reports the drift and lets the run continue.
    const warned = await migrator.latest();
    expect(warned.warnings).toEqual([
      {
        packageName: 'app',
        name: migrationName,
        recordedChecksum: recorded.checksum,
        sourceChecksum: expect.not.stringMatching(recorded.checksum),
      },
    ]);

    await expect(
      createMigrator({ ...options, onChecksumMismatch: 'error' }).latest(),
    ).rejects.toThrow(
      'Executed migration "202608180001_checksum_guard" checksum changed.',
    );

    // A dry run reports the same records without writing any of them.
    const preview = await migrator.repair({ dryRun: true });
    expect(preview).toEqual({ repaired: warned.warnings, dryRun: true });
    await expect(context.db(tableName).select()).resolves.toEqual([recorded]);

    const repaired = await migrator.repair();
    expect(repaired).toEqual({ repaired: warned.warnings, dryRun: false });

    const after = await createMigrator({
      ...options,
      onChecksumMismatch: 'error',
    }).latest();
    expect(after.warnings).toEqual([]);
    expect(after.skipped).toEqual([migrationName]);
    expect(await migrator.repair()).toEqual({ repaired: [], dryRun: false });
  });

  it('fails regardless of policy when executed migrations have no source', async () => {
    const directory = await createTempDirectory();
    const tableName = context.table('missingHistory');
    const lockTableName = context.table('missingLock');
    await writeMigration(
      directory,
      '202608180002_vanishes',
      `
      import { defineMigration } from '../../../../db/src/index.js';

      export default defineMigration({
        name: '202608180002_vanishes',
        async up() {},
        async down() {},
      });
    `,
    );
    const options = {
      database: context.database,
      connection: context.spec.name,
      directory,
      tableName,
      lockTableName,
    };
    await createMigrator(options).latest();
    await rm(join(directory, '202608180002_vanishes.ts'));

    await expect(createMigrator(options).latest()).rejects.toThrow(
      'Executed migration "202608180002_vanishes" is missing from migration sources.',
    );
  });
});

async function createTempDirectory(): Promise<string> {
  await mkdir(tempRoot, { recursive: true });
  const directory = await mkdtemp(join(tempRoot, 'migrations-'));
  tempDirectories.push(directory);
  return directory;
}

async function writeMigration(
  directory: string,
  name: string,
  source: string,
): Promise<void> {
  await writeFile(join(directory, `${name}.ts`), trimSource(source));
}

function trimSource(source: string): string {
  return `${source.trim().replace(/^ {6}/gm, '')}\n`;
}

async function writeEventMigration(
  directory: string,
  name: string,
  tableName: string,
): Promise<void> {
  await writeMigration(
    directory,
    name,
    `
      import { defineMigration } from '../../../../db/src/index.js';

      export default defineMigration({
        name: '${name}',
        transaction: false,
        async up({ connection }) {
          const knex = await connection.client();
          await knex('${tableName}').insert({ event: 'up:${name}' });
        },
        async down({ connection }) {
          const knex = await connection.client();
          await knex('${tableName}').insert({ event: 'down:${name}' });
        },
      });
    `,
  );
}
