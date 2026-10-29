// Test-only schema, installed before the customized application's source upgrade.
import { defineMigration } from '@nocobase/db';
export default defineMigration({
  name: '209901010001_equipment_fixture',
  async up({ builder }) {
    await builder.createCollection('equipmentFixture', (collection) => {
      collection.string('id').primary().notNull();
      for (const key of [
        'name',
        'department',
        'attachment',
        'workflow',
        'customField',
      ])
        collection.string(key, { nullable: false });
    });
    await builder.createCollection('equipmentFixtureHistory', (collection) => {
      collection.string('id').primary().notNull();
      for (const key of ['recordId', 'event', 'actor'])
        collection.string(key, { nullable: false });
    });
  },
  async down({ builder }) {
    await builder.dropCollection('equipmentFixtureHistory');
    await builder.dropCollection('equipmentFixture');
  },
});
