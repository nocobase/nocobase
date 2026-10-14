import { defineMigration } from '@nocobase/db';

export default defineMigration({
  name: '202610250010_studio_access_upgrade_changes',
  async up({ builder }) {
    await builder.createCollection(
      'studioAccessUpgradeChanges',
      (collection) => {
        collection.string('id', { length: 191 }).primary().notNull();
        collection.string('version', { length: 64, nullable: false });
        collection.string('batch', { length: 64, nullable: false });
        collection.string('roleId', { length: 191, nullable: false });
        collection.string('roleKey', { length: 191, nullable: false });
        collection.text('beforeGrants', { nullable: false });
        collection.text('afterGrants', { nullable: false });
        collection.string('beforeHash', { length: 64, nullable: false });
        collection.string('afterHash', { length: 64, nullable: false });
        collection.text('summary', { nullable: false });
        collection.unique(['version', 'roleId']);
      },
    );
  },
  async down({ builder }) {
    await builder.dropCollection('studioAccessUpgradeChanges');
  },
});
