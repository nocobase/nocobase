/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

type UpdateRoute = (filterByTk: any, values: Record<string, any>, refreshAfterUpdate?: boolean) => Promise<any>;

export const normalizeRouteIds = (selectedRowKeys: any): any[] => {
  if (Array.isArray(selectedRowKeys)) {
    return selectedRowKeys;
  }

  if (selectedRowKeys && typeof selectedRowKeys === 'object') {
    if (Array.isArray(selectedRowKeys.checked)) {
      return selectedRowKeys.checked;
    }
    if (Array.isArray(selectedRowKeys.selectedRowKeys)) {
      return selectedRowKeys.selectedRowKeys;
    }
  }

  return [selectedRowKeys];
};

/**
 * 批量更新路由：
 * - selectedRowKeys 在表格批量操作里通常是数组；
 * - tree 勾选时 selectedRowKeys 可能是 { checked, halfChecked }；
 * - desktopRoutes:update 的 filterByTk 只能是单个主键，不能直接传数组。
 */
export const updateRoutesInBatch = async (
  selectedRowKeys: any,
  values: Record<string, any>,
  updateRoute: UpdateRoute,
) => {
  const routeIds = normalizeRouteIds(selectedRowKeys);
  const validRouteIds = routeIds.filter((id) => id !== undefined && id !== null && id !== '');

  for (const routeId of validRouteIds) {
    await updateRoute(routeId, values, false);
  }
};
