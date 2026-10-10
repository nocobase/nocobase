import { defineMigration, type MigrationDefinition } from '@nocobase/db';

// A project's working directories are initialized one by one: the project's own setup when it is created, and each
// one added later in its settings (`server/projects-init`). `studioProjectInits` keeps a row per initialized working
// directory, so `projectId` is no longer unique; the project's setup is its first row.
const UNIQUE = 'idx_studio_project_inits_project_id';
const INDEX = 'idx_studio_project_inits_project';

const migration: MigrationDefinition = defineMigration({
  name: '202610110005_studio_project_inits_per_location',

  async up({ builder }) {
    await builder.alterCollection('studioProjectInits', (collection) => {
      collection.dropConstraint(UNIQUE);
    });
    await builder.alterCollection('studioProjectInits', (collection) => {
      collection.index(['projectId'], { name: INDEX });
    });
  },

  async down({ builder }) {
    await builder.alterCollection('studioProjectInits', (collection) => {
      collection.dropIndex(INDEX);
    });
    await builder.alterCollection('studioProjectInits', (collection) => {
      collection.unique(['projectId'], { mode: 'index', name: UNIQUE });
    });
  },
});

export default migration;
