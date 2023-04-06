import Database from '@nocobase/database';
import { CollectionModel } from '../models';

export function afterUpdateForCollection(db: Database) {
  return async (model: CollectionModel, { context, transaction }) => {
    if (context) {
      await model.migrate({
        transaction,
        replaceCollection: true,
      });
    }
  };
}
