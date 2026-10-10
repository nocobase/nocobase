import type { CollectionDefinitionBuilder } from '@nocobase/db';

export function defineWorkflowVersionStats(
  collection: CollectionDefinitionBuilder,
): void {
  collection.bigInt('id').primary().notNull();
  collection.bigInt('executed').notNull().defaultTo(0);
}
