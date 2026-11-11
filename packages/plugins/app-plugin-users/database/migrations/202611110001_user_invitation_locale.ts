import { defineMigration, type MigrationDefinition } from '@nocobase/db';

/**
 * The language an invitation's email is written in (`userInvitations.locale`), so resending it and the page it links to
 * keep that language. Earlier invitations stay null and use the language of whoever resends them.
 */
const migration: MigrationDefinition = defineMigration({
  name: '202611110001_user_invitation_locale',

  async up({ builder }) {
    await builder.alterCollection('userInvitations', (collection) => {
      collection.string('locale', { length: 35 }).nullable();
    });
  },

  async down({ builder }) {
    await builder.alterCollection('userInvitations', (collection) => {
      collection.dropFields('locale');
    });
  },
});

export default migration;
