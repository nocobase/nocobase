/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Plugin } from '@nocobase/server';
import {
  getInstanceId,
  saveLicenseKey,
  isLicenseKeyExists,
  getLicenseValidate,
  getLicenseStatus,
  testPkgConnection,
  testPkgLogin,
  testServiceConnection,
  getLocalKeyData,
} from './utils';
import pick from 'lodash/pick';

export function getUpgradeLicenseErrorMessage({
  pkgVersion,
  appVersion,
  licenseStatus,
  upgradeExpirationDate,
}: {
  pkgVersion: string;
  appVersion: string | null;
  licenseStatus?: string | null;
  upgradeExpirationDate?: string | null;
}): string | undefined {
  if (!licenseStatus || licenseStatus === 'active') {
    return;
  }

  if (appVersion === pkgVersion) {
    return;
  }

  const installedVersion = appVersion || 'unknown';
  const reason = upgradeExpirationDate
    ? `The license has expired and cannot be upgraded. Upgrade expiration date: ${upgradeExpirationDate}.`
    : 'The license is invalid and cannot be upgraded.';

  return [
    reason,
    `Please roll back to version ${installedVersion}.`,
    `Current core version is ${pkgVersion}, but the installed application version is ${installedVersion}.`,
  ].join('\n');
}

export class PluginLicenseServer extends Plugin {
  async afterAdd() {
    this.app.on('afterLoad', async () => {
      const pkgVersion = this.app.getPackageVersion();
      const appVersion = await this.app.version.get();
      const keyData = await getLocalKeyData();
      const licenseStatus = keyData?.licenseKey?.licenseStatus;
      const upgradeExpirationDate = keyData?.upgradeExpirationDate;
      const errorMessage = getUpgradeLicenseErrorMessage({
        pkgVersion,
        appVersion,
        licenseStatus,
        upgradeExpirationDate,
      });

      if (errorMessage) {
        throw new Error(errorMessage);
      }
    });
  }

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
          const licenseStatus = await getLicenseStatus(licenseValidate.keyData);
          ctx.body = {
            ...licenseValidate,
            licenseStatus,
          };
          if (ctx.body.envMatch && ctx.body.domainMatch && ctx.body.licenseStatus === 'active') {
            await saveLicenseKey(licenseKey, ctx);
          }
          await next();
        },
        'is-exists': async (ctx, next) => {
          ctx.body = await isLicenseKeyExists();
          await next();
        },
        'license-validate': async (ctx, next) => {
          const isExist = await isLicenseKeyExists();
          if (!isExist) {
            ctx.body = {
              keyExist: false,
            };
            await next();
            return;
          }
          const licenseValidate = await getLicenseValidate({ ctx });
          ctx.body = {
            keyExist: true,
            ...licenseValidate,
            keyData: pick(licenseValidate.keyData, ['service']),
          };
          await next();
        },
        'service-validate': async (ctx, next) => {
          const keyExist = await isLicenseKeyExists();
          if (!keyExist) {
            ctx.body = {
              keyExist,
            };
            await next();
            return;
          }
          let isPkgConnection = false;
          try {
            isPkgConnection = await testPkgConnection();
          } catch (e) {
            isPkgConnection = false;
          }
          let isPkgLogin = false;
          let isServiceConnection = false;
          try {
            const keyData = await getLocalKeyData();
            isPkgLogin = await testPkgLogin(keyData);
            isServiceConnection = await testServiceConnection(keyData);
          } catch (e) {
            isPkgLogin = false;
            isServiceConnection = false;
          }

          ctx.body = {
            keyExist,
            isPkgConnection,
            isPkgLogin,
            isServiceConnection,
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
