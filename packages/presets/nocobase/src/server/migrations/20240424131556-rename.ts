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
  on = 'beforeLoad'; // 'beforeLoad' or 'afterLoad'
  appVersion = '<1.0.0-alpha.1';

  async up() {
    const names = {
      'collection-manager': '@nocobase/plugin-data-source-main',
      'china-region': '@nocobase/plugin-field-china-region',
      'custom-request': '@nocobase/plugin-action-custom-request',
      export: '@nocobase/plugin-action-export',
      import: '@nocobase/plugin-action-import',
      'formula-field': '@nocobase/plugin-field-formula',
      'iframe-block': '@nocobase/plugin-block-iframe',
      'localization-management': '@nocobase/plugin-localization',
      'sequence-field': '@nocobase/plugin-field-sequence',
      'sms-auth': '@nocobase/plugin-auth-sms',
    };
    for (const original of Object.keys(names)) {
      await this.pm.repository.update({
        filter: {
          name: original,
        },
        values: {
          name: names[original].replace('@nocobase/plugin-', ''),
          packageName: names[original],
        },
      });
    }
  }
}
