/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { define, observable } from '@formily/reactive';
import {
  decodeOpenViewRouteState,
  parsePathnameToViewParams,
  type FlowEngine,
  FlowModel,
  type ViewParam,
} from '@nocobase/flow-engine';
import {
  BaseLayoutRouteCoordinator,
  type BaseLayoutRouteCoordinatorOptions,
  type RoutePageMeta,
} from './BaseLayoutRouteCoordinator';
import { NocoBaseDesktopRouteType } from '../../flow-compat';
import type { LayoutDefinition } from '../../layout-manager/types';
import { isLayoutContentRouteName } from '../../layout-manager/utils';

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
  routeName: 'admin',
  routePath: '/admin',
  rootRouteName: 'admin',
  uid: 'admin-layout-model',
  layoutModelClass: 'AdminLayoutModel',
  rootPageModelClass: 'RootPageModel',
  childPageModelClass: 'ChildPageModel',
  authCheck: true,
};

export type LayoutRouteMatch =
  | {
      type: 'root';
      pathname: string;
      basePathname: string;
      relativePath: string;
    }
  | {
      type: 'page';
      pathname: string;
      basePathname: string;
      relativePath: string;
      pageUid: string;
      tabUid?: string;
      viewStack: ViewParam[];
    }
  | {
      type: 'notFound';
      pathname: string;
      basePathname: string;
      relativePath: string;
    };

export interface LayoutRouteLike {
  id?: string;
  name?: string;
  pathname?: string;
  params?: Record<string, string | undefined>;
  layoutRouteName?: string;
  layoutBasePathname?: string;
}

const normalizeBasePathname = (basePathname?: string) =>
  `/${(basePathname || '/admin').replace(/^\/+/, '').replace(/\/+$/, '')}`;

const normalizePathname = (pathname?: string) => {
  if (!pathname || pathname === '/') {
    return '/';
  }
  return `/${pathname.replace(/^\/+/, '').replace(/\/+$/, '')}`;
};

const getRelativePath = (pathname: string, basePath: string) => {
  const normalizedPathname = normalizePathname(pathname);
  const normalizedBasePath = normalizeBasePathname(basePath);

  if (normalizedPathname === normalizedBasePath) {
    return '';
  }

  if (normalizedPathname.startsWith(`${normalizedBasePath}/`)) {
    return normalizedPathname.slice(normalizedBasePath.length + 1);
  }

  return null;
};

const getDefaultBasePathnameFromRoutePath = (routePath?: string) => {
  if (routePath?.startsWith('/')) {
    return normalizeBasePathname(routePath);
  }
  return '';
};

const isKnownViewParamName = (segment: string) => ['tab', 'filterbytk', 'sourceid'].includes(segment);

const isLegacyLayoutContentRouteName = (routeName: string, targetRouteName?: string) => {
  return (
    !!targetRouteName &&
    ['page', 'page.tabs', 'page.tabs.popups', 'page.tab', 'page.view', 'page.tab.view'].some(
      (legacyName) => targetRouteName === `${routeName}.${legacyName}`,
    )
  );
};

const isStandardLayoutRelativePath = (relativePath: string) => {
  if (!relativePath) {
    return true;
  }

  const segments = relativePath.split('/').filter(Boolean);
  if (!segments.length) {
    return true;
  }

  let i = 1;
  let currentViewUid = segments[0];
  while (i < segments.length) {
    const segment = segments[i];

    if (segment === 'view') {
      if (!segments[i + 1]) {
        return false;
      }
      currentViewUid = segments[i + 1];
      i += 2;
      continue;
    }

    if (segment === 'opts') {
      if (!segments[i + 1] || !decodeOpenViewRouteState(currentViewUid, segments[i + 1])) {
        return false;
      }
      i += 2;
      continue;
    }

    if (isKnownViewParamName(segment) && segments[i + 1]) {
      i += 2;
      continue;
    }

    if (!segments[i + 1]) {
      return false;
    }
    return false;
  }

  return true;
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
  currentLayoutRoute: LayoutRouteMatch | null = null;
  protected routeCoordinator?: BaseLayoutRouteCoordinator;
  private activePageUid = '';
  private layoutContentElement: HTMLElement | null = null;
  private readonly routePageMetaMap = new Map<string, RoutePageMeta>();
  private contextBindingsActive = false;

  constructor(options: any) {
    super(options);
    define(this, {
      isMobileLayout: observable.ref,
      currentLayoutRoute: observable.ref,
    });
  }

  registerRoutePage(pageUid: string, meta: RoutePageMeta) {
    this.routePageMetaMap.set(pageUid, meta);
    this.restoreCurrentLayoutRouteFromRouterContext(pageUid);
    const routeModel = this.getCoordinator().registerPage(pageUid, meta);
    this.getCoordinator().syncRoute(this.getCurrentCoordinatorRouteLike());
    return routeModel;
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
      layoutContext: this.context,
    };
  }

  protected getPageUidFromRoute(route: any) {
    if (route?.pageUid) {
      return route.pageUid;
    }
    if (route?.layoutRoute?.type === 'page') {
      return route.layoutRoute.pageUid;
    }
    return route?.params?.name || '';
  }

  isLayoutContentRoute(routeLike: LayoutRouteLike) {
    if (routeLike?.layoutRouteName) {
      return routeLike.layoutRouteName === this.layout.routeName;
    }

    const routeName = routeLike?.name || routeLike?.id;
    return isLayoutContentRouteName(this.layout.routeName, routeName);
  }

  resolveLayoutRoute(routeLike: LayoutRouteLike): LayoutRouteMatch {
    const pathname = normalizePathname(routeLike?.pathname);
    const rawBasePathname = routeLike.layoutBasePathname || getDefaultBasePathnameFromRoutePath(this.layout.routePath);
    const basePathname = rawBasePathname ? normalizeBasePathname(rawBasePathname) : '';

    if (!basePathname) {
      return {
        type: 'notFound',
        pathname,
        basePathname: '',
        relativePath: '',
      };
    }

    const relativePath = getRelativePath(pathname, basePathname);

    if (relativePath === null) {
      return {
        type: 'notFound',
        pathname,
        basePathname,
        relativePath: '',
      };
    }

    if (!relativePath) {
      return {
        type: 'root',
        pathname,
        basePathname,
        relativePath,
      };
    }

    if (!isStandardLayoutRelativePath(relativePath)) {
      return {
        type: 'notFound',
        pathname,
        basePathname,
        relativePath,
      };
    }

    const viewStack = parsePathnameToViewParams(pathname, { basePath: basePathname });
    const pageUid = viewStack[0]?.viewUid;

    if (!pageUid) {
      return {
        type: 'notFound',
        pathname,
        basePathname,
        relativePath,
      };
    }

    const routeRepository = this.flowEngine.context.routeRepository;
    const schemaRoute = routeRepository?.getRouteBySchemaUid?.(pageUid);
    const route = schemaRoute ? undefined : routeRepository?.getRouteById?.(pageUid);
    if (!schemaRoute && route?.type === NocoBaseDesktopRouteType.group) {
      return {
        type: 'root',
        pathname,
        basePathname,
        relativePath,
      };
    }

    return {
      type: 'page',
      pathname,
      basePathname,
      relativePath,
      pageUid,
      tabUid: viewStack[0]?.tabUid,
      viewStack,
    };
  }

  getPageUidFromLayoutRoute(match: LayoutRouteMatch | null | undefined) {
    return match?.type === 'page' ? match.pageUid : '';
  }

  syncLayoutRoute(routeLike: LayoutRouteLike) {
    if (!this.isLayoutContentRoute(routeLike)) {
      this.clearLayoutRoute();
      return null;
    }

    const layoutRoute = this.resolveLayoutRoute(routeLike);
    this.currentLayoutRoute = layoutRoute;
    this.activePageUid = this.getPageUidFromLayoutRoute(layoutRoute);
    this.getCoordinator().syncRoute({
      ...routeLike,
      layoutRouteName: this.layout.routeName,
      pageUid: this.activePageUid,
      pathname: layoutRoute.pathname,
      layoutBasePathname: layoutRoute.basePathname,
      layoutRoute,
    });

    return layoutRoute;
  }

  clearLayoutRoute(routeLike?: LayoutRouteLike) {
    const pathname = routeLike?.pathname ? normalizePathname(routeLike.pathname) : '';
    if (pathname && this.currentLayoutRoute?.pathname && pathname !== this.currentLayoutRoute.pathname) {
      return;
    }

    if (this.shouldIgnoreStaleLayoutRouteCleanup(routeLike)) {
      return;
    }

    this.currentLayoutRoute = null;
    this.activePageUid = '';
    this.routeCoordinator?.syncRoute({});
  }

  protected onMount(): void {
    super.onMount();
    this.setupContextBindings();
  }

  protected onUnmount(): void {
    this.teardownRuntime();
    super.onUnmount();
  }

  private setupContextBindings() {
    this.contextBindingsActive = true;
    this.context.defineProperty('layoutContext', {
      get: () => (this.contextBindingsActive ? this.context : undefined),
      cache: false,
    });
    this.context.defineProperty('currentRoute', {
      get: () => (this.contextBindingsActive ? this.getCurrentRouteByActivePage() : {}),
      // 切页后需要立即读取当前激活页面的路由，不能复用首次访问时的缓存值。
      cache: false,
    });
    this.context.defineProperty('layoutContentElement', {
      get: () => (this.contextBindingsActive ? this.layoutContentElement : null),
      // 布局容器 ref 会在挂载和卸载时变化，这里必须实时读取。
      cache: false,
    });
    this.context.defineProperty('isMobileLayout', {
      get: () => (this.contextBindingsActive ? this.isMobileLayout : false),
      observable: true,
      cache: false,
    });
    this.context.defineProperty('layout', {
      get: () => (this.contextBindingsActive ? this.layout : undefined),
      cache: false,
    });
    this.context.defineProperty('layoutRoute', {
      get: () => (this.contextBindingsActive ? this.currentLayoutRoute : undefined),
      observable: true,
      cache: false,
    });
  }

  private teardownRuntime() {
    this.contextBindingsActive = false;
    this.routeCoordinator?.destroy();
    this.routeCoordinator = undefined;
    this.routePageMetaMap.clear();
    this.activePageUid = '';
    this.currentLayoutRoute = null;
    this.layoutContentElement = null;
  }

  private getCurrentRouteByActivePage() {
    if (!this.activePageUid) {
      return {};
    }
    return this.getCurrentRouteByPageUid(this.activePageUid);
  }

  private getCurrentCoordinatorRouteLike() {
    if (this.currentLayoutRoute?.type === 'page') {
      return {
        layoutRouteName: this.layout.routeName,
        pageUid: this.currentLayoutRoute.pageUid,
        pathname: this.currentLayoutRoute.pathname,
        layoutBasePathname: this.currentLayoutRoute.basePathname,
        layoutRoute: this.currentLayoutRoute,
      };
    }
    return {};
  }

  private restoreCurrentLayoutRouteFromRouterContext(pageUid: string) {
    if (this.currentLayoutRoute?.type === 'page') {
      return;
    }

    const routeLike = this.getRouterContextRouteLike();
    if (!routeLike) {
      return;
    }

    if (!this.isRouteLikeOwnedByCurrentLayout(routeLike)) {
      return;
    }

    const layoutRoute = this.resolveLayoutRoute({
      ...routeLike,
      layoutRouteName: routeLike.layoutRouteName || this.layout.routeName,
    });
    if (layoutRoute.type !== 'page' || layoutRoute.pageUid !== pageUid) {
      return;
    }

    this.currentLayoutRoute = layoutRoute;
    this.activePageUid = layoutRoute.pageUid;
  }

  private shouldIgnoreStaleLayoutRouteCleanup(routeLike?: LayoutRouteLike) {
    if (!routeLike?.pathname || this.currentLayoutRoute?.type !== 'page') {
      return false;
    }

    const currentLayoutRoute = this.currentLayoutRoute;
    if (!this.routePageMetaMap.has(currentLayoutRoute.pageUid)) {
      return false;
    }

    const routeLikePathname = normalizePathname(routeLike.pathname);
    if (routeLikePathname !== currentLayoutRoute.pathname) {
      return false;
    }

    const routerRouteLike = this.getRouterContextRouteLike();
    if (!routerRouteLike) {
      return false;
    }

    if (!this.isRouteLikeOwnedByCurrentLayout(routerRouteLike)) {
      return false;
    }

    const routerLayoutRoute = this.resolveLayoutRoute({
      ...routerRouteLike,
      layoutRouteName: routerRouteLike.layoutRouteName || this.layout.routeName,
    });

    return (
      routerLayoutRoute.type === 'page' &&
      routerLayoutRoute.pageUid === currentLayoutRoute.pageUid &&
      routerLayoutRoute.pathname === currentLayoutRoute.pathname
    );
  }

  private getRouterContextRouteLike(): LayoutRouteLike | null {
    const route = this.flowEngine.context.route as LayoutRouteLike | undefined;
    if (!route?.pathname) {
      return null;
    }

    return {
      id: route.id,
      name: route.name || route.id,
      pathname: route.pathname,
      params: route.params,
      layoutRouteName: route.layoutRouteName,
      layoutBasePathname: route.layoutBasePathname,
    };
  }

  private isRouteLikeOwnedByCurrentLayout(routeLike: LayoutRouteLike) {
    if (routeLike.layoutRouteName) {
      return routeLike.layoutRouteName === this.layout.routeName;
    }

    const layoutBasePathname = getDefaultBasePathnameFromRoutePath(this.layout.routePath);
    if (routeLike.layoutBasePathname && layoutBasePathname) {
      return normalizeBasePathname(routeLike.layoutBasePathname) === normalizeBasePathname(layoutBasePathname);
    }

    const routeName = routeLike.name || routeLike.id;
    return this.isLayoutContentRoute(routeLike) || isLegacyLayoutContentRouteName(this.layout.routeName, routeName);
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
