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
  appVersion = '<=1.3.22-beta';

  async up() {
    const mobileRoutes = await this.db.getRepository('mobileRoutes').find({
      sort: 'sort',
    });
    const roles = await this.db.getRepository('roles').find();

    for (const role of roles) {
      await this.db.getRepository<any>('roles.mobileRoutes', role.get('name')).add({
        tk: mobileRoutes.map((item) => item.get('id')),
      });
    }
  }

  async down() {}
}
