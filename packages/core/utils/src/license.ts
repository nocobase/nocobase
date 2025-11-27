/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { keyDecrypt, getEnvAsync, Env } from '@nocobase/license-kit';
import { Context } from 'koa';
import omit from 'lodash/omit';
import path from 'path';
import fs from 'fs';
import * as http from 'http';
import * as https from 'https';
import axios from 'axios';

export const enum LICENSE_ERROR {
  KEY_FORMAT_ERROR = 'KEY_FORMAT_ERROR',
  KEY_NOT_FOUND = 'KEY_NOT_FOUND',
  KEY_READ_ERROR = 'KEY_READ_ERROR',
}

interface KeyData {
  upgradeExpirationDate: string;
  licensedEdition: string;
  licenseKey: {
    id: string;
    licensee: string;
    desc: string;
    type: string;
    domain: string;
    licenseStatus: string;
  };
  plugins: Array<{
    displayName: string;
    packageName: string;
    updateExpirationDate?: string;
  }>;
  instanceData: {
    timestamp: string;
    sys: string;
    osVer: string;
    kVer: string;
    hostname: string;
    mac: string;
    db: {
      type: string;
      name: string;
      oid: number;
      ver: string;
      id?: string;
    };
    container: {
      name: string;
      id: string;
    };
  };
  service: {
    domain: string;
    [key: string]: any;
  };
  accessKeyId: string;
  accessKeySecret: string;
  timestamp: number;
}

export function getClientDomain(ctx: any) {
  // const proto = ctx.headers['x-forwarded-proto']?.split(',')[0] || ctx.protocol;
  // const host = ctx.headers['x-forwarded-host']?.split(',')[0] || ctx.host;

  // let origin = `${proto}://${host}`;

  // // 如果 referer 存在，并且域名与 host 相同，可作为辅助
  // const referer = ctx.get('referer');
  // if (referer) {
  //   try {
  //     const url = new URL(referer);
  //     if (url.host === host) {
  //       origin = url.origin;
  //     }
  //   } catch {
  //     //
  //   }
  // }
  // return origin;

  if (!ctx.get) {
    return '';
  }
  let fullHost = `${ctx?.protocol}://${ctx?.request?.host || ctx?.host}`; // 默认完整地址

  const referer = ctx?.get?.('referer');
  if (referer) {
    try {
      const url = new URL(referer);
      fullHost = url.origin;
    } catch (err) {
      console.error('Invalid Referer URL:', err);
    }
  }
  return fullHost;
}

function isDomainMatch(currentDomain: string, keyData: KeyData) {
  function domainMatch(licenseDomain: string, currentDomain: string) {
    // 非泛域名匹配
    const url = new URL(currentDomain);
    const domain = url.hostname + (url.port ? `:${url.port}` : '');
    if (licenseDomain.indexOf('*') === -1) {
      return domain === licenseDomain;
    }
    // 泛域名
    const licenseBaseDomain = licenseDomain.replace('*', '');
    return domain.endsWith(licenseBaseDomain);
  }

  const licenseDomain = keyData?.licenseKey?.domain;
  if (!licenseDomain || !currentDomain) {
    return false;
  }
  if (licenseDomain.includes(',')) {
    return licenseDomain
      .replace(/\s/g, '')
      .split(',')
      .some((domain) => domainMatch(domain, currentDomain));
  }
  return domainMatch(licenseDomain, currentDomain);
}

function getKeyData(key?: string) {
  if (!key) {
    const keyFile = path.resolve(process.cwd(), 'storage/.license/license-key');
    if (!fs.existsSync(keyFile)) {
      throw new Error(LICENSE_ERROR.KEY_NOT_FOUND);
    }
    try {
      key = fs.readFileSync(keyFile, 'utf8').trim();
    } catch (e) {
      throw new Error(LICENSE_ERROR.KEY_READ_ERROR);
    }
  }

  let keyData: KeyData;
  try {
    keyData = JSON.parse(keyDecrypt(key));
  } catch (e) {
    throw new Error(LICENSE_ERROR.KEY_FORMAT_ERROR);
  }
  return keyData;
}

async function testDomain(url: string) {
  return new Promise((resolve) => {
    // 自动选择 http 或 https
    const client = url.startsWith('https') ? https : http;

    const req = client.get(url, (res) => {
      resolve({
        reachable: true,
        statusCode: res.statusCode,
      });
      req.end();
    });

    req.on('error', (err: any) => {
      resolve({
        reachable: false,
        error: err.message,
      });
    });

    req.setTimeout(5000, () => {
      req.destroy();
      resolve({
        reachable: false,
        error: 'Timeout',
      });
    });
  });
}
function getNocoBasePkgUrl() {
  return process.env?.NOCOBASE_PKG_URL || 'https://pkg.nocobase.com/';
}

export function isEnvMatch(env: Env, keyData: KeyData) {
  const idMatchId = env?.db?.id && keyData?.instanceData?.db?.id;
  const getMatchStr = (envData: Env) => {
    const data: any = {
      sys: envData?.sys,
      osVer: envData?.osVer,
      db: idMatchId ? { id: envData?.db?.id } : omit(envData?.db, ['id']),
    };
    return JSON.stringify(data);
  };
  return getMatchStr(env) === getMatchStr(keyData?.instanceData);
}

export async function testPkgConnection() {
  const res: any = await testDomain(getNocoBasePkgUrl());
  return res.reachable;
}

export async function testPkgLogin(key: string) {
  try {
    const NOCOBASE_PKG_URL = getNocoBasePkgUrl();
    const keyData = getKeyData(key);
    const { accessKeyId, accessKeySecret } = keyData;
    const credentials = { username: accessKeyId, password: accessKeySecret };
    const res1 = await axios.post(`${NOCOBASE_PKG_URL}-/verdaccio/sec/login`, credentials, {
      responseType: 'json',
    });
    this.token = res1.data.token;
  } catch (error) {
    // console.error(error);
    return false;
  }
  return true;
}

export interface LicenseValidateResult {
  current: {
    env: Env;
    domain: string;
  };
  envMatch: boolean;
  domainMatch: boolean;
  isPkgConnection: boolean;
  isPkgLogin: boolean;
}

export async function getLicenseValidate({ key, ctx }: { key: string; ctx: any }): Promise<LicenseValidateResult> {
  const currentDomain = getClientDomain(ctx);
  const currentEnv = await getEnvAsync();
  const keyData = getKeyData(key);
  console.log('currentDomain', currentDomain);
  console.log('currentEnv', currentEnv);
  // console.log('keyData', keyData);
  const domainMatch = isDomainMatch(currentDomain, keyData);
  const envMatch = isEnvMatch(currentEnv, keyData);
  const isPkgConnection = await testPkgConnection();
  const isPkgLogin = await testPkgLogin(key);
  return {
    current: {
      env: currentEnv,
      domain: currentDomain,
    },
    envMatch: envMatch,
    domainMatch: domainMatch,
    isPkgConnection,
    isPkgLogin,
  };
}
