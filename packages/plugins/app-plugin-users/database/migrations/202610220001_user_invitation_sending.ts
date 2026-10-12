import { defineMigration, type MigrationDefinition } from '@nocobase/db';
const migration: MigrationDefinition = defineMigration({
  name: '202610220001_user_invitation_sending',
  async up({ builder, query }) {
    await builder.alterCollection('userInvitations', (collection) => {
      collection.string('sendClaim', { length: 64 }).nullable();
      collection
        .string('sendStatus', { length: 16 })
        .notNull()
        .defaultTo('unknown');
    });
    await query
      .updateTable('userInvitations')
      .set({ sendStatus: 'sent' })
      .where('sentAt', 'is not', null)
      .execute();
    // Existing invitations may already have been submitted; do not claim an old token again automatically.
    const rows = await query
      .selectFrom('userInvitations')
      .select(['id', 'tokenHash'])
      .execute();
    for (const row of rows)
      await query
        .updateTable('userInvitations')
        .set({ sendClaim: row.tokenHash })
        .where('id', '=', row.id)
        .execute();
  },
  async down({ builder }) {
    await builder.alterCollection('userInvitations', (collection) => {
      collection.dropField('sendStatus');
      collection.dropField('sendClaim');
    });
  },
});
export default migration;
