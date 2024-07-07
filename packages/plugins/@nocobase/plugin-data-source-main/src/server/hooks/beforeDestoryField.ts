import { Database } from '@nocobase/database';
import collection from 'packages/core/server/src/plugin-manager/options/collection';

export function beforeDestoryField(db: Database) {
  return async (model, opts) => {
    const { transaction } = opts;
    const { name, type, collectionName } = model.get();

    if (['belongsTo', 'hasOne', 'hasMany', 'belongsToMany'].includes(type)) {
      return;
    }

    const relatedFields = await db.getRepository('fields').find({
      filter: {
        $or: [
          {
            ['options.sourceKey']: name,
            collectionName,
          },
          {
            ['options.targetKey']: name,
            ['options.target']: collectionName,
          },
        ],
      },
      transaction,
    });

    for (const field of relatedFields) {
      const keys = [
        {
          name: 'sourceKey',
          condition: (associationField) =>
            associationField.options['sourceKey'] === name && associationField.collectionName === collectionName,
        },
        {
          name: 'targetKey',
          condition: (associationField) =>
            associationField.options['targetKey'] === name && associationField.options['target'] === collectionName,
        },
      ];

      const usedAs = keys.find((key) => key.condition(field))['name'];

      throw new Error(
        `Can't delete field ${name} of ${collectionName}, it is used by field ${field.get(
          'name',
        )} in collection ${field.get('collectionName')} as ${usedAs}`,
      );
    }
  };
}
