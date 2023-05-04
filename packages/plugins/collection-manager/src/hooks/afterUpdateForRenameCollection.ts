import { Database } from '@nocobase/database';
import { CollectionModel } from '../models';
import { inflection } from '@nocobase/utils';
import lodash from 'lodash';

export function afterUpdateForRenameCollection(db: Database) {
  return async (model: CollectionModel, options) => {
    const { context, transaction } = options;

    if (context) {
      const prevName = model.previous('name');
      const currentName = model.get('name');

      if (prevName == currentName) {
        return;
      }

      const prevCollection = db.getCollection(prevName);
      const prevCollectionTableName = prevCollection.getTableNameWithSchema();

      const updateForeignKey = (foreignKey) => {
        return foreignKey.replace(
          new RegExp(`^${inflection.singularize(prevName)}`),
          inflection.singularize(currentName),
        );
      };

      // old collection fields
      const collectionFields = await db.getRepository('fields').find({
        filter: {
          collectionName: prevName,
        },
        transaction,
      });

      for (const field of collectionFields) {
        const options = lodash.cloneDeep(field.get('options'));

        if (['hasMany', 'hasOne'].includes(field.get('type')) && options.foreignKey) {
          const oldForeignKey = options.foreignKey;
          options.foreignKey = updateForeignKey(oldForeignKey);

          if (oldForeignKey !== options.foreignKey) {
            // rename column
            const target = db.getCollection(options.target);
            const targetTableName = target.getTableNameWithSchema();

            await db.sequelize.getQueryInterface().renameColumn(targetTableName, oldForeignKey, options.foreignKey, {
              transaction,
            });
          }
        }

        if (field.get('type') == 'belongsToMany' && !db.inDialect('sqlite')) {
          const oldForeignKey = options.foreignKey;
          options.foreignKey = updateForeignKey(oldForeignKey);

          if (oldForeignKey !== options.foreignKey) {
            const reverseField = await db.getRepository('fields').findOne({
              filter: {
                collectionName: options.target,
                'options.target': prevName,
                'options.otherKey': oldForeignKey,
              },
              transaction,
            });

            await reverseField.update(
              {
                options: {
                  ...reverseField.get('options'),
                  otherKey: options.foreignKey,
                },
              },
              {
                transaction,
                hooks: false,
                raw: true,
              },
            );

            const throughCollection = db.getCollection(options.through);

            // rename column in through table
            await db.sequelize
              .getQueryInterface()
              .renameColumn(throughCollection.getTableNameWithSchema(), oldForeignKey, options.foreignKey, {
                transaction,
              });
          }
        }

        // update field collection name
        await field.update(
          {
            options,
            collectionName: currentName,
          },
          {
            hooks: false,
            raw: true,
            transaction,
          },
        );
      }

      // association field point to old collection
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
          newOptions.foreignKey = updateForeignKey(newOptions.foreignKey);
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

        await associationField.update(updateValues, {
          transaction,
          hooks: false,
          raw: true,
        });
      }

      const associationThroughFields = await db.getRepository('fields').find({
        filter: {
          'options.through': prevName,
        },
        transaction,
      });

      for (const associationThroughField of associationThroughFields) {
        const newOptions = {
          ...associationThroughField.get('options'),
          through: currentName,
        };

        await associationThroughField.update(
          {
            options: newOptions,
          },
          {
            transaction,
            hooks: false,
            raw: true,
          },
        );
      }

      // update inherited collections
      const children = db.inheritanceMap.getChildren(prevName);
      if (children.size > 0) {
        const childrenModels = await db.getRepository('collections').find({
          filter: {
            name: [...children],
          },
          transaction,
        });

        for (const child of childrenModels) {
          const options = child.get('options');
          await child.update(
            {
              options: {
                ...options,
                inherits: options.inherits.map((name) => {
                  if (name == prevName) {
                    return currentName;
                  }
                  return name;
                }),
              },
            },
            {
              hooks: false,
              transaction,
            },
          );
        }
      }

      // update association models
      await model.migrate({
        transaction,
        replaceCollection: prevName,
        renameTable: {
          from: prevCollectionTableName,
        },
      });

      options.reload = true;
    }
  };
}
