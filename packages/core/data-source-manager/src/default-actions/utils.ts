/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { normalizePageArgs } from '@nocobase/actions';

export function pageArgsToLimitArgs(
  page: number,
  pageSize: number,
): {
  offset: number;
  limit: number;
} {
  const { page: safePage, pageSize: safePageSize } = normalizePageArgs(page, pageSize);

  return {
    offset: (safePage - 1) * safePageSize,
    limit: safePageSize,
  };
}
