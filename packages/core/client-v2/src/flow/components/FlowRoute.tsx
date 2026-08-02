/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { type FlowEngine, useFlowContext, useFlowEngine } from '@nocobase/flow-engine';
import { Button, Result } from 'antd';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useParams } from 'react-router-dom';
import { getModernClientPrefix, stripModernClientPrefix } from '../../authRedirect';
import { useApp } from '../../hooks/useApp';
import { NocoBaseDesktopRouteType } from '../../flow-compat';
import { resolveAdminRouteRuntimeTarget } from '../admin-shell/admin-layout/resolveAdminRouteRuntimeTarget';
import { getAdminLayoutModel, type AdminLayoutModel } from '../admin-shell/admin-layout/AdminLayoutModel';
import { getLayoutModel, type BaseLayoutModel } from '../admin-shell/BaseLayoutModel';
import { useLayoutRoutePage } from '../admin-shell/useLayoutRoutePage';
import { AppNotFound } from '../../components';
import { useKeepAlive } from '../../components/KeepAlive';
import { registerDeviceTypeContext } from '../internal/registerDeviceTypeContext';

type FlowRouteGuardState = {
  pending: boolean;
  allowBridge: boolean;
  notFound: boolean;
  legacyPageUnsupported?: boolean;
};

export type LegacyPageBehavior = 'redirect' | 'notFound' | 'bridge';

export type FlowRouteProps = {
  pageUid?: string;
  active?: boolean;
  getLayoutModel?: (flowEngine: FlowEngine) => BaseLayoutModel | undefined;
  legacyPageBehavior?: LegacyPageBehavior;
};

const getDefaultAdminLayoutModel = (flowEngine: FlowEngine) =>
  getAdminLayoutModel<AdminLayoutModel>(flowEngine, { required: true });

const getDefaultLayoutModel = (flowEngine: FlowEngine, contextLayout?: any) => {
  const layout = contextLayout || flowEngine.context.layout;

  if (layout?.uid) {
    return getLayoutModel<BaseLayoutModel>(flowEngine, layout.uid, { required: true });
  }

  return getDefaultAdminLayoutModel(flowEngine);
};

const getDefaultLegacyPageBehavior = (flowEngine: FlowEngine, contextLayout?: any): LegacyPageBehavior => {
  const layout = contextLayout || flowEngine.context.layout;

  if (layout?.routeName && layout.routeName !== 'admin') {
    return 'notFound';
  }

  return 'redirect';
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

type RouteLocation = {
  pathname: string;
  search: string;
  hash: string;
};

const getLegacyPageHref = (app: { getPublicPath: () => string }, location: RouteLocation) => {
  const modernPublicPath = app.getPublicPath();
  const browserLocationMatchesPublicPath = window.location.pathname.startsWith(modernPublicPath);
  const currentLocation = browserLocationMatchesPublicPath ? window.location : location;
  const pathWithinModernClient = currentLocation.pathname.startsWith(modernPublicPath)
    ? currentLocation.pathname.slice(modernPublicPath.length)
    : currentLocation.pathname.replace(/^\/+/, '');
  return `${stripModernClientPrefix(modernPublicPath)}${pathWithinModernClient}${currentLocation.search}${
    currentLocation.hash
  }`;
};

const LegacyPageUnsupported = ({
  app,
  location,
}: {
  app: { getPublicPath: () => string };
  location: RouteLocation;
}) => {
  const { t } = useTranslation();
  const modernClientPath = `/${getModernClientPrefix()}/`;
  const withModernClientPath = (message: string) => message.replaceAll('{{modernClientPath}}', modernClientPath);

  return (
    <Result
      status="warning"
      title={withModernClientPath(t('This page is not supported in the {{modernClientPath}} branch'))}
      subTitle={withModernClientPath(
        t(
          'The {{modernClientPath}} branch only supports new pages. This page is a legacy page. Please open it from the original entry.',
        ),
      )}
      extra={
        <Button href={getLegacyPageHref(app, location)} type="primary">
          {t('Open from the original entry')}
        </Button>
      }
    />
  );
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
  const flowEngine = useFlowEngine();
  const flowContext = useFlowContext<any>();
  const contextLayout = flowContext?.layout;
  const getLayoutModel = useMemo(
    () => props.getLayoutModel || ((engine: FlowEngine) => getDefaultLayoutModel(engine, contextLayout)),
    [contextLayout, props.getLayoutModel],
  );
  const legacyPageBehavior = props.legacyPageBehavior || getDefaultLegacyPageBehavior(flowEngine, contextLayout);
  const app = useApp();
  const routeRepository = flowEngine.context.routeRepository;
  const location = useLocation();
  const params = useParams();
  const pageUid = props.pageUid || params?.name;
  const skipRouteRepositoryCheck = !routeRepository;
  const [guardState, setGuardState] = useState<FlowRouteGuardState>({
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
    let active = true;
    const requestId = ++requestIdRef.current;

    const run = async () => {
      setGuardState({ pending: true, allowBridge: false, notFound: false });

      if (!skipRouteRepositoryCheck && !routeRepository?.isAccessibleLoaded?.()) {
        try {
          await routeRepository?.ensureAccessibleLoaded?.();
        } catch (_error) {
          if (active && requestId === requestIdRef.current) {
            setGuardState({ pending: false, allowBridge: true, notFound: false });
          }
          return;
        }
      }

      if (!active || requestId !== requestIdRef.current) {
        return;
      }

      const route = skipRouteRepositoryCheck ? undefined : routeRepository?.getRouteBySchemaUid?.(pageUid);
      const shouldCheckFlowModel =
        legacyPageBehavior === 'notFound' || (!skipRouteRepositoryCheck && legacyPageBehavior === 'redirect');
      if (!route && shouldCheckFlowModel) {
        const flowModelExists = await hasFlowModel(flowEngine, pageUid);
        if (active && requestId === requestIdRef.current) {
          setGuardState({ pending: false, allowBridge: flowModelExists, notFound: !flowModelExists });
        }
        return;
      }

      if (route?.type === NocoBaseDesktopRouteType.page) {
        if (legacyPageBehavior === 'notFound') {
          setGuardState({ pending: false, allowBridge: false, notFound: true });
          return;
        }

        if (legacyPageBehavior === 'bridge') {
          setGuardState({ pending: false, allowBridge: true, notFound: false });
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
            setGuardState({ pending: false, allowBridge: false, notFound: false, legacyPageUnsupported: true });
          }
          return;
        }
      }

      if (active && requestId === requestIdRef.current) {
        setGuardState({ pending: false, allowBridge: true, notFound: false });
      }
    };

    void run();

    return () => {
      active = false;
    };
  }, [app, flowEngine, legacyPageBehavior, pageUid, routeRepository, skipRouteRepositoryCheck]);

  const content = useMemo(() => {
    if (guardState.pending) {
      return null;
    }

    if (guardState.notFound) {
      return <AppNotFound />;
    }

    if (guardState.legacyPageUnsupported) {
      return <LegacyPageUnsupported app={app} location={location} />;
    }

    if (!guardState.allowBridge) {
      return null;
    }

    return <BridgeFlowRoute pageUid={pageUid} active={props.active} getLayoutModel={getLayoutModel} />;
  }, [
    app,
    getLayoutModel,
    guardState.allowBridge,
    guardState.legacyPageUnsupported,
    guardState.notFound,
    guardState.pending,
    location,
    pageUid,
    props.active,
  ]);

  return content;
};

FlowRoute.displayName = 'FlowRoute';

export default FlowRoute;
