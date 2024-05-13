/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Database } from '@nocobase/database';

export function beforeCreateForValidateField(db: Database) {
  return async (model, { transaction }) => {
    if (model.type === 'belongsToMany') {
      if (model.get('foreignKey') === model.get('otherKey')) {
        throw new Error('foreignKey and otherKey can not be the same');
      }
    }

    const isPrimaryKey = model.get('primaryKey');
    if (isPrimaryKey) {
      const collection = db.getCollection(model.get('collectionName'));
      if (!collection) {
        return;
      }

      const primaryKey = collection.model.primaryKeyAttribute;

      if (primaryKey !== model.get('name') && collection.model.rawAttributes[primaryKey]) {
        throw new Error(
          `add field ${model.get('name')} failed, collection ${collection.name} already has primary key ${primaryKey}`,
        );
      }
    }
  };
}

export function beforeUpdateForValidateField(db: Database) {
  return async (model, { transaction }) => {
    const isPrimaryKey = model.get('primaryKey');
    if (isPrimaryKey) {
      const collection = db.getCollection(model.get('collectionName'));
      if (!collection) {
        return;
      }

      const primaryKey = collection.model.primaryKeyAttribute;

      if (primaryKey !== model.get('name') && collection.model.rawAttributes[primaryKey]) {
        throw new Error(
          `update field ${model.get('name')} failed, collection ${
            collection.name
          } already has primary key ${primaryKey}`,
        );
      }
    }
  };
}
