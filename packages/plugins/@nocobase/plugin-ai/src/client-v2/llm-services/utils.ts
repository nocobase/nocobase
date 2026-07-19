/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

export type LLMServiceOptions = Record<string, unknown>;

export const normalizeLLMServiceOptions = <T extends LLMServiceOptions | null | undefined>(options: T): T => {
  if (!options || Array.isArray(options)) {
    return options;
  }

  const nextOptions: LLMServiceOptions = { ...options };
  const baseURL = nextOptions.baseURL;
  if (typeof baseURL === 'string') {
    if (baseURL.trim() === '') {
      delete nextOptions.baseURL;
    } else {
      nextOptions.baseURL = baseURL.trim();
    }
  }

  return nextOptions as T;
};

export const normalizeLLMServiceFormValues = <T extends { options?: LLMServiceOptions | null }>(values: T): T => {
  if (!values.options || Array.isArray(values.options)) {
    return values;
  }

  return {
    ...values,
    options: normalizeLLMServiceOptions(values.options),
  };
};
