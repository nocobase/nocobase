/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

export * from './ExportActionInitializer';
export * from './ExportDesigner';
export * from './ExportPluginProvider';
export * from './useExportAction';
import { Plugin, useCollection, useActionAvailable } from '@nocobase/client';
import { ExportPluginProvider } from './ExportPluginProvider';
import { exportActionSchemaSettings } from './schemaSettings';
import { ExportActionModel } from './ExportActionModel';

export class PluginActionExportClient extends Plugin {
  async load() {
    this.app.use(ExportPluginProvider);

    const initializerData = {
      title: "{{t('Export')}}",
      Component: 'ExportActionInitializer',
      schema: {
        'x-align': 'right',
        'x-decorator': 'ACLActionProvider',
        'x-acl-action-props': {
          skipScopeCheck: true,
        },
      },
      useVisible: () => useActionAvailable('export'),
    };

    const tableActionInitializers = this.app.schemaInitializerManager.get('table:configureActions');
    tableActionInitializers?.add('enableActions.export', initializerData);
    this.app.schemaInitializerManager.addItem('gantt:configureActions', 'enableActions.export', initializerData);
    this.app.schemaSettingsManager.add(exportActionSchemaSettings);
    this.app.flowEngine.registerModels({
      ExportActionModel,
    });
  }
}

export default PluginActionExportClient;
