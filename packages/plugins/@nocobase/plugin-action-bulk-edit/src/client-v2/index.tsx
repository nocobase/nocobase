/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Plugin } from '@nocobase/client-v2';
import { bulkEditTitleField } from './flow/bulkEditTitleField';
import { bulkEditFieldComponent } from './flow/bulkEditFieldComponent';

import * as models from './flow/models';

export class PluginActionBulkEditClient extends Plugin {
  async load() {
    // 先注册 bulkEditTitleField/bulkEditFieldComponent action，再导入 models
    this.app.flowEngine.registerActions({ bulkEditTitleField, bulkEditFieldComponent });
    this.app.flowEngine.registerModels(models);
  }
}

export default PluginActionBulkEditClient;
