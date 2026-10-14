import { defineMigration, type MigrationDefinition } from '@nocobase/db';

// A deployment no longer knows what it is for (`server/builds`): a build is of one App at one commit, so `studioBuilds`
// drops `purpose` and is unique by App and commit. Rows that only differed by purpose keep their newest.
const OLD_UNIQUE = 'idx_studio_builds_app_id_sha_purpose';
const UNIQUE = 'idx_studio_builds_app_id_sha';

const migration: MigrationDefinition = defineMigration({
  name: '202610140010_studio_builds_per_app_and_commit',

  async up({ builder, query }) {
    await builder.alterCollection('studioBuilds', (collection) => {
      collection.dropConstraint(OLD_UNIQUE);
    });
    const rows = await query
      .selectFrom('studioBuilds')
      .select(['id', 'appId', 'sha'])
      .orderBy('updatedAt', 'desc')
      .orderBy('id', 'desc')
      .execute();
    const kept = new Set<string>();
    const extra: string[] = [];
    for (const row of rows) {
      const key = `${String(row.appId)}\u0000${String(row.sha)}`;
      if (kept.has(key)) extra.push(String(row.id));
      else kept.add(key);
    }
    for (let index = 0; index < extra.length; index += 500)
      await query
        .deleteFrom('studioBuilds')
        .where('id', 'in', extra.slice(index, index + 500))
        .execute();
    await builder.alterCollection('studioBuilds', (collection) => {
      collection.dropField('purpose');
    });
    await builder.alterCollection('studioBuilds', (collection) => {
      collection.unique(['appId', 'sha'], { mode: 'index', name: UNIQUE });
    });
  },

  async down({ builder, query }) {
    await builder.alterCollection('studioBuilds', (collection) => {
      collection.dropConstraint(UNIQUE);
    });
    await builder.alterCollection('studioBuilds', (collection) => {
      collection
        .string('purpose', { length: 16 })
        .notNull()
        .defaultTo('staging');
    });
    // A pull request's build was a preview's.
    await query
      .updateTable('studioBuilds')
      .set({ purpose: 'preview' })
      .where('pullRequestId', 'is not', null)
      .execute();
    await builder.alterCollection('studioBuilds', (collection) => {
      collection.unique(['appId', 'sha', 'purpose'], {
        mode: 'index',
        name: OLD_UNIQUE,
      });
    });
  },
});

export default migration;
