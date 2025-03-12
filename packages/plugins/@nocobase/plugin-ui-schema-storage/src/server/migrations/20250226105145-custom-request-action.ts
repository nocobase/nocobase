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
  on = 'afterLoad';
  appVersion = '<1.6.0';
  async up() {
    const repo1 = this.db.getRepository('customRequestsRoles');
    const repo2 = this.db.getRepository('uiButtonSchemasRoles');
    const customRequestsRoles = await repo1.find();
    for (const customRequestsRole of customRequestsRoles) {
      await repo2.firstOrCreate({
        values: {
          uid: customRequestsRole.customRequestKey,
          roleName: customRequestsRole.roleName,
        },
        filterKeys: ['uid', 'roleName'],
      });
    }
  }
}
