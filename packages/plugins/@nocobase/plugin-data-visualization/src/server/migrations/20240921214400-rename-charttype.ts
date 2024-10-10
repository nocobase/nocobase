/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Repository } from '@nocobase/database';
import { Migration } from '@nocobase/server';

export default class extends Migration {
  on = 'afterLoad'; // 'beforeLoad' or 'afterLoad'
  appVersion = '<=1.5.0-beta';
  async up() {
    const r = this.db.getRepository<Repository>('uiSchemas');
    const items = await r.find({
      filter: {
        'schema.x-decorator': 'ChartRendererProvider',
      },
    });

    await this.db.sequelize.transaction(async (transaction) => {
      for (const item of items) {
        const schema = item.schema;
        const chartType = schema['x-decorator-props']?.config?.chartType;
        if (!chartType) {
          continue;
        }
        if (chartType.startsWith('Built-in.')) {
          if (chartType === 'Built-in.statistic' || chartType === 'Built-in.table') {
            schema['x-decorator-props'].config.chartType = chartType.replace('Built-in', 'antd');
          } else {
            schema['x-decorator-props'].config.chartType = chartType.replace('Built-in', 'ant-design-charts');
          }
          item.set('schema', schema);
          await item.save({ transaction });
        }
      }
    });
  }
}
