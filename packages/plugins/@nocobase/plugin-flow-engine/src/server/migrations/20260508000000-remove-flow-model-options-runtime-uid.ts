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
import _ from 'lodash';

export default class extends Migration {
  on = 'afterLoad';

  async up() {
    const repository = this.context.db.getRepository('flowModels');
    const rows = await repository.find();

    for (const row of rows) {
      const rowUid = String(row.get?.('uid') || row.uid || '').trim();
      const options = row.get?.('options') || row.options;
      if (!rowUid || !_.isPlainObject(options) || options.uid !== rowUid) {
        continue;
      }

      await row.update(
        {
          options: _.omit(options, ['uid']),
        },
        {
          hooks: false,
        },
      );
    }
  }
}
