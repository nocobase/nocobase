/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

/* istanbul ignore file -- @preserve */

import { Migration } from '../migration';

export default class extends Migration {
  on = 'afterSync'; // 'beforeLoad' or 'afterLoad'
  appVersion = '<0.18.0-alpha.10';

  async up() {
    await this.pm.repository.update({
      values: {
        installed: true,
      },
      filter: {
        enabled: true,
      },
    });
  }
}
