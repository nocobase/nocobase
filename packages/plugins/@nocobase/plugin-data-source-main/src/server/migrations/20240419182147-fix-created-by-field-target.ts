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
  appVersion = '<0.21.0-alpha.12';

  async up() {
    const fields = await this.db.getRepository('fields').find({
      filter: {
        name: ['createdBy', 'updatedBy'],
        'options.target.$ne': 'users',
      },
    });

    for (const field of fields) {
      field.set('target', 'users');
      await field.save();
    }
  }
}
