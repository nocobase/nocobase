/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

const getHeaderValue = (headers: any, headerName: string) => {
  if (!headers) {
    return undefined;
  }

  const source = typeof headers.toJSON === 'function' ? headers.toJSON() : headers;
  const matchedKey = Object.keys(source || {}).find((key) => key.toLowerCase() === headerName.toLowerCase());

  return matchedKey ? source[matchedKey] : undefined;
};

export const hasHeaderValue = (headers: any, headerName: string) => {
  const value = getHeaderValue(headers, headerName);
  return value !== undefined && value !== null && value !== '';
};
