/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Plugin } from '@nocobase/server';
import { getInstanceId, saveLicenseKey } from './utils';

export class PluginLicenseUtilitiesServer extends Plugin {
  async afterAdd() {}

  async beforeLoad() {}

  async load() {
    this.app.resourceManager.define({
      name: 'license-utilities',
      actions: {
        instanceid: async (ctx, next) => {
          ctx.body = await getInstanceId();
          await next();
        },
        'license-key': async (ctx, next) => {
          const { licenseKey } = ctx.request.body;
          console.log(licenseKey);
          await saveLicenseKey(licenseKey);
          await next();
        },
      },
    });
    this.app.acl.allow('license-utilities', '*', 'loggedIn');
  }

  async install() {}

  async afterEnable() {}

  async afterDisable() {}

  async remove() {}
}

export default PluginLicenseUtilitiesServer;
