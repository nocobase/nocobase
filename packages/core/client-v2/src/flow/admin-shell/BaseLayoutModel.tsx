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
import {
  BaseLayoutRouteCoordinator,
  type BaseLayoutRouteCoordinatorOptions,
  type RoutePageMeta,
} from './BaseLayoutRouteCoordinator';
import type { LayoutDefinition } from '../../layout-manager/types';

export type BaseLayoutStructure = {
  subModels?: Record<string, FlowModel[]>;
};

export type GetLayoutModelOptions<TModel extends FlowModel = BaseLayoutModel> = {
  required?: boolean;
  create?: boolean;
  props?: any;
  use?: new (...args: any[]) => TModel;
};

const DEFAULT_LAYOUT_DEFINITION: LayoutDefinition = {
  name: 'admin',
  pathPrefix: '/admin',
  normalizedPathPrefix: 'admin',
  uid: 'admin-layout-model',
  layoutModelClass: 'AdminLayoutModel',
  rootPageModelClass: 'RootPageModel',
  childPageModelClass: 'ChildPageModel',
  authCheck: true,
};

/**
 * 通用 Layout 运行时模型。
 *
 * 该模型封装页面路由桥接、弹窗路由、page tab 路由、布局容器和移动端状态，
 * Admin、Embed 等具体 Layout 只需要继承并实现各自的渲染和专属业务能力。
 */
export class BaseLayoutModel<
  TStructure extends BaseLayoutStructure = BaseLayoutStructure,
> extends FlowModel<TStructure> {
  isMobileLayout = false;
  protected routeCoordinator?: BaseLayoutRouteCoordinator;
  private routeDisposer?: () => void;
  private activePageUid = '';
  private layoutContentElement: HTMLElement | null = null;
  private readonly routePageMetaMap = new Map<string, RoutePageMeta>();
  private contextBindingsActive = false;

  constructor(options: any) {
    super(options);
    define(this, {
      isMobileLayout: observable.ref,
    });
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
    this.getCoordinator().syncPageMeta(pageUid, meta);
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

  setIsMobileLayout(isMobileLayout: boolean) {
    this.isMobileLayout = !!isMobileLayout;
  }

  getCurrentRouteByPageUid(pageUid: string) {
    return this.flowEngine.context.routeRepository?.getRouteBySchemaUid?.(pageUid) || {};
  }

  get layout(): LayoutDefinition {
    return (
      (this.props.layout as LayoutDefinition) || {
        ...DEFAULT_LAYOUT_DEFINITION,
        uid: this.uid || DEFAULT_LAYOUT_DEFINITION.uid,
      }
    );
  }

  getCoordinator() {
    if (!this.routeCoordinator) {
      this.routeCoordinator = this.createRouteCoordinator();
    }
    return this.routeCoordinator;
  }

  protected createRouteCoordinator() {
    return new BaseLayoutRouteCoordinator(this.flowEngine, this.getRouteCoordinatorOptions());
  }

  protected getRouteCoordinatorOptions(): BaseLayoutRouteCoordinatorOptions {
    return {
      layout: this.layout,
    };
  }

  protected getPageUidFromRoute(route: any) {
    return route?.params?.name || '';
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

  private setupContextBindings() {
    this.contextBindingsActive = true;
    this.flowEngine.context.defineProperty('currentRoute', {
      get: () => (this.contextBindingsActive ? this.getCurrentRouteByActivePage() : {}),
      // 切页后需要立即读取当前激活页面的路由，不能复用首次访问时的缓存值。
      cache: false,
    });
    this.flowEngine.context.defineProperty('layoutContentElement', {
      get: () => (this.contextBindingsActive ? this.layoutContentElement : null),
      // 布局容器 ref 会在挂载和卸载时变化，这里必须实时读取。
      cache: false,
    });
    this.flowEngine.context.defineProperty('isMobileLayout', {
      get: () => (this.contextBindingsActive ? this.isMobileLayout : false),
      observable: true,
      cache: false,
    });
    this.flowEngine.context.defineProperty('layout', {
      get: () => (this.contextBindingsActive ? this.layout : undefined),
      cache: false,
    });
  }

  private setupRouteReaction() {
    if (this.routeDisposer) {
      return;
    }

    this.routeDisposer = reaction(
      () => this.flowEngine.context.route,
      (route) => {
        this.activePageUid = this.getPageUidFromRoute(route);
        this.getCoordinator().syncRoute(route || {});
      },
      {
        fireImmediately: true,
      },
    );
  }

  private teardownRuntime() {
    this.contextBindingsActive = false;
    this.routeDisposer?.();
    this.routeDisposer = undefined;
    this.routeCoordinator?.destroy();
    this.routeCoordinator = undefined;
    this.routePageMetaMap.clear();
    this.activePageUid = '';
    this.layoutContentElement = null;
  }

  private getCurrentRouteByActivePage() {
    return this.getCurrentRouteByPageUid(this.activePageUid);
  }
}

/**
 * 按固定 UID 获取或创建 Layout host model。
 */
export function getLayoutModel<TModel extends FlowModel = BaseLayoutModel>(
  flowEngine: FlowEngine,
  uid: string,
  options: GetLayoutModelOptions<TModel> = {},
) {
  const { required = false, create = false, props, use } = options;
  let model = flowEngine.getModel<TModel>(uid);

  if (!model && create) {
    const ModelClass = use as new (...args: any[]) => TModel;
    if (!ModelClass) {
      throw new Error(`[NocoBase] Cannot create layout model ${uid} without model class.`);
    }
    model = flowEngine.createModel<TModel>({
      uid,
      use: ModelClass,
      props,
    });
  }

  if (model && props) {
    model.setProps(props);
  }

  if (!model && required) {
    throw new Error(`[NocoBase] FlowRoute requires layout model ${uid}. Please render FlowRoute under Layout.`);
  }

  return model;
}
