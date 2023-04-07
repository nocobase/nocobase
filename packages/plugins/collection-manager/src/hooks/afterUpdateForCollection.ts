import Database from '@nocobase/database';
import { CollectionModel } from '../models';

function isSetEqual(set1, set2) {
  if (set1.size !== set2.size) {
    return false;
  }

  return [...set1].every((value) => set2.has(value));
}

export function afterUpdateForCollection(db: Database) {
  return async (model: CollectionModel, { context, transaction }) => {
    if (context) {
      const prevInherits = model.previous('options').inherits;
      const currentInherits = model.get('options').inherits;

      const prevSet = new Set(prevInherits);
      const currentSet = new Set(currentInherits);

      const removedParents = [...prevSet].filter((value) => !currentSet.has(value)) as string[];
      const addedParents = [...currentSet].filter((value) => !prevSet.has(value));

      const modelFields = await model.getFields({
        transaction,
      });

      const parentFields = await db.getRepository('fields').find({
        filter: {
          collectionName: removedParents,
        },
        transaction,
      });

      const fieldsShouldAdd = parentFields.filter((field) => {
        return !modelFields.find((modelField) => {
          return modelField.get('name') === field.get('name');
        });
      });

      await db.getRepository('fields').create({
        values: fieldsShouldAdd.map((field) => {
          const values = field.get();
          delete values.key;
          delete values.collectionName;
          return {
            ...values,
            collectionName: model.get('name'),
          };
        }),
        transaction,
      });

      await model.migrate({
        transaction,
        replaceCollection: true,
      });
    }
  };
}
