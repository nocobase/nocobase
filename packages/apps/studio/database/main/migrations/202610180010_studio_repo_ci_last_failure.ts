import { defineMigration, type MigrationDefinition } from '@nocobase/db';

// Why a repository's CI setup last failed, by reason (`shared/ci-modes.ts`, `CiFailure`): `{ reason, params }`, which
// the browser words in the reader's language, beside `lastError`, which keeps the failure's words in English. Null
// when nothing failed, and for a failure recorded before this column, which is shown by its words alone.
const migration: MigrationDefinition = defineMigration({
  name: '202610180010_studio_repo_ci_last_failure',

  async up({ builder }) {
    await builder.alterCollection('studioRepoCi', (collection) => {
      collection.json('lastFailure').nullable();
    });
  },

  async down({ builder }) {
    await builder.alterCollection('studioRepoCi', (collection) => {
      collection.dropField('lastFailure');
    });
  },
});

export default migration;
