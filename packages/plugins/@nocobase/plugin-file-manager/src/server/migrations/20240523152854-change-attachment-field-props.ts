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
  appVersion = '<1.0.0-alpha.16';

  async up() {
    const r = this.db.getRepository('uiSchemas');
    await this.db.sequelize.transaction(async (transaction) => {
      const items = await r.find({
        filter: {
          'schema.x-component': 'CollectionField',
        },
        transaction,
      });

      let count = 0;
      for (const item of items) {
        if (item.schema['x-component-props']?.action?.match(/^.+:create(\?attachmentField=.+)?/)) {
          count++;
          // console.log(item.schema['x-component-props']);
          const {
            schema: { action, ...schema },
          } = item;
          item.set('schema', {
            ...schema,
            'x-use-component-props': 'useAttachmentFieldProps',
          });
          item.changed('schema');
          await item.save({ transaction });
        }
      }
      console.log('item updated:', count);
    });
  }
}
