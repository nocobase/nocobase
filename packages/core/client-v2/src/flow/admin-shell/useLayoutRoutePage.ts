/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { FlowEngine } from '@nocobase/flow-engine';
import { useEffect, useRef, type RefObject } from 'react';
import type { BaseLayoutModel } from './BaseLayoutModel';

export type UseLayoutRoutePageOptions<TModel extends BaseLayoutModel = BaseLayoutModel> = {
  flowEngine: FlowEngine;
  pageUid: string;
  active?: boolean;
  refreshDesktopRoutes?: () => Promise<unknown>;
  layoutContentRef: RefObject<HTMLElement>;
  getLayoutModel: (flowEngine: FlowEngine) => TModel | undefined;
};

/**
 * 把 FlowRoute 页面的生命周期桥接到指定 Layout host model。
 */
export function useLayoutRoutePage<TModel extends BaseLayoutModel = BaseLayoutModel>(
  options: UseLayoutRoutePageOptions<TModel>,
) {
  const { flowEngine, pageUid, active, refreshDesktopRoutes, layoutContentRef, getLayoutModel } = options;
  const layoutModel = getLayoutModel(flowEngine);
  const activeRef = useRef(active);
  const refreshRef = useRef(refreshDesktopRoutes);

  if (!layoutModel) {
    throw new Error('[NocoBase] FlowRoute requires layout model. Please render FlowRoute under Layout.');
  }

  activeRef.current = active;
  refreshRef.current = refreshDesktopRoutes;

  useEffect(() => {
    layoutModel.registerRoutePage(pageUid, {
      active: activeRef.current ?? false,
      refreshDesktopRoutes: refreshRef.current,
      layoutContentElement: layoutContentRef.current,
    });
    return () => {
      layoutModel.unregisterRoutePage(pageUid);
    };
  }, [layoutModel, pageUid, layoutContentRef]);

  useEffect(() => {
    layoutModel.updateRoutePage(pageUid, {
      active,
      refreshDesktopRoutes,
      layoutContentElement: layoutContentRef.current,
    });
  }, [active, layoutModel, pageUid, refreshDesktopRoutes, layoutContentRef]);

  return layoutModel;
}
