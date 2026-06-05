/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

export type RouteBadgeCount = number | string | null | undefined;

export const isZeroRouteBadgeCount = (count: RouteBadgeCount) => {
  return count === 0 || count === '0';
};

export const shouldDisplayRouteBadge = (count: RouteBadgeCount, showZero?: boolean) => {
  return count != null && (!isZeroRouteBadgeCount(count) || !!showZero);
};
