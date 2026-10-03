import { defineMigration, type MigrationDefinition } from '@nocobase/db';

const migration: MigrationDefinition = defineMigration({
  name: '202609010001_create_hub_app_tables',

  async up({ builder }): Promise<void> {
    await builder.createCollection('hubApps', (collection) => {
      collection.string('id', { length: 128 }).primary().notNull();
      collection.string('name', { length: 255 }).notNull();
      collection.text('description');
      collection.string('currentDeploymentId', { length: 36 });
      collection.boolean('enabled').notNull();
      collection.string('basePath', { length: 255 }).notNull();
      collection.string('backend', { length: 32 }).notNull();
      collection.string('startupMode', { length: 16 }).notNull();
      collection.datetime('createdAt').notNull();
      collection.datetime('updatedAt').notNull();
    });

    await builder.createCollection('hubAppReleases', (collection) => {
      collection.string('id', { length: 36 }).primary().notNull();
      collection.string('appId', { length: 128 }).notNull();
      collection.string('version', { length: 255 }).notNull();
      // Edited after release, deliberately: at 1024 the unique index below exceeds MySQL's 3072-byte key limit
      // under utf8mb4, so this migration never succeeded on MySQL. The key is `<appId>/<release id>.tar.gz`, at
      // most 172 characters. Installations that ran the 1024 version keep their wider column and only see a
      // checksum warning.
      collection.string('artifactKey', { length: 512 }).notNull();
      collection.string('checksum', { length: 64 }).notNull();
      collection.bigInt('size').notNull();
      collection.text('configTemplate');
      collection.json('manifest');
      collection.datetime('createdAt').notNull();
      collection.index(['appId', 'version']);
      collection.index(['appId', 'createdAt']);
      collection.index(['checksum']);
      collection.unique(['artifactKey'], { mode: 'index' });
    });

    await builder.createCollection('hubAppDeployments', (collection) => {
      collection.string('id', { length: 36 }).primary().notNull();
      collection.string('appId', { length: 128 }).notNull();
      collection.string('releaseId', { length: 36 }).notNull();
      collection.string('kind', { length: 16 }).notNull();
      collection.string('rollbackTargetDeploymentId', { length: 36 });
      collection.string('previousDeploymentId', { length: 36 });
      collection.string('status', { length: 16 }).notNull();
      collection.string('phase', { length: 32 }).notNull();
      collection.json('config').notNull();
      collection.boolean('cacheHit');
      collection.bigInt('hostRevision');
      collection.text('error');
      collection.datetime('createdAt').notNull();
      collection.datetime('startedAt');
      collection.datetime('finishedAt');
      collection.index(['appId', 'createdAt']);
      collection.index(['appId', 'status']);
    });
  },

  async down({ builder }): Promise<void> {
    await builder.dropCollection('hubAppDeployments');
    await builder.dropCollection('hubAppReleases');
    await builder.dropCollection('hubApps');
  },
});

export default migration;
