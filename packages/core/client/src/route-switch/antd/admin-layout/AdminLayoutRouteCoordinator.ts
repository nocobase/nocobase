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
  FlowModel,
  observable,
  parsePathnameToViewParams,
  ViewNavigation,
  type ViewParam,
} from '@nocobase/flow-engine';
import React from 'react';
import { getViewDiffAndUpdateHidden, getKey } from '../../../flow/getViewDiffAndUpdateHidden';
import { getOpenViewStepParams } from '../../../flow/flows/openViewFlow';
import {
  resolveViewParamsToViewList,
  updateViewListHidden,
  type ViewItem,
} from '../../../flow/resolveViewParamsToViewList';

export interface RoutePageMeta {
  active: boolean;
  currentRoute?: Record<string, any>;
  refreshDesktopRoutes?: () => void;
  layoutContentElement?: HTMLElement | null;
}

interface ViewRuntimeState {
  destroy: (force?: boolean) => void;
  update: (value: any) => void;
  navigation: ViewNavigation;
}

interface RoutePageRuntime {
  pageUid: string;
  routeModel: FlowModel;
  meta: RoutePageMeta;
  viewState: Record<string, ViewRuntimeState>;
  prevViewList: ViewItem[];
  hasStepNavigated: boolean;
  forceStop: boolean;
}

interface RouteLike {
  params?: { name?: string };
  pathname?: string;
}

/**
 * 管理 admin 场景下每个 page 的 v2 视图栈编排。
 * 该协调器只负责状态机和开关视图，不直接绑定 React 生命周期。
 */
export class AdminLayoutRouteCoordinator {
  private readonly flowEngine: FlowEngine;
  private readonly runtimes = new Map<string, RoutePageRuntime>();
  private layoutContentElement: HTMLElement | null = null;

  constructor(flowEngine: FlowEngine) {
    this.flowEngine = flowEngine;
  }

  setLayoutContentElement(element: HTMLElement | null) {
    this.layoutContentElement = element;
  }

  registerPage(pageUid: string, meta: RoutePageMeta) {
    const routeModel = this.getOrCreateRouteModel(pageUid);
    const runtime: RoutePageRuntime = {
      pageUid,
      routeModel,
      meta: {
        active: !!meta.active,
        currentRoute: meta.currentRoute || {},
        refreshDesktopRoutes: meta.refreshDesktopRoutes,
        layoutContentElement: meta.layoutContentElement || null,
      },
      viewState: {},
      prevViewList: [],
      hasStepNavigated: false,
      forceStop: false,
    };

    this.ensureRouteModelContext(runtime);
    this.runtimes.set(pageUid, runtime);
    this.syncPageMeta(pageUid, meta);
    this.syncRoute(this.flowEngine.context.route || {});

    return runtime.routeModel;
  }

  syncPageMeta(pageUid: string, meta: Partial<RoutePageMeta>) {
    const runtime = this.runtimes.get(pageUid);
    if (!runtime) {
      return;
    }

    runtime.meta = {
      ...runtime.meta,
      ...meta,
      active: typeof meta.active === 'boolean' ? meta.active : runtime.meta.active,
      currentRoute: meta.currentRoute ?? runtime.meta.currentRoute ?? {},
      layoutContentElement:
        typeof meta.layoutContentElement === 'undefined'
          ? runtime.meta.layoutContentElement
          : meta.layoutContentElement,
    };

    if (runtime.routeModel.context.pageActive?.value !== runtime.meta.active) {
      runtime.routeModel.context.pageActive.value = runtime.meta.active;
    }
  }

  unregisterPage(pageUid: string) {
    this.cleanupPage(pageUid);
    this.runtimes.delete(pageUid);
  }

  syncRoute(routeLike: RouteLike) {
    const activePageUid = routeLike?.params?.name;
    const pathname = routeLike?.pathname;
    if (!activePageUid || !pathname) {
      return;
    }

    this.runtimes.forEach((runtime) => {
      if (runtime.pageUid !== activePageUid) {
        runtime.forceStop = true;
      }
    });

    const runtime = this.runtimes.get(activePageUid);
    if (!runtime) {
      return;
    }

    runtime.forceStop = false;
    this.syncRuntimeWithPathname(runtime, pathname);
  }

  cleanupPage(pageUid: string) {
    const runtime = this.runtimes.get(pageUid);
    if (!runtime) {
      return;
    }

    runtime.forceStop = true;
    runtime.prevViewList.forEach((viewItem) => {
      this.flowEngine.removeModelWithSubModels(viewItem.params.viewUid);
      runtime.viewState[getKey(viewItem)]?.destroy?.();
      delete runtime.viewState[getKey(viewItem)];
    });
    runtime.prevViewList = [];
    runtime.hasStepNavigated = false;
  }

  destroy() {
    Array.from(this.runtimes.keys()).forEach((pageUid) => {
      this.cleanupPage(pageUid);
      this.runtimes.delete(pageUid);
    });
  }

  private syncRuntimeWithPathname(runtime: RoutePageRuntime, pathname: string) {
    try {
      const viewStack = parsePathnameToViewParams(pathname);
      const viewList = resolveViewParamsToViewList(this.flowEngine, viewStack, runtime.routeModel);

      if (this.shouldStepNavigate(runtime, viewList)) {
        this.stepNavigate(viewList, 0);
        runtime.hasStepNavigated = true;
        return;
      }

      const { viewsToClose, viewsToOpen } = getViewDiffAndUpdateHidden(runtime.prevViewList, viewList);

      if (viewsToClose.length) {
        viewsToClose.forEach((viewItem) => {
          runtime.viewState[getKey(viewItem)]?.destroy?.(true);
          delete runtime.viewState[getKey(viewItem)];
        });
        updateViewListHidden(viewList);
      }

      if (viewsToOpen.length) {
        this.handleOpenViews(runtime, viewList, viewsToOpen);
      }

      if (viewsToClose.length === 0 && viewsToOpen.length === 0) {
        const currentViewItem = viewList.at(-1);
        if (currentViewItem) {
          runtime.viewState[getKey(currentViewItem)]?.navigation.setViewStack(viewList.map((item) => item.params));
        }
      }

      runtime.prevViewList = [...viewList];
    } catch (error) {
      console.error(`[NocoBase] Failed to resolve view params to view list:`, error);
    }
  }

  private shouldStepNavigate(runtime: RoutePageRuntime, viewList: ViewItem[]) {
    return runtime.prevViewList.length === 0 && viewList.length > 1 && !runtime.hasStepNavigated;
  }

  private stepNavigate(viewList: ViewItem[], index: number) {
    if (!viewList[index]) {
      return;
    }

    if (index === 0) {
      new ViewNavigation(this.flowEngine.context, []).navigateTo(viewList[index].params, { replace: true });
    } else {
      new ViewNavigation(
        this.flowEngine.context,
        viewList.slice(0, index).map((item) => item.params),
      ).navigateTo(viewList[index].params);
    }

    this.stepNavigate(viewList, index + 1);
  }

  private async handleOpenViews(runtime: RoutePageRuntime, viewList: ViewItem[], viewsToOpen: ViewItem[]) {
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

    if (runtime.forceStop) {
      return;
    }

    updateViewListHidden(viewList);
    this.openViews(runtime, viewList, viewsToOpen, 0);
  }

  private openViews(runtime: RoutePageRuntime, viewList: ViewItem[], viewsToOpen: ViewItem[], index: number) {
    if (!viewsToOpen[index]) {
      return;
    }

    const viewItem = viewsToOpen[index];
    if (!viewItem.model) {
      return;
    }

    const destroyRef = React.createRef<(result?: any, force?: boolean) => void>();
    const updateRef = React.createRef<(value: any) => void>();
    const openViewParams = getOpenViewStepParams(viewItem.model);
    const openerUids = viewList.slice(0, viewItem.index).map((item) => item.params.viewUid);
    const navigation = new ViewNavigation(
      this.flowEngine.context,
      viewList.slice(0, viewItem.index + 1).map((item) => item.params),
    );

    viewItem.model.dispatchEvent('click', {
      target: runtime.meta.layoutContentElement || this.layoutContentElement,
      collectionName: openViewParams?.collectionName,
      associationName: openViewParams?.associationName,
      dataSourceKey: openViewParams?.dataSourceKey,
      destroyRef,
      updateRef,
      openerUids,
      ...viewItem.params,
      navigation,
      onOpen: () => {
        this.openViews(runtime, viewList, viewsToOpen, index + 1);
      },
      hidden: viewItem.hidden,
      isMobileLayout: !!this.flowEngine.context.isMobileLayout,
      triggerByRouter: true,
    });

    runtime.viewState[getKey(viewItem)] = {
      destroy: (_force?: boolean) => destroyRef.current?.(),
      update: (value: any) => updateRef.current?.(value),
      navigation,
    };
  }

  private ensureRouteModelContext(runtime: RoutePageRuntime) {
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
      get: () => runtime.meta.currentRoute || {},
    });

    runtime.routeModel.context.defineProperty('refreshDesktopRoutes', {
      get: () => runtime.meta.refreshDesktopRoutes,
    });
  }

  private getOrCreateRouteModel(pageUid: string): FlowModel {
    return (
      this.flowEngine.getModel(pageUid) ||
      this.flowEngine.createModel({
        uid: pageUid,
        use: 'RouteModel',
      })
    );
  }
}

/**
 * 将 pathname 解析结果和 pageUid 对齐，便于测试里复用。
 */
export function toViewStack(pathname: string): ViewParam[] {
  return parsePathnameToViewParams(pathname);
}
