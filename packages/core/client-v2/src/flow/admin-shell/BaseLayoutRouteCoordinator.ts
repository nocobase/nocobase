/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import {
  FlowEngine,
  type FlowContext,
  FlowModel,
  observable,
  parsePathnameToViewParams,
  ViewNavigation,
  type ViewParam,
} from '@nocobase/flow-engine';
import React from 'react';
import { getViewDiffAndUpdateHidden, getKey } from '../getViewDiffAndUpdateHidden';
import { getOpenViewStepParams } from '../flows/openViewFlow';
import { RouteModel } from '../models/base/RouteModel';
import { resolveViewParamsToViewList, updateViewListHidden, type ViewItem } from '../resolveViewParamsToViewList';
import type { LayoutDefinition } from '../../layout-manager/types';

export interface RoutePageMeta {
  active: boolean;
  refreshDesktopRoutes?: () => Promise<unknown>;
  layoutContentElement?: HTMLElement | null;
}

export interface BaseLayoutRouteCoordinatorOptions {
  layout?: LayoutDefinition;
  layoutContext?: FlowContext;
  basePathname?: string;
}

interface ViewRuntimeState {
  destroy: (force?: boolean) => void;
  update: (value: any) => void;
  activate?: (forceRefresh?: boolean) => void;
  deactivate?: () => void;
  navigation: ViewNavigation;
}

interface RoutePageRuntime {
  pageUid: string;
  routeModel: RouteModel;
  meta: RoutePageMeta;
  viewState: Record<string, ViewRuntimeState>;
  prevViewList: ViewItem[];
  pendingOpenViewKeys: Set<string>;
  hasStepNavigated: boolean;
  currentPathname?: string;
  forceStop: boolean;
  viewGeneration: number;
}

interface RouteLike {
  layoutRouteName?: string;
  params?: { name?: string };
  pathname?: string;
  pageUid?: string;
  layoutBasePathname?: string;
  layoutRoute?: {
    type: string;
    pageUid?: string;
    basePathname?: string;
  } | null;
}

interface SyncRuntimeOptions {
  skipInitialStepNavigation?: boolean;
}

const hasUsableSourceId = (sourceId: unknown) => sourceId !== undefined && sourceId !== null && String(sourceId) !== '';

const normalizeBasePathname = (basePathname?: string) => {
  return `/${(basePathname || '/admin').replace(/^\/+/, '').replace(/\/+$/, '')}`;
};

const getDefaultBasePathnameFromRoutePath = (routePath?: string) => {
  if (routePath?.startsWith('/')) {
    return normalizeBasePathname(routePath);
  }
  return '';
};

/**
 * 通用 Layout 路由协调器。
 *
 * 负责把当前路由路径解析为 v2 view stack，并驱动 RouteModel 上的弹窗、抽屉和 page tab 状态。
 * Admin、Embed 等布局只需要提供当前 Layout 的基准路径，即可复用同一套 view 编排逻辑。
 */
export class BaseLayoutRouteCoordinator {
  protected readonly flowEngine: FlowEngine;
  protected readonly layout: LayoutDefinition | undefined;
  private readonly layoutContext?: FlowContext;
  private basePathname: string;
  private readonly runtimes = new Map<string, RoutePageRuntime>();
  private layoutContentElement: HTMLElement | null = null;
  private lastNonNullLayoutContentElement: HTMLElement | null = null;

  constructor(flowEngine: FlowEngine, options: BaseLayoutRouteCoordinatorOptions = {}) {
    this.flowEngine = flowEngine;
    this.layout = options.layout;
    this.layoutContext = options.layoutContext;
    this.basePathname =
      options.basePathname ||
      getDefaultBasePathnameFromRoutePath(options.layout?.routePath) ||
      (options.layout ? '' : normalizeBasePathname());
  }

  setLayoutContentElement(element: HTMLElement | null) {
    const previousTarget = this.layoutContentElement || this.lastNonNullLayoutContentElement;
    this.layoutContentElement = element;

    if (!element) {
      return;
    }

    const shouldReplayActiveViews = !!previousTarget && previousTarget !== element;
    this.lastNonNullLayoutContentElement = element;

    if (shouldReplayActiveViews) {
      this.replayActiveRuntimeViewsAfterLayoutContentElementChange();
    }
  }

  registerPage(pageUid: string, meta: RoutePageMeta) {
    const routeModel = this.getOrCreateRouteModel(pageUid);
    const runtime: RoutePageRuntime = {
      pageUid,
      routeModel,
      meta: {
        active: !!meta.active,
        refreshDesktopRoutes: meta.refreshDesktopRoutes,
        layoutContentElement: meta.layoutContentElement || null,
      },
      viewState: {},
      prevViewList: [],
      pendingOpenViewKeys: new Set(),
      hasStepNavigated: false,
      forceStop: false,
      viewGeneration: 0,
    };

    this.ensureRouteModelContext(runtime);
    this.runtimes.set(pageUid, runtime);
    this.syncPageMeta(pageUid, meta);

    return runtime.routeModel;
  }

  syncPageMeta(pageUid: string, meta: Partial<RoutePageMeta>) {
    const runtime = this.runtimes.get(pageUid);
    if (!runtime) {
      return;
    }

    const nextActive = typeof meta.active === 'boolean' ? meta.active : undefined;
    runtime.meta = {
      ...runtime.meta,
      ...meta,
      active: runtime.meta.active,
      layoutContentElement: meta.layoutContentElement ?? runtime.meta.layoutContentElement,
    };

    if (typeof nextActive === 'boolean') {
      this.setRuntimeActive(runtime, nextActive);
    }
  }

  unregisterPage(pageUid: string) {
    this.cleanupPage(pageUid);
    this.runtimes.delete(pageUid);
  }

  syncRoute(routeLike: RouteLike) {
    if (routeLike?.layoutRouteName && this.layout?.routeName && routeLike.layoutRouteName !== this.layout.routeName) {
      this.runtimes.forEach((runtime) => {
        this.setRuntimeActive(runtime, false);
      });
      this.invalidatePendingRuntimeViewOpens();
      return;
    }

    const activePageUid = routeLike?.pageUid || routeLike?.layoutRoute?.pageUid || routeLike?.params?.name;
    const pathname = routeLike?.pathname;
    const nextBasePathname = routeLike?.layoutBasePathname || routeLike?.layoutRoute?.basePathname;

    if (nextBasePathname) {
      this.basePathname = normalizeBasePathname(nextBasePathname);
    }

    this.runtimes.forEach((runtime) => {
      this.setRuntimeActive(runtime, runtime.pageUid === activePageUid);
    });

    if (!activePageUid || !pathname) {
      this.invalidatePendingRuntimeViewOpens();
      return;
    }

    this.runtimes.forEach((runtime) => {
      if (runtime.pageUid !== activePageUid) {
        if (!runtime.forceStop) {
          runtime.viewGeneration += 1;
          runtime.pendingOpenViewKeys.clear();
        }
        runtime.forceStop = true;
      }
    });

    const runtime = this.runtimes.get(activePageUid);
    if (!runtime) {
      return;
    }

    runtime.forceStop = false;
    if (runtime.currentPathname && runtime.currentPathname !== pathname) {
      runtime.viewGeneration += 1;
      runtime.pendingOpenViewKeys.clear();
    }
    runtime.currentPathname = pathname;
    this.syncRuntimeWithPathname(runtime, pathname);
  }

  cleanupPage(pageUid: string) {
    const runtime = this.runtimes.get(pageUid);
    if (!runtime) {
      return;
    }

    runtime.forceStop = true;
    runtime.viewGeneration += 1;
    runtime.pendingOpenViewKeys.clear();
    runtime.prevViewList.forEach((viewItem) => {
      this.flowEngine.removeModelWithSubModels(viewItem.params.viewUid);
      runtime.viewState[getKey(viewItem)]?.destroy?.();
      delete runtime.viewState[getKey(viewItem)];
    });
    runtime.prevViewList = [];
    runtime.hasStepNavigated = false;
    runtime.currentPathname = undefined;
  }

  destroy() {
    Array.from(this.runtimes.keys()).forEach((pageUid) => {
      this.cleanupPage(pageUid);
      this.runtimes.delete(pageUid);
    });
  }

  protected getCurrentRouteByPageUid(pageUid: string) {
    return this.flowEngine.context.routeRepository?.getRouteBySchemaUid?.(pageUid) || {};
  }

  private setRuntimeActive(runtime: RoutePageRuntime, active: boolean) {
    const wasActive = !!runtime.meta.active;
    runtime.meta.active = active;
    if (runtime.routeModel.context.pageActive?.value !== active) {
      runtime.routeModel.context.pageActive.value = active;
    }
    this.syncViewListVisibility(runtime);
    if (wasActive === active) {
      return;
    }

    this.notifyRuntimeActiveChange(runtime, active);
  }

  private notifyRuntimeActiveChange(runtime: RoutePageRuntime, active: boolean) {
    const rootViewItem = runtime.prevViewList[0];
    if (!rootViewItem) {
      return;
    }

    const viewState = runtime.viewState[getKey(rootViewItem)];
    if (active) {
      viewState?.activate?.(true);
      return;
    }

    viewState?.deactivate?.();
  }

  private syncRuntimeWithPathname(runtime: RoutePageRuntime, pathname: string, options: SyncRuntimeOptions = {}) {
    try {
      if (!this.basePathname) {
        return;
      }

      const viewStack = parsePathnameToViewParams(pathname, { basePath: this.basePathname });
      const viewList = resolveViewParamsToViewList(this.flowEngine, viewStack, runtime.routeModel);

      if (!options.skipInitialStepNavigation && this.shouldStepNavigate(runtime, viewList)) {
        this.stepNavigate(viewList, 0);
        runtime.hasStepNavigated = true;
        this.scheduleInitialDeepLinkReplay(runtime, pathname);
        return;
      }

      const { viewsToClose, viewsToOpen } = getViewDiffAndUpdateHidden(runtime.prevViewList, viewList);
      const viewsToOpenKeys = new Set(viewsToOpen.map((viewItem) => getKey(viewItem)));
      const nextViewsToOpen = viewList.filter((viewItem) => {
        const key = getKey(viewItem);
        if (runtime.pendingOpenViewKeys.has(key)) {
          return false;
        }
        return viewsToOpenKeys.has(key) || !runtime.viewState[key];
      });

      if (viewsToClose.length) {
        viewsToClose.forEach((viewItem) => {
          runtime.pendingOpenViewKeys.delete(getKey(viewItem));
          runtime.viewState[getKey(viewItem)]?.destroy?.(true);
          delete runtime.viewState[getKey(viewItem)];
        });
        updateViewListHidden(viewList, !!this.layoutContext?.isMobileLayout);
      }

      if (nextViewsToOpen.length) {
        this.markPendingOpenViews(runtime, nextViewsToOpen);
        this.handleOpenViews(runtime, viewList, nextViewsToOpen, runtime.viewGeneration).catch((error) => {
          console.error(`[NocoBase] Failed to open route-managed views:`, error);
        });
      }

      if (viewsToClose.length === 0 && nextViewsToOpen.length === 0) {
        const currentViewItem = viewList.at(-1);
        if (currentViewItem) {
          runtime.viewState[getKey(currentViewItem)]?.navigation.setViewStack(viewList.map((item) => item.params));
        }
      }

      runtime.prevViewList = [...viewList];
      this.syncViewListVisibility(runtime);
    } catch (error) {
      console.error(`[NocoBase] Failed to resolve view params to view list:`, error);
    }
  }

  private syncViewListVisibility(runtime: RoutePageRuntime, viewList = runtime.prevViewList) {
    if (!viewList.length) {
      return;
    }

    if (runtime.meta.active) {
      updateViewListHidden(viewList, !!this.layoutContext?.isMobileLayout);
      return;
    }

    viewList.forEach((viewItem) => {
      viewItem.hidden.value = true;
    });
  }

  private shouldStepNavigate(runtime: RoutePageRuntime, viewList: ViewItem[]) {
    return runtime.prevViewList.length === 0 && viewList.length > 1 && !runtime.hasStepNavigated;
  }

  private scheduleInitialDeepLinkReplay(runtime: RoutePageRuntime, pathname: string) {
    const viewGeneration = runtime.viewGeneration;
    Promise.resolve()
      .then(() => {
        if (
          runtime.forceStop ||
          runtime.viewGeneration !== viewGeneration ||
          runtime.currentPathname !== pathname ||
          runtime.prevViewList.length > 0
        ) {
          return;
        }

        this.syncRuntimeWithPathname(runtime, pathname);
      })
      .catch(() => {
        // ignore
      });
  }

  private stepNavigate(viewList: ViewItem[], index: number) {
    if (!viewList[index]) {
      return;
    }

    if (index === 0) {
      new ViewNavigation(this.flowEngine.context, [], { basePath: this.basePathname }).navigateTo(
        viewList[index].params,
        {
          replace: true,
        },
      );
    } else {
      new ViewNavigation(
        this.flowEngine.context,
        viewList.slice(0, index).map((item) => item.params),
        { basePath: this.basePathname },
      ).navigateTo(viewList[index].params);
    }

    this.stepNavigate(viewList, index + 1);
  }

  private replayActiveRuntimeViewsAfterLayoutContentElementChange() {
    this.runtimes.forEach((runtime) => {
      if (!runtime.currentPathname || runtime.prevViewList.length === 0) {
        return;
      }

      this.resetRuntimeViewStateForLayoutContentElementChange(runtime);
      if (runtime.meta.active) {
        this.syncRuntimeWithPathname(runtime, runtime.currentPathname, { skipInitialStepNavigation: true });
      }
    });
  }

  private invalidatePendingRuntimeViewOpens() {
    this.runtimes.forEach((runtime) => {
      runtime.forceStop = true;
      runtime.viewGeneration += 1;
      runtime.pendingOpenViewKeys.clear();
    });
  }

  private resetRuntimeViewStateForLayoutContentElementChange(runtime: RoutePageRuntime) {
    runtime.viewGeneration += 1;
    runtime.pendingOpenViewKeys.clear();
    runtime.prevViewList.forEach((viewItem, index) => {
      runtime.viewState[getKey(viewItem)]?.destroy?.(true);
      delete runtime.viewState[getKey(viewItem)];

      if (index > 0) {
        this.flowEngine.removeModelWithSubModels(viewItem.params.viewUid);
      }
    });
    runtime.prevViewList = [];
    runtime.hasStepNavigated = false;
  }

  private markPendingOpenViews(runtime: RoutePageRuntime, viewItems: ViewItem[]) {
    viewItems.forEach((viewItem) => {
      runtime.pendingOpenViewKeys.add(getKey(viewItem));
    });
  }

  private clearPendingOpenViews(runtime: RoutePageRuntime, viewItems: ViewItem[]) {
    viewItems.forEach((viewItem) => {
      runtime.pendingOpenViewKeys.delete(getKey(viewItem));
    });
  }

  private async handleOpenViews(
    runtime: RoutePageRuntime,
    viewList: ViewItem[],
    viewsToOpen: ViewItem[],
    viewGeneration: number,
  ) {
    const missingModels = viewsToOpen.filter((v) => !v.model);
    if (missingModels.length > 0) {
      await Promise.all(
        missingModels.map(async (viewItem) => {
          try {
            viewItem.model = await this.flowEngine.loadModel({ uid: viewItem.modelUid });
          } catch (error) {
            console.error(`[NocoBase] Failed to load model ${viewItem.modelUid}:`, error);
          }
        }),
      );
    }

    if (runtime.forceStop || runtime.viewGeneration !== viewGeneration) {
      return;
    }

    this.syncViewListVisibility(runtime, viewList);
    this.openViews(runtime, viewList, viewsToOpen, 0, viewGeneration);
  }

  private openViews(
    runtime: RoutePageRuntime,
    viewList: ViewItem[],
    viewsToOpen: ViewItem[],
    index: number,
    viewGeneration: number,
  ) {
    if (runtime.forceStop || runtime.viewGeneration !== viewGeneration) {
      return;
    }

    if (!viewsToOpen[index]) {
      return;
    }

    const viewItem = viewsToOpen[index];
    if (!viewItem.model) {
      this.clearPendingOpenViews(runtime, viewsToOpen.slice(index));
      return;
    }

    const viewKey = getKey(viewItem);
    const destroyRef = React.createRef<(result?: any, force?: boolean) => void>();
    const updateRef = React.createRef<(value: any) => void>();
    const activateRef = React.createRef<(forceRefresh?: boolean) => void>();
    const deactivateRef = React.createRef<() => void>();
    const openViewParams = getOpenViewStepParams(viewItem.model);
    const associationName =
      openViewParams?.associationName && !hasUsableSourceId(viewItem.params.sourceId)
        ? null
        : openViewParams?.associationName;
    const openViewRouteState = viewItem.params.openViewRouteState;
    const openerUids = viewList.slice(0, viewItem.index).map((item) => item.params.viewUid);
    const navigation = new ViewNavigation(
      this.flowEngine.context,
      viewList.slice(0, viewItem.index + 1).map((item) => item.params),
      { basePath: this.basePathname },
    );

    try {
      viewItem.model.dispatchEvent('click', {
        target: this.layoutContentElement || runtime.meta.layoutContentElement,
        collectionName: openViewParams?.collectionName,
        associationName,
        dataSourceKey: openViewParams?.dataSourceKey,
        destroyRef,
        updateRef,
        activateRef,
        deactivateRef,
        openerUids,
        ...viewItem.params,
        ...(openViewRouteState?.mode ? { mode: openViewRouteState.mode } : {}),
        ...(openViewRouteState?.size ? { size: openViewRouteState.size } : {}),
        pageActive: runtime.meta.active,
        activationControlledByLayout: true,
        navigation,
        onOpen: () => {
          this.openViews(runtime, viewList, viewsToOpen, index + 1, viewGeneration);
        },
        hidden: viewItem.hidden,
        isMobileLayout: !!this.layoutContext?.isMobileLayout,
        triggerByRouter: true,
      });
    } catch (error) {
      this.clearPendingOpenViews(runtime, viewsToOpen.slice(index));
      console.error(`[NocoBase] Failed to dispatch route-managed view open:`, error);
      return;
    }

    runtime.viewState[viewKey] = {
      destroy: (_force?: boolean) => destroyRef.current?.(),
      update: (value: any) => updateRef.current?.(value),
      activate: (forceRefresh?: boolean) => activateRef.current?.(forceRefresh),
      deactivate: () => deactivateRef.current?.(),
      navigation,
    };
    runtime.pendingOpenViewKeys.delete(viewKey);
  }

  private ensureRouteModelContext(runtime: RoutePageRuntime) {
    if (this.layoutContext) {
      runtime.routeModel.context.addDelegate(this.layoutContext);
    }

    if (!runtime.routeModel.context.pageActive) {
      runtime.routeModel.context.defineProperty('pageActive', {
        value: observable.ref(false),
        info: {
          description:
            'Whether current page route is active (keep-alive). This is an observable.ref<boolean> (use ctx.pageActive.value to read/write).',
          detail: 'observable.ref<boolean>',
        },
      });
    }

    runtime.routeModel.context.defineProperty('currentRoute', {
      get: () => this.getCurrentRouteByPageUid(runtime.pageUid),
      // 当前路由来自 routeRepository，菜单更新后必须实时读取最新对象。
      cache: false,
    });

    runtime.routeModel.context.defineProperty('refreshDesktopRoutes', {
      get: () => runtime.meta.refreshDesktopRoutes,
      // refresh 回调来自页面桥接层，切页后也需要读取最新引用。
      cache: false,
    });
    runtime.routeModel.context.defineProperty('layout', {
      get: () => this.layout || this.layoutContext?.layout,
      // RouteModel 是打开根页面的入口，根页面及其内部 schema 需要读取当前 Layout 定义。
      cache: false,
    });
    runtime.routeModel.context.defineProperty('layoutRoute', {
      get: () => this.layoutContext?.layoutRoute,
      cache: false,
    });
    runtime.routeModel.context.defineProperty('layoutContext', {
      get: () => this.layoutContext,
      cache: false,
    });
  }

  private getOrCreateRouteModel(pageUid: string): RouteModel {
    const existing = this.flowEngine.getModel(pageUid);
    if (existing instanceof RouteModel) {
      return existing as RouteModel;
    }

    if (existing) {
      this.flowEngine.removeModelWithSubModels(pageUid);
    }

    return this.flowEngine.createModel({
      uid: pageUid,
      use: 'RouteModel',
    }) as RouteModel;
  }
}

/**
 * 将 pathname 解析结果和 pageUid 对齐，便于测试里复用。
 */
export function toViewStack(pathname: string, options: BaseLayoutRouteCoordinatorOptions = {}): ViewParam[] {
  const basePath = options.basePathname || getDefaultBasePathnameFromRoutePath(options.layout?.routePath);
  if (!basePath) {
    return [];
  }

  return parsePathnameToViewParams(pathname, {
    basePath,
  });
}
