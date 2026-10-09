/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Model } from '@nocobase/database';
import { Migration } from '@nocobase/server';
import { elementTypeMap } from '../belongs-to-array-field';

const FOREIGN_KEY_TYPES = ['set', 'array', 'json', 'jsonb'];

export default class extends Migration {
  on = 'afterLoad'; // 'beforeLoad' or 'afterLoad'

  async up() {
    // The v2 field form used to submit `source: <current collection>` when creating relation fields. The database reads
    // `source` as `collection.field` of an inherited view field, so those fields were skipped when loading collections.
    // Only belongs-to-array fields are restored here: their foreign key array is still created by this plugin, while the
    // foreign keys of other relation types were never created and dropping `source` would reference missing columns.
    const fields = await this.db.getRepository('fields').find({
      filter: {
        type: 'belongsToArray',
      },
    });

    for (const field of fields) {
      if (field.get('source') !== field.get('collectionName')) {
        continue;
      }
      // These fields were never bound, so their keys were never checked. Keep a field skipped if binding it would throw
      // and stop the collections from loading.
      if (!(await this.hasValidAssociationKeys(field))) {
        continue;
      }
      field.set('source', undefined);
      await field.save({ hooks: false });
    }
  }

  private async hasValidAssociationKeys(field: Model) {
    const fieldRepo = this.db.getRepository('fields');
    const foreignField = await fieldRepo.findOne({
      filter: { collectionName: field.get('collectionName'), name: field.get('foreignKey') },
    });
    const targetField = await fieldRepo.findOne({
      filter: { collectionName: field.get('target'), name: field.get('targetKey') },
    });
    if (!foreignField || !targetField || !FOREIGN_KEY_TYPES.includes(foreignField.get('type'))) {
      return false;
    }
    if (!this.db.inDialect('postgres') || foreignField.get('dataType') !== 'array') {
      return true;
    }
    const targetType = targetField.get('type');
    return foreignField.get('elementType') === (elementTypeMap[targetType] || targetType);
  }
}
