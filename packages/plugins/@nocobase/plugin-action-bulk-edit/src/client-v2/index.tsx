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

export class PluginActionBulkEditClient extends Plugin {
  async load() {
    // 先注册 bulkEditTitleField/bulkEditFieldComponent action，再导入 models
    this.app.flowEngine.registerActions({ bulkEditTitleField, bulkEditFieldComponent });
    this.app.flowEngine.registerModelLoaders({
      BulkEditActionModel: {
        extends: 'ActionModel',
        loader: () => import('./flow/models/BulkEditActionModel'),
      },
      BulkEditFormModel: {
        extends: 'CreateFormModel',
        loader: () => import('./flow/models/BulkEditFormModel'),
      },
      BulkEditFormItemModel: {
        extends: 'FormItemModel',
        loader: () => import('./flow/models/BulkEditFormItemModel'),
      },
      BulkEditFieldModel: {
        extends: 'FieldModel',
        loader: () => import('./flow/models/BulkEditFieldModel'),
      },
      BulkEditFormActionGroupModel: {
        extends: 'ActionGroupModel',
        loader: () => import('./flow/models/BulkEditFormActionGroupModel'),
      },
      BulkEditFormSubmitActionModel: {
        extends: 'ActionModel',
        loader: () => import('./flow/models/BulkEditFormSubmitActionModel'),
      },
      BulkEditChildPageTabModel: {
        extends: 'ChildPageTabModel',
        loader: () => import('./flow/models/BulkEditChildPageTabModel'),
      },
      BulkEditBlockGridModel: {
        extends: 'BlockGridModel',
        loader: () => import('./flow/models/BulkEditChildPageTabModel'),
      },
      BulkEditFormGridModel: {
        extends: 'FormGridModel',
        loader: () => import('./flow/models/BulkEditFormGridModel'),
      },
      BulkEditDataBlockModel: {
        extends: 'DataBlockModel',
        loader: () => import('./flow/models/BulkEditDataBlockModel'),
      },
      BulkEditBlockModel: {
        extends: 'BlockModel',
        loader: () => import('./flow/models/BulkEditDataBlockModel'),
      },
    });
  }
}

export default PluginActionBulkEditClient;
