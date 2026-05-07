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
  on = 'afterSync'; // 'beforeLoad' or 'afterLoad'
  appVersion = '<2.2.0';

  async up() {
    const repo = this.db.getRepository('aiEmployees');
    if (!repo) {
      return;
    }

    await repo.update({
      values: {
        deprecated: true,
      },
      filter: {
        builtIn: true,
        username: 'orin',
      },
    });

    this.app.logger.info('Update AI employee orin to deprecated');
  }
}
