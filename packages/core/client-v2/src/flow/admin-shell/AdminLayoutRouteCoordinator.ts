/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { FlowEngine } from '@nocobase/flow-engine';
import { BaseLayoutRouteCoordinator, type BaseLayoutRouteCoordinatorOptions } from './BaseLayoutRouteCoordinator';

/**
 * Admin Layout 路由协调器。
 *
 * 该类保留旧导出路径，内部复用通用 BaseLayoutRouteCoordinator。
 */
export class AdminLayoutRouteCoordinator extends BaseLayoutRouteCoordinator {
  constructor(flowEngine: FlowEngine, options: BaseLayoutRouteCoordinatorOptions = {}) {
    super(flowEngine, {
      basePathname: '/admin',
      ...options,
    });
  }
}

export { toViewStack, type BaseLayoutRouteCoordinatorOptions, type RoutePageMeta } from './BaseLayoutRouteCoordinator';
