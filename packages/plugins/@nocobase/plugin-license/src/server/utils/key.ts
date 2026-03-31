/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { keyDecrypt } from '@nocobase/license-kit';
import { Context } from 'koa';
import path from 'path';
import fs from 'fs';
import { KeyData } from './interface';
import { CACHE_KEY } from './interface';
import axios from 'axios';
import { logger } from '@nocobase/logger';

export async function request(
  {
    url,
    method = 'GET',
    body,
    headers,
    timeout = 5000,
  }: {
    url: string;
    method?: string;
    body?: Record<string, any>;
    headers?: any;
    timeout?: number;
  },
  ctx?: Context,
) {
  const xHeaders = {
    'Content-Type': 'application/json',
    'X-Hostname': new URL(url).hostname,
    'X-Timezone': ctx?.request?.headers?.['x-timezone'],
    'X-Locale': ctx?.request?.headers?.['x-locale'],
    'X-Role': ctx?.request?.headers?.['x-role'],
    'X-Authenticator': ctx?.request?.headers?.['x-authenticator'],
  };

  try {
    const res = await axios({
      url,
      method,
      timeout,
      headers: {
        ...xHeaders,
        ...headers,
      },
      data: body || {},
    });

    return res.data;
  } catch (err: any) {
    if (err.code === 'ECONNABORTED') {
      throw new Error(`Request timeout after ${timeout}ms`);
    }
    throw err;
  }
}

export async function saveLicenseKey(licenseKey: string, ctx?: any) {
  const dir = path.resolve(process.cwd(), 'storage/.license');
  const filePath = path.resolve(dir, 'license-key');
  await fs.promises.writeFile(filePath, licenseKey);

  if (ctx && ctx.cache) {
    await ctx.cache.del(CACHE_KEY);
    await ctx.cache.set(CACHE_KEY, licenseKey, 30 * 24 * 60 * 60 * 1000); // cache for 30 day
  }
}

export async function getLocalKeyData() {
  const keyFile = path.resolve(process.cwd(), 'storage/.license/license-key');
  try {
    const key = (await fs.promises.readFile(keyFile, 'utf8')).trim();
    return JSON.parse(keyDecrypt(key));
  } catch (e) {
    return null;
  }
}

export async function getKey(ctx?: Context): Promise<string> {
  let key: string | undefined;
  const keyFile = path.resolve(process.cwd(), 'storage/.license/license-key');

  if (ctx?.cache) {
    try {
      key = await ctx.cache.get(CACHE_KEY);
      if (key) {
        return key;
      }
    } catch (e) {
      logger.warn('Failed to get license key from cache', e);
    }
  }

  if (!key) {
    try {
      key = (await fs.promises.readFile(keyFile, 'utf8')).trim();
    } catch (e) {
      logger.error('Failed to read license key file', e);
      throw new Error('notfound');
    }
  }

  if (!key) {
    logger.error('License key not found');
    throw new Error('notfound');
  }

  let keyData: KeyData;
  try {
    keyData = JSON.parse(keyDecrypt(key));
  } catch (e) {
    logger.error('Failed to parse license key');
    throw new Error('invalid');
  }

  try {
    const { data } = await request({
      url: `${keyData?.service?.domain}/api/license_keys:getKey`,
      method: 'POST',
      body: {
        access_key_id: keyData?.accessKeyId,
        access_key_secret: keyData?.accessKeySecret,
      },
      headers: keyData?.service?.headers || {},
    });
    const { key: remoteKey } = data || {};
    if (remoteKey && typeof remoteKey === 'string') {
      await saveLicenseKey(remoteKey, ctx);
      return remoteKey;
    }
  } catch (e) {
    // logger.warn('Unable to retrieve the remote license key', e?.message ? { message: e?.message } : e);
    return key;
  }

  return key;
}

export async function getLicenseStatus(keyData: KeyData): Promise<'active' | 'invalid'> {
  if (!keyData) {
    return 'invalid';
  }
  if (keyData?.licenseKey?.licenseStatus === 'invalid') {
    return 'invalid';
  }
  try {
    const { data } = await request({
      url: `${keyData?.service?.domain}/api/license_keys:getKeyStatus`,
      method: 'POST',
      body: {
        access_key_id: keyData?.accessKeyId,
        access_key_secret: keyData?.accessKeySecret,
      },
      headers: keyData?.service?.headers || {},
    });
    if (data?.status === 'active') {
      return 'active';
    } else {
      return 'invalid';
    }
  } catch (e) {
    return 'active';
  }
}

export function parseKey(key: string): KeyData {
  try {
    return JSON.parse(keyDecrypt(key));
  } catch (e) {
    throw new Error('invalid');
  }
}

export async function getKeyInfo(ctx?: Context): Promise<KeyData> {
  const key = await getKey(ctx);
  return parseKey(key);
}

export function isDateExpired(upgradeExpirationDate: string): boolean {
  if (!upgradeExpirationDate) {
    return true;
  }
  return new Date() > new Date(upgradeExpirationDate);
}
