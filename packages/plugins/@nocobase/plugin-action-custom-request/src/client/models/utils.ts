/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { uid } from '@nocobase/utils/client';

type RequestNameValue = {
  name: string;
  value: string;
};

export function makeRequestKey() {
  return `v2-${uid()}`;
}

export function parseJsonString(input: unknown) {
  if (typeof input !== 'string') {
    return input;
  }
  const trimmed = input.trim();
  if (!trimmed) {
    return input;
  }
  try {
    return JSON.parse(trimmed);
  } catch (error) {
    return input;
  }
}

export function normalizeNameValueArray(arr: any): RequestNameValue[] {
  if (!Array.isArray(arr)) {
    return [];
  }
  return arr
    .map((item) => ({
      name: String(item?.name || '').trim(),
      value: typeof item?.value === 'undefined' || item?.value === null ? '' : String(item.value),
    }))
    .filter((item) => !!item.name);
}

export function toStepResultSuccess(response: any) {
  const data = response?.data?.data ?? response?.data;
  return {
    ok: true,
    status: response?.status,
    headers: response?.headers || {},
    data,
  };
}

export function toStepResultError(error: any) {
  const status = error?.response?.status || 500;
  const data = error?.response?.data;
  const message = data?.message || error?.message || 'Request failed';
  return {
    ok: false,
    status,
    headers: error?.response?.headers || {},
    data,
    error: {
      message,
    },
  };
}
