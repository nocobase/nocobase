/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Plugin, useActionAvailable } from '@nocobase/client';
import * as BulkEditActionSettings from './BulkEditAction.Settings';
import { BulkEditActionDecorator } from './BulkEditActionDecorator';
import { BulkEditActionInitializer } from './BulkEditActionInitializer';
import * as BulkEditBlockInitializers from './BulkEditBlockInitializers';
import * as BulkEditFormActionInitializers from './BulkEditFormActionInitializers';
import * as BulkEditFormItemInitializers from './BulkEditFormItemInitializers';
import { bulkEditFormItemSettings } from './bulkEditFormItemSettings';
import { bulkEditFormBlockSettings } from './BulkEditFormBlockSettings';
import { BulkEditField } from './component/BulkEditField';
import { useCustomizeBulkEditActionProps } from './utils';
import { bulkEditTitleField } from '../client-v2/flow/bulkEditTitleField';
import { bulkEditFieldComponent } from '../client-v2/flow/bulkEditFieldComponent';
import * as models from '../client-v2/flow/models';

const deprecatedBulkEditActionSettings = (BulkEditActionSettings as any).deprecatedBulkEditActionSettings;
const BulkEditBlockInitializers_deprecated = (BulkEditBlockInitializers as any).BulkEditBlockInitializers_deprecated;
const CreateFormBulkEditBlockInitializers = (BulkEditBlockInitializers as any).CreateFormBulkEditBlockInitializers;
const BulkEditFormActionInitializers_deprecated = (BulkEditFormActionInitializers as any)
  .BulkEditFormActionInitializers_deprecated;
const BulkEditFormItemInitializers_deprecated = (BulkEditFormItemInitializers as any)
  .BulkEditFormItemInitializers_deprecated;

const { bulkEditActionSettings, bulkEditFormSubmitActionSettings } = BulkEditActionSettings;
const { bulkEditBlockInitializers } = BulkEditBlockInitializers;
const { bulkEditFormActionInitializers } = BulkEditFormActionInitializers;
const { bulkEditFormItemInitializers } = BulkEditFormItemInitializers;

export class PluginActionBulkEditClient extends Plugin {
  async load() {
    // 先注册 bulkEditTitleField/bulkEditFieldComponent action，再导入 models
    this.app.flowEngine.registerActions({ bulkEditTitleField, bulkEditFieldComponent });
    this.app.flowEngine.registerModels(models);
    this.app.addComponents({ BulkEditField, BulkEditActionDecorator });
    this.app.addScopes({ useCustomizeBulkEditActionProps });
    this.app.schemaSettingsManager.add(bulkEditFormBlockSettings);
    this.app.schemaSettingsManager.add(deprecatedBulkEditActionSettings);
    this.app.schemaSettingsManager.add(bulkEditActionSettings);
    this.app.schemaSettingsManager.add(bulkEditFormSubmitActionSettings);
    this.app.schemaSettingsManager.add(bulkEditFormItemSettings);
    this.app.schemaInitializerManager.add(BulkEditFormItemInitializers_deprecated);
    this.app.schemaInitializerManager.add(bulkEditFormItemInitializers);
    this.app.schemaInitializerManager.add(CreateFormBulkEditBlockInitializers);
    this.app.schemaInitializerManager.add(BulkEditBlockInitializers_deprecated);
    this.app.schemaInitializerManager.add(bulkEditBlockInitializers);
    this.app.schemaInitializerManager.add(BulkEditFormActionInitializers_deprecated);
    this.app.schemaInitializerManager.add(bulkEditFormActionInitializers);

    const initializerData = {
      type: 'item',
      title: '{{t("Bulk edit")}}',
      name: 'bulkEdit',
      Component: BulkEditActionInitializer,
      schema: {
        'x-align': 'right',
        'x-decorator': 'BulkEditActionDecorator',
        'x-action': 'customize:bulkEdit',
        'x-toolbar': 'ActionSchemaToolbar',
        'x-settings': 'actionSettings:bulkEdit',
        'x-acl-action': 'update',
        'x-acl-action-props': {
          skipScopeCheck: true,
        },
      },
      useVisible: () => useActionAvailable('updateMany'),
    };

    this.app.schemaInitializerManager.addItem('table:configureActions', 'customize.bulkEdit', initializerData);
    this.app.schemaInitializerManager.addItem('gantt:configureActions', 'customize.bulkEdit', initializerData);
    this.app.schemaInitializerManager.addItem('map:configureActions', 'customize.bulkEdit', initializerData);
  }
}

export default PluginActionBulkEditClient;
