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
  appVersion = '<1.0.0-alpha.15';

  async up() {
    const treeCollections = await this.app.db.getRepository('collections').find({
      appends: ['fields'],
      filter: {
        'options.tree': 'adjacencyList',
      },
    });

    for (const treeCollection of treeCollections) {
      const fields = treeCollection.get('fields');

      for (const field of fields) {
        if (!['belongsTo', 'hasMany', 'belongsToMany', 'hasOne'].includes(field.get('type')) && field.get('target')) {
          field.set('target', undefined);
          await field.save();
        }
      }
    }
  }
}
