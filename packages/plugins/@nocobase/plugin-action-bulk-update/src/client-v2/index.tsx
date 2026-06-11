/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Plugin } from '@nocobase/client-v2';
import { BulkUpdateActionModel } from './BulkUpdateActionModel';

export class PluginActionBulkUpdateClient extends Plugin {
  async load() {
    // 注册 Flow 模型以支持新版流程引擎按钮动作
    this.app.flowEngine.registerModels({
      BulkUpdateActionModel,
    });
  }
}
export { BulkUpdateActionModel } from './BulkUpdateActionModel';
export default PluginActionBulkUpdateClient;
