/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { FlowModel } from '@nocobase/flow-engine';
import React from 'react';

/**
 * settings 页面壳使用的最小宿主模型。
 *
 * 该模型只负责承载 `AdminSettingsLayout` 的 React 子树，
 * 不引入 admin-shell 的路由协调或菜单运行时。
 *
 * @example
 * ```typescript
 * const model = flowEngine.createModel({
 *   uid: 'admin-settings-layout-model',
 *   use: AdminSettingsLayoutModel,
 *   props: { children: <div /> },
 * });
 * ```
 */
export class AdminSettingsLayoutModel extends FlowModel {
  render() {
    return <>{this.props.children}</>;
  }
}
