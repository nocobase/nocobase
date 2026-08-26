/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { AdminLayoutModel, getAdminLayoutModel } from '@nocobase/client-v2';
import { AdminShellProvider } from './AdminShellProvider';
import { AdminLayoutComponent } from './AdminLayoutComponentV1';
import { type NocoBaseDesktopRoute } from './route-types';
import {
  type AdminLayoutMenuRouteOptions,
  getAdminLayoutMenuInitializerButton,
  reconcileAdminLayoutMenuItems,
} from './AdminLayoutMenuUtils';

/**
 * 兼容旧 route-switch 入口的 Admin Layout 渲染包装类。
 *
 * 该类仅保留 v1 入口所需的 render 能力，
 * 运行时状态和生命周期全部复用 flow 侧基类。
 *
 * @example
 * ```typescript
 * const model = flowEngine.getModel<AdminLayoutModelV1>('admin-layout-model');
 * return model?.render();
 * ```
 */
export class AdminLayoutModelV1 extends AdminLayoutModel {
  syncMenuRoutes(routes: NocoBaseDesktopRoute[]) {
    reconcileAdminLayoutMenuItems(this as any, Array.isArray(routes) ? routes : []);
  }

  toProLayoutRoute(options: Omit<AdminLayoutMenuRouteOptions, 'depth'>) {
    const result =
      ((this.subModels.menuItems || []) as any[])
        .map((item) =>
          item.toProLayoutRoute({
            ...options,
            depth: 0,
          }),
        )
        .filter(Boolean) || [];

    if (options.designable) {
      options.isMobile
        ? result.push(getAdminLayoutMenuInitializerButton('schema-initializer-Menu-header', this as any))
        : result.unshift(getAdminLayoutMenuInitializerButton('schema-initializer-Menu-header', this as any));
    }

    return {
      path: '/',
      children: result,
    };
  }

  render() {
    return (
      <AdminShellProvider>
        <AdminLayoutComponent {...this.props} />
      </AdminShellProvider>
    );
  }
}

export { getAdminLayoutModel };
