import { Database } from '@nocobase/database';

export function beforeCreateForValidateField(db: Database) {
  return async (model, { transaction }) => {
    if (model.type === 'belongsToMany') {
      if (model.get('foreignKey') === model.get('otherKey')) {
        throw new Error('foreignKey and otherKey can not be the same');
      }
    }

    if (model.get('primaryKey')) {
      const collection = db.getCollection(model.get('collectionName'));
      const primaryKey = collection.model.primaryKeyAttribute;

      if (collection.model.rawAttributes[primaryKey]) {
        throw new Error(`collection ${collection.name} already has primary key ${primaryKey}`);
      }
    }
  };
}
