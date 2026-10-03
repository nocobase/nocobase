import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import type { Knex } from 'knex';
import {
  type CollectionArtifactCollectionFile,
  type CollectionArtifactManifest,
  type CollectionArtifactMetadataFile,
  type CollectionArtifactSchemaFile,
} from '@nocobase/db';
import { createAppPaths } from '../src/config/index.js';
import {
  createAppDatabaseManager,
  generateAppCollectionsArtifact,
  runAppDatabaseTasks,
  type AppDatabaseConfig,
  type AppDatabaseTaskContributions,
} from '../src/database/index.js';
import { useTestDatabases, withoutDrivers } from './support/test-databases.js';

const provision = useTestDatabases();
const contributions: AppDatabaseTaskContributions = {
  appPackageName: 'test-app',
  migrations: [],
  seeds: [],
};

const roots: string[] = [];
afterEach(() => {
  for (const root of roots.splice(0))
    rmSync(root, { recursive: true, force: true });
});

async function fixture() {
  const parent = path.resolve('tests/.tmp');
  mkdirSync(parent, { recursive: true });
  const root = mkdtempSync(path.join(parent, 'collections-artifact-'));
  roots.push(root);
  const paths = createAppPaths({ rootDir: root });
  // Each connection is a database of its own. The external one exists before
  // the application does, and stands in for the foreign system.
  const databases = await provision(['main', 'analytics', 'external']);
  const config: AppDatabaseConfig = {
    default: 'main',
    connections: {
      main: databases.connectionConfig('main'),
      analytics: {
        ...databases.connectionConfig('analytics'),
        migrations: { autoRun: false },
        seeds: { autoRun: false },
      },
      external: {
        ...databases.connectionConfig('external'),
        // No metadataStore: an external connection reads
        // database/external/metadata/<name>.json by default.
        schemaManagement: 'external',
      },
    },
  };
  return { root, paths, config, dialect: databases.dialect };
}

function migration(directory: string, name: string, table: string) {
  mkdirSync(directory, { recursive: true });
  writeFileSync(
    path.join(directory, `${name}.ts`),
    `import { defineMigration } from '@nocobase/db';
export default defineMigration({ name: '${name}', async up({ builder }) {
  await builder.createCollection('${table}', (c) => {
    c.title('${table} rows');
    c.increments('id');
    c.string('value', { length: 64 });
    c.index('value');
  });
}, async down({ builder }) { await builder.dropCollection('${table}'); } });`,
  );
}

async function migrate(
  config: AppDatabaseConfig,
  paths: ReturnType<typeof createAppPaths>,
) {
  const result = await runAppDatabaseTasks(config, {
    paths,
    contributions,
    kind: 'migrations',
    all: true,
  });
  expect(result.ok).toBe(true);
}

function readJson<T>(file: string): T {
  return JSON.parse(readFileSync(file, 'utf8')) as T;
}

describe('generateAppCollectionsArtifact', () => {
  it('writes three files per Collection and a manifest per connection, external ones included', async () => {
    const { config, paths, dialect } = await fixture();
    migration(paths.database('main/migrations'), '001_main', 'mainRows');
    migration(
      paths.database('analytics/migrations'),
      '001_analytics',
      'events',
    );
    await migrate(config, paths);

    const result = await generateAppCollectionsArtifact(
      withoutDrivers(config),
      {
        paths,
        all: true,
      },
    );
    expect(result.results[0].error).toBeUndefined();
    expect(result.ok).toBe(true);
    expect(
      result.results.map((entry) => [entry.connection, entry.status]),
    ).toEqual([
      ['main', 'completed'],
      ['analytics', 'completed'],
      ['external', 'completed'],
    ]);
    const main = result.results[0];
    expect(main.written).toEqual([
      '_manifest.json',
      'mainRows/collection.json',
      'mainRows/metadata.json',
      'mainRows/schema.json',
    ]);
    expect(main.manifest).toEqual({
      dialect,
      schemaManagement: 'managed',
      migrationHead: '001_main',
      collections: ['mainRows'],
    });

    const directory = paths.database('main/collections');
    expect(readdirSync(directory).sort()).toEqual([
      '_manifest.json',
      'mainRows',
    ]);
    const manifest = readJson<CollectionArtifactManifest>(
      path.join(directory, '_manifest.json'),
    );
    expect(manifest).toEqual({
      formatVersion: 1,
      generated: true,
      connection: 'main',
      dialect,
      schemaManagement: 'managed',
      migrationHead: '001_main',
      collections: ['mainRows'],
    });
    const collection = readJson<CollectionArtifactCollectionFile>(
      path.join(directory, 'mainRows/collection.json'),
    );
    expect(collection.collection).toMatchObject({
      name: 'mainRows',
      title: 'mainRows rows',
    });
    expect(collection.collection.fields?.map((field) => field.name)).toEqual([
      'id',
      'value',
    ]);
    const metadata = readJson<CollectionArtifactMetadataFile>(
      path.join(directory, 'mainRows/metadata.json'),
    );
    expect(metadata.document).toMatchObject({
      name: 'mainRows',
      title: 'mainRows rows',
    });
    const schema = readJson<CollectionArtifactSchemaFile>(
      path.join(directory, 'mainRows/schema.json'),
    );
    expect(schema.physical.columns.map((column) => column.columnName)).toEqual([
      'id',
      'value',
    ]);
    expect(schema.physical.indexes.length).toBeGreaterThan(0);

    expect(
      existsSync(
        paths.database('analytics/collections/events/collection.json'),
      ),
    ).toBe(true);
    // An external connection owns no tables yet, so only its manifest exists.
    expect(result.results[2].manifest).toEqual({
      dialect,
      schemaManagement: 'external',
      migrationHead: null,
      collections: [],
    });
    expect(readdirSync(paths.database('external/collections'))).toEqual([
      '_manifest.json',
    ]);
  });

  it('is idempotent and its check mode agrees', async () => {
    const { config, paths } = await fixture();
    migration(paths.database('main/migrations'), '001_main', 'mainRows');
    await migrate(config, paths);
    await generateAppCollectionsArtifact(config, { paths });

    const again = await generateAppCollectionsArtifact(config, { paths });
    expect(again.results[0]).toMatchObject({
      status: 'completed',
      written: [],
      deleted: [],
      unchanged: 1,
    });

    const check = await generateAppCollectionsArtifact(config, {
      paths,
      check: true,
    });
    expect(check).toMatchObject({ ok: true, status: 'completed', check: true });
    expect(check.results[0].differences).toEqual([]);
  });

  it('separates a connection that has never been generated from one that has drifted', async () => {
    const { config, paths } = await fixture();
    migration(paths.database('main/migrations'), '001_main', 'mainRows');
    await migrate(config, paths);

    const check = await generateAppCollectionsArtifact(config, {
      paths,
      check: true,
    });
    expect(check).toMatchObject({ ok: false, status: 'stale' });
    expect(check.results[0]).toMatchObject({
      directoryExists: false,
      unchanged: 0,
    });
    expect(check.results[0].differences).toEqual([
      { path: '_manifest.json', kind: 'missing' },
      { path: 'mainRows/collection.json', kind: 'missing' },
      { path: 'mainRows/metadata.json', kind: 'missing' },
      { path: 'mainRows/schema.json', kind: 'missing' },
    ]);

    // Writing reports what it did rather than what it found, so it leaves the
    // field out; a later check sees the directory it created.
    const written = await generateAppCollectionsArtifact(config, { paths });
    expect(written.results[0].directoryExists).toBeUndefined();

    rmSync(
      path.join(paths.database('main/collections'), 'mainRows/schema.json'),
    );
    const drifted = await generateAppCollectionsArtifact(config, {
      paths,
      check: true,
    });
    expect(drifted.results[0]).toMatchObject({ directoryExists: true });
    expect(drifted.results[0].differences).toEqual([
      { path: 'mainRows/schema.json', kind: 'missing' },
    ]);
  });

  it('reports stale, missing and unexpected files in check mode without touching them, then repairs them', async () => {
    const { config, paths } = await fixture();
    migration(paths.database('main/migrations'), '001_main', 'mainRows');
    await migrate(config, paths);
    await generateAppCollectionsArtifact(config, { paths });
    const directory = paths.database('main/collections');
    const collectionFile = path.join(directory, 'mainRows/collection.json');
    const original = readFileSync(collectionFile, 'utf8');

    writeFileSync(collectionFile, '{ "edited": true }\n');
    rmSync(path.join(directory, 'mainRows/schema.json'));
    mkdirSync(path.join(directory, 'ghost'));
    writeFileSync(path.join(directory, 'ghost/collection.json'), '{}\n');
    writeFileSync(path.join(directory, 'mainRows/notes.txt'), 'keep me\n');
    writeFileSync(path.join(directory, '.DS_Store'), '');

    const check = await generateAppCollectionsArtifact(config, {
      paths,
      check: true,
    });
    expect(check).toMatchObject({ ok: false, status: 'stale' });
    expect(check.results[0].differences).toEqual([
      { path: 'ghost/collection.json', kind: 'unexpected' },
      { path: 'mainRows/collection.json', kind: 'stale' },
      { path: 'mainRows/notes.txt', kind: 'unexpected' },
      { path: 'mainRows/schema.json', kind: 'missing' },
    ]);
    expect(readFileSync(collectionFile, 'utf8')).toBe('{ "edited": true }\n');

    const refused = await generateAppCollectionsArtifact(config, { paths });
    expect(refused.results[0]).toMatchObject({ status: 'failed' });
    expect(refused.results[0].error).toContain('mainRows/notes.txt');
    expect(readFileSync(collectionFile, 'utf8')).toBe('{ "edited": true }\n');

    rmSync(path.join(directory, 'mainRows/notes.txt'));
    const repaired = await generateAppCollectionsArtifact(config, { paths });
    expect(repaired.results[0]).toMatchObject({
      status: 'completed',
      written: [
        'mainRows/collection.json',
        'mainRows/metadata.json',
        'mainRows/schema.json',
      ],
      deleted: ['ghost/collection.json'],
    });
    expect(readFileSync(collectionFile, 'utf8')).toBe(original);
    expect(existsSync(path.join(directory, 'ghost'))).toBe(false);
    expect(existsSync(path.join(directory, '.DS_Store'))).toBe(true);
  });

  it('removes the directory of a Collection that no longer exists and updates the manifest', async () => {
    const { config, paths } = await fixture();
    migration(paths.database('main/migrations'), '001_main', 'mainRows');
    migration(paths.database('main/migrations'), '002_more', 'moreRows');
    await migrate(config, paths);
    const database = createAppDatabaseManager(config, paths)!;
    try {
      await generateAppCollectionsArtifact(config, { paths, database });
      await database.builder('main').dropCollection('moreRows');

      const result = await generateAppCollectionsArtifact(config, {
        paths,
        database,
      });
      expect(result.results[0]).toMatchObject({
        status: 'completed',
        written: ['_manifest.json'],
        deleted: [
          'moreRows/collection.json',
          'moreRows/metadata.json',
          'moreRows/schema.json',
        ],
        unchanged: 1,
      });
      const manifest = readJson<CollectionArtifactManifest>(
        paths.database('main/collections/_manifest.json'),
      );
      expect(manifest.collections).toEqual(['mainRows']);
      expect(manifest.migrationHead).toBe('002_more');
      expect(existsSync(paths.database('main/collections/moreRows'))).toBe(
        false,
      );
    } finally {
      await database.destroy();
    }
  });

  it("reads an external connection's metadata from database/<connection>/metadata/ and never writes there", async () => {
    const { config, paths } = await fixture();
    const directory = paths.database('external/collections');
    const metadataDirectory = paths.database('external/metadata');
    // The schema belongs to the foreign system: create it as that system
    // would, with the raw client rather than the Builder.
    const setup = createAppDatabaseManager(config, paths)!;
    try {
      const knex = await setup.connection('external').client<Knex>();
      await knex.schema.createTable('legacy_accounts', (table) => {
        table.increments('id');
        table.string('code', 32).notNullable();
      });
    } finally {
      await setup.destroy();
    }

    // Before anyone writes metadata, the cache still describes the table.
    // Each run opens its own manager, as the CLI does, so the directory store
    // re-reads the files.
    const first = await generateAppCollectionsArtifact(config, {
      paths,
      connection: 'external',
    });
    expect(first.results[0]).toMatchObject({
      status: 'completed',
      manifest: {
        schemaManagement: 'external',
        migrationHead: null,
        collections: ['legacyAccounts'],
      },
    });
    expect(first.results[0].unusedMetadata).toBeUndefined();
    expect(
      readJson<CollectionArtifactMetadataFile>(
        path.join(directory, 'legacyAccounts/metadata.json'),
      ).document,
    ).toBeNull();
    expect(existsSync(metadataDirectory)).toBe(false);

    // A person writes the metadata, in whatever formatting they like.
    mkdirSync(metadataDirectory, { recursive: true });
    const source = path.join(metadataDirectory, 'legacyAccounts.json');
    const handWritten = JSON.stringify({
      version: 1,
      name: 'legacyAccounts',
      title: 'Legacy accounts',
      fields: { code: { title: 'Account code' } },
    });
    writeFileSync(source, handWritten);
    const second = await generateAppCollectionsArtifact(config, {
      paths,
      connection: 'external',
    });
    // A changed Collection is rewritten as a unit, so schema.json is written
    // too even though its content is the same.
    expect(second.results[0].written).toEqual([
      'legacyAccounts/collection.json',
      'legacyAccounts/metadata.json',
      'legacyAccounts/schema.json',
    ]);
    const collection = readJson<CollectionArtifactCollectionFile>(
      path.join(directory, 'legacyAccounts/collection.json'),
    );
    expect(collection.collection).toMatchObject({ title: 'Legacy accounts' });
    expect(
      collection.collection.fields?.find((field) => field.name === 'code'),
    ).toMatchObject({ title: 'Account code' });
    // The source is read, never reformatted.
    expect(readFileSync(source, 'utf8')).toBe(handWritten);

    // The foreign system drops the table. The cache follows the database; the
    // hand-written file stays where it is and is reported as unused.
    const teardown = createAppDatabaseManager(config, paths)!;
    try {
      const knex = await teardown.connection('external').client<Knex>();
      await knex.schema.dropTable('legacy_accounts');
    } finally {
      await teardown.destroy();
    }
    const third = await generateAppCollectionsArtifact(config, {
      paths,
      connection: 'external',
    });
    expect(third.results[0]).toMatchObject({
      status: 'completed',
      deleted: [
        'legacyAccounts/collection.json',
        'legacyAccounts/metadata.json',
        'legacyAccounts/schema.json',
      ],
      unusedMetadata: ['legacyAccounts'],
      manifest: { collections: [] },
    });
    expect(existsSync(path.join(directory, 'legacyAccounts'))).toBe(false);
    expect(readFileSync(source, 'utf8')).toBe(handWritten);
    const afterDrop = await generateAppCollectionsArtifact(config, {
      paths,
      connection: 'external',
      check: true,
    });
    expect(afterDrop.results[0]).toMatchObject({
      status: 'completed',
      differences: [],
      unusedMetadata: ['legacyAccounts'],
    });
  });

  it('refuses the old layout, metadata written by hand inside collections/, instead of reading nothing', async () => {
    const { config, paths } = await fixture();
    const legacy = paths.database('external/collections/legacyAccounts');
    mkdirSync(legacy, { recursive: true });
    writeFileSync(
      path.join(legacy, 'metadata.json'),
      JSON.stringify({
        formatVersion: 1,
        name: 'legacyAccounts',
        document: { version: 1, name: 'legacyAccounts', title: 'Legacy' },
      }),
    );
    expect(() => createAppDatabaseManager(config, paths)).toThrow(
      /old location.*metadata\.json.*database\/external\/metadata\/<name>\.json/,
    );

    // Once moved, the generated cache beside the new directory is no longer
    // mistaken for the old layout, even though it holds metadata.json files.
    rmSync(paths.database('external/collections'), {
      recursive: true,
      force: true,
    });
    mkdirSync(paths.database('external/metadata'), { recursive: true });
    const setup = createAppDatabaseManager(config, paths)!;
    try {
      const knex = await setup.connection('external').client<Knex>();
      await knex.schema.createTable('legacy_accounts', (table) => {
        table.increments('id');
      });
    } finally {
      await setup.destroy();
    }
    writeFileSync(
      paths.database('external/metadata/legacyAccounts.json'),
      JSON.stringify({ version: 1, name: 'legacyAccounts', title: 'Legacy' }),
    );
    const generated = await generateAppCollectionsArtifact(config, {
      paths,
      connection: 'external',
    });
    expect(generated.ok).toBe(true);
    rmSync(paths.database('external/metadata'), {
      recursive: true,
      force: true,
    });
    // A generated cache alone, with no metadata directory, is not the old layout.
    const reopened = createAppDatabaseManager(config, paths)!;
    await reopened.destroy();
  });

  it('refuses a metadata store pointed at a generated collections directory', async () => {
    const { config, paths } = await fixture();
    const result = await generateAppCollectionsArtifact(
      {
        ...config,
        connections: {
          ...config.connections,
          external: {
            ...config.connections.external,
            metadataStore: 'database/external/collections',
          },
        },
      },
      { paths, connection: 'external' },
    );
    expect(result).toMatchObject({ ok: false, status: 'failed' });
    expect(result.results[0].error).toMatch(
      /generated collections directory.*database\/<connection>\/metadata/,
    );
    expect(existsSync(paths.database('external/collections'))).toBe(false);
  });

  it('plans only the selected connection, so an unrelated misconfiguration does not fail it', async () => {
    const { config, paths } = await fixture();
    migration(paths.database('main/migrations'), '001_main', 'mainRows');
    await migrate(config, paths);
    const broken: AppDatabaseConfig = {
      ...config,
      connections: {
        ...config.connections,
        analytics: {
          ...config.connections.analytics,
          // An explicit source that does not exist: planning this connection throws.
          migrations: { autoRun: false, directory: paths.database('nowhere') },
        },
      },
    };

    const main = await generateAppCollectionsArtifact(broken, { paths });
    expect(main.results[0]).toMatchObject({
      connection: 'main',
      status: 'completed',
      manifest: { migrationHead: '001_main' },
    });

    const all = await generateAppCollectionsArtifact(broken, {
      paths,
      all: true,
    });
    expect(
      all.results.find((entry) => entry.connection === 'analytics'),
    ).toMatchObject({
      status: 'failed',
      error: expect.stringContaining('missing'),
    });
    expect(
      all.results.find((entry) => entry.connection === 'main'),
    ).toMatchObject({
      status: 'completed',
    });
  });

  it('does not snapshot a custom-named migration history table', async () => {
    const { config, paths } = await fixture();
    const renamed: AppDatabaseConfig = {
      ...config,
      connections: {
        ...config.connections,
        main: {
          ...config.connections.main,
          migrations: {
            autoRun: true,
            tableName: 'legacy_history',
            lockTableName: 'legacy_lock',
          },
        },
      },
    };
    migration(paths.database('main/migrations'), '001_main', 'mainRows');
    await migrate(renamed, paths);

    const result = await generateAppCollectionsArtifact(renamed, { paths });
    expect(result.results[0]).toMatchObject({
      status: 'completed',
      manifest: { migrationHead: '001_main', collections: ['mainRows'] },
    });
    expect(readdirSync(paths.database('main/collections')).sort()).toEqual([
      '_manifest.json',
      'mainRows',
    ]);
  });

  it('refuses conflicting flags and unknown connections', async () => {
    const { config, paths } = await fixture();
    await expect(
      generateAppCollectionsArtifact(config, {
        paths,
        connection: 'main',
        all: true,
      }),
    ).rejects.toThrow(/mutually exclusive/);
    await expect(
      generateAppCollectionsArtifact(config, { paths, connection: 'nope' }),
    ).rejects.toThrow(/Unknown database connection/);
  });

  it('reports not-configured when the application has no database', async () => {
    const result = await generateAppCollectionsArtifact({
      default: 'none',
      connections: {},
    });
    expect(result).toEqual({
      ok: true,
      status: 'not-configured',
      check: false,
      results: [],
    });
  });
});
