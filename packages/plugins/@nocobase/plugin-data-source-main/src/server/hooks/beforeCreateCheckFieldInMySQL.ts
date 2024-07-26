/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

export function beforeCreateCheckFieldInMySQL(db) {
  return async (model, { transaction }) => {
    if (!db.isMySQLCompatibleDialect()) {
      return;
    }

    const fieldOptions = model.get();
    if (fieldOptions.autoIncrement) {
      const collection = db.getCollection(fieldOptions.collectionName);
      if (!collection) {
        return;
      }
      const rawAttributes = collection.model.rawAttributes;
      console.log('rawAttributes', rawAttributes);

      for (const fieldName in Object.keys(rawAttributes)) {
        const field = rawAttributes[fieldName];
        if (field.autoIncrement) {
          throw new Error('Only one autoIncrement field is allowed in a table');
        }
      }
    }
  };
}
