import { Database } from '@nocobase/database';

export function beforeCreateForValidateField(db: Database) {
  return async (model, { transaction }) => {
    if (model.type === 'belongsToMany') {
      if (model.get('foreignKey') === model.get('otherKey')) {
        throw new Error('foreignKey and otherKey can not be the same');
      }
    }

    const isPrimaryKey = model.get('primaryKey');
    if (isPrimaryKey) {
      const collection = db.getCollection(model.get('collectionName'));
      if (!collection) {
        return;
      }

      const primaryKey = collection.model.primaryKeyAttribute;

      if (primaryKey !== model.get('name') && collection.model.rawAttributes[primaryKey]) {
        throw new Error(
          `add field ${model.get('name')} failed, collection ${collection.name} already has primary key ${primaryKey}`,
        );
      }
    }
  };
}
