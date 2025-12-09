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
import { isDomainMatch, isEnvMatch, getClientDomain } from './env';
import { testPkgConnection, testPkgLogin, getNocoBasePkgUrl, testServiceConnection } from './pkg';
import { KeyData } from './interface';
import { getPlugins, getPluginsLicenseStatus, PluginData } from './plugin';

export interface LicenseValidateResult {
  current: {
    env: Env;
    domain: string;
  };
  envMatch: boolean;
  domainMatch: boolean;
  isPkgConnection: boolean;
  isPkgLogin: boolean;
  isServiceConnection: boolean;
  isExpired: boolean;
  keyData: KeyData;
  pkgUrl: string;
  licenseStatus: 'active' | 'invalid';
  pluginsLicensed: boolean;
  plugins: PluginData[];
  keyStatus?: 'invalid' | 'notfound';
}

export async function getLicenseValidate({ key, ctx }: { key?: string; ctx?: any }): Promise<LicenseValidateResult> {
  const currentDomain = getClientDomain(ctx);
  const currentEnv = await getEnvAsync();
  let keyStatus;
  let keyData;
  try {
    const keyStr = key || (await getKey(ctx));
    keyData = parseKey(keyStr);
  } catch (e) {
    keyStatus = e?.message;
  }
  const domainMatch = isDomainMatch(currentDomain, keyData);
  const envMatch = isEnvMatch(currentEnv, keyData);
  const isPkgConnection = await testPkgConnection();
  const isPkgLogin = await testPkgLogin(keyData);
  const isServiceConnection = await testServiceConnection(keyData);
  const isExpired = isDateExpired(keyData?.upgradeExpirationDate);
  const plugins = await getPlugins({ keyData, ctx });
  const pluginsLicensed = getPluginsLicenseStatus({ plugins });

  return {
    current: {
      env: currentEnv,
      domain: currentDomain ? new URL(currentDomain).host : '',
    },
    keyData,
    envMatch: envMatch,
    domainMatch: domainMatch,
    isPkgConnection,
    isPkgLogin,
    isServiceConnection,
    isExpired,
    pkgUrl: getNocoBasePkgUrl(),
    licenseStatus: keyData?.licenseKey?.licenseStatus as any,
    plugins,
    pluginsLicensed,
    keyStatus,
  };
}
