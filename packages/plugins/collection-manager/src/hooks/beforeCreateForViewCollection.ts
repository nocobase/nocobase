import { Database } from '@nocobase/database';

export function beforeCreateForViewCollection(db: Database) {
  return async (model, { transaction, context }) => {};
}
