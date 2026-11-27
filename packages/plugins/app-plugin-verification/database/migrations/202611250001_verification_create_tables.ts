import { defineMigration, type MigrationDefinition } from '@nocobase/db';

const migration: MigrationDefinition = defineMigration({
  name: '202611250001_verification_create_tables',

  async up({ builder }) {
    await builder.createCollection('userPhones', (collection) => {
      collection.string('userId', { length: 64 }).primary().notNull();
      collection.string('phone', { length: 16 }).notNull();
      collection.string('bindingId', { length: 36 }).notNull();
      collection.datetimeTz('verifiedAt').notNull();
      collection.integer('version').notNull().defaultTo(1);
      collection.optimisticLock('version');
      collection.unique('phone');
      collection
        .belongsTo('user', 'user')
        .targetKey('id')
        .foreignKey('userId')
        .constraints(true)
        .onDelete('cascade');
    });

    await builder.createCollection('verificationCodes', (collection) => {
      collection.string('id', { length: 64 }).primary().notNull();
      collection.string('challengeId', { length: 36 }).notNull();
      collection.datetimeTz('sentAt').notNull();
      collection.string('codeHash', { length: 64 }).nullable();
      collection.integer('keyVersion').notNull();
      collection.integer('attempts').notNull();
      collection.datetimeTz('expiresAt').notNull();
      collection.integer('version').notNull().defaultTo(1);
      collection.optimisticLock('version');
      collection.index('expiresAt');
    });

    await builder.createCollection('verificationNumberLimits', (collection) => {
      collection.string('id', { length: 64 }).primary().notNull();
      collection.datetimeTz('sentAt').notNull();
      collection.datetimeTz('windowStartedAt').notNull();
      collection.integer('windowCount').notNull();
      collection.integer('version').notNull().defaultTo(1);
      collection.optimisticLock('version');
      collection.index('sentAt');
    });

    await builder.createCollection('verificationStepUpTokens', (collection) => {
      collection.string('id', { length: 64 }).primary().notNull();
      collection.string('userId', { length: 64 }).notNull();
      collection.string('bindingId', { length: 36 }).notNull();
      collection.string('tokenHash', { length: 64 }).nullable();
      collection.datetimeTz('expiresAt').notNull();
      collection.integer('version').notNull().defaultTo(1);
      collection.optimisticLock('version');
      collection.index('userId');
      collection.index('expiresAt');
      collection
        .belongsTo('owner', 'user')
        .targetKey('id')
        .foreignKey('userId')
        .constraints(true)
        .onDelete('cascade');
    });
  },

  async down({ builder }) {
    await builder.dropCollection('verificationStepUpTokens');
    await builder.dropCollection('verificationNumberLimits');
    await builder.dropCollection('verificationCodes');
    await builder.dropCollection('userPhones');
  },
});

export default migration;
