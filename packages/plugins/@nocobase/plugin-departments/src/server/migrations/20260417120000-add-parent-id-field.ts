/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Migration } from '@nocobase/server';
import { parentIdField } from '../collections/departments';

export default class extends Migration {
  on = 'afterLoad';

  async up() {
    const fieldRepo = this.db.getRepository('fields');
    if (!fieldRepo) {
      return;
    }

    const field = await fieldRepo.findOne({
      filter: {
        collectionName: 'departments',
        name: 'parentId',
      },
    });

    if (field) {
      return;
    }

    await fieldRepo.create({
      values: {
        collectionName: 'departments',
        ...parentIdField,
      },
    });
  }
}
