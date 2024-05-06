/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Migration } from '@nocobase/server';

export default class SetAuditPluginAsLocalMigration extends Migration {
  on = 'beforeLoad';
  appVersion = '<0.13.0-alpha.5';
  async up() {
    await this.pm.repository.update({
      values: {
        builtIn: false,
      },
      filter: {
        name: 'audit-logs',
      },
    });
  }
}
