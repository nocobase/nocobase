import { Database } from '@nocobase/database';
import { CollectionModel } from '../models';

export function afterUpdateForRenameCollection(db: Database) {
  return async (model: CollectionModel, { context, transaction }) => {
    if (context) {
      const prevName = model.previous('name');
      const currentName = model.get('name');

      if (prevName == currentName) {
        return;
      }

      const prevCollection = db.getCollection(prevName);
      const prevCollectionTableName = prevCollection.getTableNameWithSchema();

      // update fields
      await db.getRepository('fields').update({
        filter: {
          collectionName: prevName,
        },
        values: {
          collectionName: currentName,
        },
        hooks: false,
        transaction,
      });

      await model.migrate({
        transaction,
        replaceCollection: prevName,
        renameTable: {
          from: prevCollectionTableName,
        },
      });
    }
  };
}
