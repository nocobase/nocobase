/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { getEnvAsync, Env } from '@nocobase/license-kit';
import { getKey, parseKey, isDateExpired } from './key';
import { isDomainMatch, getClientDomain, isDbMatch, isSysMatch, getEnvOnce } from './env';
import { getNocoBasePkgUrl, testPkgLogin, testServiceConnection } from './pkg';
import { KeyData } from './interface';
import { getPlugins, getPluginsLicenseStatus, PluginData } from './plugin';

export interface LicenseValidateResult {
  current: {
    env: Env;
    domain: string;
  };
  dbMatch: boolean;
  sysMatch: boolean;
  envMatch: boolean;
  domainMatch: boolean;
  isExpired: boolean;
  isServiceConnection: boolean;
  isPkgLogin: boolean;
  keyData: KeyData;
  pkgUrl: string;
  licenseStatus: 'active' | 'invalid';
  pluginsLicensed: boolean;
  plugins: PluginData[];
  keyStatus?: 'invalid' | 'notfound';
}

export async function getLicenseValidate({ key, ctx }: { key?: string; ctx?: any }): Promise<LicenseValidateResult> {
  const currentDomain = getClientDomain(ctx);
  const currentEnv = await getEnvOnce();
  let keyStatus;
  let keyData;
  try {
    const keyStr = key || (await getKey(ctx));
    keyData = parseKey(keyStr);
  } catch (e) {
    keyStatus = e?.message;
  }
  // const licenseStatus = await getLicenseStatus(keyData);
  const domainMatch = isDomainMatch(currentDomain, keyData);
  const dbMatch = isDbMatch(currentEnv, keyData);
  const sysMatch = isSysMatch(currentEnv, keyData);
  const envMatch = dbMatch && sysMatch;
  const isExpired = isDateExpired(keyData?.upgradeExpirationDate);
  const plugins = await getPlugins({ keyData, ctx });
  const pluginsLicensed = getPluginsLicenseStatus({ plugins });
  const isPkgLogin = await testPkgLogin(keyData);
  const isServiceConnection = await testServiceConnection(keyData);

  return {
    current: {
      env: currentEnv,
      domain: currentDomain ? new URL(currentDomain).host : '',
    },
    keyData,
    dbMatch,
    sysMatch,
    envMatch,
    domainMatch,
    isExpired,
    isPkgLogin,
    isServiceConnection,
    pkgUrl: getNocoBasePkgUrl(),
    plugins,
    pluginsLicensed,
    keyStatus,
    licenseStatus: keyData?.licenseKey?.licenseStatus || 'active',
  };
}
