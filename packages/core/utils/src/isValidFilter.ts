/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

export function isValidFilter(condition: any) {
  if (!condition) {
    return false;
  }

  const groups = [condition.$and, condition.$or].filter(Boolean);

  if (groups.length == 0) {
    return Object.keys(condition).length > 0;
  }

  return groups.some((item) => {
    if (Array.isArray(item)) {
      return item.some(isValidFilter);
    }

    if (item.$and || item.$or) {
      return isValidFilter(item);
    }

    const [name] = Object.keys(item);
    if (!name || !item[name]) {
      return false;
    }
    const [op] = Object.keys(item[name]);

    if (!op || typeof item[name][op] === 'undefined') {
      return false;
    }

    return true;
  });
}
