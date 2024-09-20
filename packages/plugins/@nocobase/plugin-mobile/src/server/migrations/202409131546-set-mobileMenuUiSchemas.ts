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
  appVersion = '<1.4.0-beta';

  async up() {
    await this.db.sequelize.transaction(async (transaction) => {
      const mobileRoutes = await this.db.getRepository('mobileRoutes').find({
        sort: 'sort',
        transaction,
      });
      const roles = await this.db.getRepository('roles').find({
        filter: {
          'allowNewMobileMenu.$isFalsy': true,
        },
        transaction,
      });
      const mobileRouteIds = mobileRoutes.map((item) => item.get('id'));
      for (const role of roles) {
        // 如果是 false，不处理
        if (role.allowNewMobileMenu === false) {
          continue;
        }
        role.allowNewMobileMenu = true;
        await role.save({ transaction });
        await this.db.getRepository<any>('roles.mobileRoutes', role.get('name')).add({
          tk: mobileRouteIds,
          transaction,
        });
      }
    });
  }

  async down() {}
}
