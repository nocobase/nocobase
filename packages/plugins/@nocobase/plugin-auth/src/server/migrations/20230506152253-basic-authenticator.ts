/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Migration } from '@nocobase/server';
import { presetAuthType, presetAuthenticator } from '../../preset';

export default class AddBasicAuthMigration extends Migration {
  appVersion = '<0.14.0-alpha.1';
  async up() {
    const repo = this.context.db.getRepository('authenticators');
    const existed = await repo.count();
    if (existed) {
      return;
    }
    await repo.create({
      values: {
        name: presetAuthenticator,
        authType: presetAuthType,
        description: 'Sign in with username/email.',
        enabled: true,
      },
    });
  }

  async down() {}
}
