/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { reaction } from '@formily/reactive';
import { FlowModel } from '@nocobase/flow-engine';
import { AdminShellProvider } from '../../../admin-shell';
import { NocoBaseDesktopRoute } from '../../../admin-shell/route-types';
import { AdminLayoutRouteCoordinator, type RoutePageMeta } from '../../../flow/admin-shell/AdminLayoutRouteCoordinator';
import { AdminLayoutShell } from './AdminLayoutShell';
import React from 'react';
import {
  AdminLayoutMenuItemModel,
  type AdminLayoutMenuRouteOptions,
  getAdminLayoutMenuInitializerButton,
  reconcileAdminLayoutMenuItems,
} from './AdminLayoutMenuModels';

type AdminLayoutStructure = {
  subModels: {
    menuItems?: AdminLayoutMenuItemModel[];
  };
};

/**
 * Admin Layout 的根模型。
 *
 * 当前阶段先让它稳定托管 Layout 的核心运行时和菜单树，
 * 让页面主体直接由 shell 渲染，避免为纯渲染容器额外挂一层 slot model。
 *
 * @example
 * ```typescript
 * const model = flowEngine.getModel<AdminLayoutModel>('admin-layout-model');
 * model?.subModels.menuItems;
 * ```
 */
export class AdminLayoutModel extends FlowModel<AdminLayoutStructure> {
  private routeCoordinator?: AdminLayoutRouteCoordinator;
  private routeDisposer?: () => void;
  private activePageUid = '';
  private layoutContentElement: HTMLElement | null = null;
  private readonly routePageMetaMap = new Map<string, RoutePageMeta>();

  private getCurrentRouteByPageUid(pageUid: string) {
    return this.flowEngine.context.routeRepository?.getRouteBySchemaUid?.(pageUid) || {};
  }

  private getCoordinator() {
    if (!this.routeCoordinator) {
      this.routeCoordinator = new AdminLayoutRouteCoordinator(this.flowEngine);
    }
    return this.routeCoordinator;
  }

  private getCurrentRouteByActivePage() {
    return this.getCurrentRouteByPageUid(this.activePageUid);
  }

  registerRoutePage(pageUid: string, meta: RoutePageMeta) {
    this.routePageMetaMap.set(pageUid, meta);
    return this.getCoordinator().registerPage(pageUid, meta);
  }

  updateRoutePage(pageUid: string, meta: Partial<RoutePageMeta>) {
    const prev = this.routePageMetaMap.get(pageUid) || { active: false };
    const next = {
      ...prev,
      ...meta,
      active: typeof meta.active === 'boolean' ? meta.active : prev.active,
    };
    this.routePageMetaMap.set(pageUid, next);
    this.getCoordinator().syncPageMeta(pageUid, next);
  }

  unregisterRoutePage(pageUid: string) {
    this.routePageMetaMap.delete(pageUid);
    if (this.activePageUid === pageUid) {
      this.activePageUid = '';
    }
    this.getCoordinator().unregisterPage(pageUid);
  }

  /**
   * 使用当前可访问菜单路由刷新 Layout 菜单树。
   *
   * @param {NocoBaseDesktopRoute[]} routes 当前用户可访问的桌面路由
   */
  syncMenuRoutes(routes: NocoBaseDesktopRoute[]) {
    reconcileAdminLayoutMenuItems(this, Array.isArray(routes) ? routes : []);
  }

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

  setLayoutContentElement(element: HTMLElement | null) {
    this.layoutContentElement = element;
    this.getCoordinator().setLayoutContentElement(element);
  }

  protected onMount(): void {
    super.onMount();
    if (!this.routeDisposer) {
      this.flowEngine.context.defineProperty('currentRoute', {
        get: () => this.getCurrentRouteByActivePage(),
        // 切页后需要立即读取当前激活页面的路由，不能复用首次访问时的缓存值。
        cache: false,
      });
      this.flowEngine.context.defineProperty('layoutContentElement', {
        get: () => this.layoutContentElement,
        // 布局容器 ref 会在挂载和卸载时变化，这里必须实时读取。
        cache: false,
      });
      this.routeDisposer = reaction(
        () => this.flowEngine.context.route,
        (route) => {
          this.activePageUid = route?.params?.name || '';
          this.getCoordinator().syncRoute(route || {});
        },
        {
          fireImmediately: true,
        },
      );
    }
  }

  protected onUnmount(): void {
    this.routeDisposer?.();
    this.routeDisposer = undefined;
    this.routeCoordinator?.destroy();
    this.routeCoordinator = undefined;
    this.routePageMetaMap.clear();
    this.activePageUid = '';
    this.layoutContentElement = null;
    super.onUnmount();
  }

  render() {
    return (
      <AdminShellProvider>
        <AdminLayoutShell {...this.props} />
      </AdminShellProvider>
    );
  }
}
