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
import { getAdminLayoutModel, type AdminLayoutModel } from './admin-layout/AdminLayoutModel';

type UseAdminLayoutRoutePageOptions = {
  flowEngine: FlowEngine;
  pageUid: string;
  refreshDesktopRoutes?: () => Promise<unknown>;
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
  const { flowEngine, pageUid, refreshDesktopRoutes, layoutContentRef } = options;
  const adminLayoutModel = getAdminLayoutModel<AdminLayoutModel>(flowEngine, { required: true });
  const refreshRef = useRef(refreshDesktopRoutes);

  refreshRef.current = refreshDesktopRoutes;

  useEffect(() => {
    adminLayoutModel.registerRoutePage(pageUid, {
      active: false,
      refreshDesktopRoutes: refreshRef.current,
      layoutContentElement: layoutContentRef.current,
    });
    return () => {
      adminLayoutModel.unregisterRoutePage(pageUid);
    };
  }, [adminLayoutModel, pageUid, layoutContentRef]);

  useEffect(() => {
    adminLayoutModel.updateRoutePage(pageUid, {
      refreshDesktopRoutes,
      layoutContentElement: layoutContentRef.current,
    });
  }, [adminLayoutModel, pageUid, refreshDesktopRoutes, layoutContentRef]);

  return adminLayoutModel;
}
