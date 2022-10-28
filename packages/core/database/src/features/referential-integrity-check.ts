import Database from '../database';
import { Model, Transactionable } from 'sequelize';

interface ReferentialIntegrityCheckOptions extends Transactionable {
  db: Database;
  referencedInstance: Model;
}

export async function referentialIntegrityCheck(options: ReferentialIntegrityCheckOptions) {
  const { referencedInstance, db, transaction } = options;

  // @ts-ignore
  const collection = db.modelCollection.get(referencedInstance.constructor);

  const collectionName = collection.name;
  const references = db.referenceMap.getReferences(collectionName);

  for (const reference of references) {
    const { sourceCollectionName, sourceField, targetField, onDelete } = reference;
    const sourceCollection = db.collections.get(sourceCollectionName);
    const sourceRepository = sourceCollection.repository;

    const referencingExists = await sourceRepository.count({
      filter: {
        [sourceField]: referencedInstance[targetField],
      },
      transaction,
    });

    if (referencingExists) {
      if (onDelete === 'RESTRICT') {
        throw new Error('RESTRICT');
      }
    }
  }
}
