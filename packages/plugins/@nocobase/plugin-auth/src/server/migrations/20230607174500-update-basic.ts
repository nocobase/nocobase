/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Migration } from '@nocobase/server';
import { presetAuthenticator } from '../../preset';

export default class UpdateBasicAuthMigration extends Migration {
  appVersion = '<0.14.0-alpha.1';
  async up() {
    const SystemSetting = this.context.db.getRepository('systemSettings');
    const setting = await SystemSetting.findOne();
    const allowSignUp = setting.get('allowSignUp') ? true : false;
    const repo = this.context.db.getRepository('authenticators');
    await repo.update({
      values: {
        options: {
          public: {
            allowSignUp,
          },
        },
      },
      filter: {
        name: presetAuthenticator,
      },
    });
  }

  async down() {}
}
