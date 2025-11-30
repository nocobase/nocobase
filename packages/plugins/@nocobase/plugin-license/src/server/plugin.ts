/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Plugin } from '@nocobase/server';
import { getInstanceId, saveLicenseKey, isLicenseKeyExists, getLicenseValidate } from './utils';
import { keyDecrypt } from '@nocobase/license-kit';
import { LICENSE_TIPS } from '../const';

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
            return ctx.throw(500, ctx.t(LICENSE_TIPS.INVALID_LICENSE_KEY, { ns: '@nocobase/plugin-license' }));
          }

          const licenseValidate = await getLicenseValidate({ key: licenseKey, ctx });
          if (!licenseValidate.envMatch) {
            return ctx.throw(500, ctx.t(LICENSE_TIPS.ENV_NOT_MATCH, { ns: '@nocobase/plugin-license' }));
          }
          if (!licenseValidate.domainMatch) {
            return ctx.throw(
              500,
              ctx.t(LICENSE_TIPS.DOMAIN_NOT_MATCH, {
                ns: '@nocobase/plugin-license',
                domain: licenseValidate.current.domain,
                interpolation: { escapeValue: false },
              }),
            );
          }
          ctx.body = {
            ...licenseValidate,
          };
          await saveLicenseKey(licenseKey);
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
          const { licenseKey } = ctx.request.body;
          const licenseValidate = await getLicenseValidate({ key: licenseKey, ctx });
          ctx.body = {
            keyNotExists: false,
            ...licenseValidate,
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
