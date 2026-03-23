/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { FlowEngine } from '@nocobase/flow-engine';
import { useEffect, useRef } from 'react';
import type { AdminLayoutModel } from '../../route-switch/antd/admin-layout/AdminLayoutModel';

type UseAdminLayoutRoutePageOptions = {
  flowEngine: FlowEngine;
  pageUid: string;
  active: boolean;
  currentRoute: Record<string, any>;
  refreshDesktopRoutes?: () => void;
  layoutContentRef: React.RefObject<HTMLDivElement>;
};

/**
 * 把 FlowRoute 页面的生命周期桥接到 AdminLayout host model。
 *
 * 这层桥接只属于 v2 视图路由，因此单独放在 `flow/admin-shell`，
 * 避免后续继续把 v2 运行时逻辑堆回共享 Layout 目录。
 *
 * @param {UseAdminLayoutRoutePageOptions} options 页面桥接所需的运行时参数
 * @returns {AdminLayoutModel} 当前页面依附的 admin-layout host model
 */
export function useAdminLayoutRoutePage(options: UseAdminLayoutRoutePageOptions) {
  const { flowEngine, pageUid, active, currentRoute, refreshDesktopRoutes, layoutContentRef } = options;
  const adminLayoutModel = flowEngine.getModel<AdminLayoutModel>('admin-layout-model');
  const activeRef = useRef(active);
  const currentRouteRef = useRef(currentRoute);
  const refreshRef = useRef(refreshDesktopRoutes);

  activeRef.current = active;
  currentRouteRef.current = currentRoute;
  refreshRef.current = refreshDesktopRoutes;

  if (!adminLayoutModel) {
    throw new Error('[NocoBase] FlowRoute requires admin-layout-model. Please render FlowRoute under AdminLayout.');
  }

  useEffect(() => {
    adminLayoutModel.registerRoutePage(pageUid, {
      active: activeRef.current,
      currentRoute: currentRouteRef.current,
      refreshDesktopRoutes: refreshRef.current,
      layoutContentElement: layoutContentRef.current,
    });
    return () => {
      adminLayoutModel.unregisterRoutePage(pageUid);
    };
  }, [adminLayoutModel, pageUid, layoutContentRef]);

  useEffect(() => {
    adminLayoutModel.updateRoutePage(pageUid, {
      active,
    });
  }, [adminLayoutModel, pageUid, active]);

  useEffect(() => {
    adminLayoutModel.updateRoutePage(pageUid, {
      currentRoute,
      refreshDesktopRoutes,
      layoutContentElement: layoutContentRef.current,
    });
  }, [adminLayoutModel, pageUid, currentRoute, refreshDesktopRoutes, layoutContentRef]);

  return adminLayoutModel;
}
