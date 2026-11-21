import { defineMigration, type MigrationDefinition } from '@nocobase/db';

const journal = 'lifecycleExampleTransitions';

const migration: MigrationDefinition = defineMigration({
  name: '202611190001_lifecycle_example_ticket_management',
  // Removing the fields would erase management history and active suspensions.
  irreversible: true,
  async up({ builder }) {
    await builder.alterCollection('lifecycleExampleTickets', (table) => {
      table.json('lifecycleManagement').nullable();
      table.integer('lifecycleManagementRevision').nullable();
    });
    const collection = await builder.getCollection(journal);
    const fields = 'lifecycle,recordId,version';
    const previous =
      collection?.constraints?.find(
        (constraint) =>
          constraint.type === 'unique' &&
          constraint.fields.join(',') === fields,
      ) ??
      collection?.indexes?.find(
        (index) => index.db?.unique && index.fields?.join(',') === fields,
      );
    if (!previous?.name)
      throw new Error('The lifecycle journal version index is missing.');
    await builder.alterCollection(journal, (table) => {
      table.json('management').nullable();
      table.integer('journalRevision').notNull().defaultTo(0);
      table.unique(['lifecycle', 'recordId', 'version', 'journalRevision'], {
        name: 'lc_example_journal_version',
      });
    });
    await builder.dropConstraint(journal, previous.name);
  },
});

export default migration;
