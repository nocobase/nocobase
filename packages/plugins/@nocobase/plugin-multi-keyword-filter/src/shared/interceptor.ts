/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { InternalAxiosRequestConfig } from 'axios';
import qs from 'qs';

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

export const interceptor = (config: InternalAxiosRequestConfig<unknown>): InternalAxiosRequestConfig<unknown> => {
  const url = config.url || '';
  const [, queryString] = url.split('?');

  const query = qs.stringify(config.params, {
    strictNullHandling: true,
    arrayFormat: 'brackets',
  });

  if ((url + query).length <= 2000) {
    return config;
  }

  if (queryString) {
    const queryParams = qs.parse(queryString, {
      strictNullHandling: true,
    });
    config.params = { ...queryParams, ...config.params };
  }

  const data = isRecord(config.data) ? config.data : {};
  config.data = { ...data, __params__: config.params, __method__: config.method };
  config.params = {};
  config.method = 'post';

  return config;
};
