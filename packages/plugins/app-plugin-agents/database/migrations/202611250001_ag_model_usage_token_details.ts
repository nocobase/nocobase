import { defineMigration, type MigrationDefinition } from '@nocobase/db';

const migration: MigrationDefinition = defineMigration({
  name: '202611250001_ag_model_usage_token_details',
  async up({ builder }) {
    await builder.alterCollection('agModelUsage', (collection) => {
      collection.bigInt('cacheReadTokens').notNull().defaultTo(0);
      collection.bigInt('cacheWriteTokens').notNull().defaultTo(0);
      collection.bigInt('reasoningTokens').notNull().defaultTo(0);
    });
  },
  async down({ builder }) {
    await builder.alterCollection('agModelUsage', (collection) => {
      collection.dropField('cacheReadTokens');
      collection.dropField('cacheWriteTokens');
      collection.dropField('reasoningTokens');
    });
  },
});

export default migration;
