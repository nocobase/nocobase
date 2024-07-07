import { Database } from '@nocobase/database';

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
          {
            ['options.otherKey']: name,
            ['options.target']: collectionName,
          },
        ],
      },
      transaction,
    });

    for (const field of relatedFields) {
      const keys = ['sourceKey', 'targetKey', 'otherKey'];
      const usedAs = keys.find((key) => field.options[key] === name);

      throw new Error(
        `Can't delete field ${name}, it is used by field ${field.get('name')} in collection ${field.get(
          'collectionName',
        )} as ${usedAs}`,
      );
    }
  };
}
