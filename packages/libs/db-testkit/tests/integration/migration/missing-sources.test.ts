import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, expect, it } from 'vitest';
import { createMigrator } from '../../../../db/src/index.js';
import { describeIntegrationDatabases } from '../helpers.js';

const directories: string[] = [];

describeIntegrationDatabases('missing migration sources', (context) => {
  afterEach(async () => {
    await Promise.all(
      directories
        .splice(0)
        .map((directory) => rm(directory, { recursive: true, force: true })),
    );
  });

  async function fixture() {
    await mkdir(join(process.cwd(), 'tests/.tmp'), { recursive: true });
    const directory = await mkdtemp(join(process.cwd(), 'tests/.tmp/missing-'));
    directories.push(directory);
    const events = context.table('missingSourceEvents');
    await context.db.schema.createTable(events, (table) => {
      table.increments('id').primary();
      table.string('event').notNullable();
    });
    return {
      directory,
      events,
      options: {
        database: context.database,
        connection: context.spec.name,
        tableName: context.table('missingSourceHistory'),
        lockTableName: context.table('missingSourceLock'),
      },
    };
  }

  it.each(['warn', 'error'] as const)(
    'retains uninstalled plugin history and refuses immediate rollback with policy %s',
    async (onMissingSource) => {
      const { directory, events, options } = await fixture();
      const pluginDirectory = join(directory, 'plugin');
      const appDirectory = join(directory, 'app');
      await mkdir(pluginDirectory);
      await mkdir(appDirectory);
      const names = [
        '202611170001_plugin_first',
        '202611170002_plugin_second',
        '202611170003_app',
      ];
      await source(pluginDirectory, names[0], events);
      await source(pluginDirectory, names[1], events);
      await source(appDirectory, names[2], events);
      const sources = [
        { packageName: 'removed-plugin', directory: pluginDirectory },
        { packageName: 'app', directory: appDirectory },
      ];
      const installer = createMigrator({ ...options, sources });
      await installer.latest();
      const history = await installer.history();
      const migrator = createMigrator({
        ...options,
        sources: sources.slice(1),
        onMissingSource,
      });
      expect((await migrator.latest()).warnings).toEqual([]);
      expect(await migrator.history()).toEqual(history);
      let message: string | undefined;
      for (const dryRun of [true, false]) {
        const error = await migrator
          .rollback({ dryRun })
          .catch((error: unknown) => error);
        expect(error).toBeInstanceOf(Error);
        const text = (error as Error).message;
        for (const name of names.slice(0, 2)) expect(text).toContain(name);
        expect(text).toContain('removed-plugin');
        expect(text).toContain('Restore compatible versions');
        expect(text).toContain('roll back before uninstalling');
        expect(text).toContain('new forward migration');
        if (message) expect(text).toBe(message);
        message = text;
        expect(await migrator.history()).toEqual(history);
        expect(await context.db(events).select('event').orderBy('id')).toEqual(
          names.map((name) => ({ event: `up:${name}` })),
        );
      }
    },
  );

  it('rolls back a complete new batch while retaining an uninstalled plugin in an older batch', async () => {
    const { directory, events, options } = await fixture();
    const plugin = '202611170001_plugin';
    const app = '202611170002_app';
    await source(directory, plugin, events);
    await createMigrator({
      ...options,
      directory,
      packageName: 'removed-plugin',
    }).latest();
    await rm(join(directory, `${plugin}.ts`));
    await source(directory, app, events);
    const migrator = createMigrator({
      ...options,
      directory,
      onMissingSource: 'error',
    });
    expect((await migrator.latest()).executed).toEqual([app]);
    const result = await migrator.rollback();
    expect(result.rolledBack).toEqual([app]);
    expect(result.warnings).toEqual([
      { kind: 'missing-source', packageName: 'removed-plugin', name: plugin },
    ]);
    expect((await migrator.history()).map((record) => record.name)).toEqual([
      plugin,
    ]);
  });

  it('warns about pruned old files, supports strict forward validation, and only validates the rollback target', async () => {
    const { directory, events, options } = await fixture();
    const names = [
      '202611170001_old',
      '202611170002_retained',
      '202611170003_new',
    ];
    await source(directory, names[0], events);
    await source(directory, names[1], events);
    const migrator = createMigrator({ ...options, directory });
    await migrator.latest();
    const oldHistory = await migrator.history();
    await rm(join(directory, `${names[0]}.ts`));
    await source(directory, names[2], events);
    const strict = createMigrator({
      ...options,
      directory,
      onMissingSource: 'error',
      onChecksumMismatch: 'error',
    });
    await expect(strict.latest()).rejects.toThrow(
      'missing from migration sources',
    );
    expect(await migrator.history()).toEqual(oldHistory);
    const warnings = [
      { kind: 'missing-source', packageName: 'app', name: names[0] },
    ];
    expect(await migrator.latest()).toMatchObject({
      executed: [names[2]],
      warnings,
    });
    expect((await migrator.history()).slice(0, 2)).toEqual(oldHistory);
    // Neither missing old files nor old checksum drift may block this batch.
    await writeFile(
      join(directory, `${names[1]}.ts`),
      '\n// pruned package rebuild\n',
      { flag: 'a' },
    );
    for (const dryRun of [true, false]) {
      const result = await strict.rollback({ dryRun });
      expect(result.rolledBack).toEqual([names[2]]);
      expect(result.warnings).toMatchObject([
        ...warnings,
        { packageName: 'app', name: names[1] },
      ]);
    }
    expect(await migrator.history()).toEqual(oldHistory);
    expect(
      (await context.db(events).select('event').orderBy('id')).map(
        (row) => row.event,
      ),
    ).toEqual([...names.map((name) => `up:${name}`), `down:${names[2]}`]);
  });

  it('warns when a participating source directory disappears and preserves every history field', async () => {
    const { directory, events, options } = await fixture();
    const name = '202611170001_missing_directory';
    await source(directory, name, events);
    const migrator = createMigrator({
      ...options,
      sources: [{ packageName: 'missing-package', directory }],
    });
    await migrator.latest();
    const history = await migrator.history();
    await rm(directory, { recursive: true });
    expect(await migrator.latest()).toMatchObject({
      executed: [],
      warnings: [
        { kind: 'missing-source', packageName: 'missing-package', name },
      ],
    });
    await expect(
      createMigrator({
        ...options,
        directory,
        packageName: 'missing-package',
        onMissingSource: 'error',
      }).latest(),
    ).rejects.toThrow('missing from migration sources');
    expect(await migrator.history()).toEqual(history);
  });

  it.each(['warn', 'error'] as const)(
    'always rejects a database newer than the same package sources with policy %s',
    async (onMissingSource) => {
      const { directory, events, options } = await fixture();
      const older = '202611170001_older';
      const newer = '202611170002_newer';
      await source(directory, older, events);
      await source(directory, newer, events);
      const migrator = createMigrator({
        ...options,
        directory,
        onMissingSource,
      });
      await migrator.latest();
      const history = await migrator.history();
      await rm(join(directory, `${newer}.ts`));
      const otherDirectory = join(directory, 'other');
      await mkdir(otherDirectory);
      await source(otherDirectory, '202611170003_other_package', events);
      await expect(
        createMigrator({
          ...options,
          onMissingSource,
          sources: [
            { packageName: 'app', directory },
            { packageName: 'other', directory: otherDirectory },
          ],
        }).latest(),
      ).rejects.toThrow('database is newer than the code');
      expect(await migrator.history()).toEqual(history);
      expect(
        (await context.db(events).select('event'))
          .map((row) => row.event)
          .sort(),
      ).toEqual([`up:${older}`, `up:${newer}`]);
    },
  );

  it.each(['warn', 'error'] as const)(
    'lists all missing and irreversible target migrations before any down with policy %s',
    async (onMissingSource) => {
      const { directory, events, options } = await fixture();
      const names = [
        '202611170001_missing',
        '202611170002_irreversible',
        '202611170003_missing',
        '202611170004_irreversible',
        '202611170005_reversible',
      ];
      for (const [index, name] of names.entries())
        await source(directory, name, events, index === 1 || index === 3);
      const migrator = createMigrator({
        ...options,
        directory,
        packageName: 'target-package',
        onMissingSource,
      });
      await migrator.latest();
      const history = await migrator.history();
      await rm(join(directory, `${names[0]}.ts`));
      await rm(join(directory, `${names[2]}.ts`));
      let message: string | undefined;
      for (const dryRun of [true, false]) {
        const error = await migrator
          .rollback({ dryRun })
          .catch((error: unknown) => error);
        expect(error).toBeInstanceOf(Error);
        const text = (error as Error).message;
        for (const name of names.slice(0, 4)) expect(text).toContain(name);
        expect(text.match(/Package: "target-package"/g)).toHaveLength(4);
        expect(text.match(/is irreversible/g)).toHaveLength(2);
        expect(text.match(/missing from migration sources/g)).toHaveLength(2);
        if (message) expect(text).toBe(message);
        message = text;
        expect(await migrator.history()).toEqual(history);
        expect(await context.db(events).select('event').orderBy('id')).toEqual(
          names.map((name) => ({ event: `up:${name}` })),
        );
      }
    },
  );
});

async function source(
  directory: string,
  name: string,
  events: string,
  irreversible = false,
): Promise<void> {
  await writeFile(
    join(directory, `${name}.ts`),
    `
import { defineMigration } from ${JSON.stringify(fileURLToPath(new URL('../../../../db/src/index.js', import.meta.url)))};
export default defineMigration({
  name: '${name}',
  transaction: false,
  async up({ connection }) {
    const knex = await connection.client();
    await knex('${events}').insert({ event: 'up:${name}' });
  },
  ${
    irreversible
      ? 'irreversible: true,'
      : `async down({ connection }) {
    const knex = await connection.client();
    await knex('${events}').insert({ event: 'down:${name}' });
  },`
  }
});
`,
  );
}
