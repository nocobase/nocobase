/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

export const normalizeExportFieldValue = (value) => {
  if (!Array.isArray(value) || !value.length) {
    return null;
  }

  return value.map((item) => item?.name ?? item);
};

export const createExportFieldsOptionsSnapshot = (optionsCache) => {
  return [...optionsCache.getRootOptions()];
};
