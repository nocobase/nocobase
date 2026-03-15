/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import {
  useAllAccessDesktopRoutes,
  useApp,
  useCurrentRoute,
  useDesignable,
  useKeepAlive,
  useMobileLayout,
} from '@nocobase/client';
import { observable, parsePathnameToViewParams, reaction, useFlowEngine, ViewNavigation } from '@nocobase/flow-engine';
import type { FlowModel, ViewParam } from '@nocobase/flow-engine';
import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { deviceType } from 'react-device-detect';

type ViewItem = {
  params: ViewParam;
  modelUid?: string;
  model?: FlowModel;
  hidden: {
    value: boolean;
  };
  index: number;
};

type ViewParams = Omit<ViewParam, 'viewUid'> & { viewUid?: string };

const trimSlash = (value = '') => value.replace(/\/+$/, '');

const splitPathSegments = (value = '') => value.replace(/^\/+/, '').split('/').filter(Boolean);

function stripBasename(pathname: string, basename: string) {
  const normalizedBasename = trimSlash(basename || '');
  if (!normalizedBasename || normalizedBasename === '/') {
    return pathname || '/';
  }

  if (pathname === normalizedBasename) {
    return '/';
  }

  if (pathname.startsWith(`${normalizedBasename}/`)) {
    const next = pathname.slice(normalizedBasename.length);
    return next || '/';
  }

  return pathname || '/';
}

function replacePathSegment(pathname: string, from: string, to: string) {
  const segments = splitPathSegments(pathname);
  const index = segments.indexOf(from);
  if (index === -1) {
    return null;
  }
  segments[index] = to;
  return `/${segments.join('/')}`;
}

function toAdminPathname(pathname: string, embedPrefix: string, adminPrefix: string) {
  if (pathname === embedPrefix || pathname.startsWith(`${embedPrefix}/`)) {
    return `${adminPrefix}${pathname.slice(embedPrefix.length)}`;
  }

  const fallback = replacePathSegment(pathname, 'embed', 'admin');
  if (fallback) {
    return fallback;
  }

  return pathname;
}

function toEmbedPathname(pathname: string, embedPrefix: string, adminPrefix: string) {
  if (pathname === adminPrefix || pathname.startsWith(`${adminPrefix}/`)) {
    return `${embedPrefix}${pathname.slice(adminPrefix.length)}`;
  }

  const fallback = replacePathSegment(pathname, 'admin', 'embed');
  if (fallback) {
    return fallback;
  }

  return pathname;
}

function encodeFilterByTk(val: ViewParam['filterByTk']): string {
  if (val === undefined || val === null) return '';
  if (val && typeof val === 'object' && !Array.isArray(val)) {
    const pairs = Object.entries(val).map(([k, v]) => {
      return `${encodeURIComponent(String(k))}=${encodeURIComponent(String(v))}`;
    });
    return encodeURIComponent(pairs.join('&'));
  }
  return encodeURIComponent(String(val));
}

function generateAdminPathnameFromViewParams(viewParams: ViewParams[], adminPrefix: string): string {
  const prefixSegments = splitPathSegments(adminPrefix || '/admin');
  const baseSegments = prefixSegments.length > 0 ? prefixSegments : ['admin'];

  if (!viewParams || viewParams.length === 0) {
    return '/' + baseSegments.join('/');
  }

  const segments = [...baseSegments];
  viewParams.forEach((viewParam, index) => {
    if (index > 0) {
      segments.push('view');
    }
    segments.push(viewParam.viewUid);
    if (viewParam.tabUid) {
      segments.push('tab', viewParam.tabUid);
    }
    if (viewParam.filterByTk != null) {
      const encoded = encodeFilterByTk(viewParam.filterByTk);
      if (encoded) {
        segments.push('filterbytk', encoded);
      }
    }
    if (viewParam.sourceId) {
      segments.push('sourceid', viewParam.sourceId);
    }
  });

  return '/' + segments.join('/');
}

class EmbedViewNavigation extends ViewNavigation {
  constructor(
    ctx: any,
    viewParams: ViewParams[],
    private readonly rootViewUid: string,
    private readonly embedPrefix: string,
    private readonly adminPrefix: string,
    private readonly fallbackRoot = true,
  ) {
    super(ctx, viewParams);
  }

  private toEmbed(pathname: string) {
    return toEmbedPathname(pathname, this.embedPrefix, this.adminPrefix);
  }

  private getBaseViewStack() {
    const stack = this.viewStack.map((item) => ({ ...item })) as ViewParams[];
    if (!this.fallbackRoot || !this.rootViewUid) {
      return stack;
    }

    if (stack.length === 0) {
      return [{ viewUid: this.rootViewUid }];
    }

    if (stack[0]?.viewUid === this.rootViewUid) {
      return stack;
    }

    return [{ viewUid: this.rootViewUid }, ...stack];
  }

  changeTo(viewParam: ViewParams) {
    const baseStack = this.getBaseViewStack();
    const newViewStack = baseStack.map((item, index) => {
      if (index === baseStack.length - 1) {
        return { ...item, ...viewParam };
      }
      return { ...item };
    });
    const newPathname = this.toEmbed(generateAdminPathnameFromViewParams(newViewStack, this.adminPrefix));
    this.ctx.router.navigate(newPathname, { replace: true });
  }

  navigateTo(viewParam: ViewParams, opts?: { replace?: boolean; state?: any }) {
    const baseStack = this.getBaseViewStack();
    const stackWasCorrupted = this.fallbackRoot && this.viewStack[0]?.viewUid !== this.rootViewUid;
    const shouldReplaceRoot =
      baseStack.length === 1 && baseStack[0]?.viewUid === this.rootViewUid && viewParam?.viewUid === this.rootViewUid;
    const shouldReuseTail =
      stackWasCorrupted && baseStack.length > 0 && baseStack[baseStack.length - 1]?.viewUid === viewParam?.viewUid;
    const nextStack = shouldReuseTail
      ? baseStack
      : shouldReplaceRoot
        ? [{ ...baseStack[0], ...viewParam }]
        : [...baseStack, viewParam];
    const newPathname = this.toEmbed(generateAdminPathnameFromViewParams(nextStack, this.adminPrefix));
    this.ctx.router.navigate(newPathname, opts);
  }

  back() {
    const prevStack = this.getBaseViewStack().slice(0, -1);
    const prevPath = this.toEmbed(generateAdminPathnameFromViewParams(prevStack, this.adminPrefix));
    this.ctx.router.navigate(prevPath, { replace: true });
  }
}

function resolveViewParamsToViewList(flowEngine: any, viewParams: ViewParam[], routeModel: FlowModel): ViewItem[] {
  return viewParams.map((params, index) => {
    let model;
    let modelUid = params.viewUid;

    if (index === 0) {
      model = routeModel;
      modelUid = routeModel.uid;
    } else {
      model = flowEngine.getModel(params.viewUid, true);
    }

    return {
      params,
      modelUid,
      model,
      hidden: observable.ref(false),
      index,
    };
  });
}

function updateViewListHidden(viewItems: ViewItem[]) {
  let hasEmbedAfter = false;
  for (let i = viewItems.length - 1; i >= 0; i--) {
    const viewItem = viewItems[i];
    const isEmbed = viewItem.index === 0;
    const viewType = isEmbed ? 'embed' : viewItem.model?.getStepParams('popupSettings', 'openView')?.mode || 'drawer';

    if (viewType === 'embed' && !hasEmbedAfter) {
      hasEmbedAfter = true;
      viewItem.hidden.value = false;
    } else {
      viewItem.hidden.value = hasEmbedAfter;
    }
  }
}

function stableStringify(value: any): string {
  if (value === null || value === undefined) {
    return '';
  }
  if (typeof value === 'object') {
    if (Array.isArray(value)) {
      return '[' + value.map(stableStringify).join(',') + ']';
    }
    const keys = Object.keys(value).sort();
    return '{' + keys.map((k) => `${k}:${stableStringify(value[k])}`).join(',') + '}';
  }
  return String(value);
}

function getKey(viewItem: ViewItem) {
  const { params, index } = viewItem;
  return [
    stableStringify(params.viewUid),
    stableStringify(params.sourceId),
    stableStringify(params.filterByTk),
    String(index),
  ].join('_');
}

function getViewDiffAndUpdateHidden(prevViewList: ViewItem[], currentViewList: ViewItem[]) {
  const prevViewMap = new Map<string, ViewItem>();
  const currentViewMap = new Map<string, ViewItem>();

  prevViewList.forEach((viewItem) => prevViewMap.set(getKey(viewItem), viewItem));
  currentViewList.forEach((viewItem) => currentViewMap.set(getKey(viewItem), viewItem));

  const viewsToClose: ViewItem[] = [];
  prevViewMap.forEach((prevViewItem, key) => {
    if (!currentViewMap.has(key)) {
      viewsToClose.push(prevViewItem);
    } else {
      currentViewMap.get(key).hidden = prevViewItem.hidden;
    }
  });

  const viewsToOpen: ViewItem[] = [];
  currentViewMap.forEach((viewItem, key) => {
    if (!prevViewMap.has(key)) {
      viewsToOpen.push(viewItem);
    }
  });

  return { viewsToClose, viewsToOpen };
}

function getPathnameForParse(routePathname?: string) {
  if (typeof window !== 'undefined' && typeof window.location?.pathname === 'string' && window.location.pathname) {
    return window.location.pathname;
  }

  return routePathname || '';
}

export const EmbedFlowRoute = () => {
  const layoutContentRef = useRef<HTMLDivElement>(null);
  const flowEngine = useFlowEngine();
  const currentRoute = useCurrentRoute();
  const { refresh } = useAllAccessDesktopRoutes();
  const { isMobileLayout } = useMobileLayout();
  const { designable } = useDesignable();
  const { active } = useKeepAlive();
  const app = useApp();

  const routerBasename = useMemo(() => trimSlash(app.router?.basename || ''), [app]);
  const embedPrefix = useMemo(
    () => trimSlash(stripBasename(app.getRouteUrl('embed') || '/embed', routerBasename) || '/embed'),
    [app, routerBasename],
  );
  const adminPrefix = useMemo(
    () => trimSlash(stripBasename(app.getRouteUrl('admin') || '/admin', routerBasename) || '/admin'),
    [app, routerBasename],
  );

  const pageUidRef = useRef(flowEngine.context.route.params.name);
  const viewStateRef = useRef<
    Record<string, { destroy: (force?: boolean) => void; update: (value: any) => void; navigation: ViewNavigation }>
  >({});
  const prevViewListRef = useRef<ViewItem[]>([]);
  const hasStepNavigatedRef = useRef(false);
  const forceStopRef = useRef(false);

  const createNavigation = useCallback(
    (viewParams: ViewParams[], options?: { fallbackRoot?: boolean }) =>
      new EmbedViewNavigation(
        flowEngine.context,
        viewParams,
        pageUidRef.current,
        embedPrefix,
        adminPrefix,
        options?.fallbackRoot ?? true,
      ),
    [flowEngine, embedPrefix, adminPrefix],
  );

  const routeModel = useMemo(() => {
    return flowEngine.createModel({
      uid: pageUidRef.current,
      use: 'RouteModel',
    });
  }, [flowEngine]);

  useEffect(() => {
    routeModel.context.defineProperty('pageActive', {
      value: observable.ref(false),
      info: {
        description:
          'Whether current page route is active (keep-alive). This is an observable.ref<boolean> (use ctx.pageActive.value to read/write).',
        detail: 'observable.ref<boolean>',
      },
    });
  }, [routeModel]);

  useEffect(() => {
    routeModel.context.pageActive.value = active;
  }, [active, routeModel]);

  useEffect(() => {
    flowEngine.context.defineProperty('isMobileLayout', {
      get: () => isMobileLayout,
      info: {
        description: 'Whether current layout is mobile layout.',
        detail: 'boolean',
      },
    });
    flowEngine.context.defineProperty('deviceType', {
      get: () => (deviceType === 'browser' ? 'computer' : deviceType),
      cache: false,
      meta: {
        type: 'string',
        title: flowEngine.translate('Current device type'),
        interface: 'select',
        uiSchema: {
          enum: [
            { label: flowEngine.translate('Computer'), value: 'computer' },
            { label: flowEngine.translate('Mobile'), value: 'mobile' },
            { label: flowEngine.translate('Tablet'), value: 'tablet' },
            { label: flowEngine.translate('SmartTv'), value: 'smarttv' },
            { label: flowEngine.translate('Console'), value: 'console' },
            { label: flowEngine.translate('Wearable'), value: 'wearable' },
            { label: flowEngine.translate('Embedded'), value: 'embedded' },
          ],
          'x-component': 'Select',
        },
      },
      info: {
        description: 'Current device type (computer/mobile/tablet/...).',
        detail: 'string',
      },
    });
  }, [isMobileLayout, flowEngine]);

  useEffect(() => {
    if (isMobileLayout) {
      flowEngine.flowSettings.disable();
    } else if (designable) {
      flowEngine.flowSettings.enable();
    }
  }, [designable, flowEngine, isMobileLayout]);

  useEffect(() => {
    if (!layoutContentRef.current) {
      return;
    }
    flowEngine.context.defineProperty('layoutContentElement', {
      get: () => layoutContentRef.current,
    });
    routeModel.context.defineProperty('currentRoute', {
      get: () => currentRoute,
    });
    flowEngine.context.defineProperty('currentRoute', {
      get: () => currentRoute,
    });
    routeModel.context.defineProperty('refreshDesktopRoutes', {
      get: () => refresh,
    });
  }, [routeModel, currentRoute, refresh, flowEngine]);

  useEffect(() => {
    const dispose = reaction(
      () => flowEngine.context.route,
      (newRoute) => {
        if (newRoute.params.name !== pageUidRef.current) {
          forceStopRef.current = true;
          return;
        }

        try {
          forceStopRef.current = false;
          const rawPathnameForParse = getPathnameForParse(newRoute?.pathname);
          const pathnameForParse = stripBasename(rawPathnameForParse, routerBasename);
          const pathForParse = toAdminPathname(pathnameForParse, embedPrefix, adminPrefix);
          const viewStack = parsePathnameToViewParams(pathForParse);
          const viewList = resolveViewParamsToViewList(flowEngine, viewStack, routeModel);

          if (prevViewListRef.current.length === 0 && viewList.length > 1 && !hasStepNavigatedRef.current) {
            const navigateTo = (index: number) => {
              if (!viewList[index]) {
                return;
              }

              if (index === 0) {
                createNavigation([], { fallbackRoot: false }).navigateTo(viewList[index].params, { replace: true });
              } else {
                createNavigation(viewList.slice(0, index).map((item) => item.params)).navigateTo(
                  viewList[index].params,
                );
              }

              navigateTo(index + 1);
            };

            navigateTo(0);
            hasStepNavigatedRef.current = true;
            return;
          }

          const { viewsToClose, viewsToOpen } = getViewDiffAndUpdateHidden(prevViewListRef.current, viewList);

          if (viewsToClose.length) {
            viewsToClose.forEach((viewItem) => {
              viewStateRef.current[getKey(viewItem)]?.destroy?.(true);
              delete viewStateRef.current[getKey(viewItem)];
            });
            updateViewListHidden(viewList);
          }

          if (viewsToOpen.length) {
            const handleOpenViews = async () => {
              const missingModels = viewsToOpen.filter((v) => !v.model);
              if (missingModels.length > 0) {
                await Promise.all(
                  missingModels.map(async (viewItem) => {
                    try {
                      viewItem.model = await flowEngine.loadModel({ uid: viewItem.modelUid });
                    } catch (error) {
                      console.error(`[plugin-embed] Failed to load model ${viewItem.modelUid}:`, error);
                    }
                  }),
                );
              }

              if (forceStopRef.current) {
                return;
              }

              updateViewListHidden(viewList);

              const openView = (index: number) => {
                if (!viewsToOpen[index]) {
                  return;
                }

                const viewItem = viewsToOpen[index];
                if (!viewItem.model) {
                  return;
                }

                const destroyRef = React.createRef<(result?: any, force?: boolean) => void>();
                const updateRef = React.createRef<(value: any) => void>();
                const openViewParams = viewItem.model.getStepParams('popupSettings', 'openView') || {};
                const openerUids = viewList.slice(0, viewItem.index).map((item) => item.params.viewUid);
                const navigation = createNavigation(viewList.slice(0, viewItem.index + 1).map((item) => item.params));

                viewItem.model.dispatchEvent('click', {
                  target: layoutContentRef.current,
                  collectionName: openViewParams?.collectionName,
                  associationName: openViewParams?.associationName,
                  dataSourceKey: openViewParams?.dataSourceKey,
                  destroyRef,
                  updateRef,
                  openerUids,
                  ...viewItem.params,
                  navigation,
                  onOpen() {
                    openView(index + 1);
                  },
                  hidden: viewItem.hidden,
                  isMobileLayout,
                  triggerByRouter: true,
                });

                viewStateRef.current[getKey(viewItem)] = {
                  destroy: () => destroyRef.current?.(),
                  update: (value: any) => updateRef.current?.(value),
                  navigation,
                };
              };

              openView(0);
            };

            void handleOpenViews();
          }

          if (viewsToClose.length === 0 && viewsToOpen.length === 0) {
            const currentViewItem = viewList.at(-1);
            if (currentViewItem) {
              viewStateRef.current[getKey(currentViewItem)]?.navigation.setViewStack(
                viewList.map((item) => item.params),
              );
            }
          }

          prevViewListRef.current = [...viewList];
        } catch (error) {
          console.error('[plugin-embed] Failed to resolve view params to view list:', error);
        }
      },
      {
        fireImmediately: true,
      },
    );

    const viewState = viewStateRef.current;

    return () => {
      dispose?.();
      prevViewListRef.current.forEach((viewItem) => {
        flowEngine.removeModelWithSubModels(viewItem.params.viewUid);
        viewState[getKey(viewItem)]?.destroy();
      });
    };
  }, [flowEngine, isMobileLayout, routeModel, embedPrefix, adminPrefix, createNavigation, routerBasename]);

  return <div ref={layoutContentRef} />;
};
