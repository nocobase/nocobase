import { defineMigration, type MigrationDefinition } from '@nocobase/db';

/**
 * Deployment variables and the first administrator.
 *
 * - `relReleases.variables`: the variables manifest the build declared (`dist/variables.json`, or the one CI sent with
 *   an image); null for a build without one.
 * - `relApps.previewOf`: the App whose preview values a preview App takes; null for any other App.
 * - `relEnvironments.sampleDataOnFirstDeploy`: an App's first deployment there loads its sample data.
 * - `relEnvironmentVariables`, `relAppVariables`: values set per environment and per App, sealed; an App's
 *   `previewValue` is what its previews take instead of `value`, `generated` marks a value release management made.
 * - `relDeployments.env`: the variables a deployment ran with, sealed, and their `variablesFingerprint`; `initialAdmin`
 *   the first administrator a first deployment generated, sealed until it expires or someone saved it.
 */
const migration: MigrationDefinition = defineMigration({
  name: '202610100001_rel_variables_initial_admin',

  async up({ builder }) {
    await builder.alterCollection('relReleases', (collection) => {
      collection.json('variables').nullable();
    });
    await builder.alterCollection('relApps', (collection) => {
      collection.string('previewOf', { length: 128 }).nullable();
    });
    await builder.alterCollection('relEnvironments', (collection) => {
      collection.boolean('sampleDataOnFirstDeploy').notNull().defaultTo(false);
    });
    await builder.alterCollection('relDeployments', (collection) => {
      collection.text('env').nullable();
      collection.string('variablesFingerprint', { length: 64 }).nullable();
      collection.text('initialAdmin').nullable();
      collection.datetimeTz('initialAdminExpiresAt').nullable();
      collection.string('initialAdminSavedBy', { length: 64 }).nullable();
      collection.datetimeTz('initialAdminSavedAt').nullable();
    });
    await builder.createCollections([
      {
        name: 'relEnvironmentVariables',
        definition: (c) => {
          c.string('id', { length: 36 }).primary().notNull();
          c.string('environmentId', { length: 64 }).notNull();
          c.string('name', { length: 128 }).notNull();
          c.text('value').nullable();
          c.boolean('secret').notNull().defaultTo(false);
          c.text('description').nullable();
          c.string('createdBy', { length: 64 }).nullable();
          c.string('updatedBy', { length: 64 }).nullable();
          c.datetimeTz('createdAt').notNull();
          c.datetimeTz('updatedAt').notNull();
          c.unique(['environmentId', 'name'], { mode: 'index' });
        },
      },
      {
        name: 'relAppVariables',
        definition: (c) => {
          c.string('id', { length: 36 }).primary().notNull();
          c.string('appId', { length: 128 }).notNull();
          c.string('name', { length: 128 }).notNull();
          c.text('value').nullable();
          c.text('previewValue').nullable();
          c.boolean('secret').notNull().defaultTo(false);
          c.boolean('generated').notNull().defaultTo(false);
          c.string('createdBy', { length: 64 }).nullable();
          c.string('updatedBy', { length: 64 }).nullable();
          c.datetimeTz('createdAt').notNull();
          c.datetimeTz('updatedAt').notNull();
          c.unique(['appId', 'name'], { mode: 'index' });
        },
      },
    ]);
  },

  async down({ builder }) {
    await builder.dropCollection('relAppVariables');
    await builder.dropCollection('relEnvironmentVariables');
    await builder.alterCollection('relDeployments', (collection) => {
      collection.dropField('initialAdminSavedAt');
      collection.dropField('initialAdminSavedBy');
      collection.dropField('initialAdminExpiresAt');
      collection.dropField('initialAdmin');
      collection.dropField('variablesFingerprint');
      collection.dropField('env');
    });
    await builder.alterCollection('relEnvironments', (collection) => {
      collection.dropField('sampleDataOnFirstDeploy');
    });
    await builder.alterCollection('relApps', (collection) => {
      collection.dropField('previewOf');
    });
    await builder.alterCollection('relReleases', (collection) => {
      collection.dropField('variables');
    });
  },
});

export default migration;
