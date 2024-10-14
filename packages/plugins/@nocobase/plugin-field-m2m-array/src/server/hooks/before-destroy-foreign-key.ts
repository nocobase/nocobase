/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Database, Model } from '@nocobase/database';

export function beforeDestroyForeignKey(db: Database) {
  return async (model: Model, { transaction }) => {
    const { isForeignKey, collectionName, name: fkName, type } = model.get();

    if (!isForeignKey || type !== 'set') {
      return;
    }

    const fieldKeys = [];
    const collection = db.getCollection(collectionName);
    if (!collection) {
      return;
    }

    for (const [, field] of collection.fields) {
      const fieldKey = field.options?.key;
      if (!fieldKey || field.type !== 'belongsToArray' || field.foreignKey !== fkName) {
        continue;
      }
      fieldKeys.push(fieldKey);
    }

    const r = db.getRepository('fields');

    await r.destroy({
      filter: {
        'key.$in': fieldKeys,
      },
      transaction,
    });
  };
}
