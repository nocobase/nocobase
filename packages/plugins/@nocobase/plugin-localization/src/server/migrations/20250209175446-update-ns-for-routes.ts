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
  on = 'afterLoad'; // 'beforeLoad' or 'afterLoad'
  appVersion = '<1.6.1';

  async up() {
    await this.db.getRepository('localizationTexts').update({
      values: {
        module: 'resources.lm-desktop-routes',
      },
      filter: {
        module: 'resources.lm-menus',
      },
    });
  }
}
