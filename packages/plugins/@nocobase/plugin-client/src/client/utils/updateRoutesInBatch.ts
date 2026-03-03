/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

type UpdateRoute = (filterByTk: any, values: Record<string, any>, refreshAfterUpdate?: boolean) => Promise<any>;

/**
 * 批量更新路由：
 * - selectedRowKeys 在表格批量操作里通常是数组；
 * - desktopRoutes:update 的 filterByTk 只能是单个主键，不能直接传数组。
 */
export const updateRoutesInBatch = async (
  selectedRowKeys: any,
  values: Record<string, any>,
  updateRoute: UpdateRoute,
) => {
  const routeIds = Array.isArray(selectedRowKeys) ? selectedRowKeys : [selectedRowKeys];
  const validRouteIds = routeIds.filter((id) => id !== undefined && id !== null && id !== '');

  for (const routeId of validRouteIds) {
    await updateRoute(routeId, values, false);
  }
};
