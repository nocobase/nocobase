/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import Migration from './20240802141435-collection-tree';

export default class extends Migration {
  on = 'afterLoad'; // 'beforeLoad' or 'afterLoad'
  appVersion = '<=1.3.36-beta';

  async getTreeCollections({ transaction }) {
    const treeCollections = await this.app.db.getRepository('collections').find({
      appends: ['fields'],
      filter: {
        'options.tree': 'adjacencyList',
      },
      transaction,
    });
    return treeCollections.filter((collection) => collection.options.inherits?.length > 0);
  }
}
