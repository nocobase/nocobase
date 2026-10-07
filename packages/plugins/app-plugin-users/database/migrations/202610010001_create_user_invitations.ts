import { defineMigration, type MigrationDefinition } from '@nocobase/db';

const migration: MigrationDefinition = defineMigration({
  name: '202610010001_create_user_invitations',

  async up({ builder }) {
    await builder.createCollection('userInvitations', (collection) => {
      collection.string('id', { length: 64 }).primary().notNull();
      collection.string('email', { length: 255 }).notNull();
      // SHA-256 of the link's token; the token itself is never stored.
      collection.string('tokenHash', { length: 64 }).notNull();
      collection.json('roleScopes').notNull();
      collection.json('data').notNull();
      collection.json('summary').notNull();
      collection
        .enum('status', { values: ['pending', 'accepted', 'revoked'] })
        .notNull()
        .defaultTo('pending');
      collection.string('invitedById', { length: 64 }).notNull();
      collection.datetimeTz('expiresAt').notNull();
      collection.datetimeTz('sentAt').nullable();
      collection.string('sendError', { length: 1000 }).nullable();
      collection.string('acceptedUserId', { length: 64 }).nullable();
      collection.datetimeTz('acceptedAt').nullable();
      collection.datetimeTz('createdAt').notNull();
      collection.datetimeTz('updatedAt').notNull();
      collection.unique(['tokenHash']);
      collection.index(['email', 'status']);
      collection
        .belongsTo('invitedBy', 'user')
        .targetKey('id')
        .foreignKey('invitedById')
        .constraints(false);
    });
  },

  async down({ builder }) {
    await builder.dropCollection('userInvitations');
  },
});

export default migration;
