/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Database } from '@nocobase/database';
import { FieldIsDependedOnByOtherError } from '../errors/field-is-depended-on-by-other';

export function beforeDestoryField(db: Database) {
  return async (model, opts) => {
    const { transaction } = opts;
    const { name, type, collectionName } = model.get();

    const collection = db.getCollection(model.get('collectionName'));
    if (collection.options.uiManageable) {
      throw new Error('Cannot remove a UI manageable field');
    }

    if (['belongsTo', 'hasOne', 'hasMany', 'belongsToMany'].includes(type)) {
      return;
    }

    const relatedFields = await db.getRepository('fields').find({
      filter: {
        $or: [
          {
            ['options.sourceKey']: name,
            collectionName,
          },
          {
            ['options.targetKey']: name,
            ['options.target']: collectionName,
          },
        ],
      },
      transaction,
    });

    for (const field of relatedFields) {
      const keys = [
        {
          name: 'sourceKey',
          condition: (associationField) =>
            associationField.options['sourceKey'] === name && associationField.collectionName === collectionName,
        },
        {
          name: 'targetKey',
          condition: (associationField) =>
            associationField.options['targetKey'] === name && associationField.options['target'] === collectionName,
        },
      ];

      const usedAs = keys.find((key) => key.condition(field))['name'];

      throw new FieldIsDependedOnByOtherError({
        fieldName: name,
        fieldCollectionName: collectionName,
        dependedFieldName: field.get('name'),
        dependedFieldCollectionName: field.get('collectionName'),
        dependedFieldAs: usedAs,
      });
    }
  };
}
