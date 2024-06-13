/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Migration } from '@nocobase/server';

export default class extends Migration {
  on = 'afterLoad'; // 'beforeLoad' or 'afterLoad'

  async up() {
    const r = this.db.getRepository('fields');
    await this.db.sequelize.transaction(async (transaction) => {
      const items = await r.find({
        filter: {
          type: 'belongsToMany',
          interface: 'attachment',
        },
        transaction,
      });

      let count = 0;
      for (const item of items) {
        if (
          item.options.target === 'attachments' &&
          item.options.uiSchema &&
          item.options.uiSchema['x-component'] === 'Upload.Attachment' &&
          !item.options.uiSchema['x-use-component-props']
        ) {
          count++;
          const { uiSchema, ...options } = item.options;
          uiSchema['x-use-component-props'] = 'useAttachmentFieldProps';
          item.set('options', {
            ...options,
            uiSchema,
          });
          item.changed('options');
          await item.save({ transaction });
        }
      }
      console.log('item updated:', count);
    });
  }
}
