/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import qs from 'qs';

export const interceptor = (config) => {
  const url = config.url;
  const [, queryString] = url.split('?');

  const query = qs.stringify(config.params, {
    strictNullHandling: true,
    arrayFormat: 'brackets',
  });

  if ((config.url + query).length <= 2000) {
    return config;
  }

  // If URL contains query string, parse it and merge with params
  if (queryString) {
    const queryParams = qs.parse(queryString, {
      strictNullHandling: true,
    });
    config.params = { ...queryParams, ...config.params };
  }

  config.data = { ...config.data, __params__: config.params, __method__: config.method };
  config.params = {};
  config.method = 'post';

  return config;
};
