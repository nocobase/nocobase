/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Migration } from '@nocobase/server';
import { authType } from '../../constants';

export default class AddBasicAuthMigration extends Migration {
  appVersion = '<0.10.0-alpha.2';
  async up() {
    const SystemSetting = this.context.db.getRepository('systemSettings');
    const setting = await SystemSetting.findOne();
    const smsAuthEnabled = setting.get('smsAuthEnabled');
    if (!smsAuthEnabled) {
      return;
    }
    const repo = this.context.db.getRepository('authenticators');
    const existed = await repo.count({
      filter: {
        authType,
      },
    });
    if (existed) {
      return;
    }
    await repo.create({
      values: {
        name: 'sms',
        authType,
        description: 'Sign in with SMS.',
        enabled: true,
      },
    });
  }

  async down() {}
}
