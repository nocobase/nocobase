/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Migration } from '@nocobase/server';
import { adminProfileEditFormSchema, userProfileEditFormSchema } from '../profile/edit-form-schema';

export default class extends Migration {
  on = 'afterLoad'; // 'beforeLoad' or 'afterLoad'
  appVersion = '<1.5.0-alpha.5';

  async up() {
    const repo = this.db.getRepository<any>('uiSchemas');
    const adminSchema = await repo.findOne({
      filter: {
        'x-uid': 'nocobase-admin-profile-edit-form',
      },
    });
    if (!adminSchema) {
      await repo.insert(adminProfileEditFormSchema);
    }
    const userSchema = await repo.findOne({
      filter: {
        'x-uid': 'nocobase-user-profile-edit-form',
      },
    });
    if (!userSchema) {
      await repo.insert(userProfileEditFormSchema);
    }
  }
}
