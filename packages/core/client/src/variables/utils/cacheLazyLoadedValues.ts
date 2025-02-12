/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

const cache = new Map<Record<string, any>, any>();

export const cacheLazyLoadedValues = (variableCtx: Record<string, any>, variablePath: string, value: any) => {
  const cachedValue = cache.get(variableCtx);

  if (cachedValue) {
    cachedValue[variablePath] = value;
  } else {
    cache.set(variableCtx, { [variablePath]: value });
  }
};

export const getCachedLazyLoadedValues = (variableCtx: Record<string, any>, variablePath: string) => {
  const cachedValue = cache.get(variableCtx);
  return cachedValue?.[variablePath];
};
