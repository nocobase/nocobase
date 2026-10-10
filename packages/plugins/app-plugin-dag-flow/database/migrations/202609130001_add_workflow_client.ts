import { defineMigration } from '@nocobase/db';

/** Adds revision-owned Client declarations for Workflow forms. */
export default defineMigration({
  name: '202609130001_add_workflow_client',
  async up({ builder }): Promise<void> {
    await builder.alterCollection('workflows', (collection) => {
      collection.json('client').notNull().defaultTo({});
    });
  },
  async down({ builder }): Promise<void> {
    await builder.alterCollection('workflows', (collection) => {
      collection.dropField('client');
    });
  },
});
