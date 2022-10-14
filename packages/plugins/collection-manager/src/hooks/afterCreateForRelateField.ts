import Database from '@nocobase/database';
import { uid } from '@nocobase/utils';

export function afterCreateForRelateField(db: Database) {
  return async (model, { transaction }) => {
    //
    const reverseKey = model.get('reverseKey');
    if (!reverseKey) {
      return;
    }
    const Field = db.getCollection('fields');
    const reverse = await Field.model.findByPk(reverseKey, { transaction });
    const reverseType = reverse.get('type') as any;
    const options = reverse.get('options') as any;
    switch (reverseType) {
      case 'hasOne':
        // create foreign key field
        await Field.model.create(
          {
            name: options?.foreignKey,
            collectionName: options?.target,
            type: 'foreignKey',
          },
          { hooks: true, transaction },
        );
        break;
      case 'belongsTo':
        // create foreign key field
        await Field.model.create(
          {
            name: options?.foreignKey,
            collectionName: reverse.get('collectionName'),
            type: 'foreignKey',
          },
          { hooks: true, transaction },
        );
        break;
      case 'hasMany':
        // create foreign key field
        await Field.model.create(
          {
            name: options?.foreignKey,
            collectionName: options?.target,
            type: 'foreignKey',
          },
          { hooks: true, transaction },
        );
        break;
      case 'belongsToMany':
        const through = options?.through;

        // create through collections record
        const Collections = db.getCollection('collections');
        const sourceCollectionName = reverse.get('collectionName') as string
        const targetCollectionName = options?.target as string
        await Collections.model.create(
          {
            name: through,
            title: `${db.getCollection(sourceCollectionName).options?.title}_${db.getCollection(targetCollectionName).options?.title}`,
            options: {
              logging: true,
            },
          },
          {
            hooks: true,
            transaction,
          },
        );

        // create foreign key field and default fields
        await Field.model.bulkCreate(
          [
            {
              key: uid(),
              name: options?.foreignKey,
              collectionName: through,
              type: 'foreignKey',
              sort: 1
            },
            {
              key: uid(),
              name: options?.otherKey,
              collectionName: through,
              type: 'foreignKey',
              sort: 2
            },
            {
              key: uid(),
              name: 'createdAt',
              collectionName: through,
              type: 'date',
              interface: 'createdAt',
              options: { field: 'createdAt' },
              sort: 3
            },
            {
              key: uid(),
              name: 'updatedAt',
              collectionName: through,
              type: 'date',
              interface: 'updatedAt',
              options: { field: 'updatedAt' },
              sort: 4
            },
          ],
          { hooks: true, transaction },
        );

        break;
    }
  };
}
