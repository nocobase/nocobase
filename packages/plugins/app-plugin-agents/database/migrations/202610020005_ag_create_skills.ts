import { defineMigration, type MigrationDefinition } from '@nocobase/db';

const migration: MigrationDefinition = defineMigration({
  name: '202610020005_ag_create_skills',

  async up({ builder }) {
    await builder.createCollections([
      {
        // A skill in the library: a directory in the open Agent Skills format, at its current version.
        name: 'agSkills',
        definition: (collection) => {
          collection.string('id', { length: 64 }).primary().notNull();
          // The directory name and the front matter's `name`; set once from the name.
          collection.string('slug', { length: 64 }).notNull();
          collection.string('name', { length: 200 }).notNull();
          collection.text('description').notNull();
          collection.integer('currentVersion').notNull().defaultTo(1);
          collection.string('createdById', { length: 64 }).nullable();
          collection.datetimeTz('createdAt').notNull();
          collection.datetimeTz('updatedAt').notNull();
          collection.unique(['slug']);
        },
      },
      {
        // Every saved version of a skill, whole: what it was called, its SKILL.md body and the manifest of its files.
        name: 'agSkillVersions',
        definition: (collection) => {
          collection.string('id', { length: 64 }).primary().notNull();
          collection.string('skillId', { length: 64 }).notNull();
          collection.integer('version').notNull();
          collection.string('name', { length: 200 }).notNull();
          collection.text('description').notNull();
          collection.text('content').notNull();
          // [{ path, blobHash, size, executable, text }], relative to the skill's directory; the bytes are blobs.
          collection.json('manifest').notNull().defaultTo([]);
          collection.string('note', { length: 500 }).nullable();
          // SHA-256 of what a runner receives, so it caches by it.
          collection.string('contentHash', { length: 64 }).notNull();
          collection.string('createdById', { length: 64 }).nullable();
          collection.datetimeTz('createdAt').notNull();
          collection.unique(['skillId', 'version']);
          collection.index(['contentHash']);
          collection
            .belongsTo('skill', 'agSkills')
            .targetKey('id')
            .foreignKey('skillId')
            .constraints(true)
            .onDelete('cascade');
        },
      },
      {
        // The contents of skills' files, stored once each in the application's drive at `skills/blobs/<sha256>`.
        name: 'agSkillBlobs',
        definition: (collection) => {
          collection.string('hash', { length: 64 }).primary().notNull();
          collection.integer('size').notNull();
          // Valid UTF-8 without NUL bytes: editable as text.
          collection.boolean('text').notNull().defaultTo(false);
          collection.datetimeTz('createdAt').notNull();
          // Stored or named by a save; the collector spares a blob used recently.
          collection.datetimeTz('lastUsedAt').notNull();
          collection.index(['lastUsedAt']);
        },
      },
      {
        // Where a skill is attached: to an agent, or as a default of a working directory or a registered scope.
        name: 'agSkillAttachments',
        definition: (collection) => {
          collection.string('id', { length: 64 }).primary().notNull();
          collection.string('skillId', { length: 64 }).notNull();
          // agent | workdir | a registered scope key
          collection.string('scope', { length: 32 }).notNull();
          collection.string('scopeId', { length: 64 }).notNull();
          collection.datetimeTz('createdAt').notNull();
          collection.unique(['scope', 'scopeId', 'skillId']);
          collection.index(['skillId']);
          collection
            .belongsTo('skill', 'agSkills')
            .targetKey('id')
            .foreignKey('skillId')
            .constraints(true)
            .onDelete('cascade');
        },
      },
    ]);
  },

  async down({ builder }) {
    await builder.dropCollection('agSkillAttachments');
    await builder.dropCollection('agSkillBlobs');
    await builder.dropCollection('agSkillVersions');
    await builder.dropCollection('agSkills');
  },
});

export default migration;
