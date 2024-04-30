/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Migration } from '@nocobase/server';

export default class UpdateUserNameMigration extends Migration {
  appVersion = '<0.13.0-alpha.1';
  async up() {
    const repo = this.context.db.getRepository('users');
    const user = await repo.findOne({
      filter: {
        email: 'admin@nocobase.com',
        username: null,
      },
    });
    if (user) {
      await repo.update({
        values: {
          username: process.env.INIT_ROOT_USERNAME || 'nocobase',
        },
        filter: {
          id: user.id,
        },
      });
    }
  }

  async down() {}
}
