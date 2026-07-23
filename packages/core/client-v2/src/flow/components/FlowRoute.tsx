/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { type FlowEngine, useFlowContext, useFlowEngine } from '@nocobase/flow-engine';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useApp } from '../../hooks/useApp';
import { NocoBaseDesktopRouteType, type NocoBaseDesktopRoute } from '../../flow-compat';
import {
  resolveAdminRouteRuntimeTarget,
  toRouterNavigationPath,
} from '../admin-shell/admin-layout/resolveAdminRouteRuntimeTarget';
import { getAdminLayoutModel, type AdminLayoutModel } from '../admin-shell/admin-layout/AdminLayoutModel';
import { getLayoutModel, type BaseLayoutModel } from '../admin-shell/BaseLayoutModel';
import { useLayoutRoutePage } from '../admin-shell/useLayoutRoutePage';
import { AppNotFound } from '../../components';
import { useKeepAlive } from '../../components/KeepAlive';
import { registerDeviceTypeContext } from '../internal/registerDeviceTypeContext';

type FlowRouteGuardState = {
  pageUid?: string;
  pending: boolean;
  allowBridge: boolean;
  notFound: boolean;
};

export type LegacyPageBehavior = 'redirect' | 'notFound' | 'bridge';

type FlowRouteLayoutContext = {
  authCheck?: boolean;
  routePath?: string;
  routeName?: string;
  uid?: string;
};

type FlowRouteRepositoryLike = {
  refreshAccessible?: () => Promise<unknown>;
  isAccessibleLoaded?: () => boolean;
  ensureAccessibleLoaded?: () => Promise<unknown>;
  getRouteBySchemaUid?: (schemaUid: string) => NocoBaseDesktopRoute | undefined;
  listAccessible?: () => NocoBaseDesktopRoute[];
};

export type FlowRouteProps = {
  pageUid?: string;
  active?: boolean;
  getLayoutModel?: (flowEngine: FlowEngine) => BaseLayoutModel | undefined;
  legacyPageBehavior?: LegacyPageBehavior;
};

const getDefaultAdminLayoutModel = (flowEngine: FlowEngine) =>
  getAdminLayoutModel<AdminLayoutModel>(flowEngine, { required: true });

const getDefaultLayoutModel = (flowEngine: FlowEngine, contextLayout?: FlowRouteLayoutContext) => {
  const layout = contextLayout || flowEngine.context.layout;

  if (layout?.uid) {
    return getLayoutModel<BaseLayoutModel>(flowEngine, layout.uid, { required: true });
  }

  return getDefaultAdminLayoutModel(flowEngine);
};

const getDefaultLegacyPageBehavior = (
  flowEngine: FlowEngine,
  contextLayout?: FlowRouteLayoutContext,
): LegacyPageBehavior => {
  const layout = contextLayout || flowEngine.context.layout;

  if (layout?.routeName && layout.routeName !== 'admin') {
    return 'notFound';
  }

  return 'redirect';
};

const shouldRequireAccessibleRoute = (contextLayout?: FlowRouteLayoutContext) => contextLayout?.authCheck !== false;

const findAccessibleRouteByIdentity = (
  routes: NocoBaseDesktopRoute[] | undefined,
  pageUid: string,
): NocoBaseDesktopRoute | undefined => {
  if (!Array.isArray(routes)) {
    return undefined;
  }

  for (const route of routes) {
    if (
      (route.type !== NocoBaseDesktopRouteType.group && route.schemaUid === pageUid) ||
      (route.type === NocoBaseDesktopRouteType.group && route.id != null && String(route.id) === pageUid)
    ) {
      return route;
    }

    const matched = findAccessibleRouteByIdentity(route.children, pageUid);
    if (matched) {
      return matched;
    }
  }

  return undefined;
};

const getAccessibleRouteByPageUid = (
  routeRepository: FlowRouteRepositoryLike | undefined,
  pageUid: string,
): NocoBaseDesktopRoute | undefined => {
  const routeBySchemaUid = routeRepository?.getRouteBySchemaUid?.(pageUid);

  if (routeBySchemaUid && routeBySchemaUid.type !== NocoBaseDesktopRouteType.group) {
    return routeBySchemaUid;
  }

  return findAccessibleRouteByIdentity(routeRepository?.listAccessible?.(), pageUid);
};

const hasFlowModel = async (flowEngine: FlowEngine, pageUid: string) => {
  if (flowEngine.getModel(pageUid)) {
    return true;
  }

  const modelData = await flowEngine.modelRepository?.findOne({ uid: pageUid }).catch(() => null);
  if (modelData?.uid) {
    return true;
  }

  const model = await flowEngine.loadModel({ uid: pageUid }).catch(() => null);
  if (model && flowEngine.getModel(pageUid) === model) {
    flowEngine.removeModelWithSubModels(pageUid);
  }
  return !!model;
};

const BridgeFlowRoute = ({
  pageUid,
  active,
  getLayoutModel,
}: {
  pageUid: string;
  active?: boolean;
  getLayoutModel: (flowEngine: FlowEngine) => BaseLayoutModel | undefined;
}) => {
  const flowEngine = useFlowEngine();
  const { active: keepAliveActive } = useKeepAlive();
  const routeRepository = flowEngine.context.routeRepository;
  const refreshDesktopRoutes = React.useMemo(
    () => routeRepository?.refreshAccessible.bind(routeRepository),
    [routeRepository],
  );
  const layoutContentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!flowEngine.context.getPropertyOptions('deviceType')) {
      registerDeviceTypeContext(flowEngine);
    }
  }, [flowEngine]);

  useLayoutRoutePage({
    flowEngine,
    pageUid,
    active: active ?? keepAliveActive,
    refreshDesktopRoutes,
    layoutContentRef,
    getLayoutModel,
  });

  return <div ref={layoutContentRef} />;
};

/**
 * 管理后台动态页面路由组件。
 *
 * 负责读取当前路由页面 UID，并把页面生命周期桥接到 AdminLayout host model。
 * 设备变量通常由 PluginFlowEngine 共享初始化提供；独立渲染时会在挂载后补充注册。
 *
 * @example
 * ```tsx
 * <Route path="/admin/:name" element={<FlowRoute />} />
 * ```
 *
 * @returns {JSX.Element} 当前动态页面的布局挂载节点
 * @throws {Error} 当缺少 `route.params.name` 时抛出异常
 */
const FlowRoute = (props: FlowRouteProps = {}) => {
  const {
    active,
    getLayoutModel: getLayoutModelProp,
    legacyPageBehavior: legacyPageBehaviorProp,
    pageUid: pageUidProp,
  } = props;
  const flowEngine = useFlowEngine();
  const flowContext = useFlowContext<{ layout?: FlowRouteLayoutContext }>();
  const contextLayout = flowContext?.layout;
  const propsLayoutModel = useMemo(() => getLayoutModelProp?.(flowEngine), [flowEngine, getLayoutModelProp]);
  const rawRouteLayout = contextLayout || propsLayoutModel?.layout;
  const routeLayoutUid = rawRouteLayout?.uid;
  const routeLayoutRouteName = rawRouteLayout?.routeName;
  const routeLayoutRoutePath = rawRouteLayout?.routePath;
  const routeLayoutAuthCheck = rawRouteLayout?.authCheck;
  const routeLayout = useMemo(() => {
    if (
      !routeLayoutUid &&
      !routeLayoutRouteName &&
      !routeLayoutRoutePath &&
      typeof routeLayoutAuthCheck === 'undefined'
    ) {
      return undefined;
    }
    return {
      authCheck: routeLayoutAuthCheck,
      routeName: routeLayoutRouteName,
      routePath: routeLayoutRoutePath,
      uid: routeLayoutUid,
    };
  }, [routeLayoutAuthCheck, routeLayoutRouteName, routeLayoutRoutePath, routeLayoutUid]);
  const getLayoutModel = useMemo(
    () => getLayoutModelProp || ((engine: FlowEngine) => getDefaultLayoutModel(engine, routeLayout)),
    [getLayoutModelProp, routeLayout],
  );
  const legacyPageBehavior = legacyPageBehaviorProp || getDefaultLegacyPageBehavior(flowEngine, routeLayout);
  const app = useApp();
  const location = useLocation();
  const navigate = useNavigate();
  const routeRepository = flowEngine.context.routeRepository as FlowRouteRepositoryLike | undefined;
  const params = useParams();
  const pageUid = pageUidProp || params?.name;
  const hasNestedRoutePath = typeof params?.tabUid !== 'undefined' || typeof params?.['*'] !== 'undefined';
  const skipRouteRepositoryCheck = !routeRepository;
  const [guardState, setGuardState] = useState<FlowRouteGuardState>({
    pageUid: undefined,
    pending: true,
    allowBridge: false,
    notFound: false,
  });
  const replaceTriggeredRef = useRef(false);
  const requestIdRef = useRef(0);

  if (!pageUid) {
    throw new Error('[NocoBase] FlowRoute requires pageUid or route.params.name.');
  }

  useEffect(() => {
    replaceTriggeredRef.current = false;
  }, [location.hash, location.pathname, location.search, pageUid]);

  useEffect(() => {
    let active = true;
    const requestId = ++requestIdRef.current;
    const requiresAccessibleRoute = shouldRequireAccessibleRoute(routeLayout);

    const run = async () => {
      setGuardState({ pageUid, pending: true, allowBridge: false, notFound: false });

      if (requiresAccessibleRoute && !skipRouteRepositoryCheck && !routeRepository?.isAccessibleLoaded?.()) {
        try {
          await routeRepository?.ensureAccessibleLoaded?.();
        } catch (_error) {
          if (active && requestId === requestIdRef.current) {
            setGuardState({ pageUid, pending: false, allowBridge: true, notFound: false });
          }
          return;
        }
      }

      if (!active || requestId !== requestIdRef.current) {
        return;
      }

      const route =
        skipRouteRepositoryCheck || !requiresAccessibleRoute
          ? undefined
          : getAccessibleRouteByPageUid(routeRepository, pageUid);
      if (!route && !skipRouteRepositoryCheck && requiresAccessibleRoute) {
        setGuardState({ pageUid, pending: false, allowBridge: false, notFound: true });
        return;
      }

      if (!route && legacyPageBehavior === 'notFound') {
        const flowModelExists = await hasFlowModel(flowEngine, pageUid);
        if (active && requestId === requestIdRef.current) {
          setGuardState({ pageUid, pending: false, allowBridge: flowModelExists, notFound: !flowModelExists });
        }
        return;
      }

      if (route?.type === NocoBaseDesktopRouteType.group) {
        if (hasNestedRoutePath) {
          setGuardState({ pageUid, pending: false, allowBridge: false, notFound: true });
          return;
        }

        const target = resolveAdminRouteRuntimeTarget({
          app,
          route,
          layout: routeLayout,
        });

        if (target.reason === 'emptyGroup') {
          setGuardState({ pageUid, pending: false, allowBridge: false, notFound: false });
          return;
        }

        if (target.runtimePath) {
          if (replaceTriggeredRef.current) {
            setGuardState({ pageUid, pending: false, allowBridge: false, notFound: false });
            return;
          }

          replaceTriggeredRef.current = true;
          if (target.navigationMode === 'document') {
            window.location.replace(target.runtimePath);
            return;
          }
          navigate(toRouterNavigationPath(target.runtimePath, app.router?.getBasename?.()), { replace: true });
          return;
        }

        setGuardState({ pageUid, pending: false, allowBridge: false, notFound: true });
        return;
      }

      if (route?.type === NocoBaseDesktopRouteType.page) {
        if (legacyPageBehavior === 'notFound') {
          setGuardState({ pageUid, pending: false, allowBridge: false, notFound: true });
          return;
        }

        if (legacyPageBehavior === 'bridge') {
          setGuardState({ pageUid, pending: false, allowBridge: true, notFound: false });
          return;
        }

        const target = resolveAdminRouteRuntimeTarget({
          app,
          route,
          location: {
            pathname: window.location.pathname,
            search: window.location.search,
            hash: window.location.hash,
          },
          preserveLocationState: true,
        });

        if (target.navigationMode === 'document' && target.runtimePath && !replaceTriggeredRef.current) {
          replaceTriggeredRef.current = true;
          window.location.replace(target.runtimePath);
          return;
        }

        if (target.reason === 'unsupportedV2Runtime') {
          if (active && requestId === requestIdRef.current) {
            setGuardState({ pageUid, pending: false, allowBridge: false, notFound: true });
          }
          return;
        }
      }

      if (active && requestId === requestIdRef.current) {
        setGuardState({ pageUid, pending: false, allowBridge: true, notFound: false });
      }
    };

    run();

    return () => {
      active = false;
    };
  }, [
    app,
    flowEngine,
    hasNestedRoutePath,
    legacyPageBehavior,
    navigate,
    pageUid,
    routeLayout,
    routeRepository,
    skipRouteRepositoryCheck,
  ]);

  const content = useMemo(() => {
    if (guardState.pageUid !== pageUid || guardState.pending) {
      return null;
    }

    if (guardState.notFound) {
      return <AppNotFound />;
    }

    if (!guardState.allowBridge) {
      return null;
    }

    return <BridgeFlowRoute pageUid={pageUid} active={active} getLayoutModel={getLayoutModel} />;
  }, [
    active,
    getLayoutModel,
    guardState.allowBridge,
    guardState.notFound,
    guardState.pageUid,
    guardState.pending,
    pageUid,
  ]);

  return content;
};

FlowRoute.displayName = 'FlowRoute';

export default FlowRoute;
