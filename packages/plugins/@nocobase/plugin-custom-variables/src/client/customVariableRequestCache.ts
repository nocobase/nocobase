/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

const customVariableRequestCache = {
  configs: new Map<string, Promise<any>>(),
  parses: new Map<string, Promise<any>>(),
};

export function clearCustomVariableRequestCache() {
  customVariableRequestCache.configs.clear();
  customVariableRequestCache.parses.clear();
}

export function getCustomVariableConfig(api, name: string) {
  const cached = customVariableRequestCache.configs.get(name);
  if (cached) {
    return cached;
  }

  const request = api
    .request({
      url: `customVariables:get?filter[name]=${name}`,
      method: 'GET',
    })
    .then((response) => {
      if (!response?.data?.data) {
        throw new Error(`Custom variable "${name}" not found. It may have been deleted.`);
      }
      return response.data.data;
    })
    .catch((error) => {
      customVariableRequestCache.configs.delete(name);
      throw error;
    });

  customVariableRequestCache.configs.set(name, request);
  return request;
}

export function parseCustomVariable(api, name: string, filterCtx: Record<string, any>) {
  const cacheKey = JSON.stringify([name, filterCtx || {}]);
  const cached = customVariableRequestCache.parses.get(cacheKey);
  if (cached) {
    return cached;
  }

  const request = api
    .request({
      url: `customVariables:parse?name=${name}`,
      method: 'POST',
      data: { filterCtx },
    })
    .then(({ data }) => data?.data)
    .catch((error) => {
      customVariableRequestCache.parses.delete(cacheKey);
      throw error;
    });

  customVariableRequestCache.parses.set(cacheKey, request);
  return request;
}
