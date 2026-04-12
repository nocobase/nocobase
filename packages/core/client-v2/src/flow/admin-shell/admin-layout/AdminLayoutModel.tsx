/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { define, observable, reaction } from '@formily/reactive';
import { type FlowEngine, FlowModel } from '@nocobase/flow-engine';
import type { NocoBaseDesktopRoute } from '../../../flow-compat';
import { AdminLayoutRouteCoordinator, type RoutePageMeta } from '../AdminLayoutRouteCoordinator';
import { ADMIN_LAYOUT_MODEL_UID } from './constants';
import { type AdminLayoutMenuItemModel } from './AdminLayoutMenuModels';
import {
  getAdminLayoutMenuInitializerButton,
  reconcileAdminLayoutMenuItems,
  type AdminLayoutMenuRouteOptions,
} from './AdminLayoutMenuUtils';
import { AdminLayoutComponent } from './AdminLayoutComponent';
import React from 'react';
import { TopbarActionModel } from '../../models/topbar/TopbarActionModel';
import { TopbarActionsBar } from './TopbarActionsBar';

export type AdminLayoutStructure = {
  subModels: {
    menuItems?: AdminLayoutMenuItemModel[];
  };
};

type GetAdminLayoutModelOptions<TModel extends FlowModel = AdminLayoutModel> = {
  required?: boolean;
  create?: boolean;
  props?: any;
  use?: new (...args: any[]) => TModel;
};

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
export class AdminLayoutModel extends FlowModel<AdminLayoutStructure> {
  isMobileLayout = false;
  private routeCoordinator?: AdminLayoutRouteCoordinator;
  private routeDisposer?: () => void;
  private activePageUid = '';
  private layoutContentElement: HTMLElement | null = null;
  private readonly routePageMetaMap = new Map<string, RoutePageMeta>();

  constructor(options: any) {
    super(options);
    define(this, {
      isMobileLayout: observable.ref,
    });
  }

  /**
   * 注册页面运行时信息。
   *
   * @param {string} pageUid 页面 UID
   * @param {RoutePageMeta} meta 页面运行时元数据
   * @returns {FlowModel} 对应的页面模型
   */
  registerRoutePage(pageUid: string, meta: RoutePageMeta) {
    this.routePageMetaMap.set(pageUid, meta);
    return this.getCoordinator().registerPage(pageUid, meta);
  }

  /**
   * 更新页面运行时信息。
   *
   * @param {string} pageUid 页面 UID
   * @param {Partial<RoutePageMeta>} meta 待更新的页面元数据
   * @returns {void}
   */
  updateRoutePage(pageUid: string, meta: Partial<RoutePageMeta>) {
    const prev = this.routePageMetaMap.get(pageUid) || { active: false };
    const next = {
      ...prev,
      ...meta,
      active: typeof meta.active === 'boolean' ? meta.active : prev.active,
    };
    this.routePageMetaMap.set(pageUid, next);
    this.getCoordinator().syncPageMeta(pageUid, meta);
  }

  /**
   * 注销页面运行时信息。
   *
   * @param {string} pageUid 页面 UID
   * @returns {void}
   */
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

  /**
   * 设置布局内容容器元素。
   *
   * @param {HTMLElement | null} element 布局内容容器
   * @returns {void}
   */
  setLayoutContentElement(element: HTMLElement | null) {
    this.layoutContentElement = element;
    this.getCoordinator().setLayoutContentElement(element);
  }

  /**
   * 设置是否为移动端布局。
   *
   * @param {boolean} isMobileLayout 是否为移动端布局
   * @returns {void}
   */
  setIsMobileLayout(isMobileLayout: boolean) {
    this.isMobileLayout = !!isMobileLayout;
  }

  protected onMount(): void {
    super.onMount();
    this.setupContextBindings();
    this.setupRouteReaction();
  }

  protected onUnmount(): void {
    this.teardownRuntime();
    super.onUnmount();
  }

  /**
   * 安装运行时上下文属性。
   *
   * @returns {void}
   */
  private setupContextBindings() {
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
    this.flowEngine.context.defineProperty('isMobileLayout', {
      get: () => this.isMobileLayout,
      observable: true,
      cache: false,
    });
  }

  /**
   * 安装路由同步 reaction。
   *
   * @returns {void}
   */
  private setupRouteReaction() {
    if (this.routeDisposer) {
      return;
    }

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

  /**
   * 释放运行时状态。
   *
   * @returns {void}
   */
  private teardownRuntime() {
    this.routeDisposer?.();
    this.routeDisposer = undefined;
    this.routeCoordinator?.destroy();
    this.routeCoordinator = undefined;
    this.routePageMetaMap.clear();
    this.activePageUid = '';
    this.layoutContentElement = null;
  }

  /**
   * 获取当前激活页面对应的路由对象。
   *
   * @returns {any} 当前激活页面对应的路由对象
   */
  private getCurrentRouteByActivePage() {
    return this.getCurrentRouteByPageUid(this.activePageUid);
  }

  /**
   * 根据页面 UID 获取路由对象。
   *
   * @param {string} pageUid 页面 UID
   * @returns {any} 路由对象
   */
  private getCurrentRouteByPageUid(pageUid: string) {
    return this.flowEngine.context.routeRepository?.getRouteBySchemaUid?.(pageUid) || {};
  }

  /**
   * 懒加载页面路由协调器。
   *
   * @returns {AdminLayoutRouteCoordinator} 路由协调器实例
   */
  private getCoordinator() {
    if (!this.routeCoordinator) {
      this.routeCoordinator = new AdminLayoutRouteCoordinator(this.flowEngine);
    }
    return this.routeCoordinator;
  }

  render() {
    return <AdminLayoutComponent {...this.props} />;
  }
}

AdminLayoutModel.registerFlow({
  key: 'topbarAction',
  steps: {
    step1: {
      handler: async (ctx, params) => {
        const topbarActionModels = await ctx.engine.getSubclassesOfAsync('TopbarActionModel');
        const actions = [...topbarActionModels.keys()].map<TopbarActionModel>((name) => {
          return ctx.engine.createModel({
            use: name,
            uid: `topbar-action-${name}`,
          });
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
  const { required = false, create = false, props, use } = options;
  let model = flowEngine.getModel<TModel>(ADMIN_LAYOUT_MODEL_UID);

  if (!model && create) {
    const ModelClass = (use || AdminLayoutModel) as new (...args: any[]) => TModel;
    model = flowEngine.createModel<TModel>({
      uid: ADMIN_LAYOUT_MODEL_UID,
      use: ModelClass,
      props,
    });
  }

  if (model && props) {
    model.setProps(props);
  }

  if (!model && required) {
    throw new Error('[NocoBase] FlowRoute requires admin-layout-model. Please render FlowRoute under AdminLayout.');
  }

  return model;
}
