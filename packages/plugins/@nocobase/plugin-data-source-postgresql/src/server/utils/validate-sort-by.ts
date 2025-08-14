/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

export function validateSortBy(sortBy: string) {
  const parts = sortBy.split(',').map((part) => {
    const [field, order = 'ASC'] = part.split(':');
    if (!/^[a-zA-Z0-9_]+$/.test(field)) {
      throw new Error(`Invalid sortBy field: ${field}`);
    }
    if (!['ASC', 'DESC'].includes(order.toUpperCase())) {
      throw new Error(`Invalid sortBy order: ${order}`);
    }
    return `${field} ${order.toUpperCase()}`;
  });
  return parts.join(', ');
}
