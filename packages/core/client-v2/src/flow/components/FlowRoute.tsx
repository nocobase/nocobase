/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { type FlowEngine, useFlowEngine } from '@nocobase/flow-engine';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { deviceType } from 'react-device-detect';
import { useParams } from 'react-router-dom';
import { useApp } from '../../hooks/useApp';
import { NocoBaseDesktopRouteType } from '../../flow-compat';
import { resolveAdminRouteRuntimeTarget } from '../admin-shell/admin-layout/resolveAdminRouteRuntimeTarget';
import { getAdminLayoutModel, type AdminLayoutModel } from '../admin-shell/admin-layout/AdminLayoutModel';
import type { BaseLayoutModel } from '../admin-shell/BaseLayoutModel';
import { useLayoutRoutePage } from '../admin-shell/useLayoutRoutePage';
import { AppNotFound } from '../../components';

type FlowRouteGuardState = {
  pending: boolean;
  allowBridge: boolean;
  notFound: boolean;
};

export type LegacyPageBehavior = 'redirect' | 'notFound' | 'bridge';

export type FlowRouteProps = {
  getLayoutModel?: (flowEngine: FlowEngine) => BaseLayoutModel | undefined;
  legacyPageBehavior?: LegacyPageBehavior;
};

const getDefaultAdminLayoutModel = (flowEngine: FlowEngine) =>
  getAdminLayoutModel<AdminLayoutModel>(flowEngine, { required: true });

const BridgeFlowRoute = ({
  pageUid,
  getLayoutModel,
}: {
  pageUid: string;
  getLayoutModel: (flowEngine: FlowEngine) => BaseLayoutModel | undefined;
}) => {
  const flowEngine = useFlowEngine();
  const routeRepository = flowEngine.context.routeRepository;
  const refreshDesktopRoutes = React.useMemo(
    () => routeRepository?.refreshAccessible.bind(routeRepository),
    [routeRepository],
  );
  const layoutContentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
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
  }, [flowEngine]);

  useLayoutRoutePage({
    flowEngine,
    pageUid,
    refreshDesktopRoutes,
    layoutContentRef,
    getLayoutModel,
  });

  return <div ref={layoutContentRef} />;
};

/**
 * 管理后台动态页面路由组件。
 *
 * 负责读取当前路由页面 UID，补充运行时设备变量，
 * 并把页面生命周期桥接到 AdminLayout host model。
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
  const { getLayoutModel = getDefaultAdminLayoutModel, legacyPageBehavior = 'redirect' } = props;
  const flowEngine = useFlowEngine();
  const app = useApp();
  const routeRepository = flowEngine.context.routeRepository;
  const params = useParams();
  const pageUid = params?.name;
  const [guardState, setGuardState] = useState<FlowRouteGuardState>({
    pending: true,
    allowBridge: false,
    notFound: false,
  });
  const replaceTriggeredRef = useRef(false);
  const requestIdRef = useRef(0);

  if (!pageUid) {
    throw new Error('[NocoBase] FlowRoute requires route.params.name.');
  }

  useEffect(() => {
    let active = true;
    const requestId = ++requestIdRef.current;

    const run = async () => {
      setGuardState({ pending: true, allowBridge: false, notFound: false });

      if (!routeRepository?.isAccessibleLoaded?.()) {
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

      const route = routeRepository?.getRouteBySchemaUid?.(pageUid);
      if (!route && legacyPageBehavior === 'notFound') {
        setGuardState({ pending: false, allowBridge: false, notFound: true });
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
            setGuardState({ pending: false, allowBridge: false, notFound: true });
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
  }, [app, legacyPageBehavior, pageUid, routeRepository]);

  const content = useMemo(() => {
    if (guardState.pending) {
      return null;
    }

    if (guardState.notFound) {
      return <AppNotFound />;
    }

    if (!guardState.allowBridge) {
      return null;
    }

    return <BridgeFlowRoute pageUid={pageUid} getLayoutModel={getLayoutModel} />;
  }, [getLayoutModel, guardState.allowBridge, guardState.notFound, guardState.pending, pageUid]);

  return content;
};

FlowRoute.displayName = 'FlowRoute';

export default FlowRoute;
