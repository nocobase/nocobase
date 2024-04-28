import Database from '@nocobase/database';

export function beforeDestroyForeignKey(db: Database) {
  return async (model, opts) => {
    const { transaction } = opts;
    const { isForeignKey, collectionName: fkCollectionName, name: fkName } = model.get();

    if (!isForeignKey) {
      return;
    }

    const fieldKeys = [];

    for (const [sourceName, collection] of db.collections) {
      for (const [, field] of collection.fields) {
        const fieldKey = field.options?.key;
        if (!fieldKey) {
          continue;
        }
        // fk in source collection
        if (field.type === 'belongsTo') {
          if (sourceName === fkCollectionName && field.foreignKey === fkName) {
            fieldKeys.push(fieldKey);
          }
        }
        // fk in target collection
        else if (field.type === 'hasOne' || field.type === 'hasMany') {
          if (fkCollectionName === field.target && field.foreignKey === fkName) {
            fieldKeys.push(fieldKey);
          }
        }
        // fk in through collection
        else if (field.type === 'belongsToMany' && field.through === fkCollectionName) {
          console.log(field.foreignKey, field.otherKey);
          if (field.foreignKey === fkName || field.otherKey === fkName) {
            fieldKeys.push(fieldKey);
          }
        }
      }
    }

    const r = db.getRepository('fields');

    await r.destroy({
      filter: {
        'key.$in': fieldKeys,
      },
      transaction,
    });
  };
}
