/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

function sortRouteChildren(routes) {
  return [...(Array.isArray(routes) ? routes : [routes].filter(Boolean))].sort(
    (left, right) => Number(left?.sort || 0) - Number(right?.sort || 0),
  );
}

function deriveRouteBackedTabs(input) {
  const children = sortRouteChildren(input.pageRoute?.children);
  if (children.length) {
    return children;
  }
  if (input.tabs != null) {
    return sortRouteChildren(input.tabs);
  }
  const routesFromTabTrees = (Array.isArray(input.tabTrees) ? input.tabTrees : [])
    .map((item) => item?.route)
    .filter(Boolean);
  return routesFromTabTrees.length ? sortRouteChildren(routesFromTabTrees) : undefined;
}

function deriveRouteBackedTabTrees(input) {
  const tabNodes = Array.isArray(input.tree?.subModels?.tabs) ? input.tree.subModels.tabs : [];
  if (!tabNodes.length) {
    return Array.isArray(input.tabTrees) ? input.tabTrees : undefined;
  }
  const tabRoutes = Array.isArray(input.tabs) ? input.tabs : [];
  return tabNodes.map((tabTree, index) => {
    const item = {
      tree: tabTree,
    };
    if (tabRoutes[index]) {
      item.route = tabRoutes[index];
    }
    return item;
  });
}

module.exports = {
  deriveRouteBackedTabs,
  deriveRouteBackedTabTrees,
  sortRouteChildren,
};
