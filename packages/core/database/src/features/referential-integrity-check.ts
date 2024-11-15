/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Model, Transactionable } from 'sequelize';
import Database from '../database';

interface ReferentialIntegrityCheckOptions extends Transactionable {
  db: Database;
  referencedInstance: Model;
}

export async function referentialIntegrityCheck(options: ReferentialIntegrityCheckOptions) {
  const { referencedInstance, db, transaction } = options;

  const collection = db.getCollectionByModelName(referencedInstance.constructor.name);

  const collectionName = collection.name;
  const references = db.referenceMap.getReferences(collectionName);

  if (!references) {
    return;
  }

  for (const reference of references) {
    const { sourceCollectionName, sourceField, targetField, onDelete } = reference;

    if (onDelete === 'NO ACTION') {
      continue;
    }

    const sourceCollection = db.collections.get(sourceCollectionName);
    const sourceRepository = sourceCollection.repository;

    if (sourceCollection.isView()) {
      continue;
    }

    const filter = {
      [sourceField]: referencedInstance[targetField],
    };

    const referencingExists = await sourceRepository.count({
      filter,
      transaction,
    });

    if (!referencingExists) {
      continue;
    }

    if (onDelete === 'RESTRICT') {
      throw new Error('RESTRICT');
    }

    if (onDelete === 'CASCADE') {
      await sourceRepository.destroy({
        filter: filter,
        transaction,
      });
    }

    if (onDelete === 'SET NULL') {
      await sourceRepository.update({
        filter,
        values: {
          [sourceField]: null,
        },
        hooks: false,
        transaction,
      });
    }
  }
}
