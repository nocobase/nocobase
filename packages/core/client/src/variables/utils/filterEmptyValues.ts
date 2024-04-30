/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

export const filterEmptyValues = (value: any) => {
  if (!Array.isArray(value)) {
    return value;
  }

  return value.filter((item) => {
    return item === 0 || item === false || item;
  });
};
