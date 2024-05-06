/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Migration, OFFICIAL_PLUGIN_PREFIX } from '@nocobase/server';

export default class extends Migration {
  on = 'afterLoad'; // 'beforeLoad' or 'afterLoad'
  appVersion = '<1.0.0-alpha.1';

  namesMp = {
    'auth-cas': 'cas',
    'auth-oidc': 'oidc',
    'auth-saml': 'saml',
    'field-china-region': 'china-region',
    'action-custom-request': 'custom-request',
    'action-export': 'export',
    'field-formula': 'formula-field',
    'block-iframe': 'iframe-block',
    'action-import': 'import',
    localization: 'localization-management',
    'field-sequence': 'sequence-field',
    'auth-sms': 'sms-auth',
  };

  async up() {
    const resources = await this.app.localeManager.getCacheResources('en-US');
    const modules = Object.keys(resources);
    Object.entries(this.namesMp).forEach(([newName, oldName]) => {
      if (!modules.includes(newName)) {
        return;
      }
      modules.push(oldName, `${OFFICIAL_PLUGIN_PREFIX}${oldName}`);
    });
    const toBeDeleted = [];
    modules.forEach((module) => {
      if (!module.startsWith(OFFICIAL_PLUGIN_PREFIX)) {
        return;
      }
      const name = module.replace(OFFICIAL_PLUGIN_PREFIX, '');
      if (!modules.includes(name)) {
        return;
      }
      toBeDeleted.push(module);
    });
    if (!toBeDeleted.length) {
      return;
    }
    await this.db.getRepository('localizationTexts').destroy({
      filter: {
        module: {
          $in: toBeDeleted.map((module) => `resources.${module}`),
        },
      },
    });
  }
}
