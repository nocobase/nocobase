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
import React from 'react';
import { AdminLayoutContentModel, AdminLayoutHeaderActionsModel } from './AdminLayoutSlotModels';
import { AdminLayoutRouteCoordinator, type RoutePageMeta } from './AdminLayoutRouteCoordinator';

type AdminLayoutStructure = {
  subModels: {
    layoutContent?: AdminLayoutContentModel;
    headerActions?: AdminLayoutHeaderActionsModel;
  };
};

/**
 * Admin Layout 的根模型。
 *
 * 当前阶段先让它稳定托管 Layout 的核心运行时和关键 slot：
 * - `layoutContent`：页面主体区域
 * - `headerActions`：右上角操作区
 *
 * 这样可以在不改页面行为的前提下，把 Layout 渲染逐步收敛到 FlowModel 树中。
 *
 * @example
 * ```typescript
 * const model = flowEngine.getModel<AdminLayoutModel>('admin-layout-model');
 * model?.subModels.layoutContent;
 * ```
 */
export class AdminLayoutModel extends FlowModel<AdminLayoutStructure> {
  private routeCoordinator?: AdminLayoutRouteCoordinator;
  private routeDisposer?: () => void;
  private activePageUid = '';
  private layoutContentElement: HTMLElement | null = null;
  private routePageMetaMap = new Map<string, RoutePageMeta>();

  private getCoordinator() {
    if (!this.routeCoordinator) {
      this.routeCoordinator = new AdminLayoutRouteCoordinator(this.flowEngine);
    }
    return this.routeCoordinator;
  }

  private getCurrentRouteByActivePage() {
    return this.routePageMetaMap.get(this.activePageUid)?.currentRoute || {};
  }

  /**
   * 确保 root model 的关键 slot 始终存在。
   *
   * 这里使用固定 uid，保证复用现有模型实例时也能补齐缺失的子模型，
   * 避免 `AdminLayout` 分阶段重构时出现新旧模型树结构不一致。
   */
  ensureShellSubModels() {
    if (!this.subModels.layoutContent) {
      this.setSubModel('layoutContent', {
        uid: `${this.uid}-layout-content`,
        use: AdminLayoutContentModel,
      });
    }

    if (!this.subModels.headerActions) {
      this.setSubModel('headerActions', {
        uid: `${this.uid}-header-actions`,
        use: AdminLayoutHeaderActionsModel,
      });
    }
  }

  onInit(options) {
    super.onInit(options);
    this.ensureShellSubModels();
  }

  registerRoutePage(pageUid: string, meta: RoutePageMeta) {
    this.routePageMetaMap.set(pageUid, {
      ...meta,
      currentRoute: meta.currentRoute || {},
    });
    return this.getCoordinator().registerPage(pageUid, meta);
  }

  updateRoutePage(pageUid: string, meta: Partial<RoutePageMeta>) {
    const prev = this.routePageMetaMap.get(pageUid) || { active: false, currentRoute: {} };
    const next = {
      ...prev,
      ...meta,
      active: typeof meta.active === 'boolean' ? meta.active : prev.active,
      currentRoute: meta.currentRoute ?? prev.currentRoute ?? {},
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

  setLayoutContentElement(element: HTMLElement | null) {
    this.layoutContentElement = element;
    this.getCoordinator().setLayoutContentElement(element);
  }

  protected onMount(): void {
    super.onMount();
    this.ensureShellSubModels();
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
    return <>{this.props.children}</>;
  }
}
