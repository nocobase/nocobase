/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Plugin } from '@nocobase/server';
import { getInstanceId, saveLicenseKey, isLicenseKeyExists, getLicenseValidate, CACHE_KEY } from './utils';
import { keyDecrypt } from '@nocobase/license-kit';
import pick from 'lodash/pick';

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
          const licenseValidate = await getLicenseValidate({ key: licenseKey, ctx });
          ctx.body = {
            ...licenseValidate,
          };
          if (licenseValidate.envMatch && licenseValidate.domainMatch && licenseValidate.licenseStatus === 'active') {
            await saveLicenseKey(licenseKey, ctx);
          }
          await next();
        },
        'is-exists': async (ctx, next) => {
          ctx.body = await isLicenseKeyExists();
          await next();
        },
        'license-validate': async (ctx, next) => {
          const isExists = await isLicenseKeyExists();
          if (!isExists) {
            ctx.body = {
              keyNotExists: true,
            };
            await next();
            return;
          }
          const licenseValidate = await getLicenseValidate({ ctx });
          ctx.body = {
            keyNotExists: false,
            ...licenseValidate,
            keyData: pick(licenseValidate.keyData, ['service']),
          };
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
