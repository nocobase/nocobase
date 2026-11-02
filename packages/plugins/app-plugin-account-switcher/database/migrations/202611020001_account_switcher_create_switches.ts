import { defineMigration, type MigrationDefinition } from '@nocobase/db';

const migration: MigrationDefinition = defineMigration({
  name: '202611020001_account_switcher_create_switches',

  async up({ builder }) {
    await builder.createCollection('accountSwitches', (collection) => {
      collection.string('id', {
        length: 64,
        primaryKey: true,
        nullable: false,
      });
      collection.string('actorUserId', { length: 64, nullable: false });
      collection.string('actorSessionId', { length: 64, nullable: false });
      collection.string('targetUserId', { length: 64, nullable: false });
      collection.string('mode', { length: 16, nullable: false });
      collection.string('ipAddress', { length: 128, nullable: true });
      collection.text('userAgent', { nullable: true });
      collection.datetime('startedAt', { nullable: false });
      collection.datetime('expiresAt', { nullable: false });
      collection.datetime('endedAt', { nullable: true });
      collection.string('endReason', { length: 32, nullable: true });

      collection.index(['actorSessionId', 'endedAt'], {
        name: 'idx_account_switches_actor_session',
      });
    });
  },

  async down({ builder }) {
    await builder.dropCollection('accountSwitches');
  },
});

export default migration;
