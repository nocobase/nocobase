import { defineMigration, type MigrationDefinition } from '@nocobase/db';

const migration: MigrationDefinition = defineMigration({
  name: '202610100001_invitation_email_verification',
  async up({ builder }) {
    await builder.alterCollection('userInvitations', (collection) => {
      collection.datetimeTz('verificationSentAt').nullable();
      collection.boolean('manualDelivery').notNull().defaultTo(false);
    });
    await builder.createCollection(
      'userInvitationVerifications',
      (collection) => {
        collection.string('id', { length: 64 }).primary().notNull();
        collection.string('invitationId', { length: 64 }).notNull();
        collection.string('invitationTokenHash', { length: 64 }).notNull();
        collection.string('tokenHash', { length: 64 }).notNull();
        collection.datetimeTz('expiresAt').notNull();
        collection.unique(['tokenHash']);
        collection.index(['invitationId']);
      },
    );
  },
  async down({ builder }) {
    await builder.dropCollection('userInvitationVerifications');
    await builder.alterCollection('userInvitations', (collection) => {
      collection.dropField('verificationSentAt');
      collection.dropField('manualDelivery');
    });
  },
});

export default migration;
