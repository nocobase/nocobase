/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Plugin } from '@nocobase/server';
import { getInstanceId, saveLicenseKey, isLicenseKeyExists } from './utils';
import { keyDecrypt } from '@nocobase/license-kit';
import pkg from './../../package.json';

export class PluginLicenseServer extends Plugin {
  async afterAdd() {}

  async beforeLoad() {}

  async load() {
    this.app.resourceManager.define({
      name: 'license',
      actions: {
        'instance-id': async (ctx, next) => {
          ctx.body = await getInstanceId();
          await next();
        },
        'license-key': async (ctx, next) => {
          const { licenseKey } = ctx.request.body;
          try {
            keyDecrypt(licenseKey);
          } catch (e) {
            return ctx.throw(500, ctx.t('Invalid license key', { ns: pkg.name }));
          }
          await saveLicenseKey(licenseKey);
          await next();
        },
        'is-exists': async (ctx, next) => {
          ctx.body = await isLicenseKeyExists();
          await next();
        },
      },
    });
    this.app.acl.allow('license', '*', 'loggedIn');
  }

  async install() {}

  async afterEnable() {}

  async afterDisable() {}

  async remove() {}
}

export default PluginLicenseServer;
