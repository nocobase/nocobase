/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

/* istanbul ignore file -- @preserve */

import { Migration } from '@nocobase/server';

export default class extends Migration {
  appVersion = '<0.9.1-alpha.3';

  async up() {
    const result = await this.app.version.satisfies('<0.9.1-alpha.3');
    if (!result) {
      return;
    }
    const r = this.db.getRepository('uiSchemas');
    const items = await r.find({
      filter: {
        'schema.x-designer': 'FormV2.FilterDesigner',
      },
    });
    await this.db.sequelize.transaction(async (transaction) => {
      for (const item of items) {
        const schema = item.schema;
        const decorator = schema['x-decorator'];
        schema['x-decorator'] = 'FilterFormBlockProvider';
        item.set('schema', schema);
        console.log(item['x-uid'], decorator, schema['x-decorator']);
        await item.save({ transaction });
      }
    });
  }
}
