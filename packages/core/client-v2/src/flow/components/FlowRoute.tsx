/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useFlowEngine } from '@nocobase/flow-engine';
import React, { useEffect, useRef } from 'react';
import { deviceType } from 'react-device-detect';
import { useAdminLayoutRoutePage } from '../admin-shell/useAdminLayoutRoutePage';

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
const FlowRoute = () => {
  const flowEngine = useFlowEngine();
  const route = flowEngine.context.route || {};
  const routeRepository = flowEngine.context.routeRepository;
  const refreshDesktopRoutes = React.useMemo(
    () => routeRepository?.refreshAccessible.bind(routeRepository),
    [routeRepository],
  );
  const pageUidRef = useRef(route?.params?.name);
  const layoutContentRef = useRef<HTMLDivElement>(null);
  const pageUid = pageUidRef.current;

  if (!pageUid) {
    throw new Error('[NocoBase] FlowRoute requires route.params.name.');
  }

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

  useAdminLayoutRoutePage({
    flowEngine,
    pageUid,
    refreshDesktopRoutes,
    layoutContentRef,
  });

  return <div ref={layoutContentRef} />;
};

FlowRoute.displayName = 'FlowRoute';

export default FlowRoute;
