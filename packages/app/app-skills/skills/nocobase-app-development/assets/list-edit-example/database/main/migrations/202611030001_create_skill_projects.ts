import { defineMigration } from '@nocobase/db';

export default defineMigration({
  name: '202611030001_create_skill_projects',
  async up({ builder }) {
    await builder.createCollection('skillProjects', (collection) => {
      collection.string('id', { length: 64 }).primary().notNull();
      collection.string('name', { length: 100 }).notNull();
    });
  },
  async down({ builder }) {
    await builder.dropCollection('skillProjects');
  },
});
