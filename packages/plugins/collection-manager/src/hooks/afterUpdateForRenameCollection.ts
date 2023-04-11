import { Database } from '@nocobase/database';
import { CollectionModel } from '../models';
import { CollectionsGraph, inflection } from '@nocobase/utils';

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

      // update old collection name to new collection name in fields
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

      const associationFields = await db.getRepository('fields').find({
        filter: {
          'options.target': prevName,
        },
        transaction,
      });

      for (const associationField of associationFields) {
        const newOptions = {
          ...associationField.get('options'),
          target: currentName,
        };

        if (newOptions.foreignKey) {
          newOptions.foreignKey = newOptions.foreignKey.replace(
            new RegExp(`^${inflection.singularize(prevName)}`),
            inflection.singularize(currentName),
          );
        }

        const updateValues = {
          options: newOptions,
          name: (() => {
            const name = associationField.get('name');

            if (associationField.get('type') == 'belongsTo' || associationField.get('type') == 'hasOne') {
              return name.replace(
                new RegExp(`^${inflection.singularize(prevName)}`),
                inflection.singularize(currentName),
              );
            }

            return name.replace(new RegExp(`^${prevName}`), currentName);
          })(),
        };

        console.log('updateValues', updateValues);
        await associationField.update(updateValues, {
          transaction,
          raw: true,
        });
      }

      // reload collections that depend on this collection
      const relatedCollections = CollectionsGraph.preOrder({
        collections: [...db.collections.values()].map((collection) => {
          return {
            name: collection.name,
            fields: [...collection.fields.values()],
            inherits: collection.options.inherits,
          };
        }),

        node: prevName,
        direction: 'reverse',
      });

      const relatedCollectionModels = await db.getRepository('collections').find({
        filter: {
          name: relatedCollections,
        },
        transaction,
      });

      for (const relatedCollectionModel of relatedCollectionModels) {
        await relatedCollectionModel.load({
          transaction,
          replaceCollection: true,
        });
      }

      // update association models
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
