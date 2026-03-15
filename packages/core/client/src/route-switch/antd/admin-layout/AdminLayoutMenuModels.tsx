/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { FlowModel } from '@nocobase/flow-engine';
import { NocoBaseDesktopRoute, NocoBaseDesktopRouteType } from '../../../admin-shell/route-types';

type AdminLayoutMenuItemStructure = {
  subModels: {
    items?: AdminLayoutMenuItemModel[];
  };
};

type AdminLayoutMenuTreeStructure = {
  subModels: {
    items?: AdminLayoutMenuItemModel[];
  };
};

/**
 * 生成菜单子模型的稳定 uid。
 *
 * 这里优先使用 route 自身的稳定标识，避免菜单重算时重复创建 model；
 * 同时把父级 uid 编进去，保证同一个 route 被移动到不同分组时仍然能正确重建。
 *
 * @param {string} parentUid 父模型 uid
 * @param {NocoBaseDesktopRoute} route 当前菜单路由
 * @param {number} index 当前层级中的索引
 * @returns {string} 子模型 uid
 */
function getAdminLayoutMenuItemUid(parentUid: string, route: NocoBaseDesktopRoute, index: number) {
  const identity =
    route.id ??
    route.schemaUid ??
    route.menuSchemaUid ??
    route.pageSchemaUid ??
    route.title ??
    `${route.type}-${index}`;

  return `${parentUid}-menu-item-${route.type || 'unknown'}-${identity}`;
}

/**
 * 同步某一层菜单的子模型集合。
 *
 * 它会复用还存在的菜单项模型，并同步删除已经失效的分支，
 * 这样可以让 Layout 菜单逐步切换到 FlowModel 树，同时不引入额外的 UI 行为变化。
 *
 * @param {FlowModel & { subModels: { items?: AdminLayoutMenuItemModel[] } }} parent 父模型
 * @param {NocoBaseDesktopRoute[]} routes 当前层菜单路由列表
 * @param {NocoBaseDesktopRoute | undefined} parentRoute 父级路由
 */
function reconcileMenuItems(
  parent: FlowModel & { subModels: { items?: AdminLayoutMenuItemModel[] } },
  routes: NocoBaseDesktopRoute[],
  parentRoute?: NocoBaseDesktopRoute,
) {
  const existingItems = [...(parent.subModels.items || [])];
  const existingItemMap = new Map(existingItems.map((item) => [item.uid, item]));
  const nextItems: AdminLayoutMenuItemModel[] = [];
  const nextUidSet = new Set<string>();

  routes.forEach((route, index) => {
    const uid = getAdminLayoutMenuItemUid(parent.uid, route, index);
    let itemModel = existingItemMap.get(uid);

    if (!itemModel) {
      itemModel = parent.addSubModel('items', {
        uid,
        use: AdminLayoutMenuItemModel,
        props: {
          route,
          parentRoute,
        },
      }) as AdminLayoutMenuItemModel;
    }

    itemModel.sortIndex = index + 1;
    itemModel.syncFromRoute(route, parentRoute);
    nextItems.push(itemModel);
    nextUidSet.add(uid);
  });

  existingItems.forEach((item) => {
    if (!nextUidSet.has(item.uid)) {
      parent.flowEngine.removeModelWithSubModels(item.uid);
    }
  });

  parent.subModels.items = nextItems;
}

/**
 * 单个菜单节点模型。
 *
 * 它只维护菜单树结构和原始 route 元数据，不直接参与具体 UI 渲染；
 * ProLayout 所需的数据会由适配层根据这些子模型再转换一次。
 *
 * @example
 * ```typescript
 * const firstItem = menuTree.subModels.items?.[0];
 * ```
 */
export class AdminLayoutMenuItemModel extends FlowModel<AdminLayoutMenuItemStructure> {
  onInit(options) {
    super.onInit(options);
    this.syncFromRoute(
      this.props.route as NocoBaseDesktopRoute,
      this.props.parentRoute as NocoBaseDesktopRoute | undefined,
    );
  }

  /**
   * 使用最新 route 更新当前菜单节点及其子树。
   *
   * @param {NocoBaseDesktopRoute} route 当前菜单节点的 route
   * @param {NocoBaseDesktopRoute} [parentRoute] 父级 route
   */
  syncFromRoute(route: NocoBaseDesktopRoute, parentRoute?: NocoBaseDesktopRoute) {
    this.setProps({
      route,
      parentRoute,
    });

    if (route?.type === NocoBaseDesktopRouteType.group) {
      reconcileMenuItems(this, Array.isArray(route.children) ? route.children : [], route);
      return;
    }

    (this.subModels.items || []).forEach((item) => {
      this.flowEngine.removeModelWithSubModels(item.uid);
    });
    delete this.subModels.items;
  }

  render() {
    return null;
  }
}

/**
 * Layout 菜单树根模型。
 *
 * 当前阶段先把菜单路由同步为一棵独立的 FlowModel 树，
 * 让 Layout 的菜单状态不再依赖 `convertRoutesToLayout()` 这种一次性函数结果。
 *
 * @example
 * ```typescript
 * menuTree.syncRoutes(routes);
 * ```
 */
export class AdminLayoutMenuTreeModel extends FlowModel<AdminLayoutMenuTreeStructure> {
  /**
   * 使用最新的桌面端 route 列表重建菜单树。
   *
   * @param {NocoBaseDesktopRoute[]} routes 当前用户可访问的桌面菜单路由
   */
  syncRoutes(routes: NocoBaseDesktopRoute[]) {
    reconcileMenuItems(this, Array.isArray(routes) ? routes : []);
  }

  render() {
    return null;
  }
}
