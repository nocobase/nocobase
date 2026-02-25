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
  on = 'afterSync';
  appVersion = '<2.1.0';

  async up() {
    const repo = this.db.getRepository('aiEmployees');
    // Reset all built-in employees' about to null
    // This allows them to follow system default and auto-update with version upgrades
    await repo.update({
      filter: {
        builtIn: true,
      },
      values: {
        about: null,
      },
    });
    this.app.logger.info('Reset built-in AI employees about to null');
  }
}
