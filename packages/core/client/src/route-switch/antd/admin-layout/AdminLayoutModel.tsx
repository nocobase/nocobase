/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { AdminLayoutComponent, AdminLayoutModel } from '../../../flow/admin-shell/admin-layout';
import { AdminShellProvider } from './AdminShellProvider';

/**
 * 兼容旧 route-switch 入口的 Admin Layout 渲染包装类。
 *
 * 该类仅保留 v1 入口所需的 render 能力，
 * 运行时状态和生命周期全部复用 flow 侧基类。
 *
 * @example
 * ```typescript
 * const model = flowEngine.getModel<AdminLayoutModelV1>('admin-layout-model');
 * return model?.render();
 * ```
 */
export class AdminLayoutModelV1 extends AdminLayoutModel {
  render() {
    return (
      <AdminShellProvider>
        <AdminLayoutComponent {...this.props} />
      </AdminShellProvider>
    );
  }
}
