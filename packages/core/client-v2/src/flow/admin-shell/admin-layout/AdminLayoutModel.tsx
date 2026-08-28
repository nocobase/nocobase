/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { define, observable } from '@formily/reactive';
import { type FlowEngine, FlowModel } from '@nocobase/flow-engine';
import React from 'react';
import type { NocoBaseDesktopRoute } from '../../../flow-compat';
import { AdminLayoutRouteCoordinator } from '../AdminLayoutRouteCoordinator';
import {
  BaseLayoutModel,
  getLayoutModel,
  type BaseLayoutStructure,
  type GetLayoutModelOptions,
} from '../BaseLayoutModel';
import { ADMIN_LAYOUT_MODEL_UID } from './constants';
import { type AdminLayoutMenuItemModel } from './AdminLayoutMenuModels';
import {
  getAdminLayoutMenuInitializerButton,
  reconcileAdminLayoutMenuItems,
  type AdminLayoutMenuRouteOptions,
} from './AdminLayoutMenuUtils';
import { AdminLayoutComponent } from './AdminLayoutComponent';
import { TopbarActionModel } from '../../models/topbar/TopbarActionModel';
import { TopbarActionsBar } from './TopbarActionsBar';
import { AdminLayoutEntryGuard } from './AdminLayoutEntryGuard';

export type AdminLayoutStructure = BaseLayoutStructure & {
  subModels: {
    menuItems?: AdminLayoutMenuItemModel[];
  };
};

type GetAdminLayoutModelOptions<TModel extends FlowModel = AdminLayoutModel> = GetLayoutModelOptions<TModel>;

/**
 * Admin Layout 的纯运行时 host model。
 *
 * 该模型只负责菜单树、页面路由桥接和上下文注入，
 * 不负责任何 React 渲染。
 *
 * @example
 * ```typescript
 * const model = getAdminLayoutModel(flowEngine, { required: true });
 * model.syncMenuRoutes(routes);
 * ```
 */
export class AdminLayoutModel extends BaseLayoutModel<AdminLayoutStructure> {
  menuRouteRefreshVersion = 0;

  constructor(options: any) {
    super(options);
    define(this, {
      menuRouteRefreshVersion: observable.ref,
    });
  }

  /**
   * 通知 Layout 重新生成 ProLayout 菜单路由。
   *
   * @returns {void}
   */
  refreshMenuRouteTree() {
    this.menuRouteRefreshVersion += 1;
  }

  /**
   * 使用当前可访问菜单路由刷新 Layout 菜单树。
   *
   * @param {NocoBaseDesktopRoute[]} routes 当前用户可访问的桌面路由
   * @returns {void}
   */
  syncMenuRoutes(routes: NocoBaseDesktopRoute[]) {
    reconcileAdminLayoutMenuItems(this, Array.isArray(routes) ? routes : []);
  }

  /**
   * 将菜单模型转换为 ProLayout 路由树。
   *
   * @param {Omit<AdminLayoutMenuRouteOptions, 'depth'>} options 路由转换参数
   * @returns {{ path: string; children: any[] }} ProLayout 路由树
   */
  toProLayoutRoute(options: Omit<AdminLayoutMenuRouteOptions, 'depth'>) {
    const result =
      (this.subModels.menuItems || [])
        .map((item) =>
          item.toProLayoutRoute({
            ...options,
            depth: 0,
          }),
        )
        .filter(Boolean) || [];

    if (options.designable) {
      options.isMobile
        ? result.push(getAdminLayoutMenuInitializerButton('schema-initializer-Menu-header', this))
        : result.unshift(getAdminLayoutMenuInitializerButton('schema-initializer-Menu-header', this));
    }

    return {
      path: '/',
      children: result,
    };
  }

  protected createRouteCoordinator() {
    return new AdminLayoutRouteCoordinator(this.flowEngine, this.getRouteCoordinatorOptions());
  }

  render() {
    return (
      <AdminLayoutEntryGuard model={this}>
        <AdminLayoutComponent {...this.props} model={this} />
      </AdminLayoutEntryGuard>
    );
  }
}

AdminLayoutModel.registerFlow({
  key: 'topbarAction',
  steps: {
    step1: {
      handler: async (ctx, params) => {
        const topbarActionModels = await ctx.engine.getSubclassesOfAsync('TopbarActionModel');
        const actions = [...topbarActionModels.keys()].map<TopbarActionModel>((name) => {
          const action = ctx.engine.createModel<TopbarActionModel>({
            use: name,
            uid: `topbar-action-${name}`,
          });
          action.setParent(ctx.model);
          return action;
        });
        ctx.model.props.actionsRender = (props) => {
          return [<TopbarActionsBar key="topbar-actions" actions={actions} isMobile={props?.isMobile} />];
        };
      },
    },
  },
});

/**
 * 获取或创建 admin-layout host model。
 *
 * @param {FlowEngine} flowEngine FlowEngine 实例
 * @param {GetAdminLayoutModelOptions<TModel>} options 获取选项
 * @returns {TModel | undefined} 命中的 admin-layout model
 * @throws {Error} 当 required 为 true 且模型不存在时抛错
 */
export function getAdminLayoutModel<TModel extends FlowModel = AdminLayoutModel>(
  flowEngine: FlowEngine,
  options: GetAdminLayoutModelOptions<TModel> = {},
) {
  const model = getLayoutModel<TModel>(flowEngine, ADMIN_LAYOUT_MODEL_UID, {
    ...options,
    use: (options.use || AdminLayoutModel) as any,
  });

  if (!model && options.required) {
    throw new Error('[NocoBase] FlowRoute requires admin-layout-model. Please render FlowRoute under AdminLayout.');
  }

  return model;
}
