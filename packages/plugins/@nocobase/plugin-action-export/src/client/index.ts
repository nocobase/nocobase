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
import { Plugin, useActionAvailable } from '@nocobase/client';
import { ExportActionModel } from '../client-v2/ExportActionModel';
import { ExportPluginProvider } from './ExportPluginProvider';
import { exportActionSchemaSettings } from './schemaSettings';

export { buildExportFieldOptions } from '../client-v2/buildExportFieldOptions';

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

export { ExportActionModel } from '../client-v2/ExportActionModel';
export default PluginActionExportClient;
