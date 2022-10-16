import Database, { FindOneOptions, MultipleRelationRepository } from '@nocobase/database';
import { Transaction } from 'sequelize/types/lib/transaction';

async function createForeignKeyField(
  transaction: Transaction,
  db: Database,
  sourceName: string,
  sourceCollectionName: string,
  foreignName: string,
  foreignCollectionName: string,
) {
  const fieldRepo = db.getRepository('fields');

  const foreignField = await fieldRepo.findOne({
    filter: {
      name: foreignName,
      collectionName: foreignCollectionName,
    },
    transaction,
  } as FindOneOptions);
  if (foreignField) {
    return;
  }

  const sourceField = await fieldRepo.findOne({
    appends: ['uiSchema'],
    filter: {
      name: sourceName,
      collectionName: sourceCollectionName,
    },
    transaction,
  } as FindOneOptions);

  const uiSchema = sourceField.get('uiSchema')?.toJSON();
  delete uiSchema?.name;
  delete uiSchema?.['x-uid'];
  uiSchema.title = `foreignKey_${sourceCollectionName}`;
  await db.getRepository<MultipleRelationRepository>('collections.fields', foreignCollectionName).create({
    values: {
      name: foreignName,
      interface: sourceField.get('interface'),
      type: sourceField.get('type'),
      uiSchema: uiSchema,
      // collectionName: foreignCollectionName,
    },
    transaction,
  });
}

export function afterCreateForRelateField(db: Database) {
  return async (model, { transaction }) => {
    const reverseKey = model.get('reverseKey');
    if (!reverseKey) {
      return;
    }
    const Field = db.getCollection('fields');
    const reverse = await Field.model.findByPk(reverseKey, { transaction });
    const interfaceType = reverse.get('interface') as any;
    const options = reverse.get('options') as any;
    switch (interfaceType) {
      case 'oho':
      case 'o2m':
        // create foreign key field
        await createForeignKeyField(
          transaction,
          db,
          options?.sourceKey,
          reverse.get('collectionName'),
          options?.foreignKey,
          options?.target,
        );
        break;
      case 'obo':
      case 'm2o':
        // create foreign key field
        await createForeignKeyField(
          transaction,
          db,
          options?.targetKey,
          options?.target,
          options?.foreignKey,
          reverse.get('collectionName'),
        );
        break;
      case 'linkTo':
      case 'm2m':
        const through = options?.through;

        const collectionsRepo = db.getRepository('collections');
        const collectionsRecord = await collectionsRepo.findOne({
          filter: {
            name: through,
          },
          transaction,
        } as FindOneOptions);
        if (!collectionsRecord) {
          // create through collections record
          const sourceCollectionName = reverse.get('collectionName') as string;
          const targetCollectionName = options?.target as string;
          await collectionsRepo.create({
            values: {
              name: through,
              title: `${db.getCollection(sourceCollectionName).options?.title}_${
                db.getCollection(targetCollectionName).options?.title
              }`,
              logging: true,
            },
            transaction,
          });
        }
        // through collection foreign key1
        await createForeignKeyField(
          transaction,
          db,
          options?.sourceKey,
          reverse.get('collectionName'),
          options?.foreignKey,
          through,
        );
        // through collection foreign key2
        await createForeignKeyField(transaction, db, options?.targetKey, options?.target, options?.otherKey, through);
    }
  };
}
