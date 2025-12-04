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
import { LICENSE_ERROR } from './interface';
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

export async function getKey(ctx?: Context): Promise<string> {
  const CACHE_KEY = 'license-key';
  if (ctx?.cache) {
    const cacheKey = await ctx.cache.get(CACHE_KEY);
    if (cacheKey) {
      return cacheKey;
    }
  }
  let key: string;
  let keyData: KeyData;
  const keyFile = path.resolve(process.cwd(), 'storage/.license/license-key');
  if (!fs.existsSync(keyFile)) {
    throw new Error('License key not exist, Please configure the License key to enable full functionality.');
  }
  try {
    key = fs.readFileSync(keyFile, 'utf8').trim();
  } catch (e) {
    throw new Error('The license key is invalid. Please check and reconfigure it.');
  }
  try {
    keyData = JSON.parse(keyDecrypt(key));
  } catch (e) {
    throw new Error('The license key parsing failed, Please check and reconfigure it.');
  }
  try {
    const { data } = await request({
      url: `${keyData?.service?.domain || 'https://service-cn.nocobase.com'}/api/license_keys:getKey`,
      method: 'POST',
      body: {
        access_key_id: keyData?.accessKeyId,
        access_key_secret: keyData?.accessKeySecret,
      },
      headers: keyData?.service?.headers || {},
    });
    const { key } = data || {};
    if (key) {
      ctx?.cache?.set(CACHE_KEY, key);
      fs.writeFileSync(keyFile, key);
    }
    logger.info('Successfully retrieved the remote license key');
    return key;
  } catch (e) {
    logger.warn('Unable to retrieve the remote license key');
    return key;
  }
}

export function parseKey(key: string): KeyData {
  try {
    return JSON.parse(keyDecrypt(key));
  } catch (e) {
    throw new Error('The license key parsing failed, Please check and reconfigure it.');
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
