import Database, { FindOneOptions, FindOptions, Model, Transaction } from '@nocobase/database';

async function destroyFields(db: Database, transaction: Transaction, fieldRecords: Model[]) {
  const fieldsRepo = db.getRepository('fields');
  for (const fieldRecord of fieldRecords) {
    await fieldsRepo.destroy({
      filter: {
        name: fieldRecord.get('name'),
        collectionName: fieldRecord.get('collectionName'),
      },
      transaction,
    });
  }
}

export function afterDestroyForForeignKeyField(db: Database) {
  return async (model, opts) => {
    const { transaction } = opts;
    const options = model.get('options');
    if (!options?.isForeignKey) {
      return;
    }

    const collectionRepo = db.getRepository('collections');
    const foreignKey = model.get('name');
    const foreignKeyCollectionName = model.get('collectionName');
    const collectionRecord = await collectionRepo.findOne({
      filter: {
        name: foreignKeyCollectionName,
      },
      transaction,
    } as FindOneOptions);
    const collectionOptions = collectionRecord.get('options');
    const fieldsRepo = db.getRepository('fields');

    if (collectionOptions?.isThrough) {
      // through collection
      const fieldRecords = await fieldsRepo.find({
        filter: {
          options: { through: foreignKeyCollectionName, foreignKey: foreignKey },
        },
        transaction,
      } as FindOptions);
      await destroyFields(db, transaction, fieldRecords);
    } else {
      await destroyFields(
        db,
        transaction,
        await fieldsRepo.find({
          filter: {
            collectionName: foreignKeyCollectionName,
            options: { foreignKey: foreignKey },
          },
          transaction,
        } as FindOptions),
      );
      await destroyFields(
        db,
        transaction,
        await fieldsRepo.find({
          filter: {
            options: { foreignKey: foreignKey, target: foreignKeyCollectionName },
          },
          transaction,
        } as FindOptions),
      );
    }
  };
}
